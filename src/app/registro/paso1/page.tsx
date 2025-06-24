'use client';

console.log("Iniciando componente de registro - Versión 2.0 - BLOB URLs CORREGIDO - 2025-06-24 by @luishdz044");

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { uploadUserFile } from '@/utils/uploadFile';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styles from '@/styles/registro/RegistroWizard.module.css';
import useWindowSize from '@/hooks/useWindowSize';
import PhotoCapture from '@/components/registro/PhotoCapture';
import SuccessModal from '@/components/registro/SuccessModal';

// Importación dinámica de componentes pesados con manejo correcto de exportación
const SignatureCanvas = dynamic(
  () => import('react-signature-canvas').then(mod => mod.default || mod),
  { ssr: false }
);

const PasswordStrengthMeter = dynamic(
  () => import('@/components/PasswordStrengthMeter'),
  { ssr: false }
);

// ✅ INTERFACES Y TIPOS CORREGIDOS
interface SignatureCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement;
  toDataURL: (type?: string) => string;
  getTrimmedCanvas?: () => HTMLCanvasElement;
}

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

// ✅ INTERFAZ EXTENDIDA PARA DATOS CON PREVISUALIZACIONES (sin blob URLs)
interface FormDataWithPreviews extends FormData {
  profilePhotoPreview?: string;
  tutorINEPreview?: string;
  hasProfilePhotoFile?: boolean;
  hasTutorINEFile?: boolean;
}

// ✅ CAMPOS POR PASO CORRECTAMENTE TIPADOS
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

// Total de campos requeridos
const TOTAL_REQUIRED_FIELDS = 
  fieldsPerStep[1].length + 
  fieldsPerStep[2].length + 
  fieldsPerStep[3].length + 
  fieldsPerStep[4].length - 1; // -1 por receivePlans que no es obligatorio

// ✅ CONSTANTES DE CONFIGURACIÓN
const STORAGE_KEY = 'registration-form';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ✅ FUNCIÓN DE VALIDACIÓN DE ARCHIVOS MEJORADA
const isValidFile = (file: unknown): file is File => {
  return typeof file === 'object' && 
         file !== null && 
         'name' in file && 
         'size' in file && 
         'type' in file &&
         (file as File).size <= MAX_FILE_SIZE &&
         (file as File).type.startsWith('image/');
};

// ✅ FUNCIÓN PARA DETECTAR Y PREVENIR BLOB URLS
const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

// ✅ FUNCIÓN PARA SANITIZAR URLs (prevenir blob URLs)
const sanitizeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // ❌ Si es blob URL, no la uses
  if (isBlobUrl(url)) {
    console.warn('🚫 [SANITIZE] Blob URL detectada y eliminada:', url.substring(0, 50) + '...');
    return undefined;
  }
  
  // ✅ Solo permitir data URLs (base64) válidas
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // ✅ URLs normales
  return url;
};

