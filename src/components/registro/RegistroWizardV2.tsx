// src/components/registro/RegistroWizardV2.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  LinearProgress,
  useTheme,
  useMediaQuery,
  StepConnector,
  stepConnectorClasses,
  styled
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Person as PersonIcon,
  ContactEmergency as EmergencyIcon,
  CardMembership as MembershipIcon,
  Description as ContractIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { animate, createTimeline } from 'animejs';
import { colorTokens } from '@/theme';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { PersonalDataStep } from './steps/PersonalDataStep';
import { EmergencyContactStep } from './steps/EmergencyContactStep';
import { MembershipInfoStep } from './steps/MembershipInfoStep';
import { ContractSignatureStep } from './steps/ContractSignatureStep';
import SuccessModal from './SuccessModal';

// Custom Connector para el Stepper
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${colorTokens.brand} 0%, ${colorTokens.brandHover} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${colorTokens.success} 0%, ${colorTokens.successHover} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: colorTokens.neutral600,
    borderRadius: 1,
  },
}));

// Custom Step Icon - Responsive
const CustomStepIcon = ({ active, completed, icon }: any) => {
  const icons: { [index: string]: React.ReactElement } = {
    1: <PersonIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />,
    2: <EmergencyIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />,
    3: <MembershipIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />,
    4: <ContractIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />,
  };

  return (
    <Box
      sx={{
        width: { xs: 48, sm: 50, md: 56 },
        height: { xs: 48, sm: 50, md: 56 },
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: completed
          ? colorTokens.success
          : active
          ? colorTokens.brand
          : colorTokens.neutral600,
        color: completed || active ? colorTokens.black : colorTokens.textSecondary,
        transition: 'all 0.3s ease',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        boxShadow: active
          ? `0 0 20px ${colorTokens.glow}`
          : 'none',
      }}
    >
      {icons[String(icon)]}
    </Box>
  );
};

const steps = [
  { label: 'Datos Personales', description: 'Información básica' },
  { label: 'Contacto de Emergencia', description: 'Por tu seguridad' },
  { label: 'Preferencias', description: 'Tus objetivos' },
  { label: 'Contrato', description: 'Firma y acepta' },
];

const RegistroWizardV2 = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Refs para animaciones
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(1);

  const {
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
    sigCanvas,
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
    goNext,
    goBack,
    goToStep,
    handleProfilePhotoCapture,
    handleTutorINECapture,
    clearPhoto,
    clearTutorINE,
    clearSignature,
    onSubmit,
    handleCloseSuccessModal,
    getCurrentMexicoDate,
    validateAge
  } = useRegistrationForm();

  // Animación de entrada del logo (solo al cargar)
  useEffect(() => {
    if (logoRef.current) {
      animate(logoRef.current, {
        scale: [0, 1.1, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'out(elastic(1, .6))',
      });
    }

    if (textRef.current) {
      animate(textRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: 300,
        easing: 'outQuad'
      });
    }
  }, []);

  // Animación del progress bar cuando cambia (usando CSS transitions de MUI)
  // MUI LinearProgress ya maneja las transiciones internamente

  // Animación de transición entre steps
  useEffect(() => {
    if (stepContentRef.current && step !== previousStep.current) {
      const direction = step > previousStep.current ? 1 : -1;

      // Animar salida del step anterior y entrada del nuevo
      const timeline = createTimeline();

      timeline.add(stepContentRef.current, {
        opacity: [1, 0],
        translateX: [0, -50 * direction],
        duration: 300,
        easing: 'outExpo'
      })
      .add(stepContentRef.current, {
        opacity: [0, 1],
        translateX: [50 * direction, 0],
        duration: 400,
        easing: 'outExpo'
      });

      previousStep.current = step;
    }
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalDataStep
            register={register}
            errors={errors}
            control={control}
            watch={watch}
            setValue={setValue}
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colorTokens.neutral0,
        py: { xs: 3, md: 6 },
        px: { xs: 2, md: 3 }
      }}
    >
      <Container maxWidth="lg">
        {/* Header con Logo */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          {/* Logo */}
          <Box
            ref={logoRef}
            sx={{ display: 'flex', justifyContent: 'center', mb: 3, opacity: 0 }}
          >
            <Image
              src="/logo.png"
              alt="Muscle Up Gym"
              width={220}
              height={220}
              priority
            />
          </Box>

          {/* Lema */}
          <Typography
            ref={textRef}
            variant="h5"
            sx={{
              color: colorTokens.textSecondary,
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              maxWidth: 650,
              mx: 'auto',
              opacity: 0
            }}
          >
            Tu salud y bienestar son nuestra misión. Completa tu registro en 4 sencillos pasos.
          </Typography>
        </Box>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              bgcolor: colorTokens.surfaceLevel2,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontWeight: 600 }}>
                Progreso del registro
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                {formProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={formProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colorTokens.neutral600,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: colorTokens.brand,
                  backgroundImage: `linear-gradient(90deg, ${colorTokens.brand} 0%, ${colorTokens.brandHover} 100%)`,
                  boxShadow: `0 0 10px ${colorTokens.glow}`,
                  transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important'
                }
              }}
            />
          </Paper>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 4,
              bgcolor: colorTokens.surfaceLevel2,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}
          >
            <Stepper
              activeStep={step - 1}
              alternativeLabel // Siempre alternativeLabel: ícono arriba, texto abajo
              orientation="horizontal"
              connector={<CustomConnector />}
              sx={{
                width: '100%',
                '& .MuiStep-root': {
                  px: { xs: 0, sm: 1 },
                  flex: 1 // Distribuir uniformemente todo el ancho
                }
              }}
            >
              {steps.map((stepItem, index) => (
                <Step
                  key={stepItem.label}
                  completed={completedSteps.includes(index + 1)}
                  onClick={() => {
                    if (completedSteps.includes(index) || index + 1 <= step) {
                      goToStep(index + 1);
                    }
                  }}
                  sx={{
                    cursor: (completedSteps.includes(index) || index + 1 <= step) ? 'pointer' : 'default'
                  }}
                >
                  <StepLabel
                    StepIconComponent={CustomStepIcon}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: colorTokens.textSecondary,
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        mt: { xs: 1, sm: 1 },
                        textAlign: 'center',
                        '&.Mui-active': {
                          color: colorTokens.brand,
                          fontWeight: 700
                        },
                        '&.Mui-completed': {
                          color: colorTokens.success,
                          fontWeight: 600
                        }
                      },
                      '& .MuiStepLabel-iconContainer': {
                        pr: 0
                      }
                    }}
                  >
                    {/* En móvil solo primera palabra, en desktop completo */}
                    {isMobile ? stepItem.label.split(' ')[0] : stepItem.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </motion.div>

        {/* Form Content */}
        <Box ref={stepContentRef}>
          {renderStep()}
        </Box>
      </Container>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal onClose={handleCloseSuccessModal} />
      )}

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </Box>
  );
};

export default RegistroWizardV2;
