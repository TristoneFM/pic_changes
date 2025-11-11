import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { useCheckPdfExists } from '@/hooks/usePics';

// Adobe-style PDF icon component
const AdobePdfIcon = ({ size = 20 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      backgroundColor: '#ED1C24', // Adobe red
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '2px',
      color: 'white',
      fontSize: `${size * 0.35}px`,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1,
    }}
  >
    PDF
  </Box>
);

export default function PdfIconButton({ picId, onClick }) {
  const { data: pdfExists, isLoading } = useCheckPdfExists(picId);

  // Don't show icon if PDF doesn't exist or is still loading
  if (isLoading || !pdfExists) {
    return null;
  }

  return (
    <Tooltip title="Ver PDF">
      <IconButton 
        size="small" 
        onClick={onClick}
        sx={{
          padding: '4px',
          '&:hover': {
            backgroundColor: 'rgba(237, 28, 36, 0.08)', // Light red on hover
            '& .adobe-pdf-icon': {
              backgroundColor: '#C41E3A', // Darker red on hover
            },
          },
        }}
      >
        <Box className="adobe-pdf-icon">
          <AdobePdfIcon size={20} />
        </Box>
      </IconButton>
    </Tooltip>
  );
}

