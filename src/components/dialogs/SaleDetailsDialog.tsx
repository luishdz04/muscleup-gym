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
  Avatar,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatPrice, formatDate } from '@/utils/formatUtils';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
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
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
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
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

interface SaleDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  sale: any;
}

export default function SaleDetailsDialog({ open, onClose, sale }: SaleDetailsDialogProps) {
  if (!sale) return null;

  // ✅ OBTENER ICONO DEL MÉTODO DE PAGO
  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo': return <CashIcon sx={{ color: darkProTokens.primary }} />;
      case 'debito': 
      case 'credito': return <CreditCardIcon sx={{ color: darkProTokens.info }} />;
      case 'transferencia': return <BankIcon sx={{ color: darkProTokens.roleTrainer }} />;
      default: return <PaymentIcon sx={{ color: darkProTokens.grayMuted }} />;
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return darkProTokens.success;
      case 'pending': return darkProTokens.warning;
      case 'cancelled': return darkProTokens.error;
      case 'refunded': return darkProTokens.roleModerator;
      default: return darkProTokens.grayMuted;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.primary}50`,
          borderRadius: 4,
          color: darkProTokens.textPrimary,
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
        color: darkProTokens.background,
        borderRadius: '16px 16px 0 0',
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.background, 
            color: darkProTokens.primary,
            width: 50,
            height: 50
          }}>
            <ReceiptIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              📋 Detalles de Venta
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              #{sale.sale_number}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: darkProTokens.background,
            '&:hover': {
              backgroundColor: `${darkProTokens.background}20`
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* ✅ INFORMACIÓN GENERAL */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 4,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: darkProTokens.success, 
                        color: darkProTokens.textPrimary,
                        width: 40,
                        height: 40
                      }}>
                        <InfoIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.success, 
                        fontWeight: 700 
                      }}>
                        📋 Información General
                      </Typography>
                    </Box>
                    
                    <Stack spacing={3}>
                      <Box sx={{
                        p: 2,
                        background: `${darkProTokens.primary}10`,
                        borderRadius: 2,
                        border: `1px solid ${darkProTokens.primary}30`
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Número de Venta:
                        </Typography>
                        <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.primary }}>
                          {sale.sale_number}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Fecha de Creación:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {formatDate(sale.created_at)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Tipo de Venta:
                        </Typography>
                        <Chip 
                          label={sale.sale_type === 'sale' ? '🛒 Venta Directa' : '📋 Apartado'} 
                          sx={{
                            backgroundColor: sale.sale_type === 'sale' ? darkProTokens.success : darkProTokens.roleModerator,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Estado de la Venta:
                        </Typography>
                        <Chip 
                          label={sale.status.charAt(0).toUpperCase() + sale.status.slice(1)} 
                          sx={{
                            backgroundColor: getStatusColor(sale.status),
                            color: darkProTokens.textPrimary,
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Estado de Pago:
                        </Typography>
                        <Chip 
                          label={sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)} 
                          sx={{
                            backgroundColor: getStatusColor(sale.payment_status),
                            color: darkProTokens.textPrimary,
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      
                      {sale.notes && (
                        <Box sx={{
                          p: 2,
                          background: `${darkProTokens.warning}10`,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.warning}30`
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                            📝 Notas:
                          </Typography>
                          <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                            {sale.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ CLIENTE Y CAJERO */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 4,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: darkProTokens.info, 
                        color: darkProTokens.textPrimary,
                        width: 40,
                        height: 40
                      }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.info, 
                        fontWeight: 700 
                      }}>
                        👤 Cliente y Cajero
                      </Typography>
                    </Box>
                    
                    <Stack spacing={3}>
                      <Box sx={{
                        p: 3,
                        background: `${darkProTokens.info}10`,
                        borderRadius: 3,
                        border: `1px solid ${darkProTokens.info}30`
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                          👤 Cliente:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: darkProTokens.success,
                            color: darkProTokens.textPrimary
                          }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                              {sale.customer_name || 'Cliente General'}
                            </Typography>
                            {sale.customer_email && (
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                📧 {sale.customer_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{
                        p: 2,
                        background: `${darkProTokens.grayMedium}20`,
                        borderRadius: 2,
                        border: `1px solid ${darkProTokens.grayDark}`
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          🏪 Cajero:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {sale.cashier_name || 'Sistema Automático'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                          ⚙️ Opciones de Venta:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {sale.receipt_printed && (
                            <Chip 
                              icon={<PrintIcon />}
                              label="Ticket Impreso" 
                              size="small" 
                              sx={{
                                backgroundColor: darkProTokens.success,
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}
                            />
                          )}
                          {sale.email_sent && (
                            <Chip 
                              icon={<EmailIcon />}
                              label="Email Enviado" 
                              size="small" 
                              sx={{
                                backgroundColor: darkProTokens.info,
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}
                            />
                          )}
                          {sale.is_mixed_payment && (
                            <Chip 
                              label="💳 Pago Mixto" 
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
              </motion.div>
            </Grid>

            {/* ✅ RESUMEN FINANCIERO */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.warning}30`,
                  borderRadius: 4,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: darkProTokens.warning, 
                        color: darkProTokens.textPrimary,
                        width: 40,
                        height: 40
                      }}>
                        <MoneyIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.warning, 
                        fontWeight: 700 
                      }}>
                        💰 Resumen Financiero
                      </Typography>
                    </Box>
                    
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Subtotal:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {formatPrice(sale.subtotal)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Impuestos:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.info }}>
                          {formatPrice(sale.tax_amount)}
                        </Typography>
                      </Box>
                      
                      {((sale.discount_amount || 0) + (sale.coupon_discount || 0)) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            Descuentos:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.error }}>
                            -{formatPrice((sale.discount_amount || 0) + (sale.coupon_discount || 0))}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Total Base:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {formatPrice(sale.total_amount)}
                        </Typography>
                      </Box>
                      
                      {sale.commission_amount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            Comisiones:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                            +{formatPrice(sale.commission_amount)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ borderColor: darkProTokens.grayDark, my: 1 }} />
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 3,
                        background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
                        borderRadius: 3,
                        border: `2px solid ${darkProTokens.success}50`
                      }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          💎 Total Final:
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(sale.total_amount + (sale.commission_amount || 0))}
                        </Typography>
                      </Box>
                      
                      {sale.payment_status === 'partial' && sale.pending_amount > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          background: `${darkProTokens.warning}20`,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.warning}50`
                        }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                            ⏳ Pendiente:
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                            {formatPrice(sale.pending_amount)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ PRODUCTOS VENDIDOS */}
            <Grid size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.roleTrainer}30`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: darkProTokens.roleTrainer, 
                        color: darkProTokens.textPrimary,
                        width: 40,
                        height: 40
                      }}>
                        <ShoppingCart />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.roleTrainer, 
                        fontWeight: 700 
                      }}>
                        🛒 Productos Vendidos ({sale.items?.length || 0})
                      </Typography>
                    </Box>
                    
                    <TableContainer component={Paper} sx={{
                      background: `${darkProTokens.surfaceLevel1}`,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: 2
                    }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ 
                            background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC)`,
                          }}>
                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Producto
                            </TableCell>
                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              SKU
                            </TableCell>
                            <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Cantidad
                            </TableCell>
                            <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Precio Unit.
                            </TableCell>
                            <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Descuento
                            </TableCell>
                            <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Impuestos
                            </TableCell>
                            <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                              Total
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sale.items?.map((item: any, index: number) => (
                            <TableRow 
                              key={index}
                              sx={{
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.primary}10`
                                },
                                '&:nth-of-type(even)': {
                                  backgroundColor: `${darkProTokens.surfaceLevel2}40`
                                }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
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
                                  -{formatPrice(item.discount_amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ color: darkProTokens.info }}>
                                  {formatPrice(item.tax_amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.success }}>
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
              </motion.div>
            </Grid>

            {/* ✅ INFORMACIÓN DE PAGOS */}
            <Grid size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.roleModerator}30`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: darkProTokens.roleModerator, 
                        color: darkProTokens.textPrimary,
                        width: 40,
                        height: 40
                      }}>
                        <PaymentIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.roleModerator, 
                        fontWeight: 700 
                      }}>
                        💳 Información de Pagos
                      </Typography>
                    </Box>
                    
                    {sale.is_mixed_payment ? (
                      <Box>
                        <Typography variant="body1" sx={{ 
                          mb: 3, 
                          color: darkProTokens.textPrimary,
                          fontWeight: 600
                        }}>
                          🔄 Pago Mixto ({sale.payment_details?.length || 0} métodos):
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {sale.payment_details?.map((payment: any, index: number) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                              <Box sx={{ 
                                p: 3, 
                                background: `${darkProTokens.surfaceLevel1}60`,
                                border: `1px solid ${darkProTokens.grayDark}`, 
                                borderRadius: 3,
                                '&:hover': {
                                  borderColor: darkProTokens.primary,
                                  transform: 'translateY(-2px)',
                                  transition: 'all 0.2s'
                                }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  {getPaymentMethodIcon(payment.payment_method)}
                                  <Typography variant="body1" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                                    Pago #{payment.sequence_order}
                                  </Typography>
                                </Box>
                                
                                <Stack spacing={1}>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                    <strong>Método:</strong> {payment.payment_method}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                                    <strong>Monto:</strong> {formatPrice(payment.amount)}
                                  </Typography>
                                  {payment.commission_amount > 0 && (
                                    <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                                      <strong>Comisión ({payment.commission_rate}%):</strong> {formatPrice(payment.commission_amount)}
                                    </Typography>
                                  )}
                                  {payment.payment_reference && (
                                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                      <strong>Ref:</strong> {payment.payment_reference}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                    {formatDate(payment.payment_date)}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Box sx={{
                        p: 3,
                        background: `${darkProTokens.surfaceLevel1}60`,
                        border: `1px solid ${darkProTokens.grayDark}`,
                        borderRadius: 3
                      }}>
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getPaymentMethodIcon(sale.payment_method)}
                            <Box>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Método de Pago:
                              </Typography>
                              <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                                {sale.payment_method === 'efectivo' && '💵 Efectivo'}
                                {sale.payment_method === 'debito' && '💳 Tarjeta Débito'}
                                {sale.payment_method === 'credito' && '💳 Tarjeta Crédito'}
                                {sale.payment_method === 'transferencia' && '🏦 Transferencia'}
                                {!sale.payment_method && '💰 No especificado'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {sale.commission_amount > 0 && (
                            <Box>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Comisión Aplicada:
                              </Typography>
                              <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.warning }}>
                                {formatPrice(sale.commission_amount)}
                              </Typography>
                            </Box>
                          )}
                          
                          {sale.change_amount > 0 && (
                            <Box>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Cambio Entregado:
                              </Typography>
                              <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.info }}>
                                {formatPrice(sale.change_amount)}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        background: `${darkProTokens.surfaceLevel1}40`,
        borderTop: `1px solid ${darkProTokens.grayDark}`
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          size="large"
          startIcon={<CheckCircleIcon />}
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
            color: darkProTokens.background,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${darkProTokens.primary}40`
            }
          }}
        >
          Cerrar Detalles
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
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Dialog>
  );
}
