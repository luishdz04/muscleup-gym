import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Calendar, DollarSign, Users, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

// Simular las funciones de consulta (reemplaza con las imports reales)
const getDashboardMetrics = async (fechas) => {
  // Simular datos
  return {
    totalIngresos: 85000,
    totalGastos: 45000,
    utilidadNeta: 40000,
    membresiasTotales: 150,
    membresiasActivas: 142,
    membresiasVencidas: 8,
    ingresosMembresías: 65000,
    ventasPOSTotales: 20000,
    apartadosActivos: 12,
    apartadosPendientes: 8500,
    productosVendidos: 340,
    usuariosTotales: 180,
    usuariosActivos: 142,
    nuevosUsuarios: 25
  };
};

const getVentasPorMetodo = async (fechas) => [
  { metodo: 'Efectivo', total: 32000, transacciones: 45, comisiones: 0 },
  { metodo: 'Transferencia', total: 28000, transacciones: 38, comisiones: 560 },
  { metodo: 'Débito', total: 15000, transacciones: 22, comisiones: 450 },
  { metodo: 'Crédito', total: 10000, transacciones: 18, comisiones: 800 }
];

const getVentasPorCategoria = async (fechas) => [
  { categoria: 'Suplementos', total: 15000, cantidad: 120, productos: 45 },
  { categoria: 'Bebidas', total: 8000, cantidad: 200, productos: 80 },
  { categoria: 'Snacks', total: 5000, cantidad: 150, productos: 60 },
  { categoria: 'Accesorios', total: 12000, cantidad: 80, productos: 35 }
];

const getGastosPorTipo = async (fechas) => [
  { tipo: 'nomina', total: 25000, transacciones: 15, porcentaje: 55.6 },
  { tipo: 'servicios', total: 8000, transacciones: 8, porcentaje: 17.8 },
  { tipo: 'suplementos', total: 6000, transacciones: 12, porcentaje: 13.3 },
  { tipo: 'mantenimiento', total: 4000, transacciones: 5, porcentaje: 8.9 },
  { tipo: 'otros', total: 2000, transacciones: 6, porcentaje: 4.4 }
];

const getVentasDiarias = async (fechas) => [
  { fecha: '2025-06-01', membresías: 8000, pos: 2500, abonos: 1500, gastos: 3000, neto: 9000 },
  { fecha: '2025-06-02', membresías: 12000, pos: 3200, abonos: 800, gastos: 2800, neto: 13200 },
  { fecha: '2025-06-03', membresías: 6000, pos: 2800, abonos: 1200, gastos: 3500, neto: 6500 },
  { fecha: '2025-06-04', membresías: 15000, pos: 4500, abonos: 2000, gastos: 4200, neto: 17300 },
  { fecha: '2025-06-05', membresías: 9000, pos: 3800, abonos: 1800, gastos: 3800, neto: 10800 }
];

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

  useEffect(() => {
    cargarDatos();
  }, [fechas]);

  const cargarDatos = async () => {
    setLoading(true);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Reportes y Analytics</h1>
          
          {/* Filtros de fecha */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Desde:</label>
                <input
                  type="date"
                  value={fechas.fechaInicio}
                  onChange={(e) => setFechas(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Hasta:</label>
                <input
                  type="date"
                  value={fechas.fechaFin}
                  onChange={(e) => setFechas(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={cargarDatos}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
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
            icon={DollarSign}
            change="+12.5%"
            changeType="positive"
          />
          <MetricCard
            title="Utilidad Neta"
            value={formatCurrency(metrics?.utilidadNeta || 0)}
            icon={TrendingUp}
            change="+8.2%"
            changeType="positive"
          />
          <MetricCard
            title="Membresías Activas"
            value={metrics?.membresiasActivas || 0}
            icon={Users}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Ventas Diarias</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Ventas por Método de Pago</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasMetodo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ metodo, porcentaje }) => `${metodo} (${((porcentaje || 0) * 100).toFixed(1)}%)`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🛍️ Ventas por Categoría</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💸 Gastos por Tipo</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Usuarios</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Membresías</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Apartados</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Resumen Financiero</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.totalIngresos || 0)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.totalGastos || 0)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Utilidad Neta</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.utilidadNeta || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
