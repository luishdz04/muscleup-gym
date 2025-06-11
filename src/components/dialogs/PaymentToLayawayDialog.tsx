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
  LinearProgress
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

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
    allowsCommission: false
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsCommission: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsCommission: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 0,
    requiresReference: true,
    allowsCommission: false
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsCommission: true
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

  const supabase = createBrowserSupabaseClient();

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
      console.log('🔍 Cargando comisiones... - 2025-06-11 08:34:55 UTC - luishdz04');
      
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
        console.log('✅ Comisiones cargadas:', updatedMethods);
      } else {
        setPaymentMethods(defaultPaymentMethods);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando comisiones:', error);
      setPaymentMethods(defaultPaymentMethods);
    }
  }, [open, supabase]); // ✅ DEPENDENCIAS ESPECÍFICAS

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    console.log('🔄 Inicializando dialog de pago... - 2025-06-11 08:34:55 UTC - luishdz04');
    
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
  }, [currentPaymentMethod, currentPaymentAmount, currentPaymentReference, applyCommission, paymentDetails.length, paymentMethods]);

  const removePaymentDetail = useCallback((id: string) => {
    setPaymentDetails(prev => prev.filter(p => p.id !== id));
    showNotification('Pago eliminado', 'info');
  }, []);

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR PAGO
  const processPayment = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      console.log('🚀 Procesando pago para apartado:', safeLayaway.sale_number, '- 2025-06-11 08:34:55 UTC - luishdz04');

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
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
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
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
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
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      setCompleted(true);
      showNotification(
        calculations.willComplete ? 
        '¡Apartado completado exitosamente!' : 
        '¡Abono registrado exitosamente!', 
        'success'
      );

      console.log('✅ Pago procesado exitosamente');

    } catch (error: any) {
      console.error('💥 Error procesando pago:', error);
      showNotification('Error al procesar pago: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, isMixedPayment, paymentDetails, paymentMethod, paymentReference, applyCommission, paymentMethods, notes]);

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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
          color: '#FFFFFF',
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.98), rgba(33, 150, 243, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <PaymentIcon />
          <Typography variant="h5" fontWeight="bold">
            💰 Registrar Abono - Apartado #{safeLayaway.sale_number}
          </Typography>
          <Chip 
            label="HÍBRIDO v1.1" 
            color="success" 
            size="small" 
            sx={{ bgcolor: 'rgba(76,175,80,0.8)', color: '#FFFFFF', fontWeight: 'bold' }}
          />
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* ✅ INFORMACIÓN DEL APARTADO CON GRID CORRECTO */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="body2">
                    <strong>Cliente:</strong> {safeLayaway.customer_name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="body2">
                    <strong>Total:</strong> {formatPrice(safeLayaway.total_amount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="body2">
                    <strong>Pagado:</strong> {formatPrice(safeLayaway.paid_amount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="body2">
                    <strong>Pendiente:</strong> {formatPrice(safeLayaway.pending_amount)}
                  </Typography>
                </Grid>
              </Grid>
            </Alert>

            {/* ✅ INDICADOR HÍBRIDO */}
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ <strong>SOLUCIÓN HÍBRIDA:</strong> useCallback controlado + Grid correcto - 2025-06-11 08:34:55 UTC por luishdz04
            </Alert>

            <Grid container spacing={4}>
              {/* ✅ STEPPER CON GRID CORRECTO */}
              <Grid size={{ xs: 8 }}>
                <Card sx={{ background: 'rgba(51, 51, 51, 0.8)', p: 2 }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#FFFFFF' } }}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: '#CCCCCC', mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: MÉTODO DE PAGO */}
                          {index === 0 && (
                            <Box>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={isMixedPayment}
                                    onChange={(e) => setIsMixedPayment(e.target.checked)}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#2196f3',
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#2196f3',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: 'white' }}>
                                    💳 Pago con múltiples métodos
                                  </Typography>
                                }
                              />

                              <Grid container spacing={3} sx={{ mt: 2 }}>
                                {paymentMethods.map(method => (
                                  <Grid size={{ xs: 6 }} key={method.value}>
                                    <Card 
                                      sx={{
                                        p: 2,
                                        background: (isMixedPayment ? currentPaymentMethod : paymentMethod) === method.value 
                                          ? 'rgba(33, 150, 243, 0.2)' 
                                          : 'rgba(255,255,255,0.05)',
                                        border: (isMixedPayment ? currentPaymentMethod : paymentMethod) === method.value 
                                          ? '2px solid #2196f3' 
                                          : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          background: 'rgba(33, 150, 243, 0.1)',
                                          border: '1px solid rgba(33, 150, 243, 0.5)'
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
                                      <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1 }}>
                                        {method.icon} {method.label}
                                      </Typography>
                                      {method.commission > 0 && (
                                        <Chip 
                                          label={`Comisión: ${method.commission}%`}
                                          size="small"
                                          color="warning"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      )}
                                      {method.requiresReference && (
                                        <Typography variant="caption" sx={{ color: '#CCCCCC', display: 'block', mt: 1 }}>
                                          ⚠️ Requiere referencia
                                        </Typography>
                                      )}
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  disabled={isMixedPayment ? !currentPaymentMethod : !paymentMethod}
                                  sx={{ background: 'linear-gradient(135deg, #2196f3, #1976d2)' }}
                                >
                                  Continuar
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
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: 'white',
                                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                          '&:hover fieldset': { borderColor: 'rgba(33, 150, 243, 0.5)' },
                                          '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
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
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: 'white',
                                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                          '&:hover fieldset': { borderColor: 'rgba(33, 150, 243, 0.5)' },
                                          '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
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
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: 'white',
                                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                          '&:hover fieldset': { borderColor: 'rgba(33, 150, 243, 0.5)' },
                                          '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                      }}
                                    />
                                  </Grid>
                                </Grid>
                              ) : (
                                <Box>
                                  {/* Agregar pago mixto */}
                                  <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 3 }}>
                                      <TextField
                                        fullWidth
                                        label="Monto"
                                        type="number"
                                        value={currentPaymentAmount}
                                        onChange={(e) => setCurrentPaymentAmount(Number(e.target.value) || 0)}
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                                          },
                                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        fullWidth
                                        label="Referencia"
                                        value={currentPaymentReference}
                                        onChange={(e) => setCurrentPaymentReference(e.target.value)}
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                                          },
                                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 3 }}>
                                      <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={addPaymentDetail}
                                        sx={{ height: '56px', background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
                                      >
                                        <AddIcon />
                                      </Button>
                                    </Grid>
                                  </Grid>

                                  {/* Lista de pagos mixtos */}
                                  {paymentDetails.length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell><strong>Método</strong></TableCell>
                                            <TableCell><strong>Monto</strong></TableCell>
                                            <TableCell><strong>Comisión</strong></TableCell>
                                            <TableCell><strong>Total</strong></TableCell>
                                            <TableCell><strong>Acciones</strong></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {paymentDetails.map((payment) => (
                                            <TableRow key={payment.id}>
                                              <TableCell>
                                                {paymentMethods.find(m => m.value === payment.method)?.icon} {payment.method}
                                              </TableCell>
                                              <TableCell>{formatPrice(payment.amount)}</TableCell>
                                              <TableCell>{formatPrice(payment.commissionAmount)}</TableCell>
                                              <TableCell><strong>{formatPrice(payment.amount + payment.commissionAmount)}</strong></TableCell>
                                              <TableCell>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => removePaymentDetail(payment.id)}
                                                  sx={{ color: '#f44336' }}
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
                                <Button onClick={() => setActiveStep(0)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(2)}
                                  disabled={!canProceed()}
                                  sx={{ background: 'linear-gradient(135deg, #2196f3, #1976d2)' }}
                                >
                                  Continuar
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 3: CONFIRMACIÓN */}
                          {index === 2 && calculations && (
                            <Box>
                              <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                  📋 Resumen del Abono
                                </Typography>
                                
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography><strong>Monto del abono:</strong> {formatPrice(calculations.totalPaymentAmount)}</Typography>
                                    <Typography><strong>Comisión total:</strong> {formatPrice(calculations.totalCommission)}</Typography>
                                    <Typography><strong>Total a cobrar:</strong> {formatPrice(calculations.totalToCollect)}</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography><strong>Nuevo pagado:</strong> {formatPrice(calculations.newPaidAmount)}</Typography>
                                    <Typography><strong>Nuevo pendiente:</strong> {formatPrice(calculations.newPendingAmount)}</Typography>
                                    <Typography><strong>Progreso:</strong> {Math.round(calculations.progressPercentage)}%</Typography>
                                  </Grid>
                                </Grid>
                                
                                {calculations.willComplete && (
                                  <Alert severity="success" sx={{ mt: 2 }}>
                                    🎉 <strong>¡Este abono completará el apartado!</strong>
                                  </Alert>
                                )}
                              </Alert>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button onClick={() => setActiveStep(1)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={processPayment}
                                  disabled={processing}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <CheckIcon />}
                                  sx={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
                                >
                                  {processing ? 'Procesando...' : 'Confirmar Abono'}
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

              {/* ✅ RESUMEN CON GRID CORRECTO */}
              <Grid size={{ xs: 4 }}>
                <Card sx={{ background: 'rgba(33, 150, 243, 0.1)', p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" sx={{ color: '#2196f3', mb: 2, fontWeight: 700 }}>
                    💰 Resumen del Apartado
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                      Progreso actual: {Math.round((safeLayaway.paid_amount / safeLayaway.total_amount) * 100)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(safeLayaway.paid_amount / safeLayaway.total_amount) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#2196f3'
                        }
                      }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Total:</Typography>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Pagado:</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                        {formatPrice(safeLayaway.paid_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Pendiente:</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
                        {formatPrice(safeLayaway.pending_amount)}
                      </Typography>
                    </Box>

                    {calculations && (
                      <>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Nuevo abono:</Typography>
                          <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 600 }}>
                            {formatPrice(calculations.totalPaymentAmount)}
                          </Typography>
                        </Box>
                        
                        {calculations.totalCommission > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Comisión:</Typography>
                            <Typography variant="body1" sx={{ color: '#ff9800', fontWeight: 600 }}>
                              {formatPrice(calculations.totalCommission)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Total a cobrar:</Typography>
                          <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700, mb: 2 }}>
              ¡Abono Registrado Exitosamente!
            </Typography>
            <Typography variant="body1" sx={{ color: '#CCCCCC', mb: 3 }}>
              El pago ha sido procesado correctamente para el apartado #{safeLayaway.sale_number}
            </Typography>
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
            >
              Cerrar
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}