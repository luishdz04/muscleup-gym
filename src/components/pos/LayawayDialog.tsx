// components/pos/LayawayDialog.tsx - VERSIÓN COMPLETA v10.2 MULTI-ALMACÉN

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
  Delete as DeleteIcon,
  Warning as WarningIcon
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
  CartItem, 
  Customer, 
  Coupon, 
  Totals,
  PaymentCommission
} from '@/types/pos';

// ✅ PROPS ACTUALIZADAS v10.2 - INCLUYE warehouseId
interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  coupon: Coupon | null;
  totals: Totals;
  warehouseId: string; // ✅ CRÍTICO: Almacén donde se reserva el stock
  onSuccess: () => void;
}

interface PaymentMethodForm {
  method: string;
  amount: number;
  reference?: string;
}

const DEPOSIT_PERCENTAGES = [30, 40, 50, 60, 70] as const;
const LAYAWAY_DURATIONS = [
  { days: 7, label: '7 días' },
  { days: 15, label: '15 días' },
  { days: 30, label: '30 días' },
  { days: 45, label: '45 días' },
  { days: 60, label: '60 días' }
] as const;

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
  warehouseId,
  onSuccess
}: LayawayDialogProps) {
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  const {
    data: paymentCommissions,
    loading: commissionsLoading,
    error: commissionsError
  } = useEntityCRUD<PaymentCommission>({
    tableName: 'payment_commissions',
    selectQuery: '*'
  });
  
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [layawayDays, setLayawayDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([
    { method: 'efectivo', amount: 0 }
  ]);
  const [mixedPayment, setMixedPayment] = useState(false);
  const [showCardOptions, setShowCardOptions] = useState(false);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const getCommissionRate = useCallback((paymentMethod: string): number => {
    if (commissionsLoading || !paymentCommissions || commissionsError) return 0;
    const commission = paymentCommissions.find(
      (c: PaymentCommission) => c.payment_method === paymentMethod && c.is_active === true
    );
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissions, commissionsLoading, commissionsError]);

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

  const canCreateLayaway = useMemo(() => {
    return (
      customer !== null &&
      cart.length > 0 &&
      depositAmount > 0 &&
      !processing &&
      totalPayments >= (finalDepositTotal - 0.001) &&
      !!warehouseId
    );
  }, [customer, cart.length, depositAmount, processing, totalPayments, finalDepositTotal, warehouseId]);

  const resetToSimplePayment = useCallback((method: string) => {
    setMixedPayment(false);
    const rate = getCommissionRate(method);
    let amount = depositAmount;
    if (rate > 0) {
      amount = depositAmount / (1 - rate / 100);
    }
    setPaymentMethods([{ method, amount: Math.round(amount * 100) / 100 }]);
  }, [depositAmount, getCommissionRate]);

  const updatePaymentMethod = useCallback((index: number, field: keyof PaymentMethodForm, value: any) => {
    if (!mixedPayment && field === 'method') {
      resetToSimplePayment(value);
    } else if (mixedPayment) {
      let updatedMethods = paymentMethods.map((pm, i) => 
        i === index ? { 
          ...pm, 
          [field]: field === 'amount' ? Math.round((Number(value) || 0) * 100) / 100 : value 
        } : pm
      );

      if (paymentMethods.length >= 2) {
        const primaryMethod = updatedMethods[0];
        const secondaryMethod = updatedMethods[1];
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

  const processLayaway = useCallback(async () => {
    if (!canCreateLayaway || !customer) return;
    
    if (!warehouseId) {
      notify.error('⚠️ Error: Almacén no configurado. Contacta al administrador.');
      return;
    }

    setProcessing(true);
    
    try {
      const currentCashier = await getCurrentUser();
      if (!currentCashier) {
        throw new Error('No se pudo identificar al cajero actual');
      }

      const saleNumber = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const layawayData = {
        sale_number: saleNumber,
        customer_id: customer.id,
        cashier_id: currentCashier,
        sale_type: 'layaway',
        source_warehouse_id: warehouseId,
        subtotal: Math.round(totals.subtotal * 100) / 100,
        tax_amount: Math.round(totals.taxAmount * 100) / 100,
        discount_amount: Math.round(totals.discountAmount * 100) / 100,
        coupon_discount: Math.round(totals.couponDiscount * 100) / 100,
        coupon_code: coupon?.code || null,
        total_amount: totals.total,
        required_deposit: depositAmount,
        paid_amount: depositAmount, // ✅ CORREGIDO: Valor NETO aplicado a la deuda (sin comisión)
        pending_amount: pendingAmount,
        deposit_percentage: depositPercentage,
        status: 'pending',
        payment_status: 'partial',
        is_mixed_payment: mixedPayment,
        payment_received: totalPayments, // Lo que el cliente entrega (con comisión)
        change_amount: changeAmount,
        commission_rate: depositAmount > 0 ? Math.round((totalCommissions / depositAmount * 100) * 100) / 100 : 0,
        commission_amount: totalCommissions,
        layaway_expires_at: new Date(expirationDate + 'T23:59:59.000Z').toISOString(),
        notes: notes.trim() || null,
        payment_plan_days: layawayDays,
        receipt_printed: false,
        completed_at: null,
        created_at: getCurrentTimestamp()
      };

      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) throw layawayError;

      const layawayItemsData = cart.map(item => ({
        sale_id: layaway.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        source_warehouse_id: warehouseId,
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
            is_partial_payment: true,
            payment_sequence: 1,
            notes: `Depósito de apartado - ${depositPercentage}%`
          };

          return await addAuditFieldsFor('sale_payment_details', baseData, false);
        })
      );

      const { error: paymentsError } = await supabase
        .from('sale_payment_details')
        .insert(paymentDetailsData);

      if (paymentsError) throw paymentsError;

      const inventoryMovementsToReserve = cart.map(item => ({
        product_id: item.product.id,
        movement_type: 'reserva_apartado',
        quantity: item.quantity,
        target_warehouse_id: warehouseId,
        reason: `Reserva para Apartado #${layaway.sale_number}`,
        reference_id: layaway.id,
        created_by: currentCashier,
        created_at: getCurrentTimestamp()
      }));

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(inventoryMovementsToReserve);

      if (movementsError) {
        throw new Error(`Error al reservar el inventario: ${movementsError.message}`);
      }

      const { error: historyError } = await supabase
        .from('layaway_status_history')
        .insert({
          layaway_id: layaway.id,
          previous_status: null,
          new_status: 'pending',
          previous_paid_amount: 0,
          new_paid_amount: depositAmount, // ✅ CORREGIDO: Registrar valor neto abonado
          reason: `Apartado creado con depósito de ${formatPrice(depositAmount)} (cobrado: ${formatPrice(totalPayments)} con comisión)`,
          created_at: getCurrentTimestamp(),
          created_by: currentCashier
        });

      if (historyError) throw historyError;

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

      notify.success(`Apartado creado: ${saleNumber}. Depósito cobrado: ${formatPrice(totalPayments)}`);
      onSuccess();
      handleClose();

    } catch (error: any) {
      console.error('Error processing layaway:', error);
      const errorMsg = error.message || 'Error al crear el apartado';
      
      if (errorMsg.includes('insufficient_stock')) {
        notify.error('⚠️ Stock insuficiente para reservar. Verifica el inventario.');
      } else if (errorMsg.includes('inventory_movements_movement_type_check')) {
        notify.error('⚠️ Error de configuración en inventario. Contacta al administrador.');
      } else {
        notify.error(`Error: ${errorMsg}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [
    canCreateLayaway, customer, totals, depositAmount, depositPercentage, pendingAmount,
    coupon, cart, layawayDays, expirationDate, notes, paymentMethods, mixedPayment,
    totalPayments, changeAmount, totalCommissions, getCommissionRate, formatPrice,
    addAuditFieldsFor, getCurrentUser, supabase, onSuccess, handleClose, warehouseId
  ]);

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

  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
            <Typography sx={{ color: colorTokens.textSecondary }}>
              Cargando MuscleUp Gym...
            </Typography>
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
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Almacén no configurado
            </Typography>
            <Typography variant="body2">
              No se puede crear el apartado sin un almacén configurado.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" sx={{ background: colorTokens.danger }}>
            Cerrar
          </Button>
        </DialogActions>
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
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brand})`,
        color: colorTokens.textOnBrand,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        p: { xs: 2, sm: 3 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <BookmarkIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          <Typography variant="h6" sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Crear Apartado con Depósito
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Apartado
            </Box>
          </Typography>
        </Box>
        <Box sx={{ ml: { xs: 0, sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
          <Chip
            label={`Total: ${formatPrice(totals.total)} | Depósito: ${formatPrice(finalDepositTotal)}`}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: colorTokens.textOnBrand,
              fontWeight: 700,
              fontSize: { xs: '0.75rem', sm: '0.9rem' }
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {!customer && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Debes seleccionar un cliente antes de crear un apartado
          </Alert>
        )}

        {commissionsError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Error al cargar comisiones. Usando valores por defecto.
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* PANEL 1 - CONFIGURACIÓN */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: { xs: 2, sm: 3 },
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: colorTokens.textPrimary }}>
                Configuración del Apartado
              </Typography>

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

              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 3, p: 2, backgroundColor: `${colorTokens.info}10`, borderRadius: 1 }}>
                <EventIcon sx={{ color: colorTokens.info }} />
                <Typography variant="body2" sx={{ color: colorTokens.info }}>
                  Vence el: {expirationDate}
                </Typography>
              </Box>

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

          {/* PANEL 2 - RESUMEN */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2
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

          {/* PANEL 3 - PAGO */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: { xs: 2, sm: 3 },
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: colorTokens.textPrimary }}>
                Cobrar Depósito: {formatPrice(finalDepositTotal)}
              </Typography>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant={!mixedPayment && paymentMethods[0]?.method === 'efectivo' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setShowCardOptions(false);
                      resetToSimplePayment('efectivo');
                    }}
                    disabled={processing}
                    startIcon={<MoneyIcon />}
                    sx={{
                      py: 1.5,
                      background: !mixedPayment && paymentMethods[0]?.method === 'efectivo' 
                        ? `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})` 
                        : 'transparent',
                      color: !mixedPayment && paymentMethods[0]?.method === 'efectivo' ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      borderColor: colorTokens.success
                    }}
                  >
                    Efectivo
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
                    disabled={processing}
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
                    Mixto
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2, borderColor: colorTokens.divider }} />

              <Box sx={{ maxHeight: 250, overflow: 'auto', mb: 2 }}>
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
                          disabled={!mixedPayment || index > 0 || processing}
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
                                ? "Ingresa monto" 
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

                    {pm.amount > 0 && getCommissionRate(pm.method) > 0 && (
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Comisión {getCommissionRate(pm.method)}%: {formatPrice((pm.amount * getCommissionRate(pm.method)) / 100)}
                      </Alert>
                    )}
                  </Paper>
                ))}
              </Box>

              {mixedPayment && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPaymentMethod}
                  fullWidth
                  disabled={processing}
                  sx={{ mb: 2, borderColor: colorTokens.info, color: colorTokens.info }}
                >
                  Agregar Método
                </Button>
              )}

              <Box sx={{ p: 2, backgroundColor: `${colorTokens.brand}10`, borderRadius: 1 }}>
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

              {totalPayments < (finalDepositTotal - 0.001) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Falta por pagar: {formatPrice(finalDepositTotal - totalPayments)}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          El apartado será creado con el depósito cobrado inmediatamente. 
          El cliente tendrá hasta el <strong>{expirationDate}</strong> para completar el pago restante de <strong>{formatPrice(pendingAmount)}</strong>.
        </Alert>
      </DialogContent>

      <DialogActions sx={{
        p: { xs: 2, sm: 3 },
        pt: 0,
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          disabled={processing}
          fullWidth={{ xs: true, sm: false }}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            color: colorTokens.textSecondary
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={processLayaway}
          disabled={!canCreateLayaway}
          variant="contained"
          startIcon={processing ? <CircularProgress size={16} /> : <ReceiptIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          fullWidth={{ xs: true, sm: false }}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
            color: colorTokens.textPrimary,
            fontWeight: 'bold',
            px: { xs: 3, sm: 4 },
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