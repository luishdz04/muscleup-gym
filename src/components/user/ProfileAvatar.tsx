// components/user/ProfileAvatar.tsx
'use client';

import React, { memo, useCallback } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
  Skeleton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Error as ErrorIcon,
  Update as UpdateIcon
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

interface ProfileAvatarProps {
  firstName: string;
  profileImage: ImageState;
  profilePicture: File | null;
  profilePicturePreview: string;
  fileUploading: boolean;
  initializationComplete: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetryImageLoad: () => void;
}

const ProfileAvatar = memo<ProfileAvatarProps>(({
  firstName,
  profileImage,
  profilePicture,
  profilePicturePreview,
  fileUploading,
  initializationComplete,
  onFileChange,
  onRetryImageLoad
}) => {

  // Función para obtener la URL actual de la imagen con lógica optimizada
  const getCurrentImageUrl = useCallback(() => {
    // 1. Si hay archivo nuevo pendiente -> usar blob preview
    if (profilePicture && profilePicturePreview) {
      return profilePicturePreview;
    }
    
    // 2. Si hay imagen válida del storage -> usar su URL
    if (profileImage.isValid && profileImage.url) {
      return profileImage.url;
    }
    
    // 3. Sin imagen
    return undefined;
  }, [profilePicture, profilePicturePreview, profileImage.isValid, profileImage.url]);

  const currentImageUrl = getCurrentImageUrl();

  // Mostrar skeleton mientras se inicializa
  if (!initializationComplete) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Skeleton
          variant="circular"
          width={120}
          height={120}
          sx={{ 
            bgcolor: colorTokens.neutral400,
            mx: 'auto',
            mb: 2
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${colorTokens.brand}, #E6B800)`,
          borderRadius: '50%',
          padding: '4px',
          boxShadow: `0 8px 25px ${colorTokens.brand}40`
        }}>
          <Avatar 
            src={currentImageUrl}
            sx={{ 
              width: 120, 
              height: 120,
              border: `3px solid ${colorTokens.neutral100}`,
              fontSize: '2.5rem',
              fontWeight: 'bold',
              bgcolor: colorTokens.neutral200,
              color: colorTokens.brand,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            {firstName && firstName[0].toUpperCase()}
          </Avatar>
        </Box>
        
        {/* Chip de archivo pendiente */}
        {profilePicture && (
          <Chip
            icon={<UpdateIcon />}
            label="Pendiente"
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              bgcolor: colorTokens.warning,
              color: colorTokens.neutral0,
              fontSize: '0.7rem',
              height: 24,
              border: `1px solid #CCA300`,
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.8, transform: 'scale(1.05)' }
              },
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {/* Indicador de carga */}
        {(profileImage.isLoading || fileUploading) && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: `${colorTokens.neutral0}DD`
          }}>
            <CircularProgress 
              size={36} 
              sx={{ color: colorTokens.brand }} 
            />
          </Box>
        )}
        
        {/* Indicador de error */}
        {profileImage.error && !profileImage.isLoading && (
          <Tooltip title={profileImage.error}>
            <Box sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: colorTokens.danger,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${colorTokens.danger}40`,
              border: `2px solid ${colorTokens.neutral0}`,
              cursor: 'pointer'
            }}
            onClick={onRetryImageLoad}
            >
              <ErrorIcon sx={{ fontSize: 16, color: colorTokens.neutral1200 }} />
            </Box>
          </Tooltip>
        )}

        {/* Botón de cambio de foto */}
        <IconButton 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: `linear-gradient(135deg, ${colorTokens.brand}, #E6B800)`,
            color: colorTokens.neutral0,
            width: 40,
            height: 40,
            border: `3px solid ${colorTokens.neutral100}`,
            boxShadow: `0 4px 20px ${colorTokens.brand}40`,
            '&:hover': { 
              background: `linear-gradient(135deg, #E6B800, #CCA300)`,
              transform: 'scale(1.1)',
              boxShadow: `0 6px 25px ${colorTokens.brand}60`,
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            },
            transition: 'all 0.2s ease'
          }}
          component="label"
          disabled={fileUploading}
        >
          {fileUploading ? (
            <CircularProgress size={20} sx={{ color: colorTokens.neutral0 }} />
          ) : (
            <>
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={onFileChange}
                disabled={fileUploading}
              />
              <PhotoCameraIcon sx={{ fontSize: 20 }} />
            </>
          )}
        </IconButton>
      </Box>
    </Box>
  );
});

ProfileAvatar.displayName = 'ProfileAvatar';

export default ProfileAvatar;