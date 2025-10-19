"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CreditCard as CreditCardIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { formatTimestampDateOnly, formatDateForDisplay } from '@/utils/dateUtils';

interface PaymentDetail {
  id: string;
  membership_id: string;
  payment_method: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_reference: string | null;
  sequence_order: number;
  created_at: string;
  membership?: {
    payment_type: string;
    total_amount: number;
    start_date: string;
    end_date: string;
    status: string;
    plan: {
      name: string;
    };
  };
}

interface PaymentsData {
  payments: PaymentDetail[];
  stats: {
    totalPaidThisYear: number;
    totalPayments: number;
    nextPaymentDate: string | null;
  };
}

export default function PagosPage() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/payments');

      if (!response.ok) {
        throw new Error('Error al cargar pagos');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'efectivo': colorTokens.success,
      'tarjeta_credito': colorTokens.info,
      'tarjeta_debito': colorTokens.info,
      'transferencia': colorTokens.warning,
      'otro': colorTokens.textSecondary
    };
    return colors[method.toLowerCase()] || colorTokens.textSecondary;
  };

  const translatePaymentType = (paymentType: string) => {
    const translations: Record<string, string> = {
      'monthly': 'Mensualidad',
      'biweekly': 'Quincenal',
      'weekly': 'Semanal',
      'visit': 'Por Visita',
      'bimonthly': 'Bimestral',
      'quarterly': 'Trimestral',
      'semester': 'Semestral',
      'annual': 'Anual'
    };
    return translations[paymentType.toLowerCase()] || paymentType;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No se encontraron datos de pagos</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          color: colorTokens.textPrimary,
          mb: 1,
          fontSize: { xs: '1.75rem', sm: '2.5rem' }
        }}>
          Historial de <Box component="span" sx={{ color: colorTokens.brand }}>Pagos</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Gestiona y revisa tus pagos de membresías
        </Typography>
      </Box>

      {/* Resumen - Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {/* Total pagado este año */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Total pagado este año
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {formatCurrency(data.stats.totalPaidThisYear)}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.success, 0.1),
                border: `1px solid ${alpha(colorTokens.success, 0.2)}`
              }}>
                <MoneyIcon sx={{ fontSize: 32, color: colorTokens.success }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Pagos realizados */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Pagos realizados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.totalPayments}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.brand, 0.1),
                border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
              }}>
                <CreditCardIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Próximo pago */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Próximo pago estimado
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.nextPaymentDate ? formatDateForDisplay(data.stats.nextPaymentDate.split('T')[0]) : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.info, 0.1),
                border: `1px solid ${alpha(colorTokens.info, 0.2)}`
              }}>
                <CalendarIcon sx={{ fontSize: 32, color: colorTokens.info }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Pagos */}
      <Paper sx={{
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${alpha(colorTokens.border, 0.1)}`
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: colorTokens.brand
          }}>
            Historial de Transacciones
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: alpha(colorTokens.black, 0.2),
                  color: colorTokens.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 2
                }
              }}>
                <TableCell>Fecha</TableCell>
                <TableCell>Plan / Concepto</TableCell>
                <TableCell>Periodo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Método de Pago</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell align="center">Comisión</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      No se encontraron pagos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(colorTokens.brand, 0.05)
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 500 }}>
                      {formatTimestampDateOnly(payment.created_at)}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                          {payment.membership?.plan?.name || 'N/A'}
                        </Typography>
                        <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.8rem', mt: 0.5 }}>
                          {payment.membership?.payment_type
                            ? translatePaymentType(payment.membership.payment_type)
                            : 'Pago de membresía'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {payment.membership?.start_date && payment.membership?.end_date ? (
                        <Box>
                          <Typography sx={{ color: colorTokens.textPrimary, fontSize: '0.85rem' }}>
                            {formatDateForDisplay(payment.membership.start_date)}
                          </Typography>
                          <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                            al {formatDateForDisplay(payment.membership.end_date)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: colorTokens.textSecondary }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: colorTokens.brand }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.payment_method.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: alpha(getPaymentMethodColor(payment.payment_method), 0.1),
                          color: getPaymentMethodColor(payment.payment_method),
                          border: `1px solid ${alpha(getPaymentMethodColor(payment.payment_method), 0.2)}`,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textSecondary, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {payment.payment_reference || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ color: colorTokens.textSecondary }}>
                      {payment.commission_amount > 0
                        ? formatCurrency(payment.commission_amount)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
