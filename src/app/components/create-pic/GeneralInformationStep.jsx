import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useGetSubareas } from '@/hooks/usePics';

export default function GeneralInformationStep({ formData, handleChange, errors = {}, areas = [] }) {
  // Load all subareas (platforms are not dependent on area selection)
  // Using default area ID 4 to load all available platforms
  const { data: subareas = [], isLoading: isLoadingSubareas } = useGetSubareas(4);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Area Afectada */}
      <TextField
        fullWidth
        select
        label="Área Afectada"
        value={formData.areaAfectada}
        onChange={handleChange('areaAfectada')}
        required
        error={!!errors.areaAfectada}
        helperText={errors.areaAfectada?.message}
        SelectProps={{
          displayEmpty: true,
        }}
      >
  
        {areas.map((area) => (
          <MenuItem key={area.id} value={area.id.toString()}>
            {area.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Platform */}
      <TextField
        fullWidth
        select
        label="Plataforma"
        value={formData.plataforma}
        onChange={handleChange('plataforma')}
        required
        error={!!errors.plataforma}
        helperText={errors.plataforma?.message}
        SelectProps={{
          displayEmpty: true,
        }}
        disabled={isLoadingSubareas}
      >
        {isLoadingSubareas ? (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        ) : (
          [
        
            ...subareas.map((subarea) => (
              <MenuItem key={subarea.id_subarea} value={subarea.subarea}>
                {subarea.subarea}
              </MenuItem>
            ))
          ]
        )}
      </TextField>

      {/* Affected Part Numbers */}
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
          Números de parte afectados
        </FormLabel>
        <RadioGroup
          value={formData.numerosParteAfectados}
          onChange={handleChange('numerosParteAfectados')}
          row
        >
          <FormControlLabel 
            value="todos" 
            control={<Radio />} 
            label="Contempla todos los NPs"
          />
          <FormControlLabel 
            value="ciertos" 
            control={<Radio />} 
            label="Solo ciertos NPs"
          />
        </RadioGroup>
      </FormControl>

      {formData.numerosParteAfectados === 'ciertos' && (
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Ingrese números de parte"
          placeholder="Ingrese números de parte..."
          value={formData.numerosParteTexto}
          onChange={handleChange('numerosParteTexto')}
        />
      )}

      {/* Temporary Type and Number */}
      {formData.temporalDefinitivo === 'Temporal' && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            select
            label="Tipo p/Temporal"
            value={formData.tipoTemporal}
            onChange={handleChange('tipoTemporal')}
            sx={{ flex: 1 }}
          >
            <MenuItem value="Piezas">Piezas</MenuItem>
            <MenuItem value="Tiempo">Tiempo</MenuItem>
            <MenuItem value="Fecha">Fecha</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label={
              formData.tipoTemporal === 'Fecha' 
                ? 'Fecha' 
                : formData.tipoTemporal === 'Tiempo'
                ? 'Tiempo'
                : `Número de ${formData.tipoTemporal.toLowerCase()}`
            }
            value={formData.numeroPzasTiempoFecha}
            onChange={handleChange('numeroPzasTiempoFecha')}
            placeholder={
              formData.tipoTemporal === 'Fecha' 
                ? 'YYYY-MM-DD' 
                : 'Ingrese cantidad...'
            }
            type={formData.tipoTemporal === 'Fecha' ? 'date' : 'text'}
            InputLabelProps={formData.tipoTemporal === 'Fecha' ? { shrink: true } : {}}
            sx={{ flex: 1 }}
          />
        </Box>
      )}

      {/* Dates */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          type="date"
          label="Fecha de originación"
          value={formData.fechaOriginacion}
          onChange={handleChange('fechaOriginacion')}
          InputLabelProps={{ shrink: true }}
          required
          error={!!errors.fechaOriginacion}
          helperText={errors.fechaOriginacion?.message}
          sx={{ flex: 1 }}
        />
        <TextField
          fullWidth
          type="date"
          label="Fecha de implementación"
          value={formData.fechaImplementacion}
          onChange={handleChange('fechaImplementacion')}
          InputLabelProps={{ shrink: true }}
          required
          error={!!errors.fechaImplementacion}
          helperText={errors.fechaImplementacion?.message}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Affected Operations */}
      <TextField
        fullWidth
        label="Operaciones afectadas"
        value={formData.operacionesAfectadas}
        onChange={handleChange('operacionesAfectadas')}
        required
        error={!!errors.operacionesAfectadas}
        helperText={errors.operacionesAfectadas?.message}
      />

      {/* Reason */}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Motivo de la revisión o cambio del proceso"
        value={formData.motivoRevision}
        onChange={handleChange('motivoRevision')}
        required
        error={!!errors.motivoRevision}
        helperText={errors.motivoRevision?.message}
      />
    </Box>
  );
}

