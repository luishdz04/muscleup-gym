// schemas/registrationSchema.ts
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const MEXICO_TZ = 'America/Mexico_City';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Función para calcular edad en zona horaria de México
const calculateAge = (birthDateString: string): number => {
  const birthDate = dayjs.tz(birthDateString, MEXICO_TZ);
  const now = dayjs().tz(MEXICO_TZ);
  return now.diff(birthDate, 'year');
};

// Validación personalizada para archivos
const fileValidation = z
  .any()
  .refine((files) => {
    if (!files || files.length === 0) return false;
    return files[0] instanceof File;
  }, "Archivo requerido")
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return files[0].size <= MAX_FILE_SIZE;
  }, "El archivo debe ser menor a 5MB")
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return files[0].type.startsWith('image/');
  }, "Solo se permiten imágenes");

// Validación opcional para archivos
const optionalFileValidation = z
  .any()
  .optional()
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return files[0] instanceof File;
  }, "Archivo inválido")
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return files[0].size <= MAX_FILE_SIZE;
  }, "El archivo debe ser menor a 5MB")
  .refine((files) => {
    if (!files || files.length === 0) return true;
    return files[0].type.startsWith('image/');
  }, "Solo se permiten imágenes");

// Esquema principal dividido por pasos
export const step1Schema = z.object({
  profilePhoto: fileValidation,
  firstName: z
    .string()
    .min(2, 'Nombre muy corto')
    .max(50, 'Nombre muy largo')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Solo se permiten letras'),
  lastName: z
    .string()
    .min(2, 'Apellido muy corto')
    .max(50, 'Apellido muy largo')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Solo se permiten letras'),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  whatsapp: z
    .string()
    .min(10, 'Número de teléfono muy corto')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido'),
  birthDate: z
    .string()
    .min(1, 'Fecha de nacimiento requerida')
    .refine((dateStr) => {
      const date = dayjs(dateStr);
      return date.isValid();
    }, 'Fecha inválida')
    .refine((dateStr) => {
      const age = calculateAge(dateStr);
      return age >= 10 && age <= 100;
    }, 'La edad debe estar entre 10 y 100 años'),
  street: z
    .string()
    .min(5, 'Calle muy corta')
    .max(100, 'Calle muy larga'),
  number: z
    .string()
    .min(1, 'Número requerido')
    .max(10, 'Número muy largo'),
  neighborhood: z
    .string()
    .min(3, 'Colonia muy corta')
    .max(50, 'Colonia muy larga'),
  state: z
    .string()
    .min(3, 'Estado muy corto')
    .max(50, 'Estado muy largo'),
  city: z
    .string()
    .min(3, 'Ciudad muy corta')
    .max(50, 'Ciudad muy larga'),
  postalCode: z
    .string()
    .regex(/^\d{4,5}$/, 'Código postal debe tener 4 o 5 dígitos'),
  country: z.string().default('México'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'], {
    errorMap: () => ({ message: 'Selecciona una opción válida' })
  }),
  maritalStatus: z.enum([
    'Soltero/a', 'Casado/a', 'Divorciado/a', 
    'Viudo/a', 'Unión libre', 'Otro'
  ], {
    errorMap: () => ({ message: 'Selecciona una opción válida' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const step2Schema = z.object({
  emergencyName: z
    .string()
    .min(5, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Solo se permiten letras'),
  emergencyPhone: z
    .string()
    .min(10, 'Número muy corto')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido'),
  medicalCondition: z
    .string()
    .min(5, 'Descripción muy corta')
    .max(500, 'Descripción muy larga'),
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sé'
  ], {
    errorMap: () => ({ message: 'Selecciona un tipo de sangre válido' })
  })
});

export const step3Schema = z.object({
  referredBy: z.enum([
    'Redes sociales', 'Recomendación', 'Google', 
    'Volantes', 'Pasé por el lugar', 'Otro'
  ], {
    errorMap: () => ({ message: 'Selecciona una opción válida' })
  }),
  mainMotivation: z.enum([
    'Bajar de peso', 'Aumentar masa muscular', 'Mejorar salud',
    'Rehabilitación', 'Recreación', 'Competencia', 'Otro'
  ], {
    errorMap: () => ({ message: 'Selecciona una motivación válida' })
  }),
  receivePlans: z.boolean().default(false),
  trainingLevel: z.enum([
    'Principiante', 'Intermedio', 'Avanzado', 'Atleta'
  ], {
    errorMap: () => ({ message: 'Selecciona un nivel válido' })
  })
});

// Esquema dinámico para el paso 4 (depende de si es menor de edad)
export const createStep4Schema = (isMinor: boolean) => {
  const baseSchema = z.object({
    acceptedRules: z
      .boolean()
      .refine((val) => val === true, 'Debes aceptar el reglamento')
  });

  if (isMinor) {
    return baseSchema.extend({
      tutorINE: fileValidation
    });
  }

  return baseSchema;
};

// Esquema completo para validación final
export const createFullRegistrationSchema = (isMinor: boolean) => {
  return step1Schema
    .merge(step2Schema)
    .merge(step3Schema)
    .merge(createStep4Schema(isMinor));
};

// Tipos TypeScript generados automáticamente
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<ReturnType<typeof createStep4Schema>>;
export type FullRegistrationData = z.infer<ReturnType<typeof createFullRegistrationSchema>>;

// Utilidades de validación
export const validateStep = (step: number, data: any, isMinor: boolean = false) => {
  try {
    switch (step) {
      case 1:
        return step1Schema.parse(data);
      case 2:
        return step2Schema.parse(data);
      case 3:
        return step3Schema.parse(data);
      case 4:
        return createStep4Schema(isMinor).parse(data);
      default:
        throw new Error('Paso inválido');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors
      };
    }
    throw error;
  }
};

export const getFieldErrors = (errors: z.ZodError) => {
  const fieldErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const field = error.path.join('.');
    fieldErrors[field] = error.message;
  });
  
  return fieldErrors;
};
