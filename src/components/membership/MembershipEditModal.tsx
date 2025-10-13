// components/membership/MembershipEditModal.tsx - VERSIÓN COMPLETA CORREGIDA
'use client';

import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PersonAddAlt as PersonAddAltIcon,
  FitnessCenter as FitnessCenterIcon,
  LocalOffer as LocalOfferIcon,
  Payment as PaymentIcon,
  AttachMoney as AttachMoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';
import type { MembershipHistory, PaymentDetail, EditFormData, MembershipPlan, PaymentTypeOption } from '@/types/membership';

interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasCommission: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  membership: MembershipHistory | null;
  onSave: (editData: EditFormData) => void;
  loading: boolean;
  formatDisplayDate: (date: string | null) => string;
  formatPrice: (price: number) => string;
  addDaysToDate: (dateString: string, days: number) => string;
  plans: MembershipPlan[];
}

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

const PAYMENT_TYPE_OPTIONS: PaymentTypeOption[] = [
  { value: 'visit', label: 'Por Visita', key: 'visit_price', duration: 1 },
  { value: 'weekly', label: 'Semanal', key: 'weekly_price', duration: 'weekly_duration' },
  { value: 'biweekly', label: 'Quincenal', key: 'biweekly_price', duration: 'biweekly_duration' },
  { value: 'monthly', label: 'Mensual', key: 'monthly_price', duration: 'monthly_duration' },
  { value: 'bimonthly', label: 'Bimestral', key: 'bimonthly_price', duration: 'bimonthly_duration' },
  { value: 'quarterly', label: 'Trimestral', key: 'quarterly_price', duration: 'quarterly_duration' },
  { value: 'semester', label: 'Semestral', key: 'semester_price', duration: 'semester_duration' },
  { value: 'annual', label: 'Anual', key: 'annual_price', duration: 'annual_duration' }
];

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
    } : {}
  }), [disabled, selected, method.color]);

  return (
    <motion.div whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}}>
      <Card onClick={handleClick} sx={cardStyles}>
        <CardContent sx={{ 
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          p: 3
        }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
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

const MembershipEditModal = memo<Props>(({
  open,
  onClose,
  membership,
  onSave,
  loading,
  formatDisplayDate,
  formatPrice,
  addDaysToDate,
  plans
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [editData, setEditData] = useState<EditFormData>({
    status: '',
    planId: '',
    paymentMethod: '',
    paymentType: '',
    start_date: '',
    end_date: '',
    amount_paid: 0,
    subtotal: 0,
    inscription_amount: 0,
    discount_amount: 0,
    commission_amount: 0,
    commission_rate: 0,
    isRenewal: false,
    skipInscription: false,
    isMixedPayment: false,
    paymentDetails: [],
    paymentReceived: 0,
    paymentChange: 0,
    payment_reference: '',
    couponCode: '',
    notes: '',
    extend_days: 0
  });

  const handlePaymentMethodSelect = useCallback((method: string) => {
    setEditData(prev => {
      if (method === 'mixto') {
        return {
          ...prev,
          paymentMethod: method,
          isMixedPayment: true
        };
      }

      const baseDetail: PaymentDetail = {
        id: prev.paymentDetails[0]?.id || Date.now().toString(),
        method,
        amount: prev.paymentDetails[0]?.method === method ? prev.paymentDetails[0].amount : prev.amount_paid,
        commission_rate: prev.paymentDetails[0]?.commission_rate || 0,
        commission_amount: prev.paymentDetails[0]?.commission_amount || 0,
        reference: prev.payment_reference || prev.paymentDetails[0]?.reference || '',
        sequence: 1
      };

      return {
        ...prev,
        paymentMethod: method,
        isMixedPayment: false,
        paymentDetails: [baseDetail]
      };
    });
  }, []);

  const addMixedPaymentDetail = useCallback(() => {
    setEditData(prev => {
      const newDetail: PaymentDetail = {
        id: Date.now().toString(),
        method: 'efectivo',
        amount: 0,
        commission_rate: 0,
        commission_amount: 0,
        reference: '',
        sequence: prev.paymentDetails.length + 1
      };

      return {
        ...prev,
        paymentDetails: [...prev.paymentDetails, newDetail]
      };
    });
  }, []);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    setEditData(prev => {
      const filtered = prev.paymentDetails
        .filter(detail => detail.id !== id)
        .map((detail, index) => ({ ...detail, sequence: index + 1 }));

      return {
        ...prev,
        paymentDetails: filtered
      };
    });
  }, []);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    setEditData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map(detail => 
        detail.id === id ? { ...detail, [field]: value } : detail
      )
    }));
  }, []);

  const selectedPlan = useMemo(() => {
    if (!editData.planId) return undefined;
    return plans.find(plan => plan.id === editData.planId);
  }, [plans, editData.planId]);

  const availablePaymentTypes = useMemo(() => {
    if (!selectedPlan) return PAYMENT_TYPE_OPTIONS;
    return PAYMENT_TYPE_OPTIONS.filter(option => {
      const price = (selectedPlan as any)[option.key];
      return typeof price === 'number' && price > 0;
    });
  }, [selectedPlan]);

  const selectedPaymentTypeOption = useMemo(() => {
    return availablePaymentTypes.find(option => option.value === editData.paymentType) || null;
  }, [availablePaymentTypes, editData.paymentType]);

  const durationInDays = useMemo(() => {
    if (!selectedPlan || !selectedPaymentTypeOption) return null;
    const durationValue = selectedPaymentTypeOption.duration;
    if (typeof durationValue === 'number') return durationValue;
    const planDuration = (selectedPlan as any)[durationValue];
    return typeof planDuration === 'number' ? planDuration : null;
  }, [selectedPlan, selectedPaymentTypeOption]);

  const estimatedEndDate = useMemo(() => {
    if (!durationInDays || !editData.start_date) return null;
    try {
      return addDaysToDate(editData.start_date, durationInDays);
    } catch (error) {
      return null;
    }
  }, [addDaysToDate, durationInDays, editData.start_date]);

  const planBasePrice = useMemo(() => {
    if (!selectedPlan || !selectedPaymentTypeOption) return 0;
    const price = (selectedPlan as any)[selectedPaymentTypeOption.key];
    return typeof price === 'number' ? price : 0;
  }, [selectedPlan, selectedPaymentTypeOption]);

  const planInscriptionPrice = selectedPlan?.inscription_price ?? 0;

  const totalDetailAmount = useMemo(() => {
    return editData.paymentDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  }, [editData.paymentDetails]);

  const detailDifference = useMemo(() => {
    return Math.round((totalDetailAmount - (editData.amount_paid || 0)) * 100) / 100;
  }, [editData.amount_paid, totalDetailAmount]);

  const handlePlanSelect = useCallback((plan: MembershipPlan) => {
    setEditData(prev => {
      const nextPaymentTypes = PAYMENT_TYPE_OPTIONS.filter(option => {
        const price = (plan as any)[option.key];
        return typeof price === 'number' && price > 0;
      });

      const hasCurrentPaymentType = nextPaymentTypes.some(option => option.value === prev.paymentType);
      return {
        ...prev,
        planId: plan.id,
        paymentType: hasCurrentPaymentType ? prev.paymentType : (nextPaymentTypes[0]?.value || ''),
        inscription_amount: prev.skipInscription ? 0 : Number(plan.inscription_price || 0)
      };
    });
  }, []);

  const handlePaymentTypeSelect = useCallback((value: string) => {
    setEditData(prev => ({
      ...prev,
      paymentType: value
    }));
  }, []);

  const handleSkipInscriptionToggle = useCallback((checked: boolean) => {
    setEditData(prev => {
      const currentPlan = plans.find(plan => plan.id === prev.planId);
      return {
        ...prev,
        skipInscription: checked,
        inscription_amount: checked ? 0 : Number(currentPlan?.inscription_price ?? prev.inscription_amount)
      };
    });
  }, [plans]);

  const handleRenewalToggle = useCallback((checked: boolean) => {
    setEditData(prev => ({
      ...prev,
      isRenewal: checked
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const normalizedDetails = editData.paymentDetails.map((detail, index) => ({
      ...detail,
      sequence: index + 1
    }));

    onSave({
      ...editData,
      paymentDetails: normalizedDetails
    });
  }, [editData, onSave]);

  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return true;
      case 1:
        return Boolean(editData.planId && editData.paymentType && editData.status);
      case 2: return true;
      case 3: 
        if (editData.isMixedPayment) {
          const hasDetails = editData.paymentDetails.length > 0 && 
            editData.paymentDetails.every(detail => detail.amount > 0 && detail.method);
          const totalsMatch = Math.abs(totalDetailAmount - (editData.amount_paid || 0)) < 0.01;
          return hasDetails && totalsMatch;
        }
        return editData.paymentMethod !== '' && editData.paymentDetails.length > 0;
      default: return false;
    }
  }, [activeStep, editData, totalDetailAmount]);

  useEffect(() => {
    if (!membership) return;

    const paymentDetails: PaymentDetail[] = Array.isArray(membership.payment_details)
      ? membership.payment_details.map((detail, index) => ({
          id: detail.id || `${membership.id}-payment-${index}`,
          method: detail.method,
          amount: detail.amount || 0,
          commission_rate: detail.commission_rate || 0,
          commission_amount: detail.commission_amount || 0,
          reference: detail.reference || null,
          sequence: detail.sequence || index + 1,
          created_at: detail.created_at
        }))
      : [];

    if (!membership.is_mixed_payment && paymentDetails.length === 0) {
      paymentDetails.push({
        id: `${membership.id}-payment-single`,
        method: membership.payment_method || 'efectivo',
        amount: membership.amount_paid || 0,
        commission_rate: membership.commission_rate || 0,
        commission_amount: membership.commission_amount || 0,
        reference: membership.payment_reference || '',
        sequence: 1
      });
    }

    setEditData({
      status: membership.status || 'active',
      planId: membership.plan_id || '',
      paymentMethod: membership.is_mixed_payment ? 'mixto' : (paymentDetails[0]?.method || membership.payment_method || ''),
      paymentType: membership.payment_type || '',
      start_date: membership.start_date || '',
      end_date: membership.end_date || '',
      amount_paid: membership.amount_paid || 0,
      subtotal: membership.subtotal || 0,
      inscription_amount: membership.inscription_amount || 0,
      discount_amount: membership.discount_amount || 0,
      commission_amount: membership.commission_amount || 0,
      commission_rate: membership.commission_rate || 0,
      isRenewal: membership.is_renewal || false,
      skipInscription: membership.skip_inscription || false,
      isMixedPayment: membership.is_mixed_payment || false,
      paymentDetails: paymentDetails,
      paymentReceived: membership.payment_received || membership.amount_paid || 0,
      paymentChange: membership.payment_change || 0,
      payment_reference: membership.payment_reference || '',
      couponCode: membership.coupon_code || '',
      notes: membership.notes || '',
      extend_days: 0
    });

    setActiveStep(0);
  }, [membership]);

  useEffect(() => {
    if (!editData.isMixedPayment) return;
    const total = editData.paymentDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
    if (Math.abs(total - (editData.amount_paid || 0)) > 0.01) {
      setEditData(prev => ({
        ...prev,
        amount_paid: Math.round(total * 100) / 100
      }));
    }
  }, [editData.isMixedPayment, editData.paymentDetails, editData.amount_paid]);

  useEffect(() => {
    if (editData.isMixedPayment) return;
    if (editData.paymentDetails.length !== 1) return;
    const detail = editData.paymentDetails[0];
    if (Math.abs((detail.amount || 0) - (editData.amount_paid || 0)) < 0.01) return;

    setEditData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map((d, index) => index === 0
        ? { ...d, amount: prev.amount_paid }
        : d)
    }));
  }, [editData.isMixedPayment, editData.paymentDetails, editData.amount_paid]);

  useEffect(() => {
    if (!selectedPlan) return;
    if (availablePaymentTypes.length === 0) return;
    if (availablePaymentTypes.some(option => option.value === editData.paymentType)) return;

    const fallback = availablePaymentTypes[0];
    if (fallback) {
      setEditData(prev => ({
        ...prev,
        paymentType: fallback.value
      }));
    }
  }, [availablePaymentTypes, editData.paymentType, selectedPlan]);

  const renderUserAvatar = (userName: string, profileImage?: string) => {
    const initials = userName
      ? userName
          .trim()
          .split(/\s+/)
          .map(part => part.charAt(0).toUpperCase())
          .join('')
          .slice(0, 2)
      : 'MU';

    if (profileImage) {
      return (
        <Avatar
          src={profileImage}
          alt={userName}
          sx={{
            width: 96,
            height: 96,
            border: `4px solid ${colorTokens.brand}`,
            boxShadow: `0 8px 32px ${colorTokens.brand}40`
          }}
        >
          {initials}
        </Avatar>
      );
    }

    return (
      <Avatar
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
          color: colorTokens.textOnBrand,
          fontWeight: 700,
          fontSize: '2rem',
          border: `4px solid ${colorTokens.brand}`,
          boxShadow: `0 8px 32px ${colorTokens.brand}40`
        }}
      >
        {initials}
      </Avatar>
    );
  };

  const steps = useMemo(() => [
    { label: 'Cliente', description: 'Información del cliente', icon: <PersonAddAltIcon /> },
    { label: 'Plan', description: 'Detalles de la membresía', icon: <FitnessCenterIcon /> },
    { label: 'Descuentos', description: 'Cupones aplicados', icon: <LocalOfferIcon /> },
    { label: 'Pago', description: 'Método de pago', icon: <PaymentIcon /> }
  ], []);

  if (!membership) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
          border: `2px solid ${colorTokens.brand}50`,
          borderRadius: 4,
          color: colorTokens.neutral1200,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colorTokens.brand, 
        fontWeight: 800,
        fontSize: '1.8rem',
        textAlign: 'center',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EditIcon sx={{ fontSize: 40 }} />
          Editar Venta de Membresía
        </Box>
        <IconButton 
          onClick={onClose}
          disabled={loading}
          sx={{ color: colorTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        <Box sx={{ mt: 2 }}>
          {/* HEADER */}
          <Paper sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              {renderUserAvatar(
                membership.user_name,
                (membership as any).user_profile_image || (membership as any).profile_image
              )}

              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography variant="h5" sx={{ 
                  color: colorTokens.brand, 
                  fontWeight: 800,
                  mb: 0.5
                }}>
                  {membership.user_name}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  📧 {membership.user_email}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip 
                    label={membership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                    sx={{
                      backgroundColor: membership.is_renewal ? colorTokens.warning : colorTokens.success,
                      color: membership.is_renewal ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      fontWeight: 700
                    }}
                  />
                  <Chip 
                    label={`Estado: ${membership.status.toUpperCase()}`}
                    sx={{
                      backgroundColor: `${colorTokens.neutral400}20`,
                      color: colorTokens.textPrimary,
                      fontWeight: 600
                    }}
                  />
                  {membership.skip_inscription && (
                    <Chip 
                      label="🚫 SIN INSCRIPCIÓN" 
                      sx={{
                        backgroundColor: colorTokens.info,
                        color: colorTokens.textPrimary,
                        fontWeight: 700
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: 180 }}>
                <Typography variant="h3" sx={{ 
                  color: colorTokens.brand,
                  fontWeight: 800
                }}>
                  {formatPrice(membership.amount_paid)}
                </Typography>
                <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                  {membership.payment_method === 'mixto' ? 'Pago Mixto' : membership.payment_method?.toUpperCase()}
                </Typography>
                {membership.is_mixed_payment && membership.payment_method_breakdown && (
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 0.5 }}>
                    {membership.payment_method_breakdown}
                  </Typography>
                )}
                {!membership.is_mixed_payment && membership.payment_reference && (
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 0.5 }}>
                    Ref: {membership.payment_reference}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* STEPPER */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={{
                p: { xs: 2, sm: 4 },
                background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
                border: `1px solid ${colorTokens.neutral400}`,
                borderRadius: 3
              }}>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel sx={{
                        '& .MuiStepLabel-label': {
                          color: colorTokens.neutral1200,
                          fontWeight: activeStep === index ? 700 : 500,
                          fontSize: activeStep === index ? '1.1rem' : '1rem'
                        },
                        '& .MuiStepIcon-root': {
                          color: activeStep === index ? colorTokens.brand : colorTokens.neutral600,
                          fontSize: '2rem'
                        }
                      }}>
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        <Typography sx={{ color: colorTokens.neutral800, mb: 3 }}>
                          {step.description}
                        </Typography>

                        {/* PASO 1: Cliente */}
                        {index === 0 && (
                          <Box sx={{ mb: 4 }}>
                            <Alert severity="info" sx={{
                              backgroundColor: `${colorTokens.info}10`,
                              color: colorTokens.neutral1200,
                              border: `1px solid ${colorTokens.info}30`
                            }}>
                              La información del cliente no se puede modificar desde aquí.
                            </Alert>
                          </Box>
                        )}

                        {/* PASO 2: Plan */}
                        {index === 1 && (
                          <Stack spacing={3} sx={{ mb: 4 }}>
                            <Card sx={{
                              background: `${colorTokens.surfaceLevel3}30`,
                              border: `1px solid ${colorTokens.brand}30`,
                              borderRadius: 3
                            }}>
                              <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                  color: colorTokens.brand,
                                  fontWeight: 700,
                                  mb: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  <FitnessCenterIcon /> Catálogo de Membresías
                                </Typography>

                                {plans.length === 0 ? (
                                  <Alert severity="info">
                                    No hay planes activos disponibles. Comunícate con el administrador para crearlos.
                                  </Alert>
                                ) : (
                                  <Grid container spacing={3}>
                                    {plans.map(plan => {
                                      const isSelected = editData.planId === plan.id;
                                      const primaryPrice = PAYMENT_TYPE_OPTIONS.reduce((acc, option) => {
                                        const value = (plan as any)[option.key];
                                        if (typeof value === 'number' && value > 0 && acc === 0) {
                                          return value;
                                        }
                                        return acc;
                                      }, 0);

                                      return (
                                        <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <Card
                                              onClick={() => handlePlanSelect(plan)}
                                              sx={{
                                                cursor: 'pointer',
                                                borderRadius: 3,
                                                height: '100%',
                                                background: isSelected
                                                  ? `linear-gradient(135deg, ${colorTokens.brand}25, ${colorTokens.brand}10)`
                                                  : `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                                                border: isSelected
                                                  ? `2px solid ${colorTokens.brand}`
                                                  : `1px solid ${colorTokens.neutral400}`,
                                                transition: 'all 0.3s ease'
                                              }}
                                            >
                                              <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                  <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                                    {plan.name}
                                                  </Typography>
                                                  {isSelected && <CheckCircleIcon sx={{ color: colorTokens.brand }} />}
                                                </Box>
                                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, minHeight: 64, mb: 2 }}>
                                                  {plan.description || 'Sin descripción definida.'}
                                                </Typography>
                                                {primaryPrice > 0 && (
                                                  <Box sx={{
                                                    background: `${colorTokens.brand}10`,
                                                    borderRadius: 2,
                                                    p: 2,
                                                    textAlign: 'center'
                                                  }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
                                                      Desde {formatPrice(primaryPrice)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                                      Selecciona duración para ver precio exacto
                                                    </Typography>
                                                  </Box>
                                                )}
                                              </CardContent>
                                            </Card>
                                          </motion.div>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                )}
                              </CardContent>
                            </Card>

                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${colorTokens.neutral200}40`,
                                  border: `1px solid ${colorTokens.neutral400}60`,
                                  borderRadius: 3
                                }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ color: colorTokens.neutral1200, fontWeight: 700, mb: 2 }}>
                                      Configuración de vigencia
                                    </Typography>
                                    <Stack spacing={2}>
                                      <TextField
                                        fullWidth
                                        label="Estado de la Membresía"
                                        select
                                        value={editData.status}
                                        onChange={(e) => setEditData(prev => ({...prev, status: e.target.value}))}
                                      >
                                        <MenuItem value="active">🔥 Activa</MenuItem>
                                        <MenuItem value="frozen">🧊 Congelada</MenuItem>
                                        <MenuItem value="expired">⏰ Expirada</MenuItem>
                                        <MenuItem value="cancelled">❌ Cancelada</MenuItem>
                                      </TextField>

                                      <TextField
                                        fullWidth
                                        label="Fecha de Inicio"
                                        type="date"
                                        value={editData.start_date}
                                        onChange={(e) => setEditData(prev => ({...prev, start_date: e.target.value}))}
                                        InputLabelProps={{ shrink: true }}
                                      />

                                      <TextField
                                        fullWidth
                                        label="Fecha de Vencimiento"
                                        type="date"
                                        value={editData.end_date}
                                        onChange={(e) => setEditData(prev => ({...prev, end_date: e.target.value}))}
                                        InputLabelProps={{ shrink: true }}
                                        helperText={estimatedEndDate ? `Fin estimado según duración: ${formatDisplayDate(estimatedEndDate)}` : undefined}
                                      />

                                      <TextField
                                        fullWidth
                                        label="Días a Extender"
                                        type="number"
                                        value={editData.extend_days}
                                        onChange={(e) => setEditData(prev => ({...prev, extend_days: parseInt(e.target.value) || 0}))}
                                        helperText="Solo extiende la fecha de vencimiento"
                                      />

                                      {editData.extend_days > 0 && (
                                        <Alert severity="success">
                                          Se extenderá {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''} la vigencia
                                        </Alert>
                                      )}
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${colorTokens.brand}10`,
                                  border: `1px solid ${colorTokens.brand}30`,
                                  borderRadius: 3
                                }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700, mb: 2 }}>
                                      Configuración de pago
                                    </Typography>

                                    <Stack spacing={2}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={editData.skipInscription}
                                            onChange={(e) => handleSkipInscriptionToggle(e.target.checked)}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand }
                                            }}
                                          />
                                        }
                                        label={
                                          <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                              Exentar Inscripción
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                              {editData.skipInscription ? 'Inscripción exenta' : `Aplicar inscripción de ${formatPrice(planInscriptionPrice)}`}
                                            </Typography>
                                          </Box>
                                        }
                                      />

                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={editData.isRenewal}
                                            onChange={(e) => handleRenewalToggle(e.target.checked)}
                                            sx={{
                                              '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.warning },
                                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.warning }
                                            }}
                                          />
                                        }
                                        label={
                                          <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                              Marcar como renovación
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                              Ajustará reportes y eliminación automática de inscripción
                                            </Typography>
                                          </Box>
                                        }
                                      />

                                      <FormControl fullWidth>
                                        <InputLabel>Duración / tipo de pago</InputLabel>
                                        <Select
                                          value={editData.paymentType}
                                          label="Duración / tipo de pago"
                                          onChange={(e) => handlePaymentTypeSelect(e.target.value)}
                                          disabled={!selectedPlan}
                                        >
                                          {availablePaymentTypes.map(option => {
                                            const price = selectedPlan ? (selectedPlan as any)[option.key] : 0;
                                            if (selectedPlan && (typeof price !== 'number' || price <= 0)) {
                                              return null;
                                            }
                                            return (
                                              <MenuItem key={option.value} value={option.value}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                    {option.label}
                                                  </Typography>
                                                  {selectedPlan && typeof price === 'number' && price > 0 && (
                                                    <Typography variant="body2" sx={{ color: colorTokens.brand, fontWeight: 600 }}>
                                                      {formatPrice(price)}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              </MenuItem>
                                            );
                                          })}
                                        </Select>
                                      </FormControl>

                                      {selectedPlan && (
                                        <Box sx={{
                                          background: `${colorTokens.neutral200}30`,
                                          borderRadius: 2,
                                          p: 2
                                        }}>
                                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                            Precio base sugerido:
                                          </Typography>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
                                            {planBasePrice > 0 ? formatPrice(planBasePrice) : 'Seleccione duración'}
                                          </Typography>
                                          {estimatedEndDate && (
                                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                              Fin estimado: {formatDisplayDate(estimatedEndDate)}
                                            </Typography>
                                          )}
                                        </Box>
                                      )}

                                      <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            fullWidth
                                            label="Subtotal (sin comisión)"
                                            type="number"
                                            value={editData.subtotal || ''}
                                            onChange={(e) => setEditData(prev => ({
                                              ...prev,
                                              subtotal: parseFloat(e.target.value) || 0
                                            }))}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            fullWidth
                                            label="Inscripción"
                                            type="number"
                                            value={editData.inscription_amount || ''}
                                            onChange={(e) => setEditData(prev => ({
                                              ...prev,
                                              inscription_amount: parseFloat(e.target.value) || 0,
                                              skipInscription: parseFloat(e.target.value) === 0
                                            }))}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            fullWidth
                                            label="Descuento"
                                            type="number"
                                            value={editData.discount_amount || ''}
                                            onChange={(e) => setEditData(prev => ({
                                              ...prev,
                                              discount_amount: parseFloat(e.target.value) || 0
                                            }))}
                                          />
                                        </Grid>
                                      </Grid>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>
                          </Stack>
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
                                  fontWeight: 700
                                }}>
                                  <LocalOfferIcon sx={{ mr: 2 }} />
                                  Cupón Aplicado
                                </Typography>
                                
                                <TextField
                                  fullWidth
                                  label="Código de Cupón"
                                  value={editData.couponCode}
                                  onChange={(e) => setEditData(prev => ({...prev, couponCode: e.target.value}))}
                                  placeholder="Código del cupón aplicado..."
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <LocalOfferIcon sx={{ color: colorTokens.brand }} />
                                      </InputAdornment>
                                    )
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': {
                                        borderColor: colorTokens.brand
                                      }
                                    }
                                  }}
                                />
                              </CardContent>
                            </Card>
                          </Box>
                        )}

                        {/* PASO 4: Pago */}
                        {index === 3 && (
                          <Box sx={{ mb: 4 }}>
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
                                      checked={editData.isMixedPayment}
                                      onChange={(e) => setEditData(prev => {
                                        if (e.target.checked) {
                                          return {
                                            ...prev,
                                            isMixedPayment: true,
                                            paymentMethod: 'mixto'
                                          };
                                        }

                                        const existingDetail = prev.paymentDetails[0];
                                        const fallbackDetail: PaymentDetail = existingDetail
                                          ? { ...existingDetail, sequence: 1 }
                                          : {
                                              id: Date.now().toString(),
                                              method: prev.paymentMethod && prev.paymentMethod !== 'mixto' ? prev.paymentMethod : 'efectivo',
                                              amount: prev.amount_paid,
                                              commission_rate: 0,
                                              commission_amount: 0,
                                              reference: prev.payment_reference || '',
                                              sequence: 1
                                            };

                                        return {
                                          ...prev,
                                          isMixedPayment: false,
                                          paymentMethod: fallbackDetail.method,
                                          paymentDetails: [fallbackDetail]
                                        };
                                      })}
                                      sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand }
                                      }}
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="h6" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                                        Pago Mixto
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                                        Combinar múltiples métodos de pago
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </CardContent>
                            </Card>

                            {/* Pago Simple */}
                            {!editData.isMixedPayment && (
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
                                          selected={editData.paymentMethod === method.value}
                                          onSelect={() => handlePaymentMethodSelect(method.value)}
                                        />
                                      </Grid>
                                    ))}
                                  </Grid>

                                  <TextField
                                    fullWidth
                                    label="Referencia de Pago"
                                    value={editData.payment_reference}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEditData(prev => ({
                                        ...prev,
                                        payment_reference: value,
                                        paymentDetails: prev.paymentDetails.length > 0
                                          ? prev.paymentDetails.map((detail, index) => index === 0
                                            ? { ...detail, reference: value }
                                            : detail)
                                          : prev.paymentDetails
                                      }));
                                    }}
                                    placeholder="Número de autorización, SPEI, etc."
                                    sx={{ 
                                      mt: 3,
                                      '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                          borderColor: colorTokens.brand
                                        }
                                      }
                                    }}
                                  />
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Pago Mixto */}
                            {editData.isMixedPayment && (
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
                                      fontWeight: 700
                                    }}>
                                      Pagos Mixtos
                                    </Typography>
                                    
                                    <Button
                                      variant="contained"
                                      startIcon={<AddIcon />}
                                      onClick={addMixedPaymentDetail}
                                      sx={{
                                        background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}DD)`,
                                        color: colorTokens.neutral0
                                      }}
                                    >
                                      Agregar Método
                                    </Button>
                                  </Box>

                                  <Stack spacing={3}>
                                    {editData.paymentDetails.map((detail, index) => (
                                      <Card key={detail.id} sx={{
                                        background: `${colorTokens.neutral300}05`,
                                        border: `1px solid ${colorTokens.neutral400}`
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
                                            >
                                              <RemoveIcon />
                                            </IconButton>
                                          </Box>

                                          <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                              <FormControl fullWidth>
                                                <InputLabel>Método</InputLabel>
                                                <Select
                                                  value={detail.method}
                                                  onChange={(e) => updateMixedPaymentDetail(detail.id, 'method', e.target.value)}
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
                                                onChange={(e) => updateMixedPaymentDetail(detail.id, 'amount', parseFloat(e.target.value) || 0)}
                                                InputProps={{
                                                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                                sx={{
                                                  '& .MuiOutlinedInput-root': {
                                                    '&.Mui-focused fieldset': {
                                                      borderColor: colorTokens.brand
                                                    }
                                                  }
                                                }}
                                              />
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 4 }}>
                                              <TextField
                                                fullWidth
                                                label="Referencia"
                                                value={detail.reference}
                                                onChange={(e) => updateMixedPaymentDetail(detail.id, 'reference', e.target.value)}
                                                placeholder="Opcional"
                                                sx={{
                                                  '& .MuiOutlinedInput-root': {
                                                    '&.Mui-focused fieldset': {
                                                      borderColor: colorTokens.brand
                                                    }
                                                  }
                                                }}
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

                            {/* Montos y Referencias */}
                            <Grid container spacing={3} sx={{ mt: 2 }}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Monto Total Pagado"
                                  type="number"
                                  value={editData.amount_paid}
                                  onChange={(e) => setEditData(prev => ({...prev, amount_paid: parseFloat(e.target.value) || 0}))}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon /></InputAdornment>
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': {
                                        borderColor: colorTokens.brand
                                      }
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Comisión (%)"
                                  type="number"
                                  value={editData.commission_rate}
                                  onChange={(e) => setEditData(prev => ({...prev, commission_rate: parseFloat(e.target.value) || 0}))}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': {
                                        borderColor: colorTokens.brand
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>

                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 2,
                              color: Math.abs(detailDifference) < 0.01 ? colorTokens.success : colorTokens.warning,
                              fontWeight: 600
                            }}>
                              <CheckCircleIcon fontSize="small" />
                              {Math.abs(detailDifference) < 0.01
                                ? 'El total coincide con la suma de los métodos de pago.'
                                : `Diferencia detectada de ${formatPrice(Math.abs(detailDifference))}`}
                            </Box>

                            <TextField
                              fullWidth
                              label="Notas del Registro"
                              multiline
                              rows={3}
                              value={editData.notes}
                              onChange={(e) => setEditData(prev => ({...prev, notes: e.target.value}))}
                              placeholder="Observaciones sobre esta venta..."
                              sx={{ 
                                mt: 3,
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: colorTokens.brand
                                  }
                                }
                              }}
                            />
                          </Box>
                        )}

                        {/* Botones de navegación */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                          <Button
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep(prev => prev - 1)}
                            sx={{ color: colorTokens.neutral800 }}
                          >
                            ← Anterior
                          </Button>
                          
                          {activeStep === steps.length - 1 ? (
                            <Button
                              variant="contained"
                              onClick={handleSubmit}
                              disabled={loading || !canProceedToNextStep()}
                              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                              sx={{
                                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`,
                                color: colorTokens.neutral0
                              }}
                            >
                              {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={() => setActiveStep(prev => prev + 1)}
                              disabled={!canProceedToNextStep()}
                              sx={{
                                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}DD)`,
                                color: colorTokens.neutral0
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

            {/* Panel de Resumen */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{
                p: 3,
                background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
                border: `2px solid ${colorTokens.brand}30`,
                borderRadius: 3,
                position: 'sticky',
                top: 20
              }}>
                <Typography variant="h6" sx={{ 
                  color: colorTokens.brand, 
                  mb: 3, 
                  fontWeight: 700
                }}>
                  📊 Resumen de Cambios
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    background: `${colorTokens.brand}10`,
                    borderRadius: 2,
                    p: 2
                  }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Plan seleccionado
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedPlan ? selectedPlan.name : membership.plan_name}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    background: `${colorTokens.neutral200}40`
                  }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      Tipo de duración
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedPaymentTypeOption ? selectedPaymentTypeOption.label : (membership.payment_type?.toUpperCase() || 'N/A')}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      label={editData.isMixedPayment ? 'Pago mixto activo' : `Método: ${editData.paymentMethod || membership.payment_method}`}
                      sx={{
                        backgroundColor: editData.isMixedPayment ? `${colorTokens.warning}20` : `${colorTokens.brand}20`,
                        color: colorTokens.textPrimary,
                        fontWeight: 600
                      }}
                    />
                    {editData.isRenewal && (
                      <Chip
                        label="Renovación"
                        sx={{ backgroundColor: `${colorTokens.warning}20`, color: colorTokens.warning, fontWeight: 600 }}
                      />
                    )}
                    {editData.skipInscription && (
                      <Chip
                        label="Inscripción exenta"
                        sx={{ backgroundColor: `${colorTokens.info}20`, color: colorTokens.info, fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    background: `${colorTokens.brand}10`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body1">Total Final:</Typography>
                    <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                      {formatPrice(editData.amount_paid)}
                    </Typography>
                  </Box>

                  {editData.isMixedPayment && Math.abs(detailDifference) > 0.01 && (
                    <Alert severity="warning">
                      Diferencia detectada entre detalle y total: {formatPrice(detailDifference)}
                    </Alert>
                  )}

                  {editData.extend_days > 0 && (
                    <Alert severity="info">
                      Se extenderá {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''} la vigencia
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
});

MembershipEditModal.displayName = 'MembershipEditModal';

export default MembershipEditModal;