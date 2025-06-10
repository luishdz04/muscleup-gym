import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // Este try/catch es necesario para trabajar con la API de cookies de Next.js
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
      },
    }
  );
}