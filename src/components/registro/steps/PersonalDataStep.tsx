// src/components/registro/steps/PersonalDataStep.tsx
'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styles from '@/styles/registro/RegistroWizard.module.css';
import PhotoCapture from '@/components/registro/PhotoCapture';
import dynamic from 'next/dynamic';

const PasswordStrengthMeter = dynamic(
  () => import('@/components/PasswordStrengthMeter'),
  { ssr: false }
);

interface PersonalDataStepProps {
  register: any;
  errors: any;
  control: any;
  watch: any;
  getCurrentMexicoDate: () => string;
  validateAge: (birthDate: string) => boolean | string;
  handleProfilePhotoCapture: (file: File) => void;
  previewUrl: string | null;
  clearPhoto: () => void;
  onNext: () => void;
}

export const PersonalDataStep: React.FC<PersonalDataStepProps> = ({
  register,
  errors,
  control,
  watch,
  getCurrentMexicoDate,
  validateAge,
  handleProfilePhotoCapture,
  previewUrl,
  clearPhoto,
  onNext
}) => {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Datos Personales</h2>

      {/* Foto de perfil */}
      <div className="mb-4">
        <PhotoCapture
          onPhotoCapture={handleProfilePhotoCapture}
          previewUrl={previewUrl}
          onClearPhoto={clearPhoto}
          label="Foto de perfil"
          tooltip="Esta foto aparecerá en tu credencial y expediente"
          inputId="profilePhoto"
          errorMessage={errors.profilePhoto?.message as string}
        />
      </div>

      {/* Nombre y apellido - SIN validaciones manuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Nombre(s) <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Escribe tu nombre"
            {...register('firstName')}
          />
          {errors.firstName && <p className={styles.errorText}>{errors.firstName.message}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Apellidos <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Escribe tus apellidos"
            {...register('lastName')}
          />
          {errors.lastName && <p className={styles.errorText}>{errors.lastName.message}</p>}
        </div>
      </div>
      
      {/* Correo - SIN validaciones manuales */}
      <div className="mb-4">
        <label className="block mb-1">Correo electrónico <span className="text-yellow-400">*</span></label>
        <input
          type="email"
          className={styles.input}
          placeholder="tu@correo.com"
          {...register('email')}
        />
        {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
      </div>
      
      {/* Contraseñas - SIN validaciones manuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Contraseña <span className="text-yellow-400">*</span></label>
          <input
            type="password"
            className={styles.input}
            placeholder="Al menos 8 caracteres"
            {...register('password')}
          />
          {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
          <PasswordStrengthMeter password={watch('password')} />
        </div>
        
        <div>
          <label className="block mb-1">Confirmar contraseña <span className="text-yellow-400">*</span></label>
          <input
            type="password"
            className={styles.input}
            placeholder="Repite tu contraseña"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword.message}</p>}
        </div>
      </div>
      
      {/* WhatsApp - SIN validaciones manuales */}
      <div className="mb-4">
        <label className="block mb-1">WhatsApp <span className="text-yellow-400">*</span></label>
        <div className={styles.phoneInputContainer}>
          <Controller
            control={control}
            name="whatsapp"
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
        {errors.whatsapp && <p className={styles.errorText}>{errors.whatsapp.message}</p>}
      </div>
      
      {/* Fecha de nacimiento - SIN validaciones manuales */}
      <div className="mb-4">
        <label className="block mb-1">Fecha de nacimiento <span className="text-yellow-400">*</span></label>
        <input
          type="date"
          className={styles.dateInput}
          max={getCurrentMexicoDate()}
          {...register('birthDate')}
        />
        {errors.birthDate && <p className={styles.errorText}>{errors.birthDate.message}</p>}
      </div>

      {/* Dirección - SIN validaciones manuales */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-300">Dirección</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block mb-1">Calle <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre de la calle"
              {...register('street')}
            />
            {errors.street && <p className={styles.errorText}>{errors.street.message}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Número <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Número"
              {...register('number')}
            />
            {errors.number && <p className={styles.errorText}>{errors.number.message}</p>}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Colonia <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Nombre de la colonia"
            {...register('neighborhood')}
          />
          {errors.neighborhood && <p className={styles.errorText}>{errors.neighborhood.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Estado <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Estado"
              {...register('state')}
            />
            {errors.state && <p className={styles.errorText}>{errors.state.message}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Ciudad <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ciudad"
              {...register('city')}
            />
            {errors.city && <p className={styles.errorText}>{errors.city.message}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Código Postal <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Código Postal"
              {...register('postalCode')}
            />
            {errors.postalCode && <p className={styles.errorText}>{errors.postalCode.message}</p>}
          </div>
          
          <div>
            <label className="block mb-1">País <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="País"
              disabled
              {...register('country')}
            />
          </div>
        </div>
      </div>
      
      {/* Género y estado civil - SIN validaciones manuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Género <span className="text-yellow-400">*</span></label>
          <select
            className={styles.input}
            {...register('gender')}
          >
            <option value="">Selecciona</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decir">Prefiero no decir</option>
          </select>
          {errors.gender && <p className={styles.errorText}>{errors.gender.message}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Estado Civil <span className="text-yellow-400">*</span></label>
          <select
            className={styles.input}
            {...register('maritalStatus')}
          >
            <option value="">Selecciona</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Divorciado/a">Divorciado/a</option>
            <option value="Viudo/a">Viudo/a</option>
            <option value="Unión libre">Unión libre</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.maritalStatus && <p className={styles.errorText}>{errors.maritalStatus.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
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
