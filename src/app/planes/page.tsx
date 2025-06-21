"use client";

import React from 'react';
import Image from 'next/image';
import { FaCheck, FaStar, FaClock, FaBolt, FaCrown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Plan {
  id: number;
  tipo: string;
  precio: number;
  precioOriginal?: number;
  caracteristicas: string[];
  popular?: boolean;
  restriccion?: string;
  descuento?: string;
}

const planes: Plan[] = [
  {
    id: 1,
    tipo: "Inscripción",
    precio: 150,
    caracteristicas: ["Registro en nuestro sistema"]
  },
  {
    id: 2,
    tipo: "Semana",
    precio: 270,
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  },
  {
    id: 3,
    tipo: "Quincena",
    precio: 380,
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  },
  {
    id: 4,
    tipo: "Mensualidad Estudiantes",
    precio: 480,
    precioOriginal: 530,
    popular: true,
    restriccion: "Horario: 6:00 AM - 4:30 PM",
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  },
  {
    id: 5,
    tipo: "Mensualidad Regular",
    precio: 530,
    popular: true,
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas",
      "Sin restricción de horario"
    ]
  },
  {
    id: 6,
    tipo: "Trimestre",
    precio: 1500,
    precioOriginal: 1590,
    descuento: "25% de descuento en inscripción",
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  },
  {
    id: 7,
    tipo: "Semestre",
    precio: 2760,
    precioOriginal: 3180,
    descuento: "50% de descuento en inscripción",
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  },
  {
    id: 8,
    tipo: "Anual",
    precio: 4920,
    precioOriginal: 6360,
    descuento: "Inscripción GRATIS",
    caracteristicas: [
      "Peso integrado",
      "Peso libre",
      "Equipo de cardio",
      "Área funcional",
      "Lockers",
      "Rutinas gratuitas"
    ]
  }
];

export default function PlanesPage() {
  const router = useRouter();

  const handleInscribirse = () => {
    router.push('/registromup');
  };

  // Animaciones para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animaciones para las cards
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  // Animación para el título
  const titleVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={titleVariants}
        className="max-w-7xl mx-auto text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Elige el plan que se adapte a tus 
          <span className="text-[#FFCC00] ml-2">objetivos</span>
        </h1>
      </motion.div>

      {/* Plans Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {planes.map((plan, index) => (
          <motion.div
            key={plan.id}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transform transition-all duration-300 hover:border-[#FFCC00] hover:shadow-2xl hover:shadow-[#FFCC00]/20"
          >
            {/* Popular Badge */}
            {plan.popular && (
              <motion.div 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                className="absolute top-4 right-4 z-10"
              >
                <div className="bg-gradient-to-r from-[#FFCC00] to-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                  <FaCrown className="text-xs" />
                  POPULAR
                </div>
              </motion.div>
            )}

            <div className="p-6">
              {/* Logo Section */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                className="text-center mb-4"
              >
                <div className="w-20 h-20 mx-auto mb-3 relative">
                  <Image
                    src="/img/testimonios.png"
                    alt="MuscleUp Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#FFCC00]">{plan.tipo}</h3>
                <p className="text-sm text-gray-400 mt-2 italic">
                  "Tu salud y bienestar es nuestra misión"
                </p>
              </motion.div>

              {/* Price Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="text-center mb-6"
              >
                {plan.precioOriginal && (
                  <p className="text-gray-500 line-through text-sm">
                    ${plan.precioOriginal.toLocaleString()} MXN
                  </p>
                )}
                <p className="text-3xl font-bold text-white">
                  ${plan.precio.toLocaleString()}
                  <span className="text-lg text-gray-400"> MXN</span>
                </p>
                {plan.descuento && (
                  <motion.p 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                    className="text-green-400 text-sm font-semibold mt-1 flex items-center justify-center gap-1"
                  >
                    <FaBolt className="text-yellow-400" />
                    {plan.descuento}
                  </motion.p>
                )}
                {plan.restriccion && (
                  <div className="flex items-center justify-center mt-2 text-orange-400 text-sm">
                    <FaClock className="mr-1" />
                    <span>{plan.restriccion}</span>
                  </div>
                )}
              </motion.div>

              {/* Features List */}
              <div className="space-y-2 mb-6">
                {plan.caracteristicas.map((caracteristica, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 + idx * 0.05 }}
                    className="flex items-start"
                  >
                    <FaCheck className="text-[#FFCC00] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{caracteristica}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInscribirse}
                className="w-full bg-gradient-to-r from-[#FFCC00] to-yellow-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-[#FFCC00] transition-all duration-300 shadow-lg hover:shadow-[#FFCC00]/50"
              >
                Inscribirse ahora
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="max-w-4xl mx-auto mt-12 text-center"
      >
        <p className="text-gray-500 text-sm mt-2">
          Los precios están expresados en pesos mexicanos (MXN) y pueden estar sujetos a cambios.
        </p>
      </motion.div>
    </div>
  );
}
