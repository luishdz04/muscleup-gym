'use client';
import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';

// Definir el tipo para las imágenes
interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
}

const images: GalleryImage[] = [
  {
    id: 1,
    src: '/gym1.jpg',
    alt: 'Área de entrenamiento principal',
    title: 'Zona de Pesas'
  },
  {
    id: 2,
    src: '/gym2.jpg',
    alt: 'Área cardiovascular moderna',
    title: 'Cardio Zone'
  },
  {
    id: 3,
    src: '/gym3.jpg',
    alt: 'Espacio de entrenamiento funcional',
    title: 'Área Funcional'
  },
  {
    id: 4,
    src: '/gym4.jpg',
    alt: 'Recepción y área de descanso',
    title: 'Recepción'
  },
];

// Componente para cada imagen de la galería
const GalleryImageComponent = ({ 
  image, 
  isActive, 
  direction,
  onClick 
}: { 
  image: GalleryImage; 
  isActive: boolean;
  direction: number;
  onClick: () => void;
}) => {
  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
      filter: "blur(10px)"
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: "blur(0px)"
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
      filter: "blur(10px)"
    })
  };

  return (
    <motion.div
      key={image.id}
      custom={direction}
      variants={imageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.5 },
        rotateY: { duration: 0.6 },
        filter: { duration: 0.4 }
      }}
      className="absolute inset-0 w-full h-full cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden
                   shadow-2xl border border-white/10"
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Imagen principal */}
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 70vw"
          priority
        />

        {/* Overlay con gradiente */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                     opacity-0 hover:opacity-100 transition-opacity duration-300"
        />

        {/* Título de la imagen */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8
                     text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
            {image.title}
          </h3>
          <p className="text-sm sm:text-base text-white/80">
            {image.alt}
          </p>
        </motion.div>

        {/* Efecto de brillo */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                     opacity-0 pointer-events-none"
          animate={{
            x: ["-100%", "100%"],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear"
          }}
        />

        {/* Icono de zoom */}
        <motion.div
          className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 
                     bg-black/50 backdrop-blur-sm rounded-full
                     flex items-center justify-center text-white
                     opacity-0 hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Componente de thumbnails
const ThumbnailGrid = ({ 
  images, 
  currentIndex, 
  onSelect 
}: { 
  images: GalleryImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) => {
  return (
    <div className="flex gap-2 sm:gap-3 md:gap-4 justify-center overflow-x-auto pb-2">
      {images.map((image: GalleryImage, index: number) => (
        <motion.button
          key={image.id}
          onClick={() => onSelect(index)}
          className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16
                     rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300
                     ${index === currentIndex 
                       ? 'border-brand shadow-lg shadow-brand/50' 
                       : 'border-white/20 hover:border-white/40'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={false}
          animate={{
            scale: index === currentIndex ? 1.1 : 1
          }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
          />
          
          {/* Overlay activo */}
          {index === currentIndex && (
            <motion.div
              className="absolute inset-0 bg-brand/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default function Gallery() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  // Navegación
  const nextImage = (): void => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (): void => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number): void => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play
  React.useEffect(() => {
    const timer = setInterval(nextImage, 4500);
    return () => clearInterval(timer);
  }, []);

  // Manejo de gestos touch
  const handleDragEnd = (event: any, info: PanInfo): void => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      prevImage();
    } else if (info.offset.x < -swipeThreshold) {
      nextImage();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="galeria"
      className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-black overflow-hidden"
    >
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 to-black" />
      
      {/* Partículas de fondo - Menos que en testimonios */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i: number) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brand/15 rounded-full"
            style={{
              left: `${15 + i * 7}%`,
              top: `${20 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              duration: 4 + (i % 3) * 0.5,
              repeat: Infinity,
              delay: (i % 4) * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6">
        {/* Encabezado - Idéntico a Testimonios */}
        <motion.header
          className="text-center mb-12 sm:mb-16 md:mb-20"
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
            Instalaciones
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
            Descubre nuestro espacio
          </motion.p>
        </motion.header>

        {/* Galería principal */}
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mb-8 sm:mb-12">
          <motion.div
            className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px]
                       bg-gradient-to-br from-zinc-900/40 to-zinc-800/40 
                       backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.2}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <GalleryImageComponent
                key={currentIndex}
                image={images[currentIndex]}
                isActive={true}
                direction={direction}
                onClick={nextImage}
              />
            </AnimatePresence>
          </motion.div>

          {/* Controles de navegación */}
          <div className="flex items-center justify-between absolute inset-y-0 left-0 right-0 pointer-events-none z-20">
            {/* Botón anterior */}
            <motion.button
              onClick={prevImage}
              className="ml-4 sm:ml-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                         rounded-full bg-black/50 backdrop-blur-sm border border-white/20
                         flex items-center justify-center text-white hover:bg-brand hover:text-black
                         transition-all duration-300 pointer-events-auto"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            {/* Botón siguiente */}
            <motion.button
              onClick={nextImage}
              className="mr-4 sm:mr-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                         rounded-full bg-black/50 backdrop-blur-sm border border-white/20
                         flex items-center justify-center text-white hover:bg-brand hover:text-black
                         transition-all duration-300 pointer-events-auto"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Thumbnails */}
        <motion.div
          className="w-full max-w-2xl mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <ThumbnailGrid
            images={images}
            currentIndex={currentIndex}
            onSelect={goToSlide}
          />
        </motion.div>

        {/* Indicadores de progreso */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {images.map((_: GalleryImage, index: number) => (
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

        {/* Progress bar */}
        <div className="w-full max-w-md h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.5, ease: "linear" }}
            key={currentIndex}
          />
        </div>

        {/* Contador */}
        <motion.p
          className="mt-4 sm:mt-6 text-white/60 text-sm sm:text-base font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {currentIndex + 1} / {images.length}
        </motion.p>
      </div>
    </section>
  );
}