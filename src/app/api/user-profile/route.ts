import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Obtener userId del query string
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Se requiere el ID de usuario' },
        { status: 400 }
      );
    }
    
    console.log("API: Buscando usuario con ID:", userId);
    
    // Usar el cliente admin que ignora RLS
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: userProfile, error } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('API: Error al obtener perfil de usuario:', error);
      return NextResponse.json(
        { message: 'Error al obtener datos del usuario: ' + error.message },
        { status: 500 }
      );
    }
    
    if (!userProfile) {
      console.log('API: Usuario no encontrado');
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('API: Usuario encontrado:', userProfile.email);
    
    // Ocultar campos sensibles
    if (userProfile.password) {
      delete userProfile.password;
    }
    
    return NextResponse.json(userProfile);
    
  } catch (error: any) {
    console.error('API: Error interno:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    );
  }
}