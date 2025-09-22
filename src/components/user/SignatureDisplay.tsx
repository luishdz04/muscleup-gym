// components/user/SignatureDisplay.tsx
'use client';

import React, { memo } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Tooltip,
  IconButton,
  Chip,
  Skeleton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Draw as SignatureIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Update as UpdateIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

interface ImageState {
  url: string;
  fileName: string;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  isFromStorage: boolean;
}

interface SignatureDisplayProps {
  signatureImage: ImageState;
  signature: File | null;
  signaturePreview: string;
  fileUploading: boolean;
  initializationComplete: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetryImageLoad: () => void;
}

const SignatureDisplay = memo<SignatureDisplayProps>(({
  signatureImage,
  signature,
  signaturePreview,
  fileUploading,
  initializationComplete,
  onFileChange,
  onRetryImageLoad
}) => {

  // Función para obtener la URL actual de la firma
  const getCurrentSignatureUrl = () => {
    // 1. Si hay archivo nuevo pendiente -> usar blob preview
    if (signature && signaturePreview) {
      return signaturePreview;
    }
    
    // 2. Si hay imagen válida del storage -> usar su URL
    if (signatureImage.isValid && signatureImage.url) {
      return signatureImage.url;
    }
    
    // 3. Sin firma
    return undefined;
  };

  const currentSignatureUrl = getCurrentSignatureUrl();

  // Mostrar skeleton mientras se inicializa
  if (!initializationComplete) {
    return (
      <Skeleton
        variant="rectangular"
        width="100%"
        height={120}
        sx={{ 
          bgcolor: colorTokens.neutral400,
          borderRadius: 2
        }}
      />
    );
  }

  // Si hay firma, mostrar la imagen
  if (currentSignatureUrl) {
    return (
      <Box sx={{ 
        position: 'relative', 
        width: '100%',
        bgcolor: colorTokens.neutral1200,
        borderRadius: 2,
        p: 2,
        boxShadow: `0 4px 15px ${colorTokens.neutral0}40`,
        border: `2px solid #9C27B040`
      }}>
        <Box 
          component="img"
          src={currentSignatureUrl}
          alt="Firma digital"
          sx={{ 
            maxWidth: '100%', 
            maxHeight: '100px',
            width: '100%',
            objectFit: 'contain',
            borderRadius: 1
          }}
        />
        
        {/* Chip de estado */}
        <Chip
          icon={signature ? <UpdateIcon /> : <VerifiedIcon />}
          label={signature ? "Pendiente" : "Verificada"}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: signature ? colorTokens.warning : colorTokens.success,
            color: colorTokens.neutral1200,
            fontWeight: 600,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { 
              color: colorTokens.neutral1200, 
              fontSize: 14 
            },
            ...(signature && {
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.8, transform: 'scale(1.05)' }
              },
              animation: 'pulse 2s infinite'
            })
          }}
        />
        
        {/* Botón de cambio de firma */}
        <IconButton
          component="label"
          size="small"
          disabled={fileUploading}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: `#9C27B0E6`,
            color: colorTokens.neutral1200,
            '&:hover': { 
              bgcolor: '#9C27B0',
              transform: 'scale(1.1)'
            },
            '&:disabled': {
              opacity: 0.5
            },
            transition: 'all 0.2s ease'
          }}
        >
          {fileUploading ? (
            <CircularProgress size={16} sx={{ color: colorTokens.neutral1200 }} />
          ) : (
            <>
              <PhotoCameraIcon fontSize="small" />
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={onFileChange}
                disabled={fileUploading}
              />
            </>
          )}
        </IconButton>
        
        {/* Botón de reintento si hay error */}
        {signatureImage.error && (
          <Tooltip title="Reintentar carga">
            <IconButton
              size="small"
              onClick={onRetryImageLoad}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: `${colorTokens.danger}E6`,
                color: colorTokens.neutral1200,
                '&:hover': { bgcolor: colorTokens.danger }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Estado sin firma
  return (
    <Box sx={{ 
      width: '100%',
      height: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      border: `2px dashed #9C27B040`,
      bgcolor: `#9C27B005`,
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: `#9C27B060`,
        bgcolor: `#9C27B010`
      }
    }}>
      {signatureImage.isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <CircularProgress size={24} sx={{ color: '#9C27B0' }} />
          <Typography variant="caption" sx={{ 
            color: '#9C27B0', 
            fontWeight: 500 
          }}>
            Cargando firma...
          </Typography>
        </Box>
      ) : signatureImage.error ? (
        <Box sx={{ textAlign: 'center' }}>
          <ErrorIcon sx={{ 
            color: colorTokens.danger, 
            mb: 1, 
            fontSize: 28 
          }} />
          <Typography variant="caption" sx={{ 
            color: colorTokens.danger, 
            display: 'block', 
            fontWeight: 500,
            mb: 1
          }}>
            Error: {signatureImage.error}
          </Typography>
          <Button
            size="small"
            onClick={onRetryImageLoad}
            startIcon={<RefreshIcon />}
            sx={{ 
              color: '#9C27B0', 
              fontWeight: 600,
              '&:hover': { bgcolor: `#9C27B010` }
            }}
          >
            Reintentar
          </Button>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <SignatureIcon sx={{ 
            color: `#9C27B060`, 
            fontSize: 32, 
            mb: 1 
          }} />
          <Typography variant="caption" sx={{ 
            color: `#9C27B080`, 
            fontWeight: 500, 
            display: 'block', 
            mb: 2 
          }}>
            Sin firma registrada
          </Typography>
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<PhotoCameraIcon />}
            disabled={fileUploading}
            sx={{
              borderColor: `#9C27B060`,
              color: '#9C27B0',
              '&:hover': {
                borderColor: '#9C27B0',
                bgcolor: `#9C27B010`
              },
              '&:disabled': {
                opacity: 0.5
              }
            }}
          >
            Subir Firma
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={onFileChange}
              disabled={fileUploading}
            />
          </Button>
        </Box>
      )}
    </Box>
  );
});

SignatureDisplay.displayName = 'SignatureDisplay';

export default SignatureDisplay;