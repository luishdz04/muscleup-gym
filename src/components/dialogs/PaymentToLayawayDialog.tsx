'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack,
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
  Avatar,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

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
  roleTrainer: '#009688'
};

interface PaymentToLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
  onSuccess: () => void;
}

interface PaymentDetail {
  id: string;
  method: string;
  amount: number;
  reference?: string;
  commission: number;
  commissionAmount: number;
  sequence: number;
}

const defaultPaymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    commission: 0,
    requiresReference: false,
    allowsCommission: false,
    color: darkProTokens.primary
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsCommission: true,
    color: darkProTokens.info
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsCommission: true,
    color: darkProTokens.error
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 0,
    requiresReference: true,
    allowsCommission: false,
    color: darkProTokens.roleTrainer
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsCommission: true,
    color: darkProTokens.warning
  }
];

export default function PaymentToLayawayDialog({ 
  open, 
  onClose, 
  layaway, 
  onSuccess 
}: PaymentToLayawayDialogProps) {
  
  // ✅ ESTADOS BÁSICOS HÍBRIDOS
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [applyCommission, setApplyCommission] = useState(true);
  const [notes, setNotes] = useState('');
  
  // ✅ ESTADOS PARA PAGOS MIXTOS HÍBRIDOS
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0);
  const [currentPaymentReference, setCurrentPaymentReference] = useState('');
  
  // ✅ ESTADOS DE COMISIONES HÍBRIDOS
  const [paymentMethods, setPaymentMethods] = useState(defaultPaymentMethods);

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
      status: layaway.status || 'pending'
    };
  }, [layaway]);

  // ✅ FUNCIÓN HÍBRIDA PARA CARGAR COMISIONES
  const loadCommissions = useCallback(async () => {
    if (!open) return;
    
    try {
      const { data: commissions, error } = await supabase
        .from('payment_commissions')
        .select('*')
        .eq('is_active', true);

      if (!error && commissions && commissions.length > 0) {
        const updatedMethods = defaultPaymentMethods.map(method => {
          const dbCommission = commissions.find(c => c.payment_method === method.value);
          if (dbCommission && method.allowsCommission) {
            return {
              ...method,
              commission: dbCommission.commission_value
            };
          }
          return method;
        });
        
        setPaymentMethods(updatedMethods);
      } else {
        setPaymentMethods(defaultPaymentMethods);
      }
    } catch (error) {
      console.warn('Error cargando comisiones:', error);
      setPaymentMethods(defaultPaymentMethods);
    }
  }, [open, supabase]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    // Reset estados
    setActiveStep(0);
    setProcessing(false);
    setCompleted(false);
    setPaymentAmount(0);
    setPaymentMethod('');
    setPaymentReference('');
    setNotes('');
    setIsMixedPayment(false);
    setPaymentDetails([]);
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount(0);
    setCurrentPaymentReference('');
    
    // Cargar comisiones
    loadCommissions();
    
    // Set default payment amount to pending amount
    if (safeLayaway?.pending_amount) {
      setPaymentAmount(safeLayaway.pending_amount);
    }
  }, [open, layaway, safeLayaway?.pending_amount, loadCommissions]);

  // ✅ CÁLCULOS HÍBRIDOS
  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    
    let totalPaymentAmount = 0;
    let totalCommission = 0;
    let totalToCollect = 0;

    if (isMixedPayment && paymentDetails.length > 0) {
      totalPaymentAmount = paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
      totalCommission = paymentDetails.reduce((sum, payment) => sum + payment.commissionAmount, 0);
      totalToCollect = totalPaymentAmount + totalCommission;
    } else {
      totalPaymentAmount = paymentAmount;
      if (applyCommission && paymentMethod) {
        const method = paymentMethods.find(m => m.value === paymentMethod);
        if (method && method.allowsCommission && method.commission > 0) {
          totalCommission = paymentAmount * (method.commission / 100);
        }
      }
      totalToCollect = totalPaymentAmount + totalCommission;
    }

    const newPaidAmount = safeLayaway.paid_amount + totalPaymentAmount;
    const newPendingAmount = safeLayaway.total_amount - newPaidAmount;
    const willComplete = newPendingAmount <= 0;

    return {
      totalPaymentAmount,
      totalCommission,
      totalToCollect,
      newPaidAmount,
      newPendingAmount: Math.max(0, newPendingAmount),
      willComplete,
      maxPayment: safeLayaway.pending_amount,
      progressPercentage: (newPaidAmount / safeLayaway.total_amount) * 100
    };
  }, [safeLayaway, paymentAmount, paymentMethod, applyCommission, paymentMethods, isMixedPayment, paymentDetails]);

  // ✅ FUNCIÓN HÍBRIDA PARA AGREGAR PAGO MIXTO
  const addPaymentDetail = useCallback(() => {
    if (!currentPaymentMethod || currentPaymentAmount <= 0) {
      showNotification('Seleccione método y monto válido', 'error');
      return;
    }

    const method = paymentMethods.find(m => m.value === currentPaymentMethod);
    if (!method) return;

    const commission = applyCommission && method.allowsCommission ? method.commission : 0;
    const commissionAmount = currentPaymentAmount * (commission / 100);

    if (method.requiresReference && !currentPaymentReference) {
      showNotification('Se requiere referencia para este método', 'error');
      return;
    }

    const newPayment: PaymentDetail = {
      id: Date.now().toString(),
      method: currentPaymentMethod,
      amount: currentPaymentAmount,
      reference: currentPaymentReference || undefined,
      commission,
      commissionAmount,
      sequence: paymentDetails.length + 1
    };

    setPaymentDetails(prev => [...prev, newPayment]);
    
    // Reset campos
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount(0);
    setCurrentPaymentReference('');

    showNotification('Pago agregado correctamente', 'success');
  }, [currentPaymentMethod, currentPaymentAmount, currentPaymentReference, applyCommission, paymentDetails.length, paymentMethods, showNotification]);

  const removePaymentDetail = useCallback((id: string) => {
    setPaymentDetails(prev => prev.filter(p => p.id !== id));
    showNotification('Pago eliminado', 'info');
  }, [showNotification]);

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR PAGO (CORREGIDA CON UTC)
  const processPayment = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      const createTimestampForDB = useCallback((): string => {
  const now = new Date();
  const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return mexicoTime.toISOString();
}, []);

