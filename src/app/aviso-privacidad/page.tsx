'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  ShieldCheckIcon, 
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CameraIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function AvisoPrivacidad() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header de la página */}
      <motion.header
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
            animate={{ opacity: 1, y: 0 }}
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
              <ShieldCheckIcon className="w-10 h-10 sm:w-12 sm:h-12 text-brand" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold
                           bg-gradient-to-r from-white via-white to-brand bg-clip-text text-transparent">
                Aviso de Privacidad
              </h1>
            </motion.div>
            
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-brand mb-3">
                Muscle Up GYM
              </h2>
              <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
                Tu privacidad es fundamental para nosotros. Este aviso explica cómo recopilamos, 
                usamos y protegemos tu información personal de acuerdo con la legislación mexicana vigente.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Contenido del aviso */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 
                       backdrop-blur-lg border border-white/10 rounded-2xl p-8 sm:p-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Información del responsable */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">Responsable del Tratamiento</h3>
              </div>
              
              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/90 leading-relaxed">
                      <strong className="text-brand">Razón Social:</strong> Muscle Up GYM<br />
                      <strong>Domicilio:</strong> Francisco I. Madero 708, Colonia Lindavista, 
                      San Buenaventura, Coahuila, México, C.P. 25508<br />
                      <strong>Responsable:</strong> Administración
                    </p>
                  </div>
                  <div>
                    <p className="text-white/90 leading-relaxed">
                      <strong>Teléfono:</strong> 866 112 7905<br />
                      <strong>Email:</strong> administracion@muscleupgym.com.mx<br />
                      <strong>Sitio web:</strong> www.muscleupgym.com.mx<br />
                      <strong>Horarios de atención:</strong><br />
                      Lunes a Viernes: 6:00 - 22:00 hrs<br />
                      Sábados: 9:00 - 17:00 hrs
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Finalidades del tratamiento */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">¿Para qué fines utilizamos sus datos personales?</h3>
              </div>
              
              <p className="text-white/90 leading-relaxed mb-6">
                Los datos personales que recabamos de usted los utilizaremos para las siguientes 
                <strong className="text-brand"> finalidades primarias</strong>, que son necesarias para el servicio que solicita:
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">🏋️ Finalidades Primarias</h4>
                  <ul className="text-white/90 space-y-2">
                    <li>• Registro y administración de membresías</li>
                    <li>• Control de acceso a las instalaciones</li>
                    <li>• Prestación de servicios de entrenamiento</li>
                    <li>• Elaboración de rutinas y planes de ejercicio</li>
                    <li>• Facturación y cobranza de servicios</li>
                    <li>• Atención de emergencias médicas</li>
                    <li>• Cumplimiento de obligaciones fiscales y legales</li>
                    <li>• Atención al cliente y resolución de quejas</li>
                    <li>• Seguridad de las instalaciones y usuarios</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">📢 Finalidades Secundarias</h4>
                  <ul className="text-white/90 space-y-2">
                    <li>• Envío de promociones y ofertas especiales</li>
                    <li>• Invitaciones a eventos deportivos y sociales</li>
                    <li>• Encuestas de satisfacción del servicio</li>
                    <li>• Marketing directo y publicidad personalizada</li>
                    <li>• Estudios de mercado y estadísticas</li>
                    <li>• Seguimiento de progreso y resultados</li>
                    <li>• Contenido para redes sociales (con autorización)</li>
                    <li>• Programas de referidos y recomendaciones</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-yellow-100 text-sm">
                    <strong>Importante:</strong> Para las finalidades secundarias, requerimos su consentimiento expreso. 
                    Puede otorgarlo o negarlo sin que esto afecte la prestación de nuestros servicios principales.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Datos personales que recabamos */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">¿Qué datos personales recabamos?</h3>
              </div>

              <p className="text-white/90 leading-relaxed mb-6">
                Para cumplir con las finalidades mencionadas, recabamos los siguientes datos personales 
                a través de nuestro formulario de registro en línea:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos Personales</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Nombres </li>
                    <li>• Apellidos </li>
                    <li>• Correo electrónico </li>
                    <li>• Fecha de nacimiento </li>
                    <li>• Género </li>
                    <li>• Estado civil </li>
                    <li>• Fotografía de perfil </li>
                    <li>• Contraseña </li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <PhoneIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos de Contacto</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Número de WhatsApp </li>
                    <li>• Calle </li>
                    <li>• Número de domicilio </li>
                    <li>• Colonia </li>
                    <li>• Estado </li>
                    <li>• Ciudad</li>
                    <li>• Código postal </li>
                    <li>• País </li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <HeartIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos de Emergencia</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Nombre del contacto de emergencia </li>
                    <li>• Teléfono de emergencia </li>
                    <li>• Condición médica </li>
                    <li>• Tipo de sangre </li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <CameraIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos Generales</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Referido por </li>
                    <li>• Motivación principal </li>
                    <li>• Nivel de entrenamiento </li>
                    <li>• Preferencia de planes </li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <DocumentTextIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos de Consentimiento</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Aceptación del reglamento </li>
                    <li>• Firma digital</li>
                    <li>• INE del tutor  - solo menores de edad</li>
                    <li>• Consentimientos específicos</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="w-6 h-6 text-brand" />
                    <h4 className="text-lg font-bold text-brand">Datos de Navegación</h4>
                  </div>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Dirección IP</li>
                    <li>• Cookies del navegador</li>
                    <li>• Páginas visitadas</li>
                    <li>• Tiempo en el sitio</li>
                    <li>• Dispositivo utilizado</li>
                    <li>• Sistema operativo</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Transferencia de datos */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">Transferencias de Datos Personales</h3>
              </div>

              <p className="text-white/90 leading-relaxed mb-6">
                Sus datos personales podrán ser transferidos y tratados dentro y fuera del país, por personas 
                distintas a nosotros. En ese sentido, su información puede ser compartida con:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-green-400 mb-4">✅ Transferencias Autorizadas</h4>
                  <ul className="text-white/90 space-y-2">
                    <li>• Proveedores de servicios de pago</li>
                    <li>• Entidades financieras para procesar pagos</li>
                    <li>• Autoridades fiscales (SAT, HACIENDA)</li>
                    <li>• Autoridades de salud cuando sea requerido</li>
                    <li>• Servicios de emergencia médica</li>
                    <li>• Proveedores de tecnología y sistemas</li>
                    <li>• Empresas de marketing (con consentimiento)</li>
                  </ul>
                </div>

                <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-red-400 mb-4">🚫 No Transferimos A</h4>
                  <ul className="text-white/90 space-y-2">
                    <li>• Empresas de ventas no autorizadas</li>
                    <li>• Terceros para fines comerciales sin consentimiento</li>
                    <li>• Bases de datos públicas</li>
                    <li>• Empresas de crédito no relacionadas</li>
                    <li>• Redes sociales sin autorización</li>
                    <li>• Cualquier entidad fuera de México sin garantías</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Derechos ARCO */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">Sus Derechos como Titular (Derechos ARCO)</h3>
              </div>

              <p className="text-white/90 leading-relaxed mb-6">
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos 
                y las condiciones del uso que les damos. Asimismo, es su derecho solicitar:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">A</span>
                  </div>
                  <h4 className="text-lg font-bold text-blue-400 mb-2">ACCESO</h4>
                  <p className="text-white/80 text-sm">
                    Conocer qué datos tenemos de usted y para qué los usamos
                  </p>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">R</span>
                  </div>
                  <h4 className="text-lg font-bold text-green-400 mb-2">RECTIFICACIÓN</h4>
                  <p className="text-white/80 text-sm">
                    Solicitar la corrección de datos inexactos o incompletos
                  </p>
                </div>

                <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">C</span>
                  </div>
                  <h4 className="text-lg font-bold text-red-400 mb-2">CANCELACIÓN</h4>
                  <p className="text-white/80 text-sm">
                    Solicitar que eliminemos sus datos de nuestros registros
                  </p>
                </div>

                <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">O</span>
                  </div>
                  <h4 className="text-lg font-bold text-purple-400 mb-2">OPOSICIÓN</h4>
                  <p className="text-white/80 text-sm">
                    Oponerse al uso de sus datos para fines específicos
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Procedimiento para ejercer derechos */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">¿Cómo ejercer sus derechos ARCO?</h3>
              </div>

              <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-bold text-brand mb-4">📧 Datos de Contacto para Ejercer sus Derechos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/90">
                      <strong>Email:</strong> administracion@muscleupgym.com.mx<br />
                      <strong>Teléfono:</strong> 866 112 7905<br />
                      <strong>Horario de atención:</strong><br />
                      Lunes a Viernes: 6:00 - 22:00 hrs<br />
                      Sábados: 9:00 - 17:00 hrs
                    </p>
                  </div>
                  <div>
                    <p className="text-white/90">
                      <strong>Dirección:</strong> Francisco I. Madero 708, Colonia Lindavista,<br />
                      San Buenaventura, Coahuila, México, C.P. 25508<br />
                      <strong>Responsable:</strong> Administración
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">📝 Requisitos de la Solicitud</h4>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Nombre completo y domicilio</li>
                    <li>• Documentos que acrediten su identidad</li>
                    <li>• Descripción clara de los datos sobre los que busca ejercer sus derechos</li>
                    <li>• Cualquier otro elemento que facilite la localización de los datos</li>
                    <li>• En caso de rectificación, los documentos que sustenten la modificación</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">⏱️ Plazos de Respuesta</h4>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• <strong>Respuesta:</strong> Máximo 20 días hábiles</li>
                    <li>• <strong>Entrega de información:</strong> 15 días hábiles adicionales</li>
                    <li>• <strong>Rectificación/Cancelación:</strong> 15 días hábiles adicionales</li>
                    <li>• <strong>Prórroga:</strong> Hasta 20 días hábiles adicionales (casos complejos)</li>
                    <li>• <strong>Gratuidad:</strong> La primera solicitud es gratuita</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Medidas de seguridad */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">Medidas de Seguridad</h3>
              </div>

              <p className="text-white/90 leading-relaxed mb-6">
                Hemos implementado las medidas de seguridad administrativas, técnicas y físicas 
                necesarias para proteger sus datos personales contra daño, pérdida, alteración, 
                destrucción o el uso, acceso o tratamiento no autorizados.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">🔒 Medidas Técnicas</h4>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Encriptación de datos sensibles</li>
                    <li>• Firewalls y sistemas de detección</li>
                    <li>• Respaldos seguros y cifrados</li>
                    <li>• Acceso mediante autenticación</li>
                    <li>• Monitoreo de sistemas 24/7</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">👥 Medidas Administrativas</h4>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Capacitación continua del personal</li>
                    <li>• Políticas de privacidad internas</li>
                    <li>• Contratos de confidencialidad</li>
                    <li>• Auditorías periódicas</li>
                    <li>• Designación de responsables</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-brand mb-4">🏢 Medidas Físicas</h4>
                  <ul className="text-white/90 space-y-2 text-sm">
                    <li>• Control de acceso a instalaciones</li>
                    <li>• Cámaras de seguridad</li>
                    <li>• Archivos bajo llave</li>
                    <li>• Área restringida para servidores</li>
                    <li>• Destrucción segura de documentos</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Cambios al aviso */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <ClockIcon className="w-8 h-8 text-brand" />
                <h3 className="text-2xl sm:text-3xl font-bold text-brand">Modificaciones al Aviso de Privacidad</h3>
              </div>

              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
                <p className="text-white/90 leading-relaxed mb-4">
                  Nos reservamos el derecho de efectuar modificaciones o actualizaciones al presente 
                  aviso de privacidad en cualquier momento, derivado de nuevas disposiciones legales, 
                  políticas internas, nuevos requerimientos para la prestación u ofrecimiento de 
                  nuestros servicios o prácticas del sector.
                </p>
                <p className="text-blue-300 font-medium">
                  📢 Le informaremos sobre estos cambios a través de: nuestro sitio web, correo electrónico, 
                  o cualquier otro medio de comunicación que determinemos para tal efecto.
                </p>
              </div>
            </motion.div>

            {/* Fecha de actualización */}
            <motion.div
              className="text-center border-t border-white/10 pt-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="text-white/60 text-sm mb-2">
                <strong>Fecha de última actualización:</strong> 16 de junio de 2025
              </p>
              <p className="text-white/40 text-xs">
                Este aviso de privacidad cumple con los requisitos establecidos en la 
                Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
              </p>
            </motion.div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1.1 }}
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
              href="mailto:administracion@muscleupgym.com.mx"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-4 
                       rounded-xl font-bold hover:bg-white/20 transition-all duration-300
                       border border-white/20 hover:border-white/40"
            >
              <EnvelopeIcon className="w-5 h-5" />
              <span>Contactar sobre Privacidad</span>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}