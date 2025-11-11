'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Edit, Delete, Visibility, Person, FolderOpen } from '@mui/icons-material';
import { useGetPics, useGetPic, useGetEmpleados, useDeletePic } from '@/hooks/usePics';
import PicDetailsView from '@/app/components/PicDetailsView';
import PageBanner from '@/app/components/PageBanner';

export default function MyPicsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPicId, setSelectedPicId] = useState(null);
  const [openApproversDialog, setOpenApproversDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [detailsPicId, setDetailsPicId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [picToDelete, setPicToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
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
    // Listen for storage changes (in case user logs in from another tab)
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);
  
  // Fetch PICs from database
  const { data: pics = [], isLoading, error } = useGetPics();
  const deletePicMutation = useDeletePic();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'success'; // Green
      case 'in_progress':
      case 'pending':
        return 'warning'; // Yellow
      case 'rejected':
        return 'error'; // Red
      default:
        return 'warning'; // Yellow for Pendiente
    }
  };

  const getTemporaryPermanentColor = (value) => {
    if (!value) return 'default';
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'temporal' || lowerValue === 'temporary') {
      return 'warning'; // Orange - will override with custom color
    } else if (lowerValue === 'permanente' || lowerValue === 'permanent' || lowerValue === 'definitivo') {
      return 'primary'; // Blue
    }
    return 'default';
  };

  const getTemporaryPermanentSx = (value) => {
    if (!value) return {};
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'temporal' || lowerValue === 'temporary') {
      return {
        backgroundColor: '#ff9800', // Orange
        color: '#fff',
      };
    }
    return {};
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
        return status; // Return as-is if not recognized
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
        return value; // Return as-is if already in Spanish or not recognized
    }
  };

  const filteredPics = pics
    .filter((pic) => {
      // Only show PICs created by the logged-in user
      const isCreatedByUser = currentUser?.emp_id 
        ? pic.createdBy === currentUser.emp_id
        : false;
      
      // Apply search filter
      const matchesSearch = 
        pic.revisionReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pic.id.toString().includes(searchTerm.toLowerCase()) ||
        pic.platform?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isCreatedByUser && matchesSearch;
    })
    // Ensure PICs are always sorted by ID descending (newest first)
    .sort((a, b) => b.id - a.id);

  // Pagination logic
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // Get paginated PICs
  const paginatedPics = filteredPics.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getApprovalCount = (pic) => {
    if (!pic.approvals || pic.approvals.length === 0) {
      return '0/0';
    }
    const approvedCount = pic.approvals.filter(
      (approval) => approval.approvalStatus?.toLowerCase() === 'approved'
    ).length;
    const totalCount = pic.approvals.length;
    return `${approvedCount}/${totalCount}`;
  };

  const handleDeleteClick = (pic) => {
    setPicToDelete(pic);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!picToDelete) return;

    try {
      await deletePicMutation.mutateAsync(picToDelete.id);
      setOpenDeleteDialog(false);
      setPicToDelete(null);
    } catch (error) {
      console.error('Error deleting PIC:', error);
      // Error will be shown via mutation error state
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setPicToDelete(null);
  };

  return (
    <Box>
      <PageBanner
        title="Mis PICs"
        subtitle=""
        icon={<FolderOpen sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #4caf50 100%)"
      />


      <Card elevation={3}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por ID, plataforma o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">
              Error al cargar PICs: {error.message}
            </Alert>
          </Box>
        ) : pics.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron PICs. ¡Crea tu primer PIC!
            </Typography>
          </Box>
        ) : (
          <>
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
                    <TableCell align="center"><strong>Aprobadores</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPics.map((pic) => (
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
                          color={getTemporaryPermanentColor(pic.temporaryPermanent)}
                          sx={getTemporaryPermanentSx(pic.temporaryPermanent)}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getApprovalCount(pic)}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setSelectedPicId(pic.id);
                              setOpenApproversDialog(true);
                            }}
                            title="Ver Aprobadores"
                          >
                            <Person fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setDetailsPicId(pic.id);
                              setOpenDetailsDialog(true);
                            }}
                            title="Ver Detalles"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            disabled={pic.status?.toLowerCase() !== 'rejected'}
                            onClick={() => {
                              if (pic.status?.toLowerCase() === 'rejected') {
                                router.push(`/create-pic?id=${pic.id}`);
                              }
                            }}
                            title={pic.status?.toLowerCase() !== 'rejected' ? 'Solo se pueden editar PICs rechazados' : 'Editar PIC'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            disabled={pic.status?.toLowerCase() !== 'rejected' || deletePicMutation.isPending}
                            onClick={() => handleDeleteClick(pic)}
                            title={pic.status?.toLowerCase() !== 'rejected' ? 'Solo se pueden eliminar PICs rechazados' : 'Eliminar PIC'}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredPics.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Card>

      {/* Approvers Dialog */}
      {selectedPicId && (
        <ApproversDialog 
          picId={selectedPicId}
          open={openApproversDialog}
          onClose={() => {
            setOpenApproversDialog(false);
            setSelectedPicId(null);
          }}
        />
      )}

      {/* Details Dialog */}
      {detailsPicId && (
        <PicDetailsDialog 
          picId={detailsPicId}
          open={openDetailsDialog}
          onClose={() => {
            setOpenDetailsDialog(false);
            setDetailsPicId(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {deletePicMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deletePicMutation.error?.message || 'Error al eliminar el PIC'}
            </Alert>
          )}
          <Typography variant="body1">
            ¿Está seguro que desea eliminar el PIC <strong>#{picToDelete?.id}</strong>?
          </Typography>
          {picToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Plataforma:</strong> {picToDelete.platform}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Motivo:</strong> {picToDelete.revisionReason?.substring(0, 100)}
                {picToDelete.revisionReason?.length > 100 ? '...' : ''}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Todos los datos relacionados con este PIC serán eliminados permanentemente.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            disabled={deletePicMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deletePicMutation.isPending}
            startIcon={deletePicMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {deletePicMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

// Component to show full PIC details dialog
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

// Component to show approvers status and comments
function ApproversDialog({ picId, open, onClose }) {
  const { data: pic, isLoading } = useGetPic(picId);
  const { data: empleados = [] } = useGetEmpleados();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Map approver IDs to empleado names
  const getApproverName = (approverId) => {
    const empId = parseInt(approverId);
    const empleado = empleados.find(emp => emp.emp_id === empId);
    return empleado?.emp_alias || approverId;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Aprobadores - PIC #{picId}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !pic?.approvals || pic.approvals.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
            No hay aprobadores registrados para este PIC.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Aprobador</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Comentario</strong></TableCell>
                  <TableCell><strong>Fecha de Respuesta</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pic.approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>{getApproverName(approval.approverId)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(approval.approvalStatus)} 
                        color={getStatusColor(approval.approvalStatus)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {approval.comment || (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Sin comentarios
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {approval.approvalStatus?.toLowerCase() === 'pending' 
                        ? 'N/A' 
                        : formatDate(approval.responseDate)
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

