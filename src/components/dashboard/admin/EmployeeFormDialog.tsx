'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Avatar,
  IconButton,
  Typography,
  InputAdornment,
  Divider,
  useMediaQuery,
  useTheme,
  FormHelperText,
  CircularProgress,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Skeleton,
  Chip,
  Snackbar,
  Slide,
  Tooltip,
  LinearProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import PhoneIcon from '@mui/icons-material/Phone';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import UpdateIcon from '@mui/icons-material/Update';
import DeleteIcon from '@mui/icons-material/Delete';
import FingerPrintIcon from '@mui/icons-material/Fingerprint';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// IMPORTAR COMPONENTES
import FingerprintRegistration from './FingerprintRegistration';
import PhotoCapture from '@/components/registro/PhotoCapture';

// ✅ IMPORTAR HOOK DE GESTION DE HUELLAS
import { useFingerprintManagement } from '@/hooks/useFingerprintManagement';

// DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  iconDefault: '#FFFFFF',
  iconMuted: '#AAAAAA',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  successDark: '#1B5E20',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  errorDark: '#8B0000',
  warning: '#FFB300',
  warningHover: '#E6A700',
  warningDark: '#CC9200',
  info: '#1976D2',
  infoHover: '#1565C0',
  infoDark: '#0D47A1',
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800',
  roleStaff: '#FF9800',
  roleStaffHover: '#F57C00',
};

// INTERFACES
interface Employee {
  id?: string;
  user_id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: string;
  profilePictureUrl?: string;
  fingerprint: boolean;
}

// ⚠️ INTERFAZ REMOVIDA - Ahora se usa el hook useFingerprintManagement
// que ya incluye esta interfaz internamente

interface ImageState {
  url: string;
  fileName: string;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  isFromStorage: boolean;
}

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employeeData: any) => Promise<void>;
}

// FUNCIONES UTILITARIAS
const uploadFileToStorage = async (
  file: File,
  userId: string,
  fileType: 'profile'
): Promise<{ url: string; path: string } | null> => {
  try {
    console.log(`📤 Subiendo ${fileType} para empleado ${userId}`);
    
    const supabase = createBrowserSupabaseClient();
    
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${fileType}-${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      throw new Error('Error obteniendo URL pública');
    }
    
    console.log(`✅ ${fileType} subido exitosamente`);
    
    return {
      url: publicUrlData.publicUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error(`💥 Error subiendo ${fileType}:`, error);
    throw error;
  }
};

const getNextDeviceUserId = async (): Promise<number> => {
  try {
    const response = await fetch('/api/biometric/get-next-device-id?userType=empleado');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Siguiente ID para empleado:', data.nextId);
      return data.nextId;
    }
  } catch (error) {
    console.error('❌ Error obteniendo ID:', error);
  }
  
  return Math.floor(Math.random() * 20) + 7000;
};

