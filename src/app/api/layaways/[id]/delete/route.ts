import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🗑️ [DELETE-LAYAWAY] Iniciando eliminación de apartado:', id);

    const supabase = createServerSupabaseClient();

    // Verificar que el usuario tenga permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [DELETE-LAYAWAY] No autorizado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar el rol del usuario
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.error('❌ [DELETE-LAYAWAY] Usuario sin permisos suficientes');
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar apartados' },
        { status: 403 }
      );
    }

    // 1. Primero obtener los detalles del apartado y sus items
    const { data: layaway, error: layawayError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          product_id,
          quantity,
          source_warehouse_id
        ),
        sale_payment_details (
          id,
          amount
        ),
        layaway_status_history (
          id
        ),
        customer:Users!sales_customer_id_fkey (
          id,
          firstName,
          lastName,
          email
        )
      `)
      .eq('id', id)
      .eq('sale_type', 'layaway')
      .single();

    if (layawayError || !layaway) {
      console.error('❌ [DELETE-LAYAWAY] Apartado no encontrado:', layawayError);
      return NextResponse.json(
        { error: 'Apartado no encontrado' },
        { status: 404 }
      );
    }

    console.log('📦 [DELETE-LAYAWAY] Items del apartado:', layaway.sale_items.length);
    console.log('💰 [DELETE-LAYAWAY] Pagos recibidos:', layaway.sale_payment_details.length);

    // 2. Crear registros en inventory_movements para liberar el inventario reservado
    // Los apartados tienen inventario reservado que debe ser liberado
    const inventoryMovements = layaway.sale_items
      .filter(item => item.product_id && item.quantity && item.source_warehouse_id)
      .map(item => ({
        product_id: item.product_id,
        movement_type: 'cancelar_reserva', // Tipo específico para cancelar reserva de apartado
        quantity: item.quantity,
        target_warehouse_id: item.source_warehouse_id,
        reason: `Eliminación de Apartado #${layaway.sale_number} - Error de registro`,
        reference_id: id,
        created_by: user.id,
        created_at: new Date().toISOString()
      }));

    if (inventoryMovements.length > 0) {
      console.log(`📝 [DELETE-LAYAWAY] Insertando ${inventoryMovements.length} movimientos de inventario`);

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(inventoryMovements);

      if (movementError) {
        console.error('❌ [DELETE-LAYAWAY] Error creando inventory_movements:', movementError);
        // Continuar el proceso pero logearlo
      } else {
        console.log(`✅ [DELETE-LAYAWAY] Movimientos de inventario creados, inventario liberado`);
      }
    }

    // 3. Verificación adicional: Liberar inventario manualmente si es necesario
    for (const item of layaway.sale_items) {
      if (item.product_id && item.quantity && item.source_warehouse_id) {
        // Verificar el stock reservado
        const { data: stockCheck } = await supabase
          .from('product_warehouse_stock')
          .select('current_stock, reserved_stock, updated_at')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', item.source_warehouse_id)
          .single();

        if (stockCheck && stockCheck.reserved_stock > 0) {
          const lastUpdate = new Date(stockCheck.updated_at);
          const now = new Date();
          const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

          // Si no fue actualizado por triggers en los últimos 5 segundos
          if (diffSeconds > 5) {
            console.log(`⚠️ [DELETE-LAYAWAY] Stock reservado no actualizado por triggers, liberando manualmente`);

            // Reducir el stock reservado y aumentar el disponible
            const newReservedStock = Math.max(0, (stockCheck.reserved_stock || 0) - item.quantity);
            const newCurrentStock = (stockCheck.current_stock || 0) + item.quantity;

            await supabase
              .from('product_warehouse_stock')
              .update({
                current_stock: newCurrentStock,
                reserved_stock: newReservedStock,
                updated_at: now.toISOString()
              })
              .eq('product_id', item.product_id)
              .eq('warehouse_id', item.source_warehouse_id);

            console.log(`✅ [DELETE-LAYAWAY] Stock liberado manualmente - Disponible: ${newCurrentStock}, Reservado: ${newReservedStock}`);
          }
        }
      }
    }

    // 4. Registrar en logs antes de eliminar
    const totalPaid = layaway.sale_payment_details?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const logData = {
      action: 'DELETE_LAYAWAY',
      table_name: 'sales',
      record_id: id,
      user_id: user.id,
      details: {
        sale_number: layaway.sale_number,
        customer_name: layaway.customer ? `${layaway.customer.firstName} ${layaway.customer.lastName}` : 'N/A',
        total_amount: layaway.total_amount,
        paid_amount: totalPaid,
        pending_amount: layaway.total_amount - totalPaid,
        items_count: layaway.sale_items.length,
        status: layaway.status,
        payment_status: layaway.payment_status,
        created_at: layaway.created_at,
        expires_at: layaway.layaway_expires_at,
        deleted_at: new Date().toISOString(),
        reason: 'Manual deletion by admin/employee - Registration error',
        inventory_released: true
      }
    };

    await supabase
      .from('system_logs')
      .insert(logData);

    console.log('📝 [DELETE-LAYAWAY] Log de eliminación creado');

    // 5. Eliminar el historial de estados del apartado
    if (layaway.layaway_status_history && layaway.layaway_status_history.length > 0) {
      const { error: historyDeleteError } = await supabase
        .from('layaway_status_history')
        .delete()
        .eq('layaway_id', id);

      if (historyDeleteError) {
        console.error('❌ [DELETE-LAYAWAY] Error eliminando historial:', historyDeleteError);
      } else {
        console.log(`✅ [DELETE-LAYAWAY] ${layaway.layaway_status_history.length} registros de historial eliminados`);
      }
    }

    // 6. Eliminar los detalles de pago
    if (layaway.sale_payment_details && layaway.sale_payment_details.length > 0) {
      const { error: paymentDeleteError } = await supabase
        .from('sale_payment_details')
        .delete()
        .eq('sale_id', id);

      if (paymentDeleteError) {
        console.error('❌ [DELETE-LAYAWAY] Error eliminando detalles de pago:', paymentDeleteError);
      } else {
        console.log(`✅ [DELETE-LAYAWAY] ${layaway.sale_payment_details.length} detalles de pago eliminados`);
      }
    }

    // 7. Eliminar los items del apartado
    const { error: itemsDeleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsDeleteError) {
      console.error('❌ [DELETE-LAYAWAY] Error eliminando items:', itemsDeleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar los items del apartado',
          details: itemsDeleteError.message
        },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE-LAYAWAY] ${layaway.sale_items.length} items eliminados`);

    // 8. Finalmente eliminar el apartado principal
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [DELETE-LAYAWAY] Error eliminando apartado:', deleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar el apartado',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ [DELETE-LAYAWAY] Apartado eliminado completamente:', layaway.sale_number);

    return NextResponse.json({
      success: true,
      message: `Apartado ${layaway.sale_number} eliminado completamente`,
      details: {
        sale_number: layaway.sale_number,
        customer: layaway.customer ? `${layaway.customer.firstName} ${layaway.customer.lastName}` : 'N/A',
        total_amount: layaway.total_amount,
        paid_amount: totalPaid,
        items_released: layaway.sale_items.length,
        inventory_released: true
      }
    });

  } catch (error) {
    console.error('❌ [DELETE-LAYAWAY] Error general:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el apartado' },
      { status: 500 }
    );
  }
}