// app/dashboard/admin/planes/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

// Importaciones corregidas
import { useNotifications } from '@/hooks/useNotifications';
import { colorTokens } from '@/theme';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HomeIcon from '@mui/icons-material/Home';
import ListIcon from '@mui/icons-material/List';

// Interfaces (mismas que en la página principal)
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return 'Fecha inválida';
  }
};

// Utilidad para formatear precios
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

// Componente para mostrar precios
const PriceCard = React.memo(({ 
  label, 
  price, 
  duration,
  isPrimary = false 
}: {
  label: string;
  price: number;
  duration?: number;
  isPrimary?: boolean;
}) => (
  <Card sx={{
    background: isPrimary 
      ? `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`
      : `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
    border: `1px solid ${isPrimary ? colorTokens.brand : colorTokens.neutral400}`,
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${isPrimary ? colorTokens.brand : colorTokens.neutral400}30`
    }
  }}>
    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 700, 
        color: isPrimary ? colorTokens.neutral0 : colorTokens.neutral1200,
        mb: 0.5
      }}>
        {formatPrice(price)}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: isPrimary ? colorTokens.neutral0 : colorTokens.neutral900,
        fontWeight: 600
      }}>
        {label}
      </Typography>
      {duration && duration > 0 && (
        <Typography variant="caption" sx={{ 
          color: isPrimary ? colorTokens.neutral200 : colorTokens.neutral800,
          display: 'block',
          mt: 0.5
        }}>
          {duration} {duration === 1 ? 'día' : 'días'} de duración
        </Typography>
      )}
    </CardContent>
  </Card>
));

