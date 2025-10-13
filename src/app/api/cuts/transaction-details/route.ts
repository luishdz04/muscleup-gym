import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateRange } from '@/utils/dateUtils';

type SupabaseJoinResult<T> = T | T[] | null | undefined;

function extractSingleRecord<T>(value: SupabaseJoinResult<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] as T) : null;
  }
  return value;
}

function buildCustomerName(customer: any, fallback: string) {
  if (!customer) return fallback;

  const first = typeof customer.firstName === 'string' ? customer.firstName.trim() : '';
  const last = typeof customer.lastName === 'string' ? customer.lastName.trim() : '';
  const displayName = [first, last].filter(Boolean).join(' ');

  if (displayName) return displayName;

  if (typeof customer.name === 'string' && customer.name.trim()) {
    return customer.name.trim();
  }

  if (typeof customer.whatsapp === 'string' && customer.whatsapp.trim()) {
    return customer.whatsapp.trim();
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');




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
    const { startISO, endISO } = getMexicoDateRange(date);



    // 🛒 1. TRANSACCIONES POS (VENTAS COMPLETAS) - CON JOINS

    const { data: posTransactions, error: posError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        status,
        created_at,
        notes,
        customer:Users!sales_customer_id_fkey (
          id,
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
          payment_reference
        )
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (posError) {
      console.error('❌ Error consultando ventas POS:', posError);
    }



    // 💰 2. TRANSACCIONES ABONOS (PAGOS PARCIALES)

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
        is_partial_payment,
        sales:sale_id (
          id,
          sale_number,
          status,
          created_at,
          customer:Users!sales_customer_id_fkey (
            id,
            firstName,
            lastName,
            whatsapp
          )
        )
      `)
      .eq('is_partial_payment', true)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
    }



    // 🎫 3. TRANSACCIONES MEMBRESÍAS - CON JOINS (igual que el historial)
    // Primero obtenemos los IDs de membresías que tuvieron pagos hoy



    
    // ⚠️ CRÍTICO: membership_payment_details.created_at es timestamp WITHOUT timezone
    // La BD guarda timestamps en UTC pero la columna no tiene zona horaria
    // Cuando guardamos "2025-10-07 20:10:39" (8:10 PM México), se guarda como "2025-10-08 02:10:39" (UTC)
    // Para buscar el día 7 de octubre en México, buscamos desde "2025-10-08 00:00:00" hasta "2025-10-08 23:59:59"
    // (porque en UTC, el día 7 de México va desde las 06:00 del día 7 hasta las 05:59 del día 8)
    
    // Obtener TODOS los pagos sin filtro de fecha primero para debug
    const { data: allPayments } = await supabase
      .from('membership_payment_details')
      .select('membership_id, created_at, amount')
      .order('created_at', { ascending: false })
      .limit(10);
    

    
    const { data: membershipPaymentsOfDay, error: paymentsError } = await supabase
      .from('membership_payment_details')
      .select('membership_id, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (paymentsError) {
      console.error('❌ Error consultando pagos de membresías:', paymentsError);
    }


    
    const uniqueMembershipIdsFromPayments = [...new Set((membershipPaymentsOfDay || []).map(p => p.membership_id))];


    // Ahora obtener la info completa CON JOINS (como en historial)
    let membershipTransactions: any[] = [];
    if (uniqueMembershipIdsFromPayments.length > 0) {
      const { data: membershipsData, error: membershipError } = await supabase
        .from('user_memberships')
        .select(`
          id,
          userid,
          plan_id,
          payment_type,
          start_date,
          end_date,
          status,
          created_at,
          notes,
          Users!userid (
            id,
            firstName,
            lastName,
            whatsapp
          ),
          membership_plans!plan_id (
            id,
            name,
            description
          ),
          membership_payment_details!membership_id (
            id,
            payment_method,
            amount,
            commission_amount,
            sequence_order,
            created_at
          )
        `)
        .in('id', uniqueMembershipIdsFromPayments);

      if (membershipError) {
        console.error('❌ Error consultando membresías:', membershipError);
      }

      membershipTransactions = membershipsData || [];

    }

    // 📊 4. PROCESAR Y FORMATEAR DATOS (Los datos ya vienen relacionados de Supabase)


    // 🛒 PROCESAR VENTAS POS (datos ya relacionados)
    const processedPOS: any[] = [];
    (posTransactions || []).forEach(sale => {
      const customer = extractSingleRecord(sale.customer);
      const items = Array.isArray(sale.sale_items) ? sale.sale_items : [];
      const payments = Array.isArray(sale.sale_payment_details) ? sale.sale_payment_details : [];

      // Para cada método de pago de la venta
      payments.forEach((payment: any, index: number) => {
        const productNames = items.map((item: any) => 
          `${item.product_name} (${item.quantity}x)`
        ).join(', ') || 'Venta POS';

        // IMPORTANTE: El 'amount' ya incluye la comisión
        const amount = parseFloat(payment.amount || 0);
        const commissionAmount = parseFloat(payment.commission_amount || 0);

        // ✅ Agregar 'Z' al timestamp para indicar que es UTC
        const createdAtUTC = sale.created_at.endsWith('Z') 
          ? sale.created_at 
          : sale.created_at + 'Z';

        processedPOS.push({
          id: `pos_${sale.id}_${index}`,
          type: 'pos',
          sale_id: sale.id,
          sale_number: sale.sale_number,
          product_name: productNames,
          quantity: items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1,
          unit_price: amount,
          customer_name: buildCustomerName(customer, 'Cliente General'),
          customer_phone: customer?.whatsapp ?? null,
          payment_method: payment.payment_method,
          amount: amount,
          base_amount: amount - commissionAmount,
          commission_amount: commissionAmount,
          created_at: createdAtUTC, // ✅ FECHA UTC con indicador Z
          reference: sale.sale_number,
          notes: sale.notes,
          status: sale.status
        });
      });
    });

    // 💰 PROCESAR ABONOS
  const processedAbonos: any[] = [];
  (abonosTransactions || []).forEach(abono => {
      // IMPORTANTE: El 'amount' ya incluye la comisión
      const amount = parseFloat(abono.amount || 0);
      const commissionAmount = parseFloat(abono.commission_amount || 0);

      const paymentDateRaw = typeof abono.payment_date === 'string'
        ? abono.payment_date
        : abono.payment_date instanceof Date
          ? abono.payment_date.toISOString()
          : new Date().toISOString();

      // ✅ Agregar 'Z' al timestamp para indicar que es UTC
      const createdAtUTC = paymentDateRaw.endsWith('Z')
        ? paymentDateRaw
        : `${paymentDateRaw}Z`;

      const saleData = extractSingleRecord(abono.sales);
      const customerData = extractSingleRecord(saleData?.customer);

      const customerPhone = customerData?.whatsapp ?? null;
      const customerName = buildCustomerName(customerData, 'Cliente');

      const saleReference = saleData?.sale_number || abono.sale_id;

      processedAbonos.push({
        id: `abono_${abono.id}`,
        type: 'abono',
        sale_id: abono.sale_id,
        product_name: saleData?.sale_number
          ? `Abono a venta ${saleData.sale_number}`
          : 'Abono a apartado',
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: abono.payment_method,
        amount: amount, // El monto ya incluye comisión
        base_amount: amount - commissionAmount, // Monto sin comisión
        commission_amount: commissionAmount, // Comisión informativa
        created_at: createdAtUTC, // ✅ FECHA UTC con indicador Z
        reference: saleReference,
        notes: abono.notes,
        status: saleData?.status || 'completed',
        is_partial_payment: abono.is_partial_payment ?? true
      });
    });

    // 🎫 PROCESAR MEMBRESÍAS (datos ya relacionados)
    const processedMemberships: any[] = [];
    
    (membershipTransactions || []).forEach(membership => {
      const customer = extractSingleRecord(membership.Users);
      const plan = extractSingleRecord(membership.membership_plans);
      const payments = Array.isArray(membership.membership_payment_details)
        ? membership.membership_payment_details
        : [];

      // Filtrar solo los pagos del día actual
      const paymentsOfDay = payments.filter((payment: any) => {
        const paymentDate = payment.created_at;
        return paymentDate >= startISO && paymentDate <= endISO;
      });

      // Para cada método de pago de la membresía (solo del día)
      paymentsOfDay.forEach((payment: any, index: number) => {
        const amount = parseFloat(payment.amount || 0);
        const commissionAmount = parseFloat(payment.commission_amount || 0);

        // ✅ Agregar 'Z' al timestamp para indicar que es UTC
        const createdAtUTC = payment.created_at.endsWith('Z') 
          ? payment.created_at 
          : payment.created_at + 'Z';

        processedMemberships.push({
          id: `membership_${membership.id}_${index}`,
          type: 'membership',
          membership_id: membership.id,
          membership_type: plan?.name || 'Membresía',
          membership_duration: membership.payment_type || 'N/A',
          customer_name: buildCustomerName(customer, 'Cliente'),
          customer_phone: customer?.whatsapp ?? null,
          payment_method: payment.payment_method,
          amount: amount,
          base_amount: amount - commissionAmount,
          commission_amount: commissionAmount,
          created_at: createdAtUTC, // ✅ FECHA UTC con indicador Z
          reference: membership.id,
          notes: membership.notes,
          status: membership.status,
          payment_sequence: payment.sequence_order || 1
        });
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
        pos_raw_count: posTransactions?.length || 0,
        membership_raw_count: membershipTransactions?.length || 0,
        abonos_raw_count: abonosTransactions?.length || 0,
        membership_payments_of_day: membershipPaymentsOfDay?.length || 0
      }
    };




    
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
