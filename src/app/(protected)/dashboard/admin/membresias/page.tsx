'use client';

import React, { memo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  LinearProgress,
  Container
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ✅ IMPORTAR TOKENS Y SISTEMA DE NOTIFICACIONES OPTIMIZADO
import { colorTokens } from '@/theme';
import toast from 'react-hot-toast';

// ✅ HOOK PERSONALIZADO PARA LÓGICA DE MEMBRESÍAS
import { useMembershipStats } from '@/hooks/useMembershipStats';

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
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

// ✅ COMPONENTE DE LOADING MEMOIZADO
const LoadingView = memo(() => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
    sx={{
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      color: colorTokens.neutral1200
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress 
        size={60} 
        sx={{ 
          color: colorTokens.brand,
          mb: 2,
          filter: `drop-shadow(0 0 10px ${colorTokens.brand}60)`
        }} 
      />
      <Typography sx={{ color: colorTokens.neutral900 }}>
        Cargando dashboard de membresías...
      </Typography>
    </Box>
  </Box>
));

LoadingView.displayName = 'LoadingView';

// ✅ COMPONENTE DE ESTADÍSTICA MEMOIZADO
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
}

const StatCard = memo(({ title, value, icon: Icon, gradient, textColor }: StatCardProps) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -5 }}
    transition={{ duration: 0.3 }}
  >
    <Paper sx={{
      p: 3,
      background: gradient,
      color: textColor,
      borderRadius: 3,
      border: `1px solid ${colorTokens.neutral400}`,
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 32px ${colorTokens.brand}40`
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: textColor }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: `${textColor}CC` }}>
            {title}
          </Typography>
        </Box>
        <Icon sx={{ fontSize: 40, opacity: 0.8, color: textColor }} />
      </Box>
    </Paper>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// ✅ COMPONENTE PRINCIPAL OPTIMIZADO
function MembresiasPage() {
  const router = useRouter();
  
  // ✅ HOOK PERSONALIZADO PARA LÓGICA DE DATOS
  const { 
    stats, 
    loading, 
    refreshing, 
    refreshData, 
    formatPrice 
  } = useMembershipStats();

  // ✅ HANDLERS OPTIMIZADOS CON NOTIFICACIONES CONTROLADAS
  const handleRefresh = React.useCallback(() => {
    // Mostrar loading sin duplicar notificaciones
    const loadingToast = toast.loading('🔄 Actualizando datos...');
    
    refreshData()
      .then(() => {
        toast.success('📊 Datos actualizados correctamente', { id: loadingToast });
      })
      .catch((error) => {
        toast.error(`❌ Error: ${error.message}`, { id: loadingToast });
      });
  }, [refreshData]);

  const handleNewSale = React.useCallback(() => {
    toast.success('➕ Redirigiendo a nueva venta...');
    router.push('/dashboard/admin/membresias/registrar');
  }, [router]);

  const handleHistory = React.useCallback(() => {
    toast.success('📊 Cargando historial...');
    router.push('/dashboard/admin/membresias/historial');
  }, [router]);

  const handleCoupons = React.useCallback(() => {
    toast.success('🎟️ Abriendo gestión de cupones...');
    router.push('/dashboard/admin/membresias/cupones');
  }, [router]);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      {/* 🎯 HEADER OPTIMIZADO */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
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
              color: colorTokens.brand, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textShadow: `0 0 20px ${colorTokens.brand}40`
            }}>
              <FitnessCenterIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
              Dashboard Membresías MUP
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.neutral900, mt: 1 }}>
              Gestión de membresías activas, pagos y estadísticas del gimnasio
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outlined"
              sx={{ 
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}60`,
                '&:hover': {
                  borderColor: colorTokens.brand,
                  bgcolor: `${colorTokens.brand}10`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${colorTokens.brand}30`
                },
                '&:disabled': {
                  opacity: 0.6
                },
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddAltIcon />}
              onClick={handleNewSale}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, #2E7D32)`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, #2E7D32, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${colorTokens.success}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nueva Venta
            </Button>
          </Box>
        </Box>

        {/* 📊 RESUMEN OPTIMIZADO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${colorTokens.brand}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.brand}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PaymentIcon sx={{ color: colorTokens.brand, fontSize: 28 }} />
            <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
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
                  bgcolor: colorTokens.neutral400,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: colorTokens.brand,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${colorTokens.brand}40`
                  }
                }} 
              />
              <Typography variant="caption" sx={{ 
                color: colorTokens.brand, 
                fontWeight: 600,
                display: 'block',
                textAlign: 'center',
                mt: 0.5
              }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Activas
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ 
              color: colorTokens.brand, 
              fontWeight: 700
            }}>
              {formatPrice(stats.revenue_this_month)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 📊 ESTADÍSTICAS MEMOIZADAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Membresías Activas"
            value={stats.active}
            icon={CheckCircleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.success}, #2E7D32)`}
            textColor={colorTokens.neutral1200}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Por Vencer (7 días)"
            value={stats.expiring_soon}
            icon={ScheduleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.warning}, #E6A700)`}
            textColor={colorTokens.neutral0}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Congeladas"
            value={stats.frozen}
            icon={PauseCircleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.info}, #1565C0)`}
            textColor={colorTokens.neutral1200}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ingresos del Mes"
            value={formatPrice(stats.revenue_this_month)}
            icon={AttachMoneyIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.brand}, #E6B800)`}
            textColor={colorTokens.neutral0}
          />
        </Grid>
      </Grid>

      {/* 🚀 ACCIONES Y ANALYTICS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.brand, 
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
                onClick={handleNewSale}
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.brand}, #E6B800)`,
                  color: colorTokens.neutral0,
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    background: `linear-gradient(135deg, #E6B800, #CCAA00)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 20px ${colorTokens.brand}40`
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
                onClick={handleHistory}
                sx={{
                  color: colorTokens.neutral1200,
                  borderColor: colorTokens.neutral400,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: colorTokens.neutral1200,
                    bgcolor: `${colorTokens.brand}10`,
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
                onClick={handleCoupons}
                sx={{
                  color: colorTokens.warning,
                  borderColor: `${colorTokens.warning}40`,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: colorTokens.warning,
                    bgcolor: `${colorTokens.warning}10`,
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
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.brand, 
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
                  bgcolor: `${colorTokens.success}10`,
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.success}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: colorTokens.success, 
                    fontWeight: 700,
                    mb: 0.5
                  }}>
                    {stats.new_this_month}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.neutral900,
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
                  bgcolor: `${colorTokens.warning}10`,
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.warning}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: colorTokens.warning, 
                    fontWeight: 700,
                    mb: 0.5
                  }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.neutral900,
                    fontWeight: 500
                  }}>
                    Por Renovar
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={12}>
                <Divider sx={{ borderColor: colorTokens.neutral400, my: 2 }} />
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  bgcolor: `${colorTokens.brand}10`,
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.brand}30`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: colorTokens.brand, 
                    fontWeight: 700,
                    mb: 1
                  }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: colorTokens.neutral1200,
                    fontWeight: 600
                  }}>
                    💰 Ingresos Totales
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.neutral900
                  }}>
                    Facturación del mes actual
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 🎨 ESTILOS CSS PERSONALIZADOS */}
      <style jsx>{`
        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${colorTokens.neutral100};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${colorTokens.brand}, #E6B800);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #E6B800, #CCAA00);
        }
      `}</style>
    </Box>
  );
}

// ✅ EXPORTAR COMPONENTE MEMOIZADO
export default memo(MembresiasPage);