import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to extract ID from params (handles Next.js 13-15+)
async function getPicId(params, request) {
  let id;
  if (params && typeof params.then === 'function') {
    const resolvedParams = await params;
    id = resolvedParams?.id;
  } else if (params && typeof params === 'object') {
    id = params.id;
  } else {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    id = pathParts[pathParts.indexOf('pics') + 1];
  }
  return id ? parseInt(id) : null;
}

export async function PATCH(request, { params }) {
  try {
    const picId = await getPicId(params, request);
    if (!picId || isNaN(picId)) {
      return NextResponse.json(
        { success: false, error: 'PIC ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
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
    } = data;

    // Check if PIC exists
    const existingPic = await prisma.pic.findUnique({
      where: { id: picId },
      include: {
        procedureSteps: true,
        documents: true,
        validations: true,
        approvals: true,
        availability: true,
        changeReason: true,
      },
    });

    if (!existingPic) {
      return NextResponse.json(
        { success: false, error: 'PIC not found' },
        { status: 404 }
      );
    }

    // Only allow editing of rejected PICs
    if (existingPic.status?.toLowerCase() !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar PICs rechazados' },
        { status: 400 }
      );
    }

    // Helper function to safely parse dates
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date;
    };

    // Filter valid data
    const validPasosProcedimiento = pasosProcedimiento?.filter(
      paso => paso.paso && paso.responsable && paso.fecha
    ) || [];

    const validDocumentos = documentos?.filter(
      doc => doc.tipo && doc.responsable && doc.fecha
    ) || [];

    const validValidaciones = validaciones?.filter(
      val => val.validacion && val.responsable && val.fecha
    ) || [];

    // Update PIC using transaction to handle related data
    const updatedPic = await prisma.$transaction(async (tx) => {
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
      
      // Update main PIC record
      const pic = await tx.pic.update({
        where: { id: picId },
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
          status: 'pending', // Reset to pending when edited
        },
      });

      // Delete existing related records
      await Promise.all([
        tx.picProcedureStep.deleteMany({ where: { picId } }),
        tx.picDocument.deleteMany({ where: { picId } }),
        tx.picValidation.deleteMany({ where: { picId } }),
        tx.picApproval.deleteMany({ where: { picId } }),
        tx.picAvailability.deleteMany({ where: { picId } }),
        tx.picChangeReason.deleteMany({ where: { picId } }),
      ]);

      // Create new related records
      if (validPasosProcedimiento.length > 0) {
        await tx.picProcedureStep.createMany({
          data: validPasosProcedimiento.map((paso, index) => ({
            picId,
            stepOrder: index + 1,
            stepDescription: paso.paso,
            responsible: paso.responsable,
            date: parseDate(paso.fecha),
          })),
        });
      }

      if (validDocumentos.length > 0) {
        await tx.picDocument.createMany({
          data: validDocumentos.map((doc) => ({
            picId,
            documentType: doc.tipo,
            responsible: doc.responsable,
            date: parseDate(doc.fecha),
          })),
        });
      }

      if (validValidaciones.length > 0) {
        await tx.picValidation.createMany({
          data: validValidaciones.map((val) => ({
            picId,
            validationDescription: val.validacion,
            responsible: val.responsable,
            date: parseDate(val.fecha),
          })),
        });
      }

      if (aprobacionesRequeridas && aprobacionesRequeridas.length > 0) {
        await tx.picApproval.createMany({
          data: aprobacionesRequeridas.map((aprobador) => ({
            picId,
            approverId: aprobador.emp_id?.toString() || aprobador.nombre || aprobador.emp_alias || '',
            approvalStatus: 'pending',
          })),
        });
      }

      await tx.picAvailability.create({
        data: {
          picId,
          fixtures: disponibilidad?.fixtures || false,
          testEquipment: disponibilidad?.equipoPrueba || false,
          other: disponibilidad?.otros || null,
        },
      });

      await tx.picChangeReason.create({
        data: {
          picId,
          safety: motivoCambio?.seguridad || false,
          delivery: motivoCambio?.entrega || false,
          productivity: motivoCambio?.productividad || false,
          quality: motivoCambio?.calidad || false,
          cost: motivoCambio?.costo || false,
          process: motivoCambio?.proceso || false,
          other: motivoCambio?.otros || null,
        },
      });

      // Return updated PIC with all relations
      return await tx.pic.findUnique({
        where: { id: picId },
        include: {
          procedureSteps: true,
          documents: true,
          validations: true,
          approvals: true,
          availability: true,
          changeReason: true,
        },
      });
    });

    return NextResponse.json(
      { success: true, data: updatedPic },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating PIC:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const picId = await getPicId(params, request);
    if (!picId || isNaN(picId)) {
      return NextResponse.json(
        { success: false, error: 'PIC ID is required' },
        { status: 400 }
      );
    }

    // Check if PIC exists
    const pic = await prisma.pic.findUnique({
      where: { id: picId },
    });

    if (!pic) {
      return NextResponse.json(
        { success: false, error: 'PIC not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of rejected PICs
    if (pic.status?.toLowerCase() !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden eliminar PICs rechazados' },
        { status: 400 }
      );
    }

    // Delete the PIC (cascade delete will handle related records)
    await prisma.pic.delete({
      where: { id: picId },
    });

    return NextResponse.json({
      success: true,
      message: 'PIC eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting PIC:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

