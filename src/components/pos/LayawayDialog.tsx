'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Slider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  Badge,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  MonetizationOn as CashIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Calculate as CalculateIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateRangeIcon,
  Percent as PercentIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
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
  PaymentDetail,
  LayawayFormData,
  PaymentMethodConfig
} from '@/types';

interface Customer extends User {
  name: string;
  phone?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer?: Customer | null;
  coupon?: Coupon | null;
  totals: CartTotals;
  onSuccess: () => void;
}

// ✅ CONFIGURACIÓN EXACTA COMO EN MEMBRESÍAS
const paymentMethods: PaymentMethodConfig[] = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: '#CCAA00',
    description: 'Anticipo en efectivo',
    defaultCommission: 0
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: '#4D4D4D',
    description: 'Pago con tarjeta de débito',
    defaultCommission: 2.5
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: '#666666',
    description: 'Pago con tarjeta de crédito',
    defaultCommission: 3.5
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: '#808080',
    description: 'Transferencia bancaria',
    defaultCommission: 0
  }
];

const LAYAWAY_PERIODS = [
  { days: 15, label: '15 días' },
  { days: 30, label: '30 días' },
  { days: 45, label: '45 días' },
  { days: 60, label: '60 días' },
  { days: 90, label: '90 días' }
];

