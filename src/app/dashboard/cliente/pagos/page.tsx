"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCreditCard, 
  FaCheckCircle, 
  FaTimesCircle,
  FaDownload,
  FaCalendar,
  FaMoneyBillWave
} from 'react-icons/fa';

interface Pago {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  estado: 'pagado' | 'pendiente' | 'cancelado';
  metodoPago: string;
  factura?: string;
}

const pagos: Pago[] = [
  {
    id: "PAY-2025-001",
    fecha: "2025-01-15",
    concepto: "Mensualidad Regular - Enero",
    monto: 530,
    estado: 'pagado',
    metodoPago: "Tarjeta de Crédito",
    factura: "FAC-2025-001"
  },
  {
    id: "PAY-2024-012",
    fecha: "2024-12-15",
    concepto: "Mensualidad Regular - Diciembre",
    monto: 530,
    estado: 'pagado',
    metodoPago: "Efectivo",
    factura: "FAC-2024-012"
  },
  {
    id: "PAY-2024-011",
    fecha: "2024-11-15",
    concepto: "Mensualidad Regular - Noviembre",
    monto: 530,
    estado: 'pagado',
    metodoPago: "Transferencia",
    factura: "FAC-2024-011"
  }
];

export default function PagosPage() {
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <FaCheckCircle className="text-green-500" />;
      case 'pendiente':
        return <FaTimesCircle className="text-yellow-500" />;
      case 'cancelado':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'text-green-500';
      case 'pendiente':
        return 'text-yellow-500';
      case 'cancelado':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Historial de <span className="text-[#FFCC00]">Pagos</span>
        </h1>
        <p className="text-gray-400">Gestiona y revisa tus pagos de membresías</p>
      </motion.div>

      {/* Resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total pagado este año</p>
              <p className="text-2xl font-bold text-white">$1,590</p>
            </div>
            <FaMoneyBillWave className="text-3xl text-[#FFCC00]" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pagos realizados</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <FaCreditCard className="text-3xl text-[#FFCC00]" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Próximo pago</p>
              <p className="text-2xl font-bold text-white">15 Feb</p>
            </div>
            <FaCalendar className="text-3xl text-[#FFCC00]" />
          </div>
        </div>
      </motion.div>

      {/* Tabla de Pagos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-[#FFCC00]">Historial de Transacciones</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">ID</th>
                <th className="text-left p-4 text-gray-400 font-medium">Fecha</th>
                <th className="text-left p-4 text-gray-400 font-medium">Concepto</th>
                <th className="text-left p-4 text-gray-400 font-medium">Monto</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                <th className="text-left p-4 text-gray-400 font-medium">Método</th>
                <th className="text-center p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, index) => (
                <motion.tr
                  key={pago.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-white font-mono text-sm">{pago.id}</td>
                  <td className="p-4 text-white">
                    {new Date(pago.fecha).toLocaleDateString('es-MX')}
                  </td>
                  <td className="p-4 text-white">{pago.concepto}</td>
                  <td className="p-4 text-white font-bold">${pago.monto}</td>
                  <td className="p-4">
                    <div className={`flex items-center gap-2 ${getEstadoColor(pago.estado)}`}>
                      {getEstadoIcon(pago.estado)}
                      <span className="capitalize">{pago.estado}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">{pago.metodoPago}</td>
                  <td className="p-4 text-center">
                    {pago.factura && (
                      <button className="text-[#FFCC00] hover:text-yellow-500 transition-colors">
                        <FaDownload className="text-lg" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
