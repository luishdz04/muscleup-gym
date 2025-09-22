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
import { BulkFreezeOperation, BulkPreview } from '@/types/membership';

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
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `2px solid ${operation.action === 'freeze' ? colorTokens.info : colorTokens.success}50`,
          borderRadius: 4,
          color: colorTokens.neutral1200,
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
          sx={{ color: colorTokens.neutral800 }}
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
                backgroundColor: `${colorTokens.warning}10`,
                color: colorTokens.neutral1200,
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
                      color: colorTokens.neutral1200,
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
                        color: colorTokens.info,
                        '& .MuiSlider-thumb': {
                          backgroundColor: colorTokens.info,
                          border: `2px solid ${colorTokens.neutral1200}`,
                          '&:hover': {
                            boxShadow: `0 0 0 8px ${colorTokens.info}30`
                          }
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: colorTokens.info
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: colorTokens.neutral400
                        },
                        '& .MuiSlider-mark': {
                          backgroundColor: colorTokens.neutral800
                        },
                        '& .MuiSlider-markLabel': {
                          color: colorTokens.neutral800,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </Box>

                  <Alert 
                    severity="info"
                    sx={{
                      backgroundColor: `${colorTokens.info}05`,
                      color: colorTokens.neutral1200,
                      border: `1px solid ${colorTokens.info}20`,
                      '& .MuiAlert-icon': { color: colorTokens.info }
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
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    color: colorTokens.neutral800,
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
                              color: colorTokens.neutral0,
                              width: 40,
                              height: 40
                            }}>
                              {previewItem.userName.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ 
                              color: colorTokens.neutral1200,
                              fontWeight: 600
                            }}>
                              {previewItem.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: colorTokens.neutral800
                            }}>
                              {previewItem.planName} • {previewItem.currentStatus.toUpperCase()}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ 
                                color: colorTokens.neutral800
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
                                    <span style={{ color: colorTokens.info }}>
                                      {' '}(+{previewItem.daysToAdd} días)
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
                          color: colorTokens.neutral800,
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
                  color: colorTokens.neutral1200,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${operation.action === 'freeze' ? colorTokens.info : colorTokens.success}30`
                  }
                }
              }}
              InputLabelProps={{
                sx: { 
                  color: colorTokens.neutral800,
                  '&.Mui-focused': { color: operation.action === 'freeze' ? colorTokens.info : colorTokens.success }
                }
              }}
            />
          </Box>
        ) : (
          <Box>
            {/* Estado de loading */}
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
              color: colorTokens.neutral800,
              textAlign: 'center',
              mt: 2
            }}>
              {progress}% completado • Procesando {operation.membershipIds.length} membresías
            </Typography>

            {/* Resultados en tiempo real */}
            {(results.success > 0 || results.failed > 0) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" sx={{ color: colorTokens.neutral1200, mb: 1 }}>
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
                      <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
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
                      <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                        ❌ Fallidas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Errores */}
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
            color: colorTokens.neutral800,
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
                operation.action === 'freeze' ? colorTokens.info : colorTokens.success
              }DD)`,
              color: colorTokens.neutral1200,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${
                  operation.action === 'freeze' ? colorTokens.info : colorTokens.success
                }DD, ${
                  operation.action === 'freeze' ? colorTokens.info : colorTokens.success
                }BB)`,
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
