import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// PUT - Actualizar anuncio (solo admin/empleado)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📢 [ANNOUNCEMENTS] PUT API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol (admin/empleado)
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins y empleados pueden actualizar anuncios.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, type, priority, is_active, start_date, end_date } = body;

    // Validaciones
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título y mensaje son requeridos' },
        { status: 400 }
      );
    }

    console.log('📝 [ANNOUNCEMENTS] Updating announcement:', id);

    const { data, error } = await supabase
      .from('client_announcements')
      .update({
        title,
        message,
        type,
        priority,
        is_active,
        start_date: start_date || null,
        end_date: end_date || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [ANNOUNCEMENTS] Error updating:', error);
      return NextResponse.json(
        { error: 'Error al actualizar anuncio' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [ANNOUNCEMENTS] Announcement updated successfully');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar anuncio (solo admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📢 [ANNOUNCEMENTS] DELETE API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol (solo admin puede eliminar)
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || userData.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar anuncios.' },
        { status: 403 }
      );
    }

    console.log('🗑️ [ANNOUNCEMENTS] Deleting announcement:', id);

    const { error } = await supabase
      .from('client_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [ANNOUNCEMENTS] Error deleting:', error);
      return NextResponse.json(
        { error: 'Error al eliminar anuncio' },
        { status: 500 }
      );
    }

    console.log('✅ [ANNOUNCEMENTS] Announcement deleted successfully');
    return NextResponse.json({ message: 'Anuncio eliminado correctamente' });

  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener un anuncio específico (admin/empleado)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📢 [ANNOUNCEMENTS] GET single API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('client_announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [ANNOUNCEMENTS] Error fetching:', error);
      return NextResponse.json(
        { error: 'Error al obtener anuncio' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
