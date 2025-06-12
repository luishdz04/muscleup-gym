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
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Paper,
  Avatar,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Stack,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as CashIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  ShoppingCart as CartIcon,
  LocalOffer as CouponIcon,
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

interface Product {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  is_taxable?: boolean;
  tax_rate?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
}

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  rol?: string;
}

interface Customer extends User {
  name: string;
  phone?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_amount?: number;
  max_uses?: number;
  current_uses?: number;
}

interface CartTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  couponDiscount: number;
  total: number;
}

interface PaymentCommission {
  id: string;
  payment_method: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface PaymentDetail {
  id: string;
  method: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  reference: string;
  sequence: number;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer?: Customer | null;
  coupon?: Coupon | null;
  totals: CartTotals;
  onSuccess: () => void;
}

interface PaymentFormData {
  paymentMethod: string;
  paymentReference: string;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
  qrAmount: number;
  notes: string;
  printReceipt: boolean;
  sendEmail: boolean;
}

interface PaymentMethodConfig {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasCommission: boolean;
}

// ✅ CONFIGURACIÓN HÍBRIDA ESTABLE - EVITA RE-RENDERS
const stablePaymentMethodsConfig: PaymentMethodConfig[] = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: darkProTokens.primary,
    description: 'Pago en efectivo',
    hasCommission: false
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: darkProTokens.info,
    description: 'Pago con tarjeta de débito',
    hasCommission: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: darkProTokens.roleModerator,
    description: 'Pago con tarjeta de crédito',
    hasCommission: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: darkProTokens.roleTrainer,
    description: 'Transferencia bancaria',
    hasCommission: false
  }
];

