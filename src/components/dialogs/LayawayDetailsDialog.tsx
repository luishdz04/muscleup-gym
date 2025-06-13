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

interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
}

export default function LayawayDetailsDialog({ open, onClose, layaway }: LayawayDetailsDialogProps) {
  
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

  if (!layaway) return null;

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
            📦 Detalles de Apartado #{layaway.sale_number}
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
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Número de Apartado:</Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>{layaway.sale_number}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Fecha:</Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>{formatDate(layaway.created_at)}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Tipo:</Typography>
                    <Chip 
                      label={layaway.sale_type === 'sale' ? 'Venta Directa' : 'Apartado'} 
                      sx={{
                        backgroundColor: layaway.sale_type === 'sale' ? darkProTokens.success : darkProTokens.roleModerator,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Estado:</Typography>
                    <Chip 
                      label={layaway.status} 
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
                      label={layaway.payment_status} 
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

                  {/* ✅ INFORMACIÓN ESPECÍFICA DE APARTADOS */}
                  {layaway.layaway_expires_at && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Fecha de Vencimiento:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.warning }}>
                        {formatDate(layaway.layaway_expires_at)}
                      </Typography>
                    </Box>
                  )}

                  {layaway.deposit_percentage && (
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Porcentaje de Anticipo:</Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.primary }}>
                        {layaway.deposit_percentage}%
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
                          {layaway.customer_name || 'Cliente General'}
                        </Typography>
                        {layaway.customer_email && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            {layaway.customer_email}
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
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cajero:</Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                      {layaway.cashier_name || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Opciones:</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
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
                  🛒 Productos Apartados ({layaway.items?.length || 0})
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
                  💳 Historial de Pagos
                </Typography>
                
                {layaway.is_mixed_payment ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2, color: darkProTokens.textSecondary }}>Pago Mixto:</Typography>
                    {layaway.payment_history?.map((payment: any, index: number) => (
                      <Box key={index} sx={{ 
                        p: 2, 
                        border: `1px solid ${darkProTokens.grayDark}`, 
                        borderRadius: 2, 
                        mb: 1,
                        background: darkProTokens.surfaceLevel2
                      }}>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          Pago #{payment.sequence_order || index + 1}
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
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Último Método de Pago:</Typography>
                      <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                        {layaway.payment_method === 'efectivo' && '💵 Efectivo'}
                        {layaway.payment_method === 'debito' && '💳 Tarjeta Débito'}
                        {layaway.payment_method === 'credito' && '💳 Tarjeta Crédito'}
                        {layaway.payment_method === 'transferencia' && '🏦 Transferencia'}
                        {layaway.payment_method === 'vales' && '🎫 Vales de Despensa'}
                        {!layaway.payment_method && 'No especificado'}
                      </Typography>
                    </Box>
                    
                    {layaway.commission_amount > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisión Total:</Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(layaway.commission_amount)}
                        </Typography>
                      </Box>
                    )}
                    
                    {layaway.change_amount > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cambio:</Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.info }}>
                          {formatPrice(layaway.change_amount)}
                        </Typography>
                      </Box>
                    )}

                    {layaway.last_payment_date && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Último Pago:</Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                          {formatDate(layaway.last_payment_date)}
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
                      {formatPrice(layaway.subtotal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Impuestos:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.info }}>
                      {formatPrice(layaway.tax_amount || 0)}
                    </Typography>
                  </Box>
                  
                  {((layaway.discount_amount || 0) > 0 || (layaway.coupon_discount || 0) > 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Descuentos:</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.error }}>
                        -{formatPrice((layaway.discount_amount || 0) + (layaway.coupon_discount || 0))}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total Base:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                      {formatPrice(layaway.total_amount || 0)}
                    </Typography>
                  </Box>
                  
                  {(layaway.commission_amount || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisiones:</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                        +{formatPrice(layaway.commission_amount)}
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
                      {formatPrice((layaway.total_amount || 0) + (layaway.commission_amount || 0))}
                    </Typography>
                  </Box>

                  {/* ✅ INFORMACIÓN ESPECÍFICA DE APARTADOS */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    background: `${darkProTokens.info}20`,
                    borderRadius: 2,
                    border: `1px solid ${darkProTokens.info}30`
                  }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>Total Pagado:</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                      {formatPrice(layaway.paid_amount || 0)}
                    </Typography>
                  </Box>
                  
                  {layaway.payment_status === 'partial' && (layaway.pending_amount || 0) > 0 && (
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
                        {formatPrice(layaway.pending_amount)}
                      </Typography>
                    </Box>
                  )}

                  {layaway.required_deposit && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      p: 2,
                      background: `${darkProTokens.roleModerator}20`,
                      borderRadius: 2,
                      border: `1px solid ${darkProTokens.roleModerator}30`
                    }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>Anticipo Requerido:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.roleModerator }}>
                        {formatPrice(layaway.required_deposit)}
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
