'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Tooltip,
  CircularProgress,
  Badge,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay 
} from '@/utils/dateUtils';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

// Interfaces optimizadas según BD real
interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface DailySchedules {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface PlanAccessRestriction {
  id: string;
  plan_id: string;
  access_control_enabled: boolean;
  max_daily_entries: number;
  daily_schedules: DailySchedules;
  // ✅ CAMPOS BD REALES (snake_case)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  
  // Precios
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;
  monthly_price: number;
  bimonthly_price: number;
  quarterly_price: number;
  semester_price: number;
  annual_price: number;
  
  // Duraciones
  weekly_duration: number;
  biweekly_duration: number;
  monthly_duration: number;
  bimonthly_duration: number;
  quarterly_duration: number;
  semester_duration: number;
  annual_duration: number;
  
  // Metadatos
  validity_type: string;
  validity_start_date: string | null;
  validity_end_date: string | null;
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  equipment_access: string[];
  
  // Nuevos campos de BD
  has_time_restrictions: boolean;
  allowed_days: string[];
  time_slots: any[];
  
  // ✅ CAMPOS BD REALES (snake_case)
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  
  access_restrictions?: PlanAccessRestriction;
}

const WEEKDAY_CONFIG = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' }
] as const;

// ✅ Hook personalizado para la gestión de planes (ENTERPRISE)
const usePlansManagement = () => {
  const hydrated = useHydrated();
  const { addAuditFields } = useUserTracking();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!hydrated) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('membership_plans')
        .select(`
          *,
          access_restrictions:plan_access_restrictions(*)
        `)
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      
      const mappedPlans = data?.map(plan => ({
        ...plan,
        access_restrictions: Array.isArray(plan.access_restrictions) 
          ? plan.access_restrictions[0] 
          : plan.access_restrictions
      })) || [];
      
      setPlans(mappedPlans);
      
      if (mappedPlans.length > 0) {
        notify.success(`${mappedPlans.length} planes cargados correctamente`);
      } else {
        notify.error('No hay planes configurados');
      }
      
    } catch (err: any) {
      const errorMessage = `Error cargando planes: ${err.message}`;
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [hydrated]);

  const togglePlanStatus = useCallback(async (planId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ USAR AUDIT FIELDS ENTERPRISE
      const updateData = await addAuditFields({ 
        is_active: !currentStatus 
      }, true);
      
      const { error } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId);

      if (error) throw error;
      
      setPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.id === planId 
            ? { 
                ...plan, 
                is_active: !currentStatus,
                updated_at: getCurrentTimestamp(),
                updated_by: updateData.updated_by
              } 
            : plan
        )
      );
      
      const planName = plans.find(p => p.id === planId)?.name || 'Plan';
      notify.success(`Plan "${planName}" ${!currentStatus ? 'activado' : 'desactivado'}`);
      
    } catch (err: any) {
      notify.error(`Error actualizando estado: ${err.message}`);
    }
  }, [plans, addAuditFields]);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      return { success: true };
      
    } catch (err: any) {
      const errorMessage = `Error eliminando plan: ${err.message}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      loadPlans();
    }
  }, [hydrated, loadPlans]);

  return {
    plans,
    loading,
    initialLoad,
    hydrated,
    error,
    loadPlans,
    togglePlanStatus,
    deletePlan,
    hasPlans: plans.length > 0
  };
};

// ✅ Hook para utilidades de precios (MEMOIZADO)
const usePriceUtils = () => {
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const getBestPrice = useCallback((plan: MembershipPlan) => {
    if (plan.monthly_price > 0) return plan.monthly_price;
    if (plan.weekly_price > 0) return plan.weekly_price;
    if (plan.biweekly_price > 0) return plan.biweekly_price;
    if (plan.visit_price > 0) return plan.visit_price;
    if (plan.bimonthly_price > 0) return plan.bimonthly_price;
    if (plan.quarterly_price > 0) return plan.quarterly_price;
    if (plan.semester_price > 0) return plan.semester_price;
    if (plan.annual_price > 0) return plan.annual_price;
    return 0;
  }, []);

  const getBestPriceLabel = useCallback((plan: MembershipPlan) => {
    if (plan.monthly_price > 0) return 'Mensual';
    if (plan.weekly_price > 0) return 'Semanal';
    if (plan.biweekly_price > 0) return 'Quincenal';
    if (plan.visit_price > 0) return 'Por Visita';
    if (plan.bimonthly_price > 0) return 'Bimestral';
    if (plan.quarterly_price > 0) return 'Trimestral';
    if (plan.semester_price > 0) return 'Semestral';
    if (plan.annual_price > 0) return 'Anual';
    return 'Sin precio';
  }, []);

  const getPlanColor = useCallback((plan: MembershipPlan) => {
    const bestPrice = getBestPrice(plan);
    if (bestPrice <= 500) return colorTokens.success;
    if (bestPrice <= 1000) return colorTokens.warning;
    if (bestPrice <= 1500) return colorTokens.info;
    return colorTokens.neutral800;
  }, [getBestPrice]);

  return {
    formatPrice,
    getBestPrice,
    getBestPriceLabel,
    getPlanColor
  };
};

// ✅ Componente memoizado para las estadísticas
const StatsCard = memo<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  gradient?: string;
}>(({ title, value, icon: Icon, color, gradient }) => (
  <Paper sx={{
    p: { xs: 2, sm: 2.5, md: 3 },
    background: gradient || `linear-gradient(135deg, ${color}, ${color}CC)`,
    color: colorTokens.neutral1200,
    borderRadius: 3,
    border: `1px solid ${color}30`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 32px ${color}40`
    }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
        }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{
          opacity: 0.9,
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}>
          {title}
        </Typography>
      </Box>
      <Icon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, opacity: 0.8 }} />
    </Box>
  </Paper>
));

