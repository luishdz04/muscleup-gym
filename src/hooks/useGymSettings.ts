import { useState, useEffect } from 'react';

interface GymSettings {
  id: string;
  gym_name: string;
  gym_address: string;
  gym_phone: string;
  gym_email: string | null;
  gym_logo_url: string | null;
  gym_facebook_url: string;
  gym_maps_url: string;
  gym_hours: Record<string, { open: string; close: string; enabled: boolean }>;
}

// Valores por defecto (fallback si falla la API)
const DEFAULT_SETTINGS: GymSettings = {
  id: '',
  gym_name: 'Muscle Up GYM',
  gym_address: 'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
  gym_phone: '866 112 7905',
  gym_email: 'administracion@muscleupgym.fitness',
  gym_logo_url: null,
  gym_facebook_url: 'https://www.facebook.com/Lindavistagym',
  gym_maps_url: 'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
  gym_hours: {
    monday: { open: '06:00', close: '23:00', enabled: true },
    tuesday: { open: '06:00', close: '23:00', enabled: true },
    wednesday: { open: '06:00', close: '23:00', enabled: true },
    thursday: { open: '06:00', close: '23:00', enabled: true },
    friday: { open: '06:00', close: '23:00', enabled: true },
    saturday: { open: '06:00', close: '23:00', enabled: true },
    sunday: { open: '06:00', close: '23:00', enabled: false }
  }
};

export function useGymSettings() {
  const [settings, setSettings] = useState<GymSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/gym-settings');

        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          console.warn('[useGymSettings] Failed to fetch settings, using defaults');
          setError('No se pudo cargar la configuración');
        }
      } catch (err) {
        console.error('[useGymSettings] Error:', err);
        setError('Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Helper para obtener el teléfono en formato tel:
  const getPhoneLink = () => {
    return `tel:${settings.gym_phone.replace(/\s/g, '')}`;
  };

  // Helper para formatear la dirección en partes
  const getAddressParts = () => {
    const parts = settings.gym_address.split(',').map(p => p.trim());
    return {
      full: settings.gym_address,
      parts
    };
  };

  return {
    settings,
    loading,
    error,
    getPhoneLink,
    getAddressParts
  };
}
