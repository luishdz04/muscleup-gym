'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

// ✅ IMPORTACIONES ENTERPRISE ESTÁNDAR
import { 
  getTodayInMexico, 
  formatTimestampForDisplay,
  getCurrentTimestamp,
  daysBetween
} from '@/utils/dateUtils';
import { useUserTracking } from '@/hooks/useUserTracking';

// CONSTANTES
const STORAGE_KEY = 'registration-form';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Tipos originales de tu aplicación
type FormData = {
  // Paso 1
  profilePhoto: FileList;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  whatsapp: string;
  birthDate: string;
  street: string;
  number: string;
  neighborhood: string;
  state: string;
  city: string;
  postalCode: string;
  country: string;
  gender: string;
  maritalStatus: string;
  // Paso 2
  emergencyName: string;
  emergencyPhone: string;
  medicalCondition: string;
  bloodType: string;
  // Paso 3
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
  // Paso 4
  acceptedRules: boolean;
  tutorINE?: FileList;
};

// ✅ Tipo extendido para datos guardados en localStorage
type SavedFormData = FormData & {
  profilePhotoPreview?: string;
  tutorINEPreview?: string;
  hasProfilePhotoFile?: boolean;
  hasTutorINEFile?: boolean;
};

interface SignatureCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement;
  toDataURL: (type?: string) => string;
  getTrimmedCanvas?: () => HTMLCanvasElement;
}

// Campos por paso (mantener tu lógica existente)
const fieldsPerStep: { [key: number]: (keyof FormData)[] } = {
  1: [
    'profilePhoto', 'firstName', 'lastName', 'email', 'password', 
    'confirmPassword', 'whatsapp', 'birthDate', 'street', 
    'number', 'neighborhood', 'state', 'city', 'postalCode', 
    'gender', 'maritalStatus'
  ] as (keyof FormData)[],
  2: ['emergencyName', 'emergencyPhone', 'medicalCondition', 'bloodType'] as (keyof FormData)[],
  3: ['referredBy', 'mainMotivation', 'trainingLevel'] as (keyof FormData)[],
  4: ['acceptedRules'] as (keyof FormData)[]
};

// ✅ FUNCIONES UTILITARIAS ENTERPRISE
const isValidFile = (file: unknown): file is File => {
  return file instanceof File && 
         file.size <= MAX_FILE_SIZE &&
         file.type.startsWith('image/');
};

const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

// ✅ FUNCIONES DE FECHA ENTERPRISE (usando dateUtils)
const getCurrentMexicoDate = (): string => {
  return getTodayInMexico();
};

