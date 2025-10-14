// app/admin/users/page.tsx - VERSIÓN ENTERPRISE v6.0 CORREGIDA - ERRORES TYPESCRIPT SOLUCIONADOS
'use client';

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  CloudSync as CloudSyncIcon,
  ClearAll as ClearAllIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Fingerprint as FingerprintIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon,
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v6.0
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp 
} from '@/utils/dateUtils';
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';

// ✅ INTERFACES CENTRALIZADAS - USAR SOLO types/user.ts
import { User, UserStats } from '@/types/user';

// Componentes especializados
import UserStatsCards from '@/components/dashboard/admin/UserStatsCards';
import UserTable from '@/components/dashboard/admin/UserTable';
import UserFormDialog from '@/components/dashboard/admin/UserFormDialog';
import UserDetailsDialog from '@/components/dashboard/admin/UserDetailsDialog';

const UsersPage = memo(() => {
  // ✅ SSR SAFETY OBLIGATORIO
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA INTELIGENTE v6.0
  const { addAuditFieldsFor } = useUserTracking();

  // ✅ CRUD ENTERPRISE v6.0 CON AUDITORÍA AUTOMÁTICA - INTERFACE UNIFICADA
  const {
    data: users,
    loading,
    initialLoad,
    error,
    auditInfo,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    refreshData,
    stats
  } = useEntityCRUD<User>({
    tableName: 'Users', // Auditoría camelCase automática
    selectQuery: `
      *,
      addresses(*),
      emergency_contacts(*),
      membership_info(*)
    `,
    onError: (errorMsg) => {
      console.error('❌ [USUARIOS] Error en useEntityCRUD:', errorMsg);
      console.error('Error completo:', errorMsg);
      toast.error(`Error cargando usuarios: ${errorMsg}`);
    }
  });

  const { toast, alert } = useNotifications();

  // ESTADOS LOCALES DE UI
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userForDetails, setUserForDetails] = useState<User | null>(null);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [syncing, setSyncing] = useState(false);

  // ✅ FIX: Función simple sin dependencias problemáticas
  const loadClients = useCallback(async () => {
    try {
      console.log('🔄 [USUARIOS] Cargando clientes...');
      await refreshData(); // ✅ Usar refreshData del hook en lugar de searchItems
      console.log('✅ [USUARIOS] Clientes cargados exitosamente');
    } catch (error: any) {
      console.error('❌ [USUARIOS] Error loading clients:', error);
    }
  }, [refreshData]); // ✅ refreshData es estable desde useEntityCRUD

  // ✅ Cargar solo una vez cuando el componente se hidrata
  useEffect(() => {
    if (hydrated && initialLoad) {
      console.log('🌊 [USUARIOS] Primera carga de usuarios...');
      // refreshData ya se llama automáticamente en useEntityCRUD
    }
  }, [hydrated, initialLoad]); // ✅ Solo cuando cambia hydrated o initialLoad

  const normalizedUsers = useMemo(() => {
    // 🐛 DEBUG: Ver estructura completa de datos
    if (users.length > 0) {
      console.log('🔍 [DEBUG] Total usuarios:', users.length);
      console.log('🔍 [DEBUG] Primer usuario completo:', JSON.stringify(users[0], null, 2));
    }
    
    return users.map(user => {
      const membershipSource = (user as any).membership ?? (user as any).membership_info ?? null;
      const addressSource = (user as any).address ?? (user as any).addresses ?? null;
      const emergencySource = (user as any).emergency ?? (user as any).emergency_contacts ?? null;

      const membership = Array.isArray(membershipSource) ? membershipSource[0] : membershipSource;
      const address = Array.isArray(addressSource) ? addressSource[0] : addressSource;
      const emergency = Array.isArray(emergencySource) ? emergencySource[0] : emergencySource;

      return {
        ...user,
        membership: membership ?? undefined,
        address: address ?? undefined,
        emergency: emergency ?? undefined
      } as User;
    });
  }, [users]);

  const clientUsers = useMemo(
    () => normalizedUsers.filter(user => user.rol === 'cliente'),
    [normalizedUsers]
  );

  // ✅ USUARIOS FILTRADOS CON useMemo OPTIMIZADO
  const filteredUsers = useMemo(() => {
    return clientUsers.filter(user => {
      if (!searchTerm) return true;

      const query = searchTerm.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }).sort((a, b) => {
      const aValue = (a[sortBy as keyof User] as string) || '';
      const bValue = (b[sortBy as keyof User] as string) || '';

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  }, [clientUsers, searchTerm, sortBy, sortOrder]);

  // ✅ ESTADÍSTICAS CALCULADAS - CORREGIDAS SEGÚN UserStats INTERFACE
  const userStats = useMemo((): UserStats & { isFiltered: boolean; totalFiltered: number } => {
    const total = clientUsers.length;
    const thisMonth = new Date();

    const totalWithPhotos = clientUsers.filter(u => u.profilePictureUrl).length;
    const totalWithSignature = clientUsers.filter(u => u.signatureUrl).length;
    const totalWithContract = clientUsers.filter(u => u.contractPdfUrl).length;
    const totalComplete = clientUsers.filter(u =>
      u.profilePictureUrl &&
      u.signatureUrl &&
      u.contractPdfUrl &&
      u.fingerprint &&
      u.emailSent &&
      u.whatsappSent
    ).length;

    const completionRate = {
      profilePicture: total > 0 ? Math.round((totalWithPhotos / total) * 100) : 0,
      signature: total > 0 ? Math.round((totalWithSignature / total) * 100) : 0,
      contract: total > 0 ? Math.round((totalWithContract / total) * 100) : 0,
      allComplete: total > 0 ? Math.round((totalComplete / total) * 100) : 0,
    };

    const usersWithBirthDate = clientUsers.filter(u => u.birthDate);
    const averageAge = usersWithBirthDate.length > 0
      ? Math.round(
          usersWithBirthDate.reduce((sum, user) => {
            const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
            return sum + age;
          }, 0) / usersWithBirthDate.length
        )
      : 0;

    const genderDistribution = clientUsers.reduce(
      (acc, user) => {
        const genderValue = (user.gender || '').toString().trim().toLowerCase();

        if (['masculino', 'male', 'hombre', 'm'].includes(genderValue)) {
          acc.masculino += 1;
        } else if (['femenino', 'female', 'mujer', 'f'].includes(genderValue)) {
          acc.femenino += 1;
        } else if (genderValue) {
          acc.otro += 1;
        } else {
          acc.otro += 1;
        }

        return acc;
      },
      { masculino: 0, femenino: 0, otro: 0 }
    );

    const membershipLevels = {
      principiante: clientUsers.filter(u => u.membership?.trainingLevel === 'principiante').length,
      intermedio: clientUsers.filter(u => u.membership?.trainingLevel === 'intermedio').length,
      avanzado: clientUsers.filter(u => u.membership?.trainingLevel === 'avanzado').length,
    };

    const newUsersThisMonth = clientUsers.filter(user => {
      if (!user.createdAt) return false;
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === thisMonth.getMonth() &&
        userDate.getFullYear() === thisMonth.getFullYear()
      );
    }).length;

    return {
      totalUsers: total,
      newUsersThisMonth,
      activeUsers: total,
      averageAge,
      genderDistribution,
      membershipLevels,
      completionRate,
      isFiltered: Boolean(searchTerm),
      totalFiltered: filteredUsers.length
    };
  }, [clientUsers, filteredUsers.length, searchTerm]);

  const clientsWithPhotos = useMemo(
    () => clientUsers.filter(u => u.profilePictureUrl).length,
    [clientUsers]
  );

  const clientsWithContracts = useMemo(
    () => clientUsers.filter(u => u.contractPdfUrl).length,
    [clientUsers]
  );

  const clientsWithFingerprint = useMemo(
    () => clientUsers.filter(u => u.fingerprint).length,
    [clientUsers]
  );

  const clientsWithWhatsAppSent = useMemo(
    () => clientUsers.filter(u => u.whatsappSent).length,
    [clientUsers]
  );

  const clientsWithEmailSent = useMemo(
    () => clientUsers.filter(u => u.emailSent).length,
    [clientUsers]
  );

  const genderStats = useMemo(() => {
    const { masculino, femenino, otro } = userStats.genderDistribution;
    const total = Math.max(masculino + femenino + otro, 0);

    const safeTotal = total === 0 ? 1 : total;

    return {
      masculino,
      femenino,
      otro,
      total,
      masculinoPct: Math.round((masculino / safeTotal) * 100),
      femeninoPct: Math.round((femenino / safeTotal) * 100),
      otroPct: Math.round((otro / safeTotal) * 100)
    };
  }, [userStats.genderDistribution]);

  // ✅ HANDLERS OPTIMIZADOS CON useCallback
  const handleOpenFormDialog = useCallback((user?: User) => {
    setSelectedUser(user || null);
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setSelectedUser(null);
  }, []);

  // ✅ GUARDADO CON AUDITORÍA INTELIGENTE AUTOMÁTICA
  const handleSaveUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (selectedUser?.id) {
        // ✅ AUDITORÍA INTELIGENTE Users (camelCase) - UPDATE
        const updatedUser = await updateItem(selectedUser.id, userData);
        toast.success(`Usuario ${updatedUser.firstName} actualizado exitosamente`);
      } else {
        // ✅ VALIDAR CAMPOS REQUERIDOS ANTES DE CREATE
        if (!userData.firstName || !userData.email || !userData.rol) {
          toast.error('Faltan campos requeridos: nombre, email y rol');
          return;
        }
        
        // ✅ CREAR CON CAMPOS REQUERIDOS COMPLETOS
        const completeUserData: Omit<User, 'id'> = {
          firstName: userData.firstName,
          lastName: userData.lastName || '',
          email: userData.email,
          rol: userData.rol,
          whatsapp: userData.whatsapp || '',
          birthDate: userData.birthDate || '',
          gender: userData.gender || '',
          maritalStatus: userData.maritalStatus || '',
          isMinor: userData.isMinor || false,
          emailSent: userData.emailSent || false,
          whatsappSent: userData.whatsappSent || false,
          fingerprint: userData.fingerprint || false,
          // Campos opcionales
          profilePictureUrl: userData.profilePictureUrl,
          signatureUrl: userData.signatureUrl,
          contractPdfUrl: userData.contractPdfUrl,
          emailSentAt: userData.emailSentAt,
          whatsappSentAt: userData.whatsappSentAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          address: userData.address,
          emergency: userData.emergency,
          membership: userData.membership
        };
        
        const newUser = await createItem(completeUserData);
        toast.success(`Usuario ${newUser.firstName} creado exitosamente`);
      }
      handleCloseFormDialog();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario: ' + error.message);
    }
  }, [selectedUser, updateItem, createItem, handleCloseFormDialog, toast]);

  const handleViewUser = useCallback((user: User) => {
    setUserForDetails(user);
    setDetailsDialogOpen(true);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialogOpen(false);
    setUserForDetails(null);
  }, []);

  const handleEditFromDetails = useCallback((user: User) => {
    setDetailsDialogOpen(false);
    setUserForDetails(null);
    setSelectedUser(user);
    setFormDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    handleOpenFormDialog(user);
  }, [handleOpenFormDialog]);

  const handleDeleteUser = useCallback(async (user: User) => {
    // ✅ CORREGIDO: alert.deleteConfirm usa 1 parámetro según API useNotifications
    const confirmed = await alert.deleteConfirm(
      `¿Eliminar usuario ${user.firstName} ${user.lastName}? Esta acción eliminará todos los datos relacionados y no se puede deshacer.`
    );
    
    if (confirmed) {
      try {
        await deleteItem(user.id);
        toast.success(`Usuario ${user.firstName} eliminado exitosamente`);
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario: ' + error.message);
      }
    }
  }, [deleteItem, alert, toast]);

  const handleManualRefresh = useCallback(async () => {
    setSyncing(true);
    try {
      await loadClients();
      toast.success('Lista de usuarios actualizada exitosamente');
    } catch (error: any) {
      toast.error('Error al actualizar la lista de usuarios');
    } finally {
      setSyncing(false);
    }
  }, [loadClients, toast]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  }, []);

  // ✅ BÚSQUEDA AVANZADA MEJORADA
  const handleAdvancedSearch = useCallback(async () => {
    try {
      await loadClients();
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error en la búsqueda');
    }
  }, [loadClients, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSortBy('createdAt');
    setSortOrder('desc');
    loadClients();
  }, [loadClients]);

  // ✅ FUNCIÓN CORREGIDA PARA LIMPIAR CACHÉ
  const cleanupCache = useCallback(async () => {
    const cacheCleanupPromise = async () => {
      // Limpiar localStorage relacionado con usuarios
      const localStorageKeys = [
        'users-cache',
        'user-search-filters',
        'user-preferences',
        'last-user-sync',
        'user-stats-cache',
        'filtered-users-cache'
      ];
      
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`No se pudo limpiar la clave localStorage: ${key}`, error);
        }
      });

      // Limpiar sessionStorage
      const sessionStorageKeys = [
        'user-session-data',
        'temp-user-data',
        'user-form-draft',
        'search-results-cache'
      ];

      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`No se pudo limpiar la clave sessionStorage: ${key}`, error);
        }
      });

      // Forzar revalidación de datos desde el servidor
      await refreshData();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return 'Limpieza completada exitosamente';
    };

    // ✅ USAR notify.promise CENTRALIZADO
    notify.promise(
      cacheCleanupPromise(),
      {
        loading: 'Limpiando caché del sistema...',
        success: 'Caché limpiado exitosamente. Datos actualizados desde el servidor.',
        error: 'Error al limpiar el caché. Algunos elementos pueden no haberse limpiado.'
      }
    );
  }, [refreshData]);

  // ✅ PANTALLA DE CARGA HASTA HIDRATACIÓN COMPLETA
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
          Cargando MuscleUp Gym...
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
          Inicializando sistema empresarial
        </Typography>
      </Box>
    );
  }

  // ✅ ERROR HANDLING MEJORADO
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: colorTokens.danger, mb: 2 }}>
          Error al cargar usuarios
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={refreshData}
          sx={{ bgcolor: colorTokens.brand }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200,
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* PANEL DE CONTROL SUPERIOR */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: { xs: 2, sm: 2.5, md: 3 },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Typography variant="h4" sx={{
              color: colorTokens.brand,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5, md: 2 },
              textShadow: `0 0 20px ${colorTokens.brand}40`,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <DashboardIcon sx={{ fontSize: { xs: 28, sm: 34, md: 40 }, color: colorTokens.brand }} />
              Gestión de Clientes MUP
            </Typography>
            <Typography variant="body1" sx={{
              color: colorTokens.neutral1000,
              mt: 1,
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Panel especializado para seguimiento integral de clientes y su progreso
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={`Clientes activos: ${clientUsers.length}`}
                size="small"
                variant="filled"
                sx={{
                  bgcolor: colorTokens.brand,
                  color: colorTokens.textOnBrand,
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              />
            </Box>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            alignItems: 'center',
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' }
          }}>
            <Chip
              icon={syncing || loading ? 
                <CircularProgress size={16} sx={{ color: colorTokens.neutral1200 }} /> : 
                <CloudSyncIcon />
              }
              label={
                syncing || loading ? 'Sincronizando...' :
                error ? 'Error de sincronización' :
                'Sistema listo'
              }
              size="small"
              variant="outlined"
              sx={{ 
                color: error ? colorTokens.danger : colorTokens.success,
                borderColor: error ? colorTokens.danger : colorTokens.success,
                bgcolor: error ? `${colorTokens.danger}10` : `${colorTokens.success}10`,
              }}
            />
            
            <Button
              size="small"
              startIcon={<ClearAllIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              onClick={cleanupCache}
              variant="outlined"
              disabled={loading}
              sx={{
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}40`,
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                '&:hover': {
                  borderColor: colorTokens.brand,
                  bgcolor: `${colorTokens.brand}10`
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Limpiar Caché</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Caché</Box>
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={() => handleOpenFormDialog()}
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success})`,
                fontWeight: 600,
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' },
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nuevo Usuario</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Nuevo</Box>
            </Button>
          </Box>
        </Box>
        
        {/* ✅ CONTROLES DE BÚSQUEDA Y FILTROS MEJORADOS - RESPONSIVE */}
        <Box sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{
                        color: colorTokens.neutral800,
                        fontSize: { xs: 18, sm: 20 }
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral100,
                    color: colorTokens.neutral1200,
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    '& fieldset': { borderColor: colorTokens.neutral400 },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>Ordenar por</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Ordenar por"
                  sx={{
                    bgcolor: colorTokens.neutral100,
                    color: colorTokens.neutral1200,
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.neutral400
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    }
                  }}
                >
                  <MenuItem value="createdAt">Fecha de creación</MenuItem>
                  <MenuItem value="firstName">Nombre</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="rol">Rol</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <Box sx={{
                display: 'flex',
                gap: { xs: 0.75, sm: 1 },
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                  onClick={handleAdvancedSearch}
                  disabled={loading}
                  sx={{
                    color: colorTokens.brand,
                    borderColor: colorTokens.brand,
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    px: { xs: 1.5, sm: 2 },
                    minWidth: { xs: 'auto', sm: '100px' },
                    '&:hover': {
                      bgcolor: `${colorTokens.brand}10`
                    }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Buscar</Box>
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                  onClick={handleManualRefresh}
                  disabled={loading}
                  sx={{
                    color: colorTokens.info,
                    borderColor: colorTokens.info,
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    px: { xs: 1.5, sm: 2 },
                    minWidth: { xs: 'auto', sm: '100px' },
                    '&:hover': {
                      bgcolor: `${colorTokens.info}10`
                    }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Actualizar</Box>
                </Button>

                {searchTerm && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearAllIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                    onClick={handleClearFilters}
                    sx={{
                      color: colorTokens.warning,
                      borderColor: colorTokens.warning,
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      px: { xs: 1.5, sm: 2 },
                      minWidth: { xs: 'auto', sm: '100px' },
                      '&:hover': {
                        bgcolor: `${colorTokens.warning}10`
                      }
                    }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Limpiar</Box>
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* INFORMACIÓN DE RESULTADOS Y ESTADÍSTICAS - RESPONSIVE */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          p: { xs: 2, sm: 2.5, md: 3 },
          gap: { xs: 2, md: 0 },
          bgcolor: `${colorTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
            <Typography sx={{
              color: colorTokens.neutral1200,
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' }
            }}>
              Total: {userStats.isFiltered ? (
                <>{userStats.totalFiltered} de {userStats.totalUsers}</>
              ) : (
                <>{userStats.totalUsers}</>
              )} usuarios
            </Typography>
            {userStats.isFiltered && (
              <Button
                size="small"
                startIcon={<ClearAllIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                onClick={handleClearFilters}
                variant="outlined"
                sx={{
                  color: colorTokens.warning,
                  borderColor: colorTokens.warning,
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  px: { xs: 1.5, sm: 2 },
                  '&:hover': {
                    bgcolor: `${colorTokens.warning}10`,
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Limpiar Filtros</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Limpiar</Box>
              </Button>
            )}
          </Box>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5, md: 2 },
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' }
          }}>
            <Chip
              icon={<PhotoCameraIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${userStats.completionRate.profilePicture}% con fotos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' }
              }}
            />
            <Chip
              icon={<FingerprintIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${clientsWithFingerprint} huellas`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.warning}20`,
                color: colorTokens.warning,
                border: `1px solid ${colorTokens.warning}40`,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' }
              }}
            />
            <Chip
              icon={<EmailIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${clientsWithEmailSent} correos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.info}20`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' }
              }}
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`${clientsWithWhatsAppSent} WhatsApp`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.brand}20`,
                color: colorTokens.brand,
                border: `1px solid ${colorTokens.brand}40`,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* ✅ ESTADÍSTICAS CON CARDS - PROPS CORREGIDAS SEGÚN UserStats */}
      <UserStatsCards
        userStats={userStats}
        totalUsers={userStats.totalUsers}
        verifiedCount={clientsWithFingerprint}
      />

      {/* DISTRIBUCIÓN DE CLIENTES */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="h6" sx={{
          color: colorTokens.neutral1200,
          mb: { xs: 2, sm: 2.5, md: 3 },
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
        }}>
          Distribución de Clientes
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 2,
              bgcolor: `${colorTokens.brand}10`,
              border: `1px solid ${colorTokens.brand}30`,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 20px ${colorTokens.brand}20`
              }
            }}>
              <Typography variant="h4" sx={{
                color: colorTokens.brand,
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
              }}>
                {clientsWithContracts}
              </Typography>
              <Typography variant="body2" sx={{
                color: colorTokens.neutral1200,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                Contrato firmado
              </Typography>
              <Typography variant="caption" sx={{
                color: colorTokens.neutral1000,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                {userStats.totalUsers > 0 ? Math.round((clientsWithContracts / userStats.totalUsers) * 100) : 0}% del total
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 2,
              bgcolor: `${colorTokens.info}10`,
              border: `1px solid ${colorTokens.info}30`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 20px ${colorTokens.info}20`
              }
            }}>
              <Typography variant="h4" sx={{
                color: colorTokens.info,
                fontWeight: 700,
                textAlign: 'center',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
              }}>
                {genderStats.total}
              </Typography>
              <Typography variant="body2" sx={{
                color: colorTokens.neutral1200,
                fontWeight: 600,
                textAlign: 'center',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                Distribución por género
              </Typography>
              <Box sx={{
                mt: { xs: 1, sm: 1.5 },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.5, sm: 0.75 },
                color: colorTokens.neutral1000
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
                  <MaleIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: colorTokens.info }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    Hombres: {genderStats.masculino} ({genderStats.masculinoPct}%)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
                  <FemaleIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: colorTokens.brand }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    Mujeres: {genderStats.femenino} ({genderStats.femeninoPct}%)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
                  <TransgenderIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: colorTokens.warning }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    Otro/No especificado: {genderStats.otro} ({genderStats.otroPct}%)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 2,
              bgcolor: `${colorTokens.success}10`,
              border: `1px solid ${colorTokens.success}30`,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 20px ${colorTokens.success}20`
              }
            }}>
              <Typography variant="h4" sx={{
                color: colorTokens.success,
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
              }}>
                {clientsWithPhotos}
              </Typography>
              <Typography variant="body2" sx={{
                color: colorTokens.neutral1200,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                Foto de perfil cargada
              </Typography>
              <Typography variant="caption" sx={{
                color: colorTokens.neutral1000,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                {userStats.totalUsers > 0 ? Math.round((clientsWithPhotos / userStats.totalUsers) * 100) : 0}% del total
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ TABLA DE USUARIOS - PROPS CORREGIDAS */}
      <UserTable
        users={filteredUsers}
        loading={loading || initialLoad}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onView={handleViewUser}
        onClearFilters={handleClearFilters}
        hasFilters={userStats.isFiltered} // ✅ CORREGIDO: boolean en lugar de string
      />

      {/* MODAL DE FORMULARIO */}
      <UserFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        user={selectedUser}
        onSave={handleSaveUser}
      />

      {/* MODAL DE DETALLES */}
      <UserDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        user={userForDetails}
        onEdit={handleEditFromDetails}
      />
    </Box>
  );
});

UsersPage.displayName = 'UsersPage';

export default UsersPage;

