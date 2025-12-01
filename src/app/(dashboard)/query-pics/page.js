'use client';

import React, { useState } from 'react';
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
  TextField,
  InputAdornment,
  Grid,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, FilterList, Visibility } from '@mui/icons-material';
import { useGetPics, useGetPic, useGetEmpleados } from '@/hooks/usePics';
import PicDetailsView from '@/app/components/PicDetailsView';
import PageBanner from '@/app/components/PageBanner';

export default function QueryPicsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    plataforma: '',
    estado: '',
    tipo: '',
  });
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [detailsPicId, setDetailsPicId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch all PICs from database
  const { data: pics = [], isLoading, error } = useGetPics();
  const { data: empleados = [] } = useGetEmpleados();

  // Helper functions
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
        return 'warning';
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
        return 'Definitivo';
      default:
        return value;
    }
  };

  const getTemporaryPermanentColor = (value) => {
    if (!value) return 'default';
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'temporal' || lowerValue === 'temporary') {
      return 'warning';
    } else if (lowerValue === 'permanente' || lowerValue === 'permanent' || lowerValue === 'definitivo') {
      return 'primary';
    }
    return 'default';
  };

  const getTemporaryPermanentSx = (value) => {
    if (!value) return {};
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'temporal' || lowerValue === 'temporary') {
      return {
        backgroundColor: '#ff9800',
        color: '#fff',
      };
    }
    return {};
  };

  const getCreatorName = (createdBy) => {
    if (!createdBy) return 'N/A';
    const empId = parseInt(createdBy);
    const empleado = empleados.find(emp => emp.emp_id === empId);
    return empleado?.emp_alias || `ID: ${createdBy}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Get unique platforms for filter
  const uniquePlatforms = Array.from(new Set(pics.map(pic => pic.platform).filter(Boolean))).sort();

  // Filter PICs
  const filteredPics = pics.filter((pic) => {
    const matchesSearch =
      pic.revisionReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pic.id.toString().includes(searchTerm.toLowerCase()) ||
      pic.platform?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlataforma = !filters.plataforma || pic.platform === filters.plataforma;
    const matchesEstado = !filters.estado || getStatusLabel(pic.status) === filters.estado;
    const matchesTipo = !filters.tipo || getTemporaryPermanentLabel(pic.temporaryPermanent) === filters.tipo;

    return matchesSearch && matchesPlataforma && matchesEstado && matchesTipo;
  });

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      plataforma: '',
      estado: '',
      tipo: '',
    });
    setSearchTerm('');
    setPage(0); // Reset to first page when clearing filters
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  // Paginate filtered PICs
  const paginatedPics = filteredPics.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleOpenDetails = (picId) => {
    setDetailsPicId(picId);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setDetailsPicId(null);
  };

  return (
    <Box>
      <PageBanner
        title="Consultar PICs"
        subtitle=""
        icon={<Search sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      {/* Filters */}
      <Card elevation={3} sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={500}>
              Filtros
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por ID, plataforma o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Plataforma"
                value={filters.plataforma}
                onChange={handleFilterChange('plataforma')}
              >
                <MenuItem value="">Todas</MenuItem>
                {uniquePlatforms.map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    {platform}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Estado"
                value={filters.estado}
                onChange={handleFilterChange('estado')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Aprobado">Aprobado</MenuItem>
                <MenuItem value="Rechazado">Rechazado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Tipo"
                value={filters.tipo}
                onChange={handleFilterChange('tipo')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Temporal">Temporal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" size="small" onClick={clearFilters}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Results Table */}
      <Card elevation={3}>
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
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Plataforma</strong></TableCell>
                    <TableCell><strong>Motivo</strong></TableCell>
                    <TableCell><strong>Operaciones Afectadas</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Creado Por</strong></TableCell>
                    <TableCell><strong>Fecha de Creación</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No se encontraron PICs.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPics.map((pic) => (
                      <TableRow key={pic.id} hover>
                        <TableCell>#{pic.id}</TableCell>
                        <TableCell>{pic.platform || 'N/A'}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          {pic.revisionReason?.substring(0, 50)}
                          {pic.revisionReason?.length > 50 ? '...' : ''}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {pic.affectedOperations || 'N/A'}
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
                        <TableCell>{getCreatorName(pic.createdBy)}</TableCell>
                        <TableCell>{formatDate(pic.createdAt)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDetails(pic.id)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Card>

      {/* Details Dialog */}
      {detailsPicId && (
        <PicDetailsDialog
          picId={detailsPicId}
          open={openDetailsDialog}
          onClose={handleCloseDetails}
        />
      )}

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

