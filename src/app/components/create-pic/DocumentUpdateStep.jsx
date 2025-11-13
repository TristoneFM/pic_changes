import React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useGetEmpleados } from '@/hooks/usePics';

export default function DocumentUpdateStep({
  documents,
  availableDocuments,
  handleAddDocument,
  handleRemoveDocument,
  handleDocumentChange,
}) {
  const { data: empleados = [], isLoading: isLoadingEmpleados } = useGetEmpleados();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Actualización/Revisión de Documentos Requerida
        </Typography>
        <TextField
          select
          size="small"
          value=""
          onChange={(e) => handleAddDocument(e.target.value)}
          sx={{ minWidth: 250 }}
        >
          <MenuItem value="" disabled>
            Seleccionar Documento
          </MenuItem>
          {availableDocuments
            .filter(doc => !documents.find(d => d.tipo === doc))
            .map((doc) => (
              <MenuItem key={doc} value={doc}>
                {doc}
              </MenuItem>
            ))}
        </TextField>
      </Box>

      {documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">
            No se han agregado documentos. Seleccione un tipo de documento del menú desplegable.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {documents.map((doc, index) => (
            <Box key={index} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {doc.tipo}
                </Typography>
                <IconButton color="error" onClick={() => handleRemoveDocument(index)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Responsable"
                  value={doc.responsable || ''}
                  onChange={handleDocumentChange(index, 'responsable')}
                  fullWidth
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
                      const currentValue = String(doc.responsable || '');
                      const valueExists = empleados.some(emp => String(emp.emp_id) === currentValue);
                      
                      if (currentValue && !valueExists) {
                        console.warn('Document responsable value not found in empleados:', currentValue, 'Available IDs:', empleados.map(e => String(e.emp_id)));
                      }
                      
                      return [
                     
                        ...empleados.map((empleado) => {
                          const empIdStr = String(empleado.emp_id);
                          if (doc.responsable === empIdStr) {
                            console.log('✅ Matched document responsable:', empIdStr, 'with alias:', empleado.emp_alias);
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
                  type="date"
                  label="Fecha"
                  value={doc.fecha}
                  onChange={handleDocumentChange(index, 'fecha')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

