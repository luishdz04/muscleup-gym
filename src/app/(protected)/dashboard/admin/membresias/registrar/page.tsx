'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Badge,
  Skeleton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { SelectChangeEvent } from '@mui/material/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ✅ PALETA DE COLORES CORREGIDA - Importada del PDF
const colorTokens = {
  // Colores base
  brand: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',
  
  // Escala neutra (Dark Theme)
  neutral0: '#0A0A0B',
  neutral50: '#0F1012',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral400: '#2C313B',
  neutral500: '#363C48',
  neutral600: '#424959',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1100: '#E8ECF5',
  neutral1200: '#FFFFFF',
  
  // Semánticos
  success: '#22C55E',
  danger: '#EF4444',
  info: '#38BDF8',
  warning: '#FFCC00', // Mismo que brand
  
  // Escala de marca
  brand50: '#FFF4CC',
  brand100: '#FFE999',
  brand200: '#FFDD66',
  brand300: '#FFD333',
  brand400: '#FFCC00',
  brand500: '#E6B800',
  brand600: '#CCA300',
  brand700: '#A67F00',
  brand800: '#806300',
  brand900: '#594400'
};

// Importar hook personalizado CORREGIDO
import { useRegistrarMembresia } from '@/hooks/useRegistrarMembresia';

// Importar sistema de notificaciones
import toast from 'react-hot-toast';

// Importar componentes de fecha seguros
import { SafeDate, SafeDateLong } from '@/components/SafeDate';

// Iconos
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Tipos para métodos de pago
interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasCommission: boolean;
}

// Tipos de usuario mejorados
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  [key: string]: any;
}

// ✅ MÉTODOS DE PAGO CON PALETA CORREGIDA
const PAYMENT_METHODS: PaymentMethod[] = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: colorTokens.brand,
    description: '',
    hasCommission: false
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: colorTokens.neutral600,
    description: '',
    hasCommission: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: colorTokens.neutral700,
    description: '',
    hasCommission: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: colorTokens.info,
    description: '',
    hasCommission: false
  },
  { 
    value: 'mixto', 
    label: 'Pago Mixto', 
    icon: '🔄',
    color: colorTokens.warning,
    description: 'Combinar múltiples métodos de pago',
    hasCommission: true
  }
];

// Funciones helper para usuarios
const getUserInitials = (user: any): string => {
  if (!user?.firstName || !user?.lastName) {
    return '??';
  }
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
};

const getUserFullName = (user: any): string => {
  if (!user) return 'Usuario no seleccionado';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  return `${firstName} ${lastName}`.trim() || user.email || 'Sin nombre';
};

const getUserDisplayName = (user: any): string => {
  if (!user) return '';
  const fullName = getUserFullName(user);
  return fullName !== user.email ? `${fullName} - ${user.email}` : user.email;
};

