'use client';
import React, { useRef, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { introCards } from '@/data/introCards';

// Componente para el contador animado (RESPONSIVO)
const AnimatedCounter = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  title 
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  title?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000 });

  // Efecto para animar el contador cuando esté en vista
  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  // Actualizar el texto del contador
  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const currentValue = Math.floor(latest);
        ref.current.textContent = `${prefix}${currentValue}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix]);

  return (
    <motion.div 
      className="mt-6 sm:mt-8 flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <motion.span 
        ref={ref}
        className="text-brand text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold"
        initial={{ opacity: 0, rotateY: -90 }}
        animate={isInView ? { 
          opacity: 1, 
          rotateY: 0,
          scale: [1, 1.1, 1]
        } : { opacity: 0, rotateY: -90 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          scale: {
            duration: 0.5,
            delay: 1,
            times: [0, 0.5, 1]
          }
        }}
      >
        0
      </motion.span>
      {title && (
        <motion.span 
          className="text-xs sm:text-sm md:text-base text-white/80 mt-2 font-medium text-center px-2"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {title}
        </motion.span>
      )}
    </motion.div>
  );
};

// Componente para cada tarjeta (RESPONSIVO)
const IntroCard = ({ card, index }: { card: any; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax para el fondo - Reducido en móviles
  const yBg = useTransform(
    scrollYProgress, 
    [0, 1], 
    [`-${(card.parallax ?? 0.15) * 30}%`, `${(card.parallax ?? 0.15) * 30}%`]
  );

  // Animaciones del contenido
  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95,
      filter: "blur(8px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      rotateX: -10
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const separatorVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { 
      scaleX: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.article
      ref={ref}
      className="relative overflow-hidden min-h-screen sm:min-h-[110vh] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1, delay: index * 0.1 }}
    >
      {/* Fondo con parallax */}
      <motion.div
        className="absolute inset-0 bg-center bg-cover scale-105 sm:scale-110"
        style={{ 
          backgroundImage: `url(${card.img})`,
          y: yBg
        }}
      />
      
      {/* Overlay con gradiente dinámico */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            135deg, 
            rgba(0,0,0,0.8) 0%, 
            rgba(0,0,0,0.5) 50%, 
            rgba(0,0,0,0.8) 100%
          )`
        }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* Efectos de partículas flotantes - Menos en móviles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-brand/30 rounded-full"
            style={{
              left: `${15 + (i * 20)}%`,
              top: `${25 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.1, 1],
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

      {/* Contenido principal - Completamente responsivo */}
      <motion.div
        className={`relative z-10 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 
                    mx-3 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-12
                    p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12
                    rounded-lg sm:rounded-xl backdrop-blur-md sm:backdrop-blur-lg 
                    bg-black/50 sm:bg-black/40 text-white
                    border border-white/20 sm:border-white/10 shadow-xl sm:shadow-2xl
                    ${
                      card.align === 'right'
                        ? 'ml-auto text-right'
                        : card.align === 'center'
                        ? 'mx-auto text-center'
                        : 'mr-auto text-left'
                    }`}
        variants={contentVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        whileHover={{ 
          scale: [1, 1.01, 1.02],
          boxShadow: [
            "0 15px 30px rgba(0,0,0,0.3)",
            "0 25px 50px rgba(0,0,0,0.5)"
          ],
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Título - Responsivo */}
        <motion.h3 
          className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold 
                     mb-3 sm:mb-4 md:mb-5 bg-gradient-to-r from-white to-white/90 
                     bg-clip-text text-transparent leading-tight"
          variants={itemVariants}
        >
          {card.title}
        </motion.h3>

        {/* Separador animado - Responsivo */}
        <motion.div 
          className={`w-8 sm:w-12 md:w-16 h-[2px] sm:h-[3px] bg-gradient-to-r from-brand to-brand/70 
                      mb-4 sm:mb-5 md:mb-6 rounded-full
                      ${card.align === 'center' ? 'mx-auto' : 
                        card.align === 'right' ? 'ml-auto' : ''}`}
          variants={separatorVariants}
          style={{ transformOrigin: card.align === 'right' ? 'right' : 'left' }}
        />

        {/* Párrafo - Responsivo */}
        <motion.p 
          className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed 
                     text-white/90 sm:text-white/85 px-1 sm:px-0"
          variants={itemVariants}
        >
          {card.text}
        </motion.p>

        {/* Contador animado */}
        {card.counter && (
          <AnimatedCounter
            value={card.counter.value}
            prefix={card.counter.prefix}
            suffix={card.counter.suffix}
            title={card.counter.title}
          />
        )}

        {/* Efecto de brillo - Optimizado para móviles */}
        <motion.div
          className="absolute inset-0 rounded-lg sm:rounded-xl opacity-0 pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)"
          }}
          animate={{
            x: ["-100%", "100%"],
            opacity: [0, 0.2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "linear"
          }}
        />
      </motion.div>
    </motion.article>
  );
};

export default function Intro() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  return (
    <section id="intro" className="relative bg-black">
      {/* Encabezado - Completamente Responsivo */}
      <motion.div 
        ref={headerRef}
        className="text-center py-12 sm:py-16 md:py-20 px-4 sm:px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.h2 
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold 
                     text-white mb-3 sm:mb-4 tracking-tight sm:tracking-normal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isHeaderInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          INTRODUCCIÓN
        </motion.h2>
        
        <motion.div 
          className="w-16 sm:w-20 md:w-24 h-[2px] sm:h-[3px] bg-brand mx-auto 
                     my-3 sm:my-4 rounded-full"
          initial={{ scaleX: 0 }}
          animate={isHeaderInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        
        <motion.p 
          className="text-white/80 text-base sm:text-lg md:text-xl px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Descubre quiénes somos
        </motion.p>
      </motion.div>

      {/* Tarjetas */}
      {introCards.map((card, index) => (
        <IntroCard key={card.id} card={card} index={index} />
      ))}
    </section>
  );
}