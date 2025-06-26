'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Paper,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Avatar,
  Stack,
  Badge,
  Container,
  LinearProgress,
  Tooltip,
  Fade,
  Slide,
  Slider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 🚀 NUEVAS IMPORTACIONES PARA NOTIFICACIONES PRO
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

// 🎨 DARK PRO SYSTEM - TOKENS CSS VARIABLES
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  iconDefault: '#FFFFFF',
  iconMuted: '#AAAAAA',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
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

// Iconos
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import GroupIcon from '@mui/icons-material/Group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FeatureIcon from '@mui/icons-material/AutoAwesome';
import PreviewIcon from '@mui/icons-material/Preview';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import TimerIcon from '@mui/icons-material/Timer';
import LimitIcon from '@mui/icons-material/Speed';

// Interfaces y constantes
interface PlanFormData {
  name: string;
  description: string;
  is_active: boolean;
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;
  monthly_price: number;
  bimonthly_price: number;
  quarterly_price: number;
  semester_price: number;
  annual_price: number;
  weekly_duration: number;
  biweekly_duration: number;
  monthly_duration: number;
  bimonthly_duration: number;
  quarterly_duration: number;
  semester_duration: number;
  annual_duration: number;
  validity_type: 'permanent' | 'limited';
  validity_start_date: string;
  validity_end_date: string;
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
  access_control_enabled: boolean;
  max_daily_entries: number;
  max_weekly_entries: number;
  max_monthly_entries: number;
  allow_guest_qr_codes: boolean;
  max_guest_passes_per_month: number;
  enforce_photo_verification: boolean;
  auto_deactivate_expired: boolean;
  require_checkin_checkout: boolean;
  access_start_time: string;
  access_end_time: string;
  allowed_weekdays: string[];
  special_schedule_override: boolean;
}

// Datos iniciales
const INITIAL_FORM_DATA: PlanFormData = {
  name: '',
  description: '',
  is_active: true,
  inscription_price: 0,
  visit_price: 0,
  weekly_price: 0,
  biweekly_price: 0,
  monthly_price: 0,
  bimonthly_price: 0,
  quarterly_price: 0,
  semester_price: 0,
  annual_price: 0,
  weekly_duration: 7,
  biweekly_duration: 15,
  monthly_duration: 30,
  bimonthly_duration: 60,
  quarterly_duration: 90,
  semester_duration: 180,
  annual_duration: 365,
  validity_type: 'permanent',
  validity_start_date: '',
  validity_end_date: '',
  features: [],
  gym_access: true,
  classes_included: false,
  guest_passes: 0,
  has_time_restrictions: false,
  allowed_days: [1, 2, 3, 4, 5, 6, 7],
  time_slots: [{ start: '06:00', end: '22:00' }],
  access_control_enabled: true,
  max_daily_entries: 2,
  max_weekly_entries: 10,
  max_monthly_entries: 30,
  allow_guest_qr_codes: true,
  max_guest_passes_per_month: 2,
  enforce_photo_verification: false,
  auto_deactivate_expired: true,
  require_checkin_checkout: false,
  access_start_time: '06:00',
  access_end_time: '23:00',
  allowed_weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  special_schedule_override: false
};

const PREDEFINED_FEATURES = [
  'Acceso completo al gimnasio',
  'Clases grupales incluidas',
  'Área funcional',
  'Casilleros con seguridad',
  'Estacionamiento gratuito',
  'Toallas incluidas',
  'Consulta nutricional',
  'Entrenador personal',
  'Acceso 24/7',
  'Área de cardio',
  'Zona de crossfit',
  'Sauna y vapor',
  'Piscina climatizada',
  'Canchas deportivas',
  'Zona de recuperación',
  'Suplementos con descuento'
];

const DAY_NAMES = [
  { value: 1, label: 'Lunes', short: 'L' },
  { value: 2, label: 'Martes', short: 'M' },
  { value: 3, label: 'Miércoles', short: 'X' },
  { value: 4, label: 'Jueves', short: 'J' },
  { value: 5, label: 'Viernes', short: 'V' },
  { value: 6, label: 'Sábado', short: 'S' },
  { value: 7, label: 'Domingo', short: 'D' }
];

const WEEKDAY_NAMES = [
  { value: 'monday', label: 'Lunes', short: 'L' },
  { value: 'tuesday', label: 'Martes', short: 'M' },
  { value: 'wednesday', label: 'Miércoles', short: 'X' },
  { value: 'thursday', label: 'Jueves', short: 'J' },
  { value: 'friday', label: 'Viernes', short: 'V' },
  { value: 'saturday', label: 'Sábado', short: 'S' },
  { value: 'sunday', label: 'Domingo', short: 'D' }
];

