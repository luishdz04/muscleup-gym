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
import { darkProTokens } from '@/constants/tokens';

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
        background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
        border: `2px solid ${darkProTokens.info}40`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${darkProTokens.info}20`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BatchIcon sx={{ color: darkProTokens.info, fontSize: 30 }} />
            <Box>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 700 
              }}>
                🧊 Modo Congelamiento Masivo Avanzado
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                {selectedCount} membresías seleccionadas • Gestión inteligente simplificada
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onCloseBulkMode}
            sx={{ 
              color: darkProTokens.error,
              borderColor: `${darkProTokens.error}60`,
              '&:hover': {
                borderColor: darkProTokens.error,
                backgroundColor: `${darkProTokens.error}10`
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
                  color: darkProTokens.info,
                  borderColor: `${darkProTokens.info}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: darkProTokens.info,
                    backgroundColor: `${darkProTokens.info}10`
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
                  color: darkProTokens.textSecondary,
                  borderColor: `${darkProTokens.textSecondary}40`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: darkProTokens.textSecondary,
                    backgroundColor: `${darkProTokens.textSecondary}10`
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
                  color: darkProTokens.textPrimary,
                  backgroundColor: darkProTokens.info,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: darkProTokens.infoHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${darkProTokens.info}30`,
                    color: `${darkProTokens.textPrimary}50`
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
                  color: darkProTokens.info,
                  borderColor: `${darkProTokens.info}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: darkProTokens.info,
                    backgroundColor: `${darkProTokens.info}10`
                  },
                  '&:disabled': {
                    borderColor: `${darkProTokens.info}30`,
                    color: `${darkProTokens.info}50`
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
                  color: darkProTokens.textPrimary,
                  backgroundColor: darkProTokens.success,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: darkProTokens.successHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    backgroundColor: `${darkProTokens.success}30`,
                    color: `${darkProTokens.textPrimary}50`
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
                  color: darkProTokens.success,
                  borderColor: `${darkProTokens.success}60`,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: darkProTokens.success,
                    backgroundColor: `${darkProTokens.success}10`
                  },
                  '&:disabled': {
                    borderColor: `${darkProTokens.success}30`,
                    color: `${darkProTokens.success}50`
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
              background: `${darkProTokens.primary}10`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 2,
              p: 1,
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.primary,
                fontWeight: 800
              }}>
                {selectedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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
              backgroundColor: `${darkProTokens.info}05`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.info}20`,
              '& .MuiAlert-icon': { color: darkProTokens.info }
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
              backgroundColor: `${darkProTokens.warning}05`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.warning}20`,
              '& .MuiAlert-icon': { color: darkProTokens.warning }
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