export default function LayawayDialog({ 
    open, 
    onClose, 
    cart, 
    customer, 
    coupon, 
    totals, 
    onSuccess 
  }: LayawayDialogProps) {
  
    // ✅ 1. PRIMERO DECLARAR TODOS LOS ESTADOS
    const [activeStep, setActiveStep] = useState(0);
    const [paymentCommissions, setPaymentCommissions] = useState<PaymentCommission[]>([]);
    const [formData, setFormData] = useState<LayawayFormData>({
      depositPercentage: 50,
      customDeposit: false,
      depositAmount: 0,
      layawayPeriod: 30,
      customPeriod: false,
      expirationDate: '',
      paymentMethod: '',
      paymentReference: '',
      cashAmount: 0,
      cardAmount: 0,
      transferAmount: 0,
      qrAmount: 0,
      notes: '',
      requireFullPayment: false
    });
    
    // Estados exactos como en membresías
    const [isMixedPayment, setIsMixedPayment] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
    const [customCommissionRate, setCustomCommissionRate] = useState<number | null>(null);
    const [editingCommission, setEditingCommission] = useState(false);
    
    // Estados de cálculo
    const [calculatedDepositAmount, setCalculatedDepositAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    const [commissionAmount, setCommissionAmount] = useState(0);
    const [finalDepositAmount, setFinalDepositAmount] = useState(0);
    const [cashReceived, setCashReceived] = useState(0);
    const [changeAmount, setChangeAmount] = useState(0);
    
    // Estados de validación y procesamiento
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [layawayCompleted, setLayawayCompleted] = useState(false);
    const [layawayNumber, setLayawayNumber] = useState<string | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
    const supabase = createBrowserSupabaseClient();
  
    // ✅ 2. DESPUÉS DE DECLARAR ESTADOS, CREAR useMemo
    const totalsStable = useMemo(() => ({
      total: totals.total,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      couponDiscount: totals.couponDiscount
    }), [totals.total, totals.subtotal, totals.taxAmount, totals.discountAmount, totals.couponDiscount]);
  
    const paymentDetailsStable = useMemo(() => paymentDetails, [JSON.stringify(paymentDetails)]);
  
    // ✅ 3. CARGAR COMISIONES DINÁMICAS
    const loadPaymentCommissions = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_commissions')
          .select('*')
          .eq('is_active', true);
  
        if (error) throw error;
        
        if (data && data.length > 0) {
          setPaymentCommissions(data);
        } else {
          const defaultCommissions = paymentMethods.map(pm => ({
            id: pm.value,
            payment_method: pm.value,
            commission_type: 'percentage' as const,
            commission_value: pm.defaultCommission,
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
        const defaultCommissions = paymentMethods.map(pm => ({
          id: pm.value,
          payment_method: pm.value,
          commission_type: 'percentage' as const,
          commission_value: pm.defaultCommission,
          min_amount: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: ''
        }));
        setPaymentCommissions(defaultCommissions);
      }
    };
  
    // ✅ 4. CALCULAR COMISIÓN
    const calculateCommission = (method: string, amount: number): { rate: number; amount: number } => {
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
    };
  
    // ✅ 5. OBTENER COMISIÓN POR DEFECTO
    const getDefaultCommissionRate = (method: string): number => {
      if (customCommissionRate !== null) {
        return customCommissionRate;
      }
      
      const commission = paymentCommissions.find(c => c.payment_method === method);
      return commission?.commission_value || 0;
    };
  
    // ✅ 6. MANEJAR PAGOS MIXTOS
    const addMixedPaymentDetail = () => {
      const newDetail: PaymentDetail = {
        id: Date.now().toString(),
        method: 'efectivo',
        amount: 0,
        commission_rate: getDefaultCommissionRate('efectivo'),
        commission_amount: 0,
        reference: '',
        sequence: paymentDetails.length + 1
      };
  
      setPaymentDetails(prev => [...prev, newDetail]);
    };
  
    const removeMixedPaymentDetail = (id: string) => {
      setPaymentDetails(prev => prev.filter(detail => detail.id !== id));
    };
  
    const updateMixedPaymentDetail = (id: string, field: keyof PaymentDetail, value: any) => {
      setPaymentDetails(prev => prev.map(detail => {
        if (detail.id === id) {
          const updatedDetail = { ...detail, [field]: value };
          
          if (field === 'method' || field === 'amount') {
            const commission = calculateCommission(updatedDetail.method, updatedDetail.amount);
            updatedDetail.commission_rate = commission.rate;
            updatedDetail.commission_amount = commission.amount;
          }
          
          return updatedDetail;
        }
        return detail;
      }));
    };
  
    // ✅ 7. useEffect PRINCIPAL CORREGIDO
    useEffect(() => {
      const newDepositAmount = formData.customDeposit ? 
        formData.depositAmount : 
        (totalsStable.total * formData.depositPercentage / 100);
      
      setCalculatedDepositAmount(newDepositAmount);
      setRemainingAmount(totalsStable.total - newDepositAmount);
  
      let newCommission = 0;
      let newFinalAmount = newDepositAmount;
  
      if (isMixedPayment) {
        newCommission = paymentDetailsStable.reduce((sum, detail) => sum + detail.commission_amount, 0);
        newFinalAmount = paymentDetailsStable.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
      } else if (formData.paymentMethod) {
        const commission = calculateCommission(formData.paymentMethod, newDepositAmount);
        newCommission = commission.amount;
        newFinalAmount = newDepositAmount + newCommission;
      }
  
      setCommissionAmount(newCommission);
      setFinalDepositAmount(newFinalAmount);
  
      if (formData.paymentMethod === 'efectivo' && cashReceived > 0) {
        const change = cashReceived - newFinalAmount;
        setChangeAmount(Math.max(0, change));
      } else {
        setChangeAmount(0);
      }
  
    }, [
      formData.depositPercentage, 
      formData.customDeposit, 
      formData.depositAmount, 
      formData.paymentMethod,
      totalsStable.total,
      isMixedPayment,
      paymentDetailsStable,
      customCommissionRate,
      cashReceived,
      paymentCommissions
    ]);

 // ✅ 8. CALCULAR FECHA DE EXPIRACIÓN
  useEffect(() => {
    if (!formData.customPeriod) {
      const today = new Date();
      const expiration = new Date(today.getTime() + (formData.layawayPeriod * 24 * 60 * 60 * 1000));
      setFormData(prev => ({
        ...prev,
        expirationDate: expiration.toISOString().split('T')[0]
      }));
    }
  }, [formData.layawayPeriod, formData.customPeriod]);

  // ✅ VALIDAR APARTADO EXACTO COMO MEMBRESÍAS
  const validateLayaway = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customer) {
      newErrors.customer = 'Se requiere seleccionar un cliente para apartados';
    }

    if (calculatedDepositAmount <= 0) {
      newErrors.deposit = 'El anticipo debe ser mayor a $0';
    }

    if (calculatedDepositAmount > totals.total) {
      newErrors.deposit = 'El anticipo no puede ser mayor al total';
    }

    if (!formData.expirationDate) {
      newErrors.expiration = 'Se requiere fecha de expiración';
    } else {
      const expDate = new Date(formData.expirationDate);
      const today = new Date();
      if (expDate <= today) {
        newErrors.expiration = 'La fecha de expiración debe ser futura';
      }
    }

    // ✅ VALIDACIONES DE PAGO EXACTAS COMO MEMBRESÍAS
    if (isMixedPayment) {
      if (paymentDetails.length === 0) {
        newErrors.payment = 'Debe agregar al menos un método de pago';
      } else {
        const totalPaid = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
        
        if (totalPaid < calculatedDepositAmount) {
          newErrors.payment = `El total de pagos (${formatPrice(totalPaid)}) debe cubrir al menos el anticipo mínimo (${formatPrice(calculatedDepositAmount)})`;
        }

        // Validar referencias requeridas para cada método
        for (const detail of paymentDetails) {
          if (['debito', 'credito', 'transferencia'].includes(detail.method) && !detail.reference.trim()) {
            newErrors.payment = `La referencia es requerida para ${paymentMethods.find(pm => pm.value === detail.method)?.label}`;
            break;
          }
        }
      }
    } else {
      if (!formData.paymentMethod) {
        newErrors.payment = 'Se requiere un método de pago para el anticipo';
      }

      if (formData.paymentMethod === 'efectivo' && cashReceived < finalDepositAmount) {
        newErrors.payment = `El monto recibido debe ser mayor o igual a ${formatPrice(finalDepositAmount)}`;
      }

      if (['debito', 'credito', 'transferencia'].includes(formData.paymentMethod) && !formData.paymentReference.trim()) {
        newErrors.reference = 'La referencia es requerida para este método de pago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ GENERAR NÚMERO DE APARTADO
  const generateLayawayNumber = async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    const { data, error } = await supabase
      .from('sales')
      .select('sale_number')
      .eq('sale_type', 'layaway')
      .like('sale_number', `AP${year}${month}${day}%`)
      .order('sale_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting last layaway number:', error);
      return `AP${year}${month}${day}${Date.now().toString().slice(-6)}`;
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].sale_number.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `AP${year}${month}${day}${nextNumber.toString().padStart(4, '0')}`;
  };

  // ✅ PROCESAR APARTADO CON LÓGICA EXACTA DE MEMBRESÍAS
  const processLayaway = async () => {
    if (!validateLayaway()) return;

    try {
      setProcessing(true);
      setErrors({});

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      if (!customer) {
        throw new Error('Cliente requerido');
      }

      const layawayNumber = await generateLayawayNumber();
      const expirationDateTime = new Date(formData.expirationDate + 'T23:59:59.999Z').toISOString();

      // ✅ CALCULAR MONTOS FINALES EXACTO COMO MEMBRESÍAS
      let totalPaidAmount = 0;
      let totalCommissionAmount = 0;
      let paymentReceivedAmount = 0;

      if (isMixedPayment) {
        totalPaidAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
        totalCommissionAmount = paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
        paymentReceivedAmount = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
      } else {
        paymentReceivedAmount = formData.paymentMethod === 'efectivo' ? cashReceived : calculatedDepositAmount;
        totalCommissionAmount = commissionAmount;
        totalPaidAmount = calculatedDepositAmount + totalCommissionAmount;
      }

      // ✅ CREAR VENTA TIPO LAYAWAY CON CAMPOS EXTENDIDOS (COMO MEMBRESÍAS)
      const layawayData = {
        sale_number: layawayNumber,
        customer_id: customer.id,
        cashier_id: userId,
        sale_type: 'layaway' as const,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        coupon_discount: totals.couponDiscount,
        coupon_code: coupon?.code || null,
        total_amount: totals.total,
        required_deposit: calculatedDepositAmount,
        paid_amount: totalPaidAmount,
        pending_amount: totals.total - totalPaidAmount,
        deposit_percentage: formData.customDeposit ? 
          Math.round((calculatedDepositAmount / totals.total) * 100) : 
          formData.depositPercentage,
        layaway_expires_at: expirationDateTime,
        status: 'pending' as const,
        payment_status: totalPaidAmount >= totals.total ? 'paid' : 'partial' as const,
        is_mixed_payment: isMixedPayment,
        payment_received: paymentReceivedAmount,
        change_amount: changeAmount,
        commission_rate: isMixedPayment ? 0 : calculateCommission(formData.paymentMethod, calculatedDepositAmount).rate,
        commission_amount: totalCommissionAmount,
        // ✅ CAMPOS EXTENDIDOS EXACTOS COMO MEMBRESÍAS
        custom_commission_rate: customCommissionRate,
        skip_inscription: false, // No aplica para apartados
        payment_date: new Date().toISOString(),
        notes: formData.notes.trim() || `Apartado - Vence: ${formatDate(expirationDateTime)}`,
        receipt_printed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString()
      };

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
        discount_amount: item.discount_amount,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: item.tax_amount,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(layawayItems);

      if (itemsError) throw itemsError;

      // ✅ CREAR DETALLES DE PAGOS EXACTO COMO MEMBRESÍAS
      if (isMixedPayment) {
        const paymentDetailsData = paymentDetails.map((payment) => ({
          sale_id: layaway.id,
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
        // Pago simple
        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert([{
            sale_id: layaway.id,
            payment_method: formData.paymentMethod,
            amount: calculatedDepositAmount,
            payment_reference: formData.paymentReference || null,
            commission_rate: calculateCommission(formData.paymentMethod, calculatedDepositAmount).rate,
            commission_amount: totalCommissionAmount,
            sequence_order: 1,
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        if (paymentError) throw paymentError;
      }

      // ✅ CREAR PAGO INICIAL EN LAYAWAY_PAYMENTS
      const depositPaid = isMixedPayment ? 
        paymentDetails.reduce((sum, detail) => sum + detail.amount, 0) :
        calculatedDepositAmount;

      const { error: layawayPaymentError } = await supabase
        .from('layaway_payments')
        .insert([{
          sale_id: layaway.id,
          payment_amount: depositPaid,
          payment_method: isMixedPayment ? 'mixto' : formData.paymentMethod,
          payment_reference: isMixedPayment ? 
            `Pago mixto: ${paymentDetails.length} métodos` : 
            formData.paymentReference || null,
          commission_rate: isMixedPayment ? 0 : calculateCommission(formData.paymentMethod, calculatedDepositAmount).rate,
          commission_amount: totalCommissionAmount,
          previous_paid_amount: 0,
          new_paid_amount: totalPaidAmount,
          remaining_amount: totals.total - totalPaidAmount,
          notes: `Anticipo inicial - ${formatPrice(depositPaid)}${totalCommissionAmount > 0 ? ` + ${formatPrice(totalCommissionAmount)} comisión` : ''}`,
          processed_by: userId,
          created_at: new Date().toISOString()
        }]);

      if (layawayPaymentError) throw layawayPaymentError;

      // ✅ REDUCIR STOCK TEMPORALMENTE (RESERVAR PRODUCTOS)
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
            reason: 'Apartado',
            reference_id: layaway.id,
            notes: `Apartado #${layaway.sale_number} - Reserva hasta ${formatDate(expirationDateTime)}`,
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

      setLayawayCompleted(true);
      setLayawayNumber(layaway.sale_number);
      showNotification('Apartado creado exitosamente', 'success');

    } catch (error) {
      console.error('Error processing layaway:', error);
      showNotification('Error al procesar apartado', 'error');
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  // ✅ FINALIZAR Y CERRAR
  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    if (open) {
      loadPaymentCommissions();
      // Reset form
      setActiveStep(0);
      setFormData({
        depositPercentage: 50,
        customDeposit: false,
        depositAmount: 0,
        layawayPeriod: 30,
        customPeriod: false,
        expirationDate: '',
        paymentMethod: '',
        paymentReference: '',
        cashAmount: 0,
        cardAmount: 0,
        transferAmount: 0,
        qrAmount: 0,
        notes: '',
        requireFullPayment: false
      });
      setIsMixedPayment(false);
      setPaymentDetails([]);
      setCustomCommissionRate(null);
      setEditingCommission(false);
      setCashReceived(0);
      setChangeAmount(0);
      setErrors({});
      setProcessing(false);
      setLayawayCompleted(false);
      setLayawayNumber(null);
      setConfirmDialogOpen(false);
    }
  }, [open]);

  // ✅ STEPS PARA EL STEPPER
  const steps = [
    { label: 'Configuración', description: 'Anticipo y vigencia del apartado' },
    { label: 'Método de Pago', description: 'Forma de pago del anticipo' },
    { label: 'Confirmación', description: 'Revisar y procesar apartado' }
  ];

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: return calculatedDepositAmount > 0 && formData.expirationDate !== '';
      case 1: return isMixedPayment ? 
        paymentDetails.length > 0 : 
        formData.paymentMethod !== '';
      case 2: return validateLayaway();
      default: return false;
    }
  };

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
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.98), rgba(156, 39, 176, 0.85))',
        color: '#FFFFFF',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BookmarkIcon />
          <Typography variant="h5" fontWeight="bold">
            📦 Sistema de Apartados Empresarial
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!layawayCompleted ? (
          <Box sx={{ p: 3 }}>
            {/* Información del cliente */}
            {!customer && (
              <Alert severity="error" sx={{ mb: 3 }}>
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

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
                        <Chip 
                          label={customer.membership_type} 
                          size="small" 
                          sx={{
                            mt: 1,
                            backgroundColor: '#4caf50',
                            color: '#FFFFFF',
                            fontWeight: 600
                          }}
                        />
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
                  border: '1px solid rgba(156, 39, 176, 0.2)',
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
                              color: activeStep === index ? '#9c27b0' : 'rgba(204, 204, 204, 0.4)',
                              fontSize: '2rem',
                              '&.Mui-completed': {
                                color: '#9c27b0'
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

                          {/* PASO 1: Configuración del Apartado */}
                          {index === 0 && (
                            <Box sx={{ mb: 4 }}>
                              <Grid container spacing={3}>
                                {/* Configuración del Anticipo */}
                                <Grid size={6}>
                                  <Card sx={{
                                    background: 'rgba(156, 39, 176, 0.1)',
                                    border: '1px solid rgba(156, 39, 176, 0.3)',
                                    borderRadius: 3
                                  }}>
                                    <CardContent>
                                      <Typography variant="h6" sx={{ 
                                        color: '#9c27b0',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        <SavingsIcon />
                                        Configuración del Anticipo
                                      </Typography>
                                      
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={formData.customDeposit}
                                            onChange={(e) => setFormData(prev => ({ 
                                              ...prev, 
                                              customDeposit: e.target.checked 
                                            }))}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#9c27b0',
                                              },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#9c27b0',
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography variant="body1" sx={{ 
                                            color: '#FFFFFF', 
                                            fontWeight: 500
                                          }}>
                                            Monto personalizado
                                          </Typography>
                                        }
                                        sx={{ mb: 3 }}
                                      />

                                      {formData.customDeposit ? (
                                        <TextField
                                          fullWidth
                                          label="Monto del anticipo"
                                          type="number"
                                          value={formData.depositAmount}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            depositAmount: parseFloat(e.target.value) || 0 
                                          }))}
                                          error={!!errors.deposit}
                                          helperText={errors.deposit}
                                          InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            sx: {
                                              color: '#FFFFFF',
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(156, 39, 176, 0.5)',
                                                borderWidth: 2
                                              }
                                            }
                                          }}
                                          InputLabelProps={{
                                            sx: { 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#9c27b0' }
                                            }
                                          }}
                                        />
                                      ) : (
                                        <Box>
                                          <Typography variant="body1" sx={{ 
                                            color: '#FFFFFF',
                                            fontWeight: 600,
                                            mb: 2
                                          }}>
                                            Porcentaje del anticipo: {formData.depositPercentage}%
                                          </Typography>
                                          <Typography variant="h6" sx={{ 
                                            color: '#9c27b0',
                                            fontWeight: 700,
                                            mb: 3
                                          }}>
                                            = {formatPrice(calculatedDepositAmount)}
                                          </Typography>
                                          <Slider
                                            value={formData.depositPercentage}
                                            onChange={(_, newValue) => setFormData(prev => ({ 
                                              ...prev, 
                                              depositPercentage: Array.isArray(newValue) ? newValue[0] : newValue 
                                            }))}
                                            min={10}
                                            max={100}
                                            step={5}
                                            marks={[
                                              { value: 25, label: '25%' },
                                              { value: 50, label: '50%' },
                                              { value: 75, label: '75%' },
                                              { value: 100, label: '100%' }
                                            ]}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => `${value}%`}
                                            sx={{
                                              '& .MuiSlider-thumb': {
                                                bgcolor: '#9c27b0'
                                              },
                                              '& .MuiSlider-track': {
                                                bgcolor: '#9c27b0'
                                              },
                                              '& .MuiSlider-rail': {
                                                bgcolor: 'rgba(156, 39, 176, 0.3)'
                                              }
                                            }}
                                          />
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Grid>

                                {/* Configuración del Período */}
                                <Grid size={6}>
                                  <Card sx={{
                                    background: 'rgba(33, 150, 243, 0.1)',
                                    border: '1px solid rgba(33, 150, 243, 0.3)',
                                    borderRadius: 3
                                  }}>
                                    <CardContent>
                                      <Typography variant="h6" sx={{ 
                                        color: '#2196f3',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        <CalendarIcon />
                                        Período del Apartado
                                      </Typography>
                                      
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={formData.customPeriod}
                                            onChange={(e) => setFormData(prev => ({ 
                                              ...prev, 
                                              customPeriod: e.target.checked 
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
                                            Fecha personalizada
                                          </Typography>
                                        }
                                        sx={{ mb: 3 }}
                                      />

                                      {formData.customPeriod ? (
                                        <TextField
                                          fullWidth
                                          label="Fecha de expiración"
                                          type="date"
                                          value={formData.expirationDate}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            expirationDate: e.target.value 
                                          }))}
                                          error={!!errors.expiration}
                                          helperText={errors.expiration}
                                          InputLabelProps={{
                                            shrink: true,
                                            sx: { 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#2196f3' }
                                            }
                                          }}
                                          InputProps={{
                                            sx: {
                                              color: '#FFFFFF',
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(33, 150, 243, 0.5)',
                                                borderWidth: 2
                                              }
                                            }
                                          }}
                                        />
                                      ) : (
                                        <Box>
                                          <FormControl fullWidth>
                                            <InputLabel sx={{ 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#2196f3' }
                                            }}>
                                              Período
                                            </InputLabel>
                                            <Select
                                              value={formData.layawayPeriod}
                                              label="Período"
                                              onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                layawayPeriod: Number(e.target.value) 
                                              }))}
                                              sx={{
                                                color: '#FFFFFF',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(33, 150, 243, 0.5)',
                                                  borderWidth: 2
                                                }
                                              }}
                                            >
                                              {LAYAWAY_PERIODS.map((period) => (
                                                <MenuItem key={period.days} value={period.days}>
                                                  {period.label}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>

                                          {formData.expirationDate && (
                                            <Box sx={{ 
                                              mt: 2,
                                              p: 2,
                                              background: 'rgba(33, 150, 243, 0.1)',
                                              border: '1px solid rgba(33, 150, 243, 0.3)',
                                              borderRadius: 2
                                            }}>
                                              <Typography variant="body2" sx={{ 
                                                color: '#CCCCCC',
                                                mb: 1
                                              }}>
                                                Vence el:
                                              </Typography>
                                              <Typography variant="h6" sx={{ 
                                                color: '#2196f3',
                                                fontWeight: 700
                                              }}>
                                                📅 {formatDate(formData.expirationDate)}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Grid>

                                {/* Notas */}
                                <Grid size={12}>
                                  <TextField
                                    fullWidth
                                    label="Notas del apartado"
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ 
                                      ...prev, 
                                      notes: e.target.value 
                                    }))}
                                    placeholder="Información adicional sobre el apartado..."
                                    InputProps={{
                                      sx: {
                                        color: '#FFFFFF',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'rgba(204, 204, 204, 0.3)'
                                        }
                                      }
                                    }}
                                    InputLabelProps={{
                                      sx: { 
                                        color: '#CCCCCC',
                                        '&.Mui-focused': { color: '#FFCC00' }
                                      }
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          {/* PASO 2: Método de Pago (EXACTO COMO MEMBRESÍAS) */}
                          {index === 1 && (
                            <Box sx={{ mb: 4 }}>
                              {/* ✅ CONFIGURACIÓN GLOBAL DE COMISIÓN (COMO MEMBRESÍAS) */}
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
                                          Desde base de datos
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
                                        Comisión global aplicada a todos los métodos de pago.
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
                                        🔄 Activar Pago Mixto para Anticipo
                                      </Typography>
                                    }
                                  />
                                  <Typography variant="body2" sx={{ 
                                    color: '#CCCCCC',
                                    mt: 1
                                  }}>
                                    Permite usar múltiples métodos para pagar el anticipo
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
                                    color: '#9c27b0', 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    Método de Pago para Anticipo
                                  </Typography>
                                  
                                  <Grid container spacing={3}>
                                    {paymentMethods.map((method) => {
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
                                                {/* ✅ MOSTRAR COMISIÓN COMO EN MEMBRESÍAS */}
                                                <Typography variant="caption" sx={{ 
                                                  color: '#ff9800',
                                                  fontWeight: 600
                                                }}>
                                                  Comisión: {commissionRate}%
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
                                                💵 Pago en Efectivo - Anticipo
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Anticipo a Cobrar"
                                                    value={formatPrice(finalDepositAmount)}
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
                                                      {cashReceived < finalDepositAmount 
                                                        ? `Faltan: ${formatPrice(finalDepositAmount - cashReceived)}`
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

                                        {/* OTROS MÉTODOS DE PAGO */}
                                        {(['debito', 'credito', 'transferencia'].includes(formData.paymentMethod)) && (
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
                                                Pago Electrónico - Anticipo
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 8 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Número de Autorización / Referencia"
                                                    value={formData.paymentReference}
                                                    onChange={(e) => setFormData(prev => ({ 
                                                      ...prev, 
                                                      paymentReference: e.target.value 
                                                    }))}
                                                    placeholder="Ej: 123456, AUTH789, SPEI..."
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
                                                      Anticipo + Comisión
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ 
                                                      color: '#4D4D4D',
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(finalDepositAmount)}
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
                                      </Box>
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}

                              {/* ✅ SISTEMA DE PAGOS MIXTOS EXACTO COMO MEMBRESÍAS */}
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
                                          🔄 Sistema de Pagos Mixtos para Anticipo
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
                                                        {paymentMethods.map((method) => (
                                                          <MenuItem key={method.value} value={method.value}>
                                                            {method.icon} {method.label}
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
                                                          color: '#ff9800',
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
                                                          color: '#ff9800',
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
                                                      label="Referencia (opcional para efectivo)"
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

                                      {/* ✅ RESUMEN DE PAGOS MIXTOS EXACTO COMO MEMBRESÍAS */}
                                      {paymentDetails.length > 0 && (
                                        <Box sx={{ mt: 4 }}>
                                          <Card sx={{
                                            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.1))',
                                            border: '2px solid #9c27b0',
                                            borderRadius: 3
                                          }}>
                                            <CardContent>
                                              <Typography variant="h6" sx={{ 
                                                color: '#9c27b0',
                                                fontWeight: 700,
                                                mb: 2
                                              }}>
                                                📊 Resumen Pagos Mixtos - Anticipo
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
                                                      color: '#9c27b0',
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
                                                      vs Anticipo
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: paymentDetails.reduce((sum, detail) => sum + detail.amount, 0) >= calculatedDepositAmount
                                                        ? '#4caf50' : '#f44336',
                                                      fontWeight: 700
                                                    }}>
                                                      {paymentDetails.reduce((sum, detail) => sum + detail.amount, 0) >= calculatedDepositAmount
                                                        ? '✅ Cubierto' 
                                                        : `Faltan: ${formatPrice(calculatedDepositAmount - paymentDetails.reduce((sum, detail) => sum + detail.amount, 0))}`
                                                      }
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>

                                              {/* ✅ ALERTA SI HAY SOBRANTE COMO EN MEMBRESÍAS */}
                                              {paymentDetails.reduce((sum, detail) => sum + detail.amount, 0) > calculatedDepositAmount && (
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
                                                    ⚠️ Total de pagos ({formatPrice(paymentDetails.reduce((sum, detail) => sum + detail.amount, 0))}) excede el anticipo requerido ({formatPrice(calculatedDepositAmount)}). 
                                                    El excedente se aplicará al saldo pendiente.
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
                            </Box>
                          )}

                          {/* PASO 3: Confirmación */}
                          {index === 2 && (
                            <Box sx={{ mb: 4 }}>
                              <Typography variant="h5" sx={{ 
                                color: '#9c27b0', 
                                mb: 3,
                                fontWeight: 800
                              }}>
                                ✅ Confirmar Apartado
                              </Typography>

                              <Card sx={{
                                background: 'rgba(156, 39, 176, 0.1)',
                                border: '2px solid rgba(156, 39, 176, 0.3)',
                                borderRadius: 4
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ 
                                    color: '#9c27b0', 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    🎯 Resumen Final del Apartado
                                  </Typography>

                                  <Grid container spacing={3}>
                                    {/* Información del Cliente */}
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: 'rgba(156, 39, 176, 0.05)',
                                        border: '1px solid rgba(156, 39, 176, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#9c27b0',
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
                                              <Chip 
                                                label={customer.membership_type}
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
                                                  backgroundColor: '#9c27b0',
                                                  color: '#FFFFFF',
                                                  fontWeight: 600
                                                }}
                                              />
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            fontStyle: 'italic'
                                          }}>
                                            Sin cliente registrado
                                          </Typography>
                                        )}
                                      </Box>
                                    </Grid>

                                    {/* Configuración del Apartado */}
                                    <Grid size={6}>
                                      <Box sx={{
                                        background: 'rgba(156, 39, 176, 0.05)',
                                        border: '1px solid rgba(156, 39, 176, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#9c27b0',
                                          fontWeight: 700,
                                          mb: 2
                                        }}>
                                          📦 Configuración
                                        </Typography>
                                        
                                        <Box>
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 1
                                          }}>
                                            Anticipo: {formData.customDeposit ? 'Personalizado' : `${formData.depositPercentage}%`}
                                          </Typography>
                                          <Typography variant="body1" sx={{ 
                                            color: '#FFFFFF',
                                            fontWeight: 600,
                                            mb: 2
                                          }}>
                                            {formatPrice(calculatedDepositAmount)}
                                          </Typography>
                                          
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 1
                                          }}>
                                            Vence el:
                                          </Typography>
                                          <Typography variant="body1" sx={{ 
                                            color: '#2196f3',
                                            fontWeight: 600
                                          }}>
                                            📅 {formatDate(formData.expirationDate)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>

                                    {/* Método de Pago del Anticipo */}
                                    <Grid size={12}>
                                      <Box sx={{
                                        background: 'rgba(156, 39, 176, 0.05)',
                                        border: '1px solid rgba(156, 39, 176, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#9c27b0',
                                          fontWeight: 700,
                                          mb: 2
                                        }}>
                                          💳 Pago del Anticipo
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
                                            
                                            {paymentDetails.map((detail, idx) => (
                                              <Chip 
                                                key={detail.id}
                                                label={`${paymentMethods.find(pm => pm.value === detail.method)?.label}: ${formatPrice(detail.amount)} (${detail.commission_rate}%)`}
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
                                                  mr: 1,
                                                  backgroundColor: 'rgba(255, 221, 51, 0.2)',
                                                  color: '#FFDD33',
                                                  fontWeight: 600
                                                }}
                                              />
                                            ))}
                                          </Box>
                                        ) : (
                                          <Box>
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 600
                                            }}>
                                              {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
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

                                            {customCommissionRate !== null && (
                                              <Chip 
                                                label={`Comisión Global: ${customCommissionRate}%`}
                                                size="small"
                                                sx={{ 
                                                  mt: 1,
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

                                    {/* Totales Detallados del Apartado */}
                                    <Grid size={12}>
                                      <Box sx={{
                                        background: 'rgba(77, 77, 77, 0.05)',
                                        border: '1px solid rgba(204, 204, 204, 0.2)',
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#9c27b0',
                                          fontWeight: 700,
                                          mb: 3
                                        }}>
                                          💰 Desglose Financiero del Apartado
                                        </Typography>

                                        <Grid container spacing={2}>
                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Total Apartado
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                                {formatPrice(totals.total)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Anticipo Base
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                                                {formatPrice(calculatedDepositAmount)}
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
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ textAlign: 'center' }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                Total Hoy
                                              </Typography>
                                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFCC00' }}>
                                                {formatPrice(finalDepositAmount)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={2.4}>
                                            <Box sx={{ 
                                              textAlign: 'center',
                                              background: 'rgba(156, 39, 176, 0.1)',
                                              borderRadius: 2,
                                              p: 2,
                                              border: '1px solid rgba(156, 39, 176, 0.3)'
                                            }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                                PENDIENTE
                                              </Typography>
                                              <Typography variant="h4" sx={{ fontWeight: 800, color: '#9c27b0' }}>
                                                {formatPrice(totals.total - finalDepositAmount)}
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
                                          <strong>Comisión Global:</strong> {customCommissionRate}% aplicada a todos los métodos de pago
                                        </Typography>
                                      </Alert>
                                    </Box>
                                  )}

                                  {formData.notes && (
                                    <Box sx={{ mt: 3 }}>
                                      <Alert 
                                        severity="info"
                                        sx={{
                                          backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                          color: '#FFFFFF',
                                          border: '1px solid rgba(156, 39, 176, 0.3)',
                                          '& .MuiAlert-icon': { color: '#9c27b0' }
                                        }}
                                      >
                                        <Typography variant="body2">
                                          <strong>Notas:</strong> {formData.notes}
                                        </Typography>
                                      </Alert>
                                    </Box>
                                  )}
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
                                startIcon={<BookmarkIcon />}
                                sx={{
                                  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #ad42c4, #9c27b0)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(156, 39, 176, 0.4)'
                                  }
                                }}
                              >
                                Crear Apartado
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                size="large"
                                sx={{
                                  background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  px: 4,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #ad42c4, #9c27b0)',
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

              {/* Panel derecho - Resumen del Apartado */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
                  border: '2px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: 4,
                  position: 'sticky',
                  top: 20,
                  color: '#FFFFFF'
                }}>
                  <Typography variant="h5" sx={{ 
                    color: '#9c27b0', 
                    mb: 4, 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <BookmarkIcon />
                    Ticket Apartado
                  </Typography>

                  {/* Cliente */}
                  {customer && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{
                        background: 'rgba(156, 39, 176, 0.1)',
                        border: '1px solid rgba(156, 39, 176, 0.3)',
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
                          <Box sx={{ mt: 2 }}>
                            <Chip 
                              label={customer.membership_type}
                              size="small"
                              sx={{
                                backgroundColor: '#9c27b0',
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
                      Productos a Apartar ({cart.length}):
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
                            color: '#9c27b0',
                            fontWeight: 700
                          }}>
                            {formatPrice(item.total_price)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(156, 39, 176, 0.3)', my: 3 }} />

                  {/* Configuración del Apartado */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#CCCCCC',
                      mb: 2
                    }}>
                      Configuración:
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#CCCCCC' }}>Anticipo:</Typography>
                        <Typography sx={{ color: '#9c27b0', fontWeight: 600 }}>
                          {formData.customDeposit ? 'Personalizado' : `${formData.depositPercentage}%`}
                        </Typography>
                      </Box>

                      {formData.expirationDate && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ color: '#CCCCCC' }}>Vence el:</Typography>
                          <Typography sx={{ color: '#2196f3', fontWeight: 600 }}>
                            {formatDate(formData.expirationDate)}
                          </Typography>
                        </Box>
                      )}

                      {customCommissionRate !== null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ color: '#CCCCCC' }}>Comisión Global:</Typography>
                          <Typography sx={{ color: '#ff9800', fontWeight: 600 }}>
                            {customCommissionRate}%
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(156, 39, 176, 0.3)', my: 3 }} />

                  {/* Totales */}
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#CCCCCC' }}>Total Apartado:</Typography>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatPrice(totals.total)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#CCCCCC' }}>Anticipo Base:</Typography>
                      <Typography sx={{ color: '#9c27b0', fontWeight: 600 }}>
                        {formatPrice(calculatedDepositAmount)}
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

                    <Divider sx={{ borderColor: 'rgba(156, 39, 176, 0.5)' }} />

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(156, 39, 176, 0.1)',
                      border: '1px solid rgba(156, 39, 176, 0.3)',
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: '#FFFFFF', 
                        fontWeight: 800
                      }}>
                        TOTAL HOY:
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#9c27b0', 
                        fontWeight: 900
                      }}>
                        {formatPrice(finalDepositAmount)}
                      </Typography>
                    </Box>

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
                        PENDIENTE:
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#4caf50', 
                        fontWeight: 900
                      }}>
                        {formatPrice(totals.total - finalDepositAmount)}
                      </Typography>
                    </Box>

                    {/* Información del método de pago */}
                    {(formData.paymentMethod || isMixedPayment) && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#CCCCCC',
                          mb: 2
                        }}>
                          Pago del Anticipo:
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
                              {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
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
          // ✅ CONFIRMACIÓN DE APARTADO COMPLETADO
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckIcon sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
              <Typography variant="h3" fontWeight="bold" color="#4caf50" gutterBottom>
                ¡Apartado Creado Exitosamente!
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ color: '#9c27b0', fontWeight: 700 }}>
                #{layawayNumber}
              </Typography>
              <Typography variant="h6" color="#CCCCCC" sx={{ mb: 4 }}>
                Apartado creado el {formatDate(new Date().toISOString())}
              </Typography>

              <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
                <Grid size={2.4}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(156, 39, 176, 0.1)',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#9c27b0">
                      {formatPrice(totals.total)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Total Apartado
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={2.4}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#4caf50">
                      {formatPrice(calculatedDepositAmount)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Anticipo Base
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
                    </Paper>
                  </Grid>
                )}

                <Grid size={2.4}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(255, 204, 0, 0.1)',
                    border: '1px solid rgba(255, 204, 0, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#FFCC00">
                      {formatPrice(finalDepositAmount)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Pagado Hoy
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={commissionAmount > 0 ? 2.4 : 4.8}>
                  <Paper sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color="#ffc107">
                      {formatPrice(totals.total - finalDepositAmount)}
                    </Typography>
                    <Typography variant="body1" color="#CCCCCC">
                      Pendiente
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {customer && (
                <Typography variant="body1" color="#CCCCCC" sx={{ mb: 2 }}>
                  👤 Cliente: {customer.name}
                </Typography>
              )}

              <Typography variant="body2" color="#808080" sx={{ mb: 2 }}>
                💳 Método: {isMixedPayment ? 'Pago Mixto' : paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
              </Typography>

              <Typography variant="body2" color="#808080">
                📅 Vence el: {formatDate(formData.expirationDate)}
              </Typography>
            </motion.div>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {!layawayCompleted ? (
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
            border: '2px solid rgba(156, 39, 176, 0.5)',
            borderRadius: 4,
            color: '#FFFFFF'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#9c27b0', 
          fontWeight: 800,
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          📦 Confirmación Final de Apartado
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ 
            mb: 3,
            textAlign: 'center',
            color: '#CCCCCC'
          }}>
            ¿Está seguro de crear este apartado? Esta acción reservará los productos hasta la fecha de vencimiento.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{
                background: 'rgba(156, 39, 176, 0.1)',
                border: '1px solid rgba(156, 39, 176, 0.3)',
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#9c27b0',
                  fontWeight: 800,
                  mb: 1
                }}>
                  {formatPrice(finalDepositAmount)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#CCCCCC'
                }}>
                  A cobrar hoy
                  {commissionAmount > 0 && (
                    <Typography variant="caption" sx={{ 
                      color: '#ff9800',
                      display: 'block'
                    }}>
                      (Incluye {formatPrice(commissionAmount)} comisiones)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid size={6}>
              <Box sx={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#ffc107',
                  fontWeight: 800,
                  mb: 1
                }}>
                  {formatPrice(totals.total - finalDepositAmount)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#CCCCCC'
                }}>
                  Pendiente por pagar
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              📅 Vence el: <strong>{formatDate(formData.expirationDate)}</strong>
            </Typography>
          </Box>

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
            onClick={processLayaway}
            disabled={processing}
            variant="contained"
            size="large"
            startIcon={processing ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : <BookmarkIcon />}
            sx={{
              background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
              color: '#FFFFFF',
              fontWeight: 800,
              px: 6,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #ad42c4, #9c27b0)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(156, 39, 176, 0.4)'
              }
            }}
          >
            {processing ? 'Creando Apartado...' : '✅ Confirmar y Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}