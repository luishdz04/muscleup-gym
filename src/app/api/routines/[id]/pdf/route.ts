import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import jsPDF from 'jspdf';
import { getGymSettings, getGymEmail } from '@/lib/gymSettings';

// 🎨 COLORES CORPORATIVOS ENTERPRISE
const COLORS = {
  BLACK: [0, 0, 0] as const,
  WHITE: [255, 255, 255] as const,
  GOLD: [255, 204, 0] as const,
  DARK_GRAY: [30, 30, 30] as const,
  LIGHT_GRAY: [150, 150, 150] as const,
  VERY_LIGHT_GRAY: [200, 200, 200] as const,
  SUCCESS_GREEN: [76, 175, 80] as const,
  INFO_BLUE: [56, 189, 248] as const,
  WARNING_ORANGE: [255, 152, 0] as const,
  ERROR_RED: [244, 67, 54] as const
};

// 📏 CONSTANTES DE LAYOUT PROFESIONAL
const LAYOUT = {
  PAGE_WIDTH: 215.9,
  PAGE_HEIGHT: 279.4,
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  MARGIN_TOP: 20,
  MARGIN_BOTTOM: 35,
  CONTENT_WIDTH: 185.9,
  FOOTER_Y: 245,
  SECTION_SPACING: 12,
  ROW_HEIGHT: 7,
  HEADER_HEIGHT: 12,
  TABLE_ROW_HEIGHT: 6
};

