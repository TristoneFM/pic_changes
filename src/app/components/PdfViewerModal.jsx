import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function PdfViewerModal({ open, onClose, pdfPath, picId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filePath, setFilePath] = useState(pdfPath);

  // Fetch file path if not provided
  useEffect(() => {
    if (open && picId && !pdfPath) {
      setLoading(true);
      setError(null);
      const fetchFilePath = async () => {
        try {
          console.log('Fetching file for PIC ID:', picId);
          const response = await fetch(`/api/pics/${picId}/file`);
          const data = await response.json();
          console.log('File API response:', data);
          
          if (response.ok) {
            if (data.exists && data.filePath) {
              setFilePath(data.filePath);
              setLoading(true); // Keep loading until iframe loads
            } else {
              setError('No se encontró el archivo PDF para este PIC.');
              setLoading(false);
              if (data.debug) {
                console.log('Debug info:', data.debug);
              }
            }
          } else {
            setError(data.error || 'Error al buscar el archivo PDF.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching file path:', err);
          setError('Error al buscar el archivo PDF.');
          setLoading(false);
        }
      };
      fetchFilePath();
    } else if (pdfPath) {
      setFilePath(pdfPath);
      setLoading(true);
    } else if (!picId) {
      setError('No se proporcionó un ID de PIC.');
      setLoading(false);
    }
  }, [open, picId, pdfPath]);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Error al cargar el PDF. El archivo puede no existir.');
  };

  const handleClose = () => {
    setLoading(true);
    setError(null);
    setFilePath(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Ver PDF - PIC #{picId}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, position: 'relative', height: 'calc(90vh - 64px)', minHeight: 400 }}>
        {loading && !error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : filePath ? (
          <iframe
            src={filePath}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            onLoad={handleLoad}
            onError={handleError}
            title={`PDF Viewer - PIC ${picId}`}
          />
        ) : (
          <Box sx={{ p: 2 }}>
            <Alert severity="warning">No se encontró el archivo PDF para este PIC.</Alert>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

