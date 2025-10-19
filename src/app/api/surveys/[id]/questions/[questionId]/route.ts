import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
    questionId: string;
  };
}

export async function DELETE(
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

    const { id: surveyId, questionId } = params;

    // Eliminar la pregunta
    const { error: deleteError } = await supabase
      .from('survey_questions')
      .delete()
      .eq('id', questionId)
      .eq('survey_id', surveyId);

    if (deleteError) {
      console.error('❌ [DELETE-QUESTION] Error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ [DELETE-QUESTION] Question deleted:', questionId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [DELETE-QUESTION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar pregunta' },
      { status: 500 }
    );
  }
}
