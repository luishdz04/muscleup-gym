// ===================================================================
// components/modals/ImageViewerModal.tsx - Modal para ver imágenes
// ===================================================================

'use client';

import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface ImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  fileName?: string;
}

export default function ImageViewerModal({
  open,
  onClose,
  imageUrl,
  title = 'Imagen',
  fileName,
}: ImageViewerModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'imagen.jpg';
    link.click();
  };

  const handleReset = () => {
    setZoom(1);
  };

  if (!imageUrl) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: '80vh',
        }
      }}
    >
      {/* HEADER CON CONTROLES */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white' }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            sx={{ color: 'white' }}
          >
            <ZoomOutIcon />
          </IconButton>
          
          <Typography variant="body2" sx={{ color: 'white', minWidth: 60, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          
          <IconButton
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            sx={{ color: 'white' }}
          >
            <ZoomInIcon />
          </IconButton>

          <IconButton
            onClick={handleDownload}
            sx={{ color: 'white' }}
          >
            <DownloadIcon />
          </IconButton>

          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          minHeight: '80vh',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            pt: 6, // Espacio para el header
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-in-out',
              cursor: zoom > 1 ? 'grab' : 'default',
            }}
            onClick={handleReset}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}