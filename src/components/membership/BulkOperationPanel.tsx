// components/membership/BulkOperationPanel.tsx
'use client';

import React, { memo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  SelectAll as SelectAllIcon,
  ClearAll as ClearAllIcon,
  BatchPrediction as BatchIcon,
  Settings as ManualIcon,
  AutoMode as AutoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// ✅ PALETA DE COLORES UNIFICADA
const colorTokens = {
  // Colores base
  brand: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',
  
  // Escala neutra (Dark Theme)
  neutral0: '#0A0A0B',
  neutral50: '#0F1012',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral400: '#2C313B',
  neutral500: '#363C48',
  neutral600: '#424959',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1100: '#E8ECF5',
  neutral1200: '#FFFFFF',
  
  // Semánticos
  success: '#22C55E',
  danger: '#EF4444',
  info: '#38BDF8',
  warning: '#FFCC00', // Mismo que brand
};

interface Props {
  bulkMode: boolean;
  selectedCount: number;
  onCloseBulkMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkFreeze: (isManual: boolean) => void;
  onBulkUnfreeze: (isManual: boolean) => void;
  hasSelectedMemberships: boolean;
}

const BulkOperationPanel = memo<Props>(({
  bulkMode,
  selectedCount,
  onCloseBulkMode,
  onSelectAll,
  onClearSelection,
  onBulkFreeze,
  onBulkUnfreeze,
  hasSelectedMemberships
}) => {
  if (!bulkMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
        border: `2px solid ${colorTokens.info}40`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.info}20`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BatchIcon sx={{ color: colorTokens.info, fontSize: 30 }} />
            <Box>
              <Typography variant="h6" sx={{ 
                color: colorTokens.info, 
                fontWeight: 700 
              }}>
                🧊 Modo Congelamiento Masivo Avanzado
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                {selectedCount} membresías seleccionadas • Gestión inteligente simplificada
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onCloseBulkMode}
            sx={{ 
              color: colorTokens.danger,
              borderColor: `${colorTokens.danger}60`,
              '&:hover': {
                borderColor: colorTokens.danger,
                backgroundColor: `${colorTokens.danger}10`
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {/* Controles de Selección */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack spacing={1}>
              <Button
                startIcon={<SelectAllIcon />}
                onClick={onSelectAll}
                fullWidth
                sx={{ 
                  color: colorTokens.info,
                  borderColor: `${colorTokens.info}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: colorTokens.info,
                    backgroundColor: `${colorTokens.info}10`
                  }
                }}
                variant="outlined"
                size="small"
              >
                Seleccionar Todas
              </Button>

              <Button
                startIcon={<ClearAllIcon />}
                onClick={onClearSelection}
                fullWidth
                sx={{ 
                  color: colorTokens.neutral800,
                  borderColor: `${colorTokens.neutral800}40`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: colorTokens.neutral800,
                    backgroundColor: `${colorTokens.neutral800}10`
                  }
                }}
                variant="outlined"
                size="small"
              >
                Limpiar
              </Button>
            </Stack>
          </Grid>

          {/* Operaciones de Congelamiento */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1}>
              <Button
                startIcon={<AutoIcon />}
                onClick={() => onBulkFreeze(false)}
                disabled={!hasSelectedMemberships}
                fullWidth
                sx={{ 
                  color: colorTokens.neutral1200,
                  backgroundColor: colorTokens.info,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: colorTokens.info,
                    filter: 'brightness(1.1)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${colorTokens.info}30`,
                    color: `${colorTokens.neutral1200}50`
                  }
                }}
                variant="contained"
                size="small"
              >
                🧊 Congelar Automático
              </Button>

              <Button
                startIcon={<ManualIcon />}
                onClick={() => onBulkFreeze(true)}
                disabled={!hasSelectedMemberships}
                fullWidth
                sx={{ 
                  color: colorTokens.info,
                  borderColor: `${colorTokens.info}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: colorTokens.info,
                    backgroundColor: `${colorTokens.info}10`
                  },
                  '&:disabled': {
                    borderColor: `${colorTokens.info}30`,
                    color: `${colorTokens.info}50`
                  }
                }}
                variant="outlined"
                size="small"
              >
                🧊 Congelar Manual
              </Button>
            </Stack>
          </Grid>

          {/* Operaciones de Reactivación */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1}>
              <Button
                startIcon={<AutoIcon />}
                onClick={() => onBulkUnfreeze(false)}
                disabled={!hasSelectedMemberships}
                fullWidth
                sx={{ 
                  color: colorTokens.neutral1200,
                  backgroundColor: colorTokens.success,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: colorTokens.success,
                    filter: 'brightness(1.1)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${colorTokens.success}30`,
                    color: `${colorTokens.neutral1200}50`
                  }
                }}
                variant="contained"
                size="small"
              >
                🔄 Reactivar Automático
              </Button>

              <Button
                startIcon={<ManualIcon />}
                onClick={() => onBulkUnfreeze(true)}
                disabled={!hasSelectedMemberships}
                fullWidth
                sx={{ 
                  color: colorTokens.success,
                  borderColor: `${colorTokens.success}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: colorTokens.success,
                    backgroundColor: `${colorTokens.success}10`
                  },
                  '&:disabled': {
                    borderColor: `${colorTokens.success}30`,
                    color: `${colorTokens.success}50`
                  }
                }}
                variant="outlined"
                size="small"
              >
                🔄 Reactivar Manual
              </Button>
            </Stack>
          </Grid>

          {/* Contador de Seleccionadas */}
          <Grid size={{ xs: 12, md: 1 }}>
            <Box sx={{
              background: `${colorTokens.brand}10`,
              border: `1px solid ${colorTokens.brand}30`,
              borderRadius: 2,
              p: 1,
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.brand,
                fontWeight: 800
              }}>
                {selectedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral800 }}>
                Seleccionadas
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Información de Ayuda */}
        {hasSelectedMemberships && (
          <Alert 
            severity="info"
            sx={{
              mt: 2,
              backgroundColor: `${colorTokens.info}05`,
              color: colorTokens.neutral1200,
              border: `1px solid ${colorTokens.info}20`,
              '& .MuiAlert-icon': { color: colorTokens.info }
            }}
          >
            <Typography variant="body2">
              <strong>💡 Modos Disponibles:</strong><br/>
              <strong>🤖 Automático:</strong> El sistema calcula automáticamente los días y fechas<br/>
              <strong>⚙️ Manual:</strong> Usted especifica cuántos días congelar/agregar
            </Typography>
          </Alert>
        )}

        {/* Mensaje cuando no hay selecciones */}
        {!hasSelectedMemberships && (
          <Alert 
            severity="warning"
            sx={{
              mt: 2,
              backgroundColor: `${colorTokens.warning}05`,
              color: colorTokens.neutral1200,
              border: `1px solid ${colorTokens.warning}20`,
              '& .MuiAlert-icon': { color: colorTokens.warning }
            }}
          >
            <Typography variant="body2">
              <strong>⚠️ Seleccione membresías:</strong> Marque las casillas para activar las operaciones masivas. Solo se pueden seleccionar membresías activas o congeladas.
            </Typography>
          </Alert>
        )}
      </Paper>
    </motion.div>
  );
});

BulkOperationPanel.displayName = 'BulkOperationPanel';

export default BulkOperationPanel;
