import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    console.log('📊 [API-EXERCISES-ANALYTICS] Fetching exercise analytics...');

    // 1. Total de ejercicios
    const { count: totalExercises } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 2. Distribución por grupo muscular
    const { data: muscleGroupData } = await supabase
      .from('exercises')
      .select(`
        muscle_group_id,
        muscle_group:muscle_groups(name)
      `)
      .eq('is_active', true);

    const muscleGroupDistribution = muscleGroupData?.reduce((acc: any, ex) => {
      const groupName = ex.muscle_group?.name || 'Sin grupo';
      acc[groupName] = (acc[groupName] || 0) + 1;
      return acc;
    }, {}) || {};

    // 3. Distribución por tipo
    const { data: typeData } = await supabase
      .from('exercises')
      .select('type')
      .eq('is_active', true);

    const typeDistribution = typeData?.reduce((acc: any, ex) => {
      const type = ex.type || 'Sin tipo';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    // 4. Distribución por nivel
    const { data: levelData } = await supabase
      .from('exercises')
      .select('level')
      .eq('is_active', true);

    const levelDistribution = levelData?.reduce((acc: any, ex) => {
      const level = ex.level || 'Sin nivel';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}) || {};

    // 5. Estadísticas de multimedia
    const { count: withVideo } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('video_url', 'is', null);

    const { count: withImage } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('image_url', 'is', null);

    // 6. Uso en rutinas (ejercicios más usados)
    const { data: routineUsage } = await supabase
      .from('routine_exercises')
      .select(`
        exercise_id,
        exercise:exercises(name)
      `);

    const exerciseUsageCount = routineUsage?.reduce((acc: any, re) => {
      const exerciseId = re.exercise_id;
      const exerciseName = re.exercise?.name || 'Desconocido';
      if (!acc[exerciseId]) {
        acc[exerciseId] = { name: exerciseName, count: 0 };
      }
      acc[exerciseId].count += 1;
      return acc;
    }, {}) || {};

    const topUsedExercises = Object.entries(exerciseUsageCount)
      .map(([id, data]: [string, any]) => ({
        exercise_id: id,
        name: data.name,
        usage_count: data.count
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // 7. Ejercicios sin uso
    const { data: allExercises } = await supabase
      .from('exercises')
      .select('id, name')
      .eq('is_active', true);

    const usedExerciseIds = new Set(Object.keys(exerciseUsageCount));
    const unusedExercises = allExercises?.filter(ex => !usedExerciseIds.has(ex.id)) || [];

    console.log('✅ [API-EXERCISES-ANALYTICS] Analytics calculated successfully');

    return NextResponse.json({
      totalExercises: totalExercises || 0,
      muscleGroupDistribution,
      typeDistribution,
      levelDistribution,
      multimediaStats: {
        withVideo: withVideo || 0,
        withImage: withImage || 0,
        withoutVideo: (totalExercises || 0) - (withVideo || 0),
        withoutImage: (totalExercises || 0) - (withImage || 0),
        withBoth: 0 // Se puede calcular con una query adicional si es necesario
      },
      topUsedExercises,
      unusedExercisesCount: unusedExercises.length,
      unusedExercises: unusedExercises.slice(0, 5) // Primeros 5 sin uso
    });

  } catch (error) {
    console.error('❌ [API-EXERCISES-ANALYTICS] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics de ejercicios' },
      { status: 500 }
    );
  }
}
