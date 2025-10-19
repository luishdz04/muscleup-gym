'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent as ReactKeyboardEvent
} from 'react';
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
  Skeleton,
  Fade,
  Slide,
  Zoom,
  Grow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { SelectChangeEvent } from '@mui/material/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

// ✅ IMPORTACIONES ENTERPRISE v6.0
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import {
  formatTimestampForDisplay,
  formatDateForDisplay,
  formatDateLong,
  getTodayInMexico,
  daysBetween,
  addDaysToDate
} from '@/utils/dateUtils';

// Hook personalizado v6.0
import { useRegistrarMembresia } from '@/hooks/useRegistrarMembresia';

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
import CloseIcon from '@mui/icons-material/Close';
import MoneyIcon from '@mui/icons-material/Money';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CelebrationIcon from '@mui/icons-material/Celebration';

// Tipos
interface PaymentMethod {
  value: string;
  label: string;
  icon: React.ReactElement;
  color: string;
  description: string;
  hasCommission: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    value: 'efectivo',
    label: 'Efectivo',
    icon: <MoneyIcon />,
    color: colorTokens.brand,
    description: 'Pago en efectivo',
    hasCommission: false
  },
  {
    value: 'debito',
    label: 'Tarjeta de Débito',
    icon: <CreditCardIcon />,
    color: '#6366f1',
    description: 'Tarjeta de débito',
    hasCommission: true
  },
  {
    value: 'credito',
    label: 'Tarjeta de Crédito',
    icon: <AccountBalanceWalletIcon />,
    color: '#8b5cf6',
    description: 'Tarjeta de crédito',
    hasCommission: true
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
    icon: <AccountBalanceIcon />,
    color: colorTokens.info,
    description: 'Transferencia bancaria',
    hasCommission: false
  },
  {
    value: 'mixto',
    label: 'Pago Mixto',
    icon: <SwapHorizIcon />,
    color: colorTokens.warning,
    description: 'Combinar múltiples métodos de pago',
    hasCommission: true
  }
];

// ✨ FUNCIÓN DE CONFETTI
const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: NodeJS.Timeout = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFCC00', '#FFD700', '#FFA500', '#FF8C00']
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFCC00', '#FFD700', '#FFA500', '#FF8C00']
    });
  }, 250);
};

// ✅ COMPONENTES MEMOIZADOS
const SafeDate = memo<{ dateString: string; fallback?: string }>(({ 
  dateString, 
  fallback = 'Fecha no disponible' 
}) => {
  const displayDate = useMemo(() => {
    if (!dateString) return fallback;
    try {
      return formatDateForDisplay(dateString);
    } catch (error) {
      return fallback;
    }
  }, [dateString, fallback]);

  return <span>{displayDate}</span>;
});
SafeDate.displayName = 'SafeDate';

const SafeDateLong = memo<{ dateString: string; fallback?: string }>(({ 
  dateString, 
  fallback = 'Calculando...' 
}) => {
  const displayDate = useMemo(() => {
    if (!dateString) return fallback;
    try {
      return formatDateLong(dateString);
    } catch (error) {
      return fallback;
    }
  }, [dateString, fallback]);

  return <span>{displayDate}</span>;
});
SafeDateLong.displayName = 'SafeDateLong';

