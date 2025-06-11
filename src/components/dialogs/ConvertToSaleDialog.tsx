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
  Stack
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

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
    allowsCommission: false
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 0,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: false
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsChange: false,
    allowsCommission: true
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
      console.log('🔍 Cargando comisiones para conversión... - 2025-06-11 08:39:27 UTC - luishdz04');
      
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
        console.log('✅ Comisiones cargadas para conversión:', updatedMethods);
      } else {
        setPaymentMethods(defaultPaymentMethods);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando comisiones:', error);
      setPaymentMethods(defaultPaymentMethods);
    }
  }, [open, supabase]); // ✅ DEPENDENCIAS ESPECÍFICAS

  // ✅ FUNCIÓN HÍBRIDA PARA GENERAR NÚMERO DE VENTA
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `VT${year}${month}${day}${timestamp}`;
  }, []);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    console.log('🔄 Inicializando dialog de conversión... - 2025-06-11 08:39:27 UTC - luishdz04');
    
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

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR CONVERSIÓN
  const processConversion = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      console.log('🚀 Convirtiendo apartado a venta:', safeLayaway.sale_number, '- 2025-06-11 08:39:27 UTC - luishdz04');

      // ✅ GENERAR NUEVO NÚMERO SI ES NECESARIO
      let finalSaleNumber = safeLayaway.sale_number;
      if (generateNewNumber) {
        finalSaleNumber = newSaleNumber || await generateSaleNumber();
      }

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
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
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
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
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
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      // ✅ RESTAURAR STOCK SI ES NECESARIO (los productos ya fueron descontados en el apartado)
      // No necesitamos modificar stock aquí ya que se descontó al crear el apartado

      setCompleted(true);
      showNotification(
        `¡Apartado convertido exitosamente a ${convertToRegularSale ? 'venta regular' : 'venta completada'}!`, 
        'success'
      );

      console.log('✅ Conversión procesada exitosamente');

    } catch (error: any) {
      console.error('💥 Error convirtiendo apartado:', error);
      showNotification('Error al convertir apartado: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, generateNewNumber, newSaleNumber, generateSaleNumber, convertToRegularSale, paymentMethod, paymentReference, applyCommission, paymentMethods, notes]);

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
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.98), rgba(76, 175, 80, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ConvertIcon />
          <Typography variant="h5" fontWeight="bold">
            🛒 Convertir a Venta - Apartado #{safeLayaway.sale_number}
          </Typography>
          <Chip 
            label="HÍBRIDO v1.1" 
            color="success" 
            size="small" 
            sx={{ bgcolor: 'rgba(33,150,243,0.8)', color: '#FFFFFF', fontWeight: 'bold' }}
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
              ✅ <strong>SOLUCIÓN HÍBRIDA:</strong> useCallback controlado + Grid correcto - 2025-06-11 08:39:27 UTC por luishdz04
            </Alert>

            {/* ✅ ADVERTENCIA SI HAY SALDO PENDIENTE */}
            {safeLayaway.pending_amount > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ <strong>Saldo Pendiente:</strong> Se debe cobrar {formatPrice(safeLayaway.pending_amount)} para completar la conversión
              </Alert>
            )}

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

                          {/* PASO 1: CONFIGURACIÓN */}
                          {index === 0 && (
                            <Box>
                              <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                  <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                      ⚙️ Opciones de Conversión
                                    </Typography>
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={convertToRegularSale}
                                          onChange={(e) => setConvertToRegularSale(e.target.checked)}
                                          sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                              color: '#4caf50',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                              backgroundColor: '#4caf50',
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography sx={{ color: 'white' }}>
                                          🛒 Convertir a venta regular (recomendado)
                                        </Typography>
                                      }
                                    />
                                    
                                    <Typography variant="body2" sx={{ color: '#CCCCCC', mt: 1, mb: 3 }}>
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
                                        sx={{
                                          mt: 2,
                                          '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(33, 150, 243, 0.5)' },
                                            '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                                          },
                                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                      />
                                    )}
                                  </Card>
                                </Grid>
                              </Grid>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  sx={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
                                >
                                  Continuar
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 2: PAGO FINAL */}
                          {index === 1 && (
                            <Box>
                              {safeLayaway.pending_amount > 0 ? (
                                <Box>
                                  <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                                    💰 Pago del Saldo Pendiente: {formatPrice(safeLayaway.pending_amount)}
                                  </Typography>
                                  
                                  {/* Métodos de pago */}
                                  <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {paymentMethods.map(method => (
                                      <Grid size={{ xs: 6 }} key={method.value}>
                                        <Card 
                                          sx={{
                                            p: 2,
                                            background: paymentMethod === method.value 
                                              ? 'rgba(76, 175, 80, 0.2)' 
                                              : 'rgba(255,255,255,0.05)',
                                            border: paymentMethod === method.value 
                                              ? '2px solid #4caf50' 
                                              : '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                              background: 'rgba(76, 175, 80, 0.1)',
                                              border: '1px solid rgba(76, 175, 80, 0.5)'
                                            }
                                          }}
                                          onClick={() => setPaymentMethod(method.value)}
                                        >
                                          <Typography variant="body1" sx={{ color: '#FFFFFF', mb: 1 }}>
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
                                        </Card>
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
                                          sx={{
                                            '& .MuiOutlinedInput-root': {
                                              color: 'white',
                                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                              '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                                              '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
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
                                          sx={{
                                            '& .MuiOutlinedInput-root': {
                                              color: 'white',
                                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                              '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                                              '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
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
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                                            '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                                          },
                                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              ) : (
                                <Alert severity="success">
                                  ✅ <strong>No hay saldo pendiente.</strong> El apartado ya está completamente pagado y listo para convertir.
                                </Alert>
                              )}

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button onClick={() => setActiveStep(0)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(2)}
                                  disabled={!canProceed()}
                                  sx={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
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
                                  📋 Resumen de la Conversión
                                </Typography>
                                
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography><strong>Tipo de conversión:</strong> {convertToRegularSale ? 'Venta Regular' : 'Apartado Completado'}</Typography>
                                    <Typography><strong>Número final:</strong> {generateNewNumber ? (newSaleNumber || 'Se generará automáticamente') : safeLayaway.sale_number}</Typography>
                                    <Typography><strong>Método de pago:</strong> {paymentMethods.find(m => m.value === paymentMethod)?.label}</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    {calculations.pendingAmount > 0 ? (
                                      <>
                                        <Typography><strong>Monto pendiente:</strong> {formatPrice(calculations.pendingAmount)}</Typography>
                                        <Typography><strong>Comisión:</strong> {formatPrice(calculations.commission)}</Typography>
                                        <Typography><strong>Total a cobrar:</strong> {formatPrice(calculations.totalToCollect)}</Typography>
                                        {calculations.change > 0 && (
                                          <Typography><strong>Cambio:</strong> {formatPrice(calculations.change)}</Typography>
                                        )}
                                      </>
                                    ) : (
                                      <Typography><strong>Estado:</strong> ✅ Completamente pagado</Typography>
                                    )}
                                  </Grid>
                                </Grid>
                              </Alert>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button onClick={() => setActiveStep(1)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={processConversion}
                                  disabled={processing}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <CheckIcon />}
                                  sx={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}
                                >
                                  {processing ? 'Procesando...' : 'Confirmar Conversión'}
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
                <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, fontWeight: 700 }}>
                    🛒 Resumen del Apartado
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
                          backgroundColor: '#4caf50'
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

                    {calculations && calculations.pendingAmount > 0 && (
                      <>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Pago final:</Typography>
                          <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            {formatPrice(calculations.pendingAmount)}
                          </Typography>
                        </Box>
                        
                        {calculations.commission > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Comisión:</Typography>
                            <Typography variant="body1" sx={{ color: '#ff9800', fontWeight: 600 }}>
                              {formatPrice(calculations.commission)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Total a cobrar:</Typography>
                          <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                            {formatPrice(calculations.totalToCollect)}
                          </Typography>
                        </Box>

                        {calculations.change > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Cambio:</Typography>
                            <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 600 }}>
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700, mb: 2 }}>
              ¡Conversión Exitosa!
            </Typography>
            <Typography variant="body1" sx={{ color: '#CCCCCC', mb: 3 }}>
              El apartado #{safeLayaway.sale_number} ha sido convertido exitosamente a {convertToRegularSale ? 'venta regular' : 'venta completada'}
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