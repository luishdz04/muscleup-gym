"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';
import { 
  FaBullseye, 
  FaEye, 
  FaShieldAlt, 
  FaDumbbell,
  FaHeartbeat,
  FaUsers,
  FaMedal,
  FaHandsHelping,
  FaBrain,
  FaFistRaised
} from 'react-icons/fa';

interface Valor {
  nombre: string;
  icono: React.ReactNode;
  color: string;
}

const valores: Valor[] = [
  { nombre: "Sacrificio", icono: <FaFistRaised />, color: "#FF6B6B" },
  { nombre: "Esfuerzo", icono: <FaDumbbell />, color: "#4ECDC4" },
  { nombre: "Superación", icono: <FaMedal />, color: "#45B7D1" },
  { nombre: "Voluntad", icono: <FaBrain />, color: "#96CEB4" },
  { nombre: "Paciencia", icono: <FaHeartbeat />, color: "#FECA57" },
  { nombre: "Honestidad", icono: <FaShieldAlt />, color: "#DDA0DD" },
  { nombre: "Responsabilidad", icono: <FaHandsHelping />, color: "#98D8C8" },
  { nombre: "Perseverancia", icono: <FaFistRaised />, color: "#F7DC6F" },
  { nombre: "Humildad", icono: <FaUsers />, color: "#85C1E2" },
  { nombre: "Trabajo en equipo", icono: <FaUsers />, color: "#F8B739" },
  { nombre: "Convivencia", icono: <FaHandsHelping />, color: "#BB8FCE" },
  { nombre: "Respeto", icono: <FaHeartbeat />, color: "#52BE80" }
];

export default function SobreNosotrosPage() {
  const { scrollYProgress } = useScroll();
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  
  // Referencias para las secciones
  const misionRef = useRef(null);
  const visionRef = useRef(null);
  const politicaRef = useRef(null);
  const valoresRef = useRef(null);
  
  // Hooks para detectar cuando las secciones están en vista
  const misionInView = useInView(misionRef, { once: true });
  const visionInView = useInView(visionRef, { once: true });
  const politicaInView = useInView(politicaRef, { once: true });
  const valoresInView = useInView(valoresRef, { once: true });

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Hero Section con Parallax */}
      <motion.div 
        style={{ scale: scaleProgress }}
        className="relative h-screen flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black opacity-80" />
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4"
        >
          {/* Logo con animaciones profesionales */}
          <motion.div
            className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 1.2, 
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
          >
            {/* Efecto de resplandor pulsante */}
            <motion.div
              className="absolute inset-0 bg-[#FFCC00] rounded-full blur-3xl opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Logo principal */}
            <motion.div
              className="relative w-full h-full"
              animate={{
                rotateY: [0, 360]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Image
                src="/logo.png"
                alt="MuscleUp Gym Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>

            {/* Anillo orbital */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#FFCC00] rounded-full transform -translate-x-1/2 -translate-y-4" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-[#FFCC00] rounded-full transform -translate-x-1/2 translate-y-4" />
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-[#FFCC00] rounded-full transform -translate-y-1/2 -translate-x-4" />
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-[#FFCC00] rounded-full transform -translate-y-1/2 translate-x-4" />
            </motion.div>
          </motion.div>

          <motion.p 
            className="text-xl md:text-2xl text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Más que un gimnasio, una familia
          </motion.p>
        </motion.div>

        {/* Indicador de scroll animado */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-[#FFCC00] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#FFCC00] rounded-full mt-2" />
          </div>
        </motion.div>
      </motion.div>

      {/* Timeline Container */}
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        {/* Línea vertical del timeline */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#FFCC00] via-yellow-600 to-[#FFCC00] opacity-20" />

        {/* Misión Section */}
        <motion.div 
          ref={misionRef}
          className="relative flex items-center mb-32"
          initial={{ opacity: 0, x: -100 }}
          animate={misionInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="w-full md:w-1/2 pr-8 text-right">
            <motion.div 
              className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-[#FFCC00] transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-end mb-4">
                <h2 className="text-3xl font-bold text-[#FFCC00] mr-4">MISIÓN</h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <FaBullseye className="text-4xl text-[#FFCC00]" />
                </motion.div>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Ser tu guía en la búsqueda de una mejor calidad de vida a través de entrenamientos sustentados en el ejercicio.
              </p>
            </motion.div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#FFCC00] rounded-full border-4 border-black z-10" />
          <div className="hidden md:block w-1/2" />
        </motion.div>

        {/* Visión Section */}
        <motion.div 
          ref={visionRef}
          className="relative flex items-center mb-32"
          initial={{ opacity: 0, x: 100 }}
          animate={visionInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="hidden md:block w-1/2" />
          <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#FFCC00] rounded-full border-4 border-black z-10" />
          <div className="w-full md:w-1/2 pl-8">
            <motion.div 
              className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-[#FFCC00] transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaEye className="text-4xl text-[#FFCC00] mr-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-[#FFCC00]">VISIÓN</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Ser reconocido como un centro fitness que promueve la pasión por el ejercicio y la salud en un ambiente de comodidad y bienestar para nuestros usuarios.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Política General Section */}
        <motion.div 
          ref={politicaRef}
          className="relative flex items-center mb-32"
          initial={{ opacity: 0, x: -100 }}
          animate={politicaInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="w-full md:w-1/2 pr-8 text-right">
            <motion.div 
              className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-[#FFCC00] transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-end mb-4">
                <h2 className="text-3xl font-bold text-[#FFCC00] mr-4">POLÍTICA GENERAL</h2>
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FaShieldAlt className="text-4xl text-[#FFCC00]" />
                </motion.div>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                En Muscle Up GYM promovemos entrenamientos basados en ciencia, que originan un nuevo estilo de vida, y enfocarnos en nuestros esfuerzos diariamente para ser tu guía en la búsqueda permanente de tu salud y bienestar en un ambiente de respeto y armonía.
              </p>
            </motion.div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#FFCC00] rounded-full border-4 border-black z-10" />
          <div className="hidden md:block w-1/2" />
        </motion.div>
      </div>

      {/* Valores Section con diseño especial */}
      <motion.div 
        ref={valoresRef}
        className="relative py-20 bg-gradient-to-b from-black via-gray-900 to-black"
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2 
            className="text-5xl font-bold text-center text-white mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={valoresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            NUESTROS <span className="text-[#FFCC00]">VALORES</span>
          </motion.h2>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={valoresInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, staggerChildren: 0.1 }}
          >
            {valores.map((valor, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, scale: 0 }}
                animate={valoresInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-[#FFCC00] transition-all duration-300 text-center">
                  <motion.div 
                    className="text-3xl mb-3 flex justify-center"
                    style={{ color: valor.color }}
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, delay: index * 0.5 }}
                  >
                    {valor.icono}
                  </motion.div>
                  <h3 className="text-white font-semibold">{valor.nombre}</h3>
                </div>
                
                {/* Efecto de resplandor en hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-xl" style={{
                    background: `radial-gradient(circle at center, ${valor.color}20 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                  }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Final */}
      <motion.div 
        className="py-20 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h3 className="text-3xl font-bold text-white mb-6">
          ¿Listo para ser parte de la familia <span className="text-[#FFCC00]">Muscle Up</span>?
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/registro/paso1'}
          className="bg-gradient-to-r from-[#FFCC00] to-yellow-500 text-black font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-[#FFCC00]/50 transition-all duration-300"
        >
          ÚNETE AHORA
        </motion.button>
      </motion.div>
    </div>
  );
}
