'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  roleAdmin: '#E91E63'
};

// 💰 Función para formatear precios
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

// 📅 Función para formatear fechas
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

interface DailyData {
  date: string;
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

interface CutFormData {
  cut_date: string;
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  pos_mixto: number;
  pos_total: number;
  pos_transactions: number;
  pos_commissions: number;
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_mixto: number;
  membership_total: number;
  membership_transactions: number;
  membership_commissions: number;
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  abonos_mixto: number;
  abonos_total: number;
  abonos_transactions: number;
  abonos_commissions: number;
  expenses_amount: number;
  notes: string;
}

export default function NuevoCorte() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // 📅 Fecha actual en Monterrey
  const [selectedDate] = useState(() => {
    const now = new Date();
    const monterreyTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    return monterreyTime.toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState<CutFormData>({
    cut_date: selectedDate,
    pos_efectivo: 0,
    pos_transferencia: 0,
    pos_debito: 0,
    pos_credito: 0,
    pos_mixto: 0,
    pos_total: 0,
    pos_transactions: 0,
    pos_commissions: 0,
    membership_efectivo: 0,
    membership_transferencia: 0,
    membership_debito: 0,
    membership_credito: 0,
    membership_mixto: 0,
    membership_total: 0,
    membership_transactions: 0,
    membership_commissions: 0,
    abonos_efectivo: 0,
    abonos_transferencia: 0,
    abonos_debito: 0,
    abonos_credito: 0,
    abonos_mixto: 0,
    abonos_total: 0,
    abonos_transactions: 0,
    abonos_commissions: 0,
    expenses_amount: 0,
    notes: ''
  });

  // ✅ CARGAR DATOS DEL DÍA
  useEffect(() => {
    const loadDailyData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`);
        const data = await response.json();
        
        if (data.success) {
          setDailyData(data);
          
          // Pre-llenar formulario con datos del día
          setFormData(prev => ({
            ...prev,
            pos_efectivo: data.pos.efectivo,
            pos_transferencia: data.pos.transferencia,
            pos_debito: data.pos.debito,
            pos_credito: data.pos.credito,
            pos_mixto: data.pos.mixto,
            pos_total: data.pos.total,
            pos_transactions: data.pos.transactions,
            pos_commissions: data.pos.commissions,
            membership_efectivo: data.memberships.efectivo,
            membership_transferencia: data.memberships.transferencia,
            membership_debito: data.memberships.debito,
            membership_credito: data.memberships.credito,
            membership_mixto: data.memberships.mixto,
            membership_total: data.memberships.total,
            membership_transactions: data.memberships.transactions,
            membership_commissions: data.memberships.commissions,
            abonos_efectivo: data.abonos.efectivo,
            abonos_transferencia: data.abonos.transferencia,
            abonos_debito: data.abonos.debito,
            abonos_credito: data.abonos.credito,
            abonos_mixto: data.abonos.mixto,
            abonos_total: data.abonos.total,
            abonos_transactions: data.abonos.transactions,
            abonos_commissions: data.abonos.commissions
          }));
        } else {
          setError('Error al cargar datos del día');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar datos del día');
      } finally {
        setLoading(false);
      }
    };

    loadDailyData();
  }, [selectedDate]);

  // 💾 GUARDAR CORTE
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/cuts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/admin/cortes');
        }, 2000);
      } else {
        setError(result.error || 'Error al guardar el corte');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar el corte');
    } finally {
      setSaving(false);
    }
  };

  // 🧮 CALCULAR TOTALES DINÁMICOS
  const calculateTotals = () => {
    const totalEfectivo = formData.pos_efectivo + formData.membership_efectivo + formData.abonos_efectivo;
    const totalTransferencia = formData.pos_transferencia + formData.membership_transferencia + formData.abonos_transferencia;
    const totalDebito = formData.pos_debito + formData.membership_debito + formData.abonos_debito;
    const totalCredito = formData.pos_credito + formData.membership_credito + formData.abonos_credito;
    const totalMixto = formData.pos_mixto + formData.membership_mixto + formData.abonos_mixto;
    const grandTotal = totalEfectivo + totalTransferencia + totalDebito + totalCredito + totalMixto;
    const totalTransactions = formData.pos_transactions + formData.membership_transactions + formData.abonos_transactions;
    const totalCommissions = formData.pos_commissions + formData.membership_commissions + formData.abonos_commissions;
    const netAmount = grandTotal - totalCommissions;
    const finalBalance = netAmount - formData.expenses_amount;

    return {
      totalEfectivo,
      totalTransferencia,
      totalDebito,
      totalCredito,
      totalMixto,
      grandTotal,
      totalTransactions,
      totalCommissions,
      netAmount,
      finalBalance
    };
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 4
    }}>
      {/* 🏷️ HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.roleAdmin, 
            width: 50, 
            height: 50 
          }}>
            <ReceiptIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              Crear Nuevo Corte
            </Typography>
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              📅 {formatDate(selectedDate)} • Corte de caja del día
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/admin/cortes')}
            sx={{
              borderColor: darkProTokens.grayMedium,
              color: darkProTokens.textSecondary,
              '&:hover': {
                borderColor: darkProTokens.grayLight,
                backgroundColor: `${darkProTokens.grayMedium}20`
              }
            }}
          >
            Volver
          </Button>
          
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 3
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Corte'}
          </Button>
        </Box>
      </Box>

      {/* 🔄 ESTADOS */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={40} sx={{ color: darkProTokens.roleAdmin }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Corte guardado exitosamente. Redirigiendo...
        </Alert>
      )}

      {/* 📊 FORMULARIO PRINCIPAL */}
      {!loading && dailyData && (
        <Grid container spacing={4}>
          {/* 📈 RESUMEN CONSOLIDADO */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.roleAdmin}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                    💰 Resumen Consolidado
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(totals.grandTotal)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Ingresos Totales
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(totals.totalCommissions)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Comisiones
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                          {formatPrice(formData.expenses_amount)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Gastos
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(totals.netAmount)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Monto Neto
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ 
                          color: totals.finalBalance >= 0 ? darkProTokens.success : darkProTokens.error 
                        }}>
                          {formatPrice(totals.finalBalance)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Balance Final
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 💸 GASTOS DEL DÍA */}
          <Grid xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.error}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.error, mb: 3 }}>
                    💸 Gastos del Día
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Monto de Gastos"
                    type="number"
                    value={formData.expenses_amount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      expenses_amount: Number(e.target.value) || 0 
                    }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkProTokens.grayMedium,
                        },
                        '&:hover fieldset': {
                          borderColor: darkProTokens.error,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: darkProTokens.error,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: darkProTokens.textSecondary,
                      },
                      '& .MuiInputBase-input': {
                        color: darkProTokens.textPrimary,
                      },
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Notas y Observaciones"
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Describe los gastos del día, observaciones especiales, etc..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkProTokens.grayMedium,
                        },
                        '&:hover fieldset': {
                          borderColor: darkProTokens.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: darkProTokens.primary,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: darkProTokens.textSecondary,
                      },
                      '& .MuiInputBase-input': {
                        color: darkProTokens.textPrimary,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* ℹ️ INFORMACIÓN ADICIONAL */}
          <Grid xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info, mb: 3 }}>
                    ℹ️ Información del Corte
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Fecha del corte:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatDate(selectedDate)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Total de transacciones:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {totals.totalTransactions}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Usuario:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        luishdz04
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Hora de creación:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ backgroundColor: darkProTokens.grayMedium }} />
                    
                    <Alert 
                      severity="info" 
                      sx={{ 
                        backgroundColor: `${darkProTokens.info}20`,
                        border: `1px solid ${darkProTokens.info}30`,
                        '& .MuiAlert-message': {
                          color: darkProTokens.textPrimary
                        }
                      }}
                    >
                      Los datos se han cargado automáticamente desde las transacciones del día. 
                      Puedes ajustar cualquier valor antes de guardar.
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
