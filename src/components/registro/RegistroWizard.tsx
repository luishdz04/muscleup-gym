// src/components/registro/RegistroWizard.tsx
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

  // Renderizar el paso actual
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalDataStep
            register={register}
            errors={errors}
            control={control}
            watch={watch}
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
            register={register}
            errors={errors}
            control={control}
            onNext={goNext}
            onBack={goBack}
          />
        );
        
      case 3:
        return (
          <MembershipInfoStep
            register={register}
            errors={errors}
            onNext={goNext}
            onBack={goBack}
          />
        );
        
      case 4:
        return (
          <ContractSignatureStep
            register={register}
            errors={errors}
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
      
      {/* Barra de progreso */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span>Progreso del registro</span>
          <span>{formProgress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-500 ease-out"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Indicador de pasos navegable */}
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
          🚀 Registro v4.0 - Con Zod - {getCurrentMexicoDate()} by @luishdz044
        </div>
      )}

      {/* Estilos CSS para animaciones */}
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

        /* Mejoras visuales para el progreso */
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
      `}</style>
    </div>
  );
};

export default RegistroWizard;
