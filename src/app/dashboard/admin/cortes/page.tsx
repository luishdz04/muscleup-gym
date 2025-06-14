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
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Stack,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  SwapHoriz as SwapHorizIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
// ✅ IMPORTAR HELPERS DE FECHA MÉXICO
import { toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

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

// ✅ FUNCIÓN PARA FORMATEAR FECHAS CON dateHelpers
function formatDate(dateString: string): string {
  try {
    return formatMexicoDateTime(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('❌ Error formateando fecha:', dateString, error);
    // Fallback manual
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
}

interface DailyData {
  date: string;
  timezone_info?: {
    mexico_date: string;
    mexico_range?: {
      start: string;
      end: string;
    };
    utc_range?: {
      start: string;
      end: string;
    };
    timezone?: string;
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

export default function CortesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ FECHA ACTUAL EN MÉXICO USANDO dateHelpers
  const [selectedDate] = useState(() => {
    const mexicoDate = toMexicoDate(new Date());
    
    console.log('🇲🇽 Fecha actual México (dateHelpers):', mexicoDate);
    console.log('🌍 Fecha actual UTC:', new Date().toISOString().split('T')[0]);
    console.log('⏰ Hora actual México:', formatMexicoDateTime(new Date(), {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Mexico_City'
    }));
    
    return mexicoDate; // Formato: YYYY-MM-DD
  });

  // ✅ CARGAR DATOS DEL DÍA CON MEJOR MANEJO DE ERRORES
  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Solicitando datos para fecha México:', selectedDate);
      
      const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Respuesta de la API:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Datos recibidos de la API:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Datos válidos recibidos:', {
          fecha: data.date,
          timezone_info: data.timezone_info,
          total_ingresos: data.totals?.total || 0,
          transacciones: data.totals?.transactions || 0
        });
        setDailyData(data);
      } else {
        const errorMsg = data.error || `Error HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Error en respuesta de API:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Error crítico en loadDailyData:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 REFRESCAR DATOS
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDailyData();
    setRefreshing(false);
  };

  // ⚡ EFECTOS
  useEffect(() => {
    console.log('🚀 Componente montado, cargando datos para fecha:', selectedDate);
    loadDailyData();
  }, [selectedDate]);

  // 📊 CALCULAR PORCENTAJES PARA MÉTODOS DE PAGO
  const calculatePaymentMethodPercentages = () => {
    if (!dailyData || dailyData.totals.total === 0) {
      return {
        efectivo: 0,
        transferencia: 0,
        debito: 0,
        credito: 0
      };
    }

    const total = dailyData.totals.total;
    return {
      efectivo: (dailyData.totals.efectivo / total) * 100,
      transferencia: (dailyData.totals.transferencia / total) * 100,
      debito: (dailyData.totals.debito / total) * 100,
      credito: (dailyData.totals.credito / total) * 100
    };
  };

  const percentages = calculatePaymentMethodPercentages();

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
            width: 60, 
            height: 60 
          }}>
            <ReceiptIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              Cortes de Caja
            </Typography>
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              📅 {formatDate(selectedDate)} • Gestión de cortes diarios
            </Typography>
            {dailyData?.timezone_info && (
              <Typography variant="caption" sx={{ 
                color: darkProTokens.info,
                display: 'block',
                mt: 0.5
              }}>
                🇲🇽 {dailyData.timezone_info.timezone || 'Zona horaria: México'} • {dailyData.timezone_info.note}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refrescar datos">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                color: darkProTokens.info,
                bgcolor: `${darkProTokens.info}20`,
                '&:hover': { bgcolor: `${darkProTokens.info}30` }
              }}
            >
              <RefreshIcon sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 3,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Crear Nuevo Corte
          </Button>
        </Box>
      </Box>

      {/* 🚨 ESTADOS DE ERROR CON MÁS DETALLES */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: `${darkProTokens.error}20`,
                color: darkProTokens.textPrimary,
                border: `1px solid ${darkProTokens.error}60`,
                '& .MuiAlert-icon': { color: darkProTokens.error }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRefresh}
                  sx={{ color: darkProTokens.textPrimary }}
                >
                  Reintentar
                </Button>
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                {error}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Fecha consultada: {selectedDate} • Verifique la API y la conexión a la base de datos
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔄 LOADING STATE */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin, mb: 3 }} />
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
            Cargando datos del día {selectedDate}...
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
            Consultando información de ventas, abonos y membresías
          </Typography>
        </Box>
      )}

      {/* 📊 CONTENIDO PRINCIPAL - RESTO DEL CÓDIGO IGUAL */}
      {!loading && dailyData && (
        <Grid container spacing={4}>
          {/* 💰 RESUMEN PRINCIPAL */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.roleAdmin}40`,
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                    💰 Resumen del Día
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(dailyData.totals.total)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Ingresos Totales
                        </Typography>
                        <Chip
                          icon={<TrendingUpIcon />}
                          label={`${dailyData.totals.transactions} transacciones`}
                          sx={{
                            mt: 1,
                            backgroundColor: `${darkProTokens.success}20`,
                            color: darkProTokens.success,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(dailyData.totals.commissions)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Comisiones
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          {dailyData.totals.total > 0 ? ((dailyData.totals.commissions / dailyData.totals.total) * 100).toFixed(1) : 0}% del total
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(dailyData.totals.net_amount)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Monto Neto
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          Después de comisiones
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          {dailyData.pos.transactions + dailyData.memberships.transactions + dailyData.abonos.transactions}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Operaciones
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 1 }}>
                          <Chip label={`${dailyData.pos.transactions} POS`} size="small" />
                          <Chip label={`${dailyData.abonos.transactions} Abonos`} size="small" />
                          <Chip label={`${dailyData.memberships.transactions} Membresías`} size="small" />
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 💳 DESGLOSE POR MÉTODOS DE PAGO */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
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
                    {/* EFECTIVO */}
                    <Grid xs={12} md={3}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                        border: `2px solid ${darkProTokens.primary}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: darkProTokens.primary, 
                            width: 48, 
                            height: 48 
                          }}>
                            <AttachMoneyIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(dailyData.totals.efectivo)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Efectivo
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.efectivo} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${darkProTokens.primary}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: darkProTokens.primary
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          {percentages.efectivo.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TRANSFERENCIA */}
                    <Grid xs={12} md={3}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                        border: `2px solid ${darkProTokens.info}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: darkProTokens.info, 
                            width: 48, 
                            height: 48 
                          }}>
                            <AccountBalanceIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          {formatPrice(dailyData.totals.transferencia)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Transferencia
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.transferencia} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${darkProTokens.info}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: darkProTokens.info
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          {percentages.transferencia.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TARJETA DÉBITO */}
                    <Grid xs={12} md={3}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                        border: `2px solid ${darkProTokens.success}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: darkProTokens.success, 
                            width: 48, 
                            height: 48 
                          }}>
                            <CreditCardIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(dailyData.totals.debito)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Tarjeta Débito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.debito} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${darkProTokens.success}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: darkProTokens.success
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          {percentages.debito.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TARJETA CRÉDITO */}
                    <Grid xs={12} md={3}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                        border: `2px solid ${darkProTokens.error}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: darkProTokens.error, 
                            width: 48, 
                            height: 48 
                          }}>
                            <CreditCardIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                          {formatPrice(dailyData.totals.credito)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Tarjeta Crédito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.credito} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${darkProTokens.error}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: darkProTokens.error
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          {percentages.credito.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 📈 DESGLOSE POR FUENTE DE INGRESOS */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Grid container spacing={3}>
                {/* PUNTO DE VENTA */}
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
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 2 }} />
                      
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
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 2 }} />
                      
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
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 2 }} />
                      
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
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* 🎯 ACCIONES RÁPIDAS */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.grayMedium}`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 3 }}>
                    🎯 Acciones Rápidas
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.primaryHover})`,
                          color: darkProTokens.textPrimary,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        Crear Nuevo Corte
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => router.push('/dashboard/admin/cortes/historial')}
                        sx={{
                          borderColor: darkProTokens.info,
                          color: darkProTokens.info,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: darkProTokens.infoHover,
                            backgroundColor: `${darkProTokens.info}20`
                          }
                        }}
                      >
                        Ver Historial
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AssessmentIcon />}
                        sx={{
                          borderColor: darkProTokens.success,
                          color: darkProTokens.success,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: darkProTokens.successHover,
                            backgroundColor: `${darkProTokens.success}20`
                          }
                        }}
                      >
                        Reportes
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
