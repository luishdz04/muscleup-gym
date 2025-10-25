'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  setValue?: any;
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
  setValue,
  getCurrentMexicoDate,
  validateAge,
  handleProfilePhotoCapture,
  previewUrl,
  clearPhoto,
  onNext
}) => {
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Dominios de correo populares
  const popularDomains = [
    '@hotmail.es',
    '@hotmail.com',
    '@outlook.com',
    '@outlook.es',
    '@icloud.com'
  ];

  // Log cuando cambia showAddressFields
  useEffect(() => {
    console.log('🔄 [STATE] showAddressFields changed to:', showAddressFields);
  }, [showAddressFields]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    console.log('🔍 [AUTOCOMPLETE] useEffect triggered');
    console.log('🔍 [AUTOCOMPLETE] window.google:', typeof window !== 'undefined' ? !!window.google : 'server');
    console.log('🔍 [AUTOCOMPLETE] autocompleteInputRef.current:', !!autocompleteInputRef.current);
    console.log('🔍 [AUTOCOMPLETE] setValue:', !!setValue);

    if (typeof window !== 'undefined' && window.google && autocompleteInputRef.current && setValue) {
      console.log('✅ [AUTOCOMPLETE] Initializing Google Maps Autocomplete...');

      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          componentRestrictions: { country: 'mx' },
          fields: ['address_components', 'formatted_address'],
          types: ['address']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        console.log('🎯 [AUTOCOMPLETE] place_changed event fired!');
        const place = autocompleteInstance.getPlace();

        console.log('📍 [AUTOCOMPLETE] Place object:', place);

        if (place.address_components) {
          console.log('✅ [AUTOCOMPLETE] Place has address_components');

          // Extract address components
          let street = '';
          let number = '';
          let neighborhood = '';
          let city = '';
          let state = '';
          let postalCode = '';

          place.address_components.forEach((component) => {
            const types = component.types;

            if (types.includes('route')) {
              street = component.long_name;
            }
            if (types.includes('street_number')) {
              number = component.long_name;
            }
            if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
              neighborhood = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          });

          // Update form fields
          console.log('✍️ [AUTOCOMPLETE] Extracted data:', { street, number, neighborhood, city, state, postalCode });

          if (street) setValue('street', street, { shouldValidate: true });
          if (number) setValue('number', number, { shouldValidate: true });
          if (neighborhood) setValue('neighborhood', neighborhood, { shouldValidate: true });
          if (city) setValue('city', city, { shouldValidate: true });
          if (state) setValue('state', state, { shouldValidate: true });
          if (postalCode) setValue('postalCode', postalCode, { shouldValidate: true });

          // Clear search field and show address fields
          console.log('🎬 [AUTOCOMPLETE] Setting showAddressFields to TRUE');
          setSearchValue('');
          setShowAddressFields(true);
          console.log('✅ [AUTOCOMPLETE] State updated!');
        } else {
          console.log('⚠️ [AUTOCOMPLETE] Place has NO address_components');
        }
      });

      setAutocomplete(autocompleteInstance);
      console.log('✅ [AUTOCOMPLETE] Autocomplete instance created and listener added');
    } else {
      console.log('❌ [AUTOCOMPLETE] Cannot initialize - missing dependencies');
    }
  }, [setValue]);

  const handleCorrectAddress = () => {
    console.log('🔧 [HANDLER] handleCorrectAddress clicked - hiding address fields');
    setShowAddressFields(false);
    setSearchValue('');
  };

  // Manejar cambios en el campo de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Si el usuario escribió @ pero no tiene dominio completo
    if (value.includes('@') && !value.includes('.')) {
      const username = value.split('@')[0];
      const suggestions = popularDomains.map(domain => username + domain);
      setEmailSuggestions(suggestions);
      setShowEmailSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else if (!value.includes('@')) {
      // Si no hay @, sugerir con el username actual
      const suggestions = popularDomains.map(domain => value + domain);
      setEmailSuggestions(suggestions);
      setShowEmailSuggestions(value.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowEmailSuggestions(false);
    }
  };

  // Seleccionar una sugerencia de email
  const selectEmailSuggestion = (suggestion: string) => {
    setValue('email', suggestion, { shouldValidate: true });
    setShowEmailSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Manejar teclas en el campo de email
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showEmailSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < emailSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectEmailSuggestion(emailSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowEmailSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emailInputRef.current && !emailInputRef.current.contains(e.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  console.log('🎨 [RENDER] PersonalDataStep rendering with showAddressFields:', showAddressFields);

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
      
      {/* Correo electrónico con autocompletado */}
      <div className="mb-4 relative" ref={emailInputRef}>
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
            },
            onChange: handleEmailChange
          })}
          onKeyDown={handleEmailKeyDown}
          autoComplete="off"
        />
        {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}

        {/* Dropdown de sugerencias de email */}
        {showEmailSuggestions && emailSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-zinc-800 border-2 border-yellow-400 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fadeIn">
            {emailSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                onClick={() => selectEmailSuggestion(suggestion)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                  index === selectedSuggestionIndex
                    ? 'bg-yellow-400 text-black font-semibold'
                    : 'text-gray-300 hover:bg-zinc-700'
                } ${index === 0 ? '' : 'border-t border-zinc-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="flex-1">{suggestion}</span>
                {index === selectedSuggestionIndex && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          💡 Tip: Empieza a escribir tu correo y selecciona de las sugerencias de dominios populares
        </p>
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
             validate: (value: string) => value === watch('password') || 'Las contraseñas no coinciden'
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

        {/* Campo de búsqueda inteligente de dirección */}
        {!showAddressFields && (
          <div className="mb-4 bg-zinc-800 p-4 rounded-lg border-2 border-yellow-400 animate-fadeIn">
            <label className="block mb-2 text-yellow-400 font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Busca tu dirección
            </label>
            <input
              ref={autocompleteInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={`${styles.input} border-yellow-400`}
              placeholder="Escribe tu dirección completa (calle, número, colonia, ciudad)..."
            />
            <p className="text-xs text-gray-400 mt-2">
              💡 Tip: Escribe tu dirección y selecciona de las sugerencias. Aparecerán los campos para que puedas verificar o ajustar la información.
            </p>
          </div>
        )}

        {/* Campos de dirección detallados */}
        {showAddressFields && (
          <>
            {/* Botón para corregir dirección */}
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleCorrectAddress}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-yellow-400 rounded-lg border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300 font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Corregir Dirección
              </button>
            </div>
          </>
        )}

        <div className={`grid grid-cols-3 gap-4 mb-4 ${!showAddressFields ? 'hidden' : 'animate-fadeIn'}`}>
          <div className="col-span-2">
            <label className="block mb-1">
              Calle <span className="text-yellow-400">*</span>
            </label>
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

        <div className={`mb-4 ${!showAddressFields ? 'hidden' : 'animate-fadeIn'}`}>
          <label className="block mb-1">Colonia <span className="text-yellow-400">*</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="Nombre de la colonia"
            {...register('neighborhood', { required: 'Este campo es obligatorio' })}
          />
          {errors.neighborhood && <p className={styles.errorText}>{errors.neighborhood.message}</p>}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ${!showAddressFields ? 'hidden' : 'animate-fadeIn'}`}>
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

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ${!showAddressFields ? 'hidden' : 'animate-fadeIn'}`}>
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