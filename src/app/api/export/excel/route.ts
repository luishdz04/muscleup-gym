import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      includeUsers = true,
      includeMemberships = true,
      includePayments = true,
      includePlans = true,
      includeInventory = false,
      includeSettings = false,
      dateRange = null
    } = body;

    console.log('📊 [EXPORT] Iniciando exportación a Excel...');
    console.log('📋 [EXPORT] Opciones:', {
      includeUsers,
      includeMemberships,
      includePayments,
      includePlans,
      includeInventory,
      includeSettings
    });

    const supabase = createServerSupabaseClient();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MuscleUp Gym';
    workbook.created = new Date();

    // Estilos comunes
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1a1a1a' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    };

    // 1. USUARIOS
    if (includeUsers) {
      console.log('👥 [EXPORT] Exportando usuarios...');
      const sheet = workbook.addWorksheet('Usuarios');

      // Headers
      sheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Nombre', key: 'firstName', width: 20 },
        { header: 'Apellido', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'WhatsApp', key: 'whatsapp', width: 15 },
        { header: 'Fecha Nacimiento', key: 'birthDate', width: 15 },
        { header: 'Género', key: 'gender', width: 12 },
        { header: 'Estado Civil', key: 'maritalStatus', width: 15 },
        { header: 'Fecha Registro', key: 'createdAt', width: 20 }
      ];

      // Aplicar estilo a headers
      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Obtener datos
      const { data: users } = await supabase
        .from('Users')
        .select('*')
        .order('createdAt', { ascending: false });

      // Agregar datos
      if (users) {
        users.forEach((user: any) => {
          sheet.addRow({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            whatsapp: user.whatsapp,
            birthDate: user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '',
            gender: user.gender,
            maritalStatus: user.maritalStatus,
            createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString() : ''
          });
        });
      }

      // Autofit
      sheet.getRow(1).height = 25;
    }

    // 2. MEMBRESÍAS
    if (includeMemberships) {
      console.log('💳 [EXPORT] Exportando membresías...');
      const sheet = workbook.addWorksheet('Membresías');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Usuario ID', key: 'user_id', width: 30 },
        { header: 'Plan ID', key: 'plan_id', width: 30 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Fecha Inicio', key: 'start_date', width: 15 },
        { header: 'Fecha Fin', key: 'end_date', width: 15 },
        { header: 'Visitas Totales', key: 'total_visits', width: 15 },
        { header: 'Visitas Restantes', key: 'remaining_visits', width: 15 },
        { header: 'Precio Pagado', key: 'price_paid', width: 15 },
        { header: 'Método de Pago', key: 'payment_method', width: 20 }
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const { data: memberships } = await supabase
        .from('user_memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (memberships) {
        memberships.forEach((membership: any) => {
          sheet.addRow({
            id: membership.id,
            user_id: membership.user_id,
            plan_id: membership.plan_id,
            status: membership.status,
            start_date: membership.start_date ? new Date(membership.start_date).toLocaleDateString() : '',
            end_date: membership.end_date ? new Date(membership.end_date).toLocaleDateString() : '',
            total_visits: membership.total_visits,
            remaining_visits: membership.remaining_visits,
            price_paid: membership.price_paid,
            payment_method: membership.payment_method
          });
        });
      }

      sheet.getRow(1).height = 25;
    }

    // 3. PLANES
    if (includePlans) {
      console.log('📋 [EXPORT] Exportando planes...');
      const sheet = workbook.addWorksheet('Planes');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Descripción', key: 'description', width: 50 },
        { header: 'Precio', key: 'price', width: 15 },
        { header: 'Duración (días)', key: 'duration_days', width: 15 },
        { header: 'Visitas', key: 'visits', width: 15 },
        { header: 'Tipo', key: 'plan_type', width: 20 },
        { header: 'Activo', key: 'is_active', width: 10 }
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (plans) {
        plans.forEach((plan: any) => {
          sheet.addRow({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            duration_days: plan.duration_days,
            visits: plan.visits,
            plan_type: plan.plan_type,
            is_active: plan.is_active ? 'Sí' : 'No'
          });
        });
      }

      sheet.getRow(1).height = 25;
    }

    // 4. PAGOS
    if (includePayments) {
      console.log('💰 [EXPORT] Exportando historial de pagos...');
      const sheet = workbook.addWorksheet('Pagos');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Usuario ID', key: 'user_id', width: 30 },
        { header: 'Membresía ID', key: 'membership_id', width: 30 },
        { header: 'Monto', key: 'amount', width: 15 },
        { header: 'Método de Pago', key: 'payment_method', width: 20 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Fecha de Pago', key: 'payment_date', width: 20 }
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (payments) {
        payments.forEach((payment: any) => {
          sheet.addRow({
            id: payment.id,
            user_id: payment.user_id,
            membership_id: payment.membership_id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            status: payment.status,
            payment_date: payment.payment_date ? new Date(payment.payment_date).toLocaleString() : ''
          });
        });
      }

      sheet.getRow(1).height = 25;
    }

    // 5. INVENTARIO (opcional)
    if (includeInventory) {
      console.log('📦 [EXPORT] Exportando inventario...');
      const sheet = workbook.addWorksheet('Inventario');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Categoría', key: 'category', width: 20 },
        { header: 'Precio', key: 'price', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Stock Mínimo', key: 'min_stock', width: 15 }
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const { data: inventory } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (inventory) {
        inventory.forEach((product: any) => {
          sheet.addRow({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price,
            stock: product.stock,
            min_stock: product.min_stock
          });
        });
      }

      sheet.getRow(1).height = 25;
    }

    // 6. CONFIGURACIÓN (opcional)
    if (includeSettings) {
      console.log('⚙️ [EXPORT] Exportando configuración...');
      const sheet = workbook.addWorksheet('Configuración');

      sheet.columns = [
        { header: 'Clave', key: 'key', width: 30 },
        { header: 'Valor', key: 'value', width: 50 }
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      const { data: settings } = await supabase
        .from('gym_settings')
        .select('*')
        .single();

      if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
          if (key !== 'id' && typeof value !== 'object') {
            sheet.addRow({
              key,
              value: String(value)
            });
          }
        });
      }

      sheet.getRow(1).height = 25;
    }

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();

    console.log('✅ [EXPORT] Excel generado exitosamente');

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `muscleup_export_${timestamp}.xlsx`;

    // Retornar el archivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('❌ [EXPORT] Error al exportar a Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al exportar datos'
      },
      { status: 500 }
    );
  }
}
