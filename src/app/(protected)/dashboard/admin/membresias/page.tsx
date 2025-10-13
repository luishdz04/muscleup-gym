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

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS MUP v4.1
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay,
  getTodayInMexico
} from '@/utils/dateUtils';

// ✅ HOOK PERSONALIZADO PARA LÓGICA DE MEMBRESÍAS
import { useMembershipStats } from '@/hooks/useMembershipStats';

// ✅ COMPONENTE DE RECORDATORIOS DE VENCIMIENTO
import MembershipExpirationReminder from '@/components/admin/MembershipExpirationReminder';

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

// ✅ COMPONENTE DE LOADING ENTERPRISE SSR-SAFE
const LoadingView = memo(() => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
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
          filter: `drop-shadow(0 0 10px ${colorTokens.glow})`
        }} 
      />
      <Typography sx={{ color: colorTokens.textSecondary }}>
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
      border: `1px solid ${colorTokens.border}`,
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 32px ${colorTokens.glow}`
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

// ✅ COMPONENTE PRINCIPAL ENTERPRISE v4.1
function MembresiasPage() {
  const router = useRouter();
  
  // ✅ SSR SAFETY OBLIGATORIO
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA AUTOMÁTICA (preparado para cuando se verifique el hook)
  const { addAuditFields } = useUserTracking();
  
  // ✅ HOOK PERSONALIZADO PARA LÓGICA DE DATOS
  const { 
    stats, 
    loading, 
    refreshing, 
    refreshData, 
    formatPrice 
  } = useMembershipStats();

  // ✅ HANDLERS OPTIMIZADOS CON SISTEMA DE NOTIFICACIONES UNIFICADO
  const handleRefresh = React.useCallback(async () => {
    try {
      // ✅ Sistema de notificaciones enterprise unificado
      notify.promise(
        refreshData(),
        {
          loading: '🔄 Actualizando datos...',
          success: '📊 Datos actualizados correctamente',
          error: '❌ Error al actualizar datos'
        }
      );
    } catch (error: any) {
      notify.error(`Error: ${error.message}`);
    }
  }, [refreshData]);

  const handleNewSale = React.useCallback(() => {
    notify.success('➕ Redirigiendo a nueva venta...');
    router.push('/dashboard/admin/membresias/registrar');
  }, [router]);

  const handleHistory = React.useCallback(() => {
    notify.success('📊 Cargando historial...');
    router.push('/dashboard/admin/membresias/historial');
  }, [router]);

  const handleCoupons = React.useCallback(() => {
    notify.success('🎟️ Abriendo gestión de cupones...');
    router.push('/dashboard/admin/membresias/cupones');
  }, [router]);

  // ✅ SSR SAFETY - PANTALLA DE CARGA HASTA HIDRATACIÓN
  if (!hydrated) {
    return <LoadingView />;
  }

  // ✅ LOADING STATE DESPUÉS DE HIDRATACIÓN
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        color: colorTokens.textPrimary
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: colorTokens.brand,
              mb: 2,
              filter: `drop-shadow(0 0 10px ${colorTokens.glow})`
            }} 
          />
          <Typography sx={{ color: colorTokens.textSecondary }}>
            Cargando estadísticas de membresías...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
    }}>
      {/* 🎯 HEADER ENTERPRISE OPTIMIZADO */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
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
              textShadow: `0 0 20px ${colorTokens.glow}`
            }}>
              <FitnessCenterIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
              Dashboard Membresías MUP
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, mt: 1 }}>
              Gestión de membresías activas, pagos y estadísticas del gimnasio
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 🔔 BOTÓN DE RECORDATORIOS DE VENCIMIENTO */}
            <MembershipExpirationReminder daysBeforeExpiration={3} />

            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outlined"
              sx={{ 
                color: colorTokens.brand,
                borderColor: colorTokens.brand + '60',
                '&:hover': {
                  borderColor: colorTokens.brand,
                  bgcolor: colorTokens.brand + '10',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${colorTokens.glow}`
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
                background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.successHover}, ${colorTokens.success})`,
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

        {/* 📊 RESUMEN ENTERPRISE OPTIMIZADO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: colorTokens.brand + '10',
          borderRadius: 2,
          border: `1px solid ${colorTokens.brand}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PaymentIcon sx={{ color: colorTokens.brand, fontSize: 28 }} />
            <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
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
                  bgcolor: colorTokens.neutral500,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: colorTokens.brand,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${colorTokens.glow}`
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

      {/* 📊 ESTADÍSTICAS ENTERPRISE MEMOIZADAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Membresías Activas"
            value={stats.active}
            icon={CheckCircleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`}
            textColor={colorTokens.textPrimary}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Por Vencer (7 días)"
            value={stats.expiring_soon}
            icon={ScheduleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandActive})`}
            textColor={colorTokens.textOnBrand}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Congeladas"
            value={stats.frozen}
            icon={PauseCircleIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`}
            textColor={colorTokens.textPrimary}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ingresos del Mes"
            value={formatPrice(stats.revenue_this_month)}
            icon={AttachMoneyIcon}
            gradient={`linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`}
            textColor={colorTokens.textOnBrand}
          />
        </Grid>
      </Grid>

      {/* 🚀 ACCIONES Y ANALYTICS ENTERPRISE */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
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
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                  color: colorTokens.textOnBrand,
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 20px ${colorTokens.glow}`
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
                  color: colorTokens.textPrimary,
                  borderColor: colorTokens.border,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: colorTokens.textPrimary,
                    bgcolor: colorTokens.hoverOverlay,
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
                  borderColor: colorTokens.warning + '40',
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: colorTokens.warning,
                    bgcolor: colorTokens.warning + '10',
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
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
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
                  bgcolor: colorTokens.success + '10',
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
                    color: colorTokens.textSecondary,
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
                  bgcolor: colorTokens.warning + '10',
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
                    color: colorTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Por Renovar
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={12}>
                <Divider sx={{ borderColor: colorTokens.divider, my: 2 }} />
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  bgcolor: colorTokens.brand + '10',
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
                    color: colorTokens.textPrimary,
                    fontWeight: 600
                  }}>
                    💰 Ingresos Totales
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.textSecondary
                  }}>
                    Facturación del mes actual
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 🎨 ESTILOS CSS ENTERPRISE PERSONALIZADOS */}
      <style jsx>{`
        /* Scrollbar enterprise personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${colorTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive});
        }
      `}</style>
    </Box>
  );
}

// ✅ EXPORTAR COMPONENTE MEMOIZADO ENTERPRISE
export default memo(MembresiasPage);