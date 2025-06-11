'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS CSS VARIABLES
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
  iconDefault: '#FFFFFF',
  iconMuted: '#AAAAAA',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // Document Status
  docMissing: '#B00020',
  docPending: '#FFB300',
  docApproved: '#388E3C',
  docRejected: '#D32F2F',
  docExpired: '#555555',
  docExpiringSoon: '#FFA000',
  docUploading: '#2196F3',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Profile Status
  profileComplete: '#388E3C',
  profileIncomplete: '#FFB300',
  profileSuspended: '#B00020',
  profilePending: '#1976D2',
  profileVerified: '#43A047',
  
  // Notifications
  notifNewBg: 'rgba(255,204,0,0.1)',
  notifCriticalBg: 'rgba(176,0,32,0.2)',
  notifWarningBg: 'rgba(255,160,0,0.1)',
  notifSuccessBg: 'rgba(56,142,60,0.1)',
  notifErrorBg: 'rgba(211,47,47,0.1)',
  notifInfoBg: 'rgba(25,118,210,0.1)',
  
  // Focus & Interactions
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// Iconos con Dark Pro System
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  monthly_price: number;
  quarterly_price: number;
  annual_price: number;
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
  created_at: string;
}

export default function PlanesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Cargar planes
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle activo/inactivo
  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      
      // Actualizar estado local
      setPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.id === planId ? { ...plan, is_active: !currentStatus } : plan
        )
      );
      
      setSuccessMessage(`Plan ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // Formatear días
  const formatDays = (days: number[]) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.map(day => dayNames[day]).join(', ');
  };

  // Ver detalles del plan
  const viewPlanDetails = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setViewDialogOpen(true);
  };

  // Función para obtener color de plan por precio
  const getPlanColor = (monthlyPrice: number) => {
    if (monthlyPrice <= 500) return darkProTokens.success;
    if (monthlyPrice <= 1000) return darkProTokens.warning;
    if (monthlyPrice <= 1500) return darkProTokens.info;
    return darkProTokens.roleModerator;
  };

  // Calcular popularidad del plan
  const getPlanPopularity = (plan: MembershipPlan) => {
    let score = 0;
    if (plan.gym_access) score += 20;
    if (plan.classes_included) score += 30;
    if (plan.guest_passes > 0) score += 15;
    if (!plan.has_time_restrictions) score += 25;
    if (plan.features.length > 3) score += 10;
    return Math.min(score, 100);
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
            Cargando planes de membresía...
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
      {/* 🎯 HEADER PRINCIPAL CON DARK PRO SYSTEM */}
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
              Gestión de Planes MUP
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Administra el catálogo de membresías disponibles para los clientes
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${plans.filter(p => p.is_active).length}/${plans.length} activos`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.success}20`,
                color: darkProTokens.success,
                border: `1px solid ${darkProTokens.success}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: darkProTokens.success }
              }}
            />
            
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPlans}
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
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/admin/planes/crear')}
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
              Crear Nuevo Plan
            </Button>
          </Box>
        </Box>

        {/* 📊 INFORMACIÓN DE RESULTADOS CON DARK PRO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${darkProTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${darkProTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalOfferIcon sx={{ color: darkProTokens.success, fontSize: 28 }} />
            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
              📊 Total de planes: {plans.length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${plans.filter(p => p.is_active).length} activos`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.success}20`,
                color: darkProTokens.success,
                border: `1px solid ${darkProTokens.success}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: darkProTokens.success }
              }}
            />
            <Chip
              icon={<CancelIcon />}
              label={`${plans.filter(p => !p.is_active).length} inactivos`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.error}20`,
                color: darkProTokens.error,
                border: `1px solid ${darkProTokens.error}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: darkProTokens.error }
              }}
            />
            <Chip
              icon={<AccessTimeIcon />}
              label={`${plans.filter(p => p.has_time_restrictions).length} con restricciones`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.warning}20`,
                color: darkProTokens.warning,
                border: `1px solid ${darkProTokens.warning}40`,
                fontWeight: 600,
                '& .MuiChip-icon': { color: darkProTokens.warning }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 📨 MENSAJES CON DARK PRO SYSTEM */}
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
            bgcolor: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.error}60`,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          sx={{
            bgcolor: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.success}60`,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 📊 ESTADÍSTICAS DARK PRO PROFESIONALES */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  {plans.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                  Total Planes
                </Typography>
              </Box>
              <FitnessCenterIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  {plans.filter(p => p.is_active).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                  Planes Activos
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  {plans.filter(p => p.has_time_restrictions).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, color: darkProTokens.background }}>
                  Con Restricciones
                </Typography>
              </Box>
              <AccessTimeIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.background }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, #7b1fa2)`,
            color: darkProTokens.textPrimary,
            borderRadius: 3,
            border: `1px solid ${darkProTokens.roleModerator}30`,
            transition: 'all 0.3s ease',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 32px ${darkProTokens.roleModerator}40`
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                  {plans.filter(p => p.classes_included).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                  Con Clases
                </Typography>
              </Box>
              <GroupIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 📋 TABLA DE PLANES CON DARK PRO SYSTEM */}
      <TableContainer 
        component={Paper} 
        sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: `${darkProTokens.textPrimary} !important`,
            borderColor: `${darkProTokens.grayDark} !important`
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Plan & Popularidad
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Precios
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Características
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Restricciones
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Estado
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem',
                textAlign: 'center'
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan, index) => {
              const planColor = getPlanColor(plan.monthly_price);
              const popularity = getPlanPopularity(plan);
              
              return (
                <TableRow 
                  key={plan.id}
                  component={motion.tr}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      bgcolor: `${darkProTokens.hoverOverlay} !important`,
                      transform: 'scale(1.01)',
                      boxShadow: `0 4px 20px ${darkProTokens.primary}20`,
                    },
                    '&:nth-of-type(odd)': {
                      bgcolor: `${darkProTokens.surfaceLevel1} !important`,
                    },
                    '&:nth-of-type(even)': {
                      bgcolor: `${darkProTokens.surfaceLevel2} !important`,
                    }
                  }}
                >
                  {/* 🏷️ PLAN & POPULARIDAD */}
                  <TableCell sx={{ minWidth: 250 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge
                        badgeContent={
                          plan.is_active ? (
                            <StarIcon sx={{ fontSize: 14, color: darkProTokens.primary }} />
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
                          color: darkProTokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          boxShadow: `0 4px 15px ${planColor}40`
                        }}>
                          {plan.name[0].toUpperCase()}
                        </Box>
                      </Badge>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.textPrimary, 
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          {plan.name}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: darkProTokens.textSecondary,
                          display: 'block',
                          mb: 1
                        }}>
                          {plan.description}
                        </Typography>
                        
                        {/* Barra de popularidad */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Popularidad:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={popularity}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: darkProTokens.grayDark,
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
                  
                  {/* 💰 PRECIOS */}
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 600,
                        mb: 0.5
                      }}>
                        <MonetizationOnIcon sx={{ fontSize: 16, mr: 0.5, color: planColor }} />
                        {formatPrice(plan.monthly_price)}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: darkProTokens.textSecondary,
                        display: 'block'
                      }}>
                        Mensualidad
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: darkProTokens.textSecondary,
                        display: 'block'
                      }}>
                        Inscripción: {formatPrice(plan.inscription_price)}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  {/* ⭐ CARACTERÍSTICAS */}
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {plan.gym_access && (
                        <Chip 
                          size="small" 
                          label="Gimnasio" 
                          icon={<FitnessCenterIcon />}
                          sx={{ 
                            bgcolor: `${darkProTokens.success}20`, 
                            color: darkProTokens.success,
                            border: `1px solid ${darkProTokens.success}40`,
                            '& .MuiChip-icon': { color: darkProTokens.success }
                          }}
                        />
                      )}
                      {plan.classes_included && (
                        <Chip 
                          size="small" 
                          label="Clases" 
                          icon={<GroupIcon />}
                          sx={{ 
                            bgcolor: `${darkProTokens.roleModerator}20`, 
                            color: darkProTokens.roleModerator,
                            border: `1px solid ${darkProTokens.roleModerator}40`,
                            '& .MuiChip-icon': { color: darkProTokens.roleModerator }
                          }}
                        />
                      )}
                      {plan.guest_passes > 0 && (
                        <Chip 
                          size="small" 
                          label={`${plan.guest_passes} Invitados`}
                          icon={<GroupIcon />}
                          sx={{ 
                            bgcolor: `${darkProTokens.warning}20`, 
                            color: darkProTokens.warning,
                            border: `1px solid ${darkProTokens.warning}40`,
                            '& .MuiChip-icon': { color: darkProTokens.warning }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  
                  {/* ⏰ RESTRICCIONES */}
                  <TableCell>
                    {plan.has_time_restrictions ? (
                      <Chip 
                        size="small" 
                        label="Con Horarios"
                        icon={<AccessTimeIcon />}
                        sx={{ 
                          bgcolor: `${darkProTokens.warning}20`, 
                          color: darkProTokens.warning,
                          border: `1px solid ${darkProTokens.warning}40`,
                          '& .MuiChip-icon': { color: darkProTokens.warning }
                        }}
                      />
                    ) : (
                      <Chip 
                        size="small" 
                        label="24/7"
                        icon={<SecurityIcon />}
                        sx={{ 
                          bgcolor: `${darkProTokens.success}20`, 
                          color: darkProTokens.success,
                          border: `1px solid ${darkProTokens.success}40`,
                          '& .MuiChip-icon': { color: darkProTokens.success }
                        }}
                      />
                    )}
                  </TableCell>
                  
                  {/* 🔄 ESTADO */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={plan.is_active}
                        onChange={() => togglePlanStatus(plan.id, plan.is_active)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: darkProTokens.success,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: darkProTokens.success,
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        color: plan.is_active ? darkProTokens.success : darkProTokens.textDisabled,
                        fontWeight: 600
                      }}>
                        {plan.is_active ? 'Activo' : 'Inactivo'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  {/* ⚙️ ACCIONES */}
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
                            color: darkProTokens.info,
                            '&:hover': {
                              bgcolor: `${darkProTokens.info}15`,
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
                            color: darkProTokens.warning,
                            '&:hover': {
                              bgcolor: `${darkProTokens.warning}15`,
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
                          sx={{ 
                            color: darkProTokens.error,
                            '&:hover': {
                              bgcolor: `${darkProTokens.error}15`,
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
          </TableBody>
        </Table>
      </TableContainer>

      {/* 👁️ MODAL DE DETALLES CON DARK PRO SYSTEM */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            color: darkProTokens.textPrimary,
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${darkProTokens.grayDark}`,
          bgcolor: `${darkProTokens.primary}15`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FitnessCenterIcon sx={{ color: darkProTokens.primary }} />
            <Typography variant="h5" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
              {selectedPlan?.name}
            </Typography>
          </Box>
          
          <IconButton 
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ 
                mb: 3, 
                color: darkProTokens.textSecondary,
                fontSize: '1.1rem',
                lineHeight: 1.6
              }}>
                {selectedPlan.description}
              </Typography>
              
              <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />
              
              {/* 💰 SECCIÓN DE PRECIOS */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.success, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <MonetizationOnIcon />
                  Estructura de Precios
                </Typography>
                
                <Grid container spacing={2}>
                  {selectedPlan.inscription_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.warning}10`,
                        border: `1px solid ${darkProTokens.warning}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.inscription_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Inscripción
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPlan.visit_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.info}10`,
                        border: `1px solid ${darkProTokens.info}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.visit_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Por Visita
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPlan.weekly_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.success}10`,
                        border: `1px solid ${darkProTokens.success}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.weekly_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Semanal
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPlan.monthly_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.primary}10`,
                        border: `1px solid ${darkProTokens.primary}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.monthly_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Mensual
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPlan.quarterly_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.roleModerator}10`,
                        border: `1px solid ${darkProTokens.roleModerator}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.quarterly_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Trimestral
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPlan.annual_price > 0 && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${darkProTokens.error}10`,
                        border: `1px solid ${darkProTokens.error}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                          {formatPrice(selectedPlan.annual_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Anual
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
              
              {/* ⭐ CARACTERÍSTICAS */}
              {selectedPlan.features && selectedPlan.features.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <StarIcon />
                    Características Incluidas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedPlan.features.map((feature, index) => (
                      <Chip 
                        key={index}
                        label={feature}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.info}20`,
                          color: darkProTokens.info,
                          border: `1px solid ${darkProTokens.info}40`,
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* ⏰ RESTRICCIONES DE HORARIO */}
              {selectedPlan.has_time_restrictions && (
                <Accordion sx={{ 
                  bgcolor: `${darkProTokens.warning}10`,
                  border: `1px solid ${darkProTokens.warning}30`,
                  borderRadius: 2,
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.warning }} />}
                    sx={{ bgcolor: `${darkProTokens.warning}15` }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.warning,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <ScheduleIcon />
                      Restricciones de Horario
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2, color: darkProTokens.textPrimary }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, mr: 1 }} />
                        <strong>Días permitidos:</strong> {formatDays(selectedPlan.allowed_days)}
                      </Typography>
                      {selectedPlan.time_slots.map((slot, index) => (
                        <Typography key={index} variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                          <AccessTimeIcon sx={{ fontSize: 16, mr: 1 }} />
                          <strong>Horario {index + 1}:</strong> {slot.start} - {slot.end}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
          <Button 
            onClick={() => setViewDialogOpen(false)}
            variant="outlined"
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: darkProTokens.grayDark,
              '&:hover': {
                borderColor: darkProTokens.textSecondary,
                bgcolor: darkProTokens.hoverOverlay
              }
            }}
          >
            Cerrar
          </Button>
          
          <Button
            variant="contained"
            onClick={() => {
              if (selectedPlan) {
                router.push(`/dashboard/admin/planes/${selectedPlan.id}/editar`);
              }
            }}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'translateY(-1px)'
              }
            }}
          >
            Editar Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 20px ${darkProTokens.primary}60, 0 0 30px ${darkProTokens.primary}40;
          }
        }
        
        /* Scrollbar personalizado */
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
