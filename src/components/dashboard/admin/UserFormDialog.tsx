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
  Fade,
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
import DeleteIcon from '@mui/icons-material/Delete';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import SyncIcon from '@mui/icons-material/Sync';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🚀 IMPORTAR EL COMPONENTE DE HUELLA
import FingerprintRegistration from './FingerprintRegistration';

// 🎨 DARK PRO SYSTEM - TOKENS CSS VARIABLES MEJORADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  iconDefault: '#FFFFFF',
  iconMuted: '#AAAAAA',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
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
  
  // Focus & Interactions
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800',
  
  // Roles
  roleModerator: '#9C27B0',
  roleModeratorHover: '#7B1FA2',
  roleStaff: '#FF9800',
  roleStaffHover: '#F57C00',
  roleAdmin: '#F44336',
  roleAdminHover: '#D32F2F',
  
  // Notifications
  notifSuccessBg: 'rgba(56,142,60,0.1)',
  notifErrorBg: 'rgba(211,47,47,0.1)', 
  notifWarningBg: 'rgba(255,179,0,0.1)',
  notifInfoBg: 'rgba(25,118,210,0.1)'
};

// ✅ INTERFACES CORREGIDAS Y MEJORADAS
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

// ✅ NUEVA INTERFAZ PARA ESTADO DE HUELLA
interface FingerprintState {
  status: 'none' | 'captured' | 'saving' | 'saved' | 'error';
  deviceUserId: string | null;
  fingerIndex: number | null;
  fingerName: string | null;
  message: string | null;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pendingData: any | null;
}

// ✅ INTERFAZ PARA WEBSOCKET
interface WebSocketMessage {
  action: string;
  device_user_id?: string;
  userId?: string;
  finger_index?: number;
  deleteAll?: boolean;
  templateData?: any;
  source?: string;
  updated_by?: string;
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
  fingerprintState?: FingerprintState;
  wsConnected?: boolean;
}

// ✅ CONSTANTES MEJORADAS
const WS_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const VALID_FINGER_INDICES = Array.from({ length: 10 }, (_, i) => i);

// 🔧 FUNCIONES DE CONVERSIÓN
const convertMaritalStatusToCode = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'Soltero/a': 'soltero',
    'Soltero': 'soltero',
    'Soltera': 'soltero',
    'Casado/a': 'casado',
    'Casado': 'casado',
    'Casada': 'casado',
    'Divorciado/a': 'divorciado',
    'Divorciado': 'divorciado',
    'Divorciada': 'divorciado',
    'Viudo/a': 'viudo',
    'Viudo': 'viudo',
    'Viuda': 'viudo'
  };
  return statusMap[status] || status.toLowerCase();
};

const convertMaritalStatusToDisplay = (code: string): string => {
  const codeMap: { [key: string]: string } = {
    'soltero': 'Soltero/a',
    'casado': 'Casado/a',
    'divorciado': 'Divorciado/a',
    'viudo': 'Viudo/a'
  };
  return codeMap[code] || code;
};

const convertTrainingLevelToCode = (level: string): string => {
  return level ? level.toLowerCase() : 'principiante';
};

const convertTrainingLevelToDisplay = (code: string): string => {
  const levelMap: { [key: string]: string } = {
    'principiante': 'Principiante',
    'intermedio': 'Intermedio',
    'avanzado': 'Avanzado'
  };
  return levelMap[code] || code;
};

// ✅ FUNCIÓN REGENERAR CONTRATO MEJORADA
const regenerateContract = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 [CONTRACT] Iniciando regeneración para usuario:', userId);
    
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        forceRegenerate: true,
        isUpdate: true,
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
};

