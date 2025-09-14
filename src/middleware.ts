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

  await supabase.auth.getSession();
  
  // ⭐ NUEVAS CABECERAS ANTI-CACHE
  response.headers.set('x-middleware-cache', 'no-cache');
  response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return { response, supabase };
}

export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request);

  const { data: { user } } = await supabase.auth.getUser();
  
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

  // 🚨 BLOQUEO CRÍTICO: Sin usuario en cualquier ruta protegida
  if (!user && (isProtectedRoute || isAdminRoute)) {
    console.log(`🚨 Middleware - ACCESO DENEGADO a ruta protegida (${pathname}) sin sesión.`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 🔒 VERIFICACIÓN DE ROL PARA RUTAS ADMIN
  if (user && isAdminRoute) {
    console.log('🔍 Middleware - Verificando acceso ADMIN...');
    
    try {
      const { data: userData } = await supabase
        .from('Users')
        .select('rol')
        .eq('id', user.id)
        .single();
      
      const userRole = userData?.rol;
      console.log('🔍 Middleware - Rol verificado:', userRole);
      
      if (userRole !== 'admin' && userRole !== 'empleado') {
        console.log(`🚨 Middleware - ACCESO DENEGADO a ruta admin. Rol: ${userRole}`);
        return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
      }
    } catch (error) {
      console.error('❌ Middleware - Error al verificar rol:', error);
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  // 🔄 REDIRECCIÓN SI YA ESTÁ LOGUEADO
  if (user && isPublicRoute && pathname !== '/') {
    // Excluir páginas del proceso de registro
    if (pathname !== '/bienvenido' && pathname !== '/registro-pendiente') {
      console.log(`🔄 Middleware - Usuario logueado en ruta pública (${pathname}). Redirigiendo a dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // ✅ REDIRECCIÓN INTELIGENTE DESDE /dashboard
  if (user && pathname === '/dashboard') {
    try {
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
    } catch (error) {
      console.error('❌ Middleware - Error al obtener rol para redirección:', error);
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  console.log('✅ Middleware - Acceso permitido');
  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/registro/:path*',
    '/bienvenido',
    '/registro-pendiente',
    '/dashboard/:path*', // Protege /dashboard y TODAS sus sub-rutas
  ],
};