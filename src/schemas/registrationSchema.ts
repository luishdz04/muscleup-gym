/**
 * @file Contiene todos los esquemas de validación de Zod para el proceso de registro.
 * @author Luis Hernandez (luishdz04)
 * @version 3.2.0 - Corregido para Build de Next.js
 */
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configuración de Dayjs para usar la zona horaria de México consistentemente
dayjs.extend(utc);
dayjs.extend(timezone);

const MEXICO_TZ = 'America/Mexico_City';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// --- Funciones Utilitarias ---

const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birthDate = dayjs.tz(birthDateString, MEXICO_TZ);
  const now = dayjs().tz(MEXICO_TZ);
  return now.diff(birthDate, 'year');
};

// --- Esquemas Reutilizables ---

// ✅ SOLUCIÓN: Hacemos la validación de FileList condicional al entorno del navegador.
const isBrowser = typeof window !== 'undefined';

/**
 * Esquema de validación para un archivo de imagen OBLIGATORIO.
 */
const requiredImageFileSchema = z
  .any() // Empezamos con `any` que funciona en servidor y navegador
  .refine(
    (files) => (isBrowser ? files instanceof FileList : true), // Validamos FileList solo en el navegador
    "Se requiere una imagen."
  )
  .refine((files) => files && files.length > 0, "Se requiere una imagen.")
  .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `El tamaño máximo es 5MB.`)
  .refine(
    (files) => files?.[0]?.type.startsWith("image/"),
    "El archivo debe ser una imagen."
  );

/**
 * Esquema de validación para un archivo de imagen OPCIONAL.
 */
const optionalImageFileSchema = z
  .any()
  .optional()
  .refine(
    (files) => !files || files.length === 0 || (isBrowser ? files instanceof FileList : true),
    "Archivo inválido."
  )
  .refine((files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE_BYTES, `El tamaño máximo es 5MB.`)
  .refine(
    (files) => !files || files.length === 0 || files[0]?.type.startsWith("image/"),
    "El archivo debe ser una imagen."
  );


// --- Esquemas por Paso ---

// PASO 1: Información Personal y de Contacto
export const step1Schema = z.object({
  profilePhoto: requiredImageFileSchema,
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 letras.')
    .max(50, 'Nombre demasiado largo.')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Nombre inválido.'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 letras.')
    .max(50, 'Apellido demasiado largo.')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Apellido inválido.'),
  email: z
    .string()
    .email('Correo electrónico inválido.')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula.')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula.')
    .regex(/[0-9]/, 'Debe contener al menos un número.'),
  confirmPassword: z.string(),
  whatsapp: z
    .string()
    .min(10, 'El número de WhatsApp debe tener 10 dígitos.')
    .regex(/^[0-9]{10}$/, 'Ingresa un número de 10 dígitos.'),
  birthDate: z
    .string()
    .min(1, 'Fecha de nacimiento requerida.')
    .refine((dateStr) => dayjs(dateStr).isValid(), 'Fecha inválida.')
    .refine((dateStr) => {
      const age = calculateAge(dateStr);
      return age >= 10 && age <= 100;
    }, 'La edad debe estar entre 10 y 100 años.'),
  street: z.string().min(3, 'Calle requerida.').max(100),
  number: z.string().min(1, 'Número requerido.').max(10),
  neighborhood: z.string().min(3, 'Colonia requerida.').max(50),
  state: z.string().min(3, 'Estado requerido.').max(50),
  city: z.string().min(3, 'Ciudad requerida.').max(50),
  postalCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos.'),
  country: z.string().default('México'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'], {
    errorMap: () => ({ message: 'Selecciona un género.' })
  }),
  maritalStatus: z.enum(['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre', 'Otro'], {
    errorMap: () => ({ message: 'Selecciona un estado civil.' })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
});

// PASO 2: Contacto de Emergencia
export const step2Schema = z.object({
  emergencyName: z.string().min(3, 'Nombre de emergencia requerido.').regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Nombre inválido.'),
  emergencyPhone: z.string().min(10, 'El teléfono debe tener 10 dígitos.').regex(/^[0-9]{10}$/, 'Ingresa un número de 10 dígitos.'),
  medicalCondition: z.string().max(500).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sé'], {
    errorMap: () => ({ message: 'Selecciona un tipo de sangre.' })
  }),
});

// PASO 3: Información de Membresía
export const step3Schema = z.object({
  referredBy: z.enum(['Redes sociales', 'Recomendación', 'Google', 'Volantes', 'Pasé por el lugar', 'Otro'], {
    errorMap: () => ({ message: 'Selecciona cómo nos conociste.' })
  }),
  mainMotivation: z.enum(['Bajar de peso', 'Aumentar masa muscular', 'Mejorar salud', 'Rehabilitación', 'Recreación', 'Competencia', 'Otro'], {
    errorMap: () => ({ message: 'Selecciona tu motivación.' })
  }),
  receivePlans: z.boolean().default(false),
  trainingLevel: z.enum(['Principiante', 'Intermedio', 'Avanzado', 'Atleta'], {
    errorMap: () => ({ message: 'Selecciona tu nivel.' })
  }),
});

// --- Esquema Completo con Lógica Condicional ---

export const fullRegistrationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .extend({
    // Campos del paso 4
    acceptedRules: z.boolean().refine((val) => val === true, 'Debes aceptar el reglamento para continuar.'),
    tutorINE: optionalImageFileSchema, // Definido como opcional por defecto
  })
  .superRefine((data, ctx) => {
    // Lógica condicional: si es menor de edad, el INE del tutor es obligatorio.
    if (!data.birthDate) return; // Si no hay fecha, no podemos validar la edad
    const age = calculateAge(data.birthDate);
    if (age < 18) {
      if (!data.tutorINE || data.tutorINE.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El INE del tutor es requerido para menores de edad.",
          path: ["tutorINE"],
        });
      }
    }
  });

// --- Tipos de TypeScript ---

// Exportamos el tipo del formulario completo para usarlo en el hook.
export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;
