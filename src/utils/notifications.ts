// utils/notifications.ts - v7.0 CON ESTILOS MUSCLEUP COMPLETO
import toast from 'react-hot-toast';
import { colorTokens } from '@/theme';

export const notify = {
  success: (message: string) => toast.success(message, {
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.success}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.shadow}`
    },
    iconTheme: {
      primary: colorTokens.success,
      secondary: colorTokens.textPrimary
    },
    duration: 3000
  }),
  
  error: (message: string) => toast.error(message, {
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.danger}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.shadow}`
    },
    iconTheme: {
      primary: colorTokens.danger,
      secondary: colorTokens.textPrimary
    },
    duration: 4000
  }),
  
  loading: (message: string) => toast.loading(message, {
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.brand}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.glow}`
    },
    iconTheme: {
      primary: colorTokens.brand,
      secondary: colorTokens.textOnBrand
    }
  }),

  info: (message: string) => toast(message, {
    icon: 'ℹ️',
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.info}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.shadow}`
    },
    duration: 3500
  }),

  warning: (message: string) => toast(message, {
    icon: '⚠️',
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.warning}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.glow}`
    },
    duration: 4000
  }),
  
  // ✅ PARA OPERACIONES ASYNC MUSCLEUP
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages, {
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.brand}`,
      borderRadius: '8px',
      fontWeight: 500,
      boxShadow: `0 4px 12px ${colorTokens.glow}`
    },
    success: {
      iconTheme: {
        primary: colorTokens.success,
        secondary: colorTokens.textPrimary
      }
    },
    error: {
      iconTheme: {
        primary: colorTokens.danger,
        secondary: colorTokens.textPrimary
      }
    },
    loading: {
      iconTheme: {
        primary: colorTokens.brand,
        secondary: colorTokens.textOnBrand
      }
    }
  }),

  // ✅ DISMISSAL ESPECÍFICO
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // ✅ NOTIFICACIÓN PERSONALIZADA MUSCLEUP
  custom: (message: string, options?: {
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    icon?: string;
  }) => {
    const { type = 'info', duration = 3000, icon } = options || {};
    
    const colors = {
      success: colorTokens.success,
      error: colorTokens.danger,
      info: colorTokens.info,
      warning: colorTokens.warning
    };

    return toast(message, {
      icon: icon,
      style: {
        background: colorTokens.surfaceLevel2,
        color: colorTokens.textPrimary,
        border: `1px solid ${colors[type]}`,
        borderRadius: '8px',
        fontWeight: 500,
        boxShadow: `0 4px 12px ${colorTokens.shadow}`
      },
      duration
    });
  }
};

// ✅ CONFIGURACIÓN GLOBAL DEL TOASTER
export const toasterConfig = {
  position: 'top-right' as const,
  reverseOrder: false,
  gutter: 8,
  containerStyle: {
    top: 20,
    right: 20
  },
  toastOptions: {
    duration: 3000,
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      maxWidth: '400px'
    }
  }
};