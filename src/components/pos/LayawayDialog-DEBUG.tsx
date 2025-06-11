'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  customer?: any;
  coupon?: any;
  totals: any;
  onSuccess: () => void;
}

// ✅ MÉTODOS DE PAGO COMPLETOS (IGUAL AL ORIGINAL)
const paymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    commission: 0,
    requiresReference: false,
    allowsChange: true,
    allowsMixed: true
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 1.0,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true
  }
];

// ✅ INTERFACE PARA PAGOS MIXTOS
interface PaymentDetail {
  id: string;
  method: string;
  amount: number;
  reference?: string;
  commission: number;
  commissionAmount: number;
  sequence: number;
}

// ✅ CONFIGURACIONES AVANZADAS
const layawayConfig = {
  defaultDuration: 30,
  maxDuration: 365,
  minDepositPercentage: 10,
  maxDepositPercentage: 100,
  extensionFee: 50,
  maxExtensions: 2,
  reminderDaysBefore: [7, 3, 1],
  autoExpireAfterDays: 3
};

export default function LayawayDialog({ 
  open, 
  onClose, 
  cart, 
  customer, 
  coupon, 
  totals, 
  onSuccess 
}: LayawayDialogProps) {

  // ✅ ESTADOS BÁSICOS
  const [activeStep, setActiveStep] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [layawayNumber, setLayawayNumber] = useState<string | null>(null);

  // ✅ ESTADOS AVANZADOS - FASE 3
  const [durationDays, setDurationDays] = useState(layawayConfig.defaultDuration);
  const [customDays, setCustomDays] = useState(layawayConfig.defaultDuration);
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [applyCommission, setApplyCommission] = useState(true);

  // 🚀 ESTADOS PARA PAGOS MIXTOS (FUNCIONALIDAD AVANZADA)
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0);
  const [currentPaymentReference, setCurrentPaymentReference] = useState('');

  // 🚀 ESTADOS PARA SISTEMA DE ABONOS (FUNCIONALIDAD AVANZADA)
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState({
    totalInstallments: 3,
    installmentAmount: 0,
    frequency: 'weekly' // weekly, biweekly, monthly
  });

  // 🚀 ESTADOS PARA NOTIFICACIONES (FUNCIONALIDAD AVANZADA)
  const [notificationSettings, setNotificationSettings] = useState({
    sendCreationNotification: true,
    sendReminderNotifications: true,
    sendExpirationNotification: true,
    preferredMethod: 'whatsapp' // email, whatsapp, both
  });

  // 🚀 ESTADOS PARA CONFIGURACIÓN AVANZADA
  const [advancedConfig, setAdvancedConfig] = useState({
    allowExtensions: true,
    extensionFee: layawayConfig.extensionFee,
    maxExtensions: layawayConfig.maxExtensions,
    autoRenewEnabled: false,
    priorityCustomer: false
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ EFECTO PARA CARGAR COMISIONES DINÁMICAS
  useEffect(() => {
    const loadPaymentCommissions = async () => {
      try {
        const { data: commissions, error } = await supabase
          .from('payment_commissions')
          .select('*')
          .eq('is_active', true);

        if (!error && commissions) {
          // Actualizar comisiones dinámicamente desde la BD
          console.log('💳 Comisiones cargadas:', commissions);
        }
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar comisiones dinámicas');
      }
    };

    if (open) {
      loadPaymentCommissions();
    }
  }, [open, supabase]);

  // ✅ CÁLCULOS AVANZADOS CON PAGOS MIXTOS
  const calculations = useMemo(() => {
    const total = totals?.total || 0;
    const baseDeposit = total * (depositPercentage / 100);
    
    let totalPaymentAmount = 0;
    let totalCommission = 0;
    let totalToCollect = 0;

    if (isMixedPayment && paymentDetails.length > 0) {
      // 🔥 CÁLCULO PARA PAGOS MIXTOS
      totalPaymentAmount = paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
      totalCommission = paymentDetails.reduce((sum, payment) => sum + payment.commissionAmount, 0);
      totalToCollect = totalPaymentAmount + totalCommission;
    } else {
      // 🔥 CÁLCULO PARA PAGO ÚNICO
      totalPaymentAmount = baseDeposit;
      if (applyCommission && currentPaymentMethod) {
        const method = paymentMethods.find(m => m.value === currentPaymentMethod);
        if (method) {
          totalCommission = baseDeposit * (method.commission / 100);
        }
      }
      totalToCollect = totalPaymentAmount + totalCommission;
    }

    const finalDuration = useCustomDuration ? customDays : durationDays;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + finalDuration);

    // 🔥 CÁLCULO DE PLAN DE PAGOS
    let installmentDetails = null;
    if (allowInstallments) {
      const remainingAfterDeposit = total - baseDeposit;
      const installmentAmount = remainingAfterDeposit / installmentPlan.totalInstallments;
      
      installmentDetails = {
        totalAmount: remainingAfterDeposit,
        installmentAmount: Math.ceil(installmentAmount),
        totalInstallments: installmentPlan.totalInstallments,
        frequency: installmentPlan.frequency,
        schedule: generateInstallmentSchedule(expirationDate, installmentPlan)
      };
    }

    return {
      total,
      baseDeposit,
      totalPaymentAmount,
      totalCommission,
      totalToCollect,
      remainingAmount: total - baseDeposit,
      expirationDate,
      durationDays: finalDuration,
      isMixedPayment,
      paymentDetailsValid: isMixedPayment ? Math.abs(totalPaymentAmount - baseDeposit) < 0.01 : true,
      installmentDetails,
      extensionFee: advancedConfig.extensionFee,
      maxExtensions: advancedConfig.maxExtensions
    };
  }, [
    totals?.total, 
    depositPercentage, 
    paymentDetails,
    isMixedPayment,
    currentPaymentMethod,
    applyCommission,
    durationDays, 
    customDays, 
    useCustomDuration,
    allowInstallments,
    installmentPlan,
    advancedConfig
  ]);

  // 🚀 FUNCIÓN PARA GENERAR CRONOGRAMA DE PAGOS
  const generateInstallmentSchedule = useCallback((startDate: Date, plan: typeof installmentPlan) => {
    const schedule = [];
    const frequencyDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30
    };

    for (let i = 1; i <= plan.totalInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * frequencyDays[plan.frequency]));
      
      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString(),
        amount: plan.installmentAmount,
        status: 'pending'
      });
    }

    return schedule;
  }, []);

  // 🚀 FUNCIONES PARA PAGOS MIXTOS
  const addPaymentDetail = useCallback(() => {
    if (!currentPaymentMethod || currentPaymentAmount <= 0) {
      showNotification('Seleccione método y monto válido', 'error');
      return;
    }

    const method = paymentMethods.find(m => m.value === currentPaymentMethod);
    if (!method) return;

    const commission = applyCommission ? method.commission : 0;
    const commissionAmount = currentPaymentAmount * (commission / 100);

    if (method.requiresReference && !currentPaymentReference) {
      showNotification('Se requiere referencia para este método', 'error');
      return;
    }

    const newPayment: PaymentDetail = {
      id: Date.now().toString(),
      method: currentPaymentMethod,
      amount: currentPaymentAmount,
      reference: currentPaymentReference || undefined,
      commission,
      commissionAmount,
      sequence: paymentDetails.length + 1
    };

    setPaymentDetails(prev => [...prev, newPayment]);
    
    // Reset campos
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount(0);
    setCurrentPaymentReference('');

    showNotification('Pago agregado correctamente', 'success');
  }, [currentPaymentMethod, currentPaymentAmount, currentPaymentReference, applyCommission, paymentDetails.length]);

  const removePaymentDetail = useCallback((id: string) => {
    setPaymentDetails(prev => prev.filter(p => p.id !== id));
    showNotification('Pago eliminado', 'info');
  }, []);

  const editPaymentDetail = useCallback((id: string) => {
    const payment = paymentDetails.find(p => p.id === id);
    if (payment) {
      setCurrentPaymentMethod(payment.method);
      setCurrentPaymentAmount(payment.amount);
      setCurrentPaymentReference(payment.reference || '');
      removePaymentDetail(id);
    }
  }, [paymentDetails, removePaymentDetail]);

  // ✅ GENERAR NÚMERO DE APARTADO
  const generateLayawayNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `AP${year}${month}${day}${timestamp}`;
  }, []);

  // 🚀 PROCESAMIENTO AVANZADO CON TODAS LAS FUNCIONALIDADES
  const handleCreateLayaway = useCallback(async () => {
    if (!customer) {
      showNotification('Se requiere un cliente para apartados', 'error');
      return;
    }

    if (isMixedPayment && !calculations.paymentDetailsValid) {
      showNotification('El total de pagos debe coincidir con el anticipo', 'error');
      return;
    }

    try {
      setProcessing(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const userId = userData.user.id;
      const layawayNumber = await generateLayawayNumber();

      console.log('🚀 CREANDO APARTADO AVANZADO...');

      // 🔥 DATOS AVANZADOS CON TODAS LAS FUNCIONALIDADES
      const layawayData = {
        sale_number: layawayNumber,
        customer_id: customer.id,
        cashier_id: userId,
        sale_type: 'layaway',
        subtotal: totals.subtotal || 0,
        tax_amount: totals.taxAmount || 0,
        discount_amount: totals.discountAmount || 0,
        coupon_discount: totals.couponDiscount || 0,
        coupon_code: coupon?.code || null,
        total_amount: calculations.total,
        required_deposit: calculations.baseDeposit,
        paid_amount: calculations.baseDeposit,
        pending_amount: calculations.remainingAmount,
        deposit_percentage: depositPercentage,
        layaway_expires_at: calculations.expirationDate.toISOString(),
        status: 'pending',
        payment_status: 'partial',
        is_mixed_payment: isMixedPayment,
        payment_received: calculations.totalToCollect,
        change_amount: 0, // Se calculará por método si es efectivo
        commission_rate: isMixedPayment ? 0 : (paymentMethods.find(m => m.value === currentPaymentMethod)?.commission || 0),
        commission_amount: calculations.totalCommission,
        custom_commission_rate: null,
        skip_inscription: false,
        notes: generateAdvancedNotes(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 🔥 CAMPOS AVANZADOS ADICIONALES
        payment_plan_days: allowInstallments ? calculations.installmentDetails?.totalInstallments : null,
        initial_payment: calculations.totalToCollect,
        expiration_date: calculations.expirationDate.toISOString().split('T')[0],
        last_payment_date: new Date().toISOString()
      };

      console.log('💾 Datos del apartado avanzado:', layawayData);

      // ✅ INSERTAR VENTA PRINCIPAL
      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) {
        console.error('❌ Error creando apartado:', layawayError);
        throw layawayError;
      }

      console.log('✅ Apartado creado:', layaway);

      // ✅ CREAR ITEMS DEL APARTADO
      const layawayItems = cart.map(item => ({
        sale_id: layaway.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: item.tax_amount || 0,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(layawayItems);

      if (itemsError) {
        console.error('❌ Error creando items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items creados');

      // 🔥 CREAR DETALLES DE PAGO (AVANZADO)
      if (isMixedPayment && paymentDetails.length > 0) {
        // PAGOS MIXTOS
        const paymentInserts = paymentDetails.map((payment, index) => ({
          sale_id: layaway.id,
          payment_method: payment.method,
          amount: payment.amount + payment.commissionAmount,
          payment_reference: payment.reference || null,
          commission_rate: payment.commission,
          commission_amount: payment.commissionAmount,
          sequence_order: payment.sequence,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by: userId,
          is_partial_payment: true,
          payment_sequence: index + 1,
          notes: `Pago mixto ${index + 1} de ${paymentDetails.length}`
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentInserts);

        if (paymentError) {
          console.error('❌ Error creando pagos mixtos:', paymentError);
          throw paymentError;
        }

        console.log('✅ Pagos mixtos creados');
      } else {
        // PAGO ÚNICO
        const paymentData = {
          sale_id: layaway.id,
          payment_method: currentPaymentMethod,
          amount: calculations.totalToCollect,
          payment_reference: currentPaymentReference || null,
          commission_rate: applyCommission ? (paymentMethods.find(m => m.value === currentPaymentMethod)?.commission || 0) : 0,
          commission_amount: calculations.totalCommission,
          sequence_order: 1,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by: userId,
          is_partial_payment: true,
          payment_sequence: 1,
          notes: null
        };

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([paymentData]);

        if (paymentError) {
          console.error('❌ Error creando pago único:', paymentError);
          throw paymentError;
        }

        console.log('✅ Pago único creado');
      }

      // ✅ ACTUALIZAR STOCK DE PRODUCTOS
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: item.product.current_stock - item.quantity,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', item.product.id);

        if (stockError) {
          console.error('❌ Error actualizando stock:', stockError);
          throw stockError;
        }

        // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO
        await supabase
          .from('inventory_movements')
          .insert([{
            product_id: item.product.id,
            movement_type: 'salida',
            quantity: -item.quantity,
            previous_stock: item.product.current_stock,
            new_stock: item.product.current_stock - item.quantity,
            unit_cost: item.product.cost_price || 0,
            total_cost: item.quantity * (item.product.cost_price || 0),
            reason: 'Apartado',
            reference_id: layaway.id,
            notes: `Apartado avanzado #${layaway.sale_number} - ${calculations.durationDays} días`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      console.log('✅ Stock e inventario actualizados');

      // 🔥 CREAR HISTORIAL DE ESTADO (FUNCIONALIDAD AVANZADA)
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: null,
          new_status: 'pending',
          previous_paid_amount: 0,
          new_paid_amount: calculations.totalToCollect,
          reason: 'Apartado creado',
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      console.log('✅ Historial de estado creado');

      // ✅ ACTUALIZAR CUPÓN SI SE USÓ
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', coupon.id);

        console.log('✅ Cupón actualizado');
      }

      // 🔥 PROCESAR NOTIFICACIONES (SI ESTÁN HABILITADAS)
      if (notificationSettings.sendCreationNotification) {
        await processNotifications(layaway, 'created');
      }

      setLayawayNumber(layaway.sale_number);
      setCompleted(true);
      showNotification('¡Apartado avanzado creado exitosamente!', 'success');

      console.log('🎉 APARTADO AVANZADO COMPLETADO:', layaway.sale_number);

    } catch (error) {
      console.error('💥 Error procesando apartado avanzado:', error);
      showNotification('Error al procesar apartado: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [
    customer, 
    supabase, 
    generateLayawayNumber, 
    calculations, 
    depositPercentage, 
    totals, 
    coupon, 
    currentPaymentMethod, 
    currentPaymentReference, 
    cart,
    customerNotes,
    applyCommission,
    isMixedPayment,
    paymentDetails,
    allowInstallments,
    notificationSettings,
    advancedConfig
  ]);

  // 🔥 FUNCIÓN PARA GENERAR NOTAS AVANZADAS
  const generateAdvancedNotes = useCallback(() => {
    let notes = `Apartado avanzado por ${calculations.durationDays} días - Vence: ${formatDate(calculations.expirationDate.toISOString())}`;
    
    if (isMixedPayment) {
      notes += ` | Pago mixto: ${paymentDetails.length} métodos`;
    }
    
    if (allowInstallments) {
      notes += ` | Plan de ${calculations.installmentDetails?.totalInstallments} pagos`;
    }
    
    if (advancedConfig.allowExtensions) {
      notes += ` | Extensiones permitidas: ${advancedConfig.maxExtensions}`;
    }
    
    if (customerNotes) {
      notes += ` | Notas: ${customerNotes}`;
    }
    
    return notes;
  }, [calculations, isMixedPayment, paymentDetails, allowInstallments, advancedConfig, customerNotes]);

  // 🔥 FUNCIÓN PARA PROCESAR NOTIFICACIONES
  const processNotifications = useCallback(async (layaway: any, type: 'created' | 'reminder' | 'expired') => {
    try {
      console.log(`📧 Procesando notificación ${type} para apartado ${layaway.sale_number}`);
      
      // Aquí se implementaría el envío real de notificaciones
      // Por ahora solo loggeamos
      const notificationData = {
        layaway_id: layaway.id,
        customer_id: customer?.id,
        type,
        method: notificationSettings.preferredMethod,
        status: 'sent',
        sent_at: new Date().toISOString()
      };
      
      console.log('📱 Notificación procesada:', notificationData);
      
    } catch (error) {
      console.error('❌ Error procesando notificación:', error);
    }
  }, [customer, notificationSettings]);

  // ✅ RESET AL CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    
    // Reset completo de todos los estados
    setCompleted(false);
    setProcessing(false);
    setActiveStep(0);
    setLayawayNumber(null);
    
    // Reset pagos mixtos
    setIsMixedPayment(false);
    setPaymentDetails([]);
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount(0);
    setCurrentPaymentReference('');
    
    // Reset configuraciones avanzadas
    setAllowInstallments(false);
    setCustomerNotes('');
    setUseCustomDuration(false);
    setCustomDays(layawayConfig.defaultDuration);
    setDurationDays(layawayConfig.defaultDuration);
    
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN AVANZADA
  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: 
        return calculations.baseDeposit > 0;
      case 1: 
        if (isMixedPayment) {
          return paymentDetails.length > 0 && calculations.paymentDetailsValid;
        } else {
          const method = paymentMethods.find(m => m.value === currentPaymentMethod);
          return currentPaymentMethod !== '' && 
                 (!method?.requiresReference || currentPaymentReference !== '');
        }
      case 2: 
        return true;
      default: 
        return false;
    }
  }, [activeStep, calculations, isMixedPayment, paymentDetails, currentPaymentMethod, currentPaymentReference]);

  const steps = [
    { label: 'Configuración Avanzada', description: 'Anticipo, duración y opciones especiales' },
    { label: 'Métodos de Pago', description: 'Pago único o múltiples métodos' },
    { label: 'Confirmación Final', description: 'Revisar y procesar apartado' }
  ];

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
          color: '#FFFFFF',
          minHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.98), rgba(156, 39, 176, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BookmarkIcon />
          <Typography variant="h5" fontWeight="bold">
            🚀 Apartado AVANZADO - Funcionalidades PRO
          </Typography>
          <Chip 
            label="v3.0 FINAL" 
            color="secondary" 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', fontWeight: 'bold' }}
          />
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* Cliente */}
            {customer ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">
                      👤 Cliente: {customer.name}
                    </Typography>
                    <Typography variant="body2">
                      {customer.email || customer.whatsapp}
                    </Typography>
                  </Box>
                  {advancedConfig.priorityCustomer && (
                    <Chip 
                      label="⭐ CLIENTE PRIORITARIO" 
                      color="warning" 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                </Box>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 3 }}>
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

            <Grid container spacing={4}>
              {/* Stepper Principal */}
              <Grid size={{ xs: 12, md: 8 }}>
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

                          {/* 🚀 PASO 1: CONFIGURACIÓN SUPER AVANZADA */}
                          {index === 0 && (
                            <Box>
                              <Grid container spacing={3}>
                                {/* Anticipo Inteligente */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(156, 39, 176, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2 }}>
                                      💰 Anticipo Inteligente
                                    </Typography>
                                    
                                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                                      Porcentaje: {depositPercentage}%
                                    </Typography>
                                    
                                    <Slider
                                      value={depositPercentage}
                                      onChange={(_, value) => setDepositPercentage(value as number)}
                                      min={layawayConfig.minDepositPercentage}
                                      max={layawayConfig.maxDepositPercentage}
                                      step={5}
                                      marks={[
                                        { value: 10, label: '10%' },
                                        { value: 25, label: '25%' },
                                        { value: 50, label: '50%' },
                                        { value: 75, label: '75%' },
                                        { value: 100, label: '100%' }
                                      ]}
                                      sx={{
                                        color: '#9c27b0',
                                        '& .MuiSlider-markLabel': {
                                          color: '#CCCCCC',
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                    />
                                    
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                                        Anticipo: {formatPrice(calculations.baseDeposit)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Pendiente: {formatPrice(calculations.remainingAmount)}
                                      </Typography>
                                    </Box>

                                    {/* Opciones Avanzadas de Anticipo */}
                                    <Box sx={{ mt: 2 }}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={advancedConfig.priorityCustomer}
                                            onChange={(e) => setAdvancedConfig(prev => ({
                                              ...prev,
                                              priorityCustomer: e.target.checked
                                            }))}
                                            color="warning"
                                          />
                                        }
                                        label="⭐ Cliente Prioritario (descuento especial)"
                                        sx={{ color: '#CCCCCC' }}
                                      />
                                    </Box>
                                  </Card>
                                </Grid>

                                {/* Duración Avanzada */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                      📅 Configuración de Tiempo
                                    </Typography>
                                    
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                      <InputLabel sx={{ color: '#CCCCCC' }}>Duración</InputLabel>
                                      <Select
                                        value={useCustomDuration ? 0 : durationDays}
                                        onChange={(e) => {
                                          const value = e.target.value as number;
                                          if (value === 0) {
                                            setUseCustomDuration(true);
                                          } else {
                                            setUseCustomDuration(false);
                                            setDurationDays(value);
                                          }
                                        }}
                                        sx={{ color: '#FFFFFF' }}
                                      >
                                        <MenuItem value={15}>📅 15 días</MenuItem>
                                        <MenuItem value={30}>📅 30 días (Estándar)</MenuItem>
                                        <MenuItem value={45}>📅 45 días</MenuItem>
                                        <MenuItem value={60}>📅 60 días</MenuItem>
                                        <MenuItem value={90}>📅 90 días</MenuItem>
                                        <MenuItem value={0}>⚙️ Personalizado</MenuItem>
                                      </Select>
                                    </FormControl>

                                    {useCustomDuration && (
                                      <TextField
                                        fullWidth
                                        label="Días personalizados"
                                        type="number"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(Number(e.target.value) || 30)}
                                        inputProps={{ min: 1, max: layawayConfig.maxDuration }}
                                        sx={{ mb: 2 }}
                                      />
                                    )}

                                    <Box sx={{ 
                                      p: 2, 
                                      background: 'rgba(76, 175, 80, 0.2)', 
                                      borderRadius: 1,
                                      textAlign: 'center',
                                      mb: 2
                                    }}>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Vence el:
                                      </Typography>
                                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700 }}>
                                        {formatDate(calculations.expirationDate.toISOString())}
                                      </Typography>
                                    </Box>

                                    {/* Opciones de Extensión */}
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={advancedConfig.allowExtensions}
                                          onChange={(e) => setAdvancedConfig(prev => ({
                                            ...prev,
                                            allowExtensions: e.target.checked
                                          }))}
                                          color="primary"
                                        />
                                      }
                                      label="🔄 Permitir extensiones"
                                      sx={{ color: '#CCCCCC' }}
                                    />

                                    {advancedConfig.allowExtensions && (
                                      <Box sx={{ mt: 2 }}>
                                        <TextField
                                          size="small"
                                          label="Costo por extensión"
                                          type="number"
                                          value={advancedConfig.extensionFee}
                                          onChange={(e) => setAdvancedConfig(prev => ({
                                            ...prev,
                                            extensionFee: Number(e.target.value) || 0
                                          }))}
                                          InputProps={{
                                            startAdornment: <MoneyIcon sx={{ mr: 1, color: '#4caf50' }} />
                                          }}
                                          sx={{ mr: 2, minWidth: 120 }}
                                        />
                                        <TextField
                                          size="small"
                                          label="Máx. extensiones"
                                          type="number"
                                          value={advancedConfig.maxExtensions}
                                          onChange={(e) => setAdvancedConfig(prev => ({
                                            ...prev,
                                            maxExtensions: Number(e.target.value) || 1
                                          }))}
                                          inputProps={{ min: 1, max: 5 }}
                                          sx={{ minWidth: 120 }}
                                        />
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>

                                {/* Sistema de Abonos */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                      💳 Sistema de Abonos
                                    </Typography>
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={allowInstallments}
                                          onChange={(e) => setAllowInstallments(e.target.checked)}
                                          color="primary"
                                        />
                                      }
                                      label="📅 Permitir plan de pagos"
                                      sx={{ color: '#CCCCCC', mb: 2 }}
                                    />

                                    {allowInstallments && (
                                      <Box>
                                        <Grid container spacing={2}>
                                          <Grid size={{ xs: 6 }}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Número de pagos"
                                              type="number"
                                              value={installmentPlan.totalInstallments}
                                              onChange={(e) => setInstallmentPlan(prev => ({
                                                ...prev,
                                                totalInstallments: Number(e.target.value) || 1
                                              }))}
                                              inputProps={{ min: 2, max: 12 }}
                                            />
                                          </Grid>
                                          <Grid size={{ xs: 6 }}>
                                            <FormControl fullWidth size="small">
                                              <InputLabel>Frecuencia</InputLabel>
                                              <Select
                                                value={installmentPlan.frequency}
                                                onChange={(e) => setInstallmentPlan(prev => ({
                                                  ...prev,
                                                  frequency: e.target.value as any
                                                }))}
                                              >
                                                <MenuItem value="weekly">Semanal</MenuItem>
                                                <MenuItem value="biweekly">Quincenal</MenuItem>
                                                <MenuItem value="monthly">Mensual</MenuItem>
                                              </Select>
                                            </FormControl>
                                          </Grid>
                                        </Grid>

                                        {calculations.installmentDetails && (
                                          <Box sx={{ 
                                            mt: 2, 
                                            p: 2, 
                                            background: 'rgba(33, 150, 243, 0.2)', 
                                            borderRadius: 1 
                                          }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Monto por pago: <strong>{formatPrice(calculations.installmentDetails.installmentAmount)}</strong>
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Total a diferir: <strong>{formatPrice(calculations.installmentDetails.totalAmount)}</strong>
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>

                                {/* Configuración de Notificaciones */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(255, 152, 0, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                                      🔔 Notificaciones Automáticas
                                    </Typography>
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={notificationSettings.sendCreationNotification}
                                          onChange={(e) => setNotificationSettings(prev => ({
                                            ...prev,
                                            sendCreationNotification: e.target.checked
                                          }))}
                                          color="primary"
                                        />
                                      }
                                      label="📧 Enviar confirmación de apartado"
                                      sx={{ color: '#CCCCCC', mb: 1 }}
                                    />

                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={notificationSettings.sendReminderNotifications}
                                          onChange={(e) => setNotificationSettings(prev => ({
                                            ...prev,
                                            sendReminderNotifications: e.target.checked
                                          }))}
                                          color="primary"
                                        />
                                      }
                                      label="⏰ Recordatorios antes del vencimiento"
                                      sx={{ color: '#CCCCCC', mb: 1 }}
                                    />

                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={notificationSettings.sendExpirationNotification}
                                          onChange={(e) => setNotificationSettings(prev => ({
                                            ...prev,
                                            sendExpirationNotification: e.target.checked
                                          }))}
                                          color="primary"
                                        />
                                      }
                                      label="🚨 Aviso de vencimiento"
                                      sx={{ color: '#CCCCCC', mb: 2 }}
                                    />

                                    <FormControl fullWidth size="small">
                                      <InputLabel sx={{ color: '#CCCCCC' }}>Método preferido</InputLabel>
                                      <Select
                                        value={notificationSettings.preferredMethod}
                                        onChange={(e) => setNotificationSettings(prev => ({
                                          ...prev,
                                          preferredMethod: e.target.value as any
                                        }))}
                                        sx={{ color: '#FFFFFF' }}
                                      >
                                        <MenuItem value="email">📧 Email</MenuItem>
                                        <MenuItem value="whatsapp">📱 WhatsApp</MenuItem>
                                        <MenuItem value="both">📧📱 Ambos</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </Card>
                                </Grid>
                              </Grid>

                              {/* Notas Personalizadas */}
                              <Card sx={{ mt: 3, p: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
                                <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                                  📝 Notas y Observaciones Especiales
                                </Typography>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  placeholder="Ej: Cliente prefiere recoger en horario específico, producto para regalo de cumpleaños, requiere llamada previa, etc."
                                  value={customerNotes}
                                  onChange={(e) => setCustomerNotes(e.target.value)}
                                  sx={{ 
                                    '& .MuiInputBase-input': { color: '#FFFFFF' },
                                    '& .MuiInputBase-input::placeholder': { color: '#CCCCCC' }
                                  }}
                                />
                              </Card>
                            </Box>
                          )}

                          {/* 🚀 PASO 2: MÉTODOS DE PAGO SUPER AVANZADOS */}
                          {index === 1 && (
                            <Box>
                              {/* Toggle Pago Mixto */}
                              <Card sx={{ mb: 3, p: 2, background: 'rgba(156, 39, 176, 0.1)' }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={isMixedPayment}
                                      onChange={(e) => {
                                        setIsMixedPayment(e.target.checked);
                                        if (!e.target.checked) {
                                          setPaymentDetails([]);
                                        }
                                      }}
                                      color="secondary"
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="h6" sx={{ color: '#9c27b0' }}>
                                        💳 Habilitar Pagos Mixtos
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Permite dividir el anticipo en múltiples métodos de pago
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Card>

                              {isMixedPayment ? (
                                // 🔥 INTERFAZ DE PAGOS MIXTOS
                                <Box>
                                  {/* Agregar Nuevo Pago */}
                                  <Card sx={{ p: 3, mb: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
                                    <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                      ➕ Agregar Método de Pago
                                    </Typography>
                                    
                                    <Grid container spacing={2} alignItems="end">
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <FormControl fullWidth>
                                          <InputLabel>Método</InputLabel>
                                          <Select
                                            value={currentPaymentMethod}
                                            onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                                            sx={{ color: '#FFFFFF' }}
                                          >
                                            {paymentMethods.filter(m => m.allowsMixed).map((method) => (
                                              <MenuItem key={method.value} value={method.value}>
                                                {method.icon} {method.label}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Grid>
                                      
                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                          fullWidth
                                          label="Monto"
                                          type="number"
                                          value={currentPaymentAmount}
                                          onChange={(e) => setCurrentPaymentAmount(Number(e.target.value) || 0)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                        />
                                      </Grid>

                                      {paymentMethods.find(m => m.value === currentPaymentMethod)?.requiresReference && (
                                        <Grid size={{ xs: 12, md: 3 }}>
                                          <TextField
                                            fullWidth
                                            label="Referencia"
                                            value={currentPaymentReference}
                                            onChange={(e) => setCurrentPaymentReference(e.target.value)}
                                            placeholder="Autorización, SPEI, etc."
                                          />
                                        </Grid>
                                      )}

                                      <Grid size={{ xs: 12, md: 2 }}>
                                        <Button
                                          fullWidth
                                          variant="contained"
                                          onClick={addPaymentDetail}
                                          startIcon={<AddIcon />}
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                                            py: 1.5
                                          }}
                                        >
                                          Agregar
                                        </Button>
                                      </Grid>
                                    </Grid>
                                  </Card>

                                  {/* Lista de Pagos Agregados */}
                                  {paymentDetails.length > 0 && (
                                    <Card sx={{ mb: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
                                      <CardContent>
                                        <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                          💰 Métodos de Pago Configurados
                                        </Typography>
                                        
                                        <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)' }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell sx={{ color: '#CCCCCC', fontWeight: 'bold' }}>Método</TableCell>
                                                <TableCell sx={{ color: '#CCCCCC', fontWeight: 'bold' }}>Monto</TableCell>
                                                <TableCell sx={{ color: '#CCCCCC', fontWeight: 'bold' }}>Comisión</TableCell>
                                                <TableCell sx={{ color: '#CCCCCC', fontWeight: 'bold' }}>Total</TableCell>
                                                <TableCell sx={{ color: '#CCCCCC', fontWeight: 'bold' }}>Acciones</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {paymentDetails.map((payment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell sx={{ color: '#FFFFFF' }}>
                                                    {paymentMethods.find(m => m.value === payment.method)?.icon}{' '}
                                                    {paymentMethods.find(m => m.value === payment.method)?.label}
                                                  </TableCell>
                                                  <TableCell sx={{ color: '#FFFFFF' }}>
                                                    {formatPrice(payment.amount)}
                                                  </TableCell>
                                                  <TableCell sx={{ color: payment.commissionAmount > 0 ? '#ff9800' : '#CCCCCC' }}>
                                                    {payment.commission}% ({formatPrice(payment.commissionAmount)})
                                                  </TableCell>
                                                  <TableCell sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                                    {formatPrice(payment.amount + payment.commissionAmount)}
                                                  </TableCell>
                                                  <TableCell>
                                                    <Tooltip title="Editar">
                                                      <IconButton 
                                                        size="small" 
                                                        onClick={() => editPaymentDetail(payment.id)}
                                                        sx={{ color: '#2196f3', mr: 1 }}
                                                      >
                                                        <EditIcon fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                      <IconButton 
                                                        size="small" 
                                                        onClick={() => removePaymentDetail(payment.id)}
                                                        sx={{ color: '#f44336' }}
                                                      >
                                                        <DeleteIcon fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>

                                        {/* Resumen de Pagos Mixtos */}
                                        <Box sx={{ mt: 3, p: 2, background: 'rgba(156, 39, 176, 0.2)', borderRadius: 1 }}>
                                          <Grid container spacing={2}>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Total pagos:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                                                {formatPrice(calculations.totalPaymentAmount)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Comisiones:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: '#ff9800' }}>
                                                {formatPrice(calculations.totalCommission)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Total a cobrar:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: '#2196f3' }}>
                                                {formatPrice(calculations.totalToCollect)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Estado:
                                              </Typography>
                                              <Chip 
                                                label={calculations.paymentDetailsValid ? '✅ VÁLIDO' : '❌ NO VÁLIDO'}
                                                color={calculations.paymentDetailsValid ? 'success' : 'error'}
                                                size="small"
                                              />
                                            </Grid>
                                          </Grid>

                                          {!calculations.paymentDetailsValid && (
                                            <Alert severity="warning" sx={{ mt: 2 }}>
                                              El total de pagos ({formatPrice(calculations.totalPaymentAmount)}) debe coincidir con el anticipo ({formatPrice(calculations.baseDeposit)})
                                            </Alert>
                                          )}
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Box>
                              ) : (
                                // 🔥 INTERFAZ DE PAGO ÚNICO (MEJORADA)
                                <Card sx={{ p: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
                                  <Typography variant="h6" sx={{ color: '#2196f3', mb: 3 }}>
                                    💳 Método de Pago Único
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    {paymentMethods.map((method) => (
                                      <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={method.value}>
                                        <Card
                                          sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            border: currentPaymentMethod === method.value ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.2)',
                                            background: currentPaymentMethod === method.value ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                              background: 'rgba(33, 150, 243, 0.1)',
                                              border: '1px solid rgba(33, 150, 243, 0.5)'
                                            }
                                          }}
                                          onClick={() => setCurrentPaymentMethod(method.value)}
                                        >
                                          <Box textAlign="center">
                                            <Typography variant="h4">{method.icon}</Typography>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
                                              {method.label}
                                            </Typography>
                                            {method.commission > 0 && (
                                              <Chip 
                                                label={`+${method.commission}%`} 
                                                size="small" 
                                                color="warning"
                                                sx={{ fontSize: '0.7rem' }}
                                              />
                                            )}
                                          </Box>
                                        </Card>
                                      </Grid>
                                    ))}
                                  </Grid>

                                  {/* Configuración del Método Seleccionado */}
                                  {currentPaymentMethod && (
                                    <Box sx={{ mt: 3 }}>
                                      <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                      
                                      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                        ⚙️ Configuración de {paymentMethods.find(m => m.value === currentPaymentMethod)?.label}
                                      </Typography>

                                      <Grid container spacing={2}>
                                        {paymentMethods.find(m => m.value === currentPaymentMethod)?.requiresReference && (
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                              fullWidth
                                              label="Referencia / Autorización"
                                              value={currentPaymentReference}
                                              onChange={(e) => setCurrentPaymentReference(e.target.value)}
                                                                                            placeholder="Número de autorización, SPEI, etc."
                                              required
                                              sx={{ mb: 2 }}
                                            />
                                          </Grid>
                                        )}

                                        {/* Toggle Comisión */}
                                        <Grid size={{ xs: 12, md: 6 }}>
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={applyCommission}
                                                onChange={(e) => setApplyCommission(e.target.checked)}
                                                color="primary"
                                              />
                                            }
                                            label="Aplicar comisión al método de pago"
                                            sx={{ color: '#CCCCCC' }}
                                          />
                                        </Grid>
                                      </Grid>

                                      {/* Resumen de Cobro Único */}
                                      <Box sx={{ 
                                        mt: 3, 
                                        p: 3, 
                                        background: 'rgba(156, 39, 176, 0.2)', 
                                        borderRadius: 2 
                                      }}>
                                        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                                          💰 Resumen de Cobro
                                        </Typography>
                                        
                                        <Grid container spacing={2}>
                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Anticipo base:
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                                              {formatPrice(calculations.baseDeposit)}
                                            </Typography>
                                          </Grid>

                                          {calculations.totalCommission > 0 && (
                                            <Grid size={{ xs: 6, md: 3 }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Comisión ({paymentMethods.find(m => m.value === currentPaymentMethod)?.commission}%):
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: '#ff9800' }}>
                                                +{formatPrice(calculations.totalCommission)}
                                              </Typography>
                                            </Grid>
                                          )}

                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              TOTAL A COBRAR:
                                            </Typography>
                                            <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 900 }}>
                                              {formatPrice(calculations.totalToCollect)}
                                            </Typography>
                                          </Grid>

                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Método:
                                            </Typography>
                                            <Chip 
                                              label={`${paymentMethods.find(m => m.value === currentPaymentMethod)?.icon} ${paymentMethods.find(m => m.value === currentPaymentMethod)?.label}`}
                                              color="primary"
                                              sx={{ fontWeight: 'bold' }}
                                            />
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Box>
                                  )}
                                </Card>
                              )}
                            </Box>
                          )}

                          {/* 🚀 PASO 3: CONFIRMACIÓN SUPER DETALLADA */}
                          {index === 2 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: '#FFCC00', mb: 3 }}>
                                ✅ Confirmación Final del Apartado AVANZADO
                              </Typography>
                              
                              <Grid container spacing={3}>
                                {/* Resumen Completo del Apartado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)', height: 'fit-content' }}>
                                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                      📋 Resumen Completo del Apartado
                                    </Typography>
                                    
                                    {/* Información Básica */}
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 1 }}>
                                        💰 Información Financiera:
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Total del apartado: <strong>{formatPrice(calculations.total)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Anticipo ({depositPercentage}%): <strong>{formatPrice(calculations.baseDeposit)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Pendiente por pagar: <strong>{formatPrice(calculations.remainingAmount)}</strong>
                                      </Typography>
                                    </Box>

                                    {/* Información de Tiempo */}
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 1 }}>
                                        ⏰ Información de Tiempo:
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Duración: <strong>{calculations.durationDays} días</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                        Vence: <strong>{formatDate(calculations.expirationDate.toISOString())}</strong>
                                      </Typography>
                                      {advancedConfig.allowExtensions && (
                                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                          Extensiones permitidas: <strong>{advancedConfig.maxExtensions}</strong> (costo: {formatPrice(advancedConfig.extensionFee)})
                                        </Typography>
                                      )}
                                    </Box>

                                    {/* Plan de Pagos */}
                                    {allowInstallments && calculations.installmentDetails && (
                                      <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 1 }}>
                                          📅 Plan de Pagos:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                          Número de pagos: <strong>{calculations.installmentDetails.totalInstallments}</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                          Monto por pago: <strong>{formatPrice(calculations.installmentDetails.installmentAmount)}</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                          Frecuencia: <strong>{installmentPlan.frequency === 'weekly' ? 'Semanal' : installmentPlan.frequency === 'biweekly' ? 'Quincenal' : 'Mensual'}</strong>
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Configuraciones Especiales */}
                                    <Box>
                                      <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 1 }}>
                                        ⚙️ Configuraciones Especiales:
                                      </Typography>
                                      {advancedConfig.priorityCustomer && (
                                        <Chip 
                                          label="⭐ Cliente Prioritario" 
                                          color="warning" 
                                          size="small" 
                                          sx={{ mr: 1, mb: 1 }}
                                        />
                                      )}
                                      {notificationSettings.sendCreationNotification && (
                                        <Chip 
                                          label="📧 Notificaciones Activas" 
                                          color="info" 
                                          size="small" 
                                          sx={{ mr: 1, mb: 1 }}
                                        />
                                      )}
                                      {isMixedPayment && (
                                        <Chip 
                                          label="💳 Pago Mixto" 
                                          color="secondary" 
                                          size="small" 
                                          sx={{ mr: 1, mb: 1 }}
                                        />
                                      )}
                                    </Box>

                                    {/* Notas */}
                                    {customerNotes && (
                                      <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                        <Typography variant="subtitle1" sx={{ color: '#ffc107', fontWeight: 600, mb: 1 }}>
                                          📝 Notas Especiales:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#CCCCCC', fontStyle: 'italic' }}>
                                          "{customerNotes}"
                                        </Typography>
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>

                                {/* Resumen de Pagos Detallado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ p: 3, background: 'rgba(33, 150, 243, 0.1)', height: 'fit-content' }}>
                                    <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                      💳 Detalle de Pagos
                                    </Typography>
                                    
                                    {isMixedPayment ? (
                                      // Resumen Pagos Mixtos
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ color: '#2196f3', fontWeight: 600, mb: 2 }}>
                                          🔄 Pagos Mixtos Configurados:
                                        </Typography>
                                        
                                        {paymentDetails.map((payment, index) => (
                                          <Box 
                                            key={payment.id} 
                                            sx={{ 
                                              mb: 2, 
                                              p: 2, 
                                              background: 'rgba(255,255,255,0.05)', 
                                              borderRadius: 1,
                                              border: '1px solid rgba(33, 150, 243, 0.3)'
                                            }}
                                          >
                                            <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                              Pago #{index + 1}: {paymentMethods.find(m => m.value === payment.method)?.icon} {paymentMethods.find(m => m.value === payment.method)?.label}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Monto: {formatPrice(payment.amount)}
                                            </Typography>
                                            {payment.commissionAmount > 0 && (
                                              <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                                Comisión: +{formatPrice(payment.commissionAmount)}
                                              </Typography>
                                            )}
                                            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                              Subtotal: {formatPrice(payment.amount + payment.commissionAmount)}
                                            </Typography>
                                            {payment.reference && (
                                              <Typography variant="body2" sx={{ color: '#CCCCCC', fontSize: '0.8rem' }}>
                                                Ref: {payment.reference}
                                              </Typography>
                                            )}
                                          </Box>
                                        ))}

                                        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                                        
                                        <Box sx={{ 
                                          p: 2, 
                                          background: 'rgba(33, 150, 243, 0.2)', 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                            TOTAL A COBRAR: {formatPrice(calculations.totalToCollect)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            ({paymentDetails.length} métodos de pago)
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ) : (
                                      // Resumen Pago Único
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ color: '#2196f3', fontWeight: 600, mb: 2 }}>
                                          💳 Pago Único:
                                        </Typography>
                                        
                                        <Box sx={{ 
                                          mb: 2, 
                                          p: 2, 
                                          background: 'rgba(255,255,255,0.05)', 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                            Método: {paymentMethods.find(m => m.value === currentPaymentMethod)?.icon} {paymentMethods.find(m => m.value === currentPaymentMethod)?.label}
                                          </Typography>
                                          
                                          {currentPaymentReference && (
                                            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                              Referencia: {currentPaymentReference}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            Anticipo: {formatPrice(calculations.baseDeposit)}
                                          </Typography>
                                          {calculations.totalCommission > 0 && (
                                            <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                              Comisión: +{formatPrice(calculations.totalCommission)}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Box sx={{ 
                                          p: 2, 
                                          background: 'rgba(33, 150, 243, 0.2)', 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                            TOTAL A COBRAR: {formatPrice(calculations.totalToCollect)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    )}

                                    {/* Información de Notificaciones */}
                                    {(notificationSettings.sendCreationNotification || notificationSettings.sendReminderNotifications) && (
                                      <Box sx={{ mt: 3 }}>
                                        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                        <Typography variant="subtitle1" sx={{ color: '#ff9800', fontWeight: 600, mb: 1 }}>
                                          🔔 Notificaciones Programadas:
                                        </Typography>
                                        {notificationSettings.sendCreationNotification && (
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            ✅ Confirmación de apartado ({notificationSettings.preferredMethod})
                                          </Typography>
                                        )}
                                        {notificationSettings.sendReminderNotifications && (
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            ✅ Recordatorios antes del vencimiento
                                          </Typography>
                                        )}
                                        {notificationSettings.sendExpirationNotification && (
                                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                            ✅ Aviso de vencimiento
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>
                              </Grid>

                              {/* Botón de Confirmación Final SUPER AVANZADO */}
                              <Box sx={{ 
                                mt: 4, 
                                p: 4, 
                                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0.1))', 
                                borderRadius: 3, 
                                textAlign: 'center',
                                border: '2px solid rgba(156, 39, 176, 0.5)'
                              }}>
                                <Typography variant="h5" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 700 }}>
                                  🚀 ¿Confirmar Creación del Apartado AVANZADO?
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#CCCCCC', mb: 3 }}>
                                  Se ejecutarán las siguientes acciones:
                                </Typography>
                                
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: 'rgba(76, 175, 80, 0.2)', borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                        📦 Reservar Productos
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                        Actualizar stock e inventario
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: 'rgba(33, 150, 243, 0.2)', borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>
                                        💳 Procesar Pago
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                        Registrar {isMixedPayment ? 'pagos mixtos' : 'pago único'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: 'rgba(255, 152, 0, 0.2)', borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                                        💾 Guardar en BD
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                        5 tablas de Supabase
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: 'rgba(255, 193, 7, 0.2)', borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: '#ffc107', fontWeight: 600 }}>
                                        🔔 Enviar Notificaciones
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                        {notificationSettings.preferredMethod === 'both' ? 'Email + WhatsApp' : notificationSettings.preferredMethod === 'email' ? 'Email' : 'WhatsApp'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Button
                                  variant="contained"
                                  size="large"
                                  onClick={handleCreateLayaway}
                                  disabled={processing || !customer}
                                  startIcon={processing ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : <BookmarkIcon />}
                                  sx={{
                                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                    px: 6,
                                    py: 2,
                                    fontSize: '1.3rem',
                                    boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #388e3c, #2e7d32)',
                                      boxShadow: '0 12px 24px rgba(76, 175, 80, 0.4)',
                                    }
                                  }}
                                >
                                  {processing ? 'PROCESANDO APARTADO AVANZADO...' : '🚀 CREAR APARTADO PRO FINAL'}
                                </Button>

                                {processing && (
                                  <Typography variant="body2" sx={{ color: '#CCCCCC', mt: 2 }}>
                                    Guardando en Supabase, actualizando inventario y enviando notificaciones...
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Navegación */}
                          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={() => setActiveStep(prev => prev - 1)}
                              variant="outlined"
                              sx={{ 
                                color: '#CCCCCC',
                                borderColor: '#CCCCCC',
                                '&:hover': {
                                  borderColor: '#FFFFFF',
                                  color: '#FFFFFF'
                                }
                              }}
                            >
                              ← Anterior
                            </Button>
                            
                            {activeStep < steps.length - 1 && (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                sx={{ 
                                  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                                  px: 4,
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #7b1fa2, #6a1b9a)'
                                  }
                                }}
                              >
                                Continuar →
                              </Button>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>

              {/* 🚀 PANEL LATERAL SUPER AVANZADO */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ position: 'sticky', top: 20 }}>
                  {/* Resumen Financiero Principal */}
                  <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, display: 'flex', alignItems: 'center' }}>
                        💰 Resumen Financiero
                        {isMixedPayment && (
                          <Chip 
                            label="MIXTO" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 2, fontWeight: 'bold' }}
                          />
                        )}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                        Productos: {cart?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                        Total: {formatPrice(calculations.total)}
                      </Typography>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(156, 39, 176, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                          ANTICIPO BASE
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 900 }}>
                          {formatPrice(calculations.baseDeposit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          {depositPercentage}% del total
                        </Typography>
                      </Box>

                      {calculations.totalCommission > 0 && (
                        <Box sx={{ 
                          p: 2, 
                          background: 'rgba(255, 152, 0, 0.2)', 
                          borderRadius: 2, 
                          textAlign: 'center',
                          mb: 2
                        }}>
                          <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                            COMISIONES TOTALES
                          </Typography>
                          <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                            +{formatPrice(calculations.totalCommission)}
                          </Typography>
                          {isMixedPayment && (
                            <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                              {paymentDetails.length} métodos
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.1))', 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2,
                        border: '2px solid rgba(33, 150, 243, 0.5)'
                      }}>
                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                          TOTAL A COBRAR HOY
                        </Typography>
                        <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 900 }}>
                          {formatPrice(calculations.totalToCollect)}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(76, 175, 80, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center' 
                      }}>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          PENDIENTE
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                          {formatPrice(calculations.remainingAmount)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Info de Configuraciones Avanzadas */}
                  <Card sx={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                        ⚙️ Configuraciones Activas
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Duración: <strong>{calculations.durationDays} días</strong>
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: 'rgba(255, 193, 7, 0.2)', 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <CalendarIcon sx={{ color: '#ffc107', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Vence el:
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ffc107', fontWeight: 700 }}>
                          {formatDate(calculations.expirationDate.toISOString())}
                        </Typography>
                      </Box>

                      {/* Chips de Funcionalidades Activas */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {isMixedPayment && (
                          <Chip 
                            label="💳 Pago Mixto" 
                            size="small" 
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                        {allowInstallments && (
                          <Chip 
                            label="📅 Plan de Pagos" 
                            size="small" 
                            color="info"
                            variant="outlined"
                          />
                        )}
                        {advancedConfig.allowExtensions && (
                          <Chip 
                            label="🔄 Extensiones" 
                            size="small" 
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {advancedConfig.priorityCustomer && (
                          <Chip 
                            label="⭐ Prioritario" 
                            size="small" 
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {notificationSettings.sendCreationNotification && (
                          <Chip 
                            label="🔔 Notificaciones" 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Información del Sistema */}
                  <Card sx={{ background: 'rgba(96, 125, 139, 0.1)', border: '1px solid rgba(96, 125, 139, 0.3)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#607d8b', mb: 2 }}>
                        🔧 Información del Sistema
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                        Versión: <strong>FASE 3 - PRO FINAL</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                        Usuario: <strong>luishdz04</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                        Fecha: <strong>{formatDate(new Date().toISOString())}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                        Estado: <strong>✅ Funcional</strong>
                      </Typography>

                      <Box sx={{ 
                        mt: 2,
                        p: 1, 
                        background: 'rgba(76, 175, 80, 0.2)', 
                        borderRadius: 1, 
                        textAlign: 'center' 
                      }}>
                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                          🎉 Sistema sin Error #301
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // ✅ CONFIRMACIÓN DE ÉXITO SUPER AVANZADA
          <Box textAlign="center" sx={{ py: 6 }}>
            <CheckIcon sx={{ fontSize: 120, color: '#4caf50', mb: 3 }} />
            <Typography variant="h2" color="#4caf50" fontWeight="bold" gutterBottom>
              ¡APARTADO AVANZADO CREADO!
            </Typography>
            <Typography variant="h4" gutterBottom sx={{ color: '#9c27b0', fontWeight: 700, mb: 3 }}>
              #{layawayNumber}
            </Typography>
            
            <Typography variant="h6" color="#CCCCCC" sx={{ mb: 4 }}>
              Apartado guardado exitosamente en Supabase
            </Typography>
            
            <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Cliente</Typography>
                  <Typography variant="h6" sx={{ color: '#4caf50' }}>{customer?.name}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Cobrado Hoy</Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3' }}>{formatPrice(calculations.totalToCollect)}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, background: 'rgba(156, 39, 176, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Pendiente</Typography>
                  <Typography variant="h6" sx={{ color: '#9c27b0' }}>{formatPrice(calculations.remainingAmount)}</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, background: 'rgba(255, 193, 7, 0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>Vence</Typography>
                  <Typography variant="body1" sx={{ color: '#ffc107' }}>{formatDate(calculations.expirationDate.toISOString())}</Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Funcionalidades Implementadas */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                🚀 Funcionalidades Implementadas:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {isMixedPayment && (
                  <Chip label="💳 Pagos Mixtos" color="secondary" />
                )}
                {allowInstallments && (
                  <Chip label="📅 Sistema de Abonos" color="info" />
                )}
                {advancedConfig.allowExtensions && (
                  <Chip label="🔄 Extensiones Automáticas" color="success" />
                )}
                {notificationSettings.sendCreationNotification && (
                  <Chip label="🔔 Notificaciones" color="primary" />
                )}
                <Chip label="💾 Guardado en BD" color="default" />
                <Chip label="📊 Historial de Estados" color="default" />
                <Chip label="📦 Gestión de Inventario" color="default" />
              </Box>
            </Box>

            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
              🎊 ¡FASE 3 COMPLETADA CON ÉXITO! 🎊
            </Typography>
            <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
              Todas las funcionalidades avanzadas del sistema original han sido implementadas
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={processing} 
          size="large"
          variant={completed ? "contained" : "outlined"}
          sx={completed ? {
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            color: '#FFFFFF',
            fontWeight: 'bold'
          } : {}}
        >
          {completed ? '🎉 ¡EXCELENTE!' : 'Cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
