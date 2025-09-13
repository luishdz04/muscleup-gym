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

      {/* Nombre y apellido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Nombre(s) <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Escribe tu nombre"
            {...register('firstName', {
              required: 'Este campo es obligatorio',
              minLength: { value: 2, message: 'Nombre demasiado corto' }
            })}
          />
          {errors.firstName && <p className={styles.errorText}>{errors.firstName.message}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Apellidos <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Escribe tus apellidos"
            {...register('lastName', {
              required: 'Este campo es obligatorio',
              minLength: { value: 2, message: 'Apellido demasiado corto' }
            })}
          />
          {errors.lastName && <p className={styles.errorText}>{errors.lastName.message}</p>}
        </div>
      </div>
      
      {/* Correo y contraseña */}
      <div className="mb-4">
        <label className="block mb-1">Correo electrónico <span className="text-yellow-400">*</span></label>
        <input
          type="email"
          className={styles.input}
          placeholder="tu@correo.com"
          {...register('email', {
            required: 'Este campo es obligatorio',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Correo electrónico inválido'
            }
          })}
        />
        {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Contraseña <span className="text-yellow-400">*</span></label>
          <input
            type="password"
            className={styles.input}
            placeholder="Al menos 8 caracteres"
            {...register('password', {
              required: 'Este campo es obligatorio',
              minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
            })}
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
            {...register('confirmPassword', {
              required: 'Este campo es obligatorio',
              validate: value => value === watch('password') || 'Las contraseñas no coinciden'
            })}
          />
          {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword.message}</p>}
        </div>
      </div>
      
      {/* WhatsApp */}
      <div className="mb-4">
        <label className="block mb-1">WhatsApp <span className="text-yellow-400">*</span></label>
        <div className={styles.phoneInputContainer}>
          <Controller
            control={control}
            name="whatsapp"
            rules={{ required: 'Este campo es obligatorio' }}
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
      
      {/* Fecha de nacimiento */}
      <div className="mb-4">
        <label className="block mb-1">Fecha de nacimiento <span className="text-yellow-400">*</span></label>
        <input
          type="date"
          className={styles.dateInput}
          max={getCurrentMexicoDate()}
          {...register('birthDate', {
            required: 'Este campo es obligatorio',
            validate: validateAge
          })}
        />
        {errors.birthDate && <p className={styles.errorText}>{errors.birthDate.message}</p>}
      </div>

      {/* Dirección */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-300">Dirección</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block mb-1">Calle <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre de la calle"
              {...register('street', { required: 'Este campo es obligatorio' })}
            />
            {errors.street && <p className={styles.errorText}>{errors.street.message}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Número <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Número"
              {...register('number', { required: 'Este campo es obligatorio' })}
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
            {...register('neighborhood', { required: 'Este campo es obligatorio' })}
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
              {...register('state', { required: 'Este campo es obligatorio' })}
            />
            {errors.state && <p className={styles.errorText}>{errors.state.message}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Ciudad <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ciudad"
              {...register('city', { required: 'Este campo es obligatorio' })}
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
              {...register('postalCode', { 
                required: 'Este campo es obligatorio',
                pattern: { value: /^\d{4,5}$/, message: 'Código postal inválido' }
              })}
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
      
      {/* Género y estado civil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Género <span className="text-yellow-400">*</span></label>
          <select
            className={styles.input}
            {...register('gender', { required: 'Este campo es obligatorio' })}
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
            {...register('maritalStatus', { required: 'Este campo es obligatorio' })}
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
