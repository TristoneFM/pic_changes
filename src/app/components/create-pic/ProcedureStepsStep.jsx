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

export default function ProcedureStepsStep({
  procedureSteps,
  handleAddStep,
  handleRemoveStep,
  handleStepChange,
}) {
  const { data: empleados = [], isLoading: isLoadingEmpleados } = useGetEmpleados();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Pasos del Procedimiento
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStep}
          size="small"
        >
          Agregar Paso
        </Button>
      </Box>

      {procedureSteps.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">
            Se requiere al menos un paso del procedimiento. Haga clic en "Agregar Paso" para agregar uno.
          </Typography>
        </Box>
      ) : (
        procedureSteps.map((step, index) => (
        <Box key={index} sx={{ mb: 3, pb: 3, borderBottom: index < procedureSteps.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Paso {index + 1}
            </Typography>
            <IconButton 
              color="error" 
              onClick={() => handleRemoveStep(index)} 
              size="small"
              disabled={procedureSteps.length === 1}
              title={procedureSteps.length === 1 ? 'Se requiere al menos un paso del procedimiento' : 'Eliminar paso'}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Pasos del Procedimiento"
              value={step.paso}
              onChange={handleStepChange(index, 'paso')}
              required
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Responsable"
                value={step.responsable}
                onChange={handleStepChange(index, 'responsable')}
                required
                disabled={isLoadingEmpleados}
                sx={{ flex: 1 }}
              >
                {isLoadingEmpleados ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  empleados.map((empleado) => (
                    <MenuItem key={empleado.emp_id} value={empleado.emp_id.toString()}>
                      {empleado.emp_alias}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                value={step.fecha}
                onChange={handleStepChange(index, 'fecha')}
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

