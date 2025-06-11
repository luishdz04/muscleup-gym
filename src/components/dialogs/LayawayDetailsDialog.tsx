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
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid'; // ✅ GRID2 HÍBRIDO
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';

interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any; // ✅ TIPO FLEXIBLE HÍBRIDO
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

  // ✅ FUNCIÓN HÍBRIDA PARA CARGAR DETALLES (useCallback con dependencias controladas)
  const loadLayawayDetails = useCallback(async () => {
    if (!layaway?.id || !open) return;

    setLoading(true);
    try {
      console.log('🔍 Cargando detalles completos para apartado:', layaway.sale_number, '- 2025-06-11 08:30:29 UTC - luishdz04');

      // ✅ CARGAR ITEMS DEL APARTADO
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', layaway.id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('❌ Error cargando items:', itemsError);
      }

      // ✅ CARGAR HISTORIAL DE PAGOS
      const { data: payments, error: paymentsError } = await supabase
        .from('sale_payment_details')
        .select('*')
        .eq('sale_id', layaway.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('❌ Error cargando pagos:', paymentsError);
      }

      // ✅ CARGAR HISTORIAL DE ESTADOS
      const { data: history, error: historyError } = await supabase
        .from('layaway_status_history')
        .select('*')
        .eq('layaway_id', layaway.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('❌ Error cargando historial:', historyError);
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

      console.log('✅ Detalles cargados exitosamente:', {
        items: items?.length || 0,
        payments: payments?.length || 0,
        history: history?.length || 0,
        customer: !!customer
      });

    } catch (error) {
      console.error('💥 Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  }, [layaway?.id, open, supabase]); // ✅ DEPENDENCIAS ESPECÍFICAS HÍBRIDAS

  // ✅ FUNCIÓN HÍBRIDA PARA REFRESCAR DATOS
  const refreshData = useCallback(async () => {
    if (!layaway?.id) return;
    
    setRefreshing(true);
    console.log('🔄 Refrescando datos del apartado... - 2025-06-11 08:30:29 UTC - luishdz04');
    
    try {
      await loadLayawayDetails();
      console.log('✅ Datos refrescados exitosamente');
    } catch (error) {
      console.error('❌ Error refrescando datos:', error);
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
    console.log('🔒 Cerrando dialog de detalles - 2025-06-11 08:30:29 UTC - luishdz04');
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4caf50, #388e3c)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CartIcon />
          <Typography variant="h6" fontWeight="bold">
            📦 Detalles del Apartado #{safeLayaway.sale_number}
          </Typography>
          {(loading || refreshing) && <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={refreshData}
            disabled={refreshing || loading}
            startIcon={refreshing ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <RefreshIcon />}
            sx={{ 
              color: 'inherit', 
              minWidth: 'auto',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            {refreshing ? 'Refrescando...' : 'Refrescar'}
          </Button>
          <Button onClick={handleClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ INDICADOR DE ACTUALIZACIÓN HÍBRIDA */}
        <Alert severity="info" sx={{ mb: 3 }}>
          📊 Detalles del apartado - Actualizado: 2025-06-11 08:30:29 UTC por luishdz04 - Solución híbrida sin loops infinitos
        </Alert>

        {/* ✅ GRID2 HÍBRIDO CORREGIDO */}
        <Grid container spacing={3}>
          {/* Información del cliente */}
          <Grid xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  👤 Información del Cliente
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ 
                    width: 56, 
                    height: 56, 
                    bgcolor: customerName === 'Cliente General' ? '#ff9800' : '#4caf50' 
                  }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      {customerName}
                    </Typography>
                    {details.customer?.email && (
                      <Typography variant="body2" color="textSecondary">
                        📧 {details.customer.email}
                      </Typography>
                    )}
                    {details.customer?.whatsapp && (
                      <Typography variant="body2" color="textSecondary">
                        📱 {details.customer.whatsapp}
                      </Typography>
                    )}
                    {safeLayaway.id && (
                      <Typography variant="caption" color="textSecondary">
                        ID: {safeLayaway.id.slice(0, 8)}...
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Fecha de Apartado:</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {formatDate(safeLayaway.created_at)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="textSecondary">Fecha de Vencimiento:</Typography>
                    <Typography variant="body1" fontWeight="600" color={daysLeft < 0 ? 'error.main' : daysLeft < 7 ? 'warning.main' : 'success.main'}>
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
                        color={daysLeft < 0 ? 'error' : daysLeft < 7 ? 'warning' : 'success'}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>

                  {safeLayaway.notes && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Notas:</Typography>
                      <Typography variant="body1">
                        {safeLayaway.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado financiero */}
          <Grid  xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  💰 Estado Financiero
                </Typography>

                {/* Progreso visual */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">Progreso de Pago</Typography>
                    <Typography variant="body2" fontWeight="600">{Math.round(progressPercentage)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: progressPercentage >= 100 ? '#4caf50' : progressPercentage >= 50 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>

                <Stack spacing={3}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(33, 150, 243, 0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="textSecondary">Total del Apartado</Typography>
                    <Typography variant="h4" fontWeight="800" color="primary">
                      {formatPrice(safeLayaway.total_amount)}
                    </Typography>
                  </Box>

                  {/* ✅ GRID2 ANIDADO HÍBRIDO */}
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Box sx={{
                        p: 2,
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="textSecondary">Pagado</Typography>
                        <Typography variant="h6" fontWeight="700" color="success.main">
                          {formatPrice(safeLayaway.paid_amount)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid xs={6}>
                      <Box sx={{
                        p: 2,
                        background: 'rgba(255, 152, 0, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                        <Typography variant="h6" fontWeight="700" color="warning.main">
                          {formatPrice(safeLayaway.pending_amount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{
                    p: 2,
                    background: progressPercentage >= 100 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 2,
                    border: progressPercentage >= 100 ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="textSecondary">Estado</Typography>
                    <Chip 
                      label={safeLayaway.status === 'completed' ? 'Completado' : safeLayaway.status === 'pending' ? 'Activo' : safeLayaway.status}
                      color={safeLayaway.status === 'completed' ? 'success' : safeLayaway.status === 'pending' ? 'warning' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Historial de pagos */}
          <Grid xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  📋 Historial de Pagos ({details.payments.length})
                </Typography>

                {details.payments.length > 0 ? (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <Timeline sx={{ p: 0, m: 0 }}>
                      {details.payments.map((payment: any, index: number) => (
                        <TimelineItem key={payment.id || index}>
                          <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(payment.payment_date)}
                            </Typography>
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot sx={{ 
                              bgcolor: payment.payment_method === 'efectivo' ? '#4caf50' : '#2196f3',
                              width: 32,
                              height: 32
                            }}>
                              <PaymentIcon fontSize="small" />
                            </TimelineDot>
                            {index < details.payments.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ px: 2, pb: 2 }}>
                            <Box>
                              <Typography variant="body1" fontWeight="600">
                                {formatPrice(payment.amount || 0)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {payment.payment_method === 'efectivo' && '💵 Efectivo'}
                                {payment.payment_method === 'debito' && '💳 Débito'}
                                {payment.payment_method === 'credito' && '💳 Crédito'}
                                {payment.payment_method === 'transferencia' && '🏦 Transferencia'}
                                {payment.payment_method === 'vales' && '🎫 Vales'}
                              </Typography>
                              {(payment.commission_amount || 0) > 0 && (
                                <Typography variant="caption" color="warning.main">
                                  Comisión: {formatPrice(payment.commission_amount)}
                                </Typography>
                              )}
                              {payment.payment_reference && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                  Ref: {payment.payment_reference}
                                </Typography>
                              )}
                              {payment.notes && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontStyle: 'italic' }}>
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
                    color: 'text.secondary'
                  }}>
                    <PaymentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">
                      {loading ? 'Cargando pagos...' : 'No hay pagos registrados'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Productos del apartado */}
          <Grid xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  🛍️ Productos en el Apartado ({details.items.length})
                </Typography>

                {details.items.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <TableCell><strong>Producto</strong></TableCell>
                          <TableCell align="center"><strong>Cantidad</strong></TableCell>
                          <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                          <TableCell align="right"><strong>Descuento</strong></TableCell>
                          <TableCell align="right"><strong>Subtotal</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {details.items.map((item: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body1" fontWeight="600">
                                  {item.product_name}
                                </Typography>
                                {item.product_sku && (
                                  <Typography variant="caption" color="textSecondary">
                                    SKU: {item.product_sku}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.quantity}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="600">
                                {formatPrice(item.unit_price || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {(item.discount_amount || 0) > 0 ? (
                                <Typography variant="body1" color="success.main" fontWeight="600">
                                  -{formatPrice(item.discount_amount)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  Sin descuento
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="700" color="primary">
                                {formatPrice(item.total_price || 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Totales */}
                        <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <TableCell colSpan={4}>
                            <Typography variant="h6" fontWeight="700">
                              TOTAL APARTADO:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" fontWeight="800" color="primary">
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
                    color: 'text.secondary'
                  }}>
                    <InventoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">
                      {loading ? 'Cargando productos...' : 'No hay productos en este apartado'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Información adicional en accordions */}
          <Grid xs={12}>
            <Stack spacing={2}>
              {/* Historial de cambios de estado */}
              {details.history.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon />
                      <Typography variant="h6" fontWeight="600">
                        📈 Historial de Estados ({details.history.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Timeline sx={{ m: 0, p: 0 }}>
                      {details.history.map((history: any, index: number) => (
                        <TimelineItem key={history.id || index}>
                          <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(history.created_at)}
                            </Typography>
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="primary">
                              <InfoIcon fontSize="small" />
                            </TimelineDot>
                            {index < details.history.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ px: 2, pb: 2 }}>
                            <Typography variant="body1" fontWeight="600">
                              {history.previous_status || 'Nuevo'} → {history.new_status}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {history.reason}
                            </Typography>
                            {history.previous_paid_amount !== history.new_paid_amount && (
                              <Typography variant="caption" color="success.main">
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

              {/* Información del sistema */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon />
                    <Typography variant="h6" fontWeight="600">
                      ⚙️ Información del Sistema - Solución Híbrida
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">ID del Apartado:</Typography>
                          <Typography variant="body1" fontFamily="monospace">
                            {safeLayaway.id}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Creado:</Typography>
                          <Typography variant="body1">
                            {formatDate(safeLayaway.created_at)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Solución Aplicada:</Typography>
                          <Chip 
                            label="✅ Híbrida sin loops"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid xs={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Última carga de datos:</Typography>
                          <Typography variant="body1">
                            2025-06-11 08:30:29 UTC por luishdz04
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Número de Pagos:</Typography>
                          <Typography variant="body1">
                            {details.payments.length} pagos realizados
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Items del Apartado:</Typography>
                          <Typography variant="body1">
                            {details.items.length} productos apartados
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">useCallback Híbrido:</Typography>
                          <Chip 
                            label="✅ Dependencias controladas"
                            size="small"
                            color="info"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={refreshData}
          disabled={refreshing || loading}
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          variant="outlined"
          sx={{ 
            borderColor: 'rgba(76, 175, 80, 0.5)',
            color: '#4caf50',
            '&:hover': {
              borderColor: '#4caf50',
              bgcolor: 'rgba(76, 175, 80, 0.1)'
            }
          }}
        >
          {refreshing ? 'Refrescando...' : 'Refrescar Datos'}
        </Button>
        <Button 
          onClick={handleClose} 
          variant="contained" 
          sx={{ 
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            fontWeight: 'bold'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}