const calculateAge = (birthDateString: string): number => {
  try {
    const today = getTodayInMexico();
    const days = daysBetween(birthDateString, today);
    return Math.floor(days / 365.25);
  } catch (error) {
    return 0;
  }
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
  // ✅ HOOK DE AUDITORÍA ENTERPRISE
  const { addAuditFields, getUTCTimestamp } = useUserTracking();

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
  
  // Ref para firma
  const sigCanvas = useRef<SignatureCanvasRef | null>(null);

  // Configuración del formulario
  const formMethods = useForm<FormData>({
    mode: 'onChange',
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
    formState: { errors, isDirty, dirtyFields, isValid },
    trigger,
    setValue,
    reset,
    getValues,
  } = formMethods;

  const formValues = watch();

  // ✅ FUNCIÓN PARA CONVERTIR A BASE64 (mantener original)
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

  // ✅ FUNCIÓN PARA CREAR PREVIEW SEGURO (mantener original)
  const createSafePreview = useCallback(async (file: File): Promise<string> => {
    try {
      const base64 = await toBase64(file);
      return base64;
    } catch (error) {
      console.error('Error creando preview:', error);
      throw error;
    }
  }, [toBase64]);

  // Funciones para manejo de fotos (mantener originales)
  const handleProfilePhotoCapture = useCallback(async (file: File) => {
    try {
      if (!file || !isValidFile(file)) {
        throw new Error("No se ha proporcionado un archivo válido");
      }
      
      setProfilePhotoFile(file);
      const safePreview = await createSafePreview(file);
      setPreviewUrl(safePreview);
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      setValue('profilePhoto', fileList, { shouldValidate: true });
    } catch (error) {
      console.error('Error procesando foto de perfil:', error);
      alert(`Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [setValue, createSafePreview]);

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
      
      setValue('tutorINE', fileList, { shouldValidate: true });
    } catch (error) {
      console.error('Error procesando INE del tutor:', error);
      alert(`Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [setValue, createSafePreview]);

  const clearPhoto = useCallback(() => {
    setProfilePhotoFile(null);
    setPreviewUrl(null);
    setValue('profilePhoto', undefined as any, {shouldDirty: true, shouldValidate: true});
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: SavedFormData = JSON.parse(savedData);
        delete parsedData.profilePhotoPreview;
        delete parsedData.hasProfilePhotoFile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Error al actualizar localStorage:", e);
    }
  }, [setValue]);

  const clearTutorINE = useCallback(() => {
    setTutorINEFile(null);
    setTutorINEUrl(null);
    setValue('tutorINE', undefined as any, {shouldDirty: true, shouldValidate: true});
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: SavedFormData = JSON.parse(savedData);
        delete parsedData.tutorINEPreview;
        delete parsedData.hasTutorINEFile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Error al actualizar localStorage:", e);
    }
  }, [setValue]);

  // Función para limpiar la firma
  const clearSignature = useCallback(() => {
    if (sigCanvas.current) {
      try {
        sigCanvas.current.clear();
      } catch (error) {
        console.error("Error al limpiar la firma:", error);
      }
    }
  }, []);

  // Navegación entre pasos
  const getFieldsForStep = useCallback((currentStep: number): (keyof FormData)[] => {
    const fields = fieldsPerStep[currentStep] || [];
    return fields as (keyof FormData)[];
  }, []);

  const goNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const valid = await trigger(fieldsToValidate);
    
    if (valid) {
      if (!completedSteps.includes(step)) {
        setCompletedSteps(prev => [...prev, step]);
      }
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Por favor, completa todos los campos requeridos correctamente.');
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

  // ✅ FUNCIÓN DE ENVÍO ENTERPRISE COMPLETA
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
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

      // Validación final: verificar que no hay blob URLs
      const urlsToCheck = [profilePhotoBase64, tutorINEBase64, signatureDataUrl].filter(Boolean);
      const hasBlobUrls = urlsToCheck.some(url => isBlobUrl(url));
      
      if (hasBlobUrls) {
        console.error("BLOB URLs detectadas, abortando envío");
        alert("Error crítico: Se detectaron URLs temporales. Por favor, recarga la página e intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      // ✅ CONSTRUIR DATOS EN EL FORMATO QUE ESPERA EL API
      const payloadData = {
        // ✅ Información personal agrupada
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          whatsapp: data.whatsapp,
          birthDate: data.birthDate, // Ya en formato YYYY-MM-DD correcto

          // Dirección dentro de personalInfo
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          state: data.state,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country || 'México',
          gender: data.gender,
          maritalStatus: data.maritalStatus,
        },

        // ✅ Contacto de emergencia agrupado
        emergencyContact: {
          name: data.emergencyName,
          phone: data.emergencyPhone,
          medicalCondition: data.medicalCondition,
          bloodType: data.bloodType,
        },

        // ✅ Información de membresía agrupada
        membershipData: {
          referredBy: data.referredBy,
          mainMotivation: data.mainMotivation,
          receivePlans: data.receivePlans,
          trainingLevel: data.trainingLevel,
        },

        // ✅ Archivos procesados (base64)
        profilePhoto: profilePhotoBase64,
        signature: signatureDataUrl,
        ...(tutorINEBase64 && { tutorINE: tutorINEBase64 }),

        // ✅ Estados y configuración
        isMinor: showTutorField,

        // ✅ Metadata adicional
        metadata: {
          acceptedRules: data.acceptedRules,
          registrationSource: 'web_form',
          registrationTimestamp: getUTCTimestamp(),
        }
      };

      console.log('Datos con auditoría:', payloadData);

      // Llamada al API con datos en formato correcto
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadData), // ✅ Datos en formato correcto
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

  // ✅ EFECTOS (mantener originales pero con callbacks actualizados)
  
  // Cargar datos guardados
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData: SavedFormData = JSON.parse(savedData);
        
        // Restaurar previews si son válidos
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
            
            // Determinar step y completados
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

  // Calcular progreso y guardar datos
  useEffect(() => {
    if (!isDirty) return;
    
    try {
      const dataToSave: SavedFormData = { ...formValues };
      
      // ✅ Verificación de tipo más específica para FileList
      (Object.keys(dataToSave) as Array<keyof SavedFormData>).forEach((key) => {
        const value = dataToSave[key];
        if ((value as any) instanceof FileList || value instanceof File) {
          delete dataToSave[key];
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
        
      // Calcular progreso
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

  // Verificar si el usuario es menor de edad
  useEffect(() => {
    const birthDate = formValues.birthDate;
    if (birthDate) {
      try {
        const age = calculateAge(birthDate);
        setShowTutorField(age < 18);
        
        if (age < 18 && step === 4) {
          if (!fieldsPerStep[4].includes('tutorINE')) {
            fieldsPerStep[4].push('tutorINE');
          }
        } else if (step === 4) {
          const index = fieldsPerStep[4].indexOf('tutorINE');
          if (index !== -1) {
            fieldsPerStep[4].splice(index, 1);
          }
        }
      } catch (error) {
        console.error("Error al calcular edad:", error);
      }
    }
  }, [formValues.birthDate, step]);

  // Prevenir cierre accidental
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

  // ✅ FUNCIÓN AUXILIAR PARA DETERMINAR ÚLTIMO PASO COMPLETADO
  const getLastCompletedStep = useCallback((data: Partial<FormData>): number => {
    if (data.acceptedRules) return 4;
    if (data.referredBy && data.mainMotivation && data.trainingLevel) return 3;
    if (data.emergencyName && data.emergencyPhone && data.medicalCondition && data.bloodType) return 2;
    if (data.firstName && data.lastName && data.email) return 1;
    return 0;
  }, []);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    
    // ✅ REDIRIGIR A PÁGINA DE CONFIRMACIÓN DE EMAIL
    window.location.href = '/registro-pendiente';
  };

  // ✅ CALLBACKS PARA FUNCIONES EXPORTADAS
  const getCurrentMexicoDateCallback = useCallback((): string => {
    return getCurrentMexicoDate();
  }, []);

  const validateAgeCallback = useCallback((birthDateString: string): boolean | string => {
    return validateAge(birthDateString);
  }, []);

  return {
    // Estados
    step,
    formProgress,
    isSubmitting,
    showTutorField,
    completedSteps,
    showSuccessModal,
    userId,
    previewUrl,
    tutorINEUrl,
    profilePhotoFile,
    tutorINEFile,
    
    // Refs
    sigCanvas,
    
    // Métodos de formulario
    register,
    handleSubmit,
    control,
    watch,
    errors,
    isDirty,
    trigger,
    setValue,
    reset,
    getValues,
    formValues,
    
    // Funciones de navegación
    goNext,
    goBack,
    goToStep,
    
    // Funciones de archivos
    handleProfilePhotoCapture,
    handleTutorINECapture,
    clearPhoto,
    clearTutorINE,
    clearSignature,
    
    // Función de envío
    onSubmit,
    
    // Función de cierre modal
    handleCloseSuccessModal,
    
    // ✅ UTILIDADES ENTERPRISE
    getCurrentMexicoDate: getCurrentMexicoDateCallback,
    validateAge: validateAgeCallback
  };
};