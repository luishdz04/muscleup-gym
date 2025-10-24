import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [API] Error fetching muscle groups:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ [API-MUSCLE-GROUPS] ${data?.length || 0} groups fetched`);
    return NextResponse.json({ muscleGroups: data || [] });

  } catch (error) {
    console.error('❌ [API] Error in muscle groups GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}