// src/components/registro/RegistroWizardV2.tsx
'use client';

import React from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import {
  Person as PersonIcon,
  ContactEmergency as EmergencyIcon,
  CardMembership as MembershipIcon,
  Description as ContractIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { colorTokens } from '@/theme';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { PersonalDataStepV2 } from './steps/PersonalDataStepV2';
import { EmergencyContactStepV2 } from './steps/EmergencyContactStepV2';
import { MembershipInfoStepV2 } from './steps/MembershipInfoStepV2';
import { ContractSignatureStepV2 } from './steps/ContractSignatureStepV2';
import SuccessModal from './SuccessModal';

// Custom Connector para el Stepper
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
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

// Custom Step Icon
const CustomStepIcon = ({ active, completed, icon }: any) => {
  const icons: { [index: string]: React.ReactElement } = {
    1: <PersonIcon />,
    2: <EmergencyIcon />,
    3: <MembershipIcon />,
    4: <ContractIcon />,
  };

  return (
    <Box
      sx={{
        width: 50,
        height: 50,
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
  { label: 'Membresía', description: 'Selecciona tu plan' },
  { label: 'Contrato', description: 'Firma y acepta' },
];

const RegistroWizardV2 = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalDataStepV2
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
          <EmergencyContactStepV2
            register={register}
            errors={errors}
            control={control}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 3:
        return (
          <MembershipInfoStepV2
            register={register}
            errors={errors}
            control={control}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 4:
        return (
          <ContractSignatureStepV2
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Image
                src="/logo.png"
                alt="Muscle Up Gym"
                width={120}
                height={120}
                priority
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 204, 0, 0.3))',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: colorTokens.textPrimary,
                mb: 1
              }}
            >
              Únete a <span style={{ color: colorTokens.brand }}>Muscle Up</span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colorTokens.textSecondary,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Tu salud y bienestar es nuestra misión. Completa tu registro en 4 sencillos pasos.
            </Typography>
          </Box>
        </motion.div>

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
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: colorTokens.brand,
                  backgroundImage: `linear-gradient(90deg, ${colorTokens.brand} 0%, ${colorTokens.brandHover} 100%)`,
                  boxShadow: `0 0 10px ${colorTokens.glow}`
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
              p: { xs: 2, md: 4 },
              mb: 4,
              bgcolor: colorTokens.surfaceLevel2,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}
          >
            <Stepper
              activeStep={step - 1}
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
              connector={<CustomConnector />}
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
                        '&.Mui-active': {
                          color: colorTokens.brand,
                          fontWeight: 700
                        },
                        '&.Mui-completed': {
                          color: colorTokens.success,
                          fontWeight: 600
                        }
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                        {stepItem.label}
                      </Typography>
                      {!isMobile && (
                        <Typography variant="caption" sx={{ color: colorTokens.textMuted, display: 'block' }}>
                          {stepItem.description}
                        </Typography>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
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