const nowUTC = createTimestampForDB();

      // ✅ CREAR DETALLES DE PAGO
      if (isMixedPayment && paymentDetails.length > 0) {
        const paymentInserts = paymentDetails.map((payment, index) => ({
          sale_id: safeLayaway.id,
          payment_method: payment.method,
          amount: payment.amount + payment.commissionAmount,
          payment_reference: payment.reference || null,
          commission_rate: payment.commission,
          commission_amount: payment.commissionAmount,
          sequence_order: payment.sequence,
          payment_date: nowUTC, // ✅ UTC
          created_at: nowUTC, // ✅ UTC
          created_by: userId,
          is_partial_payment: true,
          payment_sequence: index + 1,
          notes: `Abono mixto ${index + 1} de ${paymentDetails.length}`
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentInserts);

        if (paymentError) {
          throw paymentError;
        }
      } else {
        const paymentData = {
          sale_id: safeLayaway.id,
          payment_method: paymentMethod,
          amount: calculations.totalToCollect,
          payment_reference: paymentReference || null,
          commission_rate: applyCommission ? (paymentMethods.find(m => m.value === paymentMethod)?.commission || 0) : 0,
          commission_amount: calculations.totalCommission,
          sequence_order: 1,
          payment_date: nowUTC, // ✅ UTC
          created_at: nowUTC, // ✅ UTC
          created_by: userId,
          is_partial_payment: !calculations.willComplete,
          payment_sequence: 1,
          notes: notes || null
        };

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([paymentData]);

        if (paymentError) {
          throw paymentError;
        }
      }

      // ✅ ACTUALIZAR APARTADO
      const updateData = {
        paid_amount: calculations.newPaidAmount,
        pending_amount: calculations.newPendingAmount,
        last_payment_date: nowUTC, // ✅ UTC
        updated_at: nowUTC, // ✅ UTC
        ...(calculations.willComplete && {
          status: 'completed',
          payment_status: 'paid'
        })
      };

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', safeLayaway.id);

      if (updateError) {
        throw updateError;
      }

      // ✅ CREAR HISTORIAL
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: safeLayaway.id,
          previous_status: safeLayaway.status,
          new_status: calculations.willComplete ? 'completed' : safeLayaway.status,
          previous_paid_amount: safeLayaway.paid_amount,
          new_paid_amount: calculations.newPaidAmount,
          reason: calculations.willComplete ? 'Pago completado' : 'Abono recibido',
          created_at: nowUTC, // ✅ UTC
          created_by: userId
        }]);

      setCompleted(true);
      showNotification(
        calculations.willComplete ? 
        '¡Apartado completado exitosamente!' : 
        '¡Abono registrado exitosamente!', 
        'success'
      );

    } catch (error: any) {
      console.error('Error procesando pago:', error);
      showNotification('Error al procesar pago: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, isMixedPayment, paymentDetails, paymentMethod, paymentReference, applyCommission, paymentMethods, notes, showNotification]);

  // ✅ FUNCIÓN HÍBRIDA PARA CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN HÍBRIDA
  const canProceed = useCallback(() => {
    if (!calculations) return false;
    
    if (isMixedPayment) {
      return paymentDetails.length > 0 && calculations.totalPaymentAmount > 0;
    } else {
      const method = paymentMethods.find(m => m.value === paymentMethod);
      return paymentMethod !== '' && 
             paymentAmount > 0 &&
             (!method?.requiresReference || paymentReference !== '');
    }
  }, [calculations, isMixedPayment, paymentDetails, paymentMethod, paymentAmount, paymentReference, paymentMethods]);

  if (!open || !safeLayaway) return null;

  const steps = [
    { label: 'Método de Pago', description: 'Selecciona cómo recibir el pago' },
    { label: 'Monto y Detalles', description: 'Especifica cantidad y referencias' },
    { label: 'Confirmación', description: 'Revisa y procesa el pago' }
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
          border: `2px solid ${darkProTokens.roleTrainer}50`,
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
        background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC)`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.background, 
            color: darkProTokens.roleTrainer,
            width: 50,
            height: 50
          }}>
            <PaymentIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              💰 Registrar Abono
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Apartado #{safeLayaway.sale_number}
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
              background: `${darkProTokens.info}10`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 2, fontWeight: 700 }}>
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
                      <strong>Pendiente:</strong> {formatPrice(safeLayaway.pending_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

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
                            color: activeStep === index ? darkProTokens.roleTrainer : darkProTokens.grayMuted,
                            '&.Mui-completed': {
                              color: darkProTokens.roleTrainer
                            }
                          }
                        }}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: MÉTODO DE PAGO */}
                          {index === 0 && (
                            <Box>
                              <Box sx={{ mb: 3 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={isMixedPayment}
                                      onChange={(e) => setIsMixedPayment(e.target.checked)}
                                      sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                          color: darkProTokens.roleTrainer,
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                          backgroundColor: darkProTokens.roleTrainer,
                                        },
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                      💳 Pago con múltiples métodos
                                    </Typography>
                                  }
                                />
                              </Box>

                              <Grid container spacing={3}>
                                {paymentMethods.map(method => (
                                  <Grid size={{ xs: 6 }} key={method.value}>
                                    <motion.div
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Card 
                                        sx={{
                                          p: 3,
                                          background: (isMixedPayment ? currentPaymentMethod : paymentMethod) === method.value 
                                            ? `${method.color}20` 
                                            : `${darkProTokens.surfaceLevel1}60`,
                                          border: (isMixedPayment ? currentPaymentMethod : paymentMethod) === method.value 
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
                                        onClick={() => {
                                          if (isMixedPayment) {
                                            setCurrentPaymentMethod(method.value);
                                          } else {
                                            setPaymentMethod(method.value);
                                          }
                                        }}
                                      >
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h4" sx={{ mb: 1 }}>
                                            {method.icon}
                                          </Typography>
                                          <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 1, fontWeight: 700 }}>
                                            {method.label}
                                          </Typography>
                                          {method.commission > 0 && (
                                            <Chip 
                                              label={`Comisión: ${method.commission}%`}
                                              size="small"
                                              sx={{
                                                backgroundColor: darkProTokens.warning,
                                                color: darkProTokens.textPrimary,
                                                fontWeight: 600,
                                                mb: 1
                                              }}
                                            />
                                          )}
                                          {!method.allowsCommission && (
                                            <Chip 
                                              label="Sin comisión"
                                              size="small"
                                              sx={{
                                                backgroundColor: darkProTokens.success,
                                                color: darkProTokens.textPrimary,
                                                fontWeight: 600,
                                                mb: 1
                                              }}
                                            />
                                          )}
                                          {method.requiresReference && (
                                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block', mt: 1 }}>
                                              ⚠️ Requiere referencia
                                            </Typography>
                                          )}
                                        </Box>
                                      </Card>
                                    </motion.div>
                                  </Grid>
                                ))}
                              </Grid>

                              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  disabled={isMixedPayment ? !currentPaymentMethod : !paymentMethod}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC)`,
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

                          {/* PASO 2: MONTO Y DETALLES */}
                          {index === 1 && (
                            <Box>
                              {!isMixedPayment ? (
                                <Grid container spacing={3}>
                                  <Grid size={{ xs: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Monto del Abono"
                                      type="number"
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                                      inputProps={{ 
                                        min: 0, 
                                        max: safeLayaway.pending_amount,
                                        step: 0.01 
                                      }}
                                      InputProps={{
                                        sx: {
                                          color: darkProTokens.textPrimary,
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.grayDark
                                          },
                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.roleTrainer
                                          },
                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.roleTrainer
                                          }
                                        }
                                      }}
                                      InputLabelProps={{
                                        sx: { 
                                          color: darkProTokens.textSecondary,
                                          '&.Mui-focused': { color: darkProTokens.roleTrainer }
                                        }
                                      }}
                                    />
                                  </Grid>
                                  
                                  <Grid size={{ xs: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Referencia (opcional)"
                                      value={paymentReference}
                                      onChange={(e) => setPaymentReference(e.target.value)}
                                      required={paymentMethods.find(m => m.value === paymentMethod)?.requiresReference}
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
                                          '&.Mui-focused': { color: darkProTokens.roleTrainer }
                                        }
                                      }}
                                    />
                                  </Grid>
                                  
                                  <Grid size={{ xs: 12 }}>
                                    <TextField
                                      fullWidth
                                      label="Notas adicionales"
                                      multiline
                                      rows={2}
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
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
                                          '&.Mui-focused': { color: darkProTokens.roleTrainer }
                                        }
                                      }}
                                    />
                                  </Grid>
                                </Grid>
                              ) : (
                                <Box>
                                  {/* Agregar pago mixto */}
                                  <Card sx={{
                                    p: 3,
                                    mb: 3,
                                    background: `${darkProTokens.primary}10`,
                                    border: `1px solid ${darkProTokens.primary}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.primary, mb: 2 }}>
                                      ➕ Agregar Método de Pago
                                    </Typography>
                                    <Grid container spacing={2} alignItems="end">
                                      <Grid size={{ xs: 3 }}>
                                        <TextField
                                          fullWidth
                                          label="Monto"
                                          type="number"
                                          value={currentPaymentAmount}
                                          onChange={(e) => setCurrentPaymentAmount(Number(e.target.value) || 0)}
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
                                              '&.Mui-focused': { color: darkProTokens.primary }
                                            }
                                          }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 6 }}>
                                        <TextField
                                          fullWidth
                                          label="Referencia"
                                          value={currentPaymentReference}
                                          onChange={(e) => setCurrentPaymentReference(e.target.value)}
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
                                              '&.Mui-focused': { color: darkProTokens.primary }
                                            }
                                          }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 3 }}>
                                        <Button
                                          fullWidth
                                          variant="contained"
                                          onClick={addPaymentDetail}
                                          sx={{ 
                                            height: '56px', 
                                            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                                            color: darkProTokens.textPrimary
                                          }}
                                        >
                                          <AddIcon />
                                        </Button>
                                      </Grid>
                                    </Grid>
                                  </Card>

                                  {/* Lista de pagos mixtos */}
                                  {paymentDetails.length > 0 && (
                                    <TableContainer component={Paper} sx={{ 
                                      mb: 3,
                                      background: darkProTokens.surfaceLevel1,
                                      border: `1px solid ${darkProTokens.grayDark}`
                                    }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ background: darkProTokens.grayDark }}>
                                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Método</TableCell>
                                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Monto</TableCell>
                                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Comisión</TableCell>
                                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Total</TableCell>
                                            <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>Acciones</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {paymentDetails.map((payment) => (
                                            <TableRow key={payment.id} sx={{
                                              '&:hover': { backgroundColor: `${darkProTokens.primary}10` }
                                            }}>
                                              <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                                {paymentMethods.find(m => m.value === payment.method)?.icon} {payment.method}
                                              </TableCell>
                                              <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                                {formatPrice(payment.amount)}
                                              </TableCell>
                                              <TableCell sx={{ color: darkProTokens.warning }}>
                                                {formatPrice(payment.commissionAmount)}
                                              </TableCell>
                                              <TableCell sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                                                {formatPrice(payment.amount + payment.commissionAmount)}
                                              </TableCell>
                                              <TableCell>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => removePaymentDetail(payment.id)}
                                                  sx={{ color: darkProTokens.error }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  )}
                                </Box>
                              )}

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
                                    background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC)`,
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
                                background: `${darkProTokens.success}10`,
                                border: `1px solid ${darkProTokens.success}30`
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2, fontWeight: 700 }}>
                                    📋 Resumen del Abono
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Monto del abono:</strong> {formatPrice(calculations.totalPaymentAmount)}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Comisión total:</strong> {formatPrice(calculations.totalCommission)}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Total a cobrar:</strong> {formatPrice(calculations.totalToCollect)}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Nuevo pagado:</strong> {formatPrice(calculations.newPaidAmount)}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Nuevo pendiente:</strong> {formatPrice(calculations.newPendingAmount)}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Progreso:</strong> {Math.round(calculations.progressPercentage)}%
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  
                                  {calculations.willComplete && (
                                    <Alert 
                                      severity="success" 
                                      sx={{ 
                                        mt: 2,
                                        background: `${darkProTokens.success}20`,
                                        border: `1px solid ${darkProTokens.success}30`,
                                        color: darkProTokens.textPrimary,
                                        '& .MuiAlert-icon': { color: darkProTokens.success }
                                      }}
                                    >
                                      🎉 <strong>¡Este abono completará el apartado!</strong>
                                    </Alert>
                                  )}
                                </CardContent>
                              </Card>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button 
                                  onClick={() => setActiveStep(1)}
                                  sx={{ color: darkProTokens.textSecondary }}
                                >
                                  ← Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={processPayment}
                                  disabled={processing}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: darkProTokens.textPrimary }} /> : <CheckIcon />}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                                    color: darkProTokens.textPrimary,
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3
                                  }}
                                >
                                  {processing ? 'Procesando...' : '✅ Confirmar Abono'}
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

              {/* ✅ RESUMEN DEL APARTADO */}
              <Grid size={{ xs: 4 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.roleTrainer}30`,
                  borderRadius: 4,
                  p: 3, 
                  height: 'fit-content',
                  position: 'sticky',
                  top: 20
                }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.roleTrainer, mb: 3, fontWeight: 700 }}>
                    💰 Resumen del Apartado
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Progreso actual: {Math.round((safeLayaway.paid_amount / safeLayaway.total_amount) * 100)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(safeLayaway.paid_amount / safeLayaway.total_amount) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: darkProTokens.grayDark,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: darkProTokens.roleTrainer
                        }
                      }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Pagado:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                        {formatPrice(safeLayaway.paid_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Pendiente:</Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                        {formatPrice(safeLayaway.pending_amount)}
                      </Typography>
                    </Box>

                    {calculations && (
                      <>
                        <Divider sx={{ my: 2, borderColor: darkProTokens.grayDark }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Nuevo abono:</Typography>
                          <Typography variant="h6" sx={{ color: darkProTokens.roleTrainer, fontWeight: 600 }}>
                            {formatPrice(calculations.totalPaymentAmount)}
                          </Typography>
                        </Box>
                        
                        {calculations.totalCommission > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisión:</Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                              {formatPrice(calculations.totalCommission)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{
                          p: 2,
                          background: `${darkProTokens.success}20`,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.success}30`
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total a cobrar:</Typography>
                          <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                            {formatPrice(calculations.totalToCollect)}
                          </Typography>
                        </Box>
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
              <CheckIcon sx={{ fontSize: 100, color: darkProTokens.success, mb: 3 }} />
              <Typography variant="h3" sx={{ color: darkProTokens.success, fontWeight: 700, mb: 2 }}>
                ¡Abono Registrado Exitosamente!
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 4 }}>
                El pago ha sido procesado correctamente para el apartado #{safeLayaway.sale_number}
              </Typography>
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
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
          background: linear-gradient(135deg, ${darkProTokens.roleTrainer}, ${darkProTokens.roleTrainer}CC);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.roleTrainer}CC, ${darkProTokens.roleTrainer});
        }
      `}</style>
    </Dialog>
  );
}
