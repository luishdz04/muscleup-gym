import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import { getGymSettings, getGymEmail } from '@/lib/gymSettings';
import { formatCurrency } from '@/utils/formHelpers';
import { formatDateForDisplay, getMexicoDateRange } from '@/utils/dateUtils';

// Helper function to format time from UTC timestamp to Mexico timezone
function formatTimeFromUTC(timestamp: string): string {
  if (!timestamp) return 'N/A';

  // Ensure the timestamp is treated as UTC
  let dateString = timestamp.trim();

  // If timestamp doesn't have timezone info, add 'Z' to indicate UTC
  const hasTimezone = dateString.includes('Z') || dateString.indexOf('+') > 10 || dateString.indexOf('-', 10) > 10;
  if (!hasTimezone) {
    dateString = dateString.replace(' ', 'T') + 'Z';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Hora inválida';
  }

  // Format time in Mexico timezone
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

// Helper function to format time that is already in Mexico timezone
function formatTimeAlreadyMexico(timestamp: string): string {
  if (!timestamp) return 'N/A';

  // This timestamp is already in Mexico time, just format it
  let dateString = timestamp.trim().replace(' ', 'T');

  // Parse as local time (not UTC)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Hora inválida';
  }

  // Format directly without timezone conversion
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // ✅ Obtener rango de fechas en timezone México
    const dateRange = getMexicoDateRange(cut.cut_date);
    console.log('📅 [CUT-PDF] Rango México para', cut.cut_date, ':', dateRange);

    // ✅ Obtener ventas POS directamente (sin fetch) - SIN LÍMITE para ver todas
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        total_amount,
        sale_items(product_name, quantity, unit_price)
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', dateRange.startISO)
      .lte('created_at', dateRange.endISO)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('❌ [CUT-PDF] Error consultando ventas:', salesError);
    }

    console.log('📦 [CUT-PDF] Ventas obtenidas:', salesData?.length || 0);

    // ✅ Procesar ventas POS con más detalles
    const salesTransactions = (salesData || []).map((sale: any) => {
      const products = (sale.sale_items || [])
        .map((item: any) => `${item.quantity}x ${item.product_name} ($${item.unit_price || 0})`)
        .join(', ');

      return {
        id: sale.id,
        created_at: sale.created_at,
        customer_name: 'Cliente General', // La tabla sales no tiene customer_name
        product_name: products || 'Venta POS',
        amount: sale.total_amount || 0
      };
    });

    // ✅ Obtener pagos de membresías directamente (sin fetch)
    const { data: membershipPayments, error: membError } = await supabase
      .from('membership_payment_details')
      .select('membership_id, created_at')
      .gte('created_at', dateRange.startISO)
      .lte('created_at', dateRange.endISO);

    if (membError) {
      console.error('❌ [CUT-PDF] Error consultando pagos membresías:', membError);
    }

    const uniqueMembershipIds = [...new Set((membershipPayments || []).map(p => p.membership_id))];
    console.log('📦 [CUT-PDF] Membresías únicas:', uniqueMembershipIds.length);

    let membershipTransactions: any[] = [];
    if (uniqueMembershipIds.length > 0) {
      const { data: membershipsData } = await supabase
        .from('user_memberships')
        .select(`
          id,
          created_at,
          Users!userid(firstName, lastName),
          membership_plans!plan_id(name),
          membership_payment_details!membership_id(amount, created_at, payment_method)
        `)
        .in('id', uniqueMembershipIds);

      membershipTransactions = (membershipsData || []).flatMap((memb: any) => {
        const user = Array.isArray(memb.Users) ? memb.Users[0] : memb.Users;
        const plan = Array.isArray(memb.membership_plans) ? memb.membership_plans[0] : memb.membership_plans;
        const payments = Array.isArray(memb.membership_payment_details)
          ? memb.membership_payment_details
          : [memb.membership_payment_details];

        // Filtrar pagos del día
        const paymentsOfDay = payments.filter((p: any) =>
          p && p.created_at >= dateRange.startISO && p.created_at <= dateRange.endISO
        );

        return paymentsOfDay.map((payment: any) => ({
          id: `${memb.id}-${payment.created_at}`,
          created_at: payment.created_at,
          customer_name: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Cliente',
          membership_type: plan?.name || 'Plan',
          amount: payment.amount || 0
        }));
      });
    }

    console.log('✅ [CUT-PDF] Transacciones procesadas - POS:', salesTransactions.length, 'Membresías:', membershipTransactions.length);

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
    const createTable = (headers: string[], rows: string[][], startY: number, columnWidths: number[], alignments?: ('left' | 'right' | 'center')[]): number => {
      let currentY = startY;

      // Header de tabla
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, LAYOUT.TABLE_ROW_HEIGHT, 'F');

      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      let xPosition = LAYOUT.MARGIN_LEFT + 2;
      headers.forEach((header, i) => {
        const headerAlign = alignments?.[i] || 'left';
        const headerX = headerAlign === 'right' ? xPosition + columnWidths[i] - 2 : xPosition;
        doc.text(header, headerX, currentY + 4.5, { align: headerAlign as 'left' | 'right' | 'center' });
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
          // Usar alineación específica si se proporciona, sino por defecto a la izquierda
          const align = alignments?.[i] || 'left';
          let cellX = xPosition;

          if (align === 'right') {
            cellX = xPosition + columnWidths[i] - 2;
          } else if (align === 'center') {
            cellX = xPosition + columnWidths[i] / 2;
          }

          doc.text(cell, cellX, currentY + 4.5, { align: align as 'left' | 'right' | 'center' });
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
    // El created_at del corte ya está en hora de México, solo formatearlo
    const cutTimeFormatted = cut.created_at
      ? formatTimeAlreadyMexico(cut.created_at)
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

    // Fuente a la izquierda, montos a la derecha, Trans. a la derecha
    const sourceAlignments: ('left' | 'right' | 'center')[] = ['left', 'right', 'right', 'right', 'right', 'right', 'right'];
    currentY = createTable(sourceHeaders, sourceRows, currentY, sourceWidths, sourceAlignments);
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

    // Método a la izquierda, monto a la derecha
    const methodAlignments: ('left' | 'right' | 'center')[] = ['left', 'right'];
    currentY = createTable(methodHeaders, methodRows, currentY, methodWidths, methodAlignments);
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

      // Categoría y descripción a la izquierda, monto a la derecha
      const expenseAlignments: ('left' | 'right' | 'center')[] = ['left', 'left', 'right'];
      currentY = createTable(expenseHeaders, expenseRows, currentY, expenseWidths, expenseAlignments);
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

    // Concepto a la izquierda, monto a la derecha
    const commissionAlignments: ('left' | 'right' | 'center')[] = ['left', 'right'];
    currentY = createTable(commissionHeaders, commissionRows, currentY, commissionWidths, commissionAlignments);
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
    console.log('🎨 [CUT-PDF] Generando sección de transacciones - POS:', salesTransactions.length, 'Membresías:', membershipTransactions.length);
    if ((salesTransactions && salesTransactions.length > 0) || (membershipTransactions && membershipTransactions.length > 0)) {
      currentY = checkPageSpace(currentY, 60);
      currentY = createSectionHeader('DETALLE DE TRANSACCIONES', currentY);

      // Ventas POS - MOSTRAR TODAS (o máximo 20 para no sobrecargar)
      if (salesTransactions && salesTransactions.length > 0) {
        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Ventas POS (${salesTransactions.length} transacciones)`, LAYOUT.MARGIN_LEFT + 5, currentY);
        currentY += 7;

        const salesHeaders = ['Hora', 'Cliente', 'Productos', 'Monto'];
        const salesWidths = [25, 45, 85, 32];

        // Mostrar hasta 20 transacciones para no saturar el PDF
        const maxTransactions = Math.min(salesTransactions.length, 20);
        const salesRows = salesTransactions.slice(0, maxTransactions).map((sale: any) => {
          // Las ventas están en UTC, convertir a hora de México
          const mexicoTimeStr = formatTimeFromUTC(sale.created_at);

          return [
            mexicoTimeStr,
            (sale.customer_name || 'Cliente').substring(0, 25),
            (sale.product_name || 'Sin detalle').substring(0, 45),
            formatCurrency(sale.amount || 0)
          ];
        });

        // Solo el último campo (Monto) alineado a la derecha
        const salesAlignments: ('left' | 'right' | 'center')[] = ['left', 'left', 'left', 'right'];
        currentY = createTable(salesHeaders, salesRows, currentY, salesWidths, salesAlignments);

        // Si hay más transacciones, indicarlo
        if (salesTransactions.length > maxTransactions) {
          currentY += 5;
          doc.setTextColor(...COLORS.LIGHT_GRAY);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text(`... y ${salesTransactions.length - maxTransactions} transacciones más`, LAYOUT.MARGIN_LEFT + 5, currentY);
        }

        currentY += 10;
      }

      // Membresías - MOSTRAR TODAS (o máximo 20)
      if (membershipTransactions && membershipTransactions.length > 0) {
        currentY = checkPageSpace(currentY, 40);

        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Pagos de Membresías (${membershipTransactions.length} transacciones)`, LAYOUT.MARGIN_LEFT + 5, currentY);
        currentY += 7;

        const membHeaders = ['Hora', 'Cliente', 'Plan', 'Monto'];
        const membWidths = [25, 60, 70, 32];

        // Mostrar hasta 20 transacciones
        const maxMemberships = Math.min(membershipTransactions.length, 20);
        const membRows = membershipTransactions.slice(0, maxMemberships).map((memb: any) => {
          // Las membresías están en UTC, convertir a hora de México
          const mexicoTimeStr = formatTimeFromUTC(memb.created_at);

          return [
            mexicoTimeStr,
            (memb.customer_name || 'Cliente').substring(0, 30),
            (memb.membership_type || 'Plan').substring(0, 35),
            formatCurrency(memb.amount || 0)
          ];
        });

        // Solo el último campo (Monto) alineado a la derecha
        const membAlignments: ('left' | 'right' | 'center')[] = ['left', 'left', 'left', 'right'];
        currentY = createTable(membHeaders, membRows, currentY, membWidths, membAlignments);

        // Si hay más transacciones, indicarlo
        if (membershipTransactions.length > maxMemberships) {
          currentY += 5;
          doc.setTextColor(...COLORS.LIGHT_GRAY);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text(`... y ${membershipTransactions.length - maxMemberships} transacciones más`, LAYOUT.MARGIN_LEFT + 5, currentY);
        }

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

    // 📤 NOMBRE DEL ARCHIVO = Formateado profesionalmente
    // Usar la fecha real del corte en México (cut.cut_date ya está en formato YYYY-MM-DD)
    // PERO: Necesitamos verificar si la fecha está correcta
    console.log('📅 [CUT-PDF] Fecha del corte (cut_date):', cut.cut_date);
    console.log('📅 [CUT-PDF] Fecha de creación (created_at):', cut.created_at);

    // Usar cut_date que ya viene en formato YYYY-MM-DD
    const dateStr = cut.cut_date;

    // Crear nombre descriptivo: Corte_2024-12-20_001
    const cutNumberClean = cut.cut_number.replace(/[^0-9A-Za-z-_]/g, '_');
    const pdfFilename = `Corte_${dateStr}_${cutNumberClean}.pdf`;
    console.log('📄 [CUT-PDF] Nombre del archivo:', pdfFilename);

    // 📤 RETORNAR PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFilename}"`,
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
