// components/pos/EditDialog.tsx - SIN SUPERPOSICIÓN DE MODALES v7.0

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
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { getCurrentTimestamp, formatTimestampForDisplay } from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS UNIFICADOS PARA COMPATIBILIDAD TOTAL CON SALESHISTORYPAGE
interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  tax_amount?: number;
  created_at: string;
}

interface SalePaymentDetail {
  id: string;
  sale_id: string;
  payment_method: string;
  amount: number;
  payment_reference?: string;
  commission_rate?: number;
  commission_amount?: number;
  sequence_order?: number;
  payment_date?: string;
  created_at: string;
  is_partial_payment?: boolean;
  payment_sequence?: number;
  notes?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
}

interface Cashier {
  id: string;
  firstName: string;
  lastName?: string;
  profilePictureUrl?: string;
}

// ✅ INTERFACE UNIFICADA - COMPATIBLE CON SALESHISTORYPAGE
interface SaleWithDetails {
  id: string;
  sale_number: string;
  customer_id?: string;
  cashier_id: string;
  sale_type: 'sale' | 'layaway';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  coupon_discount?: number;
  coupon_code?: string;
  total_amount: number;
  required_deposit?: number;
  paid_amount?: number;
  pending_amount?: number;
  deposit_percentage?: number;
  layaway_expires_at?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  is_mixed_payment?: boolean;
  payment_received?: number;
  change_amount?: number;
  commission_rate?: number;
  commission_amount?: number;
  notes?: string;
  receipt_printed?: boolean;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  custom_commission_rate?: number;
  skip_inscription?: boolean;
  cancellation_date?: string;
  payment_plan_days?: number;
  initial_payment?: number;
  expiration_date?: string;
  last_payment_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  refund_amount?: number;
  refund_method?: string;
  cancellation_fee?: number;
  email_sent?: boolean;
  payment_date?: string;
  updated_by?: string;
  
  // ✅ RELACIONES INCLUIDAS
  customer?: Customer;
  cashier?: Cashier;
  sale_items?: SaleItem[];
  sale_payment_details?: SalePaymentDetail[];
  
  // ✅ CAMPOS CALCULADOS REQUERIDOS POR SALESHISTORYPAGE
  customer_name: string;
  cashier_name: string;  
  payment_method: string;
  items_count: number;
}

interface EditSaleDialogProps {
  open: boolean;
  onClose: () => void;
  sale: SaleWithDetails | null;
  onSuccess: (updatedSale?: SaleWithDetails) => void;
}

