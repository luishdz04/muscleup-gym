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
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface Valor {
  nombre: string;
  icono: React.ReactNode;
  color: string;
}

const valores: Valor[] = [
  { nombre: "Sacrificio", icono: <FaFistRaised />, color: "#FFCC00" },
  { nombre: "Esfuerzo", icono: <FaDumbbell />, color: "#FFCC00" },
  { nombre: "Superación", icono: <FaMedal />, color: "#FFCC00" },
  { nombre: "Voluntad", icono: <FaBrain />, color: "#FFCC00" },
  { nombre: "Paciencia", icono: <FaHeartbeat />, color: "#FFCC00" },
  { nombre: "Honestidad", icono: <FaShieldAlt />, color: "#FFCC00" },
  { nombre: "Responsabilidad", icono: <FaHandsHelping />, color: "#FFCC00" },
  { nombre: "Perseverancia", icono: <FaFistRaised />, color: "#FFCC00" },
  { nombre: "Humildad", icono: <FaUsers />, color: "#FFCC00" },
  { nombre: "Trabajo en equipo", icono: <FaUsers />, color: "#FFCC00" },
  { nombre: "Convivencia", icono: <FaHandsHelping />, color: "#FFCC00" },
  { nombre: "Respeto", icono: <FaHeartbeat />, color: "#FFCC00" }
];

