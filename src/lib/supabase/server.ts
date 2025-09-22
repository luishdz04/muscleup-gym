// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// ✅ FUNCIÓN ORIGINAL - Para APIs existentes que ya funcionan
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
        remove(name: string, options: CookieOptions) {
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

// ✅ NUEVA FUNCIÓN ASYNC - Solo para APIs que tienen problemas de cookies
export async function createServerSupabaseClientV2() {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignorar errores cuando se ejecuta en un entorno read-only
          }
        },
      },
    }
  );
}