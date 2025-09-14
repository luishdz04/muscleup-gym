"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaShoppingCart, 
  FaBoxOpen,
  FaTshirt,
  FaBlender,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';

interface Compra {
  id: string;
  fecha: string;
  productos: {
    nombre: string;
    cantidad: number;
    precio: number;
    categoria: string;
  }[];
  total: number;
  estado: 'entregado' | 'procesando' | 'pendiente';
}

const compras: Compra[] = [
  {
    id: "ORD-2025-001",
    fecha: "2025-01-10",
    productos: [
      { nombre: "Proteína Whey 2kg", cantidad: 1, precio: 899, categoria: "suplementos" },
      { nombre: "Shaker MuscleUp", cantidad: 1, precio: 150, categoria: "accesorios" }
    ],
    total: 1049,
    estado: 'entregado'
  },
  {
    id: "ORD-2024-015",
    fecha: "2024-12-20",
    productos: [
      { nombre: "Playera MuscleUp Gym", cantidad: 2, precio: 299, categoria: "ropa" },
      { nombre: "Toalla Deportiva", cantidad: 1, precio: 199, categoria: "accesorios" }
    ],
    total: 797,
    estado: 'entregado'
  }
];

const getIconByCategory = (categoria: string) => {
  switch (categoria) {
    case 'suplementos':
      return <FaBlender className="text-green-500" />;
    case 'ropa':
      return <FaTshirt className="text-blue-500" />;
    case 'accesorios':
      return <FaBoxOpen className="text-purple-500" />;
    default:
      return <FaShoppingCart className="text-gray-500" />;
  }
};

export default function ComprasPage() {
  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return { icon: <FaCheckCircle />, color: 'text-green-500', bg: 'bg-green-500/20' };
      case 'procesando':
        return { icon: <FaClock />, color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
      case 'pendiente':
        return { icon: <FaClock />, color: 'text-gray-500', bg: 'bg-gray-500/20' };
      default:
        return { icon: null, color: '', bg: '' };
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
          Mis <span className="text-[#FFCC00]">Compras</span>
        </h1>
        <p className="text-gray-400">Historial de productos y servicios adquiridos</p>
      </motion.div>

      {/* Resumen de Compras */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <FaShoppingCart className="text-2xl text-[#FFCC00] mb-2" />
          <p className="text-gray-400 text-sm">Total de compras</p>
          <p className="text-xl font-bold text-white">{compras.length}</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <FaBlender className="text-2xl text-green-500 mb-2" />
          <p className="text-gray-400 text-sm">Suplementos</p>
          <p className="text-xl font-bold text-white">1</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <FaTshirt className="text-2xl text-blue-500 mb-2" />
          <p className="text-gray-400 text-sm">Ropa deportiva</p>
          <p className="text-xl font-bold text-white">2</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <FaBoxOpen className="text-2xl text-purple-500 mb-2" />
          <p className="text-gray-400 text-sm">Accesorios</p>
          <p className="text-xl font-bold text-white">2</p>
        </div>
      </motion.div>

      {/* Lista de Compras */}
      <div className="space-y-6">
        {compras.map((compra, index) => {
          const estadoInfo = getEstadoInfo(compra.estado);
          
          return (
            <motion.div
              key={compra.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
            >
              {/* Header de la compra */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Orden #{compra.id}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(compra.fecha).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                    {estadoInfo.icon}
                    <span className="capitalize font-medium">{compra.estado}</span>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="p-6">
                <div className="space-y-4">
                  {compra.productos.map((producto, prodIndex) => (
                    <div key={prodIndex} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          {getIconByCategory(producto.categoria)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{producto.nombre}</p>
                          <p className="text-gray-400 text-sm">Cantidad: {producto.cantidad}</p>
                        </div>
                      </div>
                      <p className="text-white font-bold">${producto.precio * producto.cantidad}</p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center">
                  <p className="text-gray-400">Total de la orden</p>
                  <p className="text-2xl font-bold text-[#FFCC00]">${compra.total}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mensaje si no hay compras */}
      {compras.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FaShoppingCart className="text-6xl text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No tienes compras registradas</p>
        </motion.div>
      )}
    </div>
  );
}
