'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Settings as SettingsIcon, Delete as DeleteIcon, Save as SaveIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useGetEmpleados } from '@/hooks/usePics';
import PageBanner from '@/app/components/PageBanner';

export default function ConfigurationPage() {
  const router = useRouter();
  const [areas, setAreas] = useState([]); // Each area has: { id, name, approvers: [{ emp_id, emp_alias }] }
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  
  // Area editing state
  const [editingArea, setEditingArea] = useState(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [openAreaDialog, setOpenAreaDialog] = useState(false);
  
  // Approver editing state (per area)
  const [editingApprover, setEditingApprover] = useState(null);
  const [editingApproverAreaId, setEditingApproverAreaId] = useState(null);
  const [selectedApproverForEdit, setSelectedApproverForEdit] = useState('');
  const [openApproverDialog, setOpenApproverDialog] = useState(false);
  const [selectedApproverForArea, setSelectedApproverForArea] = useState({ areaId: null, approverId: '' });

  const { data: empleados = [], isLoading: isLoadingEmpleados } = useGetEmpleados();

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.isAdmin === true) {
            setIsAdmin(true);
            setIsCheckingAdmin(false);
            return;
          }
        }
        // Not admin, redirect to dashboard
        setIsCheckingAdmin(false);
        router.push('/dashboard');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsCheckingAdmin(false);
        router.push('/dashboard');
      }
    };

    checkAdmin();
  }, [router]);

  // Load configuration on mount (only if admin)
  useEffect(() => {
    if (isAdmin && !isCheckingAdmin) {
      loadConfiguration();
    }
  }, [isAdmin, isCheckingAdmin]);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/configuration');
      if (response.ok) {
        const data = await response.json();
        // Ensure each area has an approvers array
        const areasWithApprovers = (data.areas || []).map(area => ({
          ...area,
          approvers: area.approvers || []
        }));
        setAreas(areasWithApprovers);
      } else {
        setAreas([]);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          areas,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveError('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddApprover = (areaId) => {
    if (selectedApproverForArea.areaId === areaId && selectedApproverForArea.approverId) {
      const empId = parseInt(selectedApproverForArea.approverId);
      const empleado = empleados.find(emp => emp.emp_id === empId);
      const area = areas.find(a => a.id === areaId);
      
      if (empleado && area && !area.approvers?.find(a => a.emp_id === empId)) {
        setAreas(areas.map(area => 
          area.id === areaId
            ? { ...area, approvers: [...(area.approvers || []), { emp_id: empId, emp_alias: empleado.emp_alias }] }
            : area
        ));
        setSelectedApproverForArea({ areaId: null, approverId: '' });
      }
    }
  };

  const handleRemoveApprover = (areaId, empId) => {
    setAreas(areas.map(area => 
      area.id === areaId
        ? { ...area, approvers: (area.approvers || []).filter(a => a.emp_id !== empId) }
        : area
    ));
  };

  const getAvailableApproversForArea = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    const areaApproverIds = (area?.approvers || []).map(a => a.emp_id);
    return empleados.filter(emp => !areaApproverIds.includes(emp.emp_id));
  };

  const handleOpenAddArea = () => {
    setEditingArea(null);
    setNewAreaName('');
    setOpenAreaDialog(true);
  };

  const handleOpenEditArea = (area) => {
    setEditingArea(area);
    setNewAreaName(area.name);
    setOpenAreaDialog(true);
  };

  const handleCloseAreaDialog = () => {
    setOpenAreaDialog(false);
    setEditingArea(null);
    setNewAreaName('');
  };

  const handleSaveArea = () => {
    if (!newAreaName.trim()) {
      return;
    }

    if (editingArea) {
      // Update existing area
      setAreas(areas.map(area => 
        area.id === editingArea.id 
          ? { ...area, name: newAreaName.trim() }
          : area
      ));
    } else {
      // Add new area with empty approvers array
      const newArea = {
        id: Date.now(), // Temporary ID, will be replaced by server
        name: newAreaName.trim(),
        approvers: [],
      };
      setAreas([...areas, newArea]);
    }
    handleCloseAreaDialog();
  };

  const handleOpenEditApprover = (areaId, approver) => {
    setEditingApprover(approver);
    setEditingApproverAreaId(areaId);
    setSelectedApproverForEdit('');
    setOpenApproverDialog(true);
  };

  const handleCloseApproverDialog = () => {
    setOpenApproverDialog(false);
    setEditingApprover(null);
    setEditingApproverAreaId(null);
    setSelectedApproverForEdit('');
  };

  const handleSaveApprover = () => {
    if (!selectedApproverForEdit || !editingApproverAreaId) {
      return;
    }

    const empId = parseInt(selectedApproverForEdit);
    const empleado = empleados.find(emp => emp.emp_id === empId);
    
    if (empleado && editingApprover) {
      // Update existing approver in the specific area
      setAreas(areas.map(area => 
        area.id === editingApproverAreaId
          ? {
              ...area,
              approvers: (area.approvers || []).map(approver => 
                approver.emp_id === editingApprover.emp_id
                  ? { emp_id: empId, emp_alias: empleado.emp_alias }
                  : approver
              )
            }
          : area
      ));
    }
    handleCloseApproverDialog();
  };

  // Show loading while checking admin status
  if (isCheckingAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't render if not admin (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  return (
    <Box>
      <PageBanner
        title="Configuración"
        subtitle="Configuración del sistema"
        icon={<SettingsIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {saveSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Configuración guardada exitosamente
                </Alert>
              )}
              {saveError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {saveError}
                </Alert>
              )}

              {/* Areas Afectadas Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Áreas Afectadas
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddArea}
                    size="small"
                  >
                    Agregar Área
                  </Button>
                </Box>

                {areas.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {areas.map((area) => (
                      <Card key={area.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              {area.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditArea(area)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                            Aprobadores Obligatorios para esta área:
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                              select
                              label="Seleccionar Aprobador"
                              value={selectedApproverForArea.areaId === area.id ? selectedApproverForArea.approverId : ''}
                              onChange={(e) => setSelectedApproverForArea({ areaId: area.id, approverId: e.target.value })}
                              disabled={isLoadingEmpleados || getAvailableApproversForArea(area.id).length === 0}
                              sx={{ flexGrow: 1 }}
                              size="small"
                              SelectProps={{
                                displayEmpty: true,
                              }}
                            >
                              <MenuItem value="" disabled>
                                {isLoadingEmpleados ? 'Cargando...' : getAvailableApproversForArea(area.id).length === 0 ? 'No hay más aprobadores disponibles' : 'Seleccionar Aprobador'}
                              </MenuItem>
                              {getAvailableApproversForArea(area.id).map((empleado) => (
                                <MenuItem key={empleado.emp_id} value={empleado.emp_id.toString()}>
                                  {empleado.emp_alias}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Button
                              variant="contained"
                              onClick={() => handleAddApprover(area.id)}
                              disabled={selectedApproverForArea.areaId !== area.id || !selectedApproverForArea.approverId || isLoadingEmpleados}
                              size="small"
                            >
                              Agregar
                            </Button>
                          </Box>

                          {area.approvers && area.approvers.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Aprobador</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {area.approvers.map((approver) => (
                                    <TableRow key={approver.emp_id}>
                                      <TableCell>{approver.emp_alias}</TableCell>
                                      <TableCell align="right">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenEditApprover(area.id, approver)}
                                          color="primary"
                                          sx={{ mr: 1 }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveApprover(area.id, approver.emp_id)}
                                          color="error"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                              No hay aprobadores obligatorios configurados para esta área
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                    No hay áreas afectadas configuradas. Haga clic en "Agregar Área" para crear una.
                  </Typography>
                )}
              </Box>

              {/* Add/Edit Area Dialog */}
              <Dialog open={openAreaDialog} onClose={handleCloseAreaDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                  {editingArea ? 'Editar Área Afectada' : 'Agregar Área Afectada'}
                </DialogTitle>
                <DialogContent>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Nombre del Área"
                    fullWidth
                    variant="outlined"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Ingrese el nombre del área afectada"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveArea();
                      }
                    }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseAreaDialog}>Cancelar</Button>
                  <Button 
                    onClick={handleSaveArea} 
                    variant="contained"
                    disabled={!newAreaName.trim()}
                  >
                    {editingArea ? 'Actualizar' : 'Agregar'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Edit Approver Dialog */}
              <Dialog open={openApproverDialog} onClose={handleCloseApproverDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                  Editar Aprobador Obligatorio
                </DialogTitle>
                <DialogContent>
                  <TextField
                    autoFocus
                    margin="dense"
                    select
                    label="Seleccionar Nuevo Aprobador"
                    fullWidth
                    variant="outlined"
                    value={selectedApproverForEdit}
                    onChange={(e) => setSelectedApproverForEdit(e.target.value)}
                    sx={{ mt: 2 }}
                    SelectProps={{
                      displayEmpty: true,
                    }}
                  >
                    <MenuItem value="" disabled>
                      Seleccionar Aprobador
                    </MenuItem>
                    {editingApproverAreaId && empleados
                      .filter(emp => {
                        const area = areas.find(a => a.id === editingApproverAreaId);
                        const areaApproverIds = (area?.approvers || []).map(a => a.emp_id);
                        return emp.emp_id !== editingApprover?.emp_id && !areaApproverIds.includes(emp.emp_id);
                      })
                      .map((empleado) => (
                        <MenuItem key={empleado.emp_id} value={empleado.emp_id.toString()}>
                          {empleado.emp_alias}
                        </MenuItem>
                      ))}
                  </TextField>
                  {editingApprover && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Aprobador actual: <strong>{editingApprover.emp_alias}</strong>
                    </Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseApproverDialog}>Cancelar</Button>
                  <Button 
                    onClick={handleSaveApprover} 
                    variant="contained"
                    disabled={!selectedApproverForEdit}
                  >
                    Actualizar
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={isSaving}
                  size="large"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

