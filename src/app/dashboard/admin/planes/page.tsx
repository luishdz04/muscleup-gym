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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ✅ REACT TOASTIFY INLINE - SIN ARCHIVOS EXTERNOS
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import WarningIcon from '@mui/icons-material/Warning';

// ✅ FUNCIONES DE TOAST INLINE - DARK PRO SYSTEM
const showSuccessToast = (message: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      background: 'linear-gradient(135deg, #388E3C15, #388E3C08)',
      color: '#FFFFFF',
      border: '1px solid #388E3C40',
      borderRadius: '12px',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px rgba(56, 142, 60, 0.25), 0 0 0 1px #388E3C40',
      backdropFilter: 'blur(20px)',
    },
    progressStyle: {
      background: '#388E3C',
      boxShadow: '0 0 10px #388E3C80',
    },
  });
};

const showErrorToast = (message: string) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 7000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      background: 'linear-gradient(135deg, #D32F2F15, #D32F2F08)',
      color: '#FFFFFF',
      border: '1px solid #D32F2F40',
      borderRadius: '12px',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px rgba(211, 47, 47, 0.25), 0 0 0 1px #D32F2F40',
      backdropFilter: 'blur(20px)',
    },
    progressStyle: {
      background: '#D32F2F',
      boxShadow: '0 0 10px #D32F2F80',
    },
  });
};

const showWarningToast = (message: string) => {
  toast.warn(message, {
    position: "top-right",
    autoClose: 6000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      background: 'linear-gradient(135deg, #FFB30015, #FFB30008)',
      color: '#FFFFFF',
      border: '1px solid #FFB30040',
      borderRadius: '12px',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px rgba(255, 179, 0, 0.25), 0 0 0 1px #FFB30040',
      backdropFilter: 'blur(20px)',
    },
    progressStyle: {
      background: '#FFB300',
      boxShadow: '0 0 10px #FFB30080',
    },
  });
};

const showInfoToast = (message: string) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      background: 'linear-gradient(135deg, #1976D215, #1976D208)',
      color: '#FFFFFF',
      border: '1px solid #1976D240',
      borderRadius: '12px',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px rgba(25, 118, 210, 0.25), 0 0 0 1px #1976D240',
      backdropFilter: 'blur(20px)',
    },
    progressStyle: {
      background: '#1976D2',
      boxShadow: '0 0 10px #1976D280',
    },
  });
};

const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: "top-right",
    closeOnClick: false,
    style: {
      background: 'linear-gradient(135deg, #FFCC0015, #FFCC0008)',
      color: '#FFFFFF',
      border: '1px solid #FFCC0040',
      borderRadius: '12px',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 10px 40px rgba(255, 204, 0, 0.25), 0 0 0 1px #FFCC0040',
      backdropFilter: 'blur(20px)',
    },
  });
};

