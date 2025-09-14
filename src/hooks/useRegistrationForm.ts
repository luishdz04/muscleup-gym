'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toMexicoDate, toMexicoTimestamp } from '@/utils/dateHelpers';

// ✅ IMPORTAR ESQUEMAS ACTUALIZADOS DE ZOD 4
import {
  fullRegistrationSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  partialStep1Schema,
  partialStep2Schema,
  partialStep3Schema,
  partialStep4Schema,
  validateField,
  useRealtimeValidation,
  type RegistrationFormData,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data
} from '@/schemas/registrationSchemas';

// ✅ CONFIGURAR DAYJS
dayjs.extend(utc);
dayjs.extend(timezone);

const MEXICO_TZ = 'America/Mexico_City';
const STORAGE_KEY = 'registration-form';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 🆕 USAR EL TIPO ACTUALIZADO
type FormData = RegistrationFormData;

interface SignatureCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement;
  toDataURL: (type?: string) => string;
  getTrimmedCanvas?: () => HTMLCanvasElement;
}

// 🆕 VALIDACIÓN EN TIEMPO REAL - Estado para errores de campos
interface FieldValidationState {
  [key: string]: {
    error: string | null;
    isValidating: boolean;
    hasBeenTouched: boolean;
  };
}

// Campos por paso (actualizado con nuevos tipos)
const fieldsPerStep: { [key: number]: (keyof FormData)[] } = {
  1: [
    'profilePhoto', 'firstName', 'lastName', 'email', 'password', 
    'confirmPassword', 'whatsapp', 'birthDate', 'street', 
    'number', 'neighborhood', 'state', 'city', 'postalCode', 
    'gender', 'maritalStatus'
  ] as (keyof FormData)[],
  2: ['emergencyName', 'emergencyPhone', 'medicalCondition', 'bloodType'] as (keyof FormData)[],
  3: ['referredBy', 'mainMotivation', 'trainingLevel'] as (keyof FormData)[],
  4: ['acceptedRules', 'tutorINE'] as (keyof FormData)[] // 🆕 Agregado tutorINE
};

// Funciones utilitarias mejoradas
const isValidFile = (file: unknown): file is File => {
  return typeof file === 'object' && 
         file !== null && 
         'name' in file && 
         'size' in file && 
         'type' in file &&
         (file as File).size <= MAX_FILE_SIZE &&
         (file as File).type.startsWith('image/');
};

const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

const getCurrentMexicoDate = (): string => {
  return dayjs().tz(MEXICO_TZ).format('YYYY-MM-DD');
};

const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birthDate = dayjs.tz(birthDateString, MEXICO_TZ);
  const now = dayjs().tz(MEXICO_TZ);
  return now.diff(birthDate, 'year');
};

const validateAge = (birthDateString: string): boolean | string => {
  try {
    const age = calculateAge(birthDateString);
    return (age >= 10 && age <= 100) || 'La edad debe estar entre 10 y 100 años';
  } catch (error) {
    return 'Fecha de nacimiento inválida';
  }
};

