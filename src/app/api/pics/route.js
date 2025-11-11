import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPicCreatedEmail, constructEmailFromUsername } from '@/lib/email';
import prismaEmpleados from '@/lib/prismaEmpleados';

export async function POST(request) {
  try {
    const data = await request.json();

    // Extract data from request
    const {
      //areaAfectada,
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
    // Note: affectedArea field needs to be added to database schema
    const pic = await prisma.pic.create({
      data: {
        platform: plataforma,
        // affectedArea: areaAfectada, // TODO: Add this field to database schema
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

    // Send email notification to the creator
    if (createdBy) {
      try {
        // Get creator's username/alias from database
        const empleado = await prismaEmpleados.$queryRaw`
          SELECT emp_alias 
          FROM del_empleados 
          WHERE emp_id = ${createdBy}
          LIMIT 1
        `;

        if (empleado && empleado.length > 0) {
          const empAlias = empleado[0].emp_alias;
          const emailDomain = process.env.EMAIL_DOMAIN;
          
          // Construct email using username and domain
          if (emailDomain && empAlias) {
            const creatorEmail = constructEmailFromUsername(empAlias, emailDomain);
            
            await sendPicCreatedEmail({
              to: creatorEmail,
              creatorName: empAlias,
              picId: pic.id,
              platform: pic.platform,
              revisionReason: pic.revisionReason,
            });
          } else {
            console.log(`EMAIL_DOMAIN not configured or emp_alias not found for emp_id: ${createdBy}`);
          }
        } else {
          console.log(`Employee not found for emp_id: ${createdBy}`);
        }
      } catch (emailError) {
        // Don't fail PIC creation if email fails
        console.error('Error sending PIC creation email:', emailError);
      }
    }

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

