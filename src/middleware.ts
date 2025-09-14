import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config';

// Función para actualizar la cookie de sesión
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // IMPORTANTE: Refresca la sesión del usuario
  await supabase.auth.getSession();
  return response;
}

export async function middleware(request: NextRequest) {
  // 1. Inicializa Supabase y refresca la sesión
  const response = await updateSession(request);
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
      },
    }
  );

  // 2. ✅ SEGURO: Usa getUser() para obtener usuario verificado
  const { data: { user } } = await supabase.auth.getUser();
  
  // 3. ⚡ OPTIMIZACIÓN: Consultar rol UNA SOLA VEZ
  let userRole: string | null = null;
  if (user) {
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();
    userRole = userData?.rol || null;
  }

  console.log('Middleware - Path:', request.nextUrl.pathname);
  console.log('Middleware - User:', user ? `Autenticado (Rol: ${userRole})` : 'No autenticado');
  
  // 4. Define rutas
  const publicRoutes = ['/', '/login', '/reset-password', '/registro'];
  const adminRoutes = ['/dashboard/admin'];
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // 5. Lógica de protección
  if (!user && !isPublicRoute) {
    // Sin usuario en ruta protegida -> login
    console.log('Middleware - Redirigiendo a login (sin sesión y en ruta protegida)');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isPublicRoute && pathname !== '/') {
    // Usuario en ruta pública -> dashboard
    console.log('Middleware - Redirigiendo a dashboard (ruta pública con sesión)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // 6. ✅ PROTECCIÓN CRÍTICA: Verificar acceso a rutas admin
  if (user && isAdminRoute) {
    console.log('Middleware - Verificando acceso a ruta admin...');
    console.log('Middleware - Rol verificado:', userRole);
    
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.log('Middleware - ⛔ ACCESO DENEGADO a ruta admin');
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  // 7. ✅ REDIRECCIÓN INTELIGENTE desde /dashboard
  if (user && pathname === '/dashboard') {
    console.log('Middleware - Redirigiendo según rol:', userRole);
    
    switch (userRole) {
      case 'admin':
      case 'empleado':
        return NextResponse.redirect(new URL('/dashboard/admin/usuarios', request.url));
      case 'cliente':
      default:
        return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  // 8. Si pasa todas las validaciones, permite continuar
  return response;
}

export const config = {
  // ✅ MATCHER OPTIMIZADO: Excluye archivos estáticos y manifest
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
  ],
};