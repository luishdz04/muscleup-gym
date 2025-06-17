import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// ✅ Cliente específico para Next.js 15 compatible
export async function createAsyncServerSupabaseClient() {
  const cookieStore = await cookies(); // ✅ AWAIT agregado para Next.js 15
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
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