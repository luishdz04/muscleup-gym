// app/admin/users/page.tsx - VERSIÓN ENTERPRISE v6.0 CORREGIDA - ERRORES TYPESCRIPT SOLUCIONADOS
'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
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
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
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
      id,
      firstName,
      lastName,
      email,
      rol,
      profilePictureUrl,
      signatureUrl,
      contractPdfUrl,
      fingerprint,
      whatsapp,
      birthDate,
      gender,
      maritalStatus,
      isMinor,
      emailSent,
      emailSentAt,
      whatsappSent,
      whatsappSentAt,
      createdAt,
      updatedAt
    `
  });

  const { toast, alert } = useNotifications();

  // ESTADOS LOCALES DE UI
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userForDetails, setUserForDetails] = useState<User | null>(null);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [syncing, setSyncing] = useState(false);

  // ✅ USUARIOS FILTRADOS CON useMemo OPTIMIZADO
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRole = !filterRole || user.rol === filterRole;
      
      return matchesSearch && matchesRole;
    }).sort((a, b) => {
      const aValue = (a[sortBy as keyof User] as string) || '';
      const bValue = (b[sortBy as keyof User] as string) || '';
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [users, searchTerm, filterRole, sortBy, sortOrder]);

  // ✅ ESTADÍSTICAS CALCULADAS - CORREGIDAS SEGÚN UserStats INTERFACE
  const userStats = useMemo((): UserStats & { isFiltered: boolean; totalFiltered: number } => {
    const total = users.length;
    const withPhotos = users.filter(u => u.profilePictureUrl).length;
    const verified = users.filter(u => u.emailSent).length;
    const emailsSent = users.filter(u => u.emailSent).length;
    
    // Calcular distribución por género
    const genderDistribution = {
      masculino: users.filter(u => u.gender === 'masculino').length,
      femenino: users.filter(u => u.gender === 'femenino').length,
      otro: users.filter(u => u.gender === 'otro' || !u.gender).length,
    };

    // Calcular niveles de membresía (requiere datos de membership_info si están disponibles)
    const membershipLevels = {
      principiante: users.filter(u => u.membership?.trainingLevel === 'principiante').length,
      intermedio: users.filter(u => u.membership?.trainingLevel === 'intermedio').length,
      avanzado: users.filter(u => u.membership?.trainingLevel === 'avanzado').length,
    };

    // Calcular completitud
    const profilePictureCount = users.filter(u => u.profilePictureUrl).length;
    const signatureCount = users.filter(u => u.signatureUrl).length;
    const contractCount = users.filter(u => u.contractPdfUrl).length;
    const allCompleteCount = users.filter(u => 
      u.profilePictureUrl && u.signatureUrl && u.contractPdfUrl && 
      u.fingerprint && u.emailSent && u.whatsappSent
    ).length;

    const completionRate = {
      profilePicture: total > 0 ? Math.round((profilePictureCount / total) * 100) : 0,
      signature: total > 0 ? Math.round((signatureCount / total) * 100) : 0,
      contract: total > 0 ? Math.round((contractCount / total) * 100) : 0,
      allComplete: total > 0 ? Math.round((allCompleteCount / total) * 100) : 0,
    };

    // Calcular edad promedio
    const usersWithBirthDate = users.filter(u => u.birthDate);
    const averageAge = usersWithBirthDate.length > 0 
      ? Math.round(usersWithBirthDate.reduce((sum, user) => {
          const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
          return sum + age;
        }, 0) / usersWithBirthDate.length)
      : 0;

    // Calcular usuarios nuevos este mes
    const thisMonth = new Date();
    const newUsersThisMonth = users.filter(user => {
      if (!user.createdAt) return false;
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === thisMonth.getMonth() && 
             userDate.getFullYear() === thisMonth.getFullYear();
    }).length;

    return {
      totalUsers: total,
      newUsersThisMonth,
      activeUsers: users.filter(u => u.rol === 'cliente').length,
      averageAge,
      genderDistribution,
      membershipLevels,
      completionRate,
      isFiltered: Boolean(searchTerm || filterRole),
      totalFiltered: filteredUsers.length
    };
  }, [users, filteredUsers.length, searchTerm, filterRole]);

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
      await refreshData();
      toast.success('Lista de usuarios actualizada exitosamente');
    } catch (error: any) {
      toast.error('Error al actualizar la lista de usuarios');
    } finally {
      setSyncing(false);
    }
  }, [refreshData, toast]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  }, []);

  // ✅ BÚSQUEDA AVANZADA MEJORADA
  const handleAdvancedSearch = useCallback(async () => {
    if (!searchTerm && !filterRole) {
      await refreshData();
      return;
    }

    try {
      const filters: Record<string, any> = {};
      if (filterRole) filters.rol = filterRole;
      
      await searchItems(filters);
      
      if (searchTerm) {
        // Filtrar localmente por término de búsqueda después de la búsqueda por BD
        // Esto se maneja en filteredUsers
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error en la búsqueda');
    }
  }, [searchTerm, filterRole, refreshData, searchItems, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterRole('');
    setSortBy('createdAt');
    setSortOrder('desc');
    refreshData();
  }, [refreshData]);

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
      p: 3, 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      {/* PANEL DE CONTROL SUPERIOR */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
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
              color: colorTokens.brand,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textShadow: `0 0 20px ${colorTokens.brand}40`
            }}>
              <DashboardIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
              Gestión de Usuarios MUP
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.neutral1000, mt: 1 }}>
              Panel de administración con búsqueda avanzada y estadísticas en tiempo real
            </Typography>
            
            {/* ✅ INFO DE AUDITORÍA */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
              <Chip
                label={`Auditoría: ${auditInfo.description}`}
                size="small"
                variant="outlined"
                sx={{ 
                  color: colorTokens.info,
                  borderColor: colorTokens.info,
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                label={`Total: ${stats.total}`}
                size="small"
                variant="filled"
                sx={{ 
                  bgcolor: colorTokens.brand,
                  color: colorTokens.textOnBrand
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
              startIcon={<ClearAllIcon />}
              onClick={cleanupCache}
              variant="outlined"
              disabled={loading}
              sx={{ 
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}40`,
                '&:hover': {
                  borderColor: colorTokens.brand,
                  bgcolor: `${colorTokens.brand}10`
                }
              }}
            >
              Limpiar Caché
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenFormDialog()}
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success})`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${colorTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success})`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Box>
        
        {/* ✅ CONTROLES DE BÚSQUEDA Y FILTROS MEJORADOS */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colorTokens.neutral800 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral100,
                    color: colorTokens.neutral1200,
                    '& fieldset': { borderColor: colorTokens.neutral400 },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  }
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  label="Rol"
                  sx={{
                    bgcolor: colorTokens.neutral100,
                    color: colorTokens.neutral1200,
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
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="empleado">Empleado</MenuItem>
                  <MenuItem value="cliente">Cliente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Ordenar por"
                  sx={{
                    bgcolor: colorTokens.neutral100,
                    color: colorTokens.neutral1200,
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
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={handleAdvancedSearch}
                  disabled={loading}
                  sx={{
                    color: colorTokens.brand,
                    borderColor: colorTokens.brand,
                    '&:hover': {
                      bgcolor: `${colorTokens.brand}10`
                    }
                  }}
                >
                  Buscar
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleManualRefresh}
                  disabled={loading}
                  sx={{
                    color: colorTokens.info,
                    borderColor: colorTokens.info,
                    '&:hover': {
                      bgcolor: `${colorTokens.info}10`
                    }
                  }}
                >
                  Actualizar
                </Button>
                
                {(searchTerm || filterRole) && (
                  <Button
                    variant="outlined"
                    startIcon={<ClearAllIcon />}
                    onClick={handleClearFilters}
                    sx={{
                      color: colorTokens.warning,
                      borderColor: colorTokens.warning,
                      '&:hover': {
                        bgcolor: `${colorTokens.warning}10`
                      }
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* INFORMACIÓN DE RESULTADOS Y ESTADÍSTICAS */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${colorTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
              Total: {userStats.isFiltered ? (
                <>{userStats.totalFiltered} de {userStats.totalUsers}</>
              ) : (
                <>{userStats.totalUsers}</>
              )} usuarios
            </Typography>
            {userStats.isFiltered && (
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleClearFilters}
                variant="outlined"
                sx={{
                  color: colorTokens.warning,
                  borderColor: colorTokens.warning,
                  '&:hover': {
                    bgcolor: `${colorTokens.warning}10`,
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<PhotoCameraIcon />}
              label={`${userStats.completionRate.profilePicture}% con fotos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
              }}
            />
            <Chip
              icon={<VerifiedIcon />}
              label={`${users.filter(u => u.emailSent).length} verificados`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.info}20`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`,
              }}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${users.filter(u => u.emailSent).length} emails enviados`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.brand}20`,
                color: colorTokens.brand,
                border: `1px solid ${colorTokens.brand}40`,
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* ✅ ESTADÍSTICAS CON CARDS - PROPS CORREGIDAS SEGÚN UserStats */}
      <UserStatsCards
        userStats={userStats}
        totalUsers={userStats.totalUsers}
        verifiedCount={users.filter(u => u.emailSent).length}
      />

      {/* DISTRIBUCIÓN POR ROLES */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="h6" sx={{ 
          color: colorTokens.neutral1200, 
          mb: 3, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Distribución por Roles
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ 
              p: 2, 
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
              <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                {users.filter(u => u.rol === 'admin').length}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Administradores
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {userStats.totalUsers > 0 ? Math.round((users.filter(u => u.rol === 'admin').length / userStats.totalUsers) * 100) : 0}% del total
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: `${colorTokens.info}10`,
              border: `1px solid ${colorTokens.info}30`,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 20px ${colorTokens.info}20`
              }
            }}>
              <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                {users.filter(u => u.rol === 'empleado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Empleados
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {userStats.totalUsers > 0 ? Math.round((users.filter(u => u.rol === 'empleado').length / userStats.totalUsers) * 100) : 0}% del total
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ 
              p: 2, 
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
              <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                {users.filter(u => u.rol === 'cliente').length}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Clientes
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {userStats.totalUsers > 0 ? Math.round((users.filter(u => u.rol === 'cliente').length / userStats.totalUsers) * 100) : 0}% del total
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

