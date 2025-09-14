'use client';

import React from 'react';
import styles from '@/styles/registro/RegistroWizard.module.css';

interface MembershipInfoStepProps {
  register: any;
  errors: any;
  onNext: () => void;
  onBack: () => void;
}

export const MembershipInfoStep: React.FC<MembershipInfoStepProps> = ({
  register,
  errors,
  onNext,
  onBack
}) => {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Información de Membresía</h2>
      
      <div className="mb-4">
        <label className="block mb-1">¿Cómo te enteraste de nosotros? <span className="text-yellow-400">*</span></label>
        <select
          className={styles.input}
          {...register('referredBy', { required: 'Este campo es obligatorio' })}
        >
          <option value="">Selecciona</option>
          <option value="Redes sociales">Redes sociales</option>
          <option value="Recomendación">Recomendación</option>
          <option value="Google">Google</option>
          <option value="Volantes">Volantes</option>
          <option value="Pasé por el lugar">Pasé por el lugar</option>
          <option value="Otro">Otro</option>
        </select>
        {errors.referredBy && <p className={styles.errorText}>{errors.referredBy.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Principal motivación para entrenar <span className="text-yellow-400">*</span></label>
        <select
          className={styles.input}
          {...register('mainMotivation', { required: 'Este campo es obligatorio' })}
        >
          <option value="">Selecciona</option>
          <option value="Bajar de peso">Bajar de peso</option>
          <option value="Aumentar masa muscular">Aumentar masa muscular</option>
          <option value="Mejorar salud">Mejorar salud</option>
          <option value="Rehabilitación">Rehabilitación</option>
          <option value="Recreación">Recreación</option>
          <option value="Competencia">Competencia</option>
          <option value="Otro">Otro</option>
        </select>
        {errors.mainMotivation && <p className={styles.errorText}>{errors.mainMotivation.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            className={styles.checkbox}
            {...register('receivePlans')}
          />
          <span>Deseo recibir planes de nutrición y entrenamiento</span>
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Nivel de entrenamiento actual <span className="text-yellow-400">*</span></label>
        <select
          className={styles.input}
          {...register('trainingLevel', { required: 'Este campo es obligatorio' })}
        >
          <option value="">Selecciona</option>
          <option value="Principiante">Principiante (menos de 3 meses)</option>
          <option value="Intermedio">Intermedio (3-12 meses)</option>
          <option value="Avanzado">Avanzado (más de 12 meses)</option>
          <option value="Atleta">Atleta competitivo</option>
        </select>
        {errors.trainingLevel && <p className={styles.errorText}>{errors.trainingLevel.message}</p>}
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
          onClick={onNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};