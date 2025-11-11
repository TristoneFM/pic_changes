'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Assignment,
  CheckCircleOutline,
  Schedule,
} from '@mui/icons-material';
import { useGetPics, useGetPendingApprovals, useGetEmpleados } from '@/hooks/usePics';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const picsToShow = 5;
  
  // Get current user from localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.emp_id) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    getUserData();
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);

  // Fetch PICs data
  const { data: pics = [], isLoading: isLoadingPics, error: picsError } = useGetPics();
  const { data: empleados = [] } = useGetEmpleados();
  const approverId = currentUser?.emp_id ? currentUser.emp_id.toString() : null;
  const { data: pendingApprovals = [], isLoading: isLoadingPending } = useGetPendingApprovals(approverId);

  // All recent PICs (sorted by ID descending)
  const allRecentPics = pics.sort((a, b) => b.id - a.id);
  
  
  // Carousel slides data
  const carouselSlides = [
    {
      title: `Bienvenido, ${currentUser?.emp_alias || 'Usuario'}`,
      subtitle: 'Sistema de Gestión de PICs',
      description: '',
      icon: <Assignment sx={{ fontSize: 60 }} />,
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
    },
    {
      title: `${pendingApprovals.length} Pendientes`,
      subtitle: 'De Tu Revisión',
      description: pendingApprovals.length > 0 
        ? 'Tienes PICs esperando tu aprobación' 
        : 'No tienes PICs pendientes de revisión',
      icon: <Schedule sx={{ fontSize: 60 }} />,
      color: '#ed6c02',
      bgGradient: 'linear-gradient(135deg, #e65100 0%, #ed6c02 50%, #ff9800 100%)',
    },
  ];

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleSlideClick = (index) => {
    setCurrentSlide(index);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Pendiente';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const getCreatorName = (createdBy) => {
    if (!createdBy) return 'N/A';
    const empId = parseInt(createdBy);
    const empleado = empleados.find(emp => emp.emp_id === empId);
    return empleado?.emp_alias || `ID: ${createdBy}`;
  };

  const quickActions = [
    {
      title: 'Crear Nuevo PIC',
      description: 'Crear un nuevo Process Improvement Change',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      path: '/create-pic',
    },
    {
      title: 'Mis PICs',
      description: 'Ver y gestionar mis PICs creados',
      icon: <FolderOpen sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      path: '/my-pics',
    },
    {
      title: 'Aprobar / Rechazar',
      description: `${pendingApprovals.length} PIC(s) pendiente(s) de revisión`,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      path: '/approve-reject',
    },
    {
      title: 'Consultar PICs',
      description: 'Buscar y consultar todos los PICs',
      icon: <Search sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/query-pics',
    },
  ];

  if (isLoadingPics || isLoadingPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Carousel Banner */}
      <Box sx={{ width: '100%', mb: 4, position: 'relative' }}>
        <Paper
          elevation={4}
          sx={{
            position: 'relative',
            height: { xs: 180, sm: 220 },
            borderRadius: 3,
            overflow: 'hidden',
            background: carouselSlides[currentSlide]?.bgGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 0.5s ease',
          }}
        >
          {/* Previous Button */}
          <IconButton
            onClick={handlePrevSlide}
            sx={{
              position: 'absolute',
              left: 16,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
              zIndex: 2,
            }}
          >
            <ChevronLeft />
          </IconButton>

          {/* Slide Content */}
          <Box sx={{ textAlign: 'center', px: 4, py: 2, maxWidth: '800px', zIndex: 1 }}>
            <Box sx={{ mb: 1.5, opacity: 0.9 }}>
              {React.cloneElement(carouselSlides[currentSlide]?.icon, { sx: { fontSize: { xs: 50, sm: 60 } } })}
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {carouselSlides[currentSlide]?.title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                mb: 1,
                opacity: 0.95,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {carouselSlides[currentSlide]?.subtitle}
            </Typography>
            {carouselSlides[currentSlide]?.description && (
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                }}
              >
                {carouselSlides[currentSlide]?.description}
              </Typography>
            )}
          </Box>

          {/* Next Button */}
          <IconButton
            onClick={handleNextSlide}
            sx={{
              position: 'absolute',
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
              zIndex: 2,
            }}
          >
            <ChevronRight />
          </IconButton>

          {/* Dots Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              zIndex: 2,
            }}
          >
            {carouselSlides.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleSlideClick(index)}
                sx={{
                  width: currentSlide === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentSlide === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2', textAlign: 'center', width: '100%' }}>
        Acciones Rápidas
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center', maxWidth: '1200px' }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => router.push(action.path)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: action.color, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent PICs */}
      {allRecentPics.length > 0 && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, width: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', textAlign: 'center', mb: 1 }}>
              PICs Recientes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Mostrando los {Math.min(picsToShow, allRecentPics.length)} más recientes
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ justifyContent: 'center', maxWidth: '1400px' }}>
            {allRecentPics
              .slice(0, picsToShow)
              .map((pic) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={pic.id}>
                  <Card
                    elevation={3}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => router.push(`/query-pics`)}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#1976d2',
                            fontSize: '1.1rem',
                          }}
                        >
                          PIC #{pic.id}
                        </Typography>
                        <Chip
                          label={getStatusLabel(pic.status)}
                          color={getStatusColor(pic.status)}
                          size="small"
                          sx={{ 
                            ml: 1,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: '24px',
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Plataforma
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {pic.platform || 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Creado por
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {getCreatorName(pic.createdBy)}
                        </Typography>
                      </Box>

                      <Box sx={{ flexGrow: 1, mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Motivo
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            color: 'text.secondary',
                            lineHeight: 1.5,
                            minHeight: '2.5rem',
                            maxHeight: '2.5rem',
                          }}
                        >
                          {pic.revisionReason && pic.revisionReason.length > 60 
                            ? pic.revisionReason.substring(0, 60) + '...' 
                            : pic.revisionReason || 'Sin motivo especificado'}
                        </Typography>
                      </Box>

                      {pic.createdAt && (
                        <Box sx={{ 
                          mt: 'auto', 
                          pt: 1.5, 
                          borderTop: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {new Date(pic.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {allRecentPics.length === 0 && !isLoadingPics && (
        <Card elevation={3} sx={{ maxWidth: '600px', width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FolderOpen sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay PICs creados aún
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Comienza creando tu primer PIC para gestionar mejoras en los procesos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/create-pic')}
            >
              Crear mi Primer PIC
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {picsError && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: '600px', width: '100%' }}>
          Error al cargar los datos: {picsError.message}
        </Alert>
      )}
    </Box>
  );
}

