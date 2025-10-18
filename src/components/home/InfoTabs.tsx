'use client';
import { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  PhoneIcon,
  AtSymbolIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useHydrated } from '@/hooks/useHydrated';
import { useGymSettings } from '@/hooks/useGymSettings';

// ==========================================
// 📝 CONFIGURACIÓN - EDITA AQUÍ TUS DATOS
// ==========================================

type TabKey = 'horarios' | 'ubicacion' | 'entrenadores' | 'contacto';

// 🏷️ PESTAÑAS DE NAVEGACIÓN - Edita labels e iconos aquí
const tabs: { key: TabKey; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'horarios', label: 'Horarios', Icon: ClockIcon },
  { key: 'ubicacion', label: 'Ubicación', Icon: MapPinIcon },
  { key: 'entrenadores', label: 'Nuestros Entrenadores', Icon: UsersIcon },
  { key: 'contacto', label: 'Contáctanos', Icon: EnvelopeIcon },
];

// ⏰ HORARIOS BASE - Solo edita los días y horas aquí (isToday se calcula automáticamente)
const baseSchedule = [
  { day: 'Lunes', hours: '6:00 - 22:00', dayIndex: 1 }, // dayIndex: 1 = Lunes
  { day: 'Martes', hours: '6:00 - 22:00', dayIndex: 2 }, // dayIndex: 2 = Martes
  { day: 'Miércoles', hours: '6:00 - 22:00', dayIndex: 3 }, // dayIndex: 3 = Miércoles
  { day: 'Jueves', hours: '6:00 - 22:00', dayIndex: 4 }, // dayIndex: 4 = Jueves
  { day: 'Viernes', hours: '6:00 - 22:00', dayIndex: 5 }, // dayIndex: 5 = Viernes
  { day: 'Sábado', hours: '9:00 - 17:00', dayIndex: 6 }, // dayIndex: 6 = Sábado
  // dayIndex: 0 = Domingo (no incluido porque están cerrados)
];

// 🤖 FUNCIÓN PARA DETECTAR EL DÍA ACTUAL AUTOMÁTICAMENTE
const getCurrentDayIndex = (): number => {
  // Obtener el día actual (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const today = new Date();
  return today.getDay();
};

// 💪 ENTRENADORES - Agrega/edita entrenadores aquí
const trainers = [
  {
    id: 1,
    name: 'Erick De Luna Hernández',
    role: 'Jefe',
    avatar: '/img/trainers/erick.jpg', // 📷 Cambia la ruta de la imagen aquí
    bio: 'Especialista en entrenamiento HIIT y pérdida de peso. 7 años de experiencia transformando vidas.',
    tags: ['HIIT', 'Cardio', 'Pérdida de peso'],
    experience: '7 años',
    certifications: ['NASM-CPT', 'HIIT Specialist']
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    role: 'Entrenador de Fuerza',
    avatar: '/img/trainers/carlos.jpg', // 📷 Cambia la ruta de la imagen aquí
    bio: 'Campeón nacional de powerlifting. Especialista en fuerza y ganancia muscular.',
    tags: ['Powerlifting', 'Hipertrofia', 'Nutrición'],
    experience: '5 años',
    certifications: ['CSCS', 'Powerlifting Coach']
  },
  // 🔄 AGREGA MÁS ENTRENADORES AQUÍ siguiendo el mismo formato
];

// 📍 INFORMACIÓN DE UBICACIÓN - Ahora se obtiene de la configuración del gimnasio
const staticLocationInfo = {
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3553.017366937368!2d-101.56074932591812!3d27.061199753696098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x868bc7097088ba89%3A0xb8df300649d83db7!2sMUSCLE%20UP%20GYM!5e0!3m2!1ses!2smx!4v1748582869049!5m2!1ses!2smx',
  landmarks: [
    'Entre 2-3 minutos de la plaza principal',
    '5 cuadras de la plaza principal',
    'Fácil acceso en transporte público'
  ]
};

// 📞 INFORMACIÓN DE CONTACTO - Se obtiene de la configuración del gimnasio
const staticContactInfo = {
  email: 'administracion@muscleupgym.com.mx',
  schedule: 'Lunes a Viernes 8:00 – 20:00',
  socialMedia: {
    instagram: 'https://instagram.com/tu-pagina', // 🔗 Agrega tu Instagram si quieres
  }
};

// ==========================================
// 🎨 COMPONENTES DE ANIMACIÓN
// ==========================================

// Componente para cada card de horario
const ScheduleCard = ({ day, hours, isToday, index }: { 
  day: string; 
  hours: string; 
  isToday: boolean; 
  index: number; 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
      }}
      className={`relative overflow-hidden rounded-xl p-4 sm:p-6 text-center shadow-lg
                 transition-all duration-300 cursor-pointer
                 ${isToday 
                   ? 'bg-gradient-to-br from-brand to-brand/80 text-black' 
                   : 'bg-gradient-to-br from-white to-gray-100 text-black hover:from-gray-50'}`}
    >
      {/* Efecto de brillo */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ["-100%", "100%"],
          opacity: [0, 0.5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "linear"
        }}
      />
      
      {isToday && (
        <motion.div
          className="absolute top-2 right-2 bg-black/20 text-black text-xs px-2 py-1 rounded-full font-bold"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          HOY
        </motion.div>
      )}
      
      <motion.h4 
        className="font-bold text-lg sm:text-xl mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 + index * 0.1 }}
      >
        {day}
      </motion.h4>
      
      <motion.p 
        className="text-sm sm:text-base font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 + index * 0.1 }}
      >
        {hours}
      </motion.p>
    </motion.div>
  );
};

