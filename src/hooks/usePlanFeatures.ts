// hooks/usePlanFeatures.ts - ARCHIVO SEPARADO
'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

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

export const usePlanFeatures = (
  features: string[],
  onFeaturesChange: (features: string[]) => void
) => {
  const { toast } = useNotifications();
  const [newFeature, setNewFeature] = useState('');

  const addFeature = useCallback(() => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      onFeaturesChange([...features, newFeature.trim()]);
      toast.success(`Característica "${newFeature.trim()}" agregada`);
      setNewFeature('');
    } else if (features.includes(newFeature.trim())) {
      toast.error('Esta característica ya existe');
    }
  }, [newFeature, features, onFeaturesChange, toast]);

  const addPredefinedFeature = useCallback((feature: string) => {
    if (!features.includes(feature)) {
      onFeaturesChange([...features, feature]);
      toast.success(`"${feature}" agregada al plan`);
    } else {
      toast.error('Esta característica ya está incluida');
    }
  }, [features, onFeaturesChange, toast]);

  const removeFeature = useCallback((featureToRemove: string) => {
    onFeaturesChange(features.filter(f => f !== featureToRemove));
    toast.error('Característica eliminada');
  }, [features, onFeaturesChange, toast]);

  const availablePredefinedFeatures = PREDEFINED_FEATURES.filter(f => !features.includes(f));

  return {
    newFeature,
    setNewFeature,
    addFeature,
    addPredefinedFeature,
    removeFeature,
    availablePredefinedFeatures,
    PREDEFINED_FEATURES
  };
};