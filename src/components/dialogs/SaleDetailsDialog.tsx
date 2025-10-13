// components/dialogs/SaleDetailsDialog.tsx - v7.5 PATRÓN LAYAWAY

'use client';

import React, { useCallback, useMemo } from 'react';
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
  Stack,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CheckCircle,
  Cancel,
  Undo
} from '@mui/icons-material';

import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { formatTimestampForDisplay } from '@/utils/dateUtils';

interface SaleDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  sale: {
    id: string;
    sale_number: string;
    customer_name?: string;
    customer?: {
      id: string;
      firstName: string;
      lastName?: string;
      email?: string;
      profilePictureUrl?: string;
    };
    cashier_name?: string;
    cashier?: {
      id: string;
      firstName: string;
      lastName?: string;
      profilePictureUrl?: string;
    };
    total_amount: number;
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    coupon_discount?: number;
    coupon_code?: string;
    commission_amount?: number;
    commission_rate?: number;
    change_amount?: number;
    status: string;
    payment_status?: string;
    payment_method?: string;
    created_at: string;
    completed_at?: string;
    cancelled_at?: string;
    cancel_reason?: string;
    notes?: string;
    is_mixed_payment?: boolean;
    receipt_printed?: boolean;
    sale_items?: Array<{
      id: string;
      product_name: string;
      product_sku?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      discount_amount?: number;
      tax_amount?: number;
    }>;
    sale_payment_details?: Array<{
      id: string;
      payment_method: string;
      amount: number;
      payment_date?: string;
      commission_amount?: number;
      commission_rate?: number;
      payment_reference?: string;
      sequence_order?: number;
      is_partial_payment?: boolean;
      notes?: string;
    }>;
  } | null;
}