// ✅ COMPONENTE PRINCIPAL OPTIMIZADO ENTERPRISE
export default function PlanesPage() {
  const router = useRouter();
  const { alert } = useNotifications();
  const { plans, loading, initialLoad, hydrated, loadPlans, togglePlanStatus, deletePlan, hasPlans } = usePlansManagement();
  const { formatPrice, getBestPrice, getBestPriceLabel, getPlanColor } = usePriceUtils();

  // ✅ Estados memoizados para estadísticas
  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter(p => p.is_active).length,
    withRestrictions: plans.filter(p => p.access_restrictions?.access_control_enabled).length,
    withClasses: plans.filter(p => p.classes_included).length
  }), [plans]);

  // ✅ Funciones de manejo memoizadas
  const handleDeleteClick = useCallback(async (plan: MembershipPlan) => {
    const result = await alert.deleteConfirm(`"${plan.name}"`);
    
    if (result.isConfirmed) {
      const deleteResult = await deletePlan(plan.id);
      if (deleteResult.success) {
        notify.success(`Plan "${plan.name}" eliminado exitosamente`);
      } else {
        notify.error(deleteResult.error || 'Error eliminando plan');
      }
    }
  }, [deletePlan, alert]);

  const viewPlanDetails = useCallback((plan: MembershipPlan) => {
    router.push(`/dashboard/admin/planes/${plan.id}`);
  }, [router]);

  const getPlanPopularity = useCallback((plan: MembershipPlan) => {
    let score = 0;
    if (plan.gym_access) score += 20;
    if (plan.classes_included) score += 30;
    if (plan.guest_passes > 0) score += 15;
    if (!plan.access_restrictions?.access_control_enabled) score += 25;
    if (plan.features && plan.features.length > 3) score += 10;
    return Math.min(score, 100);
  }, []);

  const formatTimeAgo = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'hace un momento';
      if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
      return `hace ${Math.floor(diffInSeconds / 86400)}d`;
    } catch {
      return 'fecha inválida';
    }
  }, []);

  // ✅ PANTALLA DE CARGA HASTA HIDRATACIÓN (SSR SAFETY)
  if (!hydrated || initialLoad) {
    return (
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
              filter: `drop-shadow(0 0 10px ${colorTokens.brand}60)`
            }} 
          />
          <Typography sx={{ color: colorTokens.neutral900 }}>
            Cargando planes de membresía...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200,
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      
      {/* Header principal */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: { xs: 2, sm: 2.5, md: 3 },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Typography variant="h4" sx={{
              color: colorTokens.brand,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5, md: 2 },
              textShadow: `0 0 20px ${colorTokens.brand}40`,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <FitnessCenterIcon sx={{ fontSize: { xs: 28, sm: 34, md: 40 }, color: colorTokens.brand }} />
              Gestión de Planes
            </Typography>
            <Typography variant="body1" sx={{
              color: colorTokens.neutral900,
              mt: 1,
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Administra el catálogo de membresías disponibles
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            alignItems: 'center',
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' }
          }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${stats.active}/${stats.total} activos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                '& .MuiChip-icon': { color: colorTokens.success }
              }}
            />

            <Button
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              onClick={loadPlans}
              variant="outlined"
              sx={{
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}60`,
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                '&:hover': {
                  borderColor: colorTokens.brand,
                  bgcolor: `${colorTokens.brand}10`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${colorTokens.brand}30`
                },
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Actualizar</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                <RefreshIcon />
              </Box>
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={() => router.push('/dashboard/admin/planes/crear')}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, #22C55E)`,
                fontWeight: 600,
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' },
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, #22C55E, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${colorTokens.success}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Crear Nuevo Plan</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Nuevo</Box>
            </Button>
          </Box>
        </Box>

        {/* Información de resultados */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          p: { xs: 2, sm: 2.5, md: 3 },
          gap: { xs: 2, md: 0 },
          bgcolor: `${colorTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
            <LocalOfferIcon sx={{ color: colorTokens.success, fontSize: { xs: 24, sm: 28 } }} />
            <Typography sx={{
              color: colorTokens.neutral1200,
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' }
            }}>
              Total de planes: {stats.total}
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' }
          }}>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${stats.active} activos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' },
                '& .MuiChip-icon': { color: colorTokens.success }
              }}
            />
            <Chip
              icon={<CancelIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${stats.total - stats.active} inactivos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.danger}20`,
                color: colorTokens.danger,
                border: `1px solid ${colorTokens.danger}40`,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' },
                '& .MuiChip-icon': { color: colorTokens.danger }
              }}
            />
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${stats.withRestrictions} con restricciones`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.warning}20`,
                color: colorTokens.warning,
                border: `1px solid ${colorTokens.warning}40`,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' },
                '& .MuiChip-icon': { color: colorTokens.warning }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Planes"
            value={stats.total}
            icon={FitnessCenterIcon}
            color={colorTokens.success}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Planes Activos"
            value={stats.active}
            icon={CheckCircleIcon}
            color={colorTokens.info}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Con Restricciones"
            value={stats.withRestrictions}
            icon={AccessTimeIcon}
            color={colorTokens.warning}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Con Clases"
            value={stats.withClasses}
            icon={GroupIcon}
            color={colorTokens.neutral800}
          />
        </Grid>
      </Grid>

      {/* Tabla de planes */}
      <TableContainer
        component={Paper}
        sx={{
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: 3,
          overflow: { xs: 'auto', md: 'hidden' },
          overflowX: { xs: 'auto', md: 'auto' },
          backdropFilter: 'blur(10px)',
          maxWidth: '100%',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: `${colorTokens.neutral1200} !important`,
            borderColor: `${colorTokens.neutral400} !important`,
            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
            padding: { xs: '8px', sm: '12px', md: '16px' }
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                minWidth: { xs: 200, sm: 220, md: 250 }
              }}>
                Plan & Popularidad
              </TableCell>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                minWidth: { xs: 150, sm: 160, md: 180 }
              }}>
                Precios
              </TableCell>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                minWidth: { xs: 180, sm: 190, md: 200 }
              }}>
                Características
              </TableCell>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                minWidth: { xs: 120, sm: 130, md: 140 }
              }}>
                Restricciones
              </TableCell>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                minWidth: { xs: 100, sm: 110, md: 120 }
              }}>
                Estado
              </TableCell>
              <TableCell sx={{
                bgcolor: `${colorTokens.neutral400} !important`,
                color: `${colorTokens.neutral1200} !important`,
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                textAlign: 'center',
                minWidth: { xs: 120, sm: 130, md: 140 }
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {plans.map((plan, index) => {
                const planColor = getPlanColor(plan);
                const popularity = getPlanPopularity(plan);
                const bestPrice = getBestPrice(plan);
                const bestPriceLabel = getBestPriceLabel(plan);
                
                const enabledDaysCount = plan.access_restrictions?.daily_schedules 
                  ? Object.values(plan.access_restrictions.daily_schedules).filter(s => s.enabled).length 
                  : 7;
                
                return (
                  <TableRow 
                    key={plan.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        bgcolor: `${colorTokens.brand}05 !important`,
                        transform: 'scale(1.01)',
                        boxShadow: `0 4px 20px ${colorTokens.brand}20`,
                      },
                      '&:nth-of-type(odd)': {
                        bgcolor: `${colorTokens.neutral100} !important`,
                      },
                      '&:nth-of-type(even)': {
                        bgcolor: `${colorTokens.neutral200} !important`,
                      }
                    }}
                  >
                    {/* Plan & Popularidad */}
                    <TableCell sx={{ minWidth: { xs: 200, sm: 220, md: 250 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5, md: 2 } }}>
                        <Badge
                          badgeContent={
                            plan.is_active ? (
                              <StarIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: colorTokens.brand }} />
                            ) : null
                          }
                          color="primary"
                        >
                          <Box sx={{
                            width: { xs: 40, sm: 44, md: 48 },
                            height: { xs: 40, sm: 44, md: 48 },
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${planColor}, ${planColor}CC)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colorTokens.neutral1200,
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                            boxShadow: `0 4px 15px ${planColor}40`
                          }}>
                            {plan.name[0]?.toUpperCase() || 'P'}
                          </Box>
                        </Badge>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{
                            color: colorTokens.neutral1200,
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' }
                          }}>
                            {plan.name}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: colorTokens.neutral900,
                            display: 'block',
                            mb: 1,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}>
                            {plan.description}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                            <Typography variant="caption" sx={{
                              color: colorTokens.neutral900,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}>
                              Popularidad:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={popularity}
                              sx={{
                                flex: 1,
                                height: { xs: 4, sm: 5, md: 6 },
                                borderRadius: 3,
                                bgcolor: colorTokens.neutral400,
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: planColor,
                                  borderRadius: 3,
                                  boxShadow: `0 0 10px ${planColor}40`
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{
                              color: planColor,
                              fontWeight: 600,
                              minWidth: { xs: 30, sm: 35 },
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}>
                              {popularity}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Precios */}
                    <TableCell sx={{ minWidth: { xs: 150, sm: 160, md: 180 } }}>
                      <Box>
                        <Typography variant="body2" sx={{
                          color: colorTokens.neutral1200,
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}>
                          <MonetizationOnIcon sx={{
                            fontSize: { xs: 14, sm: 16 },
                            mr: 0.5,
                            color: planColor
                          }} />
                          {formatPrice(bestPrice)}
                        </Typography>
                        <Typography variant="caption" sx={{
                          color: colorTokens.neutral900,
                          display: 'block',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          {bestPriceLabel}
                        </Typography>
                        {plan.inscription_price > 0 && (
                          <Typography variant="caption" sx={{
                            color: colorTokens.neutral900,
                            display: 'block',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}>
                            Inscripción: {formatPrice(plan.inscription_price)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Características */}
                    <TableCell sx={{ minWidth: { xs: 180, sm: 190, md: 200 } }}>
                      <Box display="flex" gap={{ xs: 0.5, sm: 1 }} flexWrap="wrap">
                        {plan.gym_access && (
                          <Chip
                            size="small"
                            label="Gimnasio"
                            icon={<FitnessCenterIcon />}
                            sx={{
                              bgcolor: `${colorTokens.success}20`,
                              color: colorTokens.success,
                              border: `1px solid ${colorTokens.success}40`,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              height: { xs: '22px', sm: '24px' },
                              '& .MuiChip-icon': {
                                color: colorTokens.success,
                                fontSize: { xs: 14, sm: 16 }
                              }
                            }}
                          />
                        )}
                        {plan.classes_included && (
                          <Chip
                            size="small"
                            label="Clases"
                            icon={<GroupIcon />}
                            sx={{
                              bgcolor: `${colorTokens.neutral800}20`,
                              color: colorTokens.neutral800,
                              border: `1px solid ${colorTokens.neutral800}40`,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              height: { xs: '22px', sm: '24px' },
                              '& .MuiChip-icon': {
                                color: colorTokens.neutral800,
                                fontSize: { xs: 14, sm: 16 }
                              }
                            }}
                          />
                        )}
                        {plan.guest_passes > 0 && (
                          <Chip
                            size="small"
                            label={`${plan.guest_passes} Invitados`}
                            icon={<GroupIcon />}
                            sx={{
                              bgcolor: `${colorTokens.warning}20`,
                              color: colorTokens.warning,
                              border: `1px solid ${colorTokens.warning}40`,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              height: { xs: '22px', sm: '24px' },
                              '& .MuiChip-icon': {
                                color: colorTokens.warning,
                                fontSize: { xs: 14, sm: 16 }
                              }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    {/* Restricciones */}
                    <TableCell>
                      {plan.access_restrictions?.access_control_enabled ? (
                        <Box>
                          <Chip
                            size="small"
                            label={`${plan.access_restrictions.max_daily_entries} entrada${plan.access_restrictions.max_daily_entries > 1 ? 's' : ''}/día`}
                            icon={<LockIcon />}
                            sx={{
                              bgcolor: `${colorTokens.warning}20`,
                              color: colorTokens.warning,
                              border: `1px solid ${colorTokens.warning}40`,
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              height: { xs: '22px', sm: '24px' },
                              '& .MuiChip-icon': {
                                color: colorTokens.warning,
                                fontSize: { xs: 14, sm: 16 }
                              },
                              mb: 0.5
                            }}
                          />
                          <Typography variant="caption" sx={{
                            display: 'block',
                            color: colorTokens.neutral900,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                          }}>
                            {enabledDaysCount}/7 días activos
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          size="small"
                          label="24/7"
                          icon={<LockOpenIcon />}
                          sx={{
                            bgcolor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            border: `1px solid ${colorTokens.success}40`,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: { xs: '22px', sm: '24px' },
                            '& .MuiChip-icon': {
                              color: colorTokens.success,
                              fontSize: { xs: 14, sm: 16 }
                            }
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                        <Switch
                          checked={plan.is_active}
                          onChange={() => togglePlanStatus(plan.id, plan.is_active)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colorTokens.success,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorTokens.success,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{
                          color: plan.is_active ? colorTokens.success : colorTokens.neutral800,
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          {plan.is_active ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    {/* Acciones */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box display="flex" gap={{ xs: 0.5, sm: 1 }} justifyContent="center">
                        <Tooltip title="Ver detalles completos">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPlanDetails(plan);
                            }}
                            sx={{
                              color: colorTokens.info,
                              padding: { xs: '4px', sm: '8px' },
                              '&:hover': {
                                bgcolor: `${colorTokens.info}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Editar plan">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/admin/planes/${plan.id}/editar`);
                            }}
                            sx={{
                              color: colorTokens.warning,
                              padding: { xs: '4px', sm: '8px' },
                              '&:hover': {
                                bgcolor: `${colorTokens.warning}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Eliminar plan">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(plan);
                            }}
                            sx={{
                              color: colorTokens.danger,
                              padding: { xs: '4px', sm: '8px' },
                              '&:hover': {
                                bgcolor: `${colorTokens.danger}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}