// src/components/registro/steps/EmergencyContactStep.tsx
'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import styles from '@/styles/registro/RegistroWizard.module.css';

interface EmergencyContactStepProps {
  register: any;
  errors: any;
  control: any;
  onNext: () => void;
  onBack: () => void;
}

export const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({
  register,
  errors,
  control,
  onNext,
  onBack
}) => {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Contacto de Emergencia</h2>
      
      {/* SIN validaciones manuales - Zod se encarga */}
      <div className="mb-4">
        <label className="block mb-1">Nombre del contacto <span className="text-yellow-400">*</span></label>
        <input
          type="text"
          className={styles.input}
          placeholder="Nombre completo"
          {...register('emergencyName')}
        />
        {errors.emergencyName && <p className={styles.errorText}>{errors.emergencyName.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Teléfono del contacto <span className="text-yellow-400">*</span></label>
        <div className={styles.phoneInputContainer}>
          <Controller
            control={control}
            name="emergencyPhone"
            render={({ field: { value, onChange, name, ref } }) => (
              <PhoneInput
                value={value}
                onChange={onChange}
                inputProps={{
                  name,
                  ref,
                  required: true,
                }}
                country={'mx'}
                preferredCountries={['mx', 'us']}
                enableSearch={true}
                searchPlaceholder="Buscar país..."
                inputStyle={{ width: '100%' }}
                placeholder="Ej. 55 1234 5678"
              />
            )}
          />
        </div>
        {errors.emergencyPhone && <p className={styles.errorText}>{errors.emergencyPhone.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Condiciones médicas <span className="text-yellow-400">*</span></label>
        <textarea
          className={styles.input}
          rows={3}
          placeholder="Describe cualquier condición médica, alergias o lesiones relevantes"
          {...register('medicalCondition')}
        ></textarea>
        {errors.medicalCondition && <p className={styles.errorText}>{errors.medicalCondition.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Tipo de sangre <span className="text-yellow-400">*</span></label>
        <select
          className={styles.input}
          {...register('bloodType')}
        >
          <option value="">Selecciona</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="No sé">No sé</option>
        </select>
        {errors.bloodType && <p className={styles.errorText}>{errors.bloodType.message}</p>}
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
