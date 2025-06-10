'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

// Variable global para evitar cargar el script varias veces
let turnstileScriptLoaded = false;

const Turnstile = ({ siteKey, onVerify, theme = 'dark', action = 'registro' }: TurnstileProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(turnstileScriptLoaded);
  
  // Cargar el script de Turnstile si aún no está cargado
  useEffect(() => {
    if (turnstileScriptLoaded) {
      setIsScriptLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      turnstileScriptLoaded = true;
      setIsScriptLoaded(true);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // No eliminamos el script para evitar recargas
    };
  }, []);

  // Renderizar el widget cuando esté disponible
  useEffect(() => {
    if (!isScriptLoaded || !divRef.current || !window.turnstile) return;
    
    // Limpiar cualquier widget existente
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.error("Error al eliminar widget anterior:", e);
      }
      widgetIdRef.current = null;
    }
    
    // Pequeño retraso para asegurarse de que DOM está listo
    const timer = setTimeout(() => {
      try {
        widgetIdRef.current = window.turnstile.render(divRef.current!, {
          sitekey: siteKey,
          callback: onVerify,
          theme: theme,
          action: action,
          appearance: 'interaction-only',
        });
      } catch (e) {
        console.error("Error al renderizar Turnstile:", e);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.error("Error al limpiar widget:", e);
        }
      }
    };
  }, [isScriptLoaded, siteKey, onVerify, theme, action]);

  return <div ref={divRef} className="flex justify-center my-4"></div>;
};

export default Turnstile;

// Tipado global para Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement, 
        options: {
          sitekey: string;
          callback: (token: string) => void;
          theme?: 'light' | 'dark' | 'auto';
          action?: string;
          appearance?: string;
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}