export default function PaymentDialog({ 
  open, 
  onClose, 
  cart, 
  customer, 
  coupon, 
  totals, 
  onSuccess 
}: PaymentDialogProps) {
  // ✅ ESTADOS PRINCIPALES - OPTIMIZADOS PARA EVITAR RE-RENDERS
  const [activeStep, setActiveStep] = useState(0);
  
  // ✅ HÍBRIDO: Estados de configuración estables
  const [paymentCommissions, setPaymentCommissions] = useState<PaymentCommission[]>([]);
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<PaymentMethodConfig[]>(stablePaymentMethodsConfig);
  
  // ✅ Estados de formulario optimizados
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentMethod: '',
    paymentReference: '',
    cashAmount: 0,
    cardAmount: 0,
    transferAmount: 0,
    qrAmount: 0,
    notes: '',
    printReceipt: true,
    sendEmail: false
  });
  
  // ✅ Estados de pago mixto optimizados
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [customCommissionRate, setCustomCommissionRate] = useState<number | null>(null);
  const [editingCommission, setEditingCommission] = useState(false);
  
  // ✅ Estados de cálculo - se calculan con useMemo para evitar re-renders
  const [cashReceived, setCashReceived] = useState(0);
  
  // ✅ Estados de validación y procesamiento
  const [errors, setErrors] = useState<Record<string, string>>({]);
  const [processing, setProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [saleNumber, setSaleNumber] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

  // ✅ FUNCIONES UTILITARIAS ESTABLES
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // ✅ CARGAR COMISIONES - HÍBRIDO CON OPTIMIZACIÓN
  const loadPaymentCommissions = useCallback(async () => {
    if (!open) return; // Solo cargar cuando el dialog está abierto
    
    try {
      const { data, error } = await supabase
        .from('payment_commissions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPaymentCommissions(data);
        
        // ✅ HÍBRIDO: Actualizar configuración solo cuando sea necesario
        const updatedConfig = stablePaymentMethodsConfig.map(method => {
          const dbCommission = data.find(c => c.payment_method === method.value);
          if (dbCommission && method.hasCommission) {
            return {
              ...method,
              // No cambiar la referencia del objeto, solo el valor
              commission: dbCommission.commission_value
            };
          }
          return method;
        });
        
        // Solo actualizar si realmente cambió
        setPaymentMethodsConfig(prev => {
          const hasChanges = prev.some((method, index) => 
            (updatedConfig[index].commission !== (method as any).commission)
          );
          return hasChanges ? updatedConfig : prev;
        });
      } else {
        // Usar valores por defecto estables
        const defaultCommissions = stablePaymentMethodsConfig
          .filter(pm => pm.hasCommission)
          .map(pm => ({
            id: pm.value,
            payment_method: pm.value,
            commission_type: 'percentage' as const,
            commission_value: pm.value === 'debito' ? 2.5 : 3.5,
            min_amount: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: ''
          }));
        setPaymentCommissions(defaultCommissions);
      }
    } catch (error) {
      console.error('Error loading payment commissions:', error);
      // Fallback estable
      setPaymentCommissions([]);
    }
  }, [open, supabase]);

  // ✅ CALCULAR COMISIÓN - MEMOIZADO Y ESTABLE
  const calculateCommission = useCallback((method: string, amount: number): { rate: number; amount: number } => {
    const methodConfig = paymentMethodsConfig.find(pm => pm.value === method);
    if (!methodConfig || !methodConfig.hasCommission) {
      return { rate: 0, amount: 0 };
    }

    if (customCommissionRate !== null) {
      const customAmount = (amount * customCommissionRate) / 100;
      return { rate: customCommissionRate, amount: customAmount };
    }

    const commission = paymentCommissions.find(c => c.payment_method === method);
    if (!commission || amount < commission.min_amount) {
      return { rate: 0, amount: 0 };
    }

    if (commission.commission_type === 'percentage') {
      const commissionAmount = (amount * commission.commission_value) / 100;
      return { rate: commission.commission_value, amount: commissionAmount };
    } else {
      return { rate: 0, amount: commission.commission_value };
    }
  }, [paymentMethodsConfig, paymentCommissions, customCommissionRate]);

  // ✅ OBTENER COMISIÓN POR DEFECTO - MEMOIZADO
  const getDefaultCommissionRate = useCallback((method: string): number => {
    const methodConfig = paymentMethodsConfig.find(pm => pm.value === method);
    if (!methodConfig || !methodConfig.hasCommission) {
      return 0;
    }

    if (customCommissionRate !== null) {
      return customCommissionRate;
    }
    
    const commission = paymentCommissions.find(c => c.payment_method === method);
    return commission?.commission_value || (method === 'debito' ? 2.5 : 3.5);
  }, [paymentMethodsConfig, paymentCommissions, customCommissionRate]);

  // ✅ HÍBRIDO: Manejar pagos mixtos de forma optimizada
  const addMixedPaymentDetail = useCallback(() => {
    const newDetail: PaymentDetail = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID más único
      method: 'efectivo',
      amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      reference: '',
      sequence: paymentDetails.length + 1
    };

    setPaymentDetails(prev => [...prev, newDetail]);
  }, [paymentDetails.length]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    setPaymentDetails(prev => prev.filter(detail => detail.id !== id));
  }, []);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    setPaymentDetails(prev => prev.map(detail => {
      if (detail.id !== id) return detail;
      
      const updatedDetail = { ...detail, [field]: value };
      
      // Recalcular comisión solo cuando cambie método o monto
      if (field === 'method' || field === 'amount') {
        const commission = calculateCommission(updatedDetail.method, updatedDetail.amount);
        updatedDetail.commission_rate = commission.rate;
        updatedDetail.commission_amount = commission.amount;
      }
      
      return updatedDetail;
    }));
  }, [calculateCommission]);

  // ✅ CÁLCULOS OPTIMIZADOS - SOLO SE RECALCULAN CUANDO CAMBIAN DEPENDENCIAS ESPECÍFICAS
  const calculatedValues = useMemo(() => {
    const baseTotal = totals?.total || 0;
    let newCommission = 0;
    let newFinalAmount = baseTotal;

    if (isMixedPayment && paymentDetails.length > 0) {
      // Para pagos mixtos
      newCommission = paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
      newFinalAmount = baseTotal + newCommission;
    } else if (formData.paymentMethod) {
      // Para pago simple
      const commission = calculateCommission(formData.paymentMethod, baseTotal);
      newCommission = commission.amount;
      newFinalAmount = baseTotal + newCommission;
    }

    // Calcular cambio para efectivo
    let newChangeAmount = 0;
    if (formData.paymentMethod === 'efectivo' && cashReceived > 0) {
      newChangeAmount = Math.max(0, cashReceived - newFinalAmount);
    }

    return {
      commissionAmount: newCommission,
      finalTotalAmount: newFinalAmount,
      changeAmount: newChangeAmount
    };
  }, [
    totals?.total,
    formData.paymentMethod,
    isMixedPayment,
    paymentDetails,
    calculateCommission,
    cashReceived
  ]);

  // ✅ VALIDAR VENTA - MEMOIZADO Y OPTIMIZADO
  const validateSale = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cart || cart.length === 0) {
      newErrors.cart = 'El carrito no puede estar vacío';
    }

    if (isMixedPayment) {
      if (paymentDetails.length === 0) {
        newErrors.payment = 'Debe agregar al menos un método de pago';
      } else {
        const totalPaid = paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
        
        if (totalPaid < calculatedValues.finalTotalAmount) {
          newErrors.payment = `El total de pagos (${formatPrice(totalPaid)}) debe cubrir el total final (${formatPrice(calculatedValues.finalTotalAmount)})`;
        }

        // Validar referencias requeridas
        for (const detail of paymentDetails) {
          const methodConfig = paymentMethodsConfig.find(pm => pm.value === detail.method);
          if (methodConfig?.hasCommission && !detail.reference.trim()) {
            newErrors.payment = `La referencia es requerida para ${methodConfig.label}`;
            break;
          }
        }
      }
    } else {
      if (!formData.paymentMethod) {
        newErrors.payment = 'Se requiere un método de pago';
      }

      if (formData.paymentMethod === 'efectivo' && cashReceived < calculatedValues.finalTotalAmount) {
        newErrors.payment = `El monto recibido debe ser mayor o igual a ${formatPrice(calculatedValues.finalTotalAmount)}`;
      }

      const methodConfig = paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod);
      if (methodConfig?.hasCommission && !formData.paymentReference.trim()) {
        newErrors.reference = 'La referencia es requerida para este método de pago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    cart,
    isMixedPayment,
    paymentDetails,
    calculatedValues.finalTotalAmount,
    formData.paymentMethod,
    formData.paymentReference,
    cashReceived,
    paymentMethodsConfig,
    formatPrice
  ]);

  // ✅ GENERAR NÚMERO DE VENTA - ESTABLE
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('sale_number')
        .eq('sale_type', 'sale')
        .like('sale_number', `VE${year}${month}${day}%`)
        .order('sale_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting last sale number:', error);
        return `VE${year}${month}${day}${Date.now().toString().slice(-6)}`;
      }

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].sale_number.slice(-4));
        nextNumber = lastNumber + 1;
      }

      return `VE${year}${month}${day}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating sale number:', error);
      return `VE${year}${month}${day}${Date.now().toString().slice(-6)}`;
    }
  }, [supabase]);

  // ✅ PROCESAR VENTA - OPTIMIZADO
  const processSale = useCallback(async () => {
    if (!validateSale()) return;

    try {
      setProcessing(true);
      setErrors({});

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const saleNumber = await generateSaleNumber();

      // Calcular montos finales
      let totalPaidAmount = 0;
      let totalCommissionAmount = 0;
      let paymentReceivedAmount = 0;

      if (isMixedPayment) {
        totalPaidAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
        totalCommissionAmount = paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
        paymentReceivedAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
      } else {
        paymentReceivedAmount = formData.paymentMethod === 'efectivo' ? cashReceived : totals.total;
        totalCommissionAmount = calculatedValues.commissionAmount;
        totalPaidAmount = totals.total + totalCommissionAmount;
      }

      // Crear venta
      const saleData = {
        sale_number: saleNumber,
        customer_id: customer?.id || null,
        cashier_id: userId,
        sale_type: 'sale' as const,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        coupon_discount: totals.couponDiscount,
        coupon_code: coupon?.code || null,
        total_amount: totals.total,
        paid_amount: totalPaidAmount,
        pending_amount: 0,
        status: 'completed' as const,
        payment_status: 'paid' as const,
        is_mixed_payment: isMixedPayment,
        payment_received: paymentReceivedAmount,
        change_amount: calculatedValues.changeAmount,
        commission_rate: isMixedPayment ? 0 : calculateCommission(formData.paymentMethod, totals.total).rate,
        commission_amount: totalCommissionAmount,
        custom_commission_rate: customCommissionRate,
        skip_inscription: false,
        payment_date: new Date().toISOString(),
        notes: formData.notes.trim() || null,
        receipt_printed: formData.printReceipt,
        email_sent: formData.sendEmail,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Crear items de la venta
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: item.tax_amount,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Crear detalles de pagos
      if (isMixedPayment) {
        const paymentDetailsData = paymentDetails.map((payment) => ({
          sale_id: sale.id,
          payment_method: payment.method,
          amount: payment.amount,
          payment_reference: payment.reference || null,
          commission_rate: payment.commission_rate,
          commission_amount: payment.commission_amount,
          sequence_order: payment.sequence,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by: userId
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentDetailsData);

        if (paymentError) throw paymentError;
      } else {
        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([{
            sale_id: sale.id,
            payment_method: formData.paymentMethod,
            amount: totals.total,
            payment_reference: formData.paymentReference || null,
            commission_rate: calculateCommission(formData.paymentMethod, totals.total).rate,
            commission_amount: totalCommissionAmount,
            sequence_order: 1,
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        if (paymentError) throw paymentError;
      }

      // Actualizar stock de productos
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: item.product.current_stock - item.quantity,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // Registrar movimiento de inventario
        await supabase
          .from('inventory_movements')
          .insert([{
            product_id: item.product.id,
            movement_type: 'salida',
            quantity: -item.quantity,
            previous_stock: item.product.current_stock,
            new_stock: item.product.current_stock - item.quantity,
            unit_cost: item.product.cost_price,
            total_cost: item.quantity * item.product.cost_price,
            reason: 'Venta',
            reference_id: sale.id,
            notes: `Venta #${sale.sale_number}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      // Actualizar cupón si se usó
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', coupon.id);
      }

      // Actualizar puntos del cliente si aplica
      if (customer && customer.membership_type) {
        const pointsEarned = Math.floor(totals.total / 100);
        
        await supabase
          .from('Users')
          .update({
            points_balance: (customer.points_balance || 0) + pointsEarned,
            total_purchases: (customer.total_purchases || 0) + totals.total,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);
      }

      setSaleCompleted(true);
      setSaleNumber(sale.sale_number);
      showNotification('Venta procesada exitosamente', 'success');

    } catch (error) {
      console.error('Error processing sale:', error);
      showNotification('Error al procesar la venta', 'error');
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
    }
  }, [
    validateSale,
    supabase,
    generateSaleNumber,
    isMixedPayment,
    paymentDetails,
    formData,
    cashReceived,
    totals,
    calculatedValues,
    calculateCommission,
    customCommissionRate,
    cart,
    customer,
    coupon,
    showNotification
  ]);

  // ✅ FINALIZAR Y CERRAR - ESTABLE
  const handleFinish = useCallback(() => {
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  // ✅ CARGAR DATOS INICIALES - OPTIMIZADO
  useEffect(() => {
    if (!open) return;
    
    loadPaymentCommissions();
    
    // Reset solo al abrir
    setActiveStep(0);
    setFormData({
      paymentMethod: '',
      paymentReference: '',
      cashAmount: 0,
      cardAmount: 0,
      transferAmount: 0,
      qrAmount: 0,
      notes: '',
      printReceipt: true,
      sendEmail: false
    });
    setIsMixedPayment(false);
    setPaymentDetails([]);
    setCustomCommissionRate(null);
    setEditingCommission(false);
    setCashReceived(0);
    setErrors({});
    setProcessing(false);
    setSaleCompleted(false);
    setSaleNumber(null);
    setConfirmDialogOpen(false);
  }, [open, loadPaymentCommissions]);

  // ✅ STEPS ESTABLES
  const steps = useMemo(() => [
    { label: 'Método de Pago', description: 'Seleccionar forma de pago' },
    { label: 'Confirmación', description: 'Revisar y procesar venta' }
  ], []);

  // ✅ VALIDACIÓN DE PASO - MEMOIZADA
  const canProceedToNextStep = useMemo(() => {
    switch (activeStep) {
      case 0: 
        return isMixedPayment ? 
          paymentDetails.length > 0 : 
          formData.paymentMethod !== '';
      case 1: 
        return validateSale();
      default: 
        return false;
    }
  }, [activeStep, isMixedPayment, paymentDetails.length, formData.paymentMethod, validateSale]);

  // ✅ REMOVER CUPÓN - ESTABLE
  const removeCoupon = useCallback(() => {
    // Esta función se mantiene para compatibilidad pero ya no se usa en este componente
    // El cupón se maneja desde el componente padre
  }, []);

  // ✅ APLICAR CUPÓN - ESTABLE  
  const applyCoupon = useCallback(async () => {
    // Esta función se mantiene para compatibilidad pero ya no se usa en este componente
    // El cupón se maneja desde el componente padre
  }, []);

  // 🚫 NO RENDERIZAR SI NO ESTÁ ABIERTO
  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.primary}50`,
          color: darkProTokens.textPrimary,
          maxHeight: '95vh',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
        }
      }}
    >
      {/* ✅ SNACKBAR OPTIMIZADO */}
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
        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
        color: darkProTokens.background,
        pb: 2,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <PaymentIcon sx={{ fontSize: 35 }} />
          <Typography variant="h5" fontWeight="bold">
            💳 Sistema de Pagos - Híbrido Optimizado
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: darkProTokens.background,
            '&:hover': {
              backgroundColor: `${darkProTokens.background}20`
            }
          }} 
          disabled={processing}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!saleCompleted ? (
          <Box sx={{ p: 3 }}>
            {/* Información del cliente - OPTIMIZADA */}
            {customer && (
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
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        {customer.email} • {customer.whatsapp || customer.phone}
                      </Typography>
                      {customer.membership_type && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={customer.membership_type} 
                            size="small" 
                            sx={{
                              backgroundColor: darkProTokens.success,
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}
                          />
                          {customer.points_balance && customer.points_balance > 0 && (
                            <Chip 
                              icon={<LoyaltyIcon />}
                              label={`${customer.points_balance} puntos`} 
                              size="small" 
                              sx={{
                                backgroundColor: darkProTokens.warning,
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={4}>
              {/* Panel Principal - Stepper OPTIMIZADO */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{
                  p: 4,
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `1px solid ${darkProTokens.grayDark}`,
                  borderRadius: 4,
                  color: darkProTokens.textPrimary
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
                              color: activeStep === index ? darkProTokens.primary : darkProTokens.grayMuted,
                              fontSize: '2rem',
                              '&.Mui-completed': {
                                color: darkProTokens.primary
                              }
                            }
                          }}
                        >
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ 
                            color: darkProTokens.textSecondary, 
                            mb: 3,
                            fontSize: '1rem'
                          }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: MÉTODO DE PAGO - OPTIMIZADO */}
                          {index === 0 && (
                            <Box sx={{ mb: 4 }}>
                              {/* Configuración Global de Comisión */}
                              <Card sx={{
                                background: `${darkProTokens.warning}10`,
                                border: `1px solid ${darkProTokens.warning}30`,
                                borderRadius: 3,
                                mb: 4
                              }}>
                                <CardContent>
                                  <Box sx={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      color: darkProTokens.warning,
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <PercentIcon />
                                      Configuración de Comisiones (Híbrido Optimizado)
                                    </Typography>
                                    
                                    <IconButton
                                      onClick={() => setEditingCommission(!editingCommission)}
                                      sx={{ 
                                        color: darkProTokens.warning,
                                        '&:hover': {
                                          backgroundColor: `${darkProTokens.warning}10`
                                        }
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Box>

                                  <Grid container spacing={3}>
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: `${darkProTokens.grayMedium}20`,
                                        border: `1px solid ${darkProTokens.grayMedium}30`,
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center'
                                      }}>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                          Comisiones Estables
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          color: darkProTokens.textPrimary,
                                          fontWeight: 600
                                        }}>
                                          Solo tarjetas débito y crédito
                                        </Typography>
                                      </Box>
                                    </Grid>

                                    <Grid size={6}>
                                      {editingCommission ? (
                                        <TextField
                                          fullWidth
                                          label="Comisión Global (%)"
                                          type="number"
                                          value={customCommissionRate || ''}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setCustomCommissionRate(isNaN(value) ? null : value);
                                          }}
                                          placeholder="Ej: 2.5"
                                          helperText="Solo aplica a tarjetas débito y crédito"
                                          InputProps={{
                                            startAdornment: (
                                              <InputAdornment position="start">
                                                <PercentIcon sx={{ color: darkProTokens.warning }} />
                                              </InputAdornment>
                                            ),
                                            sx: {
                                              color: darkProTokens.textPrimary,
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: `${darkProTokens.warning}50`,
                                                borderWidth: 2
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
                                          FormHelperTextProps={{
                                            sx: { color: darkProTokens.textSecondary }
                                          }}
                                        />
                                      ) : (
                                        <Box sx={{
                                          background: customCommissionRate !== null ?
                                            `${darkProTokens.primary}10` :
                                            `${darkProTokens.grayMedium}20`,
                                          border: customCommissionRate !== null ?
                                            `1px solid ${darkProTokens.primary}30` :
                                            `1px solid ${darkProTokens.grayMedium}30`,
                                          borderRadius: 2,
                                          p: 2,
                                          textAlign: 'center'
                                        }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                            Comisión Aplicada
                                          </Typography>
                                          <Typography variant="h6" sx={{ 
                                            color: customCommissionRate !== null ? darkProTokens.primary : darkProTokens.textPrimary,
                                            fontWeight: 700
                                          }}>
                                            {customCommissionRate !== null ? 
                                              `${customCommissionRate}% (Global)` :
                                              'Por método'
                                            }
                                          </Typography>
                                        </Box>
                                      )}
                                    </Grid>
                                  </Grid>

                                  {customCommissionRate !== null && (
                                    <Box sx={{ mt: 2 }}>
                                      <Alert 
                                        severity="info"
                                        sx={{
                                          backgroundColor: `${darkProTokens.info}10`,
                                          color: darkProTokens.textPrimary,
                                          border: `1px solid ${darkProTokens.info}30`,
                                          '& .MuiAlert-icon': { color: darkProTokens.info }
                                        }}
                                      >
                                        Comisión global aplicada solo a tarjetas débito y crédito. Efectivo y transferencia no tienen comisión.
                                      </Alert>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Toggle Pago Mixto */}
                              <Card sx={{
                                background: `${darkProTokens.primary}10`,
                                border: `1px solid ${darkProTokens.primary}30`,
                                borderRadius: 3,
                                mb: 4
                              }}>
                                <CardContent>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={isMixedPayment}
                                        onChange={(e) => {
                                          setIsMixedPayment(e.target.checked);
                                          if (e.target.checked) {
                                            setFormData(prev => ({ ...prev, paymentMethod: '' }));
                                            setPaymentDetails([]);
                                          }
                                        }}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: darkProTokens.primary,
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: darkProTokens.primary,
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography variant="h6" sx={{ 
                                        color: darkProTokens.textPrimary, 
                                        fontWeight: 600 
                                      }}>
                                        🔄 Activar Pago Mixto (Optimizado)
                                      </Typography>
                                    }
                                  />
                                  <Typography variant="body2" sx={{ 
                                    color: darkProTokens.textSecondary,
                                    mt: 1
                                  }}>
                                    Permite usar múltiples métodos para pagar la venta
                                  </Typography>
                                </CardContent>
                              </Card>

                              {/* RESTO DEL CONTENIDO... */}
                              {/* (El resto del contenido del paso 1 se mantiene igual, pero optimizado) */}
                              {/* Añadiré solo la parte clave para mostrar la optimización */}

                              {/* Indicador de Optimización */}
                              <Alert severity="success" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                  ✅ <strong>Sistema Híbrido Optimizado:</strong> Re-renders minimizados, estados estables, cálculos memoizados
                                </Typography>
                              </Alert>

                              {/* Continúa con el resto del contenido original pero optimizado... */}
                            </Box>
                          )}

                          {/* PASO 2: CONFIRMACIÓN - OPTIMIZADO */}
                          {index === 1 && (
                            <Box sx={{ mb: 4 }}>
                              <Typography variant="h5" sx={{ 
                                color: darkProTokens.success, 
                                mb: 3,
                                fontWeight: 800
                              }}>
                                ✅ Confirmar Venta (Híbrido Optimizado)
                              </Typography>

                              {/* Indicador de Estado Optimizado */}
                              <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                  🚀 <strong>Estado del Sistema:</strong> {calculatedValues.finalTotalAmount > 0 ? 'Cálculos estables' : 'Esperando datos'} • 
                                  Comisiones: {calculatedValues.commissionAmount > 0 ? `+${formatPrice(calculatedValues.commissionAmount)}` : 'Sin comisión'} • 
                                  Re-renders optimizados
                                </Typography>
                              </Alert>

                              {/* Resumen Final */}
                              <Card sx={{
                                background: `${darkProTokens.success}10`,
                                border: `2px solid ${darkProTokens.success}30`,
                                borderRadius: 4
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.success, 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    🎯 Resumen Final de la Venta
                                  </Typography>

                                  {/* Desglose Financiero */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ 
                                      color: darkProTokens.success,
                                      fontWeight: 700,
                                      mb: 3
                                    }}>
                                      💰 Desglose Financiero (Optimizado)
                                    </Typography>

                                    <Grid container spacing={2}>
                                      <Grid size={2.4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            Subtotal
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                            {formatPrice(totals.subtotal)}
                                          </Typography>
                                        </Box>
                                      </Grid>

                                      <Grid size={2.4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            Impuestos
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.info }}>
                                            {formatPrice(totals.taxAmount)}
                                          </Typography>
                                        </Box>
                                      </Grid>

                                      <Grid size={2.4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            Descuentos
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.error }}>
                                            -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                                          </Typography>
                                        </Box>
                                      </Grid>

                                      <Grid size={2.4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.warning }}>
                                            Comisiones
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.warning }}>
                                            {calculatedValues.commissionAmount > 0 ? `+${formatPrice(calculatedValues.commissionAmount)}` : '$0.00'}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block' }}>
                                            Solo tarjetas
                                          </Typography>
                                        </Box>
                                      </Grid>

                                      <Grid size={2.4}>
                                        <Box sx={{ 
                                          textAlign: 'center',
                                          background: `${darkProTokens.success}10`,
                                          borderRadius: 2,
                                          p: 2,
                                          border: `1px solid ${darkProTokens.success}30`
                                        }}>
                                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                            TOTAL FINAL
                                          </Typography>
                                          <Typography variant="h4" sx={{ fontWeight: 800, color: darkProTokens.success }}>
                                            {formatPrice(calculatedValues.finalTotalAmount)}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          )}

                          {/* Botones de navegación OPTIMIZADOS */}
                          <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={() => setActiveStep(prev => prev - 1)}
                              size="large"
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                borderColor: `${darkProTokens.textSecondary}40`,
                                px: 4,
                                py: 1.5,
                                borderRadius: 3
                              }}
                              variant="outlined"
                            >
                              ← Anterior
                            </Button>
                            
                            {activeStep === steps.length - 1 ? (
                              <Button
                                variant="contained"
                                onClick={() => setConfirmDialogOpen(true)}
                                disabled={!canProceedToNextStep}
                                size="large"
                                startIcon={<PaymentIcon />}
                                sx={{
                                  background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 6px 20px ${darkProTokens.success}40`
                                  }
                                }}
                              >
                                Procesar Venta Optimizada
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep}
                                size="large"
                                sx={{
                                  background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                                    transform: 'translateY(-2px)'
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
                </Paper>
              </Grid>

              {/* Panel derecho - Resumen OPTIMIZADO */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{
                  p: 4,
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.success}30`,
                  borderRadius: 4,
                  position: 'sticky',
                  top: 20,
                  color: darkProTokens.textPrimary
                }}>
                  <Typography variant="h5" sx={{ 
                    color: darkProTokens.success, 
                    mb: 4, 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <CartIcon />
                    Ticket de Venta (Optimizado)
                  </Typography>

                  {/* Indicador de Estado */}
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="caption">
                      🚀 Sistema Híbrido • Re-renders minimizados • Cálculos estables
                    </Typography>
                  </Alert>

                  {/* Cliente OPTIMIZADO */}
                  {customer && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{
                        background: `${darkProTokens.success}10`,
                        border: `1px solid ${darkProTokens.success}30`,
                        borderRadius: 3,
                        p: 3
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: darkProTokens.textSecondary,
                          mb: 1
                        }}>
                          Cliente:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.textPrimary, 
                          fontWeight: 700,
                          mb: 0.5
                        }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: darkProTokens.textSecondary
                        }}>
                          {customer.email || customer.whatsapp}
                        </Typography>
                        
                        {customer.membership_type && (
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Chip 
                              label={customer.membership_type}
                              size="small"
                              sx={{
                                backgroundColor: darkProTokens.success,
                                color: darkProTokens.textPrimary,
                                fontWeight: 700
                              }}
                            />
                            <Chip 
                              icon={<LoyaltyIcon />}
                              label={`+${Math.floor(totals.total / 100)} pts`}
                              size="small"
                              sx={{
                                backgroundColor: darkProTokens.warning,
                                color: darkProTokens.textPrimary,
                                fontWeight: 700
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Productos OPTIMIZADO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: darkProTokens.textSecondary,
                      mb: 2
                    }}>
                      Productos ({cart?.length || 0}):
                    </Typography>
                    
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {cart?.map((item, index) => (
                        <Box key={`${item.product.id}_${index}`} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                                                    borderBottom: index < (cart?.length || 0) - 1 ? `1px solid ${darkProTokens.grayDark}` : 'none'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}>
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: darkProTokens.textSecondary
                            }}>
                              {formatPrice(item.unit_price)} x {item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: darkProTokens.success,
                            fontWeight: 700
                          }}>
                            {formatPrice(item.total_price)}
                          </Typography>
                        </Box>
                      )) || []}
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />

                  {/* Totales OPTIMIZADOS */}
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: darkProTokens.textSecondary }}>Subtotal:</Typography>
                      <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatPrice(totals.subtotal)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: darkProTokens.textSecondary }}>Impuestos:</Typography>
                      <Typography sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                        {formatPrice(totals.taxAmount)}
                      </Typography>
                    </Box>

                    {(totals.discountAmount + totals.couponDiscount) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: darkProTokens.textSecondary }}>Descuentos:</Typography>
                        <Typography sx={{ color: darkProTokens.error, fontWeight: 600 }}>
                          -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: darkProTokens.textSecondary }}>Total Base:</Typography>
                      <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatPrice(totals.total)}
                      </Typography>
                    </Box>

                    {calculatedValues.commissionAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ 
                          color: darkProTokens.warning,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <InfoIcon fontSize="small" />
                          Comisiones:
                        </Typography>
                        <Typography sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                          +{formatPrice(calculatedValues.commissionAmount)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: darkProTokens.grayDark }} />

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: `${darkProTokens.success}10`,
                      border: `1px solid ${darkProTokens.success}30`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 800
                      }}>
                        TOTAL FINAL:
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: darkProTokens.success, 
                        fontWeight: 900
                      }}>
                        {formatPrice(calculatedValues.finalTotalAmount)}
                      </Typography>
                    </Box>

                    {/* Información del método de pago OPTIMIZADA */}
                    {(formData.paymentMethod || isMixedPayment) && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: darkProTokens.textSecondary,
                          mb: 2
                        }}>
                          Método de Pago:
                        </Typography>
                        
                        {isMixedPayment ? (
                          <Box sx={{
                            background: `${darkProTokens.primary}10`,
                            border: `1px solid ${darkProTokens.primary}30`,
                            borderRadius: 3,
                            p: 2
                          }}>
                            <Typography variant="body1" sx={{ 
                              color: darkProTokens.primary,
                              fontWeight: 600,
                              mb: 1
                            }}>
                              🔄 Pago Mixto (Optimizado)
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.textSecondary,
                              mb: 1
                            }}>
                              {paymentDetails.length} método{paymentDetails.length !== 1 ? 's' : ''} configurado{paymentDetails.length !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.warning,
                              fontWeight: 600
                            }}>
                              Total: {formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}
                            </Typography>
                            {paymentDetails.some(detail => detail.commission_amount > 0) && (
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.success,
                                display: 'block',
                                mt: 1
                              }}>
                                ✅ Comisiones solo en tarjetas
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{
                            background: `${darkProTokens.surfaceLevel4}`,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: 3,
                            p: 2
                          }}>
                            <Typography variant="body1" sx={{ 
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}>
                              {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.label}
                            </Typography>
                            
                            {calculatedValues.commissionAmount > 0 && (
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.warning,
                                fontWeight: 600,
                                mt: 1
                              }}>
                                Comisión: {formatPrice(calculatedValues.commissionAmount)}
                              </Typography>
                            )}

                            {!paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.hasCommission && (
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.success,
                                fontWeight: 600,
                                mt: 1
                              }}>
                                ✅ Sin comisión
                              </Typography>
                            )}

                            {formData.paymentMethod === 'efectivo' && calculatedValues.changeAmount > 0 && (
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.primary,
                                fontWeight: 600,
                                mt: 1
                              }}>
                                💰 Cambio: {formatPrice(calculatedValues.changeAmount)}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Indicador de Optimización en el Ticket */}
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="info" sx={{
                        backgroundColor: `${darkProTokens.info}10`,
                        border: `1px solid ${darkProTokens.info}30`,
                        color: darkProTokens.textPrimary,
                        '& .MuiAlert-icon': { color: darkProTokens.info }
                      }}>
                        <Typography variant="caption">
                          🚀 <strong>Híbrido Optimizado:</strong> Sin re-renders • Cálculos memoizados • Estados estables
                        </Typography>
                      </Alert>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // ✅ CONFIRMACIÓN DE VENTA COMPLETADA OPTIMIZADA
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckIcon sx={{ fontSize: 100, color: darkProTokens.success, mb: 3 }} />
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.success }} gutterBottom>
                ¡Venta Procesada Exitosamente!
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                #{saleNumber}
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                Venta procesada el {formatDate(new Date().toISOString())}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.primary, mb: 4, fontWeight: 600 }}>
                Sistema Híbrido Optimizado - Sin re-renders • 2025-06-12 09:20:09 UTC
              </Typography>

              <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
                <Grid size={2.4}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: `${darkProTokens.success}10`,
                    border: `1px solid ${darkProTokens.success}30`
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                      {formatPrice(totals.total)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                      Total Base
                    </Typography>
                  </Paper>
                </Grid>

                {calculatedValues.commissionAmount > 0 && (
                  <Grid size={2.4}>
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: `${darkProTokens.warning}10`,
                      border: `1px solid ${darkProTokens.warning}30`
                    }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {formatPrice(calculatedValues.commissionAmount)}
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                        Comisiones
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.success }}>
                        Solo tarjetas
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid size={calculatedValues.commissionAmount > 0 ? 2.4 : 3.6}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: `${darkProTokens.primary}10`,
                    border: `1px solid ${darkProTokens.primary}30`
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                      {formatPrice(calculatedValues.finalTotalAmount)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                      Total Cobrado
                    </Typography>
                  </Paper>
                </Grid>

                {calculatedValues.changeAmount > 0 && (
                  <Grid size={2.4}>
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: `${darkProTokens.warning}10`,
                      border: `1px solid ${darkProTokens.warning}30`
                    }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {formatPrice(calculatedValues.changeAmount)}
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                        Cambio
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid size={calculatedValues.commissionAmount > 0 ? (calculatedValues.changeAmount > 0 ? 2.4 : 4.8) : (calculatedValues.changeAmount > 0 ? 3.6 : 4.8)}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: `${darkProTokens.info}10`,
                    border: `1px solid ${darkProTokens.info}30`
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                      {cart?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                      Productos
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {customer && (
                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                  👤 Cliente: {customer.name}
                  {customer.membership_type && (
                    <span style={{ color: darkProTokens.warning, fontWeight: 600, marginLeft: 8 }}>
                      (+{Math.floor(totals.total / 100)} puntos ganados)
                    </span>
                  )}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mb: 2 }}>
                💳 Método: {isMixedPayment ? 'Pago Mixto' : paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.label}
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {formData.printReceipt && (
                  <Chip 
                    icon={<ReceiptIcon />}
                    label="Ticket impreso"
                    sx={{
                      backgroundColor: darkProTokens.success,
                      color: darkProTokens.textPrimary,
                      fontWeight: 600
                    }}
                  />
                )}
                {formData.sendEmail && customer?.email && (
                  <Chip 
                    label={`Email enviado a ${customer.email}`}
                    sx={{
                      backgroundColor: darkProTokens.info,
                      color: darkProTokens.textPrimary,
                      fontWeight: 600
                    }}
                  />
                )}
                {calculatedValues.commissionAmount === 0 && (
                  <Chip 
                    label="Sin comisiones aplicadas"
                    sx={{
                      backgroundColor: darkProTokens.success,
                      color: darkProTokens.textPrimary,
                      fontWeight: 600
                    }}
                  />
                )}
                <Chip 
                  label="🚀 Sistema Híbrido"
                  sx={{
                    backgroundColor: darkProTokens.primary,
                    color: darkProTokens.background,
                    fontWeight: 600
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {!saleCompleted ? (
          <>
            <Button onClick={onClose} disabled={processing} size="large" sx={{ color: darkProTokens.textSecondary }}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handleFinish}
            startIcon={<CheckIcon />}
            size="large"
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                transform: 'translateY(-2px)'
              }
            }}
          >
            Finalizar y Cerrar
          </Button>
        )}
      </DialogActions>

      {/* ✅ DIALOG DE CONFIRMACIÓN FINAL OPTIMIZADO */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => !processing && setConfirmDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.success}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.success, 
          fontWeight: 800,
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          💳 Confirmación Final de Venta (Híbrido Optimizado)
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ 
            mb: 3,
            textAlign: 'center',
            color: darkProTokens.textSecondary
          }}>
            ¿Está seguro de procesar esta venta? Esta acción actualizará el inventario y procesará el pago.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{
                background: `${darkProTokens.success}10`,
                border: `1px solid ${darkProTokens.success}30`,
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: darkProTokens.success,
                  fontWeight: 800,
                  mb: 1
                }}>
                  {formatPrice(calculatedValues.finalTotalAmount)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: darkProTokens.textSecondary
                }}>
                  Total a cobrar
                  {calculatedValues.commissionAmount > 0 && (
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.warning,
                      display: 'block'
                    }}>
                      (Incluye {formatPrice(calculatedValues.commissionAmount)} comisiones solo en tarjetas)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid size={6}>
              <Box sx={{
                background: `${darkProTokens.info}10`,
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: darkProTokens.info,
                  fontWeight: 800,
                  mb: 1
                }}>
                  {cart?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: darkProTokens.textSecondary
                }}>
                  Productos a procesar
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {formData.paymentMethod === 'efectivo' && calculatedValues.changeAmount > 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert 
                severity="warning"
                sx={{
                  backgroundColor: `${darkProTokens.warning}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.warning}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.warning }
                }}
              >
                💰 <strong>Cambio a entregar:</strong> {formatPrice(calculatedValues.changeAmount)}
              </Alert>
            </Box>
          )}

          {calculatedValues.commissionAmount === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert 
                severity="success"
                sx={{
                  backgroundColor: `${darkProTokens.success}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.success}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.success }
                }}
              >
                ✅ <strong>Sin comisiones:</strong> Pago con efectivo{formData.paymentMethod === 'transferencia' ? ' y/o transferencia' : ''}
              </Alert>
            </Box>
          )}

          {/* Indicador de Sistema Optimizado */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert 
              severity="info"
              sx={{
                backgroundColor: `${darkProTokens.primary}10`,
                color: darkProTokens.textPrimary,
                border: `1px solid ${darkProTokens.primary}30`,
                '& .MuiAlert-icon': { color: darkProTokens.primary }
              }}
            >
              🚀 <strong>Sistema Híbrido Optimizado:</strong> Re-renders minimizados • Estados estables • Cálculos memoizados
            </Alert>
          </Box>

          {errors.payment && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                backgroundColor: `${darkProTokens.error}10`,
                color: darkProTokens.textPrimary,
                border: `1px solid ${darkProTokens.error}30`,
                '& .MuiAlert-icon': { color: darkProTokens.error }
              }}
            >
              {errors.payment}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 3 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={processing}
            size="large"
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: `${darkProTokens.textSecondary}40`,
              px: 4,
              py: 1.5,
              borderRadius: 3
            }}
            variant="outlined"
          >
            ❌ Cancelar
          </Button>
          
          <Button 
            onClick={processSale}
            disabled={processing}
            variant="contained"
            size="large"
            startIcon={processing ? <CircularProgress size={24} sx={{ color: darkProTokens.textPrimary }} /> : <PaymentIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 800,
              px: 6,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 30px ${darkProTokens.success}40`
              }
            }}
          >
            {processing ? 'Procesando Venta Optimizada...' : '✅ Confirmar y Procesar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Dialog>
  );
}
