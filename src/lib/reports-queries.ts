// lib/reports-queries.ts
import { supabase } from './supabase';
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

// ============= MÉTRICAS PRINCIPALES =============
export async function getDashboardMetrics(fechas: RangoFechas): Promise<DashboardMetrics> {
  try {
    // Ingresos por membresías
    const { data: membresías, error: errorMembresías } = await supabase
      .from('user_memberships')
      .select('amount_paid, status')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin);

    if (errorMembresías) throw errorMembresías;

    // Ingresos por ventas POS
    const { data: ventas, error: errorVentas } = await supabase
      .from('sales')
      .select('total_amount, status, sale_type')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin)
      .eq('status', 'completed');

    if (errorVentas) throw errorVentas;

    // Gastos totales
    const { data: gastos, error: errorGastos } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    if (errorGastos) throw errorGastos;

    // Usuarios totales
    const { count: usuariosTotales, error: errorUsuarios } = await supabase
      .from('Users')
      .select('*', { count: 'exact', head: true });

    if (errorUsuarios) throw errorUsuarios;

    // Membresías activas
    const { data: membresiasActivas, error: errorMembresiasActivas } = await supabase
      .from('user_memberships')
      .select('userid, status')
      .eq('status', 'active');

    if (errorMembresiasActivas) throw errorMembresiasActivas;

    // Apartados activos
    const { data: apartados, error: errorApartados } = await supabase
      .from('sales')
      .select('pending_amount, status')
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'partial']);

    if (errorApartados) throw errorApartados;

    // Calcular métricas
    const ingresosMembresías = membresías?.reduce((sum, m) => sum + (Number(m.amount_paid) || 0), 0) || 0;
    const ingresosVentas = ventas?.filter(v => v.sale_type !== 'layaway')
      .reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0) || 0;
    const totalIngresos = ingresosMembresías + ingresosVentas;
    const totalGastos = gastos?.reduce((sum, g) => sum + (Number(g.amount) || 0), 0) || 0;

    return {
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      membresiasTotales: membresías?.length || 0,
      membresiasActivas: membresiasActivas?.length || 0,
      membresiasVencidas: 0, // TODO: Calcular según end_date
      ingresosMembresías,
      ventasPOSTotales: ingresosVentas,
      apartadosActivos: apartados?.length || 0,
      apartadosPendientes: apartados?.reduce((sum, a) => sum + (Number(a.pending_amount) || 0), 0) || 0,
      productosVendidos: ventas?.length || 0,
      usuariosTotales: usuariosTotales || 0,
      usuariosActivos: new Set(membresiasActivas?.map(u => u.userid)).size || 0,
      nuevosUsuarios: 0 // TODO: Calcular por fecha de creación
    };
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    // Retornar valores por defecto en caso de error
    return {
      totalIngresos: 0,
      totalGastos: 0,
      utilidadNeta: 0,
      membresiasTotales: 0,
      membresiasActivas: 0,
      membresiasVencidas: 0,
      ingresosMembresías: 0,
      ventasPOSTotales: 0,
      apartadosActivos: 0,
      apartadosPendientes: 0,
      productosVendidos: 0,
      usuariosTotales: 0,
      usuariosActivos: 0,
      nuevosUsuarios: 0
    };
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

    // Procesar ventas POS
    ventasPOS?.forEach(venta => {
      const metodo = venta.payment_method;
      const existing = metodosMap.get(metodo) || { 
        metodo, 
        total: 0, 
        transacciones: 0, 
        comisiones: 0 
      };
      
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    // Procesar ventas de membresías
    ventasMembresías?.forEach(venta => {
      const metodo = venta.payment_method;
      const existing = metodosMap.get(metodo) || { 
        metodo, 
        total: 0, 
        transacciones: 0, 
        comisiones: 0 
      };
      
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    return Array.from(metodosMap.values()).sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Error obteniendo ventas por método:', error);
    return [];
  }
}

// ============= VENTAS POR CATEGORÍA =============
export async function getVentasPorCategoria(fechas: RangoFechas): Promise<VentasPorCategoria[]> {
  try {
    const { data, error } = await supabase
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

    if (error) throw error;

    const categoriasMap = new Map<string, VentasPorCategoria>();

    data?.forEach(item => {
      const categoria = item.products.category || 'Sin categoría';
      const existing = categoriasMap.get(categoria) || {
        categoria,
        total: 0,
        cantidad: 0,
        productos: 0
      };

      existing.total += Number(item.total_price) || 0;
      existing.cantidad += Number(item.quantity) || 0;
      existing.productos += 1;
      categoriasMap.set(categoria, existing);
    });

    return Array.from(categoriasMap.values()).sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    return [];
  }
}

// ============= GASTOS POR TIPO =============
export async function getGastosPorTipo(fechas: RangoFechas): Promise<GastosPorTipo[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_type, amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    if (error) throw error;

    const tiposMap = new Map<string, { total: number; count: number }>();
    let totalGeneral = 0;

    data?.forEach(gasto => {
      const tipo = gasto.expense_type || 'otros';
      const amount = Number(gasto.amount) || 0;
      const existing = tiposMap.get(tipo) || { total: 0, count: 0 };
      
      existing.total += amount;
      existing.count += 1;
      totalGeneral += amount;
      tiposMap.set(tipo, existing);
    });

    return Array.from(tiposMap.entries()).map(([tipo, datos]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1), // Capitalizar primera letra
      total: datos.total,
      transacciones: datos.count,
      porcentaje: totalGeneral > 0 ? (datos.total / totalGeneral) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Error obteniendo gastos por tipo:', error);
    return [];
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
