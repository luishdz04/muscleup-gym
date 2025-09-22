// hooks/useBulkActions.ts - Selección múltiple y acciones en lote
'use client';

import { useState, useCallback, useMemo } from 'react';
import { User } from '@/types/user';
import { useNotifications } from '@/hooks/useNotifications';

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useBulkActions = () => {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast, alert } = useNotifications();

  // 🎯 SELECCIÓN INDIVIDUAL
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // ☑️ SELECCIONAR TODOS LOS USUARIOS VISIBLES
  const selectAllUsers = useCallback((users: User[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedUserIds(new Set(users.map(user => user.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  }, []);

  // 🧹 LIMPIAR SELECCIÓN
  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
  }, []);

  // 📊 ESTADÍSTICAS DE SELECCIÓN
  const selectionStats = useMemo(() => {
    const count = selectedUserIds.size;
    return {
      count,
      hasSelection: count > 0,
      isMultiple: count > 1,
      selectedIds: Array.from(selectedUserIds),
    };
  }, [selectedUserIds]);

  // 🗑️ ELIMINACIÓN EN LOTE
  const bulkDelete = useCallback(async (users: User[]): Promise<BulkActionResult> => {
    const selectedUsers = users.filter(user => selectedUserIds.has(user.id));
    
    if (selectedUsers.length === 0) {
      toast.error('No hay usuarios seleccionados para eliminar');
      return { success: 0, failed: 0, errors: [] };
    }

    // 🚨 CONFIRMACIÓN CRÍTICA
    const userNames = selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ');
    const confirmResult = await alert.deleteConfirm(
      `${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}`,
      `Se eliminarán: ${userNames}\n\n⚠️ Esta acción NO se puede deshacer.`
    );

    if (!confirmResult.isConfirmed) {
      return { success: 0, failed: 0, errors: [] };
    }

    setIsProcessing(true);
    const result: BulkActionResult = { success: 0, failed: 0, errors: [] };

    try {
      // 🔄 PROCESAR ELIMINACIONES EN LOTE
      const deletePromises = selectedUsers.map(async (user) => {
        try {
          const response = await fetch(`/api/admin/users/${user.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar usuario');
          }

          result.success++;
          return { success: true, userId: user.id, userName: `${user.firstName} ${user.lastName}` };

        } catch (error: any) {
          result.failed++;
          result.errors.push(`${user.firstName} ${user.lastName}: ${error.message}`);
          return { success: false, userId: user.id, error: error.message };
        }
      });

      await Promise.allSettled(deletePromises);

      // 📊 MOSTRAR RESULTADOS
      if (result.success > 0) {
        toast.success(`${result.success} usuario${result.success > 1 ? 's eliminados' : ' eliminado'} correctamente`);
      }

      if (result.failed > 0) {
        await alert.error(
          'Algunos usuarios no se pudieron eliminar',
          result.errors.join('\n')
        );
      }

      // ✅ LIMPIAR SELECCIÓN DESPUÉS DEL ÉXITO
      if (result.success > 0) {
        clearSelection();
      }

    } catch (error: any) {
      toast.error('Error inesperado en eliminación masiva');
      result.errors.push(error.message);
    } finally {
      setIsProcessing(false);
    }

    return result;
  }, [selectedUserIds, toast, alert, clearSelection]);

  // 📧 ENVÍO MASIVO DE EMAILS  
  const bulkEmail = useCallback(async (
    users: User[], 
    emailType: 'welcome' | 'reminder' | 'contract'
  ): Promise<BulkActionResult> => {
    const selectedUsers = users.filter(user => 
      selectedUserIds.has(user.id) && user.email
    );
    
    if (selectedUsers.length === 0) {
      toast.error('No hay usuarios con email seleccionados');
      return { success: 0, failed: 0, errors: [] };
    }

    // 📧 CONFIRMACIÓN DE ENVÍO
    const emailTypes = {
      welcome: 'bienvenida',
      reminder: 'recordatorio',
      contract: 'contrato',
    };

    const confirmResult = await alert.confirm(
      `¿Enviar emails de ${emailTypes[emailType]} a ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}?`,
      'Confirmar envío masivo',
      'Sí, enviar',
      'Cancelar'
    );

    if (!confirmResult.isConfirmed) {
      return { success: 0, failed: 0, errors: [] };
    }

    setIsProcessing(true);
    const result: BulkActionResult = { success: 0, failed: 0, errors: [] };

    try {
      // 🔄 PROCESAR ENVÍOS EN LOTE
      const emailPromises = selectedUsers.map(async (user) => {
        try {
          const response = await fetch('/api/admin/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              emailType,
              recipientEmail: user.email,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al enviar email');
          }

          result.success++;
          return { success: true, userId: user.id };

        } catch (error: any) {
          result.failed++;
          result.errors.push(`${user.firstName} ${user.lastName}: ${error.message}`);
          return { success: false, userId: user.id, error: error.message };
        }
      });

      await Promise.allSettled(emailPromises);

      // 📊 MOSTRAR RESULTADOS
      if (result.success > 0) {
        toast.success(`${result.success} email${result.success > 1 ? 's enviados' : ' enviado'} correctamente`);
      }

      if (result.failed > 0) {
        await alert.error(
          'Algunos emails no se pudieron enviar',
          result.errors.slice(0, 5).join('\n') + (result.errors.length > 5 ? '\n...' : '')
        );
      }

      // ✅ LIMPIAR SELECCIÓN DESPUÉS DEL ÉXITO
      if (result.success > 0) {
        clearSelection();
      }

    } catch (error: any) {
      toast.error('Error inesperado en envío masivo');
    } finally {
      setIsProcessing(false);
    }

    return result;
  }, [selectedUserIds, toast, alert, clearSelection]);

  return {
    // Estado de selección
    selectedUserIds,
    selectionStats,
    isProcessing,

    // Acciones de selección
    toggleUserSelection,
    selectAllUsers,
    clearSelection,

    // Acciones en lote
    bulkDelete,
    bulkEmail,
  };
};