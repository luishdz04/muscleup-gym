// components/UserFormDialog.tsx - Versión Optimizada CORREGIDA
'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  useMediaQuery,
  useTheme,
  FormHelperText,
  CircularProgress,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Snackbar,
  Slide
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  AlternateEmail as AlternateEmailIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  LocalHospital as LocalHospitalIcon,
  FitnessCenter as FitnessCenterIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationCity as LocationCityIcon,
  Public as PublicIcon,
  MarkunreadMailbox as MarkunreadMailboxIcon,
  Bloodtype as BloodtypeIcon,
  Favorite as FavoriteIcon,
  Save as SaveIcon,
  RocketLaunch as RocketLaunchIcon,
  Security as SecurityIcon,
  Update as UpdateIcon
} from '@mui/icons-material';

// Hooks personalizados
import { useUserForm } from '@/hooks/useUserForm';
import { useFileManagement } from '@/hooks/useFileManagment';
import { useFingerprintManagement } from '@/hooks/useFingerprintManagement';
import { useUserDataInitialization } from '@/hooks/userUserDataInitialization';
import { useStepperNavigation } from '@/hooks/useStepperNavigation';

// Componentes optimizados
import ProfileAvatar from '@/components/user/ProfileAvatar';
import SignatureDisplay from '@/components/user/SignatureDisplay';
import FingerprintControl from '@/components/user/FingerprintControl';
import ContractPdfDisplay from '@/components/user/ContractPdfDisplay';
import FingerprintRegistration from './FingerprintRegistration';

// Tokens de color
import { colorTokens } from '@/theme';

// Interfaces
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: string;
  profilePictureUrl?: string;
  whatsapp: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  isMinor: boolean;
  emailSent: boolean;
  emailSentAt?: string;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  signatureUrl?: string;
  contractPdfUrl?: string;
  fingerprint: boolean;
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: any) => Promise<void>;
}

