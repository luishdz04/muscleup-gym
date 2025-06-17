import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { userId, template } = await req.json();
  
  if (!userId || !template) {
    return NextResponse.json({ 
      success: false, 
      error: 'Se requiere userId y template' 
    }, { status: 400 });
  }

  try {
    // Verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }
    
    // Verificar si ya existe una plantilla para este usuario
    const { data: existingTemplate } = await supabase
      .from('fingerprint_templates')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    let result;
    
    if (existingTemplate) {
      // Actualizar plantilla existente
      result = await supabase
        .from('fingerprint_templates')
        .update({ 
          template,
          enrolled_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id);
    } else {
      // Crear nueva plantilla
      result = await supabase
        .from('fingerprint_templates')
        .insert({ 
          user_id: userId, 
          template,
          enrolled_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Error al guardar plantilla:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error.message 
      }, { status: 500 });
    }
    
    // Actualizar campo fingerprint en la tabla Users
    const { error: updateError } = await supabase
      .from('Users')
      .update({ fingerprint: true })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error al actualizar usuario:', updateError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Huella guardada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al guardar huella:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error al guardar huella' 
    }, { status: 500 });
  }
}