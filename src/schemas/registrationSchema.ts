/**
 * @file Esquemas de validación para el registro de usuarios con Zod.
 * @author Luis Hernandez (luishdz04)
 * @version 4.2.0 - Production Ready
 */
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configuración de Dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const MEXICO_TZ = 'America/Mexico_City';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const isBrowser = typeof window !== 'undefined';

// --- Funciones Utilitarias ---
const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birthDate = dayjs.tz(birthDateString, MEXICO_TZ);
  const now = dayjs().tz(MEXICO_TZ);
  return now.diff(birthDate, 'year');
};

// --- Validadores Reutilizables ---
const nameValidator = (fieldName: string, minLength: number = 2) =>
  z.string({
    required_error: `${fieldName} es requerido.`,
    invalid_type_error: `${fieldName} debe ser texto.`
  })
  .min(minLength, `${fieldName} debe tener al menos ${minLength} letras.`)
  .max(50, `${fieldName} es demasiado largo (máximo 50 caracteres).`)
  .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, `${fieldName} solo puede contener letras y espacios.`)
  .trim();

const phoneValidator = (fieldName: string) =>
  z.string({
    required_error: `${fieldName} es requerido.`
  })
  .length(10, `${fieldName} debe tener exactamente 10 dígitos.`)
  .regex(/^[0-9]{10}$/, `${fieldName} solo puede contener números.`);

const passwordValidator = z.string({
    required_error: "La contraseña es requerida."
  })
  .min(8, "Mínimo 8 caracteres")
  .refine(val => /[A-Z]/.test(val), "Debe contener al menos una mayúscula (A-Z)")
  .refine(val => /[a-z]/.test(val), "Debe contener al menos una minúscula (a-z)")
  .refine(val => /[0-9]/.test(val), "Debe contener al menos un número (0-9)");

const createFileValidator = (required: boolean = false) => {
  const baseSchema = z.custom<FileList>()
    .refine(
      (files) => isBrowser ? files instanceof FileList : true,
      "El valor debe ser una lista de archivos."
    )
    .refine(
      (files) => !required || (files && files.length > 0),
      "Se requiere una imagen."
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true; // Pasa si no es requerido y no hay archivo
        return files[0]?.size <= MAX_FILE_SIZE_BYTES;
      },
      "El archivo es demasiado grande (máximo 5MB)."
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true; // Pasa si no es requerido y no hay archivo
        return files[0]?.type.startsWith("image/");
      },
      "El archivo debe ser una imagen (JPG, PNG, GIF, etc.)."
    );
  
  // Si no es requerido, puede ser opcional o un FileList vacío
  return required ? baseSchema.refine(files => files.length > 0, "Se requiere una imagen.") : baseSchema.optional();
};

// --- Esquemas por Paso ---
export const step1Schema = z.object({
  profilePhoto: createFileValidator(true),
  firstName: nameValidator("Nombre"),
  lastName: nameValidator("Apellido"),
  email: z.string({ required_error: "El correo electrónico es requerido." })
    .email("Formato de correo inválido (ejemplo: usuario@dominio.com)")
    .toLowerCase(),
  password: passwordValidator,
  confirmPassword: z.string({ required_error: "Confirma tu contraseña." }),
  whatsapp: phoneValidator("WhatsApp"),
  birthDate: z.string({ required_error: "La fecha de nacimiento es requerida." })
    .min(1, "Selecciona tu fecha de nacimiento.")
    .refine(dateStr => dayjs(dateStr).isValid(), "Fecha inválida.")
    .refine(dateStr => {
      const age = calculateAge(dateStr);
      return age >= 10 && age <= 100;
    }, "La edad debe estar entre 10 y 100 años."),
  street: z.string().min(3, "La calle debe tener al menos 3 caracteres.").trim(),
  number: z.string().min(1, "El número es requerido.").trim(),
  neighborhood: z.string().min(3, "La colonia debe tener al menos 3 caracteres.").trim(),
  state: z.string().min(3, "El estado debe tener al menos 3 caracteres.").trim(),
  city: z.string().min(3, "La ciudad debe tener al menos 3 caracteres.").trim(),
  postalCode: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 números."),
  country: z.string().default('México'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'], { required_error: "Selecciona tu género." }),
  maritalStatus: z.enum(['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre', 'Otro'], { required_error: "Selecciona tu estado civil." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ['confirmPassword'],
});

export const step2Schema = z.object({
  emergencyName: nameValidator("Nombre del contacto de emergencia", 3),
  emergencyPhone: phoneValidator("Teléfono de emergencia"),
  medicalCondition: z.string().max(500, "Máximo 500 caracteres.").optional().or(z.literal('')),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sé'], { required_error: "Selecciona tu tipo de sangre." }),
});

export const step3Schema = z.object({
  referredBy: z.enum(['Redes sociales', 'Recomendación', 'Google', 'Volantes', 'Pasé por el lugar', 'Otro'], { required_error: "Selecciona cómo nos conociste." }),
  mainMotivation: z.enum(['Bajar de peso', 'Aumentar masa muscular', 'Mejorar salud', 'Rehabilitación', 'Recreación', 'Competencia', 'Otro'], { required_error: "Selecciona tu motivación." }),
  receivePlans: z.boolean().default(false),
  trainingLevel: z.enum(['Principiante', 'Intermedio', 'Avanzado', 'Atleta'], { required_error: "Selecciona tu nivel." }),
});

export const step4Schema = z.object({
  acceptedRules: z.boolean().refine(val => val === true, { message: "Debes aceptar el reglamento." }),
  tutorINE: createFileValidator(false),
});

// --- Esquema Completo ---
export const fullRegistrationSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
}).superRefine((data, ctx) => {
  if (data.birthDate) {
    const age = calculateAge(data.birthDate);
    if (age < 18) {
      if (!data.tutorINE || data.tutorINE.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Como eres menor de edad, el INE de tu tutor es requerido.",
          path: ["tutorINE"],
        });
      }
    }
  }
});

// --- Tipos TypeScript ---
export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;
