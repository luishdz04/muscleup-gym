'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  CalendarToday,
  AttachMoney,
  People,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Refresh,
  Assessment,
  CreditCard,
  Category,
  AccountBalance
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Inicializar cliente de Supabase
const supabase = createBrowserSupabaseClient();

// ============= FUNCIONES DE CONSULTA REALES =============

const getDashboardMetrics = async (fechas) => {
  try {
    console.log('📊 Obteniendo métricas del dashboard...', fechas);

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

    console.log('✅ Métricas obtenidas:', { totalIngresos, totalGastos, ingresosMembresías, ingresosVentas });

    return {
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      membresiasTotales: membresías?.length || 0,
      membresiasActivas: membresiasActivas?.length || 0,
      membresiasVencidas: 0,
      ingresosMembresías,
      ventasPOSTotales: ingresosVentas,
      apartadosActivos: apartados?.length || 0,
      apartadosPendientes: apartados?.reduce((sum, a) => sum + (Number(a.pending_amount) || 0), 0) || 0,
      productosVendidos: ventas?.length || 0,
      usuariosTotales: usuariosTotales || 0,
      usuariosActivos: new Set(membresiasActivas?.map(u => u.userid)).size || 0,
      nuevosUsuarios: 0
    };
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
    return {
      totalIngresos: 0, totalGastos: 0, utilidadNeta: 0, membresiasTotales: 0,
      membresiasActivas: 0, membresiasVencidas: 0, ingresosMembresías: 0,
      ventasPOSTotales: 0, apartadosActivos: 0, apartadosPendientes: 0,
      productosVendidos: 0, usuariosTotales: 0, usuariosActivos: 0, nuevosUsuarios: 0
    };
  }
};