export default function CrearPlanPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  
  // Estados principales
  const [formData, setFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);
  const [originalFormData, setOriginalFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Estados para características
  const [newFeature, setNewFeature] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('basic');
  const [formProgress, setFormProgress] = useState(0);
  
  // Estados de usuario
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasFormChanges, setHasFormChanges] = useState(false);

  // 🚀 FUNCIONES DE NOTIFICACIÓN MEJORADAS

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

  // 🚀 FUNCIONES CON SWEETALERT2

  // Confirmación antes de salir con cambios no guardados
  const confirmExit = async () => {
    if (!hasFormChanges) {
      router.push('/dashboard/admin/planes');
      return;
    }

    const result = await Swal.fire({
      ...getSwalConfig(),
      title: '⚠️ Cambios sin guardar',
      html: `
        <div style="text-align: left; color: ${darkProTokens.textSecondary};">
          <p>Tienes cambios sin guardar en el formulario:</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            ${formData.name ? `<li>✓ Nombre: <strong>${formData.name}</strong></li>` : ''}
            ${formData.description ? `<li>✓ Descripción configurada</li>` : ''}
            ${formData.features.length > 0 ? `<li>✓ ${formData.features.length} características</li>` : ''}
            ${Object.values(formData).filter(v => typeof v === 'number' && v > 0).length > 0 ? `<li>✓ Precios configurados</li>` : ''}
          </ul>
          <p>¿Qué deseas hacer?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '💾 Guardar y salir',
      denyButtonText: '🚪 Salir sin guardar',
      cancelButtonText: '✋ Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      // Guardar y luego salir
      showInfoToast('Guardando plan antes de salir...');
      await handleSave(true); // true indica que debe salir después de guardar
    } else if (result.isDenied) {
      // Salir sin guardar
      showInfoToast('Saliendo sin guardar cambios');
      router.push('/dashboard/admin/planes');
    }
    // Si es dismiss/cancel, no hacer nada
  };

  // Confirmación con vista previa antes de guardar
  const confirmSave = async (exitAfterSave = false) => {
    const totalPrices = [
      formData.inscription_price,
      formData.visit_price,
      formData.weekly_price,
      formData.biweekly_price,
      formData.monthly_price,
      formData.bimonthly_price,
      formData.quarterly_price,
      formData.semester_price,
      formData.annual_price
    ].filter(p => p > 0).length;

    const result = await Swal.fire({
      ...getSwalConfig(),
      title: '🚀 Confirmar Creación del Plan',
      html: `
        <div style="text-align: left; color: ${darkProTokens.textSecondary}; max-height: 400px; overflow-y: auto;">
          <div style="background: ${darkProTokens.primary}15; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid ${darkProTokens.primary}40;">
            <h3 style="color: ${darkProTokens.primary}; margin: 0 0 10px 0;">📋 ${formData.name}</h3>
            <p style="margin: 0; color: ${darkProTokens.textSecondary};">${formData.description}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: ${darkProTokens.success}15; padding: 10px; border-radius: 6px; border: 1px solid ${darkProTokens.success}30;">
              <strong style="color: ${darkProTokens.success};">✨ Características:</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${formData.features.length} incluidas</p>
            </div>
            <div style="background: ${darkProTokens.info}15; padding: 10px; border-radius: 6px; border: 1px solid ${darkProTokens.info}30;">
              <strong style="color: ${darkProTokens.info};">💰 Modalidades:</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${totalPrices} configuradas</p>
            </div>
          </div>

          ${formData.access_control_enabled ? `
            <div style="background: ${darkProTokens.error}15; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 1px solid ${darkProTokens.error}30;">
              <strong style="color: ${darkProTokens.error};">🔒 Control de Acceso:</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">
                Límite diario: ${formData.max_daily_entries} entradas<br>
                Días permitidos: ${formData.allowed_weekdays.length}<br>
                Horario: ${formData.access_start_time} - ${formData.access_end_time}
              </p>
            </div>
          ` : ''}

          <div style="background: ${darkProTokens.warning}15; padding: 10px; border-radius: 6px; border: 1px solid ${darkProTokens.warning}30;">
            <strong style="color: ${darkProTokens.warning};">📅 Estado:</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              ${formData.is_active ? '✅ Activo' : '❌ Inactivo'} • 
              ${formData.validity_type === 'permanent' ? 'Vigencia permanente' : 'Vigencia limitada'}
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🚀 Crear Plan',
      cancelButtonText: '✏️ Seguir editando',
      reverseButtons: true,
      width: 600
    });

    if (result.isConfirmed) {
      await performSave(exitAfterSave);
    }
  };

  // Confirmación para eliminar característica
  const confirmRemoveFeature = async (feature: string) => {
    const result = await Swal.fire({
      ...getSwalConfig(),
      title: '🗑️ Eliminar Característica',
      html: `
        <div style="text-align: center; color: ${darkProTokens.textSecondary};">
          <p>¿Estás seguro de que deseas eliminar esta característica?</p>
          <div style="background: ${darkProTokens.warning}15; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid ${darkProTokens.warning}40;">
            <strong style="color: ${darkProTokens.warning};">"${feature}"</strong>
          </div>
          <p style="font-size: 14px;">Esta acción no se puede deshacer.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Eliminar',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: darkProTokens.error
    });

    if (result.isConfirmed) {
      removeFeature(feature);
      showSuccessToast(`Característica "${feature}" eliminada`);
    }
  };

  // Obtener usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
        showErrorToast('Error al obtener información del usuario');
      }
    };
    getCurrentUser();
  }, []);

  // Detectar cambios en el formulario
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasFormChanges(hasChanges);
  }, [formData, originalFormData]);

  // Calcular progreso
  useEffect(() => {
    let progress = 0;
    const totalFields = 12;
    let completedFields = 0;

    if (formData.name.trim()) completedFields++;
    if (formData.description.trim()) completedFields++;
    if (formData.monthly_price > 0) completedFields++;
    if (formData.inscription_price >= 0) completedFields++;
    if (formData.features.length > 0) completedFields++;
    if (formData.gym_access || formData.classes_included) completedFields++;
    if (formData.validity_type) completedFields++;
    if (!formData.has_time_restrictions || formData.allowed_days.length > 0) completedFields++;
    if (!formData.has_time_restrictions || formData.time_slots.length > 0) completedFields++;
    if (formData.access_control_enabled && formData.max_daily_entries > 0) completedFields++;
    if (formData.allowed_weekdays.length > 0) completedFields++;
    completedFields++;

    progress = (completedFields / totalFields) * 100;
    setFormProgress(progress);
  }, [formData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 🚀 MANEJADORES MEJORADOS CON NOTIFICACIONES

  // Manejador de input con validación en tiempo real
  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Feedback inmediato para campos importantes
    if (field === 'name' && value.trim().length > 3) {
      showInfoToast('Nombre del plan configurado correctamente');
    }
  };

  // Manejador para días de la semana
  const handleWeekdayToggle = (weekday: string) => {
    const isCurrentlySelected = formData.allowed_weekdays.includes(weekday);
    
    setFormData(prev => ({
      ...prev,
      allowed_weekdays: isCurrentlySelected
        ? prev.allowed_weekdays.filter(d => d !== weekday)
        : [...prev.allowed_weekdays, weekday]
    }));

    const dayName = WEEKDAY_NAMES.find(d => d.value === weekday)?.label;
    if (isCurrentlySelected) {
      showWarningToast(`${dayName} removido de días permitidos`);
    } else {
      showSuccessToast(`${dayName} agregado a días permitidos`);
    }
  };

  // Agregar característica mejorada
  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      showSuccessToast(`Característica "${newFeature.trim()}" agregada`);
      setNewFeature('');
    } else if (formData.features.includes(newFeature.trim())) {
      showWarningToast('Esta característica ya existe');
    }
  };

  // Agregar característica predefinida
  const addPredefinedFeature = (feature: string) => {
    if (!formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
      showSuccessToast(`"${feature}" agregada al plan`);
    } else {
      showWarningToast('Esta característica ya está incluida');
    }
  };

  // Eliminar característica con confirmación
  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  // Agregar franja horaria
  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start: '06:00', end: '22:00' }]
    }));
    showInfoToast('Nueva franja horaria agregada');
  };

  // Eliminar franja horaria
  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index)
    }));
    showWarningToast('Franja horaria eliminada');
  };

  // Actualizar franja horaria
  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  // 🚀 VALIDACIÓN MEJORADA CON SWEETALERT2
  const validateForm = async (): Promise<boolean> => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del plan es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción del plan es obligatoria';
    }

    if (formData.monthly_price <= 0 && formData.visit_price <= 0) {
      newErrors.pricing = 'Debe establecer al menos un precio válido';
    }

    if (formData.validity_type === 'limited') {
      if (!formData.validity_start_date || !formData.validity_end_date) {
        newErrors.validity = 'Las fechas de vigencia son obligatorias para planes con tiempo limitado';
      }
      
      if (new Date(formData.validity_start_date) >= new Date(formData.validity_end_date)) {
        newErrors.validity = 'La fecha de inicio debe ser anterior a la fecha de fin';
      }
    }

    if (formData.has_time_restrictions && formData.allowed_days.length === 0) {
      newErrors.schedule = 'Debe seleccionar al menos un día permitido';
    }

    if (formData.access_control_enabled) {
      if (formData.max_daily_entries <= 0) {
        newErrors.access_control = 'El límite diario de entradas debe ser mayor a 0';
      }
      
      if (formData.max_weekly_entries < formData.max_daily_entries) {
        newErrors.access_control = 'El límite semanal debe ser mayor o igual al límite diario';
      }
      
      if (formData.max_monthly_entries < formData.max_weekly_entries) {
        newErrors.access_control = 'El límite mensual debe ser mayor o igual al límite semanal';
      }
      
      if (formData.allowed_weekdays.length === 0) {
        newErrors.access_control = 'Debe seleccionar al menos un día de acceso';
      }
      
      if (formData.access_start_time >= formData.access_end_time) {
        newErrors.access_control = 'La hora de inicio debe ser anterior a la hora de fin';
      }
    }

    setErrors(newErrors);

    // Si hay errores, mostrar SweetAlert2 con detalles
    if (Object.keys(newErrors).length > 0) {
      await Swal.fire({
        ...getSwalConfig(),
        title: '⚠️ Verificaciones Pendientes',
        html: `
          <div style="text-align: left; color: ${darkProTokens.textSecondary};">
            <p>Por favor corrige los siguientes problemas:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
              ${Object.values(newErrors).map(error => `<li style="margin: 8px 0;">• ${error}</li>`).join('')}
            </ul>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: '✏️ Corregir'
      });
      return false;
    }

    return true;
  };

  // 🚀 FUNCIÓN DE GUARDADO REAL (separada de la confirmación)
  const performSave = async (exitAfterSave = false) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      
      // Toast de progreso
      const loadingToastId = toast.loading('🚀 Creando plan MUP Pro...', {
        style: {
          background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
          color: darkProTokens.textPrimary,
          border: `1px solid ${darkProTokens.primary}40`,
          borderRadius: '12px',
        }
      });

      if (!currentUser) {
        throw new Error('No se pudo identificar al usuario actual');
      }

      // Crear cliente Supabase
      const supabase = createBrowserSupabaseClient();
      
      // Preparar datos del plan
      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        inscription_price: formData.inscription_price || 0,
        visit_price: formData.visit_price || 0,
        weekly_price: formData.weekly_price || 0,
        biweekly_price: formData.biweekly_price || 0,
        monthly_price: formData.monthly_price || 0,
        bimonthly_price: formData.bimonthly_price || 0,
        quarterly_price: formData.quarterly_price || 0,
        semester_price: formData.semester_price || 0,
        annual_price: formData.annual_price || 0,
        weekly_duration: formData.weekly_duration || 7,
        biweekly_duration: formData.biweekly_duration || 15,
        monthly_duration: formData.monthly_duration || 30,
        bimonthly_duration: formData.bimonthly_duration || 60,
        quarterly_duration: formData.quarterly_duration || 90,
        semester_duration: formData.semester_duration || 180,
        annual_duration: formData.annual_duration || 365,
        validity_type: formData.validity_type,
        validity_start_date: formData.validity_start_date || null,
        validity_end_date: formData.validity_end_date || null,
        features: formData.features || [],
        gym_access: formData.gym_access,
        classes_included: formData.classes_included,
        guest_passes: formData.guest_passes || 0,
        has_time_restrictions: formData.has_time_restrictions,
        allowed_days: formData.allowed_days || [],
        time_slots: formData.time_slots || [],
        created_by: currentUser?.id || null,
        updated_by: currentUser?.id || null
      };

      // Insertar plan en Supabase
      const { data: createdPlan, error: insertError } = await supabase
        .from('membership_plans')
        .insert(planData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Error al guardar el plan');
      }

      // Insertar restricciones de control de acceso
      if (formData.access_control_enabled && createdPlan) {
        const accessRestrictionData = {
          plan_id: createdPlan.id,
          has_time_restrictions: formData.has_time_restrictions,
          access_start_time: formData.access_start_time,
          access_end_time: formData.access_end_time,
          allowed_weekdays: formData.allowed_weekdays,
          max_daily_entries: formData.max_daily_entries,
          max_weekly_entries: formData.max_weekly_entries,
          max_monthly_entries: formData.max_monthly_entries,
          allow_guest_qr_codes: formData.allow_guest_qr_codes,
          max_guest_passes_per_month: formData.max_guest_passes_per_month,
          enforce_photo_verification: formData.enforce_photo_verification,
          auto_deactivate_expired: formData.auto_deactivate_expired,
          require_checkin_checkout: formData.require_checkin_checkout,
          special_schedule_override: formData.special_schedule_override,
          created_by: currentUser?.id,
          updated_by: currentUser?.id
        };

        const { error: accessError } = await supabase
          .from('plan_access_restrictions')
          .insert(accessRestrictionData);

        if (accessError) {
          console.error('⚠️ Error al guardar restricciones de acceso:', accessError);
        }
      }

      if (!mountedRef.current) return;

      // Quitar toast de loading
      toast.dismiss(loadingToastId);

      // Toast de éxito
      showSuccessToast('¡Plan creado exitosamente con control de acceso integrado!');

      // SweetAlert2 de confirmación final con opciones
      const result = await Swal.fire({
        ...getSwalConfig(),
        title: '🎉 ¡Plan Creado Exitosamente!',
        html: `
          <div style="text-align: center; color: ${darkProTokens.textSecondary};">
            <div style="background: ${darkProTokens.success}15; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid ${darkProTokens.success}40;">
              <h3 style="color: ${darkProTokens.success}; margin: 0 0 10px 0;">✅ "${formData.name}"</h3>
              <p style="margin: 0; color: ${darkProTokens.textSecondary};">Plan configurado con éxito en MUP Pro</p>
            </div>
            <p>¿Qué deseas hacer ahora?</p>
          </div>
        `,
        icon: 'success',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '📋 Ver todos los planes',
        denyButtonText: '➕ Crear otro plan',
        cancelButtonText: '📝 Editar este plan',
        reverseButtons: true
      });

      if (result.isConfirmed || exitAfterSave) {
        // Ir a lista de planes
        showInfoToast('Redirigiendo a lista de planes...');
        setTimeout(() => {
          if (mountedRef.current) {
            router.push('/dashboard/admin/planes');
          }
        }, 1000);
      } else if (result.isDenied) {
        // Crear otro plan
        showInfoToast('Preparando nuevo formulario...');
        setFormData(INITIAL_FORM_DATA);
        setOriginalFormData(INITIAL_FORM_DATA);
        setExpandedAccordion('basic');
        showSuccessToast('Formulario limpio. ¡Listo para crear otro plan!');
      } else {
        // Editar este plan (quedar en la página)
        showInfoToast('Puedes seguir editando el plan');
      }

    } catch (err: any) {
      if (!mountedRef.current) return;
      
      const errorMessage = err.message || 'Error inesperado al guardar el plan';
      showErrorToast(errorMessage);
      
      // SweetAlert2 para errores críticos
      await Swal.fire({
        ...getSwalConfig(),
        title: '❌ Error al Crear Plan',
        html: `
          <div style="text-align: center; color: ${darkProTokens.textSecondary};">
            <div style="background: ${darkProTokens.error}15; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid ${darkProTokens.error}40;">
              <p style="margin: 0; color: ${darkProTokens.error};">${errorMessage}</p>
            </div>
            <p>Por favor, intenta nuevamente o contacta al soporte técnico.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: '🔄 Intentar de nuevo'
      });
      
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 🚀 MANEJADOR DE GUARDADO PRINCIPAL CON VALIDACIÓN Y CONFIRMACIÓN
  const handleSave = async (exitAfterSave = false) => {
    const isValid = await validateForm();
    if (isValid) {
      await confirmSave(exitAfterSave);
    }
  };

  // Estilos Dark Pro
  const darkProFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: darkProTokens.surfaceLevel1,
      border: `2px solid ${darkProTokens.borderDefault}`,
      borderRadius: 2,
      transition: 'all 0.3s ease',
      color: darkProTokens.textPrimary,
      '&:hover': {
        backgroundColor: `${darkProTokens.primary}05`,
        borderColor: `${darkProTokens.primary}60`,
      },
      '&.Mui-focused': {
        backgroundColor: `${darkProTokens.primary}08`,
        borderColor: darkProTokens.primary,
        boxShadow: `0 0 0 3px ${darkProTokens.focusRing}`
      },
      '& fieldset': { border: 'none' }
    },
    '& .MuiInputLabel-root': {
      color: darkProTokens.textSecondary,
      '&.Mui-focused': { color: darkProTokens.primary }
    }
  };

  return (
    <Box sx={{ 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* HEADER MEJORADO */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Tooltip title="Volver a Planes">
                  <IconButton
                    onClick={confirmExit}
                    sx={{ 
                      background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                      color: darkProTokens.background,
                      '&:hover': {
                        transform: 'translateX(-2px)',
                        boxShadow: `0 6px 20px ${darkProTokens.primary}40`,
                      }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                
                <Box>
                  <Typography variant="h3" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 700,
                    mb: 1
                  }}>
                    🚀 Crear Plan MUP Pro
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Configure un nuevo plan con control de acceso inteligente
                  </Typography>
                </Box>
              </Box>

              {/* Progreso */}
              <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                  Progreso de Configuración
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={formProgress} 
                    sx={{ 
                      width: 120, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: `${darkProTokens.primary}20`,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                        borderRadius: 4
                      }
                    }} 
                  />
                  <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                    {Math.round(formProgress)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* FORMULARIO CON COMPONENTES */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Paper sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}>
            {/* INFORMACIÓN BÁSICA */}
            <Accordion 
              expanded={expandedAccordion === 'basic'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'basic' ? false : 'basic')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'basic' 
                    ? `${darkProTokens.primary}15`
                    : 'transparent',
                  borderBottom: `1px solid ${darkProTokens.grayDark}`,
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.primary }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                    color: darkProTokens.background
                  }}>
                    <EditIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 700
                    }}>
                      Información Básica
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Nombre, descripción y configuración general del plan
                    </Typography>
                  </Box>
                  {formData.name && formData.description && (
                    <Chip icon={<CheckCircleIcon />} label="Completado" sx={{ 
                      bgcolor: `${darkProTokens.success}20`,
                      color: darkProTokens.success,
                      border: `1px solid ${darkProTokens.success}40`
                    }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Nombre del Plan"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Ej: Plan Básico, Plan Premium"
                      sx={darkProFieldStyle}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth sx={darkProFieldStyle}>
                      <InputLabel>Vigencia</InputLabel>
                      <Select
                        value={formData.validity_type}
                        onChange={(e) => handleInputChange('validity_type', e.target.value)}
                        label="Vigencia"
                      >
                        <MenuItem value="permanent">Permanente</MenuItem>
                        <MenuItem value="limited">Tiempo Limitado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Descripción del Plan"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      multiline
                      rows={3}
                      required
                      placeholder="Describa las características y beneficios del plan..."
                      sx={darkProFieldStyle}
                    />
                  </Grid>

                  {formData.validity_type === 'limited' && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ width: '100%' }}
                      >
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Fecha de Inicio"
                              type="date"
                              value={formData.validity_start_date}
                              onChange={(e) => handleInputChange('validity_start_date', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={darkProFieldStyle}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Fecha de Fin"
                              type="date"
                              value={formData.validity_end_date}
                              onChange={(e) => handleInputChange('validity_end_date', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={darkProFieldStyle}
                            />
                          </Grid>
                        </Grid>
                      </motion.div>
                    </AnimatePresence>
                  )}
                  
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => handleInputChange('is_active', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { 
                              color: darkProTokens.primary,
                              '& + .MuiSwitch-track': { backgroundColor: darkProTokens.primary }
                            }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            Plan Activo
                          </Typography>
                          <Chip 
                            label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                            size="small"
                            sx={{
                              bgcolor: formData.is_active ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                              color: formData.is_active ? darkProTokens.success : darkProTokens.error,
                              border: `1px solid ${formData.is_active ? darkProTokens.success : darkProTokens.error}40`
                            }}
                          />
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 2. ESTRUCTURA DE PRECIOS */}
            <Accordion 
              expanded={expandedAccordion === 'pricing'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'pricing' ? false : 'pricing')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'pricing' 
                    ? `${darkProTokens.info}15`
                    : 'transparent',
                  borderBottom: `1px solid ${darkProTokens.grayDark}`,
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.info }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                    color: darkProTokens.textPrimary
                  }}>
                    <MonetizationOnIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.info, 
                      fontWeight: 700
                    }}>
                      Estructura de Precios
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Configure los precios para diferentes modalidades de membresía
                    </Typography>
                  </Box>
                  {(formData.monthly_price > 0 || formData.visit_price > 0) && (
                    <Chip 
                      icon={<TrendingUpIcon />} 
                      label={`$${Math.max(formData.monthly_price, formData.visit_price).toLocaleString('es-MX')}`}
                      sx={{ 
                        bgcolor: `${darkProTokens.info}20`,
                        color: darkProTokens.info,
                        border: `1px solid ${darkProTokens.info}40`
                      }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Precio de Inscripción"
                      type="number"
                      value={formData.inscription_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleInputChange('inscription_price', value);
                        if (value > 0) {
                          showInfoToast(`Precio de inscripción: $${value.toLocaleString('es-MX')}`);
                        }
                      }}
                      sx={darkProFieldStyle}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Precio por Visita"
                      type="number"
                      value={formData.visit_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleInputChange('visit_price', value);
                        if (value > 0) {
                          showInfoToast(`Precio por visita: $${value.toLocaleString('es-MX')}`);
                        }
                      }}
                      sx={darkProFieldStyle}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  {/* MODALIDADES DE MEMBRESÍA */}
                  <Grid size={12}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.textPrimary, 
                      mb: 3, 
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      Modalidades de Membresía
                    </Typography>
                    <Grid container spacing={3}>
                      {[
                        { 
                          key: 'weekly_price', 
                          label: 'Semanal', 
                          duration: '7 días',
                          color: darkProTokens.success,
                          icon: '📅'
                        },
                        { 
                          key: 'biweekly_price', 
                          label: 'Quincenal', 
                          duration: '15 días',
                          color: darkProTokens.info,
                          icon: '📊'
                        },
                        { 
                          key: 'monthly_price', 
                          label: 'Mensual', 
                          duration: '30 días',
                          color: darkProTokens.primary,
                          icon: '⭐'
                        },
                        { 
                          key: 'bimonthly_price', 
                          label: 'Bimestral', 
                          duration: '60 días',
                          color: darkProTokens.warning,
                          icon: '🔶'
                        },
                        { 
                          key: 'quarterly_price', 
                          label: 'Trimestral', 
                          duration: '90 días',
                          color: '#FF6B35',
                          icon: '🔥'
                        },
                        { 
                          key: 'semester_price', 
                          label: 'Semestral', 
                          duration: '180 días',
                          color: '#9C27B0',
                          icon: '💎'
                        },
                        { 
                          key: 'annual_price', 
                          label: 'Anual', 
                          duration: '365 días',
                          color: '#45B7D1',
                          icon: '👑'
                        }
                      ].map((period) => (
                        <Grid key={period.key} item xs={12} sm={6} md={4}>
                          <motion.div whileHover={{ scale: 1.02, y: -4 }}>
                            <Card sx={{
                              background: `linear-gradient(135deg, ${period.color}15, ${period.color}08)`,
                              border: `2px solid ${period.color}30`,
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                border: `2px solid ${period.color}60`,
                                boxShadow: `0 8px 25px ${period.color}20`,
                              }
                            }}>
                              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ mb: 1 }}>
                                  {period.icon}
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                  color: period.color, 
                                  mb: 1, 
                                  fontWeight: 700
                                }}>
                                  {period.label}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: darkProTokens.textSecondary, 
                                  mb: 2, 
                                  display: 'block'
                                }}>
                                  {period.duration}
                                </Typography>
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={formData[period.key as keyof PlanFormData] as number}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    handleInputChange(period.key as keyof PlanFormData, value);
                                    if (value > 0) {
                                      showSuccessToast(`${period.label}: $${value.toLocaleString('es-MX')} configurado`);
                                    }
                                  }}
                                  sx={{
                                    ...darkProFieldStyle,
                                    '& .MuiOutlinedInput-root': {
                                      backgroundColor: `${period.color}10`,
                                      border: `2px solid ${period.color}20`,
                                    }
                                  }}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  }}
                                />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

                        {/* 3. CARACTERÍSTICAS */}
            <Accordion 
              expanded={expandedAccordion === 'features'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'features' ? false : 'features')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'features' 
                    ? `${darkProTokens.success}15`
                    : 'transparent',
                  borderBottom: `1px solid ${darkProTokens.grayDark}`,
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.success }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                    color: darkProTokens.textPrimary
                  }}>
                    <FeatureIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.success, 
                      fontWeight: 700
                    }}>
                      Características y Beneficios
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Defina las características incluidas en el plan
                    </Typography>
                  </Box>
                  {formData.features.length > 0 && (
                    <Badge badgeContent={formData.features.length}>
                      <Chip 
                        icon={<StarIcon />} 
                        label="Características"
                        sx={{ 
                          bgcolor: `${darkProTokens.success}20`,
                          color: darkProTokens.success,
                          border: `1px solid ${darkProTokens.success}40`
                        }}
                      />
                    </Badge>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {/* BENEFICIOS PRINCIPALES */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                      background: `${darkProTokens.success}10`,
                      border: `2px solid ${darkProTokens.success}30`,
                      borderRadius: 3,
                      p: 3,
                      height: '100%'
                    }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.gym_access}
                            onChange={(e) => {
                              handleInputChange('gym_access', e.target.checked);
                              if (e.target.checked) {
                                showSuccessToast('Acceso al gimnasio activado');
                              } else {
                                showWarningToast('Acceso al gimnasio desactivado');
                              }
                            }}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { 
                                color: darkProTokens.success,
                                '& + .MuiSwitch-track': { backgroundColor: darkProTokens.success }
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                              🏋️ Acceso al Gimnasio
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Equipos y área completa de entrenamiento
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                      background: `${darkProTokens.info}10`,
                      border: `2px solid ${darkProTokens.info}30`,
                      borderRadius: 3,
                      p: 3,
                      height: '100%'
                    }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.classes_included}
                            onChange={(e) => {
                              handleInputChange('classes_included', e.target.checked);
                              if (e.target.checked) {
                                showSuccessToast('Clases grupales incluidas');
                              } else {
                                showWarningToast('Clases grupales excluidas');
                              }
                            }}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { 
                                color: darkProTokens.info,
                                '& + .MuiSwitch-track': { backgroundColor: darkProTokens.info }
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                              🧘 Clases Grupales
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Yoga, pilates, spinning y más
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                      background: `${darkProTokens.warning}10`,
                      border: `2px solid ${darkProTokens.warning}30`,
                      borderRadius: 3,
                      p: 3,
                      height: '100%'
                    }}>
                      <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700, mb: 2 }}>
                        👥 Pases de Invitado
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={formData.guest_passes}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleInputChange('guest_passes', value);
                          if (value > 0) {
                            showInfoToast(`Configurados ${value} pases de invitado`);
                          }
                        }}
                        sx={darkProFieldStyle}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <GroupIcon sx={{ color: darkProTokens.warning }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Card>
                  </Grid>
                  
                  {/* CARACTERÍSTICAS PERSONALIZADAS */}
                  <Grid size={12}>
                    <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.textPrimary, 
                      mb: 3, 
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      Características Personalizadas
                    </Typography>
                    
                    {/* AGREGAR NUEVA CARACTERÍSTICA */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Escriba una característica personalizada..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addFeature();
                          }
                        }}
                        sx={darkProFieldStyle}
                      />
                      <Button
                        onClick={addFeature}
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={!newFeature.trim()}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                          color: darkProTokens.background,
                          minWidth: 120,
                          '&:disabled': {
                            bgcolor: darkProTokens.grayMedium,
                            color: darkProTokens.textDisabled
                          }
                        }}
                      >
                        Agregar
                      </Button>
                    </Box>
                    
                    {/* CARACTERÍSTICAS POPULARES */}
                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textSecondary, 
                      mb: 2,
                      textAlign: 'center'
                    }}>
                      Características populares (clic para agregar):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
                      {PREDEFINED_FEATURES.filter(f => !formData.features.includes(f)).slice(0, 6).map((feature) => (
                        <Chip
                          key={feature}
                          label={feature}
                          onClick={() => addPredefinedFeature(feature)}
                          sx={{
                            bgcolor: `${darkProTokens.grayDark}40`,
                            color: darkProTokens.textSecondary,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            '&:hover': {
                              bgcolor: `${darkProTokens.primary}20`,
                              color: darkProTokens.primary,
                              border: `1px solid ${darkProTokens.primary}40`,
                              cursor: 'pointer',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Box>
                    
                    {/* CARACTERÍSTICAS SELECCIONADAS */}
                    {formData.features.length > 0 && (
                      <Card sx={{
                        bgcolor: `${darkProTokens.success}10`,
                        border: `2px solid ${darkProTokens.success}30`,
                        borderRadius: 3,
                        p: 3
                      }}>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.success, 
                          mb: 2, 
                          fontWeight: 700,
                          textAlign: 'center'
                        }}>
                          Características Incluidas ({formData.features.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {formData.features.map((feature, index) => (
                            <Chip
                              key={index}
                              label={feature}
                              onDelete={() => confirmRemoveFeature(feature)}
                              deleteIcon={<DeleteIcon />}
                              sx={{
                                bgcolor: `${darkProTokens.success}20`,
                                color: darkProTokens.success,
                                border: `1px solid ${darkProTokens.success}40`,
                                '& .MuiChip-deleteIcon': { 
                                  color: darkProTokens.success,
                                  '&:hover': { 
                                    color: darkProTokens.error,
                                    transform: 'scale(1.2)'
                                  }
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 4. 🚀 CONTROL DE ACCESO INTELIGENTE */}
            <Accordion 
              expanded={expandedAccordion === 'access_control'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'access_control' ? false : 'access_control')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'access_control' 
                    ? `${darkProTokens.error}15`
                    : 'transparent',
                  borderBottom: `1px solid ${darkProTokens.grayDark}`,
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.error }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
                    color: darkProTokens.textPrimary
                  }}>
                    <SecurityIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.error, 
                      fontWeight: 700
                    }}>
                      🚀 Control de Acceso Inteligente
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Configure límites, horarios y restricciones automáticas
                    </Typography>
                  </Box>
                  <Chip 
                    label={formData.access_control_enabled ? 'ACTIVO' : 'DESACTIVADO'}
                    sx={{
                      bgcolor: formData.access_control_enabled 
                        ? `${darkProTokens.error}20`
                        : `${darkProTokens.grayDark}20`,
                      color: formData.access_control_enabled ? darkProTokens.error : darkProTokens.textDisabled,
                      border: formData.access_control_enabled 
                        ? `1px solid ${darkProTokens.error}40`
                        : `1px solid ${darkProTokens.grayDark}40`
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {/* ACTIVAR CONTROL DE ACCESO */}
                  <Grid size={12}>
                    <Card sx={{
                      bgcolor: `${darkProTokens.error}10`,
                      border: `2px solid ${darkProTokens.error}30`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.access_control_enabled}
                            onChange={(e) => {
                              handleInputChange('access_control_enabled', e.target.checked);
                              if (e.target.checked) {
                                showSuccessToast('🔒 Control de acceso inteligente activado');
                              } else {
                                showWarningToast('Control de acceso desactivado');
                              }
                            }}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { 
                                color: darkProTokens.error,
                                '& + .MuiSwitch-track': { backgroundColor: darkProTokens.error }
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                              🔒 Activar Control de Acceso Inteligente
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Aplique límites automáticos y validaciones de entrada
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>

                  {formData.access_control_enabled && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ width: '100%' }}
                      >
                        <Grid container spacing={4}>
                          {/* LÍMITES DE ENTRADAS */}
                          <Grid size={12}>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 3, 
                              fontWeight: 700,
                              textAlign: 'center'
                            }}>
                              ⚡ Límites de Entradas
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  background: `${darkProTokens.warning}10`,
                                  border: `2px solid ${darkProTokens.warning}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  textAlign: 'center'
                                }}>
                                  <LimitIcon sx={{ color: darkProTokens.warning, fontSize: 32, mb: 1 }} />
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.warning, 
                                    mb: 2, 
                                    fontWeight: 700
                                  }}>
                                    Límite Diario
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    value={formData.max_daily_entries}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1;
                                      handleInputChange('max_daily_entries', value);
                                      showInfoToast(`Límite diario: ${value} entradas`);
                                    }}
                                    sx={darkProFieldStyle}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">entradas/día</InputAdornment>,
                                      inputProps: { min: 1, max: 20 }
                                    }}
                                  />
                                </Card>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  background: `${darkProTokens.info}10`,
                                  border: `2px solid ${darkProTokens.info}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  textAlign: 'center'
                                }}>
                                  <CalendarTodayIcon sx={{ color: darkProTokens.info, fontSize: 32, mb: 1 }} />
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.info, 
                                    mb: 2, 
                                    fontWeight: 700
                                  }}>
                                    Límite Semanal
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    value={formData.max_weekly_entries}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 7;
                                      handleInputChange('max_weekly_entries', value);
                                      if (value < formData.max_daily_entries) {
                                        showWarningToast('El límite semanal debe ser mayor al diario');
                                      } else {
                                        showInfoToast(`Límite semanal: ${value} entradas`);
                                      }
                                    }}
                                    sx={darkProFieldStyle}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">entradas/semana</InputAdornment>,
                                      inputProps: { min: 1, max: 50 }
                                    }}
                                  />
                                </Card>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  background: `${darkProTokens.primary}10`,
                                  border: `2px solid ${darkProTokens.primary}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  textAlign: 'center'
                                }}>
                                  <StarIcon sx={{ color: darkProTokens.primary, fontSize: 32, mb: 1 }} />
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.primary, 
                                    mb: 2, 
                                    fontWeight: 700
                                  }}>
                                    Límite Mensual
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    value={formData.max_monthly_entries}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 30;
                                      handleInputChange('max_monthly_entries', value);
                                      if (value < formData.max_weekly_entries) {
                                        showWarningToast('El límite mensual debe ser mayor al semanal');
                                      } else {
                                        showInfoToast(`Límite mensual: ${value} entradas`);
                                      }
                                    }}
                                    sx={darkProFieldStyle}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">entradas/mes</InputAdornment>,
                                      inputProps: { min: 1, max: 200 }
                                    }}
                                  />
                                </Card>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* HORARIOS DE ACCESO */}
                          <Grid size={12}>
                            <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 3, 
                              fontWeight: 700,
                              textAlign: 'center'
                            }}>
                              🕐 Horarios de Acceso
                            </Typography>
                            
                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.success}10`,
                                  border: `2px solid ${darkProTokens.success}30`,
                                  borderRadius: 3,
                                  p: 3
                                }}>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.success, 
                                    mb: 2, 
                                    fontWeight: 700,
                                    textAlign: 'center'
                                  }}>
                                    🌅 Horario de Entrada
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    label="Hora de Inicio"
                                    type="time"
                                    value={formData.access_start_time}
                                    onChange={(e) => {
                                      handleInputChange('access_start_time', e.target.value);
                                      showInfoToast(`Horario de entrada: ${e.target.value}`);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    sx={darkProFieldStyle}
                                  />
                                </Card>
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.error}10`,
                                  border: `2px solid ${darkProTokens.error}30`,
                                  borderRadius: 3,
                                  p: 3
                                }}>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.error, 
                                    mb: 2, 
                                    fontWeight: 700,
                                    textAlign: 'center'
                                  }}>
                                    🌙 Horario de Salida
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    label="Hora de Fin"
                                    type="time"
                                    value={formData.access_end_time}
                                    onChange={(e) => {
                                      handleInputChange('access_end_time', e.target.value);
                                      if (e.target.value <= formData.access_start_time) {
                                        showWarningToast('La hora de fin debe ser posterior al inicio');
                                      } else {
                                        showInfoToast(`Horario de salida: ${e.target.value}`);
                                      }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    sx={darkProFieldStyle}
                                  />
                                </Card>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* DÍAS PERMITIDOS */}
                          <Grid size={12}>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 3, 
                              fontWeight: 700,
                              textAlign: 'center'
                            }}>
                              📅 Días de Acceso Permitido
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                              {WEEKDAY_NAMES.map((day) => (
                                <motion.div
                                  key={day.value}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Card
                                    onClick={() => handleWeekdayToggle(day.value)}
                                    sx={{
                                      p: 2,
                                      minWidth: 80,
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      background: formData.allowed_weekdays.includes(day.value)
                                        ? `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`
                                        : `${darkProTokens.grayDark}20`,
                                      border: formData.allowed_weekdays.includes(day.value)
                                        ? `2px solid ${darkProTokens.primary}60`
                                        : `2px solid ${darkProTokens.grayDark}40`,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${formData.allowed_weekdays.includes(day.value) ? darkProTokens.primary : darkProTokens.grayDark}40`
                                      }
                                    }}
                                  >
                                    <Typography variant="h4" sx={{ 
                                      color: formData.allowed_weekdays.includes(day.value) 
                                        ? darkProTokens.primary 
                                        : darkProTokens.textDisabled,
                                      fontWeight: 700,
                                      mb: 1
                                    }}>
                                      {day.short}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: formData.allowed_weekdays.includes(day.value) 
                                        ? darkProTokens.primary 
                                        : darkProTokens.textDisabled,
                                      fontWeight: 600
                                    }}>
                                      {day.label}
                                    </Typography>
                                    {formData.allowed_weekdays.includes(day.value) && (
                                      <CheckCircleIcon sx={{ 
                                        color: darkProTokens.primary, 
                                        fontSize: 16,
                                        mt: 1,
                                        display: 'block',
                                        mx: 'auto'
                                      }} />
                                    )}
                                  </Card>
                                </motion.div>
                              ))}
                            </Box>
                          </Grid>

                          {/* OPCIONES AVANZADAS */}
                          <Grid size={12}>
                            <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 3, 
                              fontWeight: 700,
                              textAlign: 'center'
                            }}>
                              ⚙️ Configuraciones Avanzadas
                            </Typography>
                            
                            <Grid container spacing={3}>
                              {/* QR CODES PARA INVITADOS */}
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.info}10`,
                                  border: `2px solid ${darkProTokens.info}30`,
                                  borderRadius: 3,
                                  p: 3
                                }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.allow_guest_qr_codes}
                                        onChange={(e) => {
                                          handleInputChange('allow_guest_qr_codes', e.target.checked);
                                          if (e.target.checked) {
                                            showSuccessToast('📱 Códigos QR para invitados activados');
                                          } else {
                                            showWarningToast('Códigos QR para invitados desactivados');
                                          }
                                        }}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': { 
                                            color: darkProTokens.info,
                                            '& + .MuiSwitch-track': { backgroundColor: darkProTokens.info }
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                          <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                          Códigos QR para Invitados
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Generar códigos QR temporales para invitados
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                  
                                  {formData.allow_guest_qr_codes && (
                                    <Box sx={{ mt: 2 }}>
                                      <TextField
                                        fullWidth
                                        label="Máximo invitados por mes"
                                        type="number"
                                        value={formData.max_guest_passes_per_month}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          handleInputChange('max_guest_passes_per_month', value);
                                          showInfoToast(`Límite de invitados: ${value}/mes`);
                                        }}
                                        sx={darkProFieldStyle}
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start"><GroupIcon /></InputAdornment>,
                                          inputProps: { min: 0, max: 10 }
                                        }}
                                      />
                                    </Box>
                                  )}
                                </Card>
                              </Grid>

                              {/* VERIFICACIÓN FOTOGRÁFICA */}
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.warning}10`,
                                  border: `2px solid ${darkProTokens.warning}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  height: '100%'
                                }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.enforce_photo_verification}
                                        onChange={(e) => {
                                          handleInputChange('enforce_photo_verification', e.target.checked);
                                          if (e.target.checked) {
                                            showSuccessToast('📸 Verificación fotográfica activada');
                                          } else {
                                            showWarningToast('Verificación fotográfica desactivada');
                                          }
                                        }}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': { 
                                            color: darkProTokens.warning,
                                            '& + .MuiSwitch-track': { backgroundColor: darkProTokens.warning }
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                          <PhotoCameraIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                          Verificación Fotográfica
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Requiere foto al momento del acceso
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </Card>
                              </Grid>

                              {/* CHECK-IN/CHECK-OUT */}
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.success}10`,
                                  border: `2px solid ${darkProTokens.success}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  height: '100%'
                                }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.require_checkin_checkout}
                                        onChange={(e) => {
                                          handleInputChange('require_checkin_checkout', e.target.checked);
                                          if (e.target.checked) {
                                            showSuccessToast('⏰ Check-in/Check-out activado');
                                          } else {
                                            showWarningToast('Check-in/Check-out desactivado');
                                          }
                                        }}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': { 
                                            color: darkProTokens.success,
                                            '& + .MuiSwitch-track': { backgroundColor: darkProTokens.success }
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                          <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                          Check-In/Check-Out
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Registrar entrada y salida obligatoria
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </Card>
                              </Grid>

                              {/* AUTO-DESACTIVACIÓN */}
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{
                                  background: `${darkProTokens.error}10`,
                                  border: `2px solid ${darkProTokens.error}30`,
                                  borderRadius: 3,
                                  p: 3,
                                  height: '100%'
                                }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.auto_deactivate_expired}
                                        onChange={(e) => {
                                          handleInputChange('auto_deactivate_expired', e.target.checked);
                                          if (e.target.checked) {
                                            showSuccessToast('🔒 Auto-desactivación habilitada');
                                          } else {
                                            showWarningToast('Auto-desactivación deshabilitada');
                                          }
                                        }}
                                        sx={{
                                          '& .MuiSwitch-switchBase.Mui-checked': { 
                                            color: darkProTokens.error,
                                            '& + .MuiSwitch-track': { backgroundColor: darkProTokens.error }
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                          <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                          Auto-desactivación
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Bloquear acceso automáticamente al vencer
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </Card>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 5. RESTRICCIONES DE HORARIO (EXISTENTE) */}
            <Accordion 
              expanded={expandedAccordion === 'schedule'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'schedule' ? false : 'schedule')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'schedule' 
                    ? `${darkProTokens.warning}15`
                    : 'transparent',
                  borderBottom: `1px solid ${darkProTokens.grayDark}`,
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.warning }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                    color: darkProTokens.background
                  }}>
                    <AccessTimeIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.warning, 
                      fontWeight: 700
                    }}>
                      Restricciones de Horario Adicionales
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Configure franjas horarias específicas y días personalizados
                    </Typography>
                  </Box>
                  <Chip 
                    label={formData.has_time_restrictions ? 'CON RESTRICCIONES' : 'ACCESO COMPLETO'}
                    sx={{
                      bgcolor: formData.has_time_restrictions 
                        ? `${darkProTokens.warning}20`
                        : `${darkProTokens.success}20`,
                      color: formData.has_time_restrictions ? darkProTokens.warning : darkProTokens.success,
                      border: formData.has_time_restrictions 
                        ? `1px solid ${darkProTokens.warning}40`
                        : `1px solid ${darkProTokens.success}40`
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  <Grid size={12}>
                    <Card sx={{
                      bgcolor: `${darkProTokens.warning}10`,
                      border: `2px solid ${darkProTokens.warning}30`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.has_time_restrictions}
                            onChange={(e) => {
                              handleInputChange('has_time_restrictions', e.target.checked);
                              if (e.target.checked) {
                                showWarningToast('🕐 Restricciones de horario adicionales activadas');
                              } else {
                                showSuccessToast('Acceso completo sin restricciones adicionales');
                              }
                            }}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { 
                                color: darkProTokens.warning,
                                '& + .MuiSwitch-track': { backgroundColor: darkProTokens.warning }
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                              🕐 Aplicar Restricciones de Horario Adicionales
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Limite el acceso a múltiples franjas horarias específicas
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>
                  
                  {formData.has_time_restrictions && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ width: '100%' }}
                      >
                        <Grid container spacing={4}>
                          <Grid size={12}>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 2, 
                              fontWeight: 700
                            }}>
                              Días Permitidos (Configuración Avanzada)
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {DAY_NAMES.map((day) => (
                                <FormControlLabel
                                  key={day.value}
                                  control={
                                    <Checkbox
                                      checked={formData.allowed_days.includes(day.value)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleInputChange('allowed_days', [...formData.allowed_days, day.value]);
                                          showSuccessToast(`${day.label} agregado a días permitidos`);
                                        } else {
                                          handleInputChange('allowed_days', formData.allowed_days.filter(d => d !== day.value));
                                          showWarningToast(`${day.label} removido de días permitidos`);
                                        }
                                      }}
                                      sx={{ 
                                        color: darkProTokens.warning,
                                        '&.Mui-checked': { color: darkProTokens.warning }
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography sx={{ color: darkProTokens.textPrimary }}>
                                      {day.label}
                                    </Typography>
                                  }
                                  sx={{
                                    bgcolor: formData.allowed_days.includes(day.value) 
                                      ? `${darkProTokens.warning}15`
                                      : 'transparent',
                                    border: `1px solid ${formData.allowed_days.includes(day.value) 
                                      ? darkProTokens.warning + '40' 
                                      : darkProTokens.grayDark}`,
                                    borderRadius: 2,
                                    p: 1,
                                    minWidth: 120,
                                    transition: 'all 0.3s ease'
                                  }}
                                />
                              ))}
                            </Box>
                          </Grid>
                          
                          <Grid size={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                              <Typography variant="h6" sx={{ 
                                color: darkProTokens.textPrimary, 
                                fontWeight: 700
                              }}>
                                Múltiples Franjas Horarias
                              </Typography>
                              <Button
                                onClick={addTimeSlot}
                                variant="outlined"
                                startIcon={<AddIcon />}
                                sx={{
                                  borderColor: darkProTokens.warning,
                                  color: darkProTokens.warning,
                                  '&:hover': {
                                    borderColor: darkProTokens.warningHover,
                                    bgcolor: `${darkProTokens.warning}10`,
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                Agregar Franja
                              </Button>
                            </Box>
                            
                            <Stack spacing={2}>
                              {formData.time_slots.map((slot, index) => (
                                <Card key={index} sx={{
                                  bgcolor: `${darkProTokens.warning}10`,
                                  border: `1px solid ${darkProTokens.warning}30`,
                                  p: 3
                                }}>
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Typography sx={{ color: darkProTokens.warning, fontWeight: 700, minWidth: 80 }}>
                                      Franja {index + 1}:
                                    </Typography>
                                    <TextField
                                      label="Inicio"
                                      type="time"
                                      value={slot.start}
                                      onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                      sx={{ ...darkProFieldStyle, flex: 1 }}
                                    />
                                    <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                                      →
                                    </Typography>
                                    <TextField
                                      label="Fin"
                                      type="time"
                                      value={slot.end}
                                      onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                      sx={{ ...darkProFieldStyle, flex: 1 }}
                                    />
                                    {formData.time_slots.length > 1 && (
                                      <IconButton
                                        onClick={() => removeTimeSlot(index)}
                                        sx={{ 
                                          color: darkProTokens.error,
                                          '&:hover': {
                                            bgcolor: `${darkProTokens.error}15`,
                                            transform: 'scale(1.1)'
                                          }
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Card>
                              ))}
                            </Stack>
                          </Grid>
                        </Grid>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 6. VISTA PREVIA Y GUARDADO CON PANEL DE CONTROL MEJORADO */}
            <Accordion 
              expanded={expandedAccordion === 'preview'} 
              onChange={() => setExpandedAccordion(expandedAccordion === 'preview' ? false : 'preview')}
              sx={{
                backgroundColor: 'transparent',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  background: expandedAccordion === 'preview' 
                    ? `${darkProTokens.primary}15`
                    : 'transparent',
                  minHeight: 80
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: darkProTokens.primary }} />}
                sx={{ px: 4 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                    color: darkProTokens.background
                  }}>
                    <PreviewIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 700
                    }}>
                      🚀 Vista Previa y Guardado Pro
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Revise la configuración completa con control de acceso integrado
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<SecurityIcon />} 
                    label="Sistema Integrado"
                    sx={{ 
                      bgcolor: `${darkProTokens.primary}20`,
                      color: darkProTokens.primary,
                      border: `1px solid ${darkProTokens.primary}40`
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, lg: 8 }}>
                    {/* Vista previa del plan */}
                    <Card sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}08)`,
                      border: `2px solid ${darkProTokens.primary}40`,
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        {/* HEADER */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box>
                            <Typography variant="h3" sx={{ 
                              color: darkProTokens.primary, 
                              fontWeight: 700,
                              mb: 1
                            }}>
                              🚀 {formData.name || 'Nombre del Plan'}
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textSecondary, 
                              mb: 2
                            }}>
                              {formData.description || 'Descripción del plan...'}
                            </Typography>
                          </Box>
                          <Stack spacing={1}>
                            <Chip 
                              label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                              sx={{
                                bgcolor: formData.is_active ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                                color: formData.is_active ? darkProTokens.success : darkProTokens.error,
                                border: `1px solid ${formData.is_active ? darkProTokens.success : darkProTokens.error}40`,
                                fontWeight: 700
                              }}
                            />
                            {formData.access_control_enabled && (
                              <Chip 
                                icon={<SecurityIcon />}
                                label="CONTROL INTELIGENTE" 
                                sx={{
                                  bgcolor: `${darkProTokens.error}20`,
                                  color: darkProTokens.error,
                                  border: `1px solid ${darkProTokens.error}40`,
                                  fontWeight: 700
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                        
                        <Divider sx={{ borderColor: `${darkProTokens.primary}40`, my: 3 }} />
                        
                        {/* PRECIOS */}
                        <Typography variant="h5" sx={{ 
                          color: darkProTokens.textPrimary, 
                          mb: 2, 
                          fontWeight: 700
                        }}>
                          💰 Estructura de Precios
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                          {formData.inscription_price > 0 && (
                            <Grid size={{ xs: 6, md: 3 }}>
                              <Card sx={{
                                bgcolor: darkProTokens.surfaceLevel3,
                                p: 2,
                                textAlign: 'center',
                                border: `1px solid ${darkProTokens.primary}40`
                              }}>
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                  Inscripción
                                </Typography>
                                <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                                  ${formData.inscription_price.toLocaleString('es-MX')}
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                          {formData.monthly_price > 0 && (
                            <Grid size={{ xs: 6, md: 3 }}>
                              <Card sx={{
                                bgcolor: darkProTokens.surfaceLevel3,
                                p: 2,
                                textAlign: 'center',
                                border: `1px solid ${darkProTokens.primary}40`
                              }}>
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                  Mensual
                                </Typography>
                                <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                                  ${formData.monthly_price.toLocaleString('es-MX')}
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                        </Grid>

                        {/* CARACTERÍSTICAS */}
                        {formData.features.length > 0 && (
                          <>
                            <Typography variant="h5" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 2, 
                              fontWeight: 700
                            }}>
                              ✨ Características Incluidas
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                              {formData.features.map((feature, index) => (
                                <Chip
                                  key={index}
                                  label={feature}
                                  icon={<CheckCircleIcon />}
                                  sx={{
                                    bgcolor: `${darkProTokens.success}20`,
                                    color: darkProTokens.success,
                                    border: `1px solid ${darkProTokens.success}40`
                                  }}
                                />
                              ))}
                            </Box>
                          </>
                        )}

                        {/* CONTROL DE ACCESO */}
                        {formData.access_control_enabled && (
                          <>
                            <Typography variant="h5" sx={{ 
                              color: darkProTokens.textPrimary, 
                              mb: 2, 
                              fontWeight: 700
                            }}>
                              🔒 Control de Acceso Inteligente
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  bgcolor: darkProTokens.surfaceLevel3,
                                  p: 2,
                                  textAlign: 'center',
                                  border: `1px solid ${darkProTokens.error}40`
                                }}>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    Límite Diario
                                  </Typography>
                                  <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                                    {formData.max_daily_entries} entradas
                                  </Typography>
                                </Card>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  bgcolor: darkProTokens.surfaceLevel3,
                                  p: 2,
                                  textAlign: 'center',
                                  border: `1px solid ${darkProTokens.warning}40`
                                }}>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    Horario
                                  </Typography>
                                  <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                                    {formData.access_start_time} - {formData.access_end_time}
                                  </Typography>
                                </Card>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{
                                  bgcolor: darkProTokens.surfaceLevel3,
                                  p: 2,
                                  textAlign: 'center',
                                  border: `1px solid ${darkProTokens.info}40`
                                }}>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    Días Activos
                                  </Typography>
                                  <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                                    {formData.allowed_weekdays.length} días
                                  </Typography>
                                </Card>
                              </Grid>
                            </Grid>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, lg: 4 }}>
                    {/* 🚀 PANEL DE CONTROL MEJORADO CON BOTONES INTELIGENTES */}
                    <Card sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: 3,
                      p: 3,
                      position: 'sticky',
                      top: 20
                    }}>
                      <Typography variant="h5" sx={{ 
                        color: darkProTokens.primary, 
                        mb: 3, 
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        🚀 Centro de Control Pro
                      </Typography>
                      
                      {/* VALIDACIONES MEJORADAS */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" sx={{ 
                          color: darkProTokens.textPrimary, 
                          mb: 2, 
                          fontWeight: 700
                        }}>
                          Estado de Configuración:
                        </Typography>
                        
                        {[
                          { label: 'Información básica', check: !!formData.name.trim() && !!formData.description.trim() },
                          { label: 'Precios configurados', check: formData.monthly_price > 0 || formData.visit_price > 0 },
                          { label: 'Características definidas', check: formData.features.length > 0 || formData.gym_access || formData.classes_included },
                          { label: 'Control de acceso', check: !formData.access_control_enabled || (formData.max_daily_entries > 0 && formData.allowed_weekdays.length > 0) },
                          { label: 'Configuración válida', check: Object.keys(errors).length === 0 }
                        ].map((validation, index) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 1,
                            p: 1,
                            bgcolor: validation.check 
                              ? `${darkProTokens.success}10`
                              : `${darkProTokens.warning}10`,
                            border: validation.check 
                                                            ? `1px solid ${darkProTokens.success}30`
                              : `1px solid ${darkProTokens.warning}30`,
                            borderRadius: 1
                          }}>
                            {validation.check ? (
                              <CheckCircleIcon sx={{ color: darkProTokens.success, fontSize: 20 }} />
                            ) : (
                              <WarningIcon sx={{ color: darkProTokens.warning, fontSize: 20 }} />
                            )}
                            <Typography variant="body2" sx={{ 
                              color: validation.check ? darkProTokens.success : darkProTokens.warning,
                              fontWeight: 600,
                              flex: 1
                            }}>
                              {validation.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      
                      <Divider sx={{ borderColor: darkProTokens.grayDark, my: 3 }} />
                      
                      {/* INFORMACIÓN DEL USUARIO ACTUALIZADA */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ 
                          color: darkProTokens.textSecondary, 
                          mb: 1
                        }}>
                          Configurado por:
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          bgcolor: darkProTokens.surfaceLevel1,
                          borderRadius: 2,
                          border: `1px solid ${darkProTokens.grayDark}`
                        }}>
                          <Avatar sx={{ 
                            bgcolor: darkProTokens.primary,
                            color: darkProTokens.background,
                            width: 32, 
                            height: 32,
                            fontWeight: 700
                          }}>
                            L
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 600
                            }}>
                              luishdz044
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: darkProTokens.textSecondary
                            }}>
                              26 de junio de 2025 • 06:55 UTC
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* 🚀 BOTONES DE ACCIÓN MEJORADOS CON SWEETALERT2 */}
                      <Stack spacing={2}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => handleSave(false)}
                            disabled={loading || !formData.name.trim() || !formData.description.trim()}
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            sx={{
                              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                              color: darkProTokens.background,
                              fontWeight: 700,
                              py: 1.5,
                              borderRadius: 2,
                              '&:hover': { 
                                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 20px ${darkProTokens.primary}40`
                              },
                              '&:disabled': {
                                bgcolor: darkProTokens.grayMedium,
                                color: darkProTokens.textDisabled
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {loading ? 'Creando Plan...' : '🚀 Crear Plan MUP Pro'}
                          </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            onClick={confirmExit}
                            disabled={loading}
                            startIcon={<ArrowBackIcon />}
                            sx={{
                              borderColor: darkProTokens.grayDark,
                              color: darkProTokens.textSecondary,
                              '&:hover': {
                                borderColor: darkProTokens.textSecondary,
                                bgcolor: darkProTokens.hoverOverlay,
                                color: darkProTokens.textPrimary,
                                transform: 'translateX(-2px)'
                              },
                              '&:disabled': {
                                borderColor: darkProTokens.grayDark,
                                color: darkProTokens.textDisabled
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            ← Volver a Planes
                          </Button>
                        </motion.div>

                        {/* 🚀 NUEVO BOTÓN: GUARDAR Y CREAR OTRO */}
                        {hasFormChanges && (
                          <motion.div 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Button
                              variant="outlined"
                              size="medium"
                              fullWidth
                              onClick={async () => {
                                const result = await Swal.fire({
                                  ...getSwalConfig(),
                                  title: '🚀 Crear Plan y Continuar',
                                  html: `
                                    <div style="text-align: center; color: ${darkProTokens.textSecondary};">
                                      <p>¿Deseas crear este plan y preparar el formulario para crear otro?</p>
                                      <div style="background: ${darkProTokens.primary}15; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid ${darkProTokens.primary}40;">
                                        <strong style="color: ${darkProTokens.primary};">"${formData.name}"</strong>
                                      </div>
                                    </div>
                                  `,
                                  icon: 'question',
                                  showCancelButton: true,
                                  confirmButtonText: '🚀 Crear y Continuar',
                                  cancelButtonText: '❌ Cancelar'
                                });
                                
                                if (result.isConfirmed) {
                                  await performSave(false);
                                }
                              }}
                              disabled={loading}
                              startIcon={<AddIcon />}
                              sx={{
                                borderColor: darkProTokens.primary,
                                color: darkProTokens.primary,
                                '&:hover': {
                                  borderColor: darkProTokens.primaryHover,
                                  bgcolor: `${darkProTokens.primary}10`,
                                  color: darkProTokens.primary,
                                  transform: 'translateY(-2px)'
                                },
                                '&:disabled': {
                                  borderColor: darkProTokens.grayDark,
                                  color: darkProTokens.textDisabled
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              + Crear y Continuar
                            </Button>
                          </motion.div>
                        )}
                      </Stack>
                      
                      {/* ESTADÍSTICAS MEJORADAS */}
                      <Box sx={{ 
                        mt: 3, 
                        p: 2, 
                        bgcolor: darkProTokens.surfaceLevel1,
                        borderRadius: 2,
                        border: `1px solid ${darkProTokens.grayDark}`
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: darkProTokens.textSecondary, 
                          mb: 1,
                          textAlign: 'center'
                        }}>
                          Resumen Pro de Configuración:
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid size={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                                {formData.features.length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Características
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                                {[
                                  formData.inscription_price, 
                                  formData.visit_price, 
                                  formData.weekly_price, 
                                  formData.biweekly_price,
                                  formData.monthly_price, 
                                  formData.bimonthly_price,
                                  formData.quarterly_price, 
                                  formData.semester_price,
                                  formData.annual_price
                                ].filter(p => p > 0).length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Modalidades
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                                {formData.access_control_enabled ? formData.allowed_weekdays.length : 7}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Días Activos
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                                {formData.access_control_enabled ? formData.max_daily_entries : '∞'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Límite Diario
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* 🚀 INDICADOR DE CAMBIOS NO GUARDADOS */}
                      {hasFormChanges && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ marginTop: 16 }}
                        >
                          <Alert 
                            severity="warning" 
                            sx={{ 
                              bgcolor: `${darkProTokens.warning}15`,
                              color: darkProTokens.textPrimary,
                              border: `1px solid ${darkProTokens.warning}40`,
                              fontSize: '0.8rem'
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              ⚠️ Tienes cambios sin guardar
                            </Typography>
                          </Alert>
                        </motion.div>
                      )}
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </motion.div>

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
          
          .swal2-deny {
            background: ${darkProTokens.error} !important;
            color: ${darkProTokens.textPrimary} !important;
            font-weight: 600 !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 12px 24px !important;
            font-size: 1rem !important;
            transition: all 0.3s ease !important;
          }
          
          .swal2-deny:hover {
            background: ${darkProTokens.errorHover} !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 6px 20px ${darkProTokens.error}40 !important;
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
          
          .swal2-icon.swal2-question {
            border-color: ${darkProTokens.info} !important;
            color: ${darkProTokens.info} !important;
          }
          
          .swal2-icon.swal2-info {
            border-color: ${darkProTokens.primary} !important;
            color: ${darkProTokens.primary} !important;
          }
        `}</style>
      </Container>
    </Box>
  );
}
