// components/membership/BulkOperationPanel.tsx - ENTERPRISE v4.2 CORREGIDO
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

// ✅ IMPORT ENTERPRISE OBLIGATORIO - ELIMINAR DEFINICIÓN LOCAL
import { colorTokens } from '@/theme';

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
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
        border: `2px solid ${colorTokens.info}40`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.info}20`
      }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: { xs: 1.5, sm: 2 }, gap: { xs: 1.5, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <BatchIcon sx={{ color: colorTokens.info, fontSize: { xs: 24, sm: 28, md: 30 } }} />
            <Box>
              <Typography variant="h6" sx={{
                color: colorTokens.info,
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}>
                🧊 <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Modo Congelamiento Masivo Avanzado</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Modo Masivo</Box>
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {selectedCount} membresías seleccionadas • <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Gestión inteligente simplificada</Box>
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onCloseBulkMode}
            sx={{
              color: colorTokens.danger,
              borderColor: `${colorTokens.danger}60`,
              alignSelf: { xs: 'flex-end', sm: 'center' },
              '&:hover': {
                borderColor: colorTokens.danger,
                backgroundColor: `${colorTokens.danger}10`
              }
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
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
                  color: colorTokens.textOnBrand,
                  backgroundColor: colorTokens.info,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: colorTokens.infoHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${colorTokens.info}30`,
                    color: `${colorTokens.textDisabled}`
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
                  color: colorTokens.textOnBrand,
                  backgroundColor: colorTokens.success,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: colorTokens.successHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${colorTokens.success}30`,
                    color: `${colorTokens.textDisabled}`
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
              color: colorTokens.textPrimary,
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
              color: colorTokens.textPrimary,
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