// ✅ INTERFAZ COMPLETA
interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  
  // ✅ PRECIOS COMPLETOS SEGÚN ESQUEMA
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;      // ✅ AGREGADO
  monthly_price: number;
  bimonthly_price: number;     // ✅ AGREGADO
  quarterly_price: number;
  semester_price: number;      // ✅ AGREGADO
  annual_price: number;
  
  // ✅ DURACIONES COMPLETAS
  weekly_duration: number;
  biweekly_duration: number;   // ✅ AGREGADO
  monthly_duration: number;
  bimonthly_duration: number;  // ✅ AGREGADO
  quarterly_duration: number;
  semester_duration: number;   // ✅ AGREGADO
  annual_duration: number;
  
  // Vigencia
  validity_type: string;
  validity_start_date: string | null;
  validity_end_date: string | null;
  
  // Características
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  equipment_access: string[];
  
  // Restricciones
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
  
  // Metadatos
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export default function PlanesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // ✅ ESTADOS PARA ELIMINACIÓN
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  // Cargar planes
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();
      
      // ✅ SELECT * PARA OBTENER TODOS LOS CAMPOS
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) {
        console.error('❌ Error cargando planes:', error);
        throw error;
      }
      
      console.log('✅ Planes cargados:', data);
      setPlans(data || []);
      
      // ✅ TOASTIFY: Mostrar éxito al cargar planes
      if (data && data.length > 0) {
        showInfoToast(`📊 ${data.length} planes cargados correctamente`);
      } else {
        showWarningToast('📋 No hay planes configurados aún');
      }
      
    } catch (err: any) {
      console.error('💥 Error en loadPlans:', err);
      // ✅ TOASTIFY: Mostrar error
      showErrorToast(`❌ Error cargando planes: ${err.message}`);
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
      
      const planName = plans.find(p => p.id === planId)?.name || 'Plan';
      
      // ✅ TOASTIFY: Mostrar éxito
      showSuccessToast(
        `${!currentStatus ? '✅' : '⏸️'} Plan "${planName}" ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
      );
      
    } catch (err: any) {
      // ✅ TOASTIFY: Mostrar error
      showErrorToast(`❌ Error actualizando estado del plan: ${err.message}`);
    }
  };

  // ✅ FUNCIÓN PARA ABRIR DIÁLOGO DE ELIMINACIÓN
  const handleDeleteClick = (plan: MembershipPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
    
    // ✅ TOASTIFY: Advertencia
    showWarningToast(`⚠️ Vas a eliminar el plan "${plan.name}". Confirma en el diálogo.`);
  };

  // ✅ FUNCIÓN PARA CERRAR DIÁLOGO DE ELIMINACIÓN
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    const planName = planToDelete?.name || 'Plan';
    setPlanToDelete(null);
    
    // ✅ TOASTIFY: Información de cancelación
    showInfoToast(`🔄 Eliminación de "${planName}" cancelada`);
  };

  // ✅ FUNCIÓN PRINCIPAL DE ELIMINACIÓN
  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    // ✅ TOASTIFY: Mostrar loading toast
    const loadingToastId = showLoadingToast(`🗑️ Eliminando plan "${planToDelete.name}"...`);

    try {
      console.log('🗑️ [DELETE] Iniciando eliminación de plan:', planToDelete.name);
      setDeletingPlan(true);

      const supabase = createBrowserSupabaseClient();
      
      // ✅ ELIMINAR DE SUPABASE
      const { error: deleteError } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planToDelete.id);

      if (deleteError) {
        console.error('❌ Error eliminando plan:', deleteError);
        throw new Error(`Error al eliminar el plan: ${deleteError.message}`);
      }

      console.log('✅ Plan eliminado exitosamente de la base de datos');

      // ✅ ACTUALIZAR ESTADO LOCAL
      setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planToDelete.id));
      
      // ✅ CERRAR DIÁLOGO
      setDeleteDialogOpen(false);
      const deletedPlanName = planToDelete.name;
      setPlanToDelete(null);

      // ✅ TOASTIFY: Cerrar loading y mostrar éxito
      toast.dismiss(loadingToastId);
      showSuccessToast(`🗑️ Plan "${deletedPlanName}" eliminado exitosamente`);

      console.log('✅ Eliminación completada correctamente');

    } catch (err: any) {
      console.error('💥 Error durante eliminación:', err);
      
      // ✅ TOASTIFY: Cerrar loading y mostrar error
      toast.dismiss(loadingToastId);
      showErrorToast(`💥 Error eliminando plan: ${err.message}`);
    } finally {
      setDeletingPlan(false);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // ✅ FUNCIÓN MEJORADA PARA OBTENER EL MEJOR PRECIO
  const getBestPrice = (plan: MembershipPlan) => {
    // Prioridad: mensual > semanal > quincenal > visita > otros
    if (plan.monthly_price > 0) return plan.monthly_price;
    if (plan.weekly_price > 0) return plan.weekly_price;
    if (plan.biweekly_price > 0) return plan.biweekly_price;
    if (plan.visit_price > 0) return plan.visit_price;
    if (plan.bimonthly_price > 0) return plan.bimonthly_price;
    if (plan.quarterly_price > 0) return plan.quarterly_price;
    if (plan.semester_price > 0) return plan.semester_price;
    if (plan.annual_price > 0) return plan.annual_price;
    return 0;
  };

  // ✅ FUNCIÓN MEJORADA PARA OBTENER ETIQUETA DE PRECIO
  const getBestPriceLabel = (plan: MembershipPlan) => {
    if (plan.monthly_price > 0) return 'Mensual';
    if (plan.weekly_price > 0) return 'Semanal';
    if (plan.biweekly_price > 0) return 'Quincenal';
    if (plan.visit_price > 0) return 'Por Visita';
    if (plan.bimonthly_price > 0) return 'Bimestral';
    if (plan.quarterly_price > 0) return 'Trimestral';
    if (plan.semester_price > 0) return 'Semestral';
    if (plan.annual_price > 0) return 'Anual';
    return 'Sin precio';
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
    
    // ✅ TOASTIFY: Información
    showInfoToast(`👁️ Visualizando detalles de "${plan.name}"`);
  };

  // ✅ FUNCIÓN MEJORADA PARA COLOR DE PLAN
  const getPlanColor = (plan: MembershipPlan) => {
    const bestPrice = getBestPrice(plan);
    if (bestPrice <= 500) return darkProTokens.success;
    if (bestPrice <= 1000) return darkProTokens.warning;
    if (bestPrice <= 1500) return darkProTokens.info;
    return darkProTokens.roleModerator;
  };

  // Calcular popularidad del plan
  const getPlanPopularity = (plan: MembershipPlan) => {
    let score = 0;
    if (plan.gym_access) score += 20;
    if (plan.classes_included) score += 30;
    if (plan.guest_passes > 0) score += 15;
    if (!plan.has_time_restrictions) score += 25;
    if (plan.features && plan.features.length > 3) score += 10;
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
      {/* ✅ REACT TOASTIFY CONTAINER INLINE */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
      />

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
              onClick={() => {
                showInfoToast('🔄 Actualizando lista de planes...');
                loadPlans();
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
              startIcon={<AddIcon />}
              onClick={() => {
                showInfoToast('➕ Redirigiendo a crear nuevo plan...');
                router.push('/dashboard/admin/planes/crear');
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
              const planColor = getPlanColor(plan);
              const popularity = getPlanPopularity(plan);
              const bestPrice = getBestPrice(plan);
              const bestPriceLabel = getBestPriceLabel(plan);
              
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
                          {plan.name[0]?.toUpperCase() || 'P'}
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
                  
                  {/* 💰 PRECIOS - CORREGIDO */}
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 600,
                        mb: 0.5
                      }}>
                        <MonetizationOnIcon sx={{ fontSize: 16, mr: 0.5, color: planColor }} />
                        {formatPrice(bestPrice)}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: darkProTokens.textSecondary,
                        display: 'block'
                      }}>
                        {bestPriceLabel}
                      </Typography>
                      {plan.inscription_price > 0 && (
                        <Typography variant="caption" sx={{ 
                          color: darkProTokens.textSecondary,
                          display: 'block'
                        }}>
                          Inscripción: {formatPrice(plan.inscription_price)}
                        </Typography>
                      )}
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
                            showInfoToast(`✏️ Redirigiendo a editar "${plan.name}"...`);
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
                      
                      {/* ✅ BOTÓN DE ELIMINAR CON FUNCIONALIDAD */}
                      <Tooltip title="Eliminar plan">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(plan);
                          }}
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
              
              {/* 💰 SECCIÓN DE PRECIOS COMPLETA */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.success, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <MonetizationOnIcon />
                  Estructura de Precios Completa
                </Typography>
                
                <Grid container spacing={2}>
                  {/* ✅ MOSTRAR TODOS LOS PRECIOS DISPONIBLES */}
                  {[
                    { key: 'inscription_price', label: 'Inscripción', color: darkProTokens.warning },
                    { key: 'visit_price', label: 'Por Visita', color: darkProTokens.info },
                    { key: 'weekly_price', label: 'Semanal', color: darkProTokens.success },
                    { key: 'biweekly_price', label: 'Quincenal', color: darkProTokens.info },
                    { key: 'monthly_price', label: 'Mensual', color: darkProTokens.primary },
                    { key: 'bimonthly_price', label: 'Bimestral', color: darkProTokens.warning },
                    { key: 'quarterly_price', label: 'Trimestral', color: darkProTokens.roleModerator },
                    { key: 'semester_price', label: 'Semestral', color: '#9C27B0' },
                    { key: 'annual_price', label: 'Anual', color: darkProTokens.error }
                  ].filter(priceType => selectedPlan[priceType.key as keyof MembershipPlan] as number > 0).map((priceType) => (
                    <Grid key={priceType.key} size={{ xs: 6, sm: 4 }}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: `${priceType.color}10`,
                        border: `1px solid ${priceType.color}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ color: priceType.color, fontWeight: 700 }}>
                          {formatPrice(selectedPlan[priceType.key as keyof MembershipPlan] as number)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          {priceType.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
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
                showInfoToast(`✏️ Redirigiendo a editar "${selectedPlan.name}"...`);
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

      {/* ✅ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.error}40`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px ${darkProTokens.error}20`
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: `${darkProTokens.error}15`,
          borderBottom: `1px solid ${darkProTokens.error}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <WarningIcon sx={{ color: darkProTokens.error, fontSize: 32 }} />
          <Typography variant="h5" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
            ⚠️ Confirmar Eliminación
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {planToDelete && (
            <Box>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.textPrimary, 
                mb: 2, 
                fontWeight: 600
              }}>
                ¿Estás seguro de que deseas eliminar el plan?
              </Typography>
              
              <Box sx={{
                p: 3,
                bgcolor: `${darkProTokens.error}10`,
                border: `2px solid ${darkProTokens.error}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <Typography variant="h5" sx={{ 
                  color: darkProTokens.primary, 
                  fontWeight: 700,
                  mb: 1
                }}>
                  📋 {planToDelete.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: darkProTokens.textSecondary,
                  mb: 2
                }}>
                  {planToDelete.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={planToDelete.is_active ? 'ACTIVO' : 'INACTIVO'}
                    size="small"
                    sx={{
                      bgcolor: planToDelete.is_active ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                      color: planToDelete.is_active ? darkProTokens.success : darkProTokens.error,
                      border: `1px solid ${planToDelete.is_active ? darkProTokens.success : darkProTokens.error}40`
                    }}
                  />
                  {getBestPrice(planToDelete) > 0 && (
                    <Chip 
                      label={`${formatPrice(getBestPrice(planToDelete))} ${getBestPriceLabel(planToDelete)}`}
                      size="small"
                      sx={{
                        bgcolor: `${darkProTokens.primary}20`,
                        color: darkProTokens.primary,
                        border: `1px solid ${darkProTokens.primary}40`
                      }}
                    />
                  )}
                </Box>
              </Box>
              
              <Paper sx={{ 
                p: 2,
                bgcolor: `${darkProTokens.error}20`,
                color: darkProTokens.textPrimary,
                border: `1px solid ${darkProTokens.error}40`
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ color: darkProTokens.error }} />
                  ⚠️ Esta acción no se puede deshacer
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  El plan será eliminado permanentemente de la base de datos
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${darkProTokens.grayDark}`,
          gap: 2
        }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={deletingPlan}
            sx={{
              borderColor: darkProTokens.grayDark,
              color: darkProTokens.textSecondary,
              '&:hover': {
                borderColor: darkProTokens.textSecondary,
                bgcolor: darkProTokens.hoverOverlay
              }
            }}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deletingPlan}
            startIcon={deletingPlan ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.errorHover}, ${darkProTokens.error})`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                bgcolor: darkProTokens.grayMedium,
                color: darkProTokens.textDisabled
              }
            }}
          >
            {deletingPlan ? 'Eliminando...' : '🗑️ Eliminar Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO GLOBALES PARA TOASTIFY */}
      <style jsx global>{`
        /* Personalización global de Toastify para Dark Pro System */
        .Toastify__toast-container {
          width: 400px !important;
          max-width: 95vw !important;
        }
        
        .Toastify__toast {
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(20px) !important;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .Toastify__toast:hover {
          transform: translateY(-2px) !important;
          transition: transform 0.2s ease !important;
        }
        
        .Toastify__close-button {
          color: #CCCCCC !important;
          opacity: 0.7 !important;
          transition: all 0.3s ease !important;
        }
        
        .Toastify__close-button:hover {
          opacity: 1 !important;
          transform: scale(1.1) !important;
          color: #FFFFFF !important;
        }
        
        .Toastify__spinner {
          border: 2px solid #FFCC0040 !important;
          border-top: 2px solid #FFCC00 !important;
          width: 20px !important;
          height: 20px !important;
        }
        
        /* Scrollbar personalizado para el componente */
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
