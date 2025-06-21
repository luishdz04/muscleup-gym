"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendar, 
  FaIdCard,
  FaDumbbell,
  FaEdit,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';

interface UserInfo {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  numeroCliente: string;
  fechaRegistro: string;
  membresia: {
    tipo: string;
    estado: string;
    vencimiento: string;
  };
}

export default function ClienteDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nombre: "Juan",
    apellidos: "Pérez García",
    email: "juan.perez@email.com",
    telefono: "+52 123 456 7890",
    fechaNacimiento: "1990-05-15",
    numeroCliente: "MUP-2024-0001",
    fechaRegistro: "2024-01-15",
    membresia: {
      tipo: "Mensualidad Regular",
      estado: "Activa",
      vencimiento: "2025-02-15"
    }
  });

  const [editMode, setEditMode] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
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
          Mi <span className="text-[#FFCC00]">Información</span>
        </h1>
        <p className="text-gray-400">Gestiona tu perfil y configuración personal</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Tarjeta de Perfil Principal */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#FFCC00]">Datos Personales</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFCC00] text-black rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <FaEdit />
              {editMode ? 'Guardar' : 'Editar'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaUser className="text-[#FFCC00]" />
                Nombre
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={userInfo.nombre}
                  onChange={(e) => setUserInfo({...userInfo, nombre: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-[#FFCC00] focus:outline-none"
                />
              ) : (
                <p className="text-white text-lg">{userInfo.nombre}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaUser className="text-[#FFCC00]" />
                Apellidos
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={userInfo.apellidos}
                  onChange={(e) => setUserInfo({...userInfo, apellidos: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-[#FFCC00] focus:outline-none"
                />
              ) : (
                <p className="text-white text-lg">{userInfo.apellidos}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaEnvelope className="text-[#FFCC00]" />
                Email
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-[#FFCC00] focus:outline-none"
                />
              ) : (
                <p className="text-white text-lg">{userInfo.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaPhone className="text-[#FFCC00]" />
                Teléfono
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={userInfo.telefono}
                  onChange={(e) => setUserInfo({...userInfo, telefono: e.target.value})}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-[#FFCC00] focus:outline-none"
                />
              ) : (
                <p className="text-white text-lg">{userInfo.telefono}</p>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaCalendar className="text-[#FFCC00]" />
                Fecha de Nacimiento
              </label>
              <p className="text-white text-lg">
                {new Date(userInfo.fechaNacimiento).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Número de Cliente */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm flex items-center gap-2">
                <FaIdCard className="text-[#FFCC00]" />
                Número de Cliente
              </label>
              <p className="text-white text-lg font-mono">{userInfo.numeroCliente}</p>
            </div>
          </div>
        </motion.div>

        {/* Tarjeta de Membresía */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-[#FFCC00] to-yellow-600 rounded-2xl p-6 text-black"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Mi Membresía</h3>
            <FaDumbbell className="text-3xl" />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm opacity-80">Tipo de Plan</p>
              <p className="text-xl font-bold">{userInfo.membresia.tipo}</p>
            </div>

            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-800" />
              <span className="font-semibold">{userInfo.membresia.estado}</span>
            </div>

            <div className="pt-4 border-t border-black/20">
              <p className="text-sm opacity-80">Vence el</p>
              <p className="text-lg font-bold">
                {new Date(userInfo.membresia.vencimiento).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <button className="w-full mt-4 bg-black text-[#FFCC00] py-3 rounded-lg font-bold hover:bg-gray-900 transition-colors">
              Renovar Membresía
            </button>
          </div>
        </motion.div>

        {/* Estadísticas Rápidas */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Días como miembro */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <FaClock className="text-4xl text-[#FFCC00] mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Miembro desde hace</p>
            <p className="text-2xl font-bold text-white">
              {Math.floor((new Date().getTime() - new Date(userInfo.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))} días
            </p>
          </div>

          {/* Visitas este mes */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <FaDumbbell className="text-4xl text-[#FFCC00] mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Visitas este mes</p>
            <p className="text-2xl font-bold text-white">12</p>
          </div>

          {/* Próximo pago */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <FaCalendar className="text-4xl text-[#FFCC00] mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Días para renovar</p>
            <p className="text-2xl font-bold text-white">
              {Math.ceil((new Date(userInfo.membresia.vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
