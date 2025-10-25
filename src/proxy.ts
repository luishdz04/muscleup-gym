import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Función para actualizar la cookie de sesión
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Usar variables de entorno directamente en el middleware (evita problemas con Next.js 15)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Proxy - Missing Supabase credentials');
    return { response, supabase: null };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // ✅ MÉTODO MODERNO: getAll (reemplaza get)
        getAll() {
          return request.cookies.getAll();
        },
        // ✅ MÉTODO MODERNO: setAll (reemplaza set y remove)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
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

export async function proxy(request: NextRequest) {
  const { response, supabase } = await updateSession(request);

  // Si no hay supabase, retornar respuesta sin autenticación
  if (!supabase) {
    return response;
  }

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

  console.log('🛡️ Proxy - Path:', pathname);
  console.log('🛡️ Proxy - User:', user ? `Autenticado (ID: ${user.id})` : 'No autenticado');

  // 🚨 BLOQUEO CRÍTICO: Sin usuario en cualquier ruta protegida
  if (!user && (isProtectedRoute || isAdminRoute)) {
    console.log(`🚨 Proxy - ACCESO DENEGADO a ruta protegida (${pathname}) sin sesión.`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 🔒 VERIFICACIÓN DE ROL PARA RUTAS ADMIN
  if (user && isAdminRoute) {
    console.log('🔍 Proxy - Verificando acceso ADMIN...');
    
    // ✅ LEER ROL DESDE METADATA (más rápido, no requiere query adicional)
    const userRole = user.user_metadata?.role || 'cliente';
    console.log('🔍 Proxy - Rol desde metadata:', userRole);
    
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.log(`🚨 Proxy - ACCESO DENEGADO a ruta admin. Rol: ${userRole}`);
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  // 🔄 REDIRECCIÓN SI YA ESTÁ LOGUEADO
  if (user && isPublicRoute && pathname !== '/') {
    // Excluir páginas del proceso de registro
    if (pathname !== '/bienvenido' && pathname !== '/registro-pendiente') {
      console.log(`🔄 Proxy - Usuario logueado en ruta pública (${pathname}). Redirigiendo a dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // ✅ REDIRECCIÓN INTELIGENTE DESDE /dashboard
  if (user && pathname === '/dashboard') {
    // ✅ LEER ROL DESDE METADATA
    const userRole = user.user_metadata?.role || 'cliente';
    console.log('🎯 Proxy - Redirigiendo según rol:', userRole);
    
    switch (userRole) {
      case 'admin':
      case 'empleado':
        return NextResponse.redirect(new URL('/dashboard/admin/usuarios', request.url));
      case 'cliente':
      default:
        return NextResponse.redirect(new URL('/dashboard/cliente', request.url));
    }
  }

  console.log('✅ Proxy - Acceso permitido');
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