export default function EmployeeFormDialog({ open, onClose, employee, onSave }: EmployeeFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // REFERENCIAS
  const mountedRef = useRef(true);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const savingRef = useRef(false);
  
  // ESTADOS PRINCIPALES
  const [formData, setFormData] = useState<Employee>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    hireDate: '',
    status: 'activo',
    fingerprint: false
  });
  
  const [originalFormData, setOriginalFormData] = useState<Employee>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    hireDate: '',
    status: 'activo',
    fingerprint: false
  });

  // ✅ USAR HOOK DE GESTION DE HUELLAS (reemplaza estado manual)
  const {
    fingerprintState,
    fingerprintDialogOpen,
    handleFingerprintDialogOpen,
    handleFingerprintDialogClose,
    handleFingerprintDataReady,
    handleDeleteFingerprint,
    handleDeleteAllFingerprints,
    processPendingFingerprint,
    hasPendingFingerprint,
    isSyncing: isFingerprintSyncing
  } = useFingerprintManagement({
    userId: formData.user_id || employee?.user_id,
    onFingerprintChange: (hasFingerprint) => {
      setFormData(prev => ({ ...prev, fingerprint: hasFingerprint }));
      setHasFormChanges(true);
    },
    onError: (message) => {
      setErrors(prev => ({ ...prev, fingerprint: message }));
    },
    onSuccess: (message) => {
      console.log('✅ [EMPLOYEE] Huella procesada:', message);
    }
  });
  
  // ESTADOS DE CONTROL
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeStep, setActiveStep] = useState(0);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  
  // ESTADOS DE IMAGEN
  const [profileImage, setProfileImage] = useState<ImageState>({
    url: '',
    fileName: '',
    isLoading: false,
    isValid: false,
    error: null,
    isFromStorage: false
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [hireDate, setHireDate] = useState<dayjs.Dayjs | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // ESTADOS PARA DIALOGS
  // ⚠️ fingerprintDialogOpen REMOVIDO - Viene del hook useFingerprintManagement
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  // ⚠️ isDeletingFingerprint REMOVIDO - Viene del hook useFingerprintManagement
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // FUNCIONES DE LIMPIEZA
  const cleanupBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
      console.log('🧹 Blob URL limpiada:', url.substring(0, 50) + '...');
    }
  }, []);

  const cleanupAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current.clear();
    console.log('🧹 Todas las Blob URLs limpiadas');
  }, []);

  // FUNCIÓN PARA DESCARGAR IMAGEN DESDE STORAGE
  const downloadImageFromStorage = async (fileName: string, userId: string) => {
    if (!fileName || !mountedRef.current) return;
    
    setProfileImage(prev => ({
      ...prev,
      fileName: fileName,
      isLoading: true,
      isValid: false,
      error: null,
      isFromStorage: true
    }));
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      const publicUrlPath = `${userId}/${fileName}`;
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(publicUrlPath);
      
      if (publicUrlData?.publicUrl) {
        console.log(`📸 Usando URL pública para foto empleado:`, publicUrlData.publicUrl);
        
        try {
          const testResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            setProfileImage(prev => ({
              ...prev,
              url: publicUrlData.publicUrl,
              isLoading: false,
              isValid: true,
              error: null,
              isFromStorage: true
            }));

            setProfilePicturePreview(publicUrlData.publicUrl);
            setFormData(prev => ({ 
              ...prev, 
              profilePictureUrl: publicUrlData.publicUrl 
            }));
            
            console.log(`✅ Foto empleado cargada con URL pública`);
            return;
          }
        } catch (testError) {
          console.warn(`⚠️ URL pública no accesible, intentando descarga`);
        }
      }
      
      // FALLBACK: Descargar archivo
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(publicUrlPath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando archivo: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        cleanupBlobUrl(objectUrl);
        return;
      }
      
      setProfileImage(prev => ({
        ...prev,
        url: objectUrl,
        isLoading: false,
        isValid: true,
        error: null,
        isFromStorage: true
      }));

      setProfilePicturePreview(objectUrl);
      
      console.log(`✅ Foto empleado descargada como blob (fallback)`);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ Error cargando foto empleado:`, error);
      
      setProfileImage(prev => ({
        ...prev,
        isLoading: false,
        isValid: false,
        error: error.message,
        isFromStorage: true
      }));
    }
  };

  // CARGAR ARCHIVOS EXISTENTES
  const loadExistingFiles = async (userId: string | undefined) => {
    if (!mountedRef.current || initializedRef.current || !userId) return;
    
    try {
      console.log(`📂 Cargando archivos existentes para empleado: ${userId}`);
      
      const supabase = createBrowserSupabaseClient();
      
      const { data: files, error } = await supabase.storage
        .from('user-files')
        .list(userId, { 
          limit: 100, 
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' }
        });
      
      if (error) {
        throw new Error(`Error listando archivos: ${error.message}`);
      }
      
      console.log(`📁 Archivos encontrados:`, files?.length || 0);
      
      if (files && files.length > 0) {
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        
        if (latestProfile) {
          console.log('📸 Cargando foto de perfil empleado:', latestProfile.name);
          await downloadImageFromStorage(latestProfile.name, userId);
        }
      }
      
      if (mountedRef.current) {
        setInitializationComplete(true);
        initializedRef.current = true;
        console.log('✅ Carga de archivos empleado completada');
      }
      
    } catch (error: any) {
      if (mountedRef.current) {
        console.error('💥 Error cargando archivos empleado:', error);
        setErrors(prev => ({
          ...prev,
          fileLoading: `Error cargando archivos: ${error.message}`
        }));
        setInitializationComplete(true);
        initializedRef.current = true;
      }
    }
  };

  // MANEJADORES DE EVENTOS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'salary' ? parseFloat(value) || 0 : value
      }));
      
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
  
  const handleHireDateChange = (value: dayjs.Dayjs | Date | string | null | undefined) => {
    // Convertir el valor a Dayjs independientemente del formato
    let date: dayjs.Dayjs | null = null;
    
    if (value) {
      if (dayjs.isDayjs(value)) {
        date = value;
      } else if (value instanceof Date) {
        date = dayjs(value);
      } else if (typeof value === 'string') {
        date = dayjs(value);
      }
    }
    
    setHireDate(date);
    
    if (date && date.isValid()) {
      setFormData(prev => ({
        ...prev,
        hireDate: date.format('YYYY-MM-DD')
      }));
      
      if (errors.hireDate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.hireDate;
          return newErrors;
        });
      }
    }
  };

  // MANEJO DE ARCHIVOS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    console.log(`📁 Foto empleado seleccionada:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        profilePicture: 'El archivo debe ser una imagen'
      }));
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        profilePicture: 'La imagen no debe exceder 5MB'
      }));
      e.target.value = '';
      return;
    }
    
    // Limpiar errores
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.profilePicture;
      return newErrors;
    });
    
    // Limpiar blob URL anterior
    if (profilePicturePreview) {
      cleanupBlobUrl(profilePicturePreview);
    }
    
    // Crear nueva blob URL
    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(objectUrl);
    
    setProfilePicture(file);
    setProfilePicturePreview(objectUrl);
    setProfileImage(prev => ({
      ...prev,
      url: objectUrl,
      isLoading: false,
      isValid: true,
      error: null,
      isFromStorage: false
    }));
    
    setHasFormChanges(true);
    console.log('🔄 Foto empleado pendiente de subida');
    
    e.target.value = '';
  };

  // FUNCIONES DE CAPTURA DE FOTO
  const handlePhotoCaptureOpen = () => {
    setPhotoCaptureOpen(true);
  };

  const handlePhotoCaptureClose = () => {
    setPhotoCaptureOpen(false);
  };

  const handlePhotoCapture = (file: File) => {
    console.log('📸 Foto capturada desde cámara:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Limpiar errores previos
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.profilePicture;
      return newErrors;
    });

    // Limpiar blob URL anterior
    if (profilePicturePreview) {
      cleanupBlobUrl(profilePicturePreview);
    }

    // Crear nueva blob URL
    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(objectUrl);

    setProfilePicture(file);
    setProfilePicturePreview(objectUrl);
    setProfileImage(prev => ({
      ...prev,
      url: objectUrl,
      isLoading: false,
      isValid: true,
      error: null,
      isFromStorage: false
    }));

    setHasFormChanges(true);
    setPhotoCaptureOpen(false);
    
    console.log('✅ Foto desde cámara lista para subir');
  };

  // ⚠️ FUNCIONES DE HUELLA REMOVIDAS - Ahora se usan del hook useFingerprintManagement
  // - handleFingerprintError -> Gestionado internamente por el hook
  // - handleFingerprintDialogOpen -> Viene del hook
  // - handleFingerprintDialogClose -> Viene del hook
  // - handleFingerprintDataReady -> Viene del hook

  // VALIDACIÓN
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'El puesto es obligatorio';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es obligatorio';
    }
    
    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = 'El salario debe ser mayor a 0';
    }
    
    if (!formData.hireDate) {
      newErrors.hireDate = 'La fecha de contratación es obligatoria';
    }
    
    if (!formData.status) {
      newErrors.status = 'El estatus es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FUNCIÓN DE GUARDADO
  const handleSubmit = async () => {
    if (savingRef.current) {
      console.log('⚠️ Ya se está guardando, ignorando...');
      return;
    }
    
    try {
      savingRef.current = true;
      setLoading(true);
      setIsSavingChanges(true);
      
      console.log('🚀 Iniciando guardado de empleado...');
      
      if (!validateForm()) {
        setLoading(false);
        setIsSavingChanges(false);
        savingRef.current = false;
        return;
      }
      
      const userId = formData.user_id || employee?.user_id || crypto.randomUUID();
      let updatedFormData = { ...formData, user_id: userId };
      
      // SUBIR FOTO SI ES NECESARIA
      if (profilePicture) {
        console.log('📤 Subiendo nueva foto de empleado...');
        
        try {
          // ✅ PASO 1: Eliminar foto anterior del storage si existe
          if (originalFormData.profilePictureUrl && profileImage.fileName) {
            console.log('🗑️ Eliminando foto anterior del storage...');
            const supabase = createBrowserSupabaseClient();
            const oldPath = `${userId}/${profileImage.fileName}`;
            
            const { error: deleteError } = await supabase.storage
              .from('user-files')
              .remove([oldPath]);
            
            if (deleteError) {
              console.warn('⚠️ No se pudo eliminar la foto anterior:', deleteError.message);
            } else {
              console.log('✅ Foto anterior eliminada del storage');
            }
          }
          
          // ✅ PASO 2: Subir nueva foto
          const uploadResult = await uploadFileToStorage(profilePicture, userId, 'profile');
          if (uploadResult) {
            updatedFormData.profilePictureUrl = uploadResult.url;
            console.log('✅ Nueva foto empleado subida');
            
            setProfilePicturePreview(uploadResult.url);
            setProfileImage(prev => ({
              ...prev,
              url: uploadResult.url,
              fileName: uploadResult.path.split('/').pop() || '',
              isFromStorage: true
            }));
          }
        } catch (error: any) {
          console.error('❌ Error subiendo foto empleado:', error);
          setErrors(prev => ({ ...prev, profilePicture: error.message }));
          throw error;
        }
      }
      
      // ✅ PROCESAR HUELLA PENDIENTE (sincronizar con F22)
      if (hasPendingFingerprint) {
        console.log('🖐️ [EMPLOYEE] Procesando huella pendiente de empleado...');
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        try {
          await processPendingFingerprint(fullName);
          console.log('✅ [EMPLOYEE] Huella sincronizada con F22');
        } catch (f22Error: any) {
          console.warn('⚠️ [EMPLOYEE] Error en F22, pero continuando guardado:', f22Error);
          // ⚠️ No bloquear el guardado si falla F22, solo advertir
        }
      }

      // PREPARAR DATOS FINALES
      const employeeData = {
        ...updatedFormData,
        fingerprintData: fingerprintState.pendingData
      };

      // GUARDAR EMPLEADO
      console.log('💾 Guardando empleado en BD...');
      await onSave(employeeData);
      console.log('✅ Empleado guardado en BD');
      
      // LIMPIAR ESTADOS
      setProfilePicture(null);
      cleanupAllBlobUrls();
      setFormData(updatedFormData);
      setOriginalFormData({...updatedFormData});
      setHasFormChanges(false);

      // ⚠️ ESTADO DE HUELLA - Gestionado automáticamente por el hook useFingerprintManagement

      setSaveSuccess(true);
      
      console.log('🎉 Proceso de empleado completado exitosamente');
      
    } catch (error: any) {
      console.error('💥 Error crítico guardando empleado:', error);
      setErrors({ submit: error.message || 'Error al guardar empleado' });
    } finally {
      setLoading(false);
      setIsSavingChanges(false);
      savingRef.current = false;
    }
  };

  // DETECCIÓN DE CAMBIOS
  const detectChanges = useCallback(() => {
    if (!initializationComplete) return false;

    const fieldsToCompare = [
      'firstName', 'lastName', 'email', 'phone', 'position',
      'department', 'salary', 'hireDate', 'status', 'fingerprint'
    ];

    const dataChanged = fieldsToCompare.some(field => {
      const current = formData[field as keyof Employee];
      const original = originalFormData[field as keyof Employee];
      return current !== original;
    });

    const newFilesAdded = profilePicture !== null;
    // ✅ Usar hasPendingFingerprint del hook
    const fingerprintPending = hasPendingFingerprint;

    return dataChanged || newFilesAdded || fingerprintPending;
  }, [formData, originalFormData, profilePicture, hasPendingFingerprint, initializationComplete]);

  // useEffect para detectar cambios
  useEffect(() => {
    const changes = detectChanges();
    if (changes !== hasFormChanges) {
      setHasFormChanges(changes);
    }
  }, [detectChanges, hasFormChanges]);

  // INICIALIZACIÓN
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    
    // Para nuevo empleado (sin datos)
    if (!employee) {
      console.log('🆕 [INIT] Inicializando nuevo empleado...');
      const emptyEmployee = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        salary: 0,
        hireDate: '',
        status: 'activo',
        fingerprint: false
      };
      setFormData(emptyEmployee);
      setOriginalFormData(emptyEmployee);
      setInitializationComplete(true);
      return;
    }
    
    // Para empleado existente - evitar re-inicialización
    if (initializedRef.current) {
      return;
    }
    
    mountedRef.current = true;
    
    const initializeEmployee = async () => {
      console.log('✏️ [INIT] Inicializando edición de empleado:', employee.firstName, employee.lastName);
      
      setInitializationComplete(false);
      setErrors({});
      setHasFormChanges(false);
      
      cleanupAllBlobUrls();
      
      setProfileImage({
        url: '',
        fileName: '',
        isLoading: false,
        isValid: false,
        error: null,
        isFromStorage: false
      });
      
      setProfilePicturePreview('');
      setProfilePicture(null);

      // ⚠️ Estado de huella - Gestionado por el hook useFingerprintManagement
      
      // CARGAR DATOS DEL EMPLEADO EXISTENTE
      console.log('📋 [INIT] Cargando datos del empleado:', {
        id: employee.id,
        user_id: employee.user_id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position
      });
      
      const employeeData = {
        id: employee.id,
        user_id: employee.user_id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary || 0,
        hireDate: employee.hireDate || '',
        status: employee.status || 'activo',
        profilePictureUrl: employee.profilePictureUrl || undefined,
        fingerprint: employee.fingerprint || false
      };
      
      console.log('📝 [INIT] Datos formateados:', employeeData);
      
      setFormData(employeeData);
      setOriginalFormData({...employeeData});
      
      // Cargar fecha de contratación
      if (employee.hireDate) {
        console.log('📅 [INIT] Cargando fecha de contratación:', employee.hireDate);
        setHireDate(dayjs(employee.hireDate));
      } else {
        setHireDate(null);
      }
      
      // ⚠️ Estado de huella - El hook lo maneja automáticamente
      
      // Cargar archivos existentes si existe user_id
      if (employee.user_id) {
        console.log('📁 [INIT] Cargando archivos existentes...');
        await loadExistingFiles(employee.user_id);
      } else {
        console.warn('⚠️ [INIT] user_id no encontrado, saltando carga de archivos');
        setInitializationComplete(true);
        initializedRef.current = true;
      }
    };

    initializeEmployee();
    setActiveStep(0);
    
    return () => {
      mountedRef.current = false;
    };
  }, [employee, open]);

  // CLEANUP
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      initializedRef.current = false;
      savingRef.current = false;
      cleanupAllBlobUrls();
    };
  }, [cleanupAllBlobUrls]);

  // COMPONENTE AVATAR
  const ProfileAvatar = () => {
    if (!initializationComplete) {
      return (
        <Skeleton
          variant="circular"
          width={100}
          height={100}
          sx={{ 
            bgcolor: darkProTokens.grayMedium,
            mx: 'auto',
            mb: 2
          }}
        />
      );
    }
    
    const getCurrentImageUrl = () => {
      if (profilePicture && profilePicturePreview) {
        return profilePicturePreview;
      }
      
      if (profileImage.isValid && profileImage.url) {
        return profileImage.url;
      }
      
      if (formData.profilePictureUrl && !formData.profilePictureUrl.startsWith('blob:')) {
        return formData.profilePictureUrl;
      }
      
      return undefined;
    };
    
    const currentImageUrl = getCurrentImageUrl();
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'relative',
            background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaffHover})`,
            borderRadius: '50%',
            padding: '3px',
            boxShadow: `0 6px 20px ${darkProTokens.roleStaff}40`
          }}>
            <Avatar 
              src={currentImageUrl}
              sx={{ 
                width: 100, 
                height: 100,
                border: `2px solid ${darkProTokens.surfaceLevel1}`,
                fontSize: '2rem',
                fontWeight: 'bold',
                bgcolor: darkProTokens.surfaceLevel2,
                color: darkProTokens.roleStaff,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              {formData.firstName && formData.firstName[0].toUpperCase()}
            </Avatar>
          </Box>
          
          {profilePicture && (
            <Chip
              icon={<UpdateIcon />}
              label="Pendiente"
              size="small"
              sx={{
                position: 'absolute',
                top: -6,
                left: -6,
                bgcolor: darkProTokens.warning,
                color: darkProTokens.background,
                fontSize: '0.65rem',
                height: 20,
                border: `1px solid ${darkProTokens.warningHover}`,
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                },
                animation: 'pulse 2s infinite'
              }}
            />
          )}

          {/* Botón para subir desde archivo */}
          <Tooltip title="Subir desde archivo">
            <IconButton 
              sx={{ 
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.roleStaffHover})`,
                color: darkProTokens.background,
                width: 32,
                height: 32,
                border: `2px solid ${darkProTokens.surfaceLevel1}`,
                boxShadow: `0 3px 15px ${darkProTokens.roleStaff}40`,
                '&:hover': { 
                  background: `linear-gradient(135deg, ${darkProTokens.roleStaffHover}, ${darkProTokens.roleStaff})`,
                  transform: 'scale(1.1)',
                  boxShadow: `0 4px 20px ${darkProTokens.roleStaff}60`,
                },
                transition: 'all 0.2s ease'
              }}
              component="label"
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleFileChange}
              />
              <PhotoCamera sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Botón para capturar desde cámara */}
          <Tooltip title="Capturar desde cámara">
            <IconButton 
              onClick={handlePhotoCaptureOpen}
              sx={{ 
                position: 'absolute',
                bottom: 0,
                right: 40,
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                width: 32,
                height: 32,
                border: `2px solid ${darkProTokens.surfaceLevel1}`,
                boxShadow: `0 3px 15px ${darkProTokens.primary}40`,
                '&:hover': { 
                  background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primary})`,
                  transform: 'scale(1.1)',
                  boxShadow: `0 4px 20px ${darkProTokens.primary}60`,
                },
                transition: 'all 0.2s ease'
              }}
            >
              <PhotoCamera sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // COMPONENTE DE CONTROL DE HUELLA
  const FingerprintControl = () => {
    const hasFingerprintInDB = formData.fingerprint;
    const hasPendingFp = hasPendingFingerprint; // Del hook
    const isSyncing = isFingerprintSyncing; // Del hook
    
    const getStatusColor = () => {
      if (hasFingerprintInDB) return darkProTokens.success;
      if (hasPendingFp) return darkProTokens.warning;
      return darkProTokens.error;
    };

    const getStatusIcon = () => {
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'success') {
        return <VerifiedIcon sx={{ color: darkProTokens.success, fontSize: '1rem' }} />;
      }
      if (hasFingerprintInDB) {
        return <SecurityIcon sx={{ color: darkProTokens.info, fontSize: '1rem' }} />;
      }
      if (hasPendingFp) {
        return <AccessTimeIcon sx={{ color: darkProTokens.warning, fontSize: '1rem' }} />;
      }
      return <ErrorIcon sx={{ color: darkProTokens.error, fontSize: '1rem' }} />;
    };

    const getStatusText = () => {
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'success') {
        return 'Empleado registrado + F22 sincronizado';
      }
      if (hasFingerprintInDB) {
        return 'Empleado registrado en BD';
      }
      if (hasPendingFp) {
        return 'Huella capturada - Pendiente de guardar';
      }
      return 'Sin huella registrada';
    };
    
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderRadius: 2,
        border: `2px solid ${getStatusColor()}40`,
        bgcolor: `${getStatusColor()}10`,
        transition: 'all 0.3s ease'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            bgcolor: getStatusColor(),
            color: darkProTokens.textPrimary,
            width: 36,
            height: 36
          }}>
            <FingerPrintIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ 
              color: darkProTokens.textPrimary, 
              fontWeight: 600,
              mb: 0.5
            }}>
              Huella Dactilar Empleado (F22)
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon()}
              <Typography variant="caption" sx={{ 
                color: getStatusColor(), 
                fontWeight: 500 
              }}>
                {getStatusText()}
              </Typography>
            </Box>
            
            {fingerprintState.message && (
              <Typography variant="caption" sx={{ 
                color: darkProTokens.textSecondary,
                fontSize: '0.7rem',
                display: 'block',
                mt: 0.5
              }}>
                {fingerprintState.message}
              </Typography>
            )}
            
            {fingerprintState.error && (
              <Typography variant="caption" sx={{ 
                color: darkProTokens.error,
                fontSize: '0.7rem',
                display: 'block',
                mt: 0.5
              }}>
                {fingerprintState.error}
              </Typography>
            )}
            
            {hasPendingFp && (
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  icon={<UpdateIcon />}
                  label={`${fingerprintState.fingerName || 'Huella'} lista para guardar`}
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary,
                    border: `1px solid ${darkProTokens.primary}40`,
                    fontSize: '0.7rem',
                    height: 18,
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                    },
                    animation: 'pulse 2s infinite'
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <Tooltip title={hasFingerprintInDB ? "Reemplazar huella empleado" : "Registrar huella empleado"}>
            <Button
              variant="contained"
              size="small"
              onClick={handleFingerprintDialogOpen}
              disabled={!formData.user_id && !employee?.user_id || isSyncing}
              startIcon={
                isSyncing ? <CircularProgress size={14} /> : <FingerPrintIcon />
              }
              sx={{
                bgcolor: hasFingerprintInDB ? darkProTokens.info : darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 600,
                px: 2,
                minWidth: '110px',
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: hasFingerprintInDB ? darkProTokens.infoHover : darkProTokens.primaryHover,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 3px 12px ${hasFingerprintInDB ? darkProTokens.info : darkProTokens.primary}40`
                },
                '&:disabled': {
                  bgcolor: darkProTokens.grayMedium,
                  color: darkProTokens.textDisabled
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isSyncing ? 'Sincronizando...' : hasFingerprintInDB ? 'Reemplazar' : 'Registrar'}
            </Button>
          </Tooltip>

          {hasFingerprintInDB && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Eliminar huella específica del empleado">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDeleteFingerprint}
                  disabled={isSyncing}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderColor: darkProTokens.error,
                    color: darkProTokens.error,
                    fontSize: '0.7rem',
                    px: 1,
                    minWidth: '90px',
                    '&:hover': {
                      bgcolor: `${darkProTokens.error}20`,
                      borderColor: darkProTokens.errorHover,
                      color: darkProTokens.errorHover
                    },
                    '&:disabled': {
                      borderColor: darkProTokens.grayMedium,
                      color: darkProTokens.textDisabled
                    }
                  }}
                >
                  Eliminar
                </Button>
              </Tooltip>

              <Tooltip title="Eliminar TODAS las huellas del empleado">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDeleteAllFingerprints}
                  disabled={isSyncing}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderColor: darkProTokens.warning,
                    color: darkProTokens.warning,
                    fontSize: '0.7rem',
                    px: 1,
                    minWidth: '100px',
                    '&:hover': {
                      bgcolor: `${darkProTokens.warning}20`,
                      borderColor: darkProTokens.warningHover,
                      color: darkProTokens.warningHover
                    },
                    '&:disabled': {
                      borderColor: darkProTokens.grayMedium,
                      color: darkProTokens.textDisabled
                    }
                  }}
                >
                  Todas
                </Button>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // ESTILOS PARA INPUTS
  const darkProInputStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: darkProTokens.surfaceLevel1,
      color: darkProTokens.textPrimary,
      '& fieldset': { 
        borderColor: darkProTokens.borderDefault, 
        borderWidth: '2px' 
      },
      '&:hover fieldset': { 
        borderColor: darkProTokens.borderHover 
      },
      '&.Mui-focused fieldset': { 
        borderColor: darkProTokens.primary,
        boxShadow: `0 0 0 3px ${darkProTokens.focusRing}`
      },
      '&.Mui-error fieldset': {
        borderColor: darkProTokens.error
      },
      transition: 'all 0.2s ease'
    },
    '& .MuiInputLabel-root': { 
      color: darkProTokens.textSecondary,
      '&.Mui-focused': {
        color: darkProTokens.primary
      },
      '&.Mui-error': {
        color: darkProTokens.error
      }
    },
    '& .MuiFormHelperText-root': { 
      color: darkProTokens.error,
      fontWeight: 500
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: darkProTokens.iconMuted
    }
  };

  const darkProSelectStyles = {
    bgcolor: darkProTokens.surfaceLevel1,
    color: darkProTokens.textPrimary,
    '& .MuiOutlinedInput-notchedOutline': { 
      borderColor: darkProTokens.borderDefault, 
      borderWidth: '2px' 
    },
    '&:hover .MuiOutlinedInput-notchedOutline': { 
      borderColor: darkProTokens.borderHover 
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
      borderColor: darkProTokens.primary,
      boxShadow: `0 0 0 3px ${darkProTokens.focusRing}`
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: darkProTokens.error
    },
    '& .MuiSvgIcon-root': { 
      color: darkProTokens.iconMuted 
    },
    transition: 'all 0.2s ease'
  };

  const darkProMenuProps = {
    PaperProps: {
      sx: {
        bgcolor: darkProTokens.surfaceLevel3,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 32px ${darkProTokens.background}80`,
        '& .MuiMenuItem-root': {
          color: darkProTokens.textPrimary,
          '&:hover': { 
            bgcolor: darkProTokens.hoverOverlay 
          },
          '&.Mui-selected': {
            bgcolor: `${darkProTokens.primary}20`,
            '&:hover': { 
              bgcolor: `${darkProTokens.primary}30` 
            }
          }
        }
      }
    }
  };

  // NAVEGACIÓN DE PASOS
  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // RENDERIZADO DE CONTENIDO POR PASO
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <ProfileAvatar />
            
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
                  label="Teléfono"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
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
                <TextField
                  fullWidth
                  label="Puesto"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  error={!!errors.position}
                  helperText={errors.position}
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
                  label="Departamento"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  error={!!errors.department}
                  helperText={errors.department}
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
                  label="Salario"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  error={!!errors.salary}
                  helperText={errors.salary}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={darkProInputStyles}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Contratación"
                    value={hireDate}
                    onChange={handleHireDateChange}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        error: !!errors.hireDate,
                        helperText: errors.hireDate,
                        sx: darkProInputStyles,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarTodayIcon />
                            </InputAdornment>
                          ),
                        }
                      }
                    }}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Estatus</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Estatus"
                    sx={darkProSelectStyles}
                    MenuProps={darkProMenuProps}
                  >
                    <MenuItem value="activo">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: darkProTokens.success }} />
                        Activo
                      </Box>
                    </MenuItem>
                    <MenuItem value="inactivo">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon fontSize="small" sx={{ color: darkProTokens.error }} />
                        Inactivo
                      </Box>
                    </MenuItem>
                    <MenuItem value="suspendido">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon fontSize="small" sx={{ color: darkProTokens.warning }} />
                        Suspendido
                      </Box>
                    </MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.roleStaff, 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AssignmentIcon />
              Archivos y Huella Dactilar
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${darkProTokens.roleStaff}40`,
                  bgcolor: `${darkProTokens.roleStaff}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: darkProTokens.roleStaff, 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PhotoCamera />
                    Foto de Perfil Empleado
                  </Typography>
                  
                  <ProfileAvatar />
                  
                  {errors.profilePicture && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        bgcolor: darkProTokens.errorDark,
                        color: darkProTokens.textPrimary,
                        border: `2px solid ${darkProTokens.error}`,
                        '& .MuiAlert-icon': { 
                          color: darkProTokens.textPrimary 
                        },
                        fontWeight: 600
                      }}
                    >
                      {errors.profilePicture}
                    </Alert>
                  )}
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${darkProTokens.primary}40`,
                  bgcolor: `${darkProTokens.primary}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FingerPrintIcon />
                    Huella Dactilar Empleado
                  </Typography>
                  
                  <FingerprintControl />
                  
                  {errors.fingerprint && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        bgcolor: darkProTokens.errorDark,
                        color: darkProTokens.textPrimary,
                        border: `2px solid ${darkProTokens.error}`,
                        '& .MuiAlert-icon': { 
                          color: darkProTokens.textPrimary 
                        },
                        fontWeight: 600
                      }}
                    >
                      {errors.fingerprint}
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const steps = ['Información del Empleado', 'Archivos y Huella'];

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (hasFormChanges) {
          if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
            onClose();
          }
        } else {
          onClose();
        }
      }}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          color: darkProTokens.textPrimary,
          maxHeight: '95vh'
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${darkProTokens.grayDark}`,
        bgcolor: `${darkProTokens.roleStaff}15`,
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RocketLaunchIcon sx={{ color: darkProTokens.roleStaff, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
              {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              {employee ? `Modificando: ${employee.firstName} ${employee.lastName}` : 'Creando nuevo perfil de empleado'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasFormChanges && (
            <Chip
              icon={<UpdateIcon />}
              label={
                hasPendingFingerprint ?
                'Cambios + Huella pendiente' :
                'Cambios pendientes'
              }
              size="small"
              sx={{
                bgcolor: `${darkProTokens.warning}20`,
                color: darkProTokens.warning,
                border: `1px solid ${darkProTokens.warning}40`,
                fontWeight: 600,
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                },
                animation: 'pulse 2s infinite'
              }}
            />
          )}

          {fingerprintState.syncStatus !== 'idle' && (
            <Tooltip title={
              fingerprintState.syncStatus === 'syncing' ? 'Sincronizando huella empleado con F22...' :
              fingerprintState.syncStatus === 'success' ? 'Huella empleado sincronizada correctamente' :
              'Error sincronizando huella empleado con F22'
            }>
              <Chip
                icon={
                  fingerprintState.syncStatus === 'syncing' ? 
                    <CircularProgress size={14} sx={{ color: darkProTokens.background }} /> :
                  fingerprintState.syncStatus === 'success' ? 
                    <CheckCircleIcon sx={{ fontSize: 14 }} /> :
                    <ErrorIcon sx={{ fontSize: 14 }} />
                }
                label={
                  fingerprintState.syncStatus === 'syncing' ? 'F22 Sync...' :
                  fingerprintState.syncStatus === 'success' ? 'F22 OK' :
                  'F22 Error'
                }
                size="small"
                sx={{
                  bgcolor: 
                    fingerprintState.syncStatus === 'syncing' ? darkProTokens.info :
                    fingerprintState.syncStatus === 'success' ? darkProTokens.success :
                    darkProTokens.error,
                  color: darkProTokens.background,
                  fontSize: '0.7rem',
                  height: 24,
                  fontWeight: 600,
                  ...(fingerprintState.syncStatus === 'syncing' && {
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                    },
                    animation: 'pulse 1.5s infinite'
                  })
                }}
              />
            </Tooltip>
          )}
          
          <IconButton 
            onClick={() => {
              if (hasFormChanges) {
                if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            sx={{ 
              color: darkProTokens.textSecondary,
              '&:hover': { 
                color: darkProTokens.textPrimary,
                bgcolor: darkProTokens.hoverOverlay
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
        {errors.submit && (
          <Alert 
            severity="error" 
            sx={{ 
              m: 3, 
              mb: 0,
              bgcolor: darkProTokens.errorDark,
              color: darkProTokens.textPrimary,
              border: `2px solid ${darkProTokens.error}`,
              '& .MuiAlert-icon': { 
                color: darkProTokens.textPrimary 
              },
              fontWeight: 600,
              boxShadow: `0 4px 20px ${darkProTokens.error}40`
            }}
          >
            {errors.submit}
          </Alert>
        )}
        
        {/* MENSAJES DE HUELLA */}
        {fingerprintState.message && (
          <Alert 
            severity="success" 
            sx={{ 
              m: 3, 
              mb: 0,
              bgcolor: darkProTokens.successDark,
              color: darkProTokens.textPrimary,
              border: `2px solid ${darkProTokens.success}`,
              fontWeight: 600,
              boxShadow: `0 4px 20px ${darkProTokens.success}40`,
              '& .MuiAlert-icon': { 
                color: darkProTokens.textPrimary 
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FingerPrintIcon />
              <Typography sx={{ fontWeight: 600 }}>
                {fingerprintState.message}
              </Typography>
            </Box>
          </Alert>
        )}

        {fingerprintState.error && (
          <Alert 
            severity="error" 
            sx={{ 
              m: 3, 
              mb: 0,
              bgcolor: darkProTokens.errorDark,
              color: darkProTokens.textPrimary,
              border: `2px solid ${darkProTokens.error}`,
              fontWeight: 600,
              boxShadow: `0 4px 20px ${darkProTokens.error}40`,
              '& .MuiAlert-icon': { 
                color: darkProTokens.textPrimary 
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon />
              <Typography sx={{ fontWeight: 600 }}>
                {fingerprintState.error}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* STEPPER */}
        <Box sx={{ p: 3 }}>
          <Stepper 
            activeStep={activeStep} 
            orientation={isMobile ? "vertical" : "horizontal"}
            sx={{
              '& .MuiStepLabel-label': { 
                color: darkProTokens.textSecondary,
                '&.Mui-active': { 
                  color: darkProTokens.roleStaff,
                  fontWeight: 600 
                },
                '&.Mui-completed': { 
                  color: darkProTokens.success,
                  fontWeight: 600 
                }
              },
              '& .MuiStepIcon-root': {
                color: darkProTokens.grayMedium,
                '&.Mui-active': { 
                  color: darkProTokens.roleStaff,
                  filter: `drop-shadow(0 0 8px ${darkProTokens.roleStaff}60)`
                },
                '&.Mui-completed': { 
                  color: darkProTokens.success,
                  filter: `drop-shadow(0 0 8px ${darkProTokens.success}60)`
                }
              },
              '& .MuiStepConnector-line': {
                borderColor: darkProTokens.grayDark
              },
              '& .Mui-completed .MuiStepConnector-line': {
                borderColor: darkProTokens.success
              },
              '& .Mui-active .MuiStepConnector-line': {
                borderColor: darkProTokens.roleStaff
              }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>
      </DialogContent>

      {/* ACCIONES */}
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${darkProTokens.grayDark}`,
        bgcolor: darkProTokens.surfaceLevel1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': {
                  color: darkProTokens.textPrimary,
                  bgcolor: darkProTokens.hoverOverlay
                },
                '&:disabled': {
                  color: darkProTokens.textDisabled
                }
              }}
            >
              Anterior
            </Button>
            
            {activeStep < steps.length - 1 && (
              <Button
                variant="outlined"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  borderColor: `${darkProTokens.roleStaff}60`,
                  color: darkProTokens.roleStaff,
                  '&:hover': {
                    borderColor: darkProTokens.roleStaff,
                    bgcolor: `${darkProTokens.roleStaff}10`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 15px ${darkProTokens.roleStaff}30`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Indicadores de cambios */}
          {(profilePicture || hasPendingFingerprint) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {profilePicture && (
                <Chip
                  icon={<UpdateIcon />}
                  label="Foto pendiente"
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.warning}20`,
                    color: darkProTokens.warning,
                    border: `1px solid ${darkProTokens.warning}40`,
                    fontSize: '0.75rem',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                    },
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}

              {hasPendingFingerprint && (
                <Chip
                  icon={<FingerPrintIcon />}
                  label={`${fingerprintState.fingerName || 'Huella'} capturada`}
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary,
                    border: `1px solid ${darkProTokens.primary}40`,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                    },
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
              
              {fingerprintState.syncStatus === 'syncing' && (
                <Chip
                  icon={<CircularProgress size={12} />}
                  label="Sincronizando F22..."
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.info}20`,
                    color: darkProTokens.info,
                    border: `1px solid ${darkProTokens.info}40`,
                    fontSize: '0.75rem',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                    },
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              )}
            </Box>
          )}
          
          <Button
            onClick={() => {
              if (hasFormChanges) {
                if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            disabled={loading || isSavingChanges}
            sx={{ 
              color: darkProTokens.textSecondary,
              '&:hover': { 
                color: darkProTokens.textPrimary, 
                bgcolor: darkProTokens.hoverOverlay 
              },
              '&:disabled': {
                color: darkProTokens.textDisabled
              }
            }}
          >
            Cancelar
          </Button>
          
          {/* BOTÓN PRINCIPAL DE GUARDADO */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              loading || 
              isSavingChanges || 
              !hasFormChanges || 
              fingerprintState.syncStatus === 'syncing' ||
              savingRef.current
            }
            startIcon={
              loading || isSavingChanges ? (
                <CircularProgress size={20} sx={{ color: darkProTokens.textPrimary }} />
              ) : (
                <SaveIcon />
              )
            }
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              boxShadow: `0 4px 20px ${darkProTokens.success}40`,
              minWidth: '160px',
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 25px ${darkProTokens.success}50`
              },
              '&:disabled': {
                bgcolor: darkProTokens.grayMedium,
                color: darkProTokens.textDisabled,
                boxShadow: 'none',
                transform: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading || isSavingChanges 
              ? 'Guardando...'
              : employee 
                ? 'Actualizar Empleado'
                : 'Crear Empleado'
            }
          </Button>
        </Box>
      </DialogActions>

      {/* SNACKBAR DE ÉXITO */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            bgcolor: darkProTokens.successDark,
            color: darkProTokens.textPrimary,
            border: `2px solid ${darkProTokens.success}`,
            boxShadow: `0 8px 32px ${darkProTokens.success}40`,
            fontWeight: 600,
            '& .MuiAlert-icon': { 
              color: darkProTokens.textPrimary 
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketLaunchIcon />
            <Typography sx={{ fontWeight: 600 }}>
              ¡Empleado guardado exitosamente!
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* MODAL DE REGISTRO DE HUELLA */}
      {(formData.user_id || employee?.user_id) && (
        <FingerprintRegistration
          open={fingerprintDialogOpen}
          onClose={handleFingerprintDialogClose}
          user={{
            id: formData.user_id || employee?.user_id || '',
            firstName: formData.firstName,
            lastName: formData.lastName,
            fingerprint: formData.fingerprint
          }}
          userType="empleado"
          onFingerprintDataReady={handleFingerprintDataReady}
        />
      )}

      {/* MODAL DE CAPTURA DE FOTO */}
      <Dialog
        open={photoCaptureOpen}
        onClose={handlePhotoCaptureClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Capturar Foto de Perfil
          <IconButton
            aria-label="close"
            onClick={handlePhotoCaptureClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PhotoCapture
            onPhotoCapture={handlePhotoCapture}
            previewUrl={formData.profilePictureUrl || null}
            onClearPhoto={() => setFormData(prev => ({ ...prev, profilePictureUrl: '' }))}
            label="Foto de perfil"
            tooltip="Captura la foto usando tu cámara"
            inputId="profile-photo-capture"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePhotoCaptureClose}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}