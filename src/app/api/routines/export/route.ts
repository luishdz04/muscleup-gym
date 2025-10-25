import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters } = body;

    const supabase = createServerSupabaseClient();

    // Obtener todas las rutinas con ejercicios
    let query = supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises(
          id,
          order_index,
          sets,
          reps,
          rest_seconds,
          notes,
          exercise:exercises(name, type, level, material)
        )
      `)
      .order('created_at', { ascending: false });

    const { data: routines, error } = await query;

    if (error) throw error;

    let filteredRoutines = routines || [];

    // Aplicar filtros
    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredRoutines = filteredRoutines.filter(r =>
          r.name.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search)
        );
      }

      if (filters.level && filters.level !== 'all') {
        filteredRoutines = filteredRoutines.filter(r => r.difficulty_level === filters.level);
      }

      if (filters.type && filters.type !== 'all') {
        if (filters.type === 'general') {
          filteredRoutines = filteredRoutines.filter(r => r.is_public);
        } else if (filters.type === 'personalizada') {
          filteredRoutines = filteredRoutines.filter(r => !r.is_public);
        }
      }

      if (filters.duration) {
        const [min, max] = filters.duration.split('-').map(Number);
        filteredRoutines = filteredRoutines.filter(r => {
          if (!r.estimated_duration) return false;
          if (max) {
            return r.estimated_duration >= min && r.estimated_duration <= max;
          }
          return r.estimated_duration >= min;
        });
      }
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MuscleUp Gym';
    workbook.created = new Date();

    // ===== HOJA 1: RESUMEN =====
    const summarySheet = workbook.addWorksheet('Resumen');

    summarySheet.columns = [
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Nivel', key: 'level', width: 15 },
      { header: 'Duración (min)', key: 'duration', width: 15 },
      { header: 'Ejercicios', key: 'exercises_count', width: 12 },
      { header: 'Enfoque Muscular', key: 'muscle_focus', width: 25 },
      { header: 'Descripción', key: 'description', width: 50 }
    ];

    filteredRoutines.forEach(routine => {
      summarySheet.addRow({
        name: routine.name,
        type: routine.is_public ? 'General' : 'Personalizada',
        level: routine.difficulty_level || 'N/A',
        duration: routine.estimated_duration || 'N/A',
        exercises_count: routine.routine_exercises?.length || 0,
        muscle_focus: routine.muscle_group_focus || 'N/A',
        description: routine.description || 'Sin descripción'
      });
    });

    // Estilo del header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC00' }
    };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // ===== HOJA 2: DETALLES COMPLETOS =====
    const detailsSheet = workbook.addWorksheet('Detalles Completos');

    detailsSheet.columns = [
      { header: 'Rutina', key: 'routine_name', width: 30 },
      { header: 'Ejercicio', key: 'exercise_name', width: 35 },
      { header: 'Orden', key: 'order', width: 8 },
      { header: 'Sets', key: 'sets', width: 8 },
      { header: 'Reps', key: 'reps', width: 12 },
      { header: 'Descanso (s)', key: 'rest', width: 12 },
      { header: 'Tipo', key: 'exercise_type', width: 15 },
      { header: 'Nivel', key: 'exercise_level', width: 15 },
      { header: 'Material', key: 'material', width: 25 },
      { header: 'Notas', key: 'notes', width: 40 }
    ];

    filteredRoutines.forEach(routine => {
      const exercises = routine.routine_exercises || [];
      exercises.forEach((re: any) => {
        detailsSheet.addRow({
          routine_name: routine.name,
          exercise_name: re.exercise?.name || 'Ejercicio desconocido',
          order: re.order_index + 1,
          sets: re.sets,
          reps: re.reps,
          rest: re.rest_seconds,
          exercise_type: re.exercise?.type || 'N/A',
          exercise_level: re.exercise?.level || 'N/A',
          material: re.exercise?.material || 'N/A',
          notes: re.notes || ''
        });
      });
    });

    // Estilo del header
    detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC00' }
    };
    detailsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // ===== HOJA 3: ESTADÍSTICAS =====
    const statsSheet = workbook.addWorksheet('Estadísticas');

    statsSheet.columns = [
      { header: 'Categoría', key: 'category', width: 30 },
      { header: 'Valor', key: 'value', width: 20 }
    ];

    const generalCount = filteredRoutines.filter(r => r.is_public).length;
    const personalizedCount = filteredRoutines.filter(r => !r.is_public).length;

    const levelStats = filteredRoutines.reduce((acc: Record<string, number>, r) => {
      const level = r.difficulty_level || 'Sin nivel';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const totalExercises = filteredRoutines.reduce((sum, r) => sum + (r.routine_exercises?.length || 0), 0);
    const avgExercises = filteredRoutines.length > 0 ? Math.round(totalExercises / filteredRoutines.length) : 0;

    statsSheet.addRow({ category: 'Total de Rutinas', value: filteredRoutines.length });
    statsSheet.addRow({ category: 'Rutinas Generales', value: generalCount });
    statsSheet.addRow({ category: 'Rutinas Personalizadas', value: personalizedCount });
    statsSheet.addRow({ category: '', value: '' }); // Separator

    Object.entries(levelStats).forEach(([level, count]) => {
      statsSheet.addRow({ category: `Nivel ${level}`, value: count });
    });

    statsSheet.addRow({ category: '', value: '' }); // Separator
    statsSheet.addRow({ category: 'Total de Ejercicios', value: totalExercises });
    statsSheet.addRow({ category: 'Promedio Ejercicios/Rutina', value: avgExercises });

    // Estilo del header
    statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC00' }
    };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const timestamp = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rutinas-${timestamp}.xlsx"`
      }
    });
  } catch (error) {
    console.error('❌ Error exporting routines to Excel:', error);
    return NextResponse.json(
      { error: 'Error al exportar rutinas a Excel' },
      { status: 500 }
    );
  }
}
