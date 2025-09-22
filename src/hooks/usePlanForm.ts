// hooks/usePlanForm.ts - CON MODO EDICIÓN
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserTracking } from '@/hooks/useUserTracking';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Types
export interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export interface DailySchedules {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface PlanFormData {
  id?: string;
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
  access_control_enabled: boolean;
  max_daily_entries: number;
  daily_schedules: DailySchedules;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
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
  access_control_enabled: false,
  max_daily_entries: 1,
  daily_schedules: {
    monday: { enabled: true, start_time: '06:00', end_time: '22:00' },
    tuesday: { enabled: true, start_time: '06:00', end_time: '22:00' },
    wednesday: { enabled: true, start_time: '06:00', end_time: '22:00' },
    thursday: { enabled: true, start_time: '06:00', end_time: '22:00' },
    friday: { enabled: true, start_time: '06:00', end_time: '22:00' },
    saturday: { enabled: true, start_time: '08:00', end_time: '20:00' },
    sunday: { enabled: true, start_time: '09:00', end_time: '18:00' }
  }
};

interface UsePlanFormOptions {
  isEditMode?: boolean;
  planId?: string;
}

export const usePlanForm = (options: UsePlanFormOptions = {}) => {
  const { isEditMode = false, planId } = options;
  const { toast, alert } = useNotifications();
  const { addAuditFields } = useUserTracking();
  
  // Estados principales
  const [formData, setFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);
  const [originalFormData, setOriginalFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(isEditMode);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [accessRestrictionId, setAccessRestrictionId] = useState<string | null>(null);

  // Estados derivados memoizados
  const hasFormChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  }, [formData, originalFormData]);

  const formProgress = useMemo(() => {
    let completedFields = 0;
    const totalFields = 8;

    if (formData.name.trim()) completedFields++;
    if (formData.description.trim()) completedFields++;
    if (formData.monthly_price > 0 || formData.visit_price > 0) completedFields++;
    if (formData.inscription_price >= 0) completedFields++;
    if (formData.features.length > 0) completedFields++;
    if (formData.gym_access || formData.classes_included) completedFields++;
    if (formData.validity_type) completedFields++;
    if (!formData.access_control_enabled || formData.max_daily_entries > 0) completedFields++;

    return (completedFields / totalFields) * 100;
  }, [formData]);

  // Cargar plan en modo edición
  useEffect(() => {
    if (!isEditMode || !planId) {
      setLoadingPlan(false);
      return;
    }

    const loadPlan = async () => {
      console.log('📝 Cargando plan para editar:', planId);
      
      try {
        setLoadingPlan(true);
        
        const supabase = createBrowserSupabaseClient();
        
        // Cargar plan
        const { data: plan, error: fetchError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('id', planId)
          .single();
        
        if (fetchError) {
          throw new Error(`Error al cargar el plan: ${fetchError.message}`);
        }
        
        if (!plan) {
          throw new Error('Plan no encontrado');
        }

        console.log('✅ Plan cargado:', plan);

        // Cargar restricciones de acceso
        const { data: accessRestrictions } = await supabase
          .from('plan_access_restrictions')
          .select('*')
          .eq('plan_id', planId)
          .single();

        console.log('🔐 Restricciones cargadas:', accessRestrictions);

        // Preparar datos del formulario
        const planData: PlanFormData = {
          id: plan.id,
          name: plan.name || '',
          description: plan.description || '',
          is_active: Boolean(plan.is_active),
          inscription_price: Number(plan.inscription_price) || 0,
          visit_price: Number(plan.visit_price) || 0,
          weekly_price: Number(plan.weekly_price) || 0,
          biweekly_price: Number(plan.biweekly_price) || 0,
          monthly_price: Number(plan.monthly_price) || 0,
          bimonthly_price: Number(plan.bimonthly_price) || 0,
          quarterly_price: Number(plan.quarterly_price) || 0,
          semester_price: Number(plan.semester_price) || 0,
          annual_price: Number(plan.annual_price) || 0,
          weekly_duration: Number(plan.weekly_duration) || 7,
          biweekly_duration: Number(plan.biweekly_duration) || 15,
          monthly_duration: Number(plan.monthly_duration) || 30,
          bimonthly_duration: Number(plan.bimonthly_duration) || 60,
          quarterly_duration: Number(plan.quarterly_duration) || 90,
          semester_duration: Number(plan.semester_duration) || 180,
          annual_duration: Number(plan.annual_duration) || 365,
          validity_type: plan.validity_type || 'permanent',
          validity_start_date: plan.validity_start_date || '',
          validity_end_date: plan.validity_end_date || '',
          features: Array.isArray(plan.features) ? plan.features : [],
          gym_access: Boolean(plan.gym_access),
          classes_included: Boolean(plan.classes_included),
          guest_passes: Number(plan.guest_passes) || 0,
          access_control_enabled: accessRestrictions ? accessRestrictions.access_control_enabled : false,
          max_daily_entries: accessRestrictions ? accessRestrictions.max_daily_entries : 1,
          daily_schedules: accessRestrictions && accessRestrictions.daily_schedules 
            ? accessRestrictions.daily_schedules 
            : INITIAL_FORM_DATA.daily_schedules,
          created_at: plan.created_at || null,
          updated_at: plan.updated_at || null,
          created_by: plan.created_by || null,
          updated_by: plan.updated_by || null
        };

        if (accessRestrictions?.id) {
          setAccessRestrictionId(accessRestrictions.id);
        }
        
        setFormData(planData);
        setOriginalFormData(JSON.parse(JSON.stringify(planData)));
        
      } catch (err: any) {
        console.error('❌ Error cargando plan:', err);
        toast.error(err.message || 'Error cargando el plan');
      } finally {
        setLoadingPlan(false);
      }
    };
    
    loadPlan();
  }, [isEditMode, planId, toast]);

  // Validación de un campo específico
  const validateField = useCallback((field: keyof PlanFormData): string | null => {
    switch (field) {
      case 'name':
        if (!formData.name.trim()) {
          return 'El nombre del plan es obligatorio';
        }
        if (formData.name.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        return null;

      case 'description':
        if (!formData.description.trim()) {
          return 'La descripción del plan es obligatoria';
        }
        if (formData.description.trim().length < 10) {
          return 'La descripción debe tener al menos 10 caracteres';
        }
        return null;

      case 'monthly_price':
      case 'visit_price':
        if (formData.monthly_price <= 0 && formData.visit_price <= 0) {
          return 'Debe establecer al menos un precio válido';
        }
        return null;

      case 'max_daily_entries':
        if (formData.access_control_enabled && formData.max_daily_entries <= 0) {
          return 'El límite diario debe ser mayor a 0';
        }
        return null;

      default:
        return null;
    }
  }, [formData]);

  // Manejador de input optimizado
  const handleInputChange = useCallback((field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores del campo cuando empieza a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Manejador para validar cuando sale del campo (onBlur)
  const handleFieldBlur = useCallback((field: keyof PlanFormData) => {
    setTouchedFields(prev => new Set([...prev, field]));
    
    const fieldError = validateField(field);
    
    if (fieldError) {
      setErrors(prev => ({
        ...prev,
        [field]: fieldError
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      // Toast de éxito solo cuando el campo pasa de inválido a válido
      if (field === 'name' && formData.name.trim().length >= 3) {
        toast.success('Nombre del plan configurado correctamente');
      }
      if (field === 'description' && formData.description.trim().length >= 10) {
        toast.success('Descripción del plan configurada');
      }
    }
  }, [formData, validateField, toast]);

  // Manejador para horarios de días específicos
  const updateDaySchedule = useCallback((day: keyof DailySchedules, field: keyof DaySchedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      daily_schedules: {
        ...prev.daily_schedules,
        [day]: {
          ...prev.daily_schedules[day],
          [field]: value
        }
      }
    }));
  }, []);

  // Validación completa del formulario
  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: {[key: string]: string} = {};

    // Validar todos los campos
    const fields: (keyof PlanFormData)[] = ['name', 'description', 'monthly_price', 'visit_price', 'max_daily_entries'];
    
    fields.forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validaciones adicionales complejas
    if (formData.validity_type === 'limited') {
      if (!formData.validity_start_date || !formData.validity_end_date) {
        newErrors.validity = 'Las fechas de vigencia son obligatorias para planes con tiempo limitado';
      }
      
      if (new Date(formData.validity_start_date) >= new Date(formData.validity_end_date)) {
        newErrors.validity = 'La fecha de inicio debe ser anterior a la fecha de fin';
      }
    }

    if (formData.access_control_enabled) {
      const hasEnabledDay = Object.values(formData.daily_schedules).some(schedule => schedule.enabled);
      if (!hasEnabledDay) {
        newErrors.access_control = 'Debe habilitar al menos un día de acceso';
      }
      
      Object.entries(formData.daily_schedules).forEach(([day, schedule]) => {
        if (schedule.enabled && schedule.start_time >= schedule.end_time) {
          newErrors[`schedule_${day}`] = `El horario de ${day} es inválido`;
        }
      });
    }

    setErrors(newErrors);
    setTouchedFields(new Set(fields));

    if (Object.keys(newErrors).length > 0) {
      await alert.error(
        'Verificaciones Pendientes',
        `
          <div style="text-align: left; color: #8B94AA;">
            <p>Por favor corrige los siguientes problemas:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
              ${Object.values(newErrors).map(error => `<li style="margin: 8px 0;">• ${error}</li>`).join('')}
            </ul>
          </div>
        `
      );
      return false;
    }

    return true;
  }, [formData, validateField, alert]);

  // Función para crear plan
  const createPlan = useCallback(async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log('🆕 Creando plan nuevo...');
    
    try {
      setLoading(true);
      
      const supabase = createBrowserSupabaseClient();
      
      const planDataWithAudit = await addAuditFields({
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
        guest_passes: formData.guest_passes || 0
      }, false);

      const { data: createdPlan, error: insertError } = await supabase
        .from('membership_plans')
        .insert(planDataWithAudit)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Error al guardar el plan');
      }

      if (formData.access_control_enabled && createdPlan) {
        const accessRestrictionData = await addAuditFields({
          plan_id: createdPlan.id,
          access_control_enabled: true,
          max_daily_entries: formData.max_daily_entries,
          daily_schedules: formData.daily_schedules
        }, false);

        const { error: accessError } = await supabase
          .from('plan_access_restrictions')
          .insert(accessRestrictionData);

        if (accessError) {
          console.error('Error al guardar restricciones de acceso:', accessError);
          toast.error('Plan creado pero hubo un problema con las restricciones de acceso');
        }
      }

      return { success: true, data: createdPlan };
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error inesperado al guardar el plan';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [formData, addAuditFields, toast]);

  // Función para actualizar plan
  const updatePlan = useCallback(async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log('🔄 Actualizando plan existente...');
    
    try {
      setLoading(true);
      
      const supabase = createBrowserSupabaseClient();
      
      const updateData = await addAuditFields({
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
        guest_passes: formData.guest_passes || 0
      }, true); // true = isUpdate

      const { data: updatedPlan, error: updateError } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message || 'Error al actualizar el plan');
      }

      // Manejar restricciones de acceso
      if (formData.access_control_enabled) {
        const accessRestrictionData = {
          plan_id: planId!,
          access_control_enabled: true,
          max_daily_entries: formData.max_daily_entries,
          daily_schedules: formData.daily_schedules,
          ...(await addAuditFields({}, true))
        };

        if (accessRestrictionId) {
          // Actualizar existente
          const { error: accessError } = await supabase
            .from('plan_access_restrictions')
            .update(accessRestrictionData)
            .eq('id', accessRestrictionId);

          if (accessError) {
            console.error('Error al actualizar restricciones:', accessError);
            toast.error('Plan actualizado pero hubo un problema con las restricciones');
          }
        } else {
          // Crear nueva
          const { data: newRestriction, error: accessError } = await supabase
            .from('plan_access_restrictions')
            .insert(accessRestrictionData)
            .select()
            .single();

          if (accessError) {
            console.error('Error al crear restricciones:', accessError);
            toast.error('Plan actualizado pero hubo un problema con las restricciones');
          } else if (newRestriction) {
            setAccessRestrictionId(newRestriction.id);
          }
        }
      } else if (!formData.access_control_enabled && accessRestrictionId) {
        // Eliminar restricciones si se deshabilitó
        const { error: deleteError } = await supabase
          .from('plan_access_restrictions')
          .delete()
          .eq('id', accessRestrictionId);

        if (!deleteError) {
          setAccessRestrictionId(null);
        }
      }

      // Actualizar datos originales
      const updatedPlanData = { ...formData, ...updateData };
      setOriginalFormData(JSON.parse(JSON.stringify(updatedPlanData)));

      return { success: true, data: updatedPlan };
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error inesperado al actualizar el plan';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [formData, planId, accessRestrictionId, addAuditFields, toast]);

  // Función unificada de guardado
  const savePlan = useCallback(async () => {
    if (isEditMode) {
      return await updatePlan();
    } else {
      return await createPlan();
    }
  }, [isEditMode, createPlan, updatePlan]);

  // Reset del formulario
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setOriginalFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouchedFields(new Set());
    if (isEditMode) {
      toast.success('Formulario restaurado a valores originales');
    } else {
      toast.success('Formulario limpio. ¡Listo para crear otro plan!');
    }
  }, [isEditMode, toast]);

  // Validación derivada
  const isFormValid = useMemo(() => {
    return (
      Object.keys(errors).length === 0 && 
      formData.name.trim() !== '' && 
      formData.description.trim() !== '' &&
      (formData.monthly_price > 0 || formData.visit_price > 0)
    );
  }, [errors, formData.name, formData.description, formData.monthly_price, formData.visit_price]);

  return {
    // Estados
    formData,
    loading,
    loadingPlan,
    errors,
    hasFormChanges,
    formProgress,
    touchedFields,
    
    // Acciones
    handleInputChange,
    handleFieldBlur,
    updateDaySchedule,
    validateForm,
    savePlan,
    resetForm,
    
    // Estados derivados
    isFormValid,
    
    // Estados específicos del modo edición
    isEditMode,
    accessRestrictionId
  };
};