export const useRegistrationForm = () => {
  // Estados principales
  const [step, setStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTutorField, setShowTutorField] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados para archivos
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tutorINEUrl, setTutorINEUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [tutorINEFile, setTutorINEFile] = useState<File | null>(null);
  
  // 🆕 ESTADOS PARA VALIDACIÓN EN TIEMPO REAL
  const [fieldValidation, setFieldValidation] = useState<FieldValidationState>({});
  const [realtimeValidationEnabled, setRealtimeValidationEnabled] = useState(false);
  
  // Ref para firma
  const sigCanvas = useRef<SignatureCanvasRef | null>(null);

  // 🆕 HOOK DE VALIDACIÓN EN TIEMPO REAL
  const { validateFieldRealtime } = useRealtimeValidation();

  // ✅ CONFIGURACIÓN DEL FORMULARIO CON ESQUEMA PRINCIPAL
  const formMethods = useForm<RegistrationFormData>({
    resolver: zodResolver(fullRegistrationSchema),
    mode: 'onChange', // Importante para validación en tiempo real
    reValidateMode: 'onChange',
    defaultValues: {
      receivePlans: false,
      country: 'México',
    },
  });

  const { 
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty, dirtyFields, isValid, touchedFields },
    trigger,
    setValue,
    reset,
    getValues,
    clearErrors,
    setError
  } = formMethods;

  const formValues = watch();

  // 🆕 FUNCIÓN DE VALIDACIÓN EN TIEMPO REAL
  const validateFieldInRealtime = useCallback(async (
    fieldName: keyof FormData, 
    value: any,
    currentStep: number
  ) => {
    if (!realtimeValidationEnabled) return;

    // Marcar como validando
    setFieldValidation(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValidating: true,
        hasBeenTouched: true
      }
    }));

    // Usar debounce para evitar validaciones excesivas
    setTimeout(async () => {
      const validation = validateFieldRealtime(fieldName, value, currentStep);
      
      setFieldValidation(prev => ({
        ...prev,
        [fieldName]: {
          error: validation.success ? null : validation.error,
          isValidating: false,
          hasBeenTouched: true
        }
      }));

      // Sincronizar con React Hook Form
      if (!validation.success && validation.error) {
        setError(fieldName, { 
          type: 'manual', 
          message: validation.error 
        });
      } else {
        clearErrors(fieldName);
      }
    }, 300); // Debounce de 300ms
  }, [realtimeValidationEnabled, validateFieldRealtime, setError, clearErrors]);

  // 🆕 FUNCIÓN PARA OBTENER EL ESTADO DE VALIDACIÓN DE UN CAMPO
  const getFieldValidationState = useCallback((fieldName: keyof FormData) => {
    const validation = fieldValidation[fieldName];
    const formError = errors[fieldName];
    
    return {
      hasError: !!(validation?.error || formError),
      error: validation?.error || formError?.message || null,
      isValidating: validation?.isValidating || false,
      hasBeenTouched: validation?.hasBeenTouched || touchedFields[fieldName] || false
    };
  }, [fieldValidation, errors, touchedFields]);

  // 🆕 FUNCIÓN PARA ACTIVAR VALIDACIÓN EN TIEMPO REAL
  const enableRealtimeValidation = useCallback(() => {
    setRealtimeValidationEnabled(true);
  }, []);

  // Funciones para convertir a base64 (sin cambios)
  const toBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (!isValidFile(file)) {
        reject(new Error('Archivo inválido'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const result = reader.result.toString();
          if (isBlobUrl(result)) {
            reject(new Error('Error: se generó una blob URL en lugar de base64'));
            return;
          }
          resolve(result);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const createSafePreview = useCallback(async (file: File): Promise<string> => {
    try {
      const base64 = await toBase64(file);
      return base64;
    } catch (error) {
      console.error('Error creando preview:', error);
      throw error;
    }
  }, [toBase64]);

  // 🆕 FUNCIONES DE MANEJO DE ARCHIVOS MEJORADAS
  const handleProfilePhotoCapture = useCallback(async (file: File) => {
    try {
      if (!file || !isValidFile(file)) {
        throw new Error("No se ha proporcionado un archivo válido");
      }
      
      setProfilePhotoFile(file);
      const safePreview = await createSafePreview(file);
      setPreviewUrl(safePreview);
      
      // Crear FileList para Zod 4
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      setValue('profilePhoto', fileList, { shouldValidate: true, shouldDirty: true });
      
      // 🆕 Validar en tiempo real
      if (realtimeValidationEnabled) {
        validateFieldInRealtime('profilePhoto', fileList, 1);
      }
      
    } catch (error) {
      console.error('Error procesando foto de perfil:', error);
      setError('profilePhoto', { 
        type: 'manual', 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }, [setValue, createSafePreview, realtimeValidationEnabled, validateFieldInRealtime, setError]);

  const handleTutorINECapture = useCallback(async (file: File) => {
    try {
      if (!file || !isValidFile(file)) {
        throw new Error("No se ha proporcionado un archivo válido");
      }
      
      setTutorINEFile(file);
      const safePreview = await createSafePreview(file);
      setTutorINEUrl(safePreview);
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      setValue('tutorINE', fileList, { shouldValidate: true, shouldDirty: true });
      
      // 🆕 Validar en tiempo real
      if (realtimeValidationEnabled) {
        validateFieldInRealtime('tutorINE', fileList, 4);
      }
      
    } catch (error) {
      console.error('Error procesando INE del tutor:', error);
      setError('tutorINE', { 
        type: 'manual', 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }, [setValue, createSafePreview, realtimeValidationEnabled, validateFieldInRealtime, setError]);

  const clearPhoto = useCallback(() => {
    setProfilePhotoFile(null);
    setPreviewUrl(null);
    setValue('profilePhoto', undefined as any, {shouldDirty: true, shouldValidate: true});
    clearErrors('profilePhoto');
    
    // Limpiar validación en tiempo real
    setFieldValidation(prev => ({
      ...prev,
      profilePhoto: { error: null, isValidating: false, hasBeenTouched: false }
    }));
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        delete parsedData.profilePhotoPreview;
        delete parsedData.hasProfilePhotoFile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Error al actualizar localStorage:", e);
    }
  }, [setValue, clearErrors]);

  const clearTutorINE = useCallback(() => {
    setTutorINEFile(null);
    setTutorINEUrl(null);
    setValue('tutorINE', undefined as any, {shouldDirty: true, shouldValidate: true});
    clearErrors('tutorINE');
    
    // Limpiar validación en tiempo real
    setFieldValidation(prev => ({
      ...prev,
      tutorINE: { error: null, isValidating: false, hasBeenTouched: false }
    }));
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        delete parsedData.tutorINEPreview;
        delete parsedData.hasTutorINEFile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Error al actualizar localStorage:", e);
    }
  }, [setValue, clearErrors]);

  const clearSignature = useCallback(() => {
    if (sigCanvas.current) {
      try {
        sigCanvas.current.clear();
      } catch (error) {
        console.error("Error al limpiar la firma:", error);
      }
    }
  }, []);

  // Navegación entre pasos mejorada
  const getFieldsForStep = useCallback((currentStep: number): (keyof FormData)[] => {
    const fields = fieldsPerStep[currentStep] || [];
    return fields as (keyof FormData)[];
  }, []);

  // 🆕 NAVEGACIÓN CON VALIDACIÓN MEJORADA
  const goNext = async () => {
    // Activar validación en tiempo real desde el primer intento de navegación
    if (!realtimeValidationEnabled) {
      enableRealtimeValidation();
    }

    const fieldsToValidate = getFieldsForStep(step);
    const valid = await trigger(fieldsToValidate);
    
    if (valid) {
      if (!completedSteps.includes(step)) {
        setCompletedSteps(prev => [...prev, step]);
      }
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const currentErrors = Object.keys(errors).filter(key => 
        fieldsToValidate.includes(key as keyof FormData)
      );
      
      if (currentErrors.length > 0) {
        const firstError = errors[currentErrors[0] as keyof FormData];
        const errorMessage = firstError?.message || 'Por favor, completa todos los campos requeridos correctamente.';
        
        // 🆕 Mostrar mensaje más específico
        alert(`❌ ${errorMessage}\n\nRevisa los campos marcados en rojo.`);
        
        // Hacer scroll al primer campo con error
        const firstErrorElement = document.querySelector(`[name="${currentErrors[0]}"]`);
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        alert('Por favor, completa todos los campos requeridos correctamente.');
      }
    }
  };
  
  const goBack = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (targetStep: number) => {
    if (completedSteps.includes(targetStep - 1) || targetStep === step || targetStep <= step) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 🆕 EFECTO PARA VALIDACIÓN EN TIEMPO REAL DE CAMPOS INDIVIDUALES
  useEffect(() => {
    if (!realtimeValidationEnabled) return;

    const subscription = watch((value, { name, type }) => {
      if (name && type === 'change') {
        const fieldName = name as keyof FormData;
        const fieldValue = value[fieldName];
        
        // Solo validar si el campo ha sido tocado
        if (touchedFields[fieldName] || fieldValidation[fieldName]?.hasBeenTouched) {
          validateFieldInRealtime(fieldName, fieldValue, step);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, realtimeValidationEnabled, step, touchedFields, fieldValidation, validateFieldInRealtime]);

  // Función de envío (sin cambios significativos, solo actualizamos los tipos)
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      console.log("🚀 [SUBMIT] Iniciando proceso con Zod 4.1.8");
      
      // Verificar firma
      let signatureDataUrl = '';
      if (sigCanvas.current) {
        try {
          const canvas = sigCanvas.current.getCanvas();
          if (canvas) {
            signatureDataUrl = canvas.toDataURL('image/png');
            
            if (isBlobUrl(signatureDataUrl)) {
              throw new Error("Error: la firma generó una blob URL");
            }
          } else {
            throw new Error("No se pudo obtener el canvas de la firma");
          }
        } catch (error) {
          console.error('Error procesando firma:', error);
          alert(`Error al procesar la firma: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      const isEmptySignature = !signatureDataUrl || 
                      signatureDataUrl === 'data:image/png;base64,' || 
                      signatureDataUrl.includes('AAAAAAAAAA');
      
      if (isEmptySignature) {
        alert('Por favor firma el documento antes de continuar');
        setIsSubmitting(false);
        return;
      }

      // Procesar imágenes
      let profilePhotoBase64 = '';
      let tutorINEBase64 = '';
      
      try {
        if (profilePhotoFile && isValidFile(profilePhotoFile)) {
          profilePhotoBase64 = await toBase64(profilePhotoFile);
          
          if (isBlobUrl(profilePhotoBase64)) {
            throw new Error("Error crítico: foto de perfil generó blob URL");
          }
        } else {
          throw new Error("No hay foto de perfil válida");
        }
        
        if (showTutorField) {
          if (tutorINEFile && isValidFile(tutorINEFile)) {
            tutorINEBase64 = await toBase64(tutorINEFile);
            
            if (isBlobUrl(tutorINEBase64)) {
              throw new Error("Error crítico: INE del tutor generó blob URL");
            }
          } else {
            throw new Error("No hay foto de INE válida para menor de edad");
          }
        }
        
      } catch (error) {
        console.error("Error al procesar imágenes:", error);
        alert(`Error al procesar las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsSubmitting(false);
        return;
      }

      // Validación final
      const urlsToCheck = [profilePhotoBase64, tutorINEBase64, signatureDataUrl].filter(Boolean);
      const hasBlobUrls = urlsToCheck.some(url => isBlobUrl(url));
      
      if (hasBlobUrls) {
        console.error("BLOB URLs detectadas, abortando envío");
        alert("Error crítico: Se detectaron URLs temporales. Por favor, recarga la página e intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      // Construir payload
      const currentMexicoTime = new Date();
      const birthDateObj = new Date(data.birthDate);
      
      const payload = {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          whatsapp: data.whatsapp,
          birthDate: toMexicoDate(birthDateObj),
          address: {
            street: data.street,
            number: data.number,
            neighborhood: data.neighborhood,
            state: data.state,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country || 'México',
          },
          gender: data.gender,
          maritalStatus: data.maritalStatus,
        },
        emergencyContact: {
          name: data.emergencyName,
          phone: data.emergencyPhone,
          medicalCondition: data.medicalCondition,
          bloodType: data.bloodType,
        },
        membershipData: {
          referredBy: data.referredBy,
          mainMotivation: data.mainMotivation,
          receivePlans: data.receivePlans,
          trainingLevel: data.trainingLevel,
        },
        acceptedRules: data.acceptedRules,
        signature: signatureDataUrl,
        registrationDate: toMexicoTimestamp(currentMexicoTime),
        profilePhoto: profilePhotoBase64,
        tutorINE: tutorINEBase64,
        isMinor: showTutorField,
        metadata: {
          version: '4.0-zod-4.1.8-realtime',
          processedAt: toMexicoTimestamp(currentMexicoTime),
          processedBy: 'MuscleUpGYM',
          mexicoTimezone: MEXICO_TZ,
          currentMexicoDate: getCurrentMexicoDate()
        }
      };

      // Llamada al API
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        });

        let responseData;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          responseData = await res.json();
        } else {
          const text = await res.text();
          throw new Error(`Respuesta inesperada: ${text.substring(0, 100)}...`);
        }

        if (res.ok && responseData.success) {
          setUserId(responseData.userId);
          setShowSuccessModal(true);
          localStorage.removeItem(STORAGE_KEY);
        } else {
          const errorMessage = responseData.message || `Error ${res.status}: ${res.statusText}`;
          alert(`Error al registrar: ${errorMessage}`);
        }
      } catch (networkError) {
        console.error('Error de red:', networkError);
        alert('Error de conexión. Verifica tu internet y vuelve a intentarlo.');
      }
    } catch (error) {
      console.error('Error general en el proceso de registro:', error);
      alert('Ocurrió un error al procesar tu registro. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efectos (mayoría sin cambios, algunos mejorados)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        if (parsedData.profilePhotoPreview && !isBlobUrl(parsedData.profilePhotoPreview)) {
          setPreviewUrl(parsedData.profilePhotoPreview);
        }
        
        if (parsedData.tutorINEPreview && !isBlobUrl(parsedData.tutorINEPreview)) {
          setTutorINEUrl(parsedData.tutorINEPreview);
        }
        
        if (parsedData.firstName || parsedData.email) {
          if (confirm("Encontramos un registro previo. ¿Deseas continuar donde lo dejaste?")) {
            const { profilePhotoPreview, tutorINEPreview, hasProfilePhotoFile, hasTutorINEFile, ...formData } = parsedData;
            reset(formData);
            
            const lastStep = getLastCompletedStep(formData);
            setStep(Math.min(lastStep + 1, 4));
            
            const completed = [];
            for (let i = 1; i <= lastStep; i++) {
              completed.push(i);
            }
            setCompletedSteps(completed);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Error al procesar datos guardados', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [reset]);

  // Progreso y guardado (sin cambios significativos)
  useEffect(() => {
    if (!isDirty) return;
    
    try {
      const dataToSave = { ...formValues };
      Object.keys(dataToSave).forEach((key) => {
        const value = dataToSave[key as keyof typeof dataToSave];
        if (value instanceof FileList || value instanceof File) {
          delete dataToSave[key as keyof typeof dataToSave];
        }
      });
      
      if (previewUrl && !isBlobUrl(previewUrl)) {
        dataToSave.profilePhotoPreview = previewUrl;
        dataToSave.hasProfilePhotoFile = !!profilePhotoFile;
      }
      
      if (tutorINEUrl && !isBlobUrl(tutorINEUrl)) {
        dataToSave.tutorINEPreview = tutorINEUrl;
        dataToSave.hasTutorINEFile = !!tutorINEFile;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      let completedFields = 0;
      let requiredFields = 0;
      
      Object.keys(fieldsPerStep).forEach(stepKey => {
        const stepNum = parseInt(stepKey);
        
        if (stepNum <= step || completedSteps.includes(stepNum)) {
          fieldsPerStep[stepNum].forEach(field => {
            if (field !== 'receivePlans') {
              requiredFields++;
              
              const value = formValues[field as keyof FormData];
              const hasValue = value !== undefined && 
                           value !== null && 
                           value !== '' && 
                           !(value instanceof FileList && value.length === 0);
              
              if (hasValue) {
                completedFields++;
              }
            }
          });
        }
      });
      
      const totalRequiredFields = 
        fieldsPerStep[1].length + 
        fieldsPerStep[2].length + 
        fieldsPerStep[3].length + 
        fieldsPerStep[4].length - 1; // -1 por receivePlans
      
      const progress = Math.min(Math.round((completedFields / totalRequiredFields) * 100), 100);
      setFormProgress(progress);
    } catch (error) {
      console.error("Error al guardar o calcular progreso:", error);
    }
  }, [formValues, isDirty, step, completedSteps, previewUrl, tutorINEUrl, profilePhotoFile, tutorINEFile]);

  // ✅ VALIDACIÓN CONDICIONAL PARA TUTOR (mejorada)
  useEffect(() => {
    const birthDate = formValues.birthDate;
    if (birthDate) {
      try {
        const age = calculateAge(birthDate);
        const isMinor = age < 18;
        setShowTutorField(isMinor);
        
        // 🆕 Validar automáticamente el campo tutorINE cuando cambia la edad
        if (realtimeValidationEnabled) {
          validateFieldInRealtime('tutorINE', formValues.tutorINE, 4);
        }
      } catch (error) {
        setShowTutorField(false);
      }
    }
  }, [formValues.birthDate, formValues.tutorINE, realtimeValidationEnabled, validateFieldInRealtime]);

  // Prevenir cierre accidental (sin cambios)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Función auxiliar (sin cambios)
  const getLastCompletedStep = useCallback((data: Partial<FormData>): number => {
    if (data.acceptedRules) return 4;
    if (data.referredBy && data.mainMotivation && data.trainingLevel) return 3;
    if (data.emergencyName && data.emergencyPhone && data.bloodType) return 2;
    if (data.firstName && data.lastName && data.email) return 1;
    return 0;
  }, []);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    
    if (userId) {
      const url = `/registro/firmado?userId=${encodeURIComponent(userId)}`;
      window.location.href = url;
    } else {
      window.location.href = '/registro/firmado';
    }
  };

  return {
    // Estados existentes
    step, formProgress, isSubmitting, showTutorField, completedSteps, showSuccessModal, userId,
    previewUrl, tutorINEUrl, profilePhotoFile, tutorINEFile,
    
    // 🆕 NUEVOS ESTADOS PARA VALIDACIÓN EN TIEMPO REAL
    fieldValidation,
    realtimeValidationEnabled,
    
    // Refs
    sigCanvas,
    
    // Métodos de formulario existentes
    register, handleSubmit, control, watch, errors, isDirty, trigger, setValue, reset, getValues, formValues,
    
    // 🆕 NUEVAS FUNCIONES PARA VALIDACIÓN EN TIEMPO REAL
    getFieldValidationState,
    enableRealtimeValidation,
    validateFieldInRealtime,
    
    // Funciones de navegación
    goNext, goBack, goToStep,
    
    // Funciones de archivos
    handleProfilePhotoCapture, handleTutorINECapture, clearPhoto, clearTutorINE, clearSignature,
    
    // Función de envío
    onSubmit,
    
    // Función de cierre modal
    handleCloseSuccessModal,
    
    // Utilidades
    getCurrentMexicoDate, validateAge
  };
};
