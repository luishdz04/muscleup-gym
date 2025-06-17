'use client';

import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';
// ✅ IMPORTAR HELPERS DE FECHA CORREGIDOS
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleModerator: '#9C27B0'
};

interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
}

export default function LayawayDetailsDialog({ open, onClose, layaway }: LayawayDetailsDialogProps) {
  
  // ✅ FUNCIONES UTILITARIAS CORREGIDAS CON HELPERS DE FECHA MÉXICO
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date());
  }, []);

  const formatPrice = useCallback((price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numPrice || 0);
  }, []);

  // ✅ FUNCIONES CORREGIDAS PARA MOSTRAR FECHAS EN UI
  const formatMexicoDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  const calculateProgress = useCallback(() => {
    if (!layaway) return 0;
    const total = parseFloat(layaway.total_amount || 0);
    const paid = parseFloat(layaway.paid_amount || 0);
    return total > 0 ? (paid / total) * 100 : 0;
  }, [layaway]);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return darkProTokens.success;
    if (percentage >= 50) return darkProTokens.warning;
    return darkProTokens.error;
  }, []);

  // ✅ CALCULAR DÍAS HASTA VENCIMIENTO CON FECHA MÉXICO CORREGIDA
  const getDaysUntilExpiration = useCallback(() => {
    if (!layaway?.layaway_expires_at) return null;
    const mexicoToday = getMexicoDate();
    const expiration = new Date(layaway.layaway_expires_at);
    const diffTime = expiration.getTime() - mexicoToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [layaway, getMexicoDate]);

  const getPaymentMethodLabel = useCallback((method: string) => {
    switch (method) {
      case 'efectivo':
        return '💵 Efectivo';
      case 'debito':
        return '💳 Tarjeta Débito';
      case 'credito':
        return '💳 Tarjeta Crédito';
      case 'transferencia':
        return '🏦 Transferencia';
      case 'vales':
        return '🎫 Vales de Despensa';
      default:
        return method || 'No especificado';
    }
  }, []);

  const getPaymentMethodColor = useCallback((method: string) => {
    switch (method) {
      case 'efectivo':
        return darkProTokens.success;
      case 'debito':
        return darkProTokens.info;
      case 'credito':
        return darkProTokens.warning;
      case 'transferencia':
        return darkProTokens.roleModerator;
      case 'vales':
        return darkProTokens.primary;
      default:
        return darkProTokens.grayDark;
    }
  }, []);

  if (!layaway) return null;

  const progress = calculateProgress();
  const daysLeft = getDaysUntilExpiration();
  
  const paymentHistory = layaway.payment_history || layaway.payments || [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          color: darkProTokens.textPrimary,
          borderRadius: 4
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon />
          <Typography variant="h6" fontWeight="bold">
            📦 Apartado #{layaway.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, background: darkProTokens.surfaceLevel1 }}>
        <Grid container spacing={3}>
          
          <Grid size={{ xs: 12 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ProgressIcon sx={{ color: darkProTokens.primary }} />
                  <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                    📊 Progreso del Apartado
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      flexGrow: 1, 
                      height: 12, 
                      borderRadius: 6,
                      backgroundColor: `${darkProTokens.grayDark}`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(progress),
                        borderRadius: 6
                      }
                    }}
                  />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, minWidth: 60 }}>
                    {Math.round(progress)}%
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${darkProTokens.success}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total Pagado</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                        {formatPrice(layaway.paid_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${darkProTokens.warning}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Pendiente</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {formatPrice(layaway.pending_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${darkProTokens.info}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total Final</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                        {formatPrice(layaway.total_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${darkProTokens.error}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Días Restantes</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        color: daysLeft !== null ? (
                          daysLeft > 7 ? darkProTokens.success :
                          daysLeft > 0 ? darkProTokens.warning :
                          darkProTokens.error
                        ) : darkProTokens.textSecondary
                      }}>
                        {daysLeft !== null ? (daysLeft > 0 ? daysLeft : 'Vencido') : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%',
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  📋 Información General
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Número de Apartado:</Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>{layaway.sale_number}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Fecha de Creación:</Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{formatDate(layaway.created_at)}</Typography>
                  </Box>

                  {layaway.layaway_expires_at && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Fecha de Vencimiento:</Typography>
                      <Typography variant="body1" sx={{ 
                        color: daysLeft !== null ? (
                          daysLeft > 7 ? darkProTokens.success :
                          daysLeft > 0 ? darkProTokens.warning :
                          darkProTokens.error
                        ) : darkProTokens.textPrimary
                      }}>
                        {formatDate(layaway.layaway_expires_at)}
                      </Typography>
                    </Box>
                  )}

                  {layaway.last_payment_date && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Último Pago:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{formatDate(layaway.last_payment_date)}</Typography>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Estado:</Typography>
                    <Chip 
                      label={layaway.status === 'pending' ? 'Pendiente' : layaway.status === 'completed' ? 'Completado' : layaway.status} 
                      sx={{
                        backgroundColor: 
                          layaway.status === 'completed' ? darkProTokens.success :
                          layaway.status === 'pending' ? darkProTokens.warning :
                          layaway.status === 'cancelled' ? darkProTokens.error : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Estado de Pago:</Typography>
                    <Chip 
                      label={
                        layaway.payment_status === 'paid' ? 'Pagado' :
                        layaway.payment_status === 'partial' ? 'Parcial' :
                        layaway.payment_status === 'pending' ? 'Pendiente' : layaway.payment_status
                      } 
                      sx={{
                        backgroundColor: 
                          layaway.payment_status === 'paid' ? darkProTokens.success :
                          layaway.payment_status === 'partial' ? darkProTokens.warning :
                          layaway.payment_status === 'pending' ? darkProTokens.error : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>

                  {layaway.deposit_percentage && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Anticipo Requerido:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.primary }}>
                        {layaway.deposit_percentage}% = {formatPrice(layaway.required_deposit)}
                      </Typography>
                    </Box>
                  )}
                  
                  {layaway.notes && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Notas:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{layaway.notes}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%',
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  👤 Información del Cliente
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cliente:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: darkProTokens.success }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {layaway.customer_name || 'Cliente General'}
                        </Typography>
                        {layaway.customer_email && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📧 {layaway.customer_email}
                          </Typography>
                        )}
                        {layaway.customer_phone && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📞 {layaway.customer_phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Opciones:</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      {layaway.receipt_printed && (
                        <Chip 
                          label="Ticket impreso" 
                          size="small" 
                          sx={{
                            backgroundColor: darkProTokens.info,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {layaway.email_sent && (
                        <Chip 
                          label="Email enviado" 
                          size="small" 
                          sx={{
                            backgroundColor: darkProTokens.roleModerator,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {layaway.is_mixed_payment && (
                        <Chip 
                          label="Pago mixto" 
                          size="small" 
                          sx={{
                            backgroundColor: darkProTokens.warning,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {!layaway.receipt_printed && !layaway.email_sent && !layaway.is_mixed_payment && (
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                          Sin opciones especiales
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card sx={{
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  🛒 Productos del Apartado ({layaway.items?.length || 0})
                </Typography>
                
                <TableContainer component={Paper} sx={{
                  background: darkProTokens.surfaceLevel2,
                  border: `1px solid ${darkProTokens.grayDark}`,
                  borderRadius: 2
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: darkProTokens.grayDark }}>
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Producto</TableCell>
                        <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Cantidad</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Precio Unit.</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {layaway.items?.map((item: any, index: number) => (
                        <TableRow key={index} sx={{
                          '&:hover': { backgroundColor: `${darkProTokens.primary}10` },
                          '&:nth-of-type(even)': { backgroundColor: `${darkProTokens.surfaceLevel1}60` }
                        }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" sx={{ color: darkProTokens.textPrimary }}>
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.quantity}
                              size="small"
                              sx={{
                                backgroundColor: darkProTokens.primary,
                                color: darkProTokens.background,
                                fontWeight: 700
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                              {formatPrice(item.unit_price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.primary }}>
                              {formatPrice(item.total_price)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, py: 2 }}>
                              No hay productos registrados
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  💳 Historial de Abonos ({paymentHistory.length})
                </Typography>
                
                {paymentHistory && paymentHistory.length > 0 ? (
                  <TableContainer component={Paper} sx={{
                    background: darkProTokens.surfaceLevel2,
                    border: `1px solid ${darkProTokens.grayDark}`,
                    borderRadius: 2
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: darkProTokens.grayDark }}>
                          <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Fecha</TableCell>
                          <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Método</TableCell>
                          <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Monto</TableCell>
                          <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Comisión</TableCell>
                          <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Referencia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentHistory
                          .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                          .map((payment: any, index: number) => (
                          <TableRow key={payment.id || index} sx={{
                            '&:hover': { backgroundColor: `${darkProTokens.primary}10` },
                            '&:nth-of-type(even)': { backgroundColor: `${darkProTokens.surfaceLevel1}60` }
                          }}>
                            <TableCell>
                              <Chip 
                                label={`#${payment.sequence_order || index + 1}`}
                                size="small"
                                sx={{
                                  backgroundColor: darkProTokens.primary,
                                  color: darkProTokens.background,
                                  fontWeight: 700
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                                {formatDate(payment.payment_date)}
                              </Typography>
                              {payment.is_partial_payment && (
                                <Typography variant="caption" sx={{ color: darkProTokens.info, display: 'block' }}>
                                  Abono parcial
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getPaymentMethodLabel(payment.payment_method)}
                                size="small"
                                sx={{
                                  backgroundColor: getPaymentMethodColor(payment.payment_method),
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.success }}>
                                {formatPrice(payment.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                                {parseFloat(payment.commission_amount || 0) > 0 ? 
                                  formatPrice(payment.commission_amount) : 
                                  '$0.00'
                                }
                              </Typography>
                              {parseFloat(payment.commission_rate || 0) > 0 && (
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block' }}>
                                  ({payment.commission_rate}%)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                {payment.payment_reference || 'N/A'}
                              </Typography>
                              {payment.notes && (
                                <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, display: 'block' }}>
                                  {payment.notes}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    background: darkProTokens.surfaceLevel2,
                    borderRadius: 2,
                    border: `1px solid ${darkProTokens.grayDark}`
                  }}>
                    <PaymentIcon sx={{ fontSize: 60, color: darkProTokens.grayMuted, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Sin abonos registrados
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      Los abonos aparecerán aquí cuando se registren pagos
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        background: darkProTokens.surfaceLevel2,
        borderTop: `1px solid ${darkProTokens.grayDark}`
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          size="large"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
            color: darkProTokens.background,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
              transform: 'translateY(-1px)'
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
