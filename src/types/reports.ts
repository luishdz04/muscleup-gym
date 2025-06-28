// types/reports.ts
export interface DashboardMetrics {
  // Métricas financieras generales
  totalIngresos: number;
  totalGastos: number;
  utilidadNeta: number;
  
  // Métricas de membresías
  membresiasTotales: number;
  membresiasActivas: number;
  membresiasVencidas: number;
  ingresosMembresías: number;
  
  // Métricas de ventas POS
  ventasPOSTotales: number;
  apartadosActivos: number;
  apartadosPendientes: number;
  productosVendidos: number;
  
  // Métricas de usuarios
  usuariosTotales: number;
  usuariosActivos: number;
  nuevosUsuarios: number;
}

export interface VentasPorMetodo {
  metodo: string;
  total: number;
  transacciones: number;
  comisiones: number;
}

export interface VentasPorCategoria {
  categoria: string;
  total: number;
  cantidad: number;
  productos: number;
}

export interface GastosPorTipo {
  tipo: string;
  total: number;
  transacciones: number;
  porcentaje: number;
}

export interface MembresiasPorPlan {
  planNombre: string;
  cantidad: number;
  ingresos: number;
  tipoMembresia: string;
}

export interface VentasDiarias {
  fecha: string;
  membresías: number;
  pos: number;
  abonos: number;
  gastos: number;
  neto: number;
}

export interface CorteResumen {
  fecha: string;
  totalEfectivo: number;
  totalTransferencia: number;
  totalDebito: number;
  totalCredito: number;
  totalMixto: number;
  grandTotal: number;
  gastos: number;
  saldoFinal: number;
}

export interface ProductoVendido {
  id: string;
  nombre: string;
  categoria: string;
  cantidadVendida: number;
  ingresoTotal: number;
  stockActual: number;
}

export interface ApartadoDetalle {
  id: string;
  numeroVenta: string;
  cliente: string;
  total: number;
  pagado: number;
  pendiente: number;
  fechaCreacion: string;
  fechaVencimiento: string;
  status: string;
}

export interface UsuarioActividad {
  id: string;
  nombre: string;
  ultimoAcceso: string;
  totalAccesos: number;
  tipoMembresia: string;
  statusMembresia: string;
}

export interface RangoFechas {
  fechaInicio: string;
  fechaFin: string;
}

export interface FiltrosReporte {
  rango: RangoFechas;
  tipoReporte: 'general' | 'membresías' | 'ventas' | 'gastos' | 'inventario';
  metodoPago?: string;
  categoria?: string;
  plan?: string;
}