// Componente principal usando función nombrada
const RegistroPage = () => {
  const [step, setStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tutorINEUrl, setTutorINEUrl] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTutorField, setShowTutorField] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // ✅ NUEVOS ESTADOS PARA MANEJAR ARCHIVOS REALES
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [tutorINEFile, setTutorINEFile] = useState<File | null>(null);
  
  const SignatureCanvasTyped = SignatureCanvas as any;
  
  // ✅ REF CORRECTAMENTE TIPADO
  const sigCanvas = useRef<SignatureCanvasRef | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Configuración del formulario
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
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      receivePlans: false,
      country: 'México',
    },
  });

  // Observar cambios para persistencia y progreso
  const formValues = watch();

  // ✅ FUNCIÓN PARA CONVERTIR A BASE64 MEMOIZADA Y MEJORADA
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
          // ✅ VERIFICAR que no sea blob URL
          if (isBlobUrl(result)) {
            reject(new Error('Error: se generó una blob URL en lugar de base64'));
            return;
          }
          console.log('✅ [BASE64] Archivo convertido correctamente a base64');
          resolve(result);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // ✅ FUNCIÓN PARA SANITIZAR DATOS ANTES DE GUARDAR
  const sanitizeForStorage = useCallback((data: any) => {
    const { password, confirmPassword, ...safeData } = data;
    return safeData;
  }, []);

  // ✅ FUNCIÓN PARA CREAR PREVIEW SEGURO (sin blob URLs)
  const createSafePreview = useCallback(async (file: File): Promise<string> => {
    try {
      // Convertir directamente a base64 en lugar de usar blob URL
      const base64 = await toBase64(file);
      console.log('✅ [PREVIEW] Preview creado con base64 (sin blob)');
      return base64;
    } catch (error) {
      console.error('❌ [PREVIEW] Error creando preview:', error);
      throw error;
    }
  }, [toBase64]);

  // Cargar datos guardados al inicio
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as FormDataWithPreviews;
        
        // ✅ SANITIZAR URLs cargadas del localStorage
        const sanitizedProfilePreview = sanitizeUrl(parsedData.profilePhotoPreview);
        const sanitizedTutorPreview = sanitizeUrl(parsedData.tutorINEPreview);
        
        // Restaurar foto de perfil si existe y es válida
        if (sanitizedProfilePreview) {
          setPreviewUrl(sanitizedProfilePreview);
          console.log('✅ [LOAD] Profile preview cargado desde localStorage');
        } else if (parsedData.profilePhotoPreview) {
          console.warn('⚠️ [LOAD] Profile preview inválido eliminado del localStorage');
        }
        
        // Restaurar foto de INE si existe y es válida
        if (sanitizedTutorPreview) {
          setTutorINEUrl(sanitizedTutorPreview);
          console.log('✅ [LOAD] Tutor INE preview cargado desde localStorage');
        } else if (parsedData.tutorINEPreview) {
          console.warn('⚠️ [LOAD] Tutor INE preview inválido eliminado del localStorage');
        }
        
        // Mostrar notificación solo si hay datos importantes
        if (parsedData.firstName || parsedData.email) {
          if (confirm("Encontramos un registro previo. ¿Deseas continuar donde lo dejaste?")) {
            // Eliminar las propiedades de previsualización que no forman parte del formulario
            const { 
              profilePhotoPreview, 
              tutorINEPreview, 
              hasProfilePhotoFile,
              hasTutorINEFile,
              ...formData 
            } = parsedData;
            
            reset(formData);
            
            // Determinar el paso donde se quedó
            const lastStep = getLastCompletedStep(formData);
            setStep(Math.min(lastStep + 1, 4));
            
            // Marcar pasos completados
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
  }, [reset, sanitizeUrl]);

  // Calcular el progreso del formulario basado en campos completados
  useEffect(() => {
    if (!isDirty) return; // No actualizar si no hay cambios
    
    try {
      // Guardar solo valores del formulario (no FileList)
      const dataToSave = sanitizeForStorage({ ...formValues });
      
      // Eliminar objetos que no se pueden serializar
      Object.keys(dataToSave).forEach((key) => {
        const value = dataToSave[key as keyof typeof dataToSave];
        if (value instanceof FileList || value instanceof File) {
          delete dataToSave[key as keyof typeof dataToSave];
        }
      });
      
      // ✅ GUARDAR REFERENCIAS SEGURAS (solo si no son blob URLs)
      const sanitizedProfileUrl = sanitizeUrl(previewUrl || undefined);
      const sanitizedTutorUrl = sanitizeUrl(tutorINEUrl || undefined);
      
      if (sanitizedProfileUrl) {
        dataToSave.profilePhotoPreview = sanitizedProfileUrl;
        dataToSave.hasProfilePhotoFile = !!profilePhotoFile;
      }
      
      if (sanitizedTutorUrl) {
        dataToSave.tutorINEPreview = sanitizedTutorUrl;
        dataToSave.hasTutorINEFile = !!tutorINEFile;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Calcular cuántos campos requeridos están completados
      let completedFields = 0;
      let requiredFields = 0;
      
      // Contar campos completados por cada paso
      Object.keys(fieldsPerStep).forEach(stepKey => {
        const stepNum = parseInt(stepKey);
        
        // Solo contar campos de pasos que ya se han visitado o el paso actual
        if (stepNum <= step || completedSteps.includes(stepNum)) {
          fieldsPerStep[stepNum].forEach(field => {
            // No contar receivePlans que es opcional
            if (field !== 'receivePlans') {
              requiredFields++;
              
              // Verificar si el campo tiene valor
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
      
      // Calcular porcentaje
      const progress = Math.min(Math.round((completedFields / TOTAL_REQUIRED_FIELDS) * 100), 100);
      setFormProgress(progress);
    } catch (error) {
      console.error("Error al guardar o calcular progreso:", error);
    }
  }, [formValues, isDirty, step, completedSteps, previewUrl, tutorINEUrl, profilePhotoFile, tutorINEFile, sanitizeForStorage]);

  // Verificar si el usuario es menor de edad
  useEffect(() => {
    const birthDate = formValues.birthDate;
    if (birthDate) {
      try {
        const birthDateObj = dayjs(birthDate);
        const now = dayjs();
        const age = now.diff(birthDateObj, 'year');
        
        setShowTutorField(age < 18);
        
        // Si es menor, añadir tutorINE a los campos requeridos
        if (age < 18 && step === 4) {
          if (!fieldsPerStep[4].includes('tutorINE')) {
            fieldsPerStep[4].push('tutorINE');
          }
        } else if (step === 4) {
          // Si no es menor, remover tutorINE si estaba en los campos
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
    // Solo ejecutar en el cliente
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

  // Función para determinar el último paso completado
  const getLastCompletedStep = useCallback((data: Partial<FormData>): number => {
    // Si tiene datos del paso 4
    if (data.acceptedRules) return 4;
    
    // Si tiene datos del paso 3
    if (data.referredBy && data.mainMotivation && data.trainingLevel) return 3;
    
    // Si tiene datos del paso 2
    if (data.emergencyName && data.emergencyPhone && data.medicalCondition && data.bloodType) return 2;
    
    // Si tiene datos básicos del paso 1
    if (data.firstName && data.lastName && data.email) return 1;
    
    return 0;
  }, []);

  // ✅ FUNCIÓN DE VALIDACIÓN TIPADA CORRECTAMENTE
  const getFieldsForStep = useCallback((currentStep: number): (keyof FormData)[] => {
    const fields = fieldsPerStep[currentStep] || [];
    return fields as (keyof FormData)[];
  }, []);

  // Funciones de navegación entre pasos
  const goNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const valid = await trigger(fieldsToValidate);
    
    if (valid) {
      // Marcar este paso como completado
      if (!completedSteps.includes(step)) {
        setCompletedSteps(prev => [...prev, step]);
      }
      
      // Avanzar al siguiente paso
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

  // Ir directamente a un paso específico
  const goToStep = (targetStep: number) => {
    // Solo permitir ir a pasos completados o al paso actual + 1
    if (completedSteps.includes(targetStep - 1) || targetStep === step || targetStep <= step) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ MANEJO DE ERRORES MEJORADO
  const handleFileError = useCallback((error: unknown, context: string) => {
    console.error(`Error en ${context}:`, error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    alert(`Error al procesar la imagen: ${message}`);
  }, []);

  // ✅ FUNCIONES PARA MANEJO DE FOTOS COMPLETAMENTE CORREGIDAS
  const handleProfilePhotoCapture = useCallback(async (file: File) => {
    try {
      if (!file || !isValidFile(file)) {
        throw new Error("No se ha proporcionado un archivo válido");
      }
      
      console.log("📸 [PROFILE] Procesando foto de perfil...");
      
      // ✅ GUARDAR ARCHIVO REAL
      setProfilePhotoFile(file);
      
      // ✅ CREAR PREVIEW SEGURO (base64, no blob)
      const safePreview = await createSafePreview(file);
      setPreviewUrl(safePreview);
      
      // ✅ CREAR FILELIST PARA REACT-HOOK-FORM
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      setValue('profilePhoto', fileList, { shouldValidate: true });
      
      console.log("✅ [PROFILE] Foto de perfil procesada correctamente");
    } catch (error) {
      handleFileError(error, 'procesamiento de foto de perfil');
    }
  }, [setValue, handleFileError, createSafePreview]);

  const handleTutorINECapture = useCallback(async (file: File) => {
    try {
      if (!file || !isValidFile(file)) {
        throw new Error("No se ha proporcionado un archivo válido");
      }
      
      console.log("📄 [TUTOR-INE] Procesando INE del tutor...");
      
      // ✅ GUARDAR ARCHIVO REAL
      setTutorINEFile(file);
      
      // ✅ CREAR PREVIEW SEGURO (base64, no blob)
      const safePreview = await createSafePreview(file);
      setTutorINEUrl(safePreview);
      
      // ✅ CREAR FILELIST PARA REACT-HOOK-FORM
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      setValue('tutorINE', fileList, { shouldValidate: true });
      
      console.log("✅ [TUTOR-INE] INE del tutor procesado correctamente");
    } catch (error) {
      handleFileError(error, 'procesamiento de foto del INE');
    }
  }, [setValue, handleFileError, createSafePreview]);

  const clearPhoto = useCallback(() => {
    // ✅ LIMPIAR TODOS LOS ESTADOS RELACIONADOS
    setProfilePhotoFile(null);
    setPreviewUrl(null);
    setValue('profilePhoto', undefined as any, {shouldDirty: true, shouldValidate: true});
    
    // Actualizar localStorage
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
    
    console.log("🗑️ [PROFILE] Foto de perfil eliminada");
  }, [setValue]);

  const clearTutorINE = useCallback(() => {
    // ✅ LIMPIAR TODOS LOS ESTADOS RELACIONADOS
    setTutorINEFile(null);
    setTutorINEUrl(null);
    setValue('tutorINE', undefined as any, {shouldDirty: true, shouldValidate: true});
    
    // Actualizar localStorage
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
    
    console.log("🗑️ [TUTOR-INE] INE del tutor eliminado");
  }, [setValue]);

  // ✅ FUNCIÓN DE ENVÍO COMPLETAMENTE CORREGIDA
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      console.log("🚀 [SUBMIT] Iniciando proceso de envío corregido - Sin blob URLs...");
      
      // ✅ VERIFICAR FIRMA DE MANERA SEGURA Y ROBUSTA
      let signatureDataUrl = '';
      if (sigCanvas.current) {
        try {
          console.log("✍️ [SUBMIT] Obteniendo canvas de firma...");
          const canvas = sigCanvas.current.getCanvas();
          if (canvas) {
            signatureDataUrl = canvas.toDataURL('image/png');
            
            // ✅ VERIFICAR que no sea blob URL
            if (isBlobUrl(signatureDataUrl)) {
              throw new Error("Error: la firma generó una blob URL");
            }
            
            console.log("✅ [SUBMIT] Firma obtenida correctamente");
          } else {
            throw new Error("No se pudo obtener el canvas de la firma");
          }
        } catch (error) {
          handleFileError(error, 'procesamiento de firma');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Verificar firma vacía
      const isEmptySignature = !signatureDataUrl || 
                      signatureDataUrl === 'data:image/png;base64,' || 
                      signatureDataUrl.includes('AAAAAAAAAA');
      
      if (isEmptySignature) {
        alert('Por favor firma el documento antes de continuar');
        setIsSubmitting(false);
        return;
      }

      console.log("📸 [SUBMIT] Procesando fotos...");
      
      // ✅ PROCESAR IMÁGENES DE MANERA COMPLETAMENTE SEGURA
      let profilePhotoBase64 = '';
      let tutorINEBase64 = '';
      
      try {
        // ✅ USAR ARCHIVO REAL GUARDADO, NO EL DEL FORMULARIO
        if (profilePhotoFile && isValidFile(profilePhotoFile)) {
          console.log("📸 [SUBMIT] Convirtiendo foto de perfil real a base64...");
          profilePhotoBase64 = await toBase64(profilePhotoFile);
          
          // ✅ DOBLE VERIFICACIÓN: No debe ser blob URL
          if (isBlobUrl(profilePhotoBase64)) {
            throw new Error("Error crítico: foto de perfil generó blob URL");
          }
          
          console.log("✅ [SUBMIT] Foto de perfil convertida correctamente");
        } else {
          throw new Error("No hay foto de perfil válida");
        }
        
        // ✅ PROCESAR INE DEL TUTOR SI ES NECESARIO
        if (showTutorField) {
          if (tutorINEFile && isValidFile(tutorINEFile)) {
            console.log("📄 [SUBMIT] Convirtiendo INE del tutor real a base64...");
            tutorINEBase64 = await toBase64(tutorINEFile);
            
            // ✅ DOBLE VERIFICACIÓN: No debe ser blob URL
            if (isBlobUrl(tutorINEBase64)) {
              throw new Error("Error crítico: INE del tutor generó blob URL");
            }
            
            console.log("✅ [SUBMIT] INE del tutor convertido correctamente");
          } else {
            throw new Error("No hay foto de INE válida para menor de edad");
          }
        }
        
      } catch (error) {
        console.error("❌ [SUBMIT] Error al procesar imágenes:", error);
        alert(`Error al procesar las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsSubmitting(false);
        return;
      }

      // ✅ VALIDACIÓN FINAL: VERIFICAR QUE NO HAY BLOB URLs
      const urlsToCheck = [profilePhotoBase64, tutorINEBase64, signatureDataUrl].filter(Boolean);
      const hasBlobUrls = urlsToCheck.some(url => isBlobUrl(url));
      
      if (hasBlobUrls) {
        console.error("❌ [SUBMIT] BLOB URLs detectadas, abortando envío:", {
          profilePhotoIsBlob: isBlobUrl(profilePhotoBase64),
          tutorINEIsBlob: isBlobUrl(tutorINEBase64),
          signatureIsBlob: isBlobUrl(signatureDataUrl)
        });
        alert("❌ Error crítico: Se detectaron URLs temporales. Por favor, recarga la página e intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      // ✅ CONSTRUIR PAYLOAD LIMPIO
      const payload = {
        // Datos personales - estructura mejorada para Supabase Auth
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password, // La contraseña se procesará en Supabase Auth
          whatsapp: data.whatsapp,
          birthDate: data.birthDate,
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
        // Datos de emergencia
        emergencyContact: {
          name: data.emergencyName,
          phone: data.emergencyPhone,
          medicalCondition: data.medicalCondition,
          bloodType: data.bloodType,
        },
        // Datos de membresía
        membershipData: {
          referredBy: data.referredBy,
          mainMotivation: data.mainMotivation,
          receivePlans: data.receivePlans,
          trainingLevel: data.trainingLevel,
        },
        // Aceptación y firma
        acceptedRules: data.acceptedRules,
        signature: signatureDataUrl,
        registrationDate: new Date().toISOString(),
        
        // ✅ FOTOS PROCESADAS CORRECTAMENTE (GARANTIZADO SIN BLOB URLs)
        profilePhoto: profilePhotoBase64,
        tutorINE: tutorINEBase64,
        isMinor: showTutorField,
        
        // ✅ METADATA PARA DEBUGGING
        metadata: {
          version: '2.0-no-blob',
          processedAt: new Date().toISOString(),
          processedBy: 'luishdz044'
        }
      };

      // ✅ LOG FINAL PARA VERIFICACIÓN
      console.log("✅ [SUBMIT] Payload preparado correctamente:", {
        profilePhoto: profilePhotoBase64.substring(0, 50) + '...',
        tutorINE: tutorINEBase64 ? tutorINEBase64.substring(0, 50) + '...' : 'N/A',
        signature: signatureDataUrl.substring(0, 50) + '...',
        noBlobUrls: !urlsToCheck.some(url => isBlobUrl(url)),
        timestamp: new Date().toISOString()
      });

      // ✅ LLAMADA AL API CON MANEJO DE ERRORES MEJORADO
      console.log("📡 [SUBMIT] Enviando datos al API...");
      
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store' // Evitar caché
        });

        console.log("📡 [SUBMIT] Respuesta recibida, status:", res.status);
        
        // Intentar parsear la respuesta como JSON
        let responseData;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          responseData = await res.json();
          console.log("📡 [SUBMIT] Respuesta JSON:", responseData);
        } else {
          const text = await res.text();
          console.error("📡 [SUBMIT] Respuesta no-JSON:", text);
          throw new Error(`Respuesta inesperada: ${text.substring(0, 100)}...`);
        }

        if (res.ok && responseData.success) {
          console.log("🎉 [SUBMIT] Registro exitoso, ID:", responseData.userId);
          // Éxito: Guardamos el ID y mostramos modal
          setUserId(responseData.userId);
          setShowSuccessModal(true);
          localStorage.removeItem(STORAGE_KEY); // Limpiar datos guardados
        } else {
          // Error desde el API con mensaje
          const errorMessage = responseData.message || `Error ${res.status}: ${res.statusText}`;
          console.error("❌ [SUBMIT] Error de API:", errorMessage);
          alert(`Error al registrar: ${errorMessage}`);
        }
      } catch (networkError) {
        console.error('❌ [SUBMIT] Error de red:', networkError);
        alert('Error de conexión. Verifica tu internet y vuelve a intentarlo.');
      }
    } catch (error) {
      console.error('💥 [SUBMIT] Error general en el proceso de registro:', error);
      alert('Ocurrió un error al procesar tu registro. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cerrar el modal de éxito
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    
    // Redirigir a la página de confirmación
    if (userId) {
      const url = `/registro/firmado?userId=${encodeURIComponent(userId)}`;
      window.location.href = url;
    } else {
      window.location.href = '/registro/firmado';
    }
  };

  // Función para limpiar la firma
  const clearSignature = useCallback(() => {
    if (sigCanvas.current) {
      try {
        sigCanvas.current.clear();
        console.log("🗑️ [SIGNATURE] Firma eliminada");
      } catch (error) {
        console.error("Error al limpiar la firma:", error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      {/* Logo y lema */}
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/logo.png"
          alt="Muscle Up Gym"
          width={300}
          height={300}
          priority
          className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain"
        />
        <p className="mt-4 text-xl text-white">
          Tu salud y bienestar es nuestra misión.
        </p>
      </div>
      
      {/* Barra de progreso */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span>Progreso del registro</span>
          <span>{formProgress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-500 ease-out"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Indicador de pasos (pestañas) */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex mb-1">
          {[1, 2, 3, 4].map(stepNumber => (
            <div 
              key={stepNumber} 
              className={`flex-1 relative ${stepNumber !== 4 ? 'mr-1' : ''} ${
                completedSteps.includes(stepNumber - 1) || stepNumber <= step ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
              onClick={() => goToStep(stepNumber)}
            >
              <div className={`h-2 rounded-full transition-colors
                ${step >= stepNumber || completedSteps.includes(stepNumber) ? 'bg-yellow-400' : 'bg-zinc-700'}`}></div>
              <div className={`absolute -top-1 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs
                transition-colors
                ${completedSteps.includes(stepNumber) ? 'bg-green-500 text-white' : 
                  step === stepNumber ? 'bg-white text-black' : 'bg-zinc-700 text-white'}`}>
                {completedSteps.includes(stepNumber) ? '✓' : stepNumber}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span 
            className={`${
              step === 1 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(1) || step >= 1 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(1)}
          >
            Datos personales
          </span>
          <span 
            className={`${
              step === 2 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(1) || step >= 2 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(2)}
          >
            Emergencia
          </span>
          <span 
            className={`${
              step === 3 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(2) || step >= 3 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(3)}
          >
            Membresía
          </span>
          <span 
            className={`${
              step === 4 ? 'text-white font-medium' : ''
            } ${completedSteps.includes(3) || step >= 4 ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            onClick={() => goToStep(4)}
          >
            Reglamento
          </span>
        </div>
      </div>
      
      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        {/* PASO 1: DATOS PERSONALES */}
        <div className={step === 1 ? 'animate-fadeIn' : 'hidden'}>
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
              max={new Date().toISOString().split('T')[0]}
              {...register('birthDate', {
                required: 'Este campo es obligatorio',
                validate: value => {
                  const birthDate = new Date(value);
                  const now = new Date();
                  const age = now.getFullYear() - birthDate.getFullYear();
                  return (age >= 10 && age <= 100) || 'La edad debe estar entre 10 y 100 años';
                }
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
              onClick={goNext}
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* PASO 2: CONTACTO DE EMERGENCIA */}
        <div className={step === 2 ? 'animate-fadeIn' : 'hidden'}>
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Contacto de Emergencia</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Nombre del contacto <span className="text-yellow-400">*</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre completo"
              {...register('emergencyName', { required: 'Este campo es obligatorio' })}
            />
            {errors.emergencyName && <p className={styles.errorText}>{errors.emergencyName.message}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Teléfono del contacto <span className="text-yellow-400">*</span></label>
            <div className={styles.phoneInputContainer}>
              <Controller
                control={control}
                name="emergencyPhone"
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
            {errors.emergencyPhone && <p className={styles.errorText}>{errors.emergencyPhone.message}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Condiciones médicas <span className="text-yellow-400">*</span></label>
            <textarea
              className={styles.input}
              rows={3}
              placeholder="Describe cualquier condición médica, alergias o lesiones relevantes"
              {...register('medicalCondition', { required: 'Este campo es obligatorio' })}
            ></textarea>
            {errors.medicalCondition && <p className={styles.errorText}>{errors.medicalCondition.message}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Tipo de sangre <span className="text-yellow-400">*</span></label>
            <select
              className={styles.input}
              {...register('bloodType', { required: 'Este campo es obligatorio' })}
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
              onClick={goBack}
            >
              Atrás
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={goNext}
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* PASO 3: INFORMACIÓN DE MEMBRESÍA */}
        <div className={step === 3 ? 'animate-fadeIn' : 'hidden'}>
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
              onClick={goBack}
            >
              Atrás
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={goNext}
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* PASO 4: REGLAMENTO Y FIRMA */}
        <div className={step === 4 ? 'animate-fadeIn' : 'hidden'}>
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Reglamento y firma</h2>
          
          {/* ✅ NORMAS COMPLETAS ACTUALIZADAS */}
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
          
          {/* ✅ FIRMA TOTALMENTE CORREGIDA */}
          <div className="mb-6">
            <label className="block mb-2">Firma <span className="text-yellow-400">*</span></label>
            <div className="bg-white rounded-md overflow-hidden">
              <SignatureCanvasTyped
                ref={(ref: SignatureCanvasRef | null) => { sigCanvas.current = ref; }}
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
              onClick={goBack}
            >
              Atrás
            </button>
            
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={isSubmitting}
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
      </form>
      
      {/* Modal de éxito */}
      {showSuccessModal && (
        <SuccessModal onClose={handleCloseSuccessModal} />
      )}

      {/* ✅ INDICADOR DE VERSIÓN CORREGIDA PARA DESARROLLO */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 204, 0, 0.2)',
            color: '#FFCC00',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: '600',
            zIndex: 10000,
            border: '1px solid rgba(255, 204, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            opacity: 0.8
          }}
        >
          🚀 Registro v2.0 - Sin blob URLs - {new Date().toISOString()} by @luishdz044
        </div>
      )}

      {/* ✅ ESTILOS CSS PERSONALIZADOS PARA DEBUGGING */}
      <style jsx>{`
        /* Indicadores visuales para desarrollo */
        .blob-url-warning {
          position: relative;
        }
        
        .blob-url-warning::after {
          content: '⚠️ Blob URL detectada';
          position: absolute;
          top: -25px;
          left: 0;
          background: #FFB300;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 1000;
          display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
        }

        .safe-url-indicator {
          position: relative;
        }
        
        .safe-url-indicator::after {
          content: '✅ URL segura';
          position: absolute;
          top: -25px;
          right: 0;
          background: #388E3C;
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 1000;
          display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
        }

        /* Animaciones mejoradas */
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mejoras visuales para el progreso */
        .progress-bar-enhanced {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 204, 0, 0.3),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Estados de validación mejorados */
        .field-success {
          border-color: #388E3C !important;
          box-shadow: 0 0 0 2px rgba(56, 142, 60, 0.2) !important;
        }
        
        .field-error {
          border-color: #D32F2F !important;
          box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.2) !important;
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }

        /* Mejoras de accesibilidad */
        .focus-visible:focus-visible {
          outline: 3px solid #FFCC00 !important;
          outline-offset: 2px !important;
        }
        
        /* Optimizaciones de rendimiento */
        .gpu-accelerated {
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        /* Indicadores de archivo procesado */
        .file-processed::before {
          content: '📁 Procesado';
          position: absolute;
          top: -20px;
          left: 0;
          background: #388E3C;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 100;
        }
        
        .file-pending::before {
          content: '⏳ Pendiente';
          position: absolute;
          top: -20px;
          left: 0;
          background: #FFB300;
          color: black;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 100;
        }

        /* Transiciones suaves */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .smooth-transition {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default RegistroPage;
