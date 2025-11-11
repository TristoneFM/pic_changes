import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';

export default function SuccessStep({ picId }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 6 }}>
      <Box 
        sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          backgroundColor: '#4caf50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h2" sx={{ color: 'white' }}>✓</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#4caf50' }}>
        ¡PIC Creado Exitosamente!
      </Typography>
      
      {picId && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" color="text.secondary">
            ID del PIC:
          </Typography>
          <Chip 
            label={`#${picId}`} 
            color="primary" 
            sx={{ fontWeight: 600, fontSize: '1rem' }}
          />
        </Box>
      )}
      
      <Typography variant="body1" color="text.secondary" textAlign="center">
        Tu PIC ha sido creado y enviado correctamente.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => window.location.href = '/my-pics'}
        sx={{ mt: 2 }}
      >
        Ver Mis PICs
      </Button>
    </Box>
  );
}

