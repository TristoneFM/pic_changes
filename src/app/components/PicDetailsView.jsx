'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Visibility as VisibilityIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useGetEmpleados, useCheckPdfExists, useGetConfiguration } from '@/hooks/usePics';
import PdfViewerModal from './PdfViewerModal';
import { jsPDF } from 'jspdf';

export default function PicDetailsView({ pic, isLoading }) {
  const { data: empleados = [] } = useGetEmpleados();
  const { data: areas = [] } = useGetConfiguration();
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { data: pdfExists = false } = useCheckPdfExists(pic?.id);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return '';
    const empId = parseInt(employeeId);
    const empleado = empleados.find(emp => emp.emp_id === empId);
    return empleado?.emp_alias || employeeId;
  };

  const getAreaName = (areaId) => {
    if (!areaId) return '';
    const areaIdNum = typeof areaId === 'string' ? parseInt(areaId) : areaId;
    const area = areas.find(a => a.id === areaIdNum);
    return area?.name || areaId;
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pic) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">No se pudo cargar la información del PIC</Typography>
      </Box>
    );
  }

  const handleGeneratePDF = async () => {
    if (!pic) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 15;
      const lineHeight = 7;
      const sectionSpacing = 10;

      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Add Tristone logo
      try {
        // Load logo as base64 to avoid CORS issues
        const logoResponse = await fetch('/images/tristone.jpg');
        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          const reader = new FileReader();
          
          await new Promise((resolve) => {
            reader.onload = () => {
              try {
                const logoDataUrl = reader.result;
                const logoImg = new Image();
                logoImg.onload = () => {
                  const logoWidth = 40;
                  const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
                  doc.addImage(logoDataUrl, 'JPEG', margin, margin, logoWidth, logoHeight);
                  yPosition = margin + logoHeight + 10;
                  resolve();
                };
                logoImg.onerror = () => {
                  console.error('Error processing logo image');
                  resolve(); // Continue without logo
                };
                logoImg.src = logoDataUrl;
              } catch (error) {
                console.error('Error adding logo:', error);
                resolve(); // Continue without logo
              }
            };
            reader.onerror = () => {
              console.error('Error reading logo file');
              resolve(); // Continue without logo
            };
            reader.readAsDataURL(blob);
          });
        } else {
          console.warn('Logo file not found, continuing without logo');
        }
      } catch (error) {
        console.error('Logo error:', error);
        // Continue without logo
      }

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const titleText = `Información del PIC #${pic.id || 'N/A'}`;
      doc.text(titleText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight + 5;

      // General Information Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información General', margin, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const generalInfo = [
        ['Plataforma:', pic.platform || 'N/A'],
        ['Números de parte afectados:', pic.affectedPartNumbers === 'todos' ? 'Contempla todos los NPs' : pic.affectedPartNumbers === 'ciertos' ? 'Solo ciertos NPs' : pic.affectedPartNumbers || 'N/A'],
        ...(pic.affectedPartNumbers === 'ciertos' && pic.partNumbersText ? [['Números de parte:', pic.partNumbersText]] : []),
        ['Temporal o definitivo:', pic.temporaryPermanent || 'N/A'],
        ...(pic.temporaryPermanent === 'Temporal' ? [
          ['Tipo p/Temporal:', pic.temporaryType || 'N/A'],
          [`Número de ${pic.temporaryType?.toLowerCase() || 'temporal'}:`, pic.piecesTimeDateNumber || 'N/A']
        ] : []),
        ['Fecha de Originación:', formatDate(pic.originationDate) || 'N/A'],
        ['Fecha de Implementación:', formatDate(pic.implementationDate) || 'N/A'],
        ['Operaciones Afectadas:', pic.affectedOperations || 'N/A'],
        ['Motivo de Revisión:', pic.revisionReason || 'N/A'],
        ['Estado:', getStatusLabel(pic.status) || 'N/A'],
      ];

      generalInfo.forEach(([label, value]) => {
        checkNewPage(lineHeight + 2);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || '', pageWidth - margin * 2 - 50);
        doc.text(lines, margin + 50, yPosition);
        yPosition += Math.max(lineHeight, lines.length * lineHeight) + 2;
      });

      yPosition += sectionSpacing;

      // Procedure Steps
      if (pic.procedureSteps && pic.procedureSteps.length > 0) {
        checkNewPage(lineHeight * 3);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Pasos del Procedimiento', margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(10);
        pic.procedureSteps
          .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
          .forEach((step, index) => {
            checkNewPage(lineHeight * 4);
            doc.setFont('helvetica', 'bold');
            doc.text(`Paso ${step.stepOrder || index + 1}:`, margin, yPosition);
            yPosition += lineHeight;
            
            doc.setFont('helvetica', 'normal');
            const stepLines = doc.splitTextToSize(step.stepDescription || '', pageWidth - margin * 2);
            doc.text(stepLines, margin, yPosition);
            yPosition += stepLines.length * lineHeight + 2;
            
            doc.text(`Responsable: ${getEmployeeName(step.responsible)}`, margin, yPosition);
            yPosition += lineHeight;
            doc.text(`Fecha: ${formatDate(step.date) || 'N/A'}`, margin, yPosition);
            yPosition += lineHeight + 3;
          });
      }

      yPosition += sectionSpacing;

      // Documents
      if (pic.documents && pic.documents.length > 0) {
        checkNewPage(lineHeight * 3);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Actualización/Revisión de Documentos Requerida', margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(10);
        pic.documents.forEach((document) => {
          checkNewPage(lineHeight * 3);
          doc.setFont('helvetica', 'bold');
          doc.text(document.documentType || 'N/A', margin, yPosition);
          yPosition += lineHeight;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Responsable: ${getEmployeeName(document.responsible)}`, margin, yPosition);
          yPosition += lineHeight;
          doc.text(`Fecha: ${formatDate(document.date) || 'N/A'}`, margin, yPosition);
          yPosition += lineHeight + 3;
        });
      }

      yPosition += sectionSpacing;

      // Validations
      if (pic.validations && pic.validations.length > 0) {
        checkNewPage(lineHeight * 3);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Validación', margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(10);
        pic.validations.forEach((val, index) => {
          checkNewPage(lineHeight * 4);
          doc.setFont('helvetica', 'bold');
          doc.text(`Validación ${index + 1}:`, margin, yPosition);
          yPosition += lineHeight;
          
          doc.setFont('helvetica', 'normal');
          const valLines = doc.splitTextToSize(val.validationDescription || '', pageWidth - margin * 2);
          doc.text(valLines, margin, yPosition);
          yPosition += valLines.length * lineHeight + 2;
          
          doc.text(`Responsable: ${getEmployeeName(val.responsible)}`, margin, yPosition);
          yPosition += lineHeight;
          doc.text(`Fecha: ${formatDate(val.date) || 'N/A'}`, margin, yPosition);
          yPosition += lineHeight + 3;
        });
      }

      yPosition += sectionSpacing;

      // Approvals
      if (pic.approvals && pic.approvals.length > 0) {
        checkNewPage(lineHeight * 3);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobaciones Requeridas', margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(10);
        pic.approvals.forEach((approval) => {
          checkNewPage(lineHeight * 4);
          doc.setFont('helvetica', 'bold');
          doc.text(`Aprobador: ${getEmployeeName(approval.approverId)}`, margin, yPosition);
          yPosition += lineHeight;
          
          doc.setFont('helvetica', 'normal');
          const status = approval.approvalStatus === 'approved' ? 'Aprobado' : 
                        approval.approvalStatus === 'rejected' ? 'Rechazado' : 'Pendiente';
          doc.text(`Estado: ${status}`, margin, yPosition);
          yPosition += lineHeight;
          
          if (approval.comment) {
            const commentLines = doc.splitTextToSize(`Comentario: ${approval.comment}`, pageWidth - margin * 2);
            doc.text(commentLines, margin, yPosition);
            yPosition += commentLines.length * lineHeight;
          }
          
          if (approval.approvalStatus?.toLowerCase() !== 'pending' && approval.responseDate) {
            doc.text(`Fecha de Respuesta: ${new Date(approval.responseDate).toLocaleDateString('es-MX')}`, margin, yPosition);
            yPosition += lineHeight;
          }
          yPosition += 3;
        });
      }

      yPosition += sectionSpacing;

      // Availability
      checkNewPage(lineHeight * 3);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Disponibilidad de:', margin, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const availabilityItems = [];
      if (pic.availability?.fixtures) availabilityItems.push('Herrajes');
      if (pic.availability?.testEquipment) availabilityItems.push('Equipo de Prueba');
      if (pic.availability?.other) availabilityItems.push(`Otro: ${pic.availability.other}`);
      
      if (availabilityItems.length > 0) {
        availabilityItems.forEach(item => {
          doc.text(`• ${item}`, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      } else {
        doc.text('Ninguna', margin + 5, yPosition);
        yPosition += lineHeight;
      }

      yPosition += sectionSpacing;

      // Change Reason
      checkNewPage(lineHeight * 3);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Motivo del Cambio:', margin, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const changeReasons = [];
      if (pic.changeReason?.safety) changeReasons.push('Seguridad');
      if (pic.changeReason?.delivery) changeReasons.push('Entrega');
      if (pic.changeReason?.productivity) changeReasons.push('Productividad');
      if (pic.changeReason?.quality) changeReasons.push('Calidad');
      if (pic.changeReason?.cost) changeReasons.push('Costo');
      if (pic.changeReason?.process) changeReasons.push('Proceso');
      if (pic.changeReason?.other) changeReasons.push(`Otro: ${pic.changeReason.other}`);
      
      if (changeReasons.length > 0) {
        changeReasons.forEach(reason => {
          doc.text(`• ${reason}`, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      } else {
        doc.text('Ninguno', margin + 5, yPosition);
        yPosition += lineHeight;
      }

      // Save PDF
      const fileName = `PIC_${pic.id || 'details'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* General Information */}
      <Card elevation={2} sx={{ border: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
            Información General
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Área Afectada"
              value={getAreaName(pic.affectedArea)}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Plataforma"
              value={pic.platform || ''}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Números de parte afectados
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label={pic.affectedPartNumbers === 'todos' ? 'Contempla todos los NPs' : 'Solo ciertos NPs'}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>

            {pic.affectedPartNumbers === 'ciertos' && pic.partNumbersText && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Números de parte"
                value={pic.partNumbersText}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            )}


            {pic.temporaryPermanent === 'Temporal' && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Tipo p/Temporal"
                  value={pic.temporaryType || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ flex: 1 }}
                />
                <TextField
                  fullWidth
                  label={`Número de ${pic.temporaryType?.toLowerCase() || 'temporal'}`}
                  value={pic.piecesTimeDateNumber || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ flex: 1 }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Originación"
                value={formatDate(pic.originationDate)}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
              <TextField
                fullWidth
                type="date"
                label="Fecha de Implementación"
                value={formatDate(pic.implementationDate)}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Box>

            <TextField
              fullWidth
              label="Operaciones Afectadas"
              value={pic.affectedOperations || ''}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Motivo de Revisión"
              value={pic.revisionReason || ''}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Estado:
              </Typography>
              <Chip
                label={getStatusLabel(pic.status)}
                color={getStatusColor(pic.status)}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Procedure Steps */}
      {pic.procedureSteps && pic.procedureSteps.length > 0 && (
        <Card elevation={2} sx={{ border: '1px solid #e0e0e0', borderTop: '3px solid #1976d2', backgroundColor: '#e3f2fd' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              Pasos del Procedimiento
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pic.procedureSteps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step, index) => (
                  <Box key={step.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      Paso {step.stepOrder || index + 1}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Pasos del Procedimiento"
                      value={step.stepDescription || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Responsable"
                        value={getEmployeeName(step.responsible)}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        fullWidth
                        type="date"
                        label="Fecha"
                        value={formatDate(step.date)}
                        InputProps={{ readOnly: true }}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {pic.documents && pic.documents.length > 0 && (
        <Card elevation={2} sx={{ border: '1px solid #e0e0e0', borderTop: '3px solid #1976d2', backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Actualización/Revisión de Documentos Requerida
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pic.documents.map((doc) => (
                <Box key={doc.id} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    {doc.documentType}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Responsable"
                      value={getEmployeeName(doc.responsible)}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha"
                      value={formatDate(doc.date)}
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Validations */}
      {pic.validations && pic.validations.length > 0 && (
        <Card elevation={2} sx={{ border: '1px solid #e0e0e0', borderTop: '3px solid #1976d2', backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              Validación
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {pic.validations.map((val, index) => (
                <Box key={val.id} sx={{ pb: index < pic.validations.length - 1 ? 3 : 0, borderBottom: index < pic.validations.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    Validación {index + 1}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Validación"
                    value={val.validationDescription || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Responsable"
                      value={getEmployeeName(val.responsible)}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha"
                      value={formatDate(val.date)}
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Approvals */}
      {pic.approvals && pic.approvals.length > 0 && (
        <Card elevation={2} sx={{ border: '1px solid #e0e0e0', borderTop: '3px solid #1976d2', backgroundColor: '#e3f2fd' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              Aprobaciones Requeridas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pic.approvals.map((approval) => (
                <Box key={approval.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {getEmployeeName(approval.approverId)}
                    </Typography>
                    <Chip
                      label={approval.approvalStatus === 'approved' ? 'Aprobado' : approval.approvalStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      color={approval.approvalStatus === 'approved' ? 'success' : approval.approvalStatus === 'rejected' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {approval.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Comentario:</strong> {approval.comment}
                    </Typography>
                  )}
                  {approval.approvalStatus?.toLowerCase() !== 'pending' && approval.responseDate && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      <strong>Fecha de Respuesta:</strong> {new Date(approval.responseDate).toLocaleDateString('es-MX')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Availability and Change Reason */}
      <Card elevation={2} sx={{ border: '1px solid #e0e0e0', borderTop: '3px solid #1976d2', backgroundColor: '#f8f9fa' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Availability */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Disponibilidad de:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={pic.availability?.fixtures || false} disabled />}
                    label="Herrajes"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.availability?.testEquipment || false} disabled />}
                    label="Equipo de Prueba"
                  />
                </Box>
                {pic.availability?.other && (
                  <TextField
                    fullWidth
                    label="Otro"
                    value={pic.availability.other}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderWidth: 2, borderColor: '#e0e0e0' }} />

            {/* Change Reason */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Motivo del Cambio:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.safety || false} disabled />}
                    label="Seguridad"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.delivery || false} disabled />}
                    label="Entrega"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.productivity || false} disabled />}
                    label="Productividad"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.quality || false} disabled />}
                    label="Calidad"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.cost || false} disabled />}
                    label="Costo"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={pic.changeReason?.process || false} disabled />}
                    label="Proceso"
                  />
                </Box>
                {pic.changeReason?.other && (
                  <TextField
                    fullWidth
                    label="Otro"
                    value={pic.changeReason.other}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Print PDF and View PDF Buttons - Bottom */}
      <Box
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 2,
          mt: 4,
          mb: 2
        }}
      >
        {/* Only show PDF generation button if status is Approved */}
        {(pic.status?.toLowerCase() === 'approved' || pic.status?.toLowerCase() === 'completed') && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
            startIcon={isGeneratingPdf ? <CircularProgress size={20} color="inherit" /> : <PdfIcon sx={{ fontSize: 28 }} />}
            onClick={handleGeneratePDF}
            disabled={!pic?.id || isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Generando PDF...' : 'Generar PDF'}
          </Button>
        )}
        
        {pdfExists && (
          <Button
            variant="contained"
            color="secondary"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
            startIcon={<DescriptionIcon sx={{ fontSize: 28 }} />}
            onClick={() => setOpenPdfModal(true)}
            disabled={!pic?.id}
          >
            Archivo Adjunto
          </Button>
        )}
      </Box>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        open={openPdfModal}
        onClose={() => setOpenPdfModal(false)}
        picId={pic?.id}
      />
    </Box>
  );
}

