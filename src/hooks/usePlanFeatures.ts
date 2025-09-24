// hooks/usePlanFeatures.ts - ENTERPRISE v4.1
'use client';

import { useState, useCallback, useMemo } from 'react';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { notify } from '@/utils/notifications';

// ✅ CARACTERÍSTICAS PREDEFINIDAS POPULARES
const PREDEFINED_FEATURES = [
  'Acceso 24/7',
  'Casilleros incluidos',
  'Toallas incluidas',
  'Estacionamiento gratuito',
  'WiFi gratuito',
  'Agua purificada',
  'Área de cardio completa',
  'Zona de pesas libres',
  'Máquinas de entrenamiento funcional',
  'Área de stretching',
  'Baños con regaderas',
  'Música ambiental',
  'Aire acondicionado',
  'Entrenador personal disponible',
  'Clases de yoga',
  'Clases de pilates',
  'Clases de spinning',
  'Clases de crossfit',
  'Clases de zumba',
  'Clases de aqua aeróbicos',
  'Área de descanso',
  'Smoothie bar',
  'Suplementos deportivos',
  'Masajes deportivos',
  'Evaluación física',
  'Plan nutricional',
  'Acceso a múltiples sucursales',
  'App móvil exclusiva',
  'Descuentos en tienda',
  'Invitados sin costo adicional'
] as const;

interface UsePlanFeaturesReturn {
  newFeature: string;
  setNewFeature: (value: string) => void;
  addFeature: () => void;
  addPredefinedFeature: (feature: string) => void;
  removeFeature: (feature: string) => void;
  availablePredefinedFeatures: string[];
}

export const usePlanFeatures = (
  currentFeatures: string[],
  onFeaturesChange: (features: string[]) => void
): UsePlanFeaturesReturn => {
  const [newFeature, setNewFeature] = useState('');

  // ✅ MEMO PARA CARACTERÍSTICAS PREDEFINIDAS DISPONIBLES
  const availablePredefinedFeatures = useMemo(() => {
    return PREDEFINED_FEATURES.filter(feature => 
      !currentFeatures.includes(feature)
    );
  }, [currentFeatures]);

  // ✅ CALLBACK OPTIMIZADO PARA AGREGAR CARACTERÍSTICA NUEVA
  const addFeature = useCallback(() => {
    const trimmedFeature = newFeature.trim();
    
    if (!trimmedFeature) {
      notify.error('La característica no puede estar vacía');
      return;
    }

    if (trimmedFeature.length < 3) {
      notify.error('La característica debe tener al menos 3 caracteres');
      return;
    }

    if (trimmedFeature.length > 50) {
      notify.error('La característica no puede tener más de 50 caracteres');
      return;
    }

    // Verificar si ya existe (case insensitive)
    const featureExists = currentFeatures.some(
      feature => feature.toLowerCase() === trimmedFeature.toLowerCase()
    );

    if (featureExists) {
      notify.error('Esta característica ya está agregada');
      return;
    }

    // Agregar la característica
    const updatedFeatures = [...currentFeatures, trimmedFeature];
    onFeaturesChange(updatedFeatures);
    setNewFeature('');
    notify.success(`Característica "${trimmedFeature}" agregada exitosamente`);
  }, [newFeature, currentFeatures, onFeaturesChange]);

  // ✅ CALLBACK OPTIMIZADO PARA AGREGAR CARACTERÍSTICA PREDEFINIDA
  const addPredefinedFeature = useCallback((feature: string) => {
    // Verificar si ya existe (no debería por el filtro, pero por seguridad)
    if (currentFeatures.includes(feature)) {
      notify.error('Esta característica ya está agregada');
      return;
    }

    const updatedFeatures = [...currentFeatures, feature];
    onFeaturesChange(updatedFeatures);
    notify.success(`Característica "${feature}" agregada exitosamente`);
  }, [currentFeatures, onFeaturesChange]);

  // ✅ CALLBACK OPTIMIZADO PARA REMOVER CARACTERÍSTICA
  const removeFeature = useCallback((featureToRemove: string) => {
    const updatedFeatures = currentFeatures.filter(feature => feature !== featureToRemove);
    onFeaturesChange(updatedFeatures);
    notify.success(`Característica "${featureToRemove}" eliminada`);
  }, [currentFeatures, onFeaturesChange]);

  // ✅ CALLBACK OPTIMIZADO PARA ACTUALIZAR NUEVA CARACTERÍSTICA
  const setNewFeatureValue = useCallback((value: string) => {
    // Limpiar caracteres especiales y limitar longitud
    const cleanValue = value.replace(/[<>]/g, '').substring(0, 50);
    setNewFeature(cleanValue);
  }, []);

  return {
    newFeature,
    setNewFeature: setNewFeatureValue,
    addFeature,
    addPredefinedFeature,
    removeFeature,
    availablePredefinedFeatures
  };
};