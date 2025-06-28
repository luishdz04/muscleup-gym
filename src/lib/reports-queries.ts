// lib/reports-queries.ts
import { createClient } from '@supabase/supabase-js';
import type { 
  DashboardMetrics, 
  VentasPorMetodo, 
  VentasPorCategoria,
  GastosPorTipo,
  MembresiasPorPlan,
  VentasDiarias,
  CorteResumen,
  ProductoVendido,
  ApartadoDetalle,
  RangoFechas 
} from '@/types/reports';

// Inicializar Supabase (ajusta con tus credenciales)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============= MÉTRICAS PRINCIPALES =============
export async function getDashboardMetrics(fechas: RangoFechas): Promise<DashboardMetrics> {
  try {
    // Ingresos por membresías
    const { data: membresías } = await supabase
      .from('user_memberships')
      .select('amount_paid')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin);

    // Ingresos por ventas POS
    const { data: ventas } = await supabase
      .from('sales')
      .select('total_amount, status')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin)
      .eq('status', 'completed');

    // Gastos totales
    const { data: gastos } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    // Usuarios totales y activos
    const { data: usuariosTotales } = await supabase
      .from('Users')
      .select('id, createdAt')
      .count();

    const { data: usuariosActivos } = await supabase
      .from('user_memberships')
      .select('userid')
      .eq('status', 'active');

    // Membresías activas
    const { data: membresiasActivas } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('status', 'active');

    // Apartados activos
    const { data: apartados } = await supabase
      .from('sales')
      .select('*')
      .eq('sale_type', 'layaway')
      .eq('status', 'pending');

    // Calcular métricas
    const ingresosMembresías = membresías?.reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;
    const ingresosVentas = ventas?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0;
    const totalIngresos = ingresosMembresías + ingresosVentas;
    const totalGastos = gastos?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0;

    return {
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      membresiasTotales: membresías?.length || 0,
      membresiasActivas: membresiasActivas?.length || 0,
      membresiasVencidas: 0, // Calcular según end_date
      ingresosMembresías,
      ventasPOSTotales: ingresosVentas,
      apartadosActivos: apartados?.length || 0,
      apartadosPendientes: apartados?.reduce((sum, a) => sum + (a.pending_amount || 0), 0) || 0,
      productosVendidos: ventas?.length || 0,
      usuariosTotales: usuariosTotales?.length || 0,
      usuariosActivos: new Set(usuariosActivos?.map(u => u.userid)).size || 0,
      nuevosUsuarios: 0 // Calcular por fecha de creación
    };
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    throw error;
  }
}

// ============= VENTAS POR MÉTODO DE PAGO =============
export async function getVentasPorMetodo(fechas: RangoFechas): Promise<VentasPorMetodo[]> {
  try {
    // Ventas POS
    const { data: ventasPOS } = await supabase
      .from('sale_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        sales!inner(created_at, status)
      `)
      .gte('sales.created_at', fechas.fechaInicio)
      .lte('sales.created_at', fechas.fechaFin)
      .eq('sales.status', 'completed');

    // Membresías
    const { data: ventasMembresías } = await supabase
      .from('membership_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        user_memberships!inner(created_at)
      `)
      .gte('user_memberships.created_at', fechas.fechaInicio)
      .lte('user_memberships.created_at', fechas.fechaFin);

    // Combinar y agrupar por método
    const metodosMap = new Map<string, VentasPorMetodo>();

    ventasPOS?.forEach(venta => {
      const metodo = venta.payment_method;
      const existing = metodosMap.get(metodo) || { 
        metodo, 
        total: 0, 
        transacciones: 0, 
        comisiones: 0 
      };
      
      existing.total += venta.amount || 0;
      existing.transacciones += 1;
      existing.comisiones += venta.commission_amount || 0;
      metodosMap.set(metodo, existing);
    });

    ventasMembresías?.forEach(venta => {
      const metodo = venta.payment_method;
      const existing = metodosMap.get(metodo) || { 
        metodo, 
        total: 0, 
        transacciones: 0, 
        comisiones: 0 
      };
      
      existing.total += venta.amount || 0;
      existing.transacciones += 1;
      existing.comisiones += venta.commission_amount || 0;
      metodosMap.set(metodo, existing);
    });

    return Array.from(metodosMap.values());
  } catch (error) {
    console.error('Error obteniendo ventas por método:', error);
    throw error;
  }
}

