// components/membership/BulkOperationModal.tsx - MODAL CON SLIDER CORREGIDO
'use client';

import React, { memo, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  TextField,
  Slider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as ManualIcon,
  AutoMode as AutoIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { BulkFreezeOperation, BulkPreview } from '@/types/membership';

interface Props {
  open: boolean;
  onClose: () => void;
  operation: BulkFreezeOperation;
  onOperationChange: (operation: Partial<BulkFreezeOperation>) => void;
  onExecute: () => void;
  loading: boolean;
  progress: number;
  results: { success: number; failed: number; errors: string[] };
  preview: BulkPreview[];
  showPreview: boolean;
  formatDisplayDate: (date: string) => string;
  onPreviewUpdate?: () => void;
}

const BulkOperationModal = memo<Props>(({
  open,
  onClose,
  operation,
  onOperationChange,
  onExecute,
  loading,
  progress,
  results,
  preview,
  showPreview,
  formatDisplayDate,
  onPreviewUpdate
}) => {
  // ✅ REF PARA DEBOUNCE
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ EFECTO PARA ACTUALIZAR VISTA PREVIA - MEJORADO
  useEffect(() => {
    if (operation.action === 'freeze' && 
        operation.mode === 'manual' && 
        operation.freezeDays && 
        operation.freezeDays > 0 && 
        showPreview &&
        onPreviewUpdate &&
        open) { // Solo cuando el modal está abierto
      
      // Limpiar timeout previo
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce de 200ms para evitar muchas llamadas
      debounceRef.current = setTimeout(() => {
        onPreviewUpdate();
      }, 200);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [operation.freezeDays, operation.action, operation.mode, showPreview, onPreviewUpdate, open]);

  const getBulkOperationTitle = () => {
    const actionText = operation.action === 'freeze' ? 'Congelamiento' : 'Reactivación';
    const modeText = operation.mode === 'manual' ? 'Manual' : 'Automático';
    const icon = operation.action === 'freeze' ? '🧊' : '🔄';
    return `${icon} ${actionText} Masivo ${modeText}`;
  };

  // ✅ HANDLER DEL SLIDER MEJORADO
  const handleSliderChange = useCallback((event: Event, value: number | number[]) => {
    const days = Array.isArray(value) ? value[0] : value;
    
    // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
    onOperationChange({ freezeDays: days });
    
    // ✅ LA VISTA PREVIA SE ACTUALIZA VÍA useEffect CON DEBOUNCE
  }, [onOperationChange]);

  // ✅ HANDLER PARA COMMIT FINAL (cuando se suelta el slider)
  const handleSliderChangeCommitted = useCallback((event: Event | React.SyntheticEvent, value: number | number[]) => {
    const days = Array.isArray(value) ? value[0] : value;
    
    // Limpiar cualquier debounce pendiente
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Actualizar inmediatamente al soltar
    if (operation.action === 'freeze' && 
        operation.mode === 'manual' && 
        onPreviewUpdate && 
        days > 0) {
      onPreviewUpdate();
    }
  }, [operation.action, operation.mode, onPreviewUpdate]);

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${operation.action === 'freeze' ? colorTokens.info : colorTokens.success}50`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: operation.action === 'freeze' ? colorTokens.info : colorTokens.success, 
        fontWeight: 800,
        fontSize: '1.8rem',
        textAlign: 'center',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {operation.mode === 'manual' ? 
            <ManualIcon sx={{ fontSize: 40 }} /> : 
            <AutoIcon sx={{ fontSize: 40 }} />
          }
          {getBulkOperationTitle()}
        </Box>
        <IconButton 
          onClick={onClose}
          disabled={loading}
          sx={{ color: colorTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {!loading ? (
          <Box>
            {/* ✅ ALERTA DE ADVERTENCIA */}
            <Alert 
              severity="warning"
              sx={{
                backgroundColor: `${colorTokens.warning}10`,
                color: colorTokens.textPrimary,
                border: `1px solid ${colorTokens.warning}30`,
                '& .MuiAlert-icon': { color: colorTokens.warning },
                mb: 3
              }}
            >
              <Typography variant="body1">
                <strong>⚠️ Operación Masiva {operation.mode === 'manual' ? 'Manual' : 'Automática'}:</strong> Esta acción{' '}
                {operation.action === 'freeze' ? 
                  `congelará ${operation.membershipIds.length} membresía${operation.membershipIds.length > 1 ? 's' : ''}` :
                  `reactivará ${operation.membershipIds.length} membresía${operation.membershipIds.length > 1 ? 's' : ''}`
                }.
                {operation.mode === 'manual' && operation.action === 'freeze' && (
                  <>
                    <br/><strong>⚙️ Modo Manual:</strong> Se agregarán <strong>{operation.freezeDays || 1} días</strong> a la fecha de vencimiento.
                  </>
                )}
                {operation.action === 'unfreeze' && (
                  <>
                    <br/><strong>🔄 Reactivación:</strong> Se agregarán automáticamente los días que estuvo congelada.
                  </>
                )}
              </Typography>
            </Alert>

            {/* ✅ CONFIGURACIÓN PARA CONGELAMIENTO MANUAL */}
            {operation.mode === 'manual' && operation.action === 'freeze' && (
              <Card sx={{
                background: `${colorTokens.info}10`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.info,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <AccessTimeIcon />
                    ⚙️ Configuración de Congelamiento Manual
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ 
                      color: colorTokens.textPrimary,
                      fontWeight: 600,
                      mb: 2
                    }}>
                      Días a congelar: <span style={{ 
                        color: colorTokens.info, 
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        background: `${colorTokens.info}20`,
                        borderRadius: '8px',
                        border: `2px solid ${colorTokens.info}40`
                      }}>
                        {operation.freezeDays || 1} día{(operation.freezeDays || 1) > 1 ? 's' : ''}
                      </span>
                    </Typography>
                    
                    <Slider
                      value={operation.freezeDays || 1}
                      onChange={handleSliderChange}
                      onChangeCommitted={handleSliderChangeCommitted}
                      min={1}
                      max={90}
                      step={1}
                      marks={[
                        { value: 1, label: '1 día' },
                        { value: 7, label: '1 semana' },
                        { value: 15, label: '15 días' },
                        { value: 30, label: '1 mes' },
                        { value: 60, label: '2 meses' },
                        { value: 90, label: '3 meses' }
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value} día${value > 1 ? 's' : ''}`}
                      sx={{
                        color: colorTokens.info,
                        height: 8,
                        '& .MuiSlider-thumb': {
                          backgroundColor: colorTokens.info,
                          border: `3px solid ${colorTokens.textPrimary}`,
                          width: 28,
                          height: 28,
                          boxShadow: `0 4px 16px ${colorTokens.info}50`,
                          '&:hover': {
                            boxShadow: `0 0 0 12px ${colorTokens.info}20`
                          },
                          '&.Mui-focusVisible': {
                            boxShadow: `0 0 0 12px ${colorTokens.info}30`
                          }
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: colorTokens.info,
                          height: 8,
                          border: 'none'
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: colorTokens.neutral400,
                          height: 8
                        },
                        '& .MuiSlider-mark': {
                          backgroundColor: colorTokens.textSecondary,
                          width: 4,
                          height: 4,
                          borderRadius: '50%'
                        },
                        '& .MuiSlider-markActive': {
                          backgroundColor: colorTokens.info
                        },
                        '& .MuiSlider-markLabel': {
                          color: colorTokens.textSecondary,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: colorTokens.info,
                          color: colorTokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          '&:before': {
                            borderColor: `${colorTokens.info} transparent`
                          }
                        }
                      }}
                    />
                  </Box>

                  <Alert 
                    severity="info"
                    sx={{
                      backgroundColor: `${colorTokens.info}05`,
                      color: colorTokens.textPrimary,
                      border: `1px solid ${colorTokens.info}20`,
                      '& .MuiAlert-icon': { color: colorTokens.info }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>💡 ¿Cómo funciona?</strong><br/>
                      • Las membresías se marcarán como "congeladas"<br/>
                      • Se agregarán <strong>{operation.freezeDays || 1} día{(operation.freezeDays || 1) > 1 ? 's' : ''}</strong> a la fecha de vencimiento<br/>
                      • Los días se registrarán en el historial de congelamiento<br/>
                      • <strong>Ejemplo:</strong> Si vence el 23 nov → nueva fecha: {operation.freezeDays ? `${23 + (operation.freezeDays)} nov` : '24 nov'}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* ✅ VISTA PREVIA DE CAMBIOS MEJORADA */}
            {showPreview && preview.length > 0 && (
              <Card sx={{
                background: `${colorTokens.success}10`,
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.success,
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <VisibilityIcon />
                    👁️ Vista Previa de Cambios
                    {operation.mode === 'manual' && operation.action === 'freeze' && (
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.info,
                        background: `${colorTokens.info}15`,
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        border: `2px solid ${colorTokens.info}40`,
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        +{operation.freezeDays || 1} día{(operation.freezeDays || 1) > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    color: colorTokens.textSecondary,
                    mb: 2
                  }}>
                    Se procesarán {preview.length} membresías para {operation.action === 'freeze' ? 'congelamiento' : 'reactivación'}:
                  </Typography>

                  <Box sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    border: `1px solid ${colorTokens.success}30`,
                    borderRadius: 2
                  }}>
                    <List dense>
                      {preview.slice(0, 5).map((previewItem, index) => (
                        <ListItem key={previewItem.membershipId} sx={{
                          borderBottom: index < Math.min(4, preview.length - 1) ? 
                            `1px solid ${colorTokens.neutral400}20` : 'none'
                        }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              background: colorTokens.brand,
                              color: colorTokens.textOnBrand,
                              width: 40,
                              height: 40
                            }}>
                              {previewItem.userName.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ 
                              color: colorTokens.textPrimary,
                              fontWeight: 600
                            }}>
                              {previewItem.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: colorTokens.textSecondary
                            }}>
                              {previewItem.planName} • {previewItem.currentStatus.toUpperCase()}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ 
                                color: colorTokens.textSecondary
                              }}>
                                📅 Actual: {previewItem.currentEndDate ? formatDisplayDate(previewItem.currentEndDate) : 'Sin fecha'}
                              </Typography>
                              {previewItem.newEndDate && previewItem.newEndDate !== previewItem.currentEndDate && (
                                <Typography variant="body2" sx={{ 
                                  color: colorTokens.success,
                                  fontWeight: 600
                                }}>
                                  📅 Nueva: {formatDisplayDate(previewItem.newEndDate)}
                                  {previewItem.daysToAdd > 0 && (
                                    <span style={{ 
                                      color: colorTokens.info,
                                      background: `${colorTokens.info}10`,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      marginLeft: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 700
                                    }}>
                                      +{previewItem.daysToAdd} día{previewItem.daysToAdd > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ 
                                color: colorTokens.info,
                                fontStyle: 'italic',
                                display: 'block',
                                mt: 0.5
                              }}>
                                ℹ️ {previewItem.actionDescription}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                    </List>

                    {preview.length > 5 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ 
                          color: colorTokens.textSecondary,
                          fontStyle: 'italic'
                        }}>
                          ... y {preview.length - 5} membresías más
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* ✅ CAMPO DE MOTIVO */}
            <TextField
              fullWidth
              label="Motivo (opcional)"
              multiline
              rows={3}
              value={operation.reason || ''}
              onChange={(e) => onOperationChange({ reason: e.target.value })}
              placeholder={`Motivo de la ${operation.action === 'freeze' ? 'congelación' : 'reactivación'} masiva...`}
              sx={{ mt: 3 }}
              InputProps={{
                sx: {
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${operation.action === 'freeze' ? colorTokens.info : colorTokens.success}30`
                  }
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: operation.action === 'freeze' ? colorTokens.info : colorTokens.success }
                }
              }}
            />
          </Box>
        ) : (
          <Box>
            {/* ✅ ESTADO DE LOADING */}
            <Typography variant="h6" sx={{ 
              color: operation.action === 'freeze' ? colorTokens.info : colorTokens.success,
              mb: 3,
              textAlign: 'center'
            }}>
              {operation.action === 'freeze' ? 'Congelando' : 'Reactivando'} membresías{operation.mode === 'manual' ? ' manualmente' : ''}...
            </Typography>

            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: `${operation.action === 'freeze' ? colorTokens.info : colorTokens.success}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: operation.action === 'freeze' ? colorTokens.info : colorTokens.success
                }
              }}
            />

            <Typography variant="body2" sx={{ 
              color: colorTokens.textSecondary,
              textAlign: 'center',
              mt: 2
            }}>
              {progress}% completado • Procesando {operation.membershipIds.length} membresías
            </Typography>

            {/* ✅ RESULTADOS EN TIEMPO REAL */}
            {(results.success > 0 || results.failed > 0) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" sx={{ color: colorTokens.textPrimary, mb: 1 }}>
                  Resultados en tiempo real:
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Box sx={{
                      background: `${colorTokens.success}10`,
                      border: `1px solid ${colorTokens.success}30`,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 800 }}>
                        {results.success}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        ✅ Exitosas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{
                      background: `${colorTokens.danger}10`,
                      border: `1px solid ${colorTokens.danger}30`,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h4" sx={{ color: colorTokens.danger, fontWeight: 800 }}>
                        {results.failed}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        ❌ Fallidas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* ✅ ERRORES */}
                {results.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.danger, mb: 1 }}>
                      Errores detectados:
                    </Typography>
                    <Box sx={{
                      maxHeight: 150,
                      overflow: 'auto',
                      border: `1px solid ${colorTokens.danger}30`,
                      borderRadius: 1,
                      p: 1,
                      background: `${colorTokens.danger}05`
                    }}>
                      {results.errors.map((error, index) => (
                        <Typography key={index} variant="caption" sx={{ 
                          color: colorTokens.danger,
                          display: 'block',
                          fontSize: '0.75rem'
                        }}>
                          • {error}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: colorTokens.neutral400,
            px: 3,
            py: 1
          }}
          variant="outlined"
        >
          {loading ? 'Procesando...' : 'Cancelar'}
        </Button>
        
        {!loading && (
          <Button 
            onClick={onExecute}
            variant="contained"
            startIcon={
              operation.action === 'freeze' ? 
                (operation.mode === 'manual' ? <ManualIcon /> : <AutoIcon />) : 
                (operation.mode === 'manual' ? <ManualIcon /> : <AutoIcon />)
            }
            sx={{
              background: `linear-gradient(135deg, ${
                operation.action === 'freeze' ? colorTokens.info : colorTokens.success
              }, ${
                operation.action === 'freeze' ? colorTokens.infoHover : colorTokens.successHover
              })`,
              color: colorTokens.textPrimary,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${
                  operation.action === 'freeze' ? colorTokens.infoHover : colorTokens.successHover
                }, ${
                  operation.action === 'freeze' ? colorTokens.info : colorTokens.success
                })`,
                transform: 'translateY(-1px)'
              }
            }}
          >
            {operation.action === 'freeze' ? 
              `🧊 Congelar ${operation.membershipIds.length} Membresía${operation.membershipIds.length > 1 ? 's' : ''}` :
              `🔄 Reactivar ${operation.membershipIds.length} Membresía${operation.membershipIds.length > 1 ? 's' : ''}`
            }
            {operation.mode === 'manual' && operation.action === 'freeze' && operation.freezeDays && (
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {' '}({operation.freezeDays} día{operation.freezeDays > 1 ? 's' : ''})
              </span>
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

BulkOperationModal.displayName = 'BulkOperationModal';

export default BulkOperationModal;