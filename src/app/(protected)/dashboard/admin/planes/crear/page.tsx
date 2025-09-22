'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colorTokens } from '@/theme';
import { usePlanForm } from '@/hooks/usePlanForm';
import { useNotifications } from '@/hooks/useNotifications';
import { BasicInfoSection } from '@/components/PlanForm/BasicInfoSection';
import { PricingSection } from '@/components/PlanForm/PricingSection';
import { FeaturesSection } from '@/components/PlanForm/FeaturesSection';
import { AccessControlSection } from '@/components/PlanForm/AccessControlSection';
import { PreviewAndSaveSection } from '@/components/PlanForm/PreviewAndSaveSection';

export default function CrearPlanPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const { toast, alert } = useNotifications();
  
  // Hook principal del formulario
  const {
    formData,
    loading,
    errors,
    hasFormChanges,
    formProgress,
    handleInputChange,
    handleFieldBlur, // ✅ Nueva función para onBlur
    updateDaySchedule,
    validateForm,
    savePlan,
    resetForm,
    isFormValid // ✅ Ahora siempre boolean
  } = usePlanForm();

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
      `Tienes cambios sin guardar. ¿Qué deseas hacer?`
    );

    if (result.isConfirmed) {
      toast.success('Guardando plan antes de salir...');
      await handleSave(true);
    } else if (result.isDenied) {
      toast.success('Saliendo sin guardar cambios');
      router.push('/dashboard/admin/planes');
    }
  };

  // Manejador de guardado principal
// FUNCIÓN handleSave CORREGIDA en CrearPlanPage.tsx

// FUNCIÓN handleSave CORREGIDA en CrearPlanPage.tsx

// FUNCIÓN handleSave CORREGIDA en CrearPlanPage.tsx

const handleSave = async (exitAfterSave = false) => {
  console.log('🚀 Iniciando guardado del plan...'); // Debug
  
  const isValid = await validateForm();
  if (!isValid) {
    console.log('❌ Validación fallida'); // Debug
    return;
  }

  try {
    console.log('💾 Llamando a savePlan()...'); // Debug
    const result = await savePlan();
    console.log('📊 Resultado de savePlan:', result); // Debug
    
    if (result.success) {
      console.log('✅ Plan guardado exitosamente'); // Debug
      
      // MÉTODO MÁS SIMPLE Y CONFIABLE
      toast.success(`Plan "${formData.name}" creado exitosamente! 🎉`);
      
      try {
        // Modal con texto MÁS CLARO sobre qué hace cada botón
        const actionResult = await alert.confirm(
          '¡Plan Creado Exitosamente!',
          `El plan "${formData.name}" se ha guardado correctamente.\n\n` +
          `• ACEPTAR = Ir a lista de planes\n` +
          `• CANCELAR = Crear otro plan\n\n` +
          `¿Deseas ir a la lista de planes?`
        );

        console.log('🔍 ActionResult:', actionResult);

        if (actionResult.isConfirmed || exitAfterSave) {
          // ACEPTAR = Ir a lista de planes
          console.log('✅ Usuario eligió: Ir a lista de planes');
          toast.success('Redirigiendo a lista de planes...');
          router.push('/dashboard/admin/planes');
        } else {
          // CANCELAR o cerrar = Crear otro plan (resetear formulario)
          console.log('🆕 Usuario eligió: Crear otro plan');
          toast.success('¡Formulario listo para crear otro plan!');
          resetForm();
          setExpandedAccordion('basic');
        }
      } catch (modalError) {
        console.error('⚠️ Error en modal de confirmación:', modalError);
        // Si falla el modal, al menos mostrar toast y preguntar qué hacer
        toast.success(`Plan "${formData.name}" creado exitosamente!`);
        
        // Backup: preguntar con toast simple
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
      console.error('❌ Error al guardar:', result.error); // Debug
      
      // ERROR MÁS SIMPLE
      toast.error(`Error: ${result.error || 'No se pudo guardar el plan'}`);
      
      try {
        await alert.error(
          'Error al Crear Plan',
          result.error || 'Ocurrió un problema inesperado. Por favor, intenta nuevamente.'
        );
      } catch (errorModalError) {
        console.error('⚠️ Error en modal de error:', errorModalError);
        // Al menos mostrar el toast de error
      }
    }
    
  } catch (unexpectedError) {
    console.error('💥 Error inesperado en handleSave:', unexpectedError); // Debug
    toast.error('Error inesperado. Revisa la consola para más detalles.');
    
    try {
      await alert.error(
        'Error Inesperado',
        'Ocurrió un problema inesperado. Por favor, intenta nuevamente.'
      );
    } catch (errorModalError) {
      console.error('⚠️ Error en modal de error inesperado:', errorModalError);
    }
  }
};
  const toggleAccordion = (section: string) => {
    setExpandedAccordion(expandedAccordion === section ? false : section);
  };

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
                    🚀 Crear plan
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.neutral900,
                    fontWeight: 500
                  }}>
                    Configure un nuevo plan de membresía
                  </Typography>
                </Box>
              </Box>

              {/* Progreso */}
              <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                <Typography variant="body2" sx={{ color: colorTokens.neutral900, mb: 1 }}>
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
              onFieldBlur={handleFieldBlur} // ✅ Nueva prop
              expanded={expandedAccordion === 'basic'}
              onToggle={() => toggleAccordion('basic')}
            />

            {/* 2. ESTRUCTURA DE PRECIOS */}
            <PricingSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur} // ✅ Nueva prop
              expanded={expandedAccordion === 'pricing'}
              onToggle={() => toggleAccordion('pricing')}
            />

            {/* 3. CARACTERÍSTICAS */}
            <FeaturesSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur} // ✅ Nueva prop
              expanded={expandedAccordion === 'features'}
              onToggle={() => toggleAccordion('features')}
            />

            {/* 4. CONTROL DE ACCESO */}
            <AccessControlSection
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur} // ✅ Nueva prop
              updateDaySchedule={updateDaySchedule}
              expanded={expandedAccordion === 'access_control'}
              onToggle={() => toggleAccordion('access_control')}
            />

            {/* 5. VISTA PREVIA Y GUARDADO */}
            <PreviewAndSaveSection
              formData={formData}
              loading={loading}
              hasFormChanges={hasFormChanges}
              isFormValid={isFormValid} // ✅ Ya es boolean
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