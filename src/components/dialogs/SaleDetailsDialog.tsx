// src/components/dialogs/SaleDetailsDialog.tsx
'use client';

import React from 'react';
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
import { formatPrice, formatDate } from '@/utils/formatUtils';

interface SaleDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  sale: any;
}

export default function SaleDetailsDialog({ open, onClose, sale }: SaleDetailsDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4caf50, #388e3c)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon />
          <Typography variant="h6" fontWeight="bold">
            Detalles de Venta #{sale.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* ✅ CORREGIDO: Información general */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  📋 Información General
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Número de Venta:</Typography>
                    <Typography variant="body1" fontWeight="600">{sale.sale_number}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Fecha:</Typography>
                    <Typography variant="body1">{formatDate(sale.created_at)}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Tipo de Venta:</Typography>
                    <Chip 
                      label={sale.sale_type === 'sale' ? 'Venta Directa' : 'Apartado'} 
                      color={sale.sale_type === 'sale' ? 'success' : 'secondary'} 
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Estado:</Typography>
                    <Chip 
                      label={sale.status} 
                      color={
                        sale.status === 'completed' ? 'success' :
                        sale.status === 'pending' ? 'warning' :
                        sale.status === 'cancelled' ? 'error' : 'secondary'
                      } 
                      size="small" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Estado de Pago:</Typography>
                    <Chip 
                      label={sale.payment_status} 
                      color={
                        sale.payment_status === 'paid' ? 'success' :
                        sale.payment_status === 'partial' ? 'warning' :
                        sale.payment_status === 'pending' ? 'error' : 'secondary'
                      } 
                      size="small" 
                    />
                  </Box>
                  
                  {sale.notes && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Notas:</Typography>
                      <Typography variant="body1">{sale.notes}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ CORREGIDO: Cliente y cajero */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  👤 Cliente y Cajero
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Cliente:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#4caf50' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="600">
                          {sale.customer_name || 'Cliente General'}
                        </Typography>
                        {sale.customer_email && (
                          <Typography variant="body2" color="textSecondary">
                            {sale.customer_email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Cajero:</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {sale.cashier_name || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">Opciones:</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {sale.receipt_printed && (
                        <Chip label="Ticket impreso" size="small" color="info" />
                      )}
                      {sale.email_sent && (
                        <Chip label="Email enviado" size="small" color="secondary" />
                      )}
                      {sale.is_mixed_payment && (
                        <Chip label="Pago mixto" size="small" color="warning" />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ CORREGIDO: Productos */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  🛒 Productos Vendidos
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Descuento</TableCell>
                        <TableCell align="right">Impuestos</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sale.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {item.product_sku || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="600">
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatPrice(item.unit_price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="error">
                              -{formatPrice(item.discount_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="info.main">
                              {formatPrice(item.tax_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600">
                              {formatPrice(item.total_price)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ CORREGIDO: Información de pagos */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  💳 Información de Pagos
                </Typography>
                
                {sale.is_mixed_payment ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>Pago Mixto:</Typography>
                    {sale.payment_details?.map((payment: any, index: number) => (
                      <Box key={index} sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2, 
                        mb: 1 
                      }}>
                        <Typography variant="body2" fontWeight="600">
                          Pago #{payment.sequence_order}
                        </Typography>
                        <Typography variant="body2">
                          Método: {payment.payment_method === 'efectivo' && '💵 Efectivo'}
                          {payment.payment_method === 'debito' && '💳 Débito'}
                          {payment.payment_method === 'credito' && '💳 Crédito'}
                          {payment.payment_method === 'transferencia' && '🏦 Transferencia'}
                        </Typography>
                        <Typography variant="body2">
                          Monto: {formatPrice(payment.amount)}
                        </Typography>
                        {payment.commission_amount > 0 && (
                          <Typography variant="body2" color="warning.main">
                            Comisión ({payment.commission_rate}%): {formatPrice(payment.commission_amount)}
                          </Typography>
                        )}
                        {payment.payment_reference && (
                          <Typography variant="body2" color="textSecondary">
                            Ref: {payment.payment_reference}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(payment.payment_date)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Método de Pago:</Typography>
                      <Typography variant="body1" fontWeight="600">
                        {sale.payment_method === 'efectivo' && '💵 Efectivo'}
                        {sale.payment_method === 'debito' && '💳 Tarjeta Débito'}
                        {sale.payment_method === 'credito' && '💳 Tarjeta Crédito'}
                        {sale.payment_method === 'transferencia' && '🏦 Transferencia'}
                      </Typography>
                    </Box>
                    
                    {sale.commission_amount > 0 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">Comisión:</Typography>
                        <Typography variant="body1" fontWeight="600" color="warning.main">
                          {formatPrice(sale.commission_amount)}
                        </Typography>
                      </Box>
                    )}
                    
                    {sale.change_amount > 0 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">Cambio:</Typography>
                        <Typography variant="body1" fontWeight="600" color="info.main">
                          {formatPrice(sale.change_amount)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ CORREGIDO: Totales */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  💰 Resumen Financiero
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatPrice(sale.subtotal)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Impuestos:</Typography>
                    <Typography variant="body2" color="info.main" fontWeight="600">
                      {formatPrice(sale.tax_amount)}
                    </Typography>
                  </Box>
                  
                  {(sale.discount_amount > 0 || sale.coupon_discount > 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Descuentos:</Typography>
                      <Typography variant="body2" color="error.main" fontWeight="600">
                        -{formatPrice((sale.discount_amount || 0) + (sale.coupon_discount || 0))}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Base:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatPrice(sale.total_amount)}
                    </Typography>
                  </Box>
                  
                  {sale.commission_amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Comisiones:</Typography>
                      <Typography variant="body2" color="warning.main" fontWeight="600">
                        +{formatPrice(sale.commission_amount)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" fontWeight="bold">Total Final:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatPrice(sale.total_amount + (sale.commission_amount || 0))}
                    </Typography>
                  </Box>
                  
                  {sale.payment_status === 'partial' && sale.pending_amount > 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: '#fff3e0',
                      borderRadius: 2,
                      border: '1px solid #ffcc02'
                    }}>
                      <Typography variant="body2" fontWeight="bold">Pendiente por Pagar:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
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

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}