// components/UserFormDialog.tsx - v6.0 COMPLETO HOOKS RULES CORREGIDO + GRID MUI v6
'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
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
  useMediaQuery,
  useTheme,
  FormHelperText,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
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
  Save as SaveIcon,
  RocketLaunch as RocketLaunchIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Description as DescriptionIcon,
  Fingerprint as FingerprintIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v6.0
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp,
  getTodayInMexico
} from '@/utils/dateUtils';
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { validateFileSimple } from '@/utils/fileValidation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { User, Address, EmergencyContact, MembershipInfo } from '@/types/user';

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
  // ✅ TODOS LOS HOOKS AL PRINCIPIO - ORDEN FIJO SIEMPRE
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ TODOS LOS ESTADOS - ORDEN FIJO
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<User>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    rol: 'cliente',
    whatsapp: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    isMinor: false,
    emailSent: false,
    whatsappSent: false,
    fingerprint: false
  });
  const [addressData, setAddressData] = useState<Address>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'México'
  });
  const [emergencyData, setEmergencyData] = useState<EmergencyContact>({
    name: '',
    phone: '',
    medicalCondition: '',
    bloodType: ''
  });
  const [membershipData, setMembershipData] = useState<MembershipInfo>({
    referredBy: '',
    mainMotivation: '',
    receivePlans: false,
    trainingLevel: 'principiante'
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [hasExistingProfilePicture, setHasExistingProfilePicture] = useState(false);
  const [hasExistingSignature, setHasExistingSignature] = useState(false);
  const [hasExistingContract, setHasExistingContract] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);

  // ✅ TODOS LOS useMemo - ORDEN FIJO, NO CONDICIONALES
  const steps = useMemo(() => {
    const baseSteps = ['Información Personal'];
    if (formData.rol === 'cliente') {
      return [
        ...baseSteps,
        'Dirección',
        'Contacto de Emergencia', 
        'Info. Membresía',
        'Archivos y Documentos'
      ];
    }
    return [...baseSteps, 'Archivos'];
  }, [formData.rol]);

  const isLastStep = useMemo(() => activeStep === steps.length - 1, [activeStep, steps.length]);
  const isFirstStep = useMemo(() => activeStep === 0, [activeStep]);

  const profilePreview = useMemo(() => {
    return profilePicture ? URL.createObjectURL(profilePicture) : '';
  }, [profilePicture]);

  const signaturePreview = useMemo(() => {
    return signature ? URL.createObjectURL(signature) : '';
  }, [signature]);

  const inputStyles = useMemo(() => ({
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
      }
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
    }
  }), []);

  const selectStyles = useMemo(() => ({
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
    }
  }), []);

  // ✅ TODOS LOS useCallback - ORDEN FIJO
  const loadRelatedData = useCallback(async (userId: string) => {
    try {
      const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (address) {
        setAddressData(address);
      }

      const { data: emergency } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('userId', userId)
        .single();
        
      if (emergency) {
        setEmergencyData(emergency);
      }

      const { data: membership } = await supabase
        .from('membership_info')
        .select('*')
        .eq('userId', userId)
        .single();
        
      if (membership) {
        setMembershipData(membership);
      }
    } catch (error) {
      console.error('Error cargando datos relacionados:', error);
    }
  }, [supabase]);

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      rol: 'cliente',
      whatsapp: '',
      birthDate: '',
      gender: '',
      maritalStatus: '',
      isMinor: false,
      emailSent: false,
      whatsappSent: false,
      fingerprint: false
    });
    
    setAddressData({
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México'
    });
    
    setEmergencyData({
      name: '',
      phone: '',
      medicalCondition: '',
      bloodType: ''
    });
    
    setMembershipData({
      referredBy: '',
      mainMotivation: '',
      receivePlans: false,
      trainingLevel: 'principiante'
    });
    
    setBirthDate(null);
    setActiveStep(0);
    setErrors({});
    setHasChanges(false);
    setProfilePicture(null);
    setSignature(null);
    setHasExistingProfilePicture(false);
    setHasExistingSignature(false);
    setHasExistingContract(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSelectChange = useCallback((e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  }, []);

  const handleSwitchChange = useCallback((name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    setHasChanges(true);
  }, []);

  const handleBirthDateChange = useCallback((value: any) => {
    const date = value as Dayjs | null;
    setBirthDate(date);
    const dateString = date ? date.format('YYYY-MM-DD') : '';
    setFormData(prev => ({ 
      ...prev, 
      birthDate: dateString,
      isMinor: date ? dayjs().diff(date, 'year') < 18 : false
    }));
    setHasChanges(true);
  }, []);

  const handleFileChange = useCallback((type: 'profilePicture' | 'signature') => 
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const validation = validateFileSimple(file, 'image');
        if (!validation.isValid) {
          toast.error(validation.error || 'Archivo inválido');
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          toast.loading('Archivo grande - puede tardar en subir...');
          setTimeout(() => toast.dismiss(), 2000);
        }

        if (type === 'profilePicture') {
          setProfilePicture(file);
          setHasExistingProfilePicture(false);
        } else {
          setSignature(file);
          setHasExistingSignature(false);
        }
        
        setHasChanges(true);
        
      } catch (error: any) {
        toast.error('Error al procesar archivo: ' + error.message);
      }
    }, [toast]);

  const handleDeleteExistingFile = useCallback(async (type: 'profilePicture' | 'signature' | 'contract') => {
    const fileNames = {
      profilePicture: 'foto de perfil',
      signature: 'firma digital', 
      contract: 'contrato PDF'
    };
    
    const confirmed = await alert.deleteConfirm(
      `¿Eliminar ${fileNames[type]}? Esta acción no se puede deshacer.`
    );
    
    if (confirmed) {
      try {
        let filePath = '';
        
        if (type === 'profilePicture' && formData.profilePictureUrl) {
          filePath = formData.profilePictureUrl.split('/').slice(-2).join('/');
        } else if (type === 'signature' && formData.signatureUrl) {
          filePath = formData.signatureUrl.split('/').slice(-2).join('/');
        } else if (type === 'contract' && formData.contractPdfUrl) {
          filePath = formData.contractPdfUrl.split('/').slice(-2).join('/');
        }
        
        if (filePath) {
          const { error } = await supabase.storage
            .from('user-files')
            .remove([filePath]);
          
          if (error) throw error;
        }
        
        if (type === 'profilePicture') {
          setHasExistingProfilePicture(false);
          setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
        } else if (type === 'signature') {
          setHasExistingSignature(false);
          setFormData(prev => ({ ...prev, signatureUrl: '' }));
        } else {
          setHasExistingContract(false);
          setFormData(prev => ({ ...prev, contractPdfUrl: '' }));
        }
        
        setHasChanges(true);
        toast.success('Archivo eliminado exitosamente');
        
      } catch (error: any) {
        console.error('Error eliminando archivo:', error);
        toast.error('Error al eliminar archivo: ' + error.message);
      }
    }
  }, [alert, toast, supabase, formData]);

  const uploadFiles = useCallback(async (userId: string) => {
    const uploadedUrls: { profilePictureUrl?: string; signatureUrl?: string } = {};
    
    try {
      setFileUploading(true);

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;
        
        const { error } = await supabase.storage
          .from('user-files')
          .upload(filePath, profilePicture, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);
        
        uploadedUrls.profilePictureUrl = urlData.publicUrl;
      }

      if (signature) {
        const fileExt = signature.name.split('.').pop();
        const fileName = `signature-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `signatures/${fileName}`;
        
        const { error } = await supabase.storage
          .from('user-files')
          .upload(filePath, signature, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);
        
        uploadedUrls.signatureUrl = urlData.publicUrl;
      }

      return uploadedUrls;
      
    } catch (error: any) {
      console.error('Error subiendo archivos:', error);
      throw error;
    } finally {
      setFileUploading(false);
    }
  }, [profilePicture, signature, supabase]);

  const validateStep = useCallback((step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0:
        if (!formData.firstName?.trim()) {
          newErrors.firstName = 'Nombre es requerido';
        }
        if (!formData.email?.trim()) {
          newErrors.email = 'Email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email inválido';
        }
        if (!formData.rol) {
          newErrors.rol = 'Rol es requerido';
        }
        break;
        
      case 1:
        if (formData.rol === 'cliente') {
          if (!addressData.street.trim()) {
            newErrors.address_street = 'Calle es requerida';
          }
          if (!addressData.city.trim()) {
            newErrors.address_city = 'Ciudad es requerida';
          }
        }
        break;
        
      case 2:
        if (formData.rol === 'cliente') {
          if (!emergencyData.name.trim()) {
            newErrors.emergency_name = 'Nombre de contacto es requerido';
          }
          if (!emergencyData.phone.trim()) {
            newErrors.emergency_phone = 'Teléfono es requerido';
          }
        }
        break;
        
      case 3:
        if (formData.rol === 'cliente') {
          if (!membershipData.mainMotivation.trim()) {
            newErrors.membership_mainMotivation = 'Motivación principal es requerida';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, addressData, emergencyData, membershipData]);

  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, validateStep]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const saveRelatedData = useCallback(async (userId: string) => {
    try {
      if (formData.rol === 'cliente') {
        await supabase
          .from('addresses')
          .upsert({
            userId,
            ...addressData
          });

        await supabase
          .from('emergency_contacts')
          .upsert({
            userId,
            ...emergencyData
          });

        await supabase
          .from('membership_info')
          .upsert({
            userId,
            ...membershipData
          });
      }
    } catch (error) {
      console.error('Error guardando datos relacionados:', error);
      throw error;
    }
  }, [formData.rol, addressData, emergencyData, membershipData, supabase]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (!validateStep(activeStep)) {
        setLoading(false);
        return;
      }
      
      const userId = formData.id || user?.id || crypto.randomUUID();
      const uploadedUrls = await uploadFiles(userId);
      
      let userData = { 
        ...formData, 
        id: userId,
        birthDate: birthDate ? birthDate.format('YYYY-MM-DD') : null
      };
      
      if (uploadedUrls.profilePictureUrl) {
        userData.profilePictureUrl = uploadedUrls.profilePictureUrl;
      } else if (!hasExistingProfilePicture) {
        userData.profilePictureUrl = '';
      }
      
      if (uploadedUrls.signatureUrl) {
        userData.signatureUrl = uploadedUrls.signatureUrl;
      } else if (!hasExistingSignature) {
        userData.signatureUrl = '';
      }
      
      const userDataWithAudit = await addAuditFieldsFor('Users', userData, !!user?.id);
      await onSave(userDataWithAudit);
      await saveRelatedData(userId);
      
      if (formData.rol === 'cliente' && hasChanges) {
        try {
          const response = await fetch('/api/generate-contract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId,
              isRegeneration: true
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Error regenerando contrato:', errorData);
          } else {
            toast.success('Contrato regenerado exitosamente');
          }
        } catch (error) {
          console.warn('Error regenerando contrato:', error);
        }
      }
      
      toast.success(`Usuario ${user ? 'actualizado' : 'creado'} exitosamente`);
      onClose();
      
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      toast.error('Error al guardar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    validateStep,
    activeStep,
    formData,
    user?.id,
    uploadFiles,
    birthDate,
    addAuditFieldsFor,
    onSave,
    saveRelatedData,
    hasChanges,
    toast,
    onClose,
    hasExistingProfilePicture,
    hasExistingSignature
  ]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // ✅ CLEANUP EFFECT
  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
    };
  }, [profilePreview, signaturePreview]);

  // ✅ LOAD DATA EFFECT  
  useEffect(() => {
    if (open && user?.id) {
      setFormData(prev => ({ ...prev, ...user }));
      setBirthDate(user.birthDate ? dayjs(user.birthDate) : null);
      
      setHasExistingProfilePicture(!!user.profilePictureUrl);
      setHasExistingSignature(!!user.signatureUrl);
      setHasExistingContract(!!user.contractPdfUrl);
      
      loadRelatedData(user.id);
    } else if (open && !user) {
      resetForm();
    }
  }, [open, user, loadRelatedData, resetForm]);

  // ✅ SSR SAFETY - MOVER DESPUÉS DE TODOS LOS HOOKS
  if (!hydrated) {
    return null;
  }

  // ✅ RENDERIZADO DE CONTENIDO POR PASO - COMPLETO CON GRID v6
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={
                    profilePicture 
                      ? URL.createObjectURL(profilePicture) 
                      : hasExistingProfilePicture && formData.profilePictureUrl 
                        ? formData.profilePictureUrl 
                        : undefined
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: colorTokens.brand,
                    fontSize: '2rem',
                    fontWeight: 700,
                    border: `4px solid ${colorTokens.brand}40`
                  }}
                >
                  {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                </Avatar>
                
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: 8,
                    bgcolor: colorTokens.brand,
                    color: colorTokens.textOnBrand,
                    '&:hover': {
                      bgcolor: colorTokens.brandHover,
                    }
                  }}
                >
                  <PhotoCameraIcon />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange('profilePicture')}
                  />
                </IconButton>
                
                {hasExistingProfilePicture && !profilePicture && (
                  <IconButton
                    onClick={() => handleDeleteExistingFile('profilePicture')}
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      left: 8,
                      bgcolor: colorTokens.danger,
                      color: colorTokens.neutral1200,
                      '&:hover': {
                        bgcolor: colorTokens.dangerHover,
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={inputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AlternateEmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={handleInputChange}
                  error={!!errors.whatsapp}
                  helperText={errors.whatsapp}
                  placeholder="+52 999 999 9999"
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    minDate={dayjs().subtract(120, 'year')}
                    slotProps={{
                      textField: {
                        error: !!errors.birthDate,
                        helperText: errors.birthDate,
                        sx: inputStyles
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
                    value={formData.gender || ''}
                    onChange={handleSelectChange}
                    label="Género"
                    sx={selectStyles}
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
                    value={formData.maritalStatus || ''}
                    onChange={handleSelectChange}
                    label="Estado Civil"
                    sx={selectStyles}
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
                    sx={selectStyles}
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
                <Grid size={{ xs: 12 }}>
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      bgcolor: colorTokens.warning,
                      color: colorTokens.neutral0,
                      border: `2px solid ${colorTokens.warning}`,
                      fontWeight: 600
                    }}
                  >
                    Este usuario es menor de edad. Se requiere autorización del tutor legal.
                  </Alert>
                </Grid>
              )}
              
              <Grid size={{ xs: 12 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: `${colorTokens.info}10`,
                  border: `1px solid ${colorTokens.info}40`
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: colorTokens.info, 
                    fontWeight: 600, 
                    mb: 2 
                  }}>
                    Opciones Adicionales
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.emailSent || false}
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
                        <Typography sx={{ color: colorTokens.neutral1200 }}>
                          Email de bienvenida enviado
                        </Typography>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.whatsappSent || false}
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
                        <Typography sx={{ color: colorTokens.neutral1200 }}>
                          WhatsApp de bienvenida enviado
                        </Typography>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.fingerprint || false}
                          onChange={handleSwitchChange('fingerprint')}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colorTokens.brand,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorTokens.brand,
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FingerprintIcon sx={{ color: colorTokens.brand }} />
                          <Typography sx={{ color: colorTokens.neutral1200 }}>
                            Huella dactilar registrada
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        if (formData.rol !== 'cliente') {
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
                  onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                  error={!!errors.address_street}
                  helperText={errors.address_street}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Número"
                  name="number"
                  value={addressData.number}
                  onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                  error={!!errors.address_number}
                  helperText={errors.address_number}
                  sx={inputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Colonia"
                  name="neighborhood"
                  value={addressData.neighborhood}
                  onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  error={!!errors.address_neighborhood}
                  helperText={errors.address_neighborhood}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  name="city"
                  value={addressData.city}
                  onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                  error={!!errors.address_city}
                  helperText={errors.address_city}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Estado"
                  name="state"
                  value={addressData.state}
                  onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                  error={!!errors.address_state}
                  helperText={errors.address_state}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  name="postalCode"
                  value={addressData.postalCode}
                  onChange={(e) => setAddressData(prev => ({ ...prev, postalCode: e.target.value }))}
                  error={!!errors.address_postalCode}
                  helperText={errors.address_postalCode}
                  placeholder="12345"
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MarkunreadMailboxIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        if (formData.rol !== 'cliente') {
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
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, name: e.target.value }))}
                  error={!!errors.emergency_name}
                  helperText={errors.emergency_name}
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={emergencyData.phone}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, phone: e.target.value }))}
                  error={!!errors.emergency_phone}
                  helperText={errors.emergency_phone}
                  placeholder="+52 999 999 9999"
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.emergency_bloodType}>
                  <InputLabel>Tipo de Sangre</InputLabel>
                  <Select
                    name="bloodType"
                    value={emergencyData.bloodType}
                    onChange={(e) => setEmergencyData(prev => ({ ...prev, bloodType: e.target.value }))}
                    label="Tipo de Sangre"
                    startAdornment={
                      <InputAdornment position="start">
                        <BloodtypeIcon />
                      </InputAdornment>
                    }
                    sx={selectStyles}
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

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Condición médica (opcional)"
                  name="medicalCondition"
                  multiline
                  rows={4}
                  value={emergencyData.medicalCondition}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, medicalCondition: e.target.value }))}
                  placeholder="Describe cualquier condición médica relevante, alergias, medicamentos, etc."
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        if (formData.rol !== 'cliente') {
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
                  onChange={(e) => setMembershipData(prev => ({ ...prev, referredBy: e.target.value }))}
                  placeholder="Nombre de quien te recomendó"
                  sx={inputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Nivel de Entrenamiento</InputLabel>
                  <Select
                    name="trainingLevel"
                    value={membershipData.trainingLevel}
                    onChange={(e) => setMembershipData(prev => ({ ...prev, trainingLevel: e.target.value }))}
                    label="Nivel de Entrenamiento"
                    sx={selectStyles}
                  >
                    <MenuItem value="principiante">Principiante</MenuItem>
                    <MenuItem value="intermedio">Intermedio</MenuItem>
                    <MenuItem value="avanzado">Avanzado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={membershipData.receivePlans}
                      onChange={(e) => setMembershipData(prev => ({ ...prev, receivePlans: e.target.checked }))}
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
                      Recibir planes de entrenamiento por email
                    </Typography>
                  }
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Motivación principal"
                  name="mainMotivation"
                  multiline
                  rows={4}
                  value={membershipData.mainMotivation}
                  onChange={(e) => setMembershipData(prev => ({ ...prev, mainMotivation: e.target.value }))}
                  error={!!errors.membership_mainMotivation}
                  helperText={errors.membership_mainMotivation}
                  placeholder="¿Cuál es tu objetivo principal? (ej: perder peso, ganar músculo, mejorar resistencia...)"
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{
                  background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
                  border: `2px solid #9C27B040`,
                }}>
                  <CardContent>
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
                      {hasExistingSignature && (
                        <Chip 
                          label="Existente" 
                          size="small" 
                          sx={{ 
                            bgcolor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            ml: 1
                          }} 
                        />
                      )}
                      {signature && (
                        <Chip 
                          label="Nueva" 
                          size="small" 
                          sx={{ 
                            bgcolor: `${colorTokens.warning}20`,
                            color: colorTokens.warning,
                            ml: 1
                          }} 
                        />
                      )}
                    </Typography>
                    
                    {signature ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img
                          src={URL.createObjectURL(signature)}
                          alt="Nueva firma"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            border: `2px solid ${colorTokens.warning}`,
                            borderRadius: 8
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          mt: 1, 
                          color: colorTokens.warning,
                          fontWeight: 600
                        }}>
                          Nueva firma seleccionada
                        </Typography>
                      </Box>
                    ) : hasExistingSignature && formData.signatureUrl ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img
                          src={formData.signatureUrl}
                          alt="Firma actual"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            border: `1px solid ${colorTokens.neutral400}`,
                            borderRadius: 8
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          mt: 1, 
                          color: colorTokens.success,
                          fontWeight: 600
                        }}>
                          Firma actual
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        border: `2px dashed ${colorTokens.neutral400}`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: colorTokens.neutral600, mb: 1 }} />
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          No hay firma registrada
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{
                          color: '#9C27B0',
                          borderColor: '#9C27B0',
                          '&:hover': {
                            bgcolor: '#9C27B010'
                          }
                        }}
                      >
                        {hasExistingSignature ? 'Cambiar Firma' : 'Subir Firma'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleFileChange('signature')}
                        />
                      </Button>
                      
                      {hasExistingSignature && !signature && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => window.open(formData.signatureUrl, '_blank')}
                            fullWidth
                            sx={{
                              color: colorTokens.info,
                              borderColor: colorTokens.info,
                              '&:hover': {
                                bgcolor: `${colorTokens.info}10`
                              }
                            }}
                          >
                            Ver Firma Actual
                          </Button>
                          
                          <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteExistingFile('signature')}
                            fullWidth
                            sx={{
                              color: colorTokens.danger,
                              borderColor: colorTokens.danger,
                              '&:hover': {
                                bgcolor: `${colorTokens.danger}10`
                              }
                            }}
                          >
                            Eliminar Firma
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{
                  background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
                  border: `2px solid ${colorTokens.info}40`,
                }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ 
                      color: colorTokens.info, 
                      fontWeight: 600, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <DescriptionIcon />
                      Contrato PDF
                      {hasExistingContract && (
                        <Chip 
                          label="Generado" 
                          size="small" 
                          sx={{ 
                            bgcolor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            ml: 1
                          }} 
                        />
                      )}
                    </Typography>
                    
                    {hasExistingContract && formData.contractPdfUrl ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <DescriptionIcon sx={{ fontSize: 64, color: colorTokens.info, mb: 1 }} />
                        <Typography variant="body2" sx={{ color: colorTokens.neutral1000 }}>
                          Contrato generado
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.neutral800 }}>
                          {formData.firstName} {formData.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          color: colorTokens.success,
                          fontWeight: 600,
                          mt: 1
                        }}>
                          Disponible para descarga
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        border: `2px dashed ${colorTokens.neutral400}`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        mb: 2
                      }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: colorTokens.neutral600, mb: 1 }} />
                        <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                          No hay contrato generado
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.neutral800 }}>
                          Se generará automáticamente al guardar
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                      {hasExistingContract && formData.contractPdfUrl ? (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<DescriptionIcon />}
                            onClick={() => window.open(formData.contractPdfUrl, '_blank')}
                            fullWidth
                            sx={{
                              bgcolor: colorTokens.info,
                              '&:hover': {
                                bgcolor: colorTokens.infoHover
                              }
                            }}
                          >
                            Ver Contrato
                          </Button>
                          
                          <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteExistingFile('contract')}
                            fullWidth
                            sx={{
                              color: colorTokens.danger,
                              borderColor: colorTokens.danger,
                              '&:hover': {
                                bgcolor: `${colorTokens.danger}10`
                              }
                            }}
                          >
                            Eliminar Contrato
                          </Button>
                        </>
                      ) : (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          El contrato se generará automáticamente al guardar el usuario.
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
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
          {hasChanges && (
            <Chip
              icon={<UpdateIcon />}
              label="Cambios pendientes"
              size="small"
              sx={{
                bgcolor: `${colorTokens.warning}20`,
                color: colorTokens.warning,
                border: `1px solid ${colorTokens.warning}40`,
                fontWeight: 600
              }}
            />
          )}
          
          {hasExistingProfilePicture && (
            <Chip
              icon={<PhotoCameraIcon />}
              label="Foto"
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`
              }}
            />
          )}
          
          {hasExistingSignature && (
            <Chip
              icon={<AssignmentIcon />}
              label="Firma"
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`
              }}
            />
          )}
          
          {hasExistingContract && (
            <Chip
              icon={<DescriptionIcon />}
              label="PDF"
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`
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

      <DialogContent sx={{ p: 0 }}>
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
                      bgcolor: `${colorTokens.brand}10`
                    }
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
              }
            }}
          >
            Cancelar
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || fileUploading}
            startIcon={
              loading || fileUploading ? (
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
              }
            }}
          >
            {loading || fileUploading
              ? 'Guardando...'
              : user 
                ? 'Actualizar Usuario'
                : 'Crear Usuario'
            }
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialogOptimized;