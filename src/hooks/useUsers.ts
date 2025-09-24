// hooks/useUsers.ts - VERSIÓN ENTERPRISE COMPLETA
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserStats } from '@/types/user';
import { useNotifications } from '@/hooks/useNotifications';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { userService } from '@/services/userService';

export const useUsers = () => {
  // ✅ SSR SAFETY OBLIGATORIO
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA AUTOMÁTICA
  const { addAuditFields } = useUserTracking();

  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const { toast, alert } = useNotifications();
  
  // ✅ REFS ESTABLES PARA NOTIFICACIONES
  const toastRef = useRef(toast);
  const alertRef = useRef(alert);
  
  useEffect(() => {
    toastRef.current = toast;
    alertRef.current = alert;
  });

  // ✅ FUNCIÓN PARA CALCULAR COMPLETITUD INDIVIDUAL MEMOIZADA
  const calculateUserCompleteness = useCallback((user: User): number => {
    const requiredFields = [
      user.profilePictureUrl,
      user.signatureUrl,
      user.contractPdfUrl,
      user.fingerprint,
      user.emailSent,
      user.whatsappSent,
      user.birthDate,
      user.whatsapp,
    ];

    const completedFields = requiredFields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  }, []);

  // ✅ FUNCIÓN PARA VERIFICAR PERFIL COMPLETO MEMOIZADA
  const isProfileComplete = useCallback((user: User): boolean => {
    return Boolean(
      user.profilePictureUrl &&
      user.signatureUrl &&
      user.contractPdfUrl &&
      user.fingerprint &&
      user.emailSent &&
      user.whatsappSent &&
      user.birthDate &&
      user.whatsapp
    );
  }, []);

  // ✅ ESTADÍSTICAS OPTIMIZADAS Y PRECISAS
  const userStats = useMemo((): UserStats => {
    if (users.length === 0) {
      return {
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
        averageAge: 0,
        genderDistribution: { masculino: 0, femenino: 0, otro: 0 },
        membershipLevels: { principiante: 0, intermedio: 0, avanzado: 0 },
        completionRate: { profilePicture: 0, signature: 0, contract: 0, allComplete: 0 }
      };
    }

    const totalUsers = users.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Usuarios nuevos este mes
    const newUsersThisMonth = users.filter(user => 
      user.createdAt && new Date(user.createdAt) >= startOfMonth
    ).length;

    // Distribución por género
    const genderStats = users.reduce((acc, user) => {
      const gender = user.gender || 'otro';
      acc[gender as keyof typeof acc] = (acc[gender as keyof typeof acc] || 0) + 1;
      return acc;
    }, { masculino: 0, femenino: 0, otro: 0 });

    // Edad promedio (solo usuarios con fecha de nacimiento)
    const usersWithBirthDate = users.filter(u => u.birthDate);
    const avgAge = usersWithBirthDate.length > 0 ? Math.round(
      usersWithBirthDate.reduce((sum, user) => {
        const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
        return sum + age;
      }, 0) / usersWithBirthDate.length
    ) : 0;

    // Tasas de completitud CORREGIDAS
    const usersWithProfilePicture = users.filter(u => u.profilePictureUrl).length;
    const usersWithSignature = users.filter(u => u.signatureUrl).length;
    const usersWithContract = users.filter(u => u.contractPdfUrl).length;
    const completeProfiles = users.filter(user => isProfileComplete(user)).length;

    return {
      totalUsers,
      newUsersThisMonth,
      activeUsers: totalUsers,
      averageAge: avgAge,
      genderDistribution: genderStats,
      membershipLevels: { principiante: 0, intermedio: 0, avanzado: 0 },
      completionRate: {
        profilePicture: Math.round((usersWithProfilePicture / totalUsers) * 100),
        signature: Math.round((usersWithSignature / totalUsers) * 100),
        contract: Math.round((usersWithContract / totalUsers) * 100),
        allComplete: Math.round((completeProfiles / totalUsers) * 100)
      }
    };
  }, [users, isProfileComplete]);

  // ✅ CONTEOS MEMOIZADOS
  const counts = useMemo(() => ({
    total: users.length,
    withPhotos: users.filter(u => u.profilePictureUrl).length,
    verified: users.filter(u => u.fingerprint).length,
    emailsSent: users.filter(u => u.emailSent).length,
    whatsappSent: users.filter(u => u.whatsappSent).length,
    completeProfiles: users.filter(user => isProfileComplete(user)).length,
    byRole: {
      admin: users.filter(u => u.rol === 'admin').length,
      empleado: users.filter(u => u.rol === 'empleado').length,
      cliente: users.filter(u => u.rol === 'cliente').length,
    }
  }), [users, isProfileComplete]);

  // ✅ FETCH USERS CON SSR SAFETY
  const fetchUsers = useCallback(async () => {
    if (!hydrated) return;

    setLoading(true);
    setLoadingImages(true);
    setSyncStatus('syncing');
    
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
      
      toastRef.current.success(`${fetchedUsers.length} usuarios cargados correctamente`);
      setSyncStatus('idle');
      setLastSyncTime(new Date());
      
    } catch (error: any) {
      toastRef.current.error('Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
      setSyncStatus('error');
    } finally {
      setLoading(false);
      setLoadingImages(false);
    }
  }, [hydrated]);

  // ✅ CREATE USER CON AUDITORÍA AUTOMÁTICA
  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      setLoading(true);
      
      // ✅ APLICAR CAMPOS DE AUDITORÍA AUTOMÁTICAMENTE
      const dataWithAudit = await addAuditFields(userData, false);
      
      const newUser = await userService.createUser(dataWithAudit);
      setUsers(prev => [newUser, ...prev]);
      toastRef.current.success(`Usuario ${newUser.firstName} ${newUser.lastName} creado exitosamente`);
      return newUser;
    } catch (error: any) {
      await alertRef.current.error(error.message || 'Error al crear usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addAuditFields]);

  // ✅ UPDATE USER CON AUDITORÍA AUTOMÁTICA
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      setLoading(true);
      
      // ✅ APLICAR CAMPOS DE AUDITORÍA AUTOMÁTICAMENTE
      const dataWithAudit = await addAuditFields(userData, true);
      
      const updatedUser = await userService.updateUser(userId, dataWithAudit);
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ));
      
      toastRef.current.success('Usuario actualizado exitosamente');
      return updatedUser;
    } catch (error: any) {
      await alertRef.current.error(error.message || 'Error al actualizar usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addAuditFields]);

  // ✅ DELETE USER CON CONFIRMACIÓN
  const deleteUser = useCallback(async (user: User) => {
    try {
      const result = await alertRef.current.deleteConfirm(`${user.firstName} ${user.lastName}`);
      if (!result.isConfirmed) return false;

      setLoading(true);
      await userService.deleteUser(user.id);
      
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toastRef.current.success(`Usuario ${user.firstName} ${user.lastName} eliminado exitosamente`);
      
      return true;
    } catch (error: any) {
      await alertRef.current.error(error.message || 'Error al eliminar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CARGA INICIAL CON SSR SAFETY
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hydrated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchUsers();
    }
  }, [hydrated, fetchUsers]);

  return {
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
    calculateUserCompleteness,
    // ✅ ESTADO DE HIDRATACIÓN PARA VERIFICACIONES
    hydrated,
  };
};