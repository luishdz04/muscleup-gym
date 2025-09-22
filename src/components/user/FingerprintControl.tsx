// components/user/FingerprintControl.tsx
'use client';

import React, { memo } from 'react';
import {
  Box,
  Avatar,
  Button,
  Typography,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  CleaningServices as CleaningServicesIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

interface FingerprintState {
  status: 'none' | 'captured' | 'saving' | 'saved' | 'error';
  deviceUserId: string | null;
  fingerIndex: number | null;
  fingerName: string | null;
  message: string | null;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pendingData: any | null;
}

interface FingerprintControlProps {
  fingerprintState: FingerprintState;
  hasFingerprint: boolean;
  isDeletingFingerprint: boolean;
  onFingerprintDialogOpen: () => void;
  onDeleteFingerprint: () => void;
  onDeleteAllFingerprints: () => void;
  userId?: string;
}

const FingerprintControl = memo<FingerprintControlProps>(({
  fingerprintState,
  hasFingerprint,
  isDeletingFingerprint,
  onFingerprintDialogOpen,
  onDeleteFingerprint,
  onDeleteAllFingerprints,
  userId
}) => {

  const hasPendingFingerprint = fingerprintState.status === 'captured';
  const isSyncing = fingerprintState.syncStatus === 'syncing';
  const isDeleting = isDeletingFingerprint;
  
  // Determinar estado visual
  const getStatusColor = () => {
    if (hasFingerprint) return colorTokens.success;
    if (hasPendingFingerprint) return colorTokens.warning;
    return colorTokens.danger;
  };
  
  const getStatusIcon = () => {
    if (hasFingerprint && fingerprintState.syncStatus === 'success') {
      return <VerifiedIcon sx={{ color: colorTokens.success, fontSize: '1rem' }} />;
    }
    if (hasFingerprint && fingerprintState.syncStatus === 'error') {
      return <ErrorIcon sx={{ color: colorTokens.warning, fontSize: '1rem' }} />;
    }
    if (hasFingerprint) {
      return <SecurityIcon sx={{ color: colorTokens.info, fontSize: '1rem' }} />;
    }
    if (hasPendingFingerprint) {
      return <AccessTimeIcon sx={{ color: colorTokens.warning, fontSize: '1rem' }} />;
    }
    return <ErrorIcon sx={{ color: colorTokens.danger, fontSize: '1rem' }} />;
  };
  
  const getStatusText = () => {
    if (hasFingerprint && fingerprintState.syncStatus === 'success') {
      return 'Registrada + F22 sincronizado';
    }
    if (hasFingerprint && fingerprintState.syncStatus === 'error') {
      return 'En BD - Error sincronizando F22';
    }
    if (hasFingerprint) {
      return 'Registrada en BD';
    }
    if (hasPendingFingerprint) {
      return 'Capturada - Pendiente de guardar';
    }
    return 'No registrada';
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 2,
      borderRadius: 2,
      border: `2px solid ${getStatusColor()}40`,
      bgcolor: `${getStatusColor()}10`,
      transition: 'all 0.3s ease'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{
          bgcolor: getStatusColor(),
          color: colorTokens.neutral1200,
          width: 40,
          height: 40
        }}>
          <FingerprintIcon />
        </Avatar>
        
        <Box>
          <Typography variant="subtitle2" sx={{ 
            color: colorTokens.neutral1200, 
            fontWeight: 600,
            mb: 0.5
          }}>
            Huella Dactilar (F22 SDK)
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            <Typography variant="caption" sx={{ 
              color: getStatusColor(), 
              fontWeight: 500 
            }}>
              {getStatusText()}
            </Typography>
          </Box>
          
          {/* Mensajes adicionales */}
          {fingerprintState.message && (
            <Typography variant="caption" sx={{ 
              color: colorTokens.neutral900,
              fontSize: '0.7rem',
              display: 'block',
              mt: 0.5
            }}>
              {fingerprintState.message}
            </Typography>
          )}
          
          {fingerprintState.error && (
            <Typography variant="caption" sx={{ 
              color: colorTokens.danger,
              fontSize: '0.7rem',
              display: 'block',
              mt: 0.5
            }}>
              {fingerprintState.error}
            </Typography>
          )}
          
          {/* Indicador de datos pendientes */}
          {hasPendingFingerprint && (
            <Box sx={{ mt: 0.5 }}>
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                label={`${fingerprintState.fingerName || 'Huella'} lista para guardar`}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.brand}20`,
                  color: colorTokens.brand,
                  border: `1px solid ${colorTokens.brand}40`,
                  fontSize: '0.7rem',
                  height: 20,
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                  },
                  animation: 'pulse 2s infinite'
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
        {/* Botón principal */}
        <Tooltip title={hasFingerprint ? "Reemplazar huella" : "Registrar nueva huella"}>
          <Button
            variant="contained"
            size="small"
            onClick={onFingerprintDialogOpen}
            disabled={!userId || isDeleting || isSyncing}
            startIcon={
              isSyncing ? (
                <CircularProgress size={16} sx={{ color: colorTokens.neutral0 }} />
              ) : (
                <FingerprintIcon />
              )
            }
            sx={{
              bgcolor: hasFingerprint ? colorTokens.info : colorTokens.brand,
              color: colorTokens.neutral0,
              fontWeight: 600,
              px: 2,
              minWidth: '120px',
              '&:hover': {
                bgcolor: hasFingerprint ? '#1565C0' : '#E6B800',
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 15px ${hasFingerprint ? colorTokens.info : colorTokens.brand}40`
              },
              '&:disabled': {
                bgcolor: colorTokens.neutral400,
                color: colorTokens.neutral700
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isSyncing ? 'Sincronizando...' : hasFingerprint ? 'Reemplazar' : 'Registrar'}
          </Button>
        </Tooltip>
        
        {/* Botón eliminar específico */}
        {(hasFingerprint || hasPendingFingerprint) && (
          <Tooltip title="Eliminar huella actual">
            <Button
              variant="outlined"
              size="small"
              onClick={onDeleteFingerprint}
              disabled={!userId || isDeleting || isSyncing}
              startIcon={
                isDeleting ? (
                  <CircularProgress size={16} sx={{ color: colorTokens.danger }} />
                ) : (
                  <DeleteIcon />
                )
              }
              sx={{
                borderColor: colorTokens.danger,
                color: colorTokens.danger,
                fontWeight: 600,
                px: 2,
                minWidth: '120px',
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: `${colorTokens.danger}10`,
                  borderColor: '#D32F2F',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  borderColor: colorTokens.neutral400,
                  color: colorTokens.neutral700
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </Tooltip>
        )}

        {/* Botón limpiar todas */}
        {hasFingerprint && (
          <Tooltip title="Eliminar TODAS las huellas del usuario">
            <Button
              variant="outlined"
              size="small"
              onClick={onDeleteAllFingerprints}
              disabled={!userId || isDeleting || isSyncing}
              startIcon={
                isDeleting ? (
                  <CircularProgress size={16} sx={{ color: colorTokens.danger }} />
                ) : (
                  <CleaningServicesIcon />
                )
              }
              sx={{
                borderColor: colorTokens.danger,
                color: colorTokens.danger,
                fontWeight: 600,
                px: 2,
                minWidth: '120px',
                fontSize: '0.7rem',
                background: `${colorTokens.danger}05`,
                '&:hover': {
                  bgcolor: `${colorTokens.danger}15`,
                  borderColor: '#D32F2F',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  borderColor: colorTokens.neutral400,
                  color: colorTokens.neutral700
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isDeleting ? 'Limpiando...' : 'Limpiar TODAS'}
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

FingerprintControl.displayName = 'FingerprintControl';

export default FingerprintControl;