// utils/notifications.ts - PATRÓN DE LA GUÍA
import toast from 'react-hot-toast';
import { colorTokens } from '@/theme';

export const notify = {
  success: (message: string) => toast.success(message, {
    style: {
      background: colorTokens.surfaceLevel2,
      color: colorTokens.textPrimary,
      border: `1px solid ${colorTokens.success}`,
      borderRadius: '8px'
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
      border: `1px solid ${colorTokens.danger}`
    },
    iconTheme: {
      primary: colorTokens.danger,
      secondary: colorTokens.textPrimary
    },
    duration: 4000
  }),
  
  promise: <T>(promise: Promise<T>, messages: {
    loading: string;
    success: string;
    error: string;
  }) => toast.promise(promise, messages)
};
