// components/dialogs/CancelLayawayDialog.tsx - v8.1 INVENTARIO CORREGIDO

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Dialog, DialogTitle, DialogContent, Alert, CircularProgress,
  Stack, Avatar, Slider, Stepper, Step, StepLabel, StepContent,
  Switch, FormControlLabel, RadioGroup, Radio, Divider, LinearProgress,
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon, Cancel as CancelIcon, Warning as WarningIcon,
  AttachMoney as MoneyIcon, Check as CheckIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// ✅ IMPORTS ENTERPRISE MUSCLEUP v8.1
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { getCurrentTimestamp, formatTimestampForDisplay } from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface LayawayItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
}

interface LayawayData {
  id: string;
  sale_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  pending_amount?: number;
    payment_status?: string; // ✅ AGREGAR ESTA LÍNEA

  status: string;
  created_at: string;
  source_warehouse_id?: string;
  layaway_expires_at?: string;
  last_payment_date?: string;
  deposit_percentage?: number;
  required_deposit?: number;
  notes?: string;
  items?: LayawayItem[];
  sale_items?: LayawayItem[];
  payment_history?: any[];
  sale_payment_details?: any[];
  payments?: any[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  layaway: LayawayData | null;
  warehouseId: string;
  onSuccess?: () => void;
}

const cancelReasons = [
  { value: 'customer_request', label: '🙋 Solicitud del cliente', description: 'El cliente decidió cancelar', color: colorTokens.info },
  { value: 'expired', label: '⏰ Apartado vencido', description: 'Superó el tiempo límite', color: colorTokens.warning },
  { value: 'product_unavailable', label: '📦 Producto no disponible', description: 'No hay stock suficiente', color: colorTokens.danger },
  { value: 'administrative', label: '📋 Decisión administrativa', description: 'Cancelación por políticas', color: colorTokens.brand },
  { value: 'payment_issues', label: '💳 Problemas de pago', description: 'Incidencias con pagos', color: colorTokens.danger },
  { value: 'other', label: '❓ Otro motivo', description: 'Especificar en notas', color: colorTokens.textMuted }
];

const refundMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵', description: 'Devolución en efectivo', color: colorTokens.brand },
  { value: 'transfer', label: 'Transferencia', icon: '🏦', description: 'Transferencia bancaria', color: colorTokens.info },
  { value: 'store_credit', label: 'Crédito en tienda', icon: '🎫', description: 'Vale para compras futuras', color: colorTokens.warning },
  { value: 'original_method', label: 'Método original', icon: '🔄', description: 'Mismo método de pago', color: colorTokens.success },
  { value: 'no_refund', label: 'Sin reembolso', icon: '❌', description: 'No aplica devolución', color: colorTokens.danger }
];

const steps = [
  { label: 'Motivo de Cancelación', description: 'Seleccione la razón por la cual se cancela el apartado' },
  { label: 'Configuración de Reembolso', description: 'Configure los detalles del reembolso y gestión de inventario' },
  { label: 'Confirmación', description: 'Revise y confirme la cancelación del apartado' }
];