const getVentasPorMetodo = async (fechas) => {
  try {
    console.log('💳 Obteniendo ventas por método de pago...');

    // Ventas POS
    const { data: ventasPOS, error: errorPOS } = await supabase
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

    if (errorPOS) throw errorPOS;

    // Membresías
    const { data: ventasMembresías, error: errorMembresías } = await supabase
      .from('membership_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        user_memberships!inner(created_at)
      `)
      .gte('user_memberships.created_at', fechas.fechaInicio)
      .lte('user_memberships.created_at', fechas.fechaFin);

    if (errorMembresías) throw errorMembresías;

    // Combinar y agrupar por método
    const metodosMap = new Map();

    ventasPOS?.forEach(venta => {
      const metodo = venta.payment_method || 'Sin especificar';
      const existing = metodosMap.get(metodo) || { metodo, total: 0, transacciones: 0, comisiones: 0 };
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    ventasMembresías?.forEach(venta => {
      const metodo = venta.payment_method || 'Sin especificar';
      const existing = metodosMap.get(metodo) || { metodo, total: 0, transacciones: 0, comisiones: 0 };
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    const resultado = Array.from(metodosMap.values()).sort((a, b) => b.total - a.total);
    console.log('✅ Ventas por método obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas por método:', error);
    return [];
  }
};

const getVentasPorCategoria = async (fechas) => {
  try {
    console.log('🛍️ Obteniendo ventas por categoría...');

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

    const categoriasMap = new Map();

    data?.forEach(item => {
      const categoria = item.products?.category || 'Sin categoría';
      const existing = categoriasMap.get(categoria) || { categoria, total: 0, cantidad: 0, productos: 0 };
      existing.total += Number(item.total_price) || 0;
      existing.cantidad += Number(item.quantity) || 0;
      existing.productos += 1;
      categoriasMap.set(categoria, existing);
    });

    const resultado = Array.from(categoriasMap.values()).sort((a, b) => b.total - a.total);
    console.log('✅ Ventas por categoría obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas por categoría:', error);
    return [];
  }
};

const getGastosPorTipo = async (fechas) => {
  try {
    console.log('💸 Obteniendo gastos por tipo...');

    const { data, error } = await supabase
      .from('expenses')
      .select('expense_type, amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    if (error) throw error;

    const tiposMap = new Map();
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

    const resultado = Array.from(tiposMap.entries()).map(([tipo, datos]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      total: datos.total,
      transacciones: datos.count,
      porcentaje: totalGeneral > 0 ? (datos.total / totalGeneral) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    console.log('✅ Gastos por tipo obtenidos:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo gastos por tipo:', error);
    return [];
  }
};

const getVentasDiarias = async (fechas) => {
  try {
    console.log('📈 Obteniendo ventas diarias...');

    const { data: cortes, error } = await supabase
      .from('cash_cuts')
      .select('*')
      .gte('cut_date', fechas.fechaInicio)
      .lte('cut_date', fechas.fechaFin)
      .order('cut_date');

    if (error) throw error;

    const resultado = cortes?.map(corte => ({
      fecha: new Date(corte.cut_date).toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric' 
      }),
      membresías: Number(corte.membership_total) || 0,
      pos: Number(corte.pos_total) || 0,
      abonos: Number(corte.abonos_total) || 0,
      gastos: Number(corte.expenses_amount) || 0,
      neto: Number(corte.final_balance) || 0
    })) || [];

    console.log('✅ Ventas diarias obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas diarias:', error);
    return [];
  }
};

// Componentes auxiliares
const MetricCard = ({ title, value, icon: Icon, change, changeType = 'positive' }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center mt-2 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? 
              <TrendingUp className="w-4 h-4 mr-1" /> : 
              <TrendingDown className="w-4 h-4 mr-1" />
            }
            {change}
          </div>
        )}
      </div>
      <Icon className="w-8 h-8 text-blue-500" />
    </div>
  </div>
);

const formatCurrency = (value) => 
  new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(value);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportesPage() {
  const [fechas, setFechas] = useState({
    fechaInicio: '2025-06-01',
    fechaFin: '2025-06-30'
  });
  
  const [metrics, setMetrics] = useState(null);
  const [ventasMetodo, setVentasMetodo] = useState([]);
  const [ventasCategoria, setVentasCategoria] = useState([]);
  const [gastosTipo, setGastosTipo] = useState([]);
  const [ventasDiarias, setVentasDiarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [fechas]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, ventasMetodoData, ventasCategoriaData, gastosTipoData, ventasDiariasData] = 
        await Promise.all([
          getDashboardMetrics(fechas),
          getVentasPorMetodo(fechas),
          getVentasPorCategoria(fechas),
          getGastosPorTipo(fechas),
          getVentasDiarias(fechas)
        ]);

      setMetrics(metricsData);
      setVentasMetodo(ventasMetodoData);
      setVentasCategoria(ventasCategoriaData);
      setGastosTipo(gastosTipoData);
      setVentasDiarias(ventasDiariasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos. Verifica tu conexión a Supabase.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={cargarDatos}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
          >
            Reintentar
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <p>Verifica que:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Las variables de entorno de Supabase estén configuradas</li>
              <li>• La conexión a internet esté activa</li>
              <li>• Las tablas existan en tu base de datos</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Assessment className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Analytics</h1>
          </div>
          
          {/* Filtros de fecha */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center space-x-4">
              <CalendarToday className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Desde:</label>
                <input
                  type="date"
                  value={fechas.fechaInicio}
                  onChange={(e) => setFechas(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Hasta:</label>
                <input
                  type="date"
                  value={fechas.fechaFin}
                  onChange={(e) => setFechas(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={cargarDatos}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Refresh className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Ingresos Totales"
            value={formatCurrency(metrics?.totalIngresos || 0)}
            icon={AttachMoney}
            change="+12.5%"
            changeType="positive"
          />
          <MetricCard
            title="Utilidad Neta"
            value={formatCurrency(metrics?.utilidadNeta || 0)}
            icon={AccountBalance}
            change="+8.2%"
            changeType="positive"
          />
          <MetricCard
            title="Membresías Activas"
            value={metrics?.membresiasActivas || 0}
            icon={People}
            change="+15 nuevas"
            changeType="positive"
          />
          <MetricCard
            title="Ventas POS"
            value={formatCurrency(metrics?.ventasPOSTotales || 0)}
            icon={ShoppingCart}
            change="-2.1%"
            changeType="negative"
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ventas diarias */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ventas Diarias</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasDiarias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="membresías" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="pos" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="neto" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ventas por método de pago */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ventas por Método de Pago</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasMetodo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ metodo, total }) => {
                    const totalGeneral = ventasMetodo.reduce((sum, item) => sum + item.total, 0);
                    const porcentaje = totalGeneral > 0 ? (total / totalGeneral * 100).toFixed(1) : '0';
                    return `${metodo} (${porcentaje}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {ventasMetodo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ventas por categoría */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Category className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ventas por Categoría</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gastos por tipo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Gastos por Tipo</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métricas adicionales en grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <People className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{metrics?.usuariosTotales || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Activos:</span>
                <span className="font-semibold text-green-600">{metrics?.usuariosActivos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nuevos:</span>
                <span className="font-semibold text-blue-600">{metrics?.nuevosUsuarios || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Membresías</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vendidas:</span>
                <span className="font-semibold">{metrics?.membresiasTotales || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Activas:</span>
                <span className="font-semibold text-green-600">{metrics?.membresiasActivas || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ingresos:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(metrics?.ingresosMembresías || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Apartados</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Activos:</span>
                <span className="font-semibold">{metrics?.apartadosActivos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pendiente:</span>
                <span className="font-semibold text-orange-600">{formatCurrency(metrics?.apartadosPendientes || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos:</span>
                <span className="font-semibold">{metrics?.productosVendidos || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AccountBalance className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resumen Financiero</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <AttachMoney className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.totalIngresos || 0)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.totalGastos || 0)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Assessment className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Utilidad Neta</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.utilidadNeta || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
