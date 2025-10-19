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
  Container,
  Fade,
  Zoom,
  Slide,
  Grow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

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

// ✅ COMPONENTE DE ESTADÍSTICA MEMOIZADO - VERSIÓN MODERNA
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  accentColor: string;
}

const StatCard = memo(({ title, value, icon: Icon, iconColor, accentColor }: StatCardProps) => (
  <Zoom in={true} timeout={400}>
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Paper sx={{
        p: { xs: 2.5, sm: 3 },
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: `1px solid ${colorTokens.border}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.1)`,
        '&:hover': {
          border: `1px solid ${accentColor}60`,
          boxShadow: `0 12px 40px ${accentColor}30, 0 0 0 1px ${accentColor}20`,
          background: `linear-gradient(135deg, ${accentColor}08 0%, rgba(255, 255, 255, 0.02) 100%)`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}AA)`,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        },
        '&:hover::before': {
          opacity: 1
        }
      }}>
        {/* Icono de fondo decorativo */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.03,
          transform: 'rotate(-15deg)'
        }}>
          <Icon sx={{ fontSize: 140, color: colorTokens.textPrimary }} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Icono principal con background */}
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${iconColor}, ${iconColor}CC)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: `0 8px 24px ${iconColor}40`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
              boxShadow: `0 12px 32px ${iconColor}60`
            }
          }}>
            <Icon sx={{ fontSize: 32, color: colorTokens.neutral0 }} />
          </Box>

          {/* Valor */}
          <Typography variant="h3" sx={{
            fontWeight: 900,
            color: colorTokens.textPrimary,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            mb: 0.5,
            letterSpacing: '-0.5px'
          }}>
            {value}
          </Typography>

          {/* Título */}
          <Typography variant="body2" sx={{
            color: colorTokens.textSecondary,
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            letterSpacing: '0.3px'
          }}>
            {title}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  </Zoom>
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
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
    }}>
      {/* 🎯 HEADER MODERNO CON GLASSMORPHISM */}
      <Fade in={true} timeout={600}>
        <Paper sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: { xs: 2, sm: 2.5, md: 3 },
          background: `linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${colorTokens.brand}15, transparent)`,
            animation: 'shine 3s infinite',
          },
          '@keyframes shine': {
            '0%': { left: '-100%' },
            '100%': { left: '100%' }
          }
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: { xs: 2, sm: 2.5, md: 3 },
            gap: 2,
            position: 'relative',
            zIndex: 1
          }}>
            <Box>
              <Typography variant="h4" sx={{
                color: colorTokens.brand,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
                textShadow: `0 0 20px ${colorTokens.brand}60`,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                letterSpacing: '0.5px'
              }}>
                <Box sx={{
                  width: { xs: 48, sm: 52, md: 56 },
                  height: { xs: 48, sm: 52, md: 56 },
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 20px ${colorTokens.brand}60`,
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-5px)' }
                  }
                }}>
                  <FitnessCenterIcon sx={{ fontSize: { xs: 28, sm: 30, md: 32 }, color: colorTokens.neutral0 }} />
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard Membresías</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Membresías</Box>
              </Typography>
              <Typography variant="body1" sx={{
                color: colorTokens.textSecondary,
                mt: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500,
                opacity: 0.9
              }}>
                Gestión de membresías activas, pagos y estadísticas del gimnasio
              </Typography>
            </Box>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5, md: 2 }, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            {/* 🔔 BOTÓN DE RECORDATORIOS DE VENCIMIENTO */}
            <MembershipExpirationReminder daysBeforeExpiration={3} />

            <Button
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outlined"
              sx={{
                color: colorTokens.brand,
                borderColor: colorTokens.brand + '60',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 },
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
              startIcon={<PersonAddAltIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={handleNewSale}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                fontWeight: 700,
                px: { xs: 2, sm: 2.5, md: 3 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 },
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.success}CC, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${colorTokens.success}50`
                }
              }}
            >
              Nueva Venta
            </Button>
          </Box>
        </Box>

        {/* 📊 RESUMEN MEJORADO */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          p: { xs: 2, sm: 2.5, md: 3 },
          background: `linear-gradient(135deg, ${colorTokens.brand}12, ${colorTokens.brand}06)`,
          borderRadius: 3,
          border: `1px solid ${colorTokens.brand}40`,
          backdropFilter: 'blur(10px)',
          gap: { xs: 2, md: 0 },
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${colorTokens.brand}40`
            }}>
              <PaymentIcon sx={{ color: colorTokens.neutral0, fontSize: 22 }} />
            </Box>
            <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Total: <Box component="span" sx={{ color: colorTokens.brand }}>{stats.total}</Box> membresías | <Box component="span" sx={{ color: colorTokens.success }}>{stats.new_this_month} nuevas</Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 3 } }}>
            <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <LinearProgress
                variant="determinate"
                value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: `${colorTokens.brand}20`,
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: colorTokens.brand,
                    borderRadius: 5,
                    boxShadow: `0 0 15px ${colorTokens.brand}80`,
                    background: `linear-gradient(90deg, ${colorTokens.brand}, #FFD700, ${colorTokens.brand})`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmerProgress 2s ease infinite',
                  },
                  '@keyframes shimmerProgress': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                  }
                }}
              />
              <Typography variant="caption" sx={{
                color: colorTokens.brand,
                fontWeight: 700,
                display: 'block',
                textAlign: 'center',
                mt: 0.5,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Activas
              </Typography>
            </Box>

            <Typography variant="h6" sx={{
              color: colorTokens.brand,
              fontWeight: 800,
              fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem' },
              textAlign: { xs: 'center', sm: 'left' },
              textShadow: `0 0 10px ${colorTokens.brand}60`
            }}>
              {formatPrice(stats.revenue_this_month)}
            </Typography>
          </Box>
        </Box>
      </Paper>
      </Fade>

      {/* 📊 ESTADÍSTICAS MODERNAS CON GLASSMORPHISM */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 3.5, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Membresías Activas"
            value={stats.active}
            icon={CheckCircleIcon}
            iconColor={colorTokens.success}
            accentColor={colorTokens.success}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Por Vencer (7 días)"
            value={stats.expiring_soon}
            icon={ScheduleIcon}
            iconColor={colorTokens.warning}
            accentColor={colorTokens.warning}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Congeladas"
            value={stats.frozen}
            icon={PauseCircleIcon}
            iconColor={colorTokens.info}
            accentColor={colorTokens.info}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ingresos del Mes"
            value={formatPrice(stats.revenue_this_month)}
            icon={AttachMoneyIcon}
            iconColor={colorTokens.brand}
            accentColor={colorTokens.brand}
          />
        </Grid>
      </Grid>

      {/* 🚀 ACCIONES Y ANALYTICS MODERNOS */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="right" in={true} timeout={500}>
            <Paper sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 4,
              height: '100%',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.1)`,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${colorTokens.brand}50`
                }}>
                  <AutoAwesomeIcon sx={{ color: colorTokens.neutral0, fontSize: 26 }} />
                </Box>
                <Typography variant="h6" sx={{
                  color: colorTokens.brand,
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
                }}>
                  Acciones Rápidas
                </Typography>
              </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAddAltIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />}
                onClick={handleNewSale}
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                  color: colorTokens.textOnBrand,
                  fontWeight: 600,
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
                startIcon={<HistoryIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />}
                onClick={handleHistory}
                sx={{
                  color: colorTokens.textPrimary,
                  borderColor: colorTokens.border,
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
                startIcon={<LocalOfferIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />}
                onClick={handleCoupons}
                sx={{
                  color: colorTokens.warning,
                  borderColor: colorTokens.warning + '40',
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
          </Slide>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="left" in={true} timeout={500}>
            <Paper sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 4,
              height: '100%',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.1)`,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${colorTokens.info}50`
                }}>
                  <TrendingUpIcon sx={{ color: colorTokens.neutral0, fontSize: 26 }} />
                </Box>
                <Typography variant="h6" sx={{
                  color: colorTokens.info,
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
                }}>
                  Analytics del Mes
                </Typography>
              </Box>

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Grow in={true} timeout={600}>
                  <Box sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 2.5 },
                    background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}08)`,
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: `1px solid ${colorTokens.success}40`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${colorTokens.success}30`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: colorTokens.success
                    }
                  }}>
                    <Typography variant="h4" sx={{
                      color: colorTokens.success,
                      fontWeight: 900,
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}>
                      {stats.new_this_month}
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: colorTokens.textSecondary,
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Nuevas Membresías
                    </Typography>
                  </Box>
                </Grow>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Grow in={true} timeout={700}>
                  <Box sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 2.5 },
                    background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}08)`,
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: `1px solid ${colorTokens.warning}40`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${colorTokens.warning}30`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: colorTokens.warning
                    }
                  }}>
                    <Typography variant="h4" sx={{
                      color: colorTokens.warning,
                      fontWeight: 900,
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}>
                      {stats.expiring_soon}
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: colorTokens.textSecondary,
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Por Renovar
                    </Typography>
                  </Box>
                </Grow>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ borderColor: colorTokens.border, my: { xs: 1.5, sm: 2 } }} />
                <Grow in={true} timeout={800}>
                  <Box sx={{
                    textAlign: 'center',
                    p: { xs: 2.5, sm: 3 },
                    background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: `2px solid ${colorTokens.brand}50`,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 4px 20px ${colorTokens.brand}30`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: `0 8px 32px ${colorTokens.brand}40`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${colorTokens.brand}, #FFD700, ${colorTokens.brand})`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }
                  }}>
                    <AttachMoneyIcon sx={{
                      fontSize: 40,
                      color: colorTokens.brand,
                      mb: 1,
                      filter: `drop-shadow(0 0 10px ${colorTokens.brand}80)`
                    }} />
                    <Typography variant="h4" sx={{
                      color: colorTokens.brand,
                      fontWeight: 900,
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      textShadow: `0 0 15px ${colorTokens.brand}60`
                    }}>
                      {formatPrice(stats.revenue_this_month)}
                    </Typography>
                    <Typography variant="body1" sx={{
                      color: colorTokens.textPrimary,
                      fontWeight: 700,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      mb: 0.5
                    }}>
                      Ingresos Totales
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: colorTokens.textSecondary,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}>
                      Facturación del mes actual
                    </Typography>
                  </Box>
                </Grow>
              </Grid>
            </Grid>
          </Paper>
          </Slide>
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