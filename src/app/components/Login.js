'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';

export default function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    usuario: '',
    contraseña: '',
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.usuario,
          password: formData.contraseña,
        }),
      });

      const data = await response.json();

      if (!response.ok || (!data.authenticated && !data.success)) {
        setError(data.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Check if authentication was successful
      if ((data.authenticated || data.success) && onLoginSuccess) {
        // Use emp_id from database lookup if available, otherwise fall back to other sources
        const empId = data.data?.emp_id || data.userInfo?.emp_id || data.userInfo?.employeeId || data.username;
        const empAlias = data.data?.emp_alias || data.username;
        
        onLoginSuccess({
          emp_id: empId,
          emp_alias: empAlias,
          name: data.userInfo?.name || data.userInfo?.displayName || empAlias,
          username: data.username,
          isAdmin: data.isAdmin,
          groups: data.groups,
          userInfo: data.userInfo,
        });
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
        p: 3,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Card
          elevation={6}
          sx={{
            width: '100%',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box
                component="img"
                src="/images/tristone.jpg"
                alt="Tristone Logo"
                sx={{
                  width: '60%',
                  maxWidth: 200,
                  height: 'auto',
                  objectFit: 'contain',
                  mb: 2,
                }}
              />
              <Typography component="h1" variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
                Sistema de PICs
              </Typography>

            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="usuario"
                label="Usuario"
                name="usuario"
                autoComplete="username"
                autoFocus
                value={formData.usuario}
                onChange={handleChange('usuario')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="contraseña"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="contraseña"
                autoComplete="current-password"
                value={formData.contraseña}
                onChange={handleChange('contraseña')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

