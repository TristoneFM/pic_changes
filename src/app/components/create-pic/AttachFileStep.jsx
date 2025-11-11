import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Description as DescriptionIcon } from '@mui/icons-material';

export default function AttachFileStep({ attachedFile, handleFileChange }) {
  const handleRemoveFile = () => {
    // Create a synthetic event to clear the file input
    const input = document.querySelector('input[type="file"]');
    if (input) {
      input.value = '';
    }
    handleFileChange({ target: { files: [] } });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
        Adjuntar Archivo
      </Typography>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
          Adjuntar un archivo (Opcional - Solo archivos PDF):
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<DescriptionIcon />}
            >
              Elegir Archivo PDF
              <input
                type="file"
                hidden
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />
            </Button>
          </Box>
          
          {attachedFile && (
            <Box 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'action.hover',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {attachedFile.name}
                </Typography>
                <Chip 
                  label={`${(attachedFile.size / 1024).toFixed(2)} KB`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
              <IconButton 
                color="error" 
                onClick={handleRemoveFile}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
          
          {!attachedFile && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Ningún archivo seleccionado
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