const getUserInitials = (user: any): string => {
  if (!user?.firstName || !user?.lastName) return '??';
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

const ProgressIndicator = memo(({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep, totalSteps]);
  const displayPercentage = useMemo(() => Math.round(progress), [progress]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {/* Background circle */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={70}
        thickness={3}
        sx={{
          color: 'rgba(255, 204, 0, 0.1)',
          position: 'absolute',
        }}
      />
      {/* Progress circle with gradient */}
      <CircularProgress
        variant="determinate"
        value={progress}
        size={70}
        thickness={3}
        sx={{
          color: colorTokens.brand,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
            filter: 'drop-shadow(0 0 8px rgba(255, 204, 0, 0.6))',
            animation: 'glow 2s ease-in-out infinite'
          },
          '@keyframes glow': {
            '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255, 204, 0, 0.4))' },
            '50%': { filter: 'drop-shadow(0 0 12px rgba(255, 204, 0, 0.8))' }
          }
        }}
      />
      <Box sx={{
        top: 0, left: 0, bottom: 0, right: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            color: colorTokens.brand,
            fontWeight: 900,
            fontSize: '1.1rem',
            textShadow: `0 0 10px ${colorTokens.brand}80`
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
      default: return colorTokens.textSecondary;
    }
  }, [color]);

  const valueColor = useMemo(() => {
    switch (color) {
      case 'success': return colorTokens.success;
      case 'warning': return colorTokens.warning;
      case 'error': return colorTokens.danger;
      default: return colorTokens.textPrimary;
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
    if (!disabled) onSelect();
  }, [disabled, onSelect]);

  const cardStyles = useMemo(() => ({
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: selected
      ? `linear-gradient(135deg, ${method.color}30, ${method.color}15)`
      : `rgba(255, 255, 255, 0.03)`,
    backdropFilter: selected ? 'blur(20px)' : 'blur(10px)',
    border: selected
      ? `3px solid ${method.color}`
      : `1px solid rgba(255, 255, 255, 0.1)`,
    borderRadius: 4,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '160px',
    opacity: disabled ? 0.5 : 1,
    position: 'relative',
    overflow: 'hidden',
    '&:hover': !disabled ? {
      borderColor: method.color,
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: `0 12px 40px ${method.color}40, 0 0 0 1px ${method.color}20`,
      background: `linear-gradient(135deg, ${method.color}20, ${method.color}10)`,
      backdropFilter: 'blur(25px)',
    } : {},
    '&::before': selected ? {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${method.color}, ${method.color}AA)`,
      animation: 'shimmer 2s infinite',
    } : {},
    '@keyframes shimmer': {
      '0%': { opacity: 0.5 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.5 },
    },
  }), [disabled, selected, method.color]);

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={handleClick}
        sx={cardStyles}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <CardContent sx={{
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          p: 3
        }}>
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: selected
              ? `linear-gradient(135deg, ${method.color}, ${method.color}CC)`
              : `rgba(255, 255, 255, 0.05)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            transition: 'all 0.3s ease',
            boxShadow: selected ? `0 4px 20px ${method.color}50` : 'none',
            '& svg': {
              fontSize: 30,
              color: selected ? colorTokens.neutral0 : method.color,
              transition: 'all 0.3s ease'
            }
          }}>
            {method.icon}
          </Box>

          <Typography variant="h6" sx={{
            color: disabled ? colorTokens.neutral600 : colorTokens.textPrimary,
            fontWeight: 700,
            fontSize: '1rem',
            mb: 0.5
          }}>
            {method.label}
          </Typography>

          <Typography variant="caption" sx={{
            color: disabled ? colorTokens.neutral600 : colorTokens.textSecondary,
            fontSize: '0.75rem',
            lineHeight: 1.4
          }}>
            {disabled && method.value === 'mixto'
              ? 'Use el toggle de arriba para activar'
              : method.description
            }
          </Typography>

          {selected && !disabled && (
            <Zoom in={selected}>
              <Box sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${method.color}, ${method.color}CC)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 12px ${method.color}60`
              }}>
                <CheckCircleIcon sx={{
                  color: colorTokens.neutral0,
                  fontSize: 20
                }} />
              </Box>
            </Zoom>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
PaymentMethodCard.displayName = 'PaymentMethodCard';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
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

// ✅ COMPONENTE PRINCIPAL
function RegistrarMembresiaPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const MySwalRef = useRef<any>(null);
  
  // ✅ ESTADOS LOCALES UI v6.0
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [paymentChange, setPaymentChange] = useState<number>(0);
  
  const {
    formData,
    dispatch,
    activeStep,
    setActiveStep,
    users,
    plans,
    userHistory,
    selectedUser,
    setSelectedUser,
    selectedPlan,
    setSelectedPlan,
    appliedCoupon,
    setAppliedCoupon,
    loading,
    loadingUsers,
    loadingPlans,
    confirmDialogOpen,
    setConfirmDialogOpen,
    subtotal,
    inscriptionAmount,
    discountAmount,
    commissionAmount,
    totalAmount,
    finalAmount,
    formatPrice,
    debouncedLoadUsers,
    loadUserHistory,
    validateCoupon,
    getCommissionRate,
    calculateCommission,
    addMixedPaymentDetail,
    removeMixedPaymentDetail,
    updateMixedPaymentDetail,
    calculateEndDate,
    handleSubmit,
    canProceedToNextStep,
    commissionsLoading,
    commissionsError,
    paymentTypes
  } = useRegistrarMembresia();

  const steps = useMemo(() => [
    { label: 'Cliente', description: 'Seleccionar cliente', icon: <PersonAddAltIcon /> },
    { label: 'Plan', description: 'Elegir membresía', icon: <FitnessCenterIcon /> },
    { label: 'Descuentos', description: 'Aplicar cupones', icon: <LocalOfferIcon /> },
    { label: 'Pago', description: 'Método de pago', icon: <PaymentIcon /> }
  ], []);

  const validateUser = useCallback((user: any): boolean => {
    if (!user) return false;
    if (!user.email) {
      notify.error('El usuario no tiene email');
      return false;
    }
    return true;
  }, []);

  const handleBack = useCallback(() => {
    router.push('/dashboard/admin/membresias');
  }, [router]);

  const handleUserSelect = useCallback((event: React.SyntheticEvent, newValue: any) => {
    if (!newValue) {
      setSelectedUser(null);
      dispatch({ type: 'SET_USER', payload: { id: '' } });
      return;
    }

    if (!validateUser(newValue)) return;

    const normalizedUser = {
      ...newValue,
      firstName: newValue.firstName || 'Sin',
      lastName: newValue.lastName || 'Nombre'
    };

    setSelectedUser(normalizedUser);
    dispatch({ type: 'SET_USER', payload: normalizedUser });

    if (normalizedUser.id) {
      loadUserHistory(normalizedUser.id);
    }
  }, [dispatch, loadUserHistory, setSelectedUser, validateUser]);

  const handlePlanSelect = useCallback((plan: any) => {
    if (!plan || !plan.id) {
      notify.error('Plan inválido');
      return;
    }
    setSelectedPlan(plan);
    dispatch({ type: 'SET_PLAN', payload: plan.id });
  }, [dispatch, setSelectedPlan]);

  const handlePaymentMethodSelect = useCallback((method: string) => {
    if (method === 'mixto') {
      dispatch({ type: 'TOGGLE_MIXED_PAYMENT' });
      return;
    }

    const rate = getCommissionRate(method);
    const netAmount = totalAmount;
    const grossAmount = rate > 0 ? netAmount / (1 - rate / 100) : netAmount;
    const roundedGross = Math.round(grossAmount * 100) / 100;
    const commissionData = calculateCommission(method, roundedGross);

    const newDetail = {
      id: Date.now().toString(),
      method: method,
      amount: roundedGross,
      commission_rate: commissionData.rate,
      commission_amount: commissionData.amount,
      reference: '',
      sequence: 1
    };

    dispatch({
      type: 'SET_SINGLE_PAYMENT_DETAIL',
      payload: [newDetail]
    });
  }, [dispatch, calculateCommission, getCommissionRate, totalAmount]);

  const handleRenewalToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const isRenewal = event.target.checked;
    dispatch({
      type: 'SET_RENEWAL_DATA',
      payload: {
        isRenewal,
        skipInscription: isRenewal,
        latestEndDate: formData.latestEndDate
      }
    });
  }, [dispatch, formData.latestEndDate]);

  const handleSkipInscriptionToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: { skipInscription: event.target.checked }
    });
  }, [dispatch]);

  const handleMixedPaymentToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_MIXED_PAYMENT' });
  }, [dispatch]);

  const handleCouponChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: { couponCode: event.target.value.toUpperCase() }
    });
  }, [dispatch]);

  const handleCouponBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    const trimmedCode = event.target.value.trim();
    if (!trimmedCode) return;
    
    if (trimmedCode !== formData.couponCode) {
      validateCoupon(trimmedCode);
    }
  }, [formData.couponCode, validateCoupon]);

  const handleCouponKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      const trimmedCode = target.value.trim();
      if (trimmedCode) {
        validateCoupon(trimmedCode);
      }
    }
  }, [validateCoupon]);

  const handlePaymentReceivedChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const received = parseFloat(event.target.value) || 0;
    setPaymentReceived(received);
    setPaymentChange(Math.max(0, received - finalAmount));
  }, [finalAmount]);

  const handlePaymentReferenceChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (formData.paymentDetails.length > 0) {
      updateMixedPaymentDetail(formData.paymentDetails[0].id, 'reference', event.target.value);
    }
  }, [formData.paymentDetails, updateMixedPaymentDetail]);

  const handleNotesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: { notes: event.target.value }
    });
  }, [dispatch]);

  const handlePaymentTypeChange = useCallback((event: SelectChangeEvent<string>) => {
    dispatch({
      type: 'SET_PAYMENT_TYPE',
      payload: event.target.value
    });
  }, [dispatch]);

  const showConfirmationDialog = useCallback(async () => {
    setConfirmDialogOpen(true);
  }, [setConfirmDialogOpen]);

  const handleProcessSale = useCallback(async () => {
    try {
      const success = await handleSubmit();
      if (success) {
        // 🎉 Trigger confetti celebration
        triggerConfetti();
        notify.success('¡Venta procesada exitosamente! 🎉');
        setTimeout(() => {
          router.push('/dashboard/admin/membresias');
        }, 3000);
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      notify.error('Error al procesar la venta');
    }
  }, [handleSubmit, router]);

  const isFormValid = useCallback(() => {
    if (!selectedUser) {
      notify.error('Seleccione un cliente válido');
      return false;
    }
    if (!selectedPlan) {
      notify.error('Seleccione un plan');
      return false;
    }
    if (!formData.paymentType) {
      notify.error('Seleccione el tipo de duración');
      return false;
    }
    
    if (formData.isMixedPayment) {
      if (formData.paymentDetails.length === 0) {
        notify.error('Agregue al menos un método de pago');
        return false;
      }
      
      for (let i = 0; i < formData.paymentDetails.length; i++) {
        const detail = formData.paymentDetails[i];
        if (!detail.method) {
          notify.error(`Método de pago #${i+1} no seleccionado`);
          return false;
        }
        if (detail.amount <= 0) {
          notify.error(`Método de pago #${i+1} debe tener monto mayor a cero`);
          return false;
        }
      }
    } else {
      if (formData.paymentDetails.length === 0) {
        notify.error('Seleccione un método de pago');
        return false;
      }
      if (!formData.paymentDetails[0].method) {
        notify.error('Seleccione un método de pago');
        return false;
      }
    }
    
    return true;
  }, [selectedUser, selectedPlan, formData]);

  useEffect(() => {
    if (!hydrated) return;
    
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
  }, [canProceedToNextStep, activeStep, steps.length, setActiveStep, confirmDialogOpen, handleBack, hydrated]);

  const endDate = useMemo(() => {
    try {
      const date = calculateEndDate();
      return date || '';
    } catch (error) {
      console.error('Error calculando fecha:', error);
      return '';
    }
  }, [calculateEndDate]);

  const selectedPaymentMethod = useMemo(() => {
    return formData.paymentDetails[0]?.method || '';
  }, [formData.paymentDetails]);

  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        minHeight: '100vh',
        color: colorTokens.textPrimary
      }}>
        <Fade in={true} timeout={600}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            mb: { xs: 2, sm: 2.5, md: 3 },
            background: `linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255, 204, 0, 0.2)`,
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 204, 0, 0.1), transparent)',
              animation: 'shine 3s infinite',
            },
            '@keyframes shine': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
            }
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              mb: { xs: 2, sm: 2.5, md: 3 },
              gap: 2,
              position: 'relative',
              zIndex: 1
            }}>
              <Box>
                <Typography variant="h4" sx={{
                  color: colorTokens.brand,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                  textShadow: `0 0 20px ${colorTokens.brand}60`,
                  letterSpacing: '0.5px'
                }}>
                  <Box sx={{
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 },
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 20px ${colorTokens.brand}60`,
                    animation: 'float 3s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-5px)' }
                    }
                  }}>
                    <PersonAddAltIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: colorTokens.neutral0 }} />
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nueva Venta de Membresía</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Nueva Venta</Box>
                </Typography>
                <Typography variant="body1" sx={{
                  color: colorTokens.textSecondary,
                  mt: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 500,
                  opacity: 0.9
                }}>
                  Sistema de punto de venta para membresías
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <ProgressIndicator currentStep={activeStep + 1} totalSteps={steps.length} />
                </Box>
                <Button
                  startIcon={<ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    color: colorTokens.brand,
                    borderColor: colorTokens.brand,
                    borderWidth: '2px',
                    fontWeight: 700,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 2, sm: 3 },
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 204, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: '2px',
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
                      color: colorTokens.neutral0,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${colorTokens.brand}50`
                    }
                  }}
                >
                  Dashboard
                </Button>
              </Box>
            </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(activeStep + 1) / steps.length * 100}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255, 204, 0, 0.15)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${colorTokens.brand} 0%, #FFD700 50%, ${colorTokens.brand} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmerProgress 2s ease infinite',
                  boxShadow: `0 0 15px ${colorTokens.brand}80`,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent)',
                    borderRadius: '5px 5px 0 0'
                  }
                },
                '@keyframes shimmerProgress': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' }
                }
              }}
            />
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1.5, sm: 2 },
              mt: { xs: 1.5, sm: 2 },
              p: { xs: 1.5, sm: 2 },
              bgcolor: `${colorTokens.brand}10`,
              borderRadius: 2,
              border: `1px solid ${colorTokens.brand}30`
            }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {steps[activeStep]?.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Paso {activeStep + 1} de {steps.length}: {steps[activeStep]?.label}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {steps[activeStep]?.description}
                </Typography>
              </Box>
              <Chip
                label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
                sx={{
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.textOnBrand,
                  fontWeight: 800,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  boxShadow: `0 4px 12px ${colorTokens.brand}50`,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                  }
                }}
              />
            </Box>
          </Box>
        </Paper>
        </Fade>

        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 3
            }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: colorTokens.textPrimary,
                          fontWeight: activeStep === index ? 700 : 500,
                          fontSize: activeStep === index ? '1.1rem' : '1rem'
                        },
                        '& .MuiStepIcon-root': {
                          color: activeStep === index ? colorTokens.brand : colorTokens.neutral600,
                          fontSize: '2rem',
                          '&.Mui-completed': { color: colorTokens.brand }
                        }
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography sx={{ color: colorTokens.textSecondary, mb: 3 }}>
                        {step.description}
                      </Typography>

                      {/* PASO 1: CLIENTE */}
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
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: colorTokens.neutral900,
                                    borderRadius: 2,
                                    '& fieldset': {
                                      borderColor: `${colorTokens.brand}50`,
                                    },
                                    '&:hover fieldset': {
                                      borderColor: `${colorTokens.brand}80`,
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: colorTokens.brand,
                                      borderWidth: 2,
                                    },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: colorTokens.textSecondary,
                                    backgroundColor: 'transparent',
                                    paddingX: 0.5,
                                    '&.Mui-focused': {
                                      color: colorTokens.brand,
                                    },
                                  },
                                  '& .MuiAutocomplete-input': {
                                    color: colorTokens.neutral0,
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    '&::placeholder': {
                                      color: colorTokens.textSecondary,
                                      opacity: 1,
                                    },
                                  },
                                  '& .MuiAutocomplete-clearIndicator': {
                                    color: colorTokens.textSecondary,
                                    '&:hover': {
                                      color: colorTokens.neutral0,
                                    },
                                  },
                                  '& .MuiAutocomplete-popupIndicator': {
                                    color: colorTokens.brand,
                                  },
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Nombre, apellido o email..."
                                    fullWidth
                                    InputProps={{
                                      ...params.InputProps,
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <SearchIcon sx={{ color: colorTokens.brand }} />
                                        </InputAdornment>
                                      ),
                                      endAdornment: (
                                        <>
                                          {loadingUsers ? <CircularProgress sx={{ color: colorTokens.brand }} size={20} /> : null}
                                          {params.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                    InputLabelProps={{
                                      ...params.InputLabelProps,
                                      shrink: true,
                                    }}
                                  />
                                )}
                                ListboxProps={{
                                  sx: {
                                    backgroundColor: colorTokens.neutral900,
                                    '& .MuiAutocomplete-option': {
                                      color: colorTokens.textPrimary,
                                      backgroundColor: colorTokens.neutral900,
                                      '&:hover': {
                                        backgroundColor: `${colorTokens.brand}20`,
                                      },
                                      '&[aria-selected="true"]': {
                                        backgroundColor: `${colorTokens.brand}30`,
                                        '&:hover': {
                                          backgroundColor: `${colorTokens.brand}40`,
                                        },
                                      },
                                    },
                                  },
                                }}
                                renderOption={(props, user) => {
                                  const { key, ...otherProps } = props;
                                  return (
                                    <li key={key} {...otherProps}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
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
                                          fontSize: '0.9rem'
                                        }}>
                                          {getUserInitials(user)}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="body1" sx={{ 
                                            fontWeight: 600, 
                                            color: colorTokens.textPrimary 
                                          }}>
                                            {getUserFullName(user)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ 
                                            color: colorTokens.textSecondary,
                                            fontSize: '0.85rem'
                                          }}>
                                            {user.email}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </li>
                                  );
                                }}
                                noOptionsText={loadingUsers ? "Buscando..." : "Escriba al menos 2 caracteres"}
                              />
                            </CardContent>
                          </Card>

                          {selectedUser && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                              >
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                                  border: `2px solid ${colorTokens.brand}50`,
                                  borderRadius: 3
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
                                        <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                          Cliente Seleccionado
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                          {getUserFullName(selectedUser)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                                          {selectedUser.email}
                                        </Typography>
                                      </Box>
                                      <CheckCircleIcon sx={{ color: colorTokens.brand, fontSize: 40 }} />
                                    </Box>

                                    <Divider sx={{ borderColor: `${colorTokens.brand}30`, my: 3 }} />
                                    
                                    <Box sx={{
                                      background: userHistory.length > 0 ? `${colorTokens.warning}10` : `${colorTokens.success}10`,
                                      border: userHistory.length > 0 ? `1px solid ${colorTokens.warning}30` : `1px solid ${colorTokens.success}30`,
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
                                            <Badge badgeContent={userHistory.length} color="primary" />
                                          </Typography>

                                          <Box sx={{ mb: 3 }}>
                                            {userHistory.slice(0, 3).map((membership, idx) => (
                                              <Box key={membership.id} sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                py: 1.5,
                                                px: 2,
                                                borderBottom: idx < Math.min(2, userHistory.length - 1) ? `1px solid ${colorTokens.neutral400}` : 'none'
                                              }}>
                                                <Box>
                                                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 500 }}>
                                                    {membership.plan_name || 'Plan desconocido'}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                                    <SafeDate dateString={membership.start_date} /> → {' '}
                                                    {membership.end_date ? <SafeDate dateString={membership.end_date} /> : 'Sin fecha'}
                                                  </Typography>
                                                </Box>
                                                <Chip 
                                                  label={membership.status.toUpperCase()}
                                                  size="small"
                                                  sx={{
                                                    backgroundColor: 
                                                      membership.status === 'active' ? colorTokens.success : 
                                                      membership.status === 'expired' ? colorTokens.neutral600 : colorTokens.info,
                                                    color: colorTokens.neutral0,
                                                    fontWeight: 600
                                                  }}
                                                />
                                              </Box>
                                            ))}
                                          </Box>
                                        </>
                                      ) : (
                                        <>
                                          <Typography variant="h6" sx={{ 
                                            color: colorTokens.success,
                                            fontWeight: 700,
                                            mb: 2
                                          }}>
                                            Cliente Nuevo
                                          </Typography>
                                          <Typography variant="body1" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                                            Este cliente no tiene historial de membresías previas.
                                          </Typography>
                                          <Alert severity="info" sx={{
                                            backgroundColor: `${colorTokens.info}10`,
                                            color: colorTokens.textPrimary
                                          }}>
                                            <strong>Primera Venta:</strong> Se incluirá el costo de inscripción.
                                          </Alert>
                                        </>
                                      )}

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
                                              onChange={handleRenewalToggle}
                                              sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand },
                                              }}
                                            />
                                          }
                                          label={
                                            <Box>
                                              <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                                Marcar como Renovación
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 0.5 }}>
                                                {formData.isRenewal ? 
                                                  <span style={{ color: colorTokens.success }}><strong>Renovación:</strong> Sin inscripción</span> : 
                                                  <span style={{ color: colorTokens.warning }}><strong>Primera venta:</strong> Con inscripción</span>
                                                }
                                              </Typography>
                                            </Box>
                                          }
                                        />
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </Box>
                      )}

                      {/* PASO 2: PLAN */}
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
                          ) : (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              {plans.map((plan) => (
                                <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card
                                      sx={{
                                        cursor: 'pointer',
                                        background: selectedPlan?.id === plan.id 
                                          ? `linear-gradient(135deg, ${colorTokens.brand}25, ${colorTokens.brand}10)`
                                          : `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                                        border: selectedPlan?.id === plan.id 
                                          ? `3px solid ${colorTokens.brand}` 
                                          : `1px solid ${colorTokens.neutral400}`,
                                        borderRadius: 3,
                                        height: '100%'
                                      }}
                                      onClick={() => handlePlanSelect(plan)}
                                    >
                                      <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                          <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                            {plan.name}
                                          </Typography>
                                          {selectedPlan?.id === plan.id && <CheckCircleIcon sx={{ color: colorTokens.brand }} />}
                                        </Box>
                                        
                                        <Typography variant="body1" sx={{ color: colorTokens.textSecondary, mb: 3, lineHeight: 1.6 }}>
                                          {plan.description || 'Sin descripción'}
                                        </Typography>
                                        
                                        <Box sx={{ background: `${colorTokens.brand}10`, borderRadius: 2, p: 2 }}>
                                          <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700, textAlign: 'center' }}>
                                            Desde {formatPrice(plan.weekly_price || 0)}
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, textAlign: 'center' }}>
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
                            <Card sx={{
                              background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                              border: `2px solid ${colorTokens.brand}50`,
                              borderRadius: 3
                            }}>
                              <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>
                                  Configuración del Plan
                                </Typography>

                                <Box sx={{
                                  background: `${colorTokens.warning}10`,
                                  border: `1px solid ${colorTokens.warning}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  mb: 3
                                }}>
                                  <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700, mb: 2 }}>
                                    Configuración de Inscripción
                                  </Typography>

                                  <Grid container spacing={3}>
                                    <Grid size={8}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={formData.skipInscription}
                                            onChange={handleSkipInscriptionToggle}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.warning },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.warning },
                                            }}
                                          />
                                        }
                                        label={
                                          <Box>
                                            <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                              Exentar Inscripción
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                              {formData.skipInscription ? 'Sin inscripción' : `Inscripción: ${formatPrice(selectedPlan.inscription_price || 0)}`}
                                            </Typography>
                                          </Box>
                                        }
                                      />
                                    </Grid>
                                    <Grid size={4}>
                                      <Box sx={{
                                        background: formData.skipInscription ? `${colorTokens.success}10` : `${colorTokens.warning}10`,
                                        border: formData.skipInscription ? `1px solid ${colorTokens.success}30` : `1px solid ${colorTokens.warning}30`,
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center'
                                      }}>
                                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                                          Inscripción
                                        </Typography>
                                        <Typography variant="h6" sx={{ 
                                          color: formData.skipInscription ? colorTokens.success : colorTokens.warning,
                                          fontWeight: 700
                                        }}>
                                          {formData.skipInscription ? 'EXENTA' : formatPrice(selectedPlan.inscription_price || 0)}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Box>
                                
                                <FormControl fullWidth>
                                  <InputLabel>Duración y precio</InputLabel>
                                  <Select value={formData.paymentType} onChange={handlePaymentTypeChange}>
                                    {paymentTypes.map((type) => {
                                      const price = selectedPlan[type.key as keyof typeof selectedPlan] as number;
                                      if (price <= 0) return null;
                                      
                                      return (
                                        <MenuItem key={type.value} value={type.value}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <Box>
                                              <Typography variant="body1" sx={{ fontWeight: 600 }}>{type.label}</Typography>
                                              {type.value !== 'visit' && endDate && (
                                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block' }}>
                                                  Hasta: <SafeDate dateString={endDate} />
                                                </Typography>
                                              )}
                                            </Box>
                                            <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                              {formatPrice(price)}
                                            </Typography>
                                          </Box>
                                        </MenuItem>
                                      );
                                    })}
                                  </Select>
                                </FormControl>
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      )}

                      {/* PASO 3: CUPONES */}
                      {index === 2 && (
                        <Box sx={{ mb: 4 }}>
                          <Card sx={{
                            background: `${colorTokens.brand}05`,
                            border: `1px solid ${colorTokens.brand}20`,
                            borderRadius: 3
                          }}>
                            <CardContent sx={{ p: 4 }}>
                              <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>
                                <LocalOfferIcon /> Sistema de Descuentos
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                  fullWidth
                                  label="Código de Cupón"
                                  value={formData.couponCode}
                                  onChange={handleCouponChange}
                                  onBlur={handleCouponBlur}
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
                                    onKeyDown: handleCouponKeyDown
                                  }}
                                />
                                
                                <Button
                                  variant="contained"
                                  onClick={() => {
                                    const trimmedCode = formData.couponCode.trim();
                                    if (trimmedCode) {
                                      validateCoupon(trimmedCode);
                                    } else {
                                      notify.error('Ingrese un código de cupón');
                                    }
                                  }}
                                  disabled={!formData.couponCode.trim() || loading}
                                  sx={{
                                    background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                                    color: colorTokens.textOnBrand,
                                    fontWeight: 700,
                                    px: 3,
                                    height: '56px',
                                    minWidth: 120
                                  }}
                                  startIcon={loading ? <CircularProgress size={18} /> : <LocalOfferIcon />}
                                >
                                  {loading ? 'Validando...' : 'Aplicar'}
                                </Button>
                                
                                {(formData.couponCode || appliedCoupon) && (
                                  <Button
                                    variant="outlined"
                                    onClick={() => {
                                      dispatch({ type: 'CLEAR_COUPON' });
                                      setAppliedCoupon(null);
                                      notify.success('Cupón eliminado');
                                    }}
                                    sx={{
                                      color: colorTokens.danger,
                                      borderColor: colorTokens.danger,
                                      height: '56px',
                                      minWidth: '56px'
                                    }}
                                  >
                                    <CloseIcon />
                                  </Button>
                                )}
                              </Box>

                              {appliedCoupon && (
                                <Card sx={{
                                  background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                                  border: `2px solid ${colorTokens.success}50`,
                                  borderRadius: 3,
                                  mt: 3
                                }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                      <CheckCircleIcon sx={{ color: colorTokens.success, fontSize: 30 }} />
                                      <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                                        Cupón Aplicado!
                                      </Typography>
                                      <Box sx={{ flex: 1 }} />
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          dispatch({ type: 'CLEAR_COUPON' });
                                          setAppliedCoupon(null);
                                          notify.success('Cupón eliminado');
                                        }}
                                        sx={{ color: colorTokens.danger }}
                                      >
                                        <RemoveIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Typography variant="body1" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
                                      {appliedCoupon.description || 'Descuento aplicado'}
                                    </Typography>
                                    
                                    <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                                      Descuento: {appliedCoupon.discount_type === 'percentage' 
                                        ? `${appliedCoupon.discount_value}%` 
                                        : formatPrice(appliedCoupon.discount_value)}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              )}
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* PASO 4: PAGO */}
                      {index === 3 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 4, fontWeight: 700 }}>
                            <PaymentIcon /> Sistema de Pago
                          </Typography>

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
                                    onChange={handleMixedPaymentToggle}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand },
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                      Pago Mixto
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                      Combinar múltiples métodos de pago
                                    </Typography>
                                  </Box>
                                }
                              />
                            </CardContent>
                          </Card>

                          {!formData.isMixedPayment && (
                            <Card sx={{
                              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                              border: `2px solid ${colorTokens.brand}30`,
                              borderRadius: 3
                            }}>
                              <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>
                                  Método de Pago
                                </Typography>
                                
                                <Grid container spacing={3}>
                                  {PAYMENT_METHODS.filter(m => m.value !== 'mixto').map((method) => (
                                    <Grid key={method.value} size={{ xs: 12, sm: 6 }}>
                                      <PaymentMethodCard
                                        method={method}
                                        selected={selectedPaymentMethod === method.value}
                                        onSelect={() => handlePaymentMethodSelect(method.value)}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>

                                {selectedPaymentMethod === 'efectivo' && (
                                  <Fade in={true} timeout={400}>
                                    <Card sx={{
                                      background: `rgba(255, 204, 0, 0.05)`,
                                      backdropFilter: 'blur(10px)',
                                      border: `1px solid ${colorTokens.brand}40`,
                                      borderRadius: 3,
                                      mt: 3,
                                      boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2)`
                                    }}>
                                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Typography variant="subtitle1" sx={{
                                          color: colorTokens.brand,
                                          fontWeight: 700,
                                          mb: 2,
                                          fontSize: '0.95rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1
                                        }}>
                                          <MoneyIcon sx={{ fontSize: 20 }} />
                                          Calculadora de Efectivo
                                        </Typography>

                                        <Grid container spacing={2}>
                                          {/* Total en una línea compacta */}
                                          <Grid size={12}>
                                            <Box sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              background: `rgba(255, 204, 0, 0.1)`,
                                              border: `1px solid ${colorTokens.brand}50`,
                                              borderRadius: 2,
                                              px: 2,
                                              py: 1.5
                                            }}>
                                              <Typography variant="body2" sx={{
                                                color: colorTokens.textSecondary,
                                                fontWeight: 600,
                                                fontSize: '0.85rem'
                                              }}>
                                                Total a Cobrar:
                                              </Typography>
                                              <Typography variant="h6" sx={{
                                                color: colorTokens.brand,
                                                fontWeight: 800,
                                                fontSize: '1.3rem'
                                              }}>
                                                {formatPrice(finalAmount)}
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          {/* Denominaciones más compactas */}
                                          <Grid size={12}>
                                            <Grid container spacing={1}>
                                              {[1000, 500, 200, 100, 50, 20].map((amount) => (
                                                <Grid key={amount} size={{ xs: 4, sm: 2 }}>
                                                  <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                      const newAmount = (paymentReceived || 0) + amount;
                                                      setPaymentReceived(newAmount);
                                                      setPaymentChange(Math.max(0, newAmount - finalAmount));
                                                    }}
                                                    sx={{
                                                      borderColor: `${colorTokens.brand}60`,
                                                      color: colorTokens.brand,
                                                      fontWeight: 600,
                                                      fontSize: '0.75rem',
                                                      py: 0.75,
                                                      minWidth: 'unset',
                                                      transition: 'all 0.2s ease',
                                                      '&:hover': {
                                                        borderColor: colorTokens.brand,
                                                        background: colorTokens.brand,
                                                        color: colorTokens.neutral0,
                                                        transform: 'scale(1.05)'
                                                      }
                                                    }}
                                                  >
                                                    ${amount}
                                                  </Button>
                                                </Grid>
                                              ))}
                                            </Grid>
                                          </Grid>

                                          {/* Input + Botón exacto en dos columnas */}
                                          <Grid size={{ xs: 12, sm: 8 }}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Recibido"
                                              type="number"
                                              value={paymentReceived || ''}
                                              onChange={handlePaymentReceivedChange}
                                              placeholder="0.00"
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <AttachMoneyIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                                                  </InputAdornment>
                                                ),
                                                endAdornment: paymentReceived > 0 && (
                                                  <InputAdornment position="end">
                                                    <IconButton
                                                      size="small"
                                                      onClick={() => {
                                                        setPaymentReceived(0);
                                                        setPaymentChange(0);
                                                      }}
                                                      sx={{ color: colorTokens.danger, p: 0.5 }}
                                                    >
                                                      <CloseIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  fontSize: '1.1rem',
                                                  fontWeight: 600,
                                                  '& input': {
                                                    textAlign: 'right',
                                                    fontSize: '1.1rem',
                                                    py: 1
                                                  }
                                                }
                                              }}
                                            />
                                          </Grid>

                                          <Grid size={{ xs: 12, sm: 4 }}>
                                            <Button
                                              fullWidth
                                              size="small"
                                              variant="outlined"
                                              onClick={() => {
                                                setPaymentReceived(finalAmount);
                                                setPaymentChange(0);
                                              }}
                                              sx={{
                                                borderColor: colorTokens.success,
                                                color: colorTokens.success,
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                py: 1.2,
                                                height: '100%',
                                                '&:hover': {
                                                  background: colorTokens.success,
                                                  color: colorTokens.neutral0,
                                                  borderColor: colorTokens.success
                                                }
                                              }}
                                            >
                                              Exacto
                                            </Button>
                                          </Grid>

                                          {/* Display de cambio compacto */}
                                          {paymentReceived > 0 && (
                                            <Grid size={12}>
                                              <Grow in={true} timeout={300}>
                                                <Box sx={{
                                                  background: paymentReceived < finalAmount
                                                    ? `rgba(239, 68, 68, 0.1)`
                                                    : paymentChange > 0
                                                      ? `rgba(255, 204, 0, 0.15)`
                                                      : `rgba(34, 197, 94, 0.1)`,
                                                  border: paymentReceived < finalAmount
                                                    ? `2px solid ${colorTokens.danger}`
                                                    : paymentChange > 0
                                                      ? `2px solid ${colorTokens.brand}`
                                                      : `2px solid ${colorTokens.success}`,
                                                  borderRadius: 2,
                                                  p: 2,
                                                  textAlign: 'center'
                                                }}>
                                                  {paymentReceived < finalAmount ? (
                                                    <>
                                                      <Typography variant="body2" sx={{
                                                        color: colorTokens.danger,
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        mb: 0.5
                                                      }}>
                                                        FALTA
                                                      </Typography>
                                                      <Typography variant="h6" sx={{
                                                        color: colorTokens.danger,
                                                        fontWeight: 800,
                                                        fontSize: '1.3rem'
                                                      }}>
                                                        {formatPrice(finalAmount - paymentReceived)}
                                                      </Typography>
                                                    </>
                                                  ) : paymentChange > 0 ? (
                                                    <>
                                                      <Typography variant="body2" sx={{
                                                        color: colorTokens.brand,
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        mb: 0.5
                                                      }}>
                                                        CAMBIO
                                                      </Typography>
                                                      <Typography variant="h5" sx={{
                                                        color: colorTokens.brand,
                                                        fontWeight: 900,
                                                        fontSize: '1.8rem'
                                                      }}>
                                                        {formatPrice(paymentChange)}
                                                      </Typography>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <CheckCircleIcon sx={{
                                                        color: colorTokens.success,
                                                        fontSize: 32,
                                                        mb: 0.5
                                                      }} />
                                                      <Typography variant="body2" sx={{
                                                        color: colorTokens.success,
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem'
                                                      }}>
                                                        Pago Exacto
                                                      </Typography>
                                                    </>
                                                  )}
                                                </Box>
                                              </Grow>
                                            </Grid>
                                          )}
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  </Fade>
                                )}

                                {(selectedPaymentMethod === 'debito' || selectedPaymentMethod === 'credito' || selectedPaymentMethod === 'transferencia') && (
                                  <Card sx={{
                                    background: `${colorTokens.surfaceLevel3}15`,
                                    border: `1px solid ${colorTokens.neutral400}`,
                                    borderRadius: 3,
                                    mt: 3
                                  }}>
                                    <CardContent sx={{ p: 3 }}>
                                      <TextField
                                        fullWidth
                                        label={selectedPaymentMethod === 'transferencia' ? 'Número de Referencia / SPEI' : 'Número de Autorización'}
                                        value={formData.paymentDetails[0]?.reference || ''}
                                        onChange={handlePaymentReferenceChange}
                                        placeholder="Ej: 123456, AUTH789..."
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              {selectedPaymentMethod === 'transferencia' ? 
                                                <AccountBalanceIcon sx={{ color: colorTokens.info }} /> :
                                                <CreditCardIcon sx={{ color: colorTokens.neutral600 }} />
                                              }
                                            </InputAdornment>
                                          )
                                        }}
                                      />
                                    </CardContent>
                                  </Card>
                                )}
                              </CardContent>
                            </Card>
                          )}
                          
                          {formData.isMixedPayment && (
                            <Card sx={{
                              background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}05)`,
                              border: `2px solid ${colorTokens.warning}50`,
                              borderRadius: 3
                            }}>
                              <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                  <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                                    Pagos Mixtos
                                  </Typography>
                                  
                                  <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => addMixedPaymentDetail()}
                                    sx={{
                                      background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}DD)`,
                                      color: colorTokens.neutral0,
                                      fontWeight: 700
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
                                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                                      No hay métodos agregados
                                    </Typography>
                                  </Box>
                                )}

                                <Stack spacing={3}>
                                  {formData.paymentDetails.map((detail) => (
                                    <Card key={detail.id} sx={{
                                      background: `${colorTokens.surfaceLevel3}05`,
                                      border: `1px solid ${colorTokens.neutral400}`,
                                      borderRadius: 3
                                    }}>
                                      <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                          <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                                            Pago #{detail.sequence}
                                          </Typography>
                                          <IconButton onClick={() => removeMixedPaymentDetail(detail.id)} sx={{ color: colorTokens.danger }}>
                                            <RemoveIcon />
                                          </IconButton>
                                        </Box>

                                        <Grid container spacing={2}>
                                          <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControl fullWidth>
                                              <InputLabel>Método</InputLabel>
                                              <Select
                                                value={detail.method}
                                                onChange={(event: SelectChangeEvent<string>) => 
                                                  updateMixedPaymentDetail(detail.id, 'method', event.target.value)
                                                }
                                              >
                                                {PAYMENT_METHODS.filter(m => m.value !== 'mixto').map((method) => (
                                                  <MenuItem key={method.value} value={method.value}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                      <span>{method.icon}</span>
                                                      <span>{method.label}</span>
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
                                              onChange={(event: ChangeEvent<HTMLInputElement>) => 
                                                updateMixedPaymentDetail(detail.id, 'amount', parseFloat(event.target.value) || 0)
                                              }
                                              InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                                              }}
                                            />
                                          </Grid>

                                          <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                              fullWidth
                                              label="Referencia"
                                              value={detail.reference}
                                              onChange={(event: ChangeEvent<HTMLInputElement>) => 
                                                updateMixedPaymentDetail(detail.id, 'reference', event.target.value)
                                              }
                                              placeholder="Opcional"
                                            />
                                          </Grid>
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </Stack>
                              </CardContent>
                            </Card>
                          )}

                          <Card sx={{
                            background: `${colorTokens.surfaceLevel2}02`,
                            border: `1px solid ${colorTokens.neutral400}10`,
                            borderRadius: 3,
                            mt: 3
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <TextField
                                fullWidth
                                label="Notas Adicionales"
                                value={formData.notes}
                                onChange={handleNotesChange}
                                multiline
                                rows={3}
                                placeholder="Observaciones especiales..."
                              />
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button
                          disabled={activeStep === 0}
                          onClick={() => setActiveStep(prev => prev - 1)}
                          size="large"
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
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                              color: colorTokens.textOnBrand,
                              fontWeight: 700
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
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                              color: colorTokens.textOnBrand,
                              fontWeight: 700
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

          {/* RESUMEN */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Slide direction="left" in={true} timeout={800}>
              <Paper sx={{
                p: 3,
                background: `linear-gradient(180deg, rgba(255, 204, 0, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `2px solid ${colorTokens.brand}40`,
                borderRadius: 4,
                position: { lg: 'sticky' },
                top: { lg: 20 },
                boxShadow: `0 8px 32px rgba(255, 204, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brand}AA, ${colorTokens.brand})`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmerBar 3s linear infinite',
                },
                '@keyframes shimmerBar': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' }
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255, 204, 0, 0.03) 10px, rgba(255, 204, 0, 0.03) 20px)',
                  pointerEvents: 'none'
                }
              }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 16px ${colorTokens.brand}50`,
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' }
                      }
                    }}>
                      <ReceiptIcon sx={{ color: colorTokens.neutral0, fontSize: 26 }} />
                    </Box>
                    <Typography variant="h5" sx={{ color: colorTokens.brand, fontWeight: 800, letterSpacing: '0.5px' }}>
                      Resumen de Venta
                    </Typography>
                  </Box>

              {selectedUser && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{
                    background: `${colorTokens.brand}10`,
                    border: `1px solid ${colorTokens.brand}30`,
                    borderRadius: 3,
                    p: 3
                  }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                      Cliente:
                    </Typography>
                    <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      {getUserFullName(selectedUser)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      {selectedUser.email}
                    </Typography>
                    {formData.isRenewal && (
                      <Box sx={{ mt: 2 }}>
                        <Chip label="RENOVACIÓN" size="small" sx={{
                          backgroundColor: colorTokens.warning,
                          color: colorTokens.textOnBrand,
                          fontWeight: 700
                        }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {selectedPlan && formData.paymentType && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                    Membresía:
                  </Typography>
                  
                  <Box sx={{
                    background: `${colorTokens.surfaceLevel3}05`,
                    border: `1px solid ${colorTokens.neutral400}`,
                    borderRadius: 3,
                    p: 3,
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 1 }}>
                      {selectedPlan.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                    </Typography>

                    {endDate && formData.paymentType !== 'visit' && (
                      <Box sx={{
                        background: `${colorTokens.brand}10`,
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${colorTokens.brand}20`
                      }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Vigencia hasta:
                        </Typography>
                        <Typography variant="body1" sx={{ color: colorTokens.brand, fontWeight: 600 }}>
                          <CalendarMonthIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          <SafeDateLong dateString={endDate} />
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ borderColor: `${colorTokens.brand}30`, my: 3 }} />

                  <Stack spacing={2}>
                    <PriceLine label="Subtotal Plan:" value={subtotal} />
                    
                    {inscriptionAmount > 0 ? (
                      <PriceLine label="Inscripción:" value={inscriptionAmount} />
                    ) : formData.skipInscription && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ color: colorTokens.success, fontWeight: 500 }}>
                          Inscripción EXENTA:
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                          GRATIS
                        </Typography>
                      </Box>
                    )}

                    {discountAmount > 0 && (
                      <PriceLine label={`Descuento (${appliedCoupon?.code}):`} value={-discountAmount} color="success" />
                    )}

                    <Divider sx={{ borderColor: colorTokens.neutral400 }} />

                    <PriceLine label="Subtotal:" value={totalAmount} variant="h6" bold />

                    {commissionAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                          <InfoIcon fontSize="small" /> Comisión:
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                          +{formatPrice(commissionAmount)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: `${colorTokens.brand}50` }} />

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      background: `${colorTokens.brand}10`,
                      border: `1px solid ${colorTokens.brand}30`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Typography variant="h5" sx={{ color: colorTokens.textPrimary, fontWeight: 800 }}>
                        TOTAL FINAL:
                      </Typography>
                      <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 900 }}>
                        {formatPrice(finalAmount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {(!selectedUser || !selectedPlan) && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 60, color: colorTokens.brand, opacity: 0.3, mb: 2 }} />
                  <Typography variant="body1" sx={{ color: colorTokens.textSecondary, fontWeight: 500 }}>
                    Seleccione un cliente y plan para ver el resumen
                  </Typography>
                </Box>
              )}
                </Box>
              </Paper>
            </Slide>
          </Grid>
        </Grid>

        {/* DIALOG CONFIRMACIÓN */}
        <Dialog 
          open={confirmDialogOpen} 
          onClose={() => !loading && setConfirmDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.brand}50`,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ color: colorTokens.brand, fontWeight: 800, fontSize: '1.8rem', textAlign: 'center', pb: 3 }}>
            Confirmar Venta de Membresía
          </DialogTitle>
          
          <DialogContent>
            <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: colorTokens.textSecondary }}>
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
                    <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>
                      Cliente
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Nombre:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {getUserFullName(selectedUser)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Email:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedUser?.email || 'Sin email'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Tipo de Venta:</Typography>
                        <Chip 
                          label={formData.isRenewal ? 'RENOVACIÓN' : 'PRIMERA VEZ'}
                          sx={{
                            backgroundColor: formData.isRenewal ? colorTokens.warning : colorTokens.success,
                            color: colorTokens.textOnBrand,
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
                    <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 3, fontWeight: 700 }}>
                      <FitnessCenterIcon /> Membresía
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Plan:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedPlan?.name || 'No seleccionado'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Duración:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {paymentTypes.find(pt => pt.value === formData.paymentType)?.label || 'No seleccionado'}
                        </Typography>
                      </Box>

                      {endDate && formData.paymentType !== 'visit' && (
                        <Box>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Vigencia hasta:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: colorTokens.brand }}>
                            <SafeDateLong dateString={endDate} />
                          </Typography>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>Total Final:</Typography>
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
              variant="outlined"
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={handleProcessSale}
              disabled={loading}
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                color: colorTokens.textOnBrand,
                fontWeight: 800,
                px: 6
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

export default memo(RegistrarMembresiaPage);