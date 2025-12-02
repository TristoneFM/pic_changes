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
      let yPosition = 2; // Moved everything more up
      const margin = 2; // Minimal margin
      const lineHeight = 3.5;
      const sectionSpacing = 0; // No spacing between sections
      const compactSpacing = 1.5;
      const columnSpacing = 4;
      const boxPadding = 2; // Padding inside boxes
      const fourColumnWidth = (pageWidth - margin * 2 - columnSpacing * 3) / 4;
      const twoColumnWidth = (pageWidth - margin * 2 - columnSpacing) / 2;

      // Add Tristone logo and title on same line, centered together
      let logoWidth = 0;
      let logoHeight = 0;
      let logoDataUrl = null;
      try {
        const logoResponse = await fetch('/images/tristone.jpg');
        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          const reader = new FileReader();
          
          await new Promise((resolve) => {
            reader.onload = () => {
              try {
                logoDataUrl = reader.result;
                const logoImg = new Image();
                logoImg.onload = () => {
                  logoWidth = 12; // Smaller logo
                  logoHeight = (logoImg.height / logoImg.width) * logoWidth;
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

      // Title - smaller font, centered with logo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const titleText = `Información del PIC #${pic.id || 'N/A'}`;
      
      // Calculate combined width of logo + spacing + title
      const titleWidth = doc.getTextWidth(titleText);
      const logoSpacing = 3;
      const combinedWidth = logoWidth + logoSpacing + titleWidth;
      
      // Center the combined logo + title
      const startX = (pageWidth - combinedWidth) / 2;
      const titleY = yPosition + (logoHeight > 0 ? logoHeight / 2 + 1 : 0);
      
      // Draw logo if available
      if (logoWidth > 0 && logoDataUrl) {
        doc.addImage(logoDataUrl, 'JPEG', startX, yPosition, logoWidth, logoHeight);
      }
      
      // Draw title next to logo
      doc.text(titleText, startX + logoWidth + logoSpacing, titleY, { align: 'left' });
      
      // Set yPosition to the bottom of logo/title line
      yPosition = Math.max(yPosition + logoHeight, titleY) + compactSpacing;

      // General Information Section - Four Columns (in box)
      const generalInfoStartY = yPosition;
      yPosition += boxPadding; // Add margin from top border
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Información General', margin + boxPadding, yPosition);
      yPosition += lineHeight + compactSpacing;

      doc.setFontSize(8);
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
        ['F. Vencimiento:', formatDate(pic.implementationDate) || 'N/A'],
        ['Estado:', getStatusLabel(pic.status) || 'N/A'],
      ];

      // Distribute general info across 4 columns
      const itemsPerColumn = Math.ceil(generalInfo.length / 4);
      const columnYPositions = [yPosition, yPosition, yPosition, yPosition];

      generalInfo.forEach(([label, value], index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        const xPosition = margin + boxPadding + columnIndex * (fourColumnWidth + columnSpacing);
        let currentY = columnYPositions[columnIndex];

        doc.setFont('helvetica', 'bold');
        doc.text(label, xPosition, currentY);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || '', fourColumnWidth - 25);
        doc.text(lines, xPosition + 25, currentY);
        columnYPositions[columnIndex] = currentY + Math.max(lineHeight, lines.length * lineHeight) + compactSpacing;
      });

      yPosition = Math.max(...columnYPositions) + boxPadding;
      const generalInfoEndY = yPosition;
      
      // Draw box around general information
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, generalInfoStartY - boxPadding, pageWidth - margin * 2, generalInfoEndY - generalInfoStartY);
      yPosition += sectionSpacing;

      // Full width fields (in box)
      const opsMotivoStartY = yPosition;
      yPosition += boxPadding; // Add margin from top border
      doc.setFont('helvetica', 'bold');
      doc.text('Ops. Afectadas:', margin + boxPadding, yPosition);
      doc.setFont('helvetica', 'normal');
      const opsLines = doc.splitTextToSize(pic.affectedOperations || 'N/A', pageWidth - margin * 2 - 35 - boxPadding * 2);
      doc.text(opsLines, margin + 35 + boxPadding, yPosition);
      yPosition += Math.max(lineHeight, opsLines.length * lineHeight) + compactSpacing;

      doc.setFont('helvetica', 'bold');
      doc.text('Motivo:', margin + boxPadding, yPosition);
      doc.setFont('helvetica', 'normal');
      const motivoLines = doc.splitTextToSize(pic.revisionReason || 'N/A', pageWidth - margin * 2 - 35 - boxPadding * 2);
      doc.text(motivoLines, margin + 35 + boxPadding, yPosition);
      yPosition += Math.max(lineHeight, motivoLines.length * lineHeight) + boxPadding;
      const opsMotivoEndY = yPosition;
      
      // Draw box around ops and motivo
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, opsMotivoStartY - boxPadding, pageWidth - margin * 2, opsMotivoEndY - opsMotivoStartY);
      yPosition += sectionSpacing;

      // Procedure Steps - Two Columns (in box)
      if (pic.procedureSteps && pic.procedureSteps.length > 0) {
        const stepsStartY = yPosition;
        yPosition += boxPadding; // Add margin from top border
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Pasos del Procedimiento', margin + boxPadding, yPosition);
        yPosition += lineHeight + compactSpacing;

        doc.setFontSize(8);
        const sortedSteps = pic.procedureSteps.sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
        const midPoint = Math.ceil(sortedSteps.length / 2);
        
        // Left column steps
        let stepLeftY = yPosition;
        sortedSteps.slice(0, midPoint).forEach((step, index) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`P${step.stepOrder || index + 1}:`, margin + boxPadding, stepLeftY);
          doc.setFont('helvetica', 'normal');
          const stepLines = doc.splitTextToSize(step.stepDescription || '', twoColumnWidth - 10);
          doc.text(stepLines, margin + 6 + boxPadding, stepLeftY);
          stepLeftY += stepLines.length * lineHeight + compactSpacing;
          doc.text(`Resp: ${getEmployeeName(step.responsible)}`, margin + 6 + boxPadding, stepLeftY);
          stepLeftY += lineHeight;
          doc.text(`Fecha: ${formatDate(step.date) || 'N/A'}`, margin + 6 + boxPadding, stepLeftY);
          stepLeftY += lineHeight + compactSpacing;
        });

        // Right column steps
        let stepRightY = yPosition;
        sortedSteps.slice(midPoint).forEach((step, index) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`P${step.stepOrder || midPoint + index + 1}:`, margin + twoColumnWidth + columnSpacing + boxPadding, stepRightY);
          doc.setFont('helvetica', 'normal');
          const stepLines = doc.splitTextToSize(step.stepDescription || '', twoColumnWidth - 10);
          doc.text(stepLines, margin + twoColumnWidth + columnSpacing + 6 + boxPadding, stepRightY);
          stepRightY += stepLines.length * lineHeight + compactSpacing;
          doc.text(`Resp: ${getEmployeeName(step.responsible)}`, margin + twoColumnWidth + columnSpacing + 6 + boxPadding, stepRightY);
          stepRightY += lineHeight;
          doc.text(`Fecha: ${formatDate(step.date) || 'N/A'}`, margin + twoColumnWidth + columnSpacing + 6 + boxPadding, stepRightY);
          stepRightY += lineHeight + compactSpacing;
        });

        yPosition = Math.max(stepLeftY, stepRightY) + boxPadding;
        const stepsEndY = yPosition;
        
        // Draw box around procedure steps
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, stepsStartY - boxPadding, pageWidth - margin * 2, stepsEndY - stepsStartY);
        yPosition += sectionSpacing;
      }

      // Validations and Documents - Two Columns (Validations on left) (in box)
      const hasDocuments = pic.documents && pic.documents.length > 0;
      const hasValidations = pic.validations && pic.validations.length > 0;
      
      if (hasDocuments || hasValidations) {
        const sectionStartY = yPosition;
        
        // Left column - Validations
        let valY = sectionStartY;
        if (hasValidations) {
          valY = sectionStartY + boxPadding; // Add margin from top border
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Validación', margin + boxPadding, valY);
          valY += lineHeight + compactSpacing;
          
          doc.setFontSize(8);
          pic.validations.forEach((val, index) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`V${index + 1}:`, margin + boxPadding, valY);
            doc.setFont('helvetica', 'normal');
            const valLines = doc.splitTextToSize(val.validationDescription || '', twoColumnWidth - 10);
            doc.text(valLines, margin + 6 + boxPadding, valY);
            valY += valLines.length * lineHeight + compactSpacing;
            doc.text(`Resp: ${getEmployeeName(val.responsible)}`, margin + 6 + boxPadding, valY);
            valY += lineHeight;
            doc.text(`Fecha: ${formatDate(val.date) || 'N/A'}`, margin + 6 + boxPadding, valY);
            valY += lineHeight + compactSpacing;
          });
        } else {
          valY = sectionStartY;
        }

        // Right column - Documents
        let docY = sectionStartY;
        if (hasDocuments) {
          docY = sectionStartY + boxPadding; // Add margin from top border
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Documentos', margin + twoColumnWidth + columnSpacing + boxPadding, docY);
          docY += lineHeight + compactSpacing;
          
          doc.setFontSize(8);
          pic.documents.forEach((document) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${document.documentType || 'N/A'}`, margin + twoColumnWidth + columnSpacing + boxPadding, docY);
            doc.setFont('helvetica', 'normal');
            docY += lineHeight;
            doc.text(`Resp: ${getEmployeeName(document.responsible)}`, margin + twoColumnWidth + columnSpacing + 3 + boxPadding, docY);
            docY += lineHeight;
            doc.text(`Fecha: ${formatDate(document.date) || 'N/A'}`, margin + twoColumnWidth + columnSpacing + 3 + boxPadding, docY);
            docY += lineHeight + compactSpacing;
          });
        } else {
          docY = sectionStartY;
        }

        // Calculate max Y position to ensure no overlap with next section
        yPosition = Math.max(valY, docY) + boxPadding;
        const sectionEndY = yPosition;
        
        // Draw box around validations/documents
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, sectionStartY - boxPadding, pageWidth - margin * 2, sectionEndY - sectionStartY);
        yPosition += sectionSpacing;
      }

      // Approvals - Multiple Columns Side by Side (in box)
      if (pic.approvals && pic.approvals.length > 0) {
        const approvalsStartY = yPosition;
        yPosition += boxPadding; // Add margin from top border
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobaciones', margin + boxPadding, yPosition);
        yPosition += lineHeight + compactSpacing;

        doc.setFontSize(8);
        const approvalStartY = yPosition;
        const numColumns = 4; // Display in 4 columns
        const approvalColumnWidth = (pageWidth - margin * 2 - columnSpacing * (numColumns - 1) - boxPadding * 2) / numColumns;
        const columnYPositions = Array(numColumns).fill(approvalStartY);
        
        pic.approvals.forEach((approval, index) => {
          const columnIndex = index % numColumns;
          const xPosition = margin + boxPadding + columnIndex * (approvalColumnWidth + columnSpacing);
          let currentY = columnYPositions[columnIndex];
          
          // Name with better formatting
          doc.setFont('helvetica', 'bold');
          const approverName = getEmployeeName(approval.approverId);
          doc.text(approverName, xPosition, currentY);
          currentY += lineHeight + 1;
          
          // Comment with better formatting
          if (approval.comment) {
            doc.setFont('helvetica', 'normal');
            const commentLines = doc.splitTextToSize(approval.comment, approvalColumnWidth - 2);
            doc.text(commentLines, xPosition, currentY);
            currentY += commentLines.length * lineHeight + 1;
          }
          
          // Date with better formatting
          if (approval.approvalStatus?.toLowerCase() !== 'pending' && approval.responseDate) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(`Fecha: ${new Date(approval.responseDate).toLocaleDateString('es-MX')}`, xPosition, currentY);
            doc.setFontSize(8);
            currentY += lineHeight;
          }
          currentY += lineHeight; // More space between entries
          columnYPositions[columnIndex] = currentY;
        });

        // Move to next row after all approvals are complete
        yPosition = Math.max(...columnYPositions) + boxPadding;
        const approvalsEndY = yPosition;
        
        // Draw box around approvals
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, approvalsStartY - boxPadding, pageWidth - margin * 2, approvalsEndY - approvalsStartY);
        yPosition += sectionSpacing;
      }

      // Availability and Change Reason - Two Columns (separate row below approvals) (in box)
      const bottomRowStartY = yPosition;
      yPosition += boxPadding; // Add margin from top border
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Disponibilidad:', margin + boxPadding, yPosition);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const availabilityItems = [];
      if (pic.availability?.fixtures) availabilityItems.push('Herrajes');
      if (pic.availability?.testEquipment) availabilityItems.push('Equipo Prueba');
      if (pic.availability?.other) availabilityItems.push(`Otro: ${pic.availability.other}`);
      const availLines = doc.splitTextToSize(availabilityItems.length > 0 ? availabilityItems.join(', ') : 'Ninguna', twoColumnWidth - 35);
      doc.text(availLines, margin + 35 + boxPadding, yPosition);
      const availHeight = availLines.length * lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Motivo Cambio:', margin + twoColumnWidth + columnSpacing + boxPadding, yPosition);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const changeReasons = [];
      if (pic.changeReason?.safety) changeReasons.push('Seguridad');
      if (pic.changeReason?.delivery) changeReasons.push('Entrega');
      if (pic.changeReason?.productivity) changeReasons.push('Productividad');
      if (pic.changeReason?.quality) changeReasons.push('Calidad');
      if (pic.changeReason?.cost) changeReasons.push('Costo');
      if (pic.changeReason?.process) changeReasons.push('Proceso');
      if (pic.changeReason?.other) changeReasons.push(`Otro: ${pic.changeReason.other}`);
      const reasonLines = doc.splitTextToSize(changeReasons.length > 0 ? changeReasons.join(', ') : 'Ninguno', twoColumnWidth - 35);
      doc.text(reasonLines, margin + twoColumnWidth + columnSpacing + 35 + boxPadding, yPosition);
      const reasonHeight = reasonLines.length * lineHeight;

      yPosition = bottomRowStartY + Math.max(availHeight, reasonHeight) + boxPadding;
      const bottomRowEndY = yPosition;
      
      // Draw box around availability and change reason
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, bottomRowStartY - boxPadding, pageWidth - margin * 2, bottomRowEndY - bottomRowStartY);

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
                label="Fecha de Vencimiento"
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
              
                {pic.availability?.other && (
                  <TextField
                    fullWidth
                    label="Especificar"
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

