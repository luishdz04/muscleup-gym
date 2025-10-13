'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Paper,
  Skeleton
} from '@mui/material';
import Grid from '@mui/material/Grid';
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

// ✅ IMPORTS CENTRALIZADOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useNotifications } from '@/hooks/useNotifications';
import { formatPrice } from '@/utils/formatUtils';
import { 
  getTodayInMexico, 
  formatDateForDisplay,
  formatTimestampForDisplay
} from '@/utils/dateUtils';

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
      return colorTokens.warning;
    case 'transporte':
    case 'gasolina':
    case 'combustible':
      return colorTokens.info;
    case 'equipamiento':
    case 'equipo':
    case 'mantenimiento':
      return colorTokens.danger;
    case 'servicios':
      return colorTokens.success;
    case 'compras':
      return colorTokens.brand;
    default:
      return colorTokens.textSecondary;
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
  const isHydrated = useHydrated();
  useUserTracking();
  const { toast } = useNotifications();

  // 📊 ESTADOS
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyExpensesData, setDailyExpensesData] = useState<DailyExpensesData | null>(null);
  const [relatedCutData, setRelatedCutData] = useState<RelatedCutData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  
  // ✅ FECHA ACTUAL EN MÉXICO USANDO dateUtils
  const [selectedDate] = useState(() => {
    const mexicoDate = getTodayInMexico();
    return mexicoDate;
  });

  // ⏰ ACTUALIZAR HORA EN TIEMPO REAL
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = now.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentMexicoTime(mexicoTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 💸 CARGAR DATOS DE EGRESOS
  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/expenses/daily?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDailyExpensesData(data);
      } else {
        const errorMsg = data.error || `Error HTTP ${response.status}`;
        console.error('❌ Error en respuesta de API egresos:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Error crítico en loadExpenses:', error);
      const errorMsg = `Error de conexión: ${error.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR INFORMACIÓN DEL CORTE RELACIONADO
  const loadRelatedCut = async () => {
    try {
      const response = await fetch(`/api/cuts/check-existing?date=${selectedDate}&purpose=expenses`);
      const data = await response.json();
      
      if (response.ok) {
        setRelatedCutData(data);
      } else {
        setRelatedCutData({ exists: false });
      }
    } catch (error) {
      console.error('Error cargando corte relacionado:', error);
      setRelatedCutData({ exists: false });
    }
  };

  // 🔄 REFRESCAR DATOS
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadExpenses(), loadRelatedCut()]);
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      // Error ya manejado en loadExpenses
    } finally {
      setRefreshing(false);
    }
  };

  // ⚡ CARGAR DATOS AL MONTAR
  useEffect(() => {
    if (isHydrated) {
      Promise.all([loadExpenses(), loadRelatedCut()]);
    }
  }, [selectedDate, isHydrated]);

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

  // 🔒 SSR SAFETY - SKELETON MIENTRAS HIDRATA
  if (!isHydrated) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
        color: colorTokens.textPrimary,
        p: 4
      }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 4, bgcolor: colorTokens.neutral200 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4, bgcolor: colorTokens.neutral200 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
      color: colorTokens.textPrimary,
      p: 4
    }}>
      {/* 🏷️ HEADER CON HORA DINÁMICA */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: colorTokens.danger, 
            width: 60, 
            height: 60 
          }}>
            <MoneyOffIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
              Egresos del Día
            </Typography>
            
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
              {formatDateForDisplay(selectedDate)} • {currentMexicoTime}
            </Typography>
            
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refrescar datos">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                color: colorTokens.info,
                bgcolor: `${colorTokens.info}20`,
                '&:hover': { bgcolor: `${colorTokens.info}30` }
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
              background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
              color: colorTokens.textPrimary,
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
                backgroundColor: `${colorTokens.danger}20`,
                color: colorTokens.textPrimary,
                border: `1px solid ${colorTokens.danger}60`,
                '& .MuiAlert-icon': { color: colorTokens.danger }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRefresh}
                  sx={{ color: colorTokens.textPrimary }}
                >
                  Reintentar
                </Button>
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {error}
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} sx={{ color: colorTokens.danger, mb: 3 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            Cargando egresos...
          </Typography>
        </Box>
      )}

     {/* 📊 CONTENIDO PRINCIPAL */}
{!loading && dailyExpensesData && (
  <Grid container spacing={4}>
    {/* 💰 RESUMEN PRINCIPAL */}
    <Grid size={12}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.danger}40`,
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.danger, mb: 3 }}>
              Resumen de Egresos
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                    {formatPrice(dailyExpensesData.summary.total_amount)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                    Total de Egresos
                  </Typography>
                  <Chip
                    icon={<TrendingDownIcon />}
                    label={`${dailyExpensesData.summary.total_expenses} gastos`}
                    sx={{
                      mt: 1,
                      backgroundColor: `${colorTokens.danger}20`,
                      color: colorTokens.danger,
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                    {Object.keys(dailyExpensesData.summary.categories).length}
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                    Categorías
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                    Tipos de gastos registrados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                    {dailyExpensesData.summary.total_expenses > 0 ? 
                      formatPrice(dailyExpensesData.summary.total_amount / dailyExpensesData.summary.total_expenses) 
                      : formatPrice(0)
                    }
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                    Promedio por Gasto
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                    Gasto promedio registrado
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  {relatedCutData?.exists ? (
                    <>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        ✅
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                        Sincronizado
                      </Typography>
                      <Chip
                        label={`Corte: ${formatPrice(relatedCutData.cut?.expenses_amount || 0)}`}
                        size="small"
                        sx={{
                          mt: 1,
                          backgroundColor: `${colorTokens.success}20`,
                          color: colorTokens.success,
                          fontWeight: 600
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.info }}>
                        📋
                      </Typography>
                      <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                        Sin Corte
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
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
      <Grid size={12}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.neutral500}`,
            borderRadius: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 3 }}>
                📈 Desglose por Categorías
              </Typography>
              
              <Grid container spacing={3}>
                {Object.entries(dailyExpensesData.summary.categories).map(([category, data], index) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={category}>
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`,
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
                      <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1, textTransform: 'capitalize' }}>
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
                      <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
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
    <Grid size={12}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.neutral500}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 3 }}>
              📋 Lista de Egresos del Día
            </Typography>
            
            {dailyExpensesData.expenses.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`,
                borderRadius: 3,
                border: `1px dashed ${colorTokens.neutral500}`
              }}>
                <MoneyOffIcon sx={{ fontSize: 80, color: colorTokens.textDisabled, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  No hay egresos registrados para hoy
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mb: 3 }}>
                  Los egresos que registres aparecerán aquí
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/dashboard/admin/egresos/nuevo')}
                  sx={{
                    background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
                    color: colorTokens.textPrimary
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
                      background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`,
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
                            <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
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
                              <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                                {expense.expense_time}
                              </Typography>
                              {expense.receipt_number && (
                                <Chip
                                  label={`#${expense.receipt_number}`}
                                  size="small"
                                  sx={{ backgroundColor: `${colorTokens.info}20`, color: colorTokens.info }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                            -{formatPrice(expense.amount)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                            ID: {expense.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                      
                      {expense.notes && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colorTokens.neutral500}` }}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontStyle: 'italic' }}>
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

    {/* 🎯 ACCIONES RÁPIDAS */}
    <Grid size={12}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card sx={{
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.neutral500}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 3 }}>
              🎯 Acciones Rápidas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/dashboard/admin/egresos/nuevo')}
                  sx={{
                    background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
                    color: colorTokens.textPrimary,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  Nuevo Egreso
                </Button>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => router.push('/dashboard/admin/egresos/historial')}
                  sx={{
                    borderColor: colorTokens.info,
                    color: colorTokens.info,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: colorTokens.infoHover,
                      backgroundColor: `${colorTokens.info}20`
                    }
                  }}
                >
                  Ver Historial
                </Button>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => relatedCutData?.exists && router.push('/dashboard/admin/cortes')}
                  disabled={!relatedCutData?.exists}
                  sx={{
                    borderColor: relatedCutData?.exists ? colorTokens.success : colorTokens.textDisabled,
                    color: relatedCutData?.exists ? colorTokens.success : colorTokens.textDisabled,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: relatedCutData?.exists ? colorTokens.successHover : colorTokens.textDisabled,
                      backgroundColor: relatedCutData?.exists ? `${colorTokens.success}20` : 'transparent'
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


