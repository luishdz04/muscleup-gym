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
  Stack
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
  LocalOffer as CouponIcon,  // ✅ CAMBIADO A LocalOffer QUE SÍ EXISTE
  Loyalty as LoyaltyIcon  
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import { 
  Product, 
  User, 
  Coupon, 
  CartItem, 
  CartTotals,
  PaymentCommission,
  PaymentDetail
} from '@/types';

interface Customer extends User {
  name: string;
  phone?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
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
  hasCommission: boolean; // ✅ NUEVA PROPIEDAD
}

// ✅ CONFIGURACIÓN CORREGIDA - COMISIÓN SOLO PARA DÉBITO Y CRÉDITO
const paymentMethodsConfig: PaymentMethodConfig[] = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: '#CCAA00',
    description: 'Pago en efectivo',
    hasCommission: false // ✅ SIN COMISIÓN
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: '#4D4D4D',
    description: 'Pago con tarjeta de débito',
    hasCommission: true // ✅ CON COMISIÓN
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: '#666666',
    description: 'Pago con tarjeta de crédito',
    hasCommission: true // ✅ CON COMISIÓN
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: '#808080',
    description: 'Transferencia bancaria',
    hasCommission: false // ✅ SIN COMISIÓN
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
  // Estados principales
  const [activeStep, setActiveStep] = useState(0);
  const [paymentCommissions, setPaymentCommissions] = useState<PaymentCommission[]>([]);
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
  
  // ✅ ESTADOS EXACTOS COMO EN MEMBRESÍAS
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [customCommissionRate, setCustomCommissionRate] = useState<number | null>(null);
  const [editingCommission, setEditingCommission] = useState(false);
  
  // Estados de cálculo
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [finalTotalAmount, setFinalTotalAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // Estados de validación y procesamiento
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [saleNumber, setSaleNumber] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ CARGAR COMISIONES DINÁMICAS (OPTIMIZADO)
  const loadPaymentCommissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payment_commissions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPaymentCommissions(data);
      } else {
        // ✅ USAR VALORES POR DEFECTO SOLO PARA MÉTODOS CON COMISIÓN
        const defaultCommissions = paymentMethodsConfig
          .filter(pm => pm.hasCommission)
          .map(pm => ({
            id: pm.value,
            payment_method: pm.value,
            commission_type: 'percentage' as const,
            commission_value: pm.value === 'debito' ? 2.5 : 3.5, // Débito 2.5%, Crédito 3.5%
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
      // ✅ FALLBACK
      const defaultCommissions = paymentMethodsConfig
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
  }, [supabase]);

  // ✅ CALCULAR COMISIÓN CORREGIDO - SOLO PARA DÉBITO Y CRÉDITO
  const calculateCommission = useCallback((method: string, amount: number): { rate: number; amount: number } => {
    // ✅ COMISIÓN SOLO PARA DÉBITO Y CRÉDITO
    const methodConfig = paymentMethodsConfig.find(pm => pm.value === method);
    if (!methodConfig || !methodConfig.hasCommission) {
      return { rate: 0, amount: 0 };
    }

    // Si hay comisión personalizada global, usarla (solo para métodos con comisión)
    if (customCommissionRate !== null) {
      const customAmount = (amount * customCommissionRate) / 100;
      return { rate: customCommissionRate, amount: customAmount };
    }

    // Buscar comisión en la base de datos
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
  }, [paymentCommissions, customCommissionRate]);

  // ✅ OBTENER COMISIÓN POR DEFECTO CORREGIDO
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
  }, [paymentCommissions, customCommissionRate]);

  // ✅ MANEJAR PAGOS MIXTOS OPTIMIZADO
  const addMixedPaymentDetail = useCallback(() => {
    const newDetail: PaymentDetail = {
      id: Date.now().toString(),
      method: 'efectivo',
      amount: 0,
      commission_rate: 0, // Efectivo sin comisión
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
      if (detail.id === id) {
        const updatedDetail = { ...detail, [field]: value };
        
        // ✅ RECALCULAR COMISIÓN AL CAMBIAR MÉTODO O MONTO
        if (field === 'method' || field === 'amount') {
          const commission = calculateCommission(updatedDetail.method, updatedDetail.amount);
          updatedDetail.commission_rate = commission.rate;
          updatedDetail.commission_amount = commission.amount;
        }
        
        return updatedDetail;
      }
      return detail;
    }));
  }, [calculateCommission]);

  // ✅ CALCULAR MONTOS OPTIMIZADO - SIN RE-RENDERS INFINITOS
  const calculatedValues = useMemo(() => {
    let newCommission = 0;
    let newFinalAmount = totals.total;

    if (isMixedPayment) {
      // Para pagos mixtos, sumar todas las comisiones
      newCommission = paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
      newFinalAmount = totals.total + newCommission;
    } else if (formData.paymentMethod) {
      // Para pago simple, calcular comisión del total
      const commission = calculateCommission(formData.paymentMethod, totals.total);
      newCommission = commission.amount;
      newFinalAmount = totals.total + newCommission;
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
    formData.paymentMethod,
    totals.total,
    isMixedPayment,
    paymentDetails,
    calculateCommission,
    cashReceived
  ]);

  // ✅ ACTUALIZAR ESTADOS CALCULADOS SIN RE-RENDERS
  useEffect(() => {
    setCommissionAmount(calculatedValues.commissionAmount);
    setFinalTotalAmount(calculatedValues.finalTotalAmount);
    setChangeAmount(calculatedValues.changeAmount);
  }, [calculatedValues]);

  // ✅ VALIDAR VENTA OPTIMIZADO
  const validateSale = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (cart.length === 0) {
      newErrors.cart = 'El carrito no puede estar vacío';
    }

    if (isMixedPayment) {
      if (paymentDetails.length === 0) {
        newErrors.payment = 'Debe agregar al menos un método de pago';
      } else {
        const totalPaid = paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
        
        if (totalPaid < finalTotalAmount) {
          newErrors.payment = `El total de pagos (${formatPrice(totalPaid)}) debe cubrir el total final (${formatPrice(finalTotalAmount)})`;
        }

        // Validar referencias requeridas para métodos con comisión
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

      if (formData.paymentMethod === 'efectivo' && cashReceived < finalTotalAmount) {
        newErrors.payment = `El monto recibido debe ser mayor o igual a ${formatPrice(finalTotalAmount)}`;
      }

      const methodConfig = paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod);
      if (methodConfig?.hasCommission && !formData.paymentReference.trim()) {
        newErrors.reference = 'La referencia es requerida para este método de pago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cart.length, isMixedPayment, paymentDetails, finalTotalAmount, formData.paymentMethod, formData.paymentReference, cashReceived]);

  // ✅ GENERAR NÚMERO DE VENTA
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
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
  }, [supabase]);

  // ✅ PROCESAR VENTA
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

      // ✅ CALCULAR MONTOS FINALES
      let totalPaidAmount = 0;
      let totalCommissionAmount = 0;
      let paymentReceivedAmount = 0;

      if (isMixedPayment) {
        totalPaidAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
        totalCommissionAmount = paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
        paymentReceivedAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
      } else {
        paymentReceivedAmount = formData.paymentMethod === 'efectivo' ? cashReceived : totals.total;
        totalCommissionAmount = commissionAmount;
        totalPaidAmount = totals.total + totalCommissionAmount;
      }

      // ✅ CREAR VENTA
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
        change_amount: changeAmount,
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

      // ✅ CREAR ITEMS DE LA VENTA
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

      // ✅ CREAR DETALLES DE PAGOS
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
            unit_cost: item.product.cost_price,
            total_cost: item.quantity * item.product.cost_price,
            reason: 'Venta',
            reference_id: sale.id,
            notes: `Venta #${sale.sale_number}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      // ✅ ACTUALIZAR CUPÓN SI SE USÓ
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', coupon.id);
      }

      // ✅ ACTUALIZAR PUNTOS DEL CLIENTE SI APLICA
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
    validateSale, supabase, generateSaleNumber, isMixedPayment, paymentDetails, 
    formData, cashReceived, totals, commissionAmount, changeAmount, 
    calculateCommission, customCommissionRate, cart, customer, coupon
  ]);

  // ✅ FINALIZAR Y CERRAR
  const handleFinish = useCallback(() => {
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  // ✅ CARGAR DATOS INICIALES OPTIMIZADO
  useEffect(() => {
    if (open) {
      loadPaymentCommissions();
      // Reset form
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
      setChangeAmount(0);
      setErrors({});
      setProcessing(false);
      setSaleCompleted(false);
      setSaleNumber(null);
      setConfirmDialogOpen(false);
    }
  }, [open, loadPaymentCommissions]);

  // ✅ STEPS PARA EL STEPPER
  const steps = useMemo(() => [
    { label: 'Método de Pago', description: 'Seleccionar forma de pago' },
    { label: 'Confirmación', description: 'Revisar y procesar venta' }
  ], []);

  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return isMixedPayment ? 
        paymentDetails.length > 0 : 
        formData.paymentMethod !== '';
      case 1: return validateSale();
      default: return false;
    }
  }, [activeStep, isMixedPayment, paymentDetails.length, formData.paymentMethod, validateSale]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4, 
          maxHeight: '95vh',
          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
          color: '#FFFFFF'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.98), rgba(76, 175, 80, 0.85))',
        color: '#FFFFFF',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <PaymentIcon />
          <Typography variant="h5" fontWeight="bold">
            💳 Sistema de Pagos Empresarial
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!saleCompleted ? (
          <Box sx={{ p: 3 }}>
            {/* Información del cliente */}
            {customer && (
              <Card sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                border: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                        {customer.email} • {customer.whatsapp || customer.phone}
                      </Typography>
                      {customer.membership_type && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={customer.membership_type} 
                            size="small" 
                            sx={{
                              backgroundColor: '#4caf50',
                              color: '#FFFFFF',
                              fontWeight: 600
                            }}
                          />
                          {customer.points_balance && customer.points_balance > 0 && (
                            <Chip 
                              icon={<LoyaltyIcon />}
                              label={`${customer.points_balance} puntos`} 
                              size="small" 
                              sx={{
                                backgroundColor: '#ff9800',
                                color: '#FFFFFF',
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
              {/* Panel Principal - Stepper */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  borderRadius: 4,
                  color: '#FFFFFF'
                }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel
                          sx={{
                            '& .MuiStepLabel-label': {
                              color: '#FFFFFF',
                              fontWeight: activeStep === index ? 700 : 500,
                              fontSize: activeStep === index ? '1.1rem' : '1rem'
                            },
                            '& .MuiStepIcon-root': {
                              color: activeStep === index ? '#4caf50' : 'rgba(204, 204, 204, 0.4)',
                              fontSize: '2rem',
                              '&.Mui-completed': {
                                color: '#4caf50'
                              }
                            }
                          }}
                        >
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ 
                            color: '#CCCCCC', 
                            mb: 3,
                            fontSize: '1rem'
                          }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: Método de Pago */}
                          {index === 0 && (
                            <Box sx={{ mb: 4 }}>
                              {/* ✅ CONFIGURACIÓN GLOBAL DE COMISIÓN CORREGIDA */}
                              <Card sx={{
                                background: 'rgba(255, 152, 0, 0.1)',
                                border: '1px solid rgba(255, 152, 0, 0.3)',
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
                                      color: '#ff9800',
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <PercentIcon />
                                      Configuración Global de Comisiones
                                    </Typography>
                                    
                                    <IconButton
                                      onClick={() => setEditingCommission(!editingCommission)}
                                      sx={{ 
                                        color: '#ff9800',
                                        '&:hover': {
                                          backgroundColor: 'rgba(255, 152, 0, 0.1)'
                                        }
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Box>

                                  <Grid container spacing={3}>
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: 'rgba(102, 102, 102, 0.1)',
                                        border: '1px solid rgba(102, 102, 102, 0.3)',
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center'
                                      }}>
                                        <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                          Comisiones por Defecto
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          color: '#FFFFFF',
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
                                                <PercentIcon sx={{ color: '#ff9800' }} />
                                              </InputAdornment>
                                            ),
                                            sx: {
                                              color: '#FFFFFF',
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255, 152, 0, 0.5)',
                                                borderWidth: 2
                                              }
                                            }
                                          }}
                                          InputLabelProps={{
                                            sx: { 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#ff9800' }
                                            }
                                          }}
                                        />
                                      ) : (
                                        <Box sx={{
                                          background: customCommissionRate !== null ?
                                            'rgba(255, 204, 0, 0.1)' :
                                            'rgba(102, 102, 102, 0.1)',
                                          border: customCommissionRate !== null ?
                                            '1px solid rgba(255, 204, 0, 0.3)' :
                                            '1px solid rgba(102, 102, 102, 0.3)',
                                          borderRadius: 2,
                                          p: 2,
                                          textAlign: 'center'
                                        }}>
                                          <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                            Comisión Aplicada
                                          </Typography>
                                          <Typography variant="h6" sx={{ 
                                            color: customCommissionRate !== null ? '#FFCC00' : '#FFFFFF',
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
                                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                          color: '#FFFFFF',
                                          border: '1px solid rgba(33, 150, 243, 0.3)',
                                          '& .MuiAlert-icon': { color: '#2196f3' }
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
                                background: 'rgba(255, 204, 0, 0.05)',
                                border: '1px solid rgba(255, 204, 0, 0.3)',
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
                                            color: '#FFCC00',
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#FFCC00',
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography variant="h6" sx={{ 
                                        color: '#FFFFFF', 
                                        fontWeight: 600 
                                      }}>
                                        🔄 Activar Pago Mixto
                                      </Typography>
                                    }
                                  />
                                  <Typography variant="body2" sx={{ 
                                    color: '#CCCCCC',
                                    mt: 1
                                  }}>
                                    Permite usar múltiples métodos para pagar la venta
                                  </Typography>
                                </CardContent>
                              </Card>

                              {/* Pago Simple */}
                              {!isMixedPayment && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Typography variant="h6" sx={{ 
                                    color: '#4caf50', 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    Método de Pago
                                  </Typography>
                                  
                                  <Grid container spacing={3}>
                                    {paymentMethodsConfig.map((method) => {
                                      const commissionRate = getDefaultCommissionRate(method.value);
                                      
                                      return (
                                        <Grid size={{ xs: 12, sm: 6 }} key={method.value}>
                                          <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                          >
                                            <Card
                                              sx={{
                                                cursor: 'pointer',
                                                background: formData.paymentMethod === method.value 
                                                  ? `linear-gradient(135deg, ${method.color}20, ${method.color}10)`
                                                  : 'rgba(77, 77, 77, 0.05)',
                                                border: formData.paymentMethod === method.value 
                                                  ? `3px solid ${method.color}` 
                                                  : '1px solid rgba(204, 204, 204, 0.2)',
                                                borderRadius: 3,
                                                transition: 'all 0.3s ease',
                                                height: '160px',
                                                '&:hover': {
                                                  borderColor: method.color,
                                                  transform: 'translateY(-2px)'
                                                }
                                              }}
                                              onClick={() => setFormData(prev => ({ 
                                                ...prev, 
                                                paymentMethod: method.value 
                                              }))}
                                            >
                                              <CardContent sx={{ 
                                                textAlign: 'center',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                position: 'relative'
                                              }}>
                                                <Typography variant="h3" sx={{ mb: 1 }}>
                                                  {method.icon}
                                                </Typography>
                                                <Typography variant="h6" sx={{ 
                                                  color: '#FFFFFF',
                                                  fontWeight: 600,
                                                  mb: 1
                                                }}>
                                                  {method.label}
                                                </Typography>
                                                <Typography variant="caption" sx={{ 
                                                  color: '#CCCCCC',
                                                  mb: 1
                                                }}>
                                                  {method.description}
                                                </Typography>
                                                {/* ✅ MOSTRAR COMISIÓN CORREGIDA */}
                                                <Typography variant="caption" sx={{ 
                                                  color: method.hasCommission ? '#ff9800' : '#4caf50',
                                                  fontWeight: 600
                                                }}>
                                                  {method.hasCommission ? 
                                                    `Comisión: ${commissionRate}%` :
                                                    'Sin comisión'
                                                  }
                                                </Typography>
                                                {formData.paymentMethod === method.value && (
                                                  <CheckIcon sx={{ 
                                                    color: method.color,
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    fontSize: 30
                                                  }} />
                                                )}
                                              </CardContent>
                                            </Card>
                                          </motion.div>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>

                                  {/* CAMPOS ESPECÍFICOS POR MÉTODO DE PAGO */}
                                  {formData.paymentMethod && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <Box sx={{ mt: 4 }}>
                                        {formData.paymentMethod === 'efectivo' && (
                                          <Card sx={{
                                            background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(204, 170, 0, 0.05))',
                                            border: '2px solid rgba(204, 170, 0, 0.5)',
                                            borderRadius: 4
                                          }}>
                                            <CardContent>
                                              <Typography variant="h6" sx={{ 
                                                color: '#CCAA00', 
                                                mb: 3,
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2
                                              }}>
                                                💵 Pago en Efectivo (Sin Comisión)
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Total a Cobrar"
                                                    value={formatPrice(finalTotalAmount)}
                                                    disabled
                                                    InputProps={{
                                                      sx: {
                                                        color: '#FFFFFF',
                                                        backgroundColor: 'rgba(204, 170, 0, 0.1)',
                                                        fontSize: '1.3rem',
                                                        fontWeight: 700
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Dinero Recibido"
                                                    type="number"
                                                    value={cashReceived || ''}
                                                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                          <MoneyIcon sx={{ color: '#FFCC00' }} />
                                                        </InputAdornment>
                                                      ),
                                                      sx: {
                                                        color: '#FFFFFF',
                                                        fontSize: '1.3rem',
                                                        fontWeight: 700
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={12}>
                                                  <Box sx={{
                                                    background: changeAmount > 0 
                                                      ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 204, 0, 0.1))'
                                                      : 'rgba(77, 77, 77, 0.05)',
                                                    border: changeAmount > 0 
                                                      ? '2px solid #FFCC00' 
                                                      : '1px solid rgba(204, 204, 204, 0.2)',
                                                    borderRadius: 3,
                                                    p: 3,
                                                    textAlign: 'center'
                                                  }}>
                                                    <Typography variant="h4" sx={{ 
                                                      color: changeAmount > 0 ? '#FFCC00' : '#808080',
                                                      fontWeight: 800,
                                                      mb: 1
                                                    }}>
                                                      {changeAmount > 0 
                                                        ? `💰 Cambio: ${formatPrice(changeAmount)}`
                                                        : '💰 Cambio: $0.00'
                                                      }
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ 
                                                      color: '#CCCCCC'
                                                    }}>
                                                      {cashReceived < finalTotalAmount 
                                                        ? `Faltan: ${formatPrice(finalTotalAmount - cashReceived)}`
                                                        : changeAmount > 0 
                                                          ? 'Entregar cambio al cliente'
                                                          : 'Pago exacto'
                                                      }
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        )}

                                        {/* MÉTODOS CON COMISIÓN (SOLO DÉBITO Y CRÉDITO) */}
                                        {(['debito', 'credito'].includes(formData.paymentMethod)) && (
                                          <Card sx={{
                                            background: 'linear-gradient(135deg, rgba(77, 77, 77, 0.15), rgba(102, 102, 102, 0.05))',
                                            border: '2px solid rgba(77, 77, 77, 0.5)',
                                            borderRadius: 4
                                          }}>
                                            <CardContent>
                                              <Typography variant="h6" sx={{ 
                                                color: '#4D4D4D', 
                                                mb: 3,
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2
                                              }}>
                                                <CreditCardIcon />
                                                Pago con Tarjeta (Con Comisión)
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 8 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Número de Autorización"
                                                    value={formData.paymentReference}
                                                    onChange={(e) => setFormData(prev => ({ 
                                                      ...prev, 
                                                      paymentReference: e.target.value 
                                                    }))}
                                                    placeholder="Ej: 123456, AUTH789..."
                                                    error={!!errors.reference}
                                                    helperText={errors.reference}
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                          <CreditCardIcon sx={{ color: '#4D4D4D' }} />
                                                        </InputAdornment>
                                                      ),
                                                      sx: {
                                                        color: '#FFFFFF'
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 4 }}>
                                                  <Box sx={{
                                                    background: 'rgba(77, 77, 77, 0.1)',
                                                    border: '1px solid rgba(77, 77, 77, 0.3)',
                                                    borderRadius: 3,
                                                    p: 2,
                                                    textAlign: 'center'
                                                  }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC',
                                                      mb: 1
                                                    }}>
                                                      Total + Comisión
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ 
                                                      color: '#4D4D4D',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(finalTotalAmount)}
                                                    </Typography>
                                                    {commissionAmount > 0 && (
                                                      <Typography variant="caption" sx={{ 
                                                        color: '#ff9800'
                                                      }}>
                                                        (Incl. {formatPrice(commissionAmount)} comisión)
                                                      </Typography>
                                                    )}
                                                  </Box>
                                                </Grid>
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        )}

                                        {/* TRANSFERENCIA SIN COMISIÓN */}
                                        {formData.paymentMethod === 'transferencia' && (
                                          <Card sx={{
                                            background: 'linear-gradient(135deg, rgba(128, 128, 128, 0.15), rgba(128, 128, 128, 0.05))',
                                            border: '2px solid rgba(128, 128, 128, 0.5)',
                                            borderRadius: 4
                                          }}>
                                            <CardContent>
                                              <Typography variant="h6" sx={{ 
                                                color: '#808080', 
                                                mb: 3,
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2
                                              }}>
                                                🏦 Transferencia Bancaria (Sin Comisión)
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 8 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Referencia SPEI (Opcional)"
                                                    value={formData.paymentReference}
                                                    onChange={(e) => setFormData(prev => ({ 
                                                      ...prev, 
                                                      paymentReference: e.target.value 
                                                    }))}
                                                    placeholder="Ej: SPEI123456..."
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                          🏦
                                                        </InputAdornment>
                                                      ),
                                                      sx: {
                                                        color: '#FFFFFF'
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 4 }}>
                                                  <Box sx={{
                                                    background: 'rgba(128, 128, 128, 0.1)',
                                                    border: '1px solid rgba(128, 128, 128, 0.3)',
                                                    borderRadius: 3,
                                                    p: 2,
                                                    textAlign: 'center'
                                                  }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC',
                                                      mb: 1
                                                    }}>
                                                      Total a Transferir
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ 
                                                      color: '#808080',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(finalTotalAmount)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ 
                                                      color: '#4caf50'
                                                    }}>
                                                      Sin comisión
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Box>
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}

                              {/* ✅ SISTEMA DE PAGOS MIXTOS CON COMISIONES CORREGIDAS */}
                              {isMixedPayment && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Card sx={{
                                    background: 'linear-gradient(135deg, rgba(255, 221, 51, 0.15), rgba(255, 221, 51, 0.05))',
                                    border: '2px solid rgba(255, 221, 51, 0.5)',
                                    borderRadius: 4
                                  }}>
                                    <CardContent>
                                      <Box sx={{ 
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#FFDD33', 
                                          fontWeight: 800
                                        }}>
                                          🔄 Sistema de Pagos Mixtos
                                        </Typography>
                                        
                                        <Button
                                          variant="contained"
                                          startIcon={<AddIcon />}
                                          onClick={addMixedPaymentDetail}
                                          sx={{
                                            background: 'linear-gradient(135deg, #FFDD33, #FFCC00)',
                                            color: '#000000',
                                            fontWeight: 700,
                                            '&:hover': {
                                              background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                                            }
                                          }}
                                        >
                                          Agregar Método
                                        </Button>
                                      </Box>

                                      {paymentDetails.length === 0 && (
                                        <Box sx={{
                                          textAlign: 'center',
                                          py: 4,
                                          border: '2px dashed rgba(255, 221, 51, 0.3)',
                                          borderRadius: 3
                                        }}>
                                          <Typography variant="body1" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 2
                                          }}>
                                            No hay métodos de pago agregados
                                          </Typography>
                                          <Typography variant="body2" sx={{ 
                                            color: '#808080'
                                          }}>
                                            Haga clic en "Agregar Método" para comenzar
                                          </Typography>
                                        </Box>
                                      )}

                                      <Stack spacing={3}>
                                        {paymentDetails.map((detail, index) => (
                                          <motion.div
                                            key={detail.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                          >
                                            <Card sx={{
                                              background: 'rgba(77, 77, 77, 0.05)',
                                              border: '1px solid rgba(204, 204, 204, 0.2)',
                                              borderRadius: 3
                                            }}>
                                              <CardContent>
                                                <Box sx={{ 
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  mb: 2
                                                }}>
                                                  <Typography variant="h6" sx={{ 
                                                    color: '#FFDD33',
                                                    fontWeight: 600
                                                  }}>
                                                    Pago #{detail.sequence}
                                                  </Typography>
                                                  
                                                  <IconButton
                                                    onClick={() => removeMixedPaymentDetail(detail.id)}
                                                    sx={{ color: '#f44336' }}
                                                  >
                                                    <RemoveIcon />
                                                  </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                  <Grid size={{ xs: 12, md: 4 }}>
                                                    <FormControl fullWidth>
                                                      <InputLabel sx={{ 
                                                        color: '#CCCCCC',
                                                        '&.Mui-focused': { color: '#FFDD33' }
                                                      }}>
                                                        Método
                                                      </InputLabel>
                                                      <Select
                                                        value={detail.method}
                                                        onChange={(e) => updateMixedPaymentDetail(detail.id, 'method', e.target.value)}
                                                        sx={{
                                                          color: '#FFFFFF',
                                                          '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(255, 221, 51, 0.3)'
                                                          },
                                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#FFDD33'
                                                          },
                                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#FFDD33'
                                                          }
                                                        }}
                                                      >
                                                        {paymentMethodsConfig.map((method) => (
                                                          <MenuItem key={method.value} value={method.value}>
                                                            {method.icon} {method.label} {method.hasCommission ? '(Con comisión)' : '(Sin comisión)'}
                                                          </MenuItem>
                                                        ))}
                                                      </Select>
                                                    </FormControl>
                                                  </Grid>

                                                  <Grid size={{ xs: 12, md: 2.5 }}>
                                                    <TextField
                                                      fullWidth
                                                      label="Monto"
                                                      type="number"
                                                      value={detail.amount || ''}
                                                      onChange={(e) => updateMixedPaymentDetail(detail.id, 'amount', parseFloat(e.target.value) || 0)}
                                                      InputProps={{
                                                        startAdornment: (
                                                          <InputAdornment position="start">
                                                            $
                                                          </InputAdornment>
                                                        ),
                                                        sx: {
                                                          color: '#FFFFFF',
                                                          '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(255, 221, 51, 0.3)'
                                                          }
                                                        }
                                                      }}
                                                      InputLabelProps={{
                                                        sx: { 
                                                          color: '#CCCCCC',
                                                          '&.Mui-focused': { color: '#FFDD33' }
                                                        }
                                                      }}
                                                    />
                                                  </Grid>

                                                  <Grid size={{ xs: 12, md: 2 }}>
                                                    <TextField
                                                      fullWidth
                                                      label="Comisión %"
                                                      value={`${detail.commission_rate}%`}
                                                      disabled
                                                      InputProps={{
                                                        sx: {
                                                          color: detail.commission_rate > 0 ? '#ff9800' : '#4caf50',
                                                          fontWeight: 600
                                                        }
                                                      }}
                                                    />
                                                  </Grid>

                                                  <Grid size={{ xs: 12, md: 1.5 }}>
                                                    <TextField
                                                      fullWidth
                                                      label="Comisión"
                                                      value={formatPrice(detail.commission_amount)}
                                                      disabled
                                                      InputProps={{
                                                        sx: {
                                                          color: detail.commission_amount > 0 ? '#ff9800' : '#4caf50',
                                                          fontWeight: 600
                                                        }
                                                      }}
                                                    />
                                                  </Grid>

                                                  <Grid size={{ xs: 12, md: 2 }}>
                                                    <TextField
                                                      fullWidth
                                                      label="Total"
                                                      value={formatPrice(detail.amount + detail.commission_amount)}
                                                      disabled
                                                      InputProps={{
                                                        sx: {
                                                          color: '#FFDD33',
                                                          fontWeight: 700,
                                                          fontSize: '1.1rem'
                                                        }
                                                      }}
                                                    />
                                                  </Grid>

                                                  <Grid size={12}>
                                                    <TextField
                                                      fullWidth
                                                      label={`Referencia (${paymentMethodsConfig.find(pm => pm.value === detail.method)?.hasCommission ? 'requerida' : 'opcional'})`}
                                                      value={detail.reference}
                                                      onChange={(e) => updateMixedPaymentDetail(detail.id, 'reference', e.target.value)}
                                                      placeholder="Número de autorización, SPEI, etc."
                                                      InputProps={{
                                                        sx: {
                                                          color: '#FFFFFF'
                                                        }
                                                      }}
                                                    />
                                                  </Grid>
                                                </Grid>
                                              </CardContent>
                                            </Card>
                                          </motion.div>
                                        ))}
                                      </Stack>

                                      {/* ✅ RESUMEN DE PAGOS MIXTOS CON COMISIONES CORREGIDAS */}
                                      {paymentDetails.length > 0 && (
                                        <Box sx={{ mt: 4 }}>
                                          <Card sx={{
                                            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                                            border: '2px solid #4caf50',
                                            borderRadius: 3
                                          }}>
                                            <CardContent>
                                              <Typography variant="h6" sx={{ 
                                                color: '#4caf50',
                                                fontWeight: 700,
                                                mb: 2
                                              }}>
                                                📊 Resumen Pagos Mixtos
                                              </Typography>

                                              <Grid container spacing={2}>
                                                <Grid size={3}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC'
                                                    }}>
                                                      Sub-total
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: '#FFFFFF',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount, 0))}
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={3}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC'
                                                    }}>
                                                      Comisiones
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: '#ff9800',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0))}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ 
                                                      color: '#4caf50',
                                                      display: 'block'
                                                    }}>
                                                      (Solo tarjetas)
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={3}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC'
                                                    }}>
                                                      Total Pagado
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: '#4caf50',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={3}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: '#CCCCCC'
                                                    }}>
                                                      vs Total
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) >= finalTotalAmount
                                                        ? '#4caf50' : '#f44336',
                                                      fontWeight: 700
                                                    }}>
                                                      {paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) >= finalTotalAmount
                                                        ? '✅ Cubierto' 
                                                        : `Faltan: ${formatPrice(finalTotalAmount - paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}`
                                                      }
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>

                                              {/* ✅ ALERTA SI HAY SOBRANTE */}
                                              {paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) > finalTotalAmount && (
                                                <Box sx={{ mt: 2 }}>
                                                  <Alert 
                                                    severity="warning"
                                                    sx={{
                                                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                      color: '#FFFFFF',
                                                      border: '1px solid rgba(255, 193, 7, 0.3)',
                                                      '& .MuiAlert-icon': { color: '#ffc107' }
                                                    }}
                                                  >
                                                    ⚠️ Total de pagos ({formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}) excede el total requerido ({formatPrice(finalTotalAmount)}). 
                                                    El excedente se generará como cambio.
                                                  </Alert>
                                                </Box>
                                              )}
                                            </CardContent>
                                          </Card>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}

                              {/* Opciones adicionales */}
                              <Box sx={{ mt: 4 }}>
                                <Card sx={{
                                  background: 'rgba(33, 150, 243, 0.1)',
                                  border: '1px solid rgba(33, 150, 243, 0.3)',
                                  borderRadius: 3
                                }}>
                                  <CardContent>
                                    <Typography variant="h6" sx={{ 
                                      color: '#2196f3',
                                      fontWeight: 700,
                                      mb: 3
                                    }}>
                                      ⚙️ Opciones Adicionales
                                    </Typography>

                                    <Grid container spacing={3}>
                                      <Grid size={6}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={formData.printReceipt}
                                              onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                printReceipt: e.target.checked 
                                              }))}
                                              sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                  color: '#2196f3',
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                  backgroundColor: '#2196f3',
                                                },
                                              }}
                                            />
                                          }
                                          label={
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF', 
                                              fontWeight: 500
                                            }}>
                                              🖨️ Imprimir ticket
                                            </Typography>
                                          }
                                        />
                                      </Grid>

                                      <Grid size={6}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={formData.sendEmail}
                                              onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                sendEmail: e.target.checked 
                                              }))}
                                              disabled={!customer?.email}
                                              sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                  color: '#2196f3',
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                  backgroundColor: '#2196f3',
                                                },
                                              }}
                                            />
                                          }
                                          label={
                                            <Typography variant="body1" sx={{ 
                                              color: customer?.email ? '#FFFFFF' : '#808080', 
                                              fontWeight: 500
                                            }}>
                                              📧 Enviar por email
                                            </Typography>
                                          }
                                        />
                                      </Grid>

                                      <Grid size={12}>
                                        <TextField
                                          fullWidth
                                          label="Notas de la venta"
                                          multiline
                                          rows={2}
                                          value={formData.notes}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            notes: e.target.value 
                                          }))}
                                          placeholder="Información adicional sobre la venta..."
                                          InputProps={{
                                            sx: {
                                              color: '#FFFFFF',
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(33, 150, 243, 0.3)'
                                              }
                                            }
                                          }}
                                          InputLabelProps={{
                                            sx: { 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#2196f3' }
                                            }
                                          }}
                                        />
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Box>
                            </Box>
                          )}

                          {/* PASO 2: Confirmación */}
                          {index === 1 && (
                            <Box sx={{ mb: 4 }}>
                              <Typography variant="h5" sx={{ 
                                color: '#4caf50', 
                                mb: 3,
                                fontWeight: 800
                              }}>
                                ✅ Confirmar Venta
                              </Typography>

                              <Card sx={{
                                background: 'rgba(76, 175, 80, 0.1)',
                                border: '2px solid rgba(76, 175, 80, 0.3)',
                                borderRadius: 4
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ 
                                    color: '#4caf50', 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    🎯 Resumen Final de la Venta
                                  </Typography>

                                  <Grid container spacing={3}>
                                    {/* Información del Cliente */}
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: 'rgba(76, 175, 80, 0.05)',
                                        border: '1px solid rgba(76, 175, 80, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#4caf50',
                                          fontWeight: 700,
                                          mb: 2
                                        }}>
                                          👤 Cliente
                                        </Typography>
                                        
                                        {customer ? (
                                          <Box>
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 600
                                            }}>
                                              {customer.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC'
                                            }}>
                                              {customer.email || customer.whatsapp}
                                            </Typography>
                                            {customer.membership_type && (
                                              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip 
                                                  label={customer.membership_type}
                                                  size="small"
                                                  sx={{ 
                                                    backgroundColor: '#4caf50',
                                                    color: '#FFFFFF',
                                                    fontWeight: 600
                                                  }}
                                                />
                                                <Chip 
                                                  label={`+${Math.floor(totals.total / 100)} puntos`}
                                                  size="small"
                                                  sx={{ 
                                                    backgroundColor: '#ff9800',
                                                    color: '#FFFFFF',
                                                    fontWeight: 600
                                                  }}
                                                />
                                              </Box>
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            fontStyle: 'italic'
                                          }}>
                                            Venta sin cliente registrado
                                          </Typography>
                                        )}
                                      </Box>
                                    </Grid>

                                    {/* Información de la Venta */}
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: 'rgba(76, 175, 80, 0.05)',
                                        border: '1px solid rgba(76, 175, 80, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#4caf50',
                                          fontWeight: 700,
                                          mb: 2
                                        }}>
                                          🛒 Detalles de Venta
                                        </Typography>
                                        
                                        <Box>
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 1
                                          }}>
                                            Productos: {cart.length} artículo{cart.length !== 1 ? 's' : ''}
                                          </Typography>
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 1
                                          }}>
                                            Cantidad total: {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                          </Typography>
                                          
                                          {coupon && (
                                            <Box sx={{ mt: 2 }}>
                                              <Chip 
                                                icon={<CouponIcon />}
                                                label={`Cupón: ${coupon.code}`}
                                                size="small"
                                                sx={{ 
                                                  backgroundColor: '#e91e63',
                                                  color: '#FFFFFF',
                                                  fontWeight: 600
                                                }}
                                              />
                                            </Box>
                                          )}
                                        </Box>
                                      </Box>
                                    </Grid>

                                    {/* Método de Pago */}
                                    <Grid size={12}>
                                      <Box sx={{
                                        background: 'rgba(76, 175, 80, 0.05)',
                                        border: '1px solid rgba(76, 175, 80, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#4caf50',
                                          fontWeight: 700,
                                          mb: 2
                                        }}>
                                          💳 Método de Pago
                                        </Typography>
                                        
                                        {isMixedPayment ? (
                                          <Box>
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 600,
                                              mb: 1
                                            }}>
                                              🔄 Pago Mixto
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC',
                                              mb: 2
                                            }}>
                                              {paymentDetails.length} método{paymentDetails.length !== 1 ? 's' : ''} configurado{paymentDetails.length !== 1 ? 's' : ''}
                                            </Typography>
                                            
                                            {paymentDetails.map((detail, idx) => {
                                              const methodConfig = paymentMethodsConfig.find(pm => pm.value === detail.method);
                                              return (
                                                <Chip 
                                                  key={detail.id}
                                                  label={`${methodConfig?.label}: ${formatPrice(detail.amount)}${detail.commission_amount > 0 ? ` + ${formatPrice(detail.commission_amount)} comisión` : ' (sin comisión)'}`}
                                                  size="small"
                                                  sx={{ 
                                                    mt: 1,
                                                    mr: 1,
                                                    backgroundColor: detail.commission_amount > 0 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                                    color: detail.commission_amount > 0 ? '#ff9800' : '#4caf50',
                                                    fontWeight: 600
                                                  }}
                                                />
                                              );
                                            })}
                                          </Box>
                                        ) : (
                                          <Box>
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 600
                                            }}>
                                              {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.label}
                                            </Typography>
                                            
                                            {formData.paymentMethod === 'efectivo' && changeAmount > 0 && (
                                              <Typography variant="body2" sx={{ 
                                                color: '#FFCC00',
                                                fontWeight: 600,
                                                mt: 1
                                              }}>
                                                💰 Cambio: {formatPrice(changeAmount)}
                                              </Typography>
                                            )}

                                            {commissionAmount > 0 && (
                                              <Chip 
                                                label={`Comisión: ${formatPrice(commissionAmount)}`}
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
                                                  backgroundColor: '#ff9800',
                                                  color: '#FFFFFF',
                                                  fontWeight: 600
                                                }}
                                              />
                                            )}

                                            {!paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.hasCommission && (
                                              <Chip 
                                                label="Sin comisión"
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
                                                  backgroundColor: '#4caf50',
                                                  color: '#FFFFFF',
                                                  fontWeight: 600
                                                }}
                                              />
                                            )}

                                            {customCommissionRate !== null && (
                                              <Chip 
                                                label={`Comisión Global: ${customCommissionRate}%`}
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
                                                  ml: 1,
                                                  backgroundColor: '#ff9800',
                                                  color: '#FFFFFF',
                                                  fontWeight: 600
                                                }}
                                              />
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    </Grid>

                                    {/* Totales Detallados */}
                                    <Grid size={12}>
                                      <Box sx={{
                                        background: 'rgba(77, 77, 77, 0.05)',
                                        border: '1px solid rgba(204, 204, 204, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#4caf50',
                                          fontWeight: 700,
                                          mb: 3
                                        }}>
                                          💰 Desglose Financiero
                                        </Typography>

                                        <Grid container spacing={2}>
                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Subtotal
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                                {formatPrice(totals.subtotal)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Impuestos
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196f3' }}>
                                                {formatPrice(totals.taxAmount)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Descuentos
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#e91e63' }}>
                                                -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 0, 0.8)' }}>
                                                Comisiones
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
                                                {commissionAmount > 0 ? `+${formatPrice(commissionAmount)}` : '$0.00'}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#CCCCCC', display: 'block' }}>
                                                Solo tarjetas
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ 
                                              textAlign: 'center',
                                              background: 'rgba(76, 175, 80, 0.1)',
                                              borderRadius: 2,
                                              p: 2,
                                              border: '1px solid rgba(76, 175, 80, 0.3)'
                                            }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                TOTAL FINAL
                                              </Typography>
                                              <Typography variant="h4" sx={{ fontWeight: 800, color: '#4caf50' }}>
                                                {formatPrice(finalTotalAmount)}
                                              </Typography>
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Grid>
                                  </Grid>

                                  {/* Alertas y Notas */}
                                  {customCommissionRate !== null && (
                                    <Box sx={{ mt: 3 }}>
                                      <Alert 
                                        severity="info"
                                        sx={{
                                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                          color: '#FFFFFF',
                                          border: '1px solid rgba(33, 150, 243, 0.3)',
                                          '& .MuiAlert-icon': { color: '#2196f3' }
                                        }}
                                      >
                                        <Typography variant="body2">
                                          <strong>Comisión Global:</strong> {customCommissionRate}% aplicada solo a tarjetas débito y crédito
                                        </Typography>
                                      </Alert>
                                    </Box>
                                  )}

                                  {formData.notes && (
                                    <Box sx={{ mt: 3 }}>
                                      <Alert 
                                        severity="info"
                                        sx={{
                                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                          color: '#FFFFFF',
                                          border: '1px solid rgba(76, 175, 80, 0.3)',
                                          '& .MuiAlert-icon': { color: '#4caf50' }
                                        }}
                                      >
                                        <Typography variant="body2">
                                          <strong>Notas:</strong> {formData.notes}
                                        </Typography>
                                      </Alert>
                                    </Box>
                                  )}

                                  {/* Opciones de impresión/envío */}
                                  <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ 
                                      color: '#4caf50',
                                      fontWeight: 700,
                                      mb: 2
                                    }}>
                                      📄 Opciones de Entrega
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                      <Grid size={6}>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          gap: 2,
                                          p: 2,
                                          background: formData.printReceipt ? 
                                            'rgba(76, 175, 80, 0.1)' : 
                                            'rgba(77, 77, 77, 0.05)',
                                          border: formData.printReceipt ? 
                                            '1px solid rgba(76, 175, 80, 0.3)' : 
                                            '1px solid rgba(204, 204, 204, 0.2)',
                                          borderRadius: 2
                                        }}>
                                          <ReceiptIcon sx={{ 
                                            color: formData.printReceipt ? '#4caf50' : '#808080'
                                          }} />
                                          <Typography sx={{ 
                                            color: formData.printReceipt ? '#FFFFFF' : '#CCCCCC'
                                          }}>
                                            {formData.printReceipt ? '✅ Imprimirá ticket' : '❌ No imprimirá ticket'}
                                          </Typography>
                                        </Box>
                                      </Grid>

                                      <Grid size={6}>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          gap: 2,
                                          p: 2,
                                          background: formData.sendEmail ? 
                                            'rgba(33, 150, 243, 0.1)' : 
                                            'rgba(77, 77, 77, 0.05)',
                                          border: formData.sendEmail ? 
                                            '1px solid rgba(33, 150, 243, 0.3)' : 
                                            '1px solid rgba(204, 204, 204, 0.2)',
                                          borderRadius: 2
                                        }}>
                                          <Typography sx={{ fontSize: '1.5rem' }}>📧</Typography>
                                          <Typography sx={{ 
                                            color: formData.sendEmail ? '#FFFFFF' : '#CCCCCC'
                                          }}>
                                            {formData.sendEmail ? `✅ Enviará a ${customer?.email}` : '❌ No enviará email'}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          )}

                          {/* Botones de navegación */}
                          <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={() => setActiveStep(prev => prev - 1)}
                              size="large"
                              sx={{ 
                                color: '#CCCCCC',
                                borderColor: 'rgba(204, 204, 204, 0.4)',
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
                                disabled={!canProceedToNextStep()}
                                size="large"
                                startIcon={<PaymentIcon />}
                                sx={{
                                  background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                                  }
                                }}
                              >
                                Procesar Venta
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                size="large"
                                sx={{
                                  background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
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

              {/* Panel derecho - Resumen de la Venta */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
                  border: '2px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: 4,
                  position: 'sticky',
                  top: 20,
                  color: '#FFFFFF'
                }}>
                  <Typography variant="h5" sx={{ 
                    color: '#4caf50', 
                    mb: 4, 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <CartIcon />
                    Ticket de Venta
                  </Typography>

                  {/* Cliente */}
                  {customer && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: 3,
                        p: 3
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#CCCCCC',
                          mb: 1
                        }}>
                          Cliente:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: '#FFFFFF', 
                          fontWeight: 700,
                          mb: 0.5
                        }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#CCCCCC'
                        }}>
                          {customer.email || customer.whatsapp}
                        </Typography>
                        
                        {customer.membership_type && (
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Chip 
                              label={customer.membership_type}
                              size="small"
                              sx={{
                                backgroundColor: '#4caf50',
                                color: '#FFFFFF',
                                fontWeight: 700
                              }}
                            />
                            <Chip 
                              icon={<LoyaltyIcon />}
                              label={`+${Math.floor(totals.total / 100)} pts`}
                              size="small"
                              sx={{
                                backgroundColor: '#ff9800',
                                color: '#FFFFFF',
                                fontWeight: 700
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Productos */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#CCCCCC',
                      mb: 2
                    }}>
                      Productos ({cart.length}):
                    </Typography>
                    
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {cart.map((item, index) => (
                        <Box key={index} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: index < cart.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              color: '#FFFFFF',
                              fontWeight: 600
                            }}>
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: '#CCCCCC'
                            }}>
                              {formatPrice(item.unit_price)} x {item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: '#4caf50',
                            fontWeight: 700
                          }}>
                            {formatPrice(item.total_price)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(76, 175, 80, 0.3)', my: 3 }} />

                  {/* Totales */}
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#CCCCCC' }}>Subtotal:</Typography>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatPrice(totals.subtotal)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#CCCCCC' }}>Impuestos:</Typography>
                      <Typography sx={{ color: '#2196f3', fontWeight: 600 }}>
                        {formatPrice(totals.taxAmount)}
                      </Typography>
                    </Box>

                    {(totals.discountAmount + totals.couponDiscount) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#CCCCCC' }}>Descuentos:</Typography>
                        <Typography sx={{ color: '#e91e63', fontWeight: 600 }}>
                          -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#CCCCCC' }}>Total Base:</Typography>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatPrice(totals.total)}
                      </Typography>
                    </Box>

                    {commissionAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ 
                          color: '#ff9800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <InfoIcon fontSize="small" />
                          Comisiones:
                        </Typography>
                        <Typography sx={{ color: '#ff9800', fontWeight: 700 }}>
                          +{formatPrice(commissionAmount)}
                        </Typography>
                      </Box>
                    )}

                    {customCommissionRate !== null && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#CCCCCC' }}>Comisión Global:</Typography>
                        <Typography sx={{ color: '#ff9800', fontWeight: 600 }}>
                          {customCommissionRate}% (Solo tarjetas)
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: 'rgba(76, 175, 80, 0.5)' }} />

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(76, 175, 80, 0.1)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: '#FFFFFF', 
                        fontWeight: 800
                      }}>
                        TOTAL FINAL:
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#4caf50', 
                        fontWeight: 900
                      }}>
                        {formatPrice(finalTotalAmount)}
                      </Typography>
                    </Box>

                    {/* Información del método de pago */}
                    {(formData.paymentMethod || isMixedPayment) && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#CCCCCC',
                          mb: 2
                        }}>
                          Método de Pago:
                        </Typography>
                        
                        {isMixedPayment ? (
                          <Box sx={{
                            background: 'rgba(255, 221, 51, 0.1)',
                            border: '1px solid rgba(255, 221, 51, 0.3)',
                            borderRadius: 3,
                            p: 2
                          }}>
                            <Typography variant="body1" sx={{ 
                              color: '#FFDD33',
                              fontWeight: 600,
                              mb: 1
                            }}>
                              🔄 Pago Mixto
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#CCCCCC',
                              mb: 1
                            }}>
                              {paymentDetails.length} método{paymentDetails.length !== 1 ? 's' : ''} configurado{paymentDetails.length !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#ff9800',
                              fontWeight: 600
                            }}>
                              Total: {formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}
                            </Typography>
                            {paymentDetails.some(detail => detail.commission_amount > 0) && (
                              <Typography variant="caption" sx={{ 
                                color: '#4caf50',
                                display: 'block',
                                mt: 1
                              }}>
                                ✅ Comisiones solo en tarjetas
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{
                            background: 'rgba(77, 77, 77, 0.05)',
                            border: '1px solid rgba(204, 204, 204, 0.2)',
                            borderRadius: 3,
                            p: 2
                          }}>
                            <Typography variant="body1" sx={{ 
                              color: '#FFFFFF',
                              fontWeight: 600
                            }}>
                              {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.label}
                            </Typography>
                            
                            {commissionAmount > 0 && (
                              <Typography variant="body2" sx={{ 
                                color: '#ff9800',
                                fontWeight: 600,
                                mt: 1
                              }}>
                                Comisión: {formatPrice(commissionAmount)}
                              </Typography>
                            )}

                            {!paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.hasCommission && (
                              <Typography variant="body2" sx={{ 
                                color: '#4caf50',
                                fontWeight: 600,
                                mt: 1
                              }}>
                                ✅ Sin comisión
                              </Typography>
                            )}

                            {formData.paymentMethod === 'efectivo' && changeAmount > 0 && (
                              <Typography variant="body2" sx={{ 
                                color: '#FFCC00',
                                fontWeight: 600,
                                mt: 1
                              }}>
                                💰 Cambio: {formatPrice(changeAmount)}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // ✅ CONFIRMACIÓN DE VENTA COMPLETADA
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckIcon sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
              <Typography variant="h3" fontWeight="bold" color="#4caf50" gutterBottom>
                ¡Venta Procesada Exitosamente!
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#4caf50', fontWeight: 700 }}>
                #{saleNumber}
              </Typography>
              <Typography variant="h6" color="#CCCCCC" sx={{ mb: 4 }}>
                Venta procesada el {formatDate(new Date().toISOString())}
              </Typography>

              <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
                <Grid size={2.4}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#4caf50">
                      {formatPrice(totals.total)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Total Base
                    </Typography>
                  </Paper>
                </Grid>

                {commissionAmount > 0 && (
                  <Grid size={2.4}>
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.3)'
                    }}>
                      <Typography variant="h4" fontWeight="bold" color="#ff9800">
                        {formatPrice(commissionAmount)}
                      </Typography>
                      <Typography variant="body1" color="#CCCCCC">
                        Comisiones
                      </Typography>
                      <Typography variant="caption" color="#4caf50">
                        Solo tarjetas
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid size={commissionAmount > 0 ? 2.4 : 3.6}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(255, 204, 0, 0.1)',
                    border: '1px solid rgba(255, 204, 0, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#FFCC00">
                      {formatPrice(finalTotalAmount)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Total Cobrado
                    </Typography>
                  </Paper>
                </Grid>

                {changeAmount > 0 && (
                  <Grid size={2.4}>
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid rgba(255, 193, 7, 0.3)'
                    }}>
                      <Typography variant="h4" fontWeight="bold" color="#ffc107">
                        {formatPrice(changeAmount)}
                      </Typography>
                      <Typography variant="body1" color="#CCCCCC">
                        Cambio
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid size={commissionAmount > 0 ? (changeAmount > 0 ? 2.4 : 4.8) : (changeAmount > 0 ? 3.6 : 4.8)}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#2196f3">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Productos
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {customer && (
                <Typography variant="body1" color="#CCCCCC" sx={{ mb: 2 }}>
                  👤 Cliente: {customer.name}
                  {customer.membership_type && (
                    <span style={{ color: '#ff9800', fontWeight: 600, marginLeft: 8 }}>
                      (+{Math.floor(totals.total / 100)} puntos ganados)
                    </span>
                  )}
                </Typography>
              )}

              <Typography variant="body2" color="#808080" sx={{ mb: 2 }}>
                💳 Método: {isMixedPayment ? 'Pago Mixto' : paymentMethodsConfig.find(pm => pm.value === formData.paymentMethod)?.label}
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {formData.printReceipt && (
                  <Chip 
                    icon={<ReceiptIcon />}
                    label="Ticket impreso"
                    sx={{
                      backgroundColor: '#4caf50',
                      color: '#FFFFFF',
                      fontWeight: 600
                    }}
                  />
                )}
                {formData.sendEmail && customer?.email && (
                  <Chip 
                    label={`Email enviado a ${customer.email}`}
                    sx={{
                      backgroundColor: '#2196f3',
                      color: '#FFFFFF',
                      fontWeight: 600
                    }}
                  />
                )}
                {commissionAmount === 0 && (
                  <Chip 
                    label="Sin comisiones aplicadas"
                    sx={{
                      backgroundColor: '#4caf50',
                      color: '#FFFFFF',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </motion.div>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {!saleCompleted ? (
          <>
            <Button onClick={onClose} disabled={processing} size="large">
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
              background: 'linear-gradient(135deg, #4caf50, #388e3c)',
              color: '#FFFFFF',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Finalizar y Cerrar
          </Button>
        )}
      </DialogActions>

      {/* ✅ DIALOG DE CONFIRMACIÓN FINAL */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => !processing && setConfirmDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
            border: '2px solid rgba(76, 175, 80, 0.5)',
            borderRadius: 4,
            color: '#FFFFFF'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#4caf50', 
          fontWeight: 800,
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          💳 Confirmación Final de Venta
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ 
            mb: 3,
            textAlign: 'center',
            color: '#CCCCCC'
          }}>
            ¿Está seguro de procesar esta venta? Esta acción actualizará el inventario y procesará el pago.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#4caf50',
                  fontWeight: 800,
                  mb: 1
                }}>
                  {formatPrice(finalTotalAmount)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#CCCCCC'
                }}>
                  Total a cobrar
                  {commissionAmount > 0 && (
                    <Typography variant="caption" sx={{ 
                      color: '#ff9800',
                      display: 'block'
                    }}>
                      (Incluye {formatPrice(commissionAmount)} comisiones solo en tarjetas)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid size={6}>
              <Box sx={{
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#2196f3',
                  fontWeight: 800,
                  mb: 1
                }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#CCCCCC'
                }}>
                  Productos a procesar
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {formData.paymentMethod === 'efectivo' && changeAmount > 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert 
                severity="warning"
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  '& .MuiAlert-icon': { color: '#ffc107' }
                }}
              >
                💰 <strong>Cambio a entregar:</strong> {formatPrice(changeAmount)}
              </Alert>
            </Box>
          )}

          {commissionAmount === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert 
                severity="success"
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  '& .MuiAlert-icon': { color: '#4caf50' }
                }}
              >
                ✅ <strong>Sin comisiones:</strong> Pago con efectivo{formData.paymentMethod === 'transferencia' ? ' y/o transferencia' : ''}
              </Alert>
            </Box>
          )}

          {errors.payment && (
            <Alert severity="error" sx={{ mt: 2 }}>
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
              color: '#CCCCCC',
              borderColor: 'rgba(204, 204, 204, 0.4)',
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
            startIcon={processing ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : <PaymentIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4caf50, #388e3c)',
              color: '#FFFFFF',
              fontWeight: 800,
              px: 6,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.4)'
              }
            }}
          >
            {processing ? 'Procesando Venta...' : '✅ Confirmar y Procesar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}