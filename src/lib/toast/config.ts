import { toast, ToastOptions, ToastContent } from 'react-toastify';
import React from 'react';

// 🎨 DARK PRO SYSTEM - TOKENS PARA TOASTIFY
export const darkProToastTokens = {
  // Base Colors
  background: '#1E1E1E',
  surfaceLevel1: '#252525',
  surfaceLevel2: '#2E2E2E',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  
  // Semantic Colors
  success: '#388E3C',
  successBackground: 'linear-gradient(135deg, #388E3C15, #388E3C08)',
  successBorder: '#388E3C40',
  
  error: '#D32F2F',
  errorBackground: 'linear-gradient(135deg, #D32F2F15, #D32F2F08)',
  errorBorder: '#D32F2F40',
  
  warning: '#FFB300',
  warningBackground: 'linear-gradient(135deg, #FFB30015, #FFB30008)',
  warningBorder: '#FFB30040',
  
  info: '#1976D2',
  infoBackground: 'linear-gradient(135deg, #1976D215, #1976D208)',
  infoBorder: '#1976D240',
  
  primary: '#FFCC00',
  primaryBackground: 'linear-gradient(135deg, #FFCC0015, #FFCC0008)',
  primaryBorder: '#FFCC0040',
};

// ✅ CONFIGURACIÓN BASE PARA TOASTIFY
export const baseToastConfig: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  style: {
    background: darkProToastTokens.background,
    color: darkProToastTokens.textPrimary,
    border: `1px solid ${darkProToastTokens.primaryBorder}`,
    borderRadius: '12px',
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 204, 0, 0.1)',
    backdropFilter: 'blur(20px)',
  }
};

// 🎯 FUNCIONES PERSONALIZADAS PARA CADA TIPO
export const showSuccessToast = (message: ToastContent, options?: ToastOptions) => {
  return toast.success(message, {
    ...baseToastConfig,
    style: {
      ...baseToastConfig.style,
      background: darkProToastTokens.successBackground,
      border: `1px solid ${darkProToastTokens.successBorder}`,
      boxShadow: `0 10px 40px rgba(56, 142, 60, 0.2), 0 0 0 1px ${darkProToastTokens.successBorder}`,
    },
    progressStyle: {
      background: darkProToastTokens.success,
      boxShadow: `0 0 10px ${darkProToastTokens.success}60`,
    },
    ...options,
  });
};

export const showErrorToast = (message: ToastContent, options?: ToastOptions) => {
  return toast.error(message, {
    ...baseToastConfig,
    autoClose: 7000, // Más tiempo para errores
    style: {
      ...baseToastConfig.style,
      background: darkProToastTokens.errorBackground,
      border: `1px solid ${darkProToastTokens.errorBorder}`,
      boxShadow: `0 10px 40px rgba(211, 47, 47, 0.2), 0 0 0 1px ${darkProToastTokens.errorBorder}`,
    },
    progressStyle: {
      background: darkProToastTokens.error,
      boxShadow: `0 0 10px ${darkProToastTokens.error}60`,
    },
    ...options,
  });
};

export const showWarningToast = (message: ToastContent, options?: ToastOptions) => {
  return toast.warn(message, {
    ...baseToastConfig,
    autoClose: 6000,
    style: {
      ...baseToastConfig.style,
      background: darkProToastTokens.warningBackground,
      border: `1px solid ${darkProToastTokens.warningBorder}`,
      boxShadow: `0 10px 40px rgba(255, 179, 0, 0.2), 0 0 0 1px ${darkProToastTokens.warningBorder}`,
    },
    progressStyle: {
      background: darkProToastTokens.warning,
      boxShadow: `0 0 10px ${darkProToastTokens.warning}60`,
    },
    ...options,
  });
};

export const showInfoToast = (message: ToastContent, options?: ToastOptions) => {
  return toast.info(message, {
    ...baseToastConfig,
    style: {
      ...baseToastConfig.style,
      background: darkProToastTokens.infoBackground,
      border: `1px solid ${darkProToastTokens.infoBorder}`,
      boxShadow: `0 10px 40px rgba(25, 118, 210, 0.2), 0 0 0 1px ${darkProToastTokens.infoBorder}`,
    },
    progressStyle: {
      background: darkProToastTokens.info,
      boxShadow: `0 0 10px ${darkProToastTokens.info}60`,
    },
    ...options,
  });
};

export const showLoadingToast = (message: ToastContent) => {
  return toast.loading(message, {
    ...baseToastConfig,
    autoClose: false,
    closeOnClick: false,
    style: {
      ...baseToastConfig.style,
      background: darkProToastTokens.primaryBackground,
      border: `1px solid ${darkProToastTokens.primaryBorder}`,
      boxShadow: `0 10px 40px rgba(255, 204, 0, 0.2), 0 0 0 1px ${darkProToastTokens.primaryBorder}`,
    },
  });
};

// ✅ FUNCIÓN HELPER PARA CREAR ELEMENTO PERSONALIZADO
export const createCustomToastContent = (
  message: ToastContent,
  icon?: string,
  action?: { label: string; onClick: () => void }
) => {
  // Crear el contenido como objeto que React pueda renderizar
  const contentData = {
    message,
    icon,
    action
  };
  
  return contentData;
};

// 🎨 TOAST PERSONALIZADO CON ICONOS Y ACCIONES - SIMPLIFICADO
export const showCustomToast = (
  message: ToastContent, 
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  options?: ToastOptions & { 
    icon?: string;
    action?: { label: string; onClick: () => void };
  }
) => {
  const { icon, action, ...toastOptions } = options || {};
  
  // Crear mensaje enriquecido como string
  let enrichedMessage = '';
  if (icon) {
    enrichedMessage = `${icon} ${message}`;
  } else {
    enrichedMessage = String(message);
  }
  
  // Agregar acción como texto si existe
  if (action) {
    enrichedMessage += ` • ${action.label}`;
  }

  // Función personalizada onClick si hay acción
  const customOptions = {
    ...toastOptions,
    onClick: action ? action.onClick : undefined,
  };

  switch (type) {
    case 'success':
      return showSuccessToast(enrichedMessage, customOptions);
    case 'error':
      return showErrorToast(enrichedMessage, customOptions);
    case 'warning':
      return showWarningToast(enrichedMessage, customOptions);
    default:
      return showInfoToast(enrichedMessage, customOptions);
  }
};

// 🎯 FUNCIÓN ALTERNATIVA PARA CONTENIDO COMPLEJO
export const showAdvancedToast = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  options?: {
    icon?: string;
    duration?: number;
    clickable?: boolean;
    actionText?: string;
    onActionClick?: () => void;
  }
) => {
  const { icon, duration, clickable = true, actionText, onActionClick } = options || {};
  
  let finalMessage = message;
  if (icon) {
    finalMessage = `${icon} ${message}`;
  }
  
  if (actionText && onActionClick) {
    finalMessage += ` • Haz clic para ${actionText}`;
  }

  const toastConfig: ToastOptions = {
    autoClose: duration || (type === 'error' ? 7000 : 5000),
    closeOnClick: clickable,
    onClick: onActionClick,
  };

  switch (type) {
    case 'success':
      return showSuccessToast(finalMessage, toastConfig);
    case 'error':
      return showErrorToast(finalMessage, toastConfig);
    case 'warning':
      return showWarningToast(finalMessage, toastConfig);
    default:
      return showInfoToast(finalMessage, toastConfig);
  }
};
