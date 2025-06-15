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
    const expenseType = searchParams.get('expenseType');
    const status = searchParams.get('status');

    console.log('📄 API: Exportando egresos con filtros:', {
      search,
      dateFrom,
      dateTo,
      expenseType,
      status
    });

    connection = await getConnection();

    // Construir WHERE clause dinámicamente (mismo que historial)
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        expenses.description ILIKE $${paramIndex} OR 
        expenses.receipt_number ILIKE $${paramIndex} OR 
        expenses.notes ILIKE $${paramIndex} OR 
        users.first_name ILIKE $${paramIndex} OR 
        users.last_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (dateFrom) {
      whereConditions.push(`expenses.expense_date >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`expenses.expense_date <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    if (expenseType && expenseType !== 'all') {
      whereConditions.push(`expenses.expense_type = $${paramIndex}`);
      queryParams.push(expenseType);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`expenses.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para exportar
    const exportQuery = `
      SELECT 
        expenses.expense_date as "Fecha",
        expenses.expense_time as "Hora",
        CASE 
          WHEN expenses.expense_type = 'nomina' THEN 'Nómina'
          WHEN expenses.expense_type = 'suplementos' THEN 'Suplementos'
          WHEN expenses.expense_type = 'servicios' THEN 'Servicios'
          WHEN expenses.expense_type = 'mantenimiento' THEN 'Mantenimiento'
          WHEN expenses.expense_type = 'limpieza' THEN 'Limpieza'
          WHEN expenses.expense_type = 'marketing' THEN 'Marketing'
          WHEN expenses.expense_type = 'equipamiento' THEN 'Equipamiento'
          ELSE 'Otros'
        END as "Categoría",
        expenses.description as "Descripción",
        expenses.amount as "Monto",
        expenses.receipt_number as "Número de Recibo",
        expenses.status as "Estado",
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as "Responsable",
        expenses.created_at as "Fecha Creación",
        expenses.notes as "Notas"
      FROM expenses 
      LEFT JOIN users ON expenses.created_by = users.id
      WHERE ${whereClause}
      ORDER BY expenses.expense_date DESC, expenses.expense_time DESC
    `;

    const result = await connection.query(exportQuery, queryParams);
    const expenses = result.rows;

    // Crear workbook de Excel
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    
    // Agregar hoja
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Egresos');

    // Configurar anchos de columna
    const colWidths = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 15 }, // Categoría
      { wch: 30 }, // Descripción
      { wch: 15 }, // Monto
      { wch: 20 }, // Número de Recibo
      { wch: 12 }, // Estado
      { wch: 20 }, // Responsable
      { wch: 20 }, // Fecha Creación
      { wch: 40 }  // Notas
    ];
    worksheet['!cols'] = colWidths;

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });

    console.log('✅ Archivo Excel generado:', expenses.length, 'egresos exportados');

    // Retornar archivo
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="egresos_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('❌ Error en API exportar egresos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar los egresos'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
