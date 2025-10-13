// src/lib/supabase/route-handler.ts
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * ✅ HELPER CENTRALIZADO PARA ROUTE HANDLERS (APIs)
 * 
 * Crea un cliente de Supabase optimizado para Route Handlers (API Routes)
 * Usa los métodos modernos getAll/setAll para evitar warnings de @supabase/ssr
 * 
 * @param request - NextRequest de la API route
 * @returns Cliente de Supabase configurado correctamente
 */
export function createRouteHandlerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ MÉTODO MODERNO: getAll (reemplaza get - deprecado)
        getAll() {
          return request.cookies.getAll();
        },
        // ✅ MÉTODO MODERNO: setAll (reemplaza set y remove - deprecados)
        setAll(cookiesToSet) {
          // En Route Handlers, las cookies se manejan de forma read-only
          // Este método es requerido por el tipo pero no hace nada en la mayoría de casos
          try {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
          } catch {
            // Ignorar errores en contexto read-only
            // Las cookies se establecerán en la respuesta si es necesario
          }
        },
      },
    }
  );
}

/**
 * ✅ HELPER PARA VERIFICAR AUTENTICACIÓN EN APIS
 * 
 * Verifica que el usuario esté autenticado
 * 
 * @param request - NextRequest de la API route
 * @returns { user, supabase } o { error }
 */
export async function authenticateRequest(request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  
  if (sessionError || !user) {
    return { error: 'No autenticado', status: 401 };
  }
  
  return { user, supabase };
}
