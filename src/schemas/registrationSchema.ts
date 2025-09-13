// src/schemas/registrationSchema.ts
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

// ✅ VALIDACIÓN DE ARCHIVO CORREGIDA (solución de Gemini)
const fileValidation = z
  .instanceof(FileList, { message: "Archivo requerido" })
  .refine((fileList) => fileList.length > 0, "Archivo requerido")
  .refine((fileList) => fileList[0]?.size <= MAX_FILE_SIZE, "El archivo debe ser menor a 5MB")
  .refine(
    (fileList) => fileList[0]?.type.startsWith("image/"),
    "Solo se permiten imágenes"
  );

// ✅ VALIDACIÓN OPCIONAL DE ARCHIVO CORREGIDA
const optionalFileValidation = z
  .instanceof(FileList)
  .optional()
  .refine((fileList) => !fileList || fileList.length === 0 || fileList[0]?.size <= MAX_FILE_SIZE, "El archivo debe ser menor a 5MB")
  .refine(
    (fileList) => !fileList || fileList.length === 0 || fileList[0]?.type.startsWith("image/"),
    "Solo se permiten imágenes"
  );

// Esquemas por paso
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

// ✅ ESQUEMA COMPLETO Y UNIFICADO (solución de Gemini)
export const fullRegistrationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .extend({
    // Campos del paso 4
    acceptedRules: z
      .boolean()
      .refine((val) => val === true, 'Debes aceptar el reglamento'),
    tutorINE: optionalFileValidation // Lo definimos como opcional aquí
  })
  .superRefine((data, ctx) => {
    // ✅ Lógica condicional para el INE del tutor (solución de Gemini)
    const age = calculateAge(data.birthDate);
    if (age < 18) {
      if (!data.tutorINE || data.tutorINE.length === 0) {
        // Si es menor y no hay archivo, agregamos un error
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El INE del tutor es requerido para menores de edad",
          path: ["tutorINE"],
        });
      }
    }
  });

// Tipos generados automáticamente
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type FullRegistrationData = z.infer<typeof fullRegistrationSchema>;
