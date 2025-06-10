import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Verificar si el usuario está autenticado
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Log para debugging (quitar en producción)
  console.log('Middleware - Path:', request.nextUrl.pathname);
  console.log('Middleware - Session:', session ? 'Existe' : 'No existe');

  // Rutas públicas (accesibles sin autenticación)
  const publicRoutes = ['/', '/login', '/reset-password', '/registro', '/registro/paso1', '/registro/paso2'];
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  );

  // Rutas de activos estáticos (siempre accesibles)
  const staticRoutes = ['/api', '/_next', '/favicon.ico', '/logo.png', '/default-avatar.png'];
  const isStaticRoute = staticRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Si es una ruta estática, permitir acceso
  if (isStaticRoute) {
    return response;
  }

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    console.log('Middleware - Redirigiendo a login (sin sesión)');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay sesión y la ruta es pública (como login), redirigir al dashboard
  if (session && isPublicRoute && request.nextUrl.pathname !== '/') {
    console.log('Middleware - Redirigiendo a dashboard (ruta pública con sesión)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si el usuario está autenticado y accede a /dashboard, redirigirlo según su rol
  if (session && request.nextUrl.pathname === '/dashboard') {
    try {
      // Obtener rol de usuario desde Supabase
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('rol')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        console.error('Middleware - Error al obtener rol:', userError);
        // En caso de error, redirigir a cliente por defecto
        return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
      }
      
      console.log('Middleware - Rol de usuario:', userData?.rol);
      
      // Redirigir según el rol
      switch (userData?.rol) {
        case 'admin':
          return NextResponse.redirect(new URL('/dashboard/admin/usuarios', request.url));
        case 'empleado':
          return NextResponse.redirect(new URL('/dashboard/admin/usuarios', request.url));
        case 'cliente':
        default:
          return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
      }
    } catch (error) {
      console.error('Middleware - Error general:', error);
      // En caso de error, redirigir a cliente por defecto
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)',
  ],
};