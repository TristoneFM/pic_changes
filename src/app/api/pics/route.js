import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPicCreatedEmail, sendPicApprovalRequestEmail, getEmailFromEmpId } from '@/lib/email';
import prismaEmpleados from '@/lib/prismaEmpleados';

export async function POST(request) {
  try {
    const data = await request.json();

    // Extract data from request
    const {
      areaAfectada,
      plataforma,
      numerosParteAfectados,
      numerosParteTexto,
      temporalDefinitivo,
      tipoTemporal,
      numeroPzasTiempoFecha,
      fechaOriginacion,
      fechaImplementacion,
      operacionesAfectadas,
      motivoRevision,
      pasosProcedimiento,
      documentos,
      validaciones,
      aprobacionesRequeridas,
      disponibilidad,
      motivoCambio,
      createdBy,
    } = data;

    // Helper function to safely parse dates
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return date;
    };

    // Validate required dates
    if (!fechaOriginacion || !fechaImplementacion) {
      return NextResponse.json(
        { success: false, error: 'Origination date and implementation date are required' },
        { status: 400 }
      );
    }

    // Filter out empty procedure steps
    const validPasosProcedimiento = pasosProcedimiento?.filter(
      paso => paso.paso && paso.responsable && paso.fecha
    ) || [];

    // Filter valid documents
    const validDocumentos = documentos.filter(
      doc => doc.tipo && doc.responsable && doc.fecha
    );

    // Filter valid validations
    const validValidaciones = validaciones.filter(
      val => val.validacion && val.responsable && val.fecha
    );

    // Create PIC with all related data using Prisma transaction
    // Safely parse areaAfectada - ensure it's a valid integer
    let affectedAreaValue = null;
    if (areaAfectada && areaAfectada !== '') {
      const parsed = parseInt(areaAfectada);
      // Validate it's a valid number (not NaN)
      if (!isNaN(parsed)) {
        affectedAreaValue = parsed;
      }
    }
    
    // Log for debugging
    console.log('areaAfectada received:', areaAfectada, 'parsed value:', affectedAreaValue);
    
    const pic = await prisma.pic.create({
      data: {
        affectedArea: affectedAreaValue,
        platform: plataforma,
        affectedPartNumbers: numerosParteAfectados,
        partNumbersText: numerosParteTexto || null,
        temporaryPermanent: temporalDefinitivo,
        temporaryType: tipoTemporal || null,
        piecesTimeDateNumber: numeroPzasTiempoFecha || null,
        originationDate: parseDate(fechaOriginacion),
        implementationDate: parseDate(fechaImplementacion),
        affectedOperations: operacionesAfectadas,
        revisionReason: motivoRevision,
        status: 'pending',
        createdBy: createdBy || null,
        
        // Create procedure steps (if any)
        ...(validPasosProcedimiento.length > 0 && {
          procedureSteps: {
            create: validPasosProcedimiento.map((paso, index) => ({
              stepOrder: index + 1,
              stepDescription: paso.paso,
              responsible: paso.responsable,
              date: parseDate(paso.fecha),
            })),
          },
        }),
        
        // Create documents (if any)
        ...(validDocumentos.length > 0 && {
          documents: {
            create: validDocumentos.map((doc) => ({
              documentType: doc.tipo,
              responsible: doc.responsable,
              date: parseDate(doc.fecha),
            })),
          },
        }),
        
        // Create validations (if any)
        ...(validValidaciones.length > 0 && {
          validations: {
            create: validValidaciones.map((val) => ({
              validationDescription: val.validacion,
              responsible: val.responsable,
              date: parseDate(val.fecha),
            })),
          },
        }),
        
        // Create approvals (if any)
        ...(aprobacionesRequeridas && aprobacionesRequeridas.length > 0 && {
          approvals: {
            create: aprobacionesRequeridas.map((aprobador) => ({
              approverId: aprobador.emp_id?.toString() || aprobador.nombre || aprobador.emp_alias || '',
              approvalStatus: 'pending',
            })),
          },
        }),
        
        // Create availability
        availability: {
          create: {
            fixtures: disponibilidad.fixtures,
            testEquipment: disponibilidad.equipoPrueba,
            other: disponibilidad.otros || null,
          },
        },
        
        // Create change reason
        changeReason: {
          create: {
            safety: motivoCambio.seguridad,
            delivery: motivoCambio.entrega,
            productivity: motivoCambio.productividad,
            quality: motivoCambio.calidad,
            cost: motivoCambio.costo,
            process: motivoCambio.proceso,
            other: motivoCambio.otros || null,
          },
        },
      },
      include: {
        procedureSteps: true,
        documents: true,
        validations: true,
        approvals: true,
        availability: true,
        changeReason: true,
      },
    });

    // Send email notifications asynchronously (don't wait for completion)
    (async () => {
      try {
        // Get all empleados to look up email addresses
        const allEmpleados = await prismaEmpleados.$queryRaw`
          SELECT emp_id, emp_alias 
          FROM del_empleados 
          WHERE emp_alias IS NOT NULL AND emp_alias != ''
        `;

        const emailDomain = process.env.EMAIL_DOMAIN || 'tristone.com';
        const emailAddresses = new Set(); // Use Set to avoid duplicates
        const approverEmails = new Set(); // Separate set for approvers
        let creatorName = 'Usuario';

        // 1. Add creator email
        if (createdBy) {
          const creatorEmail = getEmailFromEmpId(createdBy, allEmpleados, emailDomain);
          if (creatorEmail) {
            emailAddresses.add(creatorEmail);
            const creator = allEmpleados.find(emp => emp.emp_id === createdBy);
            if (creator) creatorName = creator.emp_alias;
          }
        }

        // 2. Collect approver emails separately
        if (pic.approvals && pic.approvals.length > 0) {
          pic.approvals.forEach(approval => {
            const approverId = parseInt(approval.approverId);
            if (!isNaN(approverId)) {
              const approverEmail = getEmailFromEmpId(approverId, allEmpleados, emailDomain);
              if (approverEmail) {
                approverEmails.add(approverEmail);
                emailAddresses.add(approverEmail); // Also add to general list
              }
            }
          });
        }

        // 3. Add responsable emails from procedure steps
        if (pic.procedureSteps && pic.procedureSteps.length > 0) {
          pic.procedureSteps.forEach(step => {
            const responsableId = parseInt(step.responsible);
            if (!isNaN(responsableId)) {
              const responsableEmail = getEmailFromEmpId(responsableId, allEmpleados, emailDomain);
              if (responsableEmail) {
                emailAddresses.add(responsableEmail);
              }
            }
          });
        }

        // 4. Add responsable emails from documents
        if (pic.documents && pic.documents.length > 0) {
          pic.documents.forEach(doc => {
            const responsableId = parseInt(doc.responsible);
            if (!isNaN(responsableId)) {
              const responsableEmail = getEmailFromEmpId(responsableId, allEmpleados, emailDomain);
              if (responsableEmail) {
                emailAddresses.add(responsableEmail);
              }
            }
          });
        }

        // 5. Add responsable emails from validations
        if (pic.validations && pic.validations.length > 0) {
          pic.validations.forEach(val => {
            const responsableId = parseInt(val.responsible);
            if (!isNaN(responsableId)) {
              const responsableEmail = getEmailFromEmpId(responsableId, allEmpleados, emailDomain);
              if (responsableEmail) {
                emailAddresses.add(responsableEmail);
              }
            }
          });
        }

        // Send email to creator and responsables
        if (emailAddresses.size > 0) {
          const recipients = Array.from(emailAddresses);
          console.log(`Sending PIC creation email to ${recipients.length} recipients:`, recipients);
          
          sendPicCreatedEmail({
            to: recipients,
            creatorName: creatorName,
            picId: pic.id,
            platform: pic.platform,
            revisionReason: pic.revisionReason,
          }).catch(err => console.error('Error sending PIC creation email:', err));
        } else {
          console.log('No valid email addresses found for PIC notification');
        }

        // Send separate email to approvers
        if (approverEmails.size > 0) {
          const approverRecipients = Array.from(approverEmails);
          console.log(`Sending approval request email to ${approverRecipients.length} approvers:`, approverRecipients);
          
          // Send email to each approver individually with their name
          approverRecipients.forEach(approverEmail => {
            const approver = allEmpleados.find(emp => {
              const empEmail = getEmailFromEmpId(emp.emp_id, allEmpleados, emailDomain);
              return empEmail === approverEmail;
            });
            const approverName = approver?.emp_alias || 'Aprobador';
            
            sendPicApprovalRequestEmail({
              to: approverEmail,
              approverName: approverName,
              picId: pic.id,
              platform: pic.platform,
              revisionReason: pic.revisionReason,
              creatorName: creatorName,
            }).catch(err => console.error('Error sending approval request email:', err));
          });
        } else {
          console.log('No approvers found for approval request email');
        }
      } catch (emailError) {
        // Don't fail PIC creation if email fails
        console.error('Error in email sending process:', emailError);
      }
    })();

    return NextResponse.json(
      { success: true, data: pic },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating PIC:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single PIC by ID
      const pic = await prisma.pic.findUnique({
        where: { id: parseInt(id) },
        include: {
          procedureSteps: true,
          documents: true,
          validations: true,
          approvals: true,
          availability: true,
          changeReason: true,
        },
      });

      if (!pic) {
        return NextResponse.json(
          { success: false, error: 'PIC not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: pic });
    } else {
      // Get all PICs - always order by ID descending
      const pics = await prisma.pic.findMany({
        include: {
          procedureSteps: true,
          documents: true,
          validations: true,
          approvals: true,
          availability: true,
          changeReason: true,
        },
        orderBy: {
          id: 'desc',
        },
      });

      return NextResponse.json({ success: true, data: pics });
    }
  } catch (error) {
    console.error('Error fetching PICs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

