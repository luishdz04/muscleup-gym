"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaLock, FaRocket } from 'react-icons/fa';

export default function HistorialPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="inline-block mb-8"
        >
          <div className="relative">
            <FaClock className="text-8xl text-gray-700" />
            <FaLock className="text-4xl text-[#FFCC00] absolute -bottom-2 -right-2" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Historial de <span className="text-[#FFCC00]">Accesos</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-8">
          Esta función estará disponible próximamente
        </p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-lg mx-auto">
          <FaRocket className="text-5xl text-[#FFCC00] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">¡Viene algo increíble!</h2>
          <p className="text-gray-400 mb-6">
            Pronto podrás ver tu historial completo de accesos al gimnasio, 
            estadísticas de asistencia y mucho más.
          </p>
          
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FFCC00] rounded-full"></div>
              <p className="text-gray-300">Registro de entradas y salidas</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FFCC00] rounded-full"></div>
              <p className="text-gray-300">Estadísticas de asistencia mensual</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FFCC00] rounded-full"></div>
              <p className="text-gray-300">Horarios más frecuentes</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FFCC00] rounded-full"></div>
              <p className="text-gray-300">Racha de días consecutivos</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
