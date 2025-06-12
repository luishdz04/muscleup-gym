'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  LocalAtm as CashIcon,
  History as HistoryIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/utils/formatUtils';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#E91E63'
};

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
  success: boolean;
  timestamp: string;
}

const paymentMethods = [
  { key: 'efectivo', label: 'Efectivo', icon: CashIcon, color: darkProTokens.primary },
  { key: 'transferencia', label: 'Transferencia', icon: BankIcon, color: darkProTokens.info },
  { key: 'debito', label: 'Tarjeta Débito', icon: CreditCardIcon, color: darkProTokens.success },
  { key: 'credito', label: 'Tarjeta Crédito', icon: CreditCardIcon, color: darkProTokens.error },
  { key: 'mixto', label: 'Pago Mixto', icon: ReceiptIcon, color: darkProTokens.warning }
];

export default function CortesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
const [selectedDate, setSelectedDate] = useState(() => {
  const now = new Date();
  const monterreyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
  return monterreyTime.toISOString().split('T')[0];
});
  // ✅ FUNCIÓN PARA CARGAR DATOS DEL DÍA
  const loadDailyData = useCallback(async (date: string = selectedDate) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cuts/daily-data?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
      } else {
        console.error('Error cargando datos:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // ✅ FUNCIÓN PARA REFRESCAR DATOS
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadDailyData();
    setRefreshing(false);
  }, [loadDailyData]);

  // ✅ CARGAR DATOS AL MONTAR
  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

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
            <BarChartIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              Dashboard de Cortes
            </Typography>
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              📅 {formatDate(selectedDate)} • Gestión de cortes de caja
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={refreshData}
            disabled={refreshing}
            sx={{
              borderColor: darkProTokens.info,
              color: darkProTokens.info,
              '&:hover': {
                borderColor: darkProTokens.infoHover,
                backgroundColor: `${darkProTokens.info}20`
              }
            }}
          >
            Actualizar
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.roleAdmin}CC)`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 3
            }}
          >
            Nuevo Corte
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => router.push('/dashboard/admin/cortes/historial')}
            sx={{
              borderColor: darkProTokens.warning,
              color: darkProTokens.warning,
              '&:hover': {
                borderColor: darkProTokens.warningHover,
                backgroundColor: `${darkProTokens.warning}20`
              }
            }}
          >
            Historial
          </Button>
        </Box>
      </Box>

      {/* 🔄 LOADING STATE */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={40} sx={{ color: darkProTokens.roleAdmin }} />
        </Box>
      )}

      {/* 📊 CONTENIDO PRINCIPAL */}
      {!loading && dailyData && (
        <Grid container spacing={4}>
          {/* 📈 RESUMEN GENERAL */}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin }}>
                      💰 Resumen del Día
                    </Typography>
                    <Chip
                      label={`${dailyData.totals.transactions} transacciones`}
                      sx={{
                        backgroundColor: `${darkProTokens.roleAdmin}20`,
                        color: darkProTokens.roleAdmin,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(dailyData.totals.total)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Ingresos Totales
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(dailyData.totals.commissions)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Comisiones
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(dailyData.totals.net_amount)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Monto Neto
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          {dailyData.totals.transactions}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Transacciones
                        </Typography>
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
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: darkProTokens.textPrimary }}>
                💳 Desglose por Métodos de Pago
              </Typography>
              
              <Grid container spacing={3}>
                {paymentMethods.map((method, index) => {
                  const Icon = method.icon;
                  const amount = dailyData.totals[method.key as keyof typeof dailyData.totals] as number;
                  const percentage = dailyData.totals.total > 0 ? (amount / dailyData.totals.total) * 100 : 0;
                  
                  return (
                    <Grid xs={12} sm={6} md={2.4} key={method.key}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                          border: `1px solid ${method.color}30`,
                          borderRadius: 3,
                          height: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${method.color}30`
                          },
                          transition: 'all 0.3s ease'
                        }}>
                          <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Icon sx={{ fontSize: 32, color: method.color, mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 0.5 }}>
                              {formatPrice(amount)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                              {method.label}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: `${method.color}20`,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: method.color
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ color: method.color, fontWeight: 600 }}>
                              {percentage.toFixed(1)}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </motion.div>
          </Grid>

          {/* 🏪 DESGLOSE POS VS MEMBRESÍAS */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: darkProTokens.textPrimary }}>
                🏪 Desglose por Fuente de Ingresos
              </Typography>
              
              <Grid container spacing={3}>
                {/* POS */}
                <Grid xs={12} md={6}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.info}30`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ReceiptIcon sx={{ color: darkProTokens.info, mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          Punto de Venta
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                        {formatPrice(dailyData.pos.total)}
                      </Typography>
                      
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Transacciones:</Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            {dailyData.pos.transactions}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisiones:</Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                            {formatPrice(dailyData.pos.commissions)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* MEMBRESÍAS */}
                <Grid xs={12} md={6}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.success}30`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TrendingUpIcon sx={{ color: darkProTokens.success, mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          Membresías
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                        {formatPrice(dailyData.memberships.total)}
                      </Typography>
                      
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Transacciones:</Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            {dailyData.memberships.transactions}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>Comisiones:</Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                            {formatPrice(dailyData.memberships.commissions)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* 📋 ACCIONES RÁPIDAS */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.primary}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: darkProTokens.primary }}>
                    🚀 Acciones Rápidas
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/dashboard/admin/cortes/nuevo')}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.roleAdmin}CC)`,
                          py: 1.5
                        }}
                      >
                        Crear Corte
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => router.push('/dashboard/admin/cortes/historial')}
                        sx={{
                          borderColor: darkProTokens.warning,
                          color: darkProTokens.warning,
                          py: 1.5
                        }}
                      >
                        Ver Historial
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TodayIcon />}
    onClick={() => {
  const now = new Date();
  const monterreyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
  monterreyTime.setDate(monterreyTime.getDate() - 1);
  loadDailyData(monterreyTime.toISOString().split('T')[0]);
}}
                        sx={{
                          borderColor: darkProTokens.info,
                          color: darkProTokens.info,
                          py: 1.5
                        }}
                      >
                        Día Anterior
                      </Button>
                    </Grid>
                    
                    <Grid xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={refreshData}
                        sx={{
                          borderColor: darkProTokens.success,
                          color: darkProTokens.success,
                          py: 1.5
                        }}
                      >
                        Actualizar
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* ❌ ERROR STATE */}
      {!loading && !dailyData && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Error al cargar los datos del día. Por favor, intenta nuevamente.
        </Alert>
      )}
    </Box>
  );
}
