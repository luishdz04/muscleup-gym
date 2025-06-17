'use client';

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { darkProToastTokens } from '@/lib/toast/config';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: darkProToastTokens.background,
          color: darkProToastTokens.textPrimary,
          border: `1px solid ${darkProToastTokens.primaryBorder}`,
          borderRadius: '12px',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 204, 0, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
        bodyStyle={{
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.5,
        }}
        progressStyle={{
          background: 'linear-gradient(90deg, #FFCC00, #FF6B35)',
          boxShadow: '0 0 10px rgba(255, 204, 0, 0.6)',
          height: '4px',
        }}
        style={{
          zIndex: 9999,
        }}
      />
      
      {/* 🎨 ESTILOS PERSONALIZADOS PARA DARK PRO */}
      <style jsx global>{`
        /* Personalización del contenedor principal */
        .Toastify__toast-container {
          width: 400px;
          max-width: 95vw;
        }
        
        /* Estilos para los diferentes tipos de toast */
        .Toastify__toast--success {
          background: ${darkProToastTokens.successBackground} !important;
          border: 1px solid ${darkProToastTokens.successBorder} !important;
          box-shadow: 0 10px 40px rgba(56, 142, 60, 0.25), 0 0 0 1px ${darkProToastTokens.successBorder} !important;
        }
        
        .Toastify__toast--error {
          background: ${darkProToastTokens.errorBackground} !important;
          border: 1px solid ${darkProToastTokens.errorBorder} !important;
          box-shadow: 0 10px 40px rgba(211, 47, 47, 0.25), 0 0 0 1px ${darkProToastTokens.errorBorder} !important;
        }
        
        .Toastify__toast--warning {
          background: ${darkProToastTokens.warningBackground} !important;
          border: 1px solid ${darkProToastTokens.warningBorder} !important;
          box-shadow: 0 10px 40px rgba(255, 179, 0, 0.25), 0 0 0 1px ${darkProToastTokens.warningBorder} !important;
        }
        
        .Toastify__toast--info {
          background: ${darkProToastTokens.infoBackground} !important;
          border: 1px solid ${darkProToastTokens.infoBorder} !important;
          box-shadow: 0 10px 40px rgba(25, 118, 210, 0.25), 0 0 0 1px ${darkProToastTokens.infoBorder} !important;
        }
        
        /* Personalización de la barra de progreso para cada tipo */
        .Toastify__toast--success .Toastify__progress-bar {
          background: linear-gradient(90deg, ${darkProToastTokens.success}, #4CAF50) !important;
          box-shadow: 0 0 15px ${darkProToastTokens.success}80 !important;
        }
        
        .Toastify__toast--error .Toastify__progress-bar {
          background: linear-gradient(90deg, ${darkProToastTokens.error}, #F44336) !important;
          box-shadow: 0 0 15px ${darkProToastTokens.error}80 !important;
        }
        
        .Toastify__toast--warning .Toastify__progress-bar {
          background: linear-gradient(90deg, ${darkProToastTokens.warning}, #FFC107) !important;
          box-shadow: 0 0 15px ${darkProToastTokens.warning}80 !important;
        }
        
        .Toastify__toast--info .Toastify__progress-bar {
          background: linear-gradient(90deg, ${darkProToastTokens.info}, #2196F3) !important;
          box-shadow: 0 0 15px ${darkProToastTokens.info}80 !important;
        }
        
        /* Personalización del botón de cerrar */
        .Toastify__close-button {
          color: ${darkProToastTokens.textSecondary} !important;
          opacity: 0.7 !important;
          transition: all 0.3s ease !important;
        }
        
        .Toastify__close-button:hover {
          opacity: 1 !important;
          transform: scale(1.1) !important;
          color: ${darkProToastTokens.textPrimary} !important;
        }
        
        /* Animaciones personalizadas */
        .Toastify__toast {
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(20px) !important;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Hover effects */
        .Toastify__toast:hover {
          transform: translateY(-2px) !important;
          transition: transform 0.2s ease !important;
        }
        
        /* Spinner personalizado para loading toasts */
        .Toastify__spinner {
          border: 2px solid ${darkProToastTokens.primaryBorder} !important;
          border-top: 2px solid ${darkProToastTokens.primary} !important;
          width: 20px !important;
          height: 20px !important;
        }
      `}</style>
    </>
  );
}