// Componente para cada entrenador
const TrainerCard = ({ trainer, index }: { trainer: typeof trainers[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: -20 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.02,
        rotateY: 5,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
      }}
      className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 sm:p-8 
                 shadow-xl border border-white/10 overflow-hidden group"
    >
      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent opacity-0
                   group-hover:opacity-100 transition-opacity duration-500"
      />
      
      {/* Avatar con animación */}
      <motion.div 
        className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-brand shadow-xl">
          <Image
            src={trainer.avatar}
            alt={trainer.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
          />
        </div>
        
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

      {/* Información del entrenador */}
      <div className="text-center space-y-3 sm:space-y-4 relative z-10">
        <motion.h4 
          className="text-xl sm:text-2xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          {trainer.name}
        </motion.h4>
        
        <motion.p 
          className="text-brand font-semibold text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          {trainer.role}
        </motion.p>
        
        <motion.div 
          className="flex justify-center gap-4 text-sm text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <span>📅 {trainer.experience}</span>
        </motion.div>
        
        <motion.p 
          className="text-white/80 text-sm sm:text-base leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + index * 0.1 }}
        >
          {trainer.bio}
        </motion.p>
        
        {/* Tags de especialidades */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 + index * 0.1 }}
        >
          {trainer.tags.map((tag, tagIndex) => (
            <motion.span
              key={tag}
              className="bg-brand text-black px-3 py-1 rounded-full text-sm font-medium"
              whileHover={{ scale: 1.1 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 + tagIndex * 0.05 }}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
        
        {/* Certificaciones */}
        <motion.div 
          className="text-xs text-white/40 border-t border-white/10 pt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 + index * 0.1 }}
        >
          <p>🏆 {trainer.certifications.join(' • ')}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ==========================================
// 🏠 COMPONENTE PRINCIPAL
// ==========================================

export default function InfoTabs() {
  const [active, setActive] = useState<TabKey>('horarios');
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });
  const hydrated = useHydrated();

  // Obtener configuración del gimnasio
  const { settings, getPhoneLink } = useGymSettings();

  // Combinar configuración del gimnasio con datos estáticos
  const locationInfo = {
    address: settings.gym_address,
    ...staticLocationInfo
  };

  const contactInfo = {
    phone: settings.gym_phone.replace(/\s/g, ''),
    ...staticContactInfo,
    socialMedia: {
      facebook: settings.gym_facebook_url,
      ...staticContactInfo.socialMedia
    }
  };

  // 🤖 CÁLCULO AUTOMÁTICO DEL DÍA ACTUAL
  // ✅ Solo se calcula del lado del cliente después de la hidratación
  const schedule = useMemo(() => {
    // Si aún no está hidratado, retornar schedule sin marcar ningún día como "hoy"
    if (!hydrated) {
      return baseSchedule.map(item => ({
        ...item,
        isToday: false
      }));
    }

    const currentDayIndex = getCurrentDayIndex();

    // 🐛 Debug info - Puedes quitar esto en producción
    console.log('🗓️ Día actual detectado:', {
      dayIndex: currentDayIndex,
      dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][currentDayIndex],
      timestamp: new Date().toLocaleString('es-MX')
    });

    return baseSchedule.map(item => ({
      ...item,
      isToday: item.dayIndex === currentDayIndex
    }));
  }, [hydrated]); // Se recalcula cuando cambia el estado de hidratación

  // Variantes de animación para el contenido de las pestañas
  const tabContentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
      filter: "blur(10px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      filter: "blur(10px)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="info" 
      className="relative bg-black text-white py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/30 to-black" />
      
      {/* Partículas de fondo */}
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
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 📋 ENCABEZADO */}
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
            Información General MUP
            <motion.span 
              className="inline-block ml-2 text-4xl sm:text-5xl md:text-6xl"
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              📋
            </motion.span>
          </motion.h2>
          
          <motion.div
            className="w-16 sm:w-20 md:w-24 h-[2px] sm:h-[3px] bg-brand mx-auto mb-4 sm:mb-6 rounded-full"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Encuentra nuestros horarios, ubicación, entrenadores y contacto
          </motion.p>
        </motion.header>

        {/* 🧭 NAVEGACIÓN DE PESTAÑAS */}
        <motion.nav 
          className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {tabs.map(({ key, label, Icon }, index) => (
            <motion.button
              key={key}
              onClick={() => setActive(key)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl
                         font-medium transition-all duration-300 relative overflow-hidden
                         ${active === key 
                           ? 'bg-brand text-black shadow-lg shadow-brand/30' 
                           : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
            >
              {/* Efecto de brillo en pestaña activa */}
              {active === key && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "linear"
                  }}
                />
              )}
              
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">{label}</span>
            </motion.button>
          ))}
        </motion.nav>

        {/* 📄 CONTENIDO DE LAS PESTAÑAS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ⏰ PESTAÑA DE HORARIOS */}
            {active === 'horarios' && (
              <div className="space-y-6 sm:space-y-8">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ClockIcon className="w-8 h-8 text-brand" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Horarios</h3>
                </motion.div>
                
                <motion.p 
                  className="text-white/80 text-lg leading-relaxed max-w-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Nuestro gimnasio está abierto de Lunes a Sábado. Te esperamos para entrenar juntos:
                </motion.p>

                {/* Grid de horarios con detección automática del día */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                  {schedule.map((item, index) => (
                    <ScheduleCard 
                      key={item.day}
                      day={item.day}
                      hours={item.hours}
                      isToday={item.isToday} // 🤖 Esto se calcula automáticamente
                      index={index}
                    />
                  ))}
                </div>

                {/* Información adicional con día detectado */}
                <motion.div 
                  className="mt-8 p-4 sm:p-6 bg-brand/10 border-l-4 border-brand rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-brand/90 font-medium">
                    ⚠️ Entrada hasta 1 hora antes del cierre • Domingos cerrado para mantenimiento
                  </p>
                
                </motion.div>
              </div>
            )}

            {/* 📍 PESTAÑA DE UBICACIÓN */}
            {active === 'ubicacion' && (
              <div className="space-y-6 sm:space-y-8">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MapPinIcon className="w-8 h-8 text-brand" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ubicación</h3>
                </motion.div>

                {/* Mapa embebido */}
                <motion.div 
                  className="w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <iframe
                    src={locationInfo.mapUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </motion.div>

                {/* Información de dirección */}
                <motion.div 
                  className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 sm:p-8 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="space-y-4">
                    <motion.p 
                      className="flex items-start gap-3 text-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <MapPinIcon className="w-6 h-6 text-brand flex-shrink-0 mt-1" />
                      <span className="text-white/90">{locationInfo.address}</span>
                    </motion.p>
                    
                    <motion.p 
                      className="text-brand font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      📍 Estamos ubicados en una zona de fácil acceso, cerca de la plaza principal.
                    </motion.p>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                      {locationInfo.landmarks.map((landmark, index) => (
                        <motion.p
                          key={landmark}
                          className="flex items-center gap-3 text-white/80"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                        >
                          <ArrowRightIcon className="w-5 h-5 text-brand" />
                          {landmark}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 💪 PESTAÑA DE ENTRENADORES */}
            {active === 'entrenadores' && (
              <div className="space-y-6 sm:space-y-8">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <UsersIcon className="w-8 h-8 text-brand" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Nuestros Entrenadores</h3>
                </motion.div>
                
                <motion.p 
                  className="text-white/80 text-lg leading-relaxed max-w-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Conoce a nuestro equipo de profesionales certificados, listos para ayudarte a alcanzar tus metas:
                </motion.p>

                {/* Grid de entrenadores */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {trainers.map((trainer, index) => (
                    <TrainerCard 
                      key={trainer.id}
                      trainer={trainer}
                      index={index}
                    />
                  ))}
                </div>

              </div>
            )}

            {/* 📞 PESTAÑA DE CONTACTO */}
            {active === 'contacto' && (
              <div className="space-y-6 sm:space-y-8">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <EnvelopeIcon className="w-8 h-8 text-brand" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Contáctanos</h3>
                </motion.div>
                
                <motion.p 
                  className="text-white/80 text-lg leading-relaxed max-w-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  ¿Tienes alguna pregunta? Estamos aquí para ayudarte a comenzar tu transformación:
                </motion.p>

                {/* Información de contacto */}
                <motion.div 
                  className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <PhoneIcon className="w-6 h-6 text-brand" />
                    <div>
                      <p className="font-semibold text-white">Teléfono</p>
                      <a 
                        href={`tel:${contactInfo.phone}`}
                        className="text-brand hover:text-brand/80 transition-colors text-lg"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <AtSymbolIcon className="w-6 h-6 text-brand" />
                    <div>
                      <p className="font-semibold text-white">Email</p>
                      <a 
                        href={`mailto:${contactInfo.email}`}
                        className="text-brand hover:text-brand/80 transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <ClockIcon className="w-6 h-6 text-brand" />
                    <div>
                      <p className="font-semibold text-white">Horario de atención</p>
                      <p className="text-white/80">{contactInfo.schedule}</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Redes sociales */}
                <motion.div 
                  className="flex flex-wrap items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.a
                    href={contactInfo.socialMedia.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2c0-2 1-3 3-3h2v3h-2c-.3 0-1 0-1 1v2h3l-.5 3h-2.5v7A10 10 0 0 0 22 12z" />
                    </svg>
                    <span className="font-medium text-white">Facebook</span>
                  </motion.a>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}