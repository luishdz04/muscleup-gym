// hooks/useUsers.ts - CORRECCIÓN DEL CÁLCULO DE ESTADÍSTICAS
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserStats } from '@/types/user';
import { useNotifications } from '@/hooks/useNotifications';
import { userService } from '@/services/userService';

export const useUsers = () => {
  // Estados existentes...
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const { toast, alert } = useNotifications();
  
  const toastRef = useRef(toast);
  const alertRef = useRef(alert);
  
  useEffect(() => {
    toastRef.current = toast;
    alertRef.current = alert;
  });

  // FUNCIÓN AUXILIAR PARA CALCULAR COMPLETITUD INDIVIDUAL
  const calculateUserCompleteness = useCallback((user: User): number => {
    const requiredFields = [
      user.profilePictureUrl,     // Foto de perfil
      user.signatureUrl,          // Firma digital
      user.contractPdfUrl,        // Contrato firmado
      user.fingerprint,           // Huella dactilar registrada
      user.emailSent,             // Email de bienvenida enviado
      user.whatsappSent,          // WhatsApp de confirmación enviado
      user.birthDate,             // Fecha de nacimiento
      user.whatsapp,              // Número de WhatsApp
    ];

    const completedFields = requiredFields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  }, []);

  // FUNCIÓN AUXILIAR PARA VERIFICAR PERFIL COMPLETAMENTE LISTO
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

  // ESTADÍSTICAS CORREGIDAS Y PRECISAS
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
    const usersWithFingerprint = users.filter(u => u.fingerprint).length;
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
        allComplete: Math.round((completeProfiles / totalUsers) * 100) // CORREGIDO: solo perfiles 100% completos
      }
    };
  }, [users, isProfileComplete]);

  // CONTEOS CORREGIDOS
  const counts = useMemo(() => ({
    total: users.length,
    withPhotos: users.filter(u => u.profilePictureUrl).length,
    verified: users.filter(u => u.fingerprint).length, // Solo usuarios con huella dactilar
    emailsSent: users.filter(u => u.emailSent).length,
    whatsappSent: users.filter(u => u.whatsappSent).length,
    completeProfiles: users.filter(user => isProfileComplete(user)).length, // NUEVO: perfiles completos
    byRole: {
      admin: users.filter(u => u.rol === 'admin').length,
      empleado: users.filter(u => u.rol === 'empleado').length,
      cliente: users.filter(u => u.rol === 'cliente').length,
    }
  }), [users, isProfileComplete]);

  // RESTO DE FUNCIONES (fetchUsers, createUser, updateUser, deleteUser) - mantener como estaban

  // Funciones existentes sin cambios...
  const fetchUsers = useCallback(async () => {
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
  }, []);

  // Resto de funciones CRUD...
  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const newUser = await userService.createUser(userData);
      setUsers(prev => [newUser, ...prev]);
      toastRef.current.success(`Usuario ${newUser.firstName} ${newUser.lastName} creado exitosamente`);
      return newUser;
    } catch (error: any) {
      await alertRef.current.error(error.message || 'Error al crear usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await userService.updateUser(userId, userData);
      
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
  }, []);

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

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchUsers();
    }
  }, []);

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
    calculateUserCompleteness, // NUEVA FUNCIÓN EXPORTADA
  };
};