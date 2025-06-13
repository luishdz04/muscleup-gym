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
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon,
  ShoppingCart as ConvertIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
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
  roleStaff: '#1976D2'
};

interface ConvertToSaleDialogProps {
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
    allowsChange: true,
    allowsCommission: false,
    color: darkProTokens.primary
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true,
    color: darkProTokens.info
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true,
    color: darkProTokens.error
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 0,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: false,
    color: darkProTokens.roleStaff
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true,
    color: darkProTokens.warning
  }
];

export default function ConvertToSaleDialog({ 
  open, 
  onClose, 
  layaway, 
  onSuccess 
}: ConvertToSaleDialogProps) {
  
  // ✅ ESTADOS BÁSICOS HÍBRIDOS
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [applyCommission, setApplyCommission] = useState(true);
  const [customerChange, setCustomerChange] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [notes, setNotes] = useState('');
  
  // ✅ ESTADOS PARA CONVERSIÓN HÍBRIDOS
  const [convertToRegularSale, setConvertToRegularSale] = useState(true);
  const [generateNewNumber, setGenerateNewNumber] = useState(false);
  const [newSaleNumber, setNewSaleNumber] = useState('');
  
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
      customer_id: layaway.customer_id || '',
      status: layaway.status || 'pending',
      items: layaway.items || [],
      payment_history: layaway.payment_history || []
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

  // ✅ FUNCIÓN HÍBRIDA PARA GENERAR NÚMERO DE VENTA CORREGIDA CON FECHA MÉXICO
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    // ✅ USAR FECHA MÉXICO CONSISTENTE
    const mexicoDate = getMexicoDate();
    const year = mexicoDate.getFullYear().toString().slice(-2);
    const month = (mexicoDate.getMonth() + 1).toString().padStart(2, '0');
    const day = mexicoDate.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `VT${year}${month}${day}${timestamp}`;
  }, [getMexicoDate]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    // Reset estados
    setActiveStep(0);
    setProcessing(false);
    setCompleted(false);
    setPaymentMethod('efectivo');
    setPaymentReference('');
    setNotes('');
    setConvertToRegularSale(true);
    setGenerateNewNumber(false);
    setNewSaleNumber('');
    setCustomerChange(0);
    setCashReceived(0);
    
    // Cargar comisiones
    loadCommissions();
    
    // Set default cash received to pending amount
    if (safeLayaway?.pending_amount) {
      setCashReceived(safeLayaway.pending_amount);
    }
  }, [open, layaway, safeLayaway?.pending_amount, loadCommissions]);

  // ✅ CÁLCULOS HÍBRIDOS
  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    
    const pendingAmount = safeLayaway.pending_amount;
    let commission = 0;
    let totalToCollect = pendingAmount;
    
    if (applyCommission && paymentMethod) {
      const method = paymentMethods.find(m => m.value === paymentMethod);
      if (method && method.allowsCommission && method.commission > 0) {
        commission = pendingAmount * (method.commission / 100);
        totalToCollect = pendingAmount + commission;
      }
    }
    
    const change = paymentMethod === 'efectivo' && cashReceived > totalToCollect ? 
      cashReceived - totalToCollect : 0;
    
    return {
      pendingAmount,
      commission,
      totalToCollect,
      cashReceived,
      change,
      canComplete: pendingAmount <= 0 || (paymentMethod === 'efectivo' ? cashReceived >= totalToCollect : true),
      willGenerateChange: change > 0
    };
  }, [safeLayaway, paymentMethod, applyCommission, paymentMethods, cashReceived]);

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR CONVERSIÓN (CORREGIDA CON UTC)
  const processConversion = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      // ✅ GENERAR NUEVO NÚMERO SI ES NECESARIO
      let finalSaleNumber = safeLayaway.sale_number;
      if (generateNewNumber) {
        finalSaleNumber = newSaleNumber || await generateSaleNumber();
      }

      // ✅ USAR UTC PARA ALMACENAMIENTO (CONSISTENTE)
      const nowUTC = new Date().toISOString();

      // ✅ ACTUALIZAR EL APARTADO A VENTA COMPLETADA
      const updateData = {
        sale_number: finalSaleNumber,
        sale_type: convertToRegularSale ? 'regular' : 'layaway',
        status: 'completed',
        payment_status: 'paid',
        paid_amount: safeLayaway.total_amount,
        pending_amount: 0,
        payment_received: calculations.totalToCollect,
        change_amount: calculations.change,
        commission_rate: applyCommission ? (paymentMethods.find(m => m.value === paymentMethod)?.commission || 0) : 0,
        commission_amount: calculations.commission,
        notes: notes || `Convertido de apartado ${safeLayaway.sale_number}`,
        updated_at: nowUTC, // ✅ UTC
        completed_at: nowUTC // ✅ UTC
      };

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', safeLayaway.id);

      if (updateError) {
        throw updateError;
      }

      // ✅ REGISTRAR PAGO FINAL SI HAY MONTO PENDIENTE
      if (calculations.pendingAmount > 0) {
        const paymentData = {
          sale_id: safeLayaway.id,
          payment_method: paymentMethod,
          amount: calculations.totalToCollect,
          payment_reference: paymentReference || null,
          commission_rate: applyCommission ? (paymentMethods.find(m => m.value === paymentMethod)?.commission || 0) : 0,
          commission_amount: calculations.commission,
          sequence_order: (safeLayaway.payment_history?.length || 0) + 1,
          payment_date: nowUTC, // ✅ UTC
          created_at: nowUTC, // ✅ UTC
          created_by: userId,
          is_partial_payment: false,
          payment_sequence: 1,
          notes: `Pago final - Conversión a venta`
        };

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([paymentData]);

        if (paymentError) {
          throw paymentError;
        }
      }

      // ✅ CREAR HISTORIAL DE CONVERSIÓN
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: safeLayaway.id,
          previous_status: 'pending',
          new_status: 'completed',
          previous_paid_amount: safeLayaway.paid_amount,
          new_paid_amount: safeLayaway.total_amount,
          reason: `Convertido a ${convertToRegularSale ? 'venta regular' : 'venta completada'}`,
          created_at: nowUTC, // ✅ UTC
          created_by: userId
        }]);

      setCompleted(true);
      showNotification(
        `¡Apartado convertido exitosamente a ${convertToRegularSale ? 'venta regular' : 'venta completada'}!`, 
        'success'
      );

    } catch (error: any) {
      console.error('Error convirtiendo apartado:', error);
      showNotification('Error al convertir apartado: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, generateNewNumber, newSaleNumber, generateSaleNumber, convertToRegularSale, paymentMethod, paymentReference, applyCommission, paymentMethods, notes, showNotification]);

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
    
    switch (activeStep) {
      case 0:
        return true; // Siempre puede proceder del paso de configuración
      case 1:
        const method = paymentMethods.find(m => m.value === paymentMethod);
        return paymentMethod !== '' && 
               (!method?.requiresReference || paymentReference !== '') &&
               (paymentMethod !== 'efectivo' || cashReceived >= calculations.totalToCollect);
      case 2:
        return calculations.canComplete;
      default:
        return false;
    }
  }, [activeStep, calculations, paymentMethod, paymentReference, paymentMethods, cashReceived]);

  if (!open || !safeLayaway) return null;

  const steps = [
    { label: 'Configuración', description: 'Opciones de conversión' },
    { label: 'Pago Final', description: 'Método para el saldo pendiente' },
    { label: 'Confirmación', description: 'Revisar y procesar conversión' }
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
          border: `2px solid ${darkProTokens.roleStaff}50`,
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
        background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaff}CC)`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.background, 
            color: darkProTokens.roleStaff,
            width: 50,
            height: 50
          }}>
            <ConvertIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🛒 Convertir a Venta
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

            {/* ✅ ADVERTENCIA SI HAY SALDO PENDIENTE */}
            {safeLayaway.pending_amount > 0 && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 4,
                  background: `${darkProTokens.warning}20`,
                  border: `1px solid ${darkProTokens.warning}30`,
                  color: darkProTokens.textPrimary,
                  '& .MuiAlert-icon': { color: darkProTokens.warning }
                }}
              >
                ⚠️ <strong>Saldo Pendiente:</strong> Se debe cobrar {formatPrice(safeLayaway.pending_amount)} para completar la conversión
              </Alert>
            )}

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
                            color: activeStep === index ? darkProTokens.roleStaff : darkProTokens.grayMuted,
                            '&.Mui-completed': {
                              color: darkProTokens.roleStaff
                            }
                          }
                        }}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: CONFIGURACIÓN */}
                          {index === 0 && (
                            <Box>
                              <Card sx={{ 
                                p: 3, 
                                background: `${darkProTokens.success}10`, 
                                border: `1px solid ${darkProTokens.success}30`,
                                borderRadius: 3
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                  <SettingsIcon sx={{ color: darkProTokens.success }} />
                                  <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                                    ⚙️ Opciones de Conversión
                                  </Typography>
                                </Box>
                                
                                <Stack spacing={3}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={convertToRegularSale}
                                        onChange={(e) => setConvertToRegularSale(e.target.checked)}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: darkProTokens.success,
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: darkProTokens.success,
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                        🛒 Convertir a venta regular (recomendado)
                                      </Typography>
                                    }
                                  />
                                  
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, pl: 5 }}>
                                    {convertToRegularSale ? 
                                      'Se marcará como venta regular completada' : 
                                      'Se mantendrá como apartado completado'
                                    }
                                  </Typography>
                                  
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={generateNewNumber}
                                        onChange={(e) => setGenerateNewNumber(e.target.checked)}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: darkProTokens.roleStaff,
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: darkProTokens.roleStaff,
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                        🔢 Generar nuevo número de venta
                                      </Typography>
                                    }
                                  />
                                  
                                  {generateNewNumber && (
                                    <TextField
                                      fullWidth
                                      label="Nuevo número de venta (opcional)"
                                      value={newSaleNumber}
                                      onChange={(e) => setNewSaleNumber(e.target.value)}
                                      placeholder="Se generará automáticamente si se deja vacío"
                                      InputProps={{
                                        sx: {
                                          color: darkProTokens.textPrimary,
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.grayDark
                                          },
                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.roleStaff
                                          },
                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.roleStaff
                                          }
                                        }
                                      }}
                                      InputLabelProps={{
                                        sx: { 
                                          color: darkProTokens.textSecondary,
                                          '&.Mui-focused': { color: darkProTokens.roleStaff }
                                        }
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Card>

                              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  sx={{ 
                                    background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaff}CC)`,
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

                          {/* PASO 2: PAGO FINAL */}
                          {index === 1 && (
                            <Box>
                              {safeLayaway.pending_amount > 0 ? (
                                <Box>
                                  <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 3, fontWeight: 700 }}>
                                    💰 Pago del Saldo Pendiente: {formatPrice(safeLayaway.pending_amount)}
                                  </Typography>
                                  
                                  {/* Métodos de pago */}
                                  <Grid container spacing={3} sx={{ mb: 4 }}>
                                    {paymentMethods.map(method => (
                                      <Grid size={{ xs: 6 }} key={method.value}>
                                        <motion.div
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                        >
                                          <Card 
                                            sx={{
                                              p: 3,
                                              background: paymentMethod === method.value 
                                                ? `${method.color}20` 
                                                : `${darkProTokens.surfaceLevel1}60`,
                                              border: paymentMethod === method.value 
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
                                            onClick={() => setPaymentMethod(method.value)}
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
                                                    fontWeight: 600
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
                                                    fontWeight: 600
                                                  }}
                                                />
                                              )}
                                            </Box>
                                          </Card>
                                        </motion.div>
                                      </Grid>
                                    ))}
                                  </Grid>

                                  {/* Campos específicos del método de pago */}
                                  <Grid container spacing={3}>
                                    {paymentMethod === 'efectivo' && (
                                      <Grid size={{ xs: 6 }}>
                                        <TextField
                                          fullWidth
                                          label="Efectivo recibido"
                                          type="number"
                                          value={cashReceived}
                                          onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                                          inputProps={{ min: 0, step: 0.01 }}
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
                                    )}
                                    
                                    {paymentMethods.find(m => m.value === paymentMethod)?.requiresReference && (
                                      <Grid size={{ xs: 6 }}>
                                        <TextField
                                          fullWidth
                                          label="Referencia del pago"
                                          value={paymentReference}
                                          onChange={(e) => setPaymentReference(e.target.value)}
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
                                              '&.Mui-focused': { color: darkProTokens.roleStaff }
                                            }
                                          }}
                                        />
                                      </Grid>
                                    )}
                                    
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
                                            '&.Mui-focused': { color: darkProTokens.roleStaff }
                                          }
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              ) : (
                                <Alert 
                                  severity="success"
                                  sx={{
                                    background: `${darkProTokens.success}20`,
                                    border: `1px solid ${darkProTokens.success}30`,
                                    color: darkProTokens.textPrimary,
                                    '& .MuiAlert-icon': { color: darkProTokens.success }
                                  }}
                                >
                                  ✅ <strong>No hay saldo pendiente.</strong> El apartado ya está completamente pagado y listo para convertir.
                                </Alert>
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
                                    background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaff}CC)`,
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
                                    📋 Resumen de la Conversión
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Tipo de conversión:</strong> {convertToRegularSale ? 'Venta Regular' : 'Apartado Completado'}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Número final:</strong> {generateNewNumber ? (newSaleNumber || 'Se generará automáticamente') : safeLayaway.sale_number}
                                      </Typography>
                                      <Typography sx={{ color: darkProTokens.textSecondary }}>
                                        <strong>Método de pago:</strong> {paymentMethods.find(m => m.value === paymentMethod)?.label}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      {calculations.pendingAmount > 0 ? (
                                        <>
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            <strong>Monto pendiente:</strong> {formatPrice(calculations.pendingAmount)}
                                          </Typography>
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            <strong>Comisión:</strong> {formatPrice(calculations.commission)}
                                          </Typography>
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            <strong>Total a cobrar:</strong> {formatPrice(calculations.totalToCollect)}
                                          </Typography>
                                          {calculations.change > 0 && (
                                            <Typography sx={{ color: darkProTokens.textSecondary }}>
                                              <strong>Cambio:</strong> {formatPrice(calculations.change)}
                                            </Typography>
                                          )}
                                        </>
                                      ) : (
                                        <Typography sx={{ color: darkProTokens.textSecondary }}>
                                          <strong>Estado:</strong> ✅ Completamente pagado
                                        </Typography>
                                      )}
                                    </Grid>
                                  </Grid>
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
                                  onClick={processConversion}
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
                                  {processing ? 'Procesando...' : '✅ Confirmar Conversión'}
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
                  border: `1px solid ${darkProTokens.roleStaff}30`,
                  borderRadius: 4,
                  p: 3, 
                  height: 'fit-content',
                  position: 'sticky',
                  top: 20
                }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.roleStaff, mb: 3, fontWeight: 700 }}>
                    🛒 Resumen del Apartado
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
                          backgroundColor: darkProTokens.roleStaff
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

                    {calculations && calculations.pendingAmount > 0 && (
                      <>
                        <Divider sx={{ my: 2, borderColor: darkProTokens.grayDark }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Pago final:</Typography>
                          <Typography variant="h6" sx={{ color: darkProTokens.roleStaff, fontWeight: 600 }}>
                            {formatPrice(calculations.pendingAmount)}
                          </Typography>
                        </Box>
                        
                        {calculations.commission > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisión:</Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                              {formatPrice(calculations.commission)}
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

                        {calculations.change > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cambio:</Typography>
                            <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                              {formatPrice(calculations.change)}
                            </Typography>
                          </Box>
                        )}
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
                ¡Conversión Exitosa!
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 4 }}>
                El apartado #{safeLayaway.sale_number} ha sido convertido exitosamente a {convertToRegularSale ? 'venta regular' : 'venta completada'}
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
          background: linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaff}CC);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.roleStaff}CC, ${darkProTokens.roleStaff});
        }
      `}</style>
    </Dialog>
  );
}
