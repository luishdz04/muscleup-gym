// components/pos/PaymentDialog.tsx - VERSIÓN COMPLETA v7.0 CON TIPOS INTEGRADOS

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Alert,
  InputAdornment,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS CENTRALIZADOS COMPLETOS v7.0
import { 
  Product, 
  CartItem, 
  Customer, 
  Coupon, 
  Totals, 
  PaymentMethod,
  PAYMENT_METHODS,
  SaleItem,
  SalePaymentDetail,
  InventoryMovement,
  PaymentCommission
} from '@/types/pos';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  coupon: Coupon | null;
  totals: Totals;
  onSuccess: () => void;
}

interface PaymentMethodForm {
  method: string;
  amount: number;
  reference?: string;
}

// ✅ CONSTANTES ENTERPRISE v7.0 CON VALORES CORRECTOS BD
const PAYMENT_METHODS_FALLBACK = [
  { value: 'efectivo', label: 'Efectivo', icon: MoneyIcon },
  { value: 'transferencia', label: 'Transferencia', icon: BankIcon },
  { value: 'debito', label: 'Tarjeta Débito', icon: CardIcon },
  { value: 'credito', label: 'Tarjeta Crédito', icon: CardIcon }
] as const;

const EPSILON = 0.001; // Para comparaciones de punto flotante

