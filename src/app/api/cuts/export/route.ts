import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtros (sin paginación para exportar todo)
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const isManual = searchParams.get('isManual');

    console.log('📄 API: Exportando cortes con filtros:', {
      search,
      dateFrom,
      dateTo,
      status,
      isManual
    });

    connection = await getConnection();

    // Construir WHERE clause dinámicamente
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Aplicar los mismos filtros que en el historial
    if (search) {
      whereConditions.push(`(
        cuts.cut_number ILIKE $${paramIndex} OR 
        cuts.notes ILIKE $${paramIndex} OR 
        users.first_name ILIKE $${paramIndex} OR 
        users.last_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (dateFrom) {
      whereConditions.push(`cuts.cut_date >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`cuts.cut_date <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`cuts.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (isManual && isManual !== 'all') {
      whereConditions.push(`cuts.is_manual = $${paramIndex}`);
      queryParams.push(isManual === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para exportar
    const exportQuery = `
      SELECT 
        cuts.cut_number as "Número de Corte",
        cuts.cut_date as "Fecha",
        CASE WHEN cuts.is_manual THEN 'Manual' ELSE 'Automático' END as "Tipo",
        cuts.status as "Estado",
        cuts.pos_total as "POS Total",
        cuts.abonos_total as "Abonos Total",
        cuts.membership_total as "Membresías Total",
        cuts.grand_total as "Total Bruto",
        cuts.expenses_amount as "Gastos",
        cuts.final_balance as "Balance Final",
        cuts.total_transactions as "Transacciones",
        cuts.total_efectivo as "Efectivo",
        cuts.total_transferencia as "Transferencia",
        cuts.total_debito as "Tarjeta Débito",
        cuts.total_credito as "Tarjeta Crédito",
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as "Responsable",
        cuts.created_at as "Fecha Creación",
        cuts.notes as "Observaciones"
      FROM cuts 
      LEFT JOIN users ON cuts.created_by = users.id
      WHERE ${whereClause}
      ORDER BY cuts.created_at DESC
    `;

    const result = await connection.query(exportQuery, queryParams);
    const cuts = result.rows;

    // Crear workbook de Excel
    const worksheet = XLSX.utils.json_to_sheet(cuts);
    const workbook = XLSX.utils.book_new();
    
    // Agregar hoja
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Cortes');

    // Configurar anchos de columna
    const colWidths = [
      { wch: 15 }, // Número de Corte
      { wch: 12 }, // Fecha
      { wch: 12 }, // Tipo
      { wch: 10 }, // Estado
      { wch: 15 }, // POS Total
      { wch: 15 }, // Abonos Total
      { wch: 15 }, // Membresías Total
      { wch: 15 }, // Total Bruto
      { wch: 12 }, // Gastos
      { wch: 15 }, // Balance Final
      { wch: 12 }, // Transacciones
      { wch: 12 }, // Efectivo
      { wch: 15 }, // Transferencia
      { wch: 15 }, // Tarjeta Débito
      { wch: 15 }, // Tarjeta Crédito
      { wch: 20 }, // Responsable
      { wch: 20 }, // Fecha Creación
      { wch: 30 }  // Observaciones
    ];
    worksheet['!cols'] = colWidths;

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });

    console.log('✅ Archivo Excel generado:', cuts.length, 'cortes exportados');

    // Retornar archivo
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cortes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('❌ Error en API exportar cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar los cortes'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
