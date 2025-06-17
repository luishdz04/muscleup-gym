'use client';
import React, { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    quote:
      'Haberme integrado a Muscle Up GYM ha sido una de las mejores experiencias que he disfrutado, cambió considerablemente mi vida, el bajar de peso y talla de una manera ordenada y progresiva, me ha permitido ahora gozar de una buena salud y mi estado de ánimo está excelente. Lo recomiendo ampliamente.',
    author: 'Juanita Guadalupe Lara',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
  {
    id: 2,
    quote:
      'Ha sido una de mis mejores experiencias el haberme integrado a Muscle Up GYM en San Buenaventura.',
    author: 'Marco Villarreal',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
  {
    id: 3,
    quote:
      'Cuando inicié mi proyecto de entrenamiento y salud, se me hacía imposible, algo de temor e incertidumbre; todo esto desapareció.',
    author: 'Oromi Arce',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
];

// Posiciones fijas para las partículas (evita hidration error)
const PARTICLE_POSITIONS = [
  { left: 15, top: 20 },
  { left: 25, top: 80 },
  { left: 35, top: 35 },
  { left: 45, top: 70 },
  { left: 55, top: 15 },
  { left: 65, top: 90 },
  { left: 75, top: 45 },
  { left: 85, top: 25 },
  { left: 10, top: 60 },
  { left: 30, top: 10 },
  { left: 50, top: 85 },
  { left: 70, top: 30 },
  { left: 90, top: 75 },
  { left: 20, top: 50 },
  { left: 40, top: 95 },
  { left: 60, top: 40 },
  { left: 80, top: 65 },
  { left: 12, top: 85 },
  { left: 68, top: 55 },
  { left: 88, top: 15 },
];

// Componente para las estrellas animadas
const AnimatedStars = ({ count, delay = 0 }: { count: number; delay?: number }) => {
  return (
    <div className="flex justify-center gap-1 text-2xl sm:text-3xl">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="text-brand"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.1,
            type: "spring",
            stiffness: 200
          }}
          whileHover={{
            scale: 1.3,
            rotate: 360,
            color: "#FFD700"
          }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
};

// Componente para cada tarjeta de testimonio
const TestimonialCard = ({ 
  testimonial, 
  isActive, 
  direction 
}: { 
  testimonial: typeof testimonials[0]; 
  isActive: boolean;
  direction: number;
}) => {
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    })
  };

  return (
    <motion.figure
      key={testimonial.id}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        rotateY: { duration: 0.6 }
      }}
      className="absolute inset-0 w-full h-full flex items-center justify-center px-4 sm:px-6 md:px-8"
    >
      <motion.div
        className="relative max-w-2xl sm:max-w-3xl lg:max-w-4xl w-full
                   bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 
                   backdrop-blur-xl border border-white/10
                   rounded-2xl sm:rounded-3xl 
                   px-6 sm:px-8 md:px-12 lg:px-16
                   py-8 sm:py-10 md:py-12 lg:py-16
                   text-white shadow-2xl"
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Efecto de brillo en el borde */}
        <motion.div
          className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand/20 via-transparent to-brand/20 opacity-0"
          animate={{
            opacity: [0, 0.3, 0],
            backgroundPosition: ["0% 50%", "100% 50%", "200% 50%"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "linear"
          }}
        />

        {/* Comillas decorativas */}
        <motion.div
          className="absolute -top-4 sm:-top-6 left-6 sm:left-8 md:left-12 
                     text-6xl sm:text-7xl md:text-8xl text-brand/30 font-serif"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          "
        </motion.div>

        {/* Contenido principal */}
        <div className="relative z-10">
          {/* Cita */}
          <motion.blockquote
            className="italic text-lg sm:text-xl md:text-2xl lg:text-3xl 
                       leading-relaxed sm:leading-relaxed md:leading-relaxed 
                       text-white/90 mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {testimonial.quote}
          </motion.blockquote>

          {/* Estrellas */}
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <AnimatedStars count={testimonial.stars} delay={0.8} />
          </motion.div>

          {/* Información del autor */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 
                           rounded-full overflow-hidden border-3 sm:border-4 
                           border-brand bg-black shadow-xl"
                whileHover={{
                  borderColor: "#FFD700",
                  boxShadow: "0 0 30px rgba(255, 215, 0, 0.5)"
                }}
              >
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={96}
                  height={96}
                  className="object-cover object-center w-full h-full"
                />
              </motion.div>
              
              {/* Anillo de pulso */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-brand/50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Nombre y rol */}
            <div className="text-center sm:text-left">
              <motion.h3
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                {testimonial.author}
              </motion.h3>
              <motion.span
                className="text-sm sm:text-base text-brand/80 font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                {testimonial.role}
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* Partículas flotantes - Posiciones fijas */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brand/40 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.figure>
  );
};

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  // Navegación
  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play
  React.useEffect(() => {
    const timer = setInterval(nextTestimonial, 6000);
    return () => clearInterval(timer);
  }, []);

  // Manejo de gestos touch
  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      prevTestimonial();
    } else if (info.offset.x < -swipeThreshold) {
      nextTestimonial();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="testimonios"
      className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-black text-center overflow-hidden"
    >
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 to-black" />
      
      {/* Partículas de fondo - Posiciones fijas para evitar hydration error */}
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLE_POSITIONS.map((position, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brand/20 rounded-full"
            style={{
              left: `${position.left}%`,
              top: `${position.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3) * 0.5, // Variación determinística
              repeat: Infinity,
              delay: (i % 5) * 0.2, // Delay determinístico
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Encabezado */}
      <motion.header
        className="relative z-10 mb-12 sm:mb-16 md:mb-20 px-4 sm:px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
                     font-extrabold text-white mb-3 sm:mb-4 md:mb-6
                     bg-gradient-to-r from-white via-white to-brand bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Testimonios
        </motion.h2>
        
        <motion.div
          className="w-16 sm:w-20 md:w-24 h-[2px] sm:h-[3px] bg-brand mx-auto mb-4 sm:mb-6 rounded-full"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-brand/80 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Sección de testimonios de Usuarios MUP
        </motion.p>
      </motion.header>

      {/* Carrusel */}
      <div className="relative z-10 px-4 sm:px-6">
        <motion.div
          className="relative h-[500px] sm:h-[550px] md:h-[600px] lg:h-[650px] 
                     max-w-6xl mx-auto"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          dragElastic={0.2}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <TestimonialCard
              key={currentIndex}
              testimonial={testimonials[currentIndex]}
              isActive={true}
              direction={direction}
            />
          </AnimatePresence>
        </motion.div>

        {/* Controles de navegación */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-12">
          {/* Botón anterior */}
          <motion.button
            onClick={prevTestimonial}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm
                       border border-white/20 flex items-center justify-center
                       text-white hover:bg-brand hover:text-black transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          {/* Indicadores */}
          <div className="flex gap-2 sm:gap-3">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300
                           ${index === currentIndex 
                             ? 'bg-brand shadow-lg shadow-brand/50' 
                             : 'bg-white/30 hover:bg-white/50'}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                initial={false}
                animate={{
                  scale: index === currentIndex ? 1.2 : 1
                }}
              />
            ))}
          </div>

          {/* Botón siguiente */}
          <motion.button
            onClick={nextTestimonial}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm
                       border border-white/20 flex items-center justify-center
                       text-white hover:bg-brand hover:text-black transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto mt-6 sm:mt-8 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 6, ease: "linear" }}
            key={currentIndex}
          />
        </div>
      </div>
    </section>
  );
}