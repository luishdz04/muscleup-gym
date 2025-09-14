'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toMexicoDate, toMexicoTimestamp } from '@/utils/dateHelpers';

// ✅ IMPORTAR SOLO EL ESQUEMA BÁSICO
import {
  fullRegistrationSchema,
  type FullRegistrationData
} from '@/schemas/registrationSchema';

// ✅ CONFIGURAR DAYJS
dayjs.extend(utc);
dayjs.extend(timezone);

const MEXICO_TZ = 'America/Mexico_City';
const STORAGE_KEY = 'registration-form';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Usar el tipo básico de Zod
type FormData = FullRegistrationData;

interface SignatureCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement;
  toDataURL: (type?: string) => string;
  getTrimmedCanvas?: () => HTMLCanvasElement;
}

// Campos por paso (tu lógica original)
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

// Funciones utilitarias (sin cambios)
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
  // Estados principales (sin cambios)
  const [step, setStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTutorField, setShowTutorField] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados para archivos (sin cambios)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tutorINEUrl, setTutorINEUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [tutorINEFile, setTutorINEFile] = useState<File | null>(null);
  
  // Ref para firma
  const sigCanvas = useRef<SignatureCanvasRef | null>(null);

  // ✅ CONFIGURACIÓN BÁSICA SIN VALIDACIONES EXTRAS
  const formMethods = useForm<FullRegistrationData>({
    resolver: zodResolver(fullRegistrationSchema),
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
    formState: { errors, isDirty },
    trigger,
    setValue,
    reset,
    getValues,
  } = formMethods;

  const formValues = watch();

  // Resto de tus funciones SIN CAMBIOS...
  // (toda la lógica de archivos, navegación, submit, etc.)

  // Funciones para convertir a base64
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

  // [RESTO DE TU LÓGICA ORIGINAL SIN CAMBIOS...]
  // Copio aquí el resto de tus funciones exactamente como las tienes...
  
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
        const parsedData = JSON.parse(savedData);
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
        const parsedData = JSON.parse(savedData);
        delete parsedData.tutorINEPreview;
        delete parsedData.hasTutorINEFile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Error al actualizar localStorage:", e);
    }
  }, [setValue]);

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
      const currentErrors = Object.keys(errors).filter(key => 
        fieldsToValidate.includes(key as keyof FormData)
      );
      
      if (currentErrors.length > 0) {
        const firstError = errors[currentErrors[0] as keyof FormData];
        alert(firstError?.message || 'Por favor, completa todos los campos requeridos correctamente.');
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

  // Función de envío [TU LÓGICA ORIGINAL]
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      console.log("🚀 [SUBMIT] Iniciando proceso con Zod básico");
      
      // [RESTO DE TU LÓGICA DE SUBMIT ORIGINAL...]
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
          version: '4.0-zod-stable',
          processedAt: toMexicoTimestamp(currentMexicoTime),
          processedBy: 'luishdz044',
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

  // Efectos [TU LÓGICA ORIGINAL]
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

  // Progreso y guardado
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

  // ✅ SOLO NECESITAS ESTE useEffect PARA MOSTRAR/OCULTAR EL CAMPO EN LA UI
  useEffect(() => {
    const birthDate = formValues.birthDate;
    if (birthDate) {
      try {
        const age = calculateAge(birthDate);
        setShowTutorField(age < 18);
      } catch (error) {
        setShowTutorField(false);
      }
    }
  }, [formValues.birthDate]);

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

  // Función auxiliar
  const getLastCompletedStep = useCallback((data: Partial<FormData>): number => {
    if (data.acceptedRules) return 4;
    if (data.referredBy && data.mainMotivation && data.trainingLevel) return 3;
    if (data.emergencyName && data.emergencyPhone && data.medicalCondition && data.bloodType) return 2;
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
    // Estados
    step, formProgress, isSubmitting, showTutorField, completedSteps, showSuccessModal, userId,
    previewUrl, tutorINEUrl, profilePhotoFile, tutorINEFile,
    
    // Refs
    sigCanvas,
    
    // Métodos de formulario
    register, handleSubmit, control, watch, errors, isDirty, trigger, setValue, reset, getValues, formValues,
    
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
