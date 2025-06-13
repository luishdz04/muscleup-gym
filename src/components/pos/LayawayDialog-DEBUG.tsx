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
  Tooltip,
  Stack,
  Avatar,
  InputAdornment,
  Snackbar
} from '@mui/material';
import { 
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Percent as PercentIcon,
  Info as InfoIcon,
  Remove as RemoveIcon,
  Loyalty as LoyaltyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  customer?: any;
  coupon?: any;
  totals: any;
  onSuccess: () => void;
}

// ✅ MÉTODOS DE PAGO HÍBRIDOS ESTABLES
const stablePaymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    commission: 0,
    requiresReference: false,
    allowsChange: true,
    allowsMixed: true,
    allowsCommission: false,
    color: darkProTokens.primary
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    commission: 2.5,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true,
    allowsCommission: true,
    color: darkProTokens.info
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    commission: 3.5,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true,
    allowsCommission: true,
    color: darkProTokens.roleModerator
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    commission: 0,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true,
    allowsCommission: false,
    color: darkProTokens.roleTrainer
  },
  { 
    value: 'vales', 
    label: 'Vales de Despensa', 
    icon: '🎫',
    commission: 4.0,
    requiresReference: true,
    allowsChange: false,
    allowsMixed: true,
    allowsCommission: true,
    color: darkProTokens.warning
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

// ✅ CONFIGURACIONES ESTABLES
const layawayConfig = {
  defaultDuration: 30,
  maxDuration: 365,
  minDepositPercentage: 10,
  maxDepositPercentage: 100,
  extensionFee: 50,
  maxExtensions: 2
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

  // ✅ ESTADOS ESENCIALES OPTIMIZADOS
  const [durationDays, setDurationDays] = useState(layawayConfig.defaultDuration);
  const [customDays, setCustomDays] = useState(layawayConfig.defaultDuration);
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [applyCommission, setApplyCommission] = useState(true);

  // 🚀 ESTADOS PARA PAGOS MIXTOS OPTIMIZADOS
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0);
  const [currentPaymentReference, setCurrentPaymentReference] = useState('');

  // 🚀 ESTADOS PARA CONFIGURACIÓN AVANZADA
  const [advancedConfig, setAdvancedConfig] = useState({
    allowExtensions: true,
    extensionFee: layawayConfig.extensionFee,
    maxExtensions: layawayConfig.maxExtensions,
    priorityCustomer: false
  });

  // 🔥 ESTADOS HÍBRIDOS PARA COMISIONES
  const [paymentMethods, setPaymentMethods] = useState(stablePaymentMethods);
  const [editingCommissions, setEditingCommissions] = useState(false);

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

  // ✅ FUNCIONES UTILITARIAS SIMPLIFICADAS - LA BD YA ESTÁ EN HORA MÉXICO
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ FORMATEO SIMPLIFICADO SIN TIMEZONE PROBLEMÁTICA
  const formatMexicoDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // ✅ MANTENER FUNCIÓN LEGACY PARA COMPATIBILIDAD TEMPORAL
  const formatDate = useCallback((dateString: string) => {
    return formatMexicoDate(dateString);
  }, [formatMexicoDate]);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // ✅ EFECTO HÍBRIDO PARA CARGAR COMISIONES INICIALES
  useEffect(() => {
    const loadInitialCommissions = async () => {
      if (!open) return;
      
      try {
        const { data: commissions, error } = await supabase
          .from('payment_commissions')
          .select('*')
          .eq('is_active', true);

        if (!error && commissions && commissions.length > 0) {
          const updatedMethods = stablePaymentMethods.map(method => {
            const dbCommission = commissions.find(c => c.payment_method === method.value);
            if (dbCommission && method.allowsCommission) {
              return {
                ...method,
                commission: dbCommission.commission_value
              };
            }
            return method;
          });
          
          setPaymentMethods(prev => {
            const hasChanges = prev.some((method, index) => 
              updatedMethods[index].commission !== method.commission
            );
            return hasChanges ? updatedMethods : prev;
          });
        } else {
          setPaymentMethods(stablePaymentMethods);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando comisiones iniciales:', error);
        setPaymentMethods(stablePaymentMethods);
      }
    };

    loadInitialCommissions();
  }, [open, supabase]);

  // 🔥 FUNCIÓN HÍBRIDA PARA ACTUALIZAR COMISIÓN EN TIEMPO REAL
  const updateMethodCommission = useCallback((methodValue: string, newCommission: number) => {
    const clampedCommission = Math.max(0, Math.min(20, newCommission));
    
    setPaymentMethods(prev => prev.map(method => 
      method.value === methodValue 
        ? { ...method, commission: clampedCommission }
        : method
    ));
    
    // Actualizar pagos mixtos si aplica
    if (isMixedPayment) {
      setPaymentDetails(prev => prev.map(payment => 
        payment.method === methodValue
          ? {
              ...payment,
              commission: clampedCommission,
              commissionAmount: payment.amount * (clampedCommission / 100)
            }
          : payment
      ));
    }
  }, [isMixedPayment]);

  // ✅ CÁLCULOS OPTIMIZADOS CON USEMEMO (CORREGIDO)
  const calculations = useMemo(() => {
    const total = totals?.total || 0;
    const baseDeposit = total * (depositPercentage / 100);
    
    let totalPaymentAmount = 0;
    let totalCommission = 0;
    let totalToCollect = 0;

    if (isMixedPayment && paymentDetails.length > 0) {
      totalPaymentAmount = paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
      totalCommission = paymentDetails.reduce((sum, payment) => sum + payment.commissionAmount, 0);
      totalToCollect = totalPaymentAmount + totalCommission;
    } else {
      totalPaymentAmount = baseDeposit;
      if (applyCommission && currentPaymentMethod) {
        const method = paymentMethods.find(m => m.value === currentPaymentMethod);
        if (method && method.allowsCommission && method.commission > 0) {
          totalCommission = baseDeposit * (method.commission / 100);
        }
      }
      totalToCollect = totalPaymentAmount + totalCommission;
    }

    const finalDuration = useCustomDuration ? customDays : durationDays;
    
    // ✅ USAR FECHA SIMPLIFICADA PARA CALCULAR EXPIRACIÓN
    const mexicoNow = getMexicoDate();
    const expirationDate = new Date(mexicoNow);
    expirationDate.setDate(expirationDate.getDate() + finalDuration);

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
    advancedConfig,
    paymentMethods,
    getMexicoDate
  ]);

  // 🚀 FUNCIONES OPTIMIZADAS PARA PAGOS MIXTOS
  const addPaymentDetail = useCallback(() => {
    if (!currentPaymentMethod || currentPaymentAmount <= 0) {
      showNotification('Seleccione método y monto válido', 'error');
      return;
    }

    const method = paymentMethods.find(m => m.value === currentPaymentMethod);
    if (!method) return;

    const commission = applyCommission && method.allowsCommission ? method.commission : 0;
    const commissionAmount = currentPaymentAmount * (commission / 100);

    if (method.requiresReference && !currentPaymentReference) {
      showNotification('Se requiere referencia para este método', 'error');
      return;
    }

    const newPayment: PaymentDetail = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
  }, [currentPaymentMethod, currentPaymentAmount, currentPaymentReference, applyCommission, paymentDetails.length, paymentMethods, showNotification]);

  const removePaymentDetail = useCallback((id: string) => {
    setPaymentDetails(prev => prev.filter(p => p.id !== id));
    showNotification('Pago eliminado', 'info');
  }, [showNotification]);

  const editPaymentDetail = useCallback((id: string) => {
    const payment = paymentDetails.find(p => p.id === id);
    if (payment) {
      setCurrentPaymentMethod(payment.method);
      setCurrentPaymentAmount(payment.amount);
      setCurrentPaymentReference(payment.reference || '');
      removePaymentDetail(id);
    }
  }, [paymentDetails, removePaymentDetail]);

  // ✅ GENERAR NÚMERO SIMPLIFICADO
  const generateLayawayNumber = useCallback(async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `AP${year}${month}${day}${timestamp}`;
  }, []);

  // 🔥 FUNCIÓN HÍBRIDA PARA GENERAR NOTAS (CORREGIDO)
  const generateCleanNotes = useCallback(() => {
    let notes = `Apartado por ${calculations.durationDays} días - Vence: ${formatMexicoDate(calculations.expirationDate.toISOString())}`;
    
    if (isMixedPayment) {
      notes += ` | Pago mixto: ${paymentDetails.length} métodos`;
    }
    
    if (advancedConfig.allowExtensions) {
      notes += ` | Extensiones permitidas: ${advancedConfig.maxExtensions}`;
    }
    
    if (customerNotes) {
      notes += ` | Notas: ${customerNotes}`;
    }
    
    return notes;
  }, [calculations, isMixedPayment, paymentDetails, advancedConfig, customerNotes, formatMexicoDate]);

  // ✅ PROCESAMIENTO FINAL OPTIMIZADO (LA BD MANEJA TODOS LOS TIMESTAMPS AUTOMÁTICAMENTE)
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

      // 🔥 DATOS FINALES OPTIMIZADOS (LA BD MANEJA TODOS LOS TIMESTAMPS AUTOMÁTICAMENTE)
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
        change_amount: 0,
        commission_rate: isMixedPayment ? 0 : (paymentMethods.find(m => m.value === currentPaymentMethod)?.commission || 0),
        commission_amount: calculations.totalCommission,
        custom_commission_rate: null,
        skip_inscription: false,
        notes: generateCleanNotes(),
        initial_payment: calculations.totalToCollect,
        expiration_date: calculations.expirationDate.toISOString().split('T')[0]
        // ✅ TODOS los timestamps (created_at, updated_at, payment_date, last_payment_date) 
        // se manejan automáticamente por la BD en hora México
      };

      // ✅ INSERTAR VENTA PRINCIPAL
      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) throw layawayError;

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
        tax_amount: item.tax_amount || 0
        // ✅ created_at se maneja automáticamente por la BD
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(layawayItems);

      if (itemsError) throw itemsError;

      // 🔥 CREAR DETALLES DE PAGO HÍBRIDOS
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
          created_by: userId,
          is_partial_payment: true,
          payment_sequence: index + 1,
          notes: `Pago mixto ${index + 1} de ${paymentDetails.length}`
          // ✅ created_at y payment_date se manejan automáticamente por la BD
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentInserts);

        if (paymentError) throw paymentError;
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
          created_by: userId,
          is_partial_payment: true,
          payment_sequence: 1,
          notes: null
          // ✅ created_at y payment_date se manejan automáticamente por la BD
        };

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([paymentData]);

        if (paymentError) throw paymentError;
      }

      // ✅ ACTUALIZAR STOCK DE PRODUCTOS (LA BD MANEJA updated_at AUTOMÁTICAMENTE)
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: item.product.current_stock - item.quantity,
            updated_by: userId
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

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
            notes: `Apartado #${layaway.sale_number} - ${calculations.durationDays} días`,
            created_by: userId
            // ✅ created_at se maneja automáticamente por la BD
          }]);
      }

      // 🔥 CREAR HISTORIAL DE ESTADO
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: null,
          new_status: 'pending',
          previous_paid_amount: 0,
          new_paid_amount: calculations.totalToCollect,
          reason: 'Apartado creado',
          created_by: userId
          // ✅ created_at se maneja automáticamente por la BD
        }]);

      // ✅ ACTUALIZAR CUPÓN SI SE USÓ (LA BD MANEJA updated_at AUTOMÁTICAMENTE)
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1
          })
          .eq('id', coupon.id);
      }

      setLayawayNumber(layaway.sale_number);
      setCompleted(true);
      showNotification('¡Apartado creado exitosamente!', 'success');

    } catch (error) {
      console.error('💥 Error procesando apartado:', error);
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
    advancedConfig,
    paymentMethods,
    showNotification,
    generateCleanNotes
  ]);

  // ✅ RESET HÍBRIDO AL CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess();
    }
    
    // Reset completo optimizado
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
    
    // Reset configuraciones
    setCustomerNotes('');
    setUseCustomDuration(false);
    setCustomDays(layawayConfig.defaultDuration);
    setDurationDays(layawayConfig.defaultDuration);
    setEditingCommissions(false);
    
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN HÍBRIDA OPTIMIZADA
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
  }, [activeStep, calculations, isMixedPayment, paymentDetails, currentPaymentMethod, currentPaymentReference, paymentMethods]);

  // ✅ STEPS ESTABLES
  const steps = useMemo(() => [
    { label: 'Configuración', description: 'Anticipo y duración del apartado' },
    { label: 'Métodos de Pago', description: 'Pago único o múltiples métodos' },
    { label: 'Confirmación', description: 'Revisar y procesar apartado' }
  ], []);

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
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.roleModerator}50`,
          color: darkProTokens.textPrimary,
          minHeight: '90vh',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
        }
      }}
    >
      {/* SNACKBAR */}
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
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${
              notification.severity === 'success' ? darkProTokens.success :
              notification.severity === 'error' ? darkProTokens.error :
              notification.severity === 'warning' ? darkProTokens.warning :
              darkProTokens.info
            }60`,
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
        color: darkProTokens.textPrimary,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BookmarkIcon sx={{ fontSize: 35 }} />
          <Typography variant="h5" fontWeight="bold">
            🚀 Sistema de Apartados
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ 
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.textPrimary}20`
            }
          }} 
          disabled={processing}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* Cliente */}
            {customer ? (
              <Card sx={{ 
                mb: 3, 
                background: `${darkProTokens.success}10`,
                border: `2px solid ${darkProTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ 
                      bgcolor: darkProTokens.success, 
                      width: 56, 
                      height: 56,
                      color: darkProTokens.textPrimary
                    }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                        👤 Cliente: {customer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        {customer.email || customer.whatsapp}
                      </Typography>
                      {advancedConfig.priorityCustomer && (
                        <Chip 
                          label="⭐ CLIENTE PRIORITARIO" 
                          color="warning" 
                          size="small"
                          sx={{ 
                            mt: 1,
                            fontWeight: 'bold',
                            backgroundColor: darkProTokens.warning,
                            color: darkProTokens.textPrimary
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  backgroundColor: `${darkProTokens.error}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.error}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.error }
                }}
              >
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

            {/* Panel de Configuración de Comisiones */}
            {editingCommissions && (
              <Card sx={{ 
                mb: 3, 
                p: 3, 
                background: `${darkProTokens.info}10`, 
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 3
              }}>
                <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 2 }}>
                  ⚙️ Configuración de Comisiones en Tiempo Real
                </Typography>
                
                <Grid container spacing={2}>
                  {paymentMethods.filter(m => m.allowsCommission).map(method => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={method.value}>
                      <Card sx={{ 
                        p: 2, 
                        background: `${darkProTokens.surfaceLevel4}`,
                        border: `1px solid ${darkProTokens.grayDark}`
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                          {method.icon} {method.label}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Comisión %"
                          value={method.commission}
                          onChange={(e) => updateMethodCommission(method.value, Number(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 20, step: 0.1 }}
                          InputProps={{
                            endAdornment: <Typography sx={{ color: darkProTokens.textSecondary }}>%</Typography>,
                            sx: {
                              color: darkProTokens.textPrimary,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${darkProTokens.info}30`
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: darkProTokens.info
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: darkProTokens.info
                              }
                            }
                          }}
                          InputLabelProps={{
                            sx: { 
                              color: darkProTokens.textSecondary,
                              '&.Mui-focused': { color: darkProTokens.info }
                            }
                          }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                    💡 Los cambios se aplican inmediatamente. Efectivo y transferencia no tienen comisión.
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => setEditingCommissions(false)}
                    sx={{ color: darkProTokens.info }}
                  >
                    Ocultar Configuración
                  </Button>
                </Box>
              </Card>
            )}

            <Grid container spacing={4}>
              {/* Stepper Principal */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.grayDark}`,
                  borderRadius: 4,
                  p: 2 
                }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel 
                          sx={{ 
                            '& .MuiStepLabel-label': { 
                              color: darkProTokens.textPrimary,
                              fontWeight: activeStep === index ? 700 : 500,
                              fontSize: activeStep === index ? '1.1rem' : '1rem'
                            },
                            '& .MuiStepIcon-root': {
                              color: activeStep === index ? darkProTokens.roleModerator : darkProTokens.grayMuted,
                              fontSize: '2rem',
                              '&.Mui-completed': {
                                color: darkProTokens.roleModerator
                              }
                            }
                          }}
                        >
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* 🚀 PASO 1: CONFIGURACIÓN */}
                          {index === 0 && (
                            <Box>
                              <Grid container spacing={3}>
                                {/* Anticipo Inteligente */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ 
                                    p: 3, 
                                    background: `${darkProTokens.roleModerator}10`,
                                    border: `1px solid ${darkProTokens.roleModerator}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, mb: 2 }}>
                                      💰 Anticipo del Apartado
                                    </Typography>
                                    
                                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
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
                                        color: darkProTokens.roleModerator,
                                        '& .MuiSlider-markLabel': {
                                          color: darkProTokens.textSecondary,
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                    />
                                    
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, fontWeight: 600 }}>
                                        Anticipo: {formatPrice(calculations.baseDeposit)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Pendiente: {formatPrice(calculations.remainingAmount)}
                                      </Typography>
                                    </Box>

                                    {/* Cliente Prioritario */}
                                    <Box sx={{ mt: 2 }}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={advancedConfig.priorityCustomer}
                                            onChange={(e) => setAdvancedConfig(prev => ({
                                              ...prev,
                                              priorityCustomer: e.target.checked
                                            }))}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: darkProTokens.warning,
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: darkProTokens.warning,
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography sx={{ color: darkProTokens.textSecondary }}>
                                            ⭐ Cliente Prioritario
                                          </Typography>
                                        }
                                      />
                                    </Box>
                                  </Card>
                                </Grid>

                                {/* Duración */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ 
                                    p: 3, 
                                    background: `${darkProTokens.success}10`,
                                    border: `1px solid ${darkProTokens.success}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2 }}>
                                      📅 Duración del Apartado
                                    </Typography>
                                    
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                      <InputLabel sx={{ 
                                        color: darkProTokens.textSecondary,
                                        '&.Mui-focused': { color: darkProTokens.success }
                                      }}>
                                        Duración
                                      </InputLabel>
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
                                        sx={{ 
                                          color: darkProTokens.textPrimary,
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: `${darkProTokens.success}30`
                                          },
                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.success
                                          },
                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.success
                                          }
                                        }}
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
                                        InputProps={{
                                          sx: {
                                            color: darkProTokens.textPrimary,
                                            '& .MuiOutlinedInput-notchedOutline': {
                                              borderColor: `${darkProTokens.success}30`
                                            }
                                          }
                                        }}
                                        InputLabelProps={{
                                          sx: { 
                                            color: darkProTokens.textSecondary,
                                            '&.Mui-focused': { color: darkProTokens.success }
                                          }
                                        }}
                                      />
                                    )}

                                    <Box sx={{ 
                                      p: 2, 
                                      background: `${darkProTokens.success}20`, 
                                      borderRadius: 1,
                                      textAlign: 'center',
                                      mb: 2
                                    }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Vence el:
                                      </Typography>
                                      <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
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
                                          sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                              color: darkProTokens.success,
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                              backgroundColor: darkProTokens.success,
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography sx={{ color: darkProTokens.textSecondary }}>
                                          🔄 Permitir extensiones
                                        </Typography>
                                      }
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
                                            startAdornment: <MoneyIcon sx={{ mr: 1, color: darkProTokens.success }} />
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

                                {/* Notas Personalizadas */}
                                <Grid size={{ xs: 12 }}>
                                  <Card sx={{ 
                                    p: 3, 
                                    background: `${darkProTokens.warning}10`,
                                    border: `1px solid ${darkProTokens.warning}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 2 }}>
                                      📝 Notas del Apartado (Opcional)
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={3}
                                      placeholder="Ej: Cliente prefiere recoger en horario específico, producto para regalo, etc."
                                      value={customerNotes}
                                      onChange={(e) => setCustomerNotes(e.target.value)}
                                      InputProps={{
                                        sx: {
                                          color: darkProTokens.textPrimary,
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: `${darkProTokens.warning}30`
                                          },
                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.warning
                                          },
                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: darkProTokens.warning
                                          }
                                        }
                                      }}
                                      InputLabelProps={{
                                        sx: { 
                                          color: darkProTokens.textSecondary,
                                          '&.Mui-focused': { color: darkProTokens.warning }
                                        }
                                      }}
                                    />
                                  </Card>
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          {/* 🚀 PASO 2: MÉTODOS DE PAGO CON COMISIONES CONFIGURABLES */}
                          {index === 1 && (
                            <Box>
                              {/* Toggle Pago Mixto */}
                              <Card sx={{ 
                                mb: 3, 
                                p: 2, 
                                background: `${darkProTokens.roleModerator}10`,
                                border: `1px solid ${darkProTokens.roleModerator}30`
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: darkProTokens.roleModerator,
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: darkProTokens.roleModerator,
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography variant="h6" sx={{ color: darkProTokens.roleModerator }}>
                                          💳 Habilitar Pagos Mixtos
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Permite dividir el anticipo en múltiples métodos de pago
                                        </Typography>
                                      </Box>
                                    }
                                  />

                                  <Button 
                                    size="small" 
                                    startIcon={<SettingsIcon />}
                                    onClick={() => setEditingCommissions(!editingCommissions)}
                                    sx={{ color: darkProTokens.info }}
                                  >
                                    {editingCommissions ? 'Ocultar' : 'Configurar'} Comisiones
                                  </Button>
                                </Box>
                              </Card>

                              {isMixedPayment ? (
                                // 🔥 INTERFAZ DE PAGOS MIXTOS
                                <Box>
                                  {/* Agregar Nuevo Pago */}
                                  <Card sx={{ 
                                    p: 3, 
                                    mb: 3, 
                                    background: `${darkProTokens.info}10`,
                                    border: `1px solid ${darkProTokens.info}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 2 }}>
                                      ➕ Agregar Método de Pago
                                    </Typography>
                                    
                                    <Grid container spacing={2} alignItems="end">
                                      <Grid size={{ xs: 12, md: 3 }}>
                                        <FormControl fullWidth>
                                          <InputLabel sx={{ 
                                            color: darkProTokens.textSecondary,
                                            '&.Mui-focused': { color: darkProTokens.info }
                                          }}>
                                            Método
                                          </InputLabel>
                                          <Select
                                            value={currentPaymentMethod}
                                            onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                                            sx={{ 
                                              color: darkProTokens.textPrimary,
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: `${darkProTokens.info}30`
                                              }
                                            }}
                                          >
                                            {paymentMethods.filter(m => m.allowsMixed).map((method) => (
                                              <MenuItem key={method.value} value={method.value}>
                                                {method.icon} {method.label}
                                                {method.allowsCommission && method.commission > 0 && (
                                                  <Chip 
                                                    label={`+${method.commission}%`} 
                                                    size="small" 
                                                    sx={{ 
                                                      ml: 1, 
                                                      fontSize: '0.7rem',
                                                      backgroundColor: darkProTokens.warning,
                                                      color: darkProTokens.textPrimary
                                                    }}
                                                  />
                                                )}
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
                                          InputProps={{
                                            sx: {
                                              color: darkProTokens.textPrimary
                                            }
                                          }}
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
                                            background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
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
                                    <Card sx={{ 
                                      mb: 3, 
                                      background: `${darkProTokens.success}10`,
                                      border: `1px solid ${darkProTokens.success}30`
                                    }}>
                                      <CardContent>
                                        <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2 }}>
                                          💰 Métodos de Pago Configurados
                                        </Typography>
                                        
                                        <TableContainer component={Paper} sx={{ 
                                          background: `${darkProTokens.surfaceLevel4}`,
                                          border: `1px solid ${darkProTokens.grayDark}`
                                        }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold' }}>Método</TableCell>
                                                <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold' }}>Monto</TableCell>
                                                <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold' }}>Comisión</TableCell>
                                                <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold' }}>Total</TableCell>
                                                                                                <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold' }}>Acciones</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {paymentDetails.map((payment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                                    {paymentMethods.find(m => m.value === payment.method)?.icon}{' '}
                                                    {paymentMethods.find(m => m.value === payment.method)?.label}
                                                  </TableCell>
                                                  <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                                    {formatPrice(payment.amount)}
                                                  </TableCell>
                                                  <TableCell sx={{ color: payment.commissionAmount > 0 ? darkProTokens.warning : darkProTokens.textSecondary }}>
                                                    {payment.commission}% ({formatPrice(payment.commissionAmount)})
                                                  </TableCell>
                                                  <TableCell sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                                                    {formatPrice(payment.amount + payment.commissionAmount)}
                                                  </TableCell>
                                                  <TableCell>
                                                    <Tooltip title="Editar">
                                                      <IconButton 
                                                        size="small" 
                                                        onClick={() => editPaymentDetail(payment.id)}
                                                        sx={{ color: darkProTokens.info, mr: 1 }}
                                                      >
                                                        <EditIcon fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                      <IconButton 
                                                        size="small" 
                                                        onClick={() => removePaymentDetail(payment.id)}
                                                        sx={{ color: darkProTokens.error }}
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
                                        <Box sx={{ mt: 3, p: 2, background: `${darkProTokens.roleModerator}20`, borderRadius: 1 }}>
                                          <Grid container spacing={2}>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                                Total pagos:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: darkProTokens.textPrimary }}>
                                                {formatPrice(calculations.totalPaymentAmount)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                                Comisiones:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: darkProTokens.warning }}>
                                                {formatPrice(calculations.totalCommission)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                                Total a cobrar:
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: darkProTokens.info }}>
                                                {formatPrice(calculations.totalToCollect)}
                                              </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 3 }}>
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                                Estado:
                                              </Typography>
                                              <Chip 
                                                label={calculations.paymentDetailsValid ? '✅ VÁLIDO' : '❌ NO VÁLIDO'}
                                                color={calculations.paymentDetailsValid ? 'success' : 'error'}
                                                size="small"
                                                sx={{
                                                  backgroundColor: calculations.paymentDetailsValid ? darkProTokens.success : darkProTokens.error,
                                                  color: darkProTokens.textPrimary,
                                                  fontWeight: 600
                                                }}
                                              />
                                            </Grid>
                                          </Grid>

                                          {!calculations.paymentDetailsValid && (
                                            <Alert 
                                              severity="warning" 
                                              sx={{ 
                                                mt: 2,
                                                backgroundColor: `${darkProTokens.warning}10`,
                                                color: darkProTokens.textPrimary,
                                                border: `1px solid ${darkProTokens.warning}30`,
                                                '& .MuiAlert-icon': { color: darkProTokens.warning }
                                              }}
                                            >
                                              El total de pagos ({formatPrice(calculations.totalPaymentAmount)}) debe coincidir con el anticipo ({formatPrice(calculations.baseDeposit)})
                                            </Alert>
                                          )}
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Box>
                              ) : (
                                // 🔥 INTERFAZ DE PAGO ÚNICO
                                <Card sx={{ 
                                  p: 3, 
                                  background: `${darkProTokens.info}10`,
                                  border: `1px solid ${darkProTokens.info}30`
                                }}>
                                  <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 3 }}>
                                    💳 Método de Pago Único
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    {paymentMethods.map((method) => (
                                      <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={method.value}>
                                        <Card
                                          sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            border: currentPaymentMethod === method.value ? `2px solid ${method.color}` : `1px solid ${darkProTokens.grayDark}`,
                                            background: currentPaymentMethod === method.value ? `${method.color}20` : `${darkProTokens.surfaceLevel4}`,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                              background: `${method.color}10`,
                                              border: `1px solid ${method.color}50`
                                            }
                                          }}
                                          onClick={() => setCurrentPaymentMethod(method.value)}
                                        >
                                          <Box textAlign="center">
                                            <Typography variant="h4">{method.icon}</Typography>
                                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                                              {method.label}
                                            </Typography>
                                            {method.allowsCommission && method.commission > 0 && (
                                              <Chip 
                                                label={`+${method.commission}%`} 
                                                size="small" 
                                                sx={{ 
                                                  fontSize: '0.7rem',
                                                  backgroundColor: darkProTokens.warning,
                                                  color: darkProTokens.textPrimary
                                                }}
                                              />
                                            )}
                                            {!method.allowsCommission && (
                                              <Chip 
                                                label="Sin comisión" 
                                                size="small" 
                                                sx={{ 
                                                  fontSize: '0.7rem',
                                                  backgroundColor: darkProTokens.success,
                                                  color: darkProTokens.textPrimary
                                                }}
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
                                      <Divider sx={{ my: 2, bgcolor: `${darkProTokens.grayDark}` }} />
                                      
                                      <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2 }}>
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
                                              InputProps={{
                                                sx: {
                                                  color: darkProTokens.textPrimary,
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: `${darkProTokens.success}30`
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: darkProTokens.textSecondary,
                                                  '&.Mui-focused': { color: darkProTokens.success }
                                                }
                                              }}
                                            />
                                          </Grid>
                                        )}

                                        {/* Toggle Comisión (solo si el método permite comisión) */}
                                        {paymentMethods.find(m => m.value === currentPaymentMethod)?.allowsCommission && (
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                              control={
                                                <Switch
                                                  checked={applyCommission}
                                                  onChange={(e) => setApplyCommission(e.target.checked)}
                                                  sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                      color: darkProTokens.info,
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                      backgroundColor: darkProTokens.info,
                                                    },
                                                  }}
                                                />
                                              }
                                              label={
                                                <Typography sx={{ color: darkProTokens.textSecondary }}>
                                                  Aplicar comisión al método de pago
                                                </Typography>
                                              }
                                            />
                                          </Grid>
                                        )}
                                      </Grid>

                                      {/* Resumen de Cobro Único */}
                                      <Box sx={{ 
                                        mt: 3, 
                                        p: 3, 
                                        background: `${darkProTokens.roleModerator}20`, 
                                        borderRadius: 2 
                                      }}>
                                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                                          💰 Resumen de Cobro
                                        </Typography>
                                        
                                        <Grid container spacing={2}>
                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                              Anticipo base:
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary }}>
                                              {formatPrice(calculations.baseDeposit)}
                                            </Typography>
                                          </Grid>

                                          {calculations.totalCommission > 0 && (
                                            <Grid size={{ xs: 6, md: 3 }}>
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                                Comisión ({paymentMethods.find(m => m.value === currentPaymentMethod)?.commission}%):
                                              </Typography>
                                              <Typography variant="h6" sx={{ color: darkProTokens.warning }}>
                                                +{formatPrice(calculations.totalCommission)}
                                              </Typography>
                                            </Grid>
                                          )}

                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                              TOTAL A COBRAR:
                                            </Typography>
                                            <Typography variant="h5" sx={{ color: darkProTokens.info, fontWeight: 900 }}>
                                              {formatPrice(calculations.totalToCollect)}
                                            </Typography>
                                          </Grid>

                                          <Grid size={{ xs: 6, md: 3 }}>
                                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                              Método:
                                            </Typography>
                                            <Chip 
                                              label={`${paymentMethods.find(m => m.value === currentPaymentMethod)?.icon} ${paymentMethods.find(m => m.value === currentPaymentMethod)?.label}`}
                                              sx={{ 
                                                fontWeight: 'bold',
                                                backgroundColor: darkProTokens.info,
                                                color: darkProTokens.textPrimary
                                              }}
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

                          {/* 🚀 PASO 3: CONFIRMACIÓN */}
                          {index === 2 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: darkProTokens.primary, mb: 3 }}>
                                ✅ Confirmación Final del Apartado
                              </Typography>
                              
                              <Grid container spacing={3}>
                                {/* Resumen Completo del Apartado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ 
                                    p: 3, 
                                    background: `${darkProTokens.success}10`, 
                                    height: 'fit-content',
                                    border: `1px solid ${darkProTokens.success}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2 }}>
                                      📋 Resumen Completo del Apartado
                                    </Typography>
                                    
                                    {/* Información Básica */}
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" sx={{ color: darkProTokens.success, fontWeight: 600, mb: 1 }}>
                                        💰 Información Financiera:
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Total del apartado: <strong>{formatPrice(calculations.total)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Anticipo ({depositPercentage}%): <strong>{formatPrice(calculations.baseDeposit)}</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Pendiente por pagar: <strong>{formatPrice(calculations.remainingAmount)}</strong>
                                      </Typography>
                                    </Box>

                                    {/* Información de Tiempo */}
                                    <Box sx={{ mb: 3 }}>
                                      <Typography variant="subtitle1" sx={{ color: darkProTokens.success, fontWeight: 600, mb: 1 }}>
                                        ⏰ Información de Tiempo:
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Duración: <strong>{calculations.durationDays} días</strong>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                        Vence: <strong>{formatDate(calculations.expirationDate.toISOString())}</strong>
                                      </Typography>
                                      {advancedConfig.allowExtensions && (
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Extensiones permitidas: <strong>{advancedConfig.maxExtensions}</strong> (costo: {formatPrice(advancedConfig.extensionFee)})
                                        </Typography>
                                      )}
                                    </Box>

                                    {/* Configuraciones Especiales */}
                                    <Box>
                                      <Typography variant="subtitle1" sx={{ color: darkProTokens.success, fontWeight: 600, mb: 1 }}>
                                        ⚙️ Configuraciones Especiales:
                                      </Typography>
                                      {advancedConfig.priorityCustomer && (
                                        <Chip 
                                          label="⭐ Cliente Prioritario" 
                                          size="small" 
                                          sx={{ 
                                            mr: 1, 
                                            mb: 1,
                                            backgroundColor: darkProTokens.warning,
                                            color: darkProTokens.textPrimary
                                          }}
                                        />
                                      )}
                                      {isMixedPayment && (
                                        <Chip 
                                          label="💳 Pago Mixto" 
                                          size="small" 
                                          sx={{ 
                                            mr: 1, 
                                            mb: 1,
                                            backgroundColor: darkProTokens.roleModerator,
                                            color: darkProTokens.textPrimary
                                          }}
                                        />
                                      )}
                                      <Chip 
                                        label="🔧 Comisiones Configurables" 
                                        size="small" 
                                        sx={{ 
                                          mr: 1, 
                                          mb: 1,
                                          backgroundColor: darkProTokens.info,
                                          color: darkProTokens.textPrimary
                                        }}
                                      />
                                    </Box>

                                    {/* Notas */}
                                    {customerNotes && (
                                      <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ my: 2, bgcolor: `${darkProTokens.grayDark}` }} />
                                        <Typography variant="subtitle1" sx={{ color: darkProTokens.warning, fontWeight: 600, mb: 1 }}>
                                          📝 Notas Especiales:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                                          "{customerNotes}"
                                        </Typography>
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>

                                {/* Resumen de Pagos Detallado */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Card sx={{ 
                                    p: 3, 
                                    background: `${darkProTokens.info}10`, 
                                    height: 'fit-content',
                                    border: `1px solid ${darkProTokens.info}30`
                                  }}>
                                    <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 2 }}>
                                      💳 Detalle de Pagos
                                    </Typography>
                                    
                                    {isMixedPayment ? (
                                      // Resumen Pagos Mixtos
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ color: darkProTokens.info, fontWeight: 600, mb: 2 }}>
                                          🔄 Pagos Mixtos Configurados:
                                        </Typography>
                                        
                                        {paymentDetails.map((payment, idx) => (
                                          <Box 
                                            key={payment.id} 
                                            sx={{ 
                                              mb: 2, 
                                              p: 2, 
                                              background: `${darkProTokens.surfaceLevel4}`, 
                                              borderRadius: 1,
                                              border: `1px solid ${darkProTokens.info}30`
                                            }}
                                          >
                                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                              Pago #{idx + 1}: {paymentMethods.find(m => m.value === payment.method)?.icon} {paymentMethods.find(m => m.value === payment.method)?.label}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                              Monto: {formatPrice(payment.amount)}
                                            </Typography>
                                            {payment.commissionAmount > 0 && (
                                              <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                                                Comisión: +{formatPrice(payment.commissionAmount)}
                                              </Typography>
                                            )}
                                            <Typography variant="body2" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                                              Subtotal: {formatPrice(payment.amount + payment.commissionAmount)}
                                            </Typography>
                                            {payment.reference && (
                                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: '0.8rem' }}>
                                                Ref: {payment.reference}
                                              </Typography>
                                            )}
                                          </Box>
                                        ))}

                                        <Divider sx={{ my: 2, bgcolor: `${darkProTokens.grayDark}` }} />
                                        
                                        <Box sx={{ 
                                          p: 2, 
                                          background: `${darkProTokens.info}20`, 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                            TOTAL A COBRAR: {formatPrice(calculations.totalToCollect)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            ({paymentDetails.length} métodos de pago)
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ) : (
                                      // Resumen Pago Único
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ color: darkProTokens.info, fontWeight: 600, mb: 2 }}>
                                          💳 Pago Único:
                                        </Typography>
                                        
                                        <Box sx={{ 
                                          mb: 2, 
                                          p: 2, 
                                          background: `${darkProTokens.surfaceLevel4}`, 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                            Método: {paymentMethods.find(m => m.value === currentPaymentMethod)?.icon} {paymentMethods.find(m => m.value === currentPaymentMethod)?.label}
                                          </Typography>
                                          
                                          {currentPaymentReference && (
                                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                              Referencia: {currentPaymentReference}
                                            </Typography>
                                          )}

                                          {paymentMethods.find(m => m.value === currentPaymentMethod)?.allowsCommission ? (
                                            <Chip 
                                              label={`Comisión: ${paymentMethods.find(m => m.value === currentPaymentMethod)?.commission}%`}
                                              size="small" 
                                              sx={{ 
                                                mt: 1,
                                                backgroundColor: darkProTokens.warning,
                                                color: darkProTokens.textPrimary
                                              }}
                                            />
                                          ) : (
                                            <Chip 
                                              label="Sin comisión"
                                              size="small" 
                                              sx={{ 
                                                mt: 1,
                                                backgroundColor: darkProTokens.success,
                                                color: darkProTokens.textPrimary
                                              }}
                                            />
                                          )}
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            Anticipo: {formatPrice(calculations.baseDeposit)}
                                          </Typography>
                                          {calculations.totalCommission > 0 && (
                                            <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                                              Comisión: +{formatPrice(calculations.totalCommission)}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Box sx={{ 
                                          p: 2, 
                                          background: `${darkProTokens.info}20`, 
                                          borderRadius: 1 
                                        }}>
                                          <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                            TOTAL A COBRAR: {formatPrice(calculations.totalToCollect)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    )}
                                  </Card>
                                </Grid>
                              </Grid>

                              {/* Botón de Confirmación Final */}
                              <Box sx={{ 
                                mt: 4, 
                                p: 4, 
                                background: `linear-gradient(135deg, ${darkProTokens.roleModerator}30, ${darkProTokens.roleModerator}10)`, 
                                borderRadius: 3, 
                                textAlign: 'center',
                                border: `2px solid ${darkProTokens.roleModerator}50`
                              }}>
                                <Typography variant="h5" sx={{ color: darkProTokens.textPrimary, mb: 2, fontWeight: 700 }}>
                                  🚀 ¿Confirmar Creación del Apartado?
                                </Typography>
                                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
                                  Se ejecutarán las siguientes acciones:
                                </Typography>
                                
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: `${darkProTokens.success}20`, borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                                        📦 Reservar Productos
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                        Actualizar stock e inventario
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: `${darkProTokens.info}20`, borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                                        💳 Procesar Pago
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                        Registrar {isMixedPayment ? 'pagos mixtos' : 'pago único'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: `${darkProTokens.warning}20`, borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                                        💾 Guardar en BD
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                        5 tablas de Supabase
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ p: 2, background: `${darkProTokens.roleGuest}40`, borderRadius: 1 }}>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                                        📊 Crear Historial
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                        Estados y movimientos
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Button
                                  variant="contained"
                                  size="large"
                                  onClick={handleCreateLayaway}
                                  disabled={processing || !customer}
                                  startIcon={processing ? <CircularProgress size={24} sx={{ color: darkProTokens.textPrimary }} /> : <BookmarkIcon />}
                                  sx={{
                                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                                    color: darkProTokens.textPrimary,
                                    fontWeight: 'bold',
                                    px: 6,
                                    py: 2,
                                    fontSize: '1.3rem',
                                    borderRadius: 3,
                                    boxShadow: `0 8px 16px ${darkProTokens.success}30`,
                                    '&:hover': {
                                      background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                                      boxShadow: `0 12px 24px ${darkProTokens.success}40`,
                                      transform: 'translateY(-2px)'
                                    }
                                  }}
                                >
                                  {processing ? 'PROCESANDO APARTADO...' : '🚀 CREAR APARTADO'}
                                </Button>

                                {processing && (
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mt: 2 }}>
                                    Guardando en Supabase, actualizando inventario y creando historial...
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
                                color: darkProTokens.textSecondary,
                                borderColor: darkProTokens.textSecondary,
                                '&:hover': {
                                  borderColor: darkProTokens.textPrimary,
                                  color: darkProTokens.textPrimary
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
                                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                                  px: 4,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${darkProTokens.roleModerator}CC, ${darkProTokens.roleModerator})`
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

              {/* 🚀 PANEL LATERAL */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ position: 'sticky', top: 20 }}>
                  {/* Resumen Financiero Principal */}
                  <Card sx={{ 
                    background: `${darkProTokens.success}10`, 
                    border: `1px solid ${darkProTokens.success}30`, 
                    mb: 2 
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2, display: 'flex', alignItems: 'center' }}>
                        💰 Resumen Financiero
                        {isMixedPayment && (
                          <Chip 
                            label="MIXTO" 
                            size="small" 
                            sx={{ 
                              ml: 2, 
                              fontWeight: 'bold',
                              backgroundColor: darkProTokens.roleModerator,
                              color: darkProTokens.textPrimary
                            }}
                          />
                        )}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        Productos: {cart?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                        Total: {formatPrice(calculations.total)}
                      </Typography>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: `${darkProTokens.roleModerator}20`, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 800 }}>
                          ANTICIPO BASE
                        </Typography>
                        <Typography variant="h4" sx={{ color: darkProTokens.roleModerator, fontWeight: 900 }}>
                          {formatPrice(calculations.baseDeposit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          {depositPercentage}% del total
                        </Typography>
                      </Box>

                      {calculations.totalCommission > 0 && (
                        <Box sx={{ 
                          p: 2, 
                          background: `${darkProTokens.warning}20`, 
                          borderRadius: 2, 
                          textAlign: 'center',
                          mb: 2
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            COMISIONES CONFIGURABLES
                          </Typography>
                          <Typography variant="h5" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                            +{formatPrice(calculations.totalCommission)}
                          </Typography>
                          {isMixedPayment && (
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              {paymentDetails.length} métodos
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box sx={{ 
                        p: 3, 
                        background: `linear-gradient(135deg, ${darkProTokens.info}30, ${darkProTokens.info}10)`, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2,
                        border: `2px solid ${darkProTokens.info}50`
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 800 }}>
                          TOTAL A COBRAR HOY
                        </Typography>
                        <Typography variant="h3" sx={{ color: darkProTokens.info, fontWeight: 900 }}>
                          {formatPrice(calculations.totalToCollect)}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        p: 2, 
                        background: `${darkProTokens.success}20`, 
                        borderRadius: 2, 
                        textAlign: 'center' 
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          PENDIENTE (Abonos posteriores)
                        </Typography>
                        <Typography variant="h5" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                          {formatPrice(calculations.remainingAmount)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Info de Configuraciones */}
                  <Card sx={{ 
                    background: `${darkProTokens.warning}10`, 
                    border: `1px solid ${darkProTokens.warning}30`, 
                    mb: 2 
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 2 }}>
                        ⚙️ Configuraciones Activas
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Duración: <strong>{calculations.durationDays} días</strong>
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: `${darkProTokens.warning}20`, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <CalendarIcon sx={{ color: darkProTokens.warning, mb: 1 }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Vence el:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                          {formatDate(calculations.expirationDate.toISOString())}
                        </Typography>
                      </Box>

                      {/* Chips de Funcionalidades Activas */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {isMixedPayment && (
                          <Chip 
                            label="💳 Pago Mixto" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: darkProTokens.roleModerator,
                              color: darkProTokens.roleModerator
                            }}
                          />
                        )}
                        {advancedConfig.allowExtensions && (
                          <Chip 
                            label="🔄 Extensiones" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: darkProTokens.success,
                              color: darkProTokens.success
                            }}
                          />
                        )}
                        {advancedConfig.priorityCustomer && (
                          <Chip 
                            label="⭐ Prioritario" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: darkProTokens.warning,
                              color: darkProTokens.warning
                            }}
                          />
                        )}
                        <Chip 
                          label="🔧 Comisiones Editables" 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderColor: darkProTokens.info,
                            color: darkProTokens.info
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // ✅ CONFIRMACIÓN DE ÉXITO
          <Box textAlign="center" sx={{ py: 6 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckIcon sx={{ fontSize: 120, color: darkProTokens.success, mb: 3 }} />
              <Typography variant="h2" color={darkProTokens.success} fontWeight="bold" gutterBottom>
                ¡APARTADO CREADO EXITOSAMENTE!
              </Typography>
              <Typography variant="h4" gutterBottom sx={{ color: darkProTokens.roleModerator, fontWeight: 700, mb: 3 }}>
                #{layawayNumber}
              </Typography>
              
              <Typography variant="h6" color={darkProTokens.textSecondary} sx={{ mb: 4 }}>
                Apartado guardado exitosamente - {formatMexicoDate(new Date().toISOString())}
              </Typography>
              
              <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ p: 3, background: `${darkProTokens.success}10` }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cliente</Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.success }}>{customer?.name}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ p: 3, background: `${darkProTokens.info}10` }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Cobrado Hoy</Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.info }}>{formatPrice(calculations.totalToCollect)}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ p: 3, background: `${darkProTokens.roleModerator}10` }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Pendiente</Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.roleModerator }}>{formatPrice(calculations.remainingAmount)}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ p: 3, background: `${darkProTokens.warning}10` }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Vence</Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.warning }}>{formatDate(calculations.expirationDate.toISOString())}</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Funcionalidades Implementadas */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                  🚀 Funcionalidades Implementadas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {isMixedPayment && (
                    <Chip 
                      label="💳 Pagos Mixtos" 
                      sx={{ backgroundColor: darkProTokens.roleModerator, color: darkProTokens.textPrimary }}
                    />
                  )}
                  {advancedConfig.allowExtensions && (
                    <Chip 
                      label="🔄 Extensiones" 
                      sx={{ backgroundColor: darkProTokens.success, color: darkProTokens.textPrimary }}
                    />
                  )}
                  <Chip 
                    label="💾 Guardado en BD" 
                    sx={{ backgroundColor: darkProTokens.grayMedium, color: darkProTokens.textPrimary }}
                  />
                  <Chip 
                    label="📊 Historial de Estados" 
                    sx={{ backgroundColor: darkProTokens.grayMedium, color: darkProTokens.textPrimary }}
                  />
                  <Chip 
                    label="📦 Gestión de Inventario" 
                    sx={{ backgroundColor: darkProTokens.grayMedium, color: darkProTokens.textPrimary }}
                  />
                  <Chip 
                    label="🔧 Comisiones Configurables" 
                    sx={{ backgroundColor: darkProTokens.info, color: darkProTokens.textPrimary }}
                  />
                </Box>
              </Box>

              <Typography variant="h5" sx={{ color: darkProTokens.textPrimary, fontWeight: 700, mb: 2 }}>
                🎊 ¡APARTADO COMPLETADO! 🎊
              </Typography>
              <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                Apartado listo para producción - Comisiones configurables en tiempo real
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                Los abonos posteriores se manejarán en la Gestión de Apartados
              </Typography>
            </motion.div>
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
            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            fontWeight: 'bold'
          } : {
            color: darkProTokens.textSecondary,
            borderColor: darkProTokens.textSecondary
          }}
        >
          {completed ? '🎉 ¡EXCELENTE!' : 'Cancelar'}
        </Button>
      </DialogActions>

      {/* ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.roleModerator}CC, ${darkProTokens.roleModerator});
        }
      `}</style>
    </Dialog>
  );
}
                         
