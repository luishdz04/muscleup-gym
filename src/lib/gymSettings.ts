// Server-side helper para obtener la configuración del gimnasio
// Usado en APIs, PDFs, Emails, etc.

import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

export interface GymSettings {
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

// Valores por defecto (fallback)
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

/**
 * Obtiene la configuración del gimnasio desde la base de datos (server-side)
 *
 * @returns GymSettings - Configuración del gimnasio o valores por defecto si falla
 *
 * @example
 * // En una API route:
 * const settings = await getGymSettings();
 * const phoneFormatted = settings.gym_phone.replace(/\s/g, ''); // "8661127905"
 */
export async function getGymSettings(): Promise<GymSettings> {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    const { data, error } = await supabase
      .from('gym_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[getGymSettings] No se pudo obtener configuración, usando valores por defecto');
      return DEFAULT_SETTINGS;
    }

    return data as GymSettings;
  } catch (error) {
    console.error('[getGymSettings] Error al obtener configuración:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Obtiene el teléfono sin espacios (formato para tel: links y APIs)
 */
export function formatPhoneForLink(phone: string): string {
  return phone.replace(/\s/g, '');
}

/**
 * Obtiene el email para usar en PDFs/Emails
 */
export function getGymEmail(settings: GymSettings): string {
  return settings.gym_email || 'administracion@muscleupgym.fitness';
}
