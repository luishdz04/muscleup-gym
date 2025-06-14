'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Avatar,
  Slider,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  ErrorOutline as ErrorIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon,
  CardGiftcard as GiftCardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
// ✅ IMPORTAR HELPERS DE FECHA CORREGIDOS
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

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

interface CancelLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
  onSuccess: () => void;
}

interface RefundDetail {
  payment_id: string;
  original_amount: number;
  refund_amount: number;
  refund_method: string;
  refund_reference?: string;
  commission_refund: number;
}

const cancelReasons = [
  { value: 'customer_request', label: '🙋 Solicitud del cliente', description: 'El cliente decidió cancelar', color: darkProTokens.info },
  { value: 'expired', label: '⏰ Apartado vencido', description: 'Superó el tiempo límite', color: darkProTokens.warning },
  { value: 'product_unavailable', label: '📦 Producto no disponible', description: 'No hay stock suficiente', color: darkProTokens.error },
  { value: 'administrative', label: '📋 Decisión administrativa', description: 'Cancelación por políticas', color: darkProTokens.roleModerator },
  { value: 'payment_issues', label: '💳 Problemas de pago', description: 'Incidencias con pagos', color: darkProTokens.error },
  { value: 'other', label: '❓ Otro motivo', description: 'Especificar en notas', color: darkProTokens.grayMuted }
];

const refundMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵', description: 'Devolución en efectivo', color: darkProTokens.primary },
  { value: 'transfer', label: 'Transferencia', icon: '🏦', description: 'Transferencia bancaria', color: darkProTokens.info },
  { value: 'store_credit', label: 'Crédito en tienda', icon: '🎫', description: 'Vale para compras futuras', color: darkProTokens.warning },
  { value: 'original_method', label: 'Método original', icon: '🔄', description: 'Mismo método de pago', color: darkProTokens.success },
  { value: 'no_refund', label: 'Sin reembolso', icon: '❌', description: 'No aplica devolución', color: darkProTokens.error }
];

