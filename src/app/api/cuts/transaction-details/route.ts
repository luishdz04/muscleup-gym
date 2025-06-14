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

    // 🛒 1. TRANSACCIONES POS (VENTAS COMPLETAS) - SIMPLIFICADA
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
        customer_id
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (posError) {
      console.error('❌ Error consultando ventas POS:', posError);
      // No lanzar error, continuar con array vacío
    }

    console.log('✅ Ventas POS encontradas:', posTransactions?.length || 0);

    // 💰 2. TRANSACCIONES ABONOS (PAGOS PARCIALES) - SIMPLIFICADA
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
        notes
      `)
      .eq('is_partial_payment', true)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
      // No lanzar error, continuar con array vacío
    }

    console.log('✅ Abonos encontrados:', abonosTransactions?.length || 0);

    // 🎫 3. TRANSACCIONES MEMBRESÍAS - SIMPLIFICADA
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
        planid
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipError) {
      console.error('❌ Error consultando membresías:', membershipError);
      // No lanzar error, continuar con array vacío
    }

    console.log('✅ Membresías encontradas:', membershipTransactions?.length || 0);

    // 📊 4. OBTENER DATOS ADICIONALES POR SEPARADO
    
    // Obtener datos de clientes para POS
    const customerIds = [...new Set([
      ...(posTransactions || []).map(s => s.customer_id).filter(Boolean),
      ...(membershipTransactions || []).map(m => m.userid).filter(Boolean)
    ])];

    let customers = [];
    if (customerIds.length > 0) {
      console.log('👥 Consultando datos de clientes...');
      const { data: customersData, error: customersError } = await supabase
        .from('Users')
        .select('id, firstName, lastName, whatsapp')
        .in('id', customerIds);
      
      if (!customersError) {
        customers = customersData || [];
      }
    }

    // Obtener productos para POS
    const saleIds = (posTransactions || []).map(s => s.id);
    let saleItems = [];
    if (saleIds.length > 0) {
      console.log('🛍️ Consultando productos vendidos...');
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('sale_id, product_name, quantity, unit_price, total_price')
        .in('sale_id', saleIds);
      
      if (!itemsError) {
        saleItems = itemsData || [];
      }
    }

    // Obtener métodos de pago para POS
    let posPayments = [];
    if (saleIds.length > 0) {
      console.log('💳 Consultando métodos de pago POS...');
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('sale_payment_details')
        .select('sale_id, payment_method, amount, commission_amount')
        .in('sale_id', saleIds)
        .neq('is_partial_payment', true);
      
      if (!paymentsError) {
        posPayments = paymentsData || [];
      }
    }

    // Obtener planes de membresía
    const planIds = [...new Set((membershipTransactions || []).map(m => m.planid).filter(Boolean))];
    let membershipPlans = [];
    if (planIds.length > 0) {
      console.log('🎫 Consultando planes de membresía...');
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('id, name, description')
        .in('id', planIds);
      
      if (!plansError) {
        membershipPlans = plansData || [];
      }
    }

    // 📊 5. PROCESAR Y FORMATEAR DATOS
    console.log('📊 Procesando datos para frontend...');

    // Helper para encontrar datos
    const findCustomer = (id: string) => customers.find(c => c.id === id);
    const findPlan = (id: string) => membershipPlans.find(p => p.id === id);
    const getItemsForSale = (saleId: string) => saleItems.filter(item => item.sale_id === saleId);
    const getPaymentsForSale = (saleId: string) => posPayments.filter(payment => payment.sale_id === saleId);

   
    // 🛒 PROCESAR VENTAS POS - CORREGIDO
    const processedPOS = [];
    (posTransactions || []).forEach(sale => {
      const customer = findCustomer(sale.customer_id);
      const items = getItemsForSale(sale.id);
      const payments = getPaymentsForSale(sale.id);

      // Para cada método de pago de la venta
      payments.forEach((payment, index) => {
        const productNames = items.map(item => 
          `${item.product_name} (${item.quantity}x)`
        ).join(', ') || 'Venta POS';

        // ✅ CALCULAR MONTO TOTAL CON COMISIÓN INCLUIDA
        const baseAmount = parseFloat(payment.amount || 0);
        const commissionAmount = parseFloat(payment.commission_amount || 0);
        const totalAmountWithCommission = baseAmount + commissionAmount;

        processedPOS.push({
          id: `pos_${sale.id}_${index}`,
          type: 'pos',
          sale_id: sale.id,
          sale_number: sale.sale_number,
          product_name: productNames,
          quantity: items.reduce((sum, item) => sum + item.quantity, 0) || 1,
          unit_price: totalAmountWithCommission, // ✅ PRECIO CON COMISIÓN
          customer_name: customer 
            ? `${customer.firstName} ${customer.lastName || ''}`.trim()
            : 'Cliente General',
          customer_phone: customer?.whatsapp,
          payment_method: payment.payment_method,
          amount: totalAmountWithCommission, // ✅ MONTO CON COMISIÓN INCLUIDA
          base_amount: baseAmount, // ✅ MONTO BASE SIN COMISIÓN
          commission_amount: commissionAmount, // ✅ COMISIÓN PARA MOSTRAR COMO INFO
          created_at: sale.created_at,
          reference: sale.sale_number,
          notes: sale.notes,
          status: sale.status
        });
      });
    });

    // 💰 PROCESAR ABONOS - CORREGIDO
    const processedAbonos = [];
    (abonosTransactions || []).forEach(abono => {
      // ✅ CALCULAR MONTO TOTAL CON COMISIÓN INCLUIDA
      const baseAmount = parseFloat(abono.amount || 0);
      const commissionAmount = parseFloat(abono.commission_amount || 0);
      const totalAmountWithCommission = baseAmount + commissionAmount;

      processedAbonos.push({
        id: `abono_${abono.id}`,
        type: 'abono',
        sale_id: abono.sale_id,
        product_name: 'Abono a apartado',
        customer_name: 'Cliente',
        customer_phone: null,
        payment_method: abono.payment_method,
        amount: totalAmountWithCommission, // ✅ MONTO CON COMISIÓN INCLUIDA
        base_amount: baseAmount, // ✅ MONTO BASE SIN COMISIÓN
        commission_amount: commissionAmount, // ✅ COMISIÓN PARA MOSTRAR COMO INFO
        created_at: abono.payment_date,
        reference: abono.sale_id,
        notes: abono.notes,
        status: 'completed',
        is_partial_payment: true
      });
    });

    // 🎫 PROCESAR MEMBRESÍAS - MANTENER IGUAL (YA ESTÁ BIEN)
    const processedMemberships = [];
    (membershipTransactions || []).forEach(membership => {
      const customer = findCustomer(membership.userid);
      const plan = findPlan(membership.planid);
      
      processedMemberships.push({
        id: `membership_${membership.id}`,
        type: 'membership',
        membership_id: membership.id,
        membership_type: plan?.name || 'Membresía',
        membership_duration: membership.payment_type || 'N/A',
        customer_name: customer 
          ? `${customer.firstName} ${customer.lastName || ''}`.trim()
          : 'Cliente',
        customer_phone: customer?.whatsapp,
        payment_method: membership.payment_method,
        amount: parseFloat(membership.amount_paid || 0), // ✅ TOTAL PAGADO (YA INCLUYE TODO)
        commission_amount: parseFloat(membership.commission_amount || 0), // ✅ COMISIÓN SOLO INFORMATIVA
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
      },
      debug: {
        customers_found: customers.length,
        sale_items_found: saleItems.length,
        pos_payments_found: posPayments.length,
        membership_plans_found: membershipPlans.length
      }
    };

    console.log('🎉 API transaction-details completada exitosamente');
    console.log('📊 Totales:', response.totals);
    console.log('🔍 Debug:', response.debug);
    
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
        success: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
