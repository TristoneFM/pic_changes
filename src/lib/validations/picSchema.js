import { z } from 'zod';

// Validation schema for creating a PIC
export const picSchema = z.object({
  // General Information
  areaAfectada: z.string().min(1, 'El área afectada es requerida'),
  plataforma: z.string().min(1, 'La plataforma es requerida'),
  numerosParteAfectados: z.enum(['todos', 'ciertos'], {
    required_error: 'Por favor selecciona una opción',
  }),
  numerosParteTexto: z.string().optional(),
  temporalDefinitivo: z.literal('Temporal'),
  tipoTemporal: z.string().optional(),
  numeroPzasTiempoFecha: z.string().optional(),
  fechaOriginacion: z.string().min(1, 'La fecha de originación es requerida').refine(
    (date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'Formato de fecha inválido' }
  ),
  fechaImplementacion: z.string().min(1, 'La fecha de vencimiento es requerida').refine(
    (date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'Formato de fecha inválido' }
  ),
  operacionesAfectadas: z.string().min(1, 'Las operaciones afectadas son requeridas'),
  motivoRevision: z.string().min(1, 'El motivo de la revisión es requerido'),
  
  // Procedure Steps - at least one step is required
  pasosProcedimiento: z.array(
    z.object({
      paso: z.string().min(1, 'El paso es requerido'),
      responsable: z.string().min(1, 'El responsable es requerido'),
      fecha: z.string().min(1, 'La fecha es requerida').refine(
        (date) => {
          if (!date) return false;
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        { message: 'Formato de fecha inválido' }
      ),
    })
  ).min(1, 'Al menos un paso del procedimiento es requerido'),
  
  // Documents
  documentos: z.array(
    z.object({
      tipo: z.string().min(1, 'El tipo de documento es requerido'),
      responsable: z.string().min(1, 'El responsable es requerido'),
      fecha: z.string().min(1, 'La fecha es requerida').refine(
        (date) => {
          if (!date) return false;
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        { message: 'Formato de fecha inválido' }
      ),
    })
  ).optional(),
  
  // Validations - at least one validation is required
  validaciones: z.array(
    z.object({
      validacion: z.string().min(1, 'La descripción de validación es requerida'),
      responsable: z.string().min(1, 'El responsable es requerido'),
      fecha: z.string().min(1, 'La fecha es requerida').refine(
        (date) => {
          if (!date) return false;
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        { message: 'Formato de fecha inválido' }
      ),
    })
  ).min(1, 'Al menos una validación es requerida'),
  
  // Approvals (required - at least one approver needed)
  aprobacionesRequeridas: z.array(
    z.object({
      emp_id: z.union([z.number(), z.string().transform(val => parseInt(val))]).optional(),
      emp_alias: z.string().optional(),
      // Keep old structure for backward compatibility
      nombre: z.string().optional(),
      puesto: z.string().optional(),
    })
  ).min(1, 'Al menos un aprobador es requerido'),
  
  // Availability
  disponibilidad: z.object({
    fixtures: z.boolean(),
    equipoPrueba: z.boolean(),
    otros: z.string().optional(),
  }),
  
  // Change Reason
  motivoCambio: z.object({
    seguridad: z.boolean(),
    entrega: z.boolean(),
    productividad: z.boolean(),
    calidad: z.boolean(),
    costo: z.boolean(),
    proceso: z.boolean(),
    otros: z.string().optional(),
  }),
});

// Add custom refinement for conditional validation
export const picSchemaRefined = picSchema.refine(
  (data) => {
    // If "ciertos" is selected, numerosParteTexto must be provided
    if (data.numerosParteAfectados === 'ciertos' && !data.numerosParteTexto) {
      return false;
    }
    return true;
  },
  {
    message: 'Por favor ingrese los números de parte',
    path: ['numerosParteTexto'],
  }
).refine(
  (data) => {
    // If Temporal is selected, tipoTemporal and numeroPzasTiempoFecha must be provided
    if (data.temporalDefinitivo === 'Temporal') {
      if (!data.tipoTemporal || !data.numeroPzasTiempoFecha) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'El tipo y número son requeridos para PICs temporales',
    path: ['tipoTemporal'],
  }
).refine(
  (data) => {
    // At least one availability option must be selected
    const hasAvailability = data.disponibilidad.fixtures || 
                           data.disponibilidad.equipoPrueba || 
                           (data.disponibilidad.otros && data.disponibilidad.otros.trim().length > 0);
    return hasAvailability;
  },
  {
    message: 'Debe seleccionar al menos una opción de disponibilidad o especificar otra',
    path: ['disponibilidad'],
  }
).refine(
  (data) => {
    // At least one change reason option must be selected
    const hasChangeReason = data.motivoCambio.seguridad ||
                           data.motivoCambio.entrega ||
                           data.motivoCambio.productividad ||
                           data.motivoCambio.calidad ||
                           data.motivoCambio.costo ||
                           data.motivoCambio.proceso ||
                           (data.motivoCambio.otros && data.motivoCambio.otros.trim().length > 0);
    return hasChangeReason;
  },
  {
    message: 'Debe seleccionar al menos un motivo de cambio o especificar otro',
    path: ['motivoCambio'],
  }
);

