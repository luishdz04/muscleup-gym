'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Snackbar,
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
  Slide
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

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
  
  // Focus & Interactions
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// Iconos
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import GroupIcon from '@mui/icons-material/Group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FeatureIcon from '@mui/icons-material/AutoAwesome';
import PreviewIcon from '@mui/icons-material/Preview';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import UpdateIcon from '@mui/icons-material/Update';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// ✅ INTERFACE COMPLETA - IGUAL QUE CREAR
interface PlanFormData {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  
  // ✅ PRECIOS COMPLETOS
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;      // ✅ AGREGADO - quincenal
  monthly_price: number;
  bimonthly_price: number;     // ✅ AGREGADO - bimestral
  quarterly_price: number;
  semester_price: number;      // ✅ AGREGADO - semestral
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
  validity_type: 'permanent' | 'limited';
  validity_start_date: string | null;
  validity_end_date: string | null;
  
  // Características
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  
  // Restricciones de horario
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
  
  // Metadatos
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

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

export default function EditarPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const mountedRef = useRef(true);
  
  // Estados principales
  const [formData, setFormData] = useState<PlanFormData>({
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
    validity_start_date: null,
    validity_end_date: null,
    
    features: [],
    gym_access: true,
    classes_included: false,
    guest_passes: 0,
    
    has_time_restrictions: false,
    allowed_days: [1, 2, 3, 4, 5, 6, 7],
    time_slots: [{ start: '06:00', end: '22:00' }]
  });
  
