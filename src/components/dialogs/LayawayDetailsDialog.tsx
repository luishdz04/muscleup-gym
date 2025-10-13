// components/dialogs/LayawayDetailsDialog.tsx - v7.0 ENTERPRISE COMPLETO

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
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE MUSCLEUP v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { formatTimestampForDisplay } from '@/utils/dateUtils';

// ✅ INTERFACE FLEXIBLE - Compatible con LayawayWithDetails
interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: {
    id: string;
    sale_number: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    total_amount: number;
    paid_amount: number;
    pending_amount?: number;  // ✅ CORRECCIÓN: Opcional
    status: string;
    payment_status?: string;
    created_at: string;
    layaway_expires_at?: string;
    last_payment_date?: string;
    deposit_percentage?: number;
    required_deposit?: number;
    notes?: string;
    receipt_printed?: boolean;
    email_sent?: boolean;
    is_mixed_payment?: boolean;
    source_warehouse_id?: string;
    sale_items?: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    items?: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    sale_payment_details?: Array<{
      id: string;
      payment_method: string;
      amount: number;
      payment_date: string;
      commission_amount?: number;
      commission_rate?: number;
      payment_reference?: string;
      sequence_order?: number;
      is_partial_payment?: boolean;
      notes?: string;
    }>;
    payment_history?: Array<any>;
    payments?: Array<any>;
  } | null;
}

