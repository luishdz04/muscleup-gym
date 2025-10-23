// ========================================
// 🔔 HOOK DE NOTIFICACIONES - VERSIÓN COMPLETA
// ========================================
// Incluye: toast, alert, notifications system
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  showSuccess,
  showError,
  showDeleteConfirmation,
  showConfirmation,
  showSaveConfirmation,
  handleSaveDialog
} from '@/lib/notifications/MySwal';

// ✅ TIPOS
interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  // ✅ ESTADO PARA SISTEMA DE NOTIFICACIONES
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ FETCH CONTADOR NO LEÍDAS
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('❌ Error al obtener contador:', error);
    }
  }, []);

  // ✅ FETCH NOTIFICACIONES
  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    setLoading(true);
    try {
      const url = `/api/notifications?limit=50${unreadOnly ? '&unread=true' : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
      } else {
        console.error('❌ Error al cargar notificaciones');
      }
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MARCAR COMO LEÍDA
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      });

      if (response.ok) {
        // Actualizar estado local inmediatamente para feedback instantáneo
        setNotifications(prev => {
          const updated = prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          );
          return updated;
        });
        
        // Decrementar contador inmediatamente
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Recargar desde servidor para asegurar sincronización
        setTimeout(() => {
          fetchUnreadCount();
          fetchNotifications();
        }, 300);
      }
    } catch (error) {
      console.error('❌ Error al marcar como leída:', error);
    }
  }, [fetchUnreadCount, fetchNotifications]);

  // ✅ MARCAR TODAS COMO LEÍDAS
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });

      if (response.ok) {
        // Actualizar estado local inmediatamente
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            is_read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        
        setUnreadCount(0);
        
        // Recargar desde servidor para confirmar
        setTimeout(() => fetchNotifications(), 500);
        
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('❌ Error al marcar todas como leídas:', error);
      toast.error('Error al marcar notificaciones');
    }
  }, [fetchNotifications]);

  // ✅ CARGAR CONTADOR AL MONTAR
  useEffect(() => {
    fetchUnreadCount();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ✅ MEMOIZAR FUNCIONES TOAST
  const toastFunctions = useMemo(() => ({
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise,
    dismiss: toast.dismiss,
  }), []);

  // ✅ MEMOIZAR FUNCIONES ALERT
  const alertFunctions = useMemo(() => ({
    success: showSuccess,
    error: showError,
    confirm: showConfirmation,
    deleteConfirm: showDeleteConfirmation,
    saveConfirm: showSaveConfirmation,
    handleSave: handleSaveDialog,
  }), []);

  // ✅ RETORNAR TODO
  return useMemo(() => ({
    // Toast y Alert (legacy)
    toast: toastFunctions,
    alert: alertFunctions,
    
    // Sistema de Notificaciones (nuevo)
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  }), [
    toastFunctions, 
    alertFunctions, 
    notifications, 
    unreadCount, 
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  ]);
};