// Componente principal
export default function PlanDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast, alert } = useNotifications();
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del plan
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const supabase = createBrowserSupabaseClient();
        
        const { data, error } = await supabase
          .from('membership_plans')
          .select(`
            *,
            access_restrictions:plan_access_restrictions(*)
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;

        // Mapear datos de restricciones
        const mappedPlan = {
          ...data,
          access_restrictions: Array.isArray(data.access_restrictions) 
            ? data.access_restrictions[0] 
            : data.access_restrictions
        };

        setPlan(mappedPlan);
      } catch (err: any) {
        toast.error(`Error cargando plan: ${err.message}`);
        router.push('/dashboard/admin/planes');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlan();
    }
  }, [params.id, toast, router]);

  // Función para eliminar plan
  const handleDelete = useCallback(async () => {
    if (!plan) return;

    const result = await alert.deleteConfirm(`"${plan.name}"`);
    
    if (result.isConfirmed) {
      try {
        const supabase = createBrowserSupabaseClient();
        
        const { error } = await supabase
          .from('membership_plans')
          .delete()
          .eq('id', plan.id);

        if (error) throw error;

        toast.success(`Plan "${plan.name}" eliminado exitosamente`);
        router.push('/dashboard/admin/planes');
      } catch (err: any) {
        toast.error(`Error eliminando plan: ${err.message}`);
      }
    }
  }, [plan, alert, toast, router]);

  // Calcular estadísticas del plan
  const planStats = React.useMemo(() => {
    if (!plan) return null;

    const prices = [
      { label: 'Inscripción', value: plan.inscription_price },
      { label: 'Por Visita', value: plan.visit_price, duration: 1 },
      { label: 'Semanal', value: plan.weekly_price, duration: plan.weekly_duration },
      { label: 'Quincenal', value: plan.biweekly_price, duration: plan.biweekly_duration },
      { label: 'Mensual', value: plan.monthly_price, duration: plan.monthly_duration },
      { label: 'Bimestral', value: plan.bimonthly_price, duration: plan.bimonthly_duration },
      { label: 'Trimestral', value: plan.quarterly_price, duration: plan.quarterly_duration },
      { label: 'Semestral', value: plan.semester_price, duration: plan.semester_duration },
      { label: 'Anual', value: plan.annual_price, duration: plan.annual_duration }
    ].filter(p => p.value > 0);

    const enabledDays = plan.access_restrictions?.daily_schedules 
      ? Object.entries(plan.access_restrictions.daily_schedules)
          .filter(([_, schedule]) => schedule.enabled)
          .map(([day, schedule]) => ({
            day: WEEKDAY_CONFIG.find(w => w.key === day)?.label || day,
            schedule
          }))
      : [];

    const primaryPrice = prices.find(p => p.label === 'Mensual') || prices[0];

    return {
      prices,
      enabledDays,
      primaryPrice,
      totalFeatures: plan.features?.length || 0,
      hasRestrictions: plan.access_restrictions?.access_control_enabled || false
    };
  }, [plan]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: colorTokens.brand, mb: 2 }} />
          <Typography sx={{ color: colorTokens.neutral900 }}>
            Cargando detalles del plan...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Plan no encontrado</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh'
    }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, color: colorTokens.neutral900 }}>
        <Link 
          component="button" 
          onClick={() => router.push('/dashboard')}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            color: colorTokens.neutral900,
            textDecoration: 'none',
            '&:hover': { color: colorTokens.brand }
          }}
        >
          <HomeIcon fontSize="small" />
          Dashboard
        </Link>
        <Link 
          component="button" 
          onClick={() => router.push('/dashboard/admin/planes')}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            color: colorTokens.neutral900,
            textDecoration: 'none',
            '&:hover': { color: colorTokens.brand }
          }}
        >
          <ListIcon fontSize="small" />
          Planes
        </Link>
        <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
          {plan.name}
        </Typography>
      </Breadcrumbs>

      {/* Header con acciones */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colorTokens.neutral0,
                fontWeight: 700,
                fontSize: '1.5rem',
                boxShadow: `0 4px 20px ${colorTokens.brand}40`
              }}>
                {plan.name[0]?.toUpperCase() || 'P'}
              </Box>
              
              <Box>
                <Typography variant="h4" sx={{ 
                  color: colorTokens.neutral1200, 
                  fontWeight: 700,
                  mb: 0.5
                }}>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    icon={plan.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                    label={plan.is_active ? 'Activo' : 'Inactivo'}
                    size="small"
                    sx={{
                      bgcolor: plan.is_active ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                      color: plan.is_active ? colorTokens.success : colorTokens.danger,
                      border: `1px solid ${plan.is_active ? colorTokens.success : colorTokens.danger}40`,
                      fontWeight: 600,
                      '& .MuiChip-icon': { 
                        color: plan.is_active ? colorTokens.success : colorTokens.danger 
                      }
                    }}
                  />
                  {planStats?.primaryPrice && (
                    <Chip
                      icon={<MonetizationOnIcon />}
                      label={formatPrice(planStats.primaryPrice.value)}
                      size="small"
                      sx={{
                        bgcolor: `${colorTokens.brand}20`,
                        color: colorTokens.brand,
                        border: `1px solid ${colorTokens.brand}40`,
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: colorTokens.brand }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ 
              color: colorTokens.neutral1000,
              mb: 2,
              lineHeight: 1.6
            }}>
              {plan.description}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/planes')}
              variant="outlined"
              sx={{
                color: colorTokens.neutral900,
                borderColor: colorTokens.neutral400,
                '&:hover': {
                  borderColor: colorTokens.neutral800,
                  bgcolor: `${colorTokens.neutral800}10`
                }
              }}
            >
              Volver
            </Button>
            
            <Button
              startIcon={<EditIcon />}
              onClick={() => router.push(`/dashboard/admin/planes/${plan.id}/editar`)}
              variant="outlined"
              sx={{
                color: colorTokens.warning,
                borderColor: colorTokens.warning,
                '&:hover': {
                  borderColor: colorTokens.warning,
                  bgcolor: `${colorTokens.warning}10`
                }
              }}
            >
              Editar Plan
            </Button>
            
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              variant="outlined"
              sx={{
                color: colorTokens.danger,
                borderColor: colorTokens.danger,
                '&:hover': {
                  borderColor: colorTokens.danger,
                  bgcolor: `${colorTokens.danger}10`
                }
              }}
            >
              Eliminar
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Precios */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            mb: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral1200, 
              mb: 3, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <MonetizationOnIcon />
              Estructura de Precios
            </Typography>
            
            {planStats?.prices && planStats.prices.length > 0 ? (
              <Grid container spacing={2}>
                {planStats.prices.map((price, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={price.label}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PriceCard
                        label={price.label}
                        price={price.value}
                        duration={price.duration}
                        isPrimary={price.label === 'Mensual'}
                      />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography sx={{ color: colorTokens.neutral900, fontStyle: 'italic' }}>
                No hay precios configurados para este plan
              </Typography>
            )}
          </Paper>

          {/* Características */}
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            mb: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral1200, 
              mb: 3, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <StarIcon />
              Características del Plan
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {plan.gym_access && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${colorTokens.success}10`,
                    border: `1px solid ${colorTokens.success}30`,
                    textAlign: 'center'
                  }}>
                    <FitnessCenterIcon sx={{ color: colorTokens.success, fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.success, fontWeight: 600 }}>
                      Acceso al Gimnasio
                    </Typography>
                  </Box>
                </Grid>
              )}
              
              {plan.classes_included && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${colorTokens.info}10`,
                    border: `1px solid ${colorTokens.info}30`,
                    textAlign: 'center'
                  }}>
                    <GroupIcon sx={{ color: colorTokens.info, fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.info, fontWeight: 600 }}>
                      Clases Incluidas
                    </Typography>
                  </Box>
                </Grid>
              )}
              
              {plan.guest_passes > 0 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${colorTokens.warning}10`,
                    border: `1px solid ${colorTokens.warning}30`,
                    textAlign: 'center'
                  }}>
                    <GroupIcon sx={{ color: colorTokens.warning, fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.warning, fontWeight: 600 }}>
                      {plan.guest_passes} Pases de Invitado
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {plan.features && plan.features.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: colorTokens.neutral1200, 
                  mb: 2, 
                  fontWeight: 600 
                }}>
                  Características Adicionales:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {plan.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      sx={{
                        bgcolor: `${colorTokens.brand}20`,
                        color: colorTokens.brand,
                        border: `1px solid ${colorTokens.brand}40`
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Restricciones y Metadatos */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Control de Acceso */}
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            mb: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral1200, 
              mb: 3, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {planStats?.hasRestrictions ? <LockIcon /> : <LockOpenIcon />}
              Control de Acceso
            </Typography>

            {planStats?.hasRestrictions ? (
              <Box>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: `${colorTokens.warning}10`,
                  border: `1px solid ${colorTokens.warning}30`,
                  mb: 2
                }}>
                  <Typography variant="body2" sx={{ color: colorTokens.warning, fontWeight: 600, mb: 1 }}>
                    Acceso Restringido
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    Máximo {plan.access_restrictions?.max_daily_entries} entrada
                    {(plan.access_restrictions?.max_daily_entries || 0) > 1 ? 's' : ''} por día
                  </Typography>
                </Box>

                {planStats.enabledDays && planStats.enabledDays.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      color: colorTokens.neutral1200, 
                      mb: 1, 
                      fontWeight: 600 
                    }}>
                      Horarios Permitidos:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {planStats.enabledDays.map((dayInfo, index) => (
                        <Box key={index} sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: colorTokens.neutral100,
                          border: `1px solid ${colorTokens.neutral400}`
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: colorTokens.neutral1200, 
                            fontWeight: 600,
                            display: 'block'
                          }}>
                            {dayInfo.day}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                            {dayInfo.schedule.start_time} - {dayInfo.schedule.end_time}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: `${colorTokens.success}10`,
                border: `1px solid ${colorTokens.success}30`,
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ color: colorTokens.success, fontWeight: 600 }}>
                  Acceso 24/7
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                  Sin restricciones de horario
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Metadatos */}
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral1200, 
              mb: 3, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarTodayIcon />
              Información del Plan
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                  Creado el:
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                  {formatDateForMonterrey(plan.created_at)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                  Última actualización:
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                  {formatDateForMonterrey(plan.updated_at)}
                </Typography>
              </Box>

              <Divider sx={{ bgcolor: colorTokens.neutral400 }} />

              <Box>
                <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                  Tipo de vigencia:
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                  {plan.validity_type || 'No especificado'}
                </Typography>
              </Box>

              {plan.validity_start_date && (
                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Vigencia desde:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                    {formatDateForMonterrey(plan.validity_start_date)}
                  </Typography>
                </Box>
              )}

              {plan.validity_end_date && (
                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Vigencia hasta:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                    {formatDateForMonterrey(plan.validity_end_date)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}