export default function CancelLayawayDialog({ 
  open, 
  onClose, 
  layaway, 
  onSuccess 
}: CancelLayawayDialogProps) {
  
  // ✅ ESTADOS BÁSICOS HÍBRIDOS
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  
  // ✅ ESTADOS PARA REEMBOLSO HÍBRIDOS
  const [processRefund, setProcessRefund] = useState(true);
  const [refundMethod, setRefundMethod] = useState('efectivo');
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [applyPenalty, setApplyPenalty] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [refundReference, setRefundReference] = useState('');
  
  // ✅ ESTADOS PARA INVENTARIO HÍBRIDOS
  const [restoreStock, setRestoreStock] = useState(true);
  const [partialRestore, setPartialRestore] = useState(false);
  
  // ✅ ESTADOS DE DATOS HÍBRIDOS
  const [refundDetails, setRefundDetails] = useState<RefundDetail[]>([]);

  // Estados de notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIONES UTILITARIAS CORREGIDAS CON HELPERS DE FECHA MÉXICO
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date());
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ FUNCIONES CORREGIDAS PARA MOSTRAR FECHAS EN UI
  const formatMexicoDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // ✅ DATOS SEGUROS HÍBRIDOS
  const safeLayaway = useMemo(() => {
    if (!layaway) return null;
    
    return {
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      customer_name: layaway.customer_name || 'Cliente General',
      customer_email: layaway.customer_email || '',
      customer_id: layaway.customer_id || '',
      status: layaway.status || 'pending',
      items: layaway.items || [],
      payment_history: layaway.payment_history || [],
      created_at: layaway.created_at || new Date().toISOString(),
      layaway_expires_at: layaway.layaway_expires_at || ''
    };
  }, [layaway]);

  // ✅ FUNCIÓN HÍBRIDA PARA CARGAR DETALLES
  const loadRefundDetails = useCallback(async () => {
    if (!open || !safeLayaway) return;
    
    try {
      // Crear detalles de reembolso basados en pagos existentes
      const details: RefundDetail[] = safeLayaway.payment_history.map((payment: any) => ({
        payment_id: payment.id,
        original_amount: payment.amount || 0,
        refund_amount: (payment.amount || 0) * (refundPercentage / 100),
        refund_method: refundMethod,
        commission_refund: (payment.commission_amount || 0) * (refundPercentage / 100)
      }));
      
      setRefundDetails(details);
    } catch (error) {
      console.error('Error calculando reembolsos:', error);
    }
  }, [open, safeLayaway, refundPercentage, refundMethod]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    // Reset estados
    setActiveStep(0);
    setProcessing(false);
    setCompleted(false);
    setCancelReason('');
    setCustomReason('');
    setNotes('');
    setProcessRefund(true);
    setRefundMethod('efectivo');
    setRefundPercentage(100);
    setApplyPenalty(false);
    setPenaltyAmount(0);
    setRefundReference('');
    setRestoreStock(true);
    setPartialRestore(false);
    setRefundDetails([]);
    
    // Cargar detalles
    loadRefundDetails();
  }, [open, layaway, loadRefundDetails]);

  // ✅ EFECTO HÍBRIDO PARA RECALCULAR REEMBOLSOS
  useEffect(() => {
    if (open && safeLayaway) {
      loadRefundDetails();
    }
  }, [refundPercentage, refundMethod, open, safeLayaway, loadRefundDetails]);

  // ✅ CÁLCULOS HÍBRIDOS
  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    
    const totalPaid = safeLayaway.paid_amount;
    const baseRefund = totalPaid * (refundPercentage / 100);
    const penalty = applyPenalty ? penaltyAmount : 0;
    const finalRefund = Math.max(0, baseRefund - penalty);
    
    const totalCommissionRefund = refundDetails.reduce((sum, detail) => sum + detail.commission_refund, 0);
    
    return {
      totalPaid,
      baseRefund,
      penalty,
      finalRefund,
      totalCommissionRefund,
      netRefund: finalRefund - totalCommissionRefund,
      refundPercentage,
      itemsToRestore: safeLayaway.items.length
    };
  }, [safeLayaway, refundPercentage, applyPenalty, penaltyAmount, refundDetails]);

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR CANCELACIÓN (CORREGIDA CON FECHAS MÉXICO)
  const processCancellation = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      // ✅ ACTUALIZAR APARTADO A CANCELADO (LA BD MANEJA updated_at AUTOMÁTICAMENTE)
      const updateData = {
        status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: toMexicoTimestamp(new Date()), // ✅ CORREGIDO: hora México con offset
        cancelled_by: userId,
        cancel_reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
        refund_amount: processRefund ? calculations.finalRefund : 0,
        refund_method: processRefund ? refundMethod : null,
        refund_reference: refundReference || null,
        penalty_amount: calculations.penalty,
        notes: notes || null
        // ✅ updated_at se maneja automáticamente por la BD
      };

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', safeLayaway.id);

      if (updateError) {
        throw updateError;
      }

      // ✅ PROCESAR REEMBOLSOS SI APLICA CON FECHAS CORREGIDAS
      if (processRefund && calculations.finalRefund > 0) {
        const refundData = {
          sale_id: safeLayaway.id,
          refund_amount: calculations.finalRefund,
          refund_method: refundMethod,
          refund_reference: refundReference || null,
          penalty_amount: calculations.penalty,
          commission_refund: calculations.totalCommissionRefund,
          refund_date: toMexicoTimestamp(new Date()), // ✅ CORREGIDO: hora México con offset
          created_by: userId,
          reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
          notes: notes || null
          // ✅ created_at se maneja automáticamente por la BD
        };

        const { error: refundError } = await supabase
          .from('sale_refunds')
          .insert([refundData]);

        if (refundError) {
          console.error('Error registrando reembolso:', refundError);
        }
      }

      // ✅ RESTAURAR STOCK SI APLICA (LA BD MANEJA updated_at AUTOMÁTICAMENTE)
      if (restoreStock && safeLayaway.items.length > 0) {
        for (const item of safeLayaway.items) {
          const restoreQuantity = partialRestore ? Math.floor(item.quantity * 0.8) : item.quantity;
          
          // Obtener stock actual
          const { data: currentProduct } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', item.product_id)
            .single();

          if (currentProduct) {
            const newStock = (currentProduct.current_stock || 0) + restoreQuantity;
            
            const { error: stockError } = await supabase
              .from('products')
              .update({ 
                current_stock: newStock,
                updated_by: userId
                // ✅ updated_at se maneja automáticamente por la BD
              })
              .eq('id', item.product_id);

            if (stockError) {
              console.error('Error restaurando stock:', stockError);
            }

            // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO CON FECHA CORREGIDA
            await supabase
              .from('inventory_movements')
              .insert([{
                product_id: item.product_id,
                movement_type: 'entrada',
                quantity: restoreQuantity,
                previous_stock: currentProduct.current_stock || 0,
                new_stock: newStock,
                unit_cost: item.unit_price || 0,
                total_cost: restoreQuantity * (item.unit_price || 0),
                reason: 'Cancelación de apartado',
                reference_id: safeLayaway.id,
                notes: `Cancelación apartado #${safeLayaway.sale_number} - ${partialRestore ? 'Restauración parcial' : 'Restauración completa'}`,
                created_by: userId
                // ✅ created_at se maneja automáticamente por la BD
              }]);
          }
        }
      }

      // ✅ CREAR HISTORIAL DE CANCELACIÓN CON FECHA CORREGIDA
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: safeLayaway.id,
          previous_status: safeLayaway.status,
          new_status: 'cancelled',
          previous_paid_amount: safeLayaway.paid_amount,
          new_paid_amount: safeLayaway.paid_amount,
          reason: `Cancelado: ${cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}`,
          created_by: userId
          // ✅ created_at se maneja automáticamente por la BD
        }]);

      setCompleted(true);
      showNotification('¡Apartado cancelado exitosamente!', 'success');

    } catch (error: any) {
      console.error('Error procesando cancelación:', error);
      showNotification('Error al cancelar apartado: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, cancelReason, customReason, notes, processRefund, refundMethod, refundReference, restoreStock, partialRestore, showNotification]);

  // ✅ FUNCIÓN HÍBRIDA PARA CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN HÍBRIDA
  const canProceed = useCallback(() => {
    switch (activeStep) {
      case 0:
        return cancelReason !== '' && (cancelReason !== 'other' || customReason.trim() !== '');
      case 1:
        return !processRefund || (refundMethod !== '' && (!['transfer', 'original_method'].includes(refundMethod) || refundReference !== ''));
      case 2:
        return true;
      default:
        return false;
    }
  }, [activeStep, cancelReason, customReason, processRefund, refundMethod, refundReference]);

  if (!open || !safeLayaway) return null;

  const steps = [
    { label: 'Motivo', description: 'Razón de la cancelación' },
    { label: 'Reembolso', description: 'Configurar devolución' },
    { label: 'Confirmación', description: 'Revisar y procesar cancelación' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.error}50`,
          color: darkProTokens.textPrimary,
          minHeight: '80vh'
        }
      }}
    >
      {/* SNACKBAR */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${
              notification.severity === 'success' ? darkProTokens.success :
              notification.severity === 'error' ? darkProTokens.error :
              notification.severity === 'warning' ? darkProTokens.warning :
              darkProTokens.info
            }60`,
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.background, 
            color: darkProTokens.error,
            width: 50,
            height: 50
          }}>
            <CancelIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              ❌ Cancelar Apartado
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              #{safeLayaway.sale_number}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!completed ? (
          <Box sx={{ p: 4 }}>
            {/* ✅ INFORMACIÓN DEL APARTADO */}
            <Card sx={{
              mb: 4,
              background: `${darkProTokens.warning}10`,
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 2, fontWeight: 700 }}>
                  📋 Información del Apartado
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      <strong>Cliente:</strong> {safeLayaway.customer_name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      <strong>Total:</strong> {formatPrice(safeLayaway.total_amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      <strong>Pagado:</strong> {formatPrice(safeLayaway.paid_amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      <strong>Creado:</strong> {formatDate(safeLayaway.created_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* ✅ ADVERTENCIA IMPORTANTE */}
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                background: `${darkProTokens.error}20`,
                border: `1px solid ${darkProTokens.error}30`,
                color: darkProTokens.textPrimary,
                '& .MuiAlert-icon': { color: darkProTokens.error }
              }}
            >
              ⚠️ <strong>ATENCIÓN:</strong> Esta acción cancelará permanentemente el apartado y puede afectar el inventario. Revise cuidadosamente antes de proceder.
            </Alert>

            <Grid container spacing={4}>
              {/* ✅ STEPPER */}
              <Grid size={{ xs: 8 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.grayDark}`,
                  borderRadius: 4,
                  p: 2 
                }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel sx={{ 
                          '& .MuiStepLabel-label': { 
                            color: darkProTokens.textPrimary,
                            fontWeight: activeStep === index ? 700 : 500
                          },
                          '& .MuiStepIcon-root': {
                            color: activeStep === index ? darkProTokens.error : darkProTokens.grayMuted,
                            '&.Mui-completed': {
                              color: darkProTokens.error
                            }
                          }
                        }}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: MOTIVO DE CANCELACIÓN */}
                          {index === 0 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: darkProTokens.error, mb: 3, fontWeight: 700 }}>
                                📋 Seleccione el motivo de cancelación
                              </Typography>
                              
                              <RadioGroup
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                              >
                                <Grid container spacing={3}>
                                  {cancelReasons.map(reason => (
                                    <Grid size={{ xs: 6 }} key={reason.value}>
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Card 
                                          sx={{
                                            p: 3,
                                            background: cancelReason === reason.value 
                                              ? `${reason.color}20` 
                                              : `${darkProTokens.surfaceLevel1}60`,
                                            border: cancelReason === reason.value 
                                              ? `2px solid ${reason.color}` 
                                              : `1px solid ${darkProTokens.grayDark}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            borderRadius: 3,
                                            '&:hover': {
                                              background: `${reason.color}10`,
                                              border: `1px solid ${reason.color}50`,
                                              transform: 'translateY(-2px)'
                                            }
                                          }}
                                          onClick={() => setCancelReason(reason.value)}
                                        >
                                          <FormControlLabel
                                            value={reason.value}
                                            control={<Radio sx={{ color: reason.color }} />}
                                            label={
                                              <Box>
                                                <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                                  {reason.label}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                                  {reason.description}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </Card>
                                      </motion.div>
                                    </Grid>
                                  ))}
                                </Grid>
                              </RadioGroup>

                              {cancelReason === 'other' && (
                                <TextField
                                  fullWidth
                                  label="Especifique el motivo"
                                  multiline
                                  rows={3}
                                  value={customReason}
                                  onChange={(e) => setCustomReason(e.target.value)}
                                  required
                                  sx={{
                                    mt: 3,
                                    '& .MuiOutlinedInput-root': {
                                      color: darkProTokens.textPrimary,
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: darkProTokens.grayDark
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: darkProTokens.error
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: darkProTokens.error
                                      }
                                    },
                                    '& .MuiInputLabel-root': { 
                                      color: darkProTokens.textSecondary,
                                      '&.Mui-focused': { color: darkProTokens.error }
                                    }
                                  }}
                                />
                              )}

                              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  disabled={!canProceed()}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                                    color: darkProTokens.textPrimary,
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3
                                  }}
                                >
                                  Continuar →
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 2: CONFIGURACIÓN DE REEMBOLSO */}
                          {index === 1 && (
                            <Box>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={processRefund}
                                    onChange={(e) => setProcessRefund(e.target.checked)}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: darkProTokens.error,
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: darkProTokens.error,
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                    💰 Procesar reembolso al cliente
                                  </Typography>
                                }
                              />

                              {processRefund && calculations && (
                                <Box sx={{ mt: 4 }}>
                                  {/* Métodos de reembolso */}
                                  <Typography variant="h6" sx={{ color: darkProTokens.error, mb: 3, fontWeight: 700 }}>
                                    💳 Método de reembolso
                                  </Typography>
                                  
                                  <Grid container spacing={3} sx={{ mb: 4 }}>
                                    {refundMethods.map(method => (
                                      <Grid size={{ xs: 6 }} key={method.value}>
                                        <motion.div
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                        >
                                          <Card 
                                            sx={{
                                              p: 3,
                                              background: refundMethod === method.value 
                                                ? `${method.color}20` 
                                                : `${darkProTokens.surfaceLevel1}60`,
                                              border: refundMethod === method.value 
                                                ? `2px solid ${method.color}` 
                                                : `1px solid ${darkProTokens.grayDark}`,
                                              cursor: 'pointer',
                                              transition: 'all 0.3s ease',
                                              borderRadius: 3,
                                              '&:hover': {
                                                background: `${method.color}10`,
                                                border: `1px solid ${method.color}50`,
                                                transform: 'translateY(-2px)'
                                              }
                                            }}
                                            onClick={() => setRefundMethod(method.value)}
                                          >
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="h4" sx={{ mb: 1 }}>
                                                {method.icon}
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 1, fontWeight: 700 }}>
                                                {method.label}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                                {method.description}
                                              </Typography>
                                            </Box>
                                          </Card>
                                        </motion.div>
                                      </Grid>
                                    ))}
                                  </Grid>

                                  {/* Configuración del reembolso */}
                                  <Grid container spacing={3}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                                        Porcentaje de reembolso: {refundPercentage}%
                                      </Typography>
                                      <Slider
                                        value={refundPercentage}
                                        onChange={(e, value) => setRefundPercentage(value as number)}
                                        min={0}
                                        max={100}
                                        step={5}
                                        valueLabelDisplay="auto"
                                        sx={{
                                          color: darkProTokens.error,
                                          '& .MuiSlider-thumb': {
                                            backgroundColor: darkProTokens.error,
                                          },
                                          '& .MuiSlider-track': {
                                            backgroundColor: darkProTokens.error,
                                          },
                                          '& .MuiSlider-rail': {
                                            backgroundColor: darkProTokens.grayDark,
                                          }
                                        }}
                                      />
                                    </Grid>
                                    
                                    <Grid size={{ xs: 6 }}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={applyPenalty}
                                            onChange={(e) => setApplyPenalty(e.target.checked)}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: darkProTokens.warning,
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: darkProTokens.warning,
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                            ⚠️ Aplicar penalización
                                          </Typography>
                                        }
                                      />
                                      
                                      {applyPenalty && (
                                        <TextField
                                          fullWidth
                                          label="Monto de penalización"
                                          type="number"
                                          value={penaltyAmount}
                                          onChange={(e) => setPenaltyAmount(Number(e.target.value) || 0)}
                                          inputProps={{ min: 0, max: calculations.baseRefund, step: 0.01 }}
                                          sx={{
                                            mt: 1,
                                            '& .MuiOutlinedInput-root': {
                                              color: darkProTokens.textPrimary,
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: darkProTokens.grayDark
                                              }
                                            },
                                            '& .MuiInputLabel-root': { 
                                              color: darkProTokens.textSecondary,
                                              '&.Mui-focused': { color: darkProTokens.warning }
                                            }
                                          }}
                                        />
                                      )}
                                    </Grid>

                                    {['transfer', 'original_method'].includes(refundMethod) && (
                                      <Grid size={{ xs: 12 }}>
                                        <TextField
                                          fullWidth
                                          label="Referencia para el reembolso"
                                          value={refundReference}
                                          onChange={(e) => setRefundReference(e.target.value)}
                                          required
                                          InputProps={{
                                            sx: {
                                              color: darkProTokens.textPrimary,
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: darkProTokens.grayDark
                                              }
                                            }
                                          }}
                                          InputLabelProps={{
                                            sx: { 
                                              color: darkProTokens.textSecondary,
                                              '&.Mui-focused': { color: darkProTokens.error }
                                            }
                                          }}
                                        />
                                      </Grid>
                                    )}
                                  </Grid>

                                  {/* Configuración de inventario */}
                                  <Box sx={{ 
                                    mt: 4, 
                                    p: 3, 
                                    background: `${darkProTokens.roleModerator}10`, 
                                    borderRadius: 3, 
                                    border: `1px solid ${darkProTokens.roleModerator}30` 
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, mb: 2, fontWeight: 700 }}>
                                      📦 Gestión de Inventario
                                    </Typography>
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={restoreStock}
                                          onChange={(e) => setRestoreStock(e.target.checked)}
                                          sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                              color: darkProTokens.roleModerator,
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                              backgroundColor: darkProTokens.roleModerator,
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                          📦 Restaurar productos al inventario
                                        </Typography>
                                      }
                                    />
                                    
                                    {restoreStock && (
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={partialRestore}
                                            onChange={(e) => setPartialRestore(e.target.checked)}
                                            sx={{
                                              ml: 3,
                                              '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: darkProTokens.warning,
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: darkProTokens.warning,
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                            ⚠️ Restauración parcial (80%)
                                          </Typography>
                                        }
                                      />
                                    )}
                                  </Box>
                                </Box>
                              )}

                              <TextField
                                fullWidth
                                label="Notas adicionales"
                                multiline
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{
                                  mt: 3,
                                  '& .MuiOutlinedInput-root': {
                                    color: darkProTokens.textPrimary,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: darkProTokens.grayDark
                                    }
                                  },
                                  '& .MuiInputLabel-root': { 
                                    color: darkProTokens.textSecondary,
                                    '&.Mui-focused': { color: darkProTokens.error }
                                  }
                                }}
                              />

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button 
                                  onClick={() => setActiveStep(0)}
                                  sx={{ color: darkProTokens.textSecondary }}
                                >
                                  ← Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(2)}
                                  disabled={!canProceed()}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                                    color: darkProTokens.textPrimary,
                                    fontWeight: 700
                                  }}
                                >
                                  Continuar →
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 3: CONFIRMACIÓN */}
                          {index === 2 && calculations && (
                            <Box>
                              <Card sx={{
                                mb: 3,
                                background: `${darkProTokens.error}10`,
                                border: `1px solid ${darkProTokens.error}30`
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ color: darkProTokens.error, mb: 2, fontWeight: 700 }}>
                                    ⚠️ Confirmación de Cancelación
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Motivo:</strong> {cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Procesar reembolso:</strong> {processRefund ? 'Sí' : 'No'}
                                      </Typography>
                                      {processRefund && (
                                        <>
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            <strong>Método de reembolso:</strong> {refundMethods.find(m => m.value === refundMethod)?.label}
                                          </Typography>
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            <strong>Monto a reembolsar:</strong> {formatPrice(calculations.finalRefund)}
                                          </Typography>
                                        </>
                                      )}
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Restaurar inventario:</strong> {restoreStock ? (partialRestore ? 'Parcial (80%)' : 'Completo') : 'No'}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Productos afectados:</strong> {calculations.itemsToRestore}
                                      </Typography>
                                      {applyPenalty && (
                                        <Typography sx={{ color: darkProTokens.textSecondary }}>
                                          <strong>Penalización:</strong> {formatPrice(calculations.penalty)}
                                        </Typography>
                                      )}
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>

                              <Alert 
                                severity="warning" 
                                sx={{ 
                                  mb: 3,
                                  background: `${darkProTokens.warning}20`,
                                  border: `1px solid ${darkProTokens.warning}30`,
                                  color: darkProTokens.textPrimary,
                                  '& .MuiAlert-icon': { color: darkProTokens.warning }
                                }}
                              >
                                <Typography variant="body1">
                                  <strong>⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER</strong>
                                </Typography>
                                <Typography variant="body2">
                                  Al confirmar, el apartado será marcado como cancelado permanentemente.
                                </Typography>
                              </Alert>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button 
                                  onClick={() => setActiveStep(1)}
                                  sx={{ color: darkProTokens.textSecondary }}
                                >
                                  ← Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={processCancellation}
                                  disabled={processing}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: darkProTokens.textPrimary }} /> : <CancelIcon />}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                                    color: darkProTokens.textPrimary,
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3
                                  }}
                                >
                                  {processing ? 'Procesando...' : '🔴 CONFIRMAR CANCELACIÓN'}
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>

              {/* ✅ RESUMEN DE CANCELACIÓN */}
              <Grid size={{ xs: 4 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.error}30`,
                  borderRadius: 4,
                  p: 3, 
                  height: 'fit-content',
                  position: 'sticky',
                  top: 20
                }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.error, mb: 3, fontWeight: 700 }}>
                    ❌ Resumen de Cancelación
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Estado actual del apartado
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(safeLayaway.paid_amount / safeLayaway.total_amount) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: darkProTokens.grayDark,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: darkProTokens.error
                        }
                      }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total apartado:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Monto pagado:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                        {formatPrice(safeLayaway.paid_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Productos:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, fontWeight: 600 }}>
                        {safeLayaway.items.length} items
                      </Typography>
                    </Box>

                    {calculations && processRefund && (
                      <>
                        <Divider sx={{ my: 2, borderColor: darkProTokens.grayDark }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Reembolso base:</Typography>
                          <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                            {formatPrice(calculations.baseRefund)}
                          </Typography>
                        </Box>
                        
                        {calculations.penalty > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Penalización:</Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                              -{formatPrice(calculations.penalty)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{
                          p: 2,
                          background: `${darkProTokens.success}20`,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.success}30`
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Reembolso final:</Typography>
                          <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                            {formatPrice(calculations.finalRefund)}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {!processRefund && (
                      <>
                        <Divider sx={{ my: 2, borderColor: darkProTokens.grayDark }} />
                        <Alert 
                          severity="info"
                          sx={{
                            background: `${darkProTokens.info}20`,
                            border: `1px solid ${darkProTokens.info}30`,
                            color: darkProTokens.textPrimary,
                            '& .MuiAlert-icon': { color: darkProTokens.info }
                          }}
                        >
                          No se procesará reembolso
                        </Alert>
                      </>
                    )}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CancelIcon sx={{ fontSize: 100, color: darkProTokens.error, mb: 3 }} />
              <Typography variant="h3" sx={{ color: darkProTokens.error, fontWeight: 700, mb: 2 }}>
                ¡Apartado Cancelado!
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 4 }}>
                El apartado #{safeLayaway.sale_number} ha sido cancelado exitosamente
              </Typography>
              {processRefund && calculations && (
                <Typography variant="body1" sx={{ color: darkProTokens.success, mb: 3, fontWeight: 600 }}>
                  💰 Reembolso procesado: {formatPrice(calculations.finalRefund)}
                </Typography>
              )}
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                  color: darkProTokens.textPrimary,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3
                }}
              >
                Cerrar
              </Button>
            </motion.div>
          </Box>
        )}
      </DialogContent>

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
          background: linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.errorHover}, ${darkProTokens.error});
        }
      `}</style>
    </Dialog>
  );
}
