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
  Skeleton,
  Slide
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

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
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import UpdateIcon from '@mui/icons-material/Update';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';

// ✅ INTERFACE COMPLETA
interface PlanFormData {
  id?: string;
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

// ✅ INTERFACE PARA USUARIO
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export default function EditarPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  
  // ✅ REF CORRECTAMENTE INICIALIZADO
  const isMountedRef = useRef<boolean>(true);
  
  // ✅ ESTADOS PRINCIPALES
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
  const [debugInfo, setDebugInfo] = useState<string>('Inicializando...');
  
  // ✅ ESTADOS PARA CARACTERÍSTICAS
  const [newFeature, setNewFeature] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  
  // ✅ ESTADO PARA USUARIO ACTUAL (DINÁMICO)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasFormChanges, setHasFormChanges] = useState(false);

  // ✅ FUNCIÓN PARA OBTENER TIMESTAMP ACTUAL
  const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
  };

  // ✅ FUNCIÓN PARA OBTENER USUARIO ACTUAL (MEJORADA)
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      console.log('🔍 [AUTH] Obteniendo usuario actual...');
      const supabase = createBrowserSupabaseClient();
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AUTH] Error obteniendo sesión:', sessionError);
        return null;
      }
      
      if (!session?.user) {
        console.error('❌ [AUTH] No hay sesión activa');
        return null;
      }
      
      const user: User = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      };
      
      console.log('✅ [AUTH] Usuario obtenido:', {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name
      });
      
      return user;
    } catch (error) {
      console.error('💥 [AUTH] Error inesperado:', error);
      return null;
    }
  }, []);

  // ✅ INICIALIZAR USUARIO AL MONTAR COMPONENTE
  useEffect(() => {
    console.log('🟢 [INIT] Componente montándose...');
    isMountedRef.current = true;
    
    const initializeUser = async () => {
      const user = await getCurrentUser();
      if (isMountedRef.current && user) {
        setCurrentUser(user);
        console.log('✅ [INIT] Usuario inicializado:', user.email);
      }
    };
    
    initializeUser();
    
    // ✅ CLEANUP CORRECTO
    return () => {
      console.log('🔴 [CLEANUP] Componente desmontándose...');
      isMountedRef.current = false;
    };
  }, [getCurrentUser]);

  // ✅ CARGAR PLAN EXISTENTE - FUNCIÓN CORREGIDA
  useEffect(() => {
    if (!planId) {
      console.log('❌ [LOAD] No hay planId disponible');
      setDebugInfo('Error: No hay ID de plan');
      setLoadingPlan(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const loadPlan = async () => {
      try {
        console.log('🔄 [LOAD] Iniciando carga de plan...');
        console.log('🆔 [LOAD] Plan ID:', planId);
        setDebugInfo('Conectando a Supabase...');
        setLoadingPlan(true);
        setError(null);
        
        const supabase = createBrowserSupabaseClient();
        console.log('✅ [LOAD] Cliente Supabase creado');
        
        setDebugInfo('Consultando base de datos...');
        const { data: plan, error: fetchError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('id', planId)
          .single();
        
        console.log('📥 [LOAD] Respuesta de Supabase:', { plan, error: fetchError });
        
        if (fetchError) {
          console.error('❌ [LOAD] Error de Supabase:', fetchError);
          throw new Error(`Error de Supabase: ${fetchError.message}`);
        }
        
        if (!plan) {
          console.error('❌ [LOAD] Plan no encontrado');
          throw new Error('Plan no encontrado en la base de datos');
        }
        
        setDebugInfo('Procesando datos del plan...');
        
        // ✅ MAPEAR DATOS CORRECTAMENTE
        const planData: PlanFormData = {
          id: plan.id,
          name: plan.name || '',
          description: plan.description || '',
          is_active: Boolean(plan.is_active),
          
          // Precios
          inscription_price: Number(plan.inscription_price) || 0,
          visit_price: Number(plan.visit_price) || 0,
          weekly_price: Number(plan.weekly_price) || 0,
          biweekly_price: Number(plan.biweekly_price) || 0,
          monthly_price: Number(plan.monthly_price) || 0,
          bimonthly_price: Number(plan.bimonthly_price) || 0,
          quarterly_price: Number(plan.quarterly_price) || 0,
          semester_price: Number(plan.semester_price) || 0,
          annual_price: Number(plan.annual_price) || 0,
          
          // Duraciones
          weekly_duration: Number(plan.weekly_duration) || 7,
          biweekly_duration: Number(plan.biweekly_duration) || 15,
          monthly_duration: Number(plan.monthly_duration) || 30,
          bimonthly_duration: Number(plan.bimonthly_duration) || 60,
          quarterly_duration: Number(plan.quarterly_duration) || 90,
          semester_duration: Number(plan.semester_duration) || 180,
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
        
        if (isMountedRef.current) {
          console.log('✅ [LOAD] Estableciendo datos del formulario');
          setFormData(planData);
          setOriginalFormData(JSON.parse(JSON.stringify(planData)));
          setDebugInfo('¡Carga completada!');
        }
        
      } catch (err: any) {
        console.error('💥 [LOAD] Error capturado:', err);
        if (isMountedRef.current) {
          setDebugInfo(`Error: ${err.message}`);
          setError(err.message || 'Error cargando el plan');
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingPlan(false);
        }
      }
    };
    
    // ✅ EJECUTAR CON PEQUEÑO DELAY
    timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        loadPlan();
      }
    }, 100);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [planId]);

  // ✅ DETECTAR CAMBIOS EN EL FORMULARIO
  useEffect(() => {
    if (Object.keys(originalFormData).length === 0) return;
    
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasFormChanges(hasChanges);
  }, [formData, originalFormData]);

  // ✅ CALCULAR PROGRESO DEL FORMULARIO
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

  // ✅ MANEJADORES DE INPUT
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

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  // ✅ FUNCIÓN DE VALIDACIÓN
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN - COMPLETAMENTE CORREGIDA
  const handleUpdate = async () => {
    if (loading) {
      console.log('⚠️ [UPDATE] Ya hay una actualización en progreso');
      return;
    }

    try {
      console.log('🔄 [UPDATE] Iniciando actualización de plan...');
      setLoading(true);
      setError(null);

      // ✅ VALIDACIONES
      if (!validateForm()) {
        console.log('❌ [UPDATE] Formulario inválido');
        return;
      }

      if (!currentUser) {
        throw new Error('No se pudo identificar al usuario actual');
      }

      console.log('✅ [UPDATE] Validaciones pasadas');

      const supabase = createBrowserSupabaseClient();
      
      // ✅ PREPARAR DATOS CON USUARIO Y TIMESTAMP DINÁMICOS
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        
        // Precios
        inscription_price: formData.inscription_price || 0,
        visit_price: formData.visit_price || 0,
        weekly_price: formData.weekly_price || 0,
        biweekly_price: formData.biweekly_price || 0,
        monthly_price: formData.monthly_price || 0,
        bimonthly_price: formData.bimonthly_price || 0,
        quarterly_price: formData.quarterly_price || 0,
        semester_price: formData.semester_price || 0,
        annual_price: formData.annual_price || 0,
        
        // Duraciones
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
        
        // ✅ METADATOS DINÁMICOS
        updated_by: currentUser.id, // ✅ USUARIO DINÁMICO
        updated_at: getCurrentTimestamp() // ✅ TIMESTAMP DINÁMICO
      };

      console.log('📤 [UPDATE] Datos a actualizar:', {
        ...updateData,
        updated_by: currentUser.email || currentUser.id,
        timestamp: updateData.updated_at
      });

      // ✅ ACTUALIZAR EN SUPABASE
      const { data, error: updateError } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [UPDATE] Error de Supabase:', updateError);
        throw new Error(updateError.message || 'Error al actualizar el plan');
      }

      console.log('✅ [UPDATE] Plan actualizado exitosamente');
      setSuccessMessage('🎉 Plan actualizado exitosamente');
      
      // ✅ ACTUALIZAR DATOS ORIGINALES
      const updatedPlanData: PlanFormData = {
        ...formData,
        updated_at: updateData.updated_at,
        updated_by: updateData.updated_by
      };
      
      setOriginalFormData(JSON.parse(JSON.stringify(updatedPlanData)));
      
      // ✅ REDIRIGIR DESPUÉS DE 3 SEGUNDOS
      setTimeout(() => {
        console.log('🔄 [UPDATE] Redirigiendo a lista de planes...');
        router.push('/dashboard/admin/planes');
      }, 3000);

    } catch (err: any) {
      console.error('💥 [UPDATE] Error durante actualización:', err);
      setError(err.message || 'Error inesperado al actualizar el plan');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER INICIALES DEL USUARIO
  const getUserInitials = (user: User | null): string => {
    if (!user) return 'U';
    
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  // ✅ FUNCIÓN PARA OBTENER NOMBRE DEL USUARIO
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return 'Usuario';
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'Usuario';
  };

  // ✅ ESTILOS ENTERPRISE
  const enterpriseFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '2px solid rgba(255, 204, 0, 0.1)',
      borderRadius: '16px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      color: '#FFFFFF',
      fontWeight: 500,
      backdropFilter: 'blur(10px)',
      '&:hover': {
        backgroundColor: 'rgba(255, 204, 0, 0.03)',
        border: '2px solid rgba(255, 204, 0, 0.3)',
        boxShadow: '0 0 30px rgba(255, 204, 0, 0.15)',
        transform: 'translateY(-1px)',
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(255, 204, 0, 0.05)',
        border: '2px solid #FFCC00',
        boxShadow: '0 0 40px rgba(255, 204, 0, 0.25)',
        transform: 'translateY(-2px)',
      },
      '& fieldset': { border: 'none' }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: 600,
      fontSize: '0.95rem',
      '&.Mui-focused': {
        color: '#FFCC00',
        fontWeight: 700,
      }
    },
    '& .MuiInputBase-input': {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.3px',
    }
  };

  // ✅ LOADING STATE CON DEBUG
  if (loadingPlan) {
    return (
      <Box sx={{ 
        background: `
          linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #1a1a1a 50%, #0f0f0f 75%, #000000 100%),
          radial-gradient(circle at 20% 30%, rgba(255, 204, 0, 0.02) 0%, transparent 70%)
        `,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 204, 0, 0.03))',
              border: '2px solid rgba(255, 204, 0, 0.2)',
              borderRadius: 4,
              p: 6,
              textAlign: 'center',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)'
            }}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                width: 80, 
                height: 80,
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 25px rgba(255, 204, 0, 0.3)'
              }}>
                <WorkspacePremiumIcon sx={{ fontSize: 40, color: '#000' }} />
              </Avatar>
              
              <Typography variant="h4" sx={{ 
                background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                mb: 2
              }}>
                Cargando Plan Elite
              </Typography>
              
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 2,
                fontWeight: 500
              }}>
                Preparando la configuración avanzada...
              </Typography>

              <Typography variant="body2" sx={{ 
                color: '#FFCC00',
                mb: 4,
                fontWeight: 600,
                fontFamily: 'monospace'
              }}>
                📊 {debugInfo}
              </Typography>
              
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: '#FFCC00',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
              
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  mt: 4,
                  color: '#FFCC00',
                  borderColor: '#FFCC00',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    borderColor: '#FFCC00'
                  }
                }}
              >
                🔄 Recargar si se queda aquí
              </Button>

              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                  Plan ID: {planId}<br/>
                  Timestamp: 2025-06-07 17:05:19<br/>
                  Usuario: {currentUser?.email || 'Cargando...'}
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: `
        linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #1a1a1a 50%, #0f0f0f 75%, #000000 100%),
        radial-gradient(circle at 20% 30%, rgba(255, 204, 0, 0.02) 0%, transparent 70%),
        radial-gradient(circle at 80% 70%, rgba(255, 107, 53, 0.015) 0%, transparent 70%),
        radial-gradient(circle at 40% 80%, rgba(78, 205, 196, 0.01) 0%, transparent 70%)
      `,
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(90deg, rgba(255, 204, 0, 0.003) 0%, transparent 50%, rgba(255, 204, 0, 0.003) 100%),
          linear-gradient(0deg, rgba(255, 107, 53, 0.002) 0%, transparent 50%, rgba(255, 107, 53, 0.002) 100%)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 5 }}>
          {/* ✅ HEADER ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Paper elevation={0} sx={{
              p: 5,
              mb: 4,
              background: `
                linear-gradient(135deg, 
                  rgba(255, 204, 0, 0.08) 0%, 
                  rgba(255, 204, 0, 0.04) 25%,
                  rgba(255, 107, 53, 0.02) 50%,
                  rgba(78, 205, 196, 0.02) 75%,
                  rgba(255, 204, 0, 0.02) 100%
                )
              `,
              border: '1px solid rgba(255, 204, 0, 0.2)',
              borderRadius: 6,
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 204, 0, 0.1)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #FFCC00 0%, #FF6B35 50%, #4ECDC4 100%)',
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tooltip title="Volver a Planes" arrow>
                    <IconButton
                      onClick={() => router.push('/dashboard/admin/planes')}
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.05))',
                        border: '2px solid rgba(255, 204, 0, 0.3)',
                        color: '#FFCC00',
                        width: 52,
                        height: 52,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 25px rgba(255, 204, 0, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 204, 0, 0.1))',
                          transform: 'translateX(-3px) translateY(-2px)',
                          boxShadow: '0 12px 35px rgba(255, 204, 0, 0.3)',
                        },
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <ArrowBackIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  
                  <Box>
                    <Typography variant="h2" sx={{ 
                      background: 'linear-gradient(135deg, #FFCC00 0%, #FF6B35 50%, #FFCC00 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 900,
                      fontSize: { xs: '2rem', md: '3rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      mb: 1,
                      letterSpacing: '-0.02em',
                    }}>
                      <Avatar sx={{ 
                        background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                        width: 70, 
                        height: 70,
                        boxShadow: '0 8px 25px rgba(255, 204, 0, 0.3)'
                      }}>
                        <UpdateIcon sx={{ fontSize: 36, color: '#000' }} />
                      </Avatar>
                      Editar Plan Elite
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: '#FFFFFF',
                      fontWeight: 500,
                      maxWidth: 700,
                      lineHeight: 1.6,
                      opacity: 0.9
                    }}>
                      Actualice la configuración avanzada de <strong>"{formData.name || 'Plan'}"</strong>
                    </Typography>
                  </Box>
                </Box>

                {/* ✅ PROGRESO DE EDICIÓN */}
                <Box sx={{ textAlign: 'right', minWidth: 250 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, fontWeight: 600 }}>
                    Estado de la Edición
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={formProgress} 
                      sx={{ 
                        width: 140, 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: 'rgba(255, 204, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #FFCC00, #FF6B35)',
                          borderRadius: 6,
                          boxShadow: '0 0 10px rgba(255, 204, 0, 0.4)'
                        }
                      }} 
                    />
                    <Typography variant="h6" sx={{ 
                      color: '#FFCC00', 
                      fontWeight: 800,
                      minWidth: 50,
                      textShadow: '0 0 10px rgba(255, 204, 0, 0.3)'
                    }}>
                      {Math.round(formProgress)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Chip 
                      icon={hasFormChanges ? <EditIcon /> : <CheckCircleIcon />}
                      label={hasFormChanges ? 'MODIFICADO' : 'SIN CAMBIOS'}
                      size="small"
                      sx={{
                        background: hasFormChanges 
                          ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1))'
                          : 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                        color: hasFormChanges ? '#ff9800' : '#4caf50',
                        border: hasFormChanges 
                          ? '1px solid rgba(255, 152, 0, 0.4)'
                          : '1px solid rgba(76, 175, 80, 0.4)',
                        fontWeight: 700,
                        boxShadow: hasFormChanges 
                          ? '0 4px 15px rgba(255, 152, 0, 0.2)'
                          : '0 4px 15px rgba(76, 175, 80, 0.2)'
                      }}
                    />
                    {formData.created_at && (
                      <Tooltip title={`Creado: ${new Date(formData.created_at).toLocaleString('es-MX')}`} arrow>
                        <Chip 
                          icon={<HistoryIcon />}
                          label="HISTORIAL"
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.1))',
                            color: '#2196f3',
                            border: '1px solid rgba(33, 150, 243, 0.4)',
                            fontWeight: 600
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* ✅ MENSAJES */}
          <Snackbar
            open={!!error}
            autoHideDuration={8000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            TransitionComponent={Slide}
          >
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              icon={<WarningIcon />}
              sx={{ 
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.05))',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 25px rgba(244, 67, 54, 0.2)',
                '& .MuiAlert-icon': { color: '#ff4444' }
              }}
            >
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!successMessage}
            autoHideDuration={5000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            TransitionComponent={Slide}
          >
            <Alert 
              severity="success" 
              onClose={() => setSuccessMessage(null)}
              icon={<CheckCircleIcon />}
              sx={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                '& .MuiAlert-icon': { color: '#4caf50' }
              }}
            >
              {successMessage}
            </Alert>
          </Snackbar>

          {/* ✅ ERRORES DE VALIDACIÓN */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.12), rgba(255, 152, 0, 0.04))',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#FFCC00' }}>
                  ⚠️ Verificaciones Pendientes:
                </Typography>
                {Object.values(errors).map((error, index) => (
                  <Typography key={index} variant="body2" sx={{ ml: 2, color: '#FFFFFF', opacity: 0.9 }}>
                    • {error}
                  </Typography>
                ))}
              </Alert>
            </motion.div>
          )}

          {/* ✅ FORMULARIO DE EDICIÓN */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <Paper elevation={0} sx={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.02) 0%, 
                  rgba(255, 204, 0, 0.01) 25%,
                  rgba(255, 255, 255, 0.01) 50%,
                  rgba(255, 107, 53, 0.01) 75%,
                  rgba(255, 255, 255, 0.015) 100%
                )
              `,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              p: 5
            }}>
              <Grid container spacing={5}>
                <Grid size={{ xs: 12, lg: 8 }}>
                  {/* ✅ INFORMACIÓN BÁSICA */}
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 204, 0, 0.03))',
                    border: '2px solid rgba(255, 204, 0, 0.2)',
                    borderRadius: 4,
                    p: 4,
                    mb: 4
                  }}>
                    <Typography variant="h5" sx={{ 
                      color: '#FFCC00', 
                      mb: 3, 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <EditIcon sx={{ fontSize: 28 }} />
                      Información Principal
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          label="Nombre del Plan Elite"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DiamondIcon sx={{ color: '#FFCC00' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth sx={enterpriseFieldStyle}>
                          <InputLabel>Vigencia del Plan</InputLabel>
                          <Select
                            value={formData.validity_type}
                            onChange={(e) => handleInputChange('validity_type', e.target.value)}
                            label="Vigencia del Plan"
                          >
                            <MenuItem value="permanent">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CheckCircleIcon sx={{ color: '#4ECDC4' }} />
                                <Typography sx={{ fontWeight: 600 }}>Permanente</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="limited">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ScheduleIcon sx={{ color: '#FF6B35' }} />
                                <Typography sx={{ fontWeight: 600 }}>Tiempo Limitado</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Descripción Ejecutiva"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          multiline
                          rows={3}
                          required
                          sx={enterpriseFieldStyle}
                        />
                      </Grid>

                      {formData.validity_type === 'limited' && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
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
                                  sx={enterpriseFieldStyle}
                                />
                              </Grid>
                              
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Fecha de Finalización"
                                  type="date"
                                  value={formData.validity_end_date || ''}
                                  onChange={(e) => handleInputChange('validity_end_date', e.target.value || null)}
                                  InputLabelProps={{ shrink: true }}
                                  sx={enterpriseFieldStyle}
                                />
                              </Grid>
                            </Grid>
                          </motion.div>
                        </AnimatePresence>
                      )}
                      
                      <Grid size={{ xs: 12 }}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.06), rgba(255, 204, 0, 0.02))',
                          border: '1px solid rgba(255, 204, 0, 0.2)',
                          borderRadius: 3,
                          p: 3
                        }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { 
                                    color: '#FFCC00',
                                    '& + .MuiSwitch-track': { 
                                      backgroundColor: '#FFCC00',
                                      boxShadow: '0 0 15px rgba(255, 204, 0, 0.3)'
                                    }
                                  },
                                  '& .MuiSwitch-track': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                  }
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '1.1rem' }}>
                                  Estado del Plan
                                </Typography>
                                <Chip 
                                  label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                                  size="small"
                                  sx={{
                                    background: formData.is_active 
                                      ? 'linear-gradient(135deg, #4caf50, #45a049)'
                                      : 'linear-gradient(135deg, #f44336, #d32f2f)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    boxShadow: formData.is_active 
                                      ? '0 4px 15px rgba(76, 175, 80, 0.3)'
                                      : '0 4px 15px rgba(244, 67, 54, 0.3)'
                                  }}
                                />
                              </Box>
                            }
                          />
                        </Card>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* ✅ PRECIOS PRINCIPALES */}
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03))',
                    border: '2px solid rgba(255, 107, 53, 0.2)',
                    borderRadius: 4,
                    p: 4,
                    mb: 4
                  }}>
                    <Typography variant="h5" sx={{ 
                      color: '#FF6B35', 
                      mb: 3, 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <AttachMoneyIcon sx={{ fontSize: 28 }} />
                      Estructura de Precios
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Precio de Inscripción"
                          type="number"
                          value={formData.inscription_price}
                          onChange={(e) => handleInputChange('inscription_price', parseFloat(e.target.value) || 0)}
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">
                              <Typography sx={{ color: '#FFCC00', fontWeight: 700 }}>$</Typography>
                            </InputAdornment>,
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
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">
                              <Typography sx={{ color: '#FFCC00', fontWeight: 700 }}>$</Typography>
                            </InputAdornment>,
                          }}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Precio Mensual"
                          type="number"
                          value={formData.monthly_price}
                          onChange={(e) => handleInputChange('monthly_price', parseFloat(e.target.value) || 0)}
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">
                              <Typography sx={{ color: '#FFCC00', fontWeight: 700 }}>$</Typography>
                            </InputAdornment>,
                          }}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Precio Anual"
                          type="number"
                          value={formData.annual_price}
                          onChange={(e) => handleInputChange('annual_price', parseFloat(e.target.value) || 0)}
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">
                              <Typography sx={{ color: '#FFCC00', fontWeight: 700 }}>$</Typography>
                            </InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* ✅ CARACTERÍSTICAS */}
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.08), rgba(78, 205, 196, 0.03))',
                    border: '2px solid rgba(78, 205, 196, 0.2)',
                    borderRadius: 4,
                    p: 4
                  }}>
                    <Typography variant="h5" sx={{ 
                      color: '#4ECDC4', 
                      mb: 3, 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <FeatureIcon sx={{ fontSize: 28 }} />
                      Características Elite
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.gym_access}
                              onChange={(e) => handleInputChange('gym_access', e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { 
                                  color: '#4ECDC4',
                                  '& + .MuiSwitch-track': { 
                                    backgroundColor: '#4ECDC4'
                                  }
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                              Acceso al Gimnasio
                            </Typography>
                          }
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.classes_included}
                              onChange={(e) => handleInputChange('classes_included', e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { 
                                  color: '#FF6B35',
                                  '& + .MuiSwitch-track': { 
                                    backgroundColor: '#FF6B35'
                                  }
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                              Clases Grupales
                            </Typography>
                          }
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Pases de Invitado"
                          type="number"
                          value={formData.guest_passes}
                          onChange={(e) => handleInputChange('guest_passes', parseInt(e.target.value) || 0)}
                          sx={enterpriseFieldStyle}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <GroupIcon sx={{ color: '#FFCC00' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                          <TextField
                            fullWidth
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Agregar nueva característica..."
                            sx={enterpriseFieldStyle}
                            />
                            <Button
                              onClick={addFeature}
                              variant="contained"
                              startIcon={<AddIcon />}
                              disabled={!newFeature.trim()}
                              sx={{
                                background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                                color: '#000',
                                minWidth: 120,
                                fontWeight: 700,
                                '&:hover': { 
                                  background: 'linear-gradient(135deg, #FF6B35, #FFCC00)' 
                                }
                              }}
                            >
                              Agregar
                            </Button>
                          </Box>
                          
                          {formData.features.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {formData.features.map((feature, index) => (
                                <Chip
                                  key={index}
                                  label={feature}
                                  onDelete={() => removeFeature(feature)}
                                  deleteIcon={<DeleteIcon />}
                                  sx={{
                                    background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.1))',
                                    color: '#4ECDC4',
                                    border: '1px solid rgba(78, 205, 196, 0.4)',
                                    fontWeight: 600,
                                    '& .MuiChip-deleteIcon': { 
                                      color: '#4ECDC4',
                                      '&:hover': { color: '#FF6B35' }
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                  
                  <Grid size={{ xs: 12, lg: 4 }}>
                    {/* ✅ PANEL DE CONTROL PARA EDICIÓN */}
                    <Card sx={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(255, 204, 0, 0.12) 0%, 
                          rgba(255, 107, 53, 0.08) 50%,
                          rgba(255, 204, 0, 0.06) 100%
                        )
                      `,
                      border: '2px solid rgba(255, 204, 0, 0.3)',
                      borderRadius: 4,
                      p: 4,
                      height: 'fit-content',
                      position: 'sticky',
                      top: 20,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 204, 0, 0.2)'
                    }}>
                      <Typography variant="h5" sx={{ 
                        color: '#FFCC00', 
                        mb: 4, 
                        fontWeight: 800,
                        textAlign: 'center',
                        textShadow: '0 0 20px rgba(255, 204, 0, 0.3)'
                      }}>
                        🔄 Centro de Control Executive
                      </Typography>
                      
                      {/* ✅ VALIDACIONES ENTERPRISE */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="body1" sx={{ 
                          color: '#FFFFFF', 
                          mb: 3, 
                          fontWeight: 700,
                          textAlign: 'center'
                        }}>
                          📊 Estado de Configuración:
                        </Typography>
                        
                        {[
                          { label: 'Información básica', check: !!formData.name.trim() && !!formData.description.trim() },
                          { label: 'Estructura de precios', check: formData.monthly_price > 0 || formData.visit_price > 0 },
                          { label: 'Características definidas', check: formData.features.length > 0 || formData.gym_access || formData.classes_included },
                          { label: 'Configuración temporal', check: !formData.has_time_restrictions || (formData.allowed_days.length > 0 && formData.time_slots.length > 0) },
                          { label: 'Validaciones completas', check: Object.keys(errors).length === 0 }
                        ].map((validation, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 2,
                              p: 2,
                              background: validation.check 
                                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))'
                                : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
                              border: validation.check 
                                ? '1px solid rgba(76, 175, 80, 0.3)'
                                : '1px solid rgba(255, 152, 0, 0.3)',
                              borderRadius: 2,
                              transition: 'all 0.3s ease'
                            }}>
                              {validation.check ? (
                                <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 22 }} />
                              ) : (
                                <WarningIcon sx={{ color: '#ff9800', fontSize: 22 }} />
                              )}
                              <Typography variant="body2" sx={{ 
                                color: validation.check ? '#4caf50' : '#ff9800',
                                fontWeight: 600,
                                flex: 1
                              }}>
                                {validation.label}
                              </Typography>
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                      
                      <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.3)', my: 3, borderWidth: 2 }} />
                      
                      {/* ✅ INFORMACIÓN DEL USUARIO ACTUAL (AUTOMÁTICA) */}
                      {currentUser && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            mb: 2,
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            👤 Editor actual:
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            p: 2,
                            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                            borderRadius: 3,
                            border: '1px solid rgba(33, 150, 243, 0.2)'
                          }}>
                            <Avatar sx={{ 
                              background: 'linear-gradient(135deg, #2196f3, #21CBF3)',
                              width: 40, 
                              height: 40,
                              fontSize: '1.1rem',
                              fontWeight: 700
                            }}>
                              {getUserInitials(currentUser)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ 
                                color: '#FFFFFF', 
                                fontWeight: 600
                              }}>
                                {getUserDisplayName(currentUser)}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontWeight: 500
                              }}>
                                7 de junio de 2025 • 17:08 UTC
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
  
                      {/* ✅ INFORMACIÓN DE LA ÚLTIMA ACTUALIZACIÓN */}
                      {formData.updated_at && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            mb: 2,
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            🕒 Última actualización:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#FFFFFF', 
                            fontWeight: 600,
                            textAlign: 'center',
                            p: 2,
                            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(78, 205, 196, 0.05))',
                            borderRadius: 2,
                            border: '1px solid rgba(78, 205, 196, 0.2)'
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
                      
                      {/* ✅ BOTONES DE ACCIÓN ENTERPRISE */}
                      <Stack spacing={3}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={(e) => {
                              e.preventDefault();
                              if (!loading) {
                                handleUpdate();
                              }
                            }}
                            disabled={loading || !hasFormChanges || !formData.name.trim() || !formData.description.trim()}
                            startIcon={loading ? <CircularProgress size={22} sx={{ color: '#000' }} /> : <UpdateIcon />}
                            sx={{
                              background: hasFormChanges 
                                ? 'linear-gradient(135deg, #FFCC00 0%, #FF6B35 50%, #FFCC00 100%)'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                              color: hasFormChanges ? '#000000' : 'rgba(255, 255, 255, 0.5)',
                              fontWeight: 800,
                              py: 2,
                              fontSize: '1.1rem',
                              borderRadius: 3,
                              textTransform: 'none',
                              letterSpacing: '0.5px',
                              boxShadow: hasFormChanges 
                                ? '0 8px 30px rgba(255, 204, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                : 'none',
                              border: '2px solid',
                              borderColor: hasFormChanges 
                                ? 'rgba(255, 204, 0, 0.3)'
                                : 'rgba(255, 255, 255, 0.1)',
                              '&:hover': hasFormChanges ? { 
                                background: 'linear-gradient(135deg, #FF6B35 0%, #FFCC00 50%, #FF6B35 100%)',
                                transform: 'translateY(-3px)',
                                boxShadow: '0 15px 40px rgba(255, 204, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                borderColor: 'rgba(255, 204, 0, 0.6)',
                              } : {},
                              '&:active': {
                                transform: hasFormChanges ? 'translateY(-1px)' : 'none',
                              },
                              '&:disabled': {
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                                color: 'rgba(255, 255, 255, 0.3)',
                                border: '2px solid rgba(255, 255, 255, 0.05)',
                                boxShadow: 'none'
                              },
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            {loading 
                              ? 'Actualizando Plan Elite...' 
                              : hasFormChanges 
                                ? '🚀 Actualizar Plan Elite' 
                                : '✅ Sin cambios por guardar'
                            }
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            onClick={() => router.push('/dashboard/admin/planes')}
                            disabled={loading}
                            startIcon={<ArrowBackIcon />}
                            sx={{
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontWeight: 600,
                              py: 1.5,
                              borderRadius: 3,
                              textTransform: 'none',
                              backdropFilter: 'blur(10px)',
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                              '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#FFFFFF',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)'
                              },
                              '&:disabled': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.3)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            ← Volver sin Guardar
                          </Button>
                        </motion.div>
                      </Stack>
                      
                      {/* ✅ ESTADÍSTICAS RÁPIDAS */}
                      <Box sx={{ 
                        mt: 4, 
                        p: 3, 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                        borderRadius: 3,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          mb: 2,
                          textAlign: 'center',
                          fontWeight: 600
                        }}>
                          📈 Resumen de Configuración:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                                {formData.features.length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Características
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#FF6B35', fontWeight: 700 }}>
                                {[formData.inscription_price, formData.visit_price, formData.weekly_price, formData.monthly_price, formData.quarterly_price, formData.annual_price].filter(p => p > 0).length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Modalidades
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#45B7D1', fontWeight: 700 }}>
                                {formData.has_time_restrictions ? formData.allowed_days.length : 7}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Días Activos
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#FFCC00', fontWeight: 700 }}>
                                {formData.guest_passes}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Pases VIP
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
  
                      {/* ✅ INDICADOR DE CAMBIOS */}
                      {hasFormChanges && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mt: 3,
                              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04))',
                              border: '1px solid rgba(33, 150, 243, 0.3)',
                              color: '#FFFFFF',
                              backdropFilter: 'blur(10px)',
                              borderRadius: 3,
                              '& .MuiAlert-icon': { color: '#2196f3' }
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ⚠️ Tienes cambios sin guardar
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              Recuerda actualizar para conservar los cambios
                            </Typography>
                          </Alert>
                        </motion.div>
                      )}
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Box>
        </Container>
      </Box>
    );
  }