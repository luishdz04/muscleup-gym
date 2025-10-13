'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserTracking } from '@/hooks/useUserTracking';
import { formatCurrency } from '@/utils/formHelpers';
import {
  getTodayInMexico,
  formatDateLong,
  formatMexicoTime
} from '@/utils/dateUtils';

const formatPrice = (amount: number): string => formatCurrency(Number.isFinite(amount) ? amount : 0);

interface DailyData {
  date: string;
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
  expenses?: {
    amount: number;
    count: number;
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
    expenses_amount?: number;
    final_balance?: number;
  };
}

export default function CortesPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { toast } = useNotifications();
  const { getUTCTimestamp } = useUserTracking();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  
  // ✅ ESTADO PARA HORA EN TIEMPO REAL
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  
  // ✅ FECHA ACTUAL EN MÉXICO USANDO FUNCIÓN LOCAL
  const selectedDate = useMemo(() => getTodayInMexico(), []);

  // ✅ ACTUALIZAR HORA EN TIEMPO REAL CADA SEGUNDO
  useEffect(() => {
    if (!hydrated) return;

    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTime(now, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentMexicoTime(mexicoTime);
    };

    // Actualizar inmediatamente
    updateTime();

    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [hydrated]);

  const loadDailyData = useCallback(async (
    options: { withSkeleton?: boolean; withFeedback?: boolean } = {}
  ): Promise<boolean> => {
    const { withSkeleton = false, withFeedback = false } = options;

    if (!hydrated) {
      return false;
    }

    if (withSkeleton) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDailyData(data);
        setLastRefresh(getUTCTimestamp());

        if (withFeedback) {
          toast.success('Datos del corte actualizados');
        }
        return true;
      }

      const errorMsg = data.error || `Error HTTP ${response.status}: ${response.statusText}`;
      setError(errorMsg);
      if (withFeedback || !withSkeleton) {
        toast.error(errorMsg);
      }
      return false;
    } catch (error: any) {
      const message = `Error de conexión: ${error.message}`;
      setError(message);
      if (withFeedback || !withSkeleton) {
        toast.error('No se pudo obtener el corte del día');
      }
      return false;
    } finally {
      if (withSkeleton) {
        setLoading(false);
      }
    }
  }, [getUTCTimestamp, hydrated, selectedDate, toast]);

  const handleRefresh = useCallback(async () => {
    if (!hydrated) return;
    setRefreshing(true);
    const loadingToast = toast.loading('Actualizando corte del día...');
    await loadDailyData({ withFeedback: true });
    toast.dismiss(loadingToast);
    setRefreshing(false);
  }, [hydrated, loadDailyData, toast]);

  useEffect(() => {
    if (!hydrated) return;
    loadDailyData({ withSkeleton: true });
  }, [hydrated, loadDailyData]);

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
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
      color: colorTokens.textPrimary,
      p: 4
    }}>
      {/* 🏷️ HEADER CON HORA DINÁMICA */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: colorTokens.brand, 
            width: 60, 
            height: 60 
          }}>
            <ReceiptIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
              Cortes de Caja
            </Typography>
            
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
              {formatDateLong(selectedDate)} • {currentMexicoTime}
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
            onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textPrimary,
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

      {/* 🔄 LOADING STATE */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} sx={{ color: colorTokens.brand, mb: 3 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            Cargando datos del día {selectedDate}...
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
            Consultando información de ventas, abonos y membresías • {currentMexicoTime}
          </Typography>
        </Box>
      )}

      {/* 📊 CONTENIDO PRINCIPAL */}
      {!loading && dailyData && (
        <Grid container spacing={4}>
          {/* 💰 RESUMEN PRINCIPAL */}
          <Grid size={{ xs: 12 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `2px solid ${colorTokens.brand}40`,
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.brand, mb: 3 }}>
                    💰 Resumen del Día
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          {formatPrice(dailyData.totals.total)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                          Ingresos Totales
                        </Typography>
                        <Chip
                          icon={<TrendingUpIcon />}
                          label={`${dailyData.totals.transactions} transacciones`}
                          sx={{
                            mt: 1,
                            backgroundColor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                          {formatPrice(dailyData.totals.commissions)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                          Comisiones
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                          {dailyData.totals.total > 0 ? ((dailyData.totals.commissions / dailyData.totals.total) * 100).toFixed(1) : 0}% del total
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                          {formatPrice(dailyData.totals.net_amount)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                          Monto Neto
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                          Después de comisiones
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.info }}>
                          {dailyData.pos.transactions + dailyData.memberships.transactions + dailyData.abonos.transactions}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                          Operaciones
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 1, flexWrap: 'wrap' }}>
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
          <Grid size={{ xs: 12 }}>
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
                    💳 Desglose por Métodos de Pago
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* EFECTIVO */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                        border: `2px solid ${colorTokens.brand}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: colorTokens.brand, 
                            width: 48, 
                            height: 48 
                          }}>
                            <AttachMoneyIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                          {formatPrice(dailyData.totals.efectivo)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Efectivo
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.efectivo} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${colorTokens.brand}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colorTokens.brand
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                          {percentages.efectivo.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TRANSFERENCIA */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                        border: `2px solid ${colorTokens.info}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: colorTokens.info, 
                            width: 48, 
                            height: 48 
                          }}>
                            <AccountBalanceIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.info }}>
                          {formatPrice(dailyData.totals.transferencia)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Transferencia
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.transferencia} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${colorTokens.info}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colorTokens.info
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                          {percentages.transferencia.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TARJETA DÉBITO */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                        border: `2px solid ${colorTokens.success}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: colorTokens.success, 
                            width: 48, 
                            height: 48 
                          }}>
                            <CreditCardIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          {formatPrice(dailyData.totals.debito)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Tarjeta Débito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.debito} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${colorTokens.success}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colorTokens.success
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
                          {percentages.debito.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* TARJETA CRÉDITO */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                        border: `2px solid ${colorTokens.danger}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: colorTokens.danger, 
                            width: 48, 
                            height: 48 
                          }}>
                            <CreditCardIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                          {formatPrice(dailyData.totals.credito)}
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                          Tarjeta Crédito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.credito} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${colorTokens.danger}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colorTokens.danger
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled, mt: 1 }}>
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
          <Grid size={{ xs: 12 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Grid container spacing={3}>
                {/* PUNTO DE VENTA */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `1px solid ${colorTokens.info}30`,
                    borderRadius: 4,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colorTokens.info }}>
                          <ReceiptIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.info }}>
                          Punto de Venta
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                        {formatPrice(dailyData.pos.total)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transacciones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {dailyData.pos.transactions}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Comisiones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.commissions)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* ABONOS */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `1px solid ${colorTokens.warning}30`,
                    borderRadius: 4,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colorTokens.warning }}>
                          <MonetizationOnIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                          Abonos
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                        {formatPrice(dailyData.abonos.total)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transacciones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {dailyData.abonos.transactions}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Comisiones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.commissions)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* MEMBRESÍAS */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `1px solid ${colorTokens.success}30`,
                    borderRadius: 4,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colorTokens.success }}>
                          <AssessmentIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          Membresías
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                        {formatPrice(dailyData.memberships.total)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.efectivo)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.transferencia)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Débito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.debito)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Crédito:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.credito)}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Transacciones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {dailyData.memberships.transactions}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Comisiones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.commissions)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* 💸 EGRESOS Y BALANCE FINAL */}
          <Grid size={{ xs: 12 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Grid container spacing={3}>
                {/* EGRESOS */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `2px solid ${colorTokens.danger}40`,
                    borderRadius: 4,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colorTokens.danger }}>
                          <AttachMoneyIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                          Egresos del Día
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.danger, mb: 2 }}>
                        - {formatPrice(dailyData.totals.expenses_amount || 0)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Total de egresos:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          {dailyData.expenses?.count || 0} registros
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* BALANCE FINAL */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                    border: `3px solid ${colorTokens.success}`,
                    borderRadius: 4,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colorTokens.success, width: 56, height: 56 }}>
                          <TrendingUpIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          Balance Final
                        </Typography>
                      </Box>
                      
                      <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.success, mb: 2 }}>
                        {formatPrice(dailyData.totals.final_balance || 0)}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Total Ingresos: {formatPrice(dailyData.totals.total)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Total Egresos: {formatPrice(dailyData.totals.expenses_amount || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* 🎯 ACCIONES RÁPIDAS */}
          <Grid size={{ xs: 12 }}>
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
                        onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                          color: colorTokens.textPrimary,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        Crear Nuevo Corte
                      </Button>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => router.push('/dashboard/admin/cortes/historial')}
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
                        startIcon={<AssessmentIcon />}
                        sx={{
                          borderColor: colorTokens.success,
                          color: colorTokens.success,
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: colorTokens.successHover,
                            backgroundColor: `${colorTokens.success}20`
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


