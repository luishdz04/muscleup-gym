'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Container
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
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
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
};

// Iconos
import PaymentIcon from '@mui/icons-material/Payment';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

interface MembershipStats {
  total: number;
  active: number;
  expired: number;
  frozen: number;
  revenue_this_month: number;
  new_this_month: number;
  expiring_soon: number;
}

export default function MembresiasPage() {
  const router = useRouter();
  
  // Estados principales
  const [stats, setStats] = useState<MembershipStats>({
    total: 0,
    active: 0,
    expired: 0,
    frozen: 0,
    revenue_this_month: 0,
    new_this_month: 0,
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      
      // Cargar todas las membresías para calcular estadísticas
      const { data: allMemberships, error: statsError } = await supabase
        .from('user_memberships')
        .select('*');

      if (statsError) throw statsError;

      // Calcular estadísticas
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const calculatedStats: MembershipStats = {
        total: allMemberships?.length || 0,
        active: allMemberships?.filter(m => m.status === 'active').length || 0,
        expired: allMemberships?.filter(m => m.status === 'expired').length || 0,
        frozen: allMemberships?.filter(m => m.status === 'frozen').length || 0,
        revenue_this_month: allMemberships
          ?.filter(m => new Date(m.created_at) >= firstDayOfMonth)
          .reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0,
        new_this_month: allMemberships
          ?.filter(m => new Date(m.created_at) >= firstDayOfMonth).length || 0,
        expiring_soon: allMemberships
          ?.filter(m => m.end_date && new Date(m.end_date) <= in7Days && m.status === 'active').length || 0
      };

      setStats(calculatedStats);
      setSuccessMessage('📊 Datos actualizados correctamente');
    } catch (err: any) {
      setError(`❌ Error cargando datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
          color: darkProTokens.textPrimary
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: darkProTokens.primary,
              mb: 2,
              filter: `drop-shadow(0 0 10px ${darkProTokens.primary}60)`
            }} 
          />
          <Typography sx={{ color: darkProTokens.textSecondary }}>
            Cargando dashboard de membresías...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* ✅ SNACKBARS CON DARK PRO SYSTEM */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={8000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.error}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.error}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={5000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.success}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.success}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 🎯 HEADER MINIMALISTA CON DARK PRO SYSTEM */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textShadow: `0 0 20px ${darkProTokens.primary}40`
            }}>
              <FitnessCenterIcon sx={{ fontSize: 40, color: darkProTokens.primary }} />
              Dashboard Membresías MUP
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Gestión de membresías activas, pagos y estadísticas del gimnasio
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSuccessMessage('🔄 Actualizando datos...');
                loadData();
              }}
              variant="outlined"
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  bgcolor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${darkProTokens.primary}30`
                },
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              Actualizar
            </Button>
            
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddAltIcon />}
              onClick={() => {
                setSuccessMessage('➕ Redirigiendo a nueva venta...');
                router.push('/dashboard/admin/membresias/registrar');
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${darkProTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${darkProTokens.success}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nueva Venta
            </Button>
          </Box>
        </Box>

        {/* 📊 RESUMEN GENERAL CON DARK PRO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${darkProTokens.primary}10`,
          borderRadius: 2,
          border: `1px solid ${darkProTokens.primary}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PaymentIcon sx={{ color: darkProTokens.primary, fontSize: 28 }} />
            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
              📊 Total: {stats.total} membresías | {stats.new_this_month} nuevas este mes
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ minWidth: 200 }}>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: darkProTokens.grayDark,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: darkProTokens.primary,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${darkProTokens.primary}40`
                  }
                }} 
              />
              <Typography variant="caption" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 600,
                display: 'block',
                textAlign: 'center',
                mt: 0.5
              }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Activas
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700
            }}>
              {formatPrice(stats.revenue_this_month)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 📊 ESTADÍSTICAS DARK PRO MINIMALISTAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              borderRadius: 3,
              border: `1px solid ${darkProTokens.success}30`,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 32px ${darkProTokens.success}40`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                    Membresías Activas
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
              color: darkProTokens.background,
              borderRadius: 3,
              border: `1px solid ${darkProTokens.warning}30`,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 32px ${darkProTokens.warning}40`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.background }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, color: darkProTokens.background }}>
                    Por Vencer (7 días)
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.background }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
              color: darkProTokens.textPrimary,
              borderRadius: 3,
              border: `1px solid ${darkProTokens.info}30`,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 32px ${darkProTokens.info}40`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                    {stats.frozen}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                    Congeladas
                  </Typography>
                </Box>
                <PauseCircleIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              borderRadius: 3,
              border: `1px solid ${darkProTokens.primary}30`,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 32px ${darkProTokens.primary}40`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: darkProTokens.background }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, color: darkProTokens.background }}>
                    Ingresos del Mes
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.background }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* 🚀 ACCIONES RÁPIDAS Y ANALYTICS MINIMALISTAS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              ⚡ Acciones Rápidas
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAddAltIcon />}
                onClick={() => {
                  setSuccessMessage('💰 Abriendo sistema de ventas...');
                  router.push('/dashboard/admin/membresias/registrar');
                }}
                sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                  color: darkProTokens.background,
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 20px ${darkProTokens.primary}40`
                  }
                }}
              >
                💰 Nueva Venta
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<HistoryIcon />}
                onClick={() => {
                  setSuccessMessage('📊 Cargando historial...');
                  router.push('/dashboard/admin/membresias/historial');
                }}
                sx={{
                  color: darkProTokens.textPrimary,
                  borderColor: darkProTokens.grayDark,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: darkProTokens.textPrimary,
                    bgcolor: darkProTokens.hoverOverlay,
                  }
                }}
              >
                📊 Historial de Transacciones
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<LocalOfferIcon />}
                onClick={() => {
                  setSuccessMessage('🎟️ Abriendo gestión de cupones...');
                  router.push('/dashboard/admin/membresias/cupones');
                }}
                sx={{
                  color: darkProTokens.warning,
                  borderColor: `${darkProTokens.warning}40`,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: darkProTokens.warning,
                    bgcolor: `${darkProTokens.warning}10`,
                  }
                }}
              >
                🎟️ Gestionar Cupones
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              📈 Analytics del Mes
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: `${darkProTokens.success}10`,
                  borderRadius: 2,
                  border: `1px solid ${darkProTokens.success}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: darkProTokens.success, 
                    fontWeight: 700,
                    mb: 0.5
                  }}>
                    {stats.new_this_month}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Nuevas Membresías
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: `${darkProTokens.warning}10`,
                  borderRadius: 2,
                  border: `1px solid ${darkProTokens.warning}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: darkProTokens.warning, 
                    fontWeight: 700,
                    mb: 0.5
                  }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Por Renovar
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={12}>
                <Divider sx={{ borderColor: darkProTokens.grayDark, my: 2 }} />
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  bgcolor: `${darkProTokens.primary}10`,
                  borderRadius: 2,
                  border: `1px solid ${darkProTokens.primary}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 700,
                    mb: 1
                  }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: darkProTokens.textPrimary,
                    fontWeight: 600
                  }}>
                    💰 Ingresos Totales
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary
                  }}>
                    Facturación del mes actual
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        /* Scrollbar personalizado para Dark Pro System */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
