'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/styles/registro/RegistroWizard.module.css';
import PhotoCapture from '@/components/registro/PhotoCapture';
import useWindowSize from '@/hooks/useWindowSize';
import toast from 'react-hot-toast';

const SignatureCanvas = dynamic(
  () => import('react-signature-canvas').then(mod => mod.default || mod),
  { ssr: false }
);

interface ContractSignatureStepProps {
  register: any;
  errors: any;
  isSubmitting: boolean;
  showTutorField: boolean;
  tutorINEUrl: string | null;
  handleTutorINECapture: (file: File) => void;
  clearTutorINE: () => void;
  sigCanvas: React.RefObject<any>;
  clearSignature: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const ContractSignatureStep: React.FC<ContractSignatureStepProps> = ({
  register,
  errors,
  isSubmitting,
  showTutorField,
  tutorINEUrl,
  handleTutorINECapture,
  clearTutorINE,
  sigCanvas,
  clearSignature,
  onBack,
  onSubmit
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const SignatureCanvasTyped = SignatureCanvas as any;

  // Estados para mejoras
  const [isSigning, setIsSigning] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureHistory, setSignatureHistory] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 250 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar tipo de dispositivo para dimensiones óptimas
  const getOptimalDimensions = (containerWidth: number) => {
    // Obtener pixel ratio para alta calidad en pantallas Retina
    const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Móvil: < 640px
    if (containerWidth < 640) {
      const width = Math.floor(containerWidth - 16); // Menos padding
      const height = 200;
      return {
        width: width * ratio,  // Multiplicar por ratio para alta calidad
        height: height * ratio,
        cssWidth: width,       // Tamaño CSS real
        cssHeight: height,
        deviceType: 'mobile'
      };
    }
    // Tablet: 640px - 1024px
    else if (containerWidth < 1024) {
      const width = Math.floor(containerWidth - 16);
      const height = 220;
      return {
        width: width * ratio,
        height: height * ratio,
        cssWidth: width,
        cssHeight: height,
        deviceType: 'tablet'
      };
    }
    // Desktop: >= 1024px
    else {
      const width = 900;
      const height = 280;
      return {
        width: width * ratio,
        height: height * ratio,
        cssWidth: width,
        cssHeight: height,
        deviceType: 'desktop'
      };
    }
  };

  // Responsive canvas con ResizeObserver optimizado y alta calidad
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasSize = () => {
      if (!containerRef.current) return;

      // Obtener el ancho del padre (no del containerRef que es interno)
      const parentWidth = containerRef.current.parentElement?.offsetWidth || 800;
      const dimensions = getOptimalDimensions(parentWidth);

      setCanvasSize({
        width: dimensions.width,
        height: dimensions.height
      });
    };

    // Establecer tamaño inicial después de un pequeño delay para asegurar el render
    setTimeout(updateCanvasSize, 100);

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Callbacks para feedback visual
  const handleBegin = () => {
    setIsSigning(true);
    // Vibración táctil en móviles
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleEnd = () => {
    setIsSigning(false);

    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setHasSignature(true);

      // Guardar en historial para undo
      const data = sigCanvas.current.toData();
      setSignatureHistory([...signatureHistory, data]);
    }
  };

  // Función de deshacer mejorada
  const handleUndo = () => {
    if (signatureHistory.length === 0) {
      toast.error('No hay trazos para deshacer');
      return;
    }

    const newHistory = [...signatureHistory];
    newHistory.pop();
    setSignatureHistory(newHistory);

    if (sigCanvas.current) {
      sigCanvas.current.clear();
      if (newHistory.length > 0) {
        sigCanvas.current.fromData(newHistory[newHistory.length - 1]);
      }
    }

    setHasSignature(newHistory.length > 0);
  };

  // Limpiar firma mejorado
  const handleClear = () => {
    clearSignature();
    setSignatureHistory([]);
    setHasSignature(false);
    setIsSigning(false);
  };

  // Validación antes de submit
  const handleSubmitWithValidation = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, firma el contrato antes de continuar');
      return;
    }

    // Validar tamaño mínimo de firma
    const trimmedCanvas = sigCanvas.current.getTrimmedCanvas();
    if (trimmedCanvas && (trimmedCanvas.width < 50 || trimmedCanvas.height < 20)) {
      toast.error('La firma es muy pequeña. Por favor, firma nuevamente con un trazo más claro');
      handleClear();
      return;
    }

    // Todo bien, proceder con submit
    onSubmit();
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Reglamento y firma</h2>
      
      {/* Normativas completas */}
      <div className="mb-6 bg-zinc-800 p-4 rounded-lg max-h-80 overflow-y-auto text-sm">
        <h3 className="font-bold mb-3 text-yellow-400 text-lg">NORMATIVAS PARA SER USUARIO DE MUSCLE UP GYM</h3>
        
