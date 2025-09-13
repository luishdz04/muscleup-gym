// src/components/registro/steps/ContractSignatureStep.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import styles from '@/styles/registro/RegistroWizard.module.css';
import PhotoCapture from '@/components/registro/PhotoCapture';
import useWindowSize from '@/hooks/useWindowSize';

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
      
      {/* Aceptación del reglamento - SIN validaciones manuales - Zod se encarga */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            className={styles.checkbox}
            {...register('acceptedRules')}
          />
          <span>Acepto las normativas completas de MUSCLE UP GYM <span className="text-yellow-400">*</span></span>
        </label>
        {errors.acceptedRules && <p className={styles.errorText}>{errors.acceptedRules.message}</p>}
      </div>
      
      {/* Campo de INE para menores - Zod maneja la validación condicional */}
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
      
      {/* Firma */}
      <div className="mb-6">
        <label className="block mb-2">Firma <span className="text-yellow-400">*</span></label>
        <div className="bg-white rounded-md overflow-hidden">
          <SignatureCanvasTyped
            ref={sigCanvas}
            canvasProps={{
              className: styles.signatureCanvas,
              width: isMobile ? 300 : 500,
              height: 150,
            }}
            backgroundColor="white"
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={clearSignature}
            className="text-sm text-gray-400 hover:text-white"
          >
            Borrar firma
          </button>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onBack}
        >
          Atrás
        </button>
        
        <button
          type="button"
          className={styles.buttonPrimary}
          disabled={isSubmitting}
          onClick={onSubmit}
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
