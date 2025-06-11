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
  Chip,
  Divider,
  CircularProgress,
  Stack,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Close as CloseIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Undo as RefundIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface CancelLayawayDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any; // ✅ Puede ser null/undefined
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

interface LayawayItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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
  const [layawayItems, setLayawayItems] = useState<LayawayItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ CARGAR ITEMS DEL APARTADO
  const loadLayawayItems = useCallback(async () => {
    if (!layaway?.id || !open) {
      setLayawayItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      console.log('🔍 Cargando items para cancelación:', layaway.sale_number, '- 2025-06-11 07:18:28 UTC - luishdz04');

      const { data: items, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', layaway.id);

      if (error) {
        console.error('❌ Error cargando items:', error);
        throw error;
      }

      const safeItems = (items || []).map(item => ({
        ...item,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0
      }));

      setLayawayItems(safeItems);
      console.log('✅ Items cargados para cancelación:', safeItems.length);

    } catch (error) {
      console.error('💥 Error cargando items del apartado:', error);
      if (open) {
        showNotification('Error al cargar los productos del apartado', 'error');
      }
      setLayawayItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [layaway?.id, layaway?.sale_number, open, supabase]);

  // ✅ RESETEAR FORMULARIO CON VALIDACIÓN SEGURA
  useEffect(() => {
    if (open && layaway?.id) {
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
      loadLayawayItems();
    } else {
      // ✅ LIMPIAR ESTADO CUANDO SE CIERRA
      setLayawayItems([]);
      setProcessing(false);
      setErrors({});
      setConfirmCancellation(false);
    }
  }, [open, layaway?.id, layaway?.paid_amount, loadLayawayItems]);

  // ✅ VALIDAR FORMULARIO
  const validateForm = (): boolean => {
    if (!layaway) return false;

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
      if (cancellationData.refundAmount > (layaway.paid_amount || 0)) {
        newErrors.refundAmount = 'El reembolso no puede exceder el monto pagado';
      }
    }

    if (cancellationData.cancelFee < 0) {
      newErrors.cancelFee = 'La penalización no puede ser negativa';
    }

    if (cancellationData.cancelFee > (layaway.paid_amount || 0)) {
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

  // ✅ PROCESAR CANCELACIÓN CORREGIDO
  const handleCancelLayaway = async () => {
    // ✅ VALIDACIÓN SEGURA TEMPRANA
    if (!validateForm() || !layaway?.id) {
      console.log('❌ Validación fallida o layaway inválido');
      return;
    }

    if (!confirmCancellation) {
      setConfirmCancellation(true);
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Iniciando cancelación de apartado...', {
        apartado: layaway.sale_number,
        timestamp: '2025-06-11 07:18:28 UTC',
        usuario: 'luishdz04'
      });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }
      const userId = userData.user.id;

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

      if (updateError) {
        console.error('❌ Error actualizando apartado:', updateError);
        throw updateError;
      }

      console.log('✅ Apartado actualizado a cancelado');

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
            sequence_order: 999, // ✅ Número alto para reembolsos
            payment_date: new Date().toISOString(),
            is_partial_payment: false,
            notes: `Reembolso por cancelación: ${reasonText} - 2025-06-11 07:18:28 UTC por luishdz04`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        console.log('✅ Reembolso registrado:', formatPrice(netRefund));
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
            sequence_order: 998, // ✅ Número alto para penalizaciones
            payment_date: new Date().toISOString(),
            is_partial_payment: false,
            notes: `Penalización por cancelación: ${reasonText} - 2025-06-11 07:18:28 UTC por luishdz04`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        console.log('✅ Penalización registrada:', formatPrice(cancellationData.cancelFee));
      }

      // ✅ RESTABLECER STOCK SI SE SOLICITA - USANDO ITEMS CARGADOS
      if (cancellationData.restockItems && layawayItems.length > 0) {
        console.log('📦 Restableciendo stock de', layawayItems.length, 'productos...');

        for (const item of layawayItems) {
          try {
            // Obtener stock actual del producto
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('current_stock')
              .eq('id', item.product_id)
              .single();

            if (productError) {
              console.error('❌ Error obteniendo producto:', item.product_id, productError);
              continue;
            }

            if (product) {
              const previousStock = product.current_stock || 0;
              const newStock = previousStock + (item.quantity || 0);

              // Actualizar stock
              const { error: stockError } = await supabase
                .from('products')
                .update({
                  current_stock: newStock,
                  updated_at: new Date().toISOString(),
                  updated_by: userId
                })
                .eq('id', item.product_id);

              if (stockError) {
                console.error('❌ Error actualizando stock:', stockError);
                continue;
              }

              // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO
              await supabase
                .from('inventory_movements')
                .insert([{
                  product_id: item.product_id,
                  movement_type: 'entrada',
                  quantity: item.quantity || 0,
                  previous_stock: previousStock,
                  new_stock: newStock,
                  reason: 'Cancelación de apartado',
                  reference_id: layaway.id,
                  notes: `Apartado #${layaway.sale_number} cancelado - Stock restablecido - 2025-06-11 07:18:28 UTC por luishdz04`,
                  created_at: new Date().toISOString(),
                  created_by: userId
                }]);

              console.log(`✅ Stock restablecido para ${item.product_name}: ${previousStock} → ${newStock}`);
            }
          } catch (itemError) {
            console.error('❌ Error procesando item:', item.product_name, itemError);
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
          previous_paid_amount: layaway.paid_amount || 0,
          new_paid_amount: layaway.paid_amount || 0,
          reason: `Cancelado: ${reasonText}${netRefund > 0 ? ` - Reembolso: ${formatPrice(netRefund)}` : ''} - 2025-06-11 07:18:28 UTC por luishdz04`,
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      console.log('✅ Historial de cancelación registrado');

      // ✅ GENERAR CRÉDITO EN TIENDA SI APLICA
      if (cancellationData.refundMethod === 'store_credit' && netRefund > 0 && layaway.customer_id) {
        await supabase
          .from('store_credits')
          .insert([{
            customer_id: layaway.customer_id,
            amount: netRefund,
            balance: netRefund,
            reason: `Reembolso por cancelación de apartado #${layaway.sale_number} - 2025-06-11 07:18:28 UTC`,
            expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
            is_active: true,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        console.log('✅ Crédito en tienda generado:', formatPrice(netRefund));
      }

      showNotification('🎉 Apartado cancelado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      console.error('💥 Error cancelando apartado:', error);
      showNotification('Error al cancelar el apartado: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ✅ VALIDACIÓN TEMPRANA - EVITA ERRORES DE SSR
  if (!layaway) {
    return null;
  }

  // ✅ VALORES SEGUROS PARA EVITAR ERRORES DE NULL
  const safeLayaway = {
    id: layaway.id || '',
    sale_number: layaway.sale_number || 'Sin número',
    total_amount: layaway.total_amount || 0,
    paid_amount: layaway.paid_amount || 0,
    pending_amount: layaway.pending_amount || 0,
    status: layaway.status || 'pending',
    customer_name: layaway.customer_name || 'Cliente General',
    customer_id: layaway.customer_id || '',
    created_at: layaway.created_at || new Date().toISOString(),
    layaway_expires_at: layaway.layaway_expires_at || layaway.expiration_date || ''
  };

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
            ❌ Cancelar Apartado #{safeLayaway.sale_number}
          </Typography>
          {loadingItems && <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />}
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ INDICADOR DE ACTUALIZACIÓN */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Cancelación de apartado - 2025-06-11 07:18:28 UTC - Usuario: luishdz04 - Última validación SSR aplicada
        </Alert>

        {/* Información del apartado CON VALIDACIÓN SEGURA */}
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
                    {formatPrice(safeLayaway.total_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pagado</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPrice(safeLayaway.paid_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {formatPrice(safeLayaway.pending_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Productos</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {loadingItems ? '...' : layawayItems.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(244, 67, 54, 0.2)' }}>
              <Typography variant="body2" color="textSecondary">Cliente:</Typography>
              <Typography variant="body1" fontWeight="600">
                {safeLayaway.customer_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Creado: {formatDate(safeLayaway.created_at)} • Vence: {safeLayaway.layaway_expires_at ? formatDate(safeLayaway.layaway_expires_at) : 'Sin fecha'}
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
              {cancellationData.restockItems && ` Los ${layawayItems.length} productos volverán al inventario.`}
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
                      helperText={errors.refundAmount || `Máximo: ${formatPrice(safeLayaway.paid_amount)}`}
                      inputProps={{ 
                        min: 0, 
                        max: safeLayaway.paid_amount, 
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
                        max: safeLayaway.paid_amount, 
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
                    <Checkbox
                      checked={cancellationData.restockItems}
                      onChange={(e) => setCancellationData(prev => ({ 
                        ...prev, 
                        restockItems: e.target.checked 
                      }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        📦 Restablecer inventario
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Los {layawayItems.length} productos volverán al stock disponible
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Notas de la cancelación (2025-06-11 07:18:28 UTC - luishdz04)"
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
                            {formatPrice(safeLayaway.paid_amount)}
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
          disabled={processing || !validateForm() || loadingItems}
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
           loadingItems ? 'Cargando...' :
           confirmCancellation ? '🚨 CONFIRMAR CANCELACIÓN' : 
           'Cancelar Apartado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
