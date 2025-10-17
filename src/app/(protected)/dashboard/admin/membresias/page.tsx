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
      p: { xs: 2, sm: 2.5, md: 3 },
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: textColor, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: `${textColor}CC`, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {title}
          </Typography>
        </Box>
        <Icon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, opacity: 0.8, color: textColor }} />
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
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
    }}>
      {/* 🎯 HEADER ENTERPRISE OPTIMIZADO */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: { xs: 2, sm: 2.5, md: 3 },
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{
              color: colorTokens.brand,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5, md: 2 },
              textShadow: `0 0 20px ${colorTokens.glow}`,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <FitnessCenterIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: colorTokens.brand }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard Membresías MUP</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Membresías</Box>
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
                background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
                fontWeight: 600,
                px: { xs: 2, sm: 2.5, md: 3 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 },
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
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: colorTokens.brand + '10',
          borderRadius: 2,
          border: `1px solid ${colorTokens.brand}30`,
          backdropFilter: 'blur(5px)',
          gap: { xs: 2, md: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <PaymentIcon sx={{ color: colorTokens.brand, fontSize: { xs: 24, sm: 26, md: 28 } }} />
            <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              📊 Total: {stats.total} membresías | {stats.new_this_month} nuevas este mes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 3 } }}>
            <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
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
                mt: 0.5,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Activas
              </Typography>
            </Box>

            <Typography variant="h6" sx={{
              color: colorTokens.brand,
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              {formatPrice(stats.revenue_this_month)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 📊 ESTADÍSTICAS ENTERPRISE MEMOIZADAS */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 3.5, md: 4 } }}>
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
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{
              color: colorTokens.brand,
              mb: { xs: 2, sm: 2.5, md: 3 },
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
            }}>
              ⚡ Acciones Rápidas
            </Typography>

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
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{
              color: colorTokens.brand,
              mb: { xs: 2, sm: 2.5, md: 3 },
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
            }}>
              📈 Analytics del Mes
            </Typography>

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: colorTokens.success + '10',
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.success}30`
                }}>
                  <Typography variant="h5" sx={{
                    color: colorTokens.success,
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}>
                    {stats.new_this_month}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: colorTokens.textSecondary,
                    fontWeight: 500,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    Nuevas Membresías
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: colorTokens.warning + '10',
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.warning}30`
                }}>
                  <Typography variant="h5" sx={{
                    color: colorTokens.warning,
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}>
                    {stats.expiring_soon}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: colorTokens.textSecondary,
                    fontWeight: 500,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    Por Renovar
                  </Typography>
                </Box>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ borderColor: colorTokens.divider, my: { xs: 1.5, sm: 2 } }} />
                <Box sx={{
                  textAlign: 'center',
                  p: { xs: 2, sm: 2.5, md: 3 },
                  bgcolor: colorTokens.brand + '10',
                  borderRadius: 2,
                  border: `1px solid ${colorTokens.brand}30`
                }}>
                  <Typography variant="h5" sx={{
                    color: colorTokens.brand,
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}>
                    {formatPrice(stats.revenue_this_month)}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}>
                    💰 Ingresos Totales
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: colorTokens.textSecondary,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
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