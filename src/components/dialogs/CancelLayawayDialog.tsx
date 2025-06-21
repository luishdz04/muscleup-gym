'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Avatar,
  Slider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Close as CloseIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { toMexicoTimestamp, formatMexicoDateTime } from '@/utils/dateHelpers';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  grayDark: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  info: '#1976D2',
  roleModerator: '#9C27B0'
};

// ✅ INTERFACES Y TIPOS PARA CANCELACIÓN DE APARTADOS
interface RefundDetail {
  payment_id: string;
  original_amount: number;
  refund_amount: number;
  refund_method: string;
  commission_refund: number;
}

interface CancelLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
  onSuccess: () => void;
}

const cancelReasons = [
  { value: 'customer_request', label: '🙋 Solicitud del cliente', description: 'El cliente decidió cancelar', color: darkProTokens.info },
  { value: 'expired', label: '⏰ Apartado vencido', description: 'Superó el tiempo límite', color: darkProTokens.warning },
  { value: 'product_unavailable', label: '📦 Producto no disponible', description: 'No hay stock suficiente', color: darkProTokens.error },
  { value: 'administrative', label: '📋 Decisión administrativa', description: 'Cancelación por políticas', color: darkProTokens.roleModerator },
  { value: 'payment_issues', label: '💳 Problemas de pago', description: 'Incidencias con pagos', color: darkProTokens.error },
  { value: 'other', label: '❓ Otro motivo', description: 'Especificar en notas', color: darkProTokens.textSecondary }
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
  // ✅ ESTADOS PRINCIPALES
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Estados de cancelación
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  
  // Estados de reembolso
  const [processRefund, setProcessRefund] = useState(true);
  const [refundMethod, setRefundMethod] = useState('efectivo');
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [applyPenalty, setApplyPenalty] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [refundReference, setRefundReference] = useState('');
  
  // Estados de inventario
  const [restoreStock, setRestoreStock] = useState(true);
  const [partialRestore, setPartialRestore] = useState(false);
  
  // Estados de cálculos
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

  // ✅ FUNCIONES UTILITARIAS
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // ✅ DATOS SEGUROS DEL APARTADO
  const safeLayaway = useMemo(() => {
    if (!layaway) return null;
    return {
      ...layaway,
      customer_name: layaway.customer_name || 'Cliente no especificado',
      sale_number: layaway.sale_number || 'N/A',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      items: layaway.items || [],
      payment_history: layaway.payment_history || []
    };
  }, [layaway]);

  // ✅ CÁLCULOS PARA REEMBOLSO
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
      totalCommissionRefund
    };
  }, [safeLayaway, refundPercentage, applyPenalty, penaltyAmount, refundDetails]);

  // ✅ FUNCIÓN PARA CARGAR DETALLES DE REEMBOLSO
  const loadRefundDetails = useCallback(() => {
    if (!safeLayaway) return;

    try {
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
  }, [safeLayaway, refundPercentage, refundMethod]);

  // ✅ EFECTO PARA CARGAR DATOS INICIALES
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
    
    loadRefundDetails();
  }, [open, layaway, loadRefundDetails]);

  // ✅ EFECTO PARA RECALCULAR REEMBOLSOS
  useEffect(() => {
    if (open && safeLayaway) {
      loadRefundDetails();
    }
  }, [open, safeLayaway, refundPercentage, refundMethod, loadRefundDetails]);

  // ✅ FUNCIÓN PARA PROCESAR CANCELACIÓN
  const processCancellation = useCallback(async () => {
    if (!safeLayaway || !calculations) return;

    setProcessing(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;

      // Actualizar apartado a cancelado
      const updateData = {
        status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: toMexicoTimestamp(new Date()),
        cancelled_by: userId,
        cancel_reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
        refund_amount: processRefund ? calculations.finalRefund : 0,
        refund_method: processRefund ? refundMethod : null,
        refund_reference: refundReference || null,
        penalty_amount: calculations.penalty,
        notes: notes || null
      };

      const { error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', safeLayaway.id);

      if (updateError) {
        throw updateError;
      }

      // Procesar reembolsos si aplica
      if (processRefund && calculations.finalRefund > 0) {
        const refundData = {
          sale_id: safeLayaway.id,
          refund_amount: calculations.finalRefund,
          refund_method: refundMethod,
          refund_reference: refundReference || null,
          penalty_amount: calculations.penalty,
          commission_refund: calculations.totalCommissionRefund,
          refund_date: toMexicoTimestamp(new Date()),
          created_by: userId,
          reason: cancelReason === 'other' ? customReason : cancelReasons.find(r => r.value === cancelReason)?.label,
          notes: notes || null
        };

        const { error: refundError } = await supabase
          .from('refunds')
          .insert([refundData]);

        if (refundError) {
          console.error('Error registrando reembolso:', refundError);
        }
      }

      // Restaurar stock si aplica
      if (restoreStock && safeLayaway.items.length > 0) {
        for (const item of safeLayaway.items) {
          const restoreQuantity = partialRestore ? Math.floor(item.quantity * 0.8) : item.quantity;
          
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
              })
              .eq('id', item.product_id);

            if (stockError) {
              console.error('Error restaurando stock:', stockError);
            }

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
              }]);
          }
        }
      }

      // Crear historial de cancelación
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

  // ✅ FUNCIONES DE NAVEGACIÓN
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    onClose();
  }, [completed, onSuccess, onClose]);

  const handleNext = useCallback(() => {
    setActiveStep(prev => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  if (!safeLayaway) return null;

  return (
    <Dialog
      open={open}
      onClose={!processing ? handleClose : undefined}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.error}50`,
          borderRadius: 4,
          color: darkProTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
        color: darkProTokens.textPrimary,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: '16px 16px 0 0'
      }}>
        <Avatar sx={{
          background: darkProTokens.textPrimary,
          color: darkProTokens.error,
          width: 56,
          height: 56
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
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!completed ? (
          <Box sx={{ p: 4 }}>
            {/* Información del apartado */}
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
                      <strong>Pendiente:</strong> {formatPrice(safeLayaway.total_amount - safeLayaway.paid_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Alerta de advertencia */}
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
              {/* Stepper */}
              <Grid size={{ xs: 8 }}>
                <Stepper activeStep={activeStep} orientation="vertical">
                  <Step>
                    <StepLabel>Motivo de Cancelación</StepLabel>
                    {activeStep === 0 && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Seleccione el motivo</InputLabel>
                          <Select
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            label="Seleccione el motivo"
                          >
                            {cancelReasons.map((reason) => (
                              <MenuItem key={reason.value} value={reason.value}>
                                <Box>
                                  <Typography variant="body1">{reason.label}</Typography>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    {reason.description}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {cancelReason === 'other' && (
                          <TextField
                            fullWidth
                            label="Especifique el motivo"
                            multiline
                            rows={3}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            sx={{ mb: 3 }}
                          />
                        )}

                        <TextField
                          fullWidth
                          label="Notas adicionales (opcional)"
                          multiline
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                          <Button onClick={handleClose} disabled={processing}>
                            Cancelar
                          </Button>
                          <Button 
                            variant="contained" 
                            onClick={handleNext}
                            disabled={!cancelReason || (cancelReason === 'other' && !customReason)}
                          >
                            Siguiente →
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Step>

                  <Step>
                    <StepLabel>Configurar Reembolso</StepLabel>
                    {activeStep === 1 && (
                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={processRefund}
                              onChange={(e) => setProcessRefund(e.target.checked)}
                            />
                          }
                          label="Procesar reembolso"
                          sx={{ mb: 3 }}
                        />

                        {processRefund && (
                          <>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                              <InputLabel>Método de reembolso</InputLabel>
                              <Select
                                value={refundMethod}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                label="Método de reembolso"
                              >
                                {refundMethods.map((method) => (
                                  <MenuItem key={method.value} value={method.value}>
                                    <Box>
                                      <Typography variant="body1">
                                        {method.icon} {method.label}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                        {method.description}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Porcentaje de reembolso: {refundPercentage}%
                            </Typography>
                            <Slider
                              value={refundPercentage}
                              onChange={(e, value) => setRefundPercentage(value as number)}
                              min={0}
                              max={100}
                              step={5}
                              marks={[
                                { value: 0, label: '0%' },
                                { value: 50, label: '50%' },
                                { value: 100, label: '100%' }
                              ]}
                              valueLabelDisplay="auto"
                              sx={{ mb: 3 }}
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={applyPenalty}
                                  onChange={(e) => setApplyPenalty(e.target.checked)}
                                />
                              }
                              label="Aplicar penalización"
                              sx={{ mb: 2 }}
                            />

                            {applyPenalty && (
                              <TextField
                                fullWidth
                                label="Monto de penalización"
                                type="number"
                                value={penaltyAmount}
                                onChange={(e) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
                                sx={{ mb: 3 }}
                              />
                            )}

                            <TextField
                              fullWidth
                              label="Referencia de reembolso (opcional)"
                              value={refundReference}
                              onChange={(e) => setRefundReference(e.target.value)}
                              sx={{ mb: 3 }}
                            />
                          </>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                          <Button onClick={handleBack}>
                            ← Atrás
                          </Button>
                          <Button variant="contained" onClick={handleNext}>
                            Siguiente →
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Step>

                  <Step>
                    <StepLabel>Configurar Inventario</StepLabel>
                    {activeStep === 2 && (
                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={restoreStock}
                              onChange={(e) => setRestoreStock(e.target.checked)}
                            />
                          }
                          label="Restaurar inventario"
                          sx={{ mb: 3 }}
                        />

                        {restoreStock && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={partialRestore}
                                onChange={(e) => setPartialRestore(e.target.checked)}
                              />
                            }
                            label="Restauración parcial (80%)"
                            sx={{ mb: 3 }}
                          />
                        )}

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                          <Button onClick={handleBack}>
                            ← Atrás
                          </Button>
                          <Button variant="contained" onClick={handleNext}>
                            Confirmar →
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Step>

                  <Step>
                    <StepLabel>Confirmación Final</StepLabel>
                    {activeStep === 3 && (
                      <Box sx={{ mt: 2 }}>
                        <Alert 
                          severity="error"
                          sx={{
                            mb: 3,
                            background: `${darkProTokens.error}20`,
                            border: `1px solid ${darkProTokens.error}30`,
                            color: darkProTokens.textPrimary,
                            '& .MuiAlert-icon': { color: darkProTokens.error }
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
                            onClick={handleBack}
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
                              borderRadius: 3,
                              '&:hover': {
                                background: `linear-gradient(135deg, ${darkProTokens.errorHover}, ${darkProTokens.error})`,
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            {processing ? 'Procesando...' : 'Cancelar Apartado Definitivamente'}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Step>
                </Stepper>
              </Grid>

              {/* Resumen */}
              <Grid size={{ xs: 4 }}>
                <Card sx={{
                  background: `${darkProTokens.info}10`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 3,
                  position: 'sticky',
                  top: 0
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 3, fontWeight: 700 }}>
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
                          backgroundColor: `${darkProTokens.warning}20`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: darkProTokens.warning
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, mt: 1, display: 'block' }}>
                        {Math.round((safeLayaway.paid_amount / safeLayaway.total_amount) * 100)}% completado
                      </Typography>
                    </Box>

                    {calculations && processRefund && (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total apartado:</Typography>
                          <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            {formatPrice(safeLayaway.total_amount)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Total pagado:</Typography>
                          <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            {formatPrice(calculations.totalPaid)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Reembolso base ({refundPercentage}%):</Typography>
                          <Typography variant="body1" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                            {formatPrice(calculations.baseRefund)}
                          </Typography>
                        </Box>

                        {applyPenalty && calculations.penalty > 0 && (
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
                      </Stack>
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
                  </CardContent>
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

      {/* Notificaciones */}
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
            background: `${darkProTokens[notification.severity === 'success' ? 'success' : notification.severity === 'error' ? 'error' : notification.severity === 'warning' ? 'warning' : 'info']}10`,
            border: `1px solid ${darkProTokens[notification.severity === 'success' ? 'success' : notification.severity === 'error' ? 'error' : notification.severity === 'warning' ? 'warning' : 'info']}30`,
            color: darkProTokens.textPrimary,
            '& .MuiAlert-icon': {
              color: darkProTokens[notification.severity === 'success' ? 'success' : notification.severity === 'error' ? 'error' : notification.severity === 'warning' ? 'warning' : 'info']
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}