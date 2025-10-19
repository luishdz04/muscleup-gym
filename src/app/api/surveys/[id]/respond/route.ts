import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST - Enviar respuestas a una encuesta
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📊 [SURVEY-RESPOND] POST API called');

  try {
    const params = await context.params;
    const surveyId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la encuesta existe y está activa
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });
    }

    if (!survey.is_active) {
      return NextResponse.json({ error: 'Esta encuesta no está activa' }, { status: 400 });
    }

    // Verificar si está en el período válido
    const now = new Date();
    const startDate = new Date(survey.start_date);
    const endDate = new Date(survey.end_date);

    if (now < startDate || now > endDate) {
      return NextResponse.json({ error: 'Esta encuesta no está disponible en este momento' }, { status: 400 });
    }

    // Verificar si el usuario ya respondió
    const { data: existingResponses, error: countError } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('user_id', user.id);

    if (countError) {
      console.error('❌ [SURVEY-RESPOND] Error checking responses:', countError);
    }

    const responseCount = existingResponses?.length || 0;
    const maxResponses = survey.max_responses_per_user || 1;

    if (responseCount >= maxResponses) {
      return NextResponse.json(
        { error: 'Ya has respondido esta encuesta el número máximo de veces permitido' },
        { status: 400 }
      );
    }

    // Obtener las respuestas del body
    const body = await request.json();
    const { responses } = body; // Array de { question_id, answer_text?, answer_option? }

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: 'Formato de respuestas inválido' }, { status: 400 });
    }

    // Validar que se respondieron todas las preguntas requeridas
    const requiredQuestions = survey.survey_questions.filter((q: any) => q.is_required);
    const answeredQuestionIds = responses.map((r: any) => r.question_id);

    for (const requiredQ of requiredQuestions) {
      if (!answeredQuestionIds.includes(requiredQ.id)) {
        return NextResponse.json(
          { error: `La pregunta "${requiredQ.question_text}" es requerida` },
          { status: 400 }
        );
      }
    }

    // Insertar todas las respuestas
    const responsesToInsert = responses.map((r: any) => ({
      survey_id: surveyId,
      user_id: user.id,
      question_id: r.question_id,
      answer_text: r.answer_text || null,
      answer_option: r.answer_option || null
    }));

    const { data, error } = await supabase
      .from('survey_responses')
      .insert(responsesToInsert)
      .select();

    if (error) {
      console.error('❌ [SURVEY-RESPOND] Error saving responses:', error);
      return NextResponse.json({ error: 'Error al guardar respuestas' }, { status: 500 });
    }

    console.log(`✅ [SURVEY-RESPOND] Saved ${data?.length} responses for user ${user.id}`);
    return NextResponse.json({ message: 'Respuestas guardadas exitosamente', count: data?.length });

  } catch (error) {
    console.error('❌ [SURVEY-RESPOND] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET - Verificar si el usuario ya respondió esta encuesta
export async function GET(
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

    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ [SURVEY-RESPOND] Error checking:', error);
      return NextResponse.json({ error: 'Error al verificar' }, { status: 500 });
    }

    return NextResponse.json({
      hasResponded: (responses?.length || 0) > 0,
      responseCount: responses?.length || 0
    });

  } catch (error) {
    console.error('❌ [SURVEY-RESPOND] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