export default function LayawayDetailsDialog({ open, onClose, layaway }: LayawayDetailsDialogProps) {
  const hydrated = useHydrated();

  const formatPrice = useCallback((price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numPrice || 0);
  }, []);

  const safeLayaway = useMemo(() => {
    if (!layaway) return null;
    
    const normalizedItems = layaway.items || layaway.sale_items || [];
    const normalizedPayments = layaway.payment_history || layaway.sale_payment_details || layaway.payments || [];
    
    return {
      ...layaway,
      items: normalizedItems,
      payment_history: normalizedPayments,
      customer_name: layaway.customer_name || 'Cliente General',
      // ✅ CORRECCIÓN: Asegurar que pending_amount tenga valor
      pending_amount: layaway.pending_amount ?? 0
    };
  }, [layaway]);

  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    
    const total = parseFloat(safeLayaway.total_amount as any || 0);
    const paid = parseFloat(safeLayaway.paid_amount as any || 0);
    const progress = total > 0 ? (paid / total) * 100 : 0;
    
    let daysLeft = null;
    if (safeLayaway.layaway_expires_at) {
      const today = new Date();
      const expiration = new Date(safeLayaway.layaway_expires_at);
      const diffTime = expiration.getTime() - today.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return { progress, daysLeft };
  }, [safeLayaway]);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return colorTokens.success;
    if (percentage >= 50) return colorTokens.warning;
    return colorTokens.danger;
  }, []);

  const getPaymentMethodLabel = useCallback((method: string) => {
    const labels: Record<string, string> = {
      'efectivo': '💵 Efectivo',
      'debito': '💳 Tarjeta Débito',
      'credito': '💳 Tarjeta Crédito',
      'transferencia': '🏦 Transferencia',
      'vales': '🎫 Vales de Despensa'
    };
    return labels[method] || method || 'No especificado';
  }, []);

  const getPaymentMethodColor = useCallback((method: string) => {
    const colors: Record<string, string> = {
      'efectivo': colorTokens.success,
      'debito': colorTokens.info,
      'credito': colorTokens.warning,
      'transferencia': colorTokens.brand,
      'vales': colorTokens.brand
    };
    return colors[method] || colorTokens.neutral600;
  }, []);

  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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

  if (!safeLayaway || !calculations) return null;

  const { progress, daysLeft } = calculations;

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
          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
          color: colorTokens.textOnBrand,
          borderRadius: '16px 16px 0 0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon />
          <Typography variant="h6" fontWeight="bold">
            Apartado #{safeLayaway.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, background: colorTokens.surfaceLevel1 }}>
        <Grid container spacing={3}>
          
          {/* ✅ PROGRESO DEL APARTADO */}
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                border: `1px solid ${colorTokens.brand}30`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ProgressIcon sx={{ color: colorTokens.brand }} />
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                    Progreso del Apartado
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
                      backgroundColor: colorTokens.neutral500,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(progress),
                        borderRadius: 6
                      }
                    }}
                  />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, minWidth: 60 }}>
                    {Math.round(progress)}%
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${colorTokens.success}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Total Pagado
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        {formatPrice(safeLayaway.paid_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${colorTokens.warning}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Pendiente
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                        {/* ✅ CORRECCIÓN: Usar fallback || 0 */}
                        {formatPrice(safeLayaway.pending_amount || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${colorTokens.info}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Total Final
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.info }}>
                        {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: `${colorTokens.danger}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Días Restantes
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          color: daysLeft !== null
                            ? daysLeft > 7
                              ? colorTokens.success
                              : daysLeft > 0
                              ? colorTokens.warning
                              : colorTokens.danger
                            : colorTokens.textSecondary
                        }}
                      >
                        {daysLeft !== null ? (daysLeft > 0 ? daysLeft : 'Vencido') : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ INFORMACIÓN GENERAL */}
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
                      Número de Apartado:
                    </Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                      {safeLayaway.sale_number}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Fecha de Creación:
                    </Typography>
                    <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                      {formatTimestampForDisplay(safeLayaway.created_at)}
                    </Typography>
                  </Box>

                  {safeLayaway.layaway_expires_at && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Fecha de Vencimiento:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: daysLeft !== null
                            ? daysLeft > 7
                              ? colorTokens.success
                              : daysLeft > 0
                              ? colorTokens.warning
                              : colorTokens.danger
                            : colorTokens.textPrimary
                        }}
                      >
                        {formatTimestampForDisplay(safeLayaway.layaway_expires_at)}
                      </Typography>
                    </Box>
                  )}

                  {safeLayaway.last_payment_date && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Último Pago:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                        {formatTimestampForDisplay(safeLayaway.last_payment_date)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Estado:
                    </Typography>
                    <Chip
                      label={
                        safeLayaway.status === 'pending'
                          ? 'Pendiente'
                          : safeLayaway.status === 'completed'
                          ? 'Completado'
                          : safeLayaway.status
                      }
                      sx={{
                        backgroundColor:
                          safeLayaway.status === 'completed'
                            ? colorTokens.success
                            : safeLayaway.status === 'pending'
                            ? colorTokens.warning
                            : safeLayaway.status === 'cancelled'
                            ? colorTokens.danger
                            : colorTokens.brand,
                        color: colorTokens.textOnBrand,
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Estado de Pago:
                    </Typography>
                    <Chip
                      label={
                        safeLayaway.payment_status === 'paid'
                          ? 'Pagado'
                          : safeLayaway.payment_status === 'partial'
                          ? 'Parcial'
                          : safeLayaway.payment_status === 'pending'
                          ? 'Pendiente'
                          : safeLayaway.payment_status || 'N/A'
                      }
                      sx={{
                        backgroundColor:
                          safeLayaway.payment_status === 'paid'
                            ? colorTokens.success
                            : safeLayaway.payment_status === 'partial'
                            ? colorTokens.warning
                            : safeLayaway.payment_status === 'pending'
                            ? colorTokens.danger
                            : colorTokens.brand,
                        color: colorTokens.textOnBrand,
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  </Box>

                  {safeLayaway.deposit_percentage && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Anticipo Requerido:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.brand }}>
                        {safeLayaway.deposit_percentage}% = {formatPrice(safeLayaway.required_deposit || 0)}
                      </Typography>
                    </Box>
                  )}
                  
                  {safeLayaway.notes && (
                    <Box>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Notas:
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                        {safeLayaway.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ INFORMACIÓN DEL CLIENTE */}
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
                  Información del Cliente
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
                          {safeLayaway.customer_name}
                        </Typography>
                        {safeLayaway.customer_email && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            {safeLayaway.customer_email}
                          </Typography>
                        )}
                        {safeLayaway.customer_phone && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            {safeLayaway.customer_phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Opciones:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      {safeLayaway.receipt_printed && (
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
                      {safeLayaway.email_sent && (
                        <Chip
                          label="Email enviado"
                          size="small"
                          sx={{
                            backgroundColor: colorTokens.brand,
                            color: colorTokens.textOnBrand,
                            fontWeight: 600
                          }}
                        />
                      )}
                      {safeLayaway.is_mixed_payment && (
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
                      {!safeLayaway.receipt_printed && !safeLayaway.email_sent && !safeLayaway.is_mixed_payment && (
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

          {/* ✅ PRODUCTOS DEL APARTADO */}
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
                  Productos del Apartado ({safeLayaway.items.length})
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
                          Cantidad
                        </TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Precio Unit.
                        </TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {safeLayaway.items.length > 0 ? (
                        safeLayaway.items.map((item: any, index: number) => (
                          <TableRow
                            key={index}
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
                              <Chip
                                label={item.quantity}
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
                              <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                                {formatPrice(item.total_price)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
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

          {/* ✅ HISTORIAL DE ABONOS */}
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
                  Historial de Abonos ({safeLayaway.payment_history.length})
                </Typography>
                
                {safeLayaway.payment_history.length > 0 ? (
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
                          <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>Fecha</TableCell>
                          <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold' }}>Método</TableCell>
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
                        {safeLayaway.payment_history
                          .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                          .map((payment: any, index: number) => (
                            <TableRow
                              key={payment.id || index}
                              sx={{
                                '&:hover': { backgroundColor: `${colorTokens.brand}10` },
                                '&:nth-of-type(even)': { backgroundColor: `${colorTokens.surfaceLevel1}60` }
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={`#${payment.sequence_order || index + 1}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: colorTokens.brand,
                                    color: colorTokens.textOnBrand,
                                    fontWeight: 700
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                                  {formatTimestampForDisplay(payment.payment_date)}
                                </Typography>
                                {payment.is_partial_payment && (
                                  <Typography variant="caption" sx={{ color: colorTokens.info, display: 'block' }}>
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
                                  {parseFloat(payment.commission_amount || 0) > 0
                                    ? formatPrice(payment.commission_amount)
                                    : '$0.00'}
                                </Typography>
                                {parseFloat(payment.commission_rate || 0) > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: colorTokens.textSecondary, display: 'block' }}
                                  >
                                    ({payment.commission_rate}%)
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                  {payment.payment_reference || 'N/A'}
                                </Typography>
                                {payment.notes && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: colorTokens.textMuted, display: 'block' }}
                                  >
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
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      background: colorTokens.surfaceLevel2,
                      borderRadius: 2,
                      border: `1px solid ${colorTokens.border}`
                    }}
                  >
                    <PaymentIcon sx={{ fontSize: 60, color: colorTokens.textMuted, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                      Sin abonos registrados
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                      Los abonos aparecerán aquí cuando se registren pagos
                    </Typography>
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