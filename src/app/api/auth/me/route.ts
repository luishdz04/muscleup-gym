import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // ✅ OBTENER USUARIO AUTENTICADO
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ No hay usuario autenticado');
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        user: null
      });
    }
    
    // ✅ OBTENER DATOS ADICIONALES DEL USUARIO DESDE LA TABLA USERS
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('id, firstName, lastName, email, rol')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.warn('⚠️ No se encontraron datos adicionales del usuario en Users table');
      // Usar datos básicos de auth
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.email?.split('@')[0] || 'Usuario'
        }
      });
    }
    
    // ✅ RESPUESTA CON DATOS COMPLETOS
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || user.email,
        rol: userData.rol,
        username: userData.firstName || user.email?.split('@')[0] || 'Usuario'
      }
    });
    
  } catch (error) {
    console.error('💥 Error en API auth/me:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error obteniendo usuario actual',
        user: null
      },
      { status: 500 }
    );
  }
}
