'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';

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

interface LayawayDetails {
  items: any[];
  payments: any[];
  history: any[];
  customer: any;
}

export default function LayawayDetailsDialog({ open, onClose, layaway }: LayawayDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [details, setDetails] = useState<LayawayDetails>({
    items: [],
    payments: [],
    history: [],
    customer: null
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIÓN HÍBRIDA PARA CARGAR DETALLES
  const loadLayawayDetails = useCallback(async () => {
    if (!layaway?.id || !open) return;

    setLoading(true);
    try {
      // ✅ CARGAR ITEMS DEL APARTADO
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', layaway.id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Error cargando items:', itemsError);
      }

      // ✅ CARGAR HISTORIAL DE PAGOS
      const { data: payments, error: paymentsError } = await supabase
        .from('sale_payment_details')
        .select('*')
        .eq('sale_id', layaway.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('Error cargando pagos:', paymentsError);
      }

      // ✅ CARGAR HISTORIAL DE ESTADOS
      const { data: history, error: historyError } = await supabase
        .from('layaway_status_history')
        .select('*')
        .eq('layaway_id', layaway.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error cargando historial:', historyError);
      }

      // ✅ CARGAR DATOS DEL CLIENTE SI EXISTE
      let customer = null;
      if (layaway.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('Users')
          .select('id, firstName, lastName, name, email, whatsapp')
          .eq('id', layaway.customer_id)
          .single();

        if (!customerError && customerData) {
          customer = customerData;
        }
      }

      setDetails({
        items: items || [],
        payments: payments || [],
        history: history || [],
        customer
      });

    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  }, [layaway?.id, open, supabase]);

  // ✅ FUNCIÓN HÍBRIDA PARA REFRESCAR DATOS
  const refreshData = useCallback(async () => {
    if (!layaway?.id) return;
    
    setRefreshing(true);
    
    try {
      await loadLayawayDetails();
    } catch (error) {
      console.error('Error refrescando datos:', error);
    } finally {
      setRefreshing(false);
    }
  }, [layaway?.id, loadLayawayDetails]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway?.id) return;
    loadLayawayDetails();
  }, [open, layaway?.id, loadLayawayDetails]);

  // ✅ FUNCIÓN DE CIERRE HÍBRIDA
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ✅ VALIDACIÓN TEMPRANA HÍBRIDA
  if (!layaway) {
    return null;
  }

  // ✅ DATOS SEGUROS HÍBRIDOS CON VALORES POR DEFECTO
  const safeLayaway = {
    id: layaway.id || '',
    sale_number: layaway.sale_number || 'Sin número',
    total_amount: layaway.total_amount || 0,
    paid_amount: layaway.paid_amount || 0,
    pending_amount: layaway.pending_amount || 0,
    status: layaway.status || 'pending',
    customer_name: layaway.customer_name || 'Cliente General',
    customer_email: layaway.customer_email || '',
    created_at: layaway.created_at || new Date().toISOString(),
    layaway_expires_at: layaway.layaway_expires_at || layaway.expiration_date || '',
    notes: layaway.notes || ''
  };

  // ✅ CÁLCULOS SEGUROS HÍBRIDOS
  const progressPercentage = safeLayaway.total_amount > 0 ? 
    ((safeLayaway.paid_amount || 0) / safeLayaway.total_amount) * 100 : 0;
  
  const expirationDate = safeLayaway.layaway_expires_at;
  const daysLeft = expirationDate ? 
    Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    0;

  // ✅ NOMBRE DEL CLIENTE HÍBRIDO
  const customerName = details.customer ? 
    (details.customer.name || `${details.customer.firstName || ''} ${details.customer.lastName || ''}`.trim() || 'Cliente General') :
    (safeLayaway.customer_name || 'Cliente General');

  // ✅ FUNCIÓN PARA OBTENER ICONO DE MÉTODO DE PAGO
  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo': return <CashIcon sx={{ color: darkProTokens.primary }} />;
      case 'debito': 
      case 'credito': return <CreditCardIcon sx={{ color: darkProTokens.info }} />;
      case 'transferencia': return <BankIcon sx={{ color: darkProTokens.roleTrainer }} />;
      case 'vales': return <ReceiptIcon sx={{ color: darkProTokens.warning }} />;
      default: return <PaymentIcon sx={{ color: darkProTokens.grayMuted }} />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.roleModerator}50`,
          color: darkProTokens.textPrimary,
          borderRadius: 4,
          maxHeight: '95vh'
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
          <Avatar sx={{ 
            bgcolor: darkProTokens.background, 
            color: darkProTokens.roleModerator,
            width: 50,
            height: 50
          }}>
            <VisibilityIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              📦 Detalles del Apartado
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              #{safeLayaway.sale_number}
            </Typography>
          </Box>
          {(loading || refreshing) && (
            <CircularProgress size={24} sx={{ color: darkProTokens.textPrimary }} />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={refreshData}
            disabled={refreshing || loading}
            sx={{ 
              color: darkProTokens.textPrimary,
              '&:hover': { bgcolor: `${darkProTokens.background}20` }
            }}
          >
            {refreshing ? <CircularProgress size={20} sx={{ color: darkProTokens.textPrimary }} /> : <RefreshIcon />}
          </IconButton>
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: darkProTokens.textPrimary,
              '&:hover': { bgcolor: `${darkProTokens.background}20` }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* ✅ INFORMACIÓN DEL CLIENTE */}
            <Grid xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: darkProTokens.info, fontWeight: 700 }}>
                      👤 Información del Cliente
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: customerName === 'Cliente General' ? darkProTokens.warning : darkProTokens.success,
                        color: darkProTokens.textPrimary
                      }}>
                        <PersonIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                          {customerName}
                        </Typography>
                        {details.customer?.email && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📧 {details.customer.email}
                          </Typography>
                        )}
                        {details.customer?.whatsapp && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📱 {details.customer.whatsapp}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: darkProTokens.grayDark }} />

                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Fecha de Apartado:
                        </Typography>
                        <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {formatDate(safeLayaway.created_at)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Fecha de Vencimiento:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="600" 
                          sx={{ 
                            color: daysLeft < 0 ? darkProTokens.error : 
                                   daysLeft < 7 ? darkProTokens.warning : 
                                   darkProTokens.success
                          }}
                        >
                          {expirationDate ? formatDate(expirationDate) : 'Sin fecha'}
                        </Typography>
                        {expirationDate && (
                          <Chip 
                            label={
                              daysLeft > 0 ? `${daysLeft} días restantes` : 
                              daysLeft === 0 ? 'Vence hoy' : 
                              `Vencido hace ${Math.abs(daysLeft)} días`
                            }
                            size="small"
                            sx={{
                              mt: 1,
                              backgroundColor: daysLeft < 0 ? darkProTokens.error : 
                                              daysLeft < 7 ? darkProTokens.warning : 
                                              darkProTokens.success,
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>

                      {safeLayaway.notes && (
                        <Box sx={{
                          p: 2,
                          background: `${darkProTokens.warning}10`,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.warning}30`
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📝 Notas:
                          </Typography>
                          <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                            {safeLayaway.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ ESTADO FINANCIERO */}
            <Grid xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: darkProTokens.success, fontWeight: 700 }}>
                      💰 Estado Financiero
                    </Typography>

                    {/* Progreso visual */}
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Progreso de Pago
                        </Typography>
                        <Typography variant="body1" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                          {Math.round(progressPercentage)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressPercentage} 
                        sx={{ 
                          height: 12, 
                          borderRadius: 6,
                          backgroundColor: darkProTokens.grayDark,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: progressPercentage >= 100 ? darkProTokens.success : 
                                           progressPercentage >= 50 ? darkProTokens.warning : 
                                           darkProTokens.error
                          }
                        }}
                      />
                    </Box>

                    <Stack spacing={3}>
                      <Box sx={{
                        p: 3,
                        background: `${darkProTokens.primary}20`,
                        borderRadius: 3,
                        border: `2px solid ${darkProTokens.primary}50`,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Total del Apartado
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(safeLayaway.total_amount)}
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid xs={6}>
                          <Box sx={{
                            p: 2,
                            background: `${darkProTokens.success}20`,
                            borderRadius: 2,
                            border: `1px solid ${darkProTokens.success}30`,
                            textAlign: 'center'
                          }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Pagado
                            </Typography>
                            <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.success }}>
                              {formatPrice(safeLayaway.paid_amount)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid xs={6}>
                          <Box sx={{
                            p: 2,
                            background: `${darkProTokens.warning}20`,
                            borderRadius: 2,
                            border: `1px solid ${darkProTokens.warning}30`,
                            textAlign: 'center'
                          }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Pendiente
                            </Typography>
                            <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.warning }}>
                              {formatPrice(safeLayaway.pending_amount)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box sx={{
                        p: 2,
                        background: progressPercentage >= 100 ? `${darkProTokens.success}20` : `${darkProTokens.info}20`,
                        borderRadius: 2,
                        border: progressPercentage >= 100 ? `1px solid ${darkProTokens.success}30` : `1px solid ${darkProTokens.info}30`,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Estado
                        </Typography>
                        <Chip 
                          label={safeLayaway.status === 'completed' ? 'Completado' : 
                                 safeLayaway.status === 'pending' ? 'Activo' : 
                                 safeLayaway.status}
                          sx={{
                            backgroundColor: safeLayaway.status === 'completed' ? darkProTokens.success : 
                                           safeLayaway.status === 'pending' ? darkProTokens.warning : 
                                           darkProTokens.error,
                            color: darkProTokens.textPrimary,
                            fontWeight: 700
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ HISTORIAL DE PAGOS */}
            <Grid xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.warning}30`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: darkProTokens.warning, fontWeight: 700 }}>
                      📋 Historial de Pagos ({details.payments.length})
                    </Typography>

                    {details.payments.length > 0 ? (
                      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <Timeline sx={{ p: 0, m: 0 }}>
                          {details.payments.map((payment: any, index: number) => (
                            <TimelineItem key={payment.id || index}>
                              <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                  {formatDate(payment.payment_date)}
                                </Typography>
                              </TimelineOppositeContent>
                              <TimelineSeparator>
                                <TimelineDot sx={{ 
                                  bgcolor: payment.payment_method === 'efectivo' ? darkProTokens.success : darkProTokens.info,
                                  width: 40,
                                  height: 40,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {getPaymentMethodIcon(payment.payment_method)}
                                </TimelineDot>
                                {index < details.payments.length - 1 && (
                                  <TimelineConnector sx={{ bgcolor: darkProTokens.grayDark }} />
                                )}
                              </TimelineSeparator>
                              <TimelineContent sx={{ px: 2, pb: 3 }}>
                                <Box>
                                  <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                                    {formatPrice(payment.amount || 0)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                    {payment.payment_method === 'efectivo' && '💵 Efectivo'}
                                    {payment.payment_method === 'debito' && '💳 Débito'}
                                    {payment.payment_method === 'credito' && '💳 Crédito'}
                                    {payment.payment_method === 'transferencia' && '🏦 Transferencia'}
                                    {payment.payment_method === 'vales' && '🎫 Vales'}
                                  </Typography>
                                  {(payment.commission_amount || 0) > 0 && (
                                    <Typography variant="caption" sx={{ color: darkProTokens.warning }}>
                                      Comisión: {formatPrice(payment.commission_amount)}
                                    </Typography>
                                  )}
                                  {payment.payment_reference && (
                                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block' }}>
                                      Ref: {payment.payment_reference}
                                    </Typography>
                                  )}
                                  {payment.notes && (
                                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block', fontStyle: 'italic' }}>
                                      {payment.notes}
                                    </Typography>
                                  )}
                                </Box>
                              </TimelineContent>
                            </TimelineItem>
                          ))}
                        </Timeline>
                      </Box>
                    ) : (
                      <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        color: darkProTokens.textSecondary
                      }}>
                        <PaymentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2">
                          {loading ? 'Cargando pagos...' : 'No hay pagos registrados'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ PRODUCTOS DEL APARTADO */}
            <Grid xs={12}>
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
                    <Typography variant="h6" sx={{ mb: 3, color: darkProTokens.roleTrainer, fontWeight: 700 }}>
                      🛍️ Productos en el Apartado ({details.items.length})
                    </Typography>

                    {details.items.length > 0 ? (
                      <TableContainer component={Paper} sx={{
                        background: darkProTokens.surfaceLevel1,
                        border: `1px solid ${darkProTokens.grayDark}`,
                        borderRadius: 2
                      }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ 
                              background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC)`
                            }}>
                              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                                Producto
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
                                Subtotal
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {details.items.map((item: any, index: number) => (
                              <TableRow key={index} sx={{
                                '&:hover': { backgroundColor: `${darkProTokens.primary}10` },
                                '&:nth-of-type(even)': { backgroundColor: `${darkProTokens.surfaceLevel2}40` }
                              }}>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                                      {item.product_name}
                                    </Typography>
                                    {item.product_sku && (
                                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                        SKU: {item.product_sku}
                                      </Typography>
                                    )}
                                  </Box>
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
                                  <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                                    {formatPrice(item.unit_price || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  {(item.discount_amount || 0) > 0 ? (
                                    <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.success }}>
                                      -{formatPrice(item.discount_amount)}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                      Sin descuento
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body1" fontWeight="700" sx={{ color: darkProTokens.primary }}>
                                    {formatPrice(item.total_price || 0)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Totales */}
                            <TableRow sx={{ 
                              background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`
                            }}>
                              <TableCell colSpan={4}>
                                <Typography variant="h6" fontWeight="700" sx={{ color: darkProTokens.textPrimary }}>
                                  💎 TOTAL APARTADO:
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="h5" fontWeight="800" sx={{ color: darkProTokens.success }}>
                                  {formatPrice(safeLayaway.total_amount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        color: darkProTokens.textSecondary
                      }}>
                        <InventoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2">
                          {loading ? 'Cargando productos...' : 'No hay productos en este apartado'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* ✅ INFORMACIÓN ADICIONAL EN ACCORDIONS */}
            <Grid xs={12}>
              <Stack spacing={2}>
                {/* Historial de cambios de estado */}
                {details.history.length > 0 && (
                  <Accordion sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                    border: `1px solid ${darkProTokens.grayDark}`,
                    borderRadius: 3,
                    '&:before': { display: 'none' }
                  }}>
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.textPrimary }} />}
                      sx={{ 
                        background: `${darkProTokens.grayDark}60`,
                        borderRadius: '12px 12px 0 0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ color: darkProTokens.info }} />
                        <Typography variant="h6" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          📈 Historial de Estados ({details.history.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ background: darkProTokens.surfaceLevel2 }}>
                      <Timeline sx={{ m: 0, p: 0 }}>
                        {details.history.map((history: any, index: number) => (
                          <TimelineItem key={history.id || index}>
                            <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                {formatDate(history.created_at)}
                              </Typography>
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                              <TimelineDot sx={{ bgcolor: darkProTokens.info }}>
                                <InfoIcon fontSize="small" />
                              </TimelineDot>
                              {index < details.history.length - 1 && (
                                <TimelineConnector sx={{ bgcolor: darkProTokens.grayDark }} />
                              )}
                            </TimelineSeparator>
                            <TimelineContent sx={{ px: 2, pb: 2 }}>
                              <Typography variant="body1" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                                {history.previous_status || 'Nuevo'} → {history.new_status}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                {history.reason}
                              </Typography>
                              {history.previous_paid_amount !== history.new_paid_amount && (
                                <Typography variant="caption" sx={{ color: darkProTokens.success }}>
                                  Pago: {formatPrice(history.previous_paid_amount || 0)} → {formatPrice(history.new_paid_amount || 0)}
                                </Typography>
                              )}
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        background: darkProTokens.surfaceLevel1,
        borderTop: `1px solid ${darkProTokens.grayDark}`
      }}>
        <Button
          onClick={refreshData}
          disabled={refreshing || loading}
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          variant="outlined"
          sx={{ 
            borderColor: darkProTokens.roleTrainer,
            color: darkProTokens.roleTrainer,
            '&:hover': {
              borderColor: darkProTokens.roleTrainer,
              bgcolor: `${darkProTokens.roleTrainer}20`
            }
          }}
        >
          {refreshing ? 'Refrescando...' : 'Refrescar Datos'}
        </Button>
        <Button 
          onClick={handleClose} 
          variant="contained" 
          sx={{ 
            background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
            color: darkProTokens.textPrimary,
            fontWeight: 'bold',
            px: 4,
            py: 1.5,
            borderRadius: 3
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
          background: linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.roleModerator}CC, ${darkProTokens.roleModerator});
        }
      `}</style>
    </Dialog>
  );
}
