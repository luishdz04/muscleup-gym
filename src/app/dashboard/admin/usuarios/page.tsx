'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fade,
  Slide,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useMediaQuery,
  useTheme,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Switch,
  FormControlLabel,
  ButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Fingerprint as FingerprintIcon,
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  FitnessCenter as ClientIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Cake as CakeIcon,
  Timeline as TimelineIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Update as UpdateIcon,
  AccessTime as AccessTimeIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Analytics as StatisticsIcon,
  TrendingUp as ActivityIcon,
  GroupWork as BulkActionsIcon,
  Home as HomeIcon,
  LocalHospital as LocalHospitalIcon,
  Bloodtype as BloodtypeIcon,
  Draw as SignatureIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ClearAll as ClearAllIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import UserFormDialog from '@/components/dashboard/admin/UserFormDialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// 🎨 DARK PRO SYSTEM - TOKENS CSS VARIABLES
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
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // Document Status
  docMissing: '#B00020',
  docPending: '#FFB300',
  docApproved: '#388E3C',
  docRejected: '#D32F2F',
  docExpired: '#555555',
  docExpiringSoon: '#FFA000',
  docUploading: '#2196F3',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Profile Status
  profileComplete: '#388E3C',
  profileIncomplete: '#FFB300',
  profileSuspended: '#B00020',
  profilePending: '#1976D2',
  profileVerified: '#43A047',
  
  // Notifications
  notifNewBg: 'rgba(255,204,0,0.1)',
  notifCriticalBg: 'rgba(176,0,32,0.2)',
  notifWarningBg: 'rgba(255,160,0,0.1)',
  notifSuccessBg: 'rgba(56,142,60,0.1)',
  notifErrorBg: 'rgba(211,47,47,0.1)',
  notifInfoBg: 'rgba(25,118,210,0.1)',
  
  // Focus & Interactions
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// 🏗️ INTERFACES COMPARTIDAS - COHERENCIA TOTAL
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: 'admin' | 'empleado' | 'cliente';
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
  createdAt?: string;
  updatedAt?: string;
  // 🔄 DATOS COMPLETOS PARA COHERENCIA
  address?: Address;
  emergency?: EmergencyContact;
  membership?: MembershipInfo;
}

interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  averageAge: number;
  genderDistribution: { masculino: number; femenino: number; otro: number };
  membershipLevels: { principiante: number; intermedio: number; avanzado: number };
  completionRate: {
    profilePicture: number;
    signature: number;
    contract: number;
    allComplete: number;
  };
}

interface ActivityFeedItem {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'contract_generated' | 'images_loaded';
  message: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  icon: React.ReactNode;
  color: string;
}

// ✅ INTERFAZ DEBUGINFO CORREGIDA
interface DebugInfo {
  stage: string;
  userId?: string;
  basicUser?: User;
  completeUserData?: User;
  files?: any[] | null;
  finalUser?: User;
  error?: string;
}

