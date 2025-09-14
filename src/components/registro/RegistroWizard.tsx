'use client';

import React from 'react';
import Image from 'next/image';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { PersonalDataStep } from '@/components/registro/steps/PersonalDataStep';
import { EmergencyContactStep } from '@/components/registro/steps/EmergencyContactStep';
import { MembershipInfoStep } from '@/components/registro/steps/MembershipInfoStep';
import { ContractSignatureStep } from '@/components/registro/steps/ContractSignatureStep';
import SuccessModal from '@/components/registro/SuccessModal';

const RegistroWizard = () => {
  const {
    // Estados principales
    step,
    formProgress,
    isSubmitting,
    showTutorField,
    completedSteps,
    showSuccessModal,
    userId,
    previewUrl,
    tutorINEUrl,
    profilePhotoFile,
    tutorINEFile,
    
    // 🆕 NUEVOS ESTADOS PARA VALIDACIÓN EN TIEMPO REAL
    fieldValidation,
    realtimeValidationEnabled,
    
    // Ref para firma
    sigCanvas,
    
    // Métodos de formulario
    register,
    handleSubmit,
    control,
    watch,
    errors,
    isDirty,
    trigger,
    setValue,
    reset,
    getValues,
    formValues,
    
    // 🆕 NUEVAS FUNCIONES PARA VALIDACIÓN EN TIEMPO REAL
    getFieldValidationState,
    enableRealtimeValidation,
    validateFieldInRealtime,
    
    // Funciones de navegación
    goNext,
    goBack,
    goToStep,
    
    // Funciones de archivos
    handleProfilePhotoCapture,
    handleTutorINECapture,
    clearPhoto,
    clearTutorINE,
    clearSignature,
    
    // Función de envío
    onSubmit,
    
    // Función de cierre modal
    handleCloseSuccessModal,
    
    // Utilidades
    getCurrentMexicoDate,
    validateAge
  } = useRegistrationForm();

  // 🆕 FUNCIÓN PARA OBTENER INDICADOR VISUAL DE VALIDACIÓN
  const getFieldIndicator = (fieldName: string) => {
    const state = getFieldValidationState(fieldName);
    
    if (!state.hasBeenTouched && !realtimeValidationEnabled) return null;
    
    if (state.isValidating) {
      return (
        <div className="inline-flex items-center ml-2">
          <div className="animate-spin h-3 w-3 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    if (state.hasError) {
      return (
        <div className="inline-flex items-center ml-2">
          <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    if (state.hasBeenTouched && !state.hasError) {
      return (
        <div className="inline-flex items-center ml-2">
          <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    return null;
  };

  // Renderizar el paso actual con validaciones mejoradas
  const renderCurrentStep = () => {
    const commonProps = {
      register,
      errors,
      control,
      watch,
      formValues,
      // 🆕 PROPS PARA VALIDACIÓN EN TIEMPO REAL
      getFieldValidationState,
      getFieldIndicator,
      validateFieldInRealtime,
      realtimeValidationEnabled,
      enableRealtimeValidation
    };

    switch (step) {
      case 1:
        return (
          <PersonalDataStep
            {...commonProps}
            getCurrentMexicoDate={getCurrentMexicoDate}
            validateAge={validateAge}
            handleProfilePhotoCapture={handleProfilePhotoCapture}
            previewUrl={previewUrl}
            clearPhoto={clearPhoto}
            onNext={goNext}
          />
        );
        
      case 2:
        return (
          <EmergencyContactStep
            {...commonProps}
            onNext={goNext}
            onBack={goBack}
          />
        );
        
      case 3:
        return (
          <MembershipInfoStep
            {...commonProps}
            onNext={goNext}
            onBack={goBack}
          />
        );
        
      case 4:
        return (
          <ContractSignatureStep
            {...commonProps}
            isSubmitting={isSubmitting}
            showTutorField={showTutorField}
            tutorINEUrl={tutorINEUrl}
            handleTutorINECapture={handleTutorINECapture}
            clearTutorINE={clearTutorINE}
            sigCanvas={sigCanvas}
            clearSignature={clearSignature}
            onBack={goBack}
            onSubmit={handleSubmit(onSubmit)}
          />
        );
        
      default:
        return null;
    }
  };

  // 🆕 CALCULAR ESTADO DE VALIDACIÓN GLOBAL
  const getValidationSummary = () => {
    const totalFields = Object.keys(fieldValidation).length;
    const validFields = Object.values(fieldValidation).filter(
      field => field.hasBeenTouched && !field.error
    ).length;
    const errorFields = Object.values(fieldValidation).filter(
      field => field.hasBeenTouched && field.error
    ).length;

    return { totalFields, validFields, errorFields };
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      {/* Header con logo */}
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/logo.png"
          alt="Muscle Up Gym"
          width={300}
          height={300}
          priority
          className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain"
        />
        <p className="mt-4 text-xl text-white">
          Tu salud y bienestar es nuestra misión.
        </p>
      </div>
      
      {/* 🆕 INDICADOR DE VALIDACIÓN EN TIEMPO REAL */}
      {realtimeValidationEnabled && (
        <div className="max-w-2xl mx-auto mb-4">
          <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Validación en tiempo real activa</span>
            </div>
            {validationSummary.totalFields > 0 && (
              <div className="text-xs text-gray-400">
                ✅ {validationSummary.validFields} válidos 
                {validationSummary.errorFields > 0 && ` • ❌ ${validationSummary.errorFields} con errores`}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Barra de progreso mejorada */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span>Progreso del registro</span>
          <span className="flex items-center space-x-2">
            <span>{formProgress}%</span>
            {realtimeValidationEnabled && validationSummary.errorFields === 0 && validationSummary.validFields > 0 && (
              <span className="text-green-400 text-xs">✓ Sin errores</span>
            )}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              validationSummary.errorFields > 0 ? 'bg-red-400' : 'bg-yellow-400'
            }`}
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Indicador de pasos navegable mejorado */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex mb-1">
          {[1, 2, 3, 4].map(stepNumber => (
            <div 
              key={stepNumber} 
              className={`flex-1 relative ${stepNumber !== 4 ? 'mr-1' : ''} ${
                completedSteps.includes(stepNumber - 1) || stepNumber <= step ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
              onClick={() => goToStep(stepNumber)}
            >
              <div className={`h-2 rounded-full transition-colors
                ${step >= stepNumber || completedSteps.includes(stepNumber) ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
              <div className={`absolute -top-1 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs
                transition-colors
                ${completedSteps.includes(stepNumber) ? 'bg-green-500 text-white' : 
                  step === stepNumber ? 'bg-white text-black' : 'bg-zinc-700 text-white'}`}>
                {completedSteps.includes(stepNumber) ? '✓' : stepNumber}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span 
            className={`${
              step === 1 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(1) || step >= 1 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(1)}
          >
            Datos personales
          </span>
          <span 
            className={`${
              step === 2 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(1) || step >= 2 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(2)}
          >
            Emergencia
          </span>
          <span 
            className={`${
              step === 3 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(2) || step >= 3 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(3)}
          >
            Membresía
          </span>
          <span 
            className={`${
              step === 4 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(3) || step >= 4 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(4)}
          >
            Reglamento
          </span>
        </div>
      </div>
      
      {/* Contenedor del formulario */}
      <form className="max-w-2xl mx-auto bg-zinc-900 p-6 rounded-lg">
        {renderCurrentStep()}
      </form>
      
      {/* Modal de éxito */}
      {showSuccessModal && (
        <SuccessModal onClose={handleCloseSuccessModal} />
      )}

      {/* Indicador de versión para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 204, 0, 0.2)',
            color: '#FFCC00',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: '600',
            zIndex: 10000,
            border: '1px solid rgba(255, 204, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            opacity: 0.8
          }}
        >
          🚀 Registro v4.1.8 - Zod Real-time - {getCurrentMexicoDate()} by @MuscleUpGYM
        </div>
      )}

      {/* Estilos CSS mejorados para validaciones */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Animación para campos con error */
        .field-error {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 70%, 90% {
            transform: translateX(-5px);
          }
          40%, 60% {
            transform: translateX(5px);
          }
        }

        /* Barra de progreso mejorada */
        .progress-bar-enhanced {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 204, 0, 0.3),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Transiciones suaves */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .smooth-transition {
          transition: all 0.3s ease;
        }

        /* Indicadores de validación */
        .validation-success {
          border-left: 3px solid #10b981;
          background-color: rgba(16, 185, 129, 0.1);
        }
        
        .validation-error {
          border-left: 3px solid #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }
        
        .validation-pending {
          border-left: 3px solid #f59e0b;
          background-color: rgba(245, 158, 11, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RegistroWizard;
