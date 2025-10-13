// components/dialogs/PaymentToLayawayDialog.tsx - v8.1 COMISIONES CORREGIDAS

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Card, CardContent, TextField,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Stepper, Step, StepLabel, StepContent, CircularProgress,
  Divider, FormControlLabel, Switch, Paper, IconButton,
  LinearProgress, Avatar, Stack, InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon, Payment as PaymentIcon, Check as CheckIcon,
  AttachMoney as MoneyIcon, Add as AddIcon, Delete as DeleteIcon,
  CreditCard as CreditCardIcon, AccountBalance as BankIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { PaymentCommission } from '@/types/pos';

interface PaymentToLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
  warehouseId: string;
  onSuccess: () => void;
}

interface PaymentMethodForm {
  method: string;
  netAmount: number; // 🎯 CAMBIO: ahora guardamos el monto NETO (lo que abona a la deuda)
  reference?: string;
}

const PAYMENT_METHODS_FALLBACK = [
  { value: 'efectivo', label: 'Efectivo', icon: MoneyIcon },
  { value: 'transferencia', label: 'Transferencia', icon: BankIcon },
  { value: 'debito', label: 'Tarjeta Débito', icon: CreditCardIcon },
  { value: 'credito', label: 'Tarjeta Crédito', icon: CreditCardIcon }
] as const;

const EPSILON = 0.001;

