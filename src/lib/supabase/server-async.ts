import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// ✅ Cliente específico para Next.js 15 con métodos modernos
export async function createAsyncServerSupabaseClient() {
  const cookieStore = await cookies(); // ✅ AWAIT agregado para Next.js 15
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        // ✅ MÉTODO MODERNO: getAll (reemplaza get)
        getAll() {
          return cookieStore.getAll();
        },
        // ✅ MÉTODO MODERNO: setAll (reemplaza set y remove)
        setAll(cookiesToSet) {
          try {
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