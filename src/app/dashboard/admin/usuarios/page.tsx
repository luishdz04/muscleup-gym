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
  files?: any[] | null; // ✅ Permitir null además de any[]
  finalUser?: User;
  error?: string;
}

// 🚀 COMPONENTE PRINCIPAL MEJORADO
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
        color: '#4caf50'
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
        color: userData.id ? '#ff9800' : '#4caf50'
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
        color: '#f44336'
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

  // 🎨 FUNCIONES AUXILIARES

  // 🎨 FUNCIÓN PARA OBTENER ICONO DE ROL
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon sx={{ color: '#f44336' }} />;
      case 'empleado': return <EmployeeIcon sx={{ color: '#ff9800' }} />;
      case 'cliente': return <ClientIcon sx={{ color: '#4caf50' }} />;
      default: return <PersonIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  // 🎨 FUNCIÓN PARA OBTENER COLOR DE ROL
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#f44336';
      case 'empleado': return '#ff9800';
      case 'cliente': return '#4caf50';
      default: return '#9e9e9e';
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

  // 📅 FUNCIÓN PARA FORMATEAR FECHAS
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // 🚀 =============== COMPONENTES UI ===============

  // 📊 DASHBOARD DE MÉTRICAS PROFESIONAL
  const MetricsDashboard = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: 'linear-gradient(135deg, #4caf50, #45a049)',
          color: 'white',
          borderRadius: 3,
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {userStats.totalUsers}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Total Usuarios
              </Typography>
            </Box>
            <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: 'linear-gradient(135deg, #2196f3, #1976d2)',
          color: 'white',
          borderRadius: 3,
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {userStats.newUsersThisMonth}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Nuevos Este Mes
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
          color: 'white',
          borderRadius: 3,
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {userStats.completionRate.profilePicture}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Con Fotos
              </Typography>
            </Box>
            <PhotoCameraIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
          color: 'white',
          borderRadius: 3,
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {userStats.averageAge}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Edad Promedio
              </Typography>
            </Box>
            <CakeIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  // 📊 WIDGET DE ACTIVIDAD RECIENTE
  const RecentActivityWidget = () => (
    <Paper sx={{
      p: 3,
      mb: 3,
      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(45, 45, 45, 0.9))',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 3
    }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon sx={{ color: '#ffcc00' }} />
        Actividad Reciente
        {loadingImages && (
          <CircularProgress size={16} sx={{ color: '#ffcc00', ml: 1 }} />
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
              p: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: activity.color }}>
              {activity.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {activity.message}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: es })}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );

  // 📱 TOOLBAR DE ACCIONES MASIVAS
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
          background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
          border: '1px solid rgba(255, 204, 0, 0.3)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: 'white', fontWeight: 600 }}>
            {selectedUsers.size} usuarios seleccionados
          </Typography>
          
          <Button
            size="small"
            startIcon={<EmailIcon />}
            sx={{ color: '#4caf50' }}
          >
            Email Masivo
          </Button>
          
          <Button
            size="small"
            startIcon={<WhatsAppIcon />}
            sx={{ color: '#25d366' }}
          >
            WhatsApp
          </Button>
          
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setShowBulkDeleteDialog(true)}
            sx={{ color: '#f44336' }}
          >
            Eliminar
          </Button>
          
          <IconButton
            size="small"
            onClick={() => setSelectedUsers(new Set())}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );

  // 🎯 COMPONENTE DE VISTA PREVIA MEJORADA CON ZOOM
  const ImagePreviewDialog = () => (
    <Dialog
      open={!!previewImage}
      onClose={() => setPreviewImage(null)}
      maxWidth="lg"
      fullWidth
    >
      <DialogContent sx={{ p: 0, bgcolor: 'black', position: 'relative' }}>
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
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 2,
              p: 1
            }}>
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                sx={{ color: 'white' }}
              >
                <ZoomOutIcon />
              </IconButton>
              <Typography sx={{ color: 'white', minWidth: 50, textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </Typography>
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                sx={{ color: 'white' }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  // 📱 COMPONENTE DE ESTADO DE CONEXIÓN
  const ConnectionStatus = () => (
    <Snackbar
      open={!isOnline}
      message="Sin conexión a internet. Los datos pueden no estar actualizados."
      action={
        <Button color="inherit" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      }
    />
  );

  // 🎨 RENDERIZADO PRINCIPAL
  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* 📊 DASHBOARD DE MÉTRICAS */}
      <MetricsDashboard />
      
      {/* 📊 WIDGET DE ACTIVIDAD RECIENTE */}
      <RecentActivityWidget />
      
      {/* 🔧 PANEL DE CONTROL SUPERIOR - CORREGIDO ✅ */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(45, 45, 45, 0.9))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
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
              color: '#4caf50', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <DashboardIcon sx={{ fontSize: 40 }} />
              Gestión de Usuarios MUP
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Panel de administración completo
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={syncStatus === 'syncing' ? <CircularProgress size={16} /> : <CloudSyncIcon />}
              label={
                syncStatus === 'syncing' ? 'Sincronizando...' :
                syncStatus === 'error' ? 'Error de sync' :
                lastSyncTime ? `Sincronizado ${formatDistanceToNow(lastSyncTime, { locale: es })}` : 'Listo'
              }
              color={syncStatus === 'error' ? 'error' : 'success'}
              size="small"
              variant="outlined"
              sx={{ color: 'white' }}
            />
            
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={cleanupCache}
              sx={{ color: '#ffcc00' }}
            >
              Limpiar Caché
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenFormDialog()}
              sx={{
                background: 'linear-gradient(135deg, #4caf50, #45a049)',
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049, #388e3c)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Box>
        
        {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
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
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(76, 175, 80, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4caf50',
                    borderWidth: '2px',
                  },
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.6)',
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Filtrar por Rol</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="Filtrar por Rol"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(76, 175, 80, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4caf50',
                    borderWidth: '2px',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiSelect-select': {
                    color: 'white',
                  },
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(76, 175, 80, 0.2)',
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="todos">Todos los roles</MenuItem>
                <MenuItem value="admin">👑 Administradores</MenuItem>
                <MenuItem value="empleado">💼 Empleados</MenuItem>
                <MenuItem value="cliente">🏋️ Clientes</MenuItem>
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
                borderColor: 'rgba(255, 204, 0, 0.5)',
                color: '#ffcc00',
                '&:hover': {
                  borderColor: '#ffcc00',
                  backgroundColor: 'rgba(255, 204, 0, 0.1)',
                },
                '&:disabled': {
                  borderColor: 'rgba(255, 204, 0, 0.3)',
                  color: 'rgba(255, 204, 0, 0.5)',
                },
                height: '56px'
              }}
            >
              {loadingImages ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Grid>
        </Grid>
        
        {/* 📊 INFORMACIÓN DE RESULTADOS - CORREGIDO ✅ */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2,
          p: 2,
          bgcolor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 2,
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              📊 Mostrando {filteredUsers.length} de {users.length} usuarios
            </Typography>
            {loadingImages && (
              <Chip
                icon={<PhotoCameraIcon />}
                label="Cargando fotos..."
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 152, 0, 0.2)',
                  color: '#ffab00',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<PhotoCameraIcon />}
              label={`${users.filter(u => u.profilePictureUrl).length} con fotos`}
              size="small"
              sx={{
                bgcolor: 'rgba(76, 175, 80, 0.2)',
                color: '#4caf50',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}
            />
          </Box>
        </Box>
      </Paper>
      
      {/* 📋 TABLA DE USUARIOS */}
      <TableContainer 
        component={Paper} 
        sx={{
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: 'white !important',
            borderColor: 'rgba(255, 255, 255, 0.1) !important'
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Usuario
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Email
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Rol
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Estado
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)',
                textAlign: 'center'
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.3) !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                      <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.3) !important' }}>
                  <Skeleton variant="text" width={180} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.3) !important' }}>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }} />
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.3) !important' }}>
                    <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(0, 0, 0, 0.3) !important', textAlign: 'center' }}>
                    <Skeleton variant="rectangular" width={120} height={32} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1, mx: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(0, 0, 0, 0.3) !important' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <SearchIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)' }} />
                    <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      No se encontraron usuarios
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
                          borderColor: 'rgba(76, 175, 80, 0.5)',
                          color: '#4caf50',
                          '&:hover': {
                            borderColor: '#4caf50',
                            bgcolor: 'rgba(76, 175, 80, 0.1)'
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
                return (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.1) !important',
                        transform: 'scale(1.01)',
                      },
                      '&:nth-of-type(odd)': {
                        bgcolor: 'rgba(255, 255, 255, 0.02) !important',
                      }
                    }}
                    onClick={() => handleOpenViewDialog(user)}
                  >
                    {/* 👤 COLUMNA USUARIO */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            user.fingerprint ? (
                              <FingerprintIcon sx={{ 
                                fontSize: 16, 
                                color: '#ffcc00',
                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                                borderRadius: '50%',
                                p: 0.2
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
                              boxShadow: `0 4px 12px ${getRoleColor(user.rol)}40`,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: `0 6px 20px ${getRoleColor(user.rol)}60`,
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
                              color: 'white', 
                              fontWeight: 600,
                              fontSize: '1rem',
                              lineHeight: 1.2
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
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
                                icon={<CakeIcon sx={{ fontSize: '0.8rem !important' }} />}
                                label="Menor"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(255, 152, 0, 0.2)',
                                  color: '#ffab00',
                                  border: '1px solid rgba(255, 152, 0, 0.3)',
                                  '& .MuiChip-icon': { color: '#ffab00' }
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mt: 0.5
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: '0.8rem' }} />
                            {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es }) : 'Sin fecha'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* 📧 COLUMNA EMAIL */}
                    <TableCell sx={{ minWidth: 180 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'white',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem'
                            }}
                          >
                            {user.email}
                          </Typography>
                          {user.emailSent && (
                            <Tooltip title={`Email enviado ${user.emailSentAt ? formatDistanceToNow(new Date(user.emailSentAt), { addSuffix: true, locale: es }) : ''}`}>
                              <CheckCircleIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                            </Tooltip>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WhatsAppIcon sx={{ fontSize: '1rem', color: '#25d366' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem'
                            }}
                          >
                            {user.whatsapp || 'No disponible'}
                          </Typography>
                          {user.whatsappSent && (
                            <Tooltip title={`WhatsApp enviado ${user.whatsappSentAt ? formatDistanceToNow(new Date(user.whatsappSentAt), { addSuffix: true, locale: es }) : ''}`}>
                              <CheckCircleIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* 🎭 COLUMNA ROL */}
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
                    
                    {/* 📊 COLUMNA ESTADO */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Completitud:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: completionPercentage >= 80 ? '#4caf50' : 
                                     completionPercentage >= 50 ? '#ff9800' : '#f44336',
                              fontWeight: 600
                            }}
                          >
                            {completionPercentage}%
                          </Typography>
                        </Box>
                        
                        <LinearProgress
                          variant="determinate"
                          value={completionPercentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: completionPercentage >= 80 ? '#4caf50' : 
                                       completionPercentage >= 50 ? '#ff9800' : '#f44336',
                              borderRadius: 3
                            }
                          }}
                        />
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {user.profilePictureUrl && (
                            <Tooltip title="Foto de perfil">
                              <PhotoCameraIcon sx={{ fontSize: '0.9rem', color: '#4caf50' }} />
                            </Tooltip>
                          )}
                          {user.signatureUrl && (
                            <Tooltip title="Firma digital">
                              <SignatureIcon sx={{ fontSize: '0.9rem', color: '#4caf50' }} />
                            </Tooltip>
                          )}
                          {user.contractPdfUrl && (
                            <Tooltip title="Contrato firmado">
                              <AssignmentIcon sx={{ fontSize: '0.9rem', color: '#4caf50' }} />
                            </Tooltip>
                          )}
                          {user.fingerprint && (
                            <Tooltip title="Huella dactilar registrada">
                              <FingerprintIcon sx={{ fontSize: '0.9rem', color: '#ffcc00' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {/* ⚙️ COLUMNA ACCIONES */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <ButtonGroup
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiButton-root': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            minWidth: '32px',
                            height: '32px',
                            '&:hover': {
                              borderColor: 'rgba(76, 175, 80, 0.5)',
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
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
                                borderColor: 'rgba(33, 150, 243, 0.5) !important',
                                bgcolor: 'rgba(33, 150, 243, 0.1) !important',
                                color: '#2196f3 !important'
                              }
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: '1rem' }} />
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
                                borderColor: 'rgba(255, 152, 0, 0.5) !important',
                                bgcolor: 'rgba(255, 152, 0, 0.1) !important',
                                color: '#ff9800 !important'
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: '1rem' }} />
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
                                borderColor: 'rgba(244, 67, 54, 0.5) !important',
                                bgcolor: 'rgba(244, 67, 54, 0.1) !important',
                                color: '#f44336 !important'
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1rem' }} />
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
                                  borderColor: 'rgba(156, 39, 176, 0.5) !important',
                                  bgcolor: 'rgba(156, 39, 176, 0.1) !important',
                                  color: '#9c27b0 !important'
                                }
                              }}
                            >
                              <MoreVertIcon sx={{ fontSize: '1rem' }} />
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
      
      {/* 📱 TOOLBAR DE ACCIONES MASIVAS */}
      <BulkActionsToolbar />
      
      {/* 🎯 VISTA PREVIA DE IMÁGENES */}
      <ImagePreviewDialog />
      
      {/* 📱 ESTADO DE CONEXIÓN */}
      <ConnectionStatus />
      
      {/* 📝 FORMULARIO DE USUARIO */}
      <UserFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />
      
      {/* 👁️ MODAL DE DETALLES COMPLETOS DEL USUARIO */}
      <Dialog
        open={viewUserDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            color: 'white',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(76, 175, 80, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedUser && (
              <Avatar
                src={selectedUser.profilePictureUrl}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: getRoleColor(selectedUser.rol),
                  border: `3px solid ${getRoleColor(selectedUser.rol)}`,
                }}
              >
                {selectedUser.firstName?.[0]?.toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Cargando...'}
              </Typography>
              {selectedUser && (
                <Chip
                  icon={getRoleIcon(selectedUser.rol)}
                  label={getRoleLabel(selectedUser.rol)}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: `${getRoleColor(selectedUser.rol)}20`,
                    color: getRoleColor(selectedUser.rol),
                    border: `1px solid ${getRoleColor(selectedUser.rol)}40`,
                    '& .MuiChip-icon': { color: getRoleColor(selectedUser.rol) }
                  }}
                />
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedUser?.rol === 'cliente' && (
              <Button
                variant="contained"
                size="small"
                startIcon={regeneratingContract ? <CircularProgress size={16} /> : <UpdateIcon />}
                disabled={regeneratingContract}
                onClick={() => regenerateContract(selectedUser.id)}
                sx={{
                  bgcolor: '#ff9800',
                  '&:hover': { bgcolor: '#f57c00' }
                }}
              >
                {regeneratingContract ? 'Regenerando...' : 'Regenerar Contrato'}
              </Button>
            )}
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refreshModalData}
              sx={{
                borderColor: 'rgba(76, 175, 80, 0.5)',
                color: '#4caf50',
                '&:hover': {
                  borderColor: '#4caf50',
                  bgcolor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              Recargar
            </Button>
            
            <IconButton 
              onClick={handleCloseViewDialog}
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
        
        <DialogContent sx={{ p: 0 }}>
          {loadingUserDetails ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ color: '#4caf50', mb: 2 }} />
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Cargando datos completos del usuario...
              </Typography>
            </Box>
          ) : selectedUser ? (
            <Box sx={{ p: 3 }}>
              {/* 🔍 INFORMACIÓN DE DEBUG */}
              {debugInfo && (
                <Accordion sx={{ mb: 3, bgcolor: 'rgba(255, 204, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.3)' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
                    <Typography sx={{ color: '#ffcc00', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon />
                      Debug Info - Etapa: {debugInfo.stage}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'white' }}>
                      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              <Grid container spacing={3}>
                {/* 📋 INFORMACIÓN PERSONAL */}
                <Grid size={12}>
                  <Paper sx={{
                    p: 3,
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#4caf50', 
                      fontWeight: 700, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <PersonIcon />
                      Información Personal
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Email:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.email}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            WhatsApp:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.whatsapp || 'No disponible'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Fecha de Nacimiento:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.birthDate ? formatDate(selectedUser.birthDate) : 'No disponible'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Género:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.gender || 'No especificado'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* 🏠 DIRECCIÓN (solo para clientes) */}
                {selectedUser.rol === 'cliente' && selectedUser.address && (
                  <Grid size={12}>
                    <Paper sx={{
                      p: 3,
                      bgcolor: 'rgba(33, 150, 243, 0.1)',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      borderRadius: 2
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: '#2196f3', 
                        fontWeight: 700, 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <HomeIcon />
                        Dirección
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Typography sx={{ color: 'white' }}>
                            {selectedUser.address.street} #{selectedUser.address.number}, {selectedUser.address.neighborhood}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography sx={{ color: 'white' }}>
                            {selectedUser.address.city}, {selectedUser.address.state}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography sx={{ color: 'white' }}>
                            C.P. {selectedUser.address.postalCode}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Typography sx={{ color: 'white' }}>
                            {selectedUser.address.country || 'México'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
                
                {/* 🆘 CONTACTO DE EMERGENCIA (solo para clientes) */}
                {selectedUser.rol === 'cliente' && selectedUser.emergency && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{
                      p: 3,
                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: '#f44336', 
                        fontWeight: 700, 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <LocalHospitalIcon />
                        Contacto de Emergencia
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Nombre:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.emergency.name}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Teléfono:
                          </Typography>
                          <Typography sx={{ color: 'white', fontWeight: 500 }}>
                            {selectedUser.emergency.phone}
                          </Typography>
                        </Box>
                        
                        {selectedUser.emergency.bloodType && (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Tipo de Sangre:
                            </Typography>
                            <Typography sx={{ color: 'white', fontWeight: 500 }}>
                              {selectedUser.emergency.bloodType}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedUser.emergency.medicalCondition && (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                              Condición Médica:
                            </Typography>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(244, 67, 54, 0.05)',
                              border: '1px solid rgba(244, 67, 54, 0.2)',
                              borderRadius: 1
                            }}>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {selectedUser.emergency.medicalCondition}
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                )}
                
                {/* 💪 INFORMACIÓN DE MEMBRESÍA (solo para clientes) */}
                {selectedUser.rol === 'cliente' && selectedUser.membership && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{
                      p: 3,
                      bgcolor: 'rgba(156, 39, 176, 0.1)',
                      border: '1px solid rgba(156, 39, 176, 0.3)',
                      borderRadius: 2,
                      height: '100%'
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: '#9c27b0', 
                        fontWeight: 700, 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <ClientIcon />
                        Información de Membresía
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedUser.membership.referredBy && (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Referido por:
                            </Typography>
                            <Typography sx={{ color: 'white', fontWeight: 500 }}>
                              {selectedUser.membership.referredBy}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Nivel de Entrenamiento:
                          </Typography>
                          <Chip
                            label={selectedUser.membership.trainingLevel || 'Principiante'}
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: 'rgba(156, 39, 176, 0.2)',
                              color: '#ce93d8',
                              border: '1px solid rgba(156, 39, 176, 0.3)'
                            }}
                          />
                        </Box>
                        
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={selectedUser.membership.receivePlans}
                                disabled
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
                                Recibe planes de entrenamiento
                              </Typography>
                            }
                          />
                        </Box>
                        
                        {selectedUser.membership.mainMotivation && (
                          <Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                              Motivación Principal:
                            </Typography>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(156, 39, 176, 0.05)',
                              border: '1px solid rgba(156, 39, 176, 0.2)',
                              borderRadius: 1
                            }}>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {selectedUser.membership.mainMotivation}
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                )}
                
                {/* 📄 DOCUMENTOS */}
                <Grid size={12}>
                  <Paper sx={{
                    p: 3,
                    bgcolor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#ffc107', 
                      fontWeight: 700, 
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AssignmentIcon />
                      Documentos y Archivos
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Foto de Perfil */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{
                          border: '2px dashed rgba(255, 193, 7, 0.3)',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#ffc107', mb: 2, fontWeight: 600 }}>
                            📸 Foto de Perfil
                          </Typography>
                          
                          {selectedUser.profilePictureUrl ? (
                            <Box
                              component="img"
                              src={selectedUser.profilePictureUrl}
                              alt="Foto de perfil"
                              sx={{
                                width: '100%',
                                maxWidth: 150,
                                height: 'auto',
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                              onClick={() => {
                                setPreviewImage(selectedUser.profilePictureUrl!);
                                setZoomLevel(1);
                              }}
                            />
                          ) : (
                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                              <PhotoCameraIcon sx={{ fontSize: 48 }} />
                              <Typography variant="body2">
                                No disponible
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* Firma Digital */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{
                          border: '2px dashed rgba(255, 193, 7, 0.3)',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#ffc107', mb: 2, fontWeight: 600 }}>
                            ✍️ Firma Digital
                          </Typography>
                          
                          {selectedUser.signatureUrl ? (
                            <Box
                              component="img"
                              src={selectedUser.signatureUrl}
                              alt="Firma digital"
                              sx={{
                                width: '100%',
                                maxWidth: 200,
                                height: 'auto',
                                bgcolor: 'white',
                                borderRadius: 1,
                                p: 1,
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                              onClick={() => {
                                setPreviewImage(selectedUser.signatureUrl!);
                                setZoomLevel(1);
                              }}
                            />
                          ) : (
                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                              <SignatureIcon sx={{ fontSize: 48 }} />
                              <Typography variant="body2">
                                No disponible
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* Contrato PDF */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{
                          border: '2px dashed rgba(255, 193, 7, 0.3)',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#ffc107', mb: 2, fontWeight: 600 }}>
                            📄 Contrato PDF
                          </Typography>
                          
                          {selectedUser.contractPdfUrl ? (
                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <PictureAsPdfIcon sx={{ fontSize: 64, color: '#f44336' }} />
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => window.open(selectedUser.contractPdfUrl, '_blank')}
                                sx={{
                                  bgcolor: '#f44336',
                                  '&:hover': { bgcolor: '#d32f2f' }
                                }}
                              >
                                Ver PDF
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                              <PictureAsPdfIcon sx={{ fontSize: 48 }} />
                              <Typography variant="body2">
                                No disponible
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No se pudo cargar la información del usuario
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 🗑️ DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(30, 30, 30, 0.95))',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: 3,
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#f44336', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon />
          Confirmar Eliminación
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
            ¿Estás completamente seguro de que deseas eliminar al usuario{' '}
            <strong style={{ color: 'white' }}>
              {userToDelete?.firstName} {userToDelete?.lastName}
            </strong>?
          </DialogContentText>
          
          <Alert severity="warning" sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Esta acción eliminará permanentemente:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'white' }}>
              <li>Todos los datos personales</li>
              <li>Archivos subidos (fotos, firma, contrato)</li>
              <li>Historial de asistencia</li>
              <li>Registros de pagos</li>
            </ul>
            <Typography variant="body2" sx={{ color: '#ffcc00', fontWeight: 600 }}>
              ⚠️ Esta acción NO se puede deshacer
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{
              bgcolor: '#f44336',
              '&:hover': { bgcolor: '#d32f2f' }
            }}
          >
            {loading ? 'Eliminando...' : 'Eliminar Definitivamente'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 📱 MENÚ CONTEXTUAL */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            color: 'white',
            minWidth: 200
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedUserForMenu) {
              handleOpenViewDialog(selectedUserForMenu);
            }
            handleMenuClose();
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <VisibilityIcon sx={{ color: '#2196f3' }} />
          </ListItemIcon>
          <ListItemText>Ver Detalles Completos</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            if (selectedUserForMenu) {
              handleOpenFormDialog(selectedUserForMenu);
            }
            handleMenuClose();
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <EditIcon sx={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText>Editar Usuario</ListItemText>
        </MenuItem>
        
        {selectedUserForMenu?.rol === 'cliente' && (
          <MenuItem
            onClick={() => {
              if (selectedUserForMenu) {
                regenerateContract(selectedUserForMenu.id);
              }
              handleMenuClose();
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <UpdateIcon sx={{ color: '#9c27b0' }} />
            </ListItemIcon>
            <ListItemText>Regenerar Contrato</ListItemText>
          </MenuItem>
        )}
        
        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <MenuItem
          onClick={() => {
            if (selectedUserForMenu) {
              setUserToDelete(selectedUserForMenu);
              setDeleteDialogOpen(true);
            }
            handleMenuClose();
          }}
          sx={{ py: 1.5, color: '#f44336' }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText>Eliminar Usuario</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* 📨 SNACKBAR PARA MENSAJES */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{
            bgcolor: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            bgcolor: 'rgba(244, 67, 54, 0.9)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 🎨 ESTILOS PARA ANIMACIONES */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
}