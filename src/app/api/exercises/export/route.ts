import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { filters } = await request.json();

    console.log('📥 [API-EXERCISES-EXPORT] Starting Excel export with filters:', filters);

    // Construir query con filtros
    let query = supabase
      .from('exercises')
      .select(`
        *,
        muscle_group:muscle_groups(name)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Aplicar filtros si existen
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.muscleGroup && filters.muscleGroup !== 'all') {
      query = query.eq('muscle_group_id', filters.muscleGroup);
    }
    if (filters?.level && filters.level !== 'all') {
      query = query.eq('level', filters.level);
    }
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    const { data: exercises, error } = await query;

    if (error) {
      console.error('❌ [API-EXERCISES-EXPORT] Error fetching exercises:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ [API-EXERCISES-EXPORT] ${exercises?.length || 0} exercises fetched`);

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MuscleUp Gym';
    workbook.created = new Date();

    // Sheet 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Tipo', key: 'type', width: 20 },
      { header: 'Nivel', key: 'level', width: 20 },
      { header: 'Grupo Muscular', key: 'muscle_group', width: 25 },
      { header: 'Material', key: 'material', width: 30 },
      { header: 'Músculos Primarios', key: 'primary_muscles', width: 35 },
      { header: 'Músculos Secundarios', key: 'secondary_muscles', width: 35 }
    ];

    // Estilo de encabezado
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC00' }
    };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    exercises?.forEach((exercise) => {
      summarySheet.addRow({
        name: exercise.name,
        type: exercise.type,
        level: exercise.level,
        muscle_group: exercise.muscle_group?.name || '',
        material: exercise.material,
        primary_muscles: exercise.primary_muscles?.join(', ') || '',
        secondary_muscles: exercise.secondary_muscles?.join(', ') || ''
      });
    });

    // Sheet 2: Detalles Completos
    const detailsSheet = workbook.addWorksheet('Detalles Completos');
    detailsSheet.columns = [
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Tipo', key: 'type', width: 20 },
      { header: 'Nivel', key: 'level', width: 20 },
      { header: 'Grupo Muscular', key: 'muscle_group', width: 25 },
      { header: 'Material', key: 'material', width: 30 },
      { header: 'Posición Inicial', key: 'initial_position', width: 50 },
      { header: 'Fase Excéntrica', key: 'execution_eccentric', width: 50 },
      { header: 'Fase Isométrica', key: 'execution_isometric', width: 50 },
      { header: 'Fase Concéntrica', key: 'execution_concentric', width: 50 },
      { header: 'Errores Comunes', key: 'common_errors', width: 50 },
      { header: 'Contraindicaciones', key: 'contraindications', width: 50 },
      { header: 'URL Video', key: 'video_url', width: 40 },
      { header: 'URL Imagen', key: 'image_url', width: 40 }
    ];

    detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCC00' }
    };
    detailsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    exercises?.forEach((exercise) => {
      detailsSheet.addRow({
        name: exercise.name,
        type: exercise.type,
        level: exercise.level,
        muscle_group: exercise.muscle_group?.name || '',
        material: exercise.material,
        initial_position: exercise.initial_position,
        execution_eccentric: exercise.execution_eccentric,
        execution_isometric: exercise.execution_isometric,
        execution_concentric: exercise.execution_concentric,
        common_errors: exercise.common_errors?.join('\n• ') || '',
        contraindications: exercise.contraindications?.join('\n• ') || '',
        video_url: exercise.video_url || '',
        image_url: exercise.image_url || ''
      });
    });

    // Aplicar word wrap a columnas largas
    detailsSheet.getColumn('initial_position').alignment = { wrapText: true, vertical: 'top' };
    detailsSheet.getColumn('execution_eccentric').alignment = { wrapText: true, vertical: 'top' };
    detailsSheet.getColumn('execution_isometric').alignment = { wrapText: true, vertical: 'top' };
    detailsSheet.getColumn('execution_concentric').alignment = { wrapText: true, vertical: 'top' };
    detailsSheet.getColumn('common_errors').alignment = { wrapText: true, vertical: 'top' };
    detailsSheet.getColumn('contraindications').alignment = { wrapText: true, vertical: 'top' };

    // Sheet 3: Estadísticas
    const statsSheet = workbook.addWorksheet('Estadísticas');

    // Calcular estadísticas
    const typeStats = exercises?.reduce((acc: any, ex) => {
      acc[ex.type] = (acc[ex.type] || 0) + 1;
      return acc;
    }, {});

    const levelStats = exercises?.reduce((acc: any, ex) => {
      acc[ex.level] = (acc[ex.level] || 0) + 1;
      return acc;
    }, {});

    const muscleGroupStats = exercises?.reduce((acc: any, ex) => {
      const group = ex.muscle_group?.name || 'Sin grupo';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    // Título
    statsSheet.mergeCells('A1:B1');
    statsSheet.getCell('A1').value = 'ESTADÍSTICAS DE EJERCICIOS';
    statsSheet.getCell('A1').font = { bold: true, size: 14 };
    statsSheet.getCell('A1').alignment = { horizontal: 'center' };

    // Total
    statsSheet.getCell('A3').value = 'Total de Ejercicios:';
    statsSheet.getCell('B3').value = exercises?.length || 0;
    statsSheet.getCell('A3').font = { bold: true };

    // Por Tipo
    let row = 5;
    statsSheet.getCell(`A${row}`).value = 'Distribución por Tipo';
    statsSheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFCC00' } };
    row++;
    Object.entries(typeStats || {}).forEach(([type, count]) => {
      statsSheet.getCell(`A${row}`).value = type;
      statsSheet.getCell(`B${row}`).value = count;
      row++;
    });

    // Por Nivel
    row += 2;
    statsSheet.getCell(`A${row}`).value = 'Distribución por Nivel';
    statsSheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFCC00' } };
    row++;
    Object.entries(levelStats || {}).forEach(([level, count]) => {
      statsSheet.getCell(`A${row}`).value = level;
      statsSheet.getCell(`B${row}`).value = count;
      row++;
    });

    // Por Grupo Muscular
    row += 2;
    statsSheet.getCell(`A${row}`).value = 'Distribución por Grupo Muscular';
    statsSheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFCC00' } };
    row++;
    Object.entries(muscleGroupStats || {}).forEach(([group, count]) => {
      statsSheet.getCell(`A${row}`).value = group;
      statsSheet.getCell(`B${row}`).value = count;
      row++;
    });

    // Ajustar columnas
    statsSheet.getColumn('A').width = 30;
    statsSheet.getColumn('B').width = 15;

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retornar archivo Excel
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `biblioteca-ejercicios-${timestamp}.xlsx`;

    console.log(`✅ [API-EXERCISES-EXPORT] Excel file generated: ${filename}`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('❌ [API-EXERCISES-EXPORT] Error:', error);
    return NextResponse.json(
      { error: 'Error al exportar ejercicios' },
      { status: 500 }
    );
  }
}
