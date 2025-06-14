import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ FUNCIÓN LOCAL PARA RANGO DE FECHAS MÉXICO
function getMexicoDateRangeLocal(dateString: string) {
  console.log('📅 Calculando rango para fecha México:', dateString);
  
  // Crear fecha base en México
  const mexicoDate = new Date(dateString + 'T00:00:00.000-06:00'); // UTC-6 México
  
  // Inicio del día en México (00:00:00)
  const startOfDayMexico = new Date(mexicoDate);
  startOfDayMexico.setHours(0, 0, 0, 0);
  
  // Final del día en México (23:59:59.999)
  const endOfDayMexico = new Date(mexicoDate);
  endOfDayMexico.setHours(23, 59, 59, 999);
  
  // Convertir a UTC para las consultas
  const startISO = startOfDayMexico.toISOString();
  const endISO = endOfDayMexico.toISOString();
  
  console.log('⏰ Rango calculado para detalles:', {
    fecha_input: dateString,
    inicio_utc: startISO,
    fin_utc: endISO
  });
  
  return { startISO, endISO };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    console.log('🚀 API transaction-details iniciada');
    console.log('📅 Fecha recibida:', date);

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida', success: false },
        { status: 400 }
      );
    }

    // ✅ VALIDAR FORMATO DE FECHA
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('❌ Error: Formato de fecha inválido:', date);
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { startISO, endISO } = getMexicoDateRangeLocal(date);

    console.log('🔍 Consultando transacciones detalladas...');

    // 🛒 1. TRANSACCIONES POS (VENTAS COMPLETAS)
    console.log('🛒 Consultando ventas POS...');
    const { data: posTransactions, error: posError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        status,
        created_at,
        notes,
        customer_id,
        Users!sales_customer_id_fkey (
          firstName,
          lastName,
          whatsapp
        ),
        sale_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        ),
        sale_payment_details (
          id,
          payment_method,
          amount,
          commission_amount,
          is_partial_payment
        )
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .eq('is_partial_payment', false)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (posError) {
      console.error('❌ Error consultando ventas POS:', posError);
      throw new Error(`Error consultando ventas POS: ${posError.message}`);
    }

    console.log('✅ Ventas POS encontradas:', posTransactions?.length || 0);

    // 💰 2. TRANSACCIONES ABONOS (PAGOS PARCIALES)
    console.log('💰 Consultando abonos...');
    const { data: abonosTransactions, error: abonosError } = await supabase
      .from('sale_payment_details')
      .select(`
        id,
        sale_id,
        payment_method,
        amount,
        commission_amount,
        payment_date,
        notes,
        sales!inner (
          id,
          sale_number,
          total_amount,
          customer_id,
          status,
          Users!sales_customer_id_fkey (
            firstName,
            lastName,
            whatsapp
          ),
          sale_items (
            product_name,
            quantity,
            unit_price
          )
        )
      `)
      .eq('is_partial_payment', true)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
      throw new Error(`Error consultando abonos: ${abonosError.message}`);
    }

    console.log('✅ Abonos encontrados:', abonosTransactions?.length || 0);

    // 🎫 3. TRANSACCIONES MEMBRESÍAS
    console.log('🎫 Consultando membresías...');
    const { data: membershipTransactions, error: membershipError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        amount_paid,
        inscription_amount,
        payment_type,
        payment_method,
        start_date,
        end_date,
        status,
        created_at,
        notes,
        commission_amount,
        userid,
        planid,
        Users!user_memberships_userid_fkey (
          firstName,
          lastName,
          whatsapp
        ),
        membership_plans!user_memberships_planid_fkey (
          name,
          description
        ),
        membership_payment_details (
          id,
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipError) {
      console.error('❌ Error consultando membresías:', membershipError);
      throw new Error(`Error consultando membresías: ${membershipError.message}`);
    }

    console.log('✅ Membresías encontradas:', membershipTransactions?.length || 0);

    // 📊 4. PROCESAR Y FORMATEAR DATOS
    console.log('📊 Procesando datos para frontend...');

    // 🛒 PROCESAR VENTAS POS
    const processedPOS = [];
    posTransactions?.forEach(sale => {
      // Para cada método de pago de la venta
      sale.sale_payment_details?.forEach(payment => {
        if (!payment.is_partial_payment) {
          // Obtener productos de la venta
          const productNames = sale.sale_items?.map(item => 
            `${item.product_name} (${item.quantity}x)`
          ).join(', ') || 'Venta POS';

          processedPOS.push({
            id: `pos_${sale.id}_${payment.id}`,
            type: 'pos',
            sale_id: sale.id,
            sale_number: sale.sale_number,
            product_name: productNames,
            quantity: sale.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
            unit_price: payment.amount,
            customer_name: sale.Users 
              ? `${sale.Users.firstName} ${sale.Users.lastName || ''}`.trim()
              : 'Cliente General',
            customer_phone: sale.Users?.whatsapp,
            payment_method: payment.payment_method,
            amount: parseFloat(payment.amount || 0),
            commission_amount: parseFloat(payment.commission_amount || 0),
            created_at: sale.created_at,
            reference: sale.sale_number,
            notes: sale.notes,
            status: sale.status
          });
        }
      });
    });

    // 💰 PROCESAR ABONOS
    const processedAbonos = [];
    abonosTransactions?.forEach(abono => {
      const productNames = abono.sales?.sale_items?.map(item => 
        `${item.product_name} (${item.quantity}x)`
      ).join(', ') || 'Abono a apartado';

      processedAbonos.push({
        id: `abono_${abono.id}`,
        type: 'abono',
        sale_id: abono.sale_id,
        sale_number: abono.sales?.sale_number,
        product_name: productNames,
        customer_name: abono.sales?.Users 
          ? `${abono.sales.Users.firstName} ${abono.sales.Users.lastName || ''}`.trim()
          : 'Cliente',
        customer_phone: abono.sales?.Users?.whatsapp,
        payment_method: abono.payment_method,
        amount: parseFloat(abono.amount || 0),
        commission_amount: parseFloat(abono.commission_amount || 0),
        created_at: abono.payment_date,
        reference: abono.sales?.sale_number,
        notes: abono.notes,
        status: abono.sales?.status || 'completed',
        is_partial_payment: true
      });
    });

    // 🎫 PROCESAR MEMBRESÍAS
    const processedMemberships = [];
    membershipTransactions?.forEach(membership => {
      const membershipName = membership.membership_plans?.name || 'Membresía';
      const duration = membership.payment_type || 'N/A';

      processedMemberships.push({
        id: `membership_${membership.id}`,
        type: 'membership',
        membership_id: membership.id,
        membership_type: membershipName,
        membership_duration: duration,
        customer_name: membership.Users 
          ? `${membership.Users.firstName} ${membership.Users.lastName || ''}`.trim()
          : 'Cliente',
        customer_phone: membership.Users?.whatsapp,
        payment_method: membership.payment_method,
        amount: parseFloat(membership.amount_paid || 0),
        commission_amount: parseFloat(membership.commission_amount || 0),
        created_at: membership.created_at,
        reference: membership.id,
        notes: membership.notes,
        status: membership.status
      });
    });

    // ✅ RESPUESTA FINAL
    const response = {
      success: true,
      date,
      timezone_info: {
        mexico_date: date,
        mexico_range: {
          start: startISO,
          end: endISO
        },
        timezone: 'America/Mexico_City (UTC-6)',
        note: "✅ Detalles de transacciones extraídos de BD"
      },
      pos_transactions: processedPOS,
      abonos_transactions: processedAbonos,
      membership_transactions: processedMemberships,
      totals: {
        pos_count: processedPOS.length,
        abonos_count: processedAbonos.length,
        membership_count: processedMemberships.length,
        total_transactions: processedPOS.length + processedAbonos.length + processedMemberships.length,
        pos_total: processedPOS.reduce((sum, t) => sum + t.amount, 0),
        abonos_total: processedAbonos.reduce((sum, t) => sum + t.amount, 0),
        membership_total: processedMemberships.reduce((sum, t) => sum + t.amount, 0),
        grand_total: [...processedPOS, ...processedAbonos, ...processedMemberships].reduce((sum, t) => sum + t.amount, 0)
      }
    };

    console.log('🎉 API transaction-details completada exitosamente');
    console.log('📊 Totales:', response.totals);
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('💥 Error crítico en transaction-details API:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}