export default function SaleDetailsDialog({ open, onClose, sale }: SaleDetailsDialogProps) {
  const hydrated = useHydrated();

  const formatPrice = useCallback((price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numPrice || 0);
  }, []);

  const formatDate = useCallback((date: string | number | undefined) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') {
      return formatTimestampForDisplay(date);
    }
    return formatTimestampForDisplay(new Date(date).toISOString());
  }, []);

  const safeSale = useMemo(() => {
    if (!sale) return null;
    
    const normalizedItems = sale.sale_items || [];
    const normalizedPayments = sale.sale_payment_details || [];
    
    // ✅ CONVERSIÓN EXPLÍCITA A NÚMEROS PARA EVITAR STRINGS "0"
    return {
      ...sale,
      sale_items: normalizedItems,
      sale_payment_details: normalizedPayments,
      customer_name: sale.customer_name || sale.customer?.firstName || 'Cliente General',
      cashier_name: sale.cashier_name || sale.cashier?.firstName || 'Sistema',
      // ✅ FORZAR CONVERSIÓN A NÚMEROS
      discount_amount: Number(sale.discount_amount) || 0,
      coupon_discount: Number(sale.coupon_discount) || 0,
      tax_amount: Number(sale.tax_amount) || 0,
      commission_amount: Number(sale.commission_amount) || 0,
      commission_rate: Number(sale.commission_rate) || 0,
      change_amount: Number(sale.change_amount) || 0,
      subtotal: Number(sale.subtotal) || 0,
      total_amount: Number(sale.total_amount) || 0
    };
  }, [sale]);

  const getPaymentMethodLabel = useCallback((method: string) => {
    const labels: Record<string, string> = {
      'efectivo': '💵 Efectivo',
      'debito': '💳 Tarjeta Débito',
      'credito': '💳 Tarjeta Crédito',
      'transferencia': '🏦 Transferencia',
      'mixto': '🔄 Pago Mixto'
    };
    return labels[method?.toLowerCase()] || method || 'No especificado';
  }, []);

  const getPaymentMethodColor = useCallback((method: string) => {
    const colors: Record<string, string> = {
      'efectivo': colorTokens.success,
      'debito': colorTokens.info,
      'credito': colorTokens.warning,
      'transferencia': colorTokens.brand,
      'mixto': colorTokens.brandActive
    };
    return colors[method?.toLowerCase()] || colorTokens.neutral600;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return colorTokens.success;
      case 'cancelled': return colorTokens.danger;
      case 'refunded': return colorTokens.info;
      default: return colorTokens.neutral600;
    }
  }, []);

  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
            <Typography sx={{ color: colorTokens.textSecondary }}>
              Cargando MuscleUp Gym...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!safeSale) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.border}`,
          color: colorTokens.textPrimary,
          borderRadius: 4
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${getStatusColor(safeSale.status)}, ${colorTokens.brandActive})`,
          color: colorTokens.textOnBrand,
          borderRadius: '16px 16px 0 0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {safeSale.status === 'completed' && <CheckCircle />}
          {safeSale.status === 'cancelled' && <Cancel />}
          {safeSale.status === 'refunded' && <Undo />}
          <Typography variant="h6" fontWeight="bold">
            Venta #{safeSale.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, background: colorTokens.surfaceLevel1 }}>
        <Grid container spacing={3}>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                height: '100%',
                background: colorTokens.surfaceLevel3,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: colorTokens.success, fontWeight: 700 }}>
                  Información General
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Número de Venta:
                    </Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                      {safeSale.sale_number}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Fecha de Creación:
                    </Typography>
                    <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                      {formatDate(safeSale.created_at)}
                    </Typography>
                  </Box>

                  {safeSale.completed_at && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Fecha Completada:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                        {formatDate(safeSale.completed_at)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Estado:
                    </Typography>
                    <Chip
                      label={
                        safeSale.status === 'completed'
                          ? 'Completada'
                          : safeSale.status === 'cancelled'
                          ? 'Cancelada'
                          : safeSale.status === 'refunded'
                          ? 'Devuelta'
                          : safeSale.status
                      }
                      sx={{
                        backgroundColor: getStatusColor(safeSale.status),
                        color: colorTokens.textOnBrand,
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Método de Pago:
                    </Typography>
                    <Chip
                      label={getPaymentMethodLabel(safeSale.payment_method || '')}
                      size="small"
                      sx={{
                        backgroundColor: getPaymentMethodColor(safeSale.payment_method || ''),
                        color: colorTokens.textOnBrand,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  {safeSale.notes && safeSale.notes.trim() !== '' && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Notas:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                        {safeSale.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                height: '100%',
                background: colorTokens.surfaceLevel3,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: colorTokens.success, fontWeight: 700 }}>
                  Cliente y Cajero
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Cliente:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: colorTokens.success }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                          {safeSale.customer_name}
                        </Typography>
                        {safeSale.customer?.email && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            {safeSale.customer.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Cajero:
                    </Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary, mt: 0.5 }}>
                      {safeSale.cashier_name}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Opciones:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      {safeSale.receipt_printed && (
                        <Chip
                          label="Ticket impreso"
                          size="small"
                          sx={{
                            backgroundColor: colorTokens.info,
                            color: colorTokens.textOnBrand,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {safeSale.is_mixed_payment && (
                        <Chip
                          label="Pago mixto"
                          size="small"
                          sx={{
                            backgroundColor: colorTokens.warning,
                            color: colorTokens.textOnBrand,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {!safeSale.receipt_printed && !safeSale.is_mixed_payment && (
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontStyle: 'italic' }}>
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
            <Card
              sx={{
                background: colorTokens.surfaceLevel3,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: colorTokens.success, fontWeight: 700 }}>
                  Productos ({safeSale.sale_items.length})
                </Typography>
                
                <TableContainer
                  component={Paper}
                  sx={{
                    background: colorTokens.surfaceLevel2,
                    border: `1px solid ${colorTokens.border}`,
                    borderRadius: 2
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: colorTokens.surfaceLevel3 }}>
                        <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Producto
                        </TableCell>
                        <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          SKU
                        </TableCell>
                        <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Cantidad
                        </TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Precio Unit.
                        </TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Descuento
                        </TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {safeSale.sale_items.length > 0 ? (
                        safeSale.sale_items.map((item: any) => {
                          // ✅ CONVERSIÓN A NÚMEROS PARA ITEMS
                          const itemDiscountAmount = Number(item.discount_amount) || 0;
                          
                          return (
                            <TableRow
                              key={item.id}
                              sx={{
                                '&:hover': { backgroundColor: `${colorTokens.brand}10` },
                                '&:nth-of-type(even)': { backgroundColor: `${colorTokens.surfaceLevel1}60` }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="500" sx={{ color: colorTokens.textPrimary }}>
                                  {item.product_name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                                  {item.product_sku || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`×${item.quantity}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: colorTokens.brand,
                                    color: colorTokens.textOnBrand,
                                    fontWeight: 700
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                                  {formatPrice(item.unit_price)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ 
                                  color: itemDiscountAmount > 0 ? colorTokens.warning : colorTokens.textMuted 
                                }}>
                                  {itemDiscountAmount > 0
                                    ? `-${formatPrice(itemDiscountAmount)}`
                                    : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                                  {formatPrice(item.total_price)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, py: 2 }}>
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

          {safeSale.sale_payment_details && safeSale.sale_payment_details.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Card
                sx={{
                  background: colorTokens.surfaceLevel3,
                  border: `1px solid ${colorTokens.border}`,
                  borderRadius: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: colorTokens.success, fontWeight: 700 }}>
                    Detalles de Pago ({safeSale.sale_payment_details.length})
                  </Typography>
                  
                  <TableContainer
                    component={Paper}
                    sx={{
                      background: colorTokens.surfaceLevel2,
                      border: `1px solid ${colorTokens.border}`,
                      borderRadius: 2
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: colorTokens.surfaceLevel3 }}>
                          <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                            Método
                          </TableCell>
                          <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                            Monto
                          </TableCell>
                          <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                            Comisión
                          </TableCell>
                          <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                            Referencia
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {safeSale.sale_payment_details.map((payment: any, index: number) => {
                          // ✅ CONVERSIÓN A NÚMEROS PARA PAGOS
                          const paymentCommissionAmount = Number(payment.commission_amount) || 0;
                          const paymentCommissionRate = Number(payment.commission_rate) || 0;
                          
                          return (
                            <TableRow
                              key={payment.id || index}
                              sx={{
                                '&:hover': { backgroundColor: `${colorTokens.brand}10` },
                                '&:nth-of-type(even)': { backgroundColor: `${colorTokens.surfaceLevel1}60` }
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={getPaymentMethodLabel(payment.payment_method)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getPaymentMethodColor(payment.payment_method),
                                    color: colorTokens.textOnBrand,
                                    fontWeight: 600
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.success }}>
                                  {formatPrice(payment.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: colorTokens.warning }}>
                                  {paymentCommissionAmount > 0
                                    ? formatPrice(paymentCommissionAmount)
                                    : '$0.00'}
                                </Typography>
                                {paymentCommissionRate > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: colorTokens.textSecondary, display: 'block' }}
                                  >
                                    ({paymentCommissionRate.toFixed(2)}%)
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                  {payment.payment_reference || 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                background: colorTokens.surfaceLevel3,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: colorTokens.success, fontWeight: 700 }}>
                  Resumen Financiero
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Subtotal:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                          {formatPrice(safeSale.subtotal)}
                        </Typography>
                      </Box>
                      
                      {safeSale.discount_amount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Descuento:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.warning }}>
                            -{formatPrice(safeSale.discount_amount)}
                          </Typography>
                        </Box>
                      )}
                      
                      {safeSale.coupon_discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Cupón{safeSale.coupon_code ? ` (${safeSale.coupon_code})` : ''}:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.success }}>
                            -{formatPrice(safeSale.coupon_discount)}
                          </Typography>
                        </Box>
                      )}
                      
                      {safeSale.tax_amount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Impuestos:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                            {formatPrice(safeSale.tax_amount)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                          Total:
                        </Typography>
                        <Typography variant="h5" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                          {formatPrice(safeSale.total_amount)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
{safeSale.commission_amount > 0 && (
                        <Box sx={{ 
                          p: 2,
                          bgcolor: `${colorTokens.warning}10`,
                          borderRadius: 2,
                          border: `1px solid ${colorTokens.warning}`
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: colorTokens.textMuted, 
                            textTransform: 'uppercase', 
                            fontSize: '0.7rem' 
                          }}>
                            Comisiones Totales
                          </Typography>
                          <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 700, mt: 1 }}>
                            {formatPrice(safeSale.commission_amount)}
                          </Typography>
                          {safeSale.commission_rate && safeSale.commission_rate > 0 && (
                            <Typography variant="caption" sx={{ 
                              color: colorTokens.textMuted, 
                              mt: 0.5, 
                              display: 'block' 
                            }}>
                              Tasa: {safeSale.commission_rate}%
                            </Typography>
                          )}
                        </Box>
                      )}

{safeSale.change_amount > 0 && (
                        <Box sx={{ 
                          p: 2,
                          bgcolor: `${colorTokens.info}10`,
                          borderRadius: 2,
                          border: `1px solid ${colorTokens.info}`
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: colorTokens.textMuted, 
                            textTransform: 'uppercase', 
                            fontSize: '0.7rem' 
                          }}>
                            Cambio Entregado
                          </Typography>
                          <Typography variant="h5" sx={{ color: colorTokens.info, fontWeight: 700, mt: 1 }}>
                            {formatPrice(safeSale.change_amount)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>

                {safeSale.cancel_reason && safeSale.cancel_reason.trim() !== '' && (
                  <Box sx={{ 
                    mt: 3,
                    p: 2,
                    bgcolor: `${colorTokens.danger}10`,
                    borderRadius: 2,
                    border: `1px solid ${colorTokens.danger}`
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: colorTokens.danger, 
                      textTransform: 'uppercase', 
                      fontSize: '0.7rem', 
                      mb: 1, 
                      display: 'block', 
                      fontWeight: 700 
                    }}>
                      Razón de {safeSale.status === 'cancelled' ? 'Cancelación' : 'Devolución'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                      {safeSale.cancel_reason}
                    </Typography>
                    {safeSale.cancelled_at && (
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.textMuted, 
                        mt: 1, 
                        display: 'block' 
                      }}>
                        Fecha: {formatDate(safeSale.cancelled_at)}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          background: colorTokens.surfaceLevel2,
          borderTop: `1px solid ${colorTokens.border}`
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandActive}, ${colorTokens.brand})`,
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