function safeValue(value: any, defaultValue: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value).trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routineId } = await params;
    console.log('📄 Generando PDF enterprise para rutina:', routineId);

    const supabase = supabaseAdmin;
    const gymSettings = await getGymSettings();

    // Obtener rutina completa con ejercicios
    const { data: routine, error } = await supabase
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
          exercise:exercises(
            name,
            type,
            level,
            material,
            primary_muscles,
            secondary_muscles,
            initial_position,
            execution_eccentric,
            execution_concentric
          )
        )
      `)
      .eq('id', routineId)
      .single();

    if (error || !routine) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // 🎨 CREAR PDF CON FONDO NEGRO PROFESIONAL
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // 🖤 FONDO NEGRO EN TODAS LAS PÁGINAS
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');

    let yPosition = LAYOUT.MARGIN_TOP;

    // ===== HEADER ENTERPRISE CON LOGO =====
    // Intentar cargar el logo
    try {
      const logoUrl = `${request.nextUrl.origin}/logo.png`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        const base64Logo = Buffer.from(logoBuffer).toString('base64');

        const logoX = LAYOUT.MARGIN_LEFT;
        const logoY = yPosition;
        const logoWidth = 45;
        const logoHeight = 25;

        doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }
    } catch (logoError) {
      console.error('⚠️ [ROUTINE-PDF] Error al cargar logo:', logoError);
    }

    // Información corporativa
    const infoX = LAYOUT.MARGIN_LEFT + 55;
    doc.setTextColor(...COLORS.LIGHT_GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Centro de Acondicionamiento Físico Profesional', infoX, yPosition + 12);
    doc.text('Tu salud y bienestar son nuestra misión', infoX, yPosition + 18);

    yPosition += 35;

    // Título principal con fondo dorado
    doc.setFillColor(...COLORS.GOLD);
    doc.rect(LAYOUT.MARGIN_LEFT, yPosition, LAYOUT.CONTENT_WIDTH, 12, 'F');

    doc.setTextColor(...COLORS.BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RUTINA DE ENTRENAMIENTO PROFESIONAL', LAYOUT.PAGE_WIDTH / 2, yPosition + 8, { align: 'center' });

    yPosition += 20;

    // Línea decorativa dorada
    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1.5);
    doc.line(LAYOUT.MARGIN_LEFT, yPosition, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, yPosition);

    yPosition += 10;

    // ===== INFORMACIÓN DE LA RUTINA =====
    // Crear sección header con fondo oscuro
    const createSectionHeader = (title: string, y: number): number => {
      doc.setFillColor(...COLORS.DARK_GRAY);
      doc.rect(LAYOUT.MARGIN_LEFT, y - 3, LAYOUT.CONTENT_WIDTH, LAYOUT.HEADER_HEIGHT, 'F');

      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, LAYOUT.MARGIN_LEFT + 5, y + 4);

      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(0.5);
      doc.line(LAYOUT.MARGIN_LEFT + 5, y + 6, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, y + 6);

      return y + LAYOUT.HEADER_HEIGHT + 5;
    };

    yPosition = createSectionHeader('INFORMACIÓN DE LA RUTINA', yPosition);

    // Caja de información con fondo gris oscuro
    const infoBoxY = yPosition;
    doc.setFillColor(20, 20, 20);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, infoBoxY, LAYOUT.CONTENT_WIDTH - 10, 45, 'F');

    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, infoBoxY, LAYOUT.CONTENT_WIDTH - 10, 45);

    yPosition = infoBoxY + 8;

    // Título de la rutina
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(routine.name, LAYOUT.MARGIN_LEFT + 10, yPosition);

    // Tipo de rutina (badge)
    yPosition += 7;
    const routineType = routine.is_public ? 'RUTINA GENERAL' : 'RUTINA PERSONALIZADA';
    doc.setFillColor(...(routine.is_public ? COLORS.SUCCESS_GREEN : COLORS.WARNING_ORANGE));
    doc.roundedRect(LAYOUT.MARGIN_LEFT + 10, yPosition - 4, 45, 5, 1, 1, 'F');
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(8);
    doc.text(routineType, LAYOUT.MARGIN_LEFT + 12, yPosition - 0.5);

    // Información en 2 columnas
    yPosition += 8;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Nivel:', LAYOUT.MARGIN_LEFT + 10, yPosition);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(routine.difficulty_level || 'N/A', LAYOUT.MARGIN_LEFT + 30, yPosition);

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Duración:', LAYOUT.MARGIN_LEFT + 105, yPosition);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(`${routine.estimated_duration || 0} minutos`, LAYOUT.MARGIN_LEFT + 130, yPosition);

    yPosition += 6;
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Ejercicios:', LAYOUT.MARGIN_LEFT + 10, yPosition);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(`${routine.routine_exercises?.length || 0} ejercicios`, LAYOUT.MARGIN_LEFT + 30, yPosition);

    if (routine.muscle_group_focus) {
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.text('Enfoque:', LAYOUT.MARGIN_LEFT + 105, yPosition);
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'normal');
      doc.text(routine.muscle_group_focus, LAYOUT.MARGIN_LEFT + 130, yPosition);
    }

    // Descripción si existe
    if (routine.description) {
      yPosition += 6;
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción:', LAYOUT.MARGIN_LEFT + 10, yPosition);
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(routine.description, 150);
      yPosition += 4;
      doc.text(descLines, LAYOUT.MARGIN_LEFT + 10, yPosition);
      yPosition += descLines.length * 4;
    }

    yPosition = infoBoxY + 50;
    yPosition += LAYOUT.SECTION_SPACING;

    // ===== TABLA DE EJERCICIOS =====
    // Función para verificar espacio en página
    const checkPageSpace = (currentY: number, requiredSpace: number): number => {
      if (currentY + requiredSpace > LAYOUT.FOOTER_Y - 10) {
        doc.addPage();
        doc.setFillColor(...COLORS.BLACK);
        doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
        return LAYOUT.MARGIN_TOP;
      }
      return currentY;
    };

    yPosition = checkPageSpace(yPosition, 60);
    yPosition = createSectionHeader('EJERCICIOS DE LA RUTINA', yPosition);

    // Header de tabla con fondo dorado
    doc.setFillColor(...COLORS.GOLD);
    doc.rect(LAYOUT.MARGIN_LEFT, yPosition, LAYOUT.CONTENT_WIDTH, LAYOUT.TABLE_ROW_HEIGHT, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.BLACK);
    doc.setFont('helvetica', 'bold');
    doc.text('#', LAYOUT.MARGIN_LEFT + 2, yPosition + 4.5);
    doc.text('EJERCICIO', LAYOUT.MARGIN_LEFT + 10, yPosition + 4.5);
    doc.text('SETS', LAYOUT.MARGIN_LEFT + 95, yPosition + 4.5);
    doc.text('REPS', LAYOUT.MARGIN_LEFT + 115, yPosition + 4.5);
    doc.text('DESCANSO', LAYOUT.MARGIN_LEFT + 135, yPosition + 4.5);
    doc.text('TIPO', LAYOUT.MARGIN_LEFT + 165, yPosition + 4.5);

    yPosition += LAYOUT.TABLE_ROW_HEIGHT;

    // Ejercicios
    const exercises = (routine.routine_exercises || []).sort((a: any, b: any) => a.order_index - b.order_index);

    exercises.forEach((re: any, index: number) => {
      // Verificar si necesitamos nueva página
      yPosition = checkPageSpace(yPosition, LAYOUT.TABLE_ROW_HEIGHT + 2);

      // Fila alternada con fondo oscuro
      if (index % 2 === 0) {
        doc.setFillColor(20, 20, 20);
        doc.rect(LAYOUT.MARGIN_LEFT, yPosition, LAYOUT.CONTENT_WIDTH, 7, 'F');
      }

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'normal');

      // Orden
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.GOLD);
      doc.text(`${index + 1}`, LAYOUT.MARGIN_LEFT + 2, yPosition + 4.5);

      // Nombre del ejercicio
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.WHITE);
      const exerciseName = re.exercise?.name || 'Ejercicio desconocido';
      const nameLines = doc.splitTextToSize(exerciseName, 75);
      doc.text(nameLines[0] + (nameLines.length > 1 ? '...' : ''), LAYOUT.MARGIN_LEFT + 10, yPosition + 4.5);

      // Sets
      doc.setFont('helvetica', 'normal');
      doc.text(`${re.sets}`, LAYOUT.MARGIN_LEFT + 98, yPosition + 4.5);

      // Reps
      doc.text(re.reps, LAYOUT.MARGIN_LEFT + 117, yPosition + 4.5);

      // Descanso
      doc.text(`${re.rest_seconds}s`, LAYOUT.MARGIN_LEFT + 138, yPosition + 4.5);

      // Tipo
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.VERY_LIGHT_GRAY);
      doc.text(re.exercise?.type || 'N/A', LAYOUT.MARGIN_LEFT + 165, yPosition + 4.5);

      yPosition += 7;

      // Notas si existen
      if (re.notes) {
        yPosition = checkPageSpace(yPosition, 10);
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.LIGHT_GRAY);
        doc.setFont('helvetica', 'italic');
        const notesLines = doc.splitTextToSize(`Nota: ${re.notes}`, 160);
        doc.text(notesLines, LAYOUT.MARGIN_LEFT + 10, yPosition);
        yPosition += notesLines.length * 3 + 4;
      }
    });

    // ===== CONSEJOS PROFESIONALES =====
    yPosition += 5;
    yPosition = checkPageSpace(yPosition, 40);

    yPosition = createSectionHeader('CONSEJOS PROFESIONALES', yPosition);

    // Caja de consejos con fondo oscuro y borde dorado
    const tipsBoxY = yPosition;
    doc.setFillColor(25, 25, 25);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, tipsBoxY, LAYOUT.CONTENT_WIDTH - 10, 32, 'F');

    doc.setDrawColor(...COLORS.INFO_BLUE);
    doc.setLineWidth(1);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, tipsBoxY, LAYOUT.CONTENT_WIDTH - 10, 32);

    yPosition = tipsBoxY + 6;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');

    const tips = [
      '• Realiza un calentamiento de 5-10 minutos antes de comenzar la rutina',
      '• Mantén una técnica correcta en cada ejercicio para evitar lesiones',
      '• Hidrátate adecuadamente durante toda la sesión de entrenamiento',
      '• Respeta los tiempos de descanso indicados para cada ejercicio',
      '• Escucha a tu cuerpo y detente si sientes dolor agudo o molestias',
      '• Realiza estiramientos al finalizar la rutina para mejor recuperación'
    ];

    tips.forEach(tip => {
      doc.text(tip, LAYOUT.MARGIN_LEFT + 10, yPosition);
      yPosition += 4.5;
    });

    // ===== FOOTER ENTERPRISE EN TODAS LAS PÁGINAS =====
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Línea separadora dorada
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(1);
      doc.line(LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y);

      // Información corporativa - centrada
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'bold');
      doc.text((gymSettings.gym_name || 'MUSCLEUP GYM').toUpperCase(), LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 6, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${getGymEmail(gymSettings)} | Tel: ${gymSettings.gym_phone || 'N/A'}`, LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 11, { align: 'center' });
      doc.text('Tu salud y bienestar es nuestra misión', LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 16, { align: 'center' });

      // Número de página - derecha
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Página ${i} de ${totalPages}`, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y + 6, { align: 'right' });

      // Fecha de generación - izquierda
      const currentDate = new Date();
      const printDateTime = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(currentDate);
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Generado: ${printDateTime}`, LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y + 16);
    }

    // Generar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const fileName = `rutina-${routine.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('❌ Error generating routine PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF de rutina' },
      { status: 500 }
    );
  }
}
