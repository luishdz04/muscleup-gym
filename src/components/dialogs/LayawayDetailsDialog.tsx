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
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

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

// ✅ POR ESTO:
interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
}

export default function SaleDetailsDialog({ open, onClose, sale }: SaleDetailsDialogProps) {
  
  // ✅ FUNCIONES UTILITARIAS CORREGIDAS CON ZONA HORARIA MÉXICO
  const getMexicoDate = useCallback(() => {
    const now = new Date();
    // ✅ OBTENER FECHA MÉXICO CORRECTAMENTE
    return new Date(now.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ FORMATEO DE FECHAS CORREGIDO CON ZONA HORARIA MÉXICO
  const formatMexicoDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      timeZone: 'America/Monterrey', // ✅ EXPLÍCITO
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // ✅ MANTENER FUNCIÓN LEGACY PARA COMPATIBILIDAD
  const formatDate = useCallback((dateString: string) => {
    return formatMexicoDate(dateString);
  }, [formatMexicoDate]);

  if (!sale) return null;

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
        background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon />
          <Typography variant="h6" fontWeight="bold">
            📊 Detalles de Venta #{sale.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, background: darkProTokens.surfaceLevel1 }}>
        <Grid container spacing={3}>
          {/* ✅ Información general */}
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
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Número de Venta:</Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>{sale.sale_number}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Fecha:</Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{formatDate(sale.created_at)}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Tipo de Venta:</Typography>
                    <Chip 
                      label={sale.sale_type === 'sale' ? 'Venta Directa' : 'Apartado'} 
                      sx={{
                        backgroundColor: sale.sale_type === 'sale' ? darkProTokens.success : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Estado:</Typography>
                    <Chip 
                      label={sale.status} 
                      sx={{
                        backgroundColor: 
                          sale.status === 'completed' ? darkProTokens.success :
                          sale.status === 'pending' ? darkProTokens.warning :
                          sale.status === 'cancelled' ? darkProTokens.error : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Estado de Pago:</Typography>
                    <Chip 
                      label={sale.payment_status} 
                      sx={{
                        backgroundColor: 
                          sale.payment_status === 'paid' ? darkProTokens.success :
                          sale.payment_status === 'partial' ? darkProTokens.warning :
                          sale.payment_status === 'pending' ? darkProTokens.error : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>
                  
                  {sale.notes && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Notas:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{sale.notes}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ Cliente y cajero */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%',
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  👤 Cliente y Cajero
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cliente:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: darkProTokens.success }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {sale.customer_name || 'Cliente General'}
                        </Typography>
                        {sale.customer_email && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            {sale.customer_email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cajero:</Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                      {sale.cashier_name || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Opciones:</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {sale.receipt_printed && (
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
                      {sale.email_sent && (
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
                      {sale.is_mixed_payment && (
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
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ Productos */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  🛒 Productos Vendidos ({sale.items?.length || 0})
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
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>SKU</TableCell>
                        <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Cantidad</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Precio Unit.</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Descuento</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Impuestos</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sale.items?.map((item: any, index: number) => (
                        <TableRow key={index} sx={{
                          '&:hover': { backgroundColor: `${darkProTokens.primary}10` },
                          '&:nth-of-type(even)': { backgroundColor: `${darkProTokens.surfaceLevel1}60` }
                        }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" sx={{ color: darkProTokens.textPrimary }}>
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              {item.product_sku || 'N/A'}
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
                            <Typography variant="body2" sx={{ color: darkProTokens.error }}>
                              {(item.discount_amount > 0) ? `-${formatPrice(item.discount_amount)}` : '$0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: darkProTokens.info }}>
                              {formatPrice(item.tax_amount || 0)}
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
                          <TableCell colSpan={7} align="center">
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

          {/* ✅ Información de pagos */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%',
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  💳 Información de Pagos
                </Typography>
                
                {sale.is_mixed_payment ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2, color: darkProTokens.textSecondary }}>Pago Mixto:</Typography>
                    {sale.payment_details?.map((payment: any, index: number) => (
                      <Box key={index} sx={{ 
                        p: 2, 
                        border: `1px solid ${darkProTokens.grayDark}`, 
                        borderRadius: 2, 
                        mb: 1,
                        background: darkProTokens.surfaceLevel2
                      }}>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          Pago #{payment.sequence_order}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Método: {payment.payment_method === 'efectivo' && '💵 Efectivo'}
                          {payment.payment_method === 'debito' && '💳 Débito'}
                          {payment.payment_method === 'credito' && '💳 Crédito'}
                          {payment.payment_method === 'transferencia' && '🏦 Transferencia'}
                          {payment.payment_method === 'vales' && '🎫 Vales'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                          Monto: {formatPrice(payment.amount)}
                        </Typography>
                        {payment.commission_amount > 0 && (
                          <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                            Comisión ({payment.commission_rate}%): {formatPrice(payment.commission_amount)}
                          </Typography>
                        )}
                        {payment.payment_reference && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            Ref: {payment.payment_reference}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                          {formatDate(payment.payment_date)}
                        </Typography>
                      </Box>
                    )) || (
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        No hay detalles de pago disponibles
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Método de Pago:</Typography>
                      <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                        {sale.payment_method === 'efectivo' && '💵 Efectivo'}
                        {sale.payment_method === 'debito' && '💳 Tarjeta Débito'}
                        {sale.payment_method === 'credito' && '💳 Tarjeta Crédito'}
                        {sale.payment_method === 'transferencia' && '🏦 Transferencia'}
                        {sale.payment_method === 'vales' && '🎫 Vales de Despensa'}
                        {!sale.payment_method && 'No especificado'}
                      </Typography>
                    </Box>
                    
                    {sale.commission_amount > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisión:</Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(sale.commission_amount)}
                        </Typography>
                      </Box>
                    )}
                    
                    {sale.change_amount > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cambio:</Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.info }}>
                          {formatPrice(sale.change_amount)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ Totales */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              height: '100%',
              background: darkProTokens.surfaceLevel3,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: darkProTokens.success, fontWeight: 700 }}>
                  💰 Resumen Financiero
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                      {formatPrice(sale.subtotal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Impuestos:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.info }}>
                      {formatPrice(sale.tax_amount || 0)}
                    </Typography>
                  </Box>
                  
                  {((sale.discount_amount || 0) > 0 || (sale.coupon_discount || 0) > 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Descuentos:</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.error }}>
                        -{formatPrice((sale.discount_amount || 0) + (sale.coupon_discount || 0))}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total Base:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                      {formatPrice(sale.total_amount || 0)}
                    </Typography>
                  </Box>
                  
                  {(sale.commission_amount || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisiones:</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                        +{formatPrice(sale.commission_amount)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ borderColor: darkProTokens.grayDark }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    background: `${darkProTokens.success}20`,
                    borderRadius: 2,
                    border: `1px solid ${darkProTokens.success}30`
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>Total Final:</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                      {formatPrice((sale.total_amount || 0) + (sale.commission_amount || 0))}
                    </Typography>
                  </Box>
                  
                  {sale.payment_status === 'partial' && (sale.pending_amount || 0) > 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      p: 2,
                      background: `${darkProTokens.warning}20`,
                      borderRadius: 2,
                      border: `1px solid ${darkProTokens.warning}30`
                    }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>Pendiente por Pagar:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {formatPrice(sale.pending_amount)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
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

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success});
        }
      `}</style>
    </Dialog>
  );
}