  const [originalFormData, setOriginalFormData] = useState<PlanFormData>({} as PlanFormData);
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
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
      }
    };
    getCurrentUser();
  }, []);

  // Cargar plan existente
  useEffect(() => {
    if (!planId) {
      setLoadingPlan(false);
      return;
    }

    const loadPlan = async () => {
      try {
        setLoadingPlan(true);
        setError(null);
        
        const supabase = createBrowserSupabaseClient();
        const { data: plan, error: fetchError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('id', planId)
          .single();
        
        if (fetchError) {
          throw new Error(`Error de Supabase: ${fetchError.message}`);
        }
        
        if (!plan) {
          throw new Error('Plan no encontrado en la base de datos');
        }
        
        // ✅ MAPEAR DATOS CORRECTAMENTE INCLUYENDO CAMPOS FALTANTES
        const planData: PlanFormData = {
          id: plan.id,
          name: plan.name || '',
          description: plan.description || '',
          is_active: Boolean(plan.is_active),
          
          // ✅ PRECIOS COMPLETOS
          inscription_price: Number(plan.inscription_price) || 0,
          visit_price: Number(plan.visit_price) || 0,
          weekly_price: Number(plan.weekly_price) || 0,
          biweekly_price: Number(plan.biweekly_price) || 0,      // ✅ AGREGADO
          monthly_price: Number(plan.monthly_price) || 0,
          bimonthly_price: Number(plan.bimonthly_price) || 0,    // ✅ AGREGADO
          quarterly_price: Number(plan.quarterly_price) || 0,
          semester_price: Number(plan.semester_price) || 0,      // ✅ AGREGADO
          annual_price: Number(plan.annual_price) || 0,
          
          // ✅ DURACIONES COMPLETAS
          weekly_duration: Number(plan.weekly_duration) || 7,
          biweekly_duration: Number(plan.biweekly_duration) || 15,    // ✅ AGREGADO
          monthly_duration: Number(plan.monthly_duration) || 30,
          bimonthly_duration: Number(plan.bimonthly_duration) || 60,  // ✅ AGREGADO
          quarterly_duration: Number(plan.quarterly_duration) || 90,
          semester_duration: Number(plan.semester_duration) || 180,  // ✅ AGREGADO
          annual_duration: Number(plan.annual_duration) || 365,
          
          // Vigencia
          validity_type: plan.validity_type || 'permanent',
          validity_start_date: plan.validity_start_date || null,
          validity_end_date: plan.validity_end_date || null,
          
          // Características
          features: Array.isArray(plan.features) ? plan.features : [],
          gym_access: Boolean(plan.gym_access),
          classes_included: Boolean(plan.classes_included),
          guest_passes: Number(plan.guest_passes) || 0,
          
          // Restricciones
          has_time_restrictions: Boolean(plan.has_time_restrictions),
          allowed_days: Array.isArray(plan.allowed_days) ? plan.allowed_days : [1, 2, 3, 4, 5, 6, 7],
          time_slots: Array.isArray(plan.time_slots) && plan.time_slots.length > 0 
            ? plan.time_slots 
            : [{ start: '06:00', end: '22:00' }],
          
          // Metadatos
          created_at: plan.created_at || null,
          updated_at: plan.updated_at || null,
          created_by: plan.created_by || null,
          updated_by: plan.updated_by || null
        };
        
        if (mountedRef.current) {
          setFormData(planData);
          setOriginalFormData(JSON.parse(JSON.stringify(planData)));
        }
        
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.message || 'Error cargando el plan');
        }
      } finally {
        if (mountedRef.current) {
          setLoadingPlan(false);
        }
      }
    };
    
    loadPlan();
  }, [planId]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (Object.keys(originalFormData).length === 0) return;
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasFormChanges(hasChanges);
  }, [formData, originalFormData]);

  // Calcular progreso del formulario
  useEffect(() => {
    let completedFields = 0;
    const totalFields = 10;

    if (formData.name.trim()) completedFields++;
    if (formData.description.trim()) completedFields++;
    if (formData.monthly_price > 0 || formData.visit_price > 0) completedFields++;
    if (formData.inscription_price >= 0) completedFields++;
    if (formData.features.length > 0 || formData.gym_access || formData.classes_included) completedFields++;
    if (formData.validity_type) completedFields++;
    if (!formData.has_time_restrictions || formData.allowed_days.length > 0) completedFields++;
    if (!formData.has_time_restrictions || formData.time_slots.length > 0) completedFields++;
    completedFields += 2; // is_active y id siempre existen

    const progress = (completedFields / totalFields) * 100;
    setFormProgress(progress);
  }, [formData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Manejadores de input
  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const addPredefinedFeature = (feature: string) => {
    if (!formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start: '06:00', end: '22:00' }]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  // Función de validación
  const validateForm = (): boolean => {
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
      
      if (formData.validity_start_date && formData.validity_end_date) {
        if (new Date(formData.validity_start_date) >= new Date(formData.validity_end_date)) {
          newErrors.validity = 'La fecha de inicio debe ser anterior a la fecha de fin';
        }
      }
    }

    if (formData.has_time_restrictions && formData.allowed_days.length === 0) {
      newErrors.schedule = 'Debe seleccionar al menos un día permitido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función principal de actualización
  const handleUpdate = async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Validaciones
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      if (!currentUser) {
        throw new Error('No se pudo identificar al usuario actual');
      }

      const supabase = createBrowserSupabaseClient();
      
      // ✅ PREPARAR DATOS COMPLETOS SEGÚN ESQUEMA
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        
        // ✅ PRECIOS COMPLETOS
        inscription_price: formData.inscription_price || 0,
        visit_price: formData.visit_price || 0,
        weekly_price: formData.weekly_price || 0,
        biweekly_price: formData.biweekly_price || 0,
        monthly_price: formData.monthly_price || 0,
        bimonthly_price: formData.bimonthly_price || 0,
        quarterly_price: formData.quarterly_price || 0,
        semester_price: formData.semester_price || 0,
        annual_price: formData.annual_price || 0,
        
        // ✅ DURACIONES COMPLETAS
        weekly_duration: formData.weekly_duration || 7,
        biweekly_duration: formData.biweekly_duration || 15,
        monthly_duration: formData.monthly_duration || 30,
        bimonthly_duration: formData.bimonthly_duration || 60,
        quarterly_duration: formData.quarterly_duration || 90,
        semester_duration: formData.semester_duration || 180,
        annual_duration: formData.annual_duration || 365,
        
        // Vigencia
        validity_type: formData.validity_type,
        validity_start_date: formData.validity_start_date,
        validity_end_date: formData.validity_end_date,
        
        // Características
        features: formData.features || [],
        gym_access: formData.gym_access,
        classes_included: formData.classes_included,
        guest_passes: formData.guest_passes || 0,
        
        // Restricciones
        has_time_restrictions: formData.has_time_restrictions,
        allowed_days: formData.allowed_days || [],
        time_slots: formData.time_slots || [],
        
        // Metadatos
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      };

      // Actualizar en Supabase
      const { data, error: updateError } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message || 'Error al actualizar el plan');
      }

      if (!mountedRef.current) return;

      setSuccessMessage('Plan actualizado exitosamente');
      
      // Actualizar datos originales
      const updatedPlanData: PlanFormData = {
        ...formData,
        updated_at: updateData.updated_at,
        updated_by: updateData.updated_by
      };
      
      setOriginalFormData(JSON.parse(JSON.stringify(updatedPlanData)));
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          router.push('/dashboard/admin/planes');
        }
      }, 3000);

    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || 'Error inesperado al actualizar el plan');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 🎨 ESTILOS DARK PRO
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

  if (loadingPlan) {
    return (
      <Box sx={{ 
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: darkProTokens.textPrimary
      }}>
        <Container maxWidth="sm">
          <Card sx={{
            bgcolor: `${darkProTokens.primary}15`,
            border: `2px solid ${darkProTokens.primary}40`,
            borderRadius: 4,
            p: 6,
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 3
            }}>
              <UpdateIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700,
              mb: 2
            }}>
              Cargando Plan MUP
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textSecondary,
              mb: 4
            }}>
              Preparando editor de plan...
            </Typography>
            
            <CircularProgress 
              size={60} 
              sx={{ color: darkProTokens.primary }} 
            />
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 🎯 HEADER SIMPLIFICADO */}
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
                    onClick={() => router.push('/dashboard/admin/planes')}
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
                    Editar Plan MUP
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Actualizar configuración de "{formData.name || 'Plan'}"
                  </Typography>
                </Box>
              </Box>

              {/* Progreso */}
              <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                  Progreso de Edición
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
                <Chip 
                  icon={hasFormChanges ? <EditIcon /> : <CheckCircleIcon />}
                  label={hasFormChanges ? 'MODIFICADO' : 'SIN CAMBIOS'}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: hasFormChanges ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                    color: hasFormChanges ? darkProTokens.warning : darkProTokens.success,
                    border: `1px solid ${hasFormChanges ? darkProTokens.warning : darkProTokens.success}40`
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* 🚨 MENSAJES */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)} sx={{ 
            bgcolor: `${darkProTokens.error}20`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.error}40`
          }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ 
            bgcolor: `${darkProTokens.success}20`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.success}40`
          }}>
            {successMessage}
          </Alert>
        </Snackbar>

        {/* 📋 ERRORES DE VALIDACIÓN */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="warning" sx={{ 
            mb: 4,
            bgcolor: `${darkProTokens.warning}20`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.warning}40`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Verificaciones Pendientes:
            </Typography>
            {Object.values(errors).map((error, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                • {error}
              </Typography>
            ))}
          </Alert>
        )}

        {/* 🎨 FORMULARIO - IGUAL QUE CREAR */}
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
            {/* 1. INFORMACIÓN BÁSICA */}
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
                              value={formData.validity_start_date || ''}
                              onChange={(e) => handleInputChange('validity_start_date', e.target.value || null)}
                              InputLabelProps={{ shrink: true }}
                              sx={darkProFieldStyle}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Fecha de Fin"
                              type="date"
                              value={formData.validity_end_date || ''}
                              onChange={(e) => handleInputChange('validity_end_date', e.target.value || null)}
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

            {/* 2. ESTRUCTURA DE PRECIOS - COMPLETA */}
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
                      onChange={(e) => handleInputChange('inscription_price', parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => handleInputChange('visit_price', parseFloat(e.target.value) || 0)}
                      sx={darkProFieldStyle}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  {/* ✅ MODALIDADES COMPLETAS - IGUAL QUE CREAR */}
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
                        <Grid key={period.key} size={{ xs: 12, sm: 6, md: 4 }}>
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
                                  onChange={(e) => handleInputChange(period.key as keyof PlanFormData, parseFloat(e.target.value) || 0)}
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

            {/* 3. CARACTERÍSTICAS - IGUAL QUE CREAR */}
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
                            onChange={(e) => handleInputChange('gym_access', e.target.checked)}
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
                            onChange={(e) => handleInputChange('classes_included', e.target.checked)}
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
                        onChange={(e) => handleInputChange('guest_passes', parseInt(e.target.value) || 0)}
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
                              cursor: 'pointer'
                            }
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
                          Características Incluidas:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {formData.features.map((feature, index) => (
                            <Chip
                              key={index}
                              label={feature}
                              onDelete={() => removeFeature(feature)}
                              deleteIcon={<DeleteIcon />}
                              sx={{
                                bgcolor: `${darkProTokens.success}20`,
                                color: darkProTokens.success,
                                border: `1px solid ${darkProTokens.success}40`,
                                '& .MuiChip-deleteIcon': { 
                                  color: darkProTokens.success,
                                  '&:hover': { color: darkProTokens.error }
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

            {/* 4. RESTRICCIONES DE HORARIO - IGUAL QUE CREAR */}
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
                      Restricciones de Horario
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Configure días y horarios específicos de acceso
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
                            onChange={(e) => handleInputChange('has_time_restrictions', e.target.checked)}
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
                              🕐 Aplicar Restricciones de Horario
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Limite el acceso a días y horarios específicos
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
                              Días Permitidos
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
                                        } else {
                                          handleInputChange('allowed_days', formData.allowed_days.filter(d => d !== day.value));
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
                                    minWidth: 120
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
                                Horarios de Acceso
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
                                    bgcolor: `${darkProTokens.warning}10`
                                  }
                                }}
                              >
                                Agregar Horario
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
                                      Horario {index + 1}:
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

            {/* 5. VISTA PREVIA Y ACTUALIZACIÓN */}
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
                      Vista Previa y Actualización
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Revise los cambios antes de actualizar el plan
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<InfoIcon />} 
                    label="Listo para Actualizar"
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
                    {/* VISTA PREVIA DEL PLAN */}
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
                              {formData.name || 'Nombre del Plan'}
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.textSecondary, 
                              mb: 2
                            }}>
                              {formData.description || 'Descripción del plan...'}
                            </Typography>
                          </Box>
                          <Chip 
                            label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                            sx={{
                              bgcolor: formData.is_active ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                              color: formData.is_active ? darkProTokens.success : darkProTokens.error,
                              border: `1px solid ${formData.is_active ? darkProTokens.success : darkProTokens.error}40`,
                              fontWeight: 700
                            }}
                          />
                        </Box>
                        
                        <Divider sx={{ borderColor: `${darkProTokens.primary}40`, my: 3 }} />
                        
                        {/* PRECIOS */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h5" sx={{ 
                            color: darkProTokens.primary, 
                            mb: 2, 
                            fontWeight: 700
                          }}>
                            💰 Estructura de Precios
                          </Typography>
                          <Grid container spacing={2}>
                            {[
                              { label: 'Inscripción', value: formData.inscription_price, color: darkProTokens.warning },
                              { label: 'Visita', value: formData.visit_price, color: darkProTokens.info },
                              { label: 'Semanal', value: formData.weekly_price, color: darkProTokens.success },
                              { label: 'Quincenal', value: formData.biweekly_price, color: darkProTokens.info },
                              { label: 'Mensual', value: formData.monthly_price, color: darkProTokens.primary },
                              { label: 'Bimestral', value: formData.bimonthly_price, color: darkProTokens.warning },
                              { label: 'Trimestral', value: formData.quarterly_price, color: '#FF6B35' },
                              { label: 'Semestral', value: formData.semester_price, color: '#9C27B0' },
                              { label: 'Anual', value: formData.annual_price, color: '#45B7D1' }
                            ].filter(price => price.value > 0).map((price) => (
                              <Grid key={price.label} size={{ xs: 6, sm: 4, md: 3 }}>
                                <Card sx={{
                                  bgcolor: `${price.color}15`,
                                  border: `1px solid ${price.color}30`,
                                  borderRadius: 2,
                                  p: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="caption" sx={{ 
                                    color: price.color, 
                                    fontWeight: 700
                                  }}>
                                    {price.label}
                                  </Typography>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.textPrimary, 
                                    fontWeight: 700
                                  }}>
                                    ${price.value.toLocaleString('es-MX')}
                                  </Typography>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                        
                        {/* CARACTERÍSTICAS */}
                        {formData.features.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="h5" sx={{ 
                              color: darkProTokens.success, 
                              mb: 2, 
                              fontWeight: 700
                            }}>
                              ✨ Características Incluidas
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {formData.features.map((feature, index) => (
                                <Chip
                                  key={index}
                                  label={feature}
                                  icon={<CheckCircleIcon />}
                                  sx={{
                                    bgcolor: `${darkProTokens.success}20`,
                                    color: darkProTokens.success,
                                    border: `1px solid ${darkProTokens.success}40`,
                                    '& .MuiChip-icon': { color: darkProTokens.success }
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {/* BENEFICIOS */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h5" sx={{ 
                            color: darkProTokens.info, 
                            mb: 2, 
                            fontWeight: 700
                          }}>
                            🎯 Beneficios Principales
                          </Typography>
                          <Grid container spacing={2}>
                            {[
                              { 
                                label: 'Acceso al Gimnasio', 
                                value: formData.gym_access,
                                icon: <FitnessCenterIcon />
                              },
                              { 
                                label: 'Clases Grupales', 
                                value: formData.classes_included,
                                icon: <GroupIcon />
                              },
                              { 
                                label: `${formData.guest_passes} Pases de Invitado`, 
                                value: formData.guest_passes > 0,
                                icon: <GroupIcon />
                              }
                            ].filter(benefit => benefit.value).map((benefit, index) => (
                              <Grid key={index} size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 2,
                                  p: 2,
                                  bgcolor: `${darkProTokens.info}10`,
                                  border: `1px solid ${darkProTokens.info}30`,
                                  borderRadius: 2
                                }}>
                                  <Avatar sx={{ 
                                    bgcolor: darkProTokens.info,
                                    color: darkProTokens.textPrimary,
                                    width: 32,
                                    height: 32
                                  }}>
                                    {benefit.icon}
                                  </Avatar>
                                  <Typography sx={{ 
                                    color: darkProTokens.textPrimary, 
                                    fontWeight: 600
                                  }}>
                                    {benefit.label}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                        
                        {/* RESTRICCIONES */}
                        {formData.has_time_restrictions && (
                          <Box>
                            <Typography variant="h5" sx={{ 
                              color: darkProTokens.warning, 
                              mb: 2, 
                              fontWeight: 700
                            }}>
                              🕐 Restricciones de Acceso
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body1" sx={{ 
                                  color: darkProTokens.warning, 
                                  mb: 1, 
                                  fontWeight: 600
                                }}>
                                  Días Permitidos:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {DAY_NAMES.filter(day => formData.allowed_days.includes(day.value)).map((day) => (
                                    <Chip
                                      key={day.value}
                                      label={day.short}
                                      size="small"
                                      sx={{
                                        bgcolor: darkProTokens.warning,
                                        color: darkProTokens.background,
                                        fontWeight: 700
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Grid>
                              
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body1" sx={{ 
                                  color: darkProTokens.warning, 
                                  mb: 1, 
                                  fontWeight: 600
                                }}>
                                  Horarios:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {formData.time_slots.map((slot, index) => (
                                    <Chip
                                      key={index}
                                      label={`${slot.start} - ${slot.end}`}
                                      icon={<AccessTimeIcon />}
                                      size="small"
                                      sx={{
                                        bgcolor: `${darkProTokens.warning}20`,
                                        color: darkProTokens.warning,
                                        border: `1px solid ${darkProTokens.warning}40`,
                                        '& .MuiChip-icon': { color: darkProTokens.warning }
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                        
                        {/* VIGENCIA */}
                        <Box sx={{ 
                          mt: 3, 
                          p: 2, 
                          bgcolor: `${darkProTokens.info}10`, 
                          borderRadius: 2, 
                          border: `1px solid ${darkProTokens.info}30`,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h6" sx={{ 
                            color: darkProTokens.info, 
                            fontWeight: 700
                          }}>
                            📅 Vigencia: {formData.validity_type === 'permanent' 
                              ? 'Permanente' 
                              : `${formData.validity_start_date} → ${formData.validity_end_date}`
                            }
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, lg: 4 }}>
                    {/* PANEL DE CONTROL */}
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
                        🔄 Centro de Control
                      </Typography>
                      
                      {/* VALIDACIONES */}
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
                      
                      {/* INFORMACIÓN DEL USUARIO */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ 
                          color: darkProTokens.textSecondary, 
                          mb: 1
                        }}>
                          Editor actual:
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
                              luishdz04
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: darkProTokens.textSecondary
                            }}>
                              12 de junio de 2025 • 00:11 UTC
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* INFORMACIÓN DE LA ÚLTIMA ACTUALIZACIÓN */}
                      {formData.updated_at && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ 
                            color: darkProTokens.textSecondary, 
                            mb: 1
                          }}>
                            Última actualización:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: darkProTokens.textPrimary, 
                            fontWeight: 600,
                            p: 2,
                            bgcolor: `${darkProTokens.info}10`,
                            borderRadius: 2,
                            border: `1px solid ${darkProTokens.info}30`,
                            textAlign: 'center'
                          }}>
                            {new Date(formData.updated_at).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* BOTONES DE ACCIÓN */}
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleUpdate}
                          disabled={loading || !hasFormChanges || !formData.name.trim() || !formData.description.trim()}
                          startIcon={loading ? <CircularProgress size={20} /> : <UpdateIcon />}
                          sx={{
                            background: hasFormChanges 
                              ? `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`
                              : `linear-gradient(135deg, ${darkProTokens.grayMedium}, ${darkProTokens.grayDark})`,
                            color: hasFormChanges ? darkProTokens.background : darkProTokens.textDisabled,
                            fontWeight: 700,
                            py: 1.5,
                            borderRadius: 2,
                            '&:hover': hasFormChanges ? { 
                              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 20px ${darkProTokens.primary}40`
                            } : {},
                            '&:disabled': {
                              bgcolor: darkProTokens.grayMedium,
                              color: darkProTokens.textDisabled
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {loading 
                            ? 'Actualizando Plan...' 
                            : hasFormChanges 
                              ? '💾 Actualizar Plan MUP' 
                              : '✅ Sin cambios'
                          }
                        </Button>
                        
                        <Button
                          variant="outlined"
                          size="large"
                          fullWidth
                          onClick={() => router.push('/dashboard/admin/planes')}
                          disabled={loading}
                          startIcon={<ArrowBackIcon />}
                          sx={{
                            borderColor: darkProTokens.grayDark,
                            color: darkProTokens.textSecondary,
                            '&:hover': {
                              borderColor: darkProTokens.textSecondary,
                              bgcolor: darkProTokens.hoverOverlay,
                              color: darkProTokens.textPrimary
                            },
                            '&:disabled': {
                              borderColor: darkProTokens.grayDark,
                              color: darkProTokens.textDisabled
                            }
                          }}
                        >
                          ← Volver a Planes
                        </Button>
                      </Stack>
                      
                      {/* ESTADÍSTICAS RÁPIDAS */}
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
                          Resumen de Configuración:
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
                                {formData.has_time_restrictions ? formData.allowed_days.length : 7}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Días Activos
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                                {formData.guest_passes}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                Pases VIP
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* INDICADOR DE CAMBIOS */}
                      {hasFormChanges && (
                        <Alert 
                          severity="info" 
                          sx={{ 
                            mt: 3,
                            bgcolor: `${darkProTokens.info}20`,
                            color: darkProTokens.textPrimary,
                            border: `1px solid ${darkProTokens.info}40`
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ⚠️ Tienes cambios sin guardar
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Recuerda actualizar para conservar los cambios
                          </Typography>
                        </Alert>
                      )}
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