        {/* SECCIÓN 1: CONTROL DE ACCESO Y VIGENCIA */}
        <div className="mb-6">
          <h4 className="font-bold mb-2 text-yellow-300">RESPECTO AL CONTROL DE ACCESO Y VIGENCIA DE MEMBRESÍA</h4>
          <p className="mb-2 italic text-gray-300">"La renovación del pago se deberá realizar mínimo con dos días de antelación a la fecha de corte".</p>
          
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>El acceso a las instalaciones se realizará mediante la identificación oportuna de su huella digital, respetando los horarios establecidos.</li>
            <li>El biométrico de huella digital liberará el acceso siempre y cuando su membresía esté vigente.</li>
            <li>Su vigencia terminará el día indicado en su comprobante de pago.</li>
            <li>Si el usuario tiene que ausentarse debido a cuestiones personales, su membresía no podrá ser congelada ni transferida.</li>
            <li>Después de 6 meses continuos de inactividad, se depurarán sus datos y tendrá que cubrir el pago de inscripción nuevamente.</li>
            <li>Una vez utilizada la membresía no podrá ser cambiada a otra modalidad.</li>
            <li>Podrá realizar su pago con antelación e indicar cuándo comenzará a asistir.</li>
            <li>La dirección se reserva el derecho de realizar cambios en la reglamentación, costos y horarios.</li>
            <li>El usuario podrá acceder en dos ocasiones con su huella digital durante el día; si regresa una tercera vez se negará el acceso.</li>
            <li>Los menores de 18 años deberán presentar la firma del padre, madre o tutor.</li>
            <li>La edad mínima para inscribirse es de 12 años.</li>
          </ul>
        </div>

        {/* SECCIÓN 2: HORARIOS DE OPERACIÓN */}
        <div className="mb-6">
          <h4 className="font-bold mb-2 text-yellow-300">RESPECTO A LOS HORARIOS DE OPERACIÓN</h4>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Horarios: Lunes a viernes de 6:30 am a 10:00 pm y sábados de 9:00 am a 5:00 pm.</li>
            <li>En días festivos nacionales de lunes a viernes: 8:30 am a 6:30 pm; sábados festivos: 9:00 am a 3:00 pm.</li>
            <li>Los días 25 de diciembre, 1 de enero y viernes y sábado de semana santa permanecerán cerradas.</li>
            <li>MUSCLE UP GYM podrá modificar el horario por trabajos de reparación, notificando con antelación.</li>
          </ul>
        </div>

        {/* SECCIÓN 3: RESPONSABILIDAD POR USO */}
        <div className="mb-4">
          <h4 className="font-bold mb-2 text-yellow-300">RESPECTO A LA RESPONSABILIDAD POR EL USO DE LAS INSTALACIONES</h4>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>MUSCLE UP GYM no será responsable de lesiones salvo que se deriven de un mal estado de la instalación.</li>
            <li>No se promete indemnización en caso de accidentes por incumplimiento de normas o negligencia.</li>
            <li>MUSCLE UP GYM no se hace responsable por robo de pertenencias.</li>
            <li>El staff tiene prohibido resguardar objetos personales en la oficina.</li>
            <li>Los usuarios mantendrán limpieza, orden y comportamiento respetuoso. El incumplimiento resulta en baja definitiva.</li>
            <li>Es recomendable pasar una revisión médica antes de comenzar actividad física.</li>
            <li><strong>OBLIGATORIO:</strong> Protocolo de ingreso con huella digital, tapete sanitizante y secado de suela.</li>
            <li><strong>OBLIGATORIO:</strong> Uso de 2 toallas para utilización de máquinas.</li>
            <li>Colocar el material en su lugar y limpiar aparatos después de usar.</li>
            <li>Dejar libres las máquinas entre descansos para otros usuarios.</li>
            <li><strong>OBLIGATORIO:</strong> Portar ropa deportiva (shorts, pants, playeras, tenis).</li>
            <li><strong>PROHIBIDO:</strong> Lanzar, arrojar o azotar equipos. Incumplimiento = baja definitiva.</li>
            <li><strong>PROHIBIDO:</strong> Actividades físicas ajenas al entrenamiento que dañen usuarios o instalaciones.</li>
            <li><strong>PROHIBIDO:</strong> Comercialización u ofertamiento de servicios dentro de las instalaciones.</li>
            <li><strong>PROHIBIDO:</strong> Fingir como entrenador personal u ofertar planes.</li>
            <li><strong>PROHIBIDO:</strong> Difusión de volantes, folletos, promociones o actividades lucrativas.</li>
            <li><strong>PROHIBIDO:</strong> Ingreso de mascotas o dejarlas en recepción.</li>
            <li>Acompañantes no inscritos mayores de 12 años pueden esperar en oficina, no ingresar a áreas de entrenamiento.</li>
            <li><strong>PROHIBIDO:</strong> Bebidas alcohólicas, drogas o fumar.</li>
            <li>Se negará acceso a usuarios bajo influencia de alcohol o drogas.</li>
            <li><strong>PROHIBIDO:</strong> Portar armas u objetos punzocortantes.</li>
            <li>La compra y consumo de suplementos es responsabilidad del usuario.</li>
            <li>Permitido fotografías/videos propios, prohibido a otras personas sin consentimiento.</li>
            <li>El usuario se compromete a respetar la normativa desde la inscripción.</li>
            <li>MUSCLE UP GYM se reserva el derecho de admisión.</li>
          </ul>
        </div>
      </div>
      
