import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export default function AvailabilityChangeReasonStep({
  availability,
  changeReason,
  handleAvailabilityChange,
  handleChangeReasonChange,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Availability */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
          Disponibilidad de:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField
            fullWidth
            label="Especifique:"
            value={availability.otros}
            onChange={handleAvailabilityChange('otros')}
            placeholder="Especifique"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
        </Box>
      </Box>

      {/* Change Reason */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
          Motivo del Cambio:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.seguridad}
                  onChange={handleChangeReasonChange('seguridad')}
                />
              }
              label="Seguridad"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.entrega}
                  onChange={handleChangeReasonChange('entrega')}
                />
              }
              label="Entrega"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.productividad}
                  onChange={handleChangeReasonChange('productividad')}
                />
              }
              label="Productividad"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.calidad}
                  onChange={handleChangeReasonChange('calidad')}
                />
              }
              label="Calidad"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.costo}
                  onChange={handleChangeReasonChange('costo')}
                />
              }
              label="Costo"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={changeReason.proceso}
                  onChange={handleChangeReasonChange('proceso')}
                />
              }
              label="Proceso"
            />
          </Box>
          <TextField
            fullWidth
            label="Otro:"
            value={changeReason.otros}
            onChange={handleChangeReasonChange('otros')}
            placeholder="Especifique otro..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

