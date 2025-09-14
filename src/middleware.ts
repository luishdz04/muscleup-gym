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
  
  // 3. Define rutas
  const publicRoutes = ['/', '/login', '/reset-password', '/registro', '/registro-pendiente', '/bienvenido'];
  const adminRoutes = ['/dashboard/admin'];
  const protectedRoutes = ['/dashboard'];
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  console.log('🛡️ Middleware - Path:', pathname);
  console.log('🛡️ Middleware - User:', user ? `Autenticado (ID: ${user.id})` : 'No autenticado');

  // 4. 🚨 BLOQUEO CRÍTICO: Sin usuario en cualquier ruta protegida
  if (!user && (isProtectedRoute || isAdminRoute)) {
    console.log('🚨 Middleware - ACCESO DENEGADO: Sin autenticación');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. 🔥 BLOQUEO ESTRICTO DE RUTAS ADMIN
  if (isAdminRoute) {
    console.log('🔒 Middleware - Verificando acceso ADMIN...');
    
    if (!user) {
      console.log('🚨 Middleware - BLOQUEADO: Sin usuario en ruta admin');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // ⚡ Consultar rol para usuarios autenticados en rutas admin
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();
    
    const userRole = userData?.rol || null;
    console.log('🔍 Middleware - Rol verificado:', userRole);
    
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.log('🚨 Middleware - ACCESO DENEGADO: Rol insuficiente');
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  // 6. Redirección desde rutas públicas si ya está autenticado
  if (user && isPublicRoute && pathname !== '/' && pathname !== '/bienvenido' && pathname !== '/registro-pendiente') {
    console.log('🔄 Middleware - Redirigiendo a dashboard (ya autenticado)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // 7. ✅ REDIRECCIÓN INTELIGENTE desde /dashboard
  if (user && pathname === '/dashboard') {
    // Consultar rol solo cuando sea necesario
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();
    
    const userRole = userData?.rol || 'cliente';
    console.log('🎯 Middleware - Redirigiendo según rol:', userRole);
    
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
  console.log('✅ Middleware - Acceso permitido');
  return response;
}

export const config = {
  // ✅ MATCHER ESTRICTO: Incluye todas las rutas del dashboard
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/registro/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.ico$|.*\\.svg$).*)',
  ],
};