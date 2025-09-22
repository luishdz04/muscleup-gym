// components/membership/MembershipDetailsModal.tsx - MODAL DE DETALLES COMPLETO
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
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  AcUnit as AcUnitIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { MembershipHistory } from '@/types/membership';

interface Props {
  open: boolean;
  onClose: () => void;
  membership: MembershipHistory | null;
  onEdit: () => void;
  formatDisplayDate: (date: string | null) => string;
  formatTimestampForDisplay: (timestamp: string) => string;
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
  formatTimestampForDisplay,
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
          {/* ✅ HEADER DEL CLIENTE DETALLADO */}
          <Card sx={{
            background: `${colorTokens.brand}15`,
            border: `2px solid ${colorTokens.brand}40`,
            borderRadius: 4,
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colorTokens.textOnBrand,
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  boxShadow: `0 8px 32px ${colorTokens.brand}40`
                }}>
                  {membership.user_name.split(' ').map((n: string) => n[0]).join('')}
                </Box>
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
                        {membership.status === 'frozen' ? '🧊 CONGELADA' : '🔥 ACTIVA'}
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

            {/* ✅ FECHAS DEL SISTEMA */}
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
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                        {formatTimestampForDisplay(membership.created_at)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Última Actualización:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                        {formatTimestampForDisplay(membership.updated_at)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ DETALLES DE PAGO MIXTO */}
            {membership.is_mixed_payment && membership.payment_details && (
              <Grid size={12}>
                <Card sx={{
                  background: `${colorTokens.warning}10`,
                  border: `1px solid ${colorTokens.warning}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.warning,
                      fontWeight: 700,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      💳 Detalles de Pago Mixto
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Efectivo
                          </Typography>
                          <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                            {formatPrice(membership.payment_details.cash_amount || 0)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Tarjeta
                          </Typography>
                          <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                            {formatPrice(membership.payment_details.card_amount || 0)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Transferencia
                          </Typography>
                          <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                            {formatPrice(membership.payment_details.transfer_amount || 0)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Total
                          </Typography>
                          <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 800 }}>
                            {formatPrice(membership.payment_details.total_amount || membership.amount_paid)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
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
