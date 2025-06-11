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
  Stack
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
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

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
  { value: 'customer_request', label: '🙋 Solicitud del cliente', description: 'El cliente decidió cancelar' },
  { value: 'expired', label: '⏰ Apartado vencido', description: 'Superó el tiempo límite' },
  { value: 'product_unavailable', label: '📦 Producto no disponible', description: 'No hay stock suficiente' },
  { value: 'administrative', label: '📋 Decisión administrativa', description: 'Cancelación por políticas' },
  { value: 'payment_issues', label: '💳 Problemas de pago', description: 'Incidencias con pagos' },
  { value: 'other', label: '❓ Otro motivo', description: 'Especificar en notas' }
];

const refundMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵', description: 'Devolución en efectivo' },
  { value: 'transfer', label: 'Transferencia', icon: '🏦', description: 'Transferencia bancaria' },
  { value: 'store_credit', label: 'Crédito en tienda', icon: '🎫', description: 'Vale para compras futuras' },
  { value: 'original_method', label: 'Método original', icon: '🔄', description: 'Mismo método de pago' },
  { value: 'no_refund', label: 'Sin reembolso', icon: '❌', description: 'No aplica devolución' }
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
      payment_history: layaway.payment_history || [],
      created_at: layaway.created_at || new Date().toISOString(),
      layaway_expires_at: layaway.layaway_expires_at || ''
    };
  }, [layaway]);

  // ✅ FUNCIÓN HÍBRIDA PARA CARGAR DETALLES
  const loadRefundDetails = useCallback(async () => {
    if (!open || !safeLayaway) return;
    
    try {
      console.log('🔍 Cargando detalles para reembolso... - 2025-06-11 08:46:59 UTC - luishdz04');
      
      // Crear detalles de reembolso basados en pagos existentes
      const details: RefundDetail[] = safeLayaway.payment_history.map((payment: any) => ({
        payment_id: payment.id,
        original_amount: payment.amount || 0,
        refund_amount: (payment.amount || 0) * (refundPercentage / 100),
        refund_method: refundMethod,
        commission_refund: (payment.commission_amount || 0) * (refundPercentage / 100)
      }));
      
      setRefundDetails(details);
      console.log('✅ Detalles de reembolso calculados:', details);
    } catch (error) {
      console.error('❌ Error calculando reembolsos:', error);
    }
  }, [open, safeLayaway, refundPercentage, refundMethod]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSE
  useEffect(() => {
    if (!open || !layaway) return;
    
    console.log('🔄 Inicializando dialog de cancelación... - 2025-06-11 08:46:59 UTC - luishdz04');
    
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
    const penalty = applyPenalty ? penaltyAmount : 0; // ✅ DEFINIR penalty AQUÍ
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

  // ✅ FUNCIÓN HÍBRIDA PARA PROCESAR CANCELACIÓN - CORREGIDA
  const processCancellation = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      console.log('🚀 Procesando cancelación de apartado:', safeLayaway.sale_number, '- 2025-06-11 08:46:59 UTC - luishdz04');

      // ✅ ACTUALIZAR APARTADO A CANCELADO
      const updateData = {
        status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancel_reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
        refund_amount: processRefund ? calculations.finalRefund : 0,
        refund_method: processRefund ? refundMethod : null,
        refund_reference: refundReference || null,
        penalty_amount: calculations.penalty, // ✅ USAR calculations.penalty
        notes: notes || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', safeLayaway.id);

      if (updateError) {
        throw updateError;
      }

      // ✅ PROCESAR REEMBOLSOS SI APLICA
      if (processRefund && calculations.finalRefund > 0) {
        const refundData = {
          sale_id: safeLayaway.id,
          refund_amount: calculations.finalRefund,
          refund_method: refundMethod,
          refund_reference: refundReference || null,
          penalty_amount: calculations.penalty, // ✅ USAR calculations.penalty
          commission_refund: calculations.totalCommissionRefund,
          refund_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by: userId,
          reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
          notes: notes || null
        };

        const { error: refundError } = await supabase
          .from('sale_refunds')
          .insert([refundData]);

        if (refundError) {
          console.error('❌ Error registrando reembolso:', refundError);
          // No throw, continuar con el proceso
        }
      }

      // ✅ RESTAURAR STOCK SI APLICA
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
                updated_at: new Date().toISOString(),
                updated_by: userId
              })
              .eq('id', item.product_id);

            if (stockError) {
              console.error('❌ Error restaurando stock:', stockError);
            }

            // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO
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
                created_at: new Date().toISOString(),
                created_by: userId
              }]);
          }
        }

        console.log('✅ Stock restaurado correctamente');
      }

      // ✅ CREAR HISTORIAL DE CANCELACIÓN
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: safeLayaway.id,
          previous_status: safeLayaway.status,
          new_status: 'cancelled',
          previous_paid_amount: safeLayaway.paid_amount,
          new_paid_amount: safeLayaway.paid_amount,
          reason: `Cancelado: ${cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}`,
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      setCompleted(true);
      showNotification('¡Apartado cancelado exitosamente!', 'success');

      console.log('✅ Cancelación procesada exitosamente');

    } catch (error: any) {
      console.error('💥 Error procesando cancelación:', error);
      showNotification('Error al cancelar apartado: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [safeLayaway, calculations, supabase, cancelReason, customReason, notes, processRefund, refundMethod, refundReference, restoreStock, partialRestore]);

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
        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.98), rgba(244, 67, 54, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <CancelIcon />
          <Typography variant="h5" fontWeight="bold">
            ❌ Cancelar Apartado #{safeLayaway.sale_number}
          </Typography>
          <Chip 
            label="HÍBRIDO v1.1" 
            color="error" 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontWeight: 'bold' }}
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
            <Alert severity="warning" sx={{ mb: 3 }}>
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
                    <strong>Creado:</strong> {formatDate(safeLayaway.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Alert>

            {/* ✅ INDICADOR HÍBRIDO */}
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ <strong>SOLUCIÓN HÍBRIDA:</strong> useCallback controlado + Grid correcto - 2025-06-11 08:46:59 UTC por luishdz04
            </Alert>

            {/* ✅ ADVERTENCIA IMPORTANTE */}
            <Alert severity="error" sx={{ mb: 3 }}>
              ⚠️ <strong>ATENCIÓN:</strong> Esta acción cancelará permanentemente el apartado y puede afectar el inventario. Revise cuidadosamente antes de proceder.
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

                          {/* PASO 1: MOTIVO DE CANCELACIÓN */}
                          {index === 0 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
                                📋 Seleccione el motivo de cancelación
                              </Typography>
                              
                              <RadioGroup
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                              >
                                <Grid container spacing={2}>
                                  {cancelReasons.map(reason => (
                                    <Grid size={{ xs: 6 }} key={reason.value}>
                                      <Card 
                                        sx={{
                                          p: 2,
                                          background: cancelReason === reason.value 
                                            ? 'rgba(244, 67, 54, 0.2)' 
                                            : 'rgba(255,255,255,0.05)',
                                          border: cancelReason === reason.value 
                                            ? '2px solid #f44336' 
                                            : '1px solid rgba(255,255,255,0.1)',
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            background: 'rgba(244, 67, 54, 0.1)',
                                            border: '1px solid rgba(244, 67, 54, 0.5)'
                                          }
                                        }}
                                        onClick={() => setCancelReason(reason.value)}
                                      >
                                        <FormControlLabel
                                          value={reason.value}
                                          control={<Radio sx={{ color: '#f44336' }} />}
                                          label={
                                            <Box>
                                              <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                                {reason.label}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                                {reason.description}
                                              </Typography>
                                            </Box>
                                          }
                                        />
                                      </Card>
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
                                      color: 'white',
                                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                      '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                                      '&.Mui-focused fieldset': { borderColor: '#f44336' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                  }}
                                />
                              )}

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(1)}
                                  disabled={!canProceed()}
                                  sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}
                                >
                                  Continuar
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
                                        color: '#f44336',
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#f44336',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: 'white' }}>
                                    💰 Procesar reembolso al cliente
                                  </Typography>
                                }
                              />

                              {processRefund && calculations && (
                                <Box sx={{ mt: 3 }}>
                                  {/* Métodos de reembolso */}
                                  <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
                                    💳 Método de reembolso
                                  </Typography>
                                  
                                  <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {refundMethods.map(method => (
                                      <Grid size={{ xs: 6 }} key={method.value}>
                                        <Card 
                                          sx={{
                                            p: 2,
                                            background: refundMethod === method.value 
                                              ? 'rgba(244, 67, 54, 0.2)' 
                                              : 'rgba(255,255,255,0.05)',
                                            border: refundMethod === method.value 
                                              ? '2px solid #f44336' 
                                              : '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                              background: 'rgba(244, 67, 54, 0.1)',
                                              border: '1px solid rgba(244, 67, 54, 0.5)'
                                            }
                                          }}
                                          onClick={() => setRefundMethod(method.value)}
                                        >
                                          <Typography variant="body1" sx={{ color: '#FFFFFF', mb: 1 }}>
                                            {method.icon} {method.label}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                            {method.description}
                                          </Typography>
                                        </Card>
                                      </Grid>
                                    ))}
                                  </Grid>

                                  {/* Configuración del reembolso */}
                                  <Grid container spacing={3}>
                                    <Grid size={{ xs: 6 }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                        Porcentaje de reembolso: {refundPercentage}%
                                      </Typography>
                                      <Box sx={{ px: 2 }}>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          step="5"
                                          value={refundPercentage}
                                          onChange={(e) => setRefundPercentage(Number(e.target.value))}
                                          style={{
                                            width: '100%',
                                            height: '8px',
                                            background: '#f44336',
                                            borderRadius: '4px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                          }}
                                        />
                                      </Box>
                                    </Grid>
                                    
                                    <Grid size={{ xs: 6 }}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={applyPenalty}
                                            onChange={(e) => setApplyPenalty(e.target.checked)}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#ff9800',
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#ff9800',
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography sx={{ color: 'white' }}>
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
                                              color: 'white',
                                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                              '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                                              '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
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
                                          sx={{
                                            '& .MuiOutlinedInput-root': {
                                              color: 'white',
                                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                              '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                                              '&.Mui-focused fieldset': { borderColor: '#f44336' },
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                          }}
                                        />
                                      </Grid>
                                    )}
                                  </Grid>

                                  {/* Configuración de inventario */}
                                  <Box sx={{ mt: 4, p: 3, background: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2 }}>
                                      📦 Gestión de Inventario
                                    </Typography>
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={restoreStock}
                                          onChange={(e) => setRestoreStock(e.target.checked)}
                                          sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                              color: '#9c27b0',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                              backgroundColor: '#9c27b0',
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography sx={{ color: 'white' }}>
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
                                                color: '#ff9800',
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#ff9800',
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography sx={{ color: 'white' }}>
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
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                    '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: '#f44336' },
                                  },
                                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                              />

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button onClick={() => setActiveStep(0)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => setActiveStep(2)}
                                  disabled={!canProceed()}
                                  sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}
                                >
                                  Continuar
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 3: CONFIRMACIÓN */}
                          {index === 2 && calculations && (
                            <Box>
                              <Alert severity="error" sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                  ⚠️ Confirmación de Cancelación
                                </Typography>
                                
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography><strong>Motivo:</strong> {cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label}</Typography>
                                    <Typography><strong>Procesar reembolso:</strong> {processRefund ? 'Sí' : 'No'}</Typography>
                                    {processRefund && (
                                      <>
                                        <Typography><strong>Método de reembolso:</strong> {refundMethods.find(m => m.value === refundMethod)?.label}</Typography>
                                        <Typography><strong>Monto a reembolsar:</strong> {formatPrice(calculations.finalRefund)}</Typography>
                                      </>
                                    )}
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <Typography><strong>Restaurar inventario:</strong> {restoreStock ? (partialRestore ? 'Parcial (80%)' : 'Completo') : 'No'}</Typography>
                                    <Typography><strong>Productos afectados:</strong> {calculations.itemsToRestore}</Typography>
                                    {applyPenalty && (
                                      <Typography><strong>Penalización:</strong> {formatPrice(calculations.penalty)}</Typography>
                                    )}
                                  </Grid>
                                </Grid>
                              </Alert>

                              <Alert severity="warning" sx={{ mb: 3 }}>
                                <Typography variant="body1">
                                  <strong>⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER</strong>
                                </Typography>
                                <Typography variant="body2">
                                  Al confirmar, el apartado será marcado como cancelado permanentemente.
                                </Typography>
                              </Alert>

                              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button onClick={() => setActiveStep(1)}>
                                  Atrás
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={processCancellation}
                                  disabled={processing}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <CancelIcon />}
                                  sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}
                                >
                                  {processing ? 'Procesando...' : 'CONFIRMAR CANCELACIÓN'}
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
                <Card sx={{ background: 'rgba(244, 67, 54, 0.1)', p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" sx={{ color: '#f44336', mb: 2, fontWeight: 700 }}>
                    ❌ Resumen de Cancelación
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                      Estado actual del apartado
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(safeLayaway.paid_amount / safeLayaway.total_amount) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#f44336'
                        }
                      }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Total apartado:</Typography>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Monto pagado:</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
                        {formatPrice(safeLayaway.paid_amount)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Productos:</Typography>
                      <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                        {safeLayaway.items.length} items
                      </Typography>
                    </Box>

                    {calculations && processRefund && (
                      <>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Reembolso base:</Typography>
                          <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            {formatPrice(calculations.baseRefund)}
                          </Typography>
                        </Box>
                        
                        {calculations.penalty > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Penalización:</Typography>
                            <Typography variant="body1" sx={{ color: '#ff9800', fontWeight: 600 }}>
                              -{formatPrice(calculations.penalty)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Reembolso final:</Typography>
                          <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                            {formatPrice(calculations.finalRefund)}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {!processRefund && (
                      <>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                        <Alert severity="info"> {/* ✅ CORREGIDO: sin size="small" */}
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CancelIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
            <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 700, mb: 2 }}>
              ¡Apartado Cancelado!
            </Typography>
            <Typography variant="body1" sx={{ color: '#CCCCCC', mb: 3 }}>
              El apartado #{safeLayaway.sale_number} ha sido cancelado exitosamente
            </Typography>
            {processRefund && calculations && (
              <Typography variant="body2" sx={{ color: '#4caf50', mb: 3 }}>
                💰 Reembolso procesado: {formatPrice(calculations.finalRefund)}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}
            >
              Cerrar
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}