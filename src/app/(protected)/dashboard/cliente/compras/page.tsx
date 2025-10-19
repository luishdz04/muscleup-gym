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
  Grid,
  Collapse,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as CouponIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { formatTimestampDateOnly } from '@/utils/dateUtils';

interface SaleItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
}

interface PaymentDetail {
  payment_method: string;
  amount: number;
}

interface LayawayHistory {
  id: string;
  previous_status: string | null;
  new_status: string | null;
  previous_paid_amount: number | null;
  new_paid_amount: number | null;
  reason: string | null;
  created_at: string;
}

interface Sale {
  id: string;
  sale_number: string;
  sale_type: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  coupon_discount: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
  sale_items: SaleItem[];
  sale_payment_details: PaymentDetail[];
  layaway_status_history: LayawayHistory[];
}

interface PurchasesData {
  purchases: Sale[];
  stats: {
    totalSpentThisYear: number;
    totalPurchases: number;
    totalProducts: number;
    pendingAmount: number;
  };
}

export default function ComprasPage() {
  const [data, setData] = useState<PurchasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/purchases');

      if (!response.ok) {
        throw new Error('Error al cargar compras');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching purchases:', err);
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

  const toggleRow = (saleId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': colorTokens.success,
      'pending': colorTokens.warning,
      'cancelled': colorTokens.danger,
      'refunded': colorTokens.info,
      'expired': colorTokens.textSecondary
    };
    return colors[status.toLowerCase()] || colorTokens.textSecondary;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': colorTokens.success,
      'partial': colorTokens.warning,
      'pending': colorTokens.danger,
      'refunded': colorTokens.info
    };
    return colors[status.toLowerCase()] || colorTokens.textSecondary;
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'expired': 'Expirado'
    };
    return translations[status.toLowerCase()] || status;
  };

  const translatePaymentStatus = (status: string) => {
    const translations: Record<string, string> = {
      'paid': 'Pagado',
      'partial': 'Pago Parcial',
      'pending': 'Pendiente',
      'refunded': 'Reembolsado'
    };
    return translations[status.toLowerCase()] || status;
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
        <Alert severity="info">No se encontraron datos de compras</Alert>
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
          Historial de <Box component="span" sx={{ color: colorTokens.brand }}>Compras</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Revisa tus compras de productos del gimnasio
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {/* Total gastado este año */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Gastado este año
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {formatCurrency(data.stats.totalSpentThisYear)}
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

        {/* Total de compras */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Total de compras
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.totalPurchases}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.brand, 0.1),
                border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
              }}>
                <ShoppingCartIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total de productos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Productos comprados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.totalProducts}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.info, 0.1),
                border: `1px solid ${alpha(colorTokens.info, 0.2)}`
              }}>
                <InventoryIcon sx={{ fontSize: 32, color: colorTokens.info }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Pendiente de pago */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Pendiente de pago
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {formatCurrency(data.stats.pendingAmount)}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.warning, 0.1),
                border: `1px solid ${alpha(colorTokens.warning, 0.2)}`
              }}>
                <PendingIcon sx={{ fontSize: 32, color: colorTokens.warning }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Compras */}
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
            Mis Compras
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
                <TableCell width="50px"></TableCell>
                <TableCell>No. Venta</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Descuento</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Pago</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      No se encontraron compras registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.purchases.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <TableRow
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(colorTokens.brand, 0.05)
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(sale.id)}
                          sx={{ color: colorTokens.brand }}
                        >
                          {expandedRows.has(sale.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontFamily: 'monospace', fontWeight: 600 }}>
                        {sale.sale_number}
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 500 }}>
                        {formatTimestampDateOnly(sale.created_at)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sale.sale_type === 'layaway' ? 'Apartado' : 'Venta'}
                          size="small"
                          sx={{
                            bgcolor: sale.sale_type === 'layaway'
                              ? alpha(colorTokens.warning, 0.1)
                              : alpha(colorTokens.info, 0.1),
                            color: sale.sale_type === 'layaway' ? colorTokens.warning : colorTokens.info,
                            border: `1px solid ${alpha(
                              sale.sale_type === 'layaway' ? colorTokens.warning : colorTokens.info,
                              0.2
                            )}`,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: colorTokens.textPrimary }}>
                        {formatCurrency(sale.subtotal)}
                      </TableCell>
                      <TableCell align="right">
                        {(sale.discount_amount > 0 || sale.coupon_discount > 0) ? (
                          <Box>
                            <Typography sx={{ color: colorTokens.success, fontWeight: 600, fontSize: '0.9rem' }}>
                              -{formatCurrency(sale.discount_amount + sale.coupon_discount)}
                            </Typography>
                            {sale.coupon_discount > 0 && (
                              <Chip
                                icon={<CouponIcon sx={{ fontSize: 14 }} />}
                                label="Cupón"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  mt: 0.5,
                                  bgcolor: alpha(colorTokens.success, 0.1),
                                  color: colorTokens.success,
                                  '& .MuiChip-icon': { color: colorTokens.success }
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography sx={{ color: colorTokens.textSecondary }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: colorTokens.brand }}>
                          {formatCurrency(sale.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={translateStatus(sale.status)}
                          size="small"
                          sx={{
                            bgcolor: alpha(getStatusColor(sale.status), 0.1),
                            color: getStatusColor(sale.status),
                            border: `1px solid ${alpha(getStatusColor(sale.status), 0.2)}`,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={translatePaymentStatus(sale.payment_status)}
                          size="small"
                          sx={{
                            bgcolor: alpha(getPaymentStatusColor(sale.payment_status), 0.1),
                            color: getPaymentStatusColor(sale.payment_status),
                            border: `1px solid ${alpha(getPaymentStatusColor(sale.payment_status), 0.2)}`,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Items Details */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, borderBottom: expandedRows.has(sale.id) ? undefined : 'none' }}>
                        <Collapse in={expandedRows.has(sale.id)} timeout="auto" unmountOnExit>
                          <Box sx={{
                            p: 3,
                            bgcolor: alpha(colorTokens.black, 0.2),
                            borderTop: `1px solid ${alpha(colorTokens.border, 0.1)}`
                          }}>
                            <Typography variant="subtitle2" sx={{ color: colorTokens.brand, fontWeight: 700, mb: 2 }}>
                              Productos Comprados:
                            </Typography>
                            <List dense>
                              {sale.sale_items.map((item) => (
                                <ListItem
                                  key={item.id}
                                  sx={{
                                    bgcolor: alpha(colorTokens.surfaceLevel3, 0.5),
                                    borderRadius: 1,
                                    mb: 1,
                                    border: `1px solid ${alpha(colorTokens.border, 0.1)}`
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                          {item.product_name}
                                          {item.product_sku && (
                                            <Typography component="span" sx={{ color: colorTokens.textSecondary, ml: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                              ({item.product_sku})
                                            </Typography>
                                          )}
                                        </Typography>
                                        <Typography sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                          {formatCurrency(item.total_price)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.85rem' }}>
                                        Cantidad: {item.quantity} × {formatCurrency(item.unit_price)}
                                        {item.discount_amount > 0 && (
                                          <Typography component="span" sx={{ color: colorTokens.success, ml: 2 }}>
                                            (Desc: -{formatCurrency(item.discount_amount)})
                                          </Typography>
                                        )}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>

                            {/* Payment Details - Solo para ventas normales, no apartados */}
                            {sale.sale_type !== 'layaway' && sale.sale_payment_details && sale.sale_payment_details.length > 0 && (
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: colorTokens.brand, fontWeight: 700, mb: 2 }}>
                                  Detalles de Pago:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {sale.sale_payment_details.map((payment, idx) => (
                                    <Chip
                                      key={idx}
                                      label={`${payment.payment_method.replace('_', ' ')}: ${formatCurrency(payment.amount)}`}
                                      sx={{
                                        bgcolor: alpha(colorTokens.info, 0.1),
                                        color: colorTokens.info,
                                        border: `1px solid ${alpha(colorTokens.info, 0.2)}`,
                                        fontWeight: 600,
                                        textTransform: 'capitalize'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Layaway Payment History */}
                            {sale.sale_type === 'layaway' && (
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: colorTokens.brand, fontWeight: 700, mb: 2 }}>
                                  Historial de Abonos:
                                </Typography>
                                {sale.layaway_status_history && sale.layaway_status_history.length > 0 ? (
                                  // Mostrar historial de abonos detallado
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {sale.layaway_status_history
                                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                      .map((history, idx) => {
                                        const paymentAmount = (history.new_paid_amount || 0) - (history.previous_paid_amount || 0);
                                        return (
                                          <Box
                                            key={history.id}
                                            sx={{
                                              p: 2,
                                              bgcolor: alpha(colorTokens.surfaceLevel3, 0.5),
                                              borderRadius: 1,
                                              border: `1px solid ${alpha(colorTokens.border, 0.1)}`,
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <Box>
                                              <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                                                Abono #{idx + 1}
                                              </Typography>
                                              <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.8rem' }}>
                                                {formatTimestampDateOnly(history.created_at)}
                                              </Typography>
                                              {history.reason && (
                                                <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem', fontStyle: 'italic', mt: 0.5 }}>
                                                  {history.reason}
                                                </Typography>
                                              )}
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                              <Typography sx={{ color: colorTokens.success, fontWeight: 700, fontSize: '1rem' }}>
                                                +{formatCurrency(paymentAmount)}
                                              </Typography>
                                              <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                                                Total: {formatCurrency(history.new_paid_amount || 0)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                  </Box>
                                ) : sale.sale_payment_details && sale.sale_payment_details.length > 0 ? (
                                  // Si no hay historial detallado, mostrar los pagos como abonos
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {sale.sale_payment_details.map((payment, idx) => (
                                      <Box
                                        key={idx}
                                        sx={{
                                          p: 2,
                                          bgcolor: alpha(colorTokens.surfaceLevel3, 0.5),
                                          borderRadius: 1,
                                          border: `1px solid ${alpha(colorTokens.border, 0.1)}`,
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <Box>
                                          <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                                            Pago #{idx + 1}
                                          </Typography>
                                          <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.8rem' }}>
                                            {formatTimestampDateOnly(sale.created_at)}
                                          </Typography>
                                          <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem', fontStyle: 'italic', mt: 0.5 }}>
                                            Método: {payment.payment_method.replace('_', ' ').toUpperCase()}
                                            {payment.payment_reference && ` - Ref: ${payment.payment_reference}`}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                          <Typography sx={{ color: colorTokens.success, fontWeight: 700, fontSize: '1rem' }}>
                                            +{formatCurrency(payment.amount)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ))}
                                    <Box sx={{
                                      p: 1.5,
                                      bgcolor: alpha(colorTokens.info, 0.1),
                                      borderRadius: 1,
                                      border: `1px solid ${alpha(colorTokens.info, 0.2)}`,
                                      textAlign: 'center'
                                    }}>
                                      <Typography sx={{ color: colorTokens.info, fontSize: '0.75rem', fontStyle: 'italic' }}>
                                        💡 Este apartado fue pagado directamente sin abonos intermedios
                                      </Typography>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{
                                    p: 2,
                                    bgcolor: alpha(colorTokens.surfaceLevel3, 0.3),
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(colorTokens.border, 0.1)}`,
                                    textAlign: 'center'
                                  }}>
                                    <Typography sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem', fontStyle: 'italic' }}>
                                      No hay información de pagos disponible
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}

                            {/* Pending Amount */}
                            {sale.pending_amount > 0 && (
                              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(colorTokens.warning, 0.1), borderRadius: 1, border: `1px solid ${alpha(colorTokens.warning, 0.2)}` }}>
                                <Typography sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                                  Saldo Pendiente: {formatCurrency(sale.pending_amount)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
