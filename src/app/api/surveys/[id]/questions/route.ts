import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener preguntas de una encuesta
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const surveyId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: questions, error } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order', { ascending: true });

    if (error) {
      console.error('❌ [SURVEY-QUESTIONS] Error fetching:', error);
      return NextResponse.json({ error: 'Error al obtener preguntas' }, { status: 500 });
    }

    return NextResponse.json(questions || []);

  } catch (error) {
    console.error('❌ [SURVEY-QUESTIONS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear pregunta (solo admin/empleado)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const surveyId = params.id;
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
    const { question_text, question_type, options, is_required, question_order } = body;

    const { data, error } = await supabase
      .from('survey_questions')
      .insert([{
        survey_id: surveyId,
        question_text,
        question_type,
        options: options || null,
        is_required: is_required || false,
        question_order: question_order || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ [SURVEY-QUESTIONS] Error creating:', error);
      return NextResponse.json({ error: 'Error al crear pregunta' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [SURVEY-QUESTIONS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
