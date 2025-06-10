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
  Skeleton,
  Chip,
  Snackbar,
  Slide,
  Fade
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
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SignatureIcon from '@mui/icons-material/Draw';
import FingerPrintIcon from '@mui/icons-material/Fingerprint';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import FavoriteIcon from '@mui/icons-material/Favorite';
import UpdateIcon from '@mui/icons-material/Update';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🏗️ INTERFACES PRINCIPALES
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

interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

interface MembershipInfo {
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: any) => Promise<void>;
}

interface ImageState {
  url: string;
  fileName: string;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  isFromStorage: boolean;
}

interface DebugInfo {
  profileUrl: string;
  signatureUrl: string;
  contractUrl: string;
  initialized: boolean;
  complete: boolean;
  hasChanges?: boolean;
}

// 🔧 FUNCIONES DE CONVERSIÓN
const convertMaritalStatusToCode = (status: string): string => {
  switch (status) {
    case 'Soltero/a':
    case 'Soltero':
    case 'Soltera':
      return 'soltero';
    case 'Casado/a':
    case 'Casado':
    case 'Casada':
      return 'casado';
    case 'Divorciado/a':
    case 'Divorciado':
    case 'Divorciada':
      return 'divorciado';
    case 'Viudo/a':
    case 'Viudo':
    case 'Viuda':
      return 'viudo';
    default:
      return status.toLowerCase();
  }
};

const convertMaritalStatusToDisplay = (code: string): string => {
  switch (code) {
    case 'soltero':
      return 'Soltero/a';
    case 'casado':
      return 'Casado/a';
    case 'divorciado':
      return 'Divorciado/a';
    case 'viudo':
      return 'Viudo/a';
    default:
      return code;
  }
};

const convertTrainingLevelToCode = (level: string): string => {
  return level ? level.toLowerCase() : 'principiante';
};

const convertTrainingLevelToDisplay = (code: string): string => {
  switch (code) {
    case 'principiante':
      return 'Principiante';
    case 'intermedio':
      return 'Intermedio';
    case 'avanzado':
      return 'Avanzado';
    default:
      return code;
  }
};

// 🚀 FUNCIÓN PARA REGENERAR CONTRATO MEJORADA
const regenerateContract = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Iniciando regeneración de contrato para usuario:', userId);
    
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        forceRegenerate: true,
        isUpdate: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Error al regenerar contrato');
    }

    const result = await response.json();
    console.log('✅ Contrato regenerado exitosamente:', result);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error en regeneración de contrato:', error);
    return { success: false, error: error.message };
  }
};

// 🔧 FUNCIÓN CORREGIDA PARA ELIMINAR ARCHIVOS ANTIGUOS - NO ELIMINAR EL RECIÉN SUBIDO
const deleteOldFiles = async (userId: string, fileType: 'profile' | 'signature', exceptFileName?: string) => {
  try {
    const supabase = createBrowserSupabaseClient();
    
    console.log(`🔍 Listando archivos existentes para ${fileType}...`);
    
    const { data: files, error } = await supabase.storage
      .from('user-files')
      .list(userId, { 
        limit: 100,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }
    
    const filePrefix = fileType === 'profile' ? 'profile-' : 'signature-';
    let oldFiles = files?.filter(file => file.name.startsWith(filePrefix)) || [];
    
    console.log(`📁 Archivos encontrados de ${fileType}:`, oldFiles.map(f => f.name));
    
    // 🚀 EXCLUIR el archivo que acabamos de subir
    if (exceptFileName) {
      oldFiles = oldFiles.filter(file => file.name !== exceptFileName);
      console.log(`🛡️ Excluyendo archivo recién subido: ${exceptFileName}`);
      console.log(`📁 Archivos a eliminar:`, oldFiles.map(f => f.name));
    }
    
    if (oldFiles.length > 0) {
      const filesToDelete = oldFiles.map(file => `${userId}/${file.name}`);
      
      console.log(`🗑️ Eliminando ${filesToDelete.length} archivos antiguos de ${fileType}:`, filesToDelete);
      
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.error('❌ Error deleting old files:', deleteError);
      } else {
        console.log(`✅ Eliminados exitosamente ${filesToDelete.length} archivos antiguos de ${fileType}`);
      }
    } else {
      console.log(`ℹ️ No hay archivos antiguos de ${fileType} para eliminar`);
    }
  } catch (error) {
    console.error('💥 Error in deleteOldFiles:', error);
  }
};

