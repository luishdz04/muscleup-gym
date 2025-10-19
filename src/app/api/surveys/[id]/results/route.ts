import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol (admin o empleado)
    const userMetadata = user.user_metadata;
    const userRole = userMetadata?.role || userMetadata?.rol;
    if (!['admin', 'empleado'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: surveyId } = params;

    // Obtener todas las preguntas de la encuesta
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('❌ [SURVEY-RESULTS] Error fetching questions:', questionsError);
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener todas las respuestas de la encuesta
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (responsesError) {
      console.error('❌ [SURVEY-RESULTS] Error fetching responses:', responsesError);
      return NextResponse.json({ error: responsesError.message }, { status: 500 });
    }

    // Procesar resultados por pregunta
    const results = questions.map((question) => {
      const questionResponses = responses?.filter(r => r.question_id === question.id) || [];

      const stats: any = {
        question,
        totalResponses: questionResponses.length,
        answerDistribution: {},
        textAnswers: []
      };

      if (question.question_type === 'text') {
        // Para preguntas de texto, recopilar todas las respuestas
        stats.textAnswers = questionResponses
          .map(r => r.answer_text)
          .filter(text => text && text.trim());
      } else {
        // Para preguntas con opciones, contar distribución
        const distribution: { [key: string]: number } = {};

        questionResponses.forEach(response => {
          const answer = response.answer_option || response.answer_text || '';
          if (answer) {
            distribution[answer] = (distribution[answer] || 0) + 1;
          }
        });

        stats.answerDistribution = distribution;
      }

      return stats;
    });

    console.log('✅ [SURVEY-RESULTS] Results processed for survey:', surveyId);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [SURVEY-RESULTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error al obtener resultados' },
      { status: 500 }
    );
  }
}