// ✅ TIPOS PRESERVADOS DEL PAYMENTDIALOG
interface PaymentMethodForm {
  id?: string;
  method: string;
  amount: number;
  reference?: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface PaymentCommission {
  id: string;
  payment_method: string;
  commission_type: string;
  commission_value: number;
  min_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ✅ CONSTANTES PRESERVADAS DEL PAYMENTDIALOG
const PAYMENT_METHODS_FALLBACK = [
  { value: 'efectivo', label: 'Efectivo', icon: MoneyIcon },
  { value: 'transferencia', label: 'Transferencia', icon: BankIcon },
  { value: 'debito', label: 'Tarjeta Débito', icon: CardIcon },
  { value: 'credito', label: 'Tarjeta Crédito', icon: CardIcon }
] as const;

const EPSILON = 0.001;

export default function EditDialog({
  open,
  onClose,
  sale,
  onSuccess
}: EditSaleDialogProps) {
  // ✅ HOOKS ENTERPRISE v7.0
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
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

  // ✅ ESTADOS PRESERVADOS DEL PAYMENTDIALOG
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mixedPayment, setMixedPayment] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [baseNetTotal, setBaseNetTotal] = useState<number>(0);

  // ✅ NUEVOS ESTADOS PARA CONFIRMACIÓN INTEGRADA - SIN SUPERPOSICIÓN
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'close' | null>(null);

  // ✅ FORMATEAR PRECIO - PRESERVADO
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ OBTENER TASA DE COMISIÓN - PRESERVADO DEL PAYMENTDIALOG
  const getCommissionRate = useCallback((paymentMethod: string): number => {
    if (commissionsLoading || !paymentCommissions || commissionsError) return 0;
    const commission = paymentCommissions.find(
      (c: PaymentCommission) => c.payment_method === paymentMethod && c.is_active === true
    );
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissions, commissionsLoading, commissionsError]);

  // ✅ MÉTODOS DISPONIBLES - PRESERVADO DEL PAYMENTDIALOG
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

  // ✅ FUNCIÓN CLAVE: CALCULAR VALOR NETO BASE DESDE PAGOS ORIGINALES
  const calculateBaseNetTotal = useCallback((originalPayments: any[]) => {
    if (!originalPayments || originalPayments.length === 0) {
      return sale?.total_amount || 0;
    }

    const netTotal = originalPayments.reduce((sum, payment) => {
      const commissionAmount = payment.commission_amount || 0;
      const netAmount = payment.amount - commissionAmount;
      return sum + netAmount;
    }, 0);

    return Math.round(netTotal * 100) / 100;
  }, [sale?.total_amount]);

  // ✅ CÁLCULOS PRINCIPALES - ACTUALIZADOS CON LÓGICA CORREGIDA
  const totalPayments = useMemo(() => {
    const activePayments = paymentMethods.filter(pm => !pm.toDelete);
    return Math.round(activePayments.reduce((sum, pm) => sum + (pm.amount || 0), 0) * 100) / 100;
  }, [paymentMethods]);

  const totalCommissions = useMemo(() => {
    const activePayments = paymentMethods.filter(pm => !pm.toDelete);
    const commissionAmount = activePayments.reduce((sum, pm) => {
      const rate = getCommissionRate(pm.method);
      return sum + ((pm.amount || 0) * rate / 100);
    }, 0);
    return Math.round(commissionAmount * 100) / 100;
  }, [paymentMethods, getCommissionRate]);

  const netTotal = useMemo(() => {
    return Math.round((totalPayments - totalCommissions) * 100) / 100;
  }, [totalPayments, totalCommissions]);

  const canProcessPayment = useMemo(() => {
    if (!sale) return false;
    const activePayments = paymentMethods.filter(pm => !pm.toDelete);
    return (
      activePayments.length > 0 &&
      Math.abs(netTotal - baseNetTotal) <= EPSILON &&
      !processing &&
      !commissionsLoading
    );
  }, [sale, paymentMethods, netTotal, baseNetTotal, processing, commissionsLoading]);

  // ✅ DETECTAR CAMBIOS
  const hasChanges = useMemo(() => {
    if (!sale) return false;
    
    const originalPayments = sale.sale_payment_details || [];
    const activePayments = paymentMethods.filter(p => !p.toDelete);
    
    const paymentsChanged = 
      activePayments.length !== originalPayments.length ||
      activePayments.some((p, i) => {
        const original = originalPayments[i];
        return !original || 
          p.method !== original.payment_method ||
          Math.abs(p.amount - original.amount) > EPSILON ||
          p.reference !== original.payment_reference;
      });

    const notesChanged = notes !== (sale.notes || '');
    const hasNewPayments = paymentMethods.some(p => p.isNew);
    const hasDeletedPayments = paymentMethods.some(p => p.toDelete);

    return paymentsChanged || notesChanged || hasNewPayments || hasDeletedPayments;
  }, [sale, paymentMethods, notes]);

  // ✅ LÓGICA CORREGIDA: RECÁLCULO AUTOMÁTICO CONSIDERANDO BASE NETA
  const updatePaymentMethod = useCallback(
    (index: number, field: keyof PaymentMethodForm, value: any) => {
      if (!sale) return;

      if (!mixedPayment) {
        if (field === 'method') {
          const newMethod = value;
          const rate = getCommissionRate(newMethod);
          
          let newGrossAmount = baseNetTotal;
          if (rate > 0) {
            newGrossAmount = baseNetTotal / (1 - rate / 100);
          }
          
          const roundedAmount = Math.round(newGrossAmount * 100) / 100;
          setPaymentMethods([{ 
            ...paymentMethods[0], 
            method: newMethod, 
            amount: roundedAmount 
          }]);
        }
        else if (field === 'amount') {
          const newAmount = Math.round((Number(value) || 0) * 100) / 100;
          setPaymentMethods([{ 
            ...paymentMethods[0], 
            amount: newAmount 
          }]);
        }
      } else {
        let updatedMethods = paymentMethods.map((pm, i) => 
          i === index ? { 
            ...pm, 
            [field]: field === 'amount' ? Math.round((Number(value) || 0) * 100) / 100 : value 
          } : pm
        );

        if (updatedMethods.length >= 2) {
          const primaryMethod = updatedMethods[0];
          const secondaryMethod = updatedMethods[1];

          const netValueCovered = primaryMethod.amount || 0;
          const netValueRemaining = Math.max(0, baseNetTotal - netValueCovered);

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
    [mixedPayment, sale, baseNetTotal, getCommissionRate, paymentMethods]
  );

  // ✅ FUNCIONES DE MANIPULACIÓN - PRESERVADAS
  const addPaymentMethod = useCallback(() => {
    setPaymentMethods(prev => [...prev, { 
      method: 'efectivo', 
      amount: 0,
      isNew: true,
      toDelete: false
    }]);
  }, []);

  const removePayment = useCallback((index: number) => {
    setPaymentMethods(prev => prev.map((p, i) => 
      i === index ? { ...p, toDelete: true } : p
    ));
  }, []);

  const restorePayment = useCallback((index: number) => {
    setPaymentMethods(prev => prev.map((p, i) => 
      i === index ? { ...p, toDelete: false } : p
    ));
  }, []);

  // ✅ PAGO EXACTO CORREGIDO: USAR baseNetTotal
  const setQuickPayment = useCallback(() => {
    if (!sale) return;
    const rate = getCommissionRate('efectivo');
    
    let finalAmount = baseNetTotal;
    if (rate > 0) {
      finalAmount = baseNetTotal / (1 - rate / 100);
    }
    
    setPaymentMethods([{
      method: 'efectivo',
      amount: Math.round(finalAmount * 100) / 100,
      isNew: false,
      toDelete: false
    }]);
    setMixedPayment(false);
  }, [baseNetTotal, getCommissionRate]);

  // ✅ VALIDACIONES ESPECÍFICAS PARA EDICIÓN
  const validationErrors = useMemo((): string[] => {
    const errors: string[] = [];

    if (!sale) {
      errors.push('No hay venta para editar');
      return errors;
    }

    if (sale.status === 'cancelled') {
      errors.push('No se pueden editar ventas canceladas');
    }

    if (sale.status === 'refunded') {
      errors.push('No se pueden editar ventas devueltas');
    }

    if (sale.status === 'pending') {
      errors.push('No se pueden editar ventas pendientes');
    }

    const activePayments = paymentMethods.filter(p => !p.toDelete);
    if (activePayments.length === 0) {
      errors.push('La venta debe tener al menos un método de pago');
    }

    if (Math.abs(netTotal - baseNetTotal) > EPSILON) {
      errors.push(`Total neto (${formatPrice(netTotal)}) no coincide con valor base de productos (${formatPrice(baseNetTotal)})`);
    }

    activePayments.forEach((payment, index) => {
      if (!payment.method) {
        errors.push(`Método de pago ${index + 1} es requerido`);
      }
      if (payment.amount <= 0) {
        errors.push(`Monto del método ${index + 1} debe ser mayor a $0`);
      }
    });

    return errors;
  }, [sale, paymentMethods, netTotal, baseNetTotal, formatPrice]);

  // ✅ FUNCIÓN HELPER: PROCESAR SALE PARA COMPATIBILIDAD
  const processSaleForCallback = useCallback((rawSale: any): SaleWithDetails => {
    const customer = rawSale.customer;
    const cashier = rawSale.cashier;
    const paymentDetails = rawSale.sale_payment_details || [];
    const saleItems = rawSale.sale_items || [];
    
    return {
      ...rawSale,
      // ✅ CAMPOS CALCULADOS REQUERIDOS POR SALESHISTORYPAGE
      customer_name: customer 
        ? `${customer.firstName} ${customer.lastName || ''}`.trim()
        : 'Cliente General',
      cashier_name: cashier 
        ? `${cashier.firstName} ${cashier.lastName || ''}`.trim()
        : 'Sistema',
      payment_method: rawSale.is_mixed_payment 
        ? 'Mixto' 
        : paymentDetails[0]?.payment_method || 'Efectivo',
      items_count: saleItems.reduce((sum: number, item: SaleItem) => sum + item.quantity, 0)
    };
  }, []);

  // ✅ LÓGICA DE GUARDADO SEPARADA - SIN CONFIRMACIÓN
  const executeSave = useCallback(async () => {
    if (!sale || !hasChanges || validationErrors.length > 0) return;

    console.log('💾 Iniciando proceso de guardado...');
    setProcessing(true);

    try {
      // ✅ CONSTANTES QUERY PARA OBTENER VENTA ACTUALIZADA
      const SALE_SELECT_QUERY = `
        *,
        customer:Users!sales_customer_id_fkey (
          id,
          firstName,
          lastName,
          email,
          profilePictureUrl
        ),
        cashier:Users!sales_cashier_id_fkey (
          id,
          firstName,
          lastName,
          profilePictureUrl
        ),
        sale_items (
          id,
          product_id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          discount_amount,
          tax_amount
        ),
        sale_payment_details (
          id,
          payment_method,
          amount,
          commission_rate,
          commission_amount,
          payment_reference,
          sequence_order,
          is_partial_payment,
          payment_date
        )
      `;

      // 1. ✅ Actualizar el registro principal de la venta SIEMPRE que haya cambios
      console.log('📝 Actualizando registro principal de la venta...');
      const saleUpdateData = await addAuditFieldsFor('sales', {
        notes: notes || null,
        is_mixed_payment: mixedPayment,
        total_amount: totalPayments,
        paid_amount: totalPayments,
        commission_amount: totalCommissions,
        commission_rate: baseNetTotal > 0 ? Math.round((totalCommissions / baseNetTotal * 100) * 100) / 100 : 0,
      }, true);

      const { error: saleError } = await supabase
        .from('sales')
        .update(saleUpdateData)
        .eq('id', sale.id);

      if (saleError) throw saleError;
      console.log('✅ Registro principal de la venta actualizado');

      // 2. Procesar cambios en métodos de pago
      const paymentsToDelete = paymentMethods.filter(p => p.toDelete && p.id);
      const paymentsToUpdate = paymentMethods.filter(p => !p.toDelete && !p.isNew && p.id);
      const paymentsToCreate = paymentMethods.filter(p => !p.toDelete && p.isNew);

      console.log(`📊 Cambios a procesar: ${paymentsToDelete.length} eliminar, ${paymentsToUpdate.length} actualizar, ${paymentsToCreate.length} crear`);

      // Eliminar pagos marcados para borrar
      for (const payment of paymentsToDelete) {
        console.log(`🗑️ Eliminando pago: ${payment.method} - ${formatPrice(payment.amount)}`);
        const { error: deleteError } = await supabase
          .from('sale_payment_details')
          .delete()
          .eq('id', payment.id);

        if (deleteError) throw deleteError;
      }

      // Actualizar pagos existentes con auditoría
      for (const payment of paymentsToUpdate) {
        console.log(`✏️ Actualizando pago: ${payment.method} - ${formatPrice(payment.amount)}`);
        const commissionRate = getCommissionRate(payment.method);
        const commissionAmount = (payment.amount || 0) * commissionRate / 100;
        
        const updateData = await addAuditFieldsFor('sale_payment_details', {
          payment_method: payment.method,
          amount: Math.round((payment.amount || 0) * 100) / 100,
          payment_reference: payment.reference || null,
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100
        }, true);

        const { error: updateError } = await supabase
          .from('sale_payment_details')
          .update(updateData)
          .eq('id', payment.id);

        if (updateError) throw updateError;
      }

      // Crear nuevos pagos con auditoría
      for (const payment of paymentsToCreate) {
        console.log(`➕ Creando pago: ${payment.method} - ${formatPrice(payment.amount)}`);
        const commissionRate = getCommissionRate(payment.method);
        const commissionAmount = (payment.amount || 0) * commissionRate / 100;
        
        const createData = await addAuditFieldsFor('sale_payment_details', {
          sale_id: sale.id,
          payment_method: payment.method,
          amount: Math.round((payment.amount || 0) * 100) / 100,
          payment_reference: payment.reference || null,
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          sequence_order: paymentMethods.indexOf(payment) + 1,
          payment_date: getCurrentTimestamp(),
          is_partial_payment: false,
          payment_sequence: paymentMethods.indexOf(payment) + 1,
          notes: null
        }, false);

        const { error: createError } = await supabase
          .from('sale_payment_details')
          .insert([createData]);

        if (createError) throw createError;
      }

      console.log('✅ Todos los cambios guardados - obteniendo datos actualizados...');

      // ✅ OBTENER VENTA ACTUALIZADA CON TODAS LAS RELACIONES
      const { data: updatedSale, error: fetchError } = await supabase
        .from('sales')
        .select(SALE_SELECT_QUERY)
        .eq('id', sale.id)
        .single();

      if (fetchError) {
        console.error('❌ Error obteniendo venta actualizada:', fetchError);
        throw fetchError;
      }

      console.log('✅ Venta actualizada obtenida:', updatedSale);
      notify.success(`Venta ${sale.sale_number} actualizada correctamente`);
      
      // 🎯 PROCESAR SALE PARA COMPATIBILIDAD CON SALESHISTORYPAGE
      const processedSale = processSaleForCallback(updatedSale);
      console.log('🔄 Ejecutando callback de éxito con datos procesados...');
      onSuccess(processedSale);
      
      // Cerrar modal después del callback
      onClose();

    } catch (error: any) {
      console.error('❌ Error actualizando venta:', error);
      setNetworkError(`Error al actualizar venta: ${error.message}`);
      notify.error(`Error al actualizar venta: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }, [sale, hasChanges, validationErrors, notes, totalPayments, totalCommissions, mixedPayment, paymentMethods, baseNetTotal, addAuditFieldsFor, supabase, getCommissionRate, processSaleForCallback, onSuccess, onClose, formatPrice]);

  // ✅ NUEVOS MANEJADORES SIN ALERT.CONFIRM - SIN SUPERPOSICIÓN
  const handleSave = useCallback(() => {
    if (!canProcessPayment || validationErrors.length > 0 || processing) return;
    setPendingAction('save');
    setConfirmOpen(true);
  }, [canProcessPayment, validationErrors, processing]);

  const handleClose = useCallback(() => {
    if (hasChanges && !processing) {
      setPendingAction('close');
      setConfirmOpen(true);
    } else {
      onClose();
    }
  }, [hasChanges, processing, onClose]);

  // ✅ MANEJADOR DE CONFIRMACIÓN INTEGRADA
  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    if (pendingAction === 'save') {
      executeSave();
    } else if (pendingAction === 'close') {
      onClose();
    }
    setPendingAction(null);
  }, [pendingAction, executeSave, onClose]);

  const handleConfirmClose = useCallback(() => {
    setConfirmOpen(false);
    setPendingAction(null);
  }, []);

  // ✅ EFECTOS DE INICIALIZACIÓN
  useEffect(() => {
    if (!sale || !open) return;

    const calculatedBaseNet = calculateBaseNetTotal(sale.sale_payment_details || []);
    setBaseNetTotal(calculatedBaseNet);

    const initialPayments: PaymentMethodForm[] = (sale.sale_payment_details || []).map(p => ({
      id: p.id,
      method: p.payment_method,
      amount: p.amount,
      reference: p.payment_reference,
      isNew: false,
      toDelete: false
    }));

    setPaymentMethods(initialPayments.length > 0 ? initialPayments : [{
      method: 'efectivo',
      amount: calculatedBaseNet,
      isNew: false,
      toDelete: false
    }]);
    
    setNotes(sale.notes || '');
    setMixedPayment((sale.is_mixed_payment || false) && initialPayments.length > 1);
    setNetworkError(null);
  }, [sale, open, calculateBaseNetTotal]);

  useEffect(() => {
    if (mixedPayment) {
      if (paymentMethods.length === 1) {
        setPaymentMethods(prev => [
          prev[0],
          { method: 'debito', amount: 0, isNew: true, toDelete: false }
        ]);
      }
    } else {
      if (paymentMethods.length > 1) {
        setQuickPayment();
      }
    }
  }, [mixedPayment, setQuickPayment, paymentMethods.length]);

  // ✅ SSR SAFETY MUSCLEUP v7.0
  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
            <Typography sx={{ color: colorTokens.textSecondary }}>
              Cargando editor MuscleUp...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sale) {
    return null;
  }

  return (
    <>
      {/* ✅ MODAL PRINCIPAL DE EDICIÓN */}
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
        {/* ✅ HEADER CON INFORMACIÓN DE VENTA */}
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
          color: colorTokens.textPrimary,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <EditIcon sx={{ fontSize: 28 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              Editar Venta: {sale.sale_number}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {formatTimestampForDisplay(sale.created_at)} • Base Productos: {formatPrice(baseNetTotal)}
            </Typography>
          </Box>
          <Chip
            icon={<HistoryIcon />}
            label={sale.status}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: colorTokens.textPrimary,
              fontWeight: 600
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* ✅ ALERTAS PRESERVADAS DEL PAYMENTDIALOG */}
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
                {networkError}
              </Typography>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Errores de validación:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>
                    <Typography variant="body2">{error}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {/* ✅ ALERTA INFORMATIVA: MOSTRAR VALOR BASE CALCULADO */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Valor Base de Productos:</strong> {formatPrice(baseNetTotal)} 
              (calculado desde pagos originales sin comisiones)
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* ✅ INFORMACIÓN DE VENTA (READ-ONLY) */}
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
                  Información de Venta (Solo Lectura)
                </Typography>

                {sale.customer && (
                  <Box sx={{ mb: 2, p: 2, backgroundColor: `${colorTokens.success}10`, borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      Cliente: {sale.customer.firstName} {sale.customer.lastName || ''}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      {sale.customer.email}
                    </Typography>
                  </Box>
                )}

                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {(sale.sale_items || []).map(item => (
                    <ListItem key={item.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={item.product_name}
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
                    <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(sale.subtotal)}</Typography>
                  </Box>
                  
                  {(sale.tax_amount || 0) > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ color: colorTokens.textSecondary }}>IVA:</Typography>
                      <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(sale.tax_amount || 0)}</Typography>
                    </Box>
                  )}
                  
                  {((sale.discount_amount || 0) + (sale.coupon_discount || 0)) > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ color: colorTokens.danger }}>Descuentos:</Typography>
                      <Typography sx={{ color: colorTokens.danger }}>
                        -{formatPrice((sale.discount_amount || 0) + (sale.coupon_discount || 0))}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1, borderColor: colorTokens.divider }} />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      BASE PRODUCTOS:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                      {formatPrice(baseNetTotal)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* ✅ MÉTODOS DE PAGO CON LÓGICA CORREGIDA */}
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

                {/* ✅ BOTÓN PAGO EXACTO CORREGIDO */}
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
                    : `Pago Exacto Efectivo: ${formatPrice(baseNetTotal + (getCommissionRate('efectivo') > 0 ? baseNetTotal * getCommissionRate('efectivo') / 100 : 0))}`
                  }
                </Button>

                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {paymentMethods.map((pm, index) => (
                    <Paper
                      key={`${pm.id || 'new'}-${index}`}
                      sx={{
                        p: 2,
                        mb: 2,
                        background: pm.toDelete 
                          ? `${colorTokens.danger}20` 
                          : pm.isNew 
                            ? `${colorTokens.success}20` 
                            : colorTokens.surfaceLevel2,
                        border: `1px solid ${pm.toDelete 
                          ? colorTokens.danger 
                          : pm.isNew 
                            ? colorTokens.success 
                            : colorTokens.border}`,
                        opacity: pm.toDelete ? 0.6 : 1
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
                                disabled={pm.toDelete || processing || (mixedPayment && index === 0)}
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
                            disabled={commissionsLoading || processing || pm.toDelete || (!mixedPayment ? true : index > 0)}
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
                                ? "Auto-calculado desde base" 
                                : index === 0 
                                  ? "Ingresa monto del cliente" 
                                  : "Auto-calculado"
                            }
                          />
                        </Grid>

                        <Grid size={{ xs: 4, sm: 2 }}>
                          {pm.toDelete ? (
                            <IconButton
                              onClick={() => restorePayment(index)}
                              disabled={processing}
                              sx={{ color: colorTokens.success }}
                              title="Restaurar"
                            >
                              <AddIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              onClick={() => removePayment(index)}
                              disabled={processing}
                              sx={{ color: colorTokens.danger }}
                              title="Eliminar"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Grid>

                        {pm.method !== 'efectivo' && !pm.toDelete && (
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Referencia"
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

                      {/* ✅ ALERTA DE COMISIÓN PRESERVADA */}
                      {pm.amount > 0 && getCommissionRate(pm.method) > 0 && (
                        <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                          {(() => {
                            const rate = getCommissionRate(pm.method);
                            const commissionAmount = (pm.amount * rate) / 100;
                            return `Comisión ${rate}%: ${formatPrice(commissionAmount)}`;
                          })()}
                        </Alert>
                      )}

                      {pm.isNew && (
                        <Chip 
                          label="NUEVO" 
                          size="small" 
                          sx={{ 
                            mt: 1, 
                            backgroundColor: colorTokens.success, 
                            color: colorTokens.textPrimary,
                            fontWeight: 600
                          }} 
                        />
                      )}

                      {pm.toDelete && (
                        <Chip 
                          label="A ELIMINAR" 
                          size="small" 
                          sx={{ 
                            mt: 1, 
                            backgroundColor: colorTokens.danger, 
                            color: colorTokens.textPrimary,
                            fontWeight: 600
                          }} 
                        />
                      )}
                    </Paper>
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPaymentMethod}
                  fullWidth
                  disabled={commissionsLoading || processing}
                  sx={{
                    mb: 3,
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

                {/* ✅ NOTAS EDITABLES */}
                <TextField
                  fullWidth
                  label="Notas de la Venta"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={processing}
                  placeholder="Agregar notas adicionales..."
                  InputProps={{
                    sx: { color: colorTokens.textPrimary }
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colorTokens.border },
                      '&:hover fieldset': { borderColor: colorTokens.brand },
                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                    }
                  }}
                />

                {/* ✅ RESUMEN FINAL CORREGIDO CON baseNetTotal */}
                <Box sx={{ p: 2, backgroundColor: `${colorTokens.brand}10`, borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Base Productos:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {formatPrice(baseNetTotal)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Total Pagado:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {formatPrice(totalPayments)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Comisiones:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                      {formatPrice(totalCommissions)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1, borderColor: colorTokens.divider }} />

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textSecondary }}>
                      Total Neto:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ 
                      color: Math.abs(netTotal - baseNetTotal) <= EPSILON 
                        ? colorTokens.success 
                        : colorTokens.danger 
                    }}>
                      {formatPrice(netTotal)}
                    </Typography>
                  </Box>
                </Box>

                {/* ✅ VALIDACIONES CORREGIDAS */}
                {Math.abs(netTotal - baseNetTotal) > EPSILON && !commissionsLoading && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Diferencia: {formatPrice(Math.abs(netTotal - baseNetTotal))}
                  </Alert>
                )}

                {mixedPayment && totalCommissions > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Pago Mixto:</strong> Base productos {formatPrice(baseNetTotal)} + 
                      comisiones {formatPrice(totalCommissions)} = {formatPrice(totalPayments)}
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
            {hasChanges ? 'Cancelar' : 'Cerrar'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canProcessPayment || validationErrors.length > 0 || processing}
            variant="contained"
            startIcon={processing ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textPrimary,
              fontWeight: 'bold',
              px: 4,
              '&:hover': {
                background: `linear-gradient(135deg, ${colorTokens.infoHover}, ${colorTokens.info})`
              },
              '&:disabled': {
                background: colorTokens.neutral600,
                color: colorTokens.textMuted
              }
            }}
          >
            {processing ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ DIÁLOGO DE CONFIRMACIÓN INTEGRADO - SIN SUPERPOSICIÓN */}
      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
            border: `2px solid ${colorTokens.warning}`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${colorTokens.shadow}`
          }
        }}
        // ✅ ASEGURAR QUE ESTÉ SOBRE EL MODAL PRINCIPAL
        sx={{ 
          '& .MuiDialog-container': { 
            zIndex: (theme) => theme.zIndex.modal + 1 
          } 
        }}
      >
        <DialogTitle sx={{ 
          color: colorTokens.warning,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`
        }}>
          <WarningIcon sx={{ fontSize: 28 }} />
          Confirmar Acción
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: colorTokens.textPrimary, lineHeight: 1.6 }}>
            {pendingAction === 'save' ? (
              <>
                <strong>¿Confirmar cambios en la venta?</strong>
                <br /><br />
                Se modificarán los detalles de pago y registros de la venta:
                <br />• <strong>Venta:</strong> {sale?.sale_number}
                <br />• <strong>Base Productos:</strong> {formatPrice(baseNetTotal)}
                <br />• <strong>Total Pagos:</strong> {formatPrice(totalPayments)}
                <br />• <strong>Comisiones:</strong> {formatPrice(totalCommissions)}
                <br />• <strong>Total Neto:</strong> {formatPrice(netTotal)}
                <br /><br />
                <em>Esta acción no se puede deshacer.</em>
              </>
            ) : (
              <>
                <strong>¿Cerrar sin guardar?</strong>
                <br /><br />
                Tienes cambios sin guardar que se perderán:
                <br />• Métodos de pago modificados
                <br />• Notas editadas
                <br /><br />
                <em>Los cambios se descartarán permanentemente.</em>
              </>
            )}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleConfirmClose}
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
            onClick={handleConfirm} 
            variant="contained"
            startIcon={pendingAction === 'save' ? <CheckIcon /> : <CloseIcon />}
            sx={{ 
              background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              fontWeight: 'bold',
              '&:hover': {
                background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.warning})`
              }
            }}
          >
            {pendingAction === 'save' ? 'Confirmar Guardado' : 'Descartar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}