// Componente de skeleton para carga
const LoadingSkeleton = memo(() => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Stack spacing={2}>
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />
    </Stack>
  </Box>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Componentes reutilizables memoizados
const ProgressIndicator = memo(({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep, totalSteps]);
  const displayPercentage = useMemo(() => Math.round(progress), [progress]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={progress}
        size={60}
        thickness={4}
        sx={{ 
          color: colorTokens.brand,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Box sx={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography 
          variant="caption" 
          component="div" 
          sx={{
            color: colorTokens.brand,
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {displayPercentage}%
        </Typography>
      </Box>
    </Box>
  );
});

ProgressIndicator.displayName = 'ProgressIndicator';

const PriceLine = memo(({ 
  label, 
  value, 
  color = 'textPrimary', 
  variant = 'body1', 
  bold = false 
}: { 
  label: string; 
  value: number | string; 
  color?: string; 
  variant?: any; 
  bold?: boolean;
}) => {
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formattedValue = useMemo(() => {
    return typeof value === 'number' ? formatPrice(value) : value;
  }, [value, formatPrice]);

  const labelColor = useMemo(() => {
    switch (color) {
      case 'success': return colorTokens.success;
      case 'warning': return colorTokens.warning;
      case 'error': return colorTokens.danger;
      default: return colorTokens.neutral800;
    }
  }, [color]);

  const valueColor = useMemo(() => {
    switch (color) {
      case 'success': return colorTokens.success;
      case 'warning': return colorTokens.warning;
      case 'error': return colorTokens.danger;
      default: return colorTokens.neutral1200;
    }
  }, [color]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography variant={variant} sx={{ 
        color: labelColor,
        fontWeight: bold ? 700 : 500
      }}>
        {label}
      </Typography>
      <Typography variant={variant} sx={{ 
        color: valueColor,
        fontWeight: bold ? 700 : 600
      }}>
        {formattedValue}
      </Typography>
    </Box>
  );
});

PriceLine.displayName = 'PriceLine';

const PaymentMethodCard = memo(({ 
  method, 
  selected, 
  onSelect,
  disabled = false
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onSelect();
    }
  }, [disabled, onSelect]);

  const cardStyles = useMemo(() => ({
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: selected ? 
      `linear-gradient(135deg, ${method.color}20, ${method.color}10)` :
      `${colorTokens.neutral200}05`,
    border: selected ? 
      `3px solid ${method.color}` : 
      `1px solid ${colorTokens.neutral400}`,
    borderRadius: 3,
    transition: 'all 0.3s ease',
    minHeight: '140px',
    opacity: disabled ? 0.5 : 1,
    '&:hover': !disabled ? {
      borderColor: method.color,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 20px ${method.color}30`
    } : {},
    '&:focus': {
      outline: `2px solid ${method.color}`,
      outlineOffset: '2px'
    }
  }), [disabled, selected, method.color]);

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <Card 
        onClick={handleClick} 
        sx={cardStyles}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        aria-label={`Método de pago: ${method.label}`}
        aria-pressed={selected}
        aria-disabled={disabled}
      >
        <CardContent sx={{ 
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          p: 3
        }}>
          <Typography variant="h3" sx={{ mb: 1 }} aria-hidden="true">
            {method.icon}
          </Typography>
          <Typography variant="h6" sx={{ 
            color: disabled ? colorTokens.neutral600 : colorTokens.neutral1200,
            fontWeight: 600,
            fontSize: '0.9rem',
            mb: 1
          }}>
            {method.label}
          </Typography>
          {method.description && (
            <Typography variant="caption" sx={{ 
              color: disabled ? colorTokens.neutral600 : colorTokens.neutral800,
              fontSize: '0.75rem',
              lineHeight: 1.3
            }}>
              {disabled && method.value === 'mixto' ? 
                'Use el toggle de arriba para activar' : 
                method.description
              }
            </Typography>
          )}
          {selected && !disabled && (
            <CheckCircleIcon sx={{ 
              color: method.color,
              position: 'absolute',
              top: 8,
              right: 8
            }} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

PaymentMethodCard.displayName = 'PaymentMethodCard';

// Componente de error boundary - CORREGIDO
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutlineIcon sx={{ fontSize: 60, color: colorTokens.danger, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.danger, mb: 2 }}>
            Algo salió mal
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ backgroundColor: colorTokens.brand }}
          >
            Recargar página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Componente principal optimizado
function RegistrarMembresiaPage() {
  const router = useRouter();
  
  // Ref para SweetAlert dinámico
  const MySwalRef = useRef<any>(null);
  
  // Hook personalizado para toda la lógica
  const {
    // Estados principales
    formData,
    dispatch,
    activeStep,
    setActiveStep,
    
    // Datos
    users,
    plans,
    userHistory,
    selectedUser,
    setSelectedUser,
    selectedPlan,
    setSelectedPlan,
    appliedCoupon,
    setAppliedCoupon,
    
    // Estados UI
    loading,
    loadingUsers,
    loadingPlans,
    confirmDialogOpen,
    setConfirmDialogOpen,
    
    // Cálculos
    subtotal,
    inscriptionAmount,
    discountAmount,
    commissionAmount,
    totalAmount,
    finalAmount,
    
    // Funciones
    formatPrice,
    debouncedLoadUsers,
    loadUserHistory,
    validateCoupon,
    addMixedPaymentDetail,
    removeMixedPaymentDetail,
    updateMixedPaymentDetail,
    calculateEndDate,
    handleSubmit,
    canProceedToNextStep,
    
    // Constantes
    paymentTypes
  } = useRegistrarMembresia();

  // Inicializar SweetAlert dinámicamente
  useEffect(() => {
    const loadSweetAlert = async () => {
      if (typeof window !== 'undefined' && !MySwalRef.current) {
        try {
          const MySwal = await import('@/lib/notifications/MySwal').then(mod => mod.default);
          MySwalRef.current = MySwal;
        } catch (error) {
          console.error('Error loading SweetAlert:', error);
        }
      }
    };
    loadSweetAlert();
  }, []);

  // Steps configuration (memoizado)
  const steps = useMemo(() => [
    { label: 'Cliente', description: 'Seleccionar cliente', icon: <PersonAddAltIcon /> },
    { label: 'Plan', description: 'Elegir membresía', icon: <FitnessCenterIcon /> },
    { label: 'Descuentos', description: 'Aplicar cupones', icon: <LocalOfferIcon /> },
    { label: 'Pago', description: 'Método de pago', icon: <PaymentIcon /> }
  ], []);

  // Validación de datos del usuario
  const validateUser = useCallback((user: any): boolean => {
    if (!user) return false;
    if (!user.email) {
      toast.error('El usuario no tiene email');
      return false;
    }
    return true;
  }, []);

  // Handlers optimizados
  const handleBack = useCallback(() => {
    toast.loading('Regresando al dashboard...', { id: 'back-navigation' });
    router.push('/dashboard/admin/membresias');
  }, [router]);

  const handleUserSelect = useCallback((event: React.SyntheticEvent, newValue: any) => {
    if (!newValue) {
      setSelectedUser(null);
      dispatch({ type: 'SET_USER', payload: { id: '' } });
      return;
    }

    if (!validateUser(newValue)) {
      return;
    }

    // Normalizar datos del usuario
    const normalizedUser = {
      ...newValue,
      firstName: newValue.firstName || 'Sin',
      lastName: newValue.lastName || 'Nombre'
    };

    setSelectedUser(normalizedUser);
    dispatch({
      type: 'SET_USER',
      payload: normalizedUser
    });

    if (normalizedUser.id) {
      loadUserHistory(normalizedUser.id);
    }
  }, [dispatch, loadUserHistory, setSelectedUser, validateUser]);

  const handlePlanSelect = useCallback((plan: any) => {
    if (!plan || !plan.id) {
      toast.error('Plan inválido');
      return;
    }
    setSelectedPlan(plan);
    dispatch({
      type: 'SET_PLAN',
      payload: plan.id
    });
  }, [dispatch, setSelectedPlan]);

  // ✅ CORREGIDO: Usar SET_PAYMENT_METHOD
  const handlePaymentMethodSelect = useCallback((method: string) => {
    dispatch({
      type: 'SET_PAYMENT_METHOD',
      payload: method
    });
  }, [dispatch]);

  // Función optimizada para SweetAlert
  const showConfirmationDialog = useCallback(async () => {
    if (!MySwalRef.current) {
      setConfirmDialogOpen(true);
      return;
    }

    try {
      const result = await MySwalRef.current.fire({
        title: '🏆 Confirmar Venta de Membresía',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <h3 style="color: ${colorTokens.brand}; margin-bottom: 15px;">📋 Resumen de la Venta</h3>
            <p><strong>Cliente:</strong> ${getUserFullName(selectedUser)}</p>
            <p><strong>Plan:</strong> ${selectedPlan?.name || 'No seleccionado'}</p>
            <p><strong>Tipo:</strong> ${paymentTypes.find(pt => pt.value === formData.paymentType)?.label || 'No seleccionado'}</p>
            <p><strong>Total:</strong> ${formatPrice(finalAmount)}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: colorTokens.brand,
        cancelButtonColor: colorTokens.neutral600,
        confirmButtonText: '✅ Confirmar Venta',
        cancelButtonText: '❌ Cancelar',
        background: colorTokens.neutral300,
        color: colorTokens.neutral1200,
        customClass: {
          confirmButton: 'swal-confirm-button'
        }
      });

      if (result.isConfirmed) {
        handleProcessSale();
      }
    } catch (error) {
      console.error('Error en confirmación:', error);
      setConfirmDialogOpen(true);
    }
  }, [selectedUser, selectedPlan, formData.paymentType, finalAmount, formatPrice, paymentTypes, setConfirmDialogOpen]);

  const handleProcessSale = useCallback(async () => {
    const toastId = toast.loading('Procesando venta...', { id: 'process-sale' });
    
    try {
      const success = await handleSubmit();
      if (success) {
        toast.success('¡Venta procesada exitosamente!', { id: toastId });
        
        setTimeout(() => {
          router.push('/dashboard/admin/membresias');
        }, 2000);
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al procesar la venta', { id: toastId });
    }
  }, [handleSubmit, router]);

  // ✅ VALIDACIÓN FINAL CON DEBUG DETALLADO
  const isFormValid = useCallback(() => {
    // Debug DETALLADO para ver exactamente qué está pasando
    console.log('🔍 VALIDACIÓN FINAL DETALLADA:', {
      hasUser: !!selectedUser,
      hasPlan: !!selectedPlan,
      hasPaymentType: !!formData.paymentType,
      isMixedPayment: formData.isMixedPayment,
      paymentMethod: formData.paymentMethod,
      paymentDetailsCount: formData.paymentDetails.length,
      // ✅ AGREGAR DEBUG DE LOS DETALLES ESPECÍFICOS
      paymentDetailsDebug: formData.paymentDetails.map((detail, idx) => ({
        index: idx,
        method: detail.method,
        amount: detail.amount,
        isMethodValid: detail.method && detail.method !== '',
        isAmountValid: detail.amount > 0
      })),
      formDataComplete: formData
    });

    if (!selectedUser) {
      console.log('❌ Error: No hay usuario seleccionado');
      toast.error('Seleccione un cliente válido');
      return false;
    }
    if (!selectedPlan) {
      console.log('❌ Error: No hay plan seleccionado');
      toast.error('Seleccione un plan');
      return false;
    }
    if (!formData.paymentType) {
      console.log('❌ Error: No hay tipo de pago seleccionado');
      toast.error('Seleccione el tipo de duración');
      return false;
    }
    
    // LÓGICA DE PAGO CON DEBUG ESPECÍFICO
    if (formData.isMixedPayment) {
      console.log('🔍 Validando modo MIXTO...');
      
      if (formData.paymentDetails.length === 0) {
        console.log('❌ Error: No hay detalles de pago mixto');
        toast.error('Agregue al menos un método de pago para pago mixto');
        return false;
      }
      
      // Verificar cada detalle individualmente
      for (let i = 0; i < formData.paymentDetails.length; i++) {
        const detail = formData.paymentDetails[i];
        console.log(`🔍 Validando detalle ${i}:`, {
          method: detail.method,
          amount: detail.amount,
          hasMethod: !!detail.method && detail.method !== '',
          hasAmount: detail.amount > 0
        });
        
        if (!detail.method || detail.method === '') {
          console.log(`❌ Error: Detalle ${i} no tiene método`);
          toast.error(`Método de pago #${i+1} no está seleccionado`);
          return false;
        }
        if (detail.amount <= 0) {
          console.log(`❌ Error: Detalle ${i} no tiene monto válido`);
          toast.error(`Método de pago #${i+1} debe tener un monto mayor a cero`);
          return false;
        }
      }
      
      console.log('✅ Modo mixto válido');
    } else {
      console.log('🔍 Validando modo SIMPLE...');
      
      if (!formData.paymentMethod || formData.paymentMethod === '') {
        console.log('❌ Error: No hay método de pago simple');
        toast.error('Seleccione un método de pago');
        return false;
      }
      
      console.log('✅ Modo simple válido');
    }
    
    console.log('✅ VALIDACIÓN COMPLETA EXITOSA');
    return true;
  }, [selectedUser, selectedPlan, formData]);

  // Navegación con teclado optimizada
  useEffect(() => {
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (confirmDialogOpen) return;

      if (e.key === 'ArrowRight' && canProceedToNextStep() && activeStep < steps.length - 1) {
        e.preventDefault();
        setActiveStep(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && activeStep > 0) {
        e.preventDefault();
        setActiveStep(prev => prev - 1);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [canProceedToNextStep, activeStep, steps.length, setActiveStep, confirmDialogOpen, handleBack]);

  // Validación de cupón mejorada
  const handleCouponValidation = useCallback(async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    
    if (trimmedCode !== formData.couponCode) {
      await validateCoupon(trimmedCode);
    }
  }, [formData.couponCode, validateCoupon]);

  // Cálculo de fecha de vigencia memoizado
  const endDate = useMemo(() => {
    try {
      const date = calculateEndDate();
      return date ? date.toISOString().split('T')[0] : '';
    } catch (error) {
      console.error('Error calculando fecha de vigencia:', error);
      return '';
    }
  }, [calculateEndDate]);

  // Debug temporal
  useEffect(() => {
    console.log('🔍 Payment Debug:', {
      paymentMethod: formData.paymentMethod,
      isMixedPayment: formData.isMixedPayment,
      step: activeStep,
      canProceed: canProceedToNextStep()
    });
  }, [formData.paymentMethod, formData.isMixedPayment, activeStep, canProceedToNextStep]);

  // Render principal con ErrorBoundary
  return (
    <ErrorBoundary>
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        minHeight: '100vh',
        color: colorTokens.neutral1200
      }}>
        {/* Header profesional */}
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: 3,
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography variant="h4" sx={{ 
                color: colorTokens.brand, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                textShadow: `0 0 20px ${colorTokens.brand}40`,
                fontSize: { xs: '1.5rem', sm: '2.125rem' }
              }}>
                <PersonAddAltIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: colorTokens.brand }} />
                Nueva Venta de Membresía
              </Typography>
              <Typography variant="body1" sx={{ color: colorTokens.neutral900, mt: 1 }}>
                Sistema de punto de venta para membresías del gimnasio
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <ProgressIndicator currentStep={activeStep + 1} totalSteps={steps.length} />
              </Box>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                variant="outlined"
                sx={{ 
                  color: colorTokens.brand,
                  borderColor: `${colorTokens.brand}60`,
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    bgcolor: `${colorTokens.brand}10`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 15px ${colorTokens.brand}30`
                  },
                  borderWidth: '2px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="hidden sm:inline">Dashboard</span>
                <span className="inline sm:hidden">Volver</span>
              </Button>
            </Box>
          </Box>

          {/* Barra de progreso */}
          <Box>
            <LinearProgress 
              variant="determinate" 
              value={(activeStep + 1) / steps.length * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${colorTokens.brand}20`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`
                }
              }}
              aria-label="Progreso del formulario"
            />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 2,
              mt: 2,
              p: 2,
              bgcolor: `${colorTokens.brand}10`,
              borderRadius: 2,
              border: `1px solid ${colorTokens.brand}30`
            }}>
              {steps[activeStep]?.icon}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                  Paso {activeStep + 1} de {steps.length}: {steps[activeStep]?.label}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                  {steps[activeStep]?.description}
                </Typography>
              </Box>
              <Chip 
                label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
                sx={{ 
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.neutral0,
                  fontWeight: 700
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Contenido principal */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{
              p: { xs: 2, sm: 4 },
              background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}>
              <Stepper 
                activeStep={activeStep} 
                orientation="vertical"
                aria-label="Proceso de registro de membresía"
              >
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: colorTokens.neutral1200,
                          fontWeight: activeStep === index ? 700 : 500,
                          fontSize: activeStep === index ? '1.1rem' : '1rem'
                        },
                        '& .MuiStepIcon-root': {
                          color: activeStep === index ? colorTokens.brand : colorTokens.neutral600,
                          fontSize: '2rem',
                          '&.Mui-completed': {
                            color: colorTokens.brand
                          }
                        }
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography sx={{ 
                        color: colorTokens.neutral800, 
                        mb: 3,
                        fontSize: '1rem',
                        fontWeight: 300
                      }}>
                        {step.description}
                      </Typography>

                      {/* PASO 1: Seleccionar Usuario */}
                      {index === 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Card sx={{
                            background: `${colorTokens.brand}10`,
                            border: `1px solid ${colorTokens.brand}30`,
                            borderRadius: 3,
                            mb: 3
                          }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ 
                                color: colorTokens.brand, 
                                mb: 3,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <SearchIcon />
                                Búsqueda de Cliente
                              </Typography>
                              <Autocomplete
                                options={users}
                                getOptionLabel={(user) => getUserDisplayName(user)}
                                loading={loadingUsers}
                                onInputChange={(event, newInputValue) => {
                                  debouncedLoadUsers(newInputValue);
                                }}
                                onChange={handleUserSelect}
                                value={selectedUser}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Buscar Cliente"
                                    placeholder="Nombre, apellido o email..."
                                    fullWidth
                                    error={!!formData.userId && !selectedUser}
                                    helperText={formData.userId && !selectedUser ? "Cliente requerido" : ""}
                                    InputProps={{
                                      ...params.InputProps,
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <SearchIcon sx={{ color: colorTokens.brand }} />
                                        </InputAdornment>
                                      ),
                                      endAdornment: (
                                        <>
                                          {loadingUsers ? (
                                            <CircularProgress 
                                              color="inherit" 
                                              size={24} 
                                              sx={{ color: colorTokens.brand }} 
                                            />
                                          ) : null}
                                          {params.InputProps.endAdornment}
                                        </>
                                      ),
                                      sx: {
                                        color: colorTokens.neutral1200,
                                        fontSize: '1.1rem',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: `${colorTokens.brand}40`,
                                          borderWidth: 2
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                          borderColor: colorTokens.brand
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                          borderColor: colorTokens.brand
                                        }
                                      }
                                    }}
                                    InputLabelProps={{
                                      sx: { 
                                        color: colorTokens.neutral800,
                                        fontSize: '1.1rem',
                                        '&.Mui-focused': { color: colorTokens.brand }
                                      }
                                    }}
                                  />
                                )}
                                renderOption={(props, user) => {
                                  const { key, ...otherProps } = props;
                                  return (
                                    <li key={key} {...otherProps} style={{ 
                                      color: colorTokens.neutral0,
                                      backgroundColor: colorTokens.neutral1200,
                                      padding: '12px 16px',
                                      borderBottom: `1px solid ${colorTokens.neutral400}`,
                                      cursor: 'pointer'
                                    }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ 
                                          width: 40, 
                                          height: 40, 
                                          borderRadius: '50%', 
                                          background: colorTokens.brand,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: colorTokens.neutral0,
                                          fontWeight: 700,
                                          fontSize: '1rem'
                                        }}>
                                          {getUserInitials(user)}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="body1" sx={{ fontWeight: 600, color: colorTokens.neutral0 }}>
                                            {getUserFullName(user)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: colorTokens.neutral600 }}>
                                            {user.email}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </li>
                                  );
                                }}
                                sx={{ mb: 3 }}
                                noOptionsText={
                                  loadingUsers ? "Buscando..." : 
                                  users.length === 0 ? "Escriba al menos 2 caracteres" : 
                                  "No se encontraron clientes"
                                }
                              />
                            </CardContent>
                          </Card>

                          {selectedUser && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                                  border: `2px solid ${colorTokens.brand}50`,
                                  borderRadius: 3,
                                  boxShadow: `0 4px 20px ${colorTokens.brand}20`
                                }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                      <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%', 
                                        background: colorTokens.brand,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colorTokens.neutral0,
                                        fontWeight: 800,
                                        fontSize: '1.5rem'
                                      }}>
                                        {getUserInitials(selectedUser)}
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ 
                                          color: colorTokens.brand, 
                                          fontWeight: 700,
                                          mb: 0.5
                                        }}>
                                          Cliente Seleccionado
                                        </Typography>
                                        <Typography variant="h5" sx={{ 
                                          color: colorTokens.neutral1200, 
                                          fontWeight: 600,
                                          mb: 0.5
                                        }}>
                                          {getUserFullName(selectedUser)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ 
                                          color: colorTokens.neutral800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1
                                        }}>
                                          {selectedUser.email}
                                        </Typography>
                                      </Box>
                                      <CheckCircleIcon sx={{ 
                                        color: colorTokens.brand, 
                                        fontSize: 40
                                      }} />
                                    </Box>

                                    {/* Historial y renovación */}
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      transition={{ duration: 0.4 }}
                                    >
                                      <Divider sx={{ borderColor: `${colorTokens.brand}30`, my: 3 }} />
                                      
                                      <Box sx={{
                                        background: userHistory.length > 0 ? 
                                          `${colorTokens.warning}10` : 
                                          `${colorTokens.success}10`,
                                        border: userHistory.length > 0 ? 
                                          `1px solid ${colorTokens.warning}30` : 
                                          `1px solid ${colorTokens.success}30`,
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        {userHistory.length > 0 ? (
                                          <>
                                            <Typography variant="h6" sx={{ 
                                              color: colorTokens.warning,
                                              fontWeight: 700,
                                              mb: 2,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 2
                                            }}>
                                              <HistoryIcon />
                                              Historial de Membresías
                                              <Badge badgeContent={userHistory.length} color="primary">
                                                <span />
                                              </Badge>
                                            </Typography>

                                            <Box sx={{ mb: 3 }}>
                                              {userHistory.slice(0, 3).map((membership, idx) => (
                                                <Box key={membership.id} sx={{ 
                                                  display: 'flex', 
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  py: 1.5,
                                                  px: 2,
                                                  borderBottom: idx < Math.min(2, userHistory.length - 1) ? `1px solid ${colorTokens.neutral400}` : 'none',
                                                  background: idx === 0 && membership.status === 'active' ? `${colorTokens.brand}05` : 'transparent',
                                                  borderRadius: idx === 0 && membership.status === 'active' ? 2 : 0
                                                }}>
                                                  <Box>
                                                    <Typography variant="body1" sx={{ 
                                                      color: colorTokens.neutral1200,
                                                      fontWeight: idx === 0 && membership.status === 'active' ? 600 : 400
                                                    }}>
                                                      {membership.plan_name || 'Plan desconocido'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: colorTokens.neutral800 }}>
                                                      <SafeDate dateString={membership.start_date} /> → {' '}
                                                      {membership.end_date ? <SafeDate dateString={membership.end_date} /> : 'Sin fecha'}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {idx === 0 && membership.status === 'active' && (
                                                      <Typography variant="caption" sx={{ 
                                                        color: colorTokens.brand,
                                                        fontWeight: 600,
                                                        mr: 1
                                                      }}>
                                                        ACTUAL
                                                      </Typography>
                                                    )}
                                                    <Chip 
                                                      label={membership.status.toUpperCase()}
                                                      size="small"
                                                      sx={{
                                                        backgroundColor: 
                                                          membership.status === 'active' ? colorTokens.success : 
                                                          membership.status === 'expired' ? colorTokens.neutral600 : 
                                                          membership.status === 'frozen' ? colorTokens.info : colorTokens.neutral500,
                                                        color: colorTokens.neutral0,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600
                                                      }}
                                                    />
                                                  </Box>
                                                </Box>
                                              ))}
                                            </Box>

                                            {userHistory.length > 3 && (
                                              <Typography variant="caption" sx={{ 
                                                color: colorTokens.neutral800,
                                                fontStyle: 'italic',
                                                textAlign: 'center',
                                                display: 'block'
                                              }}>
                                                ... y {userHistory.length - 3} membresías más
                                              </Typography>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <Typography variant="h6" sx={{ 
                                              color: colorTokens.success,
                                              fontWeight: 700,
                                              mb: 2,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 2
                                            }}>
                                              Cliente Nuevo
                                            </Typography>
                                            
                                            <Typography variant="body1" sx={{ 
                                              color: colorTokens.neutral1200,
                                              mb: 2,
                                              fontWeight: 500
                                            }}>
                                              Este cliente no tiene historial de membresías previas.
                                            </Typography>
                                            
                                            <Alert 
                                              severity="info"
                                              sx={{
                                                backgroundColor: `${colorTokens.info}10`,
                                                color: colorTokens.neutral1200,
                                                border: `1px solid ${colorTokens.info}30`,
                                                '& .MuiAlert-icon': { color: colorTokens.info }
                                              }}
                                            >
                                              <strong>Primera Venta:</strong> Se incluirá automáticamente el costo de inscripción.
                                            </Alert>
                                          </>
                                        )}

                                        {/* Toggle de Renovación */}
                                        <Box sx={{
                                          background: `${colorTokens.brand}10`,
                                          border: `1px solid ${colorTokens.brand}30`,
                                          borderRadius: 3,
                                          p: 3,
                                          mt: 3
                                        }}>
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={formData.isRenewal}
                                                onChange={(event) => {
                                                  const isRenewal = event.target.checked;
                                                  dispatch({
                                                    type: 'SET_RENEWAL_DATA',
                                                    payload: {
                                                      isRenewal,
                                                      skipInscription: isRenewal,
                                                      latestEndDate: formData.latestEndDate
                                                    }
                                                  });
                                                }}
                                                sx={{
                                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: colorTokens.brand,
                                                  },
                                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: colorTokens.brand,
                                                  },
                                                }}
                                              />
                                            }
                                            label={
                                              <Box>
                                                <Typography variant="body1" sx={{ 
                                                  color: colorTokens.neutral1200, 
                                                  fontWeight: 600 
                                                }}>
                                                  Marcar como Renovación
                                                </Typography>
                                                <Typography variant="caption" sx={{ 
                                                  color: colorTokens.neutral800,
                                                  display: 'block',
                                                  mt: 0.5
                                                }}>
                                                  {formData.isRenewal ? (
                                                    <span style={{ color: colorTokens.success }}>
                                                      <strong>Renovación:</strong> Sin costo de inscripción
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: colorTokens.warning }}>
                                                      <strong>Primera venta:</strong> Con costo de inscripción
                                                    </span>
                                                  )}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </Box>
                                      </Box>
                                    </motion.div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </Box>
                      )}

                      {/* PASO 2: Seleccionar Plan */}
                      {index === 1 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ 
                            color: colorTokens.brand, 
                            mb: 3,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <FitnessCenterIcon />
                            Catálogo de Membresías
                          </Typography>
                          
                          {loadingPlans ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                              <CircularProgress sx={{ color: colorTokens.brand }} size={50} />
                            </Box>
                          ) : plans.length === 0 ? (
                            <Alert severity="warning" sx={{
                              backgroundColor: `${colorTokens.warning}10`,
                              color: colorTokens.neutral1200,
                              border: `1px solid ${colorTokens.warning}30`,
                              '& .MuiAlert-icon': { color: colorTokens.warning }
                            }}>
                              No hay planes de membresía activos disponibles.
                            </Alert>
                          ) : (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              {plans.map((plan) => (
                                <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                                  <motion.div
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Card
                                      sx={{
                                        cursor: 'pointer',
                                        background: selectedPlan?.id === plan.id 
                                          ? `linear-gradient(135deg, ${colorTokens.brand}25, ${colorTokens.brand}10)`
                                          : `linear-gradient(135deg, ${colorTokens.neutral300}, ${colorTokens.neutral200})`,
                                        border: selectedPlan?.id === plan.id 
                                          ? `3px solid ${colorTokens.brand}` 
                                          : `1px solid ${colorTokens.neutral400}`,
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        height: '100%',
                                        boxShadow: selectedPlan?.id === plan.id 
                                          ? `0 8px 30px ${colorTokens.brand}30`
                                          : `0 4px 15px rgba(0, 0, 0, 0.2)`,
                                        '&:hover': {
                                          borderColor: colorTokens.brand,
                                          boxShadow: `0 6px 25px ${colorTokens.brand}20`
                                        }
                                      }}
                                      onClick={() => handlePlanSelect(plan)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          handlePlanSelect(plan);
                                        }
                                      }}
                                      aria-label={`Plan ${plan.name}`}
                                      aria-pressed={selectedPlan?.id === plan.id}
                                    >
                                      <CardContent sx={{ p: 3, height: '100%' }}>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          mb: 2
                                        }}>
                                          <Typography variant="h6" sx={{ 
                                            color: colorTokens.brand, 
                                            fontWeight: 700
                                          }}>
                                            {plan.name}
                                          </Typography>
                                          {selectedPlan?.id === plan.id && (
                                            <CheckCircleIcon sx={{ color: colorTokens.brand }} />
                                          )}
                                        </Box>
                                        
                                        <Typography variant="body1" sx={{ 
                                          color: colorTokens.neutral800, 
                                          mb: 3,
                                          lineHeight: 1.6,
                                          minHeight: '3em'
                                        }}>
                                          {plan.description || 'Sin descripción'}
                                        </Typography>
                                        
                                        <Box sx={{ 
                                          background: `${colorTokens.brand}10`,
                                          borderRadius: 2,
                                          p: 2,
                                          border: `1px solid ${colorTokens.brand}30`
                                        }}>
                                          <Typography variant="h6" sx={{ 
                                            color: colorTokens.neutral1200, 
                                            fontWeight: 700,
                                            textAlign: 'center'
                                          }}>
                                            Desde {formatPrice(plan.weekly_price || 0)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ 
                                            color: colorTokens.neutral800,
                                            textAlign: 'center'
                                          }}>
                                            por semana
                                          </Typography>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                </Grid>
                              ))}
                            </Grid>
                          )}

                          {selectedPlan && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                                  border: `2px solid ${colorTokens.brand}50`,
                                  borderRadius: 3
                                }}>
                                  <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ 
                                      color: colorTokens.brand, 
                                      mb: 3,
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2
                                    }}>
                                      Configuración del Plan
                                    </Typography>

                                    {/* Control de Inscripción */}
                                    <Box sx={{
                                      background: `${colorTokens.warning}10`,
                                      border: `1px solid ${colorTokens.warning}30`,
                                      borderRadius: 3,
                                      p: 3,
                                      mb: 3
                                    }}>
                                      <Typography variant="h6" sx={{ 
                                        color: colorTokens.warning,
                                        fontWeight: 700,
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                      }}>
                                        Configuración de Inscripción
                                      </Typography>

                                      <Grid container spacing={3}>
                                        <Grid size={8}>
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={formData.skipInscription}
                                                onChange={(event) => {
                                                  dispatch({
                                                    type: 'UPDATE_PAYMENT',
                                                    payload: {
                                                      skipInscription: event.target.checked
                                                    }
                                                  });
                                                }}
                                                sx={{
                                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: colorTokens.warning,
                                                  },
                                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: colorTokens.warning,
                                                  },
                                                }}
                                              />
                                            }
                                            label={
                                              <Box>
                                                <Typography variant="body1" sx={{ 
                                                  color: colorTokens.neutral1200, 
                                                  fontWeight: 600 
                                                }}>
                                                  Exentar Inscripción
                                                </Typography>
                                                <Typography variant="caption" sx={{ 
                                                  color: colorTokens.neutral800
                                                }}>
                                                  {formData.skipInscription ? 
                                                    'Sin costo de inscripción' : 
                                                    `Inscripción: ${formatPrice(selectedPlan.inscription_price || 0)}`
                                                  }
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </Grid>
                                        <Grid size={4}>
                                          <Box sx={{
                                            background: formData.skipInscription ? 
                                              `${colorTokens.success}10` : 
                                              `${colorTokens.warning}10`,
                                            border: formData.skipInscription ? 
                                              `1px solid ${colorTokens.success}30` : 
                                              `1px solid ${colorTokens.warning}30`,
                                            borderRadius: 2,
                                            p: 2,
                                            textAlign: 'center'
                                          }}>
                                            <Typography variant="body2" sx={{ 
                                              color: colorTokens.neutral800,
                                              mb: 1
                                            }}>
                                              Inscripción
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: formData.skipInscription ? colorTokens.success : colorTokens.warning,
                                              fontWeight: 700
                                            }}>
                                              {formData.skipInscription ? 
                                                'EXENTA' : 
                                                formatPrice(selectedPlan.inscription_price || 0)
                                              }
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                    
                                    <FormControl fullWidth error={!formData.paymentType}>
                                      <InputLabel sx={{ 
                                        color: colorTokens.neutral800,
                                        fontSize: '1.1rem',
                                        '&.Mui-focused': { color: colorTokens.brand },
                                        '&.Mui-error': { color: colorTokens.danger }
                                      }}>
                                        Duración y precio
                                      </InputLabel>
                                      <Select
                                        value={formData.paymentType}
                                        onChange={(event: SelectChangeEvent<string>) => dispatch({
                                          type: 'SET_PAYMENT_TYPE',
                                          payload: event.target.value
                                        })}
                                        IconComponent={ExpandMoreIcon}
                                        sx={{
                                          color: colorTokens.neutral1200,
                                          fontSize: '1.1rem',
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: `${colorTokens.brand}40`,
                                            borderWidth: 2
                                          },
                                          '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colorTokens.brand
                                          },
                                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colorTokens.brand
                                          },
                                          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colorTokens.danger
                                          },
                                          '& .MuiSvgIcon-root': {
                                            color: colorTokens.brand
                                          }
                                        }}
                                      >
                                        {paymentTypes.map((type) => {
                                          const price = selectedPlan[type.key as keyof typeof selectedPlan] as number;
                                          if (price <= 0) return null;
                                          
                                          return (
                                            <MenuItem 
                                              key={type.value} 
                                              value={type.value}
                                              sx={{
                                                fontSize: '1rem',
                                                py: 1.5,
                                                '&:hover': {
                                                  backgroundColor: `${colorTokens.brand}10`
                                                },
                                                '&.Mui-selected': {
                                                  backgroundColor: `${colorTokens.brand}20`,
                                                  '&:hover': {
                                                    backgroundColor: `${colorTokens.brand}30`
                                                  }
                                                }
                                              }}
                                            >
                                              <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                alignItems: 'center'
                                              }}>
                                                <Box>
                                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                    {type.label}
                                                  </Typography>
                                                  {type.value !== 'visit' && endDate && (
                                                    <Typography variant="caption" sx={{ 
                                                      color: colorTokens.neutral800,
                                                      display: 'block'
                                                    }}>
                                                      Hasta: <SafeDate dateString={endDate} fallback="Calculando..." />
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography variant="h6" sx={{ 
                                                  color: colorTokens.brand, 
                                                  fontWeight: 700 
                                                }}>
                                                  {formatPrice(price)}
                                                </Typography>
                                              </Box>
                                            </MenuItem>
                                          );
                                        })}
                                      </Select>
                                      {!formData.paymentType && (
                                        <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 1 }}>
                                          Seleccione una duración
                                        </Typography>
                                      )}
                                    </FormControl>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </Box>
                      )}

                      {/* PASO 3: Cupones */}
                      {index === 2 && (
                        <Box sx={{ mb: 4 }}>
                          <Card sx={{
                            background: `${colorTokens.brand}05`,
                            border: `1px solid ${colorTokens.brand}20`,
                            borderRadius: 3
                          }}>
                            <CardContent sx={{ p: 4 }}>
                              <Typography variant="h6" sx={{ 
                                color: colorTokens.brand, 
                                mb: 3,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <LocalOfferIcon />
                                Sistema de Descuentos
                              </Typography>
                              
                              <TextField
                                fullWidth
                                label="Código de Cupón"
                                value={formData.couponCode}
                                onChange={(event) => dispatch({
                                  type: 'UPDATE_PAYMENT',
                                  payload: { couponCode: event.target.value.toUpperCase() }
                                })}
                                onBlur={(event) => handleCouponValidation(event.target.value)}
                                onKeyPress={(event) => {
                                  if (event.key === 'Enter') {
                                    const target = event.target as HTMLInputElement;
                                    handleCouponValidation(target.value);
                                  }
                                }}
                                placeholder="Ej: DESC20, PROMO50..."
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LocalOfferIcon sx={{ color: colorTokens.brand }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: appliedCoupon && (
                                    <InputAdornment position="end">
                                      <CheckCircleIcon sx={{ color: colorTokens.brand }} />
                                    </InputAdornment>
                                  ),
                                  sx: {
                                    color: colorTokens.neutral1200,
                                    fontSize: '1.1rem',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: `${colorTokens.brand}40`,
                                      borderWidth: 2
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: colorTokens.brand
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: colorTokens.brand
                                    }
                                  }
                                }}
                                InputLabelProps={{
                                  sx: { 
                                    color: colorTokens.neutral800,
                                    fontSize: '1.1rem',
                                    '&.Mui-focused': { color: colorTokens.brand }
                                  }
                                }}
                              />

                              <Typography variant="body2" sx={{ 
                                color: colorTokens.neutral800,
                                mt: 1,
                                fontStyle: 'italic'
                              }}>
                                Si tiene un cupón de descuento, ingréselo aquí
                              </Typography>

                              {appliedCoupon && (
                                <AnimatePresence>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Box sx={{ mt: 3 }}>
                                      <Card sx={{
                                        background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                                        border: `2px solid ${colorTokens.success}50`,
                                        borderRadius: 3
                                      }}>
                                        <CardContent sx={{ p: 3 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <CheckCircleIcon sx={{ color: colorTokens.success, fontSize: 30 }} />
                                            <Typography variant="h6" sx={{ 
                                              color: colorTokens.success, 
                                              fontWeight: 700
                                            }}>
                                              Cupón Aplicado!
                                            </Typography>
                                            <Box sx={{ flex: 1 }} />
                                            
                                            {/* 🎯 AQUÍ ESTÁ EL CAMBIO CORREGIDO */}
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                dispatch({ type: 'CLEAR_COUPON' });
                                                setAppliedCoupon(null); // ✅ LÍNEA AGREGADA
                                                toast.success('Cupón eliminado');
                                              }}
                                              sx={{ color: colorTokens.danger }}
                                              aria-label="Eliminar cupón"
                                            >
                                              <RemoveIcon />
                                            </IconButton>
                                            
                                          </Box>
                                          
                                          <Typography variant="body1" sx={{ 
                                            color: colorTokens.neutral1200, 
                                            mb: 1,
                                            fontWeight: 600
                                          }}>
                                            {appliedCoupon.description || 'Descuento aplicado'}
                                          </Typography>
                                          
                                          <Typography variant="h6" sx={{ 
                                            color: colorTokens.success,
                                            fontWeight: 700
                                          }}>
                                            Descuento: {appliedCoupon.discount_type === 'percentage' 
                                              ? `${appliedCoupon.discount_value}%` 
                                              : formatPrice(appliedCoupon.discount_value)}
                                          </Typography>
                                          
                                          {appliedCoupon.min_amount > 0 && (
                                            <Typography variant="caption" sx={{ 
                                              color: colorTokens.neutral800,
                                              display: 'block',
                                              mt: 1
                                            }}>
                                              Monto mínimo: {formatPrice(appliedCoupon.min_amount)}
                                            </Typography>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </Box>
                                  </motion.div>
                                </AnimatePresence>
                              )}
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* PASO 4: Sistema de Pago */}
                      {index === 3 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ 
                            color: colorTokens.brand, 
                            mb: 4,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <PaymentIcon />
                            Sistema de Pago
                          </Typography>

                          {/* Toggle Pago Mixto */}
                          <Card sx={{
                            background: `${colorTokens.brand}05`,
                            border: `1px solid ${colorTokens.brand}30`,
                            borderRadius: 3,
                            mb: 4
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.isMixedPayment}
                                    onChange={() => dispatch({ type: 'TOGGLE_MIXED_PAYMENT' })}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: colorTokens.brand,
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: colorTokens.brand,
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="h6" sx={{ 
                                      color: colorTokens.neutral1200, 
                                      fontWeight: 600 
                                    }}>
                                      Pago Mixto
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: colorTokens.neutral800
                                    }}>
                                      Combinar múltiples métodos de pago
                                    </Typography>
                                  </Box>
                                }
                              />
                            </CardContent>
                          </Card>

                          {/* Pago Simple */}
                          {!formData.isMixedPayment && (
                            <AnimatePresence mode="wait">
                              <motion.div
                                key="simple-payment"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.neutral300}, ${colorTokens.neutral200})`,
                                  border: `2px solid ${colorTokens.brand}30`,
                                  borderRadius: 3
                                }}>
                                  <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ 
                                      color: colorTokens.brand, 
                                      mb: 3,
                                      fontWeight: 700
                                    }}>
                                      Método de Pago
                                    </Typography>
                                    
                                    <Grid container spacing={3}>
                                      {PAYMENT_METHODS.filter(m => m.value !== 'mixto').map((method) => (
                                        <Grid key={method.value} size={{ xs: 12, sm: 6 }}>
                                          <PaymentMethodCard
                                            method={method}
                                            selected={formData.paymentMethod === method.value}
                                            onSelect={() => handlePaymentMethodSelect(method.value)}
                                          />
                                        </Grid>
                                      ))}
                                    </Grid>

                                    {/* Configuración específica para efectivo */}
                                    {formData.paymentMethod === 'efectivo' && (
                                      <AnimatePresence>
                                        <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -20 }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          <Card sx={{
                                            background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                                            border: `2px solid ${colorTokens.brand}50`,
                                            borderRadius: 3,
                                            mt: 3
                                          }}>
                                            <CardContent sx={{ p: 4 }}>
                                              <Typography variant="h6" sx={{ 
                                                color: colorTokens.brand, 
                                                mb: 3,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2
                                              }}>
                                                Calculadora de Efectivo
                                              </Typography>

                                              <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Total a Cobrar"
                                                    value={formatPrice(finalAmount)}
                                                    disabled
                                                    InputProps={{
                                                      sx: {
                                                        color: colorTokens.neutral1200,
                                                        backgroundColor: `${colorTokens.brand}10`,
                                                        fontSize: '1.3rem',
                                                        fontWeight: 700,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: `${colorTokens.brand}50`,
                                                          borderWidth: 2
                                                        }
                                                      }
                                                    }}
                                                    InputLabelProps={{
                                                      sx: { 
                                                        color: colorTokens.neutral800,
                                                        fontWeight: 600
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Dinero Recibido"
                                                    type="number"
                                                    value={formData.paymentReceived || ''}
                                                    onChange={(event) => {
                                                      const received = parseFloat(event.target.value) || 0;
                                                      dispatch({
                                                        type: 'UPDATE_PAYMENT',
                                                        payload: {
                                                          paymentReceived: received,
                                                          paymentChange: Math.max(0, received - finalAmount)
                                                        }
                                                      });
                                                    }}
                                                    placeholder="0.00"
                                                    error={formData.paymentReceived > 0 && formData.paymentReceived < finalAmount}
                                                    helperText={
                                                      formData.paymentReceived > 0 && formData.paymentReceived < finalAmount
                                                        ? `Faltan: ${formatPrice(finalAmount - formData.paymentReceived)}`
                                                        : ''
                                                    }
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                          <AttachMoneyIcon sx={{ color: colorTokens.brand }} />
                                                        </InputAdornment>
                                                      ),
                                                      sx: {
                                                        color: colorTokens.neutral1200,
                                                        fontSize: '1.3rem',
                                                        fontWeight: 700,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: `${colorTokens.brand}50`,
                                                          borderWidth: 2
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.brand
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.brand
                                                        }
                                                      }
                                                    }}
                                                    InputLabelProps={{
                                                      sx: { 
                                                        color: colorTokens.neutral800,
                                                        fontWeight: 600,
                                                        '&.Mui-focused': { color: colorTokens.brand }
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={12}>
                                                  <Box sx={{
                                                    background: formData.paymentChange > 0 
                                                      ? `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`
                                                      : `${colorTokens.neutral600}05`,
                                                    border: formData.paymentChange > 0 
                                                      ? `2px solid ${colorTokens.brand}` 
                                                      : `1px solid ${colorTokens.neutral400}`,
                                                    borderRadius: 3,
                                                    p: 3,
                                                    textAlign: 'center'
                                                  }}>
                                                    <Typography variant="h4" sx={{ 
                                                      color: formData.paymentChange > 0 ? colorTokens.brand : colorTokens.neutral800,
                                                      fontWeight: 800,
                                                      mb: 1
                                                    }}>
                                                      {formData.paymentChange > 0 
                                                        ? `Cambio: ${formatPrice(formData.paymentChange)}`
                                                        : 'Cambio: $0.00'
                                                      }
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ 
                                                      color: colorTokens.neutral800
                                                    }}>
                                                      {formData.paymentReceived < finalAmount 
                                                        ? `Faltan: ${formatPrice(finalAmount - formData.paymentReceived)}`
                                                        : formData.paymentChange > 0 
                                                          ? 'Entregar cambio al cliente'
                                                          : 'Pago exacto'
                                                      }
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      </AnimatePresence>
                                    )}

                                    {/* Referencias para otros métodos */}
                                    {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito' || formData.paymentMethod === 'transferencia') && (
                                      <AnimatePresence>
                                        <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -20 }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          <Card sx={{
                                            background: `${colorTokens.neutral300}15`,
                                            border: `1px solid ${colorTokens.neutral400}`,
                                            borderRadius: 3,
                                            mt: 3
                                          }}>
                                            <CardContent sx={{ p: 3 }}>
                                              <TextField
                                                fullWidth
                                                label={
                                                  formData.paymentMethod === 'transferencia' 
                                                    ? 'Número de Referencia / SPEI'
                                                    : 'Número de Autorización'
                                                }
                                                value={formData.paymentReference}
                                                onChange={(event) => dispatch({
                                                  type: 'UPDATE_PAYMENT',
                                                  payload: { paymentReference: event.target.value }
                                                })}
                                                placeholder="Ej: 123456, AUTH789..."
                                                InputProps={{
                                                  startAdornment: (
                                                    <InputAdornment position="start">
                                                      {formData.paymentMethod === 'transferencia' ? 
                                                        <AccountBalanceIcon sx={{ color: colorTokens.info }} /> :
                                                        <CreditCardIcon sx={{ color: colorTokens.neutral600 }} />
                                                      }
                                                    </InputAdornment>
                                                  ),
                                                  sx: {
                                                    color: colorTokens.neutral1200,
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: `${colorTokens.neutral400}50`,
                                                      borderWidth: 2
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: colorTokens.neutral700
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: colorTokens.brand
                                                    }
                                                  }
                                                }}
                                                InputLabelProps={{
                                                  sx: { 
                                                    color: colorTokens.neutral800,
                                                    '&.Mui-focused': { color: colorTokens.brand }
                                                  }
                                                }}
                                              />
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      </AnimatePresence>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </AnimatePresence>
                          )}
                          
                          {/* Pago Mixto */}
                          {formData.isMixedPayment && (
                            <AnimatePresence mode="wait">
                              <motion.div
                                key="mixed-payment"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}05)`,
                                  border: `2px solid ${colorTokens.warning}50`,
                                  borderRadius: 3
                                }}>
                                  <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ 
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mb: 3
                                    }}>
                                      <Typography variant="h6" sx={{ 
                                        color: colorTokens.warning, 
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                      }}>
                                        Pagos Mixtos
                                      </Typography>
                                      
                                      <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => addMixedPaymentDetail()}
                                        sx={{
                                          background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}DD)`,
                                          color: colorTokens.neutral0,
                                          fontWeight: 700,
                                          '&:hover': {
                                            background: `linear-gradient(135deg, ${colorTokens.warning}DD, ${colorTokens.warning}BB)`,
                                            transform: 'translateY(-2px)'
                                          }
                                        }}
                                      >
                                        Agregar Método
                                      </Button>
                                    </Box>

                                    {formData.paymentDetails.length === 0 && (
                                      <Box sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        border: `2px dashed ${colorTokens.warning}30`,
                                        borderRadius: 3
                                      }}>
                                        <Typography variant="body1" sx={{ 
                                          color: colorTokens.neutral800,
                                          mb: 2
                                        }}>
                                          No hay métodos agregados
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          color: colorTokens.neutral800
                                        }}>
                                          Agregue métodos de pago para comenzar
                                        </Typography>
                                      </Box>
                                    )}

                                    <Stack spacing={3}>
                                      {formData.paymentDetails.map((detail, index) => (
                                        <motion.div
                                          key={detail.id}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                          <Card sx={{
                                            background: `${colorTokens.neutral300}05`,
                                            border: `1px solid ${colorTokens.neutral400}`,
                                            borderRadius: 3
                                          }}>
                                            <CardContent sx={{ p: 3 }}>
                                              <Box sx={{ 
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 2
                                              }}>
                                                <Typography variant="h6" sx={{ 
                                                  color: colorTokens.warning,
                                                  fontWeight: 600
                                                }}>
                                                  Pago #{detail.sequence}
                                                </Typography>
                                                
                                                <IconButton
                                                  onClick={() => removeMixedPaymentDetail(detail.id)}
                                                  sx={{ color: colorTokens.danger }}
                                                  aria-label="Eliminar método de pago"
                                                >
                                                  <RemoveIcon />
                                                </IconButton>
                                              </Box>

                                              <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                  <FormControl fullWidth>
                                                    <InputLabel sx={{ 
                                                      color: colorTokens.neutral800,
                                                      '&.Mui-focused': { color: colorTokens.warning }
                                                    }}>
                                                      Método
                                                    </InputLabel>
                                                    <Select
                                                      value={detail.method}
                                                      onChange={(event: SelectChangeEvent<string>) => 
                                                        updateMixedPaymentDetail(detail.id, 'method', event.target.value)
                                                      }
                                                      sx={{
                                                        color: colorTokens.neutral1200,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: `${colorTokens.warning}30`
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.warning
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.warning
                                                        }
                                                      }}
                                                    >
                                                      {PAYMENT_METHODS.filter(m => m.value !== 'mixto').map((method) => (
                                                        <MenuItem key={method.value} value={method.value}>
                                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <span>{method.icon}</span>
                                                            <span>{method.label}</span>
                                                            {!method.hasCommission && (
                                                              <Chip label="Sin comisión" size="small" sx={{ 
                                                                backgroundColor: colorTokens.success, 
                                                                color: colorTokens.neutral0,
                                                                fontSize: '0.65rem',
                                                                ml: 1
                                                              }} />
                                                            )}
                                                          </Box>
                                                        </MenuItem>
                                                      ))}
                                                    </Select>
                                                  </FormControl>
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 4 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Monto"
                                                    type="number"
                                                    value={detail.amount || ''}
                                                    onChange={(event) => 
                                                      updateMixedPaymentDetail(detail.id, 'amount', parseFloat(event.target.value) || 0)
                                                    }
                                                    error={detail.amount <= 0}
                                                    helperText={detail.amount <= 0 ? "Monto requerido" : ""}
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start">
                                                          $
                                                        </InputAdornment>
                                                      ),
                                                      sx: {
                                                        color: colorTokens.neutral1200,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: `${colorTokens.warning}30`
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.warning
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.warning
                                                        }
                                                      }
                                                    }}
                                                    InputLabelProps={{
                                                      sx: { 
                                                        color: colorTokens.neutral800,
                                                        '&.Mui-focused': { color: colorTokens.warning }
                                                      }
                                                    }}
                                                  />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 4 }}>
                                                  <TextField
                                                    fullWidth
                                                    label="Referencia"
                                                    value={detail.reference}
                                                    onChange={(event) => 
                                                      updateMixedPaymentDetail(detail.id, 'reference', event.target.value)
                                                    }
                                                    placeholder="Opcional"
                                                    InputProps={{
                                                      sx: {
                                                        color: colorTokens.neutral1200,
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                          borderColor: colorTokens.neutral400
                                                        }
                                                      }
                                                    }}
                                                    InputLabelProps={{
                                                      sx: { color: colorTokens.neutral800 }
                                                    }}
                                                  />
                                                </Grid>

                                                {detail.commission_amount > 0 && (
                                                  <Grid size={12}>
                                                    <Alert severity="warning" sx={{
                                                      backgroundColor: `${colorTokens.warning}10`,
                                                      color: colorTokens.neutral1200,
                                                      border: `1px solid ${colorTokens.warning}30`,
                                                      '& .MuiAlert-icon': { color: colorTokens.warning }
                                                    }}>
                                                      <Typography variant="body2">
                                                        <strong>Comisión:</strong> {detail.commission_rate}% = {formatPrice(detail.commission_amount)}
                                                      </Typography>
                                                    </Alert>
                                                  </Grid>
                                                )}
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      ))}
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </AnimatePresence>
                          )}

                          {/* Notas Adicionales */}
                          <Card sx={{
                            background: `${colorTokens.neutral200}02`,
                            border: `1px solid ${colorTokens.neutral400}10`,
                            borderRadius: 3,
                            mt: 3
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <TextField
                                fullWidth
                                label="Notas Adicionales"
                                value={formData.notes}
                                onChange={(event) => dispatch({
                                  type: 'UPDATE_PAYMENT',
                                  payload: { notes: event.target.value }
                                })}
                                multiline
                                rows={3}
                                placeholder="Observaciones especiales..."
                                InputProps={{
                                  sx: {
                                    color: colorTokens.neutral1200,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: `${colorTokens.neutral400}30`
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: `${colorTokens.neutral400}50`
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: colorTokens.brand
                                    }
                                  }
                                }}
                                InputLabelProps={{
                                  sx: { 
                                    color: colorTokens.neutral800,
                                    '&.Mui-focused': { color: colorTokens.brand }
                                  }
                                }}
                              />
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* Botones de navegación */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button
                          disabled={activeStep === 0}
                          onClick={() => setActiveStep(prev => prev - 1)}
                          size="large"
                          sx={{ 
                            color: colorTokens.neutral800,
                            borderColor: colorTokens.neutral400,
                            px: { xs: 3, sm: 4 },
                            py: 1.5,
                            borderRadius: 3,
                            '&:hover': {
                              borderColor: colorTokens.neutral800,
                              backgroundColor: `${colorTokens.neutral200}20`
                            }
                          }}
                          variant="outlined"
                        >
                          ← Anterior
                        </Button>
                        
                        {activeStep === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={showConfirmationDialog}
                            disabled={!canProceedToNextStep() || loading || !isFormValid()}
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            sx={{
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`,
                              color: colorTokens.neutral0,
                              fontWeight: 700,
                              px: { xs: 3, sm: 4 },
                              py: 1.5,
                              borderRadius: 3,
                              fontSize: '1.1rem',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${colorTokens.brand}DD, ${colorTokens.brand}BB)`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 20px ${colorTokens.brand}40`
                              },
                              '&:disabled': {
                                background: colorTokens.neutral600,
                                color: colorTokens.neutral800
                              }
                            }}
                          >
                            {loading ? 'Procesando...' : 'Procesar Venta'}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => setActiveStep(prev => prev + 1)}
                            disabled={!canProceedToNextStep()}
                            size="large"
                            sx={{
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`,
                              color: colorTokens.neutral0,
                              fontWeight: 700,
                              px: { xs: 3, sm: 4 },
                              py: 1.5,
                              borderRadius: 3,
                              fontSize: '1.1rem',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${colorTokens.brand}DD, ${colorTokens.brand}BB)`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 20px ${colorTokens.brand}40`
                              },
                              '&:disabled': {
                                background: colorTokens.neutral600,
                                color: colorTokens.neutral800
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

          {/* Panel de Resumen - Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
              border: `2px solid ${colorTokens.brand}30`,
              borderRadius: 3,
              position: { lg: 'sticky' },
              top: { lg: 20 },
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.brand, 
                mb: 3, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <ReceiptIcon />
                Resumen de Venta
              </Typography>

              {selectedUser && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{
                        background: `${colorTokens.brand}10`,
                        border: `1px solid ${colorTokens.brand}30`,
                        borderRadius: 3,
                        p: 3
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: colorTokens.neutral800,
                          mb: 1
                        }}>
                          Cliente:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: colorTokens.neutral1200, 
                          fontWeight: 700,
                          mb: 0.5
                        }}>
                          {getUserFullName(selectedUser)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: colorTokens.neutral800
                        }}>
                          {selectedUser.email}
                        </Typography>
                        
                        {formData.isRenewal && (
                          <Box sx={{ mt: 2 }}>
                            <Chip 
                              label="RENOVACIÓN" 
                              size="small"
                              sx={{
                                backgroundColor: colorTokens.warning,
                                color: colorTokens.neutral0,
                                fontWeight: 700
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                </AnimatePresence>
              )}

              {selectedPlan && formData.paymentType && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: colorTokens.neutral800,
                        mb: 2
                      }}>
                        Membresía:
                      </Typography>
                      
                      <Box sx={{
                        background: `${colorTokens.neutral300}05`,
                        border: `1px solid ${colorTokens.neutral400}`,
                        borderRadius: 3,
                        p: 3,
                        mb: 3
                      }}>
                        <Typography variant="h6" sx={{ 
                          color: colorTokens.neutral1200, 
                          fontWeight: 700,
                          mb: 1
                        }}>
                          {selectedPlan.name}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: colorTokens.neutral800,
                          mb: 2
                        }}>
                          {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                        </Typography>

                        {endDate && formData.paymentType !== 'visit' && (
                          <Box sx={{
                            background: `${colorTokens.brand}10`,
                            borderRadius: 2,
                            p: 2,
                            border: `1px solid ${colorTokens.brand}20`
                          }}>
                            <Typography variant="body2" sx={{ 
                              color: colorTokens.neutral800,
                              mb: 1
                            }}>
                              Vigencia hasta:
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: colorTokens.brand,
                              fontWeight: 600
                            }}>
                              <CalendarMonthIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              <SafeDateLong dateString={endDate} fallback="Calculando vigencia..." />
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Divider sx={{ borderColor: `${colorTokens.brand}30`, my: 3 }} />

                      {/* Desglose de Precios */}
                      <Stack spacing={2}>
                        <PriceLine label="Subtotal Plan:" value={subtotal} />
                        
                        {inscriptionAmount > 0 ? (
                          <PriceLine label="Inscripción:" value={inscriptionAmount} />
                        ) : formData.skipInscription && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ 
                              color: colorTokens.success,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              Inscripción EXENTA:
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: colorTokens.success,
                              fontWeight: 700
                            }}>
                              GRATIS
                            </Typography>
                          </Box>
                        )}

                        {discountAmount > 0 && (
                          <PriceLine label="Descuento:" value={-discountAmount} color="success" />
                        )}

                        <Divider sx={{ borderColor: colorTokens.neutral400 }} />

                        <PriceLine label="Subtotal:" value={totalAmount} variant="h6" bold />

                        {commissionAmount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ 
                              color: colorTokens.warning,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <InfoIcon fontSize="small" />
                              Comisión{formData.customCommissionRate !== null ? ' (Personal)' : ''}:
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: colorTokens.warning,
                              fontWeight: 700
                            }}>
                              +{formatPrice(commissionAmount)}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ borderColor: `${colorTokens.brand}50` }} />

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: `${colorTokens.brand}10`,
                          border: `1px solid ${colorTokens.brand}30`,
                          borderRadius: 3,
                          p: 3
                        }}>
                          <Typography variant="h5" sx={{ 
                            color: colorTokens.neutral1200, 
                            fontWeight: 800
                          }}>
                            TOTAL FINAL:
                          </Typography>
                          <Typography variant="h4" sx={{ 
                            color: colorTokens.brand, 
                            fontWeight: 900
                          }}>
                            {formatPrice(finalAmount)}
                          </Typography>
                        </Box>

                        {/* Información del método de pago */}
                        {(formData.paymentMethod || formData.isMixedPayment) && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" sx={{ 
                              color: colorTokens.neutral800,
                              mb: 2
                            }}>
                              Método de Pago:
                            </Typography>
                            
                            {formData.isMixedPayment ? (
                              <Box sx={{
                                background: `${colorTokens.warning}10`,
                                border: `1px solid ${colorTokens.warning}30`,
                                borderRadius: 3,
                                p: 2
                              }}>
                                <Typography variant="body1" sx={{ 
                                  color: colorTokens.warning,
                                  fontWeight: 600,
                                  mb: 1
                                }}>
                                  Pago Mixto
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: colorTokens.neutral800
                                }}>
                                  {formData.paymentDetails.length} método{formData.paymentDetails.length !== 1 ? 's' : ''} configurado{formData.paymentDetails.length !== 1 ? 's' : ''}
                                </Typography>
                                {formData.paymentDetails.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    {formData.paymentDetails.map((detail, index) => (
                                      <Typography key={detail.id} variant="caption" sx={{ 
                                        display: 'block',
                                        color: colorTokens.neutral800
                                      }}>
                                        • {PAYMENT_METHODS.find(m => m.value === detail.method)?.label}: {formatPrice(detail.amount)}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{
                                background: `${colorTokens.neutral300}05`,
                                border: `1px solid ${colorTokens.neutral400}`,
                                borderRadius: 3,
                                p: 2
                              }}>
                                <Typography variant="body1" sx={{ 
                                  color: colorTokens.neutral1200,
                                  fontWeight: 600,
                                  mb: 1
                                }}>
                                  {PAYMENT_METHODS.find(pm => pm.value === formData.paymentMethod)?.icon} {PAYMENT_METHODS.find(pm => pm.value === formData.paymentMethod)?.label}
                                </Typography>

                                <Typography variant="caption" sx={{ 
                                  color: (formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                                    colorTokens.warning : colorTokens.success,
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 1
                                }}>
                                  {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                                    'Con comisión' : 'Sin comisión'}
                                </Typography>
                                
                                {formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ 
                                      color: colorTokens.neutral800
                                    }}>
                                      Recibido: {formatPrice(formData.paymentReceived)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: formData.paymentChange > 0 ? colorTokens.brand : colorTokens.neutral800,
                                      fontWeight: formData.paymentChange > 0 ? 600 : 400
                                    }}>
                                      Cambio: {formatPrice(formData.paymentChange)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </motion.div>
                </AnimatePresence>
              )}

              {(!selectedUser || !selectedPlan) && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" sx={{ color: colorTokens.neutral800 }}>
                    Seleccione un cliente y plan para ver el resumen
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog de Confirmación nativo como fallback */}
        <Dialog 
          open={confirmDialogOpen} 
          onClose={() => !loading && setConfirmDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
              border: `2px solid ${colorTokens.brand}50`,
              borderRadius: 4,
              color: colorTokens.neutral1200,
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
            }
          }}
        >
          <DialogTitle sx={{ 
            color: colorTokens.brand, 
            fontWeight: 800,
            fontSize: '1.8rem',
            textAlign: 'center',
            pb: 3
          }}>
            Confirmar Venta de Membresía
          </DialogTitle>
          
          <DialogContent>
            <Typography variant="h6" sx={{ 
              mb: 4,
              textAlign: 'center',
              color: colorTokens.neutral800
            }}>
              Revise los datos antes de procesar la venta
            </Typography>

            <Grid container spacing={4}>
              <Grid size={6}>
                <Card sx={{ 
                  background: `${colorTokens.brand}10`, 
                  border: `1px solid ${colorTokens.brand}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.brand, 
                      mb: 3,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      Cliente
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Nombre:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {getUserFullName(selectedUser)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Email:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedUser?.email || 'Sin email'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Tipo de Venta:
                        </Typography>
                        <Chip 
                          label={formData.isRenewal ? 'RENOVACIÓN' : 'PRIMERA VEZ'}
                          sx={{
                            backgroundColor: formData.isRenewal ? colorTokens.warning : colorTokens.success,
                            color: colorTokens.neutral0,
                            fontWeight: 700,
                            mt: 1
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card sx={{ 
                  background: `${colorTokens.brand}10`, 
                  border: `1px solid ${colorTokens.brand}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.brand, 
                      mb: 3,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <FitnessCenterIcon />
                      Membresía
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Plan:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedPlan?.name || 'No seleccionado'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Duración:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {paymentTypes.find(pt => pt.value === formData.paymentType)?.label || 'No seleccionado'}
                        </Typography>
                      </Box>

                      {endDate && formData.paymentType !== 'visit' && (
                        <Box>
                          <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                            Vigencia hasta:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: colorTokens.brand }}>
                            <SafeDateLong dateString={endDate} fallback="Calculando vigencia..." />
                          </Typography>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          Total Final:
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: colorTokens.brand }}>
                          {formatPrice(finalAmount)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 4, justifyContent: 'center', gap: 3 }}>
            <Button 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={loading}
              size="large"
              sx={{ 
                color: colorTokens.neutral800,
                borderColor: colorTokens.neutral400,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  borderColor: colorTokens.neutral800,
                  backgroundColor: `${colorTokens.neutral200}20`
                }
              }}
              variant="outlined"
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={handleProcessSale}
              disabled={loading}
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={24} sx={{ color: colorTokens.neutral0 }} /> : <SaveIcon />}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`,
                color: colorTokens.neutral0,
                fontWeight: 800,
                px: 6,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.brand}DD, ${colorTokens.brand}BB)`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 30px ${colorTokens.brand}40`
                },
                '&:disabled': {
                  background: colorTokens.neutral600,
                  color: colorTokens.neutral800
                }
              }}
            >
              {loading ? 'Procesando...' : 'Confirmar Venta'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
}

// Exportar componente memoizado
export default memo(RegistrarMembresiaPage);