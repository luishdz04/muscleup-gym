// components/providers/ToastProvider.tsx - CONFIGURACIÓN OPTIMIZADA
'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { colorTokens } from '@/theme';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        zIndex: 9999,
        top: 20, // Margen superior para evitar solapamiento con elementos fijos
      }}
      toastOptions={{
        duration: 4000,
        // ESTILO BASE MEJORADO
        style: {
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          color: colorTokens.neutral1200,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px 20px',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${colorTokens.brand}15`,
          backdropFilter: 'blur(10px)',
          maxWidth: '400px',
          minWidth: '300px',
        },
        
        // CONFIGURACIÓN DE ÉXITO OPTIMIZADA
        success: {
          duration: 3000,
          iconTheme: {
            primary: colorTokens.success,
            secondary: colorTokens.neutral1200,
          },
          style: {
            background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}25)`,
            border: `1px solid ${colorTokens.success}50`,
            color: colorTokens.success,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${colorTokens.success}20`,
            backdropFilter: 'blur(10px)',
          },
        },
        
        // CONFIGURACIÓN DE ERROR OPTIMIZADA
        error: {
          duration: 6000,
          iconTheme: {
            primary: colorTokens.danger,
            secondary: colorTokens.neutral1200,
          },
          style: {
            background: `linear-gradient(135deg, ${colorTokens.danger}15, ${colorTokens.danger}25)`,
            border: `1px solid ${colorTokens.danger}50`,
            color: colorTokens.danger,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${colorTokens.danger}20`,
            backdropFilter: 'blur(10px)',
          },
        },
        
        // CONFIGURACIÓN DE LOADING
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: colorTokens.brand,
            secondary: colorTokens.neutral1200,
          },
          style: {
            background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}25)`,
            border: `1px solid ${colorTokens.brand}50`,
            color: colorTokens.brand,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${colorTokens.brand}20`,
            backdropFilter: 'blur(10px)',
          },
        },
      }}
    />
  );
};

export default ToastProvider;