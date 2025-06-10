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
    } catch (err: any) {
      setError(err.message);
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
          background: 'linear-gradient(135deg, #000000, #1a1a1a)',
          color: 'white'
        }}
      >
        <CircularProgress sx={{ color: '#FFCC00' }} size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #000000, #1a1a1a)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header Enterprise */}
      <Paper sx={{
        p: 5,
        mb: 4,
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98), rgba(45, 45, 45, 0.95))',
        border: '2px solid rgba(255, 204, 0, 0.3)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(255, 204, 0, 0.1)'
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
            <Typography variant="h3" sx={{ 
              color: '#FFCC00', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <PaymentIcon sx={{ fontSize: 50 }} />
              Centro de Control Empresarial
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 300
            }}>
              Dashboard de Membresías, Pagos y Sistema POS
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Button
              size="large"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              sx={{ 
                color: '#FFCC00',
                borderColor: 'rgba(255, 204, 0, 0.6)',
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#FFCC00',
                  backgroundColor: 'rgba(255, 204, 0, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
            >
              Actualizar Datos
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAddAltIcon />}
              onClick={() => router.push('/dashboard/admin/membresias/registrar')}
              sx={{
                background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                color: 'black',
                fontWeight: 800,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFB300, #FF8F00)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(255, 204, 0, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              🚀 Nueva Venta
            </Button>
          </Box>
        </Box>

        {/* Progreso general Enterprise */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 4,
          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.05))',
          borderRadius: 4,
          border: '1px solid rgba(255, 204, 0, 0.3)'
        }}>
          <Box>
            <Typography sx={{ 
              color: 'white', 
              fontWeight: 700,
              fontSize: '1.3rem',
              mb: 1
            }}>
              📊 Resumen Ejecutivo: {stats.total} membresías activas en el sistema
            </Typography>
            <Typography sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem'
            }}>
              Rendimiento mensual: {stats.new_this_month} nuevas ventas | {formatPrice(stats.revenue_this_month)} ingresos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ width: 200 }}>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#FFCC00',
                    borderRadius: 6
                  }
                }} 
              />
              <Typography variant="body2" sx={{ 
                color: '#FFCC00', 
                fontWeight: 700,
                textAlign: 'center',
                mt: 1
              }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Tasa de Retención
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{
            backgroundColor: 'rgba(211, 47, 47, 0.95)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Tarjetas de estadísticas Enterprise */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 4,
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05))',
              border: '2px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(76, 175, 80, 0.2)'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800,
                    color: '#4caf50',
                    mb: 1
                  }}>
                    {stats.active}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 600
                  }}>
                    Membresías Activas
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Clientes activos
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 50, color: '#4caf50', opacity: 0.8 }} />
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
              p: 4,
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.05))',
              border: '2px solid rgba(255, 152, 0, 0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(255, 152, 0, 0.2)'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800,
                    color: '#ff9800',
                    mb: 1
                  }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 600
                  }}>
                    Por Vencer
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Próximos 7 días
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 50, color: '#ff9800', opacity: 0.8 }} />
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
              p: 4,
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.05))',
              border: '2px solid rgba(33, 150, 243, 0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(33, 150, 243, 0.2)'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800,
                    color: '#2196f3',
                    mb: 1
                  }}>
                    {stats.frozen}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 600
                  }}>
                    Congeladas
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Temporalmente pausadas
                  </Typography>
                </Box>
                <PauseCircleIcon sx={{ fontSize: 50, color: '#2196f3', opacity: 0.8 }} />
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
              p: 4,
              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 204, 0, 0.1))',
              border: '2px solid rgba(255, 204, 0, 0.4)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(255, 204, 0, 0.3)'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800,
                    color: '#FFCC00',
                    mb: 1
                  }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 600
                  }}>
                    Ingresos del Mes
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Facturación mensual
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 50, color: '#FFCC00', opacity: 0.8 }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Accesos rápidos Enterprise */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 5,
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98), rgba(45, 45, 45, 0.95))',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            borderRadius: 4,
            height: '100%'
          }}>
            <Typography variant="h5" sx={{ 
              color: '#FFCC00', 
              mb: 4, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              🚀 Acciones Rápidas
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAddAltIcon />}
                onClick={() => router.push('/dashboard/admin/membresias/registrar')}
                sx={{
                  background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                  color: 'black',
                  fontWeight: 700,
                  py: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFB300, #FF8F00)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(255, 204, 0, 0.4)'
                  }
                }}
              >
                💰 Procesar Nueva Venta (Sistema POS)
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<HistoryIcon />}
                onClick={() => router.push('/dashboard/admin/membresias/historial')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                onClick={() => router.push('/dashboard/admin/membresias/cupones')}
                sx={{
                  color: '#ff9800',
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  }
                }}
              >
                🎟️ Gestionar Cupones y Descuentos
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 5,
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98), rgba(45, 45, 45, 0.95))',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            borderRadius: 4,
            height: '100%'
          }}>
            <Typography variant="h5" sx={{ 
              color: '#FFCC00', 
              mb: 4, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              📈 Analytics del Período
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  background: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#4caf50', 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {stats.new_this_month}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 600
                  }}>
                    Nuevas Membresías
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    Este mes
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  background: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 152, 0, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#ff9800', 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 600
                  }}>
                    Por Renovar
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    Próximos días
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={12}>
                <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.3)', my: 2 }} />
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 204, 0, 0.05))',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 204, 0, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#FFCC00', 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 700
                  }}>
                    💰 Total de Ingresos Mensuales
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Rendimiento financiero del período actual
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}