import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener encuesta individual con preguntas
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📊 [SURVEYS] GET single API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get survey with questions
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('❌ [SURVEYS] Error fetching questions:', questionsError);
    }

    return NextResponse.json({
      ...survey,
      questions: questions || []
    });

  } catch (error) {
    console.error('❌ [SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar encuesta (solo admin/empleado)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📊 [SURVEYS] PUT API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, start_date, end_date, is_active, max_responses_per_user } = body;

    const { data, error } = await supabase
      .from('surveys')
      .update({
        title,
        description,
        start_date,
        end_date,
        is_active,
        max_responses_per_user
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [SURVEYS] Error updating:', error);
      return NextResponse.json({ error: 'Error al actualizar encuesta' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar encuesta (solo admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📊 [SURVEYS] DELETE API called');

  try {
    const params = await context.params;
    const id = params.id;
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admin puede eliminar
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || userData.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Solo administradores.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [SURVEYS] Error deleting:', error);
      return NextResponse.json({ error: 'Error al eliminar encuesta' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Encuesta eliminada correctamente' });

  } catch (error) {
    console.error('❌ [SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
