'use client';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { colorTokens } from '@/theme';

// Instancia de SweetAlert2 con React Content
const MySwal = withReactContent(Swal);

// Configuración dark con tu paleta
const darkProSwalConfig = {
  background: colorTokens.neutral200,      // Fondo gris oscuro
  color: colorTokens.neutral1200,          // Texto blanco
  confirmButtonColor: colorTokens.brand,   // Botón amarillo
  cancelButtonColor: colorTokens.neutral600, // Botón gris
  denyButtonColor: colorTokens.danger,     // Botón rojo
  
  customClass: {
    popup: 'swal-dark-popup',
    confirmButton: 'swal-dark-confirm-button',
    cancelButton: 'swal-dark-cancel-button',
  }
};

// Función para mostrar éxito
export const showSuccess = (message: string, title = '¡Éxito!') => {
  return MySwal.fire({
    ...darkProSwalConfig,
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    iconColor: colorTokens.success,
  });
};

// Función para mostrar error
export const showError = (message: string, title = 'Error') => {
  return MySwal.fire({
    ...darkProSwalConfig,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    iconColor: colorTokens.danger,
  });
};

// Función para confirmación de eliminación
export const showDeleteConfirmation = (itemName: string) => {
  return MySwal.fire({
    ...darkProSwalConfig,
    icon: 'warning',
    title: '⚠️ Eliminar definitivamente',
    html: `
      <div style="text-align: left; color: ${colorTokens.neutral1000};">
        <p style="margin-bottom: 16px;">¿Estás completamente seguro de eliminar:</p>
        <p style="font-weight: 600; color: ${colorTokens.brand}; margin-bottom: 16px;">${itemName}</p>
        <div style="background: ${colorTokens.danger}20; border: 1px solid ${colorTokens.danger}40; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <p style="color: ${colorTokens.danger}; font-weight: 600; margin: 0;">⚠️ Esta acción NO se puede deshacer</p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: colorTokens.danger,
    iconColor: colorTokens.warning,
    focusCancel: true,
  });
};

// Función para confirmación general
export const showConfirmation = (
  message: string,
  title = '¿Estás seguro?',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar'
) => {
  return MySwal.fire({
    ...darkProSwalConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    iconColor: colorTokens.info,
    focusCancel: true,
  });
};

// Función para confirmación de guardado con 3 opciones
export const showSaveConfirmation = (
  title = '¿Deseas guardar los cambios?',
  confirmText = 'Guardar',
  denyText = 'No guardar',
  cancelText = 'Cancelar',
  message?: string
) => {
  return MySwal.fire({
    ...darkProSwalConfig,
    icon: 'question',
    title,
    text: message,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: confirmText,
    denyButtonText: denyText,
    cancelButtonText: cancelText,
    confirmButtonColor: colorTokens.success,   // Verde para guardar
    denyButtonColor: colorTokens.warning,      // Amarillo para no guardar
    cancelButtonColor: colorTokens.neutral600, // Gris para cancelar
    iconColor: colorTokens.info,
    focusCancel: true,
  });
};

// Función para confirmación de guardado con callback automático
export const handleSaveDialog = async (
  onSave: () => void | Promise<void>,
  onDontSave: () => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
  options?: {
    title?: string;
    message?: string;
    confirmText?: string;
    denyText?: string;
    cancelText?: string;
  }
) => {
  const result = await showSaveConfirmation(
    options?.title,
    options?.confirmText,
    options?.denyText,
    options?.cancelText,
    options?.message
  );

  if (result.isConfirmed) {
    // Usuario eligió "Guardar"
    await onSave();
    await showSuccess('Cambios guardados exitosamente', '✅ Guardado');
  } else if (result.isDenied) {
    // Usuario eligió "No guardar"
    await onDontSave();
    await MySwal.fire({
      ...darkProSwalConfig,
      icon: 'info',
      title: 'Cambios no guardados',
      text: 'Los cambios han sido descartados',
      timer: 2000,
      showConfirmButton: false,
      iconColor: colorTokens.info,
    });
  } else if (result.isDismissed && onCancel) {
    // Usuario eligió "Cancelar" o cerró el dialog
    await onCancel();
  }

  return result;
};

export default MySwal;