import React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Lock as LockIcon } from '@mui/icons-material';
import { useGetEmpleados } from '@/hooks/usePics';

export default function RequiredApprovalsStep({
  requiredApprovals,
  availableApprovers,
  handleAddApprover,
  handleRemoveApprover,
  mandatoryApproverIds = [],
}) {
  const { data: empleados = [], isLoading: isLoadingEmpleados } = useGetEmpleados();
  
  const isMandatory = (approver) => {
    return mandatoryApproverIds.includes(approver.emp_id);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Aprobaciones Requeridas
        </Typography>
        <TextField
          select
          size="small"
          value=""
          onChange={(e) => handleAddApprover(e.target.value)}
          disabled={isLoadingEmpleados}
          sx={{ minWidth: 300 }}
        >
          <MenuItem value="" disabled>
            {isLoadingEmpleados ? 'Cargando...' : 'Seleccionar Aprobador'}
          </MenuItem>
          {isLoadingEmpleados ? (
            <MenuItem disabled>
              <CircularProgress size={20} />
            </MenuItem>
          ) : (
            empleados
              .filter(empleado => !requiredApprovals.find(a => a.emp_id === empleado.emp_id))
              .map((empleado) => (
                <MenuItem key={empleado.emp_id} value={empleado.emp_id.toString()}>
                  {empleado.emp_alias}
                </MenuItem>
              ))
          )}
        </TextField>
      </Box>

      {requiredApprovals.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">
            No se han agregado aprobadores. Seleccione un aprobador del menú desplegable.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requiredApprovals.map((approver, index) => {
            const mandatory = isMandatory(approver);
            return (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: mandatory ? 'action.hover' : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {approver.emp_alias || approver.nombre || `Empleado ${approver.emp_id || index + 1}`}
                      </Typography>
                      {mandatory && (
                        <Chip
                          icon={<LockIcon />}
                          label="Obligatorio"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    {approver.puesto && (
                      <Typography variant="body2" color="text.secondary">
                        {approver.puesto}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Tooltip 
                  title={mandatory ? "Este aprobador es obligatorio y no puede ser eliminado" : "Eliminar aprobador"}
                  arrow
                >
                  <span>
                    <IconButton 
                      color="error" 
                      onClick={() => !mandatory && handleRemoveApprover(index)} 
                      size="small"
                      disabled={mandatory}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