      {/* Aceptación del reglamento */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            className={styles.checkbox}
            {...register('acceptedRules', { required: 'Debes aceptar el reglamento para continuar' })}
          />
          <span>Acepto las normativas completas de MUSCLE UP GYM <span className="text-yellow-400">*</span></span>
        </label>
        {errors.acceptedRules && <p className={styles.errorText}>{errors.acceptedRules.message}</p>}
      </div>
      
      {/* Campo de INE para menores */}
      {showTutorField && (
        <div className="mb-6">
          <div className="bg-yellow-900 bg-opacity-30 p-3 rounded mb-3 border border-yellow-600">
            <p className="text-yellow-400 font-medium">Aviso importante</p>
            <p className="text-sm mt-1">Eres menor de edad. Necesitas proporcionar una identificación oficial (INE) de tu padre/tutor.</p>
          </div>
          
          <PhotoCapture
            onPhotoCapture={handleTutorINECapture}
            previewUrl={tutorINEUrl}
            onClearPhoto={clearTutorINE}
            label="Identificación del Tutor (INE)"
            tooltip="Foto del INE/IFE del padre o tutor responsable"
            inputId="tutorINE"
            errorMessage={errors.tutorINE?.message as string}
          />
        </div>
      )}
      
      {/* Firma Mejorada */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="block font-semibold">
            Firma Digital <span className="text-yellow-400">*</span>
          </label>
          {hasSignature && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Firma válida
            </span>
          )}
        </div>

        {/* Barra de herramientas */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors flex items-center gap-1"
            title="Limpiar toda la firma"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={signatureHistory.length === 0}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-700"
            title="Deshacer último trazo"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Deshacer
          </button>

          <div className="flex-1"></div>

          {/* Indicador solo en desktop */}
          {!isMobile && (
            <span className="text-xs text-gray-400 px-2 py-1.5 hidden sm:block">
              🖱️ Usa tu mouse o touchpad
            </span>
          )}
        </div>

        {/* Canvas Container - Se ajusta exactamente al canvas */}
        <div
          className={`bg-white rounded-lg overflow-hidden relative border-2 transition-all duration-300 ${
            isSigning
              ? 'border-yellow-400 shadow-lg shadow-yellow-400/30 scale-[1.01]'
              : 'border-zinc-600'
          }`}
          style={{
            maxWidth: isMobile ? '100%' : '900px',
            margin: '0 auto',
            display: 'inline-block',
            width: '100%'
          }}
        >
          {/* Contenedor interno que tomará el tamaño del canvas */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              padding: '8px'
            }}
          >
          {/* Placeholder cuando está vacío */}
          {!hasSignature && !isSigning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 text-gray-400">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm">Firma aquí</span>
            </div>
          )}

          {/* SignatureCanvas optimizado para alta calidad */}
          <SignatureCanvasTyped
            ref={sigCanvas}
            penColor="#000000"
            minWidth={isMobile ? 1.5 : 2}     // Móvil: más fino, Desktop: más grueso
            maxWidth={isMobile ? 3 : 4}       // Móvil: 3px, Desktop: 4px
            dotSize={isMobile ? 2 : 3}        // Puntos iniciales proporcionales
            minDistance={5}                    // Distancia mínima entre puntos (suavidad)
            velocityFilterWeight={0.7}         // Suavizado de velocidad
            throttle={8}                       // Menor throttle = más puntos = mejor calidad
            canvasProps={{
              className: styles.signatureCanvas,
              width: canvasSize.width,
              height: canvasSize.height,
              style: {
                display: 'block',
                touchAction: 'none',
                cursor: 'crosshair',
                WebkitTapHighlightColor: 'transparent',
                width: '100%',    // CSS width al 100%
                height: 'auto',   // CSS height automático para mantener ratio
                maxWidth: '100%'
              }
            }}
            backgroundColor="rgba(255, 255, 255, 1)"
            clearOnResize={false}              // No limpiar al cambiar tamaño
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Dibuja tu firma en el recuadro. Usa el botón "Deshacer" si cometes un error.
        </p>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onBack}
          disabled={isSubmitting}
        >
          Atrás
        </button>

        <button
          type="button"
          className={styles.buttonPrimary}
          disabled={isSubmitting}
          onClick={handleSubmitWithValidation}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : 'Inscribirse'}
        </button>
      </div>
    </div>
  );
};