// 🚀 FUNCIÓN CORREGIDA PARA SUBIR ARCHIVOS - SUBIR PRIMERO, ELIMINAR DESPUÉS
const uploadFileToStorage = async (
  file: File, 
  userId: string, 
  fileType: 'profile' | 'signature'
): Promise<{ url: string; path: string } | null> => {
  try {
    console.log(`📤 Iniciando subida de ${fileType} para usuario ${userId}`);
    console.log(`📋 Detalles del archivo:`, { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });
    
    const supabase = createBrowserSupabaseClient();
    
    // 1️⃣ GENERAR NOMBRE ÚNICO CON TIMESTAMP
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${fileType}-${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`📁 Nombre del archivo generado: ${fileName}`);
    console.log(`📁 Path completo: ${filePath}`);
    
    // 2️⃣ SUBIR NUEVO ARCHIVO PRIMERO
    console.log(`⬆️ Subiendo archivo al storage...`);
    
    const { data, error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Error en upload:', error);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
    
    console.log(`✅ Archivo subido exitosamente al storage:`, data);
    
    // 3️⃣ ELIMINAR ARCHIVOS ANTIGUOS DESPUÉS (excluyendo el que acabamos de subir)
    console.log(`🗑️ Eliminando archivos antiguos de ${fileType} (excepto ${fileName})...`);
    await deleteOldFiles(userId, fileType, fileName);
    
    // 4️⃣ OBTENER URL PÚBLICA
    console.log(`🌐 Obteniendo URL pública...`);
    
    const { data: publicUrlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      throw new Error('Error obteniendo URL pública');
    }
    
    console.log(`🎉 Archivo ${fileType} subido y limpiado exitosamente:`, publicUrlData.publicUrl);
    
    return {
      url: publicUrlData.publicUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error(`💥 Error crítico subiendo ${fileType}:`, error);
    throw error;
  }
};

// 🚀 COMPONENTE PRINCIPAL
export default function UserFormDialog({ open, onClose, user, onSave }: UserFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // 🔗 REFERENCIAS PARA CONTROL DE COMPONENTE
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  
  // 📊 ESTADOS PRINCIPALES DE DATOS
  const [formData, setFormData] = useState<User>({
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
  
  // 🔧 DETECCIÓN DE CAMBIOS MEJORADA
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<User>({
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
  
  // 📍 ESTADOS PARA DATOS RELACIONADOS
  const [addressData, setAddressData] = useState<Address>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'México'
  });
  
  const [originalAddressData, setOriginalAddressData] = useState<Address>({
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
  
  const [originalEmergencyData, setOriginalEmergencyData] = useState<EmergencyContact>({
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
  
  const [originalMembershipData, setOriginalMembershipData] = useState<MembershipInfo>({
    referredBy: '',
    mainMotivation: '',
    receivePlans: false,
    trainingLevel: 'principiante'
  });
  
  // 🎮 ESTADOS DE CONTROL
  const [loading, setLoading] = useState(false);
  const [fetchingRelated, setFetchingRelated] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeStep, setActiveStep] = useState(0);
  const [fileUploading, setFileUploading] = useState<{[key: string]: boolean}>({
    profilePicture: false,
    signature: false,
    contract: false
  });
  
  // 🚀 ESTADOS PARA REGENERACIÓN COMPLETA
  const [isRegeneratingContract, setIsRegeneratingContract] = useState(false);
  const [contractRegenerationSuccess, setContractRegenerationSuccess] = useState(false);
  const [contractRegenerationError, setContractRegenerationError] = useState<string | null>(null);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  
  // 📅 ESTADO PARA FECHA DE ÚLTIMA ACTUALIZACIÓN
  const [contractLastUpdated, setContractLastUpdated] = useState<string | null>(null);
  
  // 🎨 ESTADOS PARA CONTROL DE IMÁGENES
  const [profileImage, setProfileImage] = useState<ImageState>({
    url: '',
    fileName: '',
    isLoading: false,
    isValid: false,
    error: null,
    isFromStorage: false
  });
  
  const [signatureImage, setSignatureImage] = useState<ImageState>({
    url: '',
    fileName: '',
    isLoading: false,
    isValid: false,
    error: null,
    isFromStorage: false
  });
  
  // 📁 ESTADOS PARA ARCHIVOS PENDIENTES - NO SUBEN INMEDIATAMENTE
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [signature, setSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [contract, setContract] = useState<File | null>(null);
  const [birthDate, setBirthDate] = useState<dayjs.Dayjs | null>(null);
  
  // 🔧 ESTADOS DE CONTROL ADICIONALES
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // 🐛 ESTADO PARA DEBUG INFO
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    profileUrl: '',
    signatureUrl: '',
    contractUrl: '',
    initialized: false,
    complete: false
  });
  
  // 🔄 useEffect PARA CIERRE AUTOMÁTICO DESPUÉS DEL MENSAJE
  useEffect(() => {
    if (contractRegenerationSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setContractRegenerationSuccess(false);
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [contractRegenerationSuccess, onClose]);
  
  // 🧹 FUNCIÓN PARA LIMPIAR BLOB URLS
  const cleanupBlobUrl = (url: string) => {
    if (url && url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  };
  
  // 📥 FUNCIÓN PARA DESCARGAR IMAGEN DESDE STORAGE
  const downloadImageFromStorage = async (
    fileName: string,
    userId: string,
    type: 'profile' | 'signature'
  ) => {
    if (!fileName || !mountedRef.current) return;
    
    const setter = type === 'profile' ? setProfileImage : setSignatureImage;
    
    setter(prev => ({
      ...prev,
      fileName: fileName,
      isLoading: true,
      isValid: false,
      error: null,
      isFromStorage: true
    }));
    
    try {
      const supabase = createBrowserSupabaseClient();
      const filePath = `${userId}/${fileName}`;
      
      console.log(`📥 Descargando ${type} desde storage:`, filePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(filePath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando archivo: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        cleanupBlobUrl(objectUrl);
        return;
      }
      
      setter(prev => ({
        ...prev,
        url: objectUrl,
        isLoading: false,
        isValid: true,
        error: null,
        isFromStorage: true
      }));
      
      // Actualizar estados legacy para compatibilidad
      if (type === 'profile') {
        setProfilePicturePreview(objectUrl);
        setFormData(prev => ({ ...prev, profilePictureUrl: objectUrl }));
      } else {
        setSignaturePreview(objectUrl);
        setFormData(prev => ({ ...prev, signatureUrl: objectUrl }));
      }
      
      // Actualizar debug info
      setDebugInfo(prev => ({
        ...prev,
        [type === 'profile' ? 'profileUrl' : 'signatureUrl']: objectUrl
      }));
      
      console.log(`✅ ${type} descargado y cargado exitosamente:`, fileName);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ Error descargando ${type}:`, error);
      
      setter(prev => ({
        ...prev,
        isLoading: false,
        isValid: false,
        error: error.message,
        isFromStorage: true
      }));
    }
  };
  
  // 📄 FUNCIÓN PARA DESCARGAR PDF DESDE STORAGE
  const downloadPdfFromStorage = async (fileName: string, userId: string) => {
    if (!fileName || !mountedRef.current) return;
    
    try {
      const supabase = createBrowserSupabaseClient();
      const filePath = `${userId}/${fileName}`;
      
      console.log(`📥 Descargando contrato PDF desde storage:`, filePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(filePath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando PDF: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      
      setFormData(prev => ({ ...prev, contractPdfUrl: objectUrl }));
      
      // 📅 EXTRAER FECHA DE ÚLTIMA ACTUALIZACIÓN DEL NOMBRE DEL ARCHIVO
      const timestamp = fileName.match(/contrato-(\d+)\.pdf$/);
      if (timestamp) {
        const date = new Date(parseInt(timestamp[1]));
        setContractLastUpdated(date.toISOString());
      }
      
      // Actualizar debug info
      setDebugInfo(prev => ({
        ...prev,
        contractUrl: objectUrl
      }));
      
      console.log(`✅ Contrato PDF descargado exitosamente:`, fileName);
      
    } catch (error: any) {
      console.log(`ℹ️ No se pudo descargar el contrato PDF (normal si no existe):`, fileName);
    }
  };
  
  // 📁 FUNCIÓN CORREGIDA PARA CARGAR ARCHIVOS EXISTENTES - SOLO EL MÁS RECIENTE
  const loadExistingFiles = async (userId: string) => {
    if (!mountedRef.current || initializedRef.current) return;
    
    try {
      setFilesLoaded(false);
      setRetryCount(0);
      
      console.log(`📂 Cargando archivos existentes para usuario: ${userId}`);
      
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
      
      console.log(`📁 Archivos encontrados en storage:`, files?.map(f => f.name) || []);
      
      if (files && files.length > 0) {
        const promises: Promise<void>[] = [];
        
        // 🎯 BUSCAR SOLO EL ARCHIVO MÁS RECIENTE DE CADA TIPO
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        const latestSignature = files.find(file => file.name.startsWith('signature-'));
        const latestContract = files.find(file => file.name.startsWith('contrato-'));
        
        if (latestProfile) {
          console.log('📸 Cargando foto de perfil más reciente:', latestProfile.name);
          promises.push(downloadImageFromStorage(latestProfile.name, userId, 'profile'));
        } else {
          console.log('📸 No se encontró foto de perfil');
        }
        
        if (latestSignature) {
          console.log('✍️ Cargando firma más reciente:', latestSignature.name);
          promises.push(downloadImageFromStorage(latestSignature.name, userId, 'signature'));
        } else {
          console.log('✍️ No se encontró firma digital');
        }
        
        if (latestContract) {
          console.log('📄 Cargando contrato más reciente:', latestContract.name);
          promises.push(downloadPdfFromStorage(latestContract.name, userId));
        } else {
          console.log('📄 No se encontró contrato PDF');
        }
        
        await Promise.allSettled(promises);
      } else {
        console.log('📁 No se encontraron archivos en storage para este usuario');
      }
      
      if (mountedRef.current) {
        setFilesLoaded(true);
        setInitializationComplete(true);
        initializedRef.current = true;
        
        setDebugInfo(prev => ({
          ...prev,
          initialized: true,
          complete: true
        }));
        
        console.log('✅ Carga de archivos completada exitosamente');
      }
      
    } catch (error: any) {
      if (mountedRef.current) {
        console.error('💥 Error cargando archivos:', error);
        
        setErrors(prev => ({
          ...prev,
          fileLoading: `Error cargando archivos: ${error.message}`
        }));
        
        if (retryCount < 2) {
          console.log(`🔄 Reintentando carga de archivos (intento ${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              loadExistingFiles(userId);
            }
          }, 3000);
        } else {
          console.log('⚠️ Máximo de reintentos alcanzado, continuando sin archivos');
          setFilesLoaded(true);
          setInitializationComplete(true);
          initializedRef.current = true;
        }
      }
    }
  };
  
  // 🔄 FUNCIÓN PARA REINTENTAR CARGA DE IMAGEN
  const retryImageLoad = useCallback((type: 'profile' | 'signature') => {
    const imageState = type === 'profile' ? profileImage : signatureImage;
    if (imageState.fileName && user?.id) {
      downloadImageFromStorage(imageState.fileName, user.id, type);
    }
  }, [profileImage, signatureImage, user?.id]);
  
  // 👀 FUNCIÓN MEJORADA PARA MANEJAR VISUALIZACIÓN DE PDF
  const handlePdfView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.contractPdfUrl) return;
    
    if (formData.contractPdfUrl.startsWith('blob:')) {
      window.open(formData.contractPdfUrl, '_blank', 'noopener,noreferrer');
    } else {
      const link = document.createElement('a');
      link.href = formData.contractPdfUrl;
      link.download = `Contrato_${formData.firstName}_${formData.lastName}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [formData.contractPdfUrl, formData.firstName, formData.lastName]);

  // 🔄 HANDLER PARA CAMBIO DE ARCHIVOS CORREGIDO
  const handleFileChange = (fileType: 'profilePicture' | 'signature' | 'contract') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      console.log(`📁 Archivo ${fileType} seleccionado:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validaciones básicas
      let isValid = true;
      let errorMessage = '';
      
      if (fileType === 'profilePicture' || fileType === 'signature') {
        if (!file.type.startsWith('image/')) {
          isValid = false;
          errorMessage = 'El archivo debe ser una imagen';
        } else if (file.size > 5 * 1024 * 1024) {
          isValid = false;
          errorMessage = 'La imagen no debe exceder 5MB';
        }
      } else if (fileType === 'contract') {
        if (file.type !== 'application/pdf') {
          isValid = false;
          errorMessage = 'El archivo debe ser un PDF';
        } else if (file.size > 10 * 1024 * 1024) {
          isValid = false;
          errorMessage = 'El PDF no debe exceder 10MB';
        }
      }
      
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          [fileType]: errorMessage
        }));
        return;
      }
      
      // Limpiar errores previos
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileType];
        return newErrors;
      });
      
      // Limpiar URL anterior si existe
      if (fileType === 'profilePicture' && profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
        blobUrlsRef.current.delete(profilePicturePreview);
      } else if (fileType === 'signature' && signaturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(signaturePreview);
        blobUrlsRef.current.delete(signaturePreview);
      }
      
      // Crear preview local (NO SUBIR TODAVÍA)
      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(objectUrl);
      
      if (fileType === 'profilePicture') {
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
        console.log('📸 Preview de foto de perfil creado:', objectUrl);
      } else if (fileType === 'signature') {
        setSignature(file);
        setSignaturePreview(objectUrl);
        setSignatureImage(prev => ({
          ...prev,
          url: objectUrl,
          isLoading: false,
          isValid: true,
          error: null,
          isFromStorage: false
        }));
        console.log('✍️ Preview de firma creado:', objectUrl);
      } else if (fileType === 'contract') {
        setContract(file);
        console.log('📄 Contrato seleccionado:', file.name);
      }
      
      // Marcar que hay cambios
      setHasFormChanges(true);
      console.log('🔄 Cambios detectados, archivo pendiente de subida');
      
      // Limpiar input
      e.target.value = '';
    };
  
  // 🎨 COMPONENTE AVATAR ULTRA PRO CON ANIMACIONES
  const ProfileAvatar = () => {
    if (!initializationComplete) {
      return (
        <Skeleton
          variant="circular"
          width={120}
          height={120}
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            mx: 'auto',
            mb: 2
          }}
        />
      );
    }
    
    // Determinar qué imagen mostrar
    const currentImageUrl = profilePicture ? profilePicturePreview : 
                           profileImage.isValid ? profileImage.url : 
                           profilePicturePreview || undefined;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'relative',
            background: 'linear-gradient(135deg, #4caf50, #45a049)',
            borderRadius: '50%',
            padding: '4px',
            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
          }}>
            <Avatar 
              src={currentImageUrl}
              sx={{ 
                width: 120, 
                height: 120,
                border: '3px solid #1a1a1a',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#4caf50',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              {formData.firstName && formData.firstName[0].toUpperCase()}
            </Avatar>
          </Box>
          
          {/* Indicador de archivo pendiente */}
          {profilePicture && (
            <Chip
              icon={<UpdateIcon />}
              label="Pendiente"
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                left: -8,
                bgcolor: '#ff9800',
                color: 'white',
                fontSize: '0.7rem',
                height: 24,
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          
          {/* Indicador de carga */}
          {(profileImage.isLoading || fileUploading.profilePicture) && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.7)'
            }}>
              <CircularProgress 
                size={36} 
                sx={{ color: '#4caf50' }} 
              />
            </Box>
          )}
          
          {/* Indicador de error */}
          {profileImage.error && !profileImage.isLoading && (
            <Box sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: '#f44336',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
            }}>
              <ErrorIcon sx={{ fontSize: 16, color: 'white' }} />
            </Box>
          )}
          
          {/* Botón de cámara mejorado */}
          <IconButton 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'linear-gradient(135deg, #4caf50, #45a049)',
              color: 'white',
              width: 40,
              height: 40,
              border: '3px solid #1a1a1a',
              boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #45a049, #388e3c)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 25px rgba(76, 175, 80, 0.6)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease'
            }}
            component="label"
            disabled={fileUploading.profilePicture}
          >
            {fileUploading.profilePicture ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <>
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange('profilePicture')}
                />
                <PhotoCamera sx={{ fontSize: 20 }} />
              </>
            )}
          </IconButton>
        </Box>
      </Box>
    );
  };
  
  // 🖊️ COMPONENTE FIRMA ULTRA PRO
  const SignatureDisplay = () => {
    if (!initializationComplete) {
      return (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={120}
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 2
          }}
        />
      );
    }
    
    // Determinar qué imagen mostrar
    const currentSignatureUrl = signature ? signaturePreview : 
                               signatureImage.isValid ? signatureImage.url : 
                               signaturePreview || undefined;
    
    if (currentSignatureUrl) {
      return (
        <Box sx={{ 
          position: 'relative', 
          width: '100%',
          bgcolor: 'white',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgba(156, 39, 176, 0.2)'
        }}>
          <Box 
            component="img"
            src={currentSignatureUrl}
            alt="Firma digital"
            sx={{ 
              maxWidth: '100%', 
              maxHeight: '100px',
              width: '100%',
              objectFit: 'contain',
              borderRadius: 1
            }}
          />
          
          {/* Indicador de verificación o pendiente */}
          <Chip
            icon={signature ? <UpdateIcon /> : <VerifiedIcon />}
            label={signature ? "Pendiente" : "Verificada"}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: signature ? '#ff9800' : '#4caf50',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: 'white', fontSize: 14 },
              ...(signature ? { animation: 'pulse 2s infinite' } : {})
            }}
          />
          
          {/* Botón para cambiar firma */}
          <IconButton
            component="label"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(156, 39, 176, 0.9)',
              color: 'white',
              '&:hover': { bgcolor: '#9c27b0' }
            }}
          >
            <PhotoCamera fontSize="small" />
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleFileChange('signature')}
            />
          </IconButton>
          
          {signatureImage.error && (
            <IconButton
              size="small"
              onClick={() => retryImageLoad('signature')}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(244, 67, 54, 0.9)',
                color: 'white',
                '&:hover': { bgcolor: '#f44336' }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        width: '100%',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        border: '2px dashed rgba(156, 39, 176, 0.3)',
        bgcolor: 'rgba(156, 39, 176, 0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'rgba(156, 39, 176, 0.5)',
          bgcolor: 'rgba(156, 39, 176, 0.1)'
        }
      }}>
        {signatureImage.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} sx={{ color: '#9c27b0' }} />
            <Typography variant="caption" sx={{ color: '#9c27b0', fontWeight: 500 }}>
              Cargando firma...
            </Typography>
          </Box>
        ) : signatureImage.error ? (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ color: '#f44336', mb: 1, fontSize: 28 }} />
            <Typography variant="caption" sx={{ color: '#f44336', display: 'block', fontWeight: 500 }}>
              Error: {signatureImage.error}
            </Typography>
            <Button
              size="small"
              onClick={() => retryImageLoad('signature')}
              startIcon={<RefreshIcon />}
              sx={{ 
                color: '#9c27b0', 
                mt: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.1)' }
              }}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <SignatureIcon sx={{ color: 'rgba(156, 39, 176, 0.4)', fontSize: 32, mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.6)', fontWeight: 500, display: 'block', mb: 2 }}>
              Sin firma registrada
            </Typography>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<PhotoCamera />}
              sx={{
                borderColor: 'rgba(156, 39, 176, 0.5)',
                color: '#9c27b0',
                '&:hover': {
                  borderColor: '#9c27b0',
                  bgcolor: 'rgba(156, 39, 176, 0.1)'
                }
              }}
            >
              Subir Firma
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleFileChange('signature')}
              />
            </Button>
          </Box>
        )}
      </Box>
    );
  };
  
  // 🚀 COMPONENTE CONTRATO PDF ULTRA PRO
  const ContractPdfDisplay = () => {
    if (!initializationComplete) {
      return (
        <Box sx={{ 
          width: '100%',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.2)',
          border: '2px dashed rgba(255, 255, 255, 0.2)'
        }}>
          <CircularProgress size={28} sx={{ color: '#2196f3' }} />
        </Box>
      );
    }
    
    if (formData.contractPdfUrl) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(63, 81, 181, 0.1))',
          border: '2px solid rgba(33, 150, 243, 0.3)',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 40, color: '#2196f3' }} />
            <Box>
              <Typography variant="h6" sx={{ 
                color: '#2196f3', 
                fontWeight: 700,
                mb: 0.5
              }}>
                Contrato Disponible
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Documento oficial generado
              </Typography>
            </Box>
          </Box>
          
          {/* 📅 FECHA DE ÚLTIMA ACTUALIZACIÓN */}
          {contractLastUpdated && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(33, 150, 243, 0.15)',
              border: '1px solid rgba(33, 150, 243, 0.4)'
            }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: '#2196f3' }} />
              <Typography variant="caption" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem'
              }}>
                {new Date(contractLastUpdated).toLocaleString('es-MX', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          )}
          
          {/* Botón de acción */}
          <Button
            variant="contained"
            onClick={handlePdfView}
            startIcon={<VisibilityIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2196f3, #1976d2)',
              color: 'white',
              px: 3,
              py: 1,
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Ver Contrato
          </Button>
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        width: '100%',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        border: '2px dashed rgba(33, 150, 243, 0.3)',
        bgcolor: 'rgba(33, 150, 243, 0.05)'
      }}>
        <AssignmentIcon sx={{ color: 'rgba(33, 150, 243, 0.4)', fontSize: 36, mb: 1 }} />
        <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.6)', fontWeight: 500 }}>
          Se generará automáticamente
        </Typography>
      </Box>
    );
  };
  
  // 🔧 MANEJADORES DE EVENTOS SIMPLIFICADOS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
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
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setAddressData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`address_${name}`]) {
        setErrors(prev => ({
          ...prev,
          [`address_${name}`]: ''
        }));
      }
    }
  };
  
  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setEmergencyData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`emergency_${name}`]) {
        setErrors(prev => ({
          ...prev,
          [`emergency_${name}`]: ''
        }));
      }
    }
  };
  
  const handleEmergencySelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setEmergencyData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`emergency_${name}`]) {
        setErrors(prev => ({
          ...prev,
          [`emergency_${name}`]: ''
        }));
      }
    }
  };
  
  const handleMembershipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setMembershipData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`membership_${name}`]) {
        setErrors(prev => ({
          ...prev,
          [`membership_${name}`]: ''
        }));
      }
    }
  };
  
  const handleMembershipSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setMembershipData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`membership_${name}`]) {
        setErrors(prev => ({
          ...prev,
          [`membership_${name}`]: ''
        }));
      }
    }
  };
  
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };
  
  const handleMembershipSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMembershipData(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };
  
  const handleBirthDateChange = (date: dayjs.Dayjs | null) => {
    setBirthDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        birthDate: date.format('YYYY-MM-DD')
      }));
      
      const today = dayjs();
      const age = today.diff(date, 'year');
      setFormData(prev => ({
        ...prev,
        isMinor: age < 18
      }));
      
      if (errors.birthDate) {
        setErrors(prev => ({
          ...prev,
          birthDate: ''
        }));
      }
    }
  };
  
  // 🔍 FUNCIÓN DE VALIDACIÓN MEJORADA
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 0) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'El nombre es obligatorio';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'El apellido es obligatorio';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      
      if (!formData.whatsapp.trim()) {
        newErrors.whatsapp = 'El WhatsApp es obligatorio';
      }
      
      if (!formData.birthDate) {
        newErrors.birthDate = 'La fecha de nacimiento es obligatoria';
      }
      
      if (!formData.gender) {
        newErrors.gender = 'El género es obligatorio';
      }
      
      if (!formData.maritalStatus) {
        newErrors.maritalStatus = 'El estado civil es obligatorio';
      }
    } else if (step === 1 && formData.rol === 'cliente') {
      if (!addressData.street.trim()) {
        newErrors.address_street = 'La calle es obligatoria';
      }
      
      if (!addressData.number.trim()) {
        newErrors.address_number = 'El número es obligatorio';
      }
      
      if (!addressData.neighborhood.trim()) {
        newErrors.address_neighborhood = 'La colonia es obligatoria';
      }
      
      if (!addressData.city.trim()) {
        newErrors.address_city = 'La ciudad es obligatoria';
      }
      
      if (!addressData.state.trim()) {
        newErrors.address_state = 'El estado es obligatorio';
      }
      
      if (!addressData.postalCode.trim()) {
        newErrors.address_postalCode = 'El código postal es obligatorio';
      }
    } else if (step === 2 && formData.rol === 'cliente') {
      if (!emergencyData.name.trim()) {
        newErrors.emergency_name = 'El nombre del contacto es obligatorio';
      }
      
      if (!emergencyData.phone.trim()) {
        newErrors.emergency_phone = 'El teléfono del contacto es obligatorio';
      }
      
      if (!emergencyData.bloodType.trim()) {
        newErrors.emergency_bloodType = 'El tipo de sangre es obligatorio';
      }
    } else if (step === 3 && formData.rol === 'cliente') {
      if (!membershipData.mainMotivation.trim()) {
        newErrors.membership_mainMotivation = 'La motivación principal es obligatoria';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // 🔄 useEffect PRINCIPAL PARA INICIALIZACIÓN
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    
    if (!user || !user.id || initializedRef.current) {
      if (!user) {
        resetForm();
        setInitializationComplete(true);
      }
      return;
    }
    
    mountedRef.current = true;
    
    const initializeUser = async () => {
      setInitializationComplete(false);
      setErrors({});
      setRetryCount(0);
      setHasFormChanges(false);
      setContractRegenerationSuccess(false);
      setContractRegenerationError(null);
      setContractLastUpdated(null);
      
      blobUrlsRef.current.forEach(url => cleanupBlobUrl(url));
      blobUrlsRef.current.clear();
      
      setProfileImage({
        url: '',
        fileName: '',
        isLoading: false,
        isValid: false,
        error: null,
        isFromStorage: false
      });
      
      setSignatureImage({
        url: '',
        fileName: '',
        isLoading: false,
        isValid: false,
        error: null,
        isFromStorage: false
      });
      
      setProfilePicturePreview('');
      setSignaturePreview('');
      setFilesLoaded(false);
      setProfilePicture(null);
      setSignature(null);
      setContract(null);
      
      setDebugInfo({
        profileUrl: '',
        signatureUrl: '',
        contractUrl: '',
        initialized: false,
        complete: false
      });
      
      const userData = {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        rol: user.rol || 'cliente',
        whatsapp: user.whatsapp || '',
        birthDate: user.birthDate || '',
        gender: user.gender ? user.gender.toLowerCase() : '',
        maritalStatus: user.maritalStatus ? convertMaritalStatusToCode(user.maritalStatus) : '',
        isMinor: user.isMinor || false,
        emailSent: user.emailSent || false,
        emailSentAt: user.emailSentAt || undefined,
        whatsappSent: user.whatsappSent || false,
        whatsappSentAt: user.whatsappSentAt || undefined,
        profilePictureUrl: user.profilePictureUrl || undefined,
        signatureUrl: user.signatureUrl || undefined,
        contractPdfUrl: user.contractPdfUrl || undefined,
        fingerprint: user.fingerprint || false
      };
      
      setFormData(userData);
      setOriginalFormData({...userData});
      
      if (user.birthDate) {
        setBirthDate(dayjs(user.birthDate));
      }
      
      await fetchRelatedData(user.id);
      await loadExistingFiles(user.id);
    };

    initializeUser();
    setActiveStep(0);
    
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user?.id, open]);

  // 🧹 CLEANUP useEffect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      initializedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // 🔧 FUNCIÓN DE DETECCIÓN DE CAMBIOS
  const detectChanges = useCallback(() => {
    if (!initializationComplete) return false;
    
    const fieldsToCompare = [
      'firstName', 'lastName', 'email', 'whatsapp', 'birthDate', 
      'gender', 'maritalStatus', 'rol', 'isMinor', 'emailSent', 
      'whatsappSent', 'fingerprint'
    ];
    
    const userDataChanged = fieldsToCompare.some(field => {
      const current = formData[field as keyof User];
      const original = originalFormData[field as keyof User];
      return current !== original;
    });
    
    const addressFieldsToCompare = ['street', 'number', 'neighborhood', 'city', 'state', 'postalCode', 'country'];
    const addressChanged = addressFieldsToCompare.some(field => {
      const current = addressData[field as keyof Address];
      const original = originalAddressData[field as keyof Address];
      return current !== original;
    });
    
    const emergencyFieldsToCompare = ['name', 'phone', 'medicalCondition', 'bloodType'];
    const emergencyChanged = emergencyFieldsToCompare.some(field => {
      const current = emergencyData[field as keyof EmergencyContact];
      const original = originalEmergencyData[field as keyof EmergencyContact];
      return current !== original;
    });
    
    const membershipFieldsToCompare = ['referredBy', 'mainMotivation', 'receivePlans', 'trainingLevel'];
    const membershipChanged = membershipFieldsToCompare.some(field => {
      const current = membershipData[field as keyof MembershipInfo];
      const original = originalMembershipData[field as keyof MembershipInfo];
      return current !== original;
    });
    
    const newFilesAdded = profilePicture !== null || signature !== null;
    
    const hasChanges = userDataChanged || addressChanged || emergencyChanged || membershipChanged || newFilesAdded;
    
    return hasChanges;
  }, [
    formData, originalFormData,
    addressData, originalAddressData,
    emergencyData, originalEmergencyData,
    membershipData, originalMembershipData,
    profilePicture, signature,
    initializationComplete
  ]);

  // 🔄 useEffect PARA DETECTAR CAMBIOS
  useEffect(() => {
    const changes = detectChanges();
    if (changes !== hasFormChanges) {
      setHasFormChanges(changes);
      setDebugInfo(prev => ({
        ...prev,
        hasChanges: changes
      }));
    }
  }, [detectChanges, hasFormChanges]);

  // 🔄 FUNCIÓN RESET DEL FORMULARIO
  const resetForm = () => {
    blobUrlsRef.current.forEach(url => cleanupBlobUrl(url));
    blobUrlsRef.current.clear();
    
    const emptyFormData = {
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
    };
    
    const emptyAddress = {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México'
    };
    
    const emptyEmergency = {
      name: '',
      phone: '',
      medicalCondition: '',
      bloodType: ''
    };
    
    const emptyMembership = {
      referredBy: '',
      mainMotivation: '',
      receivePlans: false,
      trainingLevel: 'principiante'
    };
    
    setFormData(emptyFormData);
    setOriginalFormData(emptyFormData);
    setAddressData(emptyAddress);
    setOriginalAddressData(emptyAddress);
    setEmergencyData(emptyEmergency);
    setOriginalEmergencyData(emptyEmergency);
    setMembershipData(emptyMembership);
    setOriginalMembershipData(emptyMembership);
    setHasFormChanges(false);
    setContractLastUpdated(null);
    setContractRegenerationSuccess(false);
    setContractRegenerationError(null);
    
    setProfilePicturePreview('');
    setProfilePicture(null);
    setSignaturePreview('');
    setSignature(null);
    setContract(null);
    setBirthDate(null);
    setFilesLoaded(false);
    setInitializationComplete(false);
    
    setProfileImage({
      url: '',
      fileName: '',
      isLoading: false,
      isValid: false,
      error: null,
      isFromStorage: false
    });
    
    setSignatureImage({
      url: '',
      fileName: '',
      isLoading: false,
      isValid: false,
      error: null,
      isFromStorage: false
    });
    
    initializedRef.current = false;
  };

  // 📊 FUNCIÓN PARA CARGAR DATOS RELACIONADOS
  const fetchRelatedData = async (userId: string) => {
    try {
      setFetchingRelated(true);
      const supabase = createBrowserSupabaseClient();
      
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (address && !addressError) {
        const addressObj = {
          street: address.street || '',
          number: address.number || '',
          neighborhood: address.neighborhood || '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'México'
        };
        setAddressData(addressObj);
        setOriginalAddressData({...addressObj});
      }
      
      const { data: emergency, error: emergencyError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (emergency && !emergencyError) {
        const emergencyObj = {
          name: emergency.name || '',
          phone: emergency.phone || '',
          medicalCondition: emergency.medicalCondition || '',
          bloodType: emergency.bloodType || ''
        };
        setEmergencyData(emergencyObj);
        setOriginalEmergencyData({...emergencyObj});
      }
      
      const { data: membership, error: membershipError } = await supabase
        .from('membership_info')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (membership && !membershipError) {
        const membershipObj = {
          referredBy: membership.referredBy || '',
          mainMotivation: membership.mainMotivation || '',
          receivePlans: membership.receivePlans || false,
          trainingLevel: convertTrainingLevelToCode(membership.trainingLevel || 'principiante')
        };
        setMembershipData(membershipObj);
        setOriginalMembershipData({...membershipObj});
      }
      
    } catch (error) {
      // Error silencioso
    } finally {
      setFetchingRelated(false);
    }
  };

  // 📋 FUNCIÓN handleSubmit CORREGIDA CON FLUJO PERFECTO
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setIsSavingChanges(true);
      setContractRegenerationError(null);
      
      console.log('🚀 Iniciando proceso de guardado completo...');
      
      // 1️⃣ VALIDAR FORMULARIO
      if (!validateStep(activeStep)) {
        setLoading(false);
        setIsSavingChanges(false);
        return;
      }
      
      const userId = formData.id || user?.id || crypto.randomUUID();
      let updatedFormData = { ...formData, id: userId };
      
      console.log('📊 Usuario ID:', userId);
      console.log('📁 Archivos pendientes - Foto:', !!profilePicture, 'Firma:', !!signature);
      
      // 2️⃣ SUBIR ARCHIVOS PENDIENTES PRIMERO (SI EXISTEN)
      if (profilePicture) {
        console.log('📤 Subiendo foto de perfil...');
        setFileUploading(prev => ({ ...prev, profilePicture: true }));
        
        try {
          const uploadResult = await uploadFileToStorage(profilePicture, userId, 'profile');
          if (uploadResult) {
            updatedFormData.profilePictureUrl = uploadResult.url;
            console.log('✅ Foto de perfil subida exitosamente:', uploadResult.url);
            
            // Actualizar preview con URL real
            setProfilePicturePreview(uploadResult.url);
            setProfileImage(prev => ({
              ...prev,
              url: uploadResult.url,
              fileName: uploadResult.path.split('/').pop() || '',
              isFromStorage: true
            }));
          } else {
            throw new Error('Error al subir foto de perfil');
          }
        } catch (error: any) {
          console.error('❌ Error subiendo foto:', error);
          setErrors(prev => ({ ...prev, profilePicture: `Error subiendo foto: ${error.message}` }));
          throw error;
        } finally {
          setFileUploading(prev => ({ ...prev, profilePicture: false }));
        }
      }
      
      if (signature) {
        console.log('📤 Subiendo firma digital...');
        setFileUploading(prev => ({ ...prev, signature: true }));
        
        try {
          const uploadResult = await uploadFileToStorage(signature, userId, 'signature');
          if (uploadResult) {
            updatedFormData.signatureUrl = uploadResult.url;
            console.log('✅ Firma digital subida exitosamente:', uploadResult.url);
            
            // Actualizar preview con URL real
            setSignaturePreview(uploadResult.url);
            setSignatureImage(prev => ({
              ...prev,
              url: uploadResult.url,
              fileName: uploadResult.path.split('/').pop() || '',
              isFromStorage: true
            }));
          } else {
            throw new Error('Error al subir firma digital');
          }
        } catch (error: any) {
          console.error('❌ Error subiendo firma:', error);
          setErrors(prev => ({ ...prev, signature: `Error subiendo firma: ${error.message}` }));
          throw error;
        } finally {
          setFileUploading(prev => ({ ...prev, signature: false }));
        }
      }
      
      // 3️⃣ PREPARAR DATOS FINALES
      const processedFormData = {
        ...updatedFormData,
        gender: updatedFormData.gender ? updatedFormData.gender.charAt(0).toUpperCase() + updatedFormData.gender.slice(1) : '',
        maritalStatus: convertMaritalStatusToDisplay(updatedFormData.maritalStatus)
      };
      
      const processedMembershipData = {
        ...membershipData,
        trainingLevel: convertTrainingLevelToDisplay(membershipData.trainingLevel)
      };
      
      const userData = {
        ...processedFormData,
        address: formData.rol === 'cliente' ? addressData : null,
        emergency: formData.rol === 'cliente' ? emergencyData : null,
        membership: formData.rol === 'cliente' ? processedMembershipData : null
      };
      
      console.log('📊 Datos finales a guardar:', userData);
      
      // 4️⃣ GUARDAR USUARIO EN BASE DE DATOS
      console.log('💾 Guardando usuario en base de datos...');
      await onSave(userData);
      console.log('✅ Usuario guardado exitosamente en base de datos');
      
      // 5️⃣ REGENERAR CONTRATO INMEDIATAMENTE (SI ES CLIENTE Y HAY CAMBIOS)
      if (formData.rol === 'cliente' && hasFormChanges) {
        console.log('🔄 Iniciando regeneración inmediata de contrato...');
        setIsRegeneratingContract(true);
        
        try {
          const contractResult = await regenerateContract(userId);
          
          if (contractResult.success) {
            console.log('✅ Contrato regenerado exitosamente en tiempo real');
            setContractRegenerationSuccess(true);
            setContractRegenerationError(null);
            
            // Recargar archivos para obtener el nuevo contrato
            setTimeout(() => {
              if (mountedRef.current) {
                loadExistingFiles(userId);
              }
            }, 1000);
            
          } else {
            console.error('❌ Error regenerando contrato:', contractResult.error);
            setContractRegenerationError(contractResult.error || 'Error desconocido en regeneración');
          }
        } catch (error: any) {
          console.error('💥 Error crítico en regeneración de contrato:', error);
          setContractRegenerationError(error.message || 'Error crítico en regeneración');
        } finally {
          setIsRegeneratingContract(false);
        }
      }
      
      // 6️⃣ LIMPIAR ARCHIVOS PENDIENTES Y ACTUALIZAR ESTADOS
      console.log('🧹 Limpiando estados y archivos pendientes...');
      
      // Limpiar archivos pendientes
      setProfilePicture(null);
      setSignature(null);
      setContract(null);
      
      // Limpiar URLs de blob locales
      blobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
      
      // Actualizar estados originales para evitar detección de cambios falsos
      setOriginalFormData({...processedFormData});
      setOriginalAddressData({...addressData});
      setOriginalEmergencyData({...emergencyData});
      setOriginalMembershipData({...membershipData});
      setHasFormChanges(false);
      
      console.log('🎉 Proceso de guardado completado exitosamente');
      
      // Mostrar mensaje de éxito si no es cliente (cliente ya tiene su mensaje de contrato)
      if (formData.rol !== 'cliente') {
        setContractRegenerationSuccess(true);
      }
      
    } catch (error: any) {
      console.error('💥 Error crítico en el proceso de guardado:', error);
      setErrors({ submit: error.message || 'Error al guardar usuario' });
    } finally {
      setLoading(false);
      setIsSavingChanges(false);
    }
  };

  // 🎯 CONFIGURACIÓN DE PASOS
  const getSteps = () => {
    const baseSteps = ['Información Personal'];
    
    if (formData.rol === 'cliente') {
      return [...baseSteps, 'Dirección', 'Contacto de Emergencia', 'Membresía', 'Archivos'];
    } else {
      return [...baseSteps, 'Archivos'];
    }
  };

  const steps = getSteps();

  // 🎨 RENDERIZADO DE CONTENIDO POR PASO
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            {/* 🎨 AVATAR PRINCIPAL */}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                        <AlternateEmailIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </LocalizationProvider>
                {errors.birthDate && (
                  <FormHelperText error>{errors.birthDate}</FormHelperText>
                )}
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Género</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleSelectChange}
                    label="Género"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4caf50' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(30, 30, 30, 0.95)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                          }
                        }
                      }
                    }}
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
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado Civil</InputLabel>
                  <Select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleSelectChange}
                    label="Estado Civil"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4caf50' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(30, 30, 30, 0.95)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                          }
                        }
                      }
                    }}
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
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Rol</InputLabel>
                  <Select
                    name="rol"
                    value={formData.rol}
                    onChange={handleSelectChange}
                    label="Rol"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4caf50' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(30, 30, 30, 0.95)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="cliente">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FitnessCenterIcon fontSize="small" />
                        Cliente
                      </Box>
                    </MenuItem>
                    <MenuItem value="empleado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        Empleado
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" />
                        Administrador
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Indicador de menor de edad */}
              {formData.isMinor && (
                <Grid size={12}>
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      bgcolor: 'rgba(255, 152, 0, 0.1)', 
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      '& .MuiAlert-icon': { color: '#ff9800' }
                    }}
                  >
                    <Typography sx={{ color: 'white' }}>
                      ⚠️ Este usuario es menor de edad. Se requiere autorización del tutor legal.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 1:
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1); // Ir a archivos
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#ff9800', 
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
                        <HomeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                        <BusinessIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                        <LocationCityIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                        <PublicIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MarkunreadMailboxIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 152, 0, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1); // Ir a archivos
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#f44336', 
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
                        <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#f44336' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#f44336' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' }
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.emergency_bloodType}>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tipo de Sangre</InputLabel>
                  <Select
                    name="bloodType"
                    value={emergencyData.bloodType}
                    onChange={handleEmergencySelectChange}
                    label="Tipo de Sangre"
                    startAdornment={
                      <InputAdornment position="start">
                        <BloodtypeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    }
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(30, 30, 30, 0.95)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                          }
                        }
                      }
                    }}
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
                        <FavoriteIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(244, 67, 54, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#f44336' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1); // Ir a archivos
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#9c27b0', 
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(156, 39, 176, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#9c27b0' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Nivel de Entrenamiento</InputLabel>
                  <Select
                    name="trainingLevel"
                    value={membershipData.trainingLevel}
                    onChange={handleMembershipSelectChange}
                    label="Nivel de Entrenamiento"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(156, 39, 176, 0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9c27b0' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(30, 30, 30, 0.95)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.1)' }
                          }
                        }
                      }
                    }}
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
                          color: '#9c27b0',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#9c27b0',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'white' }}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(156, 39, 176, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#9c27b0' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiFormHelperText-root': { color: '#f44336' },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        // PASO DE ARCHIVOS
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#2196f3', 
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
              {/* 🖊️ FIRMA DIGITAL */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '2px solid rgba(156, 39, 176, 0.3)',
                  bgcolor: 'rgba(156, 39, 176, 0.05)'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#9c27b0', 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SignatureIcon />
                    Firma Digital
                  </Typography>
                  
                  <SignatureDisplay />
                  
                  {errors.signature && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {errors.signature}
                    </Alert>
                  )}
                </Box>
              </Grid>
              
              {/* 📄 CONTRATO PDF */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '2px solid rgba(33, 150, 243, 0.3)',
                  bgcolor: 'rgba(33, 150, 243, 0.05)'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#2196f3', 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AssignmentIcon />
                    Contrato PDF
                  </Typography>
                  
                  <ContractPdfDisplay />
                </Box>
              </Grid>
              
              {/* 🔧 OPCIONES ADICIONALES */}
              <Grid size={12}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '2px solid rgba(255, 193, 7, 0.3)',
                  bgcolor: 'rgba(255, 193, 7, 0.05)'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#ffc107', 
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
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.fingerprint}
                            onChange={handleSwitchChange('fingerprint')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ffc107',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#ffc107',
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FingerPrintIcon sx={{ color: '#ffc107' }} />
                            <Typography sx={{ color: 'white' }}>
                              Huella dactilar registrada
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.emailSent}
                            onChange={handleSwitchChange('emailSent')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#4caf50',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#4caf50',
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AlternateEmailIcon sx={{ color: '#4caf50' }} />
                            <Typography sx={{ color: 'white' }}>
                              Email de bienvenida enviado
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
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
                            <Typography sx={{ color: 'white' }}>
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
  };

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
          background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.95), rgba(30, 30, 30, 0.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          color: 'white',
          maxHeight: '95vh'
        }
      }}
    >
      {/* 📋 HEADER */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(76, 175, 80, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RocketLaunchIcon sx={{ color: '#4caf50', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {user ? `Modificando: ${user.firstName} ${user.lastName}` : 'Creando nuevo perfil de usuario'}
            </Typography>
          </Box>
        </Box>
  
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasFormChanges && (
            <Chip
              icon={<UpdateIcon />}
              label="Cambios pendientes"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 152, 0, 0.2)',
                color: '#ffab00',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          
          {showDebugInfo && debugInfo && (
            <Chip
              icon={<SecurityIcon />}
              label="Debug"
              size="small"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              sx={{
                bgcolor: 'rgba(33, 150, 243, 0.2)',
                color: '#2196f3',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                cursor: 'pointer'
              }}
            />
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
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
  
      {/* 📝 CONTENIDO */}
      <DialogContent sx={{ p: 0 }}>
        {/* 🚨 MENSAJES DE ERROR */}
        {errors.submit && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {errors.submit}
          </Alert>
        )}
        
        {errors.fileLoading && (
          <Alert severity="warning" sx={{ m: 3, mb: 0 }}>
            {errors.fileLoading}
            <Button
              size="small"
              onClick={() => user?.id && loadExistingFiles(user.id)}
              sx={{ ml: 2 }}
            >
              Reintentar
            </Button>
          </Alert>
        )}
  
        {/* 🔄 STEPPER */}
        <Box sx={{ p: 3 }}>
          <Stepper 
            activeStep={activeStep} 
            orientation={isMobile ? "vertical" : "horizontal"}
            sx={{
              '& .MuiStepLabel-label': { 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-active': { color: '#4caf50' },
                '&.Mui-completed': { color: '#4caf50' }
              },
              '& .MuiStepIcon-root': {
                color: 'rgba(255, 255, 255, 0.3)',
                '&.Mui-active': { color: '#4caf50' },
                '&.Mui-completed': { color: '#4caf50' }
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
  
          {/* Contenido del paso (solo en desktop) */}
          {!isMobile && (
            <Box sx={{ mt: 4 }}>
              {renderStepContent(activeStep)}
            </Box>
          )}
        </Box>
  
        {/* 🐛 DEBUG INFO */}
        {showDebugInfo && debugInfo && (
          <Box sx={{ 
            m: 3, 
            p: 2, 
            bgcolor: 'rgba(33, 150, 243, 0.1)', 
            borderRadius: 2,
            border: '1px solid rgba(33, 150, 243, 0.3)'
          }}>
            <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
              🐛 Información de Debug
            </Typography>
            <pre style={{ 
              color: 'white', 
              fontSize: '0.75rem', 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Box>
        )}
      </DialogContent>
  
      {/* 🎮 ACCIONES */}
      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Anterior
              </Button>
              
              {activeStep < steps.length - 1 && (
                <Button
                  variant="outlined"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    borderColor: 'rgba(76, 175, 80, 0.5)',
                    color: '#4caf50',
                    '&:hover': {
                      borderColor: '#4caf50',
                      bgcolor: 'rgba(76, 175, 80, 0.1)'
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
          {/* Indicadores de estado */}
          {fetchingRelated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: '#2196f3' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Cargando datos...
              </Typography>
            </Box>
          )}
          
          {(profilePicture || signature) && (
            <Chip
              icon={<UpdateIcon />}
              label={`${profilePicture && signature ? 'Archivos' : profilePicture ? 'Foto' : 'Firma'} pendiente${profilePicture && signature ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 152, 0, 0.2)',
                color: '#ffab00',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                animation: 'pulse 2s infinite'
              }}
            />
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
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Cancelar
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || isSavingChanges || !hasFormChanges}
            startIcon={
              loading || isSavingChanges ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SaveIcon />
              )
            }
            sx={{
              background: 'linear-gradient(135deg, #4caf50, #45a049)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049, #388e3c)',
              },
              '&:disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            {loading || isSavingChanges 
              ? 'Guardando...' 
              : user 
                ? 'Actualizar Usuario' 
                : 'Crear Usuario'
            }
          </Button>
        </Box>
      </DialogActions>
  
      {/* 🎉 SNACKBAR DE ÉXITO PARA REGENERACIÓN DE CONTRATO */}
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
            bgcolor: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketLaunchIcon />
            <Typography sx={{ fontWeight: 600 }}>
              ¡Usuario guardado y contrato regenerado exitosamente!
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
  
      {/* 🚨 SNACKBAR DE ERROR PARA REGENERACIÓN DE CONTRATO */}
      <Snackbar
        open={!!contractRegenerationError}
        autoHideDuration={5000}
        onClose={() => setContractRegenerationError(null)}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            bgcolor: 'rgba(244, 67, 54, 0.9)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>
            Error en regeneración de contrato: {contractRegenerationError}
          </Typography>
        </Alert>
      </Snackbar>
  
      {/* 🔄 OVERLAY DE REGENERACIÓN DE CONTRATO */}
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
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 4,
            borderRadius: 3,
            bgcolor: 'rgba(30, 30, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 300
          }}>
            <CircularProgress 
              size={60} 
              sx={{ 
                color: '#4caf50',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                🔄 Regenerando Contrato
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Generando documentación actualizada...
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <AssignmentIcon sx={{ color: '#4caf50', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Este proceso puede tomar unos segundos
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
  
      {/* 🎨 ESTILOS PARA ANIMACIONES */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </Dialog>
  );
}