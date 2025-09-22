// ===================================================================
// hooks/useUserModal.ts - Gestión de modales de usuario
// ===================================================================

'use client';

import { useState, useCallback } from 'react';
import { User } from '@/types/user';

export type UserModalType = 'create' | 'edit' | 'view' | 'delete' | null;

interface UserModalState {
  type: UserModalType;
  isOpen: boolean;
  user: User | null;
  loading: boolean;
}

export const useUserModal = () => {
  const [modalState, setModalState] = useState<UserModalState>({
    type: null,
    isOpen: false,
    user: null,
    loading: false,
  });

  // 🚪 ABRIR MODAL DE CREAR USUARIO
  const openCreateModal = useCallback(() => {
    setModalState({
      type: 'create',
      isOpen: true,
      user: null,
      loading: false,
    });
  }, []);

  // ✏️ ABRIR MODAL DE EDITAR USUARIO
  const openEditModal = useCallback((user: User) => {
    setModalState({
      type: 'edit',
      isOpen: true,
      user,
      loading: false,
    });
  }, []);

  // 👁️ ABRIR MODAL DE VER USUARIO
  const openViewModal = useCallback((user: User) => {
    setModalState({
      type: 'view',
      isOpen: true,
      user,
      loading: false,
    });
  }, []);

  // 🗑️ ABRIR MODAL DE ELIMINAR USUARIO
  const openDeleteModal = useCallback((user: User) => {
    setModalState({
      type: 'delete',
      isOpen: true,
      user,
      loading: false,
    });
  }, []);

  // ❌ CERRAR MODAL
  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      isOpen: false,
      user: null,
      loading: false,
    });
  }, []);

  // ⏳ ESTABLECER ESTADO DE CARGA
  const setLoading = useCallback((loading: boolean) => {
    setModalState(prev => ({
      ...prev,
      loading,
    }));
  }, []);

  // 🔄 ACTUALIZAR USUARIO EN MODAL (para refrescar datos)
  const updateModalUser = useCallback((user: User) => {
    setModalState(prev => ({
      ...prev,
      user,
    }));
  }, []);

  // 🎯 HELPERS PARA VERIFICAR TIPO DE MODAL
  const modalHelpers = {
    isCreateModal: modalState.type === 'create',
    isEditModal: modalState.type === 'edit',
    isViewModal: modalState.type === 'view',
    isDeleteModal: modalState.type === 'delete',
    isFormModal: modalState.type === 'create' || modalState.type === 'edit',
  };

  return {
    // Estado del modal
    modalState,
    ...modalHelpers,

    // Acciones para abrir modales
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,

    // Acciones generales
    closeModal,
    setLoading,
    updateModalUser,
  };
};