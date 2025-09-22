'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { colorTokens } from '@/theme';
import { usePlanForm } from '@/hooks/usePlanForm';
import { useNotifications } from '@/hooks/useNotifications';
import { BasicInfoSection } from '@/components/PlanForm/BasicInfoSection';
import { PricingSection } from '@/components/PlanForm/PricingSection';
import { FeaturesSection } from '@/components/PlanForm/FeaturesSection';
import { AccessControlSection } from '@/components/PlanForm/AccessControlSection';
import { PreviewAndSaveSection } from '@/components/PlanForm/PreviewAndSaveSection';

export default function EditarPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const mountedRef = useRef(true);
  const { toast, alert } = useNotifications();
  
  // Hook principal del formulario EN MODO EDICIÓN
  const {
    formData,
    loading,
    loadingPlan,
    errors,
    hasFormChanges,
    formProgress,
    handleInputChange,
    handleFieldBlur,
    updateDaySchedule,
    validateForm,
    savePlan,
    resetForm,
    isFormValid,
    isEditMode
  } = usePlanForm({ 
    isEditMode: true, 
    planId 
  });

  // Estado local para acordeones
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('basic');

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Confirmación antes de salir con cambios no guardados
  const confirmExit = async () => {
    if (!hasFormChanges) {
      router.push('/dashboard/admin/planes');
      return;
    }

    const result = await alert.confirm(
      'Cambios sin guardar',
      `Tienes cambios sin guardar en "${formData.name}". ¿Qué deseas hacer?`
    );

    if (result.isConfirmed) {
      toast.success('Guardando cambios antes de salir...');
      await handleSave(true);
    } else if (result.isDenied) {
      toast.success('Saliendo sin guardar cambios');
      router.push('/dashboard/admin/planes');
    }
  };

  // Manejador de actualización principal
  const handleSave = async (exitAfterSave = false) => {
    const isValid = await validateForm();
    if (!isValid) return;

    const result = await savePlan();
    
    if (result.success) {
      try {
        // Modal con texto claro sobre qué hace cada botón
        const actionResult = await alert.confirm(
          '¡Plan Actualizado Exitosamente!',
          `El plan "${formData.name}" se ha actualizado correctamente.\n\n` +
          `• ACEPTAR = Ir a lista de planes\n` +
          `• CANCELAR = Seguir editando\n\n` +
          `¿Deseas ir a la lista de planes?`
        );

        if (actionResult.isConfirmed || exitAfterSave) {
          // ACEPTAR = Ir a lista de planes
          toast.success('Redirigiendo a lista de planes...');
          router.push('/dashboard/admin/planes');
        } else {
          // CANCELAR = Seguir editando
          toast.success('¡Continúa editando el plan!');
        }
      } catch (modalError) {
        console.error('Error en modal de confirmación:', modalError);
        // Backup: preguntar con confirm nativo
        const shouldRedirect = window.confirm(
          `Plan "${formData.name}" actualizado exitosamente!\n\n¿Ir a la lista de planes? (OK = Sí, Cancelar = Seguir editando)`
        );
        
        if (shouldRedirect || exitAfterSave) {
          router.push('/dashboard/admin/planes');
        }
      }
      
    } else {
      try {
        await alert.error(
          'Error al Actualizar Plan',
          result.error || 'Ocurrió un problema inesperado. Por favor, intenta nuevamente.'
        );
      } catch (errorModalError) {
        toast.error(`Error: ${result.error || 'No se pudo actualizar el plan'}`);
      }
    }
  };

  const toggleAccordion = (section: string) => {
    setExpandedAccordion(expandedAccordion === section ? false : section);
  };

  // Loading state mientras carga el plan
  if (loadingPlan) {
    return (
      <Box sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colorTokens.neutral1200
      }}>
        <Container maxWidth="sm">
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
              color: colorTokens.neutral0,
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 3
            }}>
              <EditIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" sx={{ 
              color: colorTokens.brand, 
              fontWeight: 700,
              mb: 2
            }}>
              Cargando Plan
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: colorTokens.neutral900,
              mb: 4
            }}>
              Preparando editor del plan...
            </Typography>
            
            <CircularProgress 
              size={60} 
              sx={{ color: colorTokens.brand }} 
            />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Tooltip title="Volver a Planes">
                  <IconButton
                    onClick={confirmExit}
                    sx={{ 
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                      color: colorTokens.neutral0,
                      '&:hover': {
                        transform: 'translateX(-2px)',
                        boxShadow: `0 6px 20px ${colorTokens.brand}40`,
                      }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                
                <Box>
                  <Typography variant="h3" sx={{ 
                    color: colorTokens.brand, 
                    fontWeight: 700,
                    mb: 1
                  }}>
                    ✏️ Editar Plan
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.neutral900,
                    fontWeight: 500
                  }}>
                    Modificando: "{formData.name || 'Plan'}"
                  </Typography>
                </Box>
              </Box>

              {/* Progreso y Estado */}
              <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                <Typography variant="body2" sx={{ color: colorTokens.neutral900, mb: 1 }}>
                  Progreso de Edición
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={formProgress} 
                    sx={{ 
                      width: 120, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: `${colorTokens.brand}20`,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                        borderRadius: 4
                      }
                    }} 
                  />
                  <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                    {Math.round(formProgress)}%
                  </Typography>
                </Box>
                <Chip 
                  icon={hasFormChanges ? <WarningIcon /> : <CheckCircleIcon />}
                  label={hasFormChanges ? 'MODIFICADO' : 'SIN CAMBIOS'}
                  size="small"
                  sx={{
                    bgcolor: hasFormChanges ? `${colorTokens.warning}20` : `${colorTokens.success}20`,
                    color: hasFormChanges ? colorTokens.warning : colorTokens.success,
                    border: `1px solid ${hasFormChanges ? colorTokens.warning : colorTokens.success}40`,
                    fontWeight: 700
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* FORMULARIO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Paper sx={{
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}>
            {/* 1. INFORMACIÓN BÁSICA */}
            <BasicInfoSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
              expanded={expandedAccordion === 'basic'}
              onToggle={() => toggleAccordion('basic')}
            />

            {/* 2. ESTRUCTURA DE PRECIOS */}
            <PricingSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
              expanded={expandedAccordion === 'pricing'}
              onToggle={() => toggleAccordion('pricing')}
            />

            {/* 3. CARACTERÍSTICAS */}
            <FeaturesSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
              expanded={expandedAccordion === 'features'}
              onToggle={() => toggleAccordion('features')}
            />

            {/* 4. CONTROL DE ACCESO */}
            <AccessControlSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
              updateDaySchedule={updateDaySchedule}
              expanded={expandedAccordion === 'access_control'}
              onToggle={() => toggleAccordion('access_control')}
            />

            {/* 5. VISTA PREVIA Y ACTUALIZACIÓN */}
            <PreviewAndUpdateSection
              formData={formData}
              loading={loading}
              hasFormChanges={hasFormChanges}
              isFormValid={isFormValid}
              expanded={expandedAccordion === 'preview'}
              onToggle={() => toggleAccordion('preview')}
              onSave={handleSave}
              onExit={confirmExit}
              isEditMode={true}
            />
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}

// Componente específico para el modo edición
interface PreviewAndUpdateSectionProps {
  formData: any;
  loading: boolean;
  hasFormChanges: boolean;
  isFormValid: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: (exitAfterSave?: boolean) => void;
  onExit: () => void;
  isEditMode?: boolean;
}

const PreviewAndUpdateSection = React.memo<PreviewAndUpdateSectionProps>(({
  formData,
  loading,
  hasFormChanges,
  isFormValid,
  expanded,
  onToggle,
  onSave,
  onExit,
  isEditMode = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const validations = [
    { 
      label: 'Información básica', 
      check: !!formData.name.trim() && !!formData.description.trim() 
    },
    { 
      label: 'Precios configurados', 
      check: formData.monthly_price > 0 || formData.visit_price > 0 
    },
    { 
      label: 'Características definidas', 
      check: formData.features.length > 0 || formData.gym_access || formData.classes_included 
    },
    { 
      label: 'Control de acceso', 
      check: !formData.access_control_enabled || (
        formData.max_daily_entries > 0 && 
        Object.values(formData.daily_schedules).some((s: any) => s.enabled)
      ) 
    },
    { 
      label: 'Configuración válida', 
      check: isFormValid 
    }
  ];

  const activePrices = [
    ...(formData.inscription_price > 0 ? [{ label: 'Inscripción', price: formData.inscription_price }] : []),
    ...(formData.visit_price > 0 ? [{ label: 'Por Visita', price: formData.visit_price }] : []),
    ...(formData.monthly_price > 0 ? [{ label: 'Mensual', price: formData.monthly_price }] : []),
    ...(formData.weekly_price > 0 ? [{ label: 'Semanal', price: formData.weekly_price }] : []),
    ...(formData.biweekly_price > 0 ? [{ label: 'Quincenal', price: formData.biweekly_price }] : []),
    ...(formData.quarterly_price > 0 ? [{ label: 'Trimestral', price: formData.quarterly_price }] : []),
    ...(formData.annual_price > 0 ? [{ label: 'Anual', price: formData.annual_price }] : [])
  ];

  return (
    <PreviewAndSaveSection
      formData={formData}
      loading={loading}
      hasFormChanges={hasFormChanges}
      isFormValid={isFormValid}
      expanded={expanded}
      onToggle={onToggle}
      onSave={onSave}
      onExit={onExit}
      buttonText={isEditMode ? "💾 Actualizar Plan" : "🚀 Crear Plan"}
      successMessage={isEditMode ? "actualizado" : "creado"}
    />
  );
});

PreviewAndUpdateSection.displayName = 'PreviewAndUpdateSection';