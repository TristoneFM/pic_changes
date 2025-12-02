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
      let yPosition = 8;
      const margin = 8;
      const lineHeight = 3.5;
      const sectionSpacing = 2;
      const compactSpacing = 1.5;
      const columnSpacing = 4;
      const fourColumnWidth = (pageWidth - margin * 2 - columnSpacing * 3) / 4;
      const twoColumnWidth = (pageWidth - margin * 2 - columnSpacing) / 2;

      // Add Tristone logo (small)
      try {
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
                  const logoWidth = 20; // Small logo
                  const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
                  doc.addImage(logoDataUrl, 'JPEG', margin, margin, logoWidth, logoHeight);
                  yPosition = margin + logoHeight + 3;
                  resolve();
                };
                logoImg.onerror = () => resolve();
                logoImg.src = logoDataUrl;
              } catch {
                resolve();
              }
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        // Continue without logo
      }

      // Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const titleText = `Información del PIC #${pic.id || 'N/A'}`;
      doc.text(titleText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight + compactSpacing;

      // General Information Section - Four Columns
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Información General', margin, yPosition);
      yPosition += lineHeight + compactSpacing;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      const generalInfo = [
        ['Plataforma:', pic.platform || 'N/A'],
        ['NPs afectados:', pic.affectedPartNumbers === 'todos' ? 'Todos' : pic.affectedPartNumbers === 'ciertos' ? 'Ciertos' : pic.affectedPartNumbers || 'N/A'],
        ...(pic.affectedPartNumbers === 'ciertos' && pic.partNumbersText ? [['NPs:', pic.partNumbersText]] : []),
        ['Tipo:', pic.temporaryPermanent || 'N/A'],
        ...(pic.temporaryPermanent === 'Temporal' ? [
          ['Tipo Temp:', pic.temporaryType || 'N/A'],
          [`Número:`, pic.piecesTimeDateNumber || 'N/A']
        ] : []),
        ['F. Originación:', formatDate(pic.originationDate) || 'N/A'],
        ['F. Implement.:', formatDate(pic.implementationDate) || 'N/A'],
        ['Estado:', getStatusLabel(pic.status) || 'N/A'],
      ];

      // Distribute general info across 4 columns
      const itemsPerColumn = Math.ceil(generalInfo.length / 4);
      const columnYPositions = [yPosition, yPosition, yPosition, yPosition];

      generalInfo.forEach(([label, value], index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        const xPosition = margin + columnIndex * (fourColumnWidth + columnSpacing);
        let currentY = columnYPositions[columnIndex];

        doc.setFont('helvetica', 'bold');
        doc.text(label, xPosition, currentY);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || '', fourColumnWidth - 20);
        doc.text(lines, xPosition + 20, currentY);
        columnYPositions[columnIndex] = currentY + Math.max(lineHeight, lines.length * lineHeight) + compactSpacing;
      });

      yPosition = Math.max(...columnYPositions) + sectionSpacing;

      // Full width fields
      doc.setFont('helvetica', 'bold');
      doc.text('Ops. Afectadas:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const opsLines = doc.splitTextToSize(pic.affectedOperations || 'N/A', pageWidth - margin * 2 - 30);
      doc.text(opsLines, margin + 30, yPosition);
      yPosition += Math.max(lineHeight, opsLines.length * lineHeight) + compactSpacing;

      doc.setFont('helvetica', 'bold');
      doc.text('Motivo:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const motivoLines = doc.splitTextToSize(pic.revisionReason || 'N/A', pageWidth - margin * 2 - 30);
      doc.text(motivoLines, margin + 30, yPosition);
      yPosition += Math.max(lineHeight, motivoLines.length * lineHeight) + sectionSpacing;

      // Procedure Steps - Two Columns
      if (pic.procedureSteps && pic.procedureSteps.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Pasos del Procedimiento', margin, yPosition);
        yPosition += lineHeight + compactSpacing;

        doc.setFontSize(7);
        const sortedSteps = pic.procedureSteps.sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
        const midPoint = Math.ceil(sortedSteps.length / 2);
        
        // Left column steps
        let stepLeftY = yPosition;
        sortedSteps.slice(0, midPoint).forEach((step, index) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`P${step.stepOrder || index + 1}:`, margin, stepLeftY);
          doc.setFont('helvetica', 'normal');
          const stepLines = doc.splitTextToSize(step.stepDescription || '', twoColumnWidth - 10);
          doc.text(stepLines, margin + 6, stepLeftY);
          stepLeftY += stepLines.length * lineHeight + compactSpacing;
          doc.text(`Resp: ${getEmployeeName(step.responsible)}`, margin + 6, stepLeftY);
          stepLeftY += lineHeight;
          doc.text(`Fecha: ${formatDate(step.date) || 'N/A'}`, margin + 6, stepLeftY);
          stepLeftY += lineHeight + compactSpacing;
        });

        // Right column steps
        let stepRightY = yPosition;
        sortedSteps.slice(midPoint).forEach((step, index) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`P${step.stepOrder || midPoint + index + 1}:`, margin + twoColumnWidth + columnSpacing, stepRightY);
          doc.setFont('helvetica', 'normal');
          const stepLines = doc.splitTextToSize(step.stepDescription || '', twoColumnWidth - 10);
          doc.text(stepLines, margin + twoColumnWidth + columnSpacing + 6, stepRightY);
          stepRightY += stepLines.length * lineHeight + compactSpacing;
          doc.text(`Resp: ${getEmployeeName(step.responsible)}`, margin + twoColumnWidth + columnSpacing + 6, stepRightY);
          stepRightY += lineHeight;
          doc.text(`Fecha: ${formatDate(step.date) || 'N/A'}`, margin + twoColumnWidth + columnSpacing + 6, stepRightY);
          stepRightY += lineHeight + compactSpacing;
        });

        yPosition = Math.max(stepLeftY, stepRightY) + sectionSpacing;
      }

      // Validations and Documents - Two Columns (Validations on left)
      const hasDocuments = pic.documents && pic.documents.length > 0;
      const hasValidations = pic.validations && pic.validations.length > 0;
      
      if (hasDocuments || hasValidations) {
        const sectionStartY = yPosition;
        
        // Left column - Validations
        let valY = sectionStartY;
        if (hasValidations) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Validación', margin, sectionStartY);
          valY = sectionStartY + lineHeight + compactSpacing;
          
          doc.setFontSize(7);
          pic.validations.forEach((val, index) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`V${index + 1}:`, margin, valY);
            doc.setFont('helvetica', 'normal');
            const valLines = doc.splitTextToSize(val.validationDescription || '', twoColumnWidth - 10);
            doc.text(valLines, margin + 6, valY);
            valY += valLines.length * lineHeight + compactSpacing;
            doc.text(`Resp: ${getEmployeeName(val.responsible)}`, margin + 6, valY);
            valY += lineHeight;
            doc.text(`Fecha: ${formatDate(val.date) || 'N/A'}`, margin + 6, valY);
            valY += lineHeight + compactSpacing;
          });
        } else {
          valY = sectionStartY;
        }

        // Right column - Documents
        let docY = sectionStartY;
        if (hasDocuments) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Documentos', margin + twoColumnWidth + columnSpacing, sectionStartY);
          docY = sectionStartY + lineHeight + compactSpacing;
          
          doc.setFontSize(7);
          pic.documents.forEach((document) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${document.documentType || 'N/A'}`, margin + twoColumnWidth + columnSpacing, docY);
            doc.setFont('helvetica', 'normal');
            docY += lineHeight;
            doc.text(`Resp: ${getEmployeeName(document.responsible)}`, margin + twoColumnWidth + columnSpacing + 3, docY);
            docY += lineHeight;
            doc.text(`Fecha: ${formatDate(document.date) || 'N/A'}`, margin + twoColumnWidth + columnSpacing + 3, docY);
            docY += lineHeight + compactSpacing;
          });
        } else {
          docY = sectionStartY;
        }

        // Calculate max Y position to ensure no overlap with next section
        yPosition = Math.max(valY, docY) + sectionSpacing;
      }

      // Approvals - Multiple Columns Side by Side
      if (pic.approvals && pic.approvals.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobaciones', margin, yPosition);
        yPosition += lineHeight + compactSpacing;

        doc.setFontSize(7);
        const approvalStartY = yPosition;
        const numColumns = 4; // Display in 4 columns
        const approvalColumnWidth = (pageWidth - margin * 2 - columnSpacing * (numColumns - 1)) / numColumns;
        const columnYPositions = Array(numColumns).fill(approvalStartY);
        
        pic.approvals.forEach((approval, index) => {
          const columnIndex = index % numColumns;
          const xPosition = margin + columnIndex * (approvalColumnWidth + columnSpacing);
          let currentY = columnYPositions[columnIndex];
          
          doc.setFont('helvetica', 'bold');
          const approverName = getEmployeeName(approval.approverId);
          doc.text(`• ${approverName}`, xPosition, currentY);
          currentY += lineHeight;
          
          if (approval.comment) {
            doc.setFont('helvetica', 'normal');
            const commentLines = doc.splitTextToSize(approval.comment, approvalColumnWidth - 5);
            doc.text(commentLines, xPosition + 3, currentY);
            currentY += commentLines.length * lineHeight;
          }
          if (approval.approvalStatus?.toLowerCase() !== 'pending' && approval.responseDate) {
            doc.setFont('helvetica', 'normal');
            doc.text(`F: ${new Date(approval.responseDate).toLocaleDateString('es-MX')}`, xPosition, currentY);
            currentY += lineHeight;
          }
          currentY += compactSpacing;
          columnYPositions[columnIndex] = currentY;
        });

        // Move to next row after all approvals are complete
        yPosition = Math.max(...columnYPositions) + sectionSpacing;
      }

      // Availability and Change Reason - Two Columns (separate row below approvals)
      const bottomRowY = yPosition;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Disponibilidad:', margin, bottomRowY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const availabilityItems = [];
      if (pic.availability?.fixtures) availabilityItems.push('Herrajes');
      if (pic.availability?.testEquipment) availabilityItems.push('Equipo Prueba');
      if (pic.availability?.other) availabilityItems.push(`Otro: ${pic.availability.other}`);
      const availLines = doc.splitTextToSize(availabilityItems.length > 0 ? availabilityItems.join(', ') : 'Ninguna', twoColumnWidth - 30);
      doc.text(availLines, margin + 25, bottomRowY);
      const availHeight = availLines.length * lineHeight;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Motivo Cambio:', margin + twoColumnWidth + columnSpacing, bottomRowY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const changeReasons = [];
      if (pic.changeReason?.safety) changeReasons.push('Seguridad');
      if (pic.changeReason?.delivery) changeReasons.push('Entrega');
      if (pic.changeReason?.productivity) changeReasons.push('Productividad');
      if (pic.changeReason?.quality) changeReasons.push('Calidad');
      if (pic.changeReason?.cost) changeReasons.push('Costo');
      if (pic.changeReason?.process) changeReasons.push('Proceso');
      if (pic.changeReason?.other) changeReasons.push(`Otro: ${pic.changeReason.other}`);
      const reasonLines = doc.splitTextToSize(changeReasons.length > 0 ? changeReasons.join(', ') : 'Ninguno', twoColumnWidth - 30);
      doc.text(reasonLines, margin + twoColumnWidth + columnSpacing + 25, bottomRowY);
      const reasonHeight = reasonLines.length * lineHeight;

      yPosition = bottomRowY + Math.max(availHeight, reasonHeight) + compactSpacing;

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

