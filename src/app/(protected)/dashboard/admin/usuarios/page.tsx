// app/admin/users/page.tsx - VERSIÓN ENTERPRISE COMPLETA
'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  CloudSync as CloudSyncIcon,
  ClearAll as ClearAllIcon,
  PhotoCamera as PhotoCameraIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp 
} from '@/utils/dateUtils';
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';

// Hooks optimizados
import { useUsers } from '@/hooks/useUsers';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useNotifications } from '@/hooks/useNotifications';

// Componentes especializados
import UserStatsCards from '@/components/dashboard/admin/UserStatsCards';
import UserFilters from '@/components/dashboard/admin/UserFilters';
import UserTable from '@/components/dashboard/admin/UserTable';
import UserFormDialog from '@/components/dashboard/admin/UserFormDialog';
import UserDetailsDialog from '@/components/dashboard/admin/UserDetailsDialog';

// Tipos
import { User } from '@/types/user';

const UsersPage = memo(() => {
  // ✅ SSR SAFETY OBLIGATORIO
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA AUTOMÁTICA
  const { addAuditFields } = useUserTracking();

  // HOOKS DE DATOS Y LÓGICA DE NEGOCIO
  const {
    users,
    loading,
    loadingImages,
    syncStatus,
    lastSyncTime,
    userStats,
    counts,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const {
    searchTerm,
    filterRole,
    sortBy,
    sortOrder,
    filteredUsers,
    searchStats,
    setSearchTerm,
    setFilterRole,
    setSortBy,
    setSortOrder,
    clearFilters,
  } = useUserSearch({ users });

  const { toast } = useNotifications();

  // ESTADOS LOCALES DE UI
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userForDetails, setUserForDetails] = useState<User | null>(null);

  // ✅ HANDLERS OPTIMIZADOS CON useCallback
  const handleOpenFormDialog = useCallback((user?: User) => {
    setSelectedUser(user || null);
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setSelectedUser(null);
  }, []);

  const handleSaveUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (selectedUser?.id) {
        // ✅ APLICAR CAMPOS DE AUDITORÍA AUTOMÁTICAMENTE
        const dataWithAudit = await addAuditFields(userData, true);
        await updateUser(selectedUser.id, dataWithAudit);
      } else {
        // ✅ APLICAR CAMPOS DE AUDITORÍA PARA CREACIÓN
        const dataWithAudit = await addAuditFields(userData, false);
        await createUser(dataWithAudit);
      }
      handleCloseFormDialog();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, [selectedUser, updateUser, createUser, handleCloseFormDialog, addAuditFields]);

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
    await deleteUser(user);
  }, [deleteUser]);

  const handleManualRefresh = useCallback(async () => {
    try {
      await fetchUsers();
      notify.success('Lista de usuarios actualizada exitosamente');
    } catch (error) {
      notify.error('Error al actualizar la lista de usuarios');
    }
  }, [fetchUsers]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder]);

  // ✅ FUNCIÓN CORREGIDA PARA LIMPIAR CACHÉ CON notify.promise()
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

      // Limpiar caché de imágenes si existe
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const userRelatedCaches = cacheNames.filter(name => 
            name.includes('user') || name.includes('profile') || name.includes('image')
          );
          
          await Promise.all(
            userRelatedCaches.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.warn('No se pudo limpiar el caché del navegador:', error);
        }
      }

      // Forzar revalidación de datos desde el servidor
      await fetchUsers();
      
      // Simular tiempo de procesamiento para feedback visual
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
  }, [fetchUsers]);

  // ✅ PANTALLA DE CARGA HASTA HIDRATACIÓN COMPLETA
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
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
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={syncStatus === 'syncing' ? 
                <CircularProgress size={16} sx={{ color: colorTokens.neutral1200 }} /> : 
                <CloudSyncIcon />
              }
              label={
                syncStatus === 'syncing' ? 'Sincronizando...' :
                syncStatus === 'error' ? 'Error de sincronización' :
                lastSyncTime ? `Actualizado ${formatTimestampForDisplay(getCurrentTimestamp())}` : 'Sistema listo'
              }
              size="small"
              variant="outlined"
              sx={{ 
                color: syncStatus === 'error' ? colorTokens.danger : colorTokens.success,
                borderColor: syncStatus === 'error' ? colorTokens.danger : colorTokens.success,
                bgcolor: syncStatus === 'error' ? `${colorTokens.danger}10` : `${colorTokens.success}10`,
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
                },
                '&:disabled': {
                  opacity: 0.6
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
                '&:disabled': {
                  opacity: 0.6,
                  transform: 'none'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Box>
        
        {/* CONTROLES DE BÚSQUEDA Y FILTROS */}
        <UserFilters
          searchTerm={searchTerm}
          filterRole={filterRole}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onSearchChange={setSearchTerm}
          onRoleFilterChange={setFilterRole}
          onSortByChange={setSortBy}
          onSortOrderToggle={handleSortOrderToggle}
          onRefresh={handleManualRefresh}
        />
        
        {/* INFORMACIÓN DE RESULTADOS Y ESTADÍSTICAS */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2,
          p: 3,
          bgcolor: `${colorTokens.success}10`,
          borderRadius: 2,
          border: `1px solid ${colorTokens.success}30`,
          backdropFilter: 'blur(5px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
              Total: {searchStats.isFiltered ? (
                <>{searchStats.totalFiltered} de {searchStats.totalOriginal}</>
              ) : (
                <>{searchStats.totalOriginal}</>
              )} usuarios
            </Typography>
            {searchStats.isFiltered && (
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={clearFilters}
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
              label={`${counts.withPhotos} con fotos`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`,
              }}
            />
            <Chip
              icon={<VerifiedIcon />}
              label={`${counts.verified} verificados`}
              size="small"
              sx={{
                bgcolor: `${colorTokens.info}20`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`,
              }}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${counts.emailsSent} emails enviados`}
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

      {/* ESTADÍSTICAS CON CARDS */}
      <UserStatsCards
        userStats={userStats}
        totalUsers={counts.total}
        verifiedCount={counts.verified}
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
                {counts.byRole.admin}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Administradores
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {counts.total > 0 ? Math.round((counts.byRole.admin / counts.total) * 100) : 0}% del total
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
                {counts.byRole.empleado}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Empleados
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {counts.total > 0 ? Math.round((counts.byRole.empleado / counts.total) * 100) : 0}% del total
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
                {counts.byRole.cliente}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                Clientes
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.neutral1000 }}>
                {counts.total > 0 ? Math.round((counts.byRole.cliente / counts.total) * 100) : 0}% del total
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA DE USUARIOS */}
      <UserTable
        users={filteredUsers}
        loading={loading}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onView={handleViewUser}
        onClearFilters={clearFilters}
        hasFilters={searchStats.isFiltered}
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