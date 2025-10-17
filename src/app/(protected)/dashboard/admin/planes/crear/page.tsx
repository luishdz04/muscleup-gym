'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { useHydrated } from '@/hooks/useHydrated';
import { getCurrentTimestamp } from '@/utils/dateUtils';

import { usePlanForm } from '@/hooks/usePlanForm';
import { useNotifications } from '@/hooks/useNotifications';
import { BasicInfoSection } from '@/components/PlanForm/BasicInfoSection';
import { PricingSection } from '@/components/PlanForm/PricingSection';
import { FeaturesSection } from '@/components/PlanForm/FeaturesSection';
import { AccessControlSection } from '@/components/PlanForm/AccessControlSection';
import { PreviewAndSaveSection } from '@/components/PlanForm/PreviewAndSaveSection';

export default function CrearPlanPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const mountedRef = useRef(true);
  const { alert } = useNotifications();
  
  // Hook principal del formulario
  const {
    formData,
    loading,
    errors,
    hasFormChanges,
    formProgress,
    handleInputChange,
    handleFieldBlur,
    updateDaySchedule,
    validateForm,
    savePlan,
    resetForm,
    isFormValid
  } = usePlanForm();

  // Estado local para acordeones
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('basic');

  // ✅ CLEANUP MEMOIZADO
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ CONFIRMACIÓN ANTES DE SALIR (MEMOIZADA)
  const confirmExit = useCallback(async () => {
    if (!hasFormChanges) {
      router.push('/dashboard/admin/planes');
      return;
    }

    const result = await alert.confirm(
      'Cambios sin guardar',
      'Tienes cambios sin guardar. ¿Qué deseas hacer?'
    );

    if (result.isConfirmed) {
      notify.success('Guardando plan antes de salir...');
      await handleSave(true);
    } else if (result.isDenied) {
      notify.success('Saliendo sin guardar cambios');
      router.push('/dashboard/admin/planes');
    }
  }, [hasFormChanges, alert, router]);

  // ✅ MANEJADOR DE GUARDADO MEMOIZADO Y SIMPLIFICADO
  const handleSave = useCallback(async (exitAfterSave = false) => {
    console.log('🚀 Iniciando guardado del plan...', getCurrentTimestamp());
    
    const isValid = await validateForm();
    if (!isValid) {
      console.log('❌ Validación fallida');
      return;
    }

    try {
      console.log('💾 Llamando a savePlan()...');
      const result = await savePlan();
      console.log('📊 Resultado de savePlan:', result);
      
      if (result.success) {
        console.log('✅ Plan guardado exitosamente');
        
        // ✅ USAR SISTEMA NOTIFY CENTRALIZADO
        notify.success(`Plan "${formData.name}" creado exitosamente!`);
        
        try {
          const actionResult = await alert.confirm(
            'Plan Creado Exitosamente',
            `El plan "${formData.name}" se ha guardado correctamente.\n\n` +
            `• ACEPTAR = Ir a lista de planes\n` +
            `• CANCELAR = Crear otro plan\n\n` +
            `¿Deseas ir a la lista de planes?`
          );

          console.log('🔍 ActionResult:', actionResult);

          if (actionResult.isConfirmed || exitAfterSave) {
            console.log('✅ Usuario eligió: Ir a lista de planes');
            notify.success('Redirigiendo a lista de planes...');
            router.push('/dashboard/admin/planes');
          } else {
            console.log('🆕 Usuario eligió: Crear otro plan');
            notify.success('Formulario listo para crear otro plan!');
            resetForm();
            setExpandedAccordion('basic');
          }
        } catch (modalError) {
          console.error('⚠️ Error en modal de confirmación:', modalError);
          notify.success(`Plan "${formData.name}" creado exitosamente!`);
          
          const shouldRedirect = window.confirm(
            `Plan "${formData.name}" creado exitosamente!\n\n¿Ir a la lista de planes? (OK = Sí, Cancelar = Crear otro)`
          );
          
          if (shouldRedirect || exitAfterSave) {
            router.push('/dashboard/admin/planes');
          } else {
            resetForm();
            setExpandedAccordion('basic');
          }
        }
        
      } else {
        console.error('❌ Error al guardar:', result.error);
        
        // ✅ USAR SISTEMA NOTIFY CENTRALIZADO
        notify.error(`Error: ${result.error || 'No se pudo guardar el plan'}`);
        
        try {
          await alert.error(
            'Error al Crear Plan',
            result.error || 'Ocurrió un problema inesperado. Por favor, intenta nuevamente.'
          );
        } catch (errorModalError) {
          console.error('⚠️ Error en modal de error:', errorModalError);
        }
      }
      
    } catch (unexpectedError) {
      console.error('💥 Error inesperado en handleSave:', unexpectedError);
      notify.error('Error inesperado. Revisa la consola para más detalles.');
      
      try {
        await alert.error(
          'Error Inesperado',
          'Ocurrió un problema inesperado. Por favor, intenta nuevamente.'
        );
      } catch (errorModalError) {
        console.error('⚠️ Error en modal de error inesperado:', errorModalError);
      }
    }
  }, [validateForm, savePlan, formData.name, alert, router, resetForm]);

  // ✅ TOGGLE ACORDEÓN MEMOIZADO
  const toggleAccordion = useCallback((section: string) => {
    setExpandedAccordion(expandedAccordion === section ? false : section);
  }, [expandedAccordion]);

  // ✅ SSR SAFETY - PANTALLA DE CARGA HASTA HIDRATACIÓN
  if (!hydrated) {
    return (
      <Box sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: colorTokens.neutral1200
      }}>
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
            Cargando formulario de planes...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3, md: 4 },
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              mb: { xs: 2, sm: 2.5, md: 3 },
              gap: { xs: 2, md: 0 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 2.5, md: 3 } }}>
                <Tooltip title="Volver a Planes">
                  <IconButton
                    onClick={confirmExit}
                    sx={{
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                      color: colorTokens.neutral0,
                      width: { xs: 40, sm: 44, md: 48 },
                      height: { xs: 40, sm: 44, md: 48 },
                      '&:hover': {
                        transform: 'translateX(-2px)',
                        boxShadow: `0 6px 20px ${colorTokens.brand}40`,
                      }
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                  </IconButton>
                </Tooltip>

                <Box>
                  <Typography variant="h3" sx={{
                    color: colorTokens.brand,
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                  }}>
                    Crear Plan
                  </Typography>
                  <Typography variant="h6" sx={{
                    color: colorTokens.neutral900,
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                    display: { xs: 'none', sm: 'block' }
                  }}>
                    Configure un nuevo plan de membresía
                  </Typography>
                </Box>
              </Box>

              {/* Progreso */}
              <Box sx={{
                textAlign: { xs: 'left', md: 'right' },
                minWidth: { xs: '100%', md: 180 },
                width: { xs: '100%', md: 'auto' }
              }}>
                <Typography variant="body2" sx={{
                  color: colorTokens.neutral900,
                  mb: 1,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Progreso de Configuración
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <LinearProgress
                    variant="determinate"
                    value={formProgress}
                    sx={{
                      width: { xs: '100%', sm: 100, md: 120 },
                      height: { xs: 6, sm: 7, md: 8 },
                      borderRadius: 4,
                      backgroundColor: `${colorTokens.brand}20`,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="h6" sx={{
                    color: colorTokens.brand,
                    fontWeight: 700,
                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
                  }}>
                    {Math.round(formProgress)}%
                  </Typography>
                </Box>
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

            {/* 5. VISTA PREVIA Y GUARDADO */}
            <PreviewAndSaveSection
              formData={formData}
              loading={loading}
              hasFormChanges={hasFormChanges}
              isFormValid={isFormValid}
              expanded={expandedAccordion === 'preview'}
              onToggle={() => toggleAccordion('preview')}
              onSave={handleSave}
              onExit={confirmExit}
            />
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}