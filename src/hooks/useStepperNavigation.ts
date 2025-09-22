// hooks/useStepperNavigation.ts
'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseStepperNavigationProps {
  userRole: string;
  validateStep: (step: number) => boolean;
}

interface UseStepperNavigationReturn {
  activeStep: number;
  steps: string[];
  isLastStep: boolean;
  isFirstStep: boolean;
  handleNext: () => void;
  handleBack: () => void;
  setActiveStep: (step: number) => void;
  getStepsForRole: () => string[];
  shouldShowStep: (stepIndex: number) => boolean;
  mapStepIndex: (currentStep: number) => number;
}

// Función para determinar si es cliente
const isClientUser = (userRole: string): boolean => {
  const normalizedRole = userRole.toLowerCase().trim();
  return normalizedRole === 'cliente' || 
         normalizedRole === 'client' || 
         normalizedRole === 'member';
};

export const useStepperNavigation = ({ 
  userRole, 
  validateStep 
}: UseStepperNavigationProps): UseStepperNavigationReturn => {

  const [activeStep, setActiveStep] = useState(0);

  // Función para obtener pasos según el rol
  const getStepsForRole = useCallback((): string[] => {
    const isCliente = isClientUser(userRole);
    
    if (isCliente) {
      return [
        'Información Personal', 
        'Dirección', 
        'Contacto de Emergencia', 
        'Membresía', 
        'Archivos'
      ];
    } else {
      return [
        'Información Personal', 
        'Archivos'
      ];
    }
  }, [userRole]);

  // Determinar si debe mostrar un paso específico
  const shouldShowStep = useCallback((stepIndex: number): boolean => {
    const isCliente = isClientUser(userRole);
    
    // Paso 0: Información Personal - siempre mostrar
    if (stepIndex === 0) return true;
    
    // Para clientes: mostrar todos los pasos
    if (isCliente) {
      return stepIndex >= 0 && stepIndex <= 4;
    }
    
    // Para no clientes: solo mostrar Personal (0) y Archivos (1)
    return stepIndex === 0 || stepIndex === 1;
  }, [userRole]);

  // Mapear paso actual a paso real del contenido
  const mapStepIndex = useCallback((currentStep: number): number => {
    const isCliente = isClientUser(userRole);
    
    if (isCliente) {
      return currentStep;
    }
    
    // Para no clientes: mapear paso 1 al paso 4 (archivos)
    return currentStep === 1 ? 4 : currentStep;
  }, [userRole]);

  // Obtener pasos memoizados
  const steps = useMemo(() => getStepsForRole(), [getStepsForRole]);

  // Estados computados
  const isLastStep = useMemo(() => activeStep === steps.length - 1, [activeStep, steps.length]);
  const isFirstStep = useMemo(() => activeStep === 0, [activeStep]);

  // Navegación hacia adelante
  const handleNext = useCallback(() => {
    const currentMappedStep = mapStepIndex(activeStep);
    
    if (validateStep(currentMappedStep)) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    }
  }, [activeStep, mapStepIndex, validateStep, steps.length]);

  // Navegación hacia atrás
  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  }, []);

  return {
    activeStep,
    steps,
    isLastStep,
    isFirstStep,
    handleNext,
    handleBack,
    setActiveStep,
    getStepsForRole,
    shouldShowStep,
    mapStepIndex
  };
};