import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // Manejar error de cookies en contextos donde no se pueden modificar
            // (ej: durante el renderizado de componentes)
          }
        },
      },
    }
  );
}