// 🚀 COMPONENTE PRINCIPAL MEJORADO CON DARK PRO SYSTEM
export default function UsersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 📊 ESTADOS PRINCIPALES
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 🔍 ESTADOS DE BÚSQUEDA Y FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastActivity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 🎯 ESTADOS DE FORMULARIO Y DIÁLOGOS
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  // 🔄 ESTADOS ESPECÍFICOS PARA COHERENCIA
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [regeneratingContract, setRegeneratingContract] = useState(false);
  
  // 📈 ESTADOS DE ESTADÍSTICAS Y DASHBOARD
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    averageAge: 0,
    genderDistribution: { masculino: 0, femenino: 0, otro: 0 },
    membershipLevels: { principiante: 0, intermedio: 0, avanzado: 0 },
    completionRate: {
      profilePicture: 0,
      signature: 0,
      contract: 0,
      allComplete: 0
    }
  });
  
  // 🎨 ESTADOS DE UI Y EXPERIENCIA
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 🌐 ESTADOS DE CONECTIVIDAD Y SINCRONIZACIÓN
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // 📱 ESTADO PARA ANCLA DE MENÚ
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<User | null>(null);

  // 🆕 REFERENCIAS PARA CACHÉ Y OPTIMIZACIÓN
  const fileCache = useRef<Map<string, string>>(new Map());
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // 🔄 =============== FUNCIONES DE ARCHIVOS - MEJORADAS CON CACHÉ ===============

  // 📥 FUNCIÓN PARA DESCARGAR ARCHIVOS DESDE STORAGE CON CACHÉ
  const downloadFileFromStorage = async (fileName: string, userId: string): Promise<string | null> => {
    if (!fileName || !userId) {
      console.log('❌ downloadFileFromStorage: fileName o userId vacío');
      return null;
    }
    
    // Verificar caché primero
    const cacheKey = `${userId}/${fileName}`;
    if (fileCache.current.has(cacheKey)) {
      console.log(`✅ Archivo obtenido de caché: ${fileName}`);
      return fileCache.current.get(cacheKey)!;
    }
    
    try {
      console.log(`📥 Descargando archivo: ${fileName} para usuario: ${userId}`);
      const supabase = createBrowserSupabaseClient();
      const filePath = `${userId}/${fileName}`;
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(filePath);
      
      if (downloadError) {
        console.error(`❌ Error descargando ${fileName}:`, downloadError);
        return null;
      }
      
      if (!fileData) {
        console.error(`❌ No se obtuvo data para ${fileName}`);
        return null;
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      console.log(`✅ Archivo ${fileName} descargado exitosamente:`, objectUrl);
      
      // Guardar en caché y registrar blob URL
      fileCache.current.set(cacheKey, objectUrl);
      blobUrlsRef.current.add(objectUrl);
      
      return objectUrl;
      
    } catch (error) {
      console.error(`💥 Error en downloadFileFromStorage para ${fileName}:`, error);
      return null;
    }
  };

  // 🧹 FUNCIÓN PARA LIMPIAR CACHÉ Y BLOB URLs
  const cleanupCache = () => {
    console.log('🧹 Limpiando caché y blob URLs...');
    
    // Limpiar blob URLs
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current.clear();
    
    // Limpiar caché
    fileCache.current.clear();
    
    setSuccessMessage('Caché limpiado exitosamente');
  };

  // 🔄 FUNCIÓN PARA ACTUALIZAR UN SOLO USUARIO EN LA LISTA
  const updateUserInList = async (userId: string) => {
    try {
      console.log('🔄 Actualizando usuario específico en lista:', userId);
      
      // Obtener datos actualizados del usuario
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) return;
      
      const updatedUser = await response.json();
      
      // Cargar imagen actualizada
      const supabase = createBrowserSupabaseClient();
      const { data: files } = await supabase.storage
        .from('user-files')
        .list(userId, { 
          limit: 5, 
          sortBy: { column: 'updated_at', order: 'desc' }
        });
      
      const latestProfile = files?.find(file => file.name.startsWith('profile-'));
      if (latestProfile) {
        const profileImageUrl = await downloadFileFromStorage(latestProfile.name, userId);
        if (profileImageUrl) {
          updatedUser.profilePictureUrl = profileImageUrl;
        }
      }
      
      // Actualizar en la lista
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      console.log('✅ Usuario actualizado en lista');
      
    } catch (error) {
      console.error('❌ Error actualizando usuario en lista:', error);
    }
  };

  // 📊 FUNCIÓN PARA OBTENER DATOS COMPLETOS DEL USUARIO - CORREGIDA ✅
  const fetchCompleteUserData = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Obteniendo datos completos para usuario:', userId);
      setLoadingUserDetails(true);
      setDebugInfo({ stage: 'starting', userId });
      
      // ✅ UNA SOLA LLAMADA A TU API QUE YA FUNCIONA
      console.log('📊 Llamando a API que ya tienes...');
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en API:', errorData);
        setDebugInfo({ stage: 'api_error', userId, error: errorData.message || 'Error en API' });
        throw new Error('Error al obtener usuario: ' + (errorData.message || 'Usuario no encontrado'));
      }
      
      const completeUserData = await response.json();
      console.log('✅ Datos completos obtenidos de tu API:', completeUserData);
      setDebugInfo({ 
        stage: 'api_success',
        userId,
        completeUserData 
      });
      
      // 📁 Obtener archivos desde Storage
      console.log('📁 Obteniendo archivos del Storage...');
      let files = null;
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: filesData, error: filesError } = await supabase.storage
          .from('user-files')
          .list(userId, { 
            limit: 100, 
            offset: 0,
            sortBy: { column: 'updated_at', order: 'desc' }
          });
        
        if (filesError) {
          console.error('❌ Error obteniendo archivos:', filesError);
        } else {
          files = filesData;
          console.log('📁 Archivos obtenidos:', files);
        }
      } catch (error) {
        console.log('📁 Error obteniendo archivos (ignorando):', error);
      }
      
      setDebugInfo({ 
        stage: 'loading_files',
        userId,
        completeUserData,
        files 
      });
      
      // 🖼️ INICIALIZAR URLs COMO NULL (NO CON DATOS VIEJOS) ✅
      let profilePictureUrl = null;
      let signatureUrl = null; 
      let contractPdfUrl = null;
      
      if (files && files.length > 0) {
        console.log('🔄 Procesando archivos encontrados...');
        
        // 🎯 BUSCAR SOLO EL ARCHIVO MÁS RECIENTE DE CADA TIPO ✅
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        const latestSignature = files.find(file => file.name.startsWith('signature-'));
        const latestContract = files.find(file => file.name.startsWith('contrato-'));
        
        // 📸 PROCESAR FOTO DE PERFIL
        if (latestProfile) {
          console.log('🖼️ Descargando foto de perfil más reciente:', latestProfile.name);
          profilePictureUrl = await downloadFileFromStorage(latestProfile.name, userId);
          if (profilePictureUrl) {
            console.log('✅ Foto de perfil descargada:', profilePictureUrl);
          } else {
            console.log('❌ No se pudo descargar foto de perfil, quedará como null');
          }
        } else {
          console.log('📸 No se encontró foto de perfil en Storage');
        }
        
        // ✍️ PROCESAR FIRMA
        if (latestSignature) {
          console.log('🖊️ Descargando firma más reciente:', latestSignature.name);
          signatureUrl = await downloadFileFromStorage(latestSignature.name, userId);
          if (signatureUrl) {
            console.log('✅ Firma descargada:', signatureUrl);
          } else {
            console.log('❌ No se pudo descargar firma, quedará como null');
          }
        } else {
          console.log('✍️ No se encontró firma en Storage');
        }
        
        // 📄 PROCESAR CONTRATO
        if (latestContract) {
          console.log('📄 Descargando contrato más reciente:', latestContract.name);
          contractPdfUrl = await downloadFileFromStorage(latestContract.name, userId);
          if (contractPdfUrl) {
            console.log('✅ Contrato descargado:', contractPdfUrl);
          } else {
            console.log('❌ No se pudo descargar contrato, quedará como null');
          }
        } else {
          console.log('📄 No se encontró contrato en Storage');
        }
        
      } else {
        console.log('📁 No se encontraron archivos en el Storage');
      }
      
      // 🔧 Construir objeto usuario completo con archivos actualizados ✅
      const finalUser: User = {
        ...completeUserData,
        // ✅ SOLO USAR URLs DEL STORAGE, NO DE LA BASE DE DATOS
        profilePictureUrl: profilePictureUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        contractPdfUrl: contractPdfUrl || undefined
      };
      
      console.log('🎉 Usuario final construido:', finalUser);
      setDebugInfo({ 
        stage: 'complete',
        userId,
        completeUserData,
        files,
        finalUser 
      });
      
      return finalUser;
      
    } catch (error: any) {
      console.error('💥 Error en fetchCompleteUserData:', error);
      setDebugInfo({ 
        stage: 'error',
        userId,
        error: error.message 
      });
      return null;
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // 🔄 FUNCIÓN PARA REGENERAR CONTRATO - CORREGIDA
  const regenerateContract = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔄 Regenerando contrato para usuario:', userId);
      setRegeneratingContract(true);
      
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          isRegeneration: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error regenerando contrato:', errorData);
        setError('Error al regenerar contrato: ' + (errorData.message || 'Error desconocido'));
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Contrato regenerado exitosamente:', result);
      
      // 🔄 RECARGAR DATOS DEL MODAL DESPUÉS DE REGENERAR
      if (selectedUser) {
        setTimeout(async () => {
          const updatedUserData = await fetchCompleteUserData(userId);
          if (updatedUserData) {
            setSelectedUser(updatedUserData);
            
            // Actualizar también en la lista principal
            await updateUserInList(userId);
          }
        }, 2000);
      }
      
      setSuccessMessage('Contrato regenerado exitosamente');
      return true;
      
    } catch (error) {
      console.error('💥 Error en regenerateContract:', error);
      setError('Error al regenerar contrato');
      return false;
    } finally {
      setRegeneratingContract(false);
    }
  };

  // 🔄 =============== FUNCIONES DE DATOS ===============

  // 🔥 FUNCIÓN fetchUsers CORREGIDA PARA CARGAR IMÁGENES ✅
  const fetchUsers = async () => {
    setLoading(true);
    setLoadingImages(true);
    setError(null);
    setSyncStatus('syncing');
    
    try {
      console.log('🔍 Iniciando carga de usuarios con imágenes...');
      
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No se encontró sesión activa');
      }
      
      console.log('✅ Sesión encontrada, llamando a API...');
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener usuarios');
      }
      
      const baseUsers = await response.json();
      console.log('✅ Usuarios base obtenidos:', baseUsers?.length || 0);
      
      // 🖼️ CARGAR IMÁGENES PARA CADA USUARIO EN PARALELO
      console.log('🖼️ Iniciando carga de imágenes en paralelo...');
      const usersWithImages = await Promise.allSettled(
        (baseUsers || []).map(async (user: User) => {
          try {
            // 📁 Obtener archivos del usuario desde Storage
            const { data: files, error: filesError } = await supabase.storage
              .from('user-files')
              .list(user.id, { 
                limit: 10, 
                sortBy: { column: 'updated_at', order: 'desc' }
              });
            
            if (filesError || !files) {
              console.log(`📁 No se encontraron archivos para ${user.firstName}:`, filesError?.message);
              return user; // Retornar usuario sin cambios
            }
            
            // 🔍 Buscar solo el archivo de perfil más reciente
            const latestProfile = files.find(file => file.name.startsWith('profile-'));
            
            if (!latestProfile) {
              console.log(`📸 No hay foto de perfil para ${user.firstName}`);
              return user; // Retornar usuario sin foto
            }
            
            // 📥 Descargar imagen de perfil
            console.log(`📥 Descargando foto para ${user.firstName}:`, latestProfile.name);
            const profileImageUrl = await downloadFileFromStorage(latestProfile.name, user.id);
            
            if (profileImageUrl) {
              console.log(`✅ Foto cargada para ${user.firstName}:`, profileImageUrl);
              return {
                ...user,
                profilePictureUrl: profileImageUrl
              };
            } else {
              console.log(`❌ No se pudo descargar foto para ${user.firstName}`);
              return user;
            }
            
          } catch (error) {
            console.error(`💥 Error cargando imagen para ${user.firstName}:`, error);
            return user; // Retornar usuario sin cambios en caso de error
          }
        })
      );
      
      // 🔄 Procesar resultados y filtrar solo los exitosos
      const finalUsers = usersWithImages
        .filter((result): result is PromiseFulfilledResult<User> => result.status === 'fulfilled')
        .map(result => result.value);
      
      console.log('🎉 Usuarios finales con imágenes:', finalUsers.length);
      setUsers(finalUsers);
      
      // Actualizar feed de actividad
      const imagesLoaded = finalUsers.filter(u => u.profilePictureUrl).length;
      const newActivity: ActivityFeedItem = {
        id: Date.now().toString(),
        type: 'images_loaded',
        message: `Sincronizado: ${finalUsers.length} usuarios, ${imagesLoaded} con fotos cargadas`,
        timestamp: new Date().toISOString(),
        icon: <PhotoCameraIcon />,
        color: darkProTokens.success
      };
      
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
      setSyncStatus('idle');
      setLastSyncTime(new Date());
      
    } catch (err: any) {
      console.error('❌ Error al obtener usuarios:', err);
      setError('Error al cargar usuarios: ' + (err.message || 'Error desconocido'));
      setSyncStatus('error');
    } finally {
      setLoading(false);
      setLoadingImages(false);
    }
  };

  // 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS
  const fetchUserStatistics = async () => {
    try {
      // Calcular estadísticas locales por ahora
      const totalUsers = users.length;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newUsersThisMonth = users.filter(user => 
        user.createdAt && new Date(user.createdAt) >= startOfMonth
      ).length;

      const genderStats = users.reduce((acc, user) => {
        const gender = user.gender || 'otro';
        acc[gender as keyof typeof acc] = (acc[gender as keyof typeof acc] || 0) + 1;
        return acc;
      }, { masculino: 0, femenino: 0, otro: 0 });

      const avgAge = users.length > 0 ? Math.round(
        users.filter(u => u.birthDate).reduce((sum, user) => {
          const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
          return sum + age;
        }, 0) / users.filter(u => u.birthDate).length
      ) : 0;

      setUserStats({
        totalUsers,
        newUsersThisMonth,
        activeUsers: totalUsers,
        averageAge: avgAge,
        genderDistribution: genderStats,
        membershipLevels: { principiante: 0, intermedio: 0, avanzado: 0 },
        completionRate: {
          profilePicture: Math.round((users.filter(u => u.profilePictureUrl).length / totalUsers) * 100) || 0,
          signature: Math.round((users.filter(u => u.signatureUrl).length / totalUsers) * 100) || 0,
          contract: Math.round((users.filter(u => u.contractPdfUrl).length / totalUsers) * 100) || 0,
          allComplete: Math.round((users.filter(u => u.profilePictureUrl && u.signatureUrl && u.contractPdfUrl).length / totalUsers) * 100) || 0
        }
      });
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };

  // 🔄 =============== HANDLERS DE DIÁLOGOS ===============

  // 📝 FUNCIÓN PARA ABRIR FORMULARIO DE EDICIÓN
  const handleOpenFormDialog = (user?: User) => {
    setSelectedUser(user || null);
    setFormDialogOpen(true);
  };

  // 👀 FUNCIÓN PARA VER USUARIO CON DATOS COMPLETOS - CORREGIDA ✅
  const handleOpenViewDialog = async (user: User) => {
    console.log('👁️ Abriendo modal de detalles para usuario:', user);
    setSelectedUser(user);
    setViewUserDialogOpen(true);
    setDebugInfo({ stage: 'dialog_opened', userId: user.id, basicUser: user });
    
    try {
      const completeUserData = await fetchCompleteUserData(user.id);
      if (completeUserData) {
        console.log('🔄 Actualizando usuario con datos completos:', completeUserData);
        setSelectedUser(completeUserData);
      } else {
        console.error('❌ No se pudieron obtener datos completos del usuario');
      }
    } catch (error) {
      console.error('💥 Error obteniendo datos completos:', error);
    }
  };

  // 🔄 FUNCIÓN PARA CERRAR MODAL Y LIMPIAR MEMORY
  const handleCloseViewDialog = () => {
    setViewUserDialogOpen(false);
    setSelectedUser(null);
    setDebugInfo(null);
  };

  // 🔄 FUNCIÓN PARA RECARGAR DATOS DEL MODAL
  const refreshModalData = async () => {
    if (!selectedUser) return;
    
    console.log('🔄 Recargando datos del modal...');
    const completeUserData = await fetchCompleteUserData(selectedUser.id);
    if (completeUserData) {
      setSelectedUser(completeUserData);
      console.log('✅ Datos del modal actualizados');
    }
  };

  // 💾 FUNCIÓN PARA GUARDAR USUARIO CON SINCRONIZACIÓN - MEJORADA
  const handleSaveUser = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      let updatedUserId: string | null = null;
      
      let response;
      let actionType: string;
      
      if (userData.id) {
        // Actualizar usuario existente
        console.log('🔄 Actualizando usuario existente...');
        response = await fetch(`/api/admin/users/${userData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        actionType = 'actualizado';
        updatedUserId = userData.id;
      } else {
        // Crear nuevo usuario
        console.log('🆕 Creando nuevo usuario...');
        response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        actionType = 'creado';
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar usuario');
      }
      
      const savedUser = await response.json();
      updatedUserId = savedUser.id;
      
      // Actualizar feed de actividad
      const newActivity: ActivityFeedItem = {
        id: Date.now().toString(),
        type: userData.id ? 'user_updated' : 'user_created',
        message: `Usuario ${savedUser.firstName} ${savedUser.lastName} ${actionType} exitosamente`,
        timestamp: new Date().toISOString(),
        userId: savedUser.id,
        userName: `${savedUser.firstName} ${savedUser.lastName}`,
        icon: userData.id ? <EditIcon /> : <AddIcon />,
        color: userData.id ? darkProTokens.warning : darkProTokens.success
      };
      
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
      
      setSuccessMessage(`Usuario ${actionType} exitosamente`);
      setFormDialogOpen(false);
      setSelectedUser(null);
      
      // 🔄 ACTUALIZAR SOLO EL USUARIO ESPECÍFICO EN LUGAR DE RECARGAR TODO
      if (updatedUserId) {
        console.log('🔄 Actualizando usuario específico en lista...');
        setTimeout(async () => {
          await updateUserInList(updatedUserId!);
        }, 2000); // Dar tiempo para que se procesen los archivos
        
        // 🔄 SINCRONIZACIÓN CRÍTICA: SI EL MODAL ESTÁ ABIERTO, RECARGAR DATOS COMPLETOS
        if (viewUserDialogOpen && updatedUserId) {
          console.log('🔄 Modal abierto, programando recarga de datos...');
          setTimeout(async () => {
            console.log('🔄 Recargando datos completos del modal...');
            const completeUserData = await fetchCompleteUserData(updatedUserId!);
            if (completeUserData) {
              setSelectedUser(completeUserData);
              console.log('✅ Datos del modal actualizados completamente');
            }
          }, 3000); // 3 segundos para que se procesen todos los cambios
        }
      } else {
        // Recargar lista completa solo si es usuario nuevo
        await fetchUsers();
      }
      
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ FUNCIÓN PARA ELIMINAR USUARIO
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
      
      // Actualizar lista local
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      
      // Actualizar feed de actividad
      const newActivity: ActivityFeedItem = {
        id: Date.now().toString(),
        type: 'user_deleted',
        message: `Usuario ${userToDelete.firstName} ${userToDelete.lastName} eliminado completamente`,
        timestamp: new Date().toISOString(),
        userId: userToDelete.id,
        userName: `${userToDelete.firstName} ${userToDelete.lastName}`,
        icon: <DeleteIcon />,
        color: darkProTokens.error
      };
      
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
      
      setSuccessMessage('Usuario eliminado exitosamente');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  // 📋 FUNCIÓN PARA ABRIR MENÚ DE ACCIONES
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserForMenu(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserForMenu(null);
  };

  // 🔍 FUNCIÓN DE FILTRADO CON DEBOUNCE
  const filteredUsers = useMemo(() => {
    console.log('🔍 Aplicando filtros a usuarios:', {
      totalUsers: users.length,
      searchTerm: debouncedSearchTerm,
      filterRole,
      users: users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, rol: u.rol }))
    });
    
    let filtered = users;
    
    // Aplicar filtro de texto con debounce
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchLower) || 
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.whatsapp?.includes(debouncedSearchTerm)
      );
    }
    
    // FILTRO DE ROL CORREGIDO
    if (filterRole !== 'todos') {
      filtered = filtered.filter(user => {
        if (filterRole === 'admin' || filterRole === 'empleado' || filterRole === 'cliente') {
          return user.rol === filterRole;
        }
        return true;
      });
      console.log(`🎯 Filtro por rol "${filterRole}" aplicado:`, filtered.length, 'usuarios');
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '');
          bValue = new Date(b.createdAt || '');
          break;
        case 'lastActivity':
          aValue = new Date(a.updatedAt || a.createdAt || '');
          bValue = new Date(b.updatedAt || b.createdAt || '');
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    console.log('✅ Usuarios filtrados final:', filtered.length);
    return filtered;
  }, [users, debouncedSearchTerm, filterRole, sortBy, sortOrder]);

  // 🔄 DEBOUNCE PARA BÚSQUEDA
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 🌐 DETECCIÓN DE CONECTIVIDAD
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 📊 CARGAR DATOS INICIALES Y ACTUALIZAR ESTADÍSTICAS
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUserStatistics();
  }, [users]);

  // 🧹 LIMPIAR RECURSOS AL DESMONTAR
  useEffect(() => {
    return () => {
      cleanupCache();
    };
  }, []);

  // 🎨 FUNCIONES AUXILIARES CON DARK PRO SYSTEM

  // 🎨 FUNCIÓN PARA OBTENER ICONO DE ROL
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon sx={{ color: darkProTokens.roleAdmin }} />;
      case 'empleado': return <EmployeeIcon sx={{ color: darkProTokens.roleStaff }} />;
      case 'cliente': return <ClientIcon sx={{ color: darkProTokens.success }} />;
      default: return <PersonIcon sx={{ color: darkProTokens.grayMuted }} />;
    }
  };

  // 🎨 FUNCIÓN PARA OBTENER COLOR DE ROL
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return darkProTokens.roleAdmin;
      case 'empleado': return darkProTokens.roleStaff;
      case 'cliente': return darkProTokens.success;
      default: return darkProTokens.grayMuted;
    }
  };

  // 🎨 FUNCIÓN PARA OBTENER LABEL DE ROL
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      case 'cliente': return 'Cliente';
      default: return 'Desconocido';
    }
  };

  // 🎯 FUNCIÓN PARA CALCULAR PORCENTAJE DE COMPLETITUD
  const getCompletionPercentage = (user: User) => {
    let completed = 0;
    const total = 5;
    
    if (user.profilePictureUrl) completed++;
    if (user.signatureUrl) completed++;
    if (user.contractPdfUrl) completed++;
    if (user.fingerprint) completed++;
    if (user.emailSent && user.whatsappSent) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // 🎨 FUNCIÓN PARA OBTENER COLOR DE COMPLETITUD
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return darkProTokens.success;
    if (percentage >= 50) return darkProTokens.warning;
    return darkProTokens.error;
  };

  // 📅 FUNCIÓN PARA FORMATEAR FECHAS
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // 🚀 =============== COMPONENTES UI CON DARK PRO SYSTEM ===============

  // 📊 DASHBOARD DE MÉTRICAS PROFESIONAL CON DARK PRO COLORS
  const MetricsDashboard = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
          color: darkProTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.success}30`,
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${darkProTokens.success}40`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                {userStats.totalUsers}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                Total Usuarios
              </Typography>
            </Box>
            <PeopleIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
          color: darkProTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.info}30`,
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${darkProTokens.info}40`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                {userStats.newUsersThisMonth}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                Nuevos Este Mes
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.primary}30`,
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${darkProTokens.primary}40`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.background }}>
                {userStats.completionRate.profilePicture}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, color: darkProTokens.background }}>
                Con Fotos
              </Typography>
            </Box>
            <PhotoCameraIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.background }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, #7b1fa2)`,
          color: darkProTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.roleModerator}30`,
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${darkProTokens.roleModerator}40`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
                {userStats.averageAge}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: darkProTokens.textSecondary }}>
                Edad Promedio
              </Typography>
            </Box>
            <CakeIcon sx={{ fontSize: 40, opacity: 0.8, color: darkProTokens.textPrimary }} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  // 📊 WIDGET DE ACTIVIDAD RECIENTE CON DARK PRO SYSTEM
  const RecentActivityWidget = () => (
    <Paper sx={{
      p: 3,
      mb: 3,
      background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
      border: `1px solid ${darkProTokens.grayDark}`,
      borderRadius: 3,
      backdropFilter: 'blur(10px)'
    }}>
      <Typography variant="h6" sx={{ 
        color: darkProTokens.textPrimary, 
        mb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}>
        <TimelineIcon sx={{ color: darkProTokens.primary }} />
        Actividad Reciente
        {loadingImages && (
          <CircularProgress size={16} sx={{ color: darkProTokens.primary, ml: 1 }} />
        )}
      </Typography>
      
      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
        {activityFeed.slice(0, 5).map((activity, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: darkProTokens.hoverOverlay,
                transform: 'translateX(4px)'
              }
            }}
          >
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: activity.color,
              border: `1px solid ${activity.color}40`
            }}>
              {activity.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 500 }}>
                {activity.message}
              </Typography>
              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: es })}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );

  // 📱 TOOLBAR DE ACCIONES MASIVAS CON DARK PRO COLORS
  const BulkActionsToolbar = () => (
    <Slide direction="up" in={selectedUsers.size > 0}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          p: 2,
          zIndex: 1000,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.primary}40`,
          borderRadius: 3,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px ${darkProTokens.background}80`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
            {selectedUsers.size} usuarios seleccionados
          </Typography>
          
          <Button
            size="small"
            startIcon={<EmailIcon />}
            sx={{ 
              color: darkProTokens.success,
              borderColor: darkProTokens.success,
              '&:hover': { 
                bgcolor: `${darkProTokens.success}10`,
                borderColor: darkProTokens.successHover
              }
            }}
          >
            Email Masivo
          </Button>
          
          <Button
            size="small"
            startIcon={<WhatsAppIcon />}
            sx={{ 
              color: '#25d366',
              borderColor: '#25d366',
              '&:hover': { 
                bgcolor: 'rgba(37, 211, 102, 0.1)',
                borderColor: '#22c55e'
              }
            }}
          >
            WhatsApp
          </Button>
          
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setShowBulkDeleteDialog(true)}
            sx={{ 
              color: darkProTokens.error,
              borderColor: darkProTokens.error,
              '&:hover': { 
                bgcolor: `${darkProTokens.error}10`,
                borderColor: darkProTokens.errorHover
              }
            }}
          >
            Eliminar
          </Button>
          
          <IconButton
            size="small"
            onClick={() => setSelectedUsers(new Set())}
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
      </Paper>
    </Slide>
  );

  // 🎯 COMPONENTE DE VISTA PREVIA MEJORADA CON ZOOM Y DARK PRO
  const ImagePreviewDialog = () => (
    <Dialog
      open={!!previewImage}
      onClose={() => setPreviewImage(null)}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkProTokens.background,
          border: `1px solid ${darkProTokens.grayDark}`
        }
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: darkProTokens.background, position: 'relative' }}>
        {previewImage && (
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.3s ease'
              }}
            />
            
            <Box sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              bgcolor: `${darkProTokens.surfaceLevel2}E6`,
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              p: 1,
              border: `1px solid ${darkProTokens.grayDark}`
            }}>
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                sx={{ 
                  color: darkProTokens.textPrimary,
                  '&:hover': { bgcolor: darkProTokens.hoverOverlay }
                }}
              >
                <ZoomOutIcon />
              </IconButton>
              <Typography sx={{ 
                color: darkProTokens.textPrimary, 
                minWidth: 50, 
                textAlign: 'center',
                alignSelf: 'center',
                fontWeight: 600
              }}>
                {Math.round(zoomLevel * 100)}%
              </Typography>
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                sx={{ 
                  color: darkProTokens.textPrimary,
                  '&:hover': { bgcolor: darkProTokens.hoverOverlay }
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  // 📱 COMPONENTE DE ESTADO DE CONEXIÓN CON DARK PRO
  const ConnectionStatus = () => (
    <Snackbar
      open={!isOnline}
      message="Sin conexión a internet. Los datos pueden no estar actualizados."
      action={
        <Button 
          color="inherit" 
          onClick={() => window.location.reload()}
          sx={{ color: darkProTokens.primary }}
        >
          Reintentar
        </Button>
      }
      ContentProps={{
        sx: {
          bgcolor: darkProTokens.error,
          color: darkProTokens.textPrimary
        }
      }}
    />
  );

  // 🎨 RENDERIZADO PRINCIPAL CON DARK PRO SYSTEM
  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* 📊 DASHBOARD DE MÉTRICAS */}
      <MetricsDashboard />
      
      {/* 📊 WIDGET DE ACTIVIDAD RECIENTE */}
      <RecentActivityWidget />
      
      {/* 🔧 PANEL DE CONTROL SUPERIOR CON DARK PRO COLORS */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textShadow: `0 0 20px ${darkProTokens.primary}40`
            }}>
              <DashboardIcon sx={{ fontSize: 40, color: darkProTokens.primary }} />
              Gestión de Usuarios MUP
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Panel de administración completo con sistema Dark Pro
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={syncStatus === 'syncing' ? <CircularProgress size={16} sx={{ color: darkProTokens.textPrimary }} /> : <CloudSyncIcon />}
              label={
                syncStatus === 'syncing' ? 'Sincronizando...' :
                syncStatus === 'error' ? 'Error de sync' :
                lastSyncTime ? `Sincronizado ${formatDistanceToNow(lastSyncTime, { locale: es })}` : 'Listo'
              }
              size="small"
              variant="outlined"
              sx={{ 
                color: syncStatus === 'error' ? darkProTokens.error : darkProTokens.success,
                borderColor: syncStatus === 'error' ? darkProTokens.error : darkProTokens.success,
                bgcolor: syncStatus === 'error' ? `${darkProTokens.error}10` : `${darkProTokens.success}10`,
                '& .MuiChip-icon': {
                  color: syncStatus === 'error' ? darkProTokens.error : darkProTokens.success
                }
              }}
            />
            
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={cleanupCache}
              variant="outlined"
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}40`,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  bgcolor: `${darkProTokens.primary}10`
                }
              }}
            >
              Limpiar Caché
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenFormDialog()}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${darkProTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${darkProTokens.success}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Box>
        
        {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS CON DARK PRO STYLING */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="🔍 Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: darkProTokens.iconMuted }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: darkProTokens.borderDefault,
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: `${darkProTokens.primary}60`,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: darkProTokens.primary,
                    borderWidth: '2px',
                    boxShadow: `0 0 0 3px ${darkProTokens.focusRing}`
                  },
                  color: darkProTokens.textPrimary,
                  borderRadius: 2,
                  bgcolor: darkProTokens.surfaceLevel1,
                  transition: 'all 0.2s ease'
                },
                '& .MuiInputBase-input': {
                  color: darkProTokens.textPrimary,
                },
                '& .MuiInputBase-input::placeholder': {
                  color: darkProTokens.textSecondary,
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: darkProTokens.textSecondary }}>Filtrar por Rol</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="Filtrar por Rol"
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.borderDefault,
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}60`,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.primary,
                    borderWidth: '2px',
                    boxShadow: `0 0 0 3px ${darkProTokens.focusRing}`
                  },
                  '& .MuiSvgIcon-root': {
                    color: darkProTokens.iconMuted,
                  },
                  '& .MuiSelect-select': {
                    color: darkProTokens.textPrimary,
                  },
                  bgcolor: darkProTokens.surfaceLevel1,
                  borderRadius: 2,
                  transition: 'all 0.2s ease'
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkProTokens.surfaceLevel3,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '& .MuiMenuItem-root': {
                        color: darkProTokens.textPrimary,
                        '&:hover': {
                          bgcolor: darkProTokens.hoverOverlay,
                        },
                        '&.Mui-selected': {
                          bgcolor: `${darkProTokens.primary}20`,
                          '&:hover': {
                            bgcolor: `${darkProTokens.primary}30`,
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="todos">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: darkProTokens.iconMuted }} />
                    Todos los roles
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminIcon sx={{ color: darkProTokens.roleAdmin }} />
                    Administradores
                  </Box>
                </MenuItem>
                <MenuItem value="empleado">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmployeeIcon sx={{ color: darkProTokens.roleStaff }} />
                    Empleados
                  </Box>
                </MenuItem>
                <MenuItem value="cliente">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClientIcon sx={{ color: darkProTokens.success }} />
                    Clientes
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={loadingImages ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={fetchUsers}
              disabled={loadingImages}
              sx={{
                borderColor: `${darkProTokens.primary}60`,
                color: darkProTokens.primary,
                bgcolor: `${darkProTokens.primary}05`,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}15`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${darkProTokens.primary}30`
                },
                '&:disabled': {
                  borderColor: `${darkProTokens.primary}30`,
                  color: `${darkProTokens.primary}60`,
                  bgcolor: `${darkProTokens.primary}05`
                },
                height: '56px',
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              {loadingImages ? 'Cargando imágenes...' : 'Actualizar'}
            </Button>
          </Grid>
        </Grid>
        
        {/* 📊 INFORMACIÓN DE RESULTADOS CON BADGES DARK PRO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2,
          p: 3,
          bgcolor: `${darkProTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${darkProTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
              📊 Mostrando {filteredUsers.length} de {users.length} usuarios
            </Typography>
            {loadingImages && (
              <Chip
                icon={<PhotoCameraIcon sx={{ color: darkProTokens.warning }} />}
                label="Cargando fotos..."
                size="small"
                sx={{
                  bgcolor: `${darkProTokens.warning}20`,
                  color: darkProTokens.warning,
                  border: `1px solid ${darkProTokens.warning}40`,
                  animation: 'pulse 2s infinite',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<PhotoCameraIcon sx={{ color: darkProTokens.success }} />}
              label={`${users.filter(u => u.profilePictureUrl).length} con fotos`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.success}20`,
                color: darkProTokens.success,
                border: `1px solid ${darkProTokens.success}40`,
                fontWeight: 600
              }}
            />
            <Chip
              icon={<VerifiedIcon sx={{ color: darkProTokens.info }} />}
              label={`${users.filter(u => u.fingerprint).length} verificados`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.info}20`,
                color: darkProTokens.info,
                border: `1px solid ${darkProTokens.info}40`,
                fontWeight: 600
              }}
            />
          </Box>
        </Box>
      </Paper>
      
      {/* 📋 TABLA DE USUARIOS CON DARK PRO SYSTEM */}
      <TableContainer 
        component={Paper} 
        sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: `${darkProTokens.textPrimary} !important`,
            borderColor: `${darkProTokens.grayDark} !important`
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Usuario
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Email & WhatsApp
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Rol
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                fontSize: '1rem'
              }}>
                Estado
              </TableCell>
              <TableCell sx={{ 
                bgcolor: `${darkProTokens.surfaceLevel4} !important`, 
                color: `${darkProTokens.textPrimary} !important`, 
                fontWeight: 700,
                borderBottom: `3px solid ${darkProTokens.primary}`,
                textAlign: 'center',
                fontSize: '1rem'
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ bgcolor: `${darkProTokens.surfaceLevel1} !important` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton 
                        variant="circular" 
                        width={48} 
                        height={48} 
                        sx={{ bgcolor: darkProTokens.grayMedium }} 
                      />
                      <Box>
                        <Skeleton 
                          variant="text" 
                          width={120} 
                          height={24} 
                          sx={{ bgcolor: darkProTokens.grayMedium, mb: 1 }} 
                        />
                        <Skeleton 
                          variant="text" 
                          width={80} 
                          height={16} 
                          sx={{ bgcolor: darkProTokens.grayMedium }} 
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ bgcolor: `${darkProTokens.surfaceLevel1} !important` }}>
                    <Skeleton 
                      variant="text" 
                      width={180} 
                      height={20} 
                      sx={{ bgcolor: darkProTokens.grayMedium, mb: 1 }} 
                    />
                    <Skeleton 
                      variant="text" 
                      width={140} 
                      height={16} 
                      sx={{ bgcolor: darkProTokens.grayMedium }} 
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: `${darkProTokens.surfaceLevel1} !important` }}>
                    <Skeleton 
                      variant="rectangular" 
                      width={100} 
                      height={32} 
                      sx={{ bgcolor: darkProTokens.grayMedium, borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: `${darkProTokens.surfaceLevel1} !important` }}>
                    <Skeleton 
                      variant="text" 
                      width={80} 
                      height={16} 
                      sx={{ bgcolor: darkProTokens.grayMedium, mb: 1 }} 
                    />
                    <Skeleton 
                      variant="rectangular" 
                      width={120} 
                      height={6} 
                      sx={{ bgcolor: darkProTokens.grayMedium, borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: `${darkProTokens.surfaceLevel1} !important`, textAlign: 'center' }}>
                    <Skeleton 
                      variant="rectangular" 
                      width={160} 
                      height={32} 
                      sx={{ bgcolor: darkProTokens.grayMedium, borderRadius: 1, mx: 'auto' }} 
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8, bgcolor: `${darkProTokens.surfaceLevel1} !important` }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <SearchIcon sx={{ fontSize: 64, color: darkProTokens.grayMuted }} />
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                      No se encontraron usuarios
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      {users.length === 0 
                        ? 'No hay usuarios registrados en el sistema'
                        : 'Intenta cambiar los filtros de búsqueda'
                      }
                    </Typography>
                    {users.length > 0 && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterRole('todos');
                        }}
                        sx={{
                          mt: 2,
                          borderColor: darkProTokens.primary,
                          color: darkProTokens.primary,
                          '&:hover': {
                            borderColor: darkProTokens.primaryHover,
                            bgcolor: `${darkProTokens.primary}10`
                          }
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const completionPercentage = getCompletionPercentage(user);
                const completionColor = getCompletionColor(completionPercentage);
                
                return (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: `${darkProTokens.hoverOverlay} !important`,
                        transform: 'scale(1.01)',
                        boxShadow: `0 4px 20px ${darkProTokens.primary}20`,
                      },
                      '&:nth-of-type(odd)': {
                        bgcolor: `${darkProTokens.surfaceLevel1} !important`,
                      },
                      '&:nth-of-type(even)': {
                        bgcolor: `${darkProTokens.surfaceLevel2} !important`,
                      }
                    }}
                    onClick={() => handleOpenViewDialog(user)}
                  >
                    {/* 👤 COLUMNA USUARIO CON DARK PRO STYLING */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            user.fingerprint ? (
                              <FingerprintIcon sx={{ 
                                fontSize: 16, 
                                color: darkProTokens.primary,
                                bgcolor: darkProTokens.background,
                                borderRadius: '50%',
                                p: 0.2,
                                border: `2px solid ${darkProTokens.primary}`
                              }} />
                            ) : null
                          }
                        >
                          <Avatar
                            src={user.profilePictureUrl}
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: getRoleColor(user.rol),
                              border: `3px solid ${getRoleColor(user.rol)}`,
                              boxShadow: `0 4px 15px ${getRoleColor(user.rol)}40`,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: `0 6px 25px ${getRoleColor(user.rol)}60`,
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user.profilePictureUrl) {
                                setPreviewImage(user.profilePictureUrl);
                                setZoomLevel(1);
                              }
                            }}
                          >
                            {user.firstName?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                        </Badge>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 600,
                              fontSize: '1rem',
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {getRoleIcon(user.rol)}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: getRoleColor(user.rol),
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5
                              }}
                            >
                              {getRoleLabel(user.rol)}
                            </Typography>
                            
                            {user.isMinor && (
                              <Chip
                                icon={<CakeIcon sx={{ fontSize: '0.8rem !important', color: darkProTokens.warning }} />}
                                label="Menor"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: `${darkProTokens.warning}20`,
                                  color: darkProTokens.warning,
                                  border: `1px solid ${darkProTokens.warning}40`,
                                  '& .MuiChip-icon': { color: darkProTokens.warning }
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: darkProTokens.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: '0.8rem' }} />
                            {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es }) : 'Sin fecha'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* 📧 COLUMNA EMAIL & WHATSAPP CON BADGES DE ESTADO */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: '1rem', color: darkProTokens.iconMuted }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkProTokens.textPrimary,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              flex: 1
                            }}
                          >
                            {user.email}
                          </Typography>
                          {user.emailSent ? (
                            <Tooltip title={`Email enviado ${user.emailSentAt ? formatDistanceToNow(new Date(user.emailSentAt), { addSuffix: true, locale: es }) : ''}`}>
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '0.8rem !important' }} />}
                                label="Enviado"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: `${darkProTokens.success}20`,
                                  color: darkProTokens.success,
                                  border: `1px solid ${darkProTokens.success}40`,
                                  '& .MuiChip-icon': { color: darkProTokens.success }
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={<ErrorIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label="Pendiente"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: `${darkProTokens.docPending}20`,
                                color: darkProTokens.docPending,
                                border: `1px solid ${darkProTokens.docPending}40`,
                                '& .MuiChip-icon': { color: darkProTokens.docPending }
                              }}
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WhatsAppIcon sx={{ fontSize: '1rem', color: '#25d366' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkProTokens.textSecondary,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              flex: 1
                            }}
                          >
                            {user.whatsapp || 'No disponible'}
                          </Typography>
                          {user.whatsappSent ? (
                            <Tooltip title={`WhatsApp enviado ${user.whatsappSentAt ? formatDistanceToNow(new Date(user.whatsappSentAt), { addSuffix: true, locale: es }) : ''}`}>
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '0.8rem !important' }} />}
                                label="Enviado"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(37, 211, 102, 0.2)',
                                  color: '#25d366',
                                  border: '1px solid rgba(37, 211, 102, 0.4)',
                                  '& .MuiChip-icon': { color: '#25d366' }
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={<ErrorIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label="Pendiente"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: `${darkProTokens.docPending}20`,
                                color: darkProTokens.docPending,
                                border: `1px solid ${darkProTokens.docPending}40`,
                                '& .MuiChip-icon': { color: darkProTokens.docPending }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* 🎭 COLUMNA ROL CON DARK PRO BADGE */}
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.rol)}
                        label={getRoleLabel(user.rol)}
                        sx={{
                          bgcolor: `${getRoleColor(user.rol)}20`,
                          color: getRoleColor(user.rol),
                          border: `1px solid ${getRoleColor(user.rol)}40`,
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            color: getRoleColor(user.rol)
                          }
                        }}
                      />
                    </TableCell>
                    
                    {/* 📊 COLUMNA ESTADO CON PROGRESS BAR DARK PRO */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Completitud:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: completionColor,
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {completionPercentage}%
                          </Typography>
                        </Box>
                        
                        <LinearProgress
                          variant="determinate"
                          value={completionPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: darkProTokens.grayDark,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: completionColor,
                              borderRadius: 4,
                              boxShadow: `0 0 10px ${completionColor}40`
                            }
                          }}
                        />
                        
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {user.profilePictureUrl && (
                            <Tooltip title="Foto de perfil">
                              <PhotoCameraIcon sx={{ fontSize: '1rem', color: darkProTokens.success }} />
                            </Tooltip>
                          )}
                          {user.signatureUrl && (
                            <Tooltip title="Firma digital">
                              <SignatureIcon sx={{ fontSize: '1rem', color: darkProTokens.success }} />
                            </Tooltip>
                          )}
                          {user.contractPdfUrl && (
                            <Tooltip title="Contrato firmado">
                              <PictureAsPdfIcon sx={{ fontSize: '1rem', color: darkProTokens.error }} />
                            </Tooltip>
                          )}
                          {user.fingerprint && (
                            <Tooltip title="Huella dactilar registrada">
                              <FingerprintIcon sx={{ fontSize: '1rem', color: darkProTokens.primary }} />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* ⚙️ COLUMNA ACCIONES CON DARK PRO BUTTONS */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <ButtonGroup
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiButton-root': {
                            borderColor: darkProTokens.borderDefault,
                            color: darkProTokens.textSecondary,
                            minWidth: '36px',
                            height: '36px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px rgba(0,0,0,0.3)`
                            }
                          }
                        }}
                      >
                        <Tooltip title="Ver detalles completos">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewDialog(user);
                            }}
                            sx={{
                              '&:hover': {
                                borderColor: `${darkProTokens.info} !important`,
                                bgcolor: `${darkProTokens.info}15 !important`,
                                color: `${darkProTokens.info} !important`
                              }
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Editar usuario">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFormDialog(user);
                            }}
                            sx={{
                              '&:hover': {
                                borderColor: `${darkProTokens.warning} !important`,
                                bgcolor: `${darkProTokens.warning}15 !important`,
                                color: `${darkProTokens.warning} !important`
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Eliminar usuario">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{
                              '&:hover': {
                                borderColor: `${darkProTokens.error} !important`,
                                bgcolor: `${darkProTokens.error}15 !important`,
                                color: `${darkProTokens.error} !important`
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                          </Button>
                        </Tooltip>
                        
                        {!isMobile && (
                          <Tooltip title="Más acciones">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, user);
                              }}
                              sx={{
                                '&:hover': {
                                  borderColor: `${darkProTokens.primary} !important`,
                                  bgcolor: `${darkProTokens.primary}15 !important`,
                                  color: `${darkProTokens.primary} !important`
                                }
                              }}
                            >
                              <MoreVertIcon sx={{ fontSize: '1.1rem' }} />
                            </Button>
                          </Tooltip>
                        )}
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
