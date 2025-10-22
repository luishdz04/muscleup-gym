import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🗑️ [DELETE-SALE] Iniciando eliminación de venta:', id);

    const supabase = createServerSupabaseClient();

    // Verificar que el usuario tenga permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [DELETE-SALE] No autorizado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar el rol del usuario
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.error('❌ [DELETE-SALE] Usuario sin permisos suficientes');
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar ventas' },
        { status: 403 }
      );
    }

    // 1. Primero obtener los detalles de la venta y sus items
    const { data: sale, error: saleError } = await supabase
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
          id
        )
      `)
      .eq('id', id)
      .single();

    if (saleError || !sale) {
      console.error('❌ [DELETE-SALE] Venta no encontrada:', saleError);
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    console.log('📦 [DELETE-SALE] Items de la venta:', sale.sale_items.length);

    // 2. Restaurar el inventario para cada item ANTES de eliminar
    // IMPORTANTE: Esto es necesario porque los triggers pueden no funcionar correctamente al eliminar
    for (const item of sale.sale_items) {
      if (item.product_id && item.quantity && item.source_warehouse_id) {
        console.log(`🔄 [DELETE-SALE] Restaurando inventario - Producto: ${item.product_id}, Cantidad: ${item.quantity}, Almacén: ${item.source_warehouse_id}`);

        // Primero verificar el stock actual
        const { data: currentStock } = await supabase
          .from('product_warehouse_stock')
          .select('current_stock')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', item.source_warehouse_id)
          .single();

        if (currentStock) {
          // Actualizar el stock sumando la cantidad vendida
          const newStock = (currentStock.current_stock || 0) + item.quantity;

          const { error: stockError } = await supabase
            .from('product_warehouse_stock')
            .update({
              current_stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('product_id', item.product_id)
            .eq('warehouse_id', item.source_warehouse_id);

          if (stockError) {
            console.error(`❌ [DELETE-SALE] Error restaurando stock:`, stockError);
          } else {
            console.log(`✅ [DELETE-SALE] Stock restaurado - Nuevo stock: ${newStock}`);
          }
        }

        // También actualizar el stock total en la tabla products
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newTotalStock = (product.stock || 0) + item.quantity;

          await supabase
            .from('products')
            .update({
              stock: newTotalStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);

          console.log(`✅ [DELETE-SALE] Stock total actualizado: ${newTotalStock}`);
        }
      }
    }

    // 3. Registrar en logs antes de eliminar
    const logData = {
      action: 'DELETE_SALE',
      table_name: 'sales',
      record_id: id,
      user_id: user.id,
      details: {
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        items_count: sale.sale_items.length,
        status: sale.status,
        deleted_at: new Date().toISOString(),
        reason: 'Manual deletion by admin/employee',
        restored_inventory: true
      }
    };

    await supabase
      .from('system_logs')
      .insert(logData);

    console.log('📝 [DELETE-SALE] Log de eliminación creado');

    // 4. Eliminar los detalles de pago primero (por las foreign keys)
    if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
      const { error: paymentDeleteError } = await supabase
        .from('sale_payment_details')
        .delete()
        .eq('sale_id', id);

      if (paymentDeleteError) {
        console.error('❌ [DELETE-SALE] Error eliminando detalles de pago:', paymentDeleteError);
      } else {
        console.log(`✅ [DELETE-SALE] ${sale.sale_payment_details.length} detalles de pago eliminados`);
      }
    }

    // 5. Eliminar los items de la venta
    const { error: itemsDeleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsDeleteError) {
      console.error('❌ [DELETE-SALE] Error eliminando items:', itemsDeleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar los items de la venta',
          details: itemsDeleteError.message
        },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE-SALE] ${sale.sale_items.length} items eliminados`);

    // 6. Finalmente eliminar la venta principal
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [DELETE-SALE] Error eliminando venta:', deleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar la venta',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ [DELETE-SALE] Venta eliminada completamente:', sale.sale_number);

    return NextResponse.json({
      success: true,
      message: `Venta ${sale.sale_number} eliminada completamente`,
      details: {
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        items_restored: sale.sale_items.length,
        inventory_restored: true
      }
    });

  } catch (error) {
    console.error('❌ [DELETE-SALE] Error general:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la venta' },
      { status: 500 }
    );
  }
}