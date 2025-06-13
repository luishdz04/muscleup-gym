'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Avatar,
  Stack,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
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
  timezone_info?: {
    mexico_date: string;
    utc_range: {
      start: string;
      end: string;
    };
    note: string;
  };
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

export default function NuevoCorteePage() {
  const router = useRouter();
  
  // 📅 FECHA ACTUAL EN MÉXICO COMO DEFAULT
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    const mexicoDateString = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Monterrey'
    }).format(now);
    return new Date(mexicoDateString + 'T12:00:00');
  });
  
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [cutExists, setCutExists] = useState(false);

  // 🔍 CARGAR DATOS DEL DÍA SELECCIONADO
  const loadDailyData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = date.toISOString().split('T')[0];
      console.log('🔍 Cargando datos para fecha:', dateString);
      
      const response = await fetch(`/api/cuts/daily-data?date=${dateString}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
        
        // 🔍 VERIFICAR SI YA EXISTE CORTE PARA ESTA FECHA
        await checkExistingCut(dateString);
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

  // 🔍 VERIFICAR SI YA EXISTE CORTE
  const checkExistingCut = async (dateString: string) => {
    try {
      const response = await fetch(`/api/cuts/check-exists?date=${dateString}`);
      const data = await response.json();
      setCutExists(data.exists);
    } catch (error) {
      console.error('Error verificando corte existente:', error);
    }
  };

  // 💾 CREAR CORTE
  const handleCreateCut = async () => {
    if (!dailyData) return;
    
    try {
      setCreating(true);
      setError(null);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const cutData = {
        cut_date: dateString,
        cut_name: `Corte ${formatDate(dateString)}`,
        created_by: 'luishdz04',
        observations: observations.trim(),
        
        // DATOS CONSOLIDADOS
        total_pos_amount: dailyData.pos.total,
        total_memberships_amount: dailyData.memberships.total,
        total_abonos_amount: dailyData.abonos.total,
        total_income: dailyData.totals.total,
        total_commissions: dailyData.totals.commissions,
        net_amount: dailyData.totals.net_amount,
        
        // DESGLOSE POR MÉTODOS
        efectivo_total: dailyData.totals.efectivo,
        transferencia_total: dailyData.totals.transferencia,
        debito_total: dailyData.totals.debito,
        credito_total: dailyData.totals.credito,
        
        // CONTADORES
        total_transactions: dailyData.totals.transactions,
        pos_transactions: dailyData.pos.transactions,
        membership_transactions: dailyData.memberships.transactions,
        abono_transactions: dailyData.abonos.transactions,
        
        // METADATOS
        timezone_info: dailyData.timezone_info
      };
      
      console.log('📊 Creando corte con datos:', cutData);
      
      const response = await fetch('/api/cuts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cutData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Corte creado exitosamente: ${cutData.cut_name}`);
        setTimeout(() => {
          router.push(`/dashboard/admin/cortes/${result.cut_id}`);
        }, 2000);
      } else {
        setError(result.error || 'Error al crear el corte');
      }
    } catch (error) {
      console.error('Error creando corte:', error);
      setError('Error al crear el corte');
    } finally {
      setCreating(false);
    }
  };

  // ⚡ EFECTOS
  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  // 🔄 MANEJAR CAMBIO DE FECHA
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4
      }}>
        {/* 🏷️ HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/dashboard/admin/cortes')}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': { color: darkProTokens.primary }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: darkProTokens.roleAdmin, 
              width: 60, 
              height: 60 
            }}>
              <ReceiptIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Crear Nuevo Corte
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📅 Gestión de cortes de caja • Sin límite de fechas
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 🚨 MENSAJES DE ESTADO */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            </motion.div>
          )}
          
          {cutExists && !success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ Ya existe un corte para la fecha seleccionada. Puedes crear uno nuevo si es necesario.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={4}>
          {/* 📅 CONFIGURACIÓN DEL CORTE */}
          <Grid xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.roleAdmin}40`,
                borderRadius: 4,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                    ⚙️ Configuración del Corte
                  </Typography>
                  
                  {/* SELECTOR DE FECHA */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📅 Fecha del Corte
                    </Typography>
                    <DatePicker
                      value={selectedDate}
                      onChange={handleDateChange}
                      maxDate={new Date()}
                      format="dd/MM/yyyy"
                      label="Seleccionar fecha"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
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
                        '& .MuiSvgIcon-root': {
                          color: darkProTokens.primary,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, mt: 1, display: 'block' }}>
                      💡 Puedes seleccionar cualquier fecha pasada sin límite
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* INFORMACIÓN DEL CORTE */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📋 Información del Corte
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Nombre del corte:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          Corte {formatDate(selectedDate.toISOString().split('T')[0])}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Responsable:
                        </Typography>
                        <Chip
                          label="luishdz04"
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Fecha de creación:
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                          {new Date().toLocaleString('es-MX', {
                            timeZone: 'America/Monterrey',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* OBSERVACIONES */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📝 Observaciones (Opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Agregar comentarios o notas sobre este corte..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
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
                        '& .MuiInputBase-input::placeholder': {
                          color: darkProTokens.textDisabled,
                        },
                      }}
                    />
                  </Box>

                  {/* BOTONES DE ACCIÓN */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/dashboard/admin/cortes')}
                      sx={{
                        borderColor: darkProTokens.textSecondary,
                        color: darkProTokens.textSecondary,
                        py: 1.5,
                        '&:hover': {
                          borderColor: darkProTokens.textPrimary,
                          backgroundColor: `${darkProTokens.textSecondary}20`
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleCreateCut}
                      disabled={creating || loading || !dailyData}
                      startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.primaryHover})`,
                        color: darkProTokens.textPrimary,
                        py: 1.5,
                        fontWeight: 700,
                        '&:disabled': {
                          background: darkProTokens.grayMedium,
                          color: darkProTokens.textDisabled
                        }
                      }}
                    >
                      {creating ? 'Creando...' : 'Crear Corte'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 📊 PREVIEW DE DATOS */}
          <Grid xs={12} md={8}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin }} />
              </Box>
            )}

            {!loading && dailyData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Stack spacing={3}>
                  {/* RESUMEN PRINCIPAL */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.success}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success, mb: 3 }}>
                        💰 Resumen del Día Seleccionado
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              {formatPrice(dailyData.totals.total)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Ingresos Totales
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                              {formatPrice(dailyData.totals.commissions)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Comisiones
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                              {formatPrice(dailyData.totals.net_amount)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Monto Neto
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              {dailyData.totals.transactions}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Transacciones
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* DESGLOSE POR FUENTE */}
                  <Grid container spacing={3}>
                    {/* POS */}
                    <Grid xs={12} md={4}>
                      <Card sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                        border: `1px solid ${darkProTokens.info}30`,
                        borderRadius: 4,
                        height: '100%'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: darkProTokens.info }}>
                              <ReceiptIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              Punto de Venta
                            </Typography>
                          </Box>
                          
                          <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                            {formatPrice(dailyData.pos.total)}
                          </Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Transacciones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                {dailyData.pos.transactions}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Comisiones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                                {formatPrice(dailyData.pos.commissions)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* ABONOS */}
                    <Grid xs={12} md={4}>
                      <Card sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                        border: `1px solid ${darkProTokens.warning}30`,
                        borderRadius: 4,
                        height: '100%'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: darkProTokens.warning }}>
                              <MonetizationOnIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                              Abonos
                            </Typography>
                          </Box>
                          
                          <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                            {formatPrice(dailyData.abonos.total)}
                          </Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Transacciones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                {dailyData.abonos.transactions}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Comisiones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                                {formatPrice(dailyData.abonos.commissions)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* MEMBRESÍAS */}
                    <Grid xs={12} md={4}>
                      <Card sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                        border: `1px solid ${darkProTokens.success}30`,
                        borderRadius: 4,
                        height: '100%'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: darkProTokens.success }}>
                              <AssessmentIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              Membresías
                            </Typography>
                          </Box>
                          
                          <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                            {formatPrice(dailyData.memberships.total)}
                          </Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Transacciones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                {dailyData.memberships.transactions}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                Comisiones:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                                {formatPrice(dailyData.memberships.commissions)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* DESGLOSE POR MÉTODOS DE PAGO */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.grayMedium}`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 3 }}>
                        💳 Desglose por Métodos de Pago
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.primary}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.primary, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                              {formatPrice(dailyData.totals.efectivo)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.info}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.info, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AccountBalanceIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              {formatPrice(dailyData.totals.transferencia)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.success}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.success, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              {formatPrice(dailyData.totals.debito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.error}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.error, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                              {formatPrice(dailyData.totals.credito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
