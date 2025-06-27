'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  MapPinIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-20%" });

  // Handler para abrir Facebook
  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/Lindavistagym', '_blank', 'noopener,noreferrer');
  };

  // Handler para abrir Maps
  const handleMapsClick = () => {
    window.open('https://maps.app.goo.gl/preWqm3w7S2JZLg17', '_blank', 'noopener,noreferrer');
  };

  return (
    <footer 
      ref={footerRef}
      className="relative bg-gradient-to-br from-black to-zinc-900 text-white overflow-hidden"
    >
      {/* Fondo animado con partículas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brand/20 rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenido principal del footer */}
        <motion.div
          className="py-12 sm:py-16 lg:py-20"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          {/* Grid principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
            
            {/* Columna 1: Logo y Lema */}
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Logo/Nombre */}
              <motion.h3
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4
                           bg-gradient-to-r from-brand to-brand/80 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Muscle Up GYM
              </motion.h3>
              
              {/* Lema */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-white/80 text-base sm:text-lg leading-relaxed font-medium">
                  Tu salud y bienestar es nuestra misión.
                </p>
              </motion.div>

              {/* Redes sociales */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <button
                  onClick={handleFacebookClick}
                  className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 
                           px-6 py-3 rounded-xl transition-all duration-300 shadow-lg
                           group cursor-pointer hover:scale-105 hover:-translate-y-0.5"
                >
                  <svg 
                    className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2c0-2 1-3 3-3h2v3h-2c-.3 0-1 0-1 1v2h3l-.5 3h-2.5v7A10 10 0 0 0 22 12z" />
                  </svg>
                  <span className="font-medium text-white">Síguenos en Facebook</span>
                </button>
              </motion.div>
            </motion.div>

            {/* Columna 2: Dirección */}
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.h4
                className="text-xl sm:text-2xl font-bold mb-6 text-brand"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.4 }}
              >
                📍 Nuestra Ubicación
              </motion.h4>

              <motion.div
                className="flex items-start gap-3 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={handleMapsClick}
              >
                <MapPinIcon className="w-6 h-6 text-brand flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <motion.p 
                    className="text-white/90 text-base sm:text-lg leading-relaxed group-hover:text-white transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 0.5 }}
                  >
                    Francisco I. Madero 708,<br />
                    Colonia Lindavista,<br />
                    San Buenaventura, Coahuila,<br />
                    México
                  </motion.p>
                  <motion.p 
                    className="text-brand/80 text-sm mt-2 group-hover:text-brand transition-colors"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    📱 Toca para abrir en Maps
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>

            {/* Columna 3: Enlaces útiles */}
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.h4
                className="text-xl sm:text-2xl font-bold mb-6 text-brand"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                🔗 Enlaces Útiles
              </motion.h4>

              <div className="space-y-4">
                {/* Enlace a Aviso de Privacidad */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.a
                    href="/aviso-privacidad"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-brand 
                             transition-all duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    <ShieldCheckIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-base">Aviso de Privacidad</span>
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.a>
                </motion.div>

                {/* Contacto rápido */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.a
                    href="tel:8661127905"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-brand 
                             transition-all duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-base">866 112 7905</span>
                  </motion.a>
                </motion.div>

                {/* Enlace a Preguntas Frecuentes */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.a
                    href="/preguntas-frecuentes"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-brand 
                             transition-all duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    <QuestionMarkCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-base">Preguntas Frecuentes</span>
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Línea divisoria animada */}
          <motion.div
            className="w-full h-px bg-gradient-to-r from-transparent via-brand to-transparent mb-8"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          />

          {/* Copyright */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="text-white/60 text-sm sm:text-base">
              &copy; 2025 Muscle Up Gym. Todos los derechos reservados.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Efecto de brillo en la parte superior */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </footer>
  );
}