// ✅ FUNCIÓN CORREGIDA PARA ELIMINAR ARCHIVOS ANTIGUOS
const deleteOldFiles = async (userId: string, fileType: 'profile' | 'signature', exceptFileName?: string) => {
  try {
    const supabase = createBrowserSupabaseClient();
    
    console.log(`🔍 [FILES] Listando archivos existentes para ${fileType}...`);
    
    const { data: files, error } = await supabase.storage
      .from('user-files')
      .list(userId, { 
        limit: 100,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
    
    if (error) {
      console.error('❌ [FILES] Error listing files:', error);
      return;
    }
    
    const filePrefix = fileType === 'profile' ? 'profile-' : 'signature-';
    let oldFiles = files?.filter(file => file.name.startsWith(filePrefix)) || [];
    
    if (exceptFileName) {
      oldFiles = oldFiles.filter(file => file.name !== exceptFileName);
    }
    
    if (oldFiles.length > 0) {
      const filesToDelete = oldFiles.map(file => `${userId}/${file.name}`);
      
      console.log(`🗑️ [FILES] Eliminando ${filesToDelete.length} archivos antiguos...`);
      
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.error('❌ [FILES] Error deleting old files:', deleteError);
      } else {
        console.log(`✅ [FILES] Eliminados ${filesToDelete.length} archivos antiguos`);
      }
    }
  } catch (error) {
    console.error('💥 [FILES] Error in deleteOldFiles:', error);
  }
};

// ✅ FUNCIÓN MEJORADA PARA SUBIR ARCHIVOS
const uploadFileToStorage = async (
  file: File, 
  userId: string, 
  fileType: 'profile' | 'signature'
): Promise<{ url: string; path: string } | null> => {
  try {
    console.log(`📤 [UPLOAD] Iniciando subida de ${fileType} para usuario ${userId}`);
    
    const supabase = createBrowserSupabaseClient();
    
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${fileType}-${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`📁 [UPLOAD] Subiendo archivo: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('❌ [UPLOAD] Error:', error);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
    
    console.log(`✅ [UPLOAD] Archivo subido exitosamente`);
    
    // Eliminar archivos antiguos
    await deleteOldFiles(userId, fileType, fileName);
    
    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      throw new Error('Error obteniendo URL pública');
    }
    
    console.log(`🎉 [UPLOAD] ${fileType} subido exitosamente`);
    
    return {
      url: publicUrlData.publicUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error(`💥 [UPLOAD] Error crítico subiendo ${fileType}:`, error);
    throw error;
  }
};

// ✅ FUNCIÓN saveFingerprintToDatabase CORREGIDA Y OPTIMIZADA
const saveFingerprintToDatabase = async (fingerprintData: any): Promise<{ success: boolean; error?: string; data?: any }> => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`💾 [DB-SAVE] Intento ${retryCount + 1}/${MAX_RETRIES} - Guardando huella...`, {
        user_id: fingerprintData.user_id,
        device_user_id: fingerprintData.device_user_id,
        finger_index: fingerprintData.finger_index,
        template_size: fingerprintData.template?.length || 0
      });
      
      const response = await fetch('/api/biometric/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fingerprintData,
          created_at: new Date().toISOString(),
          updated_by: 'luishdz04'
        })
      });
      
      // Manejar respuesta vacía (204)
      if (response.status === 204) {
        console.log('✅ [DB-SAVE] Guardado exitoso (204 No Content)');
        return { success: true, data: fingerprintData };
      }
      
      // Intentar parsear respuesta
      let result: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.warn('⚠️ [DB-SAVE] Error parseando JSON, usando respuesta vacía');
          result = {};
        }
      }
      
      if (!response.ok) {
        const errorMsg = result.error || result.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
      
      console.log('✅ [DB-SAVE] Huella guardada exitosamente:', result);
      return { success: true, data: result.data || fingerprintData };
      
    } catch (error: any) {
      retryCount++;
      console.error(`❌ [DB-SAVE] Error intento ${retryCount}:`, error.message);
      
      if (retryCount >= MAX_RETRIES) {
        console.error(`💥 [DB-SAVE] Falló después de ${MAX_RETRIES} intentos`);
        
        let errorMessage = error.message;
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Ya existe una huella para este usuario y dedo';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Usuario no encontrado en base de datos';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión con base de datos';
        }
        
        return { success: false, error: errorMessage };
      }
      
      // Esperar antes del retry
      console.log(`🔄 [DB-SAVE] Esperando ${retryCount * 1000}ms antes del retry...`);
      await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
    }
  }
  
  return { success: false, error: 'Error inesperado en guardado' };
};

// ✅ FUNCIÓN deleteFingerprintFromDatabase CORREGIDA
const deleteFingerprintFromDatabase = async (
  userId: string, 
  fingerIndex?: number
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    console.log('🗑️ [DB-DELETE] Eliminando de BD...', { userId, fingerIndex });
    
    // Construir URL con parámetros correctos
    let url = `/api/biometric/fingerprint?userId=${userId}`;
    
    // ✅ CORREGIDO: Manejar fingerIndex 0 correctamente
    if (fingerIndex !== undefined && fingerIndex !== null) {
      url += `&fingerIndex=${fingerIndex}`;
    } else {
      url += '&deleteAll=true';
    }
    
    const response = await fetch(url, { method: 'DELETE' });
    
    // Manejar respuesta
    if (response.status === 204 || response.status === 200) {
      console.log('✅ [DB-DELETE] Eliminado exitosamente');
      return { success: true, deletedCount: 1 };
    }
    
    let result: any = {};
    try {
      result = await response.json();
    } catch {
      // Si no hay JSON, continuar
    }
    
    if (!response.ok) {
      throw new Error(result.error || `Error HTTP ${response.status}`);
    }
    
    console.log('✅ [DB-DELETE] Resultado:', result);
    return { 
      success: true, 
      deletedCount: result.deleted_count || result.deletedCount || 1 
    };
    
  } catch (error: any) {
    console.error('❌ [DB-DELETE] Error:', error);
    return { success: false, error: error.message };
  }
};

const syncFingerprintToF22Service = async (
  templateData: any,
  wsUrl: string = 'ws://127.0.0.1:8085/ws/'
): Promise<{ 
  success: boolean; 
  uid?: number; 
  device_user_id?: number; 
  finger_name?: string; 
  message?: string; 
  error?: string 
}> => {
  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      ws = null;
    };

    const resolveOnce = (result: any) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(result);
      }
    };

    const rejectOnce = (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(error);
      }
    };

    try {
      console.log('🔄 [F22-SYNC] Iniciando sincronización con F22...', {
        device_user_id: templateData.device_user_id,
        finger_index: templateData.finger_index,
        user_id: templateData.user_id
      });
      
      ws = new WebSocket(wsUrl);
      
      timeoutId = setTimeout(() => {
        rejectOnce(new Error(`Timeout en conexión con F22 (${WS_TIMEOUT/1000}s)`));
      }, WS_TIMEOUT);
      
      ws.onopen = () => {
        console.log('✅ [F22-SYNC] WebSocket conectado');
        
        // ✅ ENVIAR COMANDO CORRECTO DE CONEXIÓN
        ws!.send(JSON.stringify({
          type: 'device',
          action: 'connect',
          data: {
            deviceType: 'F22',
            deviceId: 'F22_001' // O el ID que uses
          }
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('📨 [F22-SYNC] Respuesta:', response.type, response.action);
          
          // ✅ MANEJAR RESPUESTA DE CONEXIÓN
          if (response.type === 'device' && response.action === 'connect') {
            if (response.data?.isSuccess) {
              console.log('🔒 [F22-SYNC] F22 conectado, enviando template...');
              
              // ✅ ENVIAR COMANDO DE SINCRONIZACIÓN
              ws!.send(JSON.stringify({
                type: 'device',
                action: 'sync_fingerprint',
                data: {
                  deviceType: 'F22',
                  userId: templateData.user_id,
                  deviceUserId: templateData.device_user_id,
                  templates: [{
                    fingerIndex: templateData.finger_index,
                    template: templateData.template,
                    primary: true
                  }],
                  userName: templateData.name || `${templateData.first_name} ${templateData.last_name}`.trim()
                }
              }));
            } else {
              rejectOnce(new Error('No se pudo conectar el dispositivo F22'));
            }
          }
          
          // ✅ MANEJAR RESPUESTA DE SINCRONIZACIÓN
          else if (response.type === 'sync_result' || 
                   (response.type === 'device' && response.action === 'sync_fingerprint')) {
            if (response.data?.success) {
              console.log('✅ [F22-SYNC] Template sincronizado exitosamente');
              resolveOnce({
                success: true,
                uid: response.data.uid || templateData.device_user_id,
                device_user_id: response.data.deviceUserId || templateData.device_user_id,
                finger_name: templateData.finger_name,
                message: response.data.message || 'Sincronizado exitosamente'
              });
            } else {
              rejectOnce(new Error(response.data?.error || 'Error desconocido en F22'));
            }
          }
          
          else if (response.type === 'error' || response.type === 'command_error') {
            rejectOnce(new Error(response.message || response.error || 'Error en comando F22'));
          }
          
        } catch (parseError) {
          console.error('❌ [F22-SYNC] Error parseando respuesta:', parseError);
          rejectOnce(new Error('Error en comunicación con F22'));
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 [F22-SYNC] WebSocket cerrado:', event.code, event.reason);
        
        if (!isResolved && event.code !== 1000) {
          rejectOnce(new Error(`Conexión perdida con F22 (código: ${event.code})`));
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ [F22-SYNC] Error WebSocket:', error);
        rejectOnce(new Error('Error de conexión con servicio F22'));
      };
      
    } catch (error: any) {
      console.error('💥 [F22-SYNC] Error crítico:', error);
      rejectOnce(error);
    }
  });
};

// ✅ FUNCIÓN F22 DELETE COMPLETAMENTE CORREGIDA
const deleteFingerprintFromF22Service = async (
  deviceUserId: string,
  userId: string,
  fingerIndex?: number,
  wsUrl: string = 'ws://127.0.0.1:8085/ws/'
): Promise<{ 
  success: boolean; 
  error?: string; 
  deletedTemplates?: number;
  userDeleted?: boolean;
}> => {
  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      ws = null;
    };

    const resolveOnce = (result: any) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(result);
      }
    };

    const rejectOnce = (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(error);
      }
    };

    try {
      console.log('🗑️ [F22-DELETE] Iniciando eliminación...', {
        deviceUserId,
        userId,
        fingerIndex,
        deleteAll: fingerIndex === undefined
      });
      
      ws = new WebSocket(wsUrl);
      
      timeoutId = setTimeout(() => {
        rejectOnce(new Error(`Timeout eliminando del F22 (${WS_TIMEOUT/1000}s)`));
      }, WS_TIMEOUT);
      
      ws.onopen = () => {
        console.log('🔌 [F22-DELETE] WebSocket conectado');
        
        // ✅ USAR EL MISMO FORMATO DE CONEXIÓN QUE SYNC
        ws!.send(JSON.stringify({
          type: 'device',
          action: 'connect',
          data: {
            deviceType: 'F22',
            deviceId: 'F22_001'
          }
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('📨 [F22-DELETE] Respuesta:', response.type, response.action);
          
          // ✅ MANEJAR RESPUESTA DE CONEXIÓN (igual que sync)
          if (response.type === 'device' && response.action === 'connect') {
            if (response.data?.isSuccess) {
              console.log('🔒 [F22-DELETE] F22 conectado, enviando comando delete...');
              
              // ✅ ENVIAR COMANDO DELETE CON ESTRUCTURA CORRECTA
              const deleteCommand = {
                type: 'device',
                action: 'delete_fingerprint',
                data: {
                  deviceType: 'F22',
                  deviceUserId: deviceUserId,
                  userId: userId,
                  source: 'frontend_userform',
                  updatedBy: 'luishdz04'
                }
              };
              
              // Agregar finger_index o bandera deleteAll
              if (fingerIndex !== undefined && fingerIndex !== null) {
                deleteCommand.data.fingerIndex = fingerIndex;
                console.log('🖐️ [F22-DELETE] Eliminando dedo específico:', fingerIndex);
              } else {
                deleteCommand.data.deleteAll = true;
                console.log('🗑️ [F22-DELETE] Eliminando todas las huellas');
              }
              
              ws!.send(JSON.stringify(deleteCommand));
            } else {
              rejectOnce(new Error('No se pudo conectar el dispositivo F22'));
            }
          }
          
          // ✅ MANEJAR RESPUESTA DE ELIMINACIÓN
          else if (response.type === 'delete_result' || 
                   (response.type === 'device' && response.action === 'delete_fingerprint')) {
            if (response.data?.success) {
              console.log('✅ [F22-DELETE] Eliminación exitosa');
              resolveOnce({
                success: true,
                deletedTemplates: response.data.deletedTemplates || response.data.deleted_templates || 0,
                userDeleted: response.data.userDeleted || response.data.user_deleted || false
              });
            } else {
              rejectOnce(new Error(response.data?.error || 'Error eliminando del F22'));
            }
          }
          
          // También manejar el formato de respuesta antiguo por si el backend no se ha actualizado
          else if (response.type === 'delete_user_result') {
            if (response.data && response.data.success) {
              console.log('✅ [F22-DELETE] Eliminación exitosa (formato legacy)');
              resolveOnce({
                success: true,
                deletedTemplates: response.data.deleted_templates || 0,
                userDeleted: response.data.user_deleted || false
              });
            } else {
              rejectOnce(new Error(response.data?.error || 'Error eliminando del F22'));
            }
          }
          
          else if (response.type === 'device_connection_error') {
            rejectOnce(new Error('F22 no conectado'));
          }
          
          else if (response.type === 'error' || response.type === 'command_error') {
            rejectOnce(new Error(response.message || response.error || 'Error en comando F22'));
          }
          
        } catch (parseError) {
          console.error('❌ [F22-DELETE] Error parseando respuesta:', parseError);
          rejectOnce(new Error('Error en comunicación con F22'));
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 [F22-DELETE] WebSocket cerrado:', event.code, event.reason);
        
        if (!isResolved && event.code !== 1000) {
          rejectOnce(new Error(`Conexión perdida con F22 (código: ${event.code})`));
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ [F22-DELETE] Error WebSocket:', error);
        rejectOnce(new Error('Error de conexión con servicio F22'));
      };
      
    } catch (error: any) {
      console.error('💥 [F22-DELETE] Error crítico:', error);
      rejectOnce(error);
    }
  });
};

// 🚀 COMPONENTE PRINCIPAL ULTRA FUNCIONAL
export default function UserFormDialog({ open, onClose, user, onSave }: UserFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // 🔗 REFERENCIAS MEJORADAS
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const savingRef = useRef(false);
  
  // 📊 ESTADOS PRINCIPALES CORREGIDOS
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
  
  // ✅ ESTADO DE HUELLA MEJORADO
  const [fingerprintState, setFingerprintState] = useState<FingerprintState>({
    status: 'none',
    deviceUserId: null,
    fingerIndex: null,
    fingerName: null,
    message: null,
    error: null,
    syncStatus: 'idle',
    pendingData: null
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
  
  // 🎮 ESTADOS DE CONTROL MEJORADOS
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
  
  // 📁 ESTADOS PARA ARCHIVOS PENDIENTES
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
  
  // 🐛 ESTADO PARA DEBUG INFO MEJORADO
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    profileUrl: '',
    signatureUrl: '',
    contractUrl: '',
    initialized: false,
    complete: false,
    fingerprintState: undefined,
    wsConnected: false
  });

  // ✅ ESTADOS PARA DIALOGS
  const [fingerprintDialogOpen, setFingerprintDialogOpen] = useState(false);
  const [isDeletingFingerprint, setIsDeletingFingerprint] = useState(false);

  // ✅ FUNCIÓN PARA LIMPIAR BLOB URLS MEJORADA
  const cleanupBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
      console.log('🧹 [CLEANUP] Blob URL limpiada:', url.substring(0, 50) + '...');
    }
  }, []);

  // ✅ FUNCIÓN PARA LIMPIAR TODAS LAS BLOB URLS
  const cleanupAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current.clear();
    console.log('🧹 [CLEANUP] Todas las Blob URLs limpiadas');
  }, []);

  // ✅ FUNCIÓN CORREGIDA PARA DESCARGAR IMAGEN DESDE STORAGE
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
      
      // ✅ PASO 1: Intentar usar URL pública directa (sin blob)
      const publicUrlPath = `${userId}/${fileName}`;
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(publicUrlPath);
      
      if (publicUrlData?.publicUrl) {
        console.log(`📸 [STORAGE-URL] Usando URL pública para ${type}:`, publicUrlData.publicUrl);
        
        // ✅ VERIFICAR QUE LA URL SEA ACCESIBLE
        try {
          const testResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            // ✅ URL pública válida - NO crear blob
            setter(prev => ({
              ...prev,
              url: publicUrlData.publicUrl,
              isLoading: false,
              isValid: true,
              error: null,
              isFromStorage: true
            }));

            // ✅ USAR DIRECTAMENTE PARA PREVIEW (sin blob)
            if (type === 'profile') {
              setProfilePicturePreview(publicUrlData.publicUrl);
              // ✅ SOLO actualizar formData con URL pública válida
              setFormData(prev => ({ 
                ...prev, 
                profilePictureUrl: publicUrlData.publicUrl 
              }));
            } else {
              setSignaturePreview(publicUrlData.publicUrl);
              setFormData(prev => ({ 
                ...prev, 
                signatureUrl: publicUrlData.publicUrl 
              }));
            }
            
            setDebugInfo(prev => ({
              ...prev,
              [type === 'profile' ? 'profileUrl' : 'signatureUrl']: publicUrlData.publicUrl
            }));
            
            console.log(`✅ [STORAGE-URL] ${type} cargado con URL pública`);
            return;
          }
        } catch (testError) {
          console.warn(`⚠️ [STORAGE-URL] URL pública no accesible para ${type}, intentando descarga`);
        }
      }
      
      // ✅ PASO 2: FALLBACK - Descargar archivo y crear blob
      console.log(`🔄 [STORAGE-DOWNLOAD] Descargando ${type} como fallback...`);
      
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
      
      setter(prev => ({
        ...prev,
        url: objectUrl,
        isLoading: false,
        isValid: true,
        error: null,
        isFromStorage: true
      }));

      // ✅ SOLO para preview, NO para formData principal (evita blob en dashboard)
      if (type === 'profile') {
        setProfilePicturePreview(objectUrl);
        // ✅ NO asignar blob URL al formData principal
      } else {
        setSignaturePreview(objectUrl);
        // ✅ NO asignar blob URL al formData principal
      }
      
      setDebugInfo(prev => ({
        ...prev,
        [type === 'profile' ? 'profileUrl' : 'signatureUrl']: objectUrl
      }));
      
      console.log(`✅ [STORAGE-DOWNLOAD] ${type} descargado como blob (fallback)`);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ [STORAGE] Error cargando ${type}:`, error);
      
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
      
      // ✅ INTENTAR URL PÚBLICA PRIMERO
      const publicUrlPath = `${userId}/${fileName}`;
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(publicUrlPath);
      
      if (publicUrlData?.publicUrl) {
        console.log(`📄 [PDF-URL] Usando URL pública para contrato:`, publicUrlData.publicUrl);
        
        // ✅ USAR URL PÚBLICA DIRECTAMENTE
        setFormData(prev => ({ ...prev, contractPdfUrl: publicUrlData.publicUrl }));
        
        const timestamp = fileName.match(/contrato-(\d+)\.pdf$/);
        if (timestamp) {
          const date = new Date(parseInt(timestamp[1]));
          setContractLastUpdated(date.toISOString());
        }
        
        setDebugInfo(prev => ({
          ...prev,
          contractUrl: publicUrlData.publicUrl
        }));
        
        console.log(`✅ [PDF-URL] Contrato cargado con URL pública`);
        return;
      }
      
      // ✅ FALLBACK: Descargar si es necesario
      console.log(`🔄 [PDF-DOWNLOAD] Descargando contrato como fallback...`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(publicUrlPath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando PDF: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        cleanupBlobUrl(objectUrl);
        return;
      }
      
      setFormData(prev => ({ ...prev, contractPdfUrl: objectUrl }));
      
      const timestamp = fileName.match(/contrato-(\d+)\.pdf$/);
      if (timestamp) {
        const date = new Date(parseInt(timestamp[1]));
        setContractLastUpdated(date.toISOString());
      }
      
      setDebugInfo(prev => ({
        ...prev,
        contractUrl: objectUrl
      }));
      
      console.log(`✅ [PDF-DOWNLOAD] Contrato descargado como blob (fallback)`);
      
    } catch (error: any) {
      console.log(`ℹ️ [PDF] No se pudo descargar el contrato (normal si no existe):`, error.message);
    }
  };

  // 📁 FUNCIÓN PARA CARGAR ARCHIVOS EXISTENTES
  const loadExistingFiles = async (userId: string) => {
    if (!mountedRef.current || initializedRef.current) return;
    
    try {
      setFilesLoaded(false);
      setRetryCount(0);
      
      console.log(`📂 [LOAD-FILES] Cargando archivos existentes para usuario: ${userId}`);
      
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
      
      console.log(`📁 [LOAD-FILES] Archivos encontrados:`, files?.length || 0);
      
      if (files && files.length > 0) {
        const promises: Promise<void>[] = [];
        
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        const latestSignature = files.find(file => file.name.startsWith('signature-'));
        const latestContract = files.find(file => file.name.startsWith('contrato-'));
        
        if (latestProfile) {
          console.log('📸 [LOAD-FILES] Cargando foto de perfil:', latestProfile.name);
          promises.push(downloadImageFromStorage(latestProfile.name, userId, 'profile'));
        }
        
        if (latestSignature) {
          console.log('✍️ [LOAD-FILES] Cargando firma:', latestSignature.name);
          promises.push(downloadImageFromStorage(latestSignature.name, userId, 'signature'));
        }
        
        if (latestContract) {
          console.log('📄 [LOAD-FILES] Cargando contrato:', latestContract.name);
          promises.push(downloadPdfFromStorage(latestContract.name, userId));
        }
        
        await Promise.allSettled(promises);
      }
      
      if (mountedRef.current) {
        setFilesLoaded(true);
        setInitializationComplete(true);
        initializedRef.current = true;
        
        setDebugInfo(prev => ({
          ...prev,
          initialized: true,
          complete: true,
        }));
        
        console.log('✅ [LOAD-FILES] Carga de archivos completada');
      }
      
    } catch (error: any) {
      if (mountedRef.current) {
        console.error('💥 [LOAD-FILES] Error:', error);
        
        setErrors(prev => ({
          ...prev,
          fileLoading: `Error cargando archivos: ${error.message}`
        }));
        
        if (retryCount < 2) {
          console.log(`🔄 [LOAD-FILES] Reintentando (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              loadExistingFiles(userId);
            }
          }, RETRY_DELAY);
        } else {
          console.log('⚠️ [LOAD-FILES] Máximo de reintentos alcanzado');
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
  
  // 👀 FUNCIÓN PARA MANEJAR VISUALIZACIÓN DE PDF
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

  // ✅ CALLBACK MEJORADO PARA MANEJO DE ERROR EN HUELLA
  const handleFingerprintError = useCallback((message: string) => {
    setFingerprintState(prev => ({
      ...prev,
      status: 'error',
      error: message,
      message: null,
      syncStatus: 'idle'
    }));
    
    // Auto-limpiar después de 5 segundos
    setTimeout(() => {
      if (mountedRef.current) {
        setFingerprintState(prev => ({
          ...prev,
          error: null
        }));
      }
    }, 5000);
  }, []);

  // ✅ FUNCIONES PARA MANEJO DE HUELLA DACTILAR CORREGIDAS
  const handleFingerprintDialogOpen = useCallback(() => {
    if (!user?.id) {
      handleFingerprintError('Se requiere un usuario válido para registrar huella');
      return;
    }
    setFingerprintDialogOpen(true);
  }, [user?.id, handleFingerprintError]);

  const handleFingerprintDialogClose = useCallback(() => {
    setFingerprintDialogOpen(false);
  }, []);

  // ✅ FUNCIÓN CORREGIDA: handleFingerprintDataReady
  const handleFingerprintDataReady = useCallback(async (fingerprintData: any) => {
    try {
      console.log('📥 [FINGERPRINT] Huella capturada, almacenando temporalmente...', {
        device_user_id: fingerprintData.device_user_id,
        finger_index: fingerprintData.finger_index,
        finger_name: fingerprintData.finger_name
      });
      
      // Validar datos
      if (!fingerprintData.template) {
        throw new Error('Template de huella vacío');
      }
      
      if (!fingerprintData.device_user_id) {
        throw new Error('device_user_id requerido');
      }
      
      // ✅ Validar finger_index
      if (fingerprintData.finger_index === undefined || 
          fingerprintData.finger_index === null ||
          !VALID_FINGER_INDICES.includes(fingerprintData.finger_index)) {
        throw new Error('finger_index inválido');
      }
      
      // Actualizar estado
      setFingerprintState({
        status: 'captured',
        deviceUserId: fingerprintData.device_user_id,
        fingerIndex: fingerprintData.finger_index,
        fingerName: fingerprintData.finger_name,
        message: `🎉 ¡Huella ${fingerprintData.finger_name} capturada! Presiona "Actualizar Usuario" para guardar.`,
        error: null,
        syncStatus: 'idle',
        pendingData: {
          ...fingerprintData,
          captured_at: new Date().toISOString()
        }
      });
      
      // Marcar cambios
      setHasFormChanges(true);
      
      console.log('✅ [FINGERPRINT] Huella almacenada temporalmente');
      
    } catch (error: any) {
      console.error('❌ [FINGERPRINT] Error:', error);
      handleFingerprintError(`Error: ${error.message}`);
    }
  }, [handleFingerprintError]);

  // ✅ FUNCIÓN COMPLETAMENTE CORREGIDA PARA ELIMINAR HUELLA
  const handleDeleteFingerprint = useCallback(async () => {
    if (!user?.id) {
      handleFingerprintError('Se requiere un usuario válido');
      return;
    }

    if (!window.confirm('¿Eliminar la huella de BD y F22? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeletingFingerprint(true);
      setFingerprintState(prev => ({
        ...prev,
        status: 'none',
        error: null,
        message: null,
        syncStatus: 'syncing'
      }));

      console.log('🗑️ [DELETE] Iniciando eliminación para usuario:', user.id);

      // ✅ PASO 1: Obtener device_user_id y finger_index de BD
      let deviceUserId = null;
      let fingerIndex = null;
      
      // Primero verificar si tenemos datos pendientes
      if (fingerprintState.pendingData) {
        deviceUserId = fingerprintState.pendingData.device_user_id;
        fingerIndex = fingerprintState.pendingData.finger_index;
        console.log('📊 [DELETE] Usando datos pendientes:', { deviceUserId, fingerIndex });
      } else {
        // Si no, obtener de BD
        console.log('🔍 [DELETE] Obteniendo device_user_id de BD...');
        
        const response = await fetch(
          `/api/biometric/fingerprint?userId=${user.id}&getDeviceId=true`,
          { method: 'GET' }
        );
        
        if (response.ok) {
          const fingerprintInfo = await response.json();
          deviceUserId = fingerprintInfo.device_user_id;
          fingerIndex = fingerprintInfo.finger_index;
          
          console.log('✅ [DELETE] Información obtenida:', {
            device_user_id: deviceUserId,
            finger_index: fingerIndex,
            finger_name: fingerprintInfo.finger_name
          });
        } else {
          console.warn('⚠️ [DELETE] No se pudo obtener device_user_id de BD');
        }
      }

      // ✅ PASO 2: Eliminar de BD
      console.log('💾 [DELETE] Eliminando de base de datos...');
      
      const dbResult = await deleteFingerprintFromDatabase(user.id, fingerIndex || undefined);

      if (dbResult.success) {
        console.log('✅ [DELETE] Eliminado de BD exitosamente');
        
        // ✅ PASO 3: Eliminar del F22 si tenemos device_user_id
        if (deviceUserId) {
          try {
            console.log('🔄 [DELETE] Eliminando del F22...', {
              deviceUserId,
              userId: user.id,
              fingerIndex
            });
            
            const f22Result = await deleteFingerprintFromF22Service(
              deviceUserId.toString(),
              user.id,
              fingerIndex || undefined
            );
            
            if (f22Result.success) {
              console.log('✅ [DELETE] Eliminación F22 exitosa');
              setFingerprintState(prev => ({
                ...prev,
                status: 'none',
                syncStatus: 'success',
                message: `✅ Huella eliminada completamente (BD + F22)\n${f22Result.deletedTemplates || 0} plantillas eliminadas del dispositivo`,
                deviceUserId: null,
                fingerIndex: null,
                fingerName: null,
                pendingData: null
              }));
            } else {
              throw new Error(f22Result.error || 'Error eliminando del F22');
            }
            
          } catch (f22Error: any) {
            console.warn('⚠️ [DELETE] Error en F22 (BD ya limpio):', f22Error.message);
            setFingerprintState(prev => ({
              ...prev,
              status: 'none',
              syncStatus: 'error',
              error: `⚠️ Eliminada de BD pero error en F22: ${f22Error.message}`,
              deviceUserId: null,
              fingerIndex: null,
              fingerName: null,
              pendingData: null
            }));
          }
        } else {
          setFingerprintState(prev => ({
            ...prev,
            status: 'none',
            syncStatus: 'error',
            message: '⚠️ Eliminada de BD (sin device_user_id para F22)',
            deviceUserId: null,
            fingerIndex: null,
            fingerName: null,
            pendingData: null
          }));
        }

        // Actualizar estado del formulario
        setFormData(prev => ({ ...prev, fingerprint: false }));
        setHasFormChanges(true);

      } else {
        throw new Error(dbResult.error || 'Error eliminando de BD');
      }
      
    } catch (error: any) {
      console.error('💥 [DELETE] Error crítico:', error);
      handleFingerprintError(`Error eliminando: ${error.message}`);
    } finally {
      setIsDeletingFingerprint(false);
      
      // Limpiar mensajes después de 8 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          setFingerprintState(prev => ({
            ...prev,
            message: null,
            syncStatus: 'idle'
          }));
        }
      }, 8000);
    }
  }, [user?.id, fingerprintState.pendingData, handleFingerprintError]);

  // ✅ FUNCIÓN PARA ELIMINAR TODAS LAS HUELLAS
  const handleDeleteAllFingerprints = useCallback(async () => {
    if (!user?.id) {
      handleFingerprintError('Se requiere un usuario válido');
      return;
    }

    if (!window.confirm(
      '⚠️ ¿Eliminar TODAS las huellas?\n\n' +
      '• Se eliminarán de la base de datos\n' +
      '• Se eliminarán del dispositivo F22\n' +
      '• Esta acción no se puede deshacer'
    )) {
      return;
    }

    try {
      setIsDeletingFingerprint(true);
      setFingerprintState(prev => ({
        ...prev,
        error: null,
        message: null,
        syncStatus: 'syncing'
      }));

      console.log('🗑️ [DELETE-ALL] Iniciando eliminación completa para:', user.id);

      // Obtener device_user_id
      let deviceUserId = fingerprintState.deviceUserId;
      
      if (!deviceUserId) {
        try {
          const response = await fetch(
            `/api/biometric/fingerprint?userId=${user.id}&getDeviceId=true`,
            { method: 'GET' }
          );
          
          if (response.ok) {
            const data = await response.json();
            deviceUserId = data.device_user_id;
          }
        } catch {
          console.warn('⚠️ [DELETE-ALL] No se pudo obtener device_user_id');
        }
      }

      // Eliminar TODAS de BD
      console.log('💾 [DELETE-ALL] Eliminando todas las huellas de BD...');
      
      const dbResult = await deleteFingerprintFromDatabase(user.id); // Sin fingerIndex

      if (dbResult.success) {
        console.log('✅ [DELETE-ALL] BD limpia');
        
        // Eliminar del F22
        if (deviceUserId) {
          try {
            const f22Result = await deleteFingerprintFromF22Service(
              deviceUserId.toString(),
              user.id
              // Sin fingerIndex = eliminar todas
            );
            
            if (f22Result.success) {
              setFingerprintState({
                status: 'none',
                deviceUserId: null,
                fingerIndex: null,
                fingerName: null,
                message: `🎉 Limpieza completa exitosa!\n✅ BD: Todas eliminadas\n✅ F22: ${f22Result.deletedTemplates || 0} plantillas eliminadas`,
                error: null,
                syncStatus: 'success',
                pendingData: null
              });
            } else {
              throw new Error(f22Result.error);
            }
            
          } catch (f22Error: any) {
            setFingerprintState(prev => ({
              ...prev,
              status: 'none',
              syncStatus: 'error',
              error: `⚠️ BD limpia pero error en F22: ${f22Error.message}`,
              deviceUserId: null,
              fingerIndex: null,
              fingerName: null,
              pendingData: null
            }));
          }
        } else {
          setFingerprintState(prev => ({
            ...prev,
            status: 'none',
            message: '⚠️ BD limpia (sin device_user_id para F22)',
            deviceUserId: null,
            fingerIndex: null,
            fingerName: null,
            pendingData: null
          }));
        }

        // Actualizar formulario
        setFormData(prev => ({ ...prev, fingerprint: false }));
        setHasFormChanges(true);

      } else {
        throw new Error(dbResult.error);
      }
      
    } catch (error: any) {
      console.error('💥 [DELETE-ALL] Error:', error);
      handleFingerprintError(`Error: ${error.message}`);
    } finally {
      setIsDeletingFingerprint(false);
      
      setTimeout(() => {
        if (mountedRef.current) {
          setFingerprintState(prev => ({
            ...prev,
            message: null,
            syncStatus: 'idle'
          }));
        }
      }, 8000);
    }
  }, [user?.id, fingerprintState.deviceUserId, handleFingerprintError]);

  // 🔄 useEffect para cierre automático después del éxito
  useEffect(() => {
    if (contractRegenerationSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setContractRegenerationSuccess(false);
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [contractRegenerationSuccess, onClose]);

  // 🔄 HANDLER MEJORADO PARA CAMBIO DE ARCHIVOS
  const handleFileChange = (fileType: 'profilePicture' | 'signature' | 'contract') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      console.log(`📁 [FILE] ${fileType} seleccionado:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      let isValid = true;
      let errorMessage = '';
      
      // Validación mejorada
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
        e.target.value = ''; // Limpiar input
        return;
      }
      
      // Limpiar errores
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileType];
        return newErrors;
      });
      
      // Limpiar blob URLs anteriores
      if (fileType === 'profilePicture' && profilePicturePreview) {
        cleanupBlobUrl(profilePicturePreview);
      } else if (fileType === 'signature' && signaturePreview) {
        cleanupBlobUrl(signaturePreview);
      }
      
      // Crear nueva blob URL
      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(objectUrl);
      
      // Actualizar estados
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
      } else if (fileType === 'contract') {
        setContract(file);
      }
      
      setHasFormChanges(true);
      console.log('🔄 [FILE] Archivo pendiente de subida');
      
      // Limpiar input
      e.target.value = '';
    };

  // ✅ COMPONENTE AVATAR CORREGIDO
  const ProfileAvatar = () => {
    if (!initializationComplete) {
      return (
        <Skeleton
          variant="circular"
          width={120}
          height={120}
          sx={{ 
            bgcolor: darkProTokens.grayMedium,
            mx: 'auto',
            mb: 2
          }}
        />
      );
    }
    
    // ✅ LÓGICA CORREGIDA para URLs (evita blob URLs incorrectas)
    const getCurrentImageUrl = () => {
      // 1. Si hay archivo nuevo pendiente -> usar blob preview
      if (profilePicture && profilePicturePreview) {
        return profilePicturePreview;
      }
      
      // 2. Si hay imagen válida del storage -> usar su URL
      if (profileImage.isValid && profileImage.url) {
        return profileImage.url;
      }
      
      // 3. Si hay URL en formData (desde BD) y NO es blob -> usarla
      if (formData.profilePictureUrl && !formData.profilePictureUrl.startsWith('blob:')) {
        return formData.profilePictureUrl;
      }
      
      // 4. Sin imagen
      return undefined;
    };
    
    const currentImageUrl = getCurrentImageUrl();
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'relative',
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
            borderRadius: '50%',
            padding: '4px',
            boxShadow: `0 8px 25px ${darkProTokens.primary}40`
          }}>
            <Avatar 
              src={currentImageUrl}
              sx={{ 
                width: 120, 
                height: 120,
                border: `3px solid ${darkProTokens.surfaceLevel1}`,
                fontSize: '2.5rem',
                fontWeight: 'bold',
                bgcolor: darkProTokens.surfaceLevel2,
                color: darkProTokens.primary,
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
                top: -8,
                left: -8,
                bgcolor: darkProTokens.warning,
                color: darkProTokens.background,
                fontSize: '0.7rem',
                height: 24,
                border: `1px solid ${darkProTokens.warningHover}`,
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                },
                animation: 'pulse 2s infinite'
              }}
            />
          )}

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
              bgcolor: `${darkProTokens.background}DD`
            }}>
              <CircularProgress 
                size={36} 
                sx={{ color: darkProTokens.primary }} 
              />
            </Box>
          )}
          
          {profileImage.error && !profileImage.isLoading && (
            <Tooltip title={profileImage.error}>
              <Box sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: darkProTokens.error,
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${darkProTokens.error}40`,
                border: `2px solid ${darkProTokens.background}`,
                cursor: 'pointer'
              }}
              onClick={() => retryImageLoad('profile')}
              >
                <ErrorIcon sx={{ fontSize: 16, color: darkProTokens.textPrimary }} />
              </Box>
            </Tooltip>
          )}

          <IconButton 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              width: 40,
              height: 40,
              border: `3px solid ${darkProTokens.surfaceLevel1}`,
              boxShadow: `0 4px 20px ${darkProTokens.primary}40`,
              '&:hover': { 
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'scale(1.1)',
                boxShadow: `0 6px 25px ${darkProTokens.primary}60`,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              },
              transition: 'all 0.2s ease'
            }}
            component="label"
            disabled={fileUploading.profilePicture}
          >
            {fileUploading.profilePicture ? (
              <CircularProgress size={20} sx={{ color: darkProTokens.background }} />
            ) : (
              <>
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange('profilePicture')}
                  disabled={fileUploading.profilePicture}
                />
                <PhotoCamera sx={{ fontSize: 20 }} />
              </>
            )}
          </IconButton>
        </Box>
      </Box>
    );
  };

  // ✅ COMPONENTE FIRMA CORREGIDO
  const SignatureDisplay = () => {
    if (!initializationComplete) {
      return (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={120}
          sx={{ 
            bgcolor: darkProTokens.grayMedium, 
            borderRadius: 2
          }}
        />
      );
    }
    
    // ✅ LÓGICA CORREGIDA para URLs de firma
    const getCurrentSignatureUrl = () => {
      // 1. Si hay archivo nuevo pendiente -> usar blob preview
      if (signature && signaturePreview) {
        return signaturePreview;
      }
      
      // 2. Si hay imagen válida del storage -> usar su URL
      if (signatureImage.isValid && signatureImage.url) {
        return signatureImage.url;
      }
      
      // 3. Si hay URL en formData (desde BD) y NO es blob -> usarla
      if (formData.signatureUrl && !formData.signatureUrl.startsWith('blob:')) {
        return formData.signatureUrl;
      }
      
      // 4. Sin firma
      return undefined;
    };
    
    const currentSignatureUrl = getCurrentSignatureUrl();
    
    if (currentSignatureUrl) {
      return (
        <Box sx={{ 
          position: 'relative', 
          width: '100%',
          bgcolor: darkProTokens.textPrimary,
          borderRadius: 2,
          p: 2,
          boxShadow: `0 4px 15px ${darkProTokens.background}40`,
          border: `2px solid ${darkProTokens.roleModerator}40`
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
          
          <Chip
            icon={signature ? <UpdateIcon /> : <VerifiedIcon />}
            label={signature ? "Pendiente" : "Verificada"}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: signature ? darkProTokens.warning : darkProTokens.success,
              color: darkProTokens.textPrimary,
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: darkProTokens.textPrimary, fontSize: 14 },
              ...(signature && {
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                },
                animation: 'pulse 2s infinite'
              })
            }}
          />
          
          <IconButton
            component="label"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: `${darkProTokens.roleModerator}E6`,
              color: darkProTokens.textPrimary,
              '&:hover': { 
                bgcolor: darkProTokens.roleModerator,
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
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
            <Tooltip title="Reintentar carga">
              <IconButton
                size="small"
                onClick={() => retryImageLoad('signature')}
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: `${darkProTokens.error}E6`,
                  color: darkProTokens.textPrimary,
                  '&:hover': { bgcolor: darkProTokens.error }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
        border: `2px dashed ${darkProTokens.roleModerator}40`,
        bgcolor: `${darkProTokens.roleModerator}05`,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: `${darkProTokens.roleModerator}60`,
          bgcolor: `${darkProTokens.roleModerator}10`
        }
      }}>
        {signatureImage.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} sx={{ color: darkProTokens.roleModerator }} />
            <Typography variant="caption" sx={{ color: darkProTokens.roleModerator, fontWeight: 500 }}>
              Cargando firma...
            </Typography>
          </Box>
        ) : signatureImage.error ? (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ color: darkProTokens.error, mb: 1, fontSize: 28 }} />
            <Typography variant="caption" sx={{ color: darkProTokens.error, display: 'block', fontWeight: 500 }}>
              Error: {signatureImage.error}
            </Typography>
            <Button
              size="small"
              onClick={() => retryImageLoad('signature')}
              startIcon={<RefreshIcon />}
              sx={{ 
                color: darkProTokens.roleModerator, 
                mt: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: `${darkProTokens.roleModerator}10` }
              }}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <SignatureIcon sx={{ color: `${darkProTokens.roleModerator}60`, fontSize: 32, mb: 1 }} />
            <Typography variant="caption" sx={{ color: `${darkProTokens.roleModerator}80`, fontWeight: 500, display: 'block', mb: 2 }}>
              Sin firma registrada
            </Typography>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<PhotoCamera />}
              sx={{
                borderColor: `${darkProTokens.roleModerator}60`,
                color: darkProTokens.roleModerator,
                '&:hover': {
                  borderColor: darkProTokens.roleModerator,
                  bgcolor: `${darkProTokens.roleModerator}10`
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

  // 🚀 COMPONENTE CONTRATO PDF MEJORADO
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
          bgcolor: darkProTokens.surfaceLevel2,
          border: `2px dashed ${darkProTokens.borderDefault}`
        }}>
          <CircularProgress size={28} sx={{ color: darkProTokens.info }} />
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
          background: `linear-gradient(135deg, ${darkProTokens.info}15, ${darkProTokens.infoHover}15)`,
          border: `2px solid ${darkProTokens.info}40`,
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 40, color: darkProTokens.info }} />
            <Box>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 700,
                mb: 0.5
              }}>
                Contrato Disponible
              </Typography>
              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                Documento oficial generado
              </Typography>
            </Box>
          </Box>
          
          {contractLastUpdated && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${darkProTokens.info}20`,
              border: `1px solid ${darkProTokens.info}40`
            }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: darkProTokens.info }} />
              <Typography variant="caption" sx={{ 
                color: darkProTokens.textSecondary,
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
          
          <Button
            variant="contained"
            onClick={handlePdfView}
            startIcon={<VisibilityIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
              color: darkProTokens.textPrimary,
              px: 3,
              py: 1,
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: `0 4px 15px ${darkProTokens.info}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.infoHover}, ${darkProTokens.info})`,
                boxShadow: `0 6px 20px ${darkProTokens.info}50`,
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
        border: `2px dashed ${darkProTokens.info}40`,
        bgcolor: `${darkProTokens.info}05`
      }}>
        <AssignmentIcon sx={{ color: `${darkProTokens.info}60`, fontSize: 36, mb: 1 }} />
        <Typography variant="caption" sx={{ color: `${darkProTokens.info}80`, fontWeight: 500 }}>
          Se generará automáticamente
        </Typography>
      </Box>
    );
  };

  // ✅ COMPONENTE DE CONTROL DE HUELLA COMPLETAMENTE CORREGIDO
  const FingerprintControl = () => {
    const hasFingerprintInDB = formData.fingerprint;
    const hasPendingFingerprint = fingerprintState.status === 'captured';
    const isSyncing = fingerprintState.syncStatus === 'syncing';
    const isDeleting = isDeletingFingerprint;
    
    // Determinar estado visual
    const getStatusColor = () => {
      if (hasFingerprintInDB) return darkProTokens.success;
      if (hasPendingFingerprint) return darkProTokens.warning;
      return darkProTokens.error;
    };
    
    const getStatusIcon = () => {
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'success') {
        return <VerifiedIcon sx={{ color: darkProTokens.success, fontSize: '1rem' }} />;
      }
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'error') {
        return <ErrorIcon sx={{ color: darkProTokens.warning, fontSize: '1rem' }} />;
      }
      if (hasFingerprintInDB) {
        return <SecurityIcon sx={{ color: darkProTokens.info, fontSize: '1rem' }} />;
      }
      if (hasPendingFingerprint) {
        return <AccessTimeIcon sx={{ color: darkProTokens.warning, fontSize: '1rem' }} />;
      }
      return <ErrorIcon sx={{ color: darkProTokens.error, fontSize: '1rem' }} />;
    };
    
    const getStatusText = () => {
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'success') {
        return 'Registrada + F22 sincronizado';
      }
      if (hasFingerprintInDB && fingerprintState.syncStatus === 'error') {
        return 'En BD - Error sincronizando F22';
      }
      if (hasFingerprintInDB) {
        return 'Registrada en BD';
      }
      if (hasPendingFingerprint) {
        return 'Capturada - Pendiente de guardar';
      }
      return 'No registrada';
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
            width: 40,
            height: 40
          }}>
            <FingerPrintIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ 
              color: darkProTokens.textPrimary, 
              fontWeight: 600,
              mb: 0.5
            }}>
              Huella Dactilar (F22 SDK)
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
            
            {/* Mensajes adicionales */}
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
            
            {/* Indicador de datos pendientes */}
            {hasPendingFingerprint && (
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
                    height: 20,
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
          {/* Botón principal */}
          <Tooltip title={hasFingerprintInDB ? "Reemplazar huella" : "Registrar nueva huella"}>
            <Button
              variant="contained"
              size="small"
              onClick={handleFingerprintDialogOpen}
              disabled={!user?.id || isDeleting || isSyncing}
              startIcon={
                isSyncing ? <CircularProgress size={16} /> : <FingerPrintIcon />
              }
              sx={{
                bgcolor: hasFingerprintInDB ? darkProTokens.info : darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 600,
                px: 2,
                minWidth: '120px',
                '&:hover': {
                  bgcolor: hasFingerprintInDB ? darkProTokens.infoHover : darkProTokens.primaryHover,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${hasFingerprintInDB ? darkProTokens.info : darkProTokens.primary}40`
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
          
          {/* Botón eliminar específico */}
          {(hasFingerprintInDB || hasPendingFingerprint) && (
            <Tooltip title="Eliminar huella actual">
              <Button
                variant="outlined"
                size="small"
                onClick={handleDeleteFingerprint}
                disabled={!user?.id || isDeleting || isSyncing}
                startIcon={
                  isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />
                }
                sx={{
                  borderColor: darkProTokens.error,
                  color: darkProTokens.error,
                  fontWeight: 600,
                  px: 2,
                  minWidth: '120px',
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: `${darkProTokens.error}10`,
                    borderColor: darkProTokens.errorHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    borderColor: darkProTokens.grayMedium,
                    color: darkProTokens.textDisabled
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </Tooltip>
          )}

          {/* Botón limpiar todas */}
          {hasFingerprintInDB && (
            <Tooltip title="Eliminar TODAS las huellas del usuario">
              <Button
                variant="outlined"
                size="small"
                onClick={handleDeleteAllFingerprints}
                disabled={!user?.id || isDeleting || isSyncing}
                startIcon={
                  isDeleting ? <CircularProgress size={16} /> : <CleaningServicesIcon />
                }
                sx={{
                  borderColor: darkProTokens.error,
                  color: darkProTokens.error,
                  fontWeight: 600,
                  px: 2,
                  minWidth: '120px',
                  fontSize: '0.7rem',
                  background: `${darkProTokens.error}05`,
                  '&:hover': {
                    bgcolor: `${darkProTokens.error}15`,
                    borderColor: darkProTokens.errorHover,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    borderColor: darkProTokens.grayMedium,
                    color: darkProTokens.textDisabled
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isDeleting ? 'Limpiando...' : 'Limpiar TODAS'}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  // ✅ FUNCIÓN handleSubmit COMPLETAMENTE CORREGIDA
  const handleSubmit = async () => {
    // Prevenir doble guardado
    if (savingRef.current) {
      console.log('⚠️ [SUBMIT] Ya se está guardando, ignorando...');
      return;
    }
    
    try {
      savingRef.current = true;
      setLoading(true);
      setIsSavingChanges(true);
      setContractRegenerationError(null);
      
      console.log('🚀 [SUBMIT] Iniciando proceso de guardado...');
      console.log('📊 [SUBMIT] Estado actual:', {
        hasFormChanges,
        hasPendingFingerprint: !!fingerprintState.pendingData,
        fingerprintStatus: fingerprintState.status
      });
      
      // Validar formulario
      if (!validateStep(activeStep)) {
        setLoading(false);
        setIsSavingChanges(false);
        savingRef.current = false;
        return;
      }
      
      const userId = formData.id || user?.id || crypto.randomUUID();
      let updatedFormData = { ...formData, id: userId };
      
      // 1️⃣ SUBIR ARCHIVOS PENDIENTES
      if (profilePicture) {
        console.log('📤 [SUBMIT] Subiendo foto de perfil...');
        setFileUploading(prev => ({ ...prev, profilePicture: true }));
        
        try {
          const uploadResult = await uploadFileToStorage(profilePicture, userId, 'profile');
          if (uploadResult) {
            updatedFormData.profilePictureUrl = uploadResult.url;
            console.log('✅ [SUBMIT] Foto subida');
            
            setProfilePicturePreview(uploadResult.url);
            setProfileImage(prev => ({
              ...prev,
              url: uploadResult.url,
              fileName: uploadResult.path.split('/').pop() || '',
              isFromStorage: true
            }));
          }
        } catch (error: any) {
          console.error('❌ [SUBMIT] Error subiendo foto:', error);
          setErrors(prev => ({ ...prev, profilePicture: error.message }));
          throw error;
        } finally {
          setFileUploading(prev => ({ ...prev, profilePicture: false }));
        }
      }
      
      if (signature) {
        console.log('📤 [SUBMIT] Subiendo firma...');
        setFileUploading(prev => ({ ...prev, signature: true }));
        
        try {
          const uploadResult = await uploadFileToStorage(signature, userId, 'signature');
          if (uploadResult) {
            updatedFormData.signatureUrl = uploadResult.url;
            console.log('✅ [SUBMIT] Firma subida');
            
            setSignaturePreview(uploadResult.url);
            setSignatureImage(prev => ({
              ...prev,
              url: uploadResult.url,
              fileName: uploadResult.path.split('/').pop() || '',
              isFromStorage: true
            }));
          }
        } catch (error: any) {
          console.error('❌ [SUBMIT] Error subiendo firma:', error);
          setErrors(prev => ({ ...prev, signature: error.message }));
          throw error;
        } finally {
          setFileUploading(prev => ({ ...prev, signature: false }));
        }
      }
      
      // 2️⃣ PREPARAR DATOS FINALES
      const processedFormData = {
        ...updatedFormData,
        gender: updatedFormData.gender ? 
          updatedFormData.gender.charAt(0).toUpperCase() + updatedFormData.gender.slice(1) : '',
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
        membership: formData.rol === 'cliente' ? processedMembershipData : null,
      };
      
      // 3️⃣ GUARDAR USUARIO EN BD
      console.log('💾 [SUBMIT] Guardando usuario en BD...');
      await onSave(userData);
      console.log('✅ [SUBMIT] Usuario guardado en BD');
      
      // 4️⃣ PROCESAR HUELLA PENDIENTE
      if (fingerprintState.pendingData && fingerprintState.status === 'captured') {
        console.log('🖐️ [SUBMIT] Procesando huella pendiente...');
        setFingerprintState(prev => ({
          ...prev,
          syncStatus: 'syncing'
        }));
        
        try {
          // Preparar datos para BD
          const templateDataForDB = {
            user_id: userId,
            template: fingerprintState.pendingData.template,
            device_user_id: fingerprintState.pendingData.device_user_id,
            finger_index: fingerprintState.pendingData.finger_index,
            finger_name: fingerprintState.pendingData.finger_name,
            primary_template: fingerprintState.pendingData.primary_template,
            verification_template: fingerprintState.pendingData.verification_template,
            backup_template: fingerprintState.pendingData.backup_template,
            combined_template: fingerprintState.pendingData.combined_template,
            average_quality: fingerprintState.pendingData.average_quality,
            capture_count: fingerprintState.pendingData.capture_count,
            capture_time_ms: fingerprintState.pendingData.capture_time_ms,
            device_info: fingerprintState.pendingData.device_info || {},
            sdk_version: 'official_zkteco',
            enrolled_at: new Date().toISOString(),
          };

          // Guardar en BD
          const dbResult = await saveFingerprintToDatabase(templateDataForDB);
          
          if (dbResult.success) {
            console.log('✅ [SUBMIT] Huella guardada en BD');
            
            // Sincronizar con F22
            const f22SyncData = {
              ...templateDataForDB,
              name: `${processedFormData.firstName || ''} ${processedFormData.lastName || ''}`.trim(),
              first_name: processedFormData.firstName,
              last_name: processedFormData.lastName
            };

            try {
              const f22Result = await syncFingerprintToF22Service(f22SyncData);
              
              if (f22Result.success) {
                console.log('✅ [SUBMIT] Huella sincronizada con F22');
                setFingerprintState(prev => ({
                  ...prev,
                  status: 'saved',
                  syncStatus: 'success',
                  message: '🎉 Usuario y huella guardados exitosamente!',
                  pendingData: null
                }));
                updatedFormData.fingerprint = true;
              } else {
                throw new Error(f22Result.error || 'Error en F22');
              }
            } catch (f22Error: any) {
              console.warn('⚠️ [SUBMIT] Error F22:', f22Error.message);
              setFingerprintState(prev => ({
                ...prev,
                status: 'saved',
                syncStatus: 'error',
                error: `BD actualizada, error F22: ${f22Error.message}`,
                pendingData: null
              }));
              updatedFormData.fingerprint = true; // BD actualizada
            }
            
          } else {
            throw new Error(dbResult.error || 'Error guardando en BD');
          }
          
        } catch (fingerprintError: any) {
          console.error('💥 [SUBMIT] Error procesando huella:', fingerprintError);
          setFingerprintState(prev => ({
            ...prev,
            syncStatus: 'error',
            error: `Error: ${fingerprintError.message}`
          }));
        }
      }
      
      // 5️⃣ REGENERAR CONTRATO SI ES NECESARIO
      if (formData.rol === 'cliente' && (hasFormChanges || fingerprintState.status === 'saved')) {
        console.log('🔄 [SUBMIT] Regenerando contrato...');
        setIsRegeneratingContract(true);
        
        try {
          const contractResult = await regenerateContract(userId);
          
          if (contractResult.success) {
            console.log('✅ [SUBMIT] Contrato regenerado');
            setContractRegenerationSuccess(true);
            
            // Recargar archivos después de un momento
            setTimeout(() => {
              if (mountedRef.current) {
                loadExistingFiles(userId);
              }
            }, 1000);
          }
        } catch (error: any) {
          console.error('❌ [SUBMIT] Error regenerando contrato:', error);
          setContractRegenerationError(error.message);
        } finally {
          setIsRegeneratingContract(false);
        }
      }
      
      // 6️⃣ LIMPIAR Y ACTUALIZAR ESTADOS
      console.log('🧹 [SUBMIT] Limpiando estados...');
      
      // Limpiar archivos pendientes
      setProfilePicture(null);
      setSignature(null);
      setContract(null);
      
      // Limpiar blob URLs
      cleanupAllBlobUrls();
      
      // Actualizar formData
      setFormData(updatedFormData);
      
      // Actualizar estados originales
      setOriginalFormData({...updatedFormData});
      setOriginalAddressData({...addressData});
      setOriginalEmergencyData({...emergencyData});
      setOriginalMembershipData({...membershipData});
      setHasFormChanges(false);
      
      console.log('🎉 [SUBMIT] Proceso completado exitosamente');
      
      // Mostrar mensaje de éxito
      if (formData.rol !== 'cliente') {
        setContractRegenerationSuccess(true);
      }
      
      // Limpiar mensajes después de 5 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          setFingerprintState(prev => ({
            ...prev,
            message: null,
            error: null
          }));
        }
      }, 5000);
      
    } catch (error: any) {
      console.error('💥 [SUBMIT] Error crítico:', error);
      setErrors({ submit: error.message || 'Error al guardar usuario' });
    } finally {
      setLoading(false);
      setIsSavingChanges(false);
      savingRef.current = false;
    }
  };

  // 🔧 MANEJADORES DE EVENTOS MEJORADOS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Limpiar error si existe
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
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setAddressData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`address_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`address_${name}`];
          return newErrors;
        });
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
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`emergency_${name}`];
          return newErrors;
        });
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
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`emergency_${name}`];
          return newErrors;
        });
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
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`membership_${name}`];
          return newErrors;
        });
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
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`membership_${name}`];
          return newErrors;
        });
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
      
      // Calcular si es menor de edad
      const today = dayjs();
      const age = today.diff(date, 'year');
      setFormData(prev => ({
        ...prev,
        isMinor: age < 18
      }));
      
      // Limpiar error
      if (errors.birthDate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.birthDate;
          return newErrors;
        });
      }
    }
  };
  
  // 🔍 FUNCIÓN DE VALIDACIÓN MEJORADA
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 0) {
      // Validaciones básicas
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'El nombre es obligatorio';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'El apellido es obligatorio';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      
      if (!formData.whatsapp.trim()) {
        newErrors.whatsapp = 'El WhatsApp es obligatorio';
      } else if (!/^\+?\d{10,15}$/.test(formData.whatsapp.replace(/[\s-]/g, ''))) {
        newErrors.whatsapp = 'Número de WhatsApp inválido';
      }
      
      if (!formData.birthDate) {
        newErrors.birthDate = 'La fecha de nacimiento es obligatoria';
      } else {
        const birthDate = dayjs(formData.birthDate);
        const today = dayjs();
        if (birthDate.isAfter(today)) {
          newErrors.birthDate = 'La fecha no puede ser futura';
        } else if (today.diff(birthDate, 'year') > 120) {
          newErrors.birthDate = 'Fecha de nacimiento inválida';
        }
      }
      
      if (!formData.gender) {
        newErrors.gender = 'El género es obligatorio';
      }
      
      if (!formData.maritalStatus) {
        newErrors.maritalStatus = 'El estado civil es obligatorio';
      }
    } else if (step === 1 && formData.rol === 'cliente') {
      // Validaciones de dirección
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
      } else if (!/^\d{5}$/.test(addressData.postalCode)) {
        newErrors.address_postalCode = 'Código postal debe ser de 5 dígitos';
      }
    } else if (step === 2 && formData.rol === 'cliente') {
      // Validaciones de emergencia
      if (!emergencyData.name.trim()) {
        newErrors.emergency_name = 'El nombre del contacto es obligatorio';
      }
      
      if (!emergencyData.phone.trim()) {
        newErrors.emergency_phone = 'El teléfono del contacto es obligatorio';
      } else if (!/^\+?\d{10,15}$/.test(emergencyData.phone.replace(/[\s-]/g, ''))) {
        newErrors.emergency_phone = 'Número de teléfono inválido';
      }
      
      if (!emergencyData.bloodType.trim()) {
        newErrors.emergency_bloodType = 'El tipo de sangre es obligatorio';
      }
    } else if (step === 3 && formData.rol === 'cliente') {
      // Validaciones de membresía
      if (!membershipData.mainMotivation.trim()) {
        newErrors.membership_mainMotivation = 'La motivación principal es obligatoria';
      } else if (membershipData.mainMotivation.trim().length < 10) {
        newErrors.membership_mainMotivation = 'Por favor proporciona más detalles (mínimo 10 caracteres)';
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

  // 📊 FUNCIÓN PARA CARGAR DATOS RELACIONADOS
  const fetchRelatedData = async (userId: string) => {
    try {
      setFetchingRelated(true);
      const supabase = createBrowserSupabaseClient();
      
      // Cargar dirección
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
      
      // Cargar contacto de emergencia
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
      
      // Cargar información de membresía
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
      console.error('❌ [FETCH] Error cargando datos relacionados:', error);
    } finally {
      setFetchingRelated(false);
    }
  };

  // ✅ useEffect PRINCIPAL PARA INICIALIZACIÓN CORREGIDO
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
      
      // Limpiar estado de huella
      setFingerprintState({
        status: 'none',
        deviceUserId: null,
        fingerIndex: null,
        fingerName: null,
        message: null,
        error: null,
        syncStatus: 'idle',
        pendingData: null
      });
      
      // Limpiar blob URLs
      cleanupAllBlobUrls();
      
      // Resetear estados de imagen
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
        complete: false,
      });
      
      // Cargar datos del usuario
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
      
      // ✅ VERIFICACIÓN DE ROL CORREGIDA
      const userRole = userData?.rol || user?.role || user?.userType || '';
      const isCliente = userRole.toLowerCase() === 'cliente' || 
                        userRole.toLowerCase() === 'client' ||
                        userRole === 'cliente';

      console.log('🔍 [ROL-DEBUG] Verificando rol de usuario:', {
        userData_rol: userData?.rol,
        user_rol: user?.rol,
        user_role: user?.role,
        user_userType: user?.userType,
        userRole,
        isCliente,
        userId: user.id
      });
      
      // Actualizar estado de huella si existe
      if (user.fingerprint) {
        setFingerprintState(prev => ({
          ...prev,
          status: 'saved'
        }));
      }
      
      // ✅ CARGAR DATOS RELACIONADOS SOLO SI ES CLIENTE
      if (isCliente) {
        console.log('✅ [ROL] Usuario confirmado como CLIENTE - Cargando datos adicionales...');
        await fetchRelatedData(user.id);
      } else {
        console.log('ℹ️ [ROL] Usuario NO es cliente, saltando datos adicionales:', {
          rol: userRole,
          userId: user.id
        });
      }
      
      // Cargar archivos existentes
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
      savingRef.current = false;
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      cleanupAllBlobUrls();
    };
  }, [cleanupAllBlobUrls]);

  // ✅ FUNCIÓN DE DETECCIÓN DE CAMBIOS CORREGIDA
  const detectChanges = useCallback(() => {
    if (!initializationComplete) return false;
    
    // Comparar datos básicos
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
    
    // Comparar dirección
    const addressFieldsToCompare = ['street', 'number', 'neighborhood', 'city', 'state', 'postalCode', 'country'];
    const addressChanged = addressFieldsToCompare.some(field => {
      const current = addressData[field as keyof Address];
      const original = originalAddressData[field as keyof Address];
      return current !== original;
    });
    
    // Comparar emergencia
    const emergencyFieldsToCompare = ['name', 'phone', 'medicalCondition', 'bloodType'];
    const emergencyChanged = emergencyFieldsToCompare.some(field => {
      const current = emergencyData[field as keyof EmergencyContact];
      const original = originalEmergencyData[field as keyof EmergencyContact];
      return current !== original;
    });
    
    // Comparar membresía
    const membershipFieldsToCompare = ['referredBy', 'mainMotivation', 'receivePlans', 'trainingLevel'];
    const membershipChanged = membershipFieldsToCompare.some(field => {
      const current = membershipData[field as keyof MembershipInfo];
      const original = originalMembershipData[field as keyof MembershipInfo];
      return current !== original;
    });
    
    // Verificar archivos nuevos
    const newFilesAdded = profilePicture !== null || signature !== null;
    
    // Verificar huella pendiente
    const fingerprintPending = fingerprintState.status === 'captured' && !!fingerprintState.pendingData;
    
    const hasChanges = userDataChanged || addressChanged || emergencyChanged || 
                      membershipChanged || newFilesAdded || fingerprintPending;
    
    return hasChanges;
  }, [
    formData, originalFormData,
    addressData, originalAddressData,
    emergencyData, originalEmergencyData,
    membershipData, originalMembershipData,
    profilePicture, signature,
    fingerprintState,
    initializationComplete
  ]);

  // 🔄 useEffect para detectar cambios
  useEffect(() => {
    const changes = detectChanges();
    if (changes !== hasFormChanges) {
      setHasFormChanges(changes);
      setDebugInfo(prev => ({
        ...prev,
        hasChanges: changes,
        fingerprintState: fingerprintState
      }));
    }
  }, [detectChanges, hasFormChanges, fingerprintState]);

  // 🔄 FUNCIÓN RESET DEL FORMULARIO
  const resetForm = () => {
    cleanupAllBlobUrls();
    
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
    
    // Limpiar estado de huella
    setFingerprintState({
      status: 'none',
      deviceUserId: null,
      fingerIndex: null,
      fingerName: null,
      message: null,
      error: null,
      syncStatus: 'idle',
      pendingData: null
    });
    
    setFingerprintDialogOpen(false);
    setIsDeletingFingerprint(false);
    
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
    savingRef.current = false;
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
    // 🎨 ESTILOS MEJORADOS PARA INPUTS
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
                    onChange={handleBirthDateChange}
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
                        <FitnessCenterIcon fontSize="small" sx={{ color: darkProTokens.success }} />
                        Cliente
                      </Box>
                    </MenuItem>
                    <MenuItem value="empleado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" sx={{ color: darkProTokens.roleStaff }} />
                        Empleado
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" sx={{ color: darkProTokens.roleAdmin }} />
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
                      bgcolor: darkProTokens.warningDark,
                      color: darkProTokens.textPrimary,
                      border: `2px solid ${darkProTokens.warning}`,
                      '& .MuiAlert-icon': { 
                        color: darkProTokens.warning 
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
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.warning, 
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
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.error, 
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
        if (formData.rol !== 'cliente') {
          return renderStepContent(steps.length - 1);
        }
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.roleModerator, 
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
                          color: darkProTokens.roleModerator,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: darkProTokens.roleModerator,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: darkProTokens.textPrimary }}>
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
              color: darkProTokens.info, 
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
                  border: `2px solid ${darkProTokens.roleModerator}40`,
                  bgcolor: `${darkProTokens.roleModerator}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: darkProTokens.roleModerator, 
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
                      {errors.signature}
                    </Alert>
                  )}
                </Box>
              </Grid>
              
              {/* CONTRATO PDF */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${darkProTokens.info}40`,
                  bgcolor: `${darkProTokens.info}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: darkProTokens.info, 
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

              {/* REGISTRO DE HUELLA DACTILAR */}
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
                    Huella Dactilar + F22
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
              
              {/* OPCIONES ADICIONALES */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `2px solid ${darkProTokens.success}40`,
                  bgcolor: `${darkProTokens.success}10`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: darkProTokens.success, 
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
                                color: darkProTokens.success,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: darkProTokens.success,
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AlternateEmailIcon sx={{ color: darkProTokens.success }} />
                            <Typography sx={{ color: darkProTokens.textPrimary }}>
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
                            <Typography sx={{ color: darkProTokens.textPrimary }}>
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
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          color: darkProTokens.textPrimary,
          maxHeight: '95vh'
        }
      }}
    >
      {/* 📋 HEADER MEJORADO */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${darkProTokens.grayDark}`,
        bgcolor: `${darkProTokens.primary}15`,
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RocketLaunchIcon sx={{ color: darkProTokens.primary, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              {user ? `Modificando: ${user.firstName} ${user.lastName}` : 'Creando nuevo perfil de usuario'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* CHIP DE CAMBIOS PENDIENTES */}
          {hasFormChanges && (
            <Chip
              icon={<UpdateIcon />}
              label={
                fingerprintState.status === 'captured' ? 
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

          {/* INDICADOR F22 SYNC STATUS */}
          {fingerprintState.syncStatus !== 'idle' && (
            <Tooltip title={
              fingerprintState.syncStatus === 'syncing' ? 'Sincronizando con F22...' :
              fingerprintState.syncStatus === 'success' ? 'F22 sincronizado correctamente' :
              'Error sincronizando con F22'
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
          
          {/* DEBUG MODE */}
          {process.env.NODE_ENV === 'development' && (
            <Chip
              icon={<SecurityIcon />}
              label="Debug"
              size="small"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              sx={{
                bgcolor: `${darkProTokens.info}20`,
                color: darkProTokens.info,
                border: `1px solid ${darkProTokens.info}40`,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: `${darkProTokens.info}30`
                }
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

      {/* 📝 CONTENIDO */}
      <DialogContent sx={{ p: 0 }}>
        {/* MENSAJES DE ERROR GLOBALES */}
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
        
        {errors.fileLoading && (
          <Alert 
            severity="warning" 
            sx={{ 
              m: 3, 
              mb: 0,
              bgcolor: darkProTokens.warningDark,
              color: darkProTokens.textPrimary,
              border: `2px solid ${darkProTokens.warning}`,
              '& .MuiAlert-icon': { 
                color: darkProTokens.textPrimary 
              },
              fontWeight: 600
            }}
          >
            {errors.fileLoading}
            <Button
              size="small"
              onClick={() => user?.id && loadExistingFiles(user.id)}
              sx={{ 
                ml: 2, 
                color: darkProTokens.textPrimary,
                borderColor: darkProTokens.warning,
                '&:hover': {
                  bgcolor: `${darkProTokens.warning}20`
                }
              }}
            >
              Reintentar
            </Button>
          </Alert>
        )}

        {/* MENSAJES DE HUELLA MEJORADOS */}
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
                  color: darkProTokens.primary,
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
                  color: darkProTokens.primary,
                  filter: `drop-shadow(0 0 8px ${darkProTokens.primary}60)`
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
                borderColor: darkProTokens.primary
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

        {/* DEBUG INFO */}
        {showDebugInfo && (
          <Box sx={{ 
            m: 3, 
            p: 2, 
            bgcolor: `${darkProTokens.info}10`, 
            borderRadius: 2,
            border: `1px solid ${darkProTokens.info}40`
          }}>
            <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 2 }}>
              🐛 Información de Debug
            </Typography>
            <pre style={{ 
              color: darkProTokens.textPrimary, 
              fontSize: '0.75rem', 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              bgcolor: darkProTokens.background,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${darkProTokens.grayDark}`
            }}>
              {JSON.stringify({
                ...debugInfo,
                formChanges: hasFormChanges,
                fingerprintState: {
                  status: fingerprintState.status,
                  hasDeviceUserId: !!fingerprintState.deviceUserId,
                  fingerIndex: fingerprintState.fingerIndex,
                  syncStatus: fingerprintState.syncStatus,
                  hasPendingData: !!fingerprintState.pendingData
                },
                currentUser: user?.id,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </Box>
        )}
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
          {!isMobile && (
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
                    borderColor: `${darkProTokens.primary}60`,
                    color: darkProTokens.primary,
                    '&:hover': {
                      borderColor: darkProTokens.primary,
                      bgcolor: `${darkProTokens.primary}10`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 15px ${darkProTokens.primary}30`
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
          {/* Indicadores de estado */}
          {fetchingRelated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: darkProTokens.info }} />
              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                Cargando datos...
              </Typography>
            </Box>
          )}
          
          {/* INDICADORES DE CAMBIOS */}
          {(profilePicture || signature || fingerprintState.status === 'captured') && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(profilePicture || signature) && (
                <Chip
                  icon={<UpdateIcon />}
                  label={
                    profilePicture && signature ? 'Archivos pendientes' : 
                    profilePicture ? 'Foto pendiente' : 
                    'Firma pendiente'
                  }
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
              
              {fingerprintState.status === 'captured' && (
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
              minWidth: '180px',
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
              : user 
                ? 'Actualizar Usuario'
                : 'Crear Usuario'
            }
          </Button>
        </Box>
      </DialogActions>

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
              ¡Usuario guardado exitosamente!
              {formData.rol === 'cliente' && ' Contrato regenerado.'}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* SNACKBAR DE ERROR */}
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
            bgcolor: darkProTokens.errorDark,
            color: darkProTokens.textPrimary,
            border: `2px solid ${darkProTokens.error}`,
            boxShadow: `0 8px 32px ${darkProTokens.error}40`,
            fontWeight: 600,
            '& .MuiAlert-icon': { 
              color: darkProTokens.textPrimary 
            }
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>
            Error en regeneración de contrato: {contractRegenerationError}
          </Typography>
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
          bgcolor: `${darkProTokens.background}DD`,
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
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            minWidth: 320,
            boxShadow: `0 20px 60px ${darkProTokens.background}80`
          }}>
            <CircularProgress 
              size={64} 
              sx={{ 
                color: darkProTokens.primary,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.textPrimary, 
                fontWeight: 600, 
                mb: 1 
              }}>
                🔄 Regenerando Contrato
              </Typography>
              <Typography variant="body2" sx={{ 
                color: darkProTokens.textSecondary 
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
              bgcolor: `${darkProTokens.primary}15`,
              border: `1px solid ${darkProTokens.primary}40`
            }}>
              <AssignmentIcon sx={{ 
                color: darkProTokens.primary, 
                fontSize: 20 
              }} />
              <Typography variant="caption" sx={{ 
                color: darkProTokens.textSecondary 
              }}>
                Este proceso puede tomar unos segundos
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

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
          onFingerprintDataReady={handleFingerprintDataReady}
          onError={handleFingerprintError}
        />
      )}

      {/* 🎨 ESTILOS CSS PERSONALIZADOS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 20px ${darkProTokens.primary}60, 
                       0 0 30px ${darkProTokens.primary}40;
          }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInScale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        /* F22 SDK ANIMATIONS */
        @keyframes f22-sync {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(270deg) scale(1.1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        
        @keyframes f22-success {
          0% {
            box-shadow: 0 0 5px ${darkProTokens.success}40;
          }
          50% {
            box-shadow: 0 0 25px ${darkProTokens.success}80, 
                       0 0 35px ${darkProTokens.success}40;
          }
          100% {
            box-shadow: 0 0 5px ${darkProTokens.success}40;
          }
        }
        
        @keyframes f22-error {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-3px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(3px);
          }
        }
        
        /* SCROLLBAR STYLES */
        .MuiDialog-paper::-webkit-scrollbar {
          width: 8px;
        }
        
        .MuiDialog-paper::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        .MuiDialog-paper::-webkit-scrollbar-thumb {
          background: linear-gradient(
            135deg, 
            ${darkProTokens.primary}, 
            ${darkProTokens.primaryHover}
          );
          border-radius: 4px;
        }
        
        .MuiDialog-paper::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            135deg, 
            ${darkProTokens.primaryHover}, 
            ${darkProTokens.primaryActive}
          );
          box-shadow: 0 0 10px ${darkProTokens.primary}60;
        }
        
        /* INPUT ANIMATIONS */
        .input-hover-glow:hover {
          box-shadow: 0 0 15px ${darkProTokens.primary}30;
        }
        
        .input-focus-glow:focus-within {
          box-shadow: 0 0 20px ${darkProTokens.primary}50;
        }
        
        /* RIPPLE EFFECT */
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        .ripple-effect {
          position: relative;
          overflow: hidden;
        }
        
        .ripple-effect::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: ${darkProTokens.primary}60;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .ripple-effect:active::before {
          width: 300px;
          height: 300px;
        }
        
        /* FOCUS STYLES */
        .enhanced-focus:focus-visible {
          outline: none;
          box-shadow: 
            0 0 0 3px ${darkProTokens.focusRing},
            0 4px 20px ${darkProTokens.primary}30;
          transform: translateY(-1px);
        }
        
        /* LOADING SPINNER */
        @keyframes spin-glow {
          0% {
            transform: rotate(0deg);
            filter: hue-rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
            filter: hue-rotate(360deg);
          }
        }
        
        .loading-spinner-glow {
          animation: spin-glow 2s linear infinite;
          filter: drop-shadow(0 0 10px ${darkProTokens.primary}60);
        }
        
        /* TRANSITIONS */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* RESPONSIVE STYLES */
        @media (max-width: 768px) {
          .mobile-hidden {
            display: none !important;
          }
          
          .mobile-full-width {
            width: 100% !important;
          }
          
          .mobile-padding {
            padding: 1rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .mobile-stack {
            flex-direction: column !important;
          }
          
          .mobile-text-center {
            text-align: center !important;
          }
        }
        
        /* ACCESSIBILITY */
        @media (prefers-contrast: high) {
          .high-contrast {
            border-width: 2px !important;
            font-weight: 600 !important;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        
        /* PRINT STYLES */
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-friendly {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
        
        /* GLOW EFFECTS */
        .primary-glow {
          box-shadow: 0 0 20px ${darkProTokens.primary}40;
        }
        
        .success-glow {
          box-shadow: 0 0 20px ${darkProTokens.success}40;
        }
        
        .error-glow {
          box-shadow: 0 0 20px ${darkProTokens.error}40;
        }
        
        .warning-glow {
          box-shadow: 0 0 20px ${darkProTokens.warning}40;
        }
        
        /* FINGERPRINT SPECIFIC */
        .fingerprint-glow {
          animation: fingerprint-pulse 3s ease-in-out infinite;
        }
        
        @keyframes fingerprint-pulse {
          0%, 100% {
            box-shadow: 0 0 15px ${darkProTokens.primary}40;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px ${darkProTokens.primary}60, 
                       0 0 35px ${darkProTokens.primary}30;
            transform: scale(1.02);
          }
        }
        
        /* TIMESTAMP INDICATOR */
        .timestamp-indicator::before {
          content: '🚀 UserFormDialog v2.1 Corregido - ${new Date().toISOString()} by @luishdz044';
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: ${darkProTokens.primary}20;
          color: ${darkProTokens.primary};
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          z-index: 10000;
          border: 1px solid ${darkProTokens.primary}40;
          backdrop-filter: blur(10px);
          opacity: 0.8;
          display: none; /* Solo visible en desarrollo */
        }
        
        /* Mostrar solo en desarrollo */
        ${process.env.NODE_ENV === 'development' ? `
          .timestamp-indicator::before {
            display: block;
          }
        ` : ''}

        /* 🎨 BLOB URL SAFETY INDICATORS */
        .blob-url-warning {
          position: relative;
        }
        
        .blob-url-warning::after {
          content: '⚠️ Blob URL detectada';
          position: absolute;
          top: -25px;
          left: 0;
          background: ${darkProTokens.warning};
          color: ${darkProTokens.background};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 1000;
          display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
        }

        /* ✅ SUCCESS INDICATORS */
        .storage-url-success {
          position: relative;
        }
        
        .storage-url-success::after {
          content: '✅ Storage URL';
          position: absolute;
          top: -25px;
          right: 0;
          background: ${darkProTokens.success};
          color: ${darkProTokens.textPrimary};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 1000;
          display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
        }

        /* 🔧 ENHANCED FORM VALIDATION */
        .form-field-error {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        /* 📱 IMPROVED MOBILE EXPERIENCE */
        @media (max-width: 768px) {
          .dialog-mobile-optimized {
            margin: 8px !important;
            max-height: calc(100vh - 16px) !important;
            width: calc(100vw - 16px) !important;
          }
          
          .stepper-mobile-compact .MuiStepLabel-label {
            font-size: 0.75rem !important;
          }
          
          .avatar-mobile-smaller {
            width: 80px !important;
            height: 80px !important;
            font-size: 1.5rem !important;
          }
        }

        /* 🎯 ENHANCED ACCESSIBILITY */
        .focus-visible-enhanced:focus-visible {
          outline: 3px solid ${darkProTokens.primary} !important;
          outline-offset: 2px !important;
          border-radius: 4px !important;
        }
        
        .high-contrast-mode {
          filter: contrast(150%) !important;
        }
        
        .reduced-motion * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }

        /* 🚀 PERFORMANCE OPTIMIZATIONS */
        .gpu-accelerated {
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .contain-layout {
          contain: layout style paint;
        }
        
        /* 🎨 ENHANCED VISUAL FEEDBACK */
        .loading-skeleton {
          background: linear-gradient(
            90deg,
            ${darkProTokens.grayMedium} 25%,
            ${darkProTokens.grayLight} 50%,
            ${darkProTokens.grayMedium} 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .success-ripple {
          position: relative;
          overflow: hidden;
        }
        
        .success-ripple::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            ${darkProTokens.success}30,
            transparent
          );
          animation: success-sweep 1s ease-out;
        }
        
        @keyframes success-sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        /* 🔒 SECURITY VISUAL INDICATORS */
        .secure-connection {
          border-left: 4px solid ${darkProTokens.success} !important;
        }
        
        .insecure-connection {
          border-left: 4px solid ${darkProTokens.error} !important;
        }
        
        .fingerprint-secure::before {
          content: '🔒';
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${darkProTokens.success};
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          z-index: 10;
        }

        /* 📊 STATUS INDICATORS */
        .status-indicator {
          position: relative;
        }
        
        .status-indicator.online::before {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: ${darkProTokens.success};
          border: 2px solid ${darkProTokens.background};
          border-radius: 50%;
          animation: pulse-status 2s infinite;
        }
        
        .status-indicator.offline::before {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: ${darkProTokens.error};
          border: 2px solid ${darkProTokens.background};
          border-radius: 50%;
        }
        
        @keyframes pulse-status {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        /* 🎭 THEME TRANSITIONS */
        .theme-transition * {
          transition: 
            background-color 0.3s ease,
            border-color 0.3s ease,
            color 0.3s ease,
            box-shadow 0.3s ease !important;
        }

        /* 📝 FORM ENHANCEMENT */
        .form-field-success {
          border-color: ${darkProTokens.success} !important;
          box-shadow: 0 0 0 2px ${darkProTokens.success}20 !important;
        }
        
        .form-field-warning {
          border-color: ${darkProTokens.warning} !important;
          box-shadow: 0 0 0 2px ${darkProTokens.warning}20 !important;
        }
        
        .form-progress-indicator {
          background: linear-gradient(
            to right,
            ${darkProTokens.success} 0%,
            ${darkProTokens.success} var(--progress, 0%),
            ${darkProTokens.grayMedium} var(--progress, 0%),
            ${darkProTokens.grayMedium} 100%
          );
          height: 4px;
          transition: all 0.3s ease;
        }

        /* 🎪 ADVANCED ANIMATIONS */
        .bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotate(2deg);
          }
          70% {
            transform: scale(0.9) rotate(-1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .slide-up {
          animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ⚡ PERFORMANCE HINTS */
        .optimized-render {
          contain: strict;
          content-visibility: auto;
          contain-intrinsic-size: 0 500px;
        }
        
        .will-change-transform {
          will-change: transform;
        }
        
        .will-change-opacity {
          will-change: opacity;
        }
        
        /* 🎨 FINAL POLISH */
        .glass-effect {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .text-gradient {
          background: linear-gradient(
            135deg,
            ${darkProTokens.primary},
            ${darkProTokens.primaryHover}
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
        
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      
      {/* 🏷️ TIMESTAMP INDICATOR FOR DEBUGGING */}
      <div className="timestamp-indicator" />
    </Dialog>
  );
}