export default function PaymentToLayawayDialog({ open, onClose, layaway, warehouseId, onSuccess }: PaymentToLayawayDialogProps) {
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  const { data: paymentCommissions, loading: commissionsLoading, error: commissionsError } = useEntityCRUD<PaymentCommission>({
    tableName: 'payment_commissions',
    selectQuery: '*'
  });

  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([{ method: 'efectivo', netAmount: 0 }]);
  const [mixedPayment, setMixedPayment] = useState(false);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0);
  }, []);

  const safeLayaway = useMemo(() => {
    if (!layaway) return null;
    return {
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      payment_received: layaway.payment_received || 0, // ✅ NUEVO: Total cobrado con comisiones
      customer_name: layaway.customer_name || 'Cliente General',
      customer_email: layaway.customer_email || '',
      status: layaway.status || 'pending',
      sale_items: layaway.sale_items || []
    };
  }, [layaway]);

  const availablePaymentMethods = useMemo(() => {
    if (!paymentCommissions || commissionsError) return PAYMENT_METHODS_FALLBACK;
    return paymentCommissions
      .filter((c: PaymentCommission) => c.is_active === true)
      .map((c: PaymentCommission) => {
        const fallbackMethod = PAYMENT_METHODS_FALLBACK.find(pm => pm.value === c.payment_method);
        return {
          value: c.payment_method,
          label: c.payment_method.charAt(0).toUpperCase() + c.payment_method.slice(1),
          icon: fallbackMethod?.icon || MoneyIcon,
          commission: c.commission_value || 0
        };
      });
  }, [paymentCommissions, commissionsError]);

  const getCommissionRate = useCallback((paymentMethodValue: string): number => {
    if (commissionsLoading || !paymentCommissions || commissionsError) return 0;
    const commission = paymentCommissions.find((c: PaymentCommission) => c.payment_method === paymentMethodValue && c.is_active === true);
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissions, commissionsLoading, commissionsError]);

  // 🎯 FUNCIÓN PARA CALCULAR MONTO BRUTO (incluye comisión)
  const calculateGrossAmount = useCallback((netAmount: number, method: string): number => {
    const rate = getCommissionRate(method);
    if (rate === 0) return netAmount;
    // Si el neto es $500 y la comisión es 3%, el bruto es $500 / (1 - 0.03) = $515.46
    const grossAmount = netAmount / (1 - rate / 100);
    return Math.round(grossAmount * 100) / 100;
  }, [getCommissionRate]);

  // ✅ CÁLCULOS CORREGIDOS: netAmount es lo que abona, grossAmount es lo que cobra
  const actualPayment = useMemo(() => {
    // Suma de montos NETOS (lo que realmente abona a la deuda)
    return Math.round(paymentMethods.reduce((sum, pm) => sum + (pm.netAmount || 0), 0) * 100) / 100;
  }, [paymentMethods]);

  const totalCommissions = useMemo(() => {
    // Suma de todas las comisiones
    return Math.round(paymentMethods.reduce((sum, pm) => {
      const rate = getCommissionRate(pm.method);
      const grossAmount = calculateGrossAmount(pm.netAmount, pm.method);
      const commission = grossAmount - pm.netAmount;
      return sum + commission;
    }, 0) * 100) / 100;
  }, [paymentMethods, getCommissionRate, calculateGrossAmount]);

  const totalPayments = useMemo(() => {
    // Total a cobrar = abono neto + comisiones
    return Math.round((actualPayment + totalCommissions) * 100) / 100;
  }, [actualPayment, totalCommissions]);

  const changeAmount = useMemo(() => {
    if (!safeLayaway) return 0;
    const excess = actualPayment - safeLayaway.pending_amount;
    return Math.max(0, Math.round(excess * 100) / 100);
  }, [actualPayment, safeLayaway]);

  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    const newPaidAmount = safeLayaway.paid_amount + actualPayment;
    const newPendingAmount = Math.max(0, safeLayaway.total_amount - newPaidAmount);
    const willComplete = newPendingAmount <= EPSILON;
    return {
      totalPaymentAmount: totalPayments,
      actualPayment,
      totalToCollect: totalPayments,
      totalCommission: totalCommissions,
      newPaidAmount,
      newPendingAmount,
      willComplete
    };
  }, [safeLayaway, totalPayments, actualPayment, totalCommissions]);

  const canProcessPayment = useMemo(() => {
    return (
      safeLayaway &&
      actualPayment > 0 &&
      actualPayment <= safeLayaway.pending_amount + EPSILON &&
      !processing &&
      !commissionsLoading &&
      !!warehouseId
    );
  }, [safeLayaway, actualPayment, processing, commissionsLoading, warehouseId]);

  const addPaymentMethod = useCallback(() => {
    setPaymentMethods(prev => [...prev, { method: 'efectivo', netAmount: 0 }]);
  }, []);

  const removePaymentMethod = useCallback((index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 🎯 FUNCIÓN CORREGIDA: netAmount es el monto que el usuario quiere ABONAR
  const updatePaymentMethod = useCallback(
    (index: number, field: keyof PaymentMethodForm, value: any) => {
      if (!safeLayaway) return;

      if (!mixedPayment) {
        if (field === 'netAmount') {
          const inputNetAmount = Math.round((Number(value) || 0) * 100) / 100;
          // Validar que no exceda el pendiente
          const cappedNetAmount = Math.min(inputNetAmount, safeLayaway.pending_amount);
          setPaymentMethods([{ 
            ...paymentMethods[0], 
            netAmount: cappedNetAmount
          }]);
        } else if (field === 'method') {
          // Al cambiar método, mantener el monto neto actual
          setPaymentMethods([{ 
            method: value, 
            netAmount: paymentMethods[0]?.netAmount || 0,
            reference: paymentMethods[0]?.reference 
          }]);
        } else if (field === 'reference') {
          setPaymentMethods([{ ...paymentMethods[0], reference: value }]);
        }
      } else {
        // MODO MIXTO: Lógica de cascada
        let updatedMethods = paymentMethods.map((pm, i) => 
          i === index ? { 
            ...pm, 
            [field]: field === 'netAmount' ? Math.round((Number(value) || 0) * 100) / 100 : value 
          } : pm
        );

        if (paymentMethods.length >= 2 && field === 'netAmount' && index === 0) {
          const primaryNetAmount = updatedMethods[0].netAmount;
          const netValueRemaining = Math.max(0, safeLayaway.pending_amount - primaryNetAmount);
          updatedMethods[1] = { 
            ...updatedMethods[1], 
            netAmount: netValueRemaining
          };
        }
        setPaymentMethods(updatedMethods);
      }
    },
    [mixedPayment, safeLayaway, paymentMethods]
  );

  const setQuickPayment = useCallback(() => {
    if (!safeLayaway) return;
    // Liquidar el total pendiente
    setPaymentMethods([{
      method: 'efectivo',
      netAmount: safeLayaway.pending_amount
    }]);
    setMixedPayment(false);
  }, [safeLayaway]);

  const handleClose = useCallback(() => {
    if (processing) return;
    setPaymentMethods([{ method: 'efectivo', netAmount: 0 }]);
    setMixedPayment(false);
    setProcessing(false);
    setActiveStep(0);
    setCompleted(false);
    setNotes('');
    onClose();
  }, [onClose, processing]);

  const processPayment = useCallback(async () => {
    if (!safeLayaway || !calculations) return;
    if (!warehouseId) {
      notify.error('Error: Almacén no configurado. Contacta al administrador.');
      return;
    }

    try {
      setProcessing(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Usuario no autenticado');

      if (mixedPayment && paymentMethods.length > 1) {
        const paymentInserts = await Promise.all(
          paymentMethods.map(async (payment, index) => {
            const grossAmount = calculateGrossAmount(payment.netAmount, payment.method);
            const commission = getCommissionRate(payment.method);
            const commissionAmount = grossAmount - payment.netAmount;
            const baseData = {
              sale_id: safeLayaway.id,
              payment_method: payment.method,
              amount: grossAmount, // Monto bruto (lo que cobra)
              payment_reference: payment.reference || null,
              commission_rate: commission,
              commission_amount: commissionAmount,
              sequence_order: index + 1,
              payment_date: getCurrentTimestamp(),
              is_partial_payment: !calculations.willComplete,
              payment_sequence: index + 1,
              notes: `Abono mixto ${index + 1} de ${paymentMethods.length}`
            };
            return await addAuditFieldsFor('sale_payment_details', baseData, false);
          })
        );
        const { error: paymentError } = await supabase.from('sale_payment_details').insert(paymentInserts);
        if (paymentError) throw paymentError;
      } else {
        const singlePayment = paymentMethods[0];
        const grossAmount = calculateGrossAmount(singlePayment.netAmount, singlePayment.method);
        const commission = getCommissionRate(singlePayment.method);
        const commissionAmount = grossAmount - singlePayment.netAmount;
        const baseData = {
          sale_id: safeLayaway.id,
          payment_method: singlePayment.method,
          amount: grossAmount, // Monto bruto (lo que cobra)
          payment_reference: singlePayment.reference || null,
          commission_rate: commission,
          commission_amount: commissionAmount,
          sequence_order: 1,
          payment_date: getCurrentTimestamp(),
          is_partial_payment: !calculations.willComplete,
          payment_sequence: 1,
          notes: notes || null
        };
        const paymentData = await addAuditFieldsFor('sale_payment_details', baseData, false);
        const { error: paymentError } = await supabase.from('sale_payment_details').insert([paymentData]);
        if (paymentError) throw paymentError;
      }

      // ✅ CORREGIDO: Actualizar payment_received acumulando el total cobrado con comisiones
      const newPaymentReceived = (safeLayaway.payment_received || 0) + totalPayments;
      
      const updateData = {
        paid_amount: calculations.newPaidAmount,
        pending_amount: calculations.newPendingAmount,
        payment_received: newPaymentReceived, // ✅ NUEVO: Acumular total cobrado con comisiones
        last_payment_date: getCurrentTimestamp(),
        ...(calculations.willComplete && {
          status: 'completed',
          payment_status: 'paid',
          completed_at: getCurrentTimestamp()
        })
      };
      const { error: updateError } = await supabase.from('sales').update(updateData).eq('id', safeLayaway.id);
      if (updateError) throw updateError;

      if (calculations.willComplete) {
        const itemsToProcess = safeLayaway.sale_items;
        if (!itemsToProcess || itemsToProcess.length === 0) {
          throw new Error('No se encontraron items en el apartado para procesar el inventario.');
        }
        const inventoryMovements = itemsToProcess.flatMap((item: any) => ([
          {
            product_id: item.product_id,
            movement_type: 'cancelar_reserva',
            quantity: item.quantity,
            target_warehouse_id: warehouseId,
            reason: `Liquidación de Apartado #${safeLayaway.sale_number}`,
            reference_id: safeLayaway.id,
            created_by: currentUser
          },
          {
            product_id: item.product_id,
            movement_type: 'venta_apartado',
            quantity: -item.quantity,
            target_warehouse_id: warehouseId,
            reason: `Venta por liquidación de Apartado #${safeLayaway.sale_number}`,
            reference_id: safeLayaway.id,
            created_by: currentUser
          }
        ]));
        const { error: movementsError } = await supabase.from('inventory_movements').insert(inventoryMovements);
        if (movementsError) throw new Error(`Error al finalizar el inventario: ${movementsError.message}`);
      }

      const historyData = await addAuditFieldsFor('layaway_status_history', {
        layaway_id: safeLayaway.id,
        previous_status: safeLayaway.status,
        new_status: calculations.willComplete ? 'completed' : safeLayaway.status,
        previous_paid_amount: safeLayaway.paid_amount,
        new_paid_amount: calculations.newPaidAmount,
        reason: calculations.willComplete ? 'Pago completado' : 'Abono recibido'
      }, false);
      await supabase.from('layaway_status_history').insert([historyData]);

      setCompleted(true);
      notify.success(calculations.willComplete ? `Apartado completado! Abono: ${formatPrice(calculations.actualPayment)} (Cobrado: ${formatPrice(calculations.totalToCollect)})` : `Abono registrado: ${formatPrice(calculations.actualPayment)} (Cobrado: ${formatPrice(calculations.totalToCollect)})`);
      onSuccess();
    } catch (error: any) {
      console.error('Error procesando pago:', error);
      const errorMsg = error.message || 'Error desconocido';
      if (errorMsg.includes('insufficient_stock')) {
        notify.error('Stock insuficiente para completar. Verifica el inventario.');
      } else if (errorMsg.includes('inventory_movements_movement_type_check')) {
        notify.error('Error de configuración en inventario. Contacta al administrador.');
      } else if (errorMsg.includes('No se encontraron items')) {
        notify.error('Apartado sin items para procesar inventario.');
      } else {
        notify.error(`Error: ${errorMsg}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, warehouseId, getCurrentUser, mixedPayment, paymentMethods, getCommissionRate, notes, addAuditFieldsFor, supabase, formatPrice, onSuccess, calculateGrossAmount]);

  useEffect(() => {
    if (open && safeLayaway) {
      setPaymentMethods([{ method: 'efectivo', netAmount: 0 }]);
      setMixedPayment(false);
      setActiveStep(0);
      setNotes('');
      setCompleted(false);
    }
  }, [open, safeLayaway]);

  useEffect(() => {
    if (!safeLayaway) return;
    if (mixedPayment) {
      if (paymentMethods.length === 1) {
        setPaymentMethods([
          { method: 'efectivo', netAmount: 0 },
          { method: 'debito', netAmount: 0 }
        ]);
      }
    } else {
      if (paymentMethods.length > 1) {
        setPaymentMethods([{ method: 'efectivo', netAmount: 0 }]);
      }
    }
  }, [mixedPayment, safeLayaway, paymentMethods.length]);

  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
            <Typography sx={{ color: colorTokens.textSecondary }}>Cargando MuscleUp Gym...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!warehouseId) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Almacén no configurado</Typography>
            <Typography variant="body2">No se puede procesar el abono sin un almacén configurado. Contacta al administrador del sistema.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" sx={{ bgcolor: colorTokens.danger }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!open || !safeLayaway) return null;

  const steps = [
    { label: 'Método de Pago', description: 'Selecciona cómo recibir el pago' },
    { label: 'Monto y Detalles', description: 'Especifica cantidad y referencias' },
    { label: 'Confirmación', description: 'Revisa y procesa el pago' }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 4, background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`, border: `2px solid ${colorTokens.border}`, color: colorTokens.textPrimary, minHeight: '80vh' }}}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brand})`, color: colorTokens.textOnBrand, borderRadius: '16px 16px 0 0' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: colorTokens.neutral0, color: colorTokens.warning, width: 50, height: 50 }}>
            <PaymentIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">Registrar Abono a Apartado</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>Apartado #{safeLayaway.sale_number}</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!completed ? (
          <Box sx={{ p: 4 }}>
            <Card sx={{ mb: 4, background: `${colorTokens.info}10`, border: `1px solid ${colorTokens.info}30`, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.info, mb: 2, fontWeight: 700 }}>Información del Apartado</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Cliente:</strong> {safeLayaway.customer_name}</Typography></Grid>
                  <Grid size={{ xs: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Total:</strong> {formatPrice(safeLayaway.total_amount)}</Typography></Grid>
                  <Grid size={{ xs: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Pagado:</strong> {formatPrice(safeLayaway.paid_amount)}</Typography></Grid>
                  <Grid size={{ xs: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Pendiente:</strong> {formatPrice(safeLayaway.pending_amount)}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={4}>
              <Grid size={{ xs: 8 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`, border: `1px solid ${colorTokens.border}`, borderRadius: 4, p: 2 }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { color: colorTokens.textPrimary, fontWeight: activeStep === index ? 700 : 500 }, '& .MuiStepIcon-root': { color: activeStep === index ? colorTokens.brand : colorTokens.textMuted, '&.Mui-completed': { color: colorTokens.brand }}}}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: colorTokens.textSecondary, mb: 2 }}>{step.description}</Typography>
                          {index === 0 && (
                            <Box>
                              <Box sx={{ mb: 3 }}>
                                <FormControlLabel control={<Switch checked={mixedPayment} onChange={(e) => setMixedPayment(e.target.checked)} disabled={commissionsLoading || processing} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand }}} />} label={<Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>Pago con múltiples métodos</Typography>} />
                              </Box>
                              
                              <Button variant="outlined" fullWidth onClick={setQuickPayment} disabled={commissionsLoading || processing} startIcon={commissionsLoading ? <CircularProgress size={16} /> : <MoneyIcon />} sx={{ mb: 3, borderColor: commissionsLoading ? colorTokens.textMuted : colorTokens.success, color: commissionsLoading ? colorTokens.textMuted : colorTokens.success, '&:hover': { backgroundColor: `${colorTokens.success}20`, borderColor: colorTokens.success }}}>
                                {commissionsLoading ? 'Cargando...' : `Liquidar Total: ${formatPrice(safeLayaway.pending_amount)} (Cobrar: ${formatPrice(calculateGrossAmount(safeLayaway.pending_amount, 'efectivo'))})`}
                              </Button>

                              {!mixedPayment && (
                                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Método de Pago</InputLabel>
                                  <Select value={paymentMethods[0]?.method || ''} onChange={(e) => updatePaymentMethod(0, 'method', e.target.value)} label="Método de Pago" disabled={commissionsLoading || processing} sx={{ color: colorTokens.textPrimary, '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }}}>
                                    {availablePaymentMethods.map(method => (<MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>))}
                                  </Select>
                                </FormControl>
                              )}
                              
                              {mixedPayment && (<Alert severity="info" sx={{ mb: 3, background: `${colorTokens.info}20`, border: `1px solid ${colorTokens.info}30`, color: colorTokens.textPrimary }}>En el siguiente paso podrás configurar múltiples métodos de pago</Alert>)}
                              
                              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}><Button variant="contained" onClick={() => setActiveStep(1)} disabled={!mixedPayment && !paymentMethods[0]?.method} sx={{ background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`, color: colorTokens.textOnBrand, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3 }}>Continuar</Button></Box>
                            </Box>
                          )}
                          {index === 1 && (
                            <Box>
                              {!mixedPayment ? (
                                <Grid container spacing={3}>
                                  <Grid size={{ xs: 12 }}>
                                    <TextField 
                                      fullWidth 
                                      label="Monto a abonar (neto)" 
                                      type="number" 
                                      value={paymentMethods[0]?.netAmount || ''} 
                                      onChange={(e) => updatePaymentMethod(0, 'netAmount', e.target.value)} 
                                      disabled={commissionsLoading || processing}
                                      inputProps={{ step: "0.01", min: "0", max: safeLayaway.pending_amount }} 
                                      InputProps={{ 
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>, 
                                        sx: { color: colorTokens.textPrimary }
                                      }} 
                                      helperText={
                                        <Box component="span">
                                          <Typography component="span" variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                            Este monto se restará de la deuda (máx: {formatPrice(safeLayaway.pending_amount)})
                                          </Typography>
                                          {getCommissionRate(paymentMethods[0]?.method) > 0 && (
                                            <Typography component="span" variant="caption" sx={{ color: colorTokens.warning, display: 'block', mt: 0.5 }}>
                                              • Comisión {getCommissionRate(paymentMethods[0]?.method)}%: {formatPrice(calculateGrossAmount(paymentMethods[0]?.netAmount || 0, paymentMethods[0]?.method) - (paymentMethods[0]?.netAmount || 0))}
                                            </Typography>
                                          )}
                                          {(paymentMethods[0]?.netAmount || 0) > 0 && (
                                            <Typography component="span" variant="caption" sx={{ color: colorTokens.success, display: 'block', mt: 0.5, fontWeight: 600 }}>
                                              • Total a cobrar: {formatPrice(calculateGrossAmount(paymentMethods[0]?.netAmount || 0, paymentMethods[0]?.method))}
                                            </Typography>
                                          )}
                                        </Box>
                                      }
                                      InputLabelProps={{ sx: { color: colorTokens.textSecondary, '&.Mui-focused': { color: colorTokens.brand }}}} 
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Referencia (opcional)" value={paymentMethods[0]?.reference || ''} onChange={(e) => updatePaymentMethod(0, 'reference', e.target.value)} disabled={commissionsLoading || processing} InputProps={{ sx: { color: colorTokens.textPrimary, '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }}}} InputLabelProps={{ sx: { color: colorTokens.textSecondary, '&.Mui-focused': { color: colorTokens.brand }}}} /></Grid>
                                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Notas adicionales" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={commissionsLoading || processing} InputProps={{ sx: { color: colorTokens.textPrimary, '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }}}} InputLabelProps={{ sx: { color: colorTokens.textSecondary, '&.Mui-focused': { color: colorTokens.brand }}}} /></Grid>
                                </Grid>
                              ) : (
                                <Box>
                                  <Alert severity="warning" sx={{ mb: 3, background: `${colorTokens.warning}20`, border: `1px solid ${colorTokens.warning}30`, color: colorTokens.textPrimary }}><Typography variant="body2"><strong>Modo Pago Mixto:</strong> Ingresa el monto neto del primer método. El segundo se calculará automáticamente.</Typography></Alert>
                                  {paymentMethods.map((pm, idx) => (
                                    <Paper key={idx} sx={{ p: 2, mb: 2, background: colorTokens.surfaceLevel2, border: `1px solid ${colorTokens.border}` }}>
                                      <Grid container spacing={2} alignItems="center">
                                        <Grid size={{ xs: 12, sm: 4 }}><FormControl fullWidth size="small"><InputLabel sx={{ color: colorTokens.textSecondary }}>Método</InputLabel><Select value={pm.method} onChange={(e) => updatePaymentMethod(idx, 'method', e.target.value)} disabled={commissionsLoading || processing} label="Método" sx={{ color: colorTokens.textPrimary, '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }}}>{availablePaymentMethods.map(method => (<MenuItem key={method.value} value={method.value}><Box display="flex" alignItems="center" gap={1}><method.icon sx={{ fontSize: 16 }} />{method.label}</Box></MenuItem>))}</Select></FormControl></Grid>
                                        <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth size="small" label="Monto neto" type="number" value={pm.netAmount || ''} onChange={(e) => updatePaymentMethod(idx, 'netAmount', e.target.value)} disabled={commissionsLoading || processing || idx > 0} inputProps={{ step: "0.01", min: "0" }} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { color: colorTokens.textPrimary, backgroundColor: idx > 0 ? `${colorTokens.neutral300}20` : 'transparent' }}} helperText={idx === 0 ? "Monto que abona" : "Auto-calculado"} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} /></Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Referencia" value={pm.reference || ''} onChange={(e) => updatePaymentMethod(idx, 'reference', e.target.value)} disabled={commissionsLoading || processing} InputProps={{ sx: { color: colorTokens.textPrimary, '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }}}} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} /></Grid>
                                        <Grid size={{ xs: 12, sm: 1 }}>{paymentMethods.length > 1 && (<IconButton onClick={() => removePaymentMethod(idx)} disabled={processing} sx={{ color: colorTokens.danger }}><DeleteIcon /></IconButton>)}</Grid>
                                      </Grid>
                                      {pm.netAmount > 0 && (<Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>{(() => { const grossAmount = calculateGrossAmount(pm.netAmount, pm.method); const commission = grossAmount - pm.netAmount; return `Abono: ${formatPrice(pm.netAmount)} + Comisión: ${formatPrice(commission)} = Cobrar: ${formatPrice(grossAmount)}`; })()}</Alert>)}
                                    </Paper>
                                  ))}
                                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addPaymentMethod} disabled={commissionsLoading || processing} sx={{ mb: 3, borderColor: colorTokens.brand, color: colorTokens.brand, '&:hover': { backgroundColor: `${colorTokens.brand}10`, borderColor: colorTokens.brandActive }}}>Agregar Método de Pago</Button>
                                </Box>
                              )}
                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}><Button onClick={() => setActiveStep(0)} disabled={processing} sx={{ color: colorTokens.textSecondary }}>Atrás</Button><Button variant="contained" onClick={() => setActiveStep(2)} disabled={!canProcessPayment || commissionsLoading} sx={{ background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`, color: colorTokens.textOnBrand, fontWeight: 700 }}>Continuar</Button></Box>
                            </Box>
                          )}
                          {index === 2 && (
                            <Box>
                              <Card sx={{ mb: 3, background: `${colorTokens.success}10`, border: `1px solid ${colorTokens.success}30` }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ color: colorTokens.success, mb: 2, fontWeight: 700 }}>Resumen del Abono</Typography>
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: colorTokens.textSecondary }}><strong>Monto del abono (neto):</strong> {formatPrice(actualPayment)}</Typography>
                                      <Typography sx={{ color: colorTokens.textSecondary }}><strong>Comisión total:</strong> {formatPrice(totalCommissions)}</Typography>
                                      <Typography sx={{ color: colorTokens.success, fontWeight: 700, fontSize: '1.1rem' }}><strong>Total a cobrar:</strong> {formatPrice(totalPayments)}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography sx={{ color: colorTokens.textSecondary }}><strong>Pagado actual:</strong> {formatPrice(safeLayaway.paid_amount)}</Typography>
                                      <Typography sx={{ color: colorTokens.textSecondary }}><strong>Nuevo pagado:</strong> {formatPrice(calculations?.newPaidAmount || 0)}</Typography>
                                      <Typography sx={{ color: colorTokens.textSecondary }}><strong>Pendiente restante:</strong> {formatPrice(calculations?.newPendingAmount || 0)}</Typography>
                                    </Grid>
                                  </Grid>
                                  {calculations?.willComplete && (<Alert severity="success" sx={{ mt: 2, background: `${colorTokens.success}20`, border: `1px solid ${colorTokens.success}30`, color: colorTokens.textPrimary, '& .MuiAlert-icon': { color: colorTokens.success }}}><strong>Este abono completará el apartado y liberará el inventario</strong></Alert>)}
                                  {changeAmount > EPSILON && (<Alert severity="info" sx={{ mt: 2, background: `${colorTokens.info}20`, border: `1px solid ${colorTokens.info}30`, color: colorTokens.textPrimary, '& .MuiAlert-icon': { color: colorTokens.info }}}><strong>Cambio a devolver:</strong> {formatPrice(changeAmount)}</Alert>)}
                                </CardContent>
                              </Card>
                              
                              {!canProcessPayment && actualPayment === 0 && (<Alert severity="warning" sx={{ mb: 2 }}>Ingresa un monto para procesar el abono</Alert>)}
                              {actualPayment > safeLayaway.pending_amount && (<Alert severity="error" sx={{ mb: 2 }}>El abono ({formatPrice(actualPayment)}) excede el pendiente ({formatPrice(safeLayaway.pending_amount)})</Alert>)}
                              
                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}><Button onClick={() => setActiveStep(1)} disabled={processing} sx={{ color: colorTokens.textSecondary }}>Atrás</Button><Button variant="contained" onClick={processPayment} disabled={!canProcessPayment} startIcon={processing ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <CheckIcon />} sx={{ background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`, color: colorTokens.textOnBrand, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3 }}>{processing ? 'Procesando...' : commissionsLoading ? 'Calculando...' : `Cobrar ${formatPrice(totalPayments)}`}</Button></Box>
                            </Box>
                          )}
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`, border: `1px solid ${colorTokens.border}`, borderRadius: 4, p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>Resumen del Apartado</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>Progreso actual: {Math.round((safeLayaway.paid_amount / safeLayaway.total_amount) * 100)}%</Typography>
                    <LinearProgress variant="determinate" value={(safeLayaway.paid_amount / safeLayaway.total_amount) * 100} sx={{ height: 8, borderRadius: 4, backgroundColor: colorTokens.neutral500, '& .MuiLinearProgress-bar': { backgroundColor: colorTokens.brand }}} />
                  </Box>
                  <Stack spacing={2}>
                    <Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Total:</Typography><Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>{formatPrice(safeLayaway.total_amount)}</Typography></Box>
                    <Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Pagado:</Typography><Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 600 }}>{formatPrice(safeLayaway.paid_amount)}</Typography></Box>
                    <Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Pendiente:</Typography><Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 600 }}>{formatPrice(safeLayaway.pending_amount)}</Typography></Box>
                    {actualPayment > 0 && (<><Divider sx={{ my: 2, borderColor: colorTokens.border }} /><Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Abono neto:</Typography><Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 600 }}>{formatPrice(actualPayment)}</Typography></Box>{totalCommissions > EPSILON && (<Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Comisión (+):</Typography><Typography variant="body1" sx={{ color: colorTokens.warning, fontWeight: 600 }}>{formatPrice(totalCommissions)}</Typography></Box>)}<Box sx={{ p: 2, background: `${colorTokens.success}20`, borderRadius: 2, border: `1px solid ${colorTokens.success}30` }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Total a cobrar:</Typography><Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 700 }}>{formatPrice(totalPayments)}</Typography></Box></>)}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <CheckIcon sx={{ fontSize: 100, color: colorTokens.success, mb: 3 }} />
              <Typography variant="h3" sx={{ color: colorTokens.success, fontWeight: 700, mb: 2 }}>Abono Registrado Exitosamente</Typography>
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>El pago ha sido procesado correctamente</Typography>
              <Typography variant="body1" sx={{ color: colorTokens.textMuted, mb: 4 }}>Apartado #{safeLayaway.sale_number} • Abono: {formatPrice(actualPayment)} • Cobrado: {formatPrice(totalPayments)}</Typography>
              <Button variant="contained" onClick={handleClose} sx={{ background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`, color: colorTokens.textOnBrand, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3 }}>Cerrar</Button>
            </motion.div>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}