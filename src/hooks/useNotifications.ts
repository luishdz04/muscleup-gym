// hooks/useNotifications.ts - VERSIÓN CORREGIDA PARA INCLUIR PROMISE
'use client';

import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  showSuccess,
  showError,
  showDeleteConfirmation,
  showConfirmation
} from '@/lib/notifications/MySwal';

export const useNotifications = () => {
  // MEMOIZAR LAS FUNCIONES TOAST INCLUYENDO PROMISE
  const toastFunctions = useMemo(() => ({
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise, // AGREGAR LA FUNCIÓN PROMISE
    dismiss: toast.dismiss, // AGREGAR DISMISS PARA CONTROL MANUAL
  }), []);

  // MEMOIZAR LAS FUNCIONES ALERT
  const alertFunctions = useMemo(() => ({
    success: showSuccess,
    error: showError,
    confirm: showConfirmation,
    deleteConfirm: showDeleteConfirmation,
  }), []);

  // RETORNAR OBJETO MEMOIZADO CON FUNCIONALIDAD COMPLETA
  return useMemo(() => ({
    toast: toastFunctions,
    alert: alertFunctions
  }), [toastFunctions, alertFunctions]);
};