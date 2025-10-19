import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import { getGymSettings, getGymEmail } from '@/lib/gymSettings';
import { formatCurrency } from '@/utils/formHelpers';
import { formatDateForDisplay, formatMexicoTime } from '@/utils/dateUtils';

// 🎨 COLORES CORPORATIVOS ENTERPRISE
const COLORS = {
  BLACK: [0, 0, 0] as const,
  WHITE: [255, 255, 255] as const,
  GOLD: [255, 204, 0] as const,
  DARK_GRAY: [30, 30, 30] as const,
  LIGHT_GRAY: [150, 150, 150] as const,
  SUCCESS_GREEN: [76, 175, 80] as const,
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
  FOOTER_Y: 250,
  SECTION_SPACING: 12,
  ROW_HEIGHT: 7,
  HEADER_HEIGHT: 12,
  TABLE_ROW_HEIGHT: 6
};

// 🛡️ FUNCIÓN HELPER PARA VALORES SEGUROS
function safeValue(value: any, defaultValue: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value).trim();
}

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
    console.log('📊 [CUT-PDF] Iniciando generación de PDF para corte:', params.id);

    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener configuración del gimnasio
    const gymSettings = await getGymSettings();
    console.log('✅ [CUT-PDF] Configuración del gimnasio obtenida');

    // Obtener datos del corte
    const { data: cut, error: cutError } = await supabase
      .from('cash_cuts')
      .select('*, created_by_user:created_by(firstName, lastName), closed_by_user:closed_by(firstName, lastName)')
      .eq('id', params.id)
      .single();

    if (cutError || !cut) {
      console.error('❌ [CUT-PDF] Error al obtener corte:', cutError);
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 });
    }

    console.log('✅ [CUT-PDF] Datos del corte obtenidos');

    // Obtener gastos del día
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, expense_category:expense_categories(name)')
      .eq('expense_date', cut.cut_date)
      .eq('status', 'active')
      .order('amount', { ascending: false });

    // ✅ Obtener transacciones del día usando el endpoint optimizado
    const transactionsUrl = `${request.nextUrl.origin}/api/cuts/transaction-details?date=${cut.cut_date}`;
    const transactionsResponse = await fetch(transactionsUrl);

    let salesTransactions: any[] = [];
    let membershipTransactions: any[] = [];

    if (transactionsResponse.ok) {
      const transactionsData = await transactionsResponse.json();

      if (transactionsData.success) {
        salesTransactions = transactionsData.pos_transactions || [];
        membershipTransactions = transactionsData.membership_transactions || [];

        console.log('✅ [CUT-PDF] Transacciones obtenidas - POS:', salesTransactions.length, 'Membresías:', membershipTransactions.length);
      } else {
        console.error('⚠️ [CUT-PDF] Error en respuesta de transacciones:', transactionsData.error);
      }
    } else {
      console.error('⚠️ [CUT-PDF] Error HTTP obteniendo transacciones:', transactionsResponse.status);
    }

    // 🎨 CREAR PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // 🦶 PIE DE PÁGINA
    const addFooter = (): void => {
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // 📏 LÍNEA SEPARADORA DORADA
        doc.setDrawColor(...COLORS.GOLD);
        doc.setLineWidth(1);
        doc.line(LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y);

        // 🏢 INFORMACIÓN CORPORATIVA
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'bold');
        doc.text(gymSettings.gym_name.toUpperCase(), LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 6, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.LIGHT_GRAY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Email: ${getGymEmail(gymSettings)} | Tel: ${gymSettings.gym_phone}`, LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 11, { align: 'center' });
        doc.text('Tu salud y bienestar es nuestra misión', LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 16, { align: 'center' });

        // 📄 NÚMERO DE PÁGINA
        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y + 6, { align: 'right' });

        // 📅 FECHA DE IMPRESIÓN (Timezone México)
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
        doc.text(`Impreso: ${printDateTime}`, LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y + 16);
      }
    };

    // 🎨 FUNCIÓN PARA CREAR HEADER DE SECCIÓN
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

    // 🎨 FUNCIÓN PARA VERIFICAR ESPACIO EN PÁGINA
    const checkPageSpace = (currentY: number, requiredSpace: number): number => {
      if (currentY + requiredSpace > LAYOUT.FOOTER_Y - 10) {
        doc.addPage();
        doc.setFillColor(...COLORS.BLACK);
        doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
        return LAYOUT.MARGIN_TOP;
      }
      return currentY;
    };

    // 🎨 FUNCIÓN PARA CREAR TABLA
    const createTable = (headers: string[], rows: string[][], startY: number, columnWidths: number[]): number => {
      let currentY = startY;

      // Header de tabla
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, LAYOUT.TABLE_ROW_HEIGHT, 'F');

      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      let xPosition = LAYOUT.MARGIN_LEFT + 2;
      headers.forEach((header, i) => {
        doc.text(header, xPosition, currentY + 4.5);
        xPosition += columnWidths[i];
      });

      currentY += LAYOUT.TABLE_ROW_HEIGHT;

      // Filas de tabla
      rows.forEach((row, rowIndex) => {
        currentY = checkPageSpace(currentY, LAYOUT.TABLE_ROW_HEIGHT);

        // Fondo alternado
        if (rowIndex % 2 === 0) {
          doc.setFillColor(20, 20, 20);
          doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, LAYOUT.TABLE_ROW_HEIGHT, 'F');
        }

        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        xPosition = LAYOUT.MARGIN_LEFT + 2;
        row.forEach((cell, i) => {
          const align = i > 0 ? 'right' : 'left'; // Números alineados a la derecha
          const cellX = align === 'right' ? xPosition + columnWidths[i] - 2 : xPosition;
          doc.text(cell, cellX, currentY + 4.5, { align });
          xPosition += columnWidths[i];
        });

        currentY += LAYOUT.TABLE_ROW_HEIGHT;
      });

      return currentY;
    };

    // 🖤 FONDO NEGRO
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');

    let currentY = LAYOUT.MARGIN_TOP;

    // --- LOGO Y ENCABEZADO ---
    try {
      const logoUrl = `${request.nextUrl.origin}/logo.png`;
      const logoResponse = await fetch(logoUrl);

      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        const base64Logo = Buffer.from(logoBuffer).toString('base64');

        const logoX = LAYOUT.MARGIN_LEFT;
        const logoY = currentY;
        const logoWidth = 45;
        const logoHeight = 25;

        // Sin marco dorado
        doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }
    } catch (logoError) {
      console.error('⚠️ [CUT-PDF] Error al cargar logo:', logoError);
    }

    // 🏢 INFORMACIÓN CORPORATIVA (sin repetir nombre)
    const infoX = LAYOUT.MARGIN_LEFT + 55;
    doc.setTextColor(...COLORS.LIGHT_GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Centro de Acondicionamiento Físico Profesional', infoX, currentY + 12);
    doc.text('Tu salud y bienestar son nuestra misión', infoX, currentY + 18);

    currentY += 35;

    // 🏷️ TÍTULO PRINCIPAL
    doc.setFillColor(...COLORS.GOLD);
    doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, 12, 'F');

    doc.setTextColor(...COLORS.BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CORTE DE CAJA', LAYOUT.PAGE_WIDTH / 2, currentY + 8, { align: 'center' });

    currentY += 20;

    // 📏 LÍNEA DECORATIVA
    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1.5);
    doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);

    currentY += 10;

    // --- INFORMACIÓN DEL CORTE ---
    currentY = createSectionHeader('INFORMACIÓN DEL CORTE', currentY);

    // Info básica en dos columnas
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Número de Corte:', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(safeValue(cut.cut_number), LAYOUT.MARGIN_LEFT + 50, currentY);

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', LAYOUT.PAGE_WIDTH / 2 + 10, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateForDisplay(cut.cut_date), LAYOUT.PAGE_WIDTH / 2 + 30, currentY);

    currentY += 6;

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Hora de Corte:', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    // Usar created_at que es un timestamp completo con timezone
    const cutTimeFormatted = cut.created_at
      ? formatMexicoTime(new Date(cut.created_at))
      : 'N/A';
    doc.text(cutTimeFormatted, LAYOUT.MARGIN_LEFT + 50, currentY);

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', LAYOUT.PAGE_WIDTH / 2 + 10, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(safeValue(cut.status).toUpperCase(), LAYOUT.PAGE_WIDTH / 2 + 30, currentY);

    currentY += 6;

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Responsable:', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    const createdBy = cut.created_by_user
      ? `${cut.created_by_user.firstName} ${cut.created_by_user.lastName}`
      : 'Sistema';
    doc.text(createdBy, LAYOUT.MARGIN_LEFT + 50, currentY);

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', LAYOUT.PAGE_WIDTH / 2 + 10, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(cut.is_manual ? 'MANUAL' : 'AUTOMÁTICO', LAYOUT.PAGE_WIDTH / 2 + 30, currentY);

    currentY += LAYOUT.SECTION_SPACING + 5;

    // --- RESUMEN EJECUTIVO ---
    currentY = checkPageSpace(currentY, 60);
    currentY = createSectionHeader('RESUMEN EJECUTIVO', currentY);

    // Caja de resumen
    const summaryBoxY = currentY;
    doc.setFillColor(20, 20, 20);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, summaryBoxY, LAYOUT.CONTENT_WIDTH - 10, 30, 'F');

    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1);
    doc.rect(LAYOUT.MARGIN_LEFT + 5, summaryBoxY, LAYOUT.CONTENT_WIDTH - 10, 30);

    currentY = summaryBoxY + 8;

    // Total Ingresos
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Ingresos:', LAYOUT.MARGIN_LEFT + 10, currentY);
    doc.setTextColor(...COLORS.SUCCESS_GREEN);
    doc.setFontSize(11);
    doc.text(formatCurrency(cut.grand_total || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 10, currentY, { align: 'right' });

    currentY += 7;

    // Total Gastos
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Gastos:', LAYOUT.MARGIN_LEFT + 10, currentY);
    doc.setTextColor(...COLORS.ERROR_RED);
    doc.setFontSize(11);
    doc.text(formatCurrency(cut.expenses_amount || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 10, currentY, { align: 'right' });

    currentY += 7;

    // Línea separadora
    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(0.5);
    doc.line(LAYOUT.MARGIN_LEFT + 10, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 10, currentY);

    currentY += 6;

    // Balance Final
    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BALANCE FINAL:', LAYOUT.MARGIN_LEFT + 10, currentY);
    if ((cut.final_balance || 0) >= 0) {
      doc.setTextColor(...COLORS.SUCCESS_GREEN);
    } else {
      doc.setTextColor(...COLORS.ERROR_RED);
    }
    doc.setFontSize(13);
    doc.text(formatCurrency(cut.final_balance || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 10, currentY, { align: 'right' });

    currentY = summaryBoxY + 35;

    // --- DESGLOSE POR FUENTE DE INGRESOS ---
    currentY = checkPageSpace(currentY, 80);
    currentY = createSectionHeader('DESGLOSE POR FUENTE DE INGRESOS', currentY);

    const sourceHeaders = ['Fuente', 'Efectivo', 'Transf.', 'Débito', 'Crédito', 'Total', 'Trans.'];
    const sourceWidths = [40, 25, 25, 25, 25, 30, 16];

    const sourceRows = [
      [
        'POS (Ventas)',
        formatCurrency(cut.pos_efectivo || 0),
        formatCurrency(cut.pos_transferencia || 0),
        formatCurrency(cut.pos_debito || 0),
        formatCurrency(cut.pos_credito || 0),
        formatCurrency(cut.pos_total || 0),
        String(cut.pos_transactions || 0)
      ],
      [
        'Abonos',
        formatCurrency(cut.abonos_efectivo || 0),
        formatCurrency(cut.abonos_transferencia || 0),
        formatCurrency(cut.abonos_debito || 0),
        formatCurrency(cut.abonos_credito || 0),
        formatCurrency(cut.abonos_total || 0),
        String(cut.abonos_transactions || 0)
      ],
      [
        'Membresías',
        formatCurrency(cut.membership_efectivo || 0),
        formatCurrency(cut.membership_transferencia || 0),
        formatCurrency(cut.membership_debito || 0),
        formatCurrency(cut.membership_credito || 0),
        formatCurrency(cut.membership_total || 0),
        String(cut.membership_transactions || 0)
      ]
    ];

    currentY = createTable(sourceHeaders, sourceRows, currentY, sourceWidths);
    currentY += 5;

    // --- TOTALES POR MÉTODO DE PAGO ---
    currentY = checkPageSpace(currentY, 50);
    currentY = createSectionHeader('TOTALES POR MÉTODO DE PAGO', currentY);

    const methodHeaders = ['Método de Pago', 'Monto Total'];
    const methodWidths = [130, 56];

    const methodRows = [
      ['Efectivo', formatCurrency(cut.total_efectivo || 0)],
      ['Transferencia Bancaria', formatCurrency(cut.total_transferencia || 0)],
      ['Tarjeta de Débito', formatCurrency(cut.total_debito || 0)],
      ['Tarjeta de Crédito', formatCurrency(cut.total_credito || 0)]
    ];

    currentY = createTable(methodHeaders, methodRows, currentY, methodWidths);
    currentY += 5;

    // Línea de total
    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1);
    doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);
    currentY += 6;

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL GENERAL:', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.SUCCESS_GREEN);
    doc.setFontSize(12);
    doc.text(formatCurrency(cut.grand_total || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, currentY, { align: 'right' });

    currentY += LAYOUT.SECTION_SPACING;

    // --- GASTOS DEL DÍA ---
    if (expenses && expenses.length > 0) {
      currentY = checkPageSpace(currentY, 60);
      currentY = createSectionHeader('GASTOS DEL DÍA', currentY);

      const expenseHeaders = ['Categoría', 'Descripción', 'Monto'];
      const expenseWidths = [50, 90, 46];

      const expenseRows = expenses.map(expense => [
        safeValue(expense.expense_category?.name, 'Sin categoría'),
        safeValue(expense.description, 'Sin descripción').substring(0, 40),
        formatCurrency(expense.amount || 0)
      ]);

      currentY = createTable(expenseHeaders, expenseRows, currentY, expenseWidths);
      currentY += 5;

      // Total de gastos
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(1);
      doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);
      currentY += 6;

      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL GASTOS:', LAYOUT.MARGIN_LEFT + 5, currentY);
      doc.setTextColor(...COLORS.ERROR_RED);
      doc.setFontSize(12);
      doc.text(formatCurrency(cut.expenses_amount || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, currentY, { align: 'right' });

      currentY += LAYOUT.SECTION_SPACING;
    }

    // --- COMISIONES ---
    currentY = checkPageSpace(currentY, 50);
    currentY = createSectionHeader('COMISIONES', currentY);

    const commissionHeaders = ['Concepto', 'Monto'];
    const commissionWidths = [130, 56];

    const commissionRows = [
      ['Comisiones POS', formatCurrency(cut.pos_commissions || 0)],
      ['Comisiones Abonos', formatCurrency(cut.abonos_commissions || 0)],
      ['Comisiones Membresías', formatCurrency(cut.membership_commissions || 0)]
    ];

    currentY = createTable(commissionHeaders, commissionRows, currentY, commissionWidths);
    currentY += 5;

    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(1);
    doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);
    currentY += 6;

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL COMISIONES:', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(12);
    doc.text(formatCurrency(cut.total_commissions || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, currentY, { align: 'right' });

    currentY += 10;

    doc.setTextColor(...COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('MONTO NETO (después de comisiones):', LAYOUT.MARGIN_LEFT + 5, currentY);
    doc.setTextColor(...COLORS.SUCCESS_GREEN);
    doc.setFontSize(12);
    doc.text(formatCurrency(cut.net_amount || 0), LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, currentY, { align: 'right' });

    currentY += LAYOUT.SECTION_SPACING;

    // --- OBSERVACIONES ---
    if (cut.notes) {
      currentY = checkPageSpace(currentY, 40);
      currentY = createSectionHeader('OBSERVACIONES', currentY);

      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(cut.notes, LAYOUT.CONTENT_WIDTH - 10);
      doc.text(noteLines, LAYOUT.MARGIN_LEFT + 5, currentY);

      currentY += noteLines.length * 5 + LAYOUT.SECTION_SPACING;
    }

    // --- DETALLE DE TRANSACCIONES ---
    if ((salesTransactions && salesTransactions.length > 0) || (membershipTransactions && membershipTransactions.length > 0)) {
      currentY = checkPageSpace(currentY, 60);
      currentY = createSectionHeader('DETALLE DE TRANSACCIONES', currentY);

      // Ventas POS
      if (salesTransactions && salesTransactions.length > 0) {
        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Ventas POS', LAYOUT.MARGIN_LEFT + 5, currentY);
        currentY += 7;

        const salesHeaders = ['Hora', 'Cliente', 'Productos', 'Monto'];
        const salesWidths = [25, 50, 80, 32];

        const salesRows = salesTransactions.slice(0, 10).map((sale: any) => {
          return [
            formatMexicoTime(new Date(sale.created_at)),
            (sale.customer_name || 'Cliente').substring(0, 25),
            (sale.product_name || 'Sin detalle').substring(0, 40),
            formatCurrency(sale.amount || 0)
          ];
        });

        currentY = createTable(salesHeaders, salesRows, currentY, salesWidths);
        currentY += 10;
      }

      // Membresías
      if (membershipTransactions && membershipTransactions.length > 0) {
        currentY = checkPageSpace(currentY, 40);

        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Pagos de Membresías', LAYOUT.MARGIN_LEFT + 5, currentY);
        currentY += 7;

        const membHeaders = ['Hora', 'Cliente', 'Plan', 'Monto'];
        const membWidths = [25, 60, 70, 32];

        const membRows = membershipTransactions.slice(0, 10).map((memb: any) => {
          return [
            formatMexicoTime(new Date(memb.created_at)),
            (memb.customer_name || 'Cliente').substring(0, 30),
            (memb.membership_type || 'Plan').substring(0, 35),
            formatCurrency(memb.amount || 0)
          ];
        });

        currentY = createTable(membHeaders, membRows, currentY, membWidths);
        currentY += LAYOUT.SECTION_SPACING;
      }
    }

    // --- FIRMAS ---
    currentY = checkPageSpace(currentY, 40);
    currentY += 10;

    doc.setDrawColor(...COLORS.GOLD);
    doc.setLineWidth(0.5);

    // Línea de firma izquierda
    const leftLineX = LAYOUT.MARGIN_LEFT + 15;
    const rightLineX = LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 65;
    const lineLength = 50;

    doc.line(leftLineX, currentY, leftLineX + lineLength, currentY);
    doc.line(rightLineX, currentY, rightLineX + lineLength, currentY);

    currentY += 5;

    doc.setTextColor(...COLORS.WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Elaboró', leftLineX + lineLength / 2, currentY, { align: 'center' });
    doc.text('Autorizó', rightLineX + lineLength / 2, currentY, { align: 'center' });

    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.LIGHT_GRAY);
    doc.text(createdBy, leftLineX + lineLength / 2, currentY, { align: 'center' });

    // 🦶 AÑADIR PIE DE PÁGINA
    addFooter();

    console.log('✅ [CUT-PDF] PDF generado correctamente');

    // 📦 GENERAR BUFFER
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // 📤 RETORNAR PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="corte-${cut.cut_number}.pdf"`,
      },
    });

  } catch (error) {
    console.error('❌ [CUT-PDF] Error:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
