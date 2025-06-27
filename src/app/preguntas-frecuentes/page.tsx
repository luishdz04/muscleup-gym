'use client';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  HomeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

interface FAQSection {
  id: string;
  title: string;
  icon: JSX.Element;
  items: FAQItem[];
}

export default function PreguntasFrecuentes() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true });
  const isSectionInView = useInView(sectionRef, { once: true, margin: "-10%" });

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleMapsClick = () => {
    window.open('https://maps.app.goo.gl/preWqm3w7S2JZLg17', '_blank', 'noopener,noreferrer');
  };

  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/Lindavistagym', '_blank', 'noopener,noreferrer');
  };

  const faqSections: FAQSection[] = [
    {
      id: 'inscripcion',
      title: '🧾 INSCRIPCIÓN Y MEMBRESÍAS',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      items: [
        {
          question: '¿Cómo me inscribo a Muscle Up Gym?',
          answer: 'Puedes inscribirte directamente en recepción o desde nuestro sitio web, en el apartado de inscripción. Solo necesitas llenar el formulario y aceptar el reglamento.'
        },
        {
          question: '¿Cuál es la edad mínima para inscribirme?',
          answer: 'La edad mínima es de 12 años. Si eres menor de edad, es obligatorio el consentimiento y firma de padre, madre o tutor.'
        },
        {
          question: '¿Cuáles son las tarifas actuales?',
          answer: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Inscripción:</span>
                  <div className="text-2xl font-bold text-white">$150 MXN</div>
                </div>
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Mensualidad general:</span>
                  <div className="text-2xl font-bold text-white">$530 MXN</div>
                </div>
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Mensualidad estudiantil:</span>
                  <div className="text-2xl font-bold text-white">$450 MXN</div>
                </div>
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Visita individual:</span>
                  <div className="text-2xl font-bold text-white">$150 MXN</div>
                </div>
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Semana:</span>
                  <div className="text-2xl font-bold text-white">$270 MXN</div>
                </div>
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                  <span className="font-semibold text-brand">Quincena:</span>
                  <div className="text-2xl font-bold text-white">$380 MXN</div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: '¿Qué formas de pago aceptan?',
          answer: 'Efectivo, transferencia bancaria y tarjeta (débito o crédito, mediante terminal).'
        },
        {
          question: '¿Puedo congelar mi membresía?',
          answer: 'No. Las membresías no pueden ser congeladas ni transferidas. Puedes indicar una fecha futura de inicio al realizar el pago por anticipado.'
        },
        {
          question: '¿Qué pasa si dejo de asistir por un periodo largo?',
          answer: 'Si pasan más de 6 meses sin actividad, tus datos se depurarán y deberás cubrir nuevamente la inscripción.'
        }
      ]
    },
    {
      id: 'horarios',
      title: '⏰ HORARIOS Y ACCESO',
      icon: <ClockIcon className="w-6 h-6" />,
      items: [
        {
          question: '¿Cuáles son los horarios del gimnasio?',
          answer: (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-6">
                <div className="font-semibold text-brand mb-4 text-lg">📅 Horarios Regulares:</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-brand rounded-full"></div>
                    <span className="text-white/90"><strong className="text-brand">Lunes a viernes:</strong> 6:00 a.m. – 10:00 p.m.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-brand rounded-full"></div>
                    <span className="text-white/90"><strong className="text-brand">Sábados:</strong> 9:00 a.m. – 5:00 p.m.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-white/90"><strong className="text-red-400">Domingos:</strong> cerrado</span>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: '¿Qué pasa en días festivos?',
          answer: (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-6">
                <div className="font-semibold text-brand mb-4 text-lg">🎉 Horarios Festivos:</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-white/90"><strong className="text-yellow-400">Días festivos entre semana:</strong> 8:30 a.m. – 6:30 p.m.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-white/90"><strong className="text-yellow-400">Sábados festivos:</strong> 9:00 a.m. – 3:00 p.m.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-white/90"><strong className="text-red-400">Cerramos:</strong> 25 de diciembre, 1 de enero y Viernes y Sábado Santo</span>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: '¿Cómo ingreso al gimnasio?',
          answer: 'Mediante tu huella digital, válida únicamente si tu membresía está vigente. El acceso máximo es de 2 veces por día.'
        }
      ]
    },
    {
      id: 'entrenamiento',
      title: '🏋️‍♂️ ENTRENAMIENTO Y RUTINAS',
      icon: <UserGroupIcon className="w-6 h-6" />,
      items: [
        {
          question: '¿Qué tipo de rutinas ofrecen?',
          answer: (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-6">
                <div className="font-semibold text-brand mb-3 text-lg">🎯 Rutinas Estructuradas Gratuitas:</div>
                <p className="text-white/90 leading-relaxed mb-3">
                  Con seguimiento semanal y progresivo (niveles 1 al 5), enfocadas en recomposición corporal, 
                  ganancia de masa muscular y pérdida de grasa.
                </p>
              </div>
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-6">
                <div className="font-semibold text-brand mb-3 text-lg">💪 Diseño Personalizado:</div>
                <p className="text-white/90 leading-relaxed mb-3">
                  Entrenamiento y planes de alimentación con costo extra, ajustados a tus objetivos, 
                  historial y nivel.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                <div className="text-white/90 leading-relaxed">
                  <strong className="text-brand">Supervisión Profesional:</strong> Ambas opciones son elaboradas y supervisadas por 
                  nuestro encargado del Departamento de Ciencias del Ejercicio, <strong className="text-brand">Erick Francisco De Luna Hernández</strong>, 
                  licenciado por la UANL y con estudios de posgrado en Fuerza y Acondicionamiento.
                </div>
              </div>
            </div>
          )
        },
        {
          question: '¿Quién me apoya en el gimnasio?',
          answer: 'Nuestros instructores de turno están capacitados para ayudarte en la ejecución de los ejercicios y darte seguimiento. Todos trabajan bajo la supervisión del área técnica.'
        }
      ]
    },
    {
      id: 'reglamento',
      title: '📋 REGLAMENTO Y CONDUCTA',
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      items: [
        {
          question: '¿Qué normas debo seguir dentro del gimnasio?',
          answer: (
            <div className="space-y-4">
              <div className="text-brand font-semibold mb-4 text-lg">⚖️ Normas obligatorias:</div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  '✅ Ingreso obligatorio con huella digital',
                  '🧽 Uso de 2 toallas (una para máquinas, otra para sudor)',
                  '👕 Ropa deportiva adecuada',
                  '🧹 Limpiar aparatos después de usarlos',
                  '⚠️ No lanzar o azotar los equipos',
                  '🚫 No fingir ser entrenador personal',
                  '🚫 No vender suplementos ni servicios dentro',
                  '🚫 No traer mascotas ni alimentos',
                  '🤝 Comportamiento respetuoso',
                  '🚫 No portar armas, drogas o alcohol'
                ].map((rule, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 p-3 rounded-lg text-white/90">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )
        },
        {
          question: '¿Qué pasa si no cumplo el reglamento?',
          answer: 'Podrás recibir desde una advertencia hasta la baja definitiva, sin reembolso. Muscle Up Gym se reserva el derecho de admisión.'
        }
      ]
    },
    {
      id: 'contacto',
      title: '📍 UBICACIÓN Y CONTACTO',
      icon: <MapPinIcon className="w-6 h-6" />,
      items: [
        {
          question: '¿Dónde están ubicados?',
          answer: (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <MapPinIcon className="w-6 h-6 text-brand flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-brand mb-2 text-lg">📍 Nuestra Dirección:</div>
                    <div className="text-white/90 leading-relaxed">
                      Francisco I. Madero 708,<br />
                      Colonia Lindavista,<br />
                      San Buenaventura, Coahuila,<br />
                      México
                    </div>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={handleMapsClick}
                className="w-full bg-brand hover:bg-brand/90 text-black px-6 py-4 rounded-xl 
                         font-bold transition-all duration-300 flex items-center justify-center gap-3
                         shadow-lg hover:shadow-xl hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPinIcon className="w-5 h-5" />
                📱 Abrir en Google Maps
              </motion.button>
            </div>
          )
        },
        {
          question: '¿Tienen redes sociales?',
          answer: (
            <div className="space-y-4">
              <p className="text-white/90 leading-relaxed">
                Sí, puedes encontrarnos en Facebook como <strong className="text-brand">Muscle Up Gym</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  onClick={handleFacebookClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl 
                           font-bold transition-all duration-300 flex items-center justify-center gap-3
                           shadow-lg hover:shadow-xl hover:scale-105"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2c0-2 1-3 3-3h2v3h-2c-.3 0-1 0-1 1v2h3l-.5 3h-2.5v7A10 10 0 0 0 22 12z" />
                  </svg>
                  Visitar Facebook
                </motion.button>
                <motion.a
                  href="tel:8661127905"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl 
                           font-bold transition-all duration-300 flex items-center justify-center gap-3
                           shadow-lg hover:shadow-xl hover:scale-105"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PhoneIcon className="w-5 h-5" />
                  Llamar: 866 112 7905
                </motion.a>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header de la página */}
      <motion.header
        ref={headerRef}
        className="bg-gradient-to-br from-zinc-900 to-black py-16 sm:py-20 md:py-24 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-brand/20 rounded-full"
              style={{
                left: `${10 + i * 8}%`,
                top: `${15 + (i % 4) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 4 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Botón de regreso */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand hover:text-brand/80 
                       transition-colors duration-300 group bg-white/5 px-4 py-2 rounded-lg
                       border border-white/10 hover:border-brand/30"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al inicio</span>
            </Link>
          </motion.div>

          {/* Logo y título */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.3 }}
          >
            {/* Logo */}
            <motion.div
              className="flex justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-brand shadow-2xl">
                <Image
                  src="/img/testimonios.png"
                  alt="Muscle Up GYM Logo"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 96px, 128px"
                />
              </div>
            </motion.div>
            
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <QuestionMarkCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-brand" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold
                           bg-gradient-to-r from-white via-white to-brand bg-clip-text text-transparent">
                Preguntas Frecuentes
              </h1>
            </motion.div>
            
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={isHeaderInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-brand mb-3">
                Muscle Up GYM
              </h2>
              <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
                Encuentra respuestas a las preguntas más comunes sobre nuestros servicios, 
                membresías, horarios y políticas. Tu salud y bienestar es nuestra misión.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Contenido de las FAQs */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqSections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                         backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              >
                {/* Header de la sección */}
                <div className="bg-gradient-to-r from-brand to-brand/80 p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-black">
                      {section.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Items de FAQ */}
                <div className="divide-y divide-white/10">
                  {section.items.map((item, itemIndex) => {
                    const itemId = `${section.id}-${itemIndex}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <div key={itemId} className="border-b border-white/10 last:border-b-0">
                        <motion.button
                          onClick={() => toggleItem(itemId)}
                          className="w-full p-6 text-left hover:bg-white/5 transition-colors duration-200
                                   flex items-center justify-between gap-4"
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        >
                          <span className="font-semibold text-white/90 flex-1 text-lg">
                            {item.question}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <ChevronDownIcon className="w-6 h-6 text-brand" />
                          </motion.div>
                        </motion.button>

                        <motion.div
                          initial={false}
                          animate={{
                            height: isOpen ? 'auto' : 0,
                            opacity: isOpen ? 1 : 0
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <div className="text-white/90 leading-relaxed">
                              {typeof item.answer === 'string' ? (
                                <p className="text-lg">{item.answer}</p>
                              ) : (
                                item.answer
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Botones de acción */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-brand text-black px-8 py-4 
                       rounded-xl font-bold hover:bg-brand/90 transition-all duration-300
                       shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Regresar al sitio</span>
            </Link>

            <a
              href="tel:8661127905"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-4 
                       rounded-xl font-bold hover:bg-white/20 transition-all duration-300
                       border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>Llamar: 866 112 7905</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Botón flotante para volver arriba */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-brand hover:bg-brand/90 text-black p-4 rounded-full
                 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <ChevronUpIcon className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
