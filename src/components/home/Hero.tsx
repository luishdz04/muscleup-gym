'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { motion } from 'framer-motion';
import { initParticles } from '@/lib/initParticles';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLDivElement | null>(null);
  const separator = useRef<HTMLDivElement | null>(null);

  /* Animaciones de h1, h2 y separador */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('h1', { opacity: 0, y: 60, duration: 1, ease: 'power2.out' });
      gsap.from('h2', { opacity: 0, y: 40, duration: 1, delay: 0.2, ease: 'power2.out' });
      gsap.from(separator.current, {
        scaleX: 0,
        transformOrigin: 'center',
        duration: 0.8,
        delay: 0.4,
        ease: 'power2.out',
      });
    }, root);

    /* Partículas */
    initParticles('particles-bg');

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* vídeo de fondo */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* overlay oscuro */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />

      {/* lienzo Particles.js */}
      <div id="particles-bg" className="absolute inset-0 z-20" />

      {/* contenido */}
      <div className="relative z-30 text-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 
                       font-extrabold text-white leading-tight mb-3 sm:mb-4 md:mb-6 
                       tracking-tight sm:tracking-normal">
          El momento es ahora
        </h1>

        <div ref={separator} className="mx-auto my-4 sm:my-5 md:my-6 lg:my-8 
                                       bg-brand w-12 sm:w-16 md:w-20 lg:w-24 xl:w-28 
                                       h-[2px] sm:h-[3px] md:h-[4px] rounded-full" />

        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 
                       font-semibold text-white mb-6 sm:mb-8 md:mb-10 lg:mb-12 
                       tracking-wide sm:tracking-normal px-2 sm:px-0">
          Cambia tu estilo de vida
        </h2>

        {/* Botón animado con Framer Motion - Completamente Responsivo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          className="relative z-40 flex justify-center"
        >
          <motion.a
            href="/registro"
            className="relative inline-block group overflow-hidden"
            whileHover={{ scale: [1, 1.05] }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {/* Fondo principal del botón */}
            <motion.div
              className="relative bg-brand text-black overflow-hidden
                         px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 lg:px-12 lg:py-4 xl:px-14 xl:py-5
                         rounded-full border-2 border-brand
                         font-bold text-sm sm:text-base md:text-lg lg:text-xl
                         tracking-wide shadow-2xl
                         min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px]
                         text-center"
              whileHover={{
                boxShadow: [
                  "0 10px 20px rgba(0, 0, 0, 0.2)",
                  "0 20px 40px rgba(0, 0, 0, 0.3)"
                ],
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Efecto de onda al hover */}
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.4, 0, 0.2, 1] 
                }}
              />
              
              {/* Brillo que se desplaza */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%", skewX: -45 }}
                animate={{ x: "200%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "linear"
                }}
              />
              
              {/* Texto del botón */}
              <span className="relative z-10 group-hover:text-black transition-colors duration-300 block">
                Inscribirse
              </span>
              
              {/* Partículas decorativas - Responsivas */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={false}
                whileHover="hover"
              >
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/60 rounded-full"
                    style={{
                      left: `${25 + i * 15}%`,
                      top: `${35 + (i % 2) * 30}%`,
                    }}
                    variants={{
                      hover: {
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 1, 0.6],
                        y: [0, -8, 0],
                      }
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            {/* Anillo exterior al hover */}
            <motion.div
              className="absolute inset-0 border-2 border-white/40 rounded-full"
              initial={{ scale: 1, opacity: 0 }}
              whileHover={{ 
                scale: 1.1, 
                opacity: 1,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}