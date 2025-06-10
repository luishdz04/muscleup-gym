// Tipos de notificación
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Configuración de notificaciones
interface NotificationConfig {
  title?: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

// Función principal para mostrar notificaciones
export const showNotification = (
  message: string, 
  type: NotificationType = 'info',
  config?: NotificationConfig
) => {
  // Log para debugging
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Emojis para cada tipo
  const emoji = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  // Colores para cada tipo
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    info: '#2196f3',
    warning: '#ff9800'
  };

  // Por ahora usamos alert simple, pero se puede integrar con:
  // - react-hot-toast
  // - sonner
  // - notistack
  // - custom toast component
  
  if (typeof window !== 'undefined') {
    // Crear notificación personalizada si está en el navegador
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${emoji[type]}</span>
        <span>${message}</span>
      </div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    
    if (!document.head.querySelector('style[data-notifications]')) {
      style.setAttribute('data-notifications', 'true');
      document.head.appendChild(style);
    }

    // Agregar al DOM
    document.body.appendChild(notification);

    // Auto-remove después de la duración especificada
    const duration = config?.duration || (type === 'error' ? 5000 : 3000);
    
    const removeNotification = () => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    // Click para cerrar
    notification.addEventListener('click', removeNotification);
    
    // Auto-close
    setTimeout(removeNotification, duration);
  }
};

// Función para notificaciones de éxito
export const showSuccess = (message: string, config?: NotificationConfig) => {
  showNotification(message, 'success', config);
};

// Función para notificaciones de error
export const showError = (message: string, config?: NotificationConfig) => {
  showNotification(message, 'error', config);
};

// Función para notificaciones de información
export const showInfo = (message: string, config?: NotificationConfig) => {
  showNotification(message, 'info', config);
};

// Función para notificaciones de advertencia
export const showWarning = (message: string, config?: NotificationConfig) => {
  showNotification(message, 'warning', config);
};

// Función para confirmar acciones peligrosas
export const confirmAction = async (
  message: string,
  title: string = 'Confirmar acción'
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    } else {
      resolve(false);
    }
  });
};

// Función para prompts simples
export const promptInput = async (
  message: string,
  defaultValue: string = ''
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      const result = window.prompt(message, defaultValue);
      resolve(result);
    } else {
      resolve(null);
    }
  });
};

// Función para limpiar todas las notificaciones
export const clearAllNotifications = () => {
  if (typeof window !== 'undefined') {
    const notifications = document.querySelectorAll('[data-notification]');
    notifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }
};

// Hook para integrar con React (opcional)
export const useNotifications = () => {
  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showNotification,
    confirmAction,
    promptInput,
    clearAll: clearAllNotifications
  };
};