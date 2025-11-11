'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function PageBanner({ title, subtitle, icon, bgGradient }) {
  return (
    <Box sx={{ width: '100%', mb: 4, position: 'relative' }}>
      <Paper
        elevation={4}
        sx={{
          position: 'relative',
          height: { xs: 90, sm: 110 },
          borderRadius: 3,
          overflow: 'hidden',
          background: bgGradient || 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 4, py: 1.5, maxWidth: '800px', zIndex: 1, gap: 2 }}>
          {icon && (
            <Box sx={{ opacity: 0.9, flexShrink: 0 }}>
              {React.cloneElement(icon, { sx: { fontSize: { xs: 32, sm: 40 } } })}
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: subtitle ? 0.25 : 0,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  opacity: 0.95,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

