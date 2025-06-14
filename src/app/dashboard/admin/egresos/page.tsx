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
  MoneyOff as MoneyOffIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  SwapHoriz as SwapHorizIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Build as BuildIcon,
  LocalGasStation as LocalGasStationIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS (IGUAL QUE CORTES)
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

// ✅ FUNCIONES LOCALES (SIN IMPORTAR dateHelpers) - IGUAL QUE CORTES

// 💰 Función para formatear precios
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

// 📅 Función para obtener fecha actual de México
function getMexicoDateLocal(): string {
  const now = new Date();
  
  // Obtener fecha en zona horaria de México
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  
  // Formatear como YYYY-MM-DD
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ⏰ Función para formatear hora actual de México
function formatMexicoTimeLocal(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// 📅 Función para formatear fechas largas
function formatDateLocal(dateString: string): string {
  try {
    // Crear fecha y formatear en español México
    const date = new Date(dateString + 'T12:00:00');
    
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    console.error('❌ Error formateando fecha:', dateString, error);
    
    // Fallback manual
    const date = new Date(dateString + 'T12:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const weekdays = [
      'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${weekday}, ${day} de ${month} de ${year}`;
  }
}

// 🎯 FUNCIÓN PARA OBTENER ICONO POR CATEGORÍA
function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'comida':
    case 'alimentos':
      return <RestaurantIcon />;
    case 'transporte':
    case 'gasolina':
      return <DirectionsCarIcon />;
    case 'combustible':
      return <LocalGasStationIcon />;
    case 'equipamiento':
    case 'equipo':
      return <BuildIcon />;
    case 'servicios':
      return <HomeIcon />;
    case 'mantenimiento':
      return <BuildIcon />;
    case 'compras':
      return <ShoppingCartIcon />;
    default:
      return <MoneyOffIcon />;
  }
}

// 🎨 FUNCIÓN PARA OBTENER COLOR POR CATEGORÍA
function getCategoryColor(category: string) {
  switch (category?.toLowerCase()) {
    case 'comida':
    case 'alimentos':
      return darkProTokens.warning;
    case 'transporte':
    case 'gasolina':
    case 'combustible':
      return darkProTokens.info;
    case 'equipamiento':
    case 'equipo':
    case 'mantenimiento':
      return darkProTokens.error;
    case 'servicios':
      return darkProTokens.success;
    case 'compras':
      return darkProTokens.primary;
    default:
      return darkProTokens.textSecondary;
  }
}

interface DailyExpensesData {
  date: string;
  mexico_time?: string;
  timezone_info?: {
    mexico_date: string;
    note: string;
  };
  expenses: Array<{
    id: string;
    expense_date: string;
    expense_time: string;
    expense_type: string;
    description: string;
    amount: number;
    receipt_number?: string;
    notes?: string;
    status: string;
    created_at: string;
  }>;
  summary: {
    total_expenses: number;
    total_amount: number;
    categories: Record<string, {
      count: number;
      total: number;
      items: any[];
    }>;
  };
}

interface RelatedCutData {
  exists: boolean;
  cut?: {
    id: string;
    cut_number: string;
    expenses_amount: number;
    final_balance: number;
  };
}

export default function EgresosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyExpensesData, setDailyExpensesData] = useState<DailyExpensesData | null>(null);
  const [relatedCutData, setRelatedCutData] = useState<RelatedCutData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ ESTADO PARA HORA EN TIEMPO REAL (IGUAL QUE CORTES)
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  
  // ✅ FECHA ACTUAL EN MÉXICO USANDO FUNCIÓN LOCAL (IGUAL QUE CORTES)
  const [selectedDate] = useState(() => {
    const mexicoDate = getMexicoDateLocal();
    console.log('🇲🇽 Fecha actual México (función local):', mexicoDate);
    console.log('🌍 Fecha actual UTC:', new Date().toISOString().split('T')[0]);
    console.log('⏰ Hora actual UTC:', new Date().toISOString());
    return mexicoDate; // Formato: YYYY-MM-DD
  });

  // ✅ ACTUALIZAR HORA EN TIEMPO REAL CADA SEGUNDO (IGUAL QUE CORTES)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTimeLocal(now);
      setCurrentMexicoTime(mexicoTime);
    };

    // Actualizar inmediatamente
    updateTime();

    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ CARGAR DATOS DEL DÍA CON MEJOR MANEJO DE ERRORES (IGUAL QUE CORTES)
  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando egresos para fecha México:', selectedDate);
      console.log('⏰ Timestamp actual México:', currentMexicoTime);
      
      const response = await fetch(`/api/expenses/daily?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Respuesta de la API egresos:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Datos recibidos de egresos:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Datos de egresos válidos recibidos:', {
          fecha: data.date,
          timezone_info: data.timezone_info,
          total_egresos: data.summary?.total_amount || 0,
          cantidad_egresos: data.summary?.total_expenses || 0
        });
        setDailyExpensesData(data);
      } else {
        const errorMsg = data.error || `Error HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Error en respuesta de API egresos:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Error crítico en loadExpenses:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR INFORMACIÓN DEL CORTE RELACIONADO
  const loadRelatedCut = async () => {
    try {
      console.log('🔍 Verificando corte relacionado para fecha:', selectedDate);
      
      const response = await fetch(`/api/cuts/check-existing?date=${selectedDate}&purpose=expenses`);
      console.log('📡 Respuesta API check-existing:', response.status);
      
      const data = await response.json();
      console.log('📊 Datos corte relacionado:', data);
      
      if (response.ok) {
        setRelatedCutData(data);
      } else {
        console.log('ℹ️ No hay corte para esta fecha o API no disponible');
        setRelatedCutData({ exists: false });
      }
    } catch (error) {
      console.error('Error cargando corte relacionado:', error);
      setRelatedCutData({ exists: false });
    }
  };

  // 🔄 REFRESCAR DATOS (IGUAL QUE CORTES)
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), loadRelatedCut()]);
    setRefreshing(false);
  };

  // ⚡ EFECTOS (IGUAL QUE CORTES)
  useEffect(() => {
    console.log('🚀 Componente egresos montado, cargando datos para fecha:', selectedDate);
    Promise.all([loadExpenses(), loadRelatedCut()]);
  }, [selectedDate]);

  // 📊 CALCULAR PORCENTAJES PARA CATEGORÍAS
  const calculateCategoryPercentages = () => {
    if (!dailyExpensesData || dailyExpensesData.summary.total_amount === 0) {
      return {};
    }

    const total = dailyExpensesData.summary.total_amount;
    const percentages: Record<string, number> = {};
    
    Object.entries(dailyExpensesData.summary.categories).forEach(([category, data]) => {
      percentages[category] = (data.total / total) * 100;
    });
    
    return percentages;
  };

  const categoryPercentages = calculateCategoryPercentages();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 4
    }}>
      {/* 🏷️ HEADER CON HORA DINÁMICA (IGUAL QUE CORTES) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.error, 
            width: 60, 
            height: 60 
          }}>
            <MoneyOffIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              Egresos del Día
            </Typography>
            
            {/* ✅ FECHA Y HORA DINÁMICA CORREGIDAS */}
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              📅 {formatDateLocal(selectedDate)} • ⏰ {currentMexicoTime} • Gestión de gastos diarios
            </Typography>
            
            {/* ✅ INFORMACIÓN DE ZONA HORARIA CON FECHA CORRECTA */}
            <Typography variant="caption" sx={{ 
              color: darkProTokens.info,
              display: 'block',
              mt: 0.5
            }}>
              🇲🇽 Zona horaria: México (UTC-6) • Fecha consultada: {selectedDate}
              {dailyExpensesData?.timezone_info && (
                <span> • {dailyExpensesData.timezone_info.note}</span>
              )}
            </Typography>
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
            onClick={() => router.push('/dashboard/admin/egresos/nuevo')}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 3,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Nuevo Egreso
          </Button>
        </Box>
      </Box>

      {/* 🚨 ESTADOS DE ERROR CON MÁS DETALLES (IGUAL QUE CORTES) */}
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
                Fecha consultada: {selectedDate} • Hora México: {currentMexicoTime} • Verifique la API y la conexión a la base de datos
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔄 LOADING STATE (IGUAL QUE CORTES) */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} sx={{ color: darkProTokens.error, mb: 3 }} />
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
            Cargando egresos del día {selectedDate}...
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
            Consultando gastos y sincronización con cortes • {currentMexicoTime}
          </Typography>
        </Box>
      )}

      {/* 📊 CONTENIDO PRINCIPAL */}
      {!loading && dailyExpensesData && (
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
                border: `2px solid ${darkProTokens.error}40`,
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error, mb: 3 }}>
                    💸 Resumen de Egresos
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                          {formatPrice(dailyExpensesData.summary.total_amount)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Total de Egresos
                        </Typography>
                        <Chip
                          icon={<TrendingDownIcon />}
                          label={`${dailyExpensesData.summary.total_expenses} gastos`}
                          sx={{
                            mt: 1,
                            backgroundColor: `${darkProTokens.error}20`,
                            color: darkProTokens.error,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {Object.keys(dailyExpensesData.summary.categories).length}
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Categorías
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          Tipos de gastos registrados
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {dailyExpensesData.summary.total_expenses > 0 ? 
                            formatPrice(dailyExpensesData.summary.total_amount / dailyExpensesData.summary.total_expenses) 
                            : formatPrice(0)
                          }
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                          Promedio por Gasto
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                          Gasto promedio registrado
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        {relatedCutData?.exists ? (
                          <>
                            <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              ✅
                            </Typography>
                            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                              Sincronizado
                            </Typography>
                            <Chip
                              label={`Corte: ${formatPrice(relatedCutData.cut?.expenses_amount || 0)}`}
                              size="small"
                              sx={{
                                mt: 1,
                                backgroundColor: `${darkProTokens.success}20`,
                                color: darkProTokens.success,
                                fontWeight: 600
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              📋
                            </Typography>
                            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                              Sin Corte
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                              No hay corte para este día
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 📊 DESGLOSE POR CATEGORÍAS */}
          {Object.keys(dailyExpensesData.summary.categories).length > 0 && (
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
                      📈 Desglose por Categorías
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {Object.entries(dailyExpensesData.summary.categories).map(([category, data], index) => (
                        <Grid xs={12} md={6} lg={4} key={category}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${getCategoryColor(category)}40`,
                            borderRadius: 3
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                              <Avatar sx={{ 
                                bgcolor: getCategoryColor(category), 
                                width: 48, 
                                height: 48 
                              }}>
                                {getCategoryIcon(category)}
                              </Avatar>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: getCategoryColor(category) }}>
                              {formatPrice(data.total)}
                            </Typography>
                            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1, textTransform: 'capitalize' }}>
                              {category}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={categoryPercentages[category] || 0} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: `${getCategoryColor(category)}20`,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getCategoryColor(category)
                                }
                              }} 
                            />
                            <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 1 }}>
                              {(categoryPercentages[category] || 0).toFixed(1)}% • {data.count} gastos
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}

          {/* 📋 LISTA DE EGRESOS */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.grayMedium}`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 3 }}>
                    📋 Lista de Egresos del Día
                  </Typography>
                  
                  {dailyExpensesData.expenses.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
                      borderRadius: 3,
                      border: `1px dashed ${darkProTokens.grayMedium}`
                    }}>
                      <MoneyOffIcon sx={{ fontSize: 80, color: darkProTokens.textDisabled, mb: 2 }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        No hay egresos registrados para hoy
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mb: 3 }}>
                        Los egresos que registres aparecerán aquí
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/dashboard/admin/egresos/nuevo')}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                          color: darkProTokens.textPrimary
                        }}
                      >
                        Registrar Primer Egreso
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {dailyExpensesData.expenses.map((expense, index) => (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Paper sx={{
                            p: 3,
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `1px solid ${getCategoryColor(expense.expense_type)}30`,
                            borderRadius: 3,
                            '&:hover': {
                              borderColor: `${getCategoryColor(expense.expense_type)}60`,
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s ease'
                            }
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                  bgcolor: getCategoryColor(expense.expense_type),
                                  width: 40,
                                  height: 40
                                }}>
                                  {getCategoryIcon(expense.expense_type)}
                                </Avatar>
                                <Box>
                                  <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                    {expense.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                    <Chip
                                      label={expense.expense_type}
                                      size="small"
                                      sx={{
                                        backgroundColor: `${getCategoryColor(expense.expense_type)}20`,
                                        color: getCategoryColor(expense.expense_type),
                                        fontWeight: 600,
                                        textTransform: 'capitalize'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                                      {expense.expense_time}
                                    </Typography>
                                    {expense.receipt_number && (
                                      <Chip
                                        label={`#${expense.receipt_number}`}
                                        size="small"
                                        sx={{ backgroundColor: `${darkProTokens.info}20`, color: darkProTokens.info }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                              
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                                  -{formatPrice(expense.amount)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                                  ID: {expense.id.slice(0, 8)}...
                                </Typography>
                              </Box>
                            </Box>
                            
                            {expense.notes && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                                  📝 {expense.notes}
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </motion.div>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 🎯 ACCIONES RÁPIDAS (IGUAL QUE CORTES) */}
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
                        onClick={() => router.push('/dashboard/admin/egresos/nuevo')}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                          color: darkProTokens.textPrimary,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        Nuevo Egreso
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => router.push('/dashboard/admin/egresos/historial')}
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
                        startIcon={<SwapHorizIcon />}
                        onClick={() => relatedCutData?.exists && router.push('/dashboard/admin/cortes')}
                        disabled={!relatedCutData?.exists}
                        sx={{
                          borderColor: relatedCutData?.exists ? darkProTokens.success : darkProTokens.textDisabled,
                          color: relatedCutData?.exists ? darkProTokens.success : darkProTokens.textDisabled,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: relatedCutData?.exists ? darkProTokens.successHover : darkProTokens.textDisabled,
                            backgroundColor: relatedCutData?.exists ? `${darkProTokens.success}20` : 'transparent'
                          }
                        }}
                      >
                        {relatedCutData?.exists ? 'Ver Corte' : 'Sin Corte'}
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