export default function SobreNosotrosPage() {
  const { scrollYProgress } = useScroll();
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  
  // Referencias para las secciones
  const heroRef = useRef(null);
  const misionRef = useRef(null);
  const visionRef = useRef(null);
  const politicaRef = useRef(null);
  const valoresRef = useRef(null);
  
  // Hooks para detectar cuando las secciones están en vista
  const heroInView = useInView(heroRef, { once: true });
  const misionInView = useInView(misionRef, { once: true, margin: "-20%" });
  const visionInView = useInView(visionRef, { once: true, margin: "-20%" });
  const politicaInView = useInView(politicaRef, { once: true, margin: "-20%" });
  const valoresInView = useInView(valoresRef, { once: true, margin: "-20%" });

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section con Logo MÁS GRANDE */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center overflow-hidden"
        style={{ scale: scaleProgress }}
      >
        {/* Partículas de fondo mejoradas */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-brand/20 rounded-full"
              style={{
                left: `${10 + i * 6}%`,
                top: `${15 + (i % 5) * 20}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Botón de regreso */}
        <motion.div
          className="absolute top-8 left-4 sm:left-8 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand hover:text-brand/80 
                     transition-colors duration-300 group bg-white/5 px-4 py-2 rounded-lg
                     border border-white/10 hover:border-brand/30"
          >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </motion.div>
        
        <motion.div
          className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1 }}
        >
          {/* Logo MUCHO MÁS GRANDE */}
          <motion.div
            className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem] lg:w-[40rem] lg:h-[40rem] xl:w-[48rem] xl:h-[48rem] mx-auto mb-12"
            initial={{ scale: 0, opacity: 0 }}
            animate={heroInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.8, 
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.3
            }}
          >
            {/* Efecto de resplandor mejorado */}
            <motion.div
              className="absolute inset-0 bg-brand rounded-full blur-3xl opacity-20"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Logo principal con movimiento suave */}
            <motion.div
              className="relative w-full h-full"
              animate={{
                y: [0, -15, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Image
                src="/logo2.png"
                alt="MuscleUp Gym Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(max-width: 640px) 288px, (max-width: 768px) 384px, (max-width: 1024px) 512px, (max-width: 1280px) 640px, 768px"
              />
            </motion.div>

            {/* Partículas orbitales mejoradas y más grandes */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...Array(4)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-brand rounded-full"
                  style={{
                    top: i === 0 ? '0%' : i === 1 ? '100%' : '50%',
                    left: i === 2 ? '0%' : i === 3 ? '100%' : '50%',
                    transform: i === 0 || i === 1 ? 'translateX(-50%)' : 'translateY(-50%)',
                    marginTop: i === 0 ? '-3rem' : i === 1 ? '3rem' : '0',
                    marginLeft: i === 2 ? '-3rem' : i === 3 ? '3rem' : '0',
                  }}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [1, 0.4, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.75
                  }}
                />
              ))}
            </motion.div>

            {/* Partículas adicionales más distribuidas */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: -360 }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-brand/60 rounded-full"
                  style={{
                    top: `${15 + i * 10}%`,
                    left: `${10 + (i % 3) * 40}%`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Solo el subtítulo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="space-y-4"
          >
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/80 max-w-3xl mx-auto font-light">
              Más que un gimnasio, una familia
            </p>
          </motion.div>
        </motion.div>

        {/* Indicador de scroll mejorado */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="w-6 h-10 border-2 border-brand rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-3 bg-brand rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Secciones de contenido con layout responsivo */}
      <div className="relative py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Timeline para desktop, cards stacked para mobile */}
          <div className="space-y-16 lg:space-y-24">
            
            {/* Misión */}
            <motion.div 
              ref={misionRef}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              animate={misionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                           backdrop-blur-lg border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
                  <motion.div
                    className="flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <FaBullseye className="text-4xl sm:text-5xl lg:text-6xl text-brand" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-2">
                      MISIÓN
                    </h2>
                    <div className="w-16 h-1 bg-brand rounded-full"></div>
                  </div>
                </div>
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed">
                  Ser tu guía en la búsqueda de una mejor calidad de vida a través de entrenamientos 
                  sustentados en el ejercicio, promoviendo hábitos saludables y un estilo de vida activo 
                  en un ambiente profesional y motivador.
                </p>
              </div>
            </motion.div>

            {/* Visión */}
            <motion.div 
              ref={visionRef}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              animate={visionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                           backdrop-blur-lg border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
                  <motion.div
                    className="flex-shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <FaEye className="text-4xl sm:text-5xl lg:text-6xl text-brand" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-2">
                      VISIÓN
                    </h2>
                    <div className="w-16 h-1 bg-brand rounded-full"></div>
                  </div>
                </div>
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed">
                  Ser reconocido como un centro fitness líder que promueve la pasión por el ejercicio 
                  y la salud en un ambiente de comodidad, profesionalismo y bienestar para nuestros usuarios, 
                  creando una comunidad comprometida con la excelencia física y mental.
                </p>
              </div>
            </motion.div>

            {/* Política General */}
            <motion.div 
              ref={politicaRef}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              animate={politicaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                           backdrop-blur-lg border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
                  <motion.div
                    className="flex-shrink-0"
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FaShieldAlt className="text-4xl sm:text-5xl lg:text-6xl text-brand" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-2">
                      POLÍTICA GENERAL
                    </h2>
                    <div className="w-16 h-1 bg-brand rounded-full"></div>
                  </div>
                </div>
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed">
                  En Muscle Up GYM promovemos entrenamientos basados en ciencia, que originan un nuevo 
                  estilo de vida, y enfocamos nuestros esfuerzos diariamente para ser tu guía en la 
                  búsqueda de una mejor calidad de vida a través del ejercicio, la disciplina y la 
                  constancia, siempre con el respaldo de profesionales capacitados.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sección de Valores Mejorada */}
      <motion.section 
        ref={valoresRef}
        className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-zinc-900 to-black"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={valoresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              NUESTROS <span className="text-brand">VALORES</span>
            </h2>
            <div className="w-24 h-1 bg-brand rounded-full mx-auto"></div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8"
            initial={{ opacity: 0 }}
            animate={valoresInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, staggerChildren: 0.1 }}
          >
            {valores.map((valor, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, scale: 0 }}
                animate={valoresInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                             backdrop-blur-lg border border-white/10 hover:border-brand/50 
                             transition-all duration-300 rounded-xl p-4 sm:p-6 text-center
                             group-hover:shadow-lg group-hover:shadow-brand/20">
                  <motion.div 
                    className="text-2xl sm:text-3xl mb-3 flex justify-center text-brand"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      delay: index * 0.2,
                      ease: "easeInOut"
                    }}
                  >
                    {valor.icono}
                  </motion.div>
                  <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">
                    {valor.nombre}
                  </h3>
                </div>
                
                {/* Efecto de resplandor mejorado */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                             transition-opacity duration-300 pointer-events-none -z-10">
                  <div className="absolute inset-0 rounded-xl bg-brand/10 blur-xl" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Final con texto actualizado */}
      <motion.section 
        className="py-16 sm:py-20 text-center bg-gradient-to-br from-black to-zinc-900"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Listo para ser parte de la familia{' '}
              <span className="text-brand">Muscle Up GYM</span>?
            </h3>
            <p className="text-white/80 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
              Únete a nuestra comunidad y comienza tu transformación hoy mismo
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 204, 0, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/registro'}
              className="bg-gradient-to-r from-brand to-brand/80 text-black font-bold 
                       py-4 px-8 sm:py-5 sm:px-10 rounded-full text-lg sm:text-xl 
                       shadow-lg hover:shadow-brand/50 transition-all duration-300
                       border-2 border-transparent hover:border-brand/30"
            >
              ÚNETE AHORA
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
      <Footer />
    </div>
  );
}