export default function PaymentDialog({
  open,
  onClose,
  cart,
  customer,
  coupon,
  totals,
  onSuccess
}: PaymentDialogProps) {
  // ✅ HOOKS ENTERPRISE v7.0
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  // ✅ CARGAR COMISIONES DINÁMICAMENTE DESDE BD
  const {
    data: paymentCommissions,
    loading: commissionsLoading,
    error: commissionsError
  } = useEntityCRUD<PaymentCommission>({
    tableName: 'payment_commissions',
    selectQuery: '*'
  });
  
  // ✅ ESTADOS REACTIVOS
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([
    { method: 'efectivo', amount: 0 }
  ]);
  const [processing, setProcessing] = useState(false);
  const [mixedPayment, setMixedPayment] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // ✅ FORMATEAR PRECIO - ESTABLE
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ OBTENER TASA DE COMISIÓN - DINÁMICO DESDE BD
  const getCommissionRate = useCallback((paymentMethod: string): number => {
    if (commissionsLoading || !paymentCommissions || commissionsError) return 0;
    const commission = paymentCommissions.find(
      (c: PaymentCommission) => c.payment_method === paymentMethod && c.is_active === true
    );
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissions, commissionsLoading, commissionsError]);

  // ✅ MÉTODOS DISPONIBLES - DINÁMICOS DESDE BD CON FALLBACK
  const availablePaymentMethods = useMemo(() => {
    if (!paymentCommissions || commissionsError) {
      return PAYMENT_METHODS_FALLBACK;
    }
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

  // ✅ CÁLCULOS PRINCIPALES - LÓGICA FINAL Y SIMPLIFICADA
  const totalPayments = useMemo(() => {
    return Math.round(paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0) * 100) / 100;
  }, [paymentMethods]);

  const totalCommissions = useMemo(() => {
    const calculatedCommission = totalPayments - totals.total;
    if (calculatedCommission < -EPSILON) return 0;
    return Math.round(calculatedCommission * 100) / 100;
  }, [totalPayments, totals.total]);

  const finalTotal = useMemo(() => {
    return Math.round((totals.total + totalCommissions) * 100) / 100;
  }, [totals.total, totalCommissions]);

  const changeAmount = useMemo(() => {
    return Math.max(0, Math.round((totalPayments - finalTotal) * 100) / 100);
  }, [totalPayments, finalTotal]);

  const canProcessPayment = useMemo(() => {
    return (
      cart.length > 0 &&
      totalPayments >= (finalTotal - EPSILON) &&
      !processing &&
      !commissionsLoading
    );
  }, [cart.length, totalPayments, finalTotal, processing, commissionsLoading]);

  // ✅ FUNCIONES DE MANIPULACIÓN
  const addPaymentMethod = useCallback(() => {
    setPaymentMethods(prev => [...prev, { method: 'efectivo', amount: 0 }]);
  }, []);

  const removePaymentMethod = useCallback((index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 🎯 CEREBRO DE LA OPERACIÓN: LÓGICA DE CANDADOS SIMPLIFICADA
  const updatePaymentMethod = useCallback(
    (index: number, field: keyof PaymentMethodForm, value: any) => {
      if (!mixedPayment) {
        // MODO INDIVIDUAL: Monto siempre bloqueado, se auto-calcula al cambiar método
        if (field === 'method') {
          const newMethod = value;
          const rate = getCommissionRate(newMethod);
          let newFinalTotal = totals.total;
          if (rate > 0) {
            newFinalTotal = totals.total / (1 - rate / 100);
          }
          const roundedFinalTotal = Math.round(newFinalTotal * 100) / 100;
          setPaymentMethods([{ method: newMethod, amount: roundedFinalTotal }]);
        }
      } else {
        // MODO MIXTO: Lógica de cascada simplificada
        let updatedMethods = paymentMethods.map((pm, i) => 
          i === index ? { 
            ...pm, 
            [field]: field === 'amount' ? Math.round((Number(value) || 0) * 100) / 100 : value 
          } : pm
        );

        if (paymentMethods.length >= 2) {
          const primaryMethod = updatedMethods[0];
          const secondaryMethod = updatedMethods[1];

          // El monto del primer método se considera un pago "neto" directo
          const netValueCovered = primaryMethod.amount || 0;
          const netValueRemaining = Math.max(0, totals.total - netValueCovered);

          if (netValueRemaining > 0) {
            const secondaryRate = getCommissionRate(secondaryMethod.method);
            let secondaryGrossAmount = netValueRemaining;
            if (secondaryRate > 0) {
              secondaryGrossAmount = netValueRemaining / (1 - secondaryRate / 100);
            }
            updatedMethods[1] = { 
              ...secondaryMethod, 
              amount: Math.round(secondaryGrossAmount * 100) / 100 
            };
          } else {
            updatedMethods[1] = { ...secondaryMethod, amount: 0 };
          }
        }
        setPaymentMethods(updatedMethods);
      }
    },
    [mixedPayment, totals.total, getCommissionRate, paymentMethods]
  );
  
  const setQuickPayment = useCallback(() => {
    const rate = getCommissionRate('efectivo');
    const finalAmount = totals.total / (1 - rate / 100);
    setPaymentMethods([{
      method: 'efectivo',
      amount: Math.round(finalAmount * 100) / 100
    }]);
    setMixedPayment(false);
  }, [totals.total, getCommissionRate]);

  // ✅ CERRAR DIÁLOGO
  const handleClose = useCallback(() => {
    if (processing) return;
    
    setPaymentMethods([{ method: 'efectivo', amount: 0 }]);
    setMixedPayment(false);
    setProcessing(false);
    setNetworkError(null);
    onClose();
  }, [onClose, processing]);

  // ✅ PROCESAR PAGO - LÓGICA BD COMPLETA v7.0
  const processPayment = useCallback(async () => {
    if (!canProcessPayment) return;
    
    setProcessing(true);
    setNetworkError(null);
    
    try {
      const currentCashier = await getCurrentUser();
      if (!currentCashier) {
        throw new Error('No se pudo identificar al cajero actual');
      }

      const saleNumber = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // ✅ DATOS DE VENTA - sales table (updated_only según useUserTracking)
      const saleData = {
        sale_number: saleNumber,
        customer_id: customer?.id || null,
        cashier_id: currentCashier,
        sale_type: 'sale', // ✅ CORRECTO: venta directa POS
        subtotal: Math.round(totals.subtotal * 100) / 100,
        tax_amount: Math.round(totals.taxAmount * 100) / 100,
        discount_amount: Math.round(totals.discountAmount * 100) / 100,
        coupon_discount: Math.round(totals.couponDiscount * 100) / 100,
        coupon_code: coupon?.code || null,
        total_amount: finalTotal,
        paid_amount: totalPayments,
        change_amount: changeAmount,
        status: 'completed', // ✅ INMEDIATAMENTE COMPLETADA
        payment_status: 'paid',
        is_mixed_payment: mixedPayment,
        payment_received: totalPayments,
        commission_rate: totals.total > 0 ? Math.round((totalCommissions / totals.total * 100) * 100) / 100 : 0,
        commission_amount: totalCommissions,
        receipt_printed: false,
        completed_at: getCurrentTimestamp()
      };

      // ✅ INSERTAR VENTA (NO AUDITORÍA - ES updated_only)
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // ✅ INSERTAR ITEMS DE VENTA (NO AUDITORÍA)
      const saleItemsData = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku, // ✅ CORREGIDO: undefined en lugar de null
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price * 100) / 100,
        total_price: Math.round(item.total_price * 100) / 100,
        discount_amount: Math.round((item.discount_amount || 0) * 100) / 100,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: Math.round((item.tax_amount || 0) * 100) / 100
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // ✅ INSERTAR DETALLES DE PAGO CON AUDITORÍA (created_by)
      const paymentDetailsData = await Promise.all(
        paymentMethods.map(async (pm, index) => {
          const commissionRate = getCommissionRate(pm.method);
          const commissionAmount = (pm.amount || 0) * commissionRate / 100;
          
          const baseData = {
            sale_id: sale.id,
            payment_method: pm.method,
            amount: Math.round((pm.amount || 0) * 100) / 100,
            payment_reference: pm.reference || null,
            commission_rate: commissionRate,
            commission_amount: Math.round(commissionAmount * 100) / 100,
            sequence_order: index + 1,
            payment_date: getCurrentTimestamp(),
            is_partial_payment: false,
            payment_sequence: index + 1,
            notes: null
          };

          // Aplicar auditoría created_by para sale_payment_details
          return await addAuditFieldsFor('sale_payment_details', baseData, false);
        })
      );

      const { error: paymentsError } = await supabase
        .from('sale_payment_details')
        .insert(paymentDetailsData);

      if (paymentsError) throw paymentsError;

      // ✅ ACTUALIZAR INVENTARIO CON AUDITORÍA (products usa snake_case)
      for (const item of cart) {
        const newStock = Math.max(0, item.product.current_stock - item.quantity);
        
        const productUpdateData = await addAuditFieldsFor('products', {
          current_stock: newStock
        }, true);

        const { error: stockError } = await supabase
          .from('products')
          .update(productUpdateData)
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // ✅ MOVIMIENTO DE INVENTARIO (NO AUDITORÍA)
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product.id,
            movement_type: 'salida', // ✅ CORRECTO: 'salida' para ventas según constraint BD
            quantity: -item.quantity, // ✅ NEGATIVO para salidas
            previous_stock: item.product.current_stock,
            new_stock: newStock,
            unit_cost: item.product.cost_price || 0,
            total_cost: (item.product.cost_price || 0) * item.quantity,
            reason: 'Venta POS',
            reference_id: sale.id,
            notes: `Venta ${saleNumber} - ${item.product.name}`,
            created_at: getCurrentTimestamp(),
            created_by: currentCashier
          });

        if (movementError) {
          console.error('Error en movimiento de inventario:', movementError);
          throw new Error(`Error actualizando inventario: ${movementError.message}`);
        }
      }

      // ✅ ACTUALIZAR CUPÓN SI APLICA (created_only según useUserTracking)
      if (coupon) {
        const { error: couponError } = await supabase
          .from('coupons')
          .update({
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: getCurrentTimestamp()
          })
          .eq('id', coupon.id);

        if (couponError) throw couponError;
      }

      // ✅ NOTIFICACIÓN DE ÉXITO CON BRANDING MUSCLEUP
      notify.success(`✅ Venta completada: ${saleNumber}`);
      onSuccess();
      handleClose();

    } catch (error: any) {
      console.error('Error processing payment:', error);
      const errorMsg = error.message || 'Error desconocido al procesar el pago';
      setNetworkError(errorMsg);
      
      // ✅ NOTIFICACIÓN DE ERROR ESPECÍFICA
      if (errorMsg.includes('inventory_movements_movement_type_check')) {
        notify.error('Error de configuración en inventario. Contacta al administrador.');
      } else if (errorMsg.includes('constraint')) {
        notify.error('Error de validación en base de datos. Verifica los datos.');
      } else {
        notify.error(`Error: ${errorMsg}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [
    canProcessPayment, customer, totals, finalTotal, totalPayments, changeAmount, 
    mixedPayment, totalCommissions, coupon, cart, paymentMethods, getCommissionRate,
    addAuditFieldsFor, getCurrentUser, supabase, onSuccess, handleClose
  ]);

  // ✅ EFECTOS DE CONFIGURACIÓN
  useEffect(() => {
    if (open && totals.total > 0 && !commissionsLoading) {
      setQuickPayment();
    }
  }, [open, totals.total, commissionsLoading, setQuickPayment]);

  useEffect(() => {
    if (mixedPayment) {
      if (paymentMethods.length === 1) {
        setPaymentMethods([
          { method: 'efectivo', amount: totals.total },
          { method: 'debito', amount: 0 }
        ]);
      }
    } else {
      if (paymentMethods.length > 1) {
        setQuickPayment();
      }
    }
  }, [mixedPayment, totals.total, setQuickPayment, paymentMethods.length]);

  // ✅ SSR SAFETY MUSCLEUP v7.0
  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
            <Typography sx={{ color: colorTokens.textSecondary }}>
              Cargando MuscleUp POS...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          color: colorTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${colorTokens.border}`,
          minHeight: '80vh'
        }
      }}
    >
      {/* ✅ HEADER CON BRANDING MUSCLEUP */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
        color: colorTokens.textPrimary,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <PaymentIcon sx={{ fontSize: 28 }} />
        Procesar Pago
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={commissionsLoading ? 'Calculando...' : formatPrice(finalTotal)}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: colorTokens.textPrimary,
              fontWeight: 700,
              fontSize: '1rem'
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ ALERTAS DE ERROR CON MEJORES MENSAJES */}
        {commissionsError && (
          <Alert severity="error" sx={{ mb: 3 }} icon={<WarningIcon />}>
            <Typography variant="body2">
              Error al cargar comisiones de pago. Usando tarifas por defecto.
            </Typography>
          </Alert>
        )}

        {networkError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setNetworkError(null)}>
            <Typography variant="body2" fontWeight={600}>
              {networkError.includes('constraint') 
                ? '⚠️ Error de validación BD - Contacta al administrador' 
                : networkError
              }
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ✅ RESUMEN DE VENTA */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: colorTokens.textPrimary }}>
                Resumen de Venta
              </Typography>

              {customer && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: `${colorTokens.success}10`, borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    Cliente: {customer.firstName} {customer.lastName || ''}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {customer.email || customer.whatsapp}
                  </Typography>
                </Box>
              )}

              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {cart.map(item => (
                  <ListItem key={item.product.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.product.name}
                      secondary={`${item.quantity} x ${formatPrice(item.unit_price)}`}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 600,
                        sx: { color: colorTokens.textPrimary }
                      }}
                      secondaryTypographyProps={{ 
                        variant: 'caption',
                        sx: { color: colorTokens.textSecondary }
                      }}
                    />
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                      {formatPrice(item.total_price)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2, borderColor: colorTokens.divider }} />

              <Box sx={{ space: 1 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: colorTokens.textSecondary }}>Subtotal:</Typography>
                  <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(totals.subtotal)}</Typography>
                </Box>
                
                {totals.taxAmount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography sx={{ color: colorTokens.textSecondary }}>IVA:</Typography>
                    <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(totals.taxAmount)}</Typography>
                  </Box>
                )}
                
                {(totals.discountAmount + totals.couponDiscount) > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography sx={{ color: colorTokens.danger }}>Descuentos:</Typography>
                    <Typography sx={{ color: colorTokens.danger }}>
                      -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                    </Typography>
                  </Box>
                )}

                {totalCommissions > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography sx={{ color: colorTokens.warning }}>Comisiones:</Typography>
                    <Typography sx={{ color: colorTokens.warning }}>
                      +{formatPrice(totalCommissions)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1, borderColor: colorTokens.divider }} />
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    TOTAL:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                    {formatPrice(finalTotal)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* ✅ MÉTODOS DE PAGO */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 2
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                  Métodos de Pago
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mixedPayment}
                      onChange={(e) => setMixedPayment(e.target.checked)}
                      disabled={commissionsLoading || processing}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colorTokens.brand
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: colorTokens.brand
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Pago Mixto
                    </Typography>
                  }
                />
              </Box>

              {/* ✅ BOTÓN PAGO EXACTO */}
              <Button
                variant="outlined"
                fullWidth
                onClick={setQuickPayment}
                disabled={commissionsLoading || processing}
                startIcon={commissionsLoading ? <CircularProgress size={16} /> : <MoneyIcon />}
                sx={{ 
                  mb: 2,
                  borderColor: commissionsLoading ? colorTokens.textMuted : colorTokens.brand,
                  color: commissionsLoading ? colorTokens.textMuted : colorTokens.brand,
                  '&:hover': {
                    backgroundColor: colorTokens.hoverOverlay,
                    borderColor: colorTokens.brand
                  }
                }}
              >
                {commissionsLoading 
                  ? 'Cargando comisiones...' 
                  : `Pago Exacto: ${formatPrice(finalTotal)}`
                }
              </Button>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {paymentMethods.map((pm, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      background: colorTokens.surfaceLevel2,
                      border: `1px solid ${colorTokens.border}`
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ color: colorTokens.textSecondary }}>Método</InputLabel>
                          {commissionsLoading ? (
                            <Skeleton height={40} />
                          ) : (
                            <Select
                              value={pm.method}
                              label="Método"
                              onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                              disabled={processing || (mixedPayment && index === 0)}
                              sx={{
                                color: colorTokens.textPrimary,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: colorTokens.border
                                }
                              }}
                            >
                              {availablePaymentMethods.map(method => (
                                <MenuItem key={method.value} value={method.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <method.icon sx={{ fontSize: 16 }} />
                                    {method.label}
                                    {'commission' in method && method.commission > 0 && (
                                      <Chip 
                                        label={`+${method.commission}%`}
                                        size="small"
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid size={{ xs: 8, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Monto"
                          value={pm.amount || ''}
                          onChange={(e) => updatePaymentMethod(index, 'amount', e.target.value)}
                          disabled={commissionsLoading || processing || (!mixedPayment ? true : index > 0)}
                          inputProps={{
                            step: "0.01",
                            min: "0"
                          }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            sx: { 
                              color: colorTokens.textPrimary,
                              backgroundColor: (!mixedPayment || index > 0) ? `${colorTokens.neutral300}20` : 'transparent'
                            }
                          }}
                          helperText={
                            !mixedPayment 
                              ? "Auto-calculado" 
                              : index === 0 
                                ? "Ingresa monto del cliente" 
                                : "Auto-calculado"
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 4, sm: 2 }}>
                        {paymentMethods.length > 1 && (
                          <IconButton
                            onClick={() => removePaymentMethod(index)}
                            disabled={processing}
                            sx={{ color: colorTokens.danger }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>

                      {pm.method !== 'efectivo' && (
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Referencia (opcional)"
                            value={pm.reference || ''}
                            onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                            disabled={processing}
                            InputProps={{
                              sx: { color: colorTokens.textPrimary }
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>

                    {/* ✅ ALERTA DE COMISIÓN */}
                    {pm.amount > 0 && getCommissionRate(pm.method) > 0 && (
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {(() => {
                          const rate = getCommissionRate(pm.method);
                          const commissionAmount = (pm.amount * rate) / 100;
                          return `Comisión ${rate}%: ${formatPrice(commissionAmount)}`;
                        })()}
                      </Alert>
                    )}
                  </Paper>
                ))}
              </Box>

              {/* ✅ BOTÓN DE PAGO MIXTO */}
              {mixedPayment && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPaymentMethod}
                  fullWidth
                  disabled={commissionsLoading || processing}
                  sx={{
                    mt: 1,
                    borderColor: colorTokens.info,
                    color: colorTokens.info,
                    '&:hover': {
                      backgroundColor: `${colorTokens.info}10`,
                      borderColor: colorTokens.info
                    }
                  }}
                >
                  Agregar Método de Pago
                </Button>
              )}

              {/* ✅ RESUMEN FINAL */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: `${colorTokens.brand}10`, borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Total a Pagar:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    {formatPrice(finalTotal)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Total Pagado:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ 
                    color: totalPayments >= (finalTotal - EPSILON) ? colorTokens.success : colorTokens.warning 
                  }}>
                    {formatPrice(totalPayments)}
                  </Typography>
                </Box>

                {changeAmount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Cambio:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.success }}>
                      {formatPrice(changeAmount)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* ✅ VALIDACIONES */}
              {totalPayments < (finalTotal - EPSILON) && !commissionsLoading && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Falta por pagar: {formatPrice(finalTotal - totalPayments)}
                </Alert>
              )}

              {mixedPayment && totalCommissions > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Pago Mixto:</strong> Total productos {formatPrice(totals.total)} + 
                    comisiones {formatPrice(totalCommissions)} = {formatPrice(finalTotal)}
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          disabled={processing}
          sx={{
            color: colorTokens.textSecondary,
            '&:hover': {
              backgroundColor: colorTokens.hoverOverlay,
              color: colorTokens.textPrimary
            }
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={processPayment}
          disabled={!canProcessPayment}
          variant="contained"
          startIcon={processing ? <CircularProgress size={16} /> : <SuccessIcon />}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
            color: colorTokens.textPrimary,
            fontWeight: 'bold',
            px: 4,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.successHover}, ${colorTokens.success})`
            },
            '&:disabled': {
              background: colorTokens.neutral600,
              color: colorTokens.textMuted
            }
          }}
        >
          {processing 
            ? 'Procesando...' 
            : commissionsLoading 
              ? 'Calculando...'
              : `Cobrar ${formatPrice(finalTotal)}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}