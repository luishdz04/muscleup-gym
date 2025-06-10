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
  Fade,
  Slide
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
import BusinessIcon from '@mui/icons-material/Business';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

interface PlanFormData {
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
  validity_start_date: string;
  validity_end_date: string;
  
  // Características
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  
  // Restricciones de horario
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
}

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
  time_slots: [{ start: '06:00', end: '22:00' }]
};

const PREDEFINED_FEATURES = [
  'Acceso completo al gimnasio',
  'Clases grupales incluidas',
  'Área funcional premium',
  'Casilleros VIP con seguridad',
  'Estacionamiento gratuito vigilado',
  'Toallas de alta calidad incluidas',
  'Consulta nutricional personalizada',
  'Entrenador personal certificado',
  'Acceso 24/7 sin restricciones',
  'Área de cardio de última generación',
  'Zona de crossfit profesional',
  'Sauna y vapor relajante',
  'Piscina climatizada',
  'Canchas deportivas profesionales',
  'Zona de recuperación muscular',
  'Suplementos deportivos con descuento'
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
  const [planCategory, setPlanCategory] = useState('Básico');
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
          console.log('✅ Usuario actual obtenido:', session.user.email);
        }
      } catch (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Detectar cambios en el formulario
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasFormChanges(hasChanges);
  }, [formData, originalFormData]);

  // Calcular progreso del formulario
  useEffect(() => {
    let progress = 0;
    const totalFields = 10;
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
    completedFields++; // is_active siempre tiene valor

    progress = (completedFields / totalFields) * 100;
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
      
      if (new Date(formData.validity_start_date) >= new Date(formData.validity_end_date)) {
        newErrors.validity = 'La fecha de inicio debe ser anterior a la fecha de fin';
      }
    }

    if (formData.has_time_restrictions && formData.allowed_days.length === 0) {
      newErrors.schedule = 'Debe seleccionar al menos un día permitido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función principal de guardado
  const handleSave = async () => {
    console.log('🚀 Iniciando guardado de plan...');
    
    if (!mountedRef.current) {
      console.log('❌ Componente desmontado, cancelando guardado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📊 Datos del formulario:', formData);

      // Validaciones
      if (!validateForm()) {
        console.log('❌ Formulario inválido');
        setLoading(false);
        return;
      }

      console.log('✅ Validaciones pasadas');

      // Crear cliente Supabase
      const supabase = createBrowserSupabaseClient();
      console.log('✅ Cliente Supabase creado');
      
      // Preparar datos
      const planData = {
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
        validity_start_date: formData.validity_start_date || null,
        validity_end_date: formData.validity_end_date || null,
        
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
        created_by: currentUser?.id || null,
        updated_by: currentUser?.id || null
      };

      console.log('📤 Datos finales a insertar:', planData);

      // Insertar en Supabase
      const { data, error: insertError } = await supabase
        .from('membership_plans')
        .insert(planData)
        .select()
        .single();

      console.log('📥 Respuesta de Supabase:', { data, error: insertError });

      if (insertError) {
        console.error('❌ Error de Supabase:', insertError);
        throw new Error(insertError.message || 'Error al guardar el plan');
      }

      if (!mountedRef.current) {
        console.log('❌ Componente desmontado durante guardado');
        return;
      }

      console.log('✅ Plan guardado exitosamente:', data);
      setSuccessMessage('🎉 Plan creado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          console.log('🔄 Redirigiendo a lista de planes...');
          router.push('/dashboard/admin/planes');
        }
      }, 2000);

    } catch (err: any) {
      if (!mountedRef.current) return;
      
      console.error('💥 Error durante guardado:', err);
      setError(err.message || 'Error inesperado al guardar el plan');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        console.log('🏁 Proceso de guardado finalizado');
      }
    }
  };

  // 🎨 ESTILOS ENTERPRISE PREMIUM
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
      '& fieldset': {
        border: 'none',
      }
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
          {/* 🎯 HEADER ULTRA ENTERPRISE */}
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
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(45deg, rgba(255, 204, 0, 0.1), transparent, rgba(255, 107, 53, 0.1))',
                zIndex: -1,
                borderRadius: 6,
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
                        <WorkspacePremiumIcon sx={{ fontSize: 36, color: '#000' }} />
                      </Avatar>
                      Crear Plan Elite
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: '#FFFFFF',
                      fontWeight: 500,
                      maxWidth: 700,
                      lineHeight: 1.6,
                      opacity: 0.9
                    }}>
                      Diseñe planes de membresía de clase mundial con características premium y configuraciones avanzadas
                    </Typography>
                  </Box>
                </Box>

                {/* 📊 PROGRESO ENTERPRISE */}
                <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, fontWeight: 600 }}>
                    Progreso de Configuración
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
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500
                  }}>
                    {formProgress === 100 ? '¡Listo para publicar!' : 'Completando configuración...'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* 🚨 MENSAJES ENTERPRISE */}
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

          {/* 📋 ERRORES DE VALIDACIÓN */}
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

          {/* 🎨 FORMULARIO ULTRA ENTERPRISE */}
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
                      ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 204, 0, 0.03))'
                      : 'transparent',
                    borderBottom: '1px solid rgba(255, 204, 0, 0.1)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 80,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.06), rgba(255, 204, 0, 0.02))',
                    }
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: '#FFCC00', fontSize: 28 }} />}
                  sx={{ px: 4 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Avatar sx={{ 
                      background: 'linear-gradient(135deg, #FFCC00, #FF6B35)', 
                      width: 56,
                      height: 56,
                      boxShadow: '0 8px 25px rgba(255, 204, 0, 0.3)'
                    }}>
                      <EditIcon sx={{ fontSize: 28, color: '#000' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        color: '#FFCC00', 
                        fontWeight: 700,
                        fontSize: '1.4rem',
                        mb: 0.5
                      }}>
                        Información Básica del Plan
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500
                      }}>
                        Configure el nombre, descripción y características fundamentales
                      </Typography>
                    </Box>
                    {formData.name && formData.description && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Completado" 
                          size="medium"
                          sx={{ 
                            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                            color: '#4caf50',
                            border: '1px solid rgba(76, 175, 80, 0.4)',
                            fontWeight: 600,
                            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)'
                          }}
                        />
                      </motion.div>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 5 }}>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Nombre del Plan Elite"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        placeholder="Ej: Plan Executive Premium"
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
                        rows={4}
                        required
                        placeholder="Describa detalladamente las características exclusivas, beneficios premium y valor agregado de este plan..."
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
                                value={formData.validity_start_date}
                                onChange={(e) => handleInputChange('validity_start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={enterpriseFieldStyle}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                label="Fecha de Finalización"
                                type="date"
                                value={formData.validity_end_date}
                                onChange={(e) => handleInputChange('validity_end_date', e.target.value)}
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
                        borderRadius: 4,
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
                </AccordionDetails>
              </Accordion>

              {/* 2. ESTRUCTURA DE PRECIOS PREMIUM */}
              <Accordion 
                expanded={expandedAccordion === 'pricing'} 
                onChange={() => setExpandedAccordion(expandedAccordion === 'pricing' ? false : 'pricing')}
                sx={{
                  backgroundColor: 'transparent',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    background: expandedAccordion === 'pricing' 
                      ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03))'
                      : 'transparent',
                    borderBottom: '1px solid rgba(255, 107, 53, 0.1)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 80,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.06), rgba(255, 107, 53, 0.02))',
                    }
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: '#FF6B35', fontSize: 28 }} />}
                  sx={{ px: 4 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Avatar sx={{ 
                      background: 'linear-gradient(135deg, #FF6B35, #FFCC00)', 
                      width: 56,
                      height: 56,
                      boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
                    }}>
                      <AttachMoneyIcon sx={{ fontSize: 28, color: '#000' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        color: '#FF6B35', 
                        fontWeight: 700,
                        fontSize: '1.4rem',
                        mb: 0.5
                      }}>
                        Estructura de Precios Premium
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500
                      }}>
                        Configure los precios estratégicos para diferentes modalidades de membresía
                      </Typography>
                    </Box>
                    {(formData.monthly_price > 0 || formData.visit_price > 0) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Chip 
                          icon={<TrendingUpIcon />} 
                          label={`$${Math.max(formData.monthly_price, formData.visit_price).toLocaleString('es-MX')}`}
                          size="medium"
                          sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1))',
                            color: '#FF6B35',
                            border: '1px solid rgba(255, 107, 53, 0.4)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.2)'
                          }}
                        />
                      </motion.div>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 5 }}>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h5" sx={{ 
                        color: '#FFCC00', 
                        mb: 4, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        fontWeight: 700
                      }}>
                        <MonetizationOnIcon sx={{ fontSize: 32 }} />
                        Configuración de Tarifas Ejecutivas
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Inversión de Inscripción"
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
                        label="Tarifa por Sesión"
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
                    
                    {/* GRID DE PRECIOS PREMIUM */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#FFFFFF', 
                        mb: 3, 
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        📊 Modalidades de Membresía Premium
                      </Typography>
                      <Grid container spacing={4}>
                        {[
                          { 
                            key: 'weekly_price', 
                            label: 'Semanal', 
                            duration: '7 días',
                            color: '#4ECDC4',
                            icon: '📅'
                          },
                          { 
                            key: 'monthly_price', 
                            label: 'Mensual', 
                            duration: '30 días',
                            color: '#FFCC00',
                            icon: '⭐'
                          },
                          { 
                            key: 'quarterly_price', 
                            label: 'Trimestral', 
                            duration: '90 días',
                            color: '#FF6B35',
                            icon: '🔥'
                          },
                          { 
                            key: 'annual_price', 
                            label: 'Anual', 
                            duration: '365 días',
                            color: '#45B7D1',
                            icon: '💎'
                          }
                        ].map((period) => (
                          <Grid key={period.key} size={{ xs: 12, sm: 6, md: 3 }}>
                            <motion.div
                              whileHover={{ 
                                scale: 1.02,
                                y: -8
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card sx={{
                                background: `
                                  linear-gradient(135deg, 
                                    ${period.color}15 0%, 
                                    ${period.color}08 50%,
                                    ${period.color}05 100%
                                  )
                                `,
                                border: `2px solid ${period.color}30`,
                                borderRadius: 4,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: `0 8px 25px ${period.color}20`,
                                '&:hover': {
                                  border: `2px solid ${period.color}60`,
                                  boxShadow: `0 15px 40px ${period.color}30`,
                                }
                              }}>
                                <CardContent sx={{ p: 4, textAlign: 'center' }}>
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
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    mb: 3, 
                                    display: 'block',
                                    fontWeight: 500
                                  }}>
                                    {period.duration}
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    value={formData[period.key as keyof PlanFormData] as number}
                                    onChange={(e) => handleInputChange(period.key as keyof PlanFormData, parseFloat(e.target.value) || 0)}
                                    sx={{
                                      ...enterpriseFieldStyle,
                                      '& .MuiOutlinedInput-root': {
                                        ...enterpriseFieldStyle['& .MuiOutlinedInput-root'],
                                        backgroundColor: `${period.color}08`,
                                        border: `2px solid ${period.color}20`,
                                        '&:hover': {
                                          backgroundColor: `${period.color}12`,
                                          border: `2px solid ${period.color}40`,
                                        },
                                        '&.Mui-focused': {
                                          backgroundColor: `${period.color}15`,
                                          border: `2px solid ${period.color}`,
                                          boxShadow: `0 0 20px ${period.color}40`,
                                        }
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">
                                        <Typography sx={{ color: period.color, fontWeight: 700 }}>$</Typography>
                                      </InputAdornment>,
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

              {/* 3. CARACTERÍSTICAS PREMIUM */}
              <Accordion 
                expanded={expandedAccordion === 'features'} 
                onChange={() => setExpandedAccordion(expandedAccordion === 'features' ? false : 'features')}
                sx={{
                  backgroundColor: 'transparent',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    background: expandedAccordion === 'features' 
                      ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.08), rgba(78, 205, 196, 0.03))'
                      : 'transparent',
                    borderBottom: '1px solid rgba(78, 205, 196, 0.1)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 80,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.06), rgba(78, 205, 196, 0.02))',
                    }
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: '#4ECDC4', fontSize: 28 }} />}
                  sx={{ px: 4 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Avatar sx={{ 
                      background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)', 
                      width: 56,
                      height: 56,
                      boxShadow: '0 8px 25px rgba(78, 205, 196, 0.3)'
                    }}>
                      <FeatureIcon sx={{ fontSize: 28, color: '#000' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        color: '#4ECDC4', 
                        fontWeight: 700,
                        fontSize: '1.4rem',
                        mb: 0.5
                      }}>
                        Características y Beneficios Elite
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500
                      }}>
                        Defina las características exclusivas y beneficios premium incluidos
                      </Typography>
                    </Box>
                    {formData.features.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Badge 
                          badgeContent={formData.features.length} 
                          sx={{
                            '& .MuiBadge-badge': {
                              background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                              color: '#000',
                              fontWeight: 700
                            }
                          }}
                        >
                          <Chip 
                            icon={<StarIcon />} 
                            label="Características"
                            size="medium"
                            sx={{ 
                              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.1))',
                              color: '#4ECDC4',
                              border: '1px solid rgba(78, 205, 196, 0.4)',
                              fontWeight: 600,
                              boxShadow: '0 4px 15px rgba(78, 205, 196, 0.2)'
                            }}
                          />
                        </Badge>
                      </motion.div>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 5 }}>
                  <Grid container spacing={5}>
                    {/* BENEFICIOS PRINCIPALES */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h5" sx={{ 
                        color: '#FFCC00', 
                        mb: 4, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        fontWeight: 700
                      }}>
                        <FeatureIcon sx={{ fontSize: 32 }} />
                        Configuración de Beneficios Executive
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.08), rgba(78, 205, 196, 0.03))',
                          border: '2px solid rgba(78, 205, 196, 0.2)',
                          borderRadius: 4,
                          p: 4,
                          height: '100%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            border: '2px solid rgba(78, 205, 196, 0.4)',
                            boxShadow: '0 12px 30px rgba(78, 205, 196, 0.2)'
                          }
                        }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.gym_access}
                                onChange={(e) => handleInputChange('gym_access', e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { 
                                        color: '#4ECDC4',
                                        '& + .MuiSwitch-track': { 
                                          backgroundColor: '#4ECDC4',
                                          boxShadow: '0 0 15px rgba(78, 205, 196, 0.4)'
                                        }
                                      },
                                      '& .MuiSwitch-track': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
                                      🏋️ Acceso Total al Gimnasio
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                                      Equipos de última generación y área completa de entrenamiento
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Card>
                          </motion.div>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 4 }}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Card sx={{
                              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03))',
                              border: '2px solid rgba(255, 107, 53, 0.2)',
                              borderRadius: 4,
                              p: 4,
                              height: '100%',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                border: '2px solid rgba(255, 107, 53, 0.4)',
                                boxShadow: '0 12px 30px rgba(255, 107, 53, 0.2)'
                              }
                            }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.classes_included}
                                    onChange={(e) => handleInputChange('classes_included', e.target.checked)}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': { 
                                        color: '#FF6B35',
                                        '& + .MuiSwitch-track': { 
                                          backgroundColor: '#FF6B35',
                                          boxShadow: '0 0 15px rgba(255, 107, 53, 0.4)'
                                        }
                                      },
                                      '& .MuiSwitch-track': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
                                      🧘 Clases Grupales Premium
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                                      Yoga, pilates, spinning, zumba y entrenamientos especializados
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Card>
                          </motion.div>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 4 }}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Card sx={{
                              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 204, 0, 0.03))',
                              border: '2px solid rgba(255, 204, 0, 0.2)',
                              borderRadius: 4,
                              p: 4,
                              height: '100%',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                border: '2px solid rgba(255, 204, 0, 0.4)',
                                boxShadow: '0 12px 30px rgba(255, 204, 0, 0.2)'
                              }
                            }}>
                              <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>
                                👥 Pases de Invitado VIP
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3, fontWeight: 500 }}>
                                Invitaciones mensuales para acompañantes
                              </Typography>
                              <TextField
                                fullWidth
                                type="number"
                                value={formData.guest_passes}
                                onChange={(e) => handleInputChange('guest_passes', parseInt(e.target.value) || 0)}
                                sx={{
                                  ...enterpriseFieldStyle,
                                  '& .MuiOutlinedInput-root': {
                                    ...enterpriseFieldStyle['& .MuiOutlinedInput-root'],
                                    backgroundColor: 'rgba(255, 204, 0, 0.05)',
                                    border: '2px solid rgba(255, 204, 0, 0.2)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 204, 0, 0.08)',
                                      border: '2px solid rgba(255, 204, 0, 0.4)',
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: 'rgba(255, 204, 0, 0.1)',
                                      border: '2px solid #FFCC00',
                                      boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)',
                                    }
                                  }
                                }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <GroupIcon sx={{ color: '#FFCC00' }} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Card>
                          </motion.div>
                        </Grid>
                        
                        {/* CARACTERÍSTICAS PERSONALIZADAS */}
                        <Grid size={{ xs: 12 }}>
                          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
                          <Typography variant="h6" sx={{ 
                            color: '#FFFFFF', 
                            mb: 3, 
                            fontWeight: 700,
                            textAlign: 'center'
                          }}>
                            ✨ Características Exclusivas Personalizadas
                          </Typography>
                          
                          {/* AGREGAR NUEVA CARACTERÍSTICA */}
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            mb: 4,
                            p: 3,
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                            borderRadius: 4,
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <TextField
                              fullWidth
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              placeholder="Escriba una característica exclusiva personalizada..."
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
                                minWidth: 140,
                                fontWeight: 700,
                                borderRadius: 3,
                                boxShadow: '0 8px 25px rgba(255, 204, 0, 0.3)',
                                '&:hover': { 
                                  background: 'linear-gradient(135deg, #FF6B35, #FFCC00)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 12px 35px rgba(255, 204, 0, 0.4)',
                                },
                                '&:disabled': {
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  color: 'rgba(255, 255, 255, 0.3)'
                                }
                              }}
                            >
                              Agregar
                            </Button>
                          </Box>
                          
                          {/* CARACTERÍSTICAS POPULARES */}
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            mb: 3,
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            💡 Características Populares (clic para agregar):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, justifyContent: 'center' }}>
                            {PREDEFINED_FEATURES.filter(f => !formData.features.includes(f)).slice(0, 8).map((feature) => (
                              <motion.div
                                key={feature}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Chip
                                  label={feature}
                                  onClick={() => addPredefinedFeature(feature)}
                                  sx={{
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    backdropFilter: 'blur(10px)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.08))',
                                      color: '#FFCC00',
                                      border: '1px solid rgba(255, 204, 0, 0.4)',
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 15px rgba(255, 204, 0, 0.2)'
                                    }
                                  }}
                                />
                              </motion.div>
                            ))}
                          </Box>
                          
                          {/* CARACTERÍSTICAS SELECCIONADAS */}
                          {formData.features.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <Card sx={{
                                background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.08), rgba(78, 205, 196, 0.03))',
                                border: '2px solid rgba(78, 205, 196, 0.2)',
                                borderRadius: 4,
                                p: 4
                              }}>
                                <Typography variant="h6" sx={{ 
                                  color: '#4ECDC4', 
                                  mb: 3, 
                                  fontWeight: 700,
                                  textAlign: 'center'
                                }}>
                                  🎯 Características Incluidas en el Plan:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                  {formData.features.map((feature, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: index * 0.1 }}
                                    >
                                      <Chip
                                        label={feature}
                                        onDelete={() => removeFeature(feature)}
                                        deleteIcon={<DeleteIcon />}
                                        sx={{
                                          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.1))',
                                          color: '#4ECDC4',
                                          border: '1px solid rgba(78, 205, 196, 0.4)',
                                          fontWeight: 600,
                                          fontSize: '0.9rem',
                                          backdropFilter: 'blur(10px)',
                                          boxShadow: '0 4px 15px rgba(78, 205, 196, 0.2)',
                                          '& .MuiChip-deleteIcon': { 
                                            color: '#4ECDC4',
                                            '&:hover': { 
                                              color: '#FF6B35',
                                              transform: 'scale(1.2)'
                                            }
                                          }
                                        }}
                                      />
                                    </motion.div>
                                  ))}
                                </Box>
                              </Card>
                            </motion.div>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
    
                  {/* 4. RESTRICCIONES DE HORARIO */}
                  <Accordion 
                    expanded={expandedAccordion === 'schedule'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'schedule' ? false : 'schedule')}
                    sx={{
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' },
                      '& .MuiAccordionSummary-root': {
                        background: expandedAccordion === 'schedule' 
                          ? 'linear-gradient(135deg, rgba(69, 183, 209, 0.08), rgba(69, 183, 209, 0.03))'
                          : 'transparent',
                        borderBottom: '1px solid rgba(69, 183, 209, 0.1)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        minHeight: 80,
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.06), rgba(69, 183, 209, 0.02))',
                        }
                      }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: '#45B7D1', fontSize: 28 }} />}
                      sx={{ px: 4 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                        <Avatar sx={{ 
                          background: 'linear-gradient(135deg, #45B7D1, #4ECDC4)', 
                          width: 56,
                          height: 56,
                          boxShadow: '0 8px 25px rgba(69, 183, 209, 0.3)'
                        }}>
                          <AccessTimeIcon sx={{ fontSize: 28, color: '#000' }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ 
                            color: '#45B7D1', 
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            mb: 0.5
                          }}>
                            Configuración de Acceso Temporal
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500
                          }}>
                            Establezca días y horarios específicos para el acceso al plan
                          </Typography>
                        </Box>
                        <Chip 
                          label={formData.has_time_restrictions ? 'CON RESTRICCIONES' : 'ACCESO COMPLETO'}
                          sx={{
                            background: formData.has_time_restrictions 
                              ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1))'
                              : 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                            color: formData.has_time_restrictions ? '#ff9800' : '#4caf50',
                            border: formData.has_time_restrictions 
                              ? '1px solid rgba(255, 152, 0, 0.4)'
                              : '1px solid rgba(76, 175, 80, 0.4)',
                            fontWeight: 700,
                            boxShadow: formData.has_time_restrictions 
                              ? '0 4px 15px rgba(255, 152, 0, 0.2)'
                              : '0 4px 15px rgba(76, 175, 80, 0.2)'
                          }}
                          size="medium"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 5 }}>
                      <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }}>
                          <motion.div whileHover={{ scale: 1.01 }}>
                            <Card sx={{
                              background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.08), rgba(69, 183, 209, 0.03))',
                              border: '2px solid rgba(69, 183, 209, 0.2)',
                              borderRadius: 4,
                              p: 4,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                border: '2px solid rgba(69, 183, 209, 0.4)',
                                boxShadow: '0 12px 30px rgba(69, 183, 209, 0.2)'
                              }
                            }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.has_time_restrictions}
                                    onChange={(e) => handleInputChange('has_time_restrictions', e.target.checked)}
                                    sx={{
                                      transform: 'scale(1.2)',
                                      '& .MuiSwitch-switchBase.Mui-checked': { 
                                        color: '#45B7D1',
                                        '& + .MuiSwitch-track': { 
                                          backgroundColor: '#45B7D1',
                                          boxShadow: '0 0 15px rgba(69, 183, 209, 0.4)'
                                        }
                                      },
                                      '& .MuiSwitch-track': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ ml: 2 }}>
                                    <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.2rem', mb: 0.5 }}>
                                      🕐 Aplicar Restricciones de Horario
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                                      Active esta opción para limitar el acceso a días y horarios específicos
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Card>
                          </motion.div>
                        </Grid>
                        
                        {formData.has_time_restrictions && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.6, ease: "easeInOut" }}
                              style={{ width: '100%' }}
                            >
                              <Grid container spacing={5}>
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="h6" sx={{ 
                                    color: '#FFCC00', 
                                    mb: 3, 
                                    fontWeight: 700,
                                    textAlign: 'center'
                                  }}>
                                    📅 Días de Acceso Permitidos
                                  </Typography>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 2, 
                                    justifyContent: 'center',
                                    p: 3,
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                                    borderRadius: 4,
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                  }}>
                                    {DAY_NAMES.map((day) => (
                                      <motion.div
                                        key={day.value}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <FormControlLabel
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
                                                color: '#45B7D1',
                                                '&.Mui-checked': { color: '#45B7D1' }
                                              }}
                                            />
                                          }
                                          label={
                                            <Box sx={{ textAlign: 'center', px: 1 }}>
                                              <Typography variant="body1" sx={{ 
                                                color: '#FFFFFF', 
                                                fontWeight: 600,
                                                mb: 0.5
                                              }}>
                                                {day.label}
                                              </Typography>
                                              <Typography variant="h6" sx={{ 
                                                color: formData.allowed_days.includes(day.value) ? '#45B7D1' : 'rgba(255, 255, 255, 0.4)',
                                                fontWeight: 700,
                                                fontSize: '1.2rem'
                                              }}>
                                                {day.short}
                                              </Typography>
                                            </Box>
                                          }
                                          sx={{
                                            background: formData.allowed_days.includes(day.value) 
                                              ? 'linear-gradient(135deg, rgba(69, 183, 209, 0.15), rgba(69, 183, 209, 0.08))'
                                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                                            border: '2px solid',
                                            borderColor: formData.allowed_days.includes(day.value)
                                              ? 'rgba(69, 183, 209, 0.4)'
                                              : 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: 3,
                                            p: 2,
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(10px)',
                                            minWidth: 100,
                                            '&:hover': {
                                              borderColor: formData.allowed_days.includes(day.value)
                                                ? 'rgba(69, 183, 209, 0.6)'
                                                : 'rgba(255, 255, 255, 0.3)',
                                              transform: 'translateY(-2px)',
                                              boxShadow: formData.allowed_days.includes(day.value)
                                                ? '0 8px 25px rgba(69, 183, 209, 0.2)'
                                                : '0 8px 25px rgba(255, 255, 255, 0.1)'
                                            }
                                          }}
                                        />
                                      </motion.div>
                                    ))}
                                  </Box>
                                </Grid>
                                
                                <Grid size={{ xs: 12 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                    <Typography variant="h6" sx={{ 
                                      color: '#FFCC00', 
                                      fontWeight: 700
                                    }}>
                                      ⏰ Franjas Horarias de Acceso
                                    </Typography>
                                    <Button
                                      onClick={addTimeSlot}
                                      variant="outlined"
                                      startIcon={<AddIcon />}
                                      sx={{
                                        borderColor: 'rgba(69, 183, 209, 0.5)',
                                        color: '#45B7D1',
                                        fontWeight: 600,
                                        borderRadius: 3,
                                        px: 3,
                                        '&:hover': {
                                          borderColor: '#45B7D1',
                                          backgroundColor: 'rgba(69, 183, 209, 0.1)',
                                          transform: 'translateY(-1px)',
                                          boxShadow: '0 4px 15px rgba(69, 183, 209, 0.2)'
                                        }
                                      }}
                                    >
                                      Agregar Horario
                                    </Button>
                                  </Box>
                                  
                                  <Stack spacing={3}>
                                    {formData.time_slots.map((slot, index) => (
                                      <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                      >
                                        <Card sx={{
                                          background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.08), rgba(69, 183, 209, 0.03))',
                                          border: '2px solid rgba(69, 183, 209, 0.2)',
                                          borderRadius: 4,
                                          p: 4,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            border: '2px solid rgba(69, 183, 209, 0.4)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 12px 30px rgba(69, 183, 209, 0.2)'
                                          }
                                        }}>
                                          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                              <Typography variant="body1" sx={{ 
                                                color: '#45B7D1', 
                                                fontWeight: 700,
                                                minWidth: 80
                                              }}>
                                                Horario {index + 1}:
                                              </Typography>
                                              <TextField
                                                label="Hora de Inicio"
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{
                                                  ...enterpriseFieldStyle,
                                                  flex: 1,
                                                  '& .MuiOutlinedInput-root': {
                                                    ...enterpriseFieldStyle['& .MuiOutlinedInput-root'],
                                                    backgroundColor: 'rgba(69, 183, 209, 0.05)',
                                                    border: '2px solid rgba(69, 183, 209, 0.2)',
                                                  }
                                                }}
                                              />
                                              <Typography variant="h6" sx={{ 
                                                color: '#FFFFFF', 
                                                fontWeight: 700,
                                                px: 2
                                              }}>
                                                →
                                              </Typography>
                                              <TextField
                                                label="Hora de Fin"
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{
                                                  ...enterpriseFieldStyle,
                                                  flex: 1,
                                                  '& .MuiOutlinedInput-root': {
                                                    ...enterpriseFieldStyle['& .MuiOutlinedInput-root'],
                                                    backgroundColor: 'rgba(69, 183, 209, 0.05)',
                                                    border: '2px solid rgba(69, 183, 209, 0.2)',
                                                  }
                                                }}
                                              />
                                            </Box>
                                            {formData.time_slots.length > 1 && (
                                              <Tooltip title="Eliminar horario" arrow>
                                                <IconButton
                                                  onClick={() => removeTimeSlot(index)}
                                                  sx={{ 
                                                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.1))',
                                                    color: '#f44336',
                                                    border: '2px solid rgba(244, 67, 54, 0.3)',
                                                    '&:hover': {
                                                      background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(244, 67, 54, 0.15))',
                                                      transform: 'scale(1.1)',
                                                      boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
                                                    }
                                                  }}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                        </Card>
                                      </motion.div>
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
    
                  {/* 5. VISTA PREVIA Y PUBLICACIÓN */}
                  <Accordion 
                    expanded={expandedAccordion === 'preview'} 
                    onChange={() => setExpandedAccordion(expandedAccordion === 'preview' ? false : 'preview')}
                    sx={{
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' },
                      '& .MuiAccordionSummary-root': {
                        background: expandedAccordion === 'preview' 
                          ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 204, 0, 0.03))'
                          : 'transparent',
                        minHeight: 80,
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.06), rgba(255, 204, 0, 0.02))',
                        }
                      }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: '#FFCC00', fontSize: 28 }} />}
                      sx={{ px: 4 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                        <Avatar sx={{ 
                          background: 'linear-gradient(135deg, #FFCC00, #FF6B35)', 
                          width: 56,
                          height: 56,
                          boxShadow: '0 8px 25px rgba(255, 204, 0, 0.3)'
                        }}>
                          <PreviewIcon sx={{ fontSize: 28, color: '#000' }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ 
                            color: '#FFCC00', 
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            mb: 0.5
                          }}>
                            Vista Previa y Publicación
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500
                          }}>
                            Revise la configuración completa antes de publicar el plan elite
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip 
                            icon={<InfoIcon />} 
                            label="Revisión Ejecutiva"
                            size="medium"
                            sx={{ 
                              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.1))',
                              color: '#2196f3',
                              border: '1px solid rgba(33, 150, 243, 0.4)',
                              fontWeight: 600,
                              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.2)'
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 5 }}>
                      <Grid container spacing={5}>
                        <Grid size={{ xs: 12, lg: 8 }}>
                          {/* VISTA PREVIA ENTERPRISE */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Card sx={{
                              background: `
                                linear-gradient(135deg, 
                                  rgba(255, 204, 0, 0.12) 0%, 
                                  rgba(255, 107, 53, 0.08) 25%,
                                  rgba(78, 205, 196, 0.06) 50%,
                                  rgba(69, 183, 209, 0.04) 75%,
                                  rgba(255, 204, 0, 0.08) 100%
                                )
                              `,
                              border: '3px solid rgba(255, 204, 0, 0.4)',
                              borderRadius: 6,
                              overflow: 'hidden',
                              position: 'relative',
                              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 204, 0, 0.2)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '8px',
                                background: 'linear-gradient(90deg, #FFCC00 0%, #FF6B35 25%, #4ECDC4 50%, #45B7D1 75%, #FFCC00 100%)',
                              }
                            }}>
                              <CardContent sx={{ p: 5, pt: 6 }}>
                                {/* HEADER DEL PLAN */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                  <Box>
                                    <Typography variant="h3" sx={{ 
                                      background: 'linear-gradient(135deg, #FFCC00 0%, #FF6B35 50%, #FFCC00 100%)',
                                      backgroundClip: 'text',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      fontWeight: 900,
                                      mb: 1,
                                      textShadow: '0 0 30px rgba(255, 204, 0, 0.3)',
                                      letterSpacing: '-0.02em'
                                    }}>
                                      {formData.name || 'Nombre del Plan Elite'}
                                    </Typography>
                                    <Typography variant="h6" sx={{ 
                                      color: '#FFFFFF', 
                                      mb: 3,
                                      lineHeight: 1.6,
                                      opacity: 0.95,
                                      fontWeight: 500
                                    }}>
                                      {formData.description || 'Descripción del plan ejecutivo...'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                    <Chip 
                                      label={planCategory}
                                      sx={{ 
                                        background: 'linear-gradient(135deg, #FFCC00, #FF6B35)',
                                        color: '#000',
                                        fontWeight: 700,
                                        border: '2px solid rgba(255, 204, 0, 0.5)',
                                        boxShadow: '0 4px 15px rgba(255, 204, 0, 0.3)'
                                      }}
                                    />
                                    <Chip 
                                      label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
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
                                </Box>
                                
                                <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.4)', my: 4, borderWidth: 2 }} />
                                
                                {/* ESTRUCTURA DE PRECIOS */}
                                <Box sx={{ mb: 4 }}>
                                  <Typography variant="h5" sx={{ 
                                    color: '#FFCC00', 
                                    mb: 3, 
                                    fontWeight: 700,
                                    textAlign: 'center'
                                  }}>
                                    💰 Estructura de Inversión Premium
                                  </Typography>
                                  <Grid container spacing={3}>
                                    {[
                                      { label: 'Inscripción', value: formData.inscription_price, color: '#FF6B35', icon: '🎯' },
                                      { label: 'Sesión', value: formData.visit_price, color: '#4ECDC4', icon: '⚡' },
                                      { label: 'Semanal', value: formData.weekly_price, color: '#45B7D1', icon: '📅' },
                                      { label: 'Mensual', value: formData.monthly_price, color: '#FFCC00', icon: '⭐' },
                                      { label: 'Trimestral', value: formData.quarterly_price, color: '#FF6B35', icon: '🔥' },
                                      { label: 'Anual', value: formData.annual_price, color: '#9C27B0', icon: '💎' }
                                    ].filter(price => price.value > 0).map((price) => (
                                      <Grid key={price.label} size={{ xs: 6, sm: 4, md: 2 }}>
                                        <motion.div whileHover={{ scale: 1.05, y: -5 }}>
                                          <Card sx={{
                                            background: `linear-gradient(135deg, ${price.color}20, ${price.color}10)`,
                                            border: `2px solid ${price.color}50`,
                                            borderRadius: 3,
                                            p: 2,
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: `0 8px 25px ${price.color}20`,
                                            '&:hover': {
                                              border: `2px solid ${price.color}`,
                                              boxShadow: `0 12px 35px ${price.color}30`
                                            }
                                          }}>
                                            <Typography variant="h5" sx={{ mb: 0.5 }}>
                                              {price.icon}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                              color: price.color, 
                                              fontWeight: 700,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.5px'
                                            }}>
                                              {price.label}
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: '#FFFFFF', 
                                              fontWeight: 700,
                                              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                                            }}>
                                              ${price.value.toLocaleString('es-MX')}
                                            </Typography>
                                          </Card>
                                        </motion.div>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                                
                                {/* CARACTERÍSTICAS PREMIUM */}
                                {formData.features.length > 0 && (
                                  <Box sx={{ mb: 4 }}>
                                    <Typography variant="h5" sx={{ 
                                      color: '#4ECDC4', 
                                      mb: 3, 
                                      fontWeight: 700,
                                      textAlign: 'center'
                                    }}>
                                      ✨ Características Executive Incluidas
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                      {formData.features.map((feature, index) => (
                                        <motion.div
                                          key={index}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: index * 0.1 }}
                                        >
                                          <Chip
                                            label={feature}
                                            icon={<CheckCircleIcon />}
                                            sx={{
                                              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(78, 205, 196, 0.1))',
                                              color: '#4ECDC4',
                                              border: '1px solid rgba(78, 205, 196, 0.4)',
                                              fontWeight: 600,
                                              backdropFilter: 'blur(10px)',
                                              boxShadow: '0 4px 15px rgba(78, 205, 196, 0.2)',
                                              '& .MuiChip-icon': { color: '#4ECDC4' }
                                            }}
                                          />
                                        </motion.div>
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                
                                {/* BENEFICIOS PRINCIPALES */}
                                <Box sx={{ mb: 4 }}>
                                  <Typography variant="h5" sx={{ 
                                    color: '#FF6B35', 
                                    mb: 3, 
                                    fontWeight: 700,
                                    textAlign: 'center'
                                  }}>
                                    🎯 Beneficios Premium Garantizados
                                  </Typography>
                                  <Grid container spacing={3}>
                                    {[
                                      { 
                                        label: 'Acceso Total al Gimnasio', 
                                        value: formData.gym_access,
                                        icon: <FitnessCenterIcon />,
                                        color: '#4ECDC4'
                                      },
                                      { 
                                        label: 'Clases Grupales Elite', 
                                        value: formData.classes_included,
                                        icon: <GroupIcon />,
                                        color: '#FF6B35'
                                      },
                                      { 
                                        label: `${formData.guest_passes} Pases VIP de Invitado`, 
                                        value: formData.guest_passes > 0,
                                        icon: <GroupIcon />,
                                        color: '#FFCC00'
                                      }
                                    ].filter(benefit => benefit.value).map((benefit, index) => (
                                      <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <motion.div whileHover={{ scale: 1.02, y: -3 }}>
                                          <Card sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 2,
                                            p: 3,
                                            background: `linear-gradient(135deg, ${benefit.color}15, ${benefit.color}08)`,
                                            border: `2px solid ${benefit.color}30`,
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: `0 8px 25px ${benefit.color}15`,
                                            '&:hover': {
                                              border: `2px solid ${benefit.color}60`,
                                              boxShadow: `0 12px 35px ${benefit.color}25`
                                            }
                                          }}>
                                            <Avatar sx={{ 
                                              background: `linear-gradient(135deg, ${benefit.color}, ${benefit.color}CC)`,
                                              width: 40,
                                              height: 40,
                                              color: '#000'
                                            }}>
                                              {benefit.icon}
                                            </Avatar>
                                            <Typography variant="body1" sx={{ 
                                              color: '#FFFFFF', 
                                              fontWeight: 600,
                                              textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                                            }}>
                                              {benefit.label}
                                            </Typography>
                                          </Card>
                                        </motion.div>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                                
                                {/* RESTRICCIONES DE HORARIO */}
                                {formData.has_time_restrictions && (
                                  <Box sx={{ mb: 4 }}>
                                    <Typography variant="h5" sx={{ 
                                      color: '#45B7D1', 
                                      mb: 3, 
                                      fontWeight: 700,
                                      textAlign: 'center'
                                    }}>
                                      🕐 Configuración de Acceso Temporal
                                    </Typography>
                                    <Grid container spacing={3}>
                                      <Grid size={{ xs: 12, md: 6 }}>
                                        <Card sx={{
                                          background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.12), rgba(69, 183, 209, 0.06))',
                                          border: '2px solid rgba(69, 183, 209, 0.3)',
                                          borderRadius: 3,
                                          p: 3
                                        }}>
                                          <Typography variant="body1" sx={{ 
                                            color: '#45B7D1', 
                                            mb: 2, 
                                            fontWeight: 700
                                          }}>
                                            📅 Días Permitidos:
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {DAY_NAMES.filter(day => formData.allowed_days.includes(day.value)).map((day) => (
                                              <Chip
                                                key={day.value}
                                                label={day.short}
                                                size="small"
                                                sx={{
                                                  background: 'linear-gradient(135deg, #45B7D1, #4ECDC4)',
                                                  color: '#000',
                                                  fontWeight: 700,
                                                  boxShadow: '0 2px 8px rgba(69, 183, 209, 0.3)'
                                                }}
                                              />
                                            ))}
                                          </Box>
                                        </Card>
                                      </Grid>
                                      
                                      <Grid size={{ xs: 12, md: 6 }}>
                                        <Card sx={{
                                          background: 'linear-gradient(135deg, rgba(69, 183, 209, 0.12), rgba(69, 183, 209, 0.06))',
                                          border: '2px solid rgba(69, 183, 209, 0.3)',
                                          borderRadius: 3,
                                          p: 3
                                        }}>
                                          <Typography variant="body1" sx={{ 
                                            color: '#45B7D1', 
                                            mb: 2, 
                                            fontWeight: 700
                                          }}>
                                            ⏰ Horarios de Acceso:
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {formData.time_slots.map((slot, index) => (
                                              <Chip
                                                key={index}
                                                label={`${slot.start} - ${slot.end}`}
                                                icon={<AccessTimeIcon />}
                                                size="small"
                                                sx={{
                                                  background: 'linear-gradient(135deg, #45B7D1, #4ECDC4)',
                                                  color: '#000',
                                                  fontWeight: 600,
                                                  boxShadow: '0 2px 8px rgba(69, 183, 209, 0.3)',
                                                  '& .MuiChip-icon': { color: '#000' }
                                                }}
                                              />
                                            ))}
                                          </Box>
                                        </Card>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                )}
                                
                                {/* VIGENCIA */}
                                <Box sx={{ 
                                  mt: 4, 
                                  p: 3, 
                                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.04))', 
                                  borderRadius: 3, 
                                  border: '2px solid rgba(33, 150, 243, 0.3)',
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h6" sx={{ 
                                    color: '#2196f3', 
                                    fontWeight: 700,
                                    textShadow: '0 0 10px rgba(33, 150, 243, 0.3)'
                                  }}>
                                    📅 Vigencia: {formData.validity_type === 'permanent' 
                                      ? '♾️ Permanente (Sin fecha límite)' 
                                      : `📊 ${formData.validity_start_date} → ${formData.validity_end_date}`
                                    }
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                        
                        <Grid size={{ xs: 12, lg: 4 }}>
                          {/* PANEL DE CONTROL ENTERPRISE */}
                          <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                          >
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
                                🚀 Centro de Control Executive
                              </Typography>
                              
                              {/* VALIDACIONES ENTERPRISE */}
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
                              
                              {/* INFORMACIÓN DEL USUARIO */}
                              <Box sx={{ mb: 4 }}>
                                <Typography variant="body2" sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)', 
                                  mb: 2,
                                  textAlign: 'center',
                                  fontWeight: 600
                                }}>
                                  👤 Configurado por:
                                </Typography>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 2,
                                  p: 2,
                                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                                  borderRadius: 3,
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                  <Avatar sx={{ 
                                    background: 'linear-gradient(135deg, #2196f3, #21CBF3)',
                                    width: 32, 
                                    height: 32,
                                    fontSize: '1rem',
                                    fontWeight: 700
                                  }}>
                                    {currentUser?.email?.charAt(0).toUpperCase() || 'L'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ 
                                      color: '#FFFFFF', 
                                      fontWeight: 600
                                    }}>
                                      {currentUser?.email || 'luishdz04@admin.com'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      fontWeight: 500
                                    }}>
                                      7 de junio de 2025 • 16:23 UTC
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                              
                              {/* BOTONES DE ACCIÓN ENTERPRISE */}
                              <Stack spacing={3}>
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={handleSave}
                                    disabled={loading || !formData.name.trim() || !formData.description.trim()}
                                    startIcon={loading ? <CircularProgress size={22} sx={{ color: '#000' }} /> : <PublishIcon />}
                                    sx={{
                                      background: 'linear-gradient(135deg, #FFCC00 0%, #FF6B35 50%, #FFCC00 100%)',
                                      color: '#000000',
                                      fontWeight: 800,
                                      py: 2,
                                      fontSize: '1.1rem',
                                      borderRadius: 3,
                                      textTransform: 'none',
                                      letterSpacing: '0.5px',
                                      boxShadow: '0 8px 30px rgba(255, 204, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                      border: '2px solid rgba(255, 204, 0, 0.3)',
                                      '&:hover': { 
                                        background: 'linear-gradient(135deg, #FF6B35 0%, #FFCC00 50%, #FF6B35 100%)',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 15px 40px rgba(255, 204, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                        border: '2px solid rgba(255, 204, 0, 0.6)',
                                      },
                                      '&:active': {
                                        transform: 'translateY(-1px)',
                                      },
                                      '&:disabled': {
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                                        color: 'rgba(255, 255, 255, 0.3)',
                                        border: '2px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: 'none'
                                      },
                                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                  >
                                    {loading ? 'Publicando Plan Elite...' : '🚀 Publicar Plan Executive'}
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
                                    ← Volver al Dashboard
                                  </Button>
                                </motion.div>
                              </Stack>
                              
                              {/* ESTADÍSTICAS RÁPIDAS */}
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
                                  <Grid size={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <Typography variant="h6" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                                        {formData.features.length}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Características
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <Typography variant="h6" sx={{ color: '#FF6B35', fontWeight: 700 }}>
                                        {[formData.inscription_price, formData.visit_price, formData.weekly_price, formData.monthly_price, formData.quarterly_price, formData.annual_price].filter(p => p > 0).length}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Modalidades
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <Typography variant="h6" sx={{ color: '#45B7D1', fontWeight: 700 }}>
                                        {formData.has_time_restrictions ? formData.allowed_days.length : 7}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Días Activos
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid size={6}>
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
                            </Card>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              </motion.div>
            </Box>
          </Container>
        </Box>
      );
    }