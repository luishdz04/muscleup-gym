// components/membership/MembershipDetailsModal.tsx - MODAL DE DETALLES CON CORRECCIONES
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
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  AcUnit as AcUnitIcon,
  Timer as TimerIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { MembershipHistory } from '@/types/membership';

interface Props {
  open: boolean;
  onClose: () => void;
  membership: MembershipHistory | null;
  onEdit: () => void;
  formatDisplayDate: (date: string | null) => string;
  formatTimestampForDisplay: (timestamp: string) => string; // ✅ AGREGADO
  formatPrice: (price: number) => string;
  calculateDaysRemaining: (endDate: string | null) => number | null;
  getCurrentFrozenDays: (freezeDate: string | null) => number;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
  paymentMethodOptions: Array<{ value: string; label: string; icon: string }>;
}

const MembershipDetailsModal = memo<Props>(({
  open,
  onClose,
  membership,
  onEdit,
  formatDisplayDate,
  formatTimestampForDisplay, // ✅ USAR LA FUNCIÓN DE dateUtils
  formatPrice,
  calculateDaysRemaining,
  getCurrentFrozenDays,
  getStatusColor,
  getStatusIcon,
  paymentMethodOptions
}) => {
  if (!membership) return null;

  const getPaymentIcon = (paymentMethod: string) => {
    const option = paymentMethodOptions.find(p => p.value === paymentMethod);
    return option?.icon || '💳';
  };

  // ✅ FUNCIÓN PARA AVATAR CON FOTO DE PERFIL
  const renderUserAvatar = (userName: string, userEmail: string, profileImage?: string) => {
    const initials = userName.split(' ').map((n: string) => n[0]).join('');
    
    // ✅ USAR SOLO EL PARÁMETRO profileImage (viene del hook)
    if (profileImage) {
      return (
        <Avatar 
          src={profileImage}
          alt={userName}
          sx={{ 
            width: 100, 
            height: 100, 
            border: `4px solid ${colorTokens.brand}`,
            boxShadow: `0 8px 32px ${colorTokens.brand}40`
          }}
        >
          {initials}
        </Avatar>
      );
    }

    // Fallback con iniciales
    return (
      <Avatar sx={{ 
        width: 100, 
        height: 100, 
        borderRadius: '50%', 
        background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
        color: colorTokens.textOnBrand,
        fontWeight: 800,
        fontSize: '2.5rem',
        border: `4px solid ${colorTokens.brand}`,
        boxShadow: `0 8px 32px ${colorTokens.brand}40`
      }}>
        {initials}
      </Avatar>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}50`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colorTokens.brand, 
        fontWeight: 800,
        fontSize: '1.8rem',
        textAlign: 'center',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <VisibilityIcon sx={{ fontSize: 40 }} />
          Vista Detallada de Membresía
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ color: colorTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        <Box sx={{ mt: 2 }}>
          {/* ✅ HEADER DEL CLIENTE CON AVATAR MEJORADO */}
          <Card sx={{
            background: `${colorTokens.brand}15`,
            border: `2px solid ${colorTokens.brand}40`,
            borderRadius: 4,
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {/* ✅ AVATAR CON SOPORTE PARA FOTOS */}
                {renderUserAvatar(
                  membership.user_name, 
                  membership.user_email,
                  (membership as any).user_profile_image || (membership as any).profile_image
                )}
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ 
                    color: colorTokens.brand, 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {membership.user_name}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.textSecondary,
                    mb: 2
                  }}>
                    📧 {membership.user_email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${getStatusIcon(membership.status)} ${membership.status.toUpperCase()}`}
                      sx={{
                        backgroundColor: getStatusColor(membership.status),
                        color: colorTokens.textPrimary,
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 2,
                        py: 1
                      }}
                    />
                    <Chip 
                      label={membership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                      sx={{
                        backgroundColor: membership.is_renewal ? colorTokens.warning : colorTokens.success,
                        color: membership.is_renewal ? colorTokens.textOnBrand : colorTokens.textPrimary,
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 2,
                        py: 1
                      }}
                    />
                    {membership.skip_inscription && (
                      <Chip 
                        label="🚫 SIN INSCRIPCIÓN" 
                        sx={{
                          backgroundColor: colorTokens.info,
                          color: colorTokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '1rem',
                          px: 2,
                          py: 1
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h3" sx={{ 
                    color: colorTokens.brand,
                    fontWeight: 800
                  }}>
                    {formatPrice(membership.amount_paid)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                    {getPaymentIcon(membership.payment_method)} {membership.payment_method}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* ✅ INFORMACIÓN DEL PLAN */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{
                background: `${colorTokens.info}10`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3,
                height: '100%'
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
                    <FitnessCenterIcon />
                    🏋️‍♂️ Información del Plan
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Plan de Membresía:
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        {membership.plan_name}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Tipo de Pago:
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        {membership.payment_type.toUpperCase()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        ID de Membresía:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: colorTokens.textPrimary,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        {membership.id}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ FECHAS Y VIGENCIA */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{
                background: `${colorTokens.success}10`,
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3,
                height: '100%'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.success,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <CalendarTodayIcon />
                    📅 Fechas y Vigencia
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Fecha de Inicio:
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        {formatDisplayDate(membership.start_date)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Fecha de Vencimiento:
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: membership.end_date ? colorTokens.textPrimary : colorTokens.textSecondary,
                        fontWeight: 700 
                      }}>
                        {membership.end_date ? formatDisplayDate(membership.end_date) : 'Sin vencimiento'}
                      </Typography>
                    </Box>

                    {membership.end_date && (
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Días Restantes:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: (() => {
                            const daysRemaining = calculateDaysRemaining(membership.end_date);
                            if (daysRemaining === null) return colorTokens.textSecondary;
                            if (daysRemaining < 0) return colorTokens.danger;
                            if (daysRemaining < 7) return colorTokens.warning;
                            return colorTokens.success;
                          })(),
                          fontWeight: 700
                        }}>
                          {(() => {
                            const daysRemaining = calculateDaysRemaining(membership.end_date!);
                            if (daysRemaining === null) return 'Sin límite';
                            if (daysRemaining < 0) return `Vencida hace ${Math.abs(daysRemaining)} días`;
                            if (daysRemaining === 0) return 'Vence hoy';
                            return `${daysRemaining} días restantes`;
                          })()}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ HISTORIAL DE CONGELAMIENTO */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{
                background: `${colorTokens.info}10`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3,
                height: '100%'
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
                    <AcUnitIcon />
                    🧊 Historial de Congelamiento
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Estado de Congelamiento:
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: membership.status === 'frozen' ? colorTokens.info : colorTokens.success,
                        fontWeight: 700 
                      }}>
                        {membership.status === 'frozen' ? '🧊 CONGELADA' : '🔥 SIN CONGELAR'}
                      </Typography>
                    </Box>

                    {membership.status === 'frozen' && membership.freeze_date && (
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Congelada desde:
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                          {formatDisplayDate(membership.freeze_date)} ({getCurrentFrozenDays(membership.freeze_date)} días)
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Total de Días Congelados Históricos:
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                        {membership.total_frozen_days || 0} días
                      </Typography>
                    </Box>

                    {membership.unfreeze_date && (
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Última Reactivación:
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                          {formatDisplayDate(membership.unfreeze_date)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ FECHAS DEL SISTEMA CON ZONA HORARIA CORRECTA */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{
                background: `${colorTokens.neutral400}10`,
                border: `1px solid ${colorTokens.neutral400}30`,
                borderRadius: 3,
                height: '100%'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.textSecondary,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <TimerIcon />
                    ⏰ Fechas del Sistema
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Fecha de Creación:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: colorTokens.textPrimary, 
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        lineHeight: 1.4
                      }}>
                        {formatTimestampForDisplay(membership.created_at)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Última Actualización:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: colorTokens.textPrimary, 
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        lineHeight: 1.4
                      }}>
                        {formatTimestampForDisplay(membership.updated_at)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ DETALLES DE PAGO MIXTO - BASADO EN ARRAY DE payment_details */}
            {membership.is_mixed_payment && membership.payment_details && Array.isArray(membership.payment_details) && (
              <Grid size={12}>
                <Card sx={{
                  background: `${colorTokens.warning}15`,
                  border: `2px solid ${colorTokens.warning}40`,
                  borderRadius: 4,
                  boxShadow: `0 8px 32px ${colorTokens.warning}20`
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ 
                      color: colorTokens.warning,
                      fontWeight: 800,
                      mb: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      textAlign: 'center',
                      justifyContent: 'center'
                    }}>
                      <ReceiptIcon sx={{ fontSize: 40 }} />
                      💳 Desglose de Pago Mixto
                    </Typography>

                    {/* ✅ DESGLOSE VISUAL - CADA MÉTODO DEL ARRAY */}
                    <Box sx={{
                      background: `${colorTokens.neutral200}05`,
                      border: `1px solid ${colorTokens.neutral400}`,
                      borderRadius: 3,
                      p: 4,
                      mb: 4
                    }}>
                      <Grid container spacing={3}>
                        {/* Renderizar cada método del array payment_details */}
                        {membership.payment_details.map((detail: any, index: number) => {
                          const methodIcon = detail.method === 'efectivo' ? '💵' : 
                                            detail.method === 'debito' || detail.method === 'credito' ? '💳' : 
                                            detail.method === 'transferencia' ? '🏦' : '💰';
                          const methodColor = detail.method === 'efectivo' ? colorTokens.success : 
                                             detail.method === 'debito' || detail.method === 'credito' ? colorTokens.info : 
                                             detail.method === 'transferencia' ? colorTokens.warning : colorTokens.neutral600;
                          const methodLabel = detail.method === 'efectivo' ? 'Efectivo' : 
                                             detail.method === 'debito' ? 'Tarjeta Débito' : 
                                             detail.method === 'credito' ? 'Tarjeta Crédito' : 
                                             detail.method === 'transferencia' ? 'Transferencia' : detail.method;

                          return (
                            <Grid key={detail.id || index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                              <Box sx={{
                                background: `${methodColor}15`,
                                border: `2px solid ${methodColor}`,
                                borderRadius: 3,
                                p: 3,
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 8px 32px ${methodColor}30`
                                }
                              }}>
                                <Typography variant="h2" sx={{ mb: 2 }}>{methodIcon}</Typography>
                                <Typography variant="h6" sx={{ 
                                  color: colorTokens.textSecondary,
                                  mb: 1,
                                  fontWeight: 600
                                }}>
                                  {methodLabel}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: colorTokens.textSecondary,
                                  display: 'block',
                                  mb: 2
                                }}>
                                  Pago #{detail.sequence || index + 1}
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                  color: methodColor, 
                                  fontWeight: 800
                                }}>
                                  {formatPrice(detail.amount)}
                                </Typography>
                                {detail.reference && (
                                  <Typography variant="caption" sx={{ 
                                    color: colorTokens.textSecondary,
                                    display: 'block',
                                    mt: 1,
                                    fontFamily: 'monospace'
                                  }}>
                                    Ref: {detail.reference}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          );
                        })}

                        {/* Total */}
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                          <Box sx={{
                            background: `${colorTokens.brand}20`,
                            border: `3px solid ${colorTokens.brand}`,
                            borderRadius: 3,
                            p: 3,
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(135deg, ${colorTokens.brand}10, ${colorTokens.brand}05)`,
                              zIndex: -1
                            }
                          }}>
                            <Typography variant="h2" sx={{ mb: 2, color: colorTokens.brand }}>🧮</Typography>
                            <Typography variant="h6" sx={{ 
                              color: colorTokens.textSecondary,
                              mb: 2,
                              fontWeight: 600
                            }}>
                              Total Final
                            </Typography>
                            <Typography variant="h3" sx={{ 
                              color: colorTokens.brand, 
                              fontWeight: 900
                            }}>
                              {formatPrice(membership.amount_paid)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ 
                      borderColor: `${colorTokens.warning}30`, 
                      my: 4,
                      borderWidth: 2
                    }} />

                    {/* ✅ FÓRMULA VISUAL BASADA EN EL ARRAY */}
                    <Box sx={{
                      background: `linear-gradient(135deg, ${colorTokens.brand}10, ${colorTokens.brand}05)`,
                      border: `2px solid ${colorTokens.brand}30`,
                      borderRadius: 4,
                      p: 4,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ 
                        color: colorTokens.textPrimary,
                        fontWeight: 700,
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2
                      }}>
                        <AttachMoneyIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
                        📊 Fórmula de Pago
                      </Typography>
                      
                      <Typography variant="h4" sx={{ 
                        color: colorTokens.textPrimary,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '2px',
                        lineHeight: 1.5,
                        textShadow: `2px 2px 4px rgba(0,0,0,0.3)`
                      }}>
                        {/* Construir fórmula dinámicamente del array */}
                        {(() => {
                          const parts = membership.payment_details.map((detail: any) => {
                            const icon = detail.method === 'efectivo' ? '💵' : 
                                        detail.method === 'debito' || detail.method === 'credito' ? '💳' : 
                                        detail.method === 'transferencia' ? '🏦' : '💰';
                            return `${icon} ${formatPrice(detail.amount)}`;
                          });
                          
                          return parts.join(' + ') + ` = 🧮 ${formatPrice(membership.amount_paid)}`;
                        })()}
                      </Typography>

                      {/* Verificación del total */}
                      <Box sx={{
                        mt: 3,
                        p: 2,
                        background: `${colorTokens.success}10`,
                        border: `1px solid ${colorTokens.success}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="body1" sx={{ 
                          color: colorTokens.success,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          ✅ Total Verificado: {(() => {
                            const calculatedTotal = membership.payment_details.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
                            return Math.abs(calculatedTotal - membership.amount_paid) < 0.01 ? 
                              'Coincide perfectamente' : 
                              `Diferencia: ${formatPrice(Math.abs(calculatedTotal - membership.amount_paid))}`;
                          })()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Referencias de pago si existen */}
                    {membership.payment_reference && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" sx={{ 
                          color: colorTokens.textSecondary,
                          mb: 2,
                          fontWeight: 700
                        }}>
                          📄 Referencias de Pago:
                        </Typography>
                        <Box sx={{
                          background: `${colorTokens.neutral200}05`,
                          border: `1px solid ${colorTokens.neutral400}`,
                          borderRadius: 3,
                          p: 3
                        }}>
                          <Typography variant="h6" sx={{ 
                            color: colorTokens.textPrimary,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            textAlign: 'center'
                          }}>
                            {membership.payment_reference}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* ✅ NOTAS */}
            {membership.notes && (
              <Grid size={12}>
                <Card sx={{
                  background: `${colorTokens.neutral400}10`,
                  border: `1px solid ${colorTokens.neutral400}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.textSecondary,
                      fontWeight: 700,
                      mb: 2
                    }}>
                      📝 Notas del Registro
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: colorTokens.textPrimary,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {membership.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={() => {
            onEdit();
            onClose();
          }}
          startIcon={<EditIcon />}
          sx={{ 
            color: colorTokens.warning,
            borderColor: `${colorTokens.warning}60`,
            px: 3,
            py: 1,
            fontWeight: 600,
            '&:hover': {
              borderColor: colorTokens.warning,
              backgroundColor: `${colorTokens.warning}10`
            }
          }}
          variant="outlined"
        >
          Editar Membresía
        </Button>
        
        <Button 
          onClick={onClose}
          sx={{ 
            color: colorTokens.brand,
            borderColor: colorTokens.brand,
            px: 4,
            py: 1,
            fontWeight: 700,
            '&:hover': {
              borderColor: colorTokens.brandHover,
              backgroundColor: `${colorTokens.brand}10`
            }
          }}
          variant="outlined"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
});

MembershipDetailsModal.displayName = 'MembershipDetailsModal';

export default MembershipDetailsModal;