// components/membership/MembershipEditModal.tsx - MODAL DE EDICIÓN ENTERPRISE
'use client';

import React, { memo } from 'react';
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
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AcUnit as AcUnitIcon,
  Percent as PercentIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  FitnessCenter as FitnessCenterIcon,
  Payment as PaymentIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { MembershipHistory, EditData, StatusOption, PaymentMethodOption } from '@/types/membership';

interface Props {
  open: boolean;
  onClose: () => void;
  membership: MembershipHistory | null;
  editData: EditData;
  onEditDataChange: (data: EditData) => void;
  onSave: () => void;
  loading: boolean;
  formatDisplayDate: (date: string | null) => string;
  formatPrice: (price: number) => string;
  addDaysToDate: (dateString: string, days: number) => string;
  statusOptions: StatusOption[];
  paymentMethodOptions: PaymentMethodOption[];
}

const MembershipEditModal = memo<Props>(({
  open,
  onClose,
  membership,
  editData,
  onEditDataChange,
  onSave,
  loading,
  formatDisplayDate,
  formatPrice,
  addDaysToDate,
  statusOptions,
  paymentMethodOptions
}) => {
  if (!membership) return null;

  const paymentDetailsFromDB = membership.payment_details || {};
  const showMixedPaymentFields = editData.payment_method === 'mixto' || membership.payment_method === 'mixto';

  const handleInputChange = (field: keyof EditData, value: any) => {
    onEditDataChange({ ...editData, [field]: value });
  };

  const handlePaymentMethodChange = (newMethod: string) => {
    onEditDataChange({
      ...editData,
      payment_method: newMethod,
      cash_amount: newMethod === 'mixto' ? (editData.cash_amount || paymentDetailsFromDB.cash_amount || 0) : 0,
      card_amount: newMethod === 'mixto' ? (editData.card_amount || paymentDetailsFromDB.card_amount || 0) : 0,
      transfer_amount: newMethod === 'mixto' ? (editData.transfer_amount || paymentDetailsFromDB.transfer_amount || 0) : 0
    });
  };

  const handleCommissionRateChange = (rate: number) => {
    const amount = editData.amount_paid || membership.amount_paid;
    const commissionAmount = amount * (rate / 100);
    onEditDataChange({
      ...editData,
      commission_rate: rate,
      commission_amount: commissionAmount
    });
  };

  const handleAmountChange = (amount: number) => {
    const commissionRate = editData.commission_rate || membership.commission_rate || 0;
    const commissionAmount = amount * (commissionRate / 100);
    onEditDataChange({
      ...editData,
      amount_paid: amount,
      commission_amount: commissionAmount
    });
  };

  // Cálculo del total de pago mixto
  const mixedPaymentTotal = (editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0) +
                           (editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0) +
                           (editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0);

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}50`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
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
          Editar Registro de Venta
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
          {/* ✅ HEADER DEL CLIENTE */}
          <Card sx={{
            background: `${colorTokens.brand}15`,
            border: `2px solid ${colorTokens.brand}40`,
            borderRadius: 4,
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  fontSize: '2rem',
                  boxShadow: `0 8px 32px ${colorTokens.brand}40`
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
                  <Typography variant="body1" sx={{ 
                    color: colorTokens.textPrimary,
                    fontWeight: 600
                  }}>
                    🏋️‍♂️ {membership.plan_name} • {membership.payment_type.toUpperCase()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end', mb: 2 }}>
                    <Chip 
                      label={membership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                      sx={{
                        backgroundColor: membership.is_renewal ? colorTokens.warning : colorTokens.success,
                        color: membership.is_renewal ? colorTokens.textOnBrand : colorTokens.textPrimary,
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    />
                    {membership.skip_inscription && (
                      <Chip 
                        label="🚫 SIN INSCRIPCIÓN" 
                        sx={{
                          backgroundColor: colorTokens.info,
                          color: colorTokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h4" sx={{ 
                    color: colorTokens.brand,
                    fontWeight: 800
                  }}>
                    {formatPrice(membership.amount_paid)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    📅 {formatDisplayDate(membership.created_at)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* ✅ SECCIÓN DE ESTADO Y CONFIGURACIÓN BÁSICA */}
            <Grid size={12}>
              <Card sx={{
                background: `${colorTokens.warning}10`,
                border: `1px solid ${colorTokens.warning}30`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.warning,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <EditIcon />
                    ⚙️ Configuración Básica
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ 
                          color: colorTokens.textSecondary,
                          fontSize: '1.1rem',
                          '&.Mui-focused': { color: colorTokens.warning }
                        }}>
                          Estado de la Membresía
                        </InputLabel>
                        <Select
                          value={editData.status || membership.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          sx={{
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.warning}40`,
                              borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning
                            }
                          }}
                        >
                          {statusOptions.filter(s => s.value !== '').map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ 
                          color: colorTokens.textSecondary,
                          fontSize: '1.1rem',
                          '&.Mui-focused': { color: colorTokens.warning }
                        }}>
                          Método de Pago
                        </InputLabel>
                        <Select
                          value={editData.payment_method || membership.payment_method}
                          onChange={(e) => handlePaymentMethodChange(e.target.value)}
                          sx={{
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.warning}40`,
                              borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning
                            }
                          }}
                        >
                          {paymentMethodOptions.filter(p => p.value !== '').map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ CAMPOS PARA PAGO MIXTO */}
            {showMixedPaymentFields && (
              <Grid size={12}>
                <Card sx={{
                  background: `${colorTokens.info}10`,
                  border: `1px solid ${colorTokens.info}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.info,
                      fontWeight: 700,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <PaymentIcon />
                      💳 Desglose de Pago Mixto
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Efectivo"
                          type="number"
                          value={editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0}
                          onChange={(e) => handleInputChange('cash_amount', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">💵</InputAdornment>,
                            sx: {
                              color: colorTokens.textPrimary,
                              fontSize: '1.1rem',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${colorTokens.success}40`,
                                borderWidth: 2
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colorTokens.success
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colorTokens.success
                              }
                            }
                          }}
                          InputLabelProps={{
                            sx: { 
                              color: colorTokens.textSecondary,
                              fontSize: '1.1rem',
                              '&.Mui-focused': { color: colorTokens.success }
                            }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Tarjeta"
                          type="number"
                          value={editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0}
                          onChange={(e) => handleInputChange('card_amount', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">💳</InputAdornment>,
                            sx: {
                              color: colorTokens.textPrimary,
                              fontSize: '1.1rem',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${colorTokens.info}40`,
                                borderWidth: 2
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colorTokens.info
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colorTokens.info
                              }
                            }
                          }}
                          InputLabelProps={{
                            sx: { 
                              color: colorTokens.textSecondary,
                              fontSize: '1.1rem',
                              '&.Mui-focused': { color: colorTokens.info }
                            }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Transferencia"
                          type="number"
                          value={editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0}
                          onChange={(e) => handleInputChange('transfer_amount', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">🏦</InputAdornment>,
                            sx: {
                              color: colorTokens.textPrimary,
                              fontSize: '1.1rem',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${colorTokens.warning}40`,
                                borderWidth: 2
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
                              color: colorTokens.textSecondary,
                              fontSize: '1.1rem',
                              '&.Mui-focused': { color: colorTokens.warning }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Total calculado */}
                    <Box sx={{ 
                      mt: 3,
                      p: 3,
                      background: `${colorTokens.brand}10`,
                      border: `2px solid ${colorTokens.brand}30`,
                      borderRadius: 3,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: colorTokens.brand,
                        fontWeight: 700,
                        mb: 1
                      }}>
                        Total Calculado: {formatPrice(mixedPaymentTotal)}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: colorTokens.textSecondary
                      }}>
                        🧮 {(editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0) > 0 && `💵 ${formatPrice(editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0)}`}
                        {(editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0) > 0 && (editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0) > 0 && ' + '}
                        {(editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0) > 0 && `💳 ${formatPrice(editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0)}`}
                        {((editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0) > 0 || (editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0) > 0) && (editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0) > 0 && ' + '}
                        {(editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0) > 0 && `🏦 ${formatPrice(editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0)}`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* ✅ FECHAS Y VIGENCIA */}
            <Grid size={12}>
              <Card sx={{
                background: `${colorTokens.success}10`,
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.success,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <CalendarTodayIcon />
                    📅 Fechas y Vigencia
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Fecha de Inicio"
                        type="date"
                        value={editData.start_date || membership.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            color: colorTokens.textSecondary,
                            fontSize: '1.1rem',
                            '&.Mui-focused': { color: colorTokens.success }
                          }
                        }}
                        InputProps={{
                          sx: {
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.success}40`,
                              borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Fecha de Vencimiento"
                        type="date"
                        value={editData.end_date || membership.end_date || ''}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { 
                            color: colorTokens.textSecondary,
                            fontSize: '1.1rem',
                            '&.Mui-focused': { color: colorTokens.success }
                          }
                        }}
                        InputProps={{
                          sx: {
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.success}40`,
                              borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ MONTOS Y COMISIONES */}
            <Grid size={12}>
              <Card sx={{
                background: `${colorTokens.brand}10`,
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
                    gap: 2
                  }}>
                    <AttachMoneyIcon />
                    💰 Montos y Comisiones
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Monto Total Pagado"
                        type="number"
                        value={editData.amount_paid || membership.amount_paid}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoneyIcon sx={{ color: colorTokens.brand }} /></InputAdornment>,
                          sx: {
                            color: colorTokens.textPrimary,
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
                            color: colorTokens.textSecondary,
                            fontSize: '1.1rem',
                            '&.Mui-focused': { color: colorTokens.brand }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Comisión (%)"
                        type="number"
                        value={editData.commission_rate || membership.commission_rate || 0}
                        onChange={(e) => handleCommissionRateChange(parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><PercentIcon sx={{ color: colorTokens.warning }} /></InputAdornment>,
                          sx: {
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.warning}40`,
                              borderWidth: 2
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
                            color: colorTokens.textSecondary,
                            fontSize: '1.1rem',
                            '&.Mui-focused': { color: colorTokens.warning }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{
                        background: `${colorTokens.success}10`,
                        border: `1px solid ${colorTokens.success}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        height: '56px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Comisión Total
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                          {formatPrice(editData.commission_amount || membership.commission_amount || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ REFERENCIA DE PAGO */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Referencia de Pago"
                value={editData.payment_reference || membership.payment_reference || ''}
                onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                placeholder="Número de autorización, SPEI, folio, etc."
                InputProps={{
                  startAdornment: <InputAdornment position="start">📄</InputAdornment>,
                  sx: {
                    color: colorTokens.textPrimary,
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
                    color: colorTokens.textSecondary,
                    fontSize: '1.1rem',
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            {/* ✅ EXTENSIÓN MANUAL */}
            <Grid size={12}>
              <Card sx={{
                background: `${colorTokens.info}10`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.info,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <AcUnitIcon />
                    📅 Extensión Manual de Vigencia
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{
                        background: `${colorTokens.neutral400}10`,
                        border: `1px solid ${colorTokens.neutral400}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Días Congelados Históricos
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: colorTokens.info,
                          fontWeight: 700
                        }}>
                          🧊 {membership.total_frozen_days || 0} días
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{
                        background: `${colorTokens.neutral400}10`,
                        border: `1px solid ${colorTokens.neutral400}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Vencimiento Actual
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: colorTokens.textPrimary,
                          fontWeight: 600
                        }}>
                          📅 {membership.end_date ? formatDisplayDate(membership.end_date) : 'Sin fecha'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Días a Extender"
                        type="number"
                        value={editData.extend_days || 0}
                        onChange={(e) => handleInputChange('extend_days', parseInt(e.target.value) || 0)}
                        placeholder="Ej: 1"
                        helperText="Solo extiende la fecha de vencimiento"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">📅</InputAdornment>,
                          sx: {
                            color: colorTokens.textPrimary,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.info}40`,
                              borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.info
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.info
                            }
                          }
                        }}
                        InputLabelProps={{
                          sx: { 
                            color: colorTokens.textSecondary,
                            fontSize: '1.1rem',
                            '&.Mui-focused': { color: colorTokens.info }
                          }
                        }}
                        FormHelperTextProps={{
                          sx: { color: colorTokens.textSecondary }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{
                        background: `${colorTokens.brand}10`,
                        border: `1px solid ${colorTokens.brand}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Nueva Fecha
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: colorTokens.brand,
                          fontWeight: 700
                        }}>
                          📅 {(() => {
                            if (!membership.end_date || !editData.extend_days) {
                              return membership.end_date ? formatDisplayDate(membership.end_date) : 'Sin fecha';
                            }
                            const newEndDate = addDaysToDate(membership.end_date, editData.extend_days);
                            return formatDisplayDate(newEndDate);
                          })()}
                        </Typography>
                      </Box>
                    </Grid>

                    {editData.extend_days && editData.extend_days > 0 && (
                      <Grid size={12}>
                        <Alert 
                          severity="success"
                          sx={{
                            backgroundColor: `${colorTokens.success}10`,
                            color: colorTokens.textPrimary,
                            border: `1px solid ${colorTokens.success}30`,
                            '& .MuiAlert-icon': { color: colorTokens.success }
                          }}
                        >
                          <Typography variant="body2">
                            <strong>📅 Extensión de Vigencia:</strong> Se extenderá la fecha de vencimiento por {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''}.<br/>
                            <strong>🧊 Diferencia con congelamiento:</strong> Esto NO se registra como días congelados, solo extiende la vigencia manualmente.
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* ✅ NOTAS */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notas del Registro"
                multiline
                rows={3}
                value={editData.notes || membership.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observaciones sobre esta venta, correcciones realizadas, etc..."
                InputProps={{
                  sx: {
                    color: colorTokens.textPrimary,
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
                    color: colorTokens.textSecondary,
                    fontSize: '1.1rem',
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* ✅ ALERTA DE CONFIRMACIÓN */}
          <Alert 
            severity="warning"
            sx={{
              mt: 3,
              backgroundColor: `${colorTokens.warning}10`,
              color: colorTokens.textPrimary,
              border: `1px solid ${colorTokens.warning}30`,
              '& .MuiAlert-icon': { color: colorTokens.warning }
            }}
          >
            <Typography variant="body2">
              <strong>⚠️ Edición de Registro:</strong> Solo modifique datos para corregir errores en el registro original.
              {editData.extend_days && editData.extend_days > 0 && (
                <>
                  <br/><strong>📅 Extensión Manual:</strong> Se extenderá la vigencia por {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''} (no cuenta como congelamiento).
                </>
              )}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: colorTokens.neutral400,
            px: 3,
            py: 1
          }}
          variant="outlined"
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={onSave}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <SaveIcon />}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4,
            py: 1,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
              transform: 'translateY(-1px)'
            }
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Correcciones'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

MembershipEditModal.displayName = 'MembershipEditModal';

export default MembershipEditModal;
