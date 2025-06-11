'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import { 
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  customer?: any;
  coupon?: any;
  totals: any;
  onSuccess: () => void;
}

// ✅ MÉTODOS DE PAGO CON COMISIONES
const paymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    commission: 0,
    requiresReference: false,
    allowsChange: true
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsChange: false
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsChange: false
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 1.0,
    requiresReference: true,
    allowsChange: false
  }
];

// ✅ OPCIONES DE DURACIÓN
const durationOptions = [
  { label: '15 días', days: 15 },
  { label: '30 días', days: 30 },
  { label: '45 días', days: 45 },
  { label: '60 días', days: 60 },
  { label: '90 días', days: 90 },
  { label: 'Personalizado', days: 0 }
];

export default function LayawayDialog({ 
  open, 
  onClose, 
  cart, 
  customer, 
  coupon, 
  totals, 
  onSuccess 
}: LayawayDialogProps) {

  // ✅ ESTADOS BÁSICOS
  const [activeStep, setActiveStep] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [layawayNumber, setLayawayNumber] = useState<string | null>(null);

  // ✅ ESTADOS FASE 2 - NUEVAS FUNCIONALIDADES
  const [durationDays, setDurationDays] = useState(30);
  const [customDays, setCustomDays] = useState(30);
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [customerNotes, setCustomerNotes] = useState('');
  const [applyCommission, setApplyCommission] = useState(true);

  const supabase = createBrowserSupabaseClient();

  // ✅ CÁLCULOS AVANZADOS CON COMISIONES
  const calculations = useMemo(() => {
    const total = totals?.total || 0;
    const baseDeposit = total * (depositPercentage / 100);
    
    // 🔍 CALCULAR COMISIÓN SI APLICA
    let commission = 0;
    let finalDepositAmount = baseDeposit;
    
    if (applyCommission && paymentMethod) {
      const method = paymentMethods.find(m => m.value === paymentMethod);
      if (method) {
        commission = baseDeposit * (method.commission / 100);
        finalDepositAmount = baseDeposit + commission;
      }
    }

    // 🔍 CALCULAR CAMBIO (SOLO EFECTIVO)
    let changeAmount = 0;
    const selectedMethod = paymentMethods.find(m => m.value === paymentMethod);
    if (selectedMethod?.allowsChange && cashReceived > finalDepositAmount) {
      changeAmount = cashReceived - finalDepositAmount;
    }

    const finalDuration = useCustomDuration ? customDays : durationDays;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + finalDuration);

    return {
      total,
      baseDeposit,
      commission,
      finalDepositAmount,
      changeAmount,
      remainingAmount: total - baseDeposit, // El pendiente siempre es sobre el total original
      expirationDate,
      durationDays: finalDuration,
      needsCashInput: selectedMethod?.allowsChange && paymentMethod === 'efectivo',
      hasCommission: commission > 0
    };
  }, [
    totals?.total, 
    depositPercentage, 
    paymentMethod, 
    applyCommission, 
    cashReceived, 
    durationDays, 
    customDays, 
    useCustomDuration
  ]);

  // ✅ ACTUALIZAR PAGO CUANDO CAMBIA EL MÉTODO
  const handlePaymentMethodChange = useCallback((method: string) => {
    setPaymentMethod(method);
    setPaymentReference('');
    
    // Si es efectivo, inicializar con el monto exacto
    const selectedMethod = paymentMethods.find(m => m.value === method);
    if (selectedMethod?.allowsChange) {
      setCashReceived(calculations.finalDepositAmount);
    }
  }, [calculations.finalDepositAmount]);

  // ✅ GENERAR NÚMERO DE APARTADO
  const generateLayawayNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `AP${year}${month}${day}${timestamp}`;
  }, []);

  // ✅ PROCESAMIENTO CON FUNCIONALIDADES FASE 2
  const handleCreateLayaway = useCallback(async () => {
    if (!customer) {
      showNotification('Se requiere un cliente para apartados', 'error');
      return;
    }

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;
      const layawayNumber = await generateLayawayNumber();

      // ✅ DATOS AVANZADOS CON FASE 2
      const layawayData = {
        sale_number: layawayNumber,
        customer_id: customer.id,
        cashier_id: userId,
        sale_type: 'layaway',
        subtotal: totals.subtotal || 0,
        tax_amount: totals.taxAmount || 0,
        discount_amount: totals.discountAmount || 0,
        coupon_discount: totals.couponDiscount || 0,
        coupon_code: coupon?.code || null,
        total_amount: calculations.total,
        required_deposit: calculations.baseDeposit,
        paid_amount: calculations.baseDeposit, // Lo que se aplicó al apartado (sin comisión)
        pending_amount: calculations.remainingAmount,
        deposit_percentage: depositPercentage,
        layaway_expires_at: calculations.expirationDate.toISOString(),
        status: 'pending',
        payment_status: 'partial',
        is_mixed_payment: false,
        payment_received: calculations.finalDepositAmount, // Lo que se cobró realmente (con comisión)
        change_amount: calculations.changeAmount,
        commission_rate: applyCommission ? (paymentMethods.find(m => m.value === paymentMethod)?.commission || 0) : 0,
        commission_amount: calculations.commission,
        custom_commission_rate: null,
        skip_inscription: false,
        notes: customerNotes || `Apartado por ${calculations.durationDays} días - Vence: ${formatDate(calculations.expirationDate.toISOString())}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Creando apartado FASE 2:', layawayData);

      // ✅ INSERTAR VENTA
      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) {
        console.error('❌ Error creando apartado:', layawayError);
        throw layawayError;
      }

      console.log('✅ Apartado creado:', layaway);

      // ✅ CREAR ITEMS
      const layawayItems = cart.map(item => ({
        sale_id: layaway.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: item.tax_amount || 0,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(layawayItems);

      if (itemsError) {
        console.error('❌ Error creando items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items creados');

      // ✅ CREAR DETALLE DE PAGO CON COMISIÓN
      const paymentData = {
        sale_id: layaway.id,
        payment_method: paymentMethod,
        amount: calculations.finalDepositAmount, // Monto total cobrado
        payment_reference: paymentReference || null,
        commission_rate: applyCommission ? (paymentMethods.find(m => m.value === paymentMethod)?.commission || 0) : 0,
        commission_amount: calculations.commission,
        sequence_order: 1,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: userId,
        is_partial_payment: true,
        payment_sequence: 1,
        notes: calculations.changeAmount > 0 ? `Efectivo recibido: ${formatPrice(cashReceived)}, Cambio: ${formatPrice(calculations.changeAmount)}` : null
      };

      const { error: paymentError } = await supabase
        .from('sale_payment_details')
        .insert([paymentData]);

      if (paymentError) {
        console.error('❌ Error creando pago:', paymentError);
        throw paymentError;
      }

      console.log('✅ Pago creado con comisión');

      // ✅ ACTUALIZAR STOCK
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: item.product.current_stock - item.quantity,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', item.product.id);

        if (stockError) {
          console.error('❌ Error actualizando stock:', stockError);
          throw stockError;
        }

        // ✅ MOVIMIENTO DE INVENTARIO
        await supabase
          .from('inventory_movements')
          .insert([{
            product_id: item.product.id,
            movement_type: 'salida',
            quantity: -item.quantity,
            previous_stock: item.product.current_stock,
            new_stock: item.product.current_stock - item.quantity,
            unit_cost: item.product.cost_price || 0,
            total_cost: item.quantity * (item.product.cost_price || 0),
            reason: 'Apartado',
            reference_id: layaway.id,
            notes: `Apartado #${layaway.sale_number} - ${calculations.durationDays} días - Vence ${formatDate(calculations.expirationDate.toISOString())}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      console.log('✅ Stock actualizado');

      // ✅ ACTUALIZAR CUPÓN
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', coupon.id);

        console.log('✅ Cupón actualizado');
      }

      setLayawayNumber(layaway.sale_number);
      setCompleted(true);
      showNotification('¡Apartado creado exitosamente!', 'success');

      console.log('🎉 APARTADO FASE 2 COMPLETADO:', layaway.sale_number);

    } catch (error) {
      console.error('❌ Error procesando apartado:', error);
      showNotification('Error al procesar apartado: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [
    customer, 
    supabase, 
    generateLayawayNumber, 
    calculations, 
    depositPercentage, 
    totals, 
    coupon, 
    paymentMethod, 
    paymentReference, 
    cart,
    customerNotes,
    applyCommission,
    cashReceived
  ]);

  // ✅ RESET AL CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    setCompleted(false);
    setProcessing(false);
    setActiveStep(0);
    setPaymentMethod('');
    setPaymentReference('');
    setLayawayNumber(null);
    setCashReceived(0);
    setCustomerNotes('');
    setUseCustomDuration(false);
    setCustomDays(30);
    setDurationDays(30);
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN AVANZADA
  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: 
        return calculations.baseDeposit > 0;
      case 1: 
        return paymentMethod !== '' && 
               (!paymentMethods.find(m => m.value === paymentMethod)?.requiresReference || paymentReference !== '') &&
               (!calculations.needsCashInput || cashReceived >= calculations.finalDepositAmount);
      case 2: 
        return true;
      default: 
        return false;
    }
  }, [
    activeStep, 
    calculations.baseDeposit, 
    calculations.needsCashInput, 
    calculations.finalDepositAmount,
    paymentMethod, 
    paymentReference, 
    cashReceived
  ]);

  const steps = [
    { label: 'Configuración', description: 'Anticipo y duración del apartado' },
    { label: 'Método de Pago', description: 'Forma de pago y comisiones' },
    { label: 'Confirmación', description: 'Revisar y procesar' }
  ];

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
          color: '#FFFFFF',
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.98), rgba(156, 39, 176, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BookmarkIcon />
          <Typography variant="h5" fontWeight="bold">
            📦 Apartado FASE 2 - Avanzado
          </Typography>
          <Chip 
            label="v2.0" 
            color="secondary" 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}
          />
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* Cliente */}
            {customer ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  👤 Cliente: {customer.name}
                </Typography>
                <Typography variant="body2">
                  {customer.email || customer.whatsapp}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 3 }}>
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

            <Grid container spacing={4}>
              {/* Stepper Principal */}
              <Grid size={{ xs: 12, md: 8 }}>
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

                          {/* ✅ PASO 1: CONFIGURACIÓN AVANZADA */}
                          {index === 0 && (
                            <Box>
                              <Grid container spacing={3}>
                                {/* Porcentaje de Anticipo */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 2, background: 'rgba(156, 39, 176, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2 }}>
                                      💰 Anticipo del Apartado
                                    </Typography>
                                    
                                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                                      Porcentaje: {depositPercentage}%
                                    </Typography>
                                    
                                    <Slider
                                      value={depositPercentage}
                                      onChange={(_, value) => setDepositPercentage(value as number)}
                                      min={10}
                                      max={100}
                                      step={5}
                                      marks={[
                                        { value: 10, label: '10%' },
                                        { value: 25, label: '25%' },
                                        { value: 50, label: '50%' },
                                        { value: 75, label: '75%' },
                                        { value: 100, label: '100%' }
                                      ]}
                                      sx={{
                                        color: '#9c27b0',
                                        '& .MuiSlider-markLabel': {
                                          color: '#CCCCCC',
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                    />
                                    
                                    <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600, mt: 2 }}>
                                      Anticipo: {formatPrice(calculations.baseDeposit)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                      Pendiente: {formatPrice(calculations.remainingAmount)}
                                    </Typography>
                                  </Card>
                                </Grid>

                                {/* Duración del Apartado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                      📅 Duración del Apartado
                                    </Typography>
                                    
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                      <InputLabel sx={{ color: '#CCCCCC' }}>Duración</InputLabel>
                                      <Select
                                        value={useCustomDuration ? 0 : durationDays}
                                        onChange={(e) => {
                                          const value = e.target.value as number;
                                          if (value === 0) {
                                            setUseCustomDuration(true);
                                          } else {
                                            setUseCustomDuration(false);
                                            setDurationDays(value);
                                          }
                                        }}
                                        sx={{ color: '#FFFFFF' }}
                                      >
                                        {durationOptions.map((option) => (
                                          <MenuItem key={option.days} value={option.days}>
                                            <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                                            {option.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>

                                    {useCustomDuration && (
                                      <TextField
                                        fullWidth
                                        label="Días personalizados"
                                        type="number"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(Number(e.target.value) || 30)}
                                        inputProps={{ min: 1, max: 365 }}
                                        sx={{ mb: 2 }}
                                      />
                                    )}

                                    <Box sx={{ 
                                      p: 2, 
                                      background: 'rgba(76, 175, 80, 0.2)', 
                                      borderRadius: 1,
                                      textAlign: 'center'
                                    }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Vence el:
                                      </Typography>
                                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700 }}>
                                        {formatDate(calculations.expirationDate.toISOString())}
                                      </Typography>
                                    </Box>
                                  </Card>
                                </Grid>
                              </Grid>

                              {/* Notas del Cliente */}
                              <Card sx={{ mt: 3, p: 2, background: 'rgba(255, 193, 7, 0.1)' }}>
                                <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                                  📝 Notas del Apartado (Opcional)
                                </Typography>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={2}
                                  placeholder="Ej: Cliente prefiere recoger en la tarde, producto para regalo, etc."
                                  value={customerNotes}
                                  onChange={(e) => setCustomerNotes(e.target.value)}
                                  sx={{ 
                                    '& .MuiInputBase-input': { color: '#FFFFFF' },
                                    '& .MuiInputBase-input::placeholder': { color: '#CCCCCC' }
                                  }}
                                />
                              </Card>
                            </Box>
                          )}

                          {/* ✅ PASO 2: MÉTODO DE PAGO AVANZADO */}
                          {index === 1 && (
                            <Box>
                              <Grid container spacing={3}>
                                {/* Selección de Método */}
                                <Grid size={{ xs: 12 }}>
                                  <Card sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                      💳 Método de Pago
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                      {paymentMethods.map((method) => (
                                        <Grid size={{ xs: 6, sm: 3 }} key={method.value}>
                                          <Card
                                            sx={{
                                              p: 2,
                                              cursor: 'pointer',
                                              border: paymentMethod === method.value ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.2)',
                                              background: paymentMethod === method.value ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255,255,255,0.05)',
                                              transition: 'all 0.2s',
                                              '&:hover': {
                                                background: 'rgba(33, 150, 243, 0.1)',
                                                border: '1px solid rgba(33, 150, 243, 0.5)'
                                              }
                                            }}
                                            onClick={() => handlePaymentMethodChange(method.value)}
                                          >
                                            <Box textAlign="center">
                                              <Typography variant="h4">{method.icon}</Typography>
                                              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                                {method.label}
                                              </Typography>
                                              {method.commission > 0 && (
                                                <Chip 
                                                  label={`+${method.commission}%`} 
                                                  size="small" 
                                                  color="warning"
                                                  sx={{ mt: 1, fontSize: '0.7rem' }}
                                                />
                                              )}
                                            </Box>
                                          </Card>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Card>
                                </Grid>

                                {/* Configuración del Método Seleccionado */}
                                {paymentMethod && (
                                  <Grid size={{ xs: 12 }}>
                                    <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
                                      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                        ⚙️ Configuración de {paymentMethods.find(m => m.value === paymentMethod)?.label}
                                      </Typography>

                                      <Grid container spacing={2}>
                                        {/* Referencia/Autorización */}
                                        {paymentMethods.find(m => m.value === paymentMethod)?.requiresReference && (
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                              fullWidth
                                              label="Referencia / Autorización"
                                              value={paymentReference}
                                              onChange={(e) => setPaymentReference(e.target.value)}
                                              placeholder="Número de autorización, SPEI, etc."
                                              required
                                              sx={{ mb: 2 }}
                                            />
                                          </Grid>
                                        )}

                                        {/* Efectivo Recibido */}
                                        {calculations.needsCashInput && (
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                              fullWidth
                                              label="Efectivo Recibido"
                                              type="number"
                                              value={cashReceived}
                                              onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                                              inputProps={{ 
                                                min: calculations.finalDepositAmount,
                                                step: 0.01 
                                              }}
                                              sx={{ mb: 2 }}
                                            />
                                            {calculations.changeAmount > 0 && (
                                              <Alert severity="info" sx={{ mt: 1 }}>
                                                💰 Cambio a entregar: <strong>{formatPrice(calculations.changeAmount)}</strong>
                                              </Alert>
                                            )}
                                          </Grid>
                                        )}

                                        {/* Toggle Comisión */}
                                        <Grid size={{ xs: 12 }}>
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={applyCommission}
                                                onChange={(e) => setApplyCommission(e.target.checked)}
                                                color="primary"
                                              />
                                            }
                                            label="Aplicar comisión al método de pago"
                                            sx={{ color: '#CCCCCC' }}
                                          />
                                        </Grid>
                                      </Grid>

                                      {/* Resumen de Cobro */}
                                      <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                      
                                      <Box sx={{ 
                                        p: 2, 
                                        background: 'rgba(156, 39, 176, 0.2)', 
                                        borderRadius: 1 
                                      }}>
                                        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1 }}>
                                          💰 Resumen de Cobro
                                        </Typography>
                                        
                                        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            Anticipo base:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                            {formatPrice(calculations.baseDeposit)}
                                          </Typography>
                                        </Box>

                                        {calculations.hasCommission && (
                                          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Comisión ({paymentMethods.find(m => m.value === paymentMethod)?.commission}%):
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                              +{formatPrice(calculations.commission)}
                                            </Typography>
                                          </Box>
                                        )}

                                        <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                                        
                                        <Box display="flex" justifyContent="space-between">
                                          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                            TOTAL A COBRAR:
                                          </Typography>
                                          <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 900 }}>
                                            {formatPrice(calculations.finalDepositAmount)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Card>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}

                          {/* ✅ PASO 3: CONFIRMACIÓN DETALLADA */}
                          {index === 2 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: '#FFCC00', mb: 3 }}>
                                ✅ Confirmación Final del Apartado
                              </Typography>
                              
                              <Grid container spacing={3}>
                                {/* Resumen del Apartado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                      📋 Resumen del Apartado
                                    </Typography>
                                    
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Total del apartado: <strong>{formatPrice(calculations.total)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Anticipo ({depositPercentage}%): <strong>{formatPrice(calculations.baseDeposit)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Pendiente por pagar: <strong>{formatPrice(calculations.remainingAmount)}</strong>
                                      </Typography>
                                    </Box>

                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Duración: <strong>{calculations.durationDays} días</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Vence: <strong>{formatDate(calculations.expirationDate.toISOString())}</strong>
                                      </Typography>
                                    </Box>

                                    {customerNotes && (
                                      <>
                                        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#ffc107', fontWeight: 600 }}>
                                            📝 Notas:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            {customerNotes}
                                          </Typography>
                                        </Box>
                                      </>
                                    )}
                                  </Card>
                                </Grid>

                                {/* Resumen del Pago */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                      💳 Resumen del Pago
                                    </Typography>
                                    
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Método: <strong>{paymentMethods.find(m => m.value === paymentMethod)?.label}</strong>
                                      </Typography>
                                      
                                      {paymentReference && (
                                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                          Referencia: <strong>{paymentReference}</strong>
                                        </Typography>
                                      )}
                                      
                                      {calculations.changeAmount > 0 && (
                                        <>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            Efectivo recibido: <strong>{formatPrice(cashReceived)}</strong>
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                            Cambio a entregar: <strong>{formatPrice(calculations.changeAmount)}</strong>
                                          </Typography>
                                        </>
                                      )}
                                    </Box>

                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

                                    <Box>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Anticipo: {formatPrice(calculations.baseDeposit)}
                                      </Typography>
                                      {calculations.hasCommission && (
                                        <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                          Comisión: +{formatPrice(calculations.commission)}
                                        </Typography>
                                      )}
                                      <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 700, mt: 1 }}>
                                        Total a cobrar: {formatPrice(calculations.finalDepositAmount)}
                                      </Typography>
                                    </Box>
                                  </Card>
                                </Grid>
                              </Grid>

                              {/* Botón de Confirmación Final */}
                              <Box sx={{ 
                                mt: 4, 
                                p: 3, 
                                background: 'rgba(156, 39, 176, 0.2)', 
                                borderRadius: 2, 
                                textAlign: 'center' 
                              }}>
                                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                                  ¿Confirmar creación del apartado?
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 3 }}>
                                  Se reservarán los productos, se aplicará el pago y se guardará en la base de datos
                                </Typography>
                                <Button
                                  variant="contained"
                                  onClick={handleCreateLayaway}
                                  disabled={processing || !customer}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <BookmarkIcon />}
                                  sx={{
                                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.2rem'
                                  }}
                                >
                                  {processing ? 'Guardando en Supabase...' : '💾 CREAR APARTADO AVANZADO'}
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* Navegación */}
                          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={() => setActiveStep(prev => prev - 1)}
                              variant="outlined"
                              sx={{ color: '#CCCCCC' }}
                            >
                              ← Anterior
                            </Button>
                            
                            {activeStep < steps.length - 1 && (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                sx={{ background: '#9c27b0' }}
                              >
                                Continuar →
                              </Button>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>

              {/* Panel de Resumen Lateral */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ position: 'sticky', top: 20 }}>
                  {/* Resumen Principal */}
                  <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                        📋 Resumen del Apartado
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                        Productos: {cart?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                        Total: {formatPrice(calculations.total)}
                      </Typography>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(156, 39, 176, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                          ANTICIPO BASE
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 900 }}>
                          {formatPrice(calculations.baseDeposit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          {depositPercentage}% del total
                        </Typography>
                      </Box>

                      {calculations.hasCommission && (
                        <Box sx={{ 
                          p: 2, 
                          background: 'rgba(255, 152, 0, 0.2)', 
                          borderRadius: 2, 
                          textAlign: 'center',
                          mb: 2
                        }}>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                            COMISIÓN
                          </Typography>
                          <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                            +{formatPrice(calculations.commission)}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(33, 150, 243, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                          TOTAL A COBRAR
                        </Typography>
                        <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 900 }}>
                          {formatPrice(calculations.finalDepositAmount)}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(76, 175, 80, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center' 
                      }}>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          PENDIENTE
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                          {formatPrice(calculations.remainingAmount)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Info de Duración */}
                  <Card sx={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                        ⏰ Información de Tiempo
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Duración: <strong>{calculations.durationDays} días</strong>
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(255, 193, 7, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center' 
                      }}>
                        <CalendarIcon sx={{ color: '#ffc107', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Vence el:
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ffc107', fontWeight: 700 }}>
                          {formatDate(calculations.expirationDate.toISOString())}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // ✅ CONFIRMACIÓN DE ÉXITO MEJORADA
          <Box textAlign="center" sx={{ py: 4 }}>
            <CheckIcon sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
            <Typography variant="h3" color="#4caf50" fontWeight="bold" gutterBottom>
              ¡Apartado Creado Exitosamente!
            </Typography>
            <Typography variant="h4" gutterBottom sx={{ color: '#9c27b0', fontWeight: 700 }}>
              #{layawayNumber}
            </Typography>
            <Typography variant="h6" color="#CCCCCC" sx={{ mb: 3 }}>
              Guardado en Supabase el {formatDate(new Date().toISOString())}
            </Typography>
            
            <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Cliente</Typography>
                  <Typography variant="h6" sx={{ color: '#4caf50' }}>{customer?.name}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Cobrado</Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3' }}>{formatPrice(calculations.finalDepositAmount)}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ p: 2, background: 'rgba(156, 39, 176, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Pendiente</Typography>
                  <Typography variant="h6" sx={{ color: '#9c27b0' }}>{formatPrice(calculations.remainingAmount)}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ p: 2, background: 'rgba(255, 193, 7, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Vence</Typography>
                  <Typography variant="body1" sx={{ color: '#ffc107' }}>{formatDate(calculations.expirationDate.toISOString())}</Typography>
                </Card>
              </Grid>
            </Grid>

            {calculations.changeAmount > 0 && (
              <Alert severity="info" sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                <Typography variant="h6">
                  💰 Entregar cambio: <strong>{formatPrice(calculations.changeAmount)}</strong>
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={processing} size="large">
          {completed ? 'Finalizar' : 'Cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
