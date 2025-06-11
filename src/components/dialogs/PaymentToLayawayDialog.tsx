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
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Chip,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  MonetizationOn as CashIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface PaymentToLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any; // ✅ CORREGIDO: Tipo flexible por ahora
  onSuccess: () => void;
}

interface PaymentData {
  amount: number;
  method: string;
  reference: string;
  commission_rate: number;
  commission_amount: number;
  printReceipt: boolean;
  sendEmail: boolean;
  notes: string;
}

// ✅ MÉTODOS DE PAGO CORREGIDOS
const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵', hasCommission: false },
  { value: 'debito', label: 'Tarjeta Débito', icon: '💳', hasCommission: true },
  { value: 'credito', label: 'Tarjeta Crédito', icon: '💳', hasCommission: true },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦', hasCommission: false },
  { value: 'vales', label: 'Vales de Despensa', icon: '🎫', hasCommission: true }
];

export default function PaymentToLayawayDialog({
  open,
  onClose,
  layaway,
  onSuccess
}: PaymentToLayawayDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    method: '',
    reference: '',
    commission_rate: 0,
    commission_amount: 0,
    printReceipt: true,
    sendEmail: false,
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentCommissions, setPaymentCommissions] = useState<any[]>([]);

  const supabase = createBrowserSupabaseClient();

  // ✅ CARGAR COMISIONES CORREGIDO
  const loadCommissions = useCallback(async () => {
    try {
      console.log('🔍 Cargando comisiones para abono...');
      
      const { data, error } = await supabase
        .from('payment_commissions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error cargando comisiones:', error);
        // Usar valores por defecto si falla
        setPaymentCommissions([
          { payment_method: 'debito', commission_type: 'percentage', commission_value: 2.5, min_amount: 0 },
          { payment_method: 'credito', commission_type: 'percentage', commission_value: 3.5, min_amount: 0 },
          { payment_method: 'vales', commission_type: 'percentage', commission_value: 4.0, min_amount: 0 }
        ]);
      } else {
        setPaymentCommissions(data || []);
        console.log('✅ Comisiones cargadas:', data?.length || 0);
      }
    } catch (error) {
      console.error('💥 Error cargando comisiones:', error);
    }
  }, [supabase]);

  useEffect(() => {
    if (open && layaway) {
      console.log('🔄 Inicializando dialog de abono para:', layaway.sale_number);
      
      loadCommissions();
      setActiveStep(0);
      setPaymentData({
        amount: 0,
        method: '',
        reference: '',
        commission_rate: 0,
        commission_amount: 0,
        printReceipt: true,
        sendEmail: !!layaway?.customer_email,
        notes: ''
      });
      setErrors({});
      setConfirmDialogOpen(false);
    }
  }, [open, layaway, loadCommissions]);

  // ✅ CALCULAR COMISIÓN CORREGIDO
  const calculateCommission = useCallback((method: string, amount: number) => {
    // Solo aplicar comisión a débito, crédito y vales
    if (!['debito', 'credito', 'vales'].includes(method)) {
      return { rate: 0, amount: 0 };
    }

    const commission = paymentCommissions.find(c => c.payment_method === method);
    if (!commission || amount < (commission.min_amount || 0)) {
      // Valores por defecto si no se encuentra configuración
      const defaultRates: Record<string, number> = {
        debito: 2.5,
        credito: 3.5,
        vales: 4.0
      };
      
      const rate = defaultRates[method] || 0;
      return { rate, amount: (amount * rate) / 100 };
    }

    if (commission.commission_type === 'percentage') {
      const commissionAmount = (amount * commission.commission_value) / 100;
      return { rate: commission.commission_value, amount: commissionAmount };
    } else {
      return { rate: 0, amount: commission.commission_value };
    }
  }, [paymentCommissions]);

  // ✅ MANEJAR CAMBIO DE MÉTODO
  const handleMethodChange = (method: string) => {
    const commission = calculateCommission(method, paymentData.amount);
    setPaymentData(prev => ({
      ...prev,
      method,
      commission_rate: commission.rate,
      commission_amount: commission.amount
    }));
  };

  // ✅ MANEJAR CAMBIO DE MONTO
  const handleAmountChange = (amount: number) => {
    const commission = calculateCommission(paymentData.method, amount);
    setPaymentData(prev => ({
      ...prev,
      amount,
      commission_rate: commission.rate,
      commission_amount: commission.amount
    }));
  };

  // ✅ VALIDAR PASO CORREGIDO
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!paymentData.amount || paymentData.amount <= 0) {
        newErrors.amount = 'El monto debe ser mayor a 0';
      }
      if (layaway && paymentData.amount > (layaway.pending_amount || 0)) {
        newErrors.amount = 'El monto no puede exceder el pendiente';
      }
      if (!paymentData.method) {
        newErrors.method = 'Seleccione un método de pago';
      }
      if (['debito', 'credito'].includes(paymentData.method) && !paymentData.reference.trim()) {
        newErrors.reference = 'La referencia es requerida para tarjetas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ PROCESAR ABONO CORREGIDO
  const processPayment = async () => {
    if (!validateStep(0) || !layaway) return;

    setProcessing(true);
    try {
      console.log('💳 Procesando abono...', {
        apartado: layaway.sale_number,
        monto: paymentData.amount,
        metodo: paymentData.method,
        timestamp: '2025-06-11 06:55:34 UTC',
        usuario: 'luishdz04'
      });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }
      const userId = userData.user.id;

      const totalAmount = paymentData.amount + paymentData.commission_amount;
      const newPaidAmount = (layaway.paid_amount || 0) + paymentData.amount;
      const newPendingAmount = (layaway.total_amount || 0) - newPaidAmount;
      const isFullPayment = newPendingAmount <= 0;

      console.log('🧮 Cálculos:', {
        montoAbono: paymentData.amount,
        comision: paymentData.commission_amount,
        totalProcesar: totalAmount,
        nuevoPagado: newPaidAmount,
        nuevoPendiente: newPendingAmount,
        pagoCompleto: isFullPayment
      });

      // ✅ REGISTRAR PAGO EN sale_payment_details
      const { error: paymentError } = await supabase
        .from('sale_payment_details')
        .insert([{
          sale_id: layaway.id,
          payment_method: paymentData.method,
          amount: paymentData.amount,
          payment_reference: paymentData.reference || null,
          commission_rate: paymentData.commission_rate,
          commission_amount: paymentData.commission_amount,
          sequence_order: 1, // ✅ Simplificado por ahora
          payment_date: new Date().toISOString(),
          is_partial_payment: !isFullPayment,
          notes: paymentData.notes || null,
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      if (paymentError) {
        console.error('❌ Error registrando pago:', paymentError);
        throw paymentError;
      }

      console.log('✅ Pago registrado en sale_payment_details');

      // ✅ ACTUALIZAR APARTADO EN sales
      const updateData: any = {
        paid_amount: newPaidAmount,
        pending_amount: Math.max(0, newPendingAmount),
        commission_amount: (layaway.commission_amount || 0) + paymentData.commission_amount,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      // ✅ Si es pago completo, convertir a venta
      if (isFullPayment) {
        updateData.status = 'completed';
        updateData.payment_status = 'paid';
        updateData.sale_type = 'sale'; // ✅ Cambiar de layaway a sale
        updateData.completed_at = new Date().toISOString();
        console.log('🎉 Convirtiendo apartado a venta completa');
      } else {
        updateData.payment_status = 'partial';
        console.log('📊 Actualizando apartado con abono parcial');
      }

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', layaway.id);

      if (updateError) {
        console.error('❌ Error actualizando apartado:', updateError);
        throw updateError;
      }

      console.log('✅ Apartado actualizado en sales');

      // ✅ REGISTRAR HISTORIAL DE ESTADO
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: layaway.status,
          new_status: isFullPayment ? 'completed' : layaway.status,
          previous_paid_amount: layaway.paid_amount || 0,
          new_paid_amount: newPaidAmount,
          reason: `Abono de ${formatPrice(paymentData.amount)} - ${paymentData.method}${paymentData.reference ? ` (${paymentData.reference})` : ''} - Usuario: luishdz04`,
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      console.log('✅ Historial de estado registrado');

      // ✅ NOTA: NO actualizar inventario aquí
      // El inventario ya se actualizó cuando se creó el apartado
      // Solo se libera cuando se cancela un apartado

      showNotification(
        isFullPayment ? 
          '🎉 ¡Apartado completado! Se convirtió automáticamente en venta final.' : 
          '💰 Abono registrado exitosamente',
        'success'
      );

      onSuccess();
    } catch (error) {
      console.error('💥 Error procesando abono:', error);
      showNotification('Error al procesar el abono: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  if (!layaway) return null;

  const pendingAmount = layaway.pending_amount || 0;
  const isFullPayment = paymentData.amount >= pendingAmount;
  const totalWithCommission = paymentData.amount + paymentData.commission_amount;

  const steps = [
    { label: 'Información del Pago', description: 'Monto y método de pago' },
    { label: 'Confirmación', description: 'Revisar y procesar abono' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #4caf50, #388e3c)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PaymentIcon />
          <Typography variant="h6" fontWeight="bold">
            💰 Abono a Apartado #{layaway.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ ESTADO DEL APARTADO CON GRID SIZE */}
        <Card sx={{ 
          mb: 3, 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
          border: '2px solid rgba(76, 175, 80, 0.3)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
              📋 Estado del Apartado
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Total Apartado</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(layaway.total_amount || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pagado</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPrice(layaway.paid_amount || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {formatPrice(pendingAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Progreso</Typography>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    {layaway.total_amount > 0 ? Math.round(((layaway.paid_amount || 0) / layaway.total_amount) * 100) : 0}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {layaway.customer_name && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                <Typography variant="body2" color="textSecondary">Cliente:</Typography>
                <Typography variant="body1" fontWeight="600">
                  {layaway.customer_name}
                </Typography>
                {layaway.customer_email && (
                  <Typography variant="body2" color="textSecondary">
                    {layaway.customer_email}
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6" fontWeight="600">
                  {step.label}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {/* PASO 1: Información del Pago */}
                {index === 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Grid container spacing={3}>
                      {/* ✅ MONTO DEL ABONO CON GRID SIZE */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Monto del Abono"
                          type="number"
                          value={paymentData.amount || ''}
                          onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.amount}
                          helperText={errors.amount || `Máximo: ${formatPrice(pendingAmount)}`}
                          inputProps={{ 
                            max: pendingAmount, 
                            min: 0, 
                            step: 0.01 
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalculateIcon sx={{ color: '#4caf50' }} />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>

                      {/* ✅ MÉTODO DE PAGO CON GRID SIZE */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth error={!!errors.method}>
                          <InputLabel>Método de Pago</InputLabel>
                          <Select
                            value={paymentData.method}
                            onChange={(e) => handleMethodChange(e.target.value)}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.icon} {method.label} 
                                {method.hasCommission ? ' (Con comisión)' : ' (Sin comisión)'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* ✅ REFERENCIA CON GRID SIZE */}
                      {['debito', 'credito'].includes(paymentData.method) && (
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Número de Autorización"
                            value={paymentData.reference}
                            onChange={(e) => setPaymentData(prev => ({ 
                              ...prev, 
                              reference: e.target.value 
                            }))}
                            error={!!errors.reference}
                            helperText={errors.reference}
                            placeholder="Ej: 123456, AUTH789..."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CreditCardIcon sx={{ color: '#4caf50' }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      )}

                      {/* ✅ RESUMEN DEL PAGO CON GRID SIZE */}
                      {paymentData.amount > 0 && paymentData.method && (
                        <Grid size={{ xs: 12 }}>
                          <Card sx={{
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                          }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                                📊 Resumen del Abono
                              </Typography>
                              
                              <Grid container spacing={2}>
                                <Grid size={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">Monto Base</Typography>
                                    <Typography variant="h6" fontWeight="600">
                                      {formatPrice(paymentData.amount)}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">Comisión</Typography>
                                    <Typography variant="h6" fontWeight="600" color={paymentData.commission_amount > 0 ? 'warning.main' : 'success.main'}>
                                      {paymentData.commission_amount > 0 ? 
                                        formatPrice(paymentData.commission_amount) : 
                                        'Sin comisión'
                                      }
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">Total a Pagar</Typography>
                                    <Typography variant="h6" fontWeight="700" color="primary">
                                      {formatPrice(totalWithCommission)}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid size={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">Quedará Pendiente</Typography>
                                    <Typography variant="h6" fontWeight="600" color={isFullPayment ? 'success.main' : 'warning.main'}>
                                      {isFullPayment ? 'Completado' : formatPrice(pendingAmount - paymentData.amount)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* ✅ ALERTA DE PAGO COMPLETO CON GRID SIZE */}
                      {isFullPayment && (
                        <Grid size={{ xs: 12 }}>
                          <Alert severity="success">
                            🎉 <strong>¡Apartado Completo!</strong> Este abono completará el apartado y se convertirá automáticamente en venta final.
                          </Alert>
                        </Grid>
                      )}

                      {/* ✅ OPCIONES ADICIONALES CON GRID SIZE */}
                      <Grid size={{ xs: 12 }}>
                        <Card sx={{
                          background: 'rgba(33, 150, 243, 0.05)',
                          border: '1px solid rgba(33, 150, 243, 0.2)'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: '#2196f3', fontWeight: 700 }}>
                              ⚙️ Opciones Adicionales
                            </Typography>

                            <Grid container spacing={2}>
                              <Grid size={6}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={paymentData.printReceipt}
                                      onChange={(e) => setPaymentData(prev => ({ 
                                        ...prev, 
                                        printReceipt: e.target.checked 
                                      }))}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <ReceiptIcon />
                                      Imprimir recibo
                                    </Box>
                                  }
                                />
                              </Grid>

                              <Grid size={6}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={paymentData.sendEmail}
                                      onChange={(e) => setPaymentData(prev => ({ 
                                        ...prev, 
                                        sendEmail: e.target.checked 
                                      }))}
                                      disabled={!layaway.customer_email}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <EmailIcon />
                                      Enviar por email
                                    </Box>
                                  }
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  fullWidth
                                  label="Notas del abono (2025-06-11 06:55:34 UTC - luishdz04)"
                                  multiline
                                  rows={2}
                                  value={paymentData.notes}
                                  onChange={(e) => setPaymentData(prev => ({ 
                                    ...prev, 
                                    notes: e.target.value 
                                  }))}
                                  placeholder="Información adicional sobre este abono..."
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* PASO 2: Confirmación */}
                {index === 1 && (
                  <Box sx={{ mb: 4 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body1" fontWeight="600">
                        🔍 Revisar la información antes de procesar el abono
                      </Typography>
                    </Alert>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                              💳 Información del Pago
                            </Typography>
                            
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Método:</Typography>
                                <Typography variant="body1" fontWeight="600">
                                  {paymentMethods.find(m => m.value === paymentData.method)?.icon} {' '}
                                  {paymentMethods.find(m => m.value === paymentData.method)?.label}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="body2" color="textSecondary">Monto del Abono:</Typography>
                                <Typography variant="h6" fontWeight="700" color="success.main">
                                  {formatPrice(paymentData.amount)}
                                </Typography>
                              </Box>

                              {paymentData.commission_amount > 0 && (
                                <Box>
                                  <Typography variant="body2" color="textSecondary">Comisión ({paymentData.commission_rate}%):</Typography>
                                  <Typography variant="body1" fontWeight="600" color="warning.main">
                                    {formatPrice(paymentData.commission_amount)}
                                  </Typography>
                                </Box>
                              )}

                              <Divider />

                              <Box>
                                <Typography variant="body2" color="textSecondary">Total a Procesar:</Typography>
                                <Typography variant="h5" fontWeight="800" color="primary">
                                  {formatPrice(totalWithCommission)}
                                </Typography>
                              </Box>

                              {paymentData.reference && (
                                <Box>
                                  <Typography variant="body2" color="textSecondary">Referencia:</Typography>
                                  <Typography variant="body1" fontWeight="600">
                                    {paymentData.reference}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                              📈 Impacto en el Apartado
                            </Typography>
                            
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Estado Actual:</Typography>
                                <Typography variant="body1" fontWeight="600">
                                  {formatPrice(layaway.paid_amount || 0)} de {formatPrice(layaway.total_amount || 0)} pagado
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="body2" color="textSecondary">Después del Abono:</Typography>
                                <Typography variant="body1" fontWeight="600" color="success.main">
                                  {formatPrice((layaway.paid_amount || 0) + paymentData.amount)} de {formatPrice(layaway.total_amount || 0)} pagado
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="body2" color="textSecondary">Pendiente Restante:</Typography>
                                <Typography variant="h6" fontWeight="700" color={isFullPayment ? 'success.main' : 'warning.main'}>
                                  {isFullPayment ? 'COMPLETADO' : formatPrice(pendingAmount - paymentData.amount)}
                                </Typography>
                              </Box>

                              {isFullPayment && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                  <Typography variant="body2">
                                    🎉 Este abono <strong>completará</strong> el apartado y se convertirá en venta final.
                                  </Typography>
                                </Alert>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Botones de navegación */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                  >
                    Anterior
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={!validateStep(0)}
                      sx={{
                        background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                        fontWeight: 'bold'
                      }}
                    >
                      Procesar Abono
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(prev => prev + 1)}
                      disabled={!validateStep(activeStep)}
                      sx={{
                        background: 'linear-gradient(135deg, #4caf50, #388e3c)'
                      }}
                    >
                      Continuar
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancelar
        </Button>
      </DialogActions>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => !processing && setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ color: '#4caf50', fontWeight: 'bold' }}>
          💰 Confirmar Abono - luishdz04
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro de procesar este abono?
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            background: 'rgba(76, 175, 80, 0.1)', 
            borderRadius: 2,
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Monto: {formatPrice(paymentData.amount)}
              {paymentData.commission_amount > 0 && 
                ` + ${formatPrice(paymentData.commission_amount)} comisión`
              }
            </Typography>
            <Typography variant="body2">
              Método: {paymentMethods.find(m => m.value === paymentData.method)?.label}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Procesado: 2025-06-11 06:55:34 UTC por luishdz04
            </Typography>
            {isFullPayment && (
              <Typography variant="body2" color="success.main" fontWeight="600">
                ⚠️ Este abono completará el apartado
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button
            onClick={processPayment}
            disabled={processing}
            variant="contained"
            startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4caf50, #388e3c)',
              fontWeight: 'bold'
            }}
          >
            {processing ? 'Procesando...' : 'Confirmar Abono'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
