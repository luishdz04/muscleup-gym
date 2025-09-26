// components/pos/LayawayDialog.tsx - VERSIÓN CORREGIDA v7.0 CON TIPOS INTEGRADOS

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
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  Close as CloseIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  getCurrentTimestamp, 
  getTodayInMexico,
  addDaysToDate
} from '@/utils/dateUtils';
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
  PaymentCommission,
  SaleItem,
  SalePaymentDetail,
  InventoryMovement,
  LayawayStatusHistory,
  PAYMENT_METHODS,
  SALE_STATUSES,
  PAYMENT_STATUSES,
  MOVEMENT_TYPES
} from '@/types/pos';

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  coupon: Coupon | null;
  totals: Totals;
  onSuccess: () => void;
}

// ✅ TIPOS DE PAGO PARA DEPÓSITO
interface PaymentMethodForm {
  method: string;
  amount: number;
  reference?: string;
}

// ✅ CONSTANTES ENTERPRISE v7.0
const DEPOSIT_PERCENTAGES = [30, 40, 50, 60, 70] as const;
const LAYAWAY_DURATIONS = [
  { days: 7, label: '7 días' },
  { days: 15, label: '15 días' },
  { days: 30, label: '30 días' },
  { days: 45, label: '45 días' },
  { days: 60, label: '60 días' }
] as const;

// ✅ MÉTODOS DE PAGO FALLBACK
const PAYMENT_METHODS_FALLBACK = [
  { value: 'efectivo', label: 'Efectivo', icon: MoneyIcon },
  { value: 'transferencia', label: 'Transferencia', icon: BankIcon },
  { value: 'debito', label: 'Tarjeta Débito', icon: CardIcon },
  { value: 'credito', label: 'Tarjeta Crédito', icon: CardIcon }
] as const;

