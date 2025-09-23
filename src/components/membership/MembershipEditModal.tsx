// components/membership/MembershipEditModal.tsx - CALCA LITERAL DEL REGISTRO
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
  Divider
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
  AddIcon,
  RemoveIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ TIPOS EXACTOS DEL REGISTRO
interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasCommission: boolean;
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

interface EditFormData {
  // Estados principales
  status: string;
  paymentMethod: string;
  paymentType: string;
  
  // Fechas
  start_date: string;
  end_date: string;
  
  // Montos
  amount_paid: number;
  subtotal: number;
  inscription_amount: number;
  discount_amount: number;
  commission_amount: number;
  commission_rate: number;
  
  // Pago mixto
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  
  // Efectivo
  paymentReceived: number;
  paymentChange: number;
  
  // Otros
  payment_reference: string;
  couponCode: string;
  notes: string;
  
  // Extensión manual
  extend_days: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  membership: any;
  onSave: (editData: EditFormData) => void;
  loading: boolean;
  formatDisplayDate: (date: string | null) => string;
  formatPrice: (price: number) => string;
  addDaysToDate: (dateString: string, days: number) => string;
}

// ✅ MÉTODOS DE PAGO IDÉNTICOS AL REGISTRO
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

// ✅ COMPONENTE PaymentMethodCard IDÉNTICO
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
  addDaysToDate
}) => {
  const [activeStep, setActiveStep] = useState(0);
  
  // ✅ ESTADO INICIAL BASADO EN MEMBERSHIP
  const [editData, setEditData] = useState<EditFormData>(() => {
    if (!membership) return {} as EditFormData;
    
    // Parsear payment_details si es string JSON
    let paymentDetails: PaymentDetail[] = [];
    if (membership.payment_details) {
      try {
        const parsed = typeof membership.payment_details === 'string' 
          ? JSON.parse(membership.payment_details)
          : membership.payment_details;
        paymentDetails = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Error parsing payment_details:', e);
      }
    }
    
    return {
      status: membership.status || 'active',
      paymentMethod: membership.payment_method || '',
      paymentType: membership.payment_type || '',
      start_date: membership.start_date || '',
      end_date: membership.end_date || '',
      amount_paid: membership.amount_paid || 0,
      subtotal: membership.subtotal || 0,
      inscription_amount: membership.inscription_amount || 0,
      discount_amount: membership.discount_amount || 0,
      commission_amount: membership.commission_amount || 0,
      commission_rate: membership.commission_rate || 0,
      isMixedPayment: membership.is_mixed_payment || false,
      paymentDetails: paymentDetails,
      paymentReceived: membership.payment_received || 0,
      paymentChange: membership.payment_change || 0,
      payment_reference: membership.payment_reference || '',
      couponCode: membership.coupon_code || '',
      notes: membership.notes || '',
      extend_days: 0
    };
  });

  if (!membership) return null;

  const handlePaymentMethodSelect = useCallback((method: string) => {
    setEditData(prev => ({
      ...prev,
      paymentMethod: method,
      isMixedPayment: method === 'mixto'
    }));
  }, []);

  const addMixedPaymentDetail = useCallback(() => {
    const newDetail: PaymentDetail = {
      id: Date.now().toString(),
      method: 'efectivo',
      amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      reference: '',
      sequence: editData.paymentDetails.length + 1
    };

    setEditData(prev => ({
      ...prev,
      paymentDetails: [...prev.paymentDetails, newDetail]
    }));
  }, [editData.paymentDetails.length]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    setEditData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.filter(detail => detail.id !== id)
    }));
  }, []);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    setEditData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map(detail => 
        detail.id === id ? { ...detail, [field]: value } : detail
      )
    }));
  }, []);

  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return true; // Información del cliente (no editable)
      case 1: return true; // Plan (no editable)
      case 2: return true; // Cupones opcionales
      case 3: 
        if (editData.isMixedPayment) {
          return editData.paymentDetails.length > 0 && 
                 editData.paymentDetails.every(detail => detail.amount > 0 && detail.method);
        } else {
          return editData.paymentMethod !== '';
        }
      default: return false;
    }
  }, [activeStep, editData]);

  const steps = [
    { label: 'Cliente', description: 'Información del cliente', icon: <PersonAddAltIcon /> },
    { label: 'Plan', description: 'Detalles de la membresía', icon: <FitnessCenterIcon /> },
    { label: 'Descuentos', description: 'Cupones aplicados', icon: <LocalOfferIcon /> },
    { label: 'Pago', description: 'Método de pago', icon: <PaymentIcon /> }
  ];

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
          {/* ✅ HEADER IGUAL AL REGISTRO */}
          <Paper sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colorTokens.textOnBrand,
                fontWeight: 800,
                fontSize: '2rem'
              }}>
                {membership.user_name.split(' ').map((n: string) => n[0]).join('')}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ 
                  color: colorTokens.brand, 
                  fontWeight: 800,
                  mb: 1
                }}>
                  {membership.user_name}
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: colorTokens.textSecondary,
                  mb: 2
                }}>
                  📧 {membership.user_email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={membership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                    sx={{
                      backgroundColor: membership.is_renewal ? colorTokens.warning : colorTokens.success,
                      color: membership.is_renewal ? colorTokens.textOnBrand : colorTokens.textPrimary,
                      fontWeight: 700
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
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" sx={{ 
                  color: colorTokens.brand,
                  fontWeight: 800
                }}>
                  {formatPrice(membership.amount_paid)}
                </Typography>
                <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                  {membership.payment_method}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* ✅ STEPPER IDÉNTICO AL REGISTRO */}
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

                        {/* PASO 1: Cliente (Solo Vista) */}
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

                        {/* PASO 2: Plan (Solo Vista + Estados) */}
                        {index === 1 && (
                          <Box sx={{ mb: 4 }}>
                            <Card sx={{
                              background: `${colorTokens.success}10`,
                              border: `1px solid ${colorTokens.success}30`,
                              borderRadius: 3,
                              mb: 3
                            }}>
                              <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ 
                                  color: colorTokens.success,
                                  fontWeight: 700,
                                  mb: 2
                                }}>
                                  🏋️‍♂️ Plan: {membership.plan_name}
                                </Typography>
                                <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                                  Tipo: {membership.payment_type.toUpperCase()}
                                </Typography>
                              </CardContent>
                            </Card>

                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Estado de la Membresía"
                                  select
                                  value={editData.status}
                                  onChange={(e) => setEditData(prev => ({...prev, status: e.target.value}))}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                                    }
                                  }}
                                >
                                  <MenuItem value="active">🔥 Activa</MenuItem>
                                  <MenuItem value="frozen">🧊 Congelada</MenuItem>
                                  <MenuItem value="expired">⏰ Expirada</MenuItem>
                                  <MenuItem value="cancelled">❌ Cancelada</MenuItem>
                                </TextField>
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Fecha de Inicio"
                                  type="date"
                                  value={editData.start_date}
                                  onChange={(e) => setEditData(prev => ({...prev, start_date: e.target.value}))}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Fecha de Vencimiento"
                                  type="date"
                                  value={editData.end_date}
                                  onChange={(e) => setEditData(prev => ({...prev, end_date: e.target.value}))}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Días a Extender"
                                  type="number"
                                  value={editData.extend_days}
                                  onChange={(e) => setEditData(prev => ({...prev, extend_days: parseInt(e.target.value) || 0}))}
                                  helperText="Solo extiende la fecha de vencimiento"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>

                            {editData.extend_days > 0 && (
                              <Alert severity="success" sx={{ mt: 2 }}>
                                Se extenderá {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''} la vigencia
                              </Alert>
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
                                />
                              </CardContent>
                            </Card>
                          </Box>
                        )}

                        {/* PASO 4: Pago - IDÉNTICO AL REGISTRO */}
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
                                      onChange={(e) => setEditData(prev => ({
                                        ...prev, 
                                        isMixedPayment: e.target.checked,
                                        paymentMethod: e.target.checked ? 'mixto' : ''
                                      }))}
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

                                  {/* Referencias */}
                                  <TextField
                                    fullWidth
                                    label="Referencia de Pago"
                                    value={editData.payment_reference}
                                    onChange={(e) => setEditData(prev => ({...prev, payment_reference: e.target.value}))}
                                    placeholder="Número de autorización, SPEI, etc."
                                    sx={{ mt: 3 }}
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
                                              />
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 4 }}>
                                              <TextField
                                                fullWidth
                                                label="Referencia"
                                                value={detail.reference}
                                                onChange={(e) => updateMixedPaymentDetail(detail.id, 'reference', e.target.value)}
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
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Comisión (%)"
                                  type="number"
                                  value={editData.commission_rate}
                                  onChange={(e) => setEditData(prev => ({...prev, commission_rate: parseFloat(e.target.value) || 0}))}
                                />
                              </Grid>
                            </Grid>

                            {/* Notas */}
                            <TextField
                              fullWidth
                              label="Notas del Registro"
                              multiline
                              rows={3}
                              value={editData.notes}
                              onChange={(e) => setEditData(prev => ({...prev, notes: e.target.value}))}
                              placeholder="Observaciones sobre esta venta..."
                              sx={{ mt: 3 }}
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
                              onClick={() => onSave(editData)}
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

            {/* Panel de Resumen - Igual al registro */}
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
                    p: 2,
                    background: `${colorTokens.brand}10`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body1">Total Final:</Typography>
                    <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                      {formatPrice(editData.amount_paid)}
                    </Typography>
                  </Box>

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
