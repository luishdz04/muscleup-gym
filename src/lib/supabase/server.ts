// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// ✅ FUNCIÓN ACTUALIZADA - Métodos modernos getAll/setAll (sin warnings)
export function createServerSupabaseClient() {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        // ✅ MÉTODO MODERNO: getAll (reemplaza get)
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        // ✅ MÉTODO MODERNO: setAll (reemplaza set y remove)
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
      },
    }
  );
}