"use client";

import React from 'react';
import Image from 'next/image';
import { FaCheck, FaStar, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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
    router.push('/registro/paso1');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Elige el plan que se adapte a tus objetivos
        </h1>
        
        {/* Widget de Membresía */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-full shadow-lg">
          <FaStar className="text-yellow-400" />
          <span className="font-semibold">Membresías Premium</span>
          <FaStar className="text-yellow-400" />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  POPULAR
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Logo Section */}
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto mb-3 relative">
                  <Image
                    src="/img/testimonios.png"
                    alt="MuscleUp Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.tipo}</h3>
                <p className="text-sm text-gray-600 mt-2 italic">
                  "Tu salud y bienestar es nuestra misión"
                </p>
              </div>

              {/* Price Section */}
              <div className="text-center mb-6">
                {plan.precioOriginal && (
                  <p className="text-gray-400 line-through text-sm">
                    ${plan.precioOriginal.toLocaleString()} MXN
                  </p>
                )}
                <p className="text-3xl font-bold text-red-600">
                  ${plan.precio.toLocaleString()}
                  <span className="text-lg text-gray-600"> MXN</span>
                </p>
                {plan.descuento && (
                  <p className="text-green-600 text-sm font-semibold mt-1">
                    {plan.descuento}
                  </p>
                )}
                {plan.restriccion && (
                  <div className="flex items-center justify-center mt-2 text-orange-600 text-sm">
                    <FaClock className="mr-1" />
                    <span>{plan.restriccion}</span>
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-2 mb-6">
                {plan.caracteristicas.map((caracteristica, index) => (
                  <div key={index} className="flex items-start">
                    <FaCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{caracteristica}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleInscribirse}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Inscribirse ahora
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <p className="text-gray-600">
          Todos los planes incluyen acceso completo a nuestras instalaciones y asesoría personalizada.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Los precios están expresados en pesos mexicanos (MXN) y pueden estar sujetos a cambios.
        </p>
      </div>
    </div>
  );
}
