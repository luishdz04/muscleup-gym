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

// 🚀 IMPORTACIONES PARA NOTIFICACIONES PRO
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
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

// 🚀 CONFIGURACIÓN PERSONALIZADA DE SWEETALERT2
const getSwalConfig = () => ({
  background: darkProTokens.surfaceLevel2,
  color: darkProTokens.textPrimary,
  confirmButtonColor: darkProTokens.primary,
  cancelButtonColor: darkProTokens.grayDark,
  customClass: {
    popup: 'dark-pro-popup',
    title: 'dark-pro-title',
    htmlContainer: 'dark-pro-content'
  },
  buttonsStyling: true
});

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

  // 🚀 FUNCIONES DE NOTIFICACIÓN MEJORADAS CON TOAST

  // Toast personalizado para éxito
  const showSuccessToast = (message: string) => {
    toast.success(message, {
      icon: '🎉',
      style: {
        background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
        color: darkProTokens.textPrimary,
        border: `1px solid ${darkProTokens.success}40`,
        borderRadius: '12px',
      },
      progressStyle: {
        background: `linear-gradient(90deg, ${darkProTokens.success}, ${darkProTokens.successHover})`
      }
    });
  };

  // Toast personalizado para errores
  const showErrorToast = (message: string) => {
    toast.error(message, {
      icon: '❌',
      style: {
        background: `linear-gradient(135deg, ${darkProTokens.error}20, ${darkProTokens.error}10)`,
        color: darkProTokens.textPrimary,
        border: `1px solid ${darkProTokens.error}40`,
        borderRadius: '12px',
      },
      progressStyle: {
        background: `linear-gradient(90deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`
      }
    });
  };

  // Toast personalizado para advertencias
  const showWarningToast = (message: string) => {
    toast.warning(message, {
      icon: '⚠️',
      style: {
        background: `linear-gradient(135deg, ${darkProTokens.warning}20, ${darkProTokens.warning}10)`,
        color: darkProTokens.textPrimary,
        border: `1px solid ${darkProTokens.warning}40`,
        borderRadius: '12px',
      },
      progressStyle: {
        background: `linear-gradient(90deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`
      }
    });
  };

  // Toast personalizado para información
  const showInfoToast = (message: string) => {
    toast.info(message, {
      icon: '💡',
      style: {
        background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
        color: darkProTokens.textPrimary,
        border: `1px solid ${darkProTokens.info}40`,
        borderRadius: '12px',
      },
      progressStyle: {
        background: `linear-gradient(90deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`
      }
    });
  };

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
      
      // ✅ NOTIFICACIÓN: Mostrar éxito al cargar planes
      if (data && data.length > 0) {
        showInfoToast(`📊 ${data.length} planes cargados correctamente`);
      } else {
        showWarningToast('📋 No hay planes configurados aún');
      }
      
    } catch (err: any) {
      console.error('💥 Error en loadPlans:', err);
      // ✅ NOTIFICACIÓN: Mostrar error
      showErrorToast(`Error cargando planes: ${err.message}`);
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
      
      // ✅ NOTIFICACIÓN: Mostrar éxito
      showSuccessToast(
        `Plan "${planName}" ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
      );
      
    } catch (err: any) {
      // ✅ NOTIFICACIÓN: Mostrar error
      showErrorToast(`Error actualizando estado del plan: ${err.message}`);
    }
  };

  // ✅ FUNCIÓN PARA ABRIR DIÁLOGO DE ELIMINACIÓN CON SWEETALERT2
  const handleDeleteClick = async (plan: MembershipPlan) => {
    const result = await Swal.fire({
      ...getSwalConfig(),
      title: '🗑️ Eliminar Plan',
      html: `
        <div style="text-align: center; color: ${darkProTokens.textSecondary};">
          <p>¿Estás seguro de que deseas eliminar este plan?</p>
          <div style="background: ${darkProTokens.error}15; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid ${darkProTokens.error}40;">
            <h3 style="color: ${darkProTokens.primary}; margin: 0 0 10px 0;">📋 ${plan.name}</h3>
            <p style="margin: 0; color: ${darkProTokens.textSecondary};">${plan.description}</p>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <span style="background: ${plan.is_active ? darkProTokens.success : darkProTokens.error}20; 
                           color: ${plan.is_active ? darkProTokens.success : darkProTokens.error}; 
                           padding: 5px 12px; 
                           border-radius: 20px; 
                           font-size: 14px;
                           border: 1px solid ${plan.is_active ? darkProTokens.success : darkProTokens.error}40;">
                ${plan.is_active ? '✅ ACTIVO' : '❌ INACTIVO'}
              </span>
              ${getBestPrice(plan) > 0 ? `
                <span style="background: ${darkProTokens.primary}20; 
                             color: ${darkProTokens.primary}; 
                             padding: 5px 12px; 
                             border-radius: 20px; 
                             font-size: 14px;
                             border: 1px solid ${darkProTokens.primary}40;">
                  💰 ${formatPrice(getBestPrice(plan))} ${getBestPriceLabel(plan)}
                </span>
              ` : ''}
            </div>
          </div>
          <div style="background: ${darkProTokens.error}20; 
                      padding: 15px; 
                      border-radius: 8px; 
                      margin-top: 15px; 
                      border: 1px solid ${darkProTokens.error}40;">
            <p style="margin: 0; color: ${darkProTokens.error}; font-weight: 600;">
              ⚠️ Esta acción no se puede deshacer
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: ${darkProTokens.textSecondary};">
              El plan será eliminado permanentemente de la base de datos
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, eliminar',
      cancelButtonText: '❌ Cancelar',
      reverseButtons: true,
      focusCancel: true
    });

    if (result.isConfirmed) {
      await handleDeleteConfirm(plan);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      showInfoToast(`Eliminación de "${plan.name}" cancelada`);
    }
  };

  // ✅ FUNCIÓN PRINCIPAL DE ELIMINACIÓN
  const handleDeleteConfirm = async (plan: MembershipPlan) => {
    try {
      console.log('🗑️ [DELETE] Iniciando eliminación de plan:', plan.name);
      
      // Toast de loading
      const loadingToastId = toast.loading('🗑️ Eliminando plan...', {
        style: {
          background: `linear-gradient(135deg, ${darkProTokens.error}20, ${darkProTokens.error}10)`,
          color: darkProTokens.textPrimary,
          border: `1px solid ${darkProTokens.error}40`,
          borderRadius: '12px',
        }
      });

      const supabase = createBrowserSupabaseClient();
      
      // ✅ ELIMINAR DE SUPABASE
      const { error: deleteError } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', plan.id);

      if (deleteError) {
        console.error('❌ Error eliminando plan:', deleteError);
        throw new Error(`Error al eliminar el plan: ${deleteError.message}`);
      }

      console.log('✅ Plan eliminado exitosamente de la base de datos');

      // ✅ ACTUALIZAR ESTADO LOCAL
      setPlans(prevPlans => prevPlans.filter(p => p.id !== plan.id));
      
      // Quitar toast de loading
      toast.dismiss(loadingToastId);

      // ✅ NOTIFICACIÓN: Mostrar éxito con SweetAlert2
      await Swal.fire({
        ...getSwalConfig(),
        title: '✅ Plan Eliminado',
        html: `
          <div style="text-align: center; color: ${darkProTokens.textSecondary};">
            <div style="background: ${darkProTokens.success}15; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid ${darkProTokens.success}40;">
              <p style="margin: 0; color: ${darkProTokens.success}; font-size: 18px; font-weight: 600;">
                🗑️ "${plan.name}" ha sido eliminado exitosamente
              </p>
            </div>
            <p style="margin-top: 15px;">El plan ha sido removido permanentemente del sistema.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: '✅ Entendido',
        timer: 3000,
        timerProgressBar: true
      });

      console.log('✅ Eliminación completada correctamente');

    } catch (err: any) {
      console.error('💥 Error durante eliminación:', err);
      
      // ✅ NOTIFICACIÓN: Mostrar error con SweetAlert2
      await Swal.fire({
        ...getSwalConfig(),
        title: '❌ Error al Eliminar',
        html: `
          <div style="text-align: center; color: ${darkProTokens.textSecondary};">
            <div style="background: ${darkProTokens.error}15; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid ${darkProTokens.error}40;">
              <p style="margin: 0; color: ${darkProTokens.error};">${err.message}</p>
            </div>
            <p>Por favor, intenta nuevamente o contacta al soporte técnico.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: '🔄 Intentar de nuevo'
      });
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

  // Ver detalles del plan con SweetAlert2
  const viewPlanDetails = async (plan: MembershipPlan) => {
    await Swal.fire({
      ...getSwalConfig(),
      title: `🏋️ ${plan.name}`,
      html: `
        <div style="text-align: left; color: ${darkProTokens.textSecondary}; max-height: 500px; overflow-y: auto;">
          <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">
            ${plan.description}
          </p>
          
          <!-- Estructura de Precios -->
          <div style="background: ${darkProTokens.success}15; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${darkProTokens.success}40;">
            <h4 style="color: ${darkProTokens.success}; margin: 0 0 15px 0;">💰 Estructura de Precios</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              ${[
                { key: 'inscription_price', label: 'Inscripción', value: plan.inscription_price },
                { key: 'visit_price', label: 'Por Visita', value: plan.visit_price },
                { key: 'weekly_price', label: 'Semanal', value: plan.weekly_price },
                { key: 'biweekly_price', label: 'Quincenal', value: plan.biweekly_price },
                { key: 'monthly_price', label: 'Mensual', value: plan.monthly_price },
                { key: 'bimonthly_price', label: 'Bimestral', value: plan.bimonthly_price },
                { key: 'quarterly_price', label: 'Trimestral', value: plan.quarterly_price },
                { key: 'semester_price', label: 'Semestral', value: plan.semester_price },
                { key: 'annual_price', label: 'Anual', value: plan.annual_price }
              ].filter(price => price.value > 0).map(price => `
                <div style="background: ${darkProTokens.surfaceLevel3}; padding: 10px; border-radius: 6px; text-align: center;">
                  <strong style="color: ${darkProTokens.primary};">${formatPrice(price.value)}</strong>
                  <br>
                  <small style="color: ${darkProTokens.textSecondary};">${price.label}</small>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Características -->
          ${plan.features && plan.features.length > 0 ? `
            <div style="background: ${darkProTokens.info}15; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${darkProTokens.info}40;">
              <h4 style="color: ${darkProTokens.info}; margin: 0 0 15px 0;">✨ Características Incluidas</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${plan.features.map(feature => `
                  <span style="background: ${darkProTokens.info}20; 
                               color: ${darkProTokens.info}; 
                               padding: 5px 12px; 
                               border-radius: 20px; 
                               font-size: 14px;
                               border: 1px solid ${darkProTokens.info}40;">
                    ✓ ${feature}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Beneficios principales -->
          <div style="background: ${darkProTokens.primary}15; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${darkProTokens.primary}40;">
            <h4 style="color: ${darkProTokens.primary}; margin: 0 0 15px 0;">🎯 Beneficios Principales</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              ${plan.gym_access ? `
                <div style="text-align: center;">
                  <span style="font-size: 24px;">🏋️</span>
                  <br>
                  <small style="color: ${darkProTokens.textSecondary};">Acceso al Gimnasio</small>
                </div>
              ` : ''}
              ${plan.classes_included ? `
                <div style="text-align: center;">
                  <span style="font-size: 24px;">🧘</span>
                  <br>
                  <small style="color: ${darkProTokens.textSecondary};">Clases Incluidas</small>
                </div>
              ` : ''}
              ${plan.guest_passes > 0 ? `
                <div style="text-align: center;">
                  <span style="font-size: 24px;">👥</span>
                  <br>
                  <small style="color: ${darkProTokens.textSecondary};">${plan.guest_passes} Pases de Invitado</small>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Restricciones -->
          ${plan.has_time_restrictions ? `
            <div style="background: ${darkProTokens.warning}15; padding: 15px; border-radius: 8px; border: 1px solid ${darkProTokens.warning}40;">
              <h4 style="color: ${darkProTokens.warning}; margin: 0 0 15px 0;">⏰ Restricciones de Horario</h4>
              <p style="margin: 5px 0;"><strong>Días permitidos:</strong> ${formatDays(plan.allowed_days)}</p>
              ${plan.time_slots.map((slot, index) => `
                <p style="margin: 5px 0;"><strong>Horario ${index + 1}:</strong> ${slot.start} - ${slot.end}</p>
              `).join('')}
            </div>
          ` : `
            <div style="background: ${darkProTokens.success}15; padding: 15px; border-radius: 8px; border: 1px solid ${darkProTokens.success}40;">
              <h4 style="color: ${darkProTokens.success}; margin: 0;">🔓 Acceso 24/7</h4>
              <p style="margin: 5px 0 0 0;">Sin restricciones de horario</p>
            </div>
          `}
        </div>
      `,
      icon: 'info',
      width: 700,
      showCancelButton: true,
      confirmButtonText: '✏️ Editar Plan',
      cancelButtonText: '❌ Cerrar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        showInfoToast(`Redirigiendo a editar "${plan.name}"...`);
        router.push(`/dashboard/admin/planes/${plan.id}/editar`);
      }
    });
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
                            showInfoToast(`Redirigiendo a editar "${plan.name}"...`);
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

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
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
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 20px ${darkProTokens.primary}60, 0 0 30px ${darkProTokens.primary}40;
          }
        }
        
        /* Scrollbar personalizado para Dark Pro System */
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
        
        /* Animaciones para hovers */
        .hover-lift:hover {
          transform: translateY(-2px) !important;
          transition: transform 0.2s ease !important;
        }
        
        /* Efectos de brillo para elementos activos */
        .glow-primary {
          box-shadow: 0 0 20px ${darkProTokens.primary}30 !important;
        }
        
        .glow-success {
          box-shadow: 0 0 20px ${darkProTokens.success}30 !important;
        }
        
        .glow-error {
          box-shadow: 0 0 20px ${darkProTokens.error}30 !important;
        }
      `}</style>

      {/* 🚀 ESTILOS CSS PERSONALIZADOS PARA SWEETALERT2 */}
      <style jsx global>{`
        .dark-pro-popup {
          background: ${darkProTokens.surfaceLevel2} !important;
          border: 2px solid ${darkProTokens.grayDark} !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important;
        }
        
        .dark-pro-title {
          color: ${darkProTokens.textPrimary} !important;
          font-weight: 700 !important;
          font-size: 1.5rem !important;
        }
        
        .dark-pro-content {
          color: ${darkProTokens.textSecondary} !important;
          font-size: 1rem !important;
        }
        
        .swal2-confirm {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover}) !important;
          color: ${darkProTokens.background} !important;
          font-weight: 700 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-size: 1rem !important;
          transition: all 0.3s ease !important;
        }
        
        .swal2-confirm:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive}) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px ${darkProTokens.primary}40 !important;
        }
        
        .swal2-cancel {
          background: ${darkProTokens.grayDark} !important;
          color: ${darkProTokens.textPrimary} !important;
          font-weight: 600 !important;
          border: 1px solid ${darkProTokens.grayMedium} !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-size: 1rem !important;
          transition: all 0.3s ease !important;
        }
        
        .swal2-cancel:hover {
          background: ${darkProTokens.grayMedium} !important;
          border-color: ${darkProTokens.textSecondary} !important;
          transform: translateY(-1px) !important;
        }
        
        .swal2-icon.swal2-warning {
          border-color: ${darkProTokens.warning} !important;
          color: ${darkProTokens.warning} !important;
        }
        
        .swal2-icon.swal2-success {
          border-color: ${darkProTokens.success} !important;
          color: ${darkProTokens.success} !important;
        }
        
        .swal2-icon.swal2-error {
          border-color: ${darkProTokens.error} !important;
          color: ${darkProTokens.error} !important;
        }
        
        .swal2-icon.swal2-info {
          border-color: ${darkProTokens.info} !important;
          color: ${darkProTokens.info} !important;
        }

        /* Estilos para el toast container */
        .Toastify__toast-container {
          z-index: 9999;
        }

        /* Personalización adicional de toasts */
        .Toastify__toast {
          font-family: inherit;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(10px);
        }

        .Toastify__progress-bar {
          height: 3px;
        }

        /* Animaciones mejoradas para SweetAlert2 */
        .swal2-show {
          animation: swal2-show 0.3s !important;
        }

        @keyframes swal2-show {
          0% {
            transform: scale(0.7);
            opacity: 0;
          }
          45% {
            transform: scale(1.05);
          }
          80% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}
