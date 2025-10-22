'use client';

import { toast, ToastT } from 'sonner';

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: (toast: ToastT) => void;
  onAutoClose?: (toast: ToastT) => void;
  id?: string | number;
  important?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

/**
 * Hook simplificado para mostrar notificaciones con Sonner
 * Reemplaza react-hot-toast con una API más moderna
 */
export const useToast = () => {
  return {
    // Notificación de éxito
    success: (message: string, options?: ToastOptions) => {
      return toast.success(message, options);
    },

    // Notificación de error
    error: (message: string, options?: ToastOptions) => {
      return toast.error(message, options);
    },

    // Notificación informativa
    info: (message: string, options?: ToastOptions) => {
      return toast.info(message, options);
    },

    // Notificación de advertencia
    warning: (message: string, options?: ToastOptions) => {
      return toast.warning(message, options);
    },

    // Notificación genérica
    show: (message: string, options?: ToastOptions) => {
      return toast(message, options);
    },

    // Notificación de carga con promesa
    promise: async <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => {
      return toast.promise(promise, messages);
    },

    // Notificación personalizada
    custom: (jsx: React.ReactNode, options?: ToastOptions) => {
      return toast.custom(jsx, options);
    },

    // Cerrar todas las notificaciones o una específica
    dismiss: (toastId?: string | number) => {
      toast.dismiss(toastId);
    },

    // Notificación de carga
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(message, options);
    }
  };
};