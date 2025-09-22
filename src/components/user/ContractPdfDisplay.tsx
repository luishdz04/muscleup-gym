// components/user/ContractPdfDisplay.tsx
'use client';

import React, { memo, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

interface ContractPdfDisplayProps {
  contractPdfUrl?: string;
  contractLastUpdated?: string | null;
  initializationComplete: boolean;
  firstName: string;
  lastName: string;
}

const ContractPdfDisplay = memo<ContractPdfDisplayProps>(({
  contractPdfUrl,
  contractLastUpdated,
  initializationComplete,
  firstName,
  lastName
}) => {

  // Función para manejar visualización de PDF
  const handlePdfView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!contractPdfUrl) return;
    
    if (contractPdfUrl.startsWith('blob:')) {
      window.open(contractPdfUrl, '_blank', 'noopener,noreferrer');
    } else {
      const link = document.createElement('a');
      link.href = contractPdfUrl;
      link.download = `Contrato_${firstName}_${lastName}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [contractPdfUrl, firstName, lastName]);

  // Mostrar skeleton mientras se inicializa
  if (!initializationComplete) {
    return (
      <Box sx={{ 
        width: '100%',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        bgcolor: colorTokens.neutral200,
        border: `2px dashed ${colorTokens.neutral400}`
      }}>
        <CircularProgress size={28} sx={{ color: colorTokens.info }} />
      </Box>
    );
  }

  // Si hay contrato disponible
  if (contractPdfUrl) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        p: 3,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${colorTokens.info}15, #1565C015)`,
        border: `2px solid ${colorTokens.info}40`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon sx={{ fontSize: 40, color: colorTokens.info }} />
          <Box>
            <Typography variant="h6" sx={{ 
              color: colorTokens.info, 
              fontWeight: 700,
              mb: 0.5
            }}>
              Contrato Disponible
            </Typography>
            <Typography variant="caption" sx={{ 
              color: colorTokens.neutral900 
            }}>
              Documento oficial generado
            </Typography>
          </Box>
        </Box>
        
        {/* Información de última actualización */}
        {contractLastUpdated && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${colorTokens.info}20`,
            border: `1px solid ${colorTokens.info}40`
          }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: colorTokens.info }} />
            <Typography variant="caption" sx={{ 
              color: colorTokens.neutral900,
              fontSize: '0.75rem'
            }}>
              Actualizado: {new Date(contractLastUpdated).toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        )}
        
        {/* Botón de visualización */}
        <Button
          variant="contained"
          onClick={handlePdfView}
          startIcon={<VisibilityIcon />}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.info}, #1565C0)`,
            color: colorTokens.neutral1200,
            px: 3,
            py: 1,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: `0 4px 15px ${colorTokens.info}40`,
            '&:hover': {
              background: `linear-gradient(135deg, #1565C0, ${colorTokens.info})`,
              boxShadow: `0 6px 20px ${colorTokens.info}50`,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Ver Contrato
        </Button>
      </Box>
    );
  }

  // Estado sin contrato
  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      border: `2px dashed ${colorTokens.info}40`,
      bgcolor: `${colorTokens.info}05`,
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: `${colorTokens.info}60`,
        bgcolor: `${colorTokens.info}10`
      }
    }}>
      <AssignmentIcon sx={{ 
        color: `${colorTokens.info}60`, 
        fontSize: 36, 
        mb: 1 
      }} />
      <Typography variant="caption" sx={{ 
        color: `${colorTokens.info}80`, 
        fontWeight: 500,
        textAlign: 'center'
      }}>
        Se generará automáticamente al guardar
      </Typography>
    </Box>
  );
});

ContractPdfDisplay.displayName = 'ContractPdfDisplay';

export default ContractPdfDisplay;