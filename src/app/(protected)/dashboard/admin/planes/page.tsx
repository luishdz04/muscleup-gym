'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Importaciones corregidas según la estructura real
import { useNotifications } from '@/hooks/useNotifications';
import { colorTokens } from '@/theme';

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

// Interfaces optimizadas
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

// Utilidad para formatear fechas en zona horaria de Monterrey
const formatDateForMonterrey = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Monterrey',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return 'Fecha inválida';
  }
};

// Utilidad para obtener timestamp en zona horaria de Monterrey
const getMonterreyTimestamp = (): string => {
  return new Date().toISOString();
};

// Hook personalizado para la gestión de planes
const usePlansManagement = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useNotifications();

  const loadPlans = useCallback(async () => {
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
        toast.success(`${mappedPlans.length} planes cargados correctamente`);
      } else {
        toast.error('No hay planes configurados');
      }
      
    } catch (err: any) {
      const errorMessage = `Error cargando planes: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const togglePlanStatus = useCallback(async (planId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Obtener usuario actual logueado
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('membership_plans')
        .update({ 
          is_active: !currentStatus,
          updated_by: user?.id || null,
          updated_at: getMonterreyTimestamp()
        })
        .eq('id', planId);

      if (error) throw error;
      
      setPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.id === planId 
            ? { 
                ...plan, 
                is_active: !currentStatus,
                updated_by: user?.id || null,
                updated_at: getMonterreyTimestamp()
              } 
            : plan
        )
      );
      
      const planName = plans.find(p => p.id === planId)?.name || 'Plan';
      toast.success(`Plan "${planName}" ${!currentStatus ? 'activado' : 'desactivado'}`);
      
    } catch (err: any) {
      toast.error(`Error actualizando estado: ${err.message}`);
    }
  }, [plans, toast]);

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

  return {
    plans,
    loading,
    error,
    loadPlans,
    togglePlanStatus,
    deletePlan,
    hasPlans: plans.length > 0
  };
};

// Hook para utilidades de precios
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

// Componente memoizado para las estadísticas
const StatsCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  color,
  gradient 
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  gradient?: string;
}) => (
  <Paper sx={{
    p: 3,
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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {title}
        </Typography>
      </Box>
      <Icon sx={{ fontSize: 40, opacity: 0.8 }} />
    </Box>
  </Paper>
));

// Componente principal optimizado
export default function PlanesPage() {
  const router = useRouter();
  const { toast, alert } = useNotifications();
  const { plans, loading, loadPlans, togglePlanStatus, deletePlan, hasPlans } = usePlansManagement();
  const { formatPrice, getBestPrice, getBestPriceLabel, getPlanColor } = usePriceUtils();

  // Estados memoizados para estadísticas
  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter(p => p.is_active).length,
    withRestrictions: plans.filter(p => p.access_restrictions?.access_control_enabled).length,
    withClasses: plans.filter(p => p.classes_included).length
  }), [plans]);

  // Efecto para cargar planes
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Funciones de manejo memoizadas
  const handleDeleteClick = useCallback(async (plan: MembershipPlan) => {
    const result = await alert.deleteConfirm(`"${plan.name}"`);
    
    if (result.isConfirmed) {
      const deleteResult = await deletePlan(plan.id);
      if (deleteResult.success) {
        toast.success(`Plan "${plan.name}" eliminado exitosamente`);
      } else {
        toast.error(deleteResult.error || 'Error eliminando plan');
      }
    }
  }, [deletePlan, alert, toast]);

  const viewPlanDetails = useCallback((plan: MembershipPlan) => {
    // Redirigir directamente a la página de detalles
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

  if (loading) {
    return (
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
            Cargando planes de membresía...
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
      color: colorTokens.neutral1200
    }}>
      
      {/* Header principal */}
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
              Gestión de Planes
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.neutral900, mt: 1 }}>
              Administra el catálogo de membresías disponibles
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${stats.active}/${stats.total} activos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colorTokens.success }
              }}
            />
            
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPlans}
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
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              Actualizar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/admin/planes/crear')}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, #22C55E)`,
                fontWeight: 600,
                px: 3,
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
              Crear Nuevo Plan
            </Button>
          </Box>
        </Box>

        {/* Información de resultados */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${colorTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalOfferIcon sx={{ color: colorTokens.success, fontSize: 28 }} />
            <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
              Total de planes: {stats.total}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${stats.active} activos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colorTokens.success }
              }}
            />
            <Chip
              icon={<CancelIcon />}
              label={`${stats.total - stats.active} inactivos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.danger}20`,
                color: colorTokens.danger,
                border: `1px solid ${colorTokens.danger}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colorTokens.danger }
              }}
            />
            <Chip
              icon={<AccessTimeIcon />}
              label={`${stats.withRestrictions} con restricciones`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.warning}20`,
                color: colorTokens.warning,
                border: `1px solid ${colorTokens.warning}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colorTokens.warning }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: `${colorTokens.neutral1200} !important`,
            borderColor: `${colorTokens.neutral400} !important`
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
                fontSize: '1rem'
              }}>
                Plan & Popularidad
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${colorTokens.neutral400} !important`, 
                color: `${colorTokens.neutral1200} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: '1rem'
              }}>
                Precios
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${colorTokens.neutral400} !important`, 
                color: `${colorTokens.neutral1200} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: '1rem'
              }}>
                Características
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${colorTokens.neutral400} !important`, 
                color: `${colorTokens.neutral1200} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: '1rem'
              }}>
                Restricciones
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${colorTokens.neutral400} !important`, 
                color: `${colorTokens.neutral1200} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: '1rem'
              }}>
                Estado
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${colorTokens.neutral400} !important`, 
                color: `${colorTokens.neutral1200} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${colorTokens.brand}`,
                fontSize: '1rem',
                textAlign: 'center'
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
                    <TableCell sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          badgeContent={
                            plan.is_active ? (
                              <StarIcon sx={{ fontSize: 14, color: colorTokens.brand }} />
                            ) : null
                          }
                          color="primary"
                        >
                          <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${planColor}, ${planColor}CC)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colorTokens.neutral1200,
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            boxShadow: `0 4px 15px ${planColor}40`
                          }}>
                            {plan.name[0]?.toUpperCase() || 'P'}
                          </Box>
                        </Badge>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ 
                            color: colorTokens.neutral1200, 
                            fontWeight: 600,
                            mb: 0.5
                          }}>
                            {plan.name}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: colorTokens.neutral900,
                            display: 'block',
                            mb: 1
                          }}>
                            {plan.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                              Popularidad:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={popularity}
                              sx={{
                                flex: 1,
                                height: 6,
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
                              minWidth: 35
                            }}>
                              {popularity}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* Precios */}
                    <TableCell sx={{ minWidth: 180 }}>
                      <Box>
                        <Typography variant="body2" sx={{ 
                          color: colorTokens.neutral1200, 
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          <MonetizationOnIcon sx={{ fontSize: 16, mr: 0.5, color: planColor }} />
                          {formatPrice(bestPrice)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: colorTokens.neutral900,
                          display: 'block'
                        }}>
                          {bestPriceLabel}
                        </Typography>
                        {plan.inscription_price > 0 && (
                          <Typography variant="caption" sx={{ 
                            color: colorTokens.neutral900,
                            display: 'block'
                          }}>
                            Inscripción: {formatPrice(plan.inscription_price)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    {/* Características */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {plan.gym_access && (
                          <Chip 
                            size="small" 
                            label="Gimnasio" 
                            icon={<FitnessCenterIcon />}
                            sx={{ 
                              bgcolor: `${colorTokens.success}20`, 
                              color: colorTokens.success,
                              border: `1px solid ${colorTokens.success}40`,
                              '& .MuiChip-icon': { color: colorTokens.success }
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
                              '& .MuiChip-icon': { color: colorTokens.neutral800 }
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
                              '& .MuiChip-icon': { color: colorTokens.warning }
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
                              '& .MuiChip-icon': { color: colorTokens.warning },
                              mb: 0.5
                            }}
                          />
                          <Typography variant="caption" sx={{ 
                            display: 'block',
                            color: colorTokens.neutral900 
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
                            '& .MuiChip-icon': { color: colorTokens.success }
                          }}
                        />
                      )}
                    </TableCell>
                    
                    {/* Estado */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={plan.is_active}
                          onChange={() => togglePlanStatus(plan.id, plan.is_active)}
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
                          fontWeight: 600
                        }}>
                          {plan.is_active ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    {/* Acciones */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Ver detalles completos">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPlanDetails(plan);
                            }}
                            sx={{ 
                              color: colorTokens.info,
                              '&:hover': {
                                bgcolor: `${colorTokens.info}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <VisibilityIcon />
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
                              '&:hover': {
                                bgcolor: `${colorTokens.warning}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon />
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
                              '&:hover': {
                                bgcolor: `${colorTokens.danger}15`,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon />
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