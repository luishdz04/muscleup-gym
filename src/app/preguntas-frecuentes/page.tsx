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
  HomeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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
  const isHeaderInView = useInView(headerRef, { once: true });

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
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Inscripción:</span> $150 MXN
                </div>
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Mensualidad general:</span> $530 MXN
                </div>
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Mensualidad estudiantil:</span> $450 MXN
                </div>
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Visita individual:</span> $150 MXN
                </div>
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Semana:</span> $270 MXN
                </div>
                <div className="bg-brand/10 p-3 rounded-lg">
                  <span className="font-semibold text-brand">Quincena:</span> $380 MXN
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
            <div className="space-y-3">
              <div className="bg-brand/10 p-4 rounded-lg">
                <div className="font-semibold text-brand mb-2">Horarios Regulares:</div>
                <div className="space-y-1">
                  <div>🕕 <strong>Lunes a viernes:</strong> 6:00 a.m. – 10:00 p.m.</div>
                  <div>🕘 <strong>Sábados:</strong> 9:00 a.m. – 5:00 p.m.</div>
                  <div>❌ <strong>Domingos:</strong> cerrado</div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: '¿Qué pasa en días festivos?',
          answer: (
            <div className="space-y-3">
              <div className="bg-brand/10 p-4 rounded-lg">
                <div className="font-semibold text-brand mb-2">Horarios Festivos:</div>
                <div className="space-y-1">
                  <div>🎉 <strong>Días festivos entre semana:</strong> 8:30 a.m. – 6:30 p.m.</div>
                  <div>🎉 <strong>Sábados festivos:</strong> 9:00 a.m. – 3:00 p.m.</div>
                  <div>❌ <strong>Cerramos:</strong> 25 de diciembre, 1 de enero y Viernes y Sábado Santo</div>
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
              <div className="bg-brand/10 p-4 rounded-lg">
                <div className="font-semibold text-brand mb-2">🎯 Rutinas Estructuradas Gratuitas:</div>
                <p className="text-sm text-gray-600 mb-2">
                  Con seguimiento semanal y progresivo (niveles 1 al 5), enfocadas en recomposición corporal, 
                  ganancia de masa muscular y pérdida de grasa.
                </p>
              </div>
              <div className="bg-brand/10 p-4 rounded-lg">
                <div className="font-semibold text-brand mb-2">💪 Diseño Personalizado:</div>
                <p className="text-sm text-gray-600 mb-2">
                  Entrenamiento y planes de alimentación con costo extra, ajustados a tus objetivos, 
                  historial y nivel.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-brand">
                <div className="text-sm">
                  <strong>Supervisión Profesional:</strong> Ambas opciones son elaboradas y supervisadas por 
                  nuestro encargado del Departamento de Ciencias del Ejercicio, <strong>Erick Francisco De Luna Hernández</strong>, 
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
            <div className="space-y-2">
              <div className="text-sm font-medium text-brand mb-3">Normas obligatorias:</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  '✅ Ingreso obligatorio con huella digital',
                  '🏃‍♂️ Uso de 2 toallas (una para máquinas, otra para sudor)',
                  '👕 Ropa deportiva adecuada',
                  '🧽 Limpiar aparatos después de usarlos',
                  '⚠️ No lanzar o azotar los equipos',
                  '🚫 No fingir ser entrenador personal',
                  '🚫 No vender suplementos ni servicios dentro',
                  '🚫 No traer mascotas ni alimentos',
                  '🤝 Comportamiento respetuoso',
                  '🚫 No portar armas, drogas o alcohol'
                ].map((rule, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
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
            <div className="space-y-3">
              <div className="bg-brand/10 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-brand flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-brand mb-1">Nuestra Dirección:</div>
                    <div className="text-sm">
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
                className="w-full bg-brand hover:bg-brand/90 text-white px-4 py-3 rounded-lg 
                         font-medium transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPinIcon className="w-5 h-5" />
                Abrir en Google Maps
              </motion.button>
            </div>
          )
        },
        {
          question: '¿Tienen redes sociales?',
          answer: (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Sí, puedes encontrarnos en Facebook como Muscle Up Gym.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={handleFacebookClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg 
                           font-medium transition-all duration-300 flex items-center justify-center gap-2"
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
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg 
                           font-medium transition-all duration-300 flex items-center justify-center gap-2"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <motion.div
        ref={headerRef}
        className="bg-gradient-to-r from-black to-zinc-900 text-white py-16 px-4"
        initial={{ opacity: 0, y: -50 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={isHeaderInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/" className="hover:text-brand transition-colors flex items-center gap-1">
              <HomeIcon className="w-4 h-4" />
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">Preguntas Frecuentes</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4
                       bg-gradient-to-r from-brand to-brand/80 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Preguntas Frecuentes
          </motion.h1>

          <motion.p
            className="text-xl text-white/80 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Encuentra respuestas a las preguntas más comunes sobre nuestros servicios, 
            membresías y políticas.
          </motion.p>
        </div>
      </motion.div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {faqSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Section Header */}
              <div className="bg-gradient-to-r from-brand to-brand/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="text-white">
                    {section.icon}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* FAQ Items */}
              <div className="divide-y divide-gray-100">
                {section.items.map((item, itemIndex) => {
                  const itemId = `${section.id}-${itemIndex}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <motion.div
                      key={itemId}
                      className="border-b border-gray-100 last:border-b-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                    >
                      <motion.button
                        onClick={() => toggleItem(itemId)}
                        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200
                                 flex items-center justify-between gap-4"
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      >
                        <span className="font-semibold text-gray-800 flex-1">
                          {item.question}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDownIcon className="w-5 h-5 text-brand" />
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
                          <div className="text-gray-600 leading-relaxed">
                            {typeof item.answer === 'string' ? (
                              <p>{item.answer}</p>
                            ) : (
                              item.answer
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Back to Top Button */}
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-brand hover:bg-brand/90 text-white p-4 rounded-full
                     shadow-lg transition-all duration-300 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <ChevronUpIcon className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
