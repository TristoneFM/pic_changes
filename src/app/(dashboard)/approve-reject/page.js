'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel, Info, Schedule } from '@mui/icons-material';
import { useGetPendingApprovals, useApproveRejectPic, useGetPic } from '@/hooks/usePics';
import PicDetailsView from '@/app/components/PicDetailsView';
import PageBanner from '@/app/components/PageBanner';

export default function ApproveRejectPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedPicId, setSelectedPicId] = useState(null);
  const [selectedPic, setSelectedPic] = useState(null);
  const [dialogType, setDialogType] = useState(''); // 'aprobar' or 'rechazar'
  const [comentario, setComentario] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage (using employee login ID)
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          // Ensure emp_id is available
          if (user && user.emp_id) {
            console.log('Current user emp_id:', user.emp_id);
            setCurrentUser(user);
          } else {
            console.warn('User data missing emp_id:', user);
          }
        } else {
          console.warn('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    getUserData();

    // Also listen for storage changes (in case user logs in from another tab)
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);

  // Fetch pending approvals for current user using their employee login ID
  const approverId = currentUser?.emp_id ? currentUser.emp_id.toString() : null;
  const { data: picsPendientes = [], isLoading, error } = useGetPendingApprovals(approverId);
  const approveRejectMutation = useApproveRejectPic();

  const handleOpenDetailsDialog = (picId) => {
    setSelectedPicId(picId);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedPicId(null);
  };

  const handleOpenDialog = (pic, type) => {
    setSelectedPic(pic);
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPic(null);
    setComentario('');
  };

  const handleConfirm = async () => {
    if (!selectedPic || !currentUser) return;

    const status = dialogType === 'aprobar' ? 'approved' : 'rejected';
    
    // Comment is required for both approve and reject
    if (!comentario.trim()) {
      return; // Required comment
    }

    try {
      await approveRejectMutation.mutateAsync({
        picId: selectedPic.id,
        approverId: currentUser.emp_id,
        status,
        comment: comentario.trim(),
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error approving/rejecting PIC:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'success';
      case 'pending':
      case 'in_progress':
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
      case 'completed':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
      case 'in_progress':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const getTemporaryPermanentLabel = (value) => {
    if (!value) return value;
    switch (value.toLowerCase()) {
      case 'temporary':
        return 'Temporal';
      case 'permanent':
        return 'Permanente';
      default:
        return value;
    }
  };

  return (
    <Box>
      <PageBanner
        title="Aprobar / Rechazar PICs"
        subtitle=""
        icon={<Schedule sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #e65100 0%, #ed6c02 50%, #ff9800 100%)"
      />

      <Card elevation={3}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff8e1' }}>
          <Typography variant="body2" color="text.secondary">
            {isLoading ? 'Cargando...' : `${picsPendientes.length} PIC(s) pendiente(s) de revisión`}
            {currentUser && currentUser.emp_id && (
              <Typography component="span" variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>
                (Usuario: {currentUser.emp_alias || currentUser.name} - ID: {currentUser.emp_id})
              </Typography>
            )}
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">
              Error al cargar PICs pendientes: {error.message}
            </Alert>
          </Box>
        ) : !currentUser || !currentUser.emp_id ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="warning">
              Por favor, inicie sesión para ver los PICs pendientes de aprobación.
              {currentUser && !currentUser.emp_id && ' (Usuario sin emp_id)'}
            </Alert>
          </Box>
        ) : picsPendientes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No hay PICs pendientes de aprobación.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Plataforma</strong></TableCell>
                  <TableCell><strong>Motivo</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Fecha de Creación</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {picsPendientes.map((pic) => (
                  <TableRow key={pic.id} hover>
                    <TableCell>#{pic.id}</TableCell>
                    <TableCell>{pic.platform}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      {pic.revisionReason?.substring(0, 50)}
                      {pic.revisionReason?.length > 50 ? '...' : ''}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTemporaryPermanentLabel(pic.temporaryPermanent)}
                        color={pic.temporaryPermanent?.toLowerCase() === 'temporal' || pic.temporaryPermanent?.toLowerCase() === 'temporary' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(pic.status)}
                        color={getStatusColor(pic.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(pic.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleOpenDetailsDialog(pic.id)}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Aprobar">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenDialog(pic, 'aprobar')}
                          disabled={approveRejectMutation.isPending}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDialog(pic, 'rechazar')}
                            disabled={approveRejectMutation.isPending}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Dialog for Approve/Reject */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'aprobar' ? 'Aprobar PIC' : 'Rechazar PIC'}
        </DialogTitle>
        <DialogContent>
          {approveRejectMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {approveRejectMutation.error?.message || 'Error al procesar la acción'}
            </Alert>
          )}
          
          {selectedPic && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Información del PIC
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="ID"
                  value={`#${selectedPic.id}`}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ flex: 0.5 }}
                />
                <TextField
                  fullWidth
                  label="Plataforma"
                  value={selectedPic.platform || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ flex: 1.5 }}
                />
              </Box>

              <TextField
                fullWidth
                label="Tipo"
                value={getTemporaryPermanentLabel(selectedPic.temporaryPermanent)}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Originación"
                  value={selectedPic.originationDate ? new Date(selectedPic.originationDate).toISOString().split('T')[0] : ''}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  value={selectedPic.implementationDate ? new Date(selectedPic.implementationDate).toISOString().split('T')[0] : ''}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Box>

              <TextField
                fullWidth
                label="Operaciones Afectadas"
                value={selectedPic.affectedOperations || ''}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivo de Revisión"
                value={selectedPic.revisionReason || ''}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Estado:
                </Typography>
                <Chip
                  label={getStatusLabel(selectedPic.status)}
                  color={getStatusColor(selectedPic.status)}
                  size="small"
                />
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comentario (Requerido)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={
                dialogType === 'aprobar'
                  ? 'Indica tu comentario sobre la aprobación...'
                  : 'Indica el motivo del rechazo...'
              }
              required
              error={!comentario.trim()}
              helperText={
                !comentario.trim() 
                  ? 'El comentario es obligatorio' 
                  : dialogType === 'aprobar'
                  ? 'Comparte tu comentario sobre la aprobación de este PIC'
                  : 'Explica el motivo por el cual se rechaza este PIC'
              }
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={approveRejectMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={dialogType === 'aprobar' ? 'success' : 'error'}
            disabled={approveRejectMutation.isPending || !comentario.trim()}
            startIcon={approveRejectMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {approveRejectMutation.isPending ? (
              'Procesando...'
            ) : (
              dialogType === 'aprobar' ? 'Aprobar' : 'Rechazar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      {selectedPicId && (
        <PicDetailsDialog 
          picId={selectedPicId}
          open={openDetailsDialog}
          onClose={handleCloseDetailsDialog}
        />
      )}

    </Box>
  );
}

// Component to show full PIC details
function PicDetailsDialog({ picId, open, onClose }) {
  const { data: pic, isLoading } = useGetPic(picId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Detalles del PIC #{picId}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <PicDetailsView pic={pic} isLoading={isLoading} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

