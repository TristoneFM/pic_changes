import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGetEmpleados } from '@/hooks/usePics';

export default function ValidationStep({
  validations,
  handleAddValidation,
  handleRemoveValidation,
  handleValidationChange,
}) {
  const { data: empleados = [], isLoading: isLoadingEmpleados } = useGetEmpleados();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Validación
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddValidation}
          size="small"
        >
          Agregar Validación
        </Button>
      </Box>

      {validations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">
            Se requiere al menos una validación. Haga clic en "Agregar Validación" para agregar una.
          </Typography>
        </Box>
      ) : (
        validations.map((validation, index) => (
          <Box key={index} sx={{ mb: 3, pb: 3, borderBottom: index < validations.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Validación {index + 1}
              </Typography>
              <IconButton 
                color="error" 
                onClick={() => handleRemoveValidation(index)} 
                size="small"
                disabled={validations.length === 1}
                title={validations.length === 1 ? 'Se requiere al menos una validación' : 'Eliminar validación'}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Validación"
                value={validation.validacion}
                onChange={handleValidationChange(index, 'validacion')}
                required
                multiline
                rows={2}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Responsable"
                  value={validation.responsable || ''}
                  onChange={handleValidationChange(index, 'responsable')}
                  required
                  disabled={isLoadingEmpleados}
                  sx={{ flex: 1 }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  {isLoadingEmpleados ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    (() => {
                      // Check if current value exists in empleados
                      const currentValue = String(validation.responsable || '');
                      const valueExists = empleados.some(emp => String(emp.emp_id) === currentValue);
                      
                      if (currentValue && !valueExists) {
                        console.warn('Validation responsable value not found in empleados:', currentValue, 'Available IDs:', empleados.map(e => String(e.emp_id)));
                      }
                      
                      return [
                        <MenuItem key="placeholder" value="" disabled>
                          Seleccionar responsable
                        </MenuItem>,
                        ...empleados.map((empleado) => {
                          const empIdStr = String(empleado.emp_id);
                          if (validation.responsable === empIdStr) {
                            console.log('✅ Matched validation responsable:', empIdStr, 'with alias:', empleado.emp_alias);
                          }
                          return (
                            <MenuItem key={empleado.emp_id} value={empIdStr}>
                              {empleado.emp_alias}
                            </MenuItem>
                          );
                        })
                      ];
                    })()
                  )}
                </TextField>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  value={validation.fecha}
                  onChange={handleValidationChange(index, 'fecha')}
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