export default function CancelLayawayDialog({ 
  open, 
  onClose, 
  layaway, 
  warehouseId,
  onSuccess
}: Props) {
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processRefund, setProcessRefund] = useState(true);
  const [refundMethod, setRefundMethod] = useState('efectivo');
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [applyPenalty, setApplyPenalty] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [refundReference, setRefundReference] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0);
  }, []);

  const safeLayaway = useMemo(() => {
    if (!layaway) return null;
    
    const normalizedItems = layaway.items || layaway.sale_items || [];
    const normalizedPayments = layaway.payment_history || layaway.sale_payment_details || layaway.payments || [];
    
    return {
      ...layaway,
      customer_name: layaway.customer_name || 'Cliente General',
      items: normalizedItems,
      payment_history: normalizedPayments
    };
  }, [layaway]);

  const calculations = useMemo(() => {
    if (!safeLayaway) return null;
    const totalPaid = safeLayaway.paid_amount;
    const baseRefund = totalPaid * (refundPercentage / 100);
    const penalty = applyPenalty ? penaltyAmount : 0;
    const finalRefund = Math.max(0, baseRefund - penalty);
    const itemsToRestore = safeLayaway.items.length;
    return { totalPaid, baseRefund, penalty, finalRefund, itemsToRestore };
  }, [safeLayaway, refundPercentage, applyPenalty, penaltyAmount]);

  const canProceed = useCallback(() => {
    switch (activeStep) {
      case 0:
        return cancelReason && (cancelReason !== 'other' || customReason.trim());
      case 1:
        if (!processRefund) return true;
        if (['transfer', 'original_method'].includes(refundMethod) && !refundReference.trim()) return false;
        return true;
      case 2:
        return true;
      default:
        return false;
    }
  }, [activeStep, cancelReason, customReason, processRefund, refundMethod, refundReference]);

  const handleClose = useCallback(() => {
    if (processing) return;
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
    onClose();
  }, [processing, onClose]);

  useEffect(() => {
    if (!open || !safeLayaway) return;
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
  }, [open, safeLayaway]);

  const processCancellation = useCallback(async () => {
  if (!safeLayaway || !calculations) return;
  if (!warehouseId) {
    notify.error('Error: No se encontró el almacén de origen del apartado.');
    return;
  }

  setProcessing(true);
  
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Usuario no autenticado');

    // =================================================================
    // 1. PRIMERO: Liberar reserva de inventario (si aplica)
    // =================================================================
    if (restoreStock && safeLayaway.items.length > 0) {
      console.log(`📦 Liberando reserva de ${safeLayaway.items.length} productos...`);

      const inventoryMovementsToCancel = safeLayaway.items.map(item => ({
        product_id: item.product_id,
        movement_type: 'cancelar_reserva',
        quantity: item.quantity,
        target_warehouse_id: warehouseId,
        reason: `Cancelación de Apartado #${safeLayaway.sale_number}`,
        reference_id: safeLayaway.id,
        created_by: currentUser,
      }));

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(inventoryMovementsToCancel);

      if (movementsError) {
        throw new Error(`Error al liberar la reserva de inventario: ${movementsError.message}`);
      }
      console.log('✅ Reserva de stock liberada.');
    }

    // =================================================================
    // 2. LUEGO: Actualizar venta con montos corregidos
    // =================================================================
    const finalUpdateData = {
      status: 'cancelled',
      payment_status: processRefund ? 'refunded' : safeLayaway.payment_status,
      
      // ✅ CORRECCIÓN CRÍTICA: Ajustar montos para cumplir regla de BD
      // paid_amount + pending_amount = total_amount
      paid_amount: safeLayaway.paid_amount - (processRefund ? calculations.finalRefund : 0),
      pending_amount: 0, // Apartado cancelado siempre tiene 0 pendiente

      cancelled_at: getCurrentTimestamp(),
      cancelled_by: currentUser,
      cancel_reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
      notes: notes || null
    };

    const { error: updateError } = await supabase
      .from('sales')
      .update(finalUpdateData)
      .eq('id', safeLayaway.id);

    if (updateError) throw updateError;
    
    console.log('✅ Apartado actualizado a "cancelled".');

    // =================================================================
    // 3. OPCIONAL: Registrar reembolso en tabla 'refunds'
    // =================================================================
    if (processRefund && calculations.finalRefund > 0) {
      const refundData = await addAuditFieldsFor('refunds', {
        sale_id: safeLayaway.id,
        refund_amount: calculations.finalRefund,
        refund_method: refundMethod,
        refund_reference: refundReference || null,
        penalty_amount: calculations.penalty,
        commission_refund: 0,
        refund_date: getCurrentTimestamp(),
        reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
        notes: notes || null
      }, false);

      const { error: refundError } = await supabase.from('refunds').insert([refundData]);
      if (refundError) console.error('Error registrando reembolso:', refundError);
    }

    // =================================================================
    // 4. Registrar en historial de estados
    // =================================================================
    const historyData = await addAuditFieldsFor('layaway_status_history', {
      layaway_id: safeLayaway.id,
      previous_status: safeLayaway.status,
      new_status: 'cancelled',
      previous_paid_amount: safeLayaway.paid_amount,
      new_paid_amount: safeLayaway.paid_amount - (processRefund ? calculations.finalRefund : 0),
      reason: `Cancelado: ${cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}`
    }, false);
    
    await supabase.from('layaway_status_history').insert([historyData]);

    setCompleted(true);
    notify.success(`Apartado #${safeLayaway.sale_number} cancelado exitosamente`);
    if (onSuccess) onSuccess();

  } catch (error: any) {
    console.error('Error procesando cancelación:', error);
    const errorMsg = error.message || 'Error desconocido';
    
    if (errorMsg.includes('insufficient_stock')) {
      notify.error('Stock insuficiente para liberar reserva. Verifica el inventario.');
    } else if (errorMsg.includes('inventory_movements_movement_type_check')) {
      notify.error('Error de configuración en inventario. Contacta al administrador.');
    } else {
      notify.error(`Error: ${errorMsg}`);
    }
  } finally {
    setProcessing(false);
  }
}, [
  safeLayaway, 
  calculations, 
  warehouseId,
  restoreStock,
  processRefund,
  refundMethod,
  refundReference,
  cancelReason,
  customReason,
  notes,
  supabase,
  getCurrentUser,
  addAuditFieldsFor,
  onSuccess
]);

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

  if (!safeLayaway) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 4, background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`, border: `2px solid ${colorTokens.danger}50`, color: colorTokens.textPrimary, minHeight: '80vh' }}}>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
        color: colorTokens.textOnBrand,
        borderRadius: '16px 16px 0 0',
        p: { xs: 2, sm: 3 },
        flexDirection: { xs: 'row', sm: 'row' }
      }}>
        <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2 }}>
          <Avatar sx={{
            bgcolor: colorTokens.neutral0,
            color: colorTokens.danger,
            width: { xs: 40, sm: 50 },
            height: { xs: 40, sm: 50 }
          }}>
            <CancelIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{
              fontSize: { xs: '1.1rem', sm: '1.5rem' }
            }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Cancelar Apartado
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Cancelar
              </Box>
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>#{safeLayaway.sale_number}</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!completed ? (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Card sx={{ mb: { xs: 2, sm: 3, md: 4 }, background: `${colorTokens.warning}10`, border: `1px solid ${colorTokens.warning}30`, borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ color: colorTokens.warning, mb: { xs: 1.5, sm: 2 }, fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Información del Apartado</Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid size={{ xs: 6, sm: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}><strong>Cliente:</strong> {safeLayaway.customer_name}</Typography></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}><strong>Total:</strong> {formatPrice(safeLayaway.total_amount)}</Typography></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}><strong>Pagado:</strong> {formatPrice(safeLayaway.paid_amount)}</Typography></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}><strong>Creado:</strong> {formatTimestampForDisplay(safeLayaway.created_at)}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="error" sx={{ mb: { xs: 2, sm: 3, md: 4 }, background: `${colorTokens.danger}20`, border: `1px solid ${colorTokens.danger}30`, color: colorTokens.textPrimary, '& .MuiAlert-icon': { color: colorTokens.danger }}}>
              <strong>ATENCIÓN:</strong> Esta acción cancelará permanentemente el apartado y puede afectar el inventario. Revise cuidadosamente antes de proceder.
            </Alert>

            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`, border: `1px solid ${colorTokens.border}`, borderRadius: 4, p: 2 }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { color: colorTokens.textPrimary, fontWeight: activeStep === index ? 700 : 500 }, '& .MuiStepIcon-root': { color: activeStep === index ? colorTokens.danger : colorTokens.textMuted, '&.Mui-completed': { color: colorTokens.danger }}}}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: colorTokens.textSecondary, mb: 2 }}>{step.description}</Typography>
                          
                          {index === 0 && (
                            <Box>
                              <RadioGroup value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                                {cancelReasons.map(reason => (
                                  <Card key={reason.value} sx={{ mb: 2, cursor: 'pointer', background: cancelReason === reason.value ? `${reason.color}20` : colorTokens.surfaceLevel2, border: `2px solid ${cancelReason === reason.value ? reason.color : 'transparent'}`, transition: 'all 0.2s' }} onClick={() => setCancelReason(reason.value)}>
                                    <CardContent sx={{ py: 1.5 }}>
                                      <FormControlLabel value={reason.value} control={<Radio sx={{ color: reason.color, '&.Mui-checked': { color: reason.color }}} />} label={<Box><Typography variant="body1" fontWeight={600} sx={{ color: colorTokens.textPrimary }}>{reason.label}</Typography><Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>{reason.description}</Typography></Box>} sx={{ width: '100%', m: 0 }} />
                                    </CardContent>
                                  </Card>
                                ))}
                              </RadioGroup>
                              {cancelReason === 'other' && (<TextField fullWidth multiline rows={3} label="Especifique el motivo" value={customReason} onChange={(e) => setCustomReason(e.target.value)} sx={{ mt: 2 }} InputProps={{ sx: { color: colorTokens.textPrimary }}} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} />)}
                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}><Button variant="contained" onClick={() => setActiveStep(1)} disabled={!canProceed()} sx={{ background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`, color: colorTokens.textOnBrand, fontWeight: 700 }}>Continuar</Button></Box>
                            </Box>
                          )}

                          {index === 1 && (
                            <Box>
                              <Box sx={{ mb: 3 }}>
                                <FormControlLabel control={<Switch checked={processRefund} onChange={(e) => setProcessRefund(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.success }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.success }}} />} label={<Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>Procesar reembolso al cliente</Typography>} />
                              </Box>

                              {processRefund && (
                                <>
                                  <Typography sx={{ color: colorTokens.textSecondary, mb: 2, fontWeight: 600 }}>Método de reembolso:</Typography>
                                  <RadioGroup value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                                    {refundMethods.map(method => (
                                      <Card key={method.value} sx={{ mb: 2, cursor: 'pointer', background: refundMethod === method.value ? `${method.color}20` : colorTokens.surfaceLevel2, border: `2px solid ${refundMethod === method.value ? method.color : 'transparent'}` }} onClick={() => setRefundMethod(method.value)}>
                                        <CardContent sx={{ py: 1.5 }}>
                                          <FormControlLabel value={method.value} control={<Radio sx={{ color: method.color, '&.Mui-checked': { color: method.color }}} />} label={<Box><Typography variant="body1" fontWeight={600} sx={{ color: colorTokens.textPrimary }}>{method.icon} {method.label}</Typography><Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>{method.description}</Typography></Box>} sx={{ width: '100%', m: 0 }} />
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </RadioGroup>

                                  {['transfer', 'original_method'].includes(refundMethod) && (<TextField fullWidth label="Referencia del reembolso" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} sx={{ mt: 2 }} InputProps={{ sx: { color: colorTokens.textPrimary }}} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} />)}

                                  <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ color: colorTokens.textSecondary, mb: 1, fontWeight: 600 }}>Porcentaje de reembolso: {refundPercentage}%</Typography>
                                    <Slider value={refundPercentage} onChange={(_, value) => setRefundPercentage(value as number)} min={0} max={100} step={5} marks valueLabelDisplay="auto" sx={{ color: colorTokens.success, '& .MuiSlider-thumb': { bgcolor: colorTokens.success }}} />
                                  </Box>

                                  <Box sx={{ mt: 3 }}>
                                    <FormControlLabel control={<Switch checked={applyPenalty} onChange={(e) => setApplyPenalty(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.warning }}} />} label={<Typography sx={{ color: colorTokens.textPrimary }}>Aplicar penalización</Typography>} />
                                    {applyPenalty && (<TextField fullWidth type="number" label="Monto de penalización" value={penaltyAmount} onChange={(e) => setPenaltyAmount(Number(e.target.value))} sx={{ mt: 2 }} InputProps={{ sx: { color: colorTokens.textPrimary }}} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} />)}
                                  </Box>
                                </>
                              )}

                              <Divider sx={{ my: 3, borderColor: colorTokens.border }} />

                              <Box sx={{ mb: 3 }}>
                                <FormControlLabel control={<Switch checked={restoreStock} onChange={(e) => setRestoreStock(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand }}} />} label={<Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>Liberar reserva de inventario</Typography>} />
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 1 }}>Se liberarán {safeLayaway.items.length} productos reservados</Typography>
                              </Box>

                              <TextField fullWidth multiline rows={3} label="Notas adicionales (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 2 }} InputProps={{ sx: { color: colorTokens.textPrimary }}} InputLabelProps={{ sx: { color: colorTokens.textSecondary }}} />

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}><Button onClick={() => setActiveStep(0)} disabled={processing} sx={{ color: colorTokens.textSecondary }}>Atrás</Button><Button variant="contained" onClick={() => setActiveStep(2)} disabled={!canProceed()} sx={{ background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`, color: colorTokens.textOnBrand, fontWeight: 700 }}>Continuar</Button></Box>
                            </Box>
                          )}

                          {index === 2 && (
                            <Box>
                              <Card sx={{ mb: 3, background: `${colorTokens.danger}10`, border: `1px solid ${colorTokens.danger}30` }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ color: colorTokens.danger, mb: 2, fontWeight: 700 }}>Resumen de Cancelación</Typography>
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Motivo:</strong> {cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}</Typography></Grid>
                                    <Grid size={{ xs: 6 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Reembolso:</strong> {processRefund ? formatPrice(calculations?.finalRefund || 0) : 'No aplica'}</Typography></Grid>
                                    <Grid size={{ xs: 6 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Método:</strong> {processRefund ? refundMethods.find(m => m.value === refundMethod)?.label : 'N/A'}</Typography></Grid>
                                    <Grid size={{ xs: 6 }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}><strong>Inventario:</strong> {restoreStock ? `Liberar ${safeLayaway.items.length} productos` : 'No modificar'}</Typography></Grid>
                                  </Grid>
                                </CardContent>
                              </Card>

                              <Alert severity="warning" sx={{ mb: 3, background: `${colorTokens.warning}20`, border: `1px solid ${colorTokens.warning}30`, color: colorTokens.textPrimary }}>Esta acción es <strong>irreversible</strong>. El apartado será cancelado permanentemente.</Alert>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}><Button onClick={() => setActiveStep(1)} disabled={processing} sx={{ color: colorTokens.textSecondary }}>Atrás</Button><Button variant="contained" onClick={processCancellation} disabled={processing} startIcon={processing ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <CancelIcon />} sx={{ background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`, color: colorTokens.textOnBrand, fontWeight: 700 }}>{processing ? 'Procesando...' : 'Cancelar Apartado'}</Button></Box>
                            </Box>
                          )}
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`, border: `1px solid ${colorTokens.border}`, borderRadius: 4, p: { xs: 2, sm: 3 }, position: { xs: 'static', lg: 'sticky' }, top: 20 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.danger, mb: 3, fontWeight: 700 }}>Detalles Financieros</Typography>
                  <Stack spacing={2}>
                    <Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Total apartado:</Typography><Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>{formatPrice(safeLayaway.total_amount)}</Typography></Box>
                    <Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Total pagado:</Typography><Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 600 }}>{formatPrice(safeLayaway.paid_amount)}</Typography></Box>
                    {processRefund && calculations && (<><Divider sx={{ my: 2, borderColor: colorTokens.border }} /><Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Reembolso base ({refundPercentage}%):</Typography><Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>{formatPrice(calculations.baseRefund)}</Typography></Box>{applyPenalty && calculations.penalty > 0 && (<Box><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Penalización (-):</Typography><Typography variant="body1" sx={{ color: colorTokens.danger }}>{formatPrice(calculations.penalty)}</Typography></Box>)}<Box sx={{ p: 2, background: `${colorTokens.danger}20`, borderRadius: 2, border: `1px solid ${colorTokens.danger}30` }}><Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Reembolso final:</Typography><Typography variant="h4" sx={{ color: colorTokens.danger, fontWeight: 700 }}>{formatPrice(calculations.finalRefund)}</Typography></Box></>)}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 } }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <CancelIcon sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: colorTokens.danger, mb: { xs: 2, sm: 3 } }} />
              <Typography variant="h3" sx={{ color: colorTokens.danger, fontWeight: 700, mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>Apartado Cancelado</Typography>
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: { xs: 3, sm: 4 }, fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>El apartado #{safeLayaway.sale_number} ha sido cancelado exitosamente</Typography>
              {processRefund && calculations && (<Typography variant="body1" sx={{ color: colorTokens.success, mb: 3, fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Reembolso procesado: {formatPrice(calculations.finalRefund)}</Typography>)}
              <Button variant="contained" onClick={handleClose} fullWidth={{ xs: true, sm: false }} sx={{ background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`, color: colorTokens.textOnBrand, fontWeight: 700, px: { xs: 3, sm: 4 }, py: { xs: 1.2, sm: 1.5 }, borderRadius: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Cerrar</Button>
            </motion.div>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}