export default function LayawayDialog({
  open,
  onClose,
  cart,
  customer,
  coupon,
  totals,
  onSuccess
}: LayawayDialogProps) {
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
  
  // ✅ ESTADOS PRINCIPALES v7.0
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [layawayDays, setLayawayDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // ✅ ESTADOS DE PAGO DEL DEPÓSITO
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([
    { method: 'efectivo', amount: 0 }
  ]);
  const [mixedPayment, setMixedPayment] = useState(false);
  const [showCardOptions, setShowCardOptions] = useState(false);

  // ✅ FORMATEAR PRECIO ESTABLE v7.0
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ OBTENER COMISIÓN DE PAGO
  const getCommissionRate = useCallback((paymentMethod: string): number => {
    if (commissionsLoading || !paymentCommissions || commissionsError) return 0;
    const commission = paymentCommissions.find(
      (c: PaymentCommission) => c.payment_method === paymentMethod && c.is_active === true
    );
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissions, commissionsLoading, commissionsError]);

  // ✅ MÉTODOS DE PAGO DISPONIBLES
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

  // ✅ CÁLCULOS PRINCIPALES
  const depositAmount = useMemo(() => {
    return Math.round((totals.total * depositPercentage / 100) * 100) / 100;
  }, [totals.total, depositPercentage]);

  const pendingAmount = useMemo(() => {
    return Math.round((totals.total - depositAmount) * 100) / 100;
  }, [totals.total, depositAmount]);

  const expirationDate = useMemo(() => {
    const today = getTodayInMexico();
    return addDaysToDate(today, layawayDays);
  }, [layawayDays]);

  // ✅ CÁLCULOS DE PAGO DEL DEPÓSITO
  const totalPayments = useMemo(() => {
    return Math.round(paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0) * 100) / 100;
  }, [paymentMethods]);

  const totalCommissions = useMemo(() => {
    const calculatedCommission = totalPayments - depositAmount;
    if (calculatedCommission < -0.001) return 0;
    return Math.round(calculatedCommission * 100) / 100;
  }, [totalPayments, depositAmount]);

  const finalDepositTotal = useMemo(() => {
    return Math.round((depositAmount + totalCommissions) * 100) / 100;
  }, [depositAmount, totalCommissions]);

  const changeAmount = useMemo(() => {
    return Math.max(0, Math.round((totalPayments - finalDepositTotal) * 100) / 100);
  }, [totalPayments, finalDepositTotal]);

  // ✅ VALIDACIONES
  const canCreateLayaway = useMemo(() => {
    return (
      customer !== null &&
      cart.length > 0 &&
      depositAmount > 0 &&
      !processing &&
      totalPayments >= (finalDepositTotal - 0.001)
    );
  }, [customer, cart.length, depositAmount, processing, totalPayments, finalDepositTotal]);

  // ✅ LIMPIAR ESTADO DE PAGO MIXTO
  const resetToSimplePayment = useCallback((method: string) => {
    setMixedPayment(false);
    const rate = getCommissionRate(method);
    let amount = depositAmount;
    if (rate > 0) {
      amount = depositAmount / (1 - rate / 100);
    }
    setPaymentMethods([{ method, amount: Math.round(amount * 100) / 100 }]);
  }, [depositAmount, getCommissionRate]);

  // ✅ MANEJO DE MÉTODOS DE PAGO - IGUAL QUE PAYMENTDIALOG
  const updatePaymentMethod = useCallback((index: number, field: keyof PaymentMethodForm, value: any) => {
    if (!mixedPayment && field === 'method') {
      // Modo individual: resetear completamente y auto-calcular
      resetToSimplePayment(value);
    } else if (mixedPayment) {
      // MODO MIXTO: Aplicar misma lógica que PaymentDialog
      let updatedMethods = paymentMethods.map((pm, i) => 
        i === index ? { 
          ...pm, 
          [field]: field === 'amount' ? Math.round((Number(value) || 0) * 100) / 100 : value 
        } : pm
      );

      // ✅ LÓGICA DE CASCADA COMO PAYMENTDIALOG
      if (paymentMethods.length >= 2) {
        const primaryMethod = updatedMethods[0];
        const secondaryMethod = updatedMethods[1];

        // El monto del primer método se considera un pago "neto" directo al depósito
        const netValueCovered = primaryMethod.amount || 0;
        const netValueRemaining = Math.max(0, depositAmount - netValueCovered);

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
  }, [mixedPayment, resetToSimplePayment, paymentMethods, depositAmount, getCommissionRate]);

  const addPaymentMethod = useCallback(() => {
    setPaymentMethods(prev => [...prev, { method: 'efectivo', amount: 0 }]);
  }, []);

  const removePaymentMethod = useCallback((index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  }, []);

  const setQuickPayment = useCallback(() => {
    resetToSimplePayment('efectivo');
  }, [resetToSimplePayment]);

  // ✅ LIMPIAR ESTADO AL CERRAR
  const handleClose = useCallback(() => {
    if (processing) return;
    
    setDepositPercentage(50);
    setLayawayDays(30);
    setNotes('');
    setProcessing(false);
    setShowCardOptions(false);
    setPaymentMethods([{ method: 'efectivo', amount: 0 }]);
    setMixedPayment(false);
    onClose();
  }, [onClose, processing]);

  // ✅ PROCESAR APARTADO COMPLETO CON PAGO DE DEPÓSITO
  const processLayaway = useCallback(async () => {
    if (!canCreateLayaway || !customer) return;
    
    setProcessing(true);
    
    try {
      const currentCashier = await getCurrentUser();
      if (!currentCashier) {
        throw new Error('No se pudo identificar al cajero actual');
      }

      const saleNumber = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // ✅ 1. CREAR APARTADO (SIN AUDITORÍA - SALES ES UPDATED_ONLY)
      const layawayData = {
        sale_number: saleNumber,
        customer_id: customer.id,
        cashier_id: currentCashier,
        sale_type: 'layaway', // ✅ Usando constante de tipos centralizados
        subtotal: Math.round(totals.subtotal * 100) / 100,
        tax_amount: Math.round(totals.taxAmount * 100) / 100,
        discount_amount: Math.round(totals.discountAmount * 100) / 100,
        coupon_discount: Math.round(totals.couponDiscount * 100) / 100,
        coupon_code: coupon?.code || null,
        total_amount: totals.total,
        required_deposit: depositAmount,
        paid_amount: totalPayments, // ✅ Depósito pagado inmediatamente
        pending_amount: pendingAmount,
        deposit_percentage: depositPercentage,
        status: 'pending', // ✅ Usando constante de tipos centralizados
        payment_status: 'partial', // ✅ Depósito pagado
        is_mixed_payment: mixedPayment,
        payment_received: totalPayments,
        change_amount: changeAmount,
        commission_rate: depositAmount > 0 ? Math.round((totalCommissions / depositAmount * 100) * 100) / 100 : 0,
        commission_amount: totalCommissions,
        layaway_expires_at: new Date(expirationDate + 'T23:59:59.000Z').toISOString(),
        notes: notes.trim() || null,
        payment_plan_days: layawayDays,
        receipt_printed: false,
        completed_at: null, // No completado aún
        created_at: getCurrentTimestamp()
      };

      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) throw layawayError;

      // ✅ 2. CREAR ITEMS DEL APARTADO (CORREGIDO product_sku)
      const layawayItemsData = cart.map(item => ({
        sale_id: layaway.id,
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
        .insert(layawayItemsData);

      if (itemsError) throw itemsError;

      // ✅ 3. CREAR DETALLES DE PAGO DEL DEPÓSITO CON AUDITORÍA
      const paymentDetailsData = await Promise.all(
        paymentMethods.map(async (pm, index) => {
          const commissionRate = getCommissionRate(pm.method);
          const commissionAmount = (pm.amount || 0) * commissionRate / 100;
          
          const baseData = {
            sale_id: layaway.id,
            payment_method: pm.method,
            amount: Math.round((pm.amount || 0) * 100) / 100,
            payment_reference: pm.reference || null,
            commission_rate: commissionRate,
            commission_amount: Math.round(commissionAmount * 100) / 100,
            sequence_order: index + 1,
            payment_date: getCurrentTimestamp(),
            is_partial_payment: true, // ✅ Marcar como pago parcial
            payment_sequence: 1, // ✅ Primera secuencia de pago
            notes: `Depósito de apartado - ${depositPercentage}%`
          };

          // Aplicar auditoría created_by para sale_payment_details
          return await addAuditFieldsFor('sale_payment_details', baseData, false);
        })
      );

      const { error: paymentsError } = await supabase
        .from('sale_payment_details')
        .insert(paymentDetailsData);

      if (paymentsError) throw paymentsError;

      // ✅ 4. RESERVAR INVENTARIO CON CONSTRAINT VÁLIDO
      for (const item of cart) {
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product.id,
            movement_type: 'ajuste', // ✅ Usando constante de tipos centralizados
            quantity: -item.quantity, // ✅ Negativo para reserva
            previous_stock: item.product.current_stock,
            new_stock: item.product.current_stock, // ✅ Stock no cambia físicamente, solo reserva
            unit_cost: item.product.cost_price || 0,
            total_cost: (item.product.cost_price || 0) * item.quantity,
            reason: 'Apartado - Reserva',
            reference_id: layaway.id,
            notes: `Apartado ${saleNumber} - Reservado hasta ${expirationDate}`,
            created_at: getCurrentTimestamp(),
            created_by: currentCashier
          });

        if (movementError) throw movementError;
      }

      // ✅ 5. CREAR HISTORIAL DE APARTADO CON AUDITORÍA
      const { error: historyError } = await supabase
        .from('layaway_status_history')
        .insert({
          layaway_id: layaway.id,
          previous_status: null,
          new_status: 'pending', // ✅ Usando constante de tipos centralizados
          previous_paid_amount: 0,
          new_paid_amount: totalPayments,
          reason: `Apartado creado con depósito ${formatPrice(totalPayments)}`,
          created_at: getCurrentTimestamp(),
          created_by: currentCashier
        });

      if (historyError) throw historyError;

      // ✅ 6. ACTUALIZAR CUPÓN SI APLICA
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

      // ✅ ÉXITO COMPLETO
      notify.success(`Apartado creado: ${saleNumber}. Depósito cobrado: ${formatPrice(totalPayments)}`);
      onSuccess();
      handleClose();

    } catch (error: any) {
      console.error('Error processing layaway:', error);
      const errorMsg = error.message || 'Error al crear el apartado';
      notify.error(`Error: ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  }, [
    canCreateLayaway, customer, totals, depositAmount, depositPercentage, pendingAmount,
    coupon, cart, layawayDays, expirationDate, notes, paymentMethods, mixedPayment,
    totalPayments, changeAmount, totalCommissions, getCommissionRate, formatPrice,
    addAuditFieldsFor, getCurrentUser, supabase, onSuccess, handleClose
  ]);

  // ✅ EFECTOS
  useEffect(() => {
    if (open && depositAmount > 0 && !commissionsLoading) {
      setQuickPayment();
    }
  }, [open, depositAmount, commissionsLoading, setQuickPayment]);

  useEffect(() => {
    if (mixedPayment) {
      if (paymentMethods.length === 1) {
        setPaymentMethods([
          { method: 'efectivo', amount: depositAmount },
          { method: 'debito', amount: 0 }
        ]);
      }
    } else {
      if (paymentMethods.length > 1) {
        setQuickPayment();
      }
    }
  }, [mixedPayment, depositAmount, setQuickPayment, paymentMethods.length]);

  // ✅ SSR SAFETY v7.0
  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          color: colorTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${colorTokens.border}`,
          minHeight: '85vh'
        }
      }}
    >
      {/* ✅ HEADER CON BRANDING MUSCLEUP v7.0 */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brand})`,
        color: colorTokens.textOnBrand,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <BookmarkIcon sx={{ fontSize: 28 }} />
        Crear Apartado con Depósito
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`Total: ${formatPrice(totals.total)} | Depósito: ${formatPrice(finalDepositTotal)}`}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: colorTokens.textOnBrand,
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ VALIDACIONES */}
        {!customer && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Debes seleccionar un cliente antes de crear un apartado
            </Typography>
          </Alert>
        )}

        {commissionsError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Error al cargar comisiones. Usando valores por defecto.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ✅ PANEL 1 - CONFIGURACIÓN DEL APARTADO */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              height: 'fit-content'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: colorTokens.textPrimary }}>
                Configuración del Apartado
              </Typography>

              {/* Cliente */}
              {customer && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: `${colorTokens.success}10`, borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <PersonIcon sx={{ color: colorTokens.success, fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {customer.firstName} {customer.lastName || ''}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {customer.email || customer.whatsapp || 'Sin contacto'}
                  </Typography>
                </Box>
              )}

              {/* Porcentaje de depósito */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: colorTokens.textPrimary }}>
                  Depósito Requerido: {depositPercentage}%
                </Typography>
                <Slider
                  value={depositPercentage}
                  onChange={(_, value) => setDepositPercentage(value as number)}
                  min={20}
                  max={80}
                  step={5}
                  marks={DEPOSIT_PERCENTAGES.map(p => ({ value: p, label: `${p}%` }))}
                  sx={{ color: colorTokens.brand }}
                />
              </Box>

              {/* Duración */}
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Duración</InputLabel>
                  <Select
                    value={layawayDays}
                    label="Duración"
                    onChange={(e) => setLayawayDays(e.target.value as number)}
                    sx={{ color: colorTokens.textPrimary }}
                  >
                    {LAYAWAY_DURATIONS.map(duration => (
                      <MenuItem key={duration.days} value={duration.days}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon sx={{ fontSize: 16 }} />
                          {duration.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Fecha de vencimiento */}
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 3, p: 2, backgroundColor: `${colorTokens.info}10`, borderRadius: 1 }}>
                <EventIcon sx={{ color: colorTokens.info }} />
                <Typography variant="body2" sx={{ color: colorTokens.info }}>
                  Vence el: {expirationDate}
                </Typography>
              </Box>

              {/* Notas */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas adicionales"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información del apartado..."
                InputProps={{ sx: { color: colorTokens.textPrimary } }}
              />
            </Paper>
          </Grid>

          {/* ✅ PANEL 2 - RESUMEN DE PRODUCTOS */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              height: 'fit-content'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: colorTokens.textPrimary }}>
                Productos del Apartado
              </Typography>

              <List dense sx={{ maxHeight: 250, overflow: 'auto', mb: 2 }}>
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

              {/* Totales */}
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
                
                <Divider sx={{ my: 1, borderColor: colorTokens.divider }} />
                
                <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    TOTAL APARTADO:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                    {formatPrice(totals.total)}
                  </Typography>
                </Box>
              </Box>

              {/* Desglose del apartado */}
              <Paper sx={{
                p: 2,
                background: `${colorTokens.warning}10`,
                border: `1px solid ${colorTokens.warning}40`,
                borderRadius: 1
              }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colorTokens.textPrimary }}>
                  Desglose de Pagos:
                </Typography>
                
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Depósito ({depositPercentage}%):
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                    {formatPrice(finalDepositTotal)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Pendiente:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.info }}>
                    {formatPrice(pendingAmount)}
                  </Typography>
                </Box>
              </Paper>
            </Paper>
          </Grid>

          {/* ✅ PANEL 3 - PAGO DEL DEPÓSITO */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              height: 'fit-content'
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: colorTokens.textPrimary, textAlign: 'center' }}>
                  Cobrar Depósito: {formatPrice(finalDepositTotal)}
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Selecciona el método de pago para cobrar el depósito del {depositPercentage}%
                  </Typography>
                </Alert>
              </Box>

              {/* Botones de método rápido */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: colorTokens.textPrimary }}>
                Método de Pago Rápido:
              </Typography>
              
              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant={!mixedPayment && paymentMethods[0]?.method === 'efectivo' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setShowCardOptions(false);
                      resetToSimplePayment('efectivo');
                    }}
                    disabled={commissionsLoading || processing}
                    startIcon={<MoneyIcon />}
                    sx={{
                      py: 1.5,
                      background: !mixedPayment && paymentMethods[0]?.method === 'efectivo' 
                        ? `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})` 
                        : 'transparent',
                      color: !mixedPayment && paymentMethods[0]?.method === 'efectivo' ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      borderColor: colorTokens.success,
                      '&:hover': {
                        background: !mixedPayment && paymentMethods[0]?.method === 'efectivo' 
                          ? `linear-gradient(135deg, ${colorTokens.successHover}, ${colorTokens.success})` 
                          : `${colorTokens.success}20`
                      }
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="body2" fontWeight="bold">Efectivo</Typography>
                      {getCommissionRate('efectivo') > 0 && (
                        <Chip 
                          label={`+${getCommissionRate('efectivo')}%`}
                          size="small"
                          sx={{ 
                            mt: 0.5, 
                            height: 16, 
                            fontSize: '0.6rem',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'inherit'
                          }}
                        />
                      )}
                    </Box>
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant={showCardOptions ? 'contained' : 'outlined'}
                    onClick={() => {
                      setShowCardOptions(!showCardOptions);
                      if (!showCardOptions) {
                        setMixedPayment(false);
                      }
                    }}
                    disabled={commissionsLoading || processing}
                    startIcon={<CardIcon />}
                    sx={{
                      py: 1.5,
                      background: showCardOptions 
                        ? `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})` 
                        : 'transparent',
                      color: showCardOptions ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      borderColor: colorTokens.info
                    }}
                  >
                    Tarjeta
                  </Button>
                </Grid>
                
                {/* Opciones de tarjeta expandidas */}
                {showCardOptions && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Button
                        fullWidth
                        variant={!mixedPayment && paymentMethods[0]?.method === 'debito' ? 'contained' : 'outlined'}
                        onClick={() => {
                          resetToSimplePayment('debito');
                          setShowCardOptions(false);
                        }}
                        disabled={commissionsLoading || processing}
                        startIcon={<CardIcon />}
                        sx={{
                          py: 1,
                          background: !mixedPayment && paymentMethods[0]?.method === 'debito' 
                            ? `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})` 
                            : 'transparent',
                          color: !mixedPayment && paymentMethods[0]?.method === 'debito' ? colorTokens.textOnBrand : colorTokens.textPrimary,
                          borderColor: colorTokens.info,
                          fontSize: '0.9rem'
                        }}
                      >
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Typography variant="body2" fontSize="0.9rem">Débito</Typography>
                          {getCommissionRate('debito') > 0 && (
                            <Chip 
                              label={`+${getCommissionRate('debito')}%`}
                              size="small"
                              sx={{ 
                                mt: 0.3, 
                                height: 14, 
                                fontSize: '0.5rem',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'inherit'
                              }}
                            />
                          )}
                        </Box>
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Button
                        fullWidth
                        variant={!mixedPayment && paymentMethods[0]?.method === 'credito' ? 'contained' : 'outlined'}
                        onClick={() => {
                          resetToSimplePayment('credito');
                          setShowCardOptions(false);
                        }}
                        disabled={commissionsLoading || processing}
                        startIcon={<CardIcon />}
                        sx={{
                          py: 1,
                          background: !mixedPayment && paymentMethods[0]?.method === 'credito' 
                            ? `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})` 
                            : 'transparent',
                          color: !mixedPayment && paymentMethods[0]?.method === 'credito' ? colorTokens.textOnBrand : colorTokens.textPrimary,
                          borderColor: colorTokens.info,
                          fontSize: '0.9rem'
                        }}
                      >
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Typography variant="body2" fontSize="0.9rem">Crédito</Typography>
                          {getCommissionRate('credito') > 0 && (
                            <Chip 
                              label={`+${getCommissionRate('credito')}%`}
                              size="small"
                              sx={{ 
                                mt: 0.3, 
                                height: 14, 
                                fontSize: '0.5rem',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'inherit'
                              }}
                            />
                          )}
                        </Box>
                      </Button>
                    </Grid>
                  </>
                )}
                
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant={!mixedPayment && paymentMethods[0]?.method === 'transferencia' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setShowCardOptions(false);
                      resetToSimplePayment('transferencia');
                    }}
                    disabled={commissionsLoading || processing}
                    startIcon={<BankIcon />}
                    sx={{
                      py: 1.5,
                      background: !mixedPayment && paymentMethods[0]?.method === 'transferencia' 
                        ? `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})` 
                        : 'transparent',
                      color: !mixedPayment && paymentMethods[0]?.method === 'transferencia' ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      borderColor: colorTokens.brand
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="body2" fontWeight="bold">Transferencia</Typography>
                      {getCommissionRate('transferencia') > 0 && (
                        <Chip 
                          label={`+${getCommissionRate('transferencia')}%`}
                          size="small"
                          sx={{ 
                            mt: 0.5, 
                            height: 16, 
                            fontSize: '0.6rem',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'inherit'
                          }}
                        />
                      )}
                    </Box>
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant={mixedPayment ? 'contained' : 'outlined'}
                    onClick={() => {
                      setShowCardOptions(false);
                      setMixedPayment(true);
                      setPaymentMethods([
                        { method: 'efectivo', amount: depositAmount },
                        { method: 'debito', amount: 0 }
                      ]);
                    }}
                    disabled={commissionsLoading || processing}
                    startIcon={<PaymentIcon />}
                    sx={{
                      py: 1.5,
                      background: mixedPayment 
                        ? `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brand})` 
                        : 'transparent',
                      color: mixedPayment ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      borderColor: colorTokens.warning
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="body2" fontWeight="bold">Mixto</Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>
                        Múltiples
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Divider sx={{ my: 2, borderColor: colorTokens.divider }} />
              
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 2, color: colorTokens.textPrimary, textAlign: 'center' }}>
                Configurar Método de Pago:
              </Typography>

              {/* Métodos de pago */}
              <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                {paymentMethods.map((pm, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, background: colorTokens.surfaceLevel2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Método</InputLabel>
                          <Select
                            value={pm.method}
                            label="Método"
                            onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                            disabled={processing}
                            sx={{ color: colorTokens.textPrimary }}
                          >
                            {availablePaymentMethods.map(method => (
                              <MenuItem key={method.value} value={method.value}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <method.icon sx={{ fontSize: 16 }} />
                                  {method.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
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
                          disabled={!mixedPayment || index > 0 || processing} // ✅ Solo primer método editable en mixto
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
                              ? "Auto-calculado por método" 
                              : index === 0 
                                ? "Ingresa monto del cliente" 
                                : "Auto-calculado"
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 4, sm: 2 }}>
                        {paymentMethods.length > 1 && (
                          <IconButton onClick={() => removePaymentMethod(index)} disabled={processing}>
                            <DeleteIcon sx={{ color: colorTokens.danger }} />
                          </IconButton>
                        )}
                      </Grid>

                      {pm.method !== 'efectivo' && (
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Referencia"
                            value={pm.reference || ''}
                            onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                            disabled={processing}
                            InputProps={{ sx: { color: colorTokens.textPrimary } }}
                          />
                        </Grid>
                      )}
                    </Grid>

                    {/* Comisión */}
                    {pm.amount > 0 && getCommissionRate(pm.method) > 0 && (
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Comisión {getCommissionRate(pm.method)}%: {formatPrice((pm.amount * getCommissionRate(pm.method)) / 100)}
                      </Alert>
                    )}
                  </Paper>
                ))}
              </Box>

              {/* Agregar método */}
              {mixedPayment && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPaymentMethod}
                  fullWidth
                  disabled={processing}
                  sx={{ mt: 1, borderColor: colorTokens.info, color: colorTokens.info }}
                >
                  Agregar Método
                </Button>
              )}

              {/* Resumen de pago */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: `${colorTokens.brand}10`, borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Depósito requerido:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    {formatPrice(finalDepositTotal)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Total pagado:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ 
                    color: totalPayments >= (finalDepositTotal - 0.001) ? colorTokens.success : colorTokens.warning 
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

              {/* Validación de pago */}
              {totalPayments < (finalDepositTotal - 0.001) && !commissionsLoading && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Falta por pagar: {formatPrice(finalDepositTotal - totalPayments)}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Alertas finales */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            El apartado será creado con el depósito cobrado inmediatamente. 
            El cliente tendrá hasta el <strong>{expirationDate}</strong> para completar el pago restante de <strong>{formatPrice(pendingAmount)}</strong>.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          disabled={processing}
          sx={{ color: colorTokens.textSecondary }}
        >
          Cancelar
        </Button>

        <Button
          onClick={processLayaway}
          disabled={!canCreateLayaway}
          variant="contained"
          startIcon={processing ? <CircularProgress size={16} /> : <ReceiptIcon />}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
            color: colorTokens.textPrimary,
            fontWeight: 'bold',
            px: 4,
            '&:disabled': {
              background: colorTokens.neutral600,
              color: colorTokens.textMuted
            }
          }}
        >
          {processing 
            ? 'Procesando...' 
            : `Crear Apartado y Cobrar ${formatPrice(finalDepositTotal)}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}