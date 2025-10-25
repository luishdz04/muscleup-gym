import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Total de rutinas
    const { count: totalRoutines } = await supabase
      .from('workout_routines')
      .select('*', { count: 'exact', head: true });

    // 2. Total rutinas generales vs personalizadas
    const { data: allRoutines } = await supabase
      .from('workout_routines')
      .select('id, is_public, difficulty_level, estimated_duration, routine_exercises(id)');

    const generalCount = allRoutines?.filter(r => r.is_public).length || 0;
    const personalizedCount = allRoutines?.filter(r => !r.is_public).length || 0;

    // 3. Distribución por nivel de dificultad
    const levelDistribution = (allRoutines || []).reduce((acc: Record<string, number>, routine) => {
      const level = routine.difficulty_level || 'Sin nivel';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // 4. Distribución por duración
    const durationRanges = {
      '0-30 min': 0,
      '31-60 min': 0,
      '61-90 min': 0,
      '91+ min': 0,
      'Sin duración': 0
    };

    (allRoutines || []).forEach(routine => {
      const duration = routine.estimated_duration;
      if (!duration || duration === 0) {
        durationRanges['Sin duración']++;
      } else if (duration <= 30) {
        durationRanges['0-30 min']++;
      } else if (duration <= 60) {
        durationRanges['31-60 min']++;
      } else if (duration <= 90) {
        durationRanges['61-90 min']++;
      } else {
        durationRanges['91+ min']++;
      }
    });

    // 5. Promedio de ejercicios por rutina
    const totalExercises = (allRoutines || []).reduce((sum, routine) => {
      return sum + (routine.routine_exercises?.length || 0);
    }, 0);
    const avgExercisesPerRoutine = totalRoutines ? Math.round(totalExercises / totalRoutines) : 0;

    // 6. Rutinas más asignadas (top 10)
    const { data: assignmentCounts } = await supabase
      .from('user_routines')
      .select('routine_id, workout_routines(name)');

    const routineUsage = (assignmentCounts || []).reduce((acc: Record<string, { name: string; count: number }>, assignment) => {
      const routineId = assignment.routine_id;
      const routineName = (assignment.workout_routines as any)?.name || 'Rutina Desconocida';

      if (!acc[routineId]) {
        acc[routineId] = { name: routineName, count: 0 };
      }
      acc[routineId].count++;
      return acc;
    }, {});

    const topUsedRoutines = Object.values(routineUsage)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(r => ({ name: r.name, usage_count: r.count }));

    // 7. Rutinas sin asignar
    const assignedRoutineIds = new Set((assignmentCounts || []).map(a => a.routine_id));
    const unusedRoutines = (allRoutines || [])
      .filter(r => !assignedRoutineIds.has(r.id))
      .map(r => ({ id: r.id }));

    // 8. Total de asignaciones activas
    const { count: activeAssignments } = await supabase
      .from('user_routines')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      totalRoutines: totalRoutines || 0,
      generalCount,
      personalizedCount,
      levelDistribution,
      durationDistribution: durationRanges,
      avgExercisesPerRoutine,
      topUsedRoutines,
      unusedRoutinesCount: unusedRoutines.length,
      unusedRoutines,
      activeAssignments: activeAssignments || 0,
      totalExercisesInRoutines: totalExercises
    });
  } catch (error) {
    console.error('❌ Error fetching routine analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics de rutinas' },
      { status: 500 }
    );
  }
}
