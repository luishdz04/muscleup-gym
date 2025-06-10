// src/components/dialogs/CancelLayawayDialog.tsx
'use client';

import React, { useState } from 'react';
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
  Chip,
  Divider,
  CircularProgress,
  Stack,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Undo as RefundIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface CancelLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
  onSuccess: () => void;
}

interface CancellationData {
  reason: string;
  customReason: string;
  refundMethod: 'none' | 'cash' | 'store_credit' | 'original_method';
  refundAmount: number;
  restockItems: boolean;
  cancelFee: number;
  notes: string;
}

const cancellationReasons = [
  { value: 'customer_request', label: 'Solicitud del cliente' },
  { value: 'expired', label: 'Apartado vencido' },
  { value: 'no_stock', label: 'Sin stock disponible' },
  { value: 'payment_issues', label: 'Problemas de pago' },
  { value: 'business_policy', label: 'Política de la empresa' },
  { value: 'other', label: 'Otro motivo' }
];

const refundOptions = [
  { value: 'none', label: 'Sin reembolso', description: 'No se realizará ningún reembolso' },
  { value: 'cash', label: 'Efectivo', description: 'Reembolso en efectivo' },
  { value: 'store_credit', label: 'Crédito en tienda', description: 'Generar crédito para futuras compras' },
  { value: 'original_method', label: 'Método original', description: 'Reembolsar por el método de pago original' }
];