const UserFormDialogOptimized: React.FC<UserFormDialogProps> = ({ 
  open, 
  onClose, 
  user, 
  onSave 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Hook de formulario principal
  const {
    formData,
    addressData,
    emergencyData,
    membershipData,
    errors,
    birthDate,
    hasFormChanges,
    handleInputChange,
    handleSelectChange,
    handleAddressChange,
    handleEmergencyChange,
    handleEmergencySelectChange,
    handleMembershipChange,
    handleMembershipSelectChange,
    handleSwitchChange,
    handleMembershipSwitchChange,
    handleBirthDateChange,
    validateStep,
    initializeWithUser,
    initializeRelatedData, 
    resetForm,
    getProcessedFormData
  } = useUserForm({ 
    initialUser: user,
    onFormChange: () => {} 
  });

  // Hook de gestión de archivos
  const {
    profileImage,
    signatureImage,
    profilePicture,
    profilePicturePreview,
    signature,
    signaturePreview,
    contract,
    fileUploading,
    filesLoaded,
    contractLastUpdated,
    handleFileChange,
    loadExistingFiles,
    uploadPendingFiles,
    retryImageLoad,
    clearPendingFiles,
    resetFileStates,
    hasPendingFiles
  } = useFileManagement({
    userId: user?.id,
    onFileUploadComplete: (fileType, url) => {
      console.log(`Archivo ${fileType} subido: ${url}`);
    },
    onFileError: (fileType, error) => {
      console.error(`Error en archivo ${fileType}: ${error}`);
    }
  });

  // Hook de gestión de huellas
  const {
    fingerprintState,
    isDeletingFingerprint,
    fingerprintDialogOpen,
    handleFingerprintDialogOpen,
    handleFingerprintDialogClose,
    handleFingerprintDataReady,
    handleDeleteFingerprint,
    handleDeleteAllFingerprints,
    processPendingFingerprint,
    resetFingerprintState,
    initializeWithFingerprint,
    hasPendingFingerprint,
    isSyncing
  } = useFingerprintManagement({
    userId: user?.id,
    onFingerprintChange: (hasFingerprint) => {
      console.log(`Estado de huella cambiado: ${hasFingerprint}`);
    },
    onError: (message) => {
      console.error(`Error en huella: ${message}`);
    },
    onSuccess: (message) => {
      console.log(`Éxito en huella: ${message}`);
    }
  });

  // Hook de inicialización
  const {
    isInitializing,
    isInitializationComplete,
    initializationError,
    retryInitialization,
    resetInitialization,
    isInitializationReady,
    getCurrentUserRole,
    isCurrentUserClient,
    canProceed,
    isReadyForInteraction
  } = useUserDataInitialization({
    user,
    isOpen: open,
    onDataLoaded: (data) => {
      // Actualizar datos cargados en los hooks de formulario
if (data && Object.keys(data).length > 0) {
  console.log('🔄 [DIALOG] Aplicando datos relacionados al formulario:', data);
  initializeRelatedData(data);
} else {
  console.log('ℹ️ [DIALOG] No hay datos relacionados para cargar');
}    },
    onError: (error) => {
      console.error('Error en inicialización:', error);
    }
  });

  // Hook de navegación del stepper
  const {
    activeStep,
    steps,
    isLastStep,
    isFirstStep,
    handleNext,
    handleBack,
    setActiveStep,
    shouldShowStep,
    mapStepIndex
  } = useStepperNavigation({
    userRole: getCurrentUserRole(),
    validateStep
  });

  // Estados adicionales para el diálogo
  const [loading, setLoading] = React.useState(false);
  const [isRegeneratingContract, setIsRegeneratingContract] = React.useState(false);
  const [contractRegenerationSuccess, setContractRegenerationSuccess] = React.useState(false);
  const [contractRegenerationError, setContractRegenerationError] = React.useState<string | null>(null);

  // Función para regenerar contrato
  const regenerateContract = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔄 [CONTRACT] Iniciando regeneración para usuario:', userId);
      
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
  userId,
  isRegeneration: true,   // ✅ Nombre unificado
}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error al regenerar contrato');
      }

      const result = await response.json();
      console.log('✅ [CONTRACT] Contrato regenerado exitosamente:', result);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [CONTRACT] Error en regeneración:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Función principal de guardado
  const handleSubmit = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Validar paso actual
      const currentMappedStep = mapStepIndex(activeStep);
      if (!validateStep(currentMappedStep)) {
        setLoading(false);
        return;
      }
      
      const userId = formData.id || user?.id || crypto.randomUUID();
      
      // 1. Subir archivos pendientes
      const uploadedFiles = await uploadPendingFiles(userId);
      
      // 2. Actualizar formData con URLs de archivos
      let updatedFormData = { ...formData, id: userId };
      if (uploadedFiles.profilePicture) {
        updatedFormData.profilePictureUrl = uploadedFiles.profilePicture;
      }
      if (uploadedFiles.signature) {
        updatedFormData.signatureUrl = uploadedFiles.signature;
      }
      
      // 3. Obtener datos procesados del formulario
      const processedData = getProcessedFormData();
      const finalUserData = { ...processedData, ...updatedFormData };
      
      // 4. Guardar usuario en BD
      console.log('💾 [SUBMIT] Guardando usuario en BD...');
      await onSave(finalUserData);
      console.log('✅ [SUBMIT] Usuario guardado en BD');
      
      // 5. Procesar huella pendiente si existe
      if (hasPendingFingerprint) {
        console.log('🖐️ [SUBMIT] Procesando huella pendiente...');
        const fullName = `${finalUserData.firstName} ${finalUserData.lastName}`.trim();
        const fingerprintResult = await processPendingFingerprint(fullName);
        
        if (fingerprintResult.success) {
          updatedFormData.fingerprint = true;
        }
      }

      if (!userId) {
  console.error('❌ [SUBMIT] No se puede regenerar contrato sin userId');
  setLoading(false);
  return;
}

      
      // 6. Regenerar contrato si es cliente
   if (isCurrentUserClient() && (hasFormChanges || hasPendingFingerprint)) {
  console.log('🔄 [SUBMIT] Regenerando contrato...', {
    userId,
    hasFormChanges,
    hasPendingFingerprint,
    isRegeneration: true  // ✅ Confirmar que se envía
  });
  setIsRegeneratingContract(true);
        
        
        try {
const contractResult = await regenerateContract(userId);
if (!contractResult.success) {
  throw new Error(contractResult.error || 'Error al regenerar contrato');
}          
          if (contractResult.success) {
            console.log('✅ [SUBMIT] Contrato regenerado');
            setContractRegenerationSuccess(true);
            
            // Recargar archivos después de un momento
            setTimeout(() => {
              loadExistingFiles(userId);
            }, 1000);
          }
        } catch (error: any) {
          console.error('❌ [SUBMIT] Error regenerando contrato:', error);
          setContractRegenerationError(error.message);
        } finally {
          setIsRegeneratingContract(false);
        }
      }
      
      // 7. Limpiar estados
      clearPendingFiles();
      resetFingerprintState();
      
      console.log('🎉 [SUBMIT] Proceso completado exitosamente');
      
      // Mostrar mensaje de éxito si no es cliente (no hay regeneración de contrato)
      if (!isCurrentUserClient()) {
        setContractRegenerationSuccess(true);
      }
      
    } catch (error: any) {
      console.error('💥 [SUBMIT] Error crítico:', error);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    activeStep,
    mapStepIndex,
    validateStep,
    formData,
    user?.id,
    uploadPendingFiles,
    getProcessedFormData,
    onSave,
    hasPendingFingerprint,
    processPendingFingerprint,
    isCurrentUserClient,
    hasFormChanges,
    regenerateContract,
    loadExistingFiles,
    clearPendingFiles,
    resetFingerprintState
  ]);

  // Efecto para inicialización
  useEffect(() => {
    if (open && user?.id) {
      initializeWithUser(user);
      initializeWithFingerprint(user.fingerprint || false);
      loadExistingFiles(user.id);
    } else if (open && !user) {
      resetForm();
      resetFileStates();
      resetFingerprintState();
    }
  }, [open, user, initializeWithUser, initializeWithFingerprint, loadExistingFiles, resetForm, resetFileStates, resetFingerprintState]);

  // Efecto para cierre automático después del éxito
  useEffect(() => {
    if (contractRegenerationSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setContractRegenerationSuccess(false);
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [contractRegenerationSuccess, onClose]);

  // Manejar cierre del diálogo
  const handleClose = useCallback(() => {
    if (hasFormChanges || hasPendingFiles || hasPendingFingerprint) {
      if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasFormChanges, hasPendingFiles, hasPendingFingerprint, onClose]);

  // Estilos para inputs con tema oscuro
  const darkProInputStyles = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      bgcolor: colorTokens.neutral100,
      color: colorTokens.neutral1200,
      '& fieldset': { 
        borderColor: colorTokens.neutral400, 
        borderWidth: '2px' 
      },
      '&:hover fieldset': { 
        borderColor: colorTokens.brand 
      },
      '&.Mui-focused fieldset': { 
        borderColor: colorTokens.brand,
        boxShadow: `0 0 0 3px ${colorTokens.brand}40`
      },
      '&.Mui-error fieldset': {
        borderColor: colorTokens.danger
      },
      transition: 'all 0.2s ease'
    },
    '& .MuiInputLabel-root': { 
      color: colorTokens.neutral900,
      '&.Mui-focused': {
        color: colorTokens.brand
      },
      '&.Mui-error': {
        color: colorTokens.danger
      }
    },
    '& .MuiFormHelperText-root': { 
      color: colorTokens.danger,
      fontWeight: 500
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: colorTokens.neutral800
    }
  }), []);

  const darkProSelectStyles = useMemo(() => ({
    bgcolor: colorTokens.neutral100,
    color: colorTokens.neutral1200,
    '& .MuiOutlinedInput-notchedOutline': { 
      borderColor: colorTokens.neutral400, 
      borderWidth: '2px' 
    },
    '&:hover .MuiOutlinedInput-notchedOutline': { 
      borderColor: colorTokens.brand 
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
      borderColor: colorTokens.brand,
      boxShadow: `0 0 0 3px ${colorTokens.brand}40`
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: colorTokens.danger
    },
    '& .MuiSvgIcon-root': { 
      color: colorTokens.neutral800 
    },
    transition: 'all 0.2s ease'
  }), []);

  const darkProMenuProps = useMemo(() => ({
    PaperProps: {
      sx: {
        bgcolor: colorTokens.neutral300,
        border: `1px solid ${colorTokens.neutral500}`,
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 32px ${colorTokens.neutral0}80`,
        '& .MuiMenuItem-root': {
          color: colorTokens.neutral1200,
          '&:hover': { 
            bgcolor: `${colorTokens.brand}20` 
          },
          '&.Mui-selected': {
            bgcolor: `${colorTokens.brand}20`,
            '&:hover': { 
              bgcolor: `${colorTokens.brand}30` 
            }
          }
        }
      }
    }
  }), []);

  // Función para renderizar contenido por paso
  const renderStepContent = useCallback((step: number) => {
    const mappedStep = mapStepIndex(step);
    
    switch (mappedStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <ProfileAvatar
              firstName={formData.firstName}
              profileImage={profileImage}
              profilePicture={profilePicture}
              profilePicturePreview={profilePicturePreview}
              fileUploading={fileUploading.profilePicture}
              initializationComplete={isInitializationComplete}
              onFileChange={handleFileChange('profilePicture')}
              onRetryImageLoad={() => retryImageLoad('profile')}
            />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AlternateEmailIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  error={!!errors.whatsapp}
                  helperText={errors.whatsapp}
                  placeholder="+52 999 999 9999"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={birthDate}
                onChange={(value) => handleBirthDateChange(value ? dayjs(value) : null)}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    minDate={dayjs().subtract(120, 'year')}
                    slotProps={{
                      textField: {
                        error: !!errors.birthDate,
                        helperText: errors.birthDate,
                        sx: darkProInputStyles
                      }
                    }}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel>Género</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleSelectChange}
                    label="Género"
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                  {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.maritalStatus}>
                  <InputLabel>Estado Civil</InputLabel>
                  <Select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleSelectChange}
                    label="Estado Civil"
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="soltero">Soltero/a</MenuItem>
                    <MenuItem value="casado">Casado/a</MenuItem>
                    <MenuItem value="divorciado">Divorciado/a</MenuItem>
                    <MenuItem value="viudo">Viudo/a</MenuItem>
                  </Select>
                  {errors.maritalStatus && <FormHelperText>{errors.maritalStatus}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="rol"
                    value={formData.rol}
                    onChange={handleSelectChange}
                    label="Rol"
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="cliente">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FitnessCenterIcon fontSize="small" sx={{ color: colorTokens.success }} />
                        Cliente
                      </Box>
                    </MenuItem>
                    <MenuItem value="empleado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" sx={{ color: '#FF9800' }} />
                        Empleado
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" sx={{ color: colorTokens.danger }} />
                        Administrador
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.isMinor && (
                <Grid size={12}>
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      bgcolor: colorTokens.warning,
                      color: colorTokens.neutral0,
                      border: `2px solid ${colorTokens.warning}`,
                      '& .MuiAlert-icon': { 
                        color: colorTokens.neutral0 
                      },
                      fontWeight: 600
                    }}
                  >
                    ⚠️ Este usuario es menor de edad. Se requiere autorización del tutor legal.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 1:
        if (!isCurrentUserClient()) {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.warning, 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <LocationOnIcon />
              Información de Dirección
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Calle"
                  name="street"
                  value={addressData.street}
                  onChange={handleAddressChange}
                  error={!!errors.address_street}
                  helperText={errors.address_street}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Número"
                  name="number"
                  value={addressData.number}
                  onChange={handleAddressChange}
                  error={!!errors.address_number}
                  helperText={errors.address_number}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Colonia"
                  name="neighborhood"
                  value={addressData.neighborhood}
                  onChange={handleAddressChange}
                  error={!!errors.address_neighborhood}
                  helperText={errors.address_neighborhood}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  name="city"
                  value={addressData.city}
                  onChange={handleAddressChange}
                  error={!!errors.address_city}
                  helperText={errors.address_city}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Estado"
                  name="state"
                  value={addressData.state}
                  onChange={handleAddressChange}
                  error={!!errors.address_state}
                  helperText={errors.address_state}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  name="postalCode"
                  value={addressData.postalCode}
                  onChange={handleAddressChange}
                  error={!!errors.address_postalCode}
                  helperText={errors.address_postalCode}
                  placeholder="12345"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MarkunreadMailboxIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        if (!isCurrentUserClient()) {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.danger, 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <LocalHospitalIcon />
              Contacto de Emergencia
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  name="name"
                  value={emergencyData.name}
                  onChange={handleEmergencyChange}
                  error={!!errors.emergency_name}
                  helperText={errors.emergency_name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={emergencyData.phone}
                  onChange={handleEmergencyChange}
                  error={!!errors.emergency_phone}
                  helperText={errors.emergency_phone}
                  placeholder="+52 999 999 9999"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.emergency_bloodType}>
                  <InputLabel>Tipo de Sangre</InputLabel>
                  <Select
                    name="bloodType"
                    value={emergencyData.bloodType}
                    onChange={handleEmergencySelectChange}
                    label="Tipo de Sangre"
                    startAdornment={
                      <InputAdornment position="start">
                        <BloodtypeIcon />
                      </InputAdornment>
                    }
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </Select>
                  {errors.emergency_bloodType && <FormHelperText>{errors.emergency_bloodType}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Condición médica (opcional)"
                  name="medicalCondition"
                  multiline
                  rows={4}
                  value={emergencyData.medicalCondition}
                  onChange={handleEmergencyChange}
                  placeholder="Describe cualquier condición médica relevante, alergias, medicamentos, etc."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <FavoriteIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        if (!isCurrentUserClient()) {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#9C27B0', 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FitnessCenterIcon />
              Información de Membresía
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Referido por (opcional)"
                  name="referredBy"
                  value={membershipData.referredBy}
                  onChange={handleMembershipChange}
                  placeholder="Nombre de quien te recomendó"
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Nivel de Entrenamiento</InputLabel>
                  <Select
                    name="trainingLevel"
                    value={membershipData.trainingLevel}
                    onChange={handleMembershipSelectChange}
                    label="Nivel de Entrenamiento"
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="principiante">🥉 Principiante</MenuItem>
                    <MenuItem value="intermedio">🥈 Intermedio</MenuItem>
                    <MenuItem value="avanzado">🥇 Avanzado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={membershipData.receivePlans}
                      onChange={handleMembershipSwitchChange('receivePlans')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#9C27B0',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#9C27B0',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: colorTokens.neutral1200 }}>
                      📧 Recibir planes de entrenamiento por email
                    </Typography>
                  }
                />
              </Grid>
              
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Motivación principal"
                  name="mainMotivation"
                  multiline
                  rows={4}
                  value={membershipData.mainMotivation}
                  onChange={handleMembershipChange}
                  error={!!errors.membership_mainMotivation}
                  helperText={errors.membership_mainMotivation}
                  placeholder="¿Cuál es tu objetivo principal? (ej: perder peso, ganar músculo, mejorar resistencia...)"
                  sx={darkProInputStyles}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        // PASO DE ARCHIVOS Y HUELLA
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.info, 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AssignmentIcon />
              Archivos y Documentos
            </Typography>
            
            <Grid container spacing={3}>
              {/* FIRMA DIGITAL */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid #9C27B040`,
                  bgcolor: `#9C27B010`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#9C27B0', 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AssignmentIcon />
                    Firma Digital
                  </Typography>
                  
                  <SignatureDisplay
                    signatureImage={signatureImage}
                    signature={signature}
                    signaturePreview={signaturePreview}
                    fileUploading={fileUploading.signature}
                    initializationComplete={isInitializationComplete}
                    onFileChange={handleFileChange('signature')}
                    onRetryImageLoad={() => retryImageLoad('signature')}
                  />
                </Box>
              </Grid>
              
              {/* CONTRATO PDF */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${colorTokens.info}40`,
                  bgcolor: `${colorTokens.info}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: colorTokens.info, 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AssignmentIcon />
                    Contrato PDF
                  </Typography>
                  
                  <ContractPdfDisplay
                    contractPdfUrl={formData.contractPdfUrl}
                    contractLastUpdated={contractLastUpdated}
                    initializationComplete={isInitializationComplete}
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                  />
                </Box>
              </Grid>

              {/* REGISTRO DE HUELLA DACTILAR */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${colorTokens.brand}40`,
                  bgcolor: `${colorTokens.brand}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: colorTokens.brand, 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AssignmentIcon />
                    Huella Dactilar + F22
                  </Typography>
                  
                  <FingerprintControl
                    fingerprintState={fingerprintState}
                    hasFingerprint={formData.fingerprint}
                    isDeletingFingerprint={isDeletingFingerprint}
                    onFingerprintDialogOpen={handleFingerprintDialogOpen}
                    onDeleteFingerprint={handleDeleteFingerprint}
                    onDeleteAllFingerprints={handleDeleteAllFingerprints}
                    userId={user?.id}
                  />
                </Box>
              </Grid>
              
              {/* OPCIONES ADICIONALES */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${colorTokens.success}40`,
                  bgcolor: `${colorTokens.success}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: colorTokens.success, 
                    fontWeight: 600, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SecurityIcon />
                    Opciones Adicionales
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.emailSent}
                            onChange={handleSwitchChange('emailSent')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colorTokens.success,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colorTokens.success,
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AlternateEmailIcon sx={{ color: colorTokens.success }} />
                            <Typography sx={{ color: colorTokens.neutral1200 }}>
                              Email de bienvenida enviado
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                    
                    <Grid size={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.whatsappSent}
                            onChange={handleSwitchChange('whatsappSent')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#25d366',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#25d366',
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ color: '#25d366' }} />
                            <Typography sx={{ color: colorTokens.neutral1200 }}>
                              WhatsApp de bienvenida enviado
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
    }
  }, [
    mapStepIndex,
    formData,
    profileImage,
    profilePicture,
    profilePicturePreview,
    fileUploading,
    isInitializationComplete,
    handleFileChange,
    retryImageLoad,
    errors,
    handleInputChange,
    handleSelectChange,
    darkProInputStyles,
    darkProSelectStyles,
    darkProMenuProps,
    birthDate,
    handleBirthDateChange,
    isCurrentUserClient,
    steps.length,
    addressData,
    handleAddressChange,
    emergencyData,
    handleEmergencyChange,
    handleEmergencySelectChange,
    membershipData,
    handleMembershipChange,
    handleMembershipSelectChange,
    handleMembershipSwitchChange,
    signatureImage,
    signature,
    signaturePreview,
    contractLastUpdated,
    fingerprintState,
    isDeletingFingerprint,
    handleFingerprintDialogOpen,
    handleDeleteFingerprint,
    handleDeleteAllFingerprints,
    user?.id,
    handleSwitchChange
  ]);

  // Calcular si se pueden hacer cambios
  const canMakeChanges = hasFormChanges || hasPendingFiles || hasPendingFingerprint;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colorTokens.neutral500}`,
            borderRadius: 3,
            color: colorTokens.neutral1200,
            maxHeight: '95vh'
          }
        }}
      >
        {/* HEADER */}
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colorTokens.neutral500}`,
          bgcolor: `${colorTokens.brand}15`,
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RocketLaunchIcon sx={{ color: colorTokens.brand, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.neutral1200 }}>
                {user ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                {user ? `Modificando: ${user.firstName} ${user.lastName}` : 'Creando nuevo perfil de usuario'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* CHIP DE CAMBIOS PENDIENTES */}
            {canMakeChanges && (
              <Chip
                icon={<UpdateIcon />}
                label={
                  hasPendingFingerprint ? 
                  'Cambios + Huella pendiente' : 
                  'Cambios pendientes'
                }
                size="small"
                sx={{
                  bgcolor: `${colorTokens.warning}20`,
                  color: colorTokens.warning,
                  border: `1px solid ${colorTokens.warning}40`,
                  fontWeight: 600,
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                  },
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
            
            <IconButton 
              onClick={handleClose}
              sx={{ 
                color: colorTokens.neutral900,
                '&:hover': { 
                  color: colorTokens.neutral1200,
                  bgcolor: `${colorTokens.brand}20`
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* CONTENIDO */}
        <DialogContent sx={{ p: 0 }}>
          {/* MENSAJES DE ERROR */}
          {initializationError && (
            <Alert 
              severity="error" 
              sx={{ 
                m: 3, 
                mb: 0,
                bgcolor: colorTokens.danger,
                color: colorTokens.neutral1200,
                border: `2px solid ${colorTokens.danger}`,
                fontWeight: 600
              }}
            >
              {initializationError}
            </Alert>
          )}

          {/* STEPPER */}
          <Box sx={{ p: 3 }}>
            <Stepper 
              activeStep={activeStep} 
              orientation={isMobile ? "vertical" : "horizontal"}
              sx={{
                '& .MuiStepLabel-label': { 
                  color: colorTokens.neutral900,
                  '&.Mui-active': { 
                    color: colorTokens.brand,
                    fontWeight: 600 
                  },
                  '&.Mui-completed': { 
                    color: colorTokens.success,
                    fontWeight: 600 
                  }
                },
                '& .MuiStepIcon-root': {
                  color: colorTokens.neutral400,
                  '&.Mui-active': { 
                    color: colorTokens.brand,
                    filter: `drop-shadow(0 0 8px ${colorTokens.brand}60)`
                  },
                  '&.Mui-completed': { 
                    color: colorTokens.success,
                    filter: `drop-shadow(0 0 8px ${colorTokens.success}60)`
                  }
                },
                '& .MuiStepConnector-line': {
                  borderColor: colorTokens.neutral500
                },
                '& .Mui-completed .MuiStepConnector-line': {
                  borderColor: colorTokens.success
                },
                '& .Mui-active .MuiStepConnector-line': {
                  borderColor: colorTokens.brand
                }
              }}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  {isMobile && (
                    <StepContent>
                      {renderStepContent(index)}
                    </StepContent>
                  )}
                </Step>
              ))}
            </Stepper>

            {!isMobile && (
              <Box sx={{ mt: 4 }}>
                {renderStepContent(activeStep)}
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* ACCIONES */}
        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${colorTokens.neutral500}`,
          bgcolor: colorTokens.neutral100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  disabled={isFirstStep}
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                  sx={{ 
                    color: colorTokens.neutral900,
                    '&:hover': {
                      color: colorTokens.neutral1200,
                      bgcolor: `${colorTokens.brand}20`
                    },
                    '&:disabled': {
                      color: colorTokens.neutral700
                    }
                  }}
                >
                  Anterior
                </Button>
                
                {!isLastStep && (
                  <Button
                    variant="outlined"
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      borderColor: `${colorTokens.brand}60`,
                      color: colorTokens.brand,
                      '&:hover': {
                        borderColor: colorTokens.brand,
                        bgcolor: `${colorTokens.brand}10`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 15px ${colorTokens.brand}30`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Siguiente
                  </Button>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{ 
                color: colorTokens.neutral900,
                '&:hover': { 
                  color: colorTokens.neutral1200, 
                  bgcolor: `${colorTokens.brand}20` 
                },
                '&:disabled': {
                  color: colorTokens.neutral700
                }
              }}
            >
              Cancelar
            </Button>
            
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                loading || 
                !canMakeChanges || 
                isSyncing ||
                !isReadyForInteraction
              }
              startIcon={
                loading ? (
                  <CircularProgress size={20} sx={{ color: colorTokens.neutral1200 }} />
                ) : (
                  <SaveIcon />
                )
              }
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, #2E7D32)`,
                color: colorTokens.neutral1200,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                minWidth: '180px',
                '&:hover': {
                  background: `linear-gradient(135deg, #2E7D32, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${colorTokens.success}50`
                },
                '&:disabled': {
                  bgcolor: colorTokens.neutral400,
                  color: colorTokens.neutral700,
                  boxShadow: 'none',
                  transform: 'none'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading 
                ? 'Guardando...'
                : user 
                  ? 'Actualizar Usuario'
                  : 'Crear Usuario'
              }
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* MODAL DE REGISTRO DE HUELLA */}
      {user && (
        <FingerprintRegistration
          open={fingerprintDialogOpen}
          onClose={handleFingerprintDialogClose}
          user={{
            id: user.id || '',
            firstName: user.firstName,
            lastName: user.lastName,
            fingerprint: formData.fingerprint
          }}
          userType="cliente"
          onFingerprintDataReady={handleFingerprintDataReady}
          onError={(message) => console.error('Error en huella:', message)}
        />
      )}

      {/* SNACKBAR DE ÉXITO */}
      <Snackbar
        open={contractRegenerationSuccess}
        autoHideDuration={3000}
        onClose={() => setContractRegenerationSuccess(false)}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            bgcolor: colorTokens.success,
            color: colorTokens.neutral1200,
            border: `2px solid ${colorTokens.success}`,
            boxShadow: `0 8px 32px ${colorTokens.success}40`,
            fontWeight: 600
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketLaunchIcon />
            <Typography sx={{ fontWeight: 600 }}>
              ¡Usuario guardado exitosamente!
              {isCurrentUserClient() && ' Contrato regenerado.'}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* OVERLAY DE REGENERACIÓN DE CONTRATO */}
      {isRegeneratingContract && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${colorTokens.neutral0}DD`,
          zIndex: 9999,
          backdropFilter: 'blur(20px)'
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral500}`,
            minWidth: 320,
            boxShadow: `0 20px 60px ${colorTokens.neutral0}80`
          }}>
            <CircularProgress 
              size={64} 
              sx={{ 
                color: colorTokens.brand,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.neutral1200, 
                fontWeight: 600, 
                mb: 1 
              }}>
                🔄 Regenerando Contrato
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral900 
              }}>
                Generando documentación actualizada...
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: `${colorTokens.brand}15`,
              border: `1px solid ${colorTokens.brand}40`
            }}>
              <AssignmentIcon sx={{ 
                color: colorTokens.brand, 
                fontSize: 20 
              }} />
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral900 
              }}>
                Este proceso puede tomar unos segundos
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default UserFormDialogOptimized;