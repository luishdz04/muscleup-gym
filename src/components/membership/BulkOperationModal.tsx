// components/membership/BulkOperationModal.tsx
'use client';

import React, { memo } from 'react';
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
import { darkProTokens } from '@/constants/tokens';
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
  formatDisplayDate
}) => {
  const getBulkOperationTitle = () => {
    const actionText = operation.action === 'freeze' ? 'Congelamiento' : 'Reactivación';
    const modeText = operation.mode === 'manual' ? 'Manual' : 'Automático';
    const icon = operation.action === 'freeze' ? '🧊' : '🔄';
    return `${icon} ${actionText} Masivo ${modeText}`;
  };

  const handleSliderChange = (value: number | number[]) => {
    const days = Array.isArray(value) ? value[0] : value;
    onOperationChange({ freezeDays: days });
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success}50`,
          borderRadius: 4,
          color: darkProTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success, 
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
          sx={{ color: darkProTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {!loading ? (
          <Box>
            {/* Alerta de advertencia */}
            <Alert 
              severity="warning"
              sx={{
                backgroundColor: `${darkProTokens.warning}10`,
                color: darkProTokens.textPrimary,
                border: `1px solid ${darkProTokens.warning}30`,
                '& .MuiAlert-icon': { color: darkProTokens.warning },
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
                    <br/><strong>⚙️ Modo Manual:</strong> Se agregarán {operation.freezeDays} días a la fecha de vencimiento.
                  </>
                )}
                {operation.action === 'unfreeze' && (
                  <>
                    <br/><strong>🔄 Reactivación:</strong> Se agregarán automáticamente los días que estuvo congelada.
                  </>
                )}
              </Typography>
            </Alert>

            {/* Configuración para congelamiento manual */}
            {operation.mode === 'manual' && operation.action === 'freeze' && (
              <Card sx={{
                background: `${darkProTokens.info}10`,
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info,
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
                      color: darkProTokens.textPrimary,
                      fontWeight: 600,
                      mb: 2
                    }}>
                      Días a congelar: {operation.freezeDays} días
                    </Typography>
                    
                    <Slider
                      value={operation.freezeDays || 7}
                      onChange={(e, newValue) => handleSliderChange(newValue)}
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
                      sx={{
                        color: darkProTokens.info,
                        '& .MuiSlider-thumb': {
                          backgroundColor: darkProTokens.info,
                          border: `2px solid ${darkProTokens.textPrimary}`,
                          '&:hover': {
                            boxShadow: `0 0 0 8px ${darkProTokens.info}30`
                          }
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: darkProTokens.info
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: darkProTokens.grayDark
                        },
                        '& .MuiSlider-mark': {
                          backgroundColor: darkProTokens.textSecondary
                        },
                        '& .MuiSlider-markLabel': {
                          color: darkProTokens.textSecondary,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </Box>

                  <Alert 
                    severity="info"
                    sx={{
                      backgroundColor: `${darkProTokens.info}05`,
                      color: darkProTokens.textPrimary,
                      border: `1px solid ${darkProTokens.info}20`,
                      '& .MuiAlert-icon': { color: darkProTokens.info }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>💡 ¿Cómo funciona?</strong><br/>
                      • Las membresías se marcarán como "congeladas"<br/>
                      • Se agregarán <strong>{operation.freezeDays} días</strong> a la fecha de vencimiento<br/>
                      • Los días se registrarán en el historial de congelamiento
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Vista previa de cambios */}
            {showPreview && preview.length > 0 && (
              <Card sx={{
                background: `${darkProTokens.success}10`,
                border: `1px solid ${darkProTokens.success}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.success,
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <VisibilityIcon />
                    👁️ Vista Previa de Cambios
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary,
                    mb: 2
                  }}>
                    Se procesarán {preview.length} membresías para {operation.action === 'freeze' ? 'congelamiento' : 'reactivación'}:
                  </Typography>

                  <Box sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    border: `1px solid ${darkProTokens.success}30`,
                    borderRadius: 2
                  }}>
                    <List dense>
                      {preview.slice(0, 5).map((previewItem, index) => (
                        <ListItem key={previewItem.membershipId} sx={{
                          borderBottom: index < Math.min(4, preview.length - 1) ? 
                            `1px solid ${darkProTokens.grayDark}20` : 'none'
                        }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              background: darkProTokens.primary,
                              color: darkProTokens.background,
                              width: 40,
                              height: 40
                            }}>
                              {previewItem.userName.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ 
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}>
                              {previewItem.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: darkProTokens.textSecondary
                            }}>
                              {previewItem.planName} • {previewItem.currentStatus.toUpperCase()}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.textSecondary
                              }}>
                                📅 Actual: {previewItem.currentEndDate ? formatDisplayDate(previewItem.currentEndDate) : 'Sin fecha'}
                              </Typography>
                              {previewItem.newEndDate && previewItem.newEndDate !== previewItem.currentEndDate && (
                                <Typography variant="body2" sx={{ 
                                  color: darkProTokens.success,
                                  fontWeight: 600
                                }}>
                                  📅 Nueva: {formatDisplayDate(previewItem.newEndDate)}
                                  {previewItem.daysToAdd > 0 && (
                                    <span style={{ color: darkProTokens.info }}>
                                      {' '}(+{previewItem.daysToAdd} días)
                                    </span>
                                  )}
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.info,
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
                          color: darkProTokens.textSecondary,
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

            {/* Campo de motivo */}
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
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success}30`
                  }
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: darkProTokens.textSecondary,
                  '&.Mui-focused': { color: operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success }
                }
              }}
            />
          </Box>
        ) : (
          <Box>
            {/* Estado de loading */}
            <Typography variant="h6" sx={{ 
              color: operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success,
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
                backgroundColor: `${operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success
                }
              }}
            />

            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary,
              textAlign: 'center',
              mt: 2
            }}>
              {progress}% completado • Procesando {operation.membershipIds.length} membresías
            </Typography>

            {/* Resultados en tiempo real */}
            {(results.success > 0 || results.failed > 0) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, mb: 1 }}>
                  Resultados en tiempo real:
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Box sx={{
                      background: `${darkProTokens.success}10`,
                      border: `1px solid ${darkProTokens.success}30`,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 800 }}>
                        {results.success}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        ✅ Exitosas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{
                      background: `${darkProTokens.error}10`,
                      border: `1px solid ${darkProTokens.error}30`,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 800 }}>
                        {results.failed}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        ❌ Fallidas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Errores */}
                {results.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.error, mb: 1 }}>
                      Errores detectados:
                    </Typography>
                    <Box sx={{
                      maxHeight: 150,
                      overflow: 'auto',
                      border: `1px solid ${darkProTokens.error}30`,
                      borderRadius: 1,
                      p: 1,
                      background: `${darkProTokens.error}05`
                    }}>
                      {results.errors.map((error, index) => (
                        <Typography key={index} variant="caption" sx={{ 
                          color: darkProTokens.error,
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
            color: darkProTokens.textSecondary,
            borderColor: darkProTokens.grayDark,
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
                operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success
              }, ${
                operation.action === 'freeze' ? darkProTokens.infoHover : darkProTokens.successHover
              })`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${
                  operation.action === 'freeze' ? darkProTokens.infoHover : darkProTokens.successHover
                }, ${
                  operation.action === 'freeze' ? darkProTokens.info : darkProTokens.success
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
                {' '}({operation.freezeDays} días)
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