export default function CancelLayawayDialog({ 
  open, 
  onClose, 
  layaway, 
  onSuccess 
}: CancelLayawayDialogProps) {
  const [cancellationData, setCancellationData] = useState<CancellationData>({
    reason: '',
    customReason: '',
    refundMethod: 'none',
    refundAmount: 0,
    restockItems: true,
    cancelFee: 0,
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmCancellation, setConfirmCancellation] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ RESETEAR FORMULARIO
  React.useEffect(() => {
    if (open && layaway) {
      setCancellationData({
        reason: '',
        customReason: '',
        refundMethod: 'none',
        refundAmount: layaway.paid_amount || 0,
        restockItems: true,
        cancelFee: 0,
        notes: ''
      });
      setErrors({});
      setConfirmCancellation(false);
    }
  }, [open, layaway]);

  // ✅ VALIDAR FORMULARIO
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cancellationData.reason) {
      newErrors.reason = 'Seleccione un motivo de cancelación';
    }

    if (cancellationData.reason === 'other' && !cancellationData.customReason.trim()) {
      newErrors.customReason = 'Especifique el motivo de cancelación';
    }

    if (cancellationData.refundMethod !== 'none') {
      if (cancellationData.refundAmount < 0) {
        newErrors.refundAmount = 'El monto de reembolso no puede ser negativo';
      }
      if (cancellationData.refundAmount > layaway.paid_amount) {
        newErrors.refundAmount = 'El reembolso no puede exceder el monto pagado';
      }
    }

    if (cancellationData.cancelFee < 0) {
      newErrors.cancelFee = 'La penalización no puede ser negativa';
    }

    if (cancellationData.cancelFee > layaway.paid_amount) {
      newErrors.cancelFee = 'La penalización no puede exceder el monto pagado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ CALCULAR REEMBOLSO NETO
  const getNetRefund = (): number => {
    if (cancellationData.refundMethod === 'none') return 0;
    return Math.max(0, cancellationData.refundAmount - cancellationData.cancelFee);
  };

  // ✅ PROCESAR CANCELACIÓN
  const handleCancelLayaway = async () => {
    if (!validateForm()) return;

    if (!confirmCancellation) {
      setConfirmCancellation(true);
      return;
    }

    setProcessing(true);
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const netRefund = getNetRefund();
      const reasonText = cancellationData.reason === 'other' ? 
        cancellationData.customReason : 
        cancellationReasons.find(r => r.value === cancellationData.reason)?.label;

      // ✅ ACTUALIZAR APARTADO
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'cancelled',
          payment_status: netRefund > 0 ? 'refunded' : 'cancelled',
          cancellation_reason: reasonText,
          cancellation_date: new Date().toISOString(),
          refund_amount: netRefund,
          refund_method: cancellationData.refundMethod,
          cancellation_fee: cancellationData.cancelFee,
          cancelled_by: userId,
          updated_at: new Date().toISOString(),
          updated_by: userId,
          notes: cancellationData.notes.trim() || null
        })
        .eq('id', layaway.id);

      if (updateError) throw updateError;

      // ✅ REGISTRAR REEMBOLSO SI APLICA
      if (netRefund > 0) {
        await supabase
          .from('sale_payment_details')
          .insert([{
            sale_id: layaway.id,
            payment_method: cancellationData.refundMethod,
            amount: -netRefund, // Negativo para indicar reembolso
            payment_reference: `REFUND-${layaway.sale_number}`,
            commission_rate: 0,
            commission_amount: 0,
            sequence_order: (layaway.payment_history?.length || 0) + 1,
            payment_date: new Date().toISOString(),
            is_partial_payment: false,
            notes: `Reembolso por cancelación: ${reasonText}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      // ✅ REGISTRAR PENALIZACIÓN SI APLICA
      if (cancellationData.cancelFee > 0) {
        await supabase
          .from('sale_payment_details')
          .insert([{
            sale_id: layaway.id,
            payment_method: 'fee',
            amount: cancellationData.cancelFee,
            payment_reference: `FEE-${layaway.sale_number}`,
            commission_rate: 0,
            commission_amount: 0,
            sequence_order: (layaway.payment_history?.length || 0) + 2,
            payment_date: new Date().toISOString(),
            is_partial_payment: false,
            notes: `Penalización por cancelación: ${reasonText}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      // ✅ RESTABLECER STOCK SI SE SOLICITA
      if (cancellationData.restockItems && layaway.items) {
        for (const item of layaway.items) {
          // Obtener stock actual del producto
          const { data: product } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = product.current_stock + item.quantity;

            // Actualizar stock
            const { error: stockError } = await supabase
              .from('products')
              .update({
                current_stock: newStock,
                updated_at: new Date().toISOString(),
                updated_by: userId
              })
              .eq('id', item.product_id);

            if (stockError) throw stockError;

            // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO
            await supabase
              .from('inventory_movements')
              .insert([{
                product_id: item.product_id,
                movement_type: 'entrada',
                quantity: item.quantity,
                previous_stock: product.current_stock,
                new_stock: newStock,
                reason: 'Cancelación de apartado',
                reference_id: layaway.id,
                notes: `Apartado #${layaway.sale_number} cancelado - Stock restablecido`,
                created_at: new Date().toISOString(),
                created_by: userId
              }]);
          }
        }
      }

      // ✅ REGISTRAR HISTORIAL DE CAMBIO
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: 'pending',
          new_status: 'cancelled',
          previous_paid_amount: layaway.paid_amount,
          new_paid_amount: layaway.paid_amount,
          reason: `Cancelado: ${reasonText}${netRefund > 0 ? ` - Reembolso: ${formatPrice(netRefund)}` : ''}`,
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      // ✅ GENERAR CRÉDITO EN TIENDA SI APLICA
      if (cancellationData.refundMethod === 'store_credit' && netRefund > 0) {
        await supabase
          .from('store_credits')
          .insert([{
            customer_id: layaway.customer_id,
            amount: netRefund,
            balance: netRefund,
            reason: `Reembolso por cancelación de apartado #${layaway.sale_number}`,
            expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
            is_active: true,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      showNotification('Apartado cancelado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error cancelling layaway:', error);
      showNotification('Error al cancelar el apartado', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (!layaway) return null;

  const netRefund = getNetRefund();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f44336, #d32f2f)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CancelIcon />
          <Typography variant="h6" fontWeight="bold">
            ❌ Cancelar Apartado #{layaway.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Información del apartado */}
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.05))',
          border: '2px solid rgba(244, 67, 54, 0.3)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#f44336', fontWeight: 700 }}>
              ⚠️ Información del Apartado a Cancelar
            </Typography>

            <Grid container spacing={3}>
            <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(layaway.total_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pagado</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPrice(layaway.paid_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {formatPrice(layaway.pending_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Productos</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {layaway.items?.length || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(244, 67, 54, 0.2)' }}>
              <Typography variant="body2" color="textSecondary">Cliente:</Typography>
              <Typography variant="body1" fontWeight="600">
                {layaway.customer_name || 'Cliente General'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Creado: {formatDate(layaway.created_at)} • Vence: {formatDate(layaway.expiration_date)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Alerta de confirmación */}
        {confirmCancellation && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="600">
              🚨 CONFIRMACIÓN REQUERIDA
            </Typography>
            <Typography variant="body2">
              Esta acción <strong>no se puede deshacer</strong>. El apartado será cancelado permanentemente.
              {netRefund > 0 && ` Se procesará un reembolso de ${formatPrice(netRefund)}.`}
              {cancellationData.restockItems && ' Los productos volverán al inventario.'}
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Motivo de cancelación */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#f44336', fontWeight: 700 }}>
                  📝 Motivo de Cancelación
                </Typography>

                <FormControl fullWidth error={!!errors.reason} sx={{ mb: 2 }}>
                  <InputLabel>Motivo de Cancelación</InputLabel>
                  <Select
                    value={cancellationData.reason}
                    onChange={(e) => setCancellationData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                  >
                    {cancellationReasons.map((reason) => (
                      <MenuItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {cancellationData.reason === 'other' && (
                  <TextField
                    fullWidth
                    label="Especificar motivo"
                    value={cancellationData.customReason}
                    onChange={(e) => setCancellationData(prev => ({ 
                      ...prev, 
                      customReason: e.target.value 
                    }))}
                    error={!!errors.customReason}
                    helperText={errors.customReason}
                    placeholder="Describa el motivo específico de la cancelación..."
                    multiline
                    rows={2}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opciones de reembolso */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#f44336', fontWeight: 700 }}>
                  💰 Política de Reembolso
                </Typography>

                <RadioGroup
                  value={cancellationData.refundMethod}
                  onChange={(e) => setCancellationData(prev => ({ 
                    ...prev, 
                    refundMethod: e.target.value as any 
                  }))}
                >
                  {refundOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="600">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>

                {cancellationData.refundMethod !== 'none' && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Monto a Reembolsar"
                      type="number"
                      value={cancellationData.refundAmount}
                      onChange={(e) => setCancellationData(prev => ({ 
                        ...prev, 
                        refundAmount: parseFloat(e.target.value) || 0 
                      }))}
                      error={!!errors.refundAmount}
                      helperText={errors.refundAmount || `Máximo: ${formatPrice(layaway.paid_amount)}`}
                      inputProps={{ 
                        min: 0, 
                        max: layaway.paid_amount, 
                        step: 0.01 
                      }}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Penalización por Cancelación"
                      type="number"
                      value={cancellationData.cancelFee}
                      onChange={(e) => setCancellationData(prev => ({ 
                        ...prev, 
                        cancelFee: parseFloat(e.target.value) || 0 
                      }))}
                      error={!!errors.cancelFee}
                      helperText={errors.cancelFee}
                      inputProps={{ 
                        min: 0, 
                        max: layaway.paid_amount, 
                        step: 0.01 
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Opciones adicionales */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#f44336', fontWeight: 700 }}>
                  ⚙️ Opciones Adicionales
                </Typography>

                <FormControlLabel
                  control={
                    <input
                      type="checkbox"
                      checked={cancellationData.restockItems}
                      onChange={(e) => setCancellationData(prev => ({ 
                        ...prev, 
                        restockItems: e.target.checked 
                      }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        📦 Restablecer inventario
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Los productos volverán al stock disponible
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Notas de la cancelación"
                  multiline
                  rows={4}
                  value={cancellationData.notes}
                  onChange={(e) => setCancellationData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Información adicional sobre la cancelación..."
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen financiero */}
          {cancellationData.refundMethod !== 'none' && (
           <Grid size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
                  border: '2px solid rgba(255, 152, 0, 0.3)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 700 }}>
                      📊 Resumen Financiero
                    </Typography>

                    <Grid container spacing={3}>
                    <Grid size={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">Pagado Originalmente</Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {formatPrice(layaway.paid_amount)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">Monto a Reembolsar</Typography>
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {formatPrice(cancellationData.refundAmount)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">Penalización</Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            -{formatPrice(cancellationData.cancelFee)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={3}>
                        <Box sx={{ 
                          textAlign: 'center',
                          p: 2,
                          background: 'rgba(255, 152, 0, 0.2)',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="textSecondary">REEMBOLSO NETO</Typography>
                          <Typography variant="h5" fontWeight="800" color="primary">
                            {formatPrice(netRefund)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={processing}
          variant="outlined"
          size="large"
        >
          Cancelar
        </Button>

        <Button
          onClick={handleCancelLayaway}
          disabled={processing || !validateForm()}
          variant="contained"
          size="large"
          color={confirmCancellation ? "error" : "warning"}
          startIcon={processing ? <CircularProgress size={20} /> : confirmCancellation ? <WarningIcon /> : <CancelIcon />}
          sx={{
            background: confirmCancellation ? 
              'linear-gradient(135deg, #f44336, #d32f2f)' :
              'linear-gradient(135deg, #ff9800, #f57c00)',
            fontWeight: 'bold',
            px: 4
          }}
        >
          {processing ? 'Cancelando...' : 
           confirmCancellation ? '🚨 CONFIRMAR CANCELACIÓN' : 
           'Cancelar Apartado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}