// ============= VENTAS POR CATEGORÍA =============
export async function getVentasPorCategoria(fechas: RangoFechas): Promise<VentasPorCategoria[]> {
  try {
    const { data } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        total_price,
        products!inner(category),
        sales!inner(created_at, status)
      `)
      .gte('sales.created_at', fechas.fechaInicio)
      .lte('sales.created_at', fechas.fechaFin)
      .eq('sales.status', 'completed');

    const categoriasMap = new Map<string, VentasPorCategoria>();

    data?.forEach(item => {
      const categoria = item.products.category;
      const existing = categoriasMap.get(categoria) || {
        categoria,
        total: 0,
        cantidad: 0,
        productos: 0
      };

      existing.total += item.total_price || 0;
      existing.cantidad += item.quantity || 0;
      existing.productos += 1;
      categoriasMap.set(categoria, existing);
    });

    return Array.from(categoriasMap.values());
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    throw error;
  }
}

// ============= GASTOS POR TIPO =============
export async function getGastosPorTipo(fechas: RangoFechas): Promise<GastosPorTipo[]> {
  try {
    const { data } = await supabase
      .from('expenses')
      .select('expense_type, amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    const tiposMap = new Map<string, { total: number; count: number }>();
    let totalGeneral = 0;

    data?.forEach(gasto => {
      const tipo = gasto.expense_type;
      const existing = tiposMap.get(tipo) || { total: 0, count: 0 };
      
      existing.total += gasto.amount || 0;
      existing.count += 1;
      totalGeneral += gasto.amount || 0;
      tiposMap.set(tipo, existing);
    });

    return Array.from(tiposMap.entries()).map(([tipo, datos]) => ({
      tipo,
      total: datos.total,
      transacciones: datos.count,
      porcentaje: totalGeneral > 0 ? (datos.total / totalGeneral) * 100 : 0
    }));
  } catch (error) {
    console.error('Error obteniendo gastos por tipo:', error);
    throw error;
  }
}

// ============= MEMBRESÍAS POR PLAN =============
export async function getMembresiasPorPlan(fechas: RangoFechas): Promise<MembresiasPorPlan[]> {
  try {
    const { data } = await supabase
      .from('user_memberships')
      .select(`
        amount_paid,
        membership_plans!inner(name, description)
      `)
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin);

    const planesMap = new Map<string, MembresiasPorPlan>();

    data?.forEach(membership => {
      const planNombre = membership.membership_plans.name;
      const existing = planesMap.get(planNombre) || {
        planNombre,
        cantidad: 0,
        ingresos: 0,
        tipoMembresia: membership.membership_plans.description || ''
      };

      existing.cantidad += 1;
      existing.ingresos += membership.amount_paid || 0;
      planesMap.set(planNombre, existing);
    });

    return Array.from(planesMap.values());
  } catch (error) {
    console.error('Error obteniendo membresías por plan:', error);
    throw error;
  }
}

// ============= APARTADOS ACTIVOS =============
export async function getApartadosActivos(): Promise<ApartadoDetalle[]> {
  try {
    const { data } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        paid_amount,
        pending_amount,
        created_at,
        layaway_expires_at,
        status,
        Users!inner(firstName, lastName)
      `)
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'partial']);

    return data?.map(apartado => ({
      id: apartado.id,
      numeroVenta: apartado.sale_number,
      cliente: `${apartado.Users.firstName} ${apartado.Users.lastName || ''}`.trim(),
      total: apartado.total_amount || 0,
      pagado: apartado.paid_amount || 0,
      pendiente: apartado.pending_amount || 0,
      fechaCreacion: apartado.created_at,
      fechaVencimiento: apartado.layaway_expires_at || '',
      status: apartado.status
    })) || [];
  } catch (error) {
    console.error('Error obteniendo apartados:', error);
    throw error;
  }
}

// ============= VENTAS DIARIAS =============
export async function getVentasDiarias(fechas: RangoFechas): Promise<VentasDiarias[]> {
  try {
    const { data: cortes } = await supabase
      .from('cash_cuts')
      .select('*')
      .gte('cut_date', fechas.fechaInicio)
      .lte('cut_date', fechas.fechaFin)
      .order('cut_date');

    return cortes?.map(corte => ({
      fecha: corte.cut_date,
      membresías: corte.membership_total || 0,
      pos: corte.pos_total || 0,
      abonos: corte.abonos_total || 0,
      gastos: corte.expenses_amount || 0,
      neto: corte.final_balance || 0
    })) || [];
  } catch (error) {
    console.error('Error obteniendo ventas diarias:', error);
    throw error;
  }
}
