/**
 * @file Esquemas de validación migrados a Zod 4.1.8 con validaciones en tiempo real
 * @author Luis Hernandez (luishdz04) + Copilot Migration
 * @version 4.0.0 - Zod 4 Migration
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

// --- Funciones Utilitarias Mejoradas ---

const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birthDate = dayjs.tz(birthDateString, MEXICO_TZ);
  const now = dayjs().tz(MEXICO_TZ);
  return now.diff(birthDate, 'year');
};

const isBrowser = typeof window !== 'undefined';

// --- Validadores Reutilizables Mejorados ---

/**
 * Validador de nombres mejorado con mensajes más específicos
 */
const nameValidator = (fieldName: string, minLength: number = 2) => 
  z.string({
    required_error: `${fieldName} es requerido.`,
    invalid_type_error: `${fieldName} debe ser texto.`
  })
  .min(minLength, `${fieldName} debe tener al menos ${minLength} letras.`)
  .max(50, `${fieldName} es demasiado largo (máximo 50 caracteres).`)
  .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, `${fieldName} solo puede contener letras y espacios.`)
  .trim();

/**
 * Validador de teléfono mejorado
 */
const phoneValidator = (fieldName: string) =>
  z.string({
    required_error: `${fieldName} es requerido.`
  })
  .length(10, `${fieldName} debe tener exactamente 10 dígitos.`)
  .regex(/^[0-9]{10}$/, `${fieldName} solo puede contener números.`);

/**
 * Validador de contraseña con feedback progresivo
 */
const passwordValidator = z.string({
    required_error: "La contraseña es requerida."
  })
  .min(8, "Mínimo 8 caracteres")
  .refine(val => /[A-Z]/.test(val), {
    message: "Falta al menos una mayúscula (A-Z)"
  })
  .refine(val => /[a-z]/.test(val), {
    message: "Falta al menos una minúscula (a-z)"
  })
  .refine(val => /[0-9]/.test(val), {
    message: "Falta al menos un número (0-9)"
  })
  .refine(val => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
    message: "Recomendado: agrega un carácter especial (!@#$%^&*)"
  });

/**
 * 🆕 NUEVO: Validador de archivos mejorado con Zod 4
 */
const createFileValidator = (required: boolean = false) => {
  const baseSchema = z.custom<FileList>()
    .refine(
      (files) => {
        if (!required && (!files || files.length === 0)) return true;
        return isBrowser ? files instanceof FileList && files.length > 0 : true;
      },
      required ? "Se requiere una imagen." : "Archivo inválido."
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return !required;
        return files[0]?.size <= MAX_FILE_SIZE_BYTES;
      },
      "El archivo es demasiado grande (máximo 5MB)."
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return !required;
        return files[0]?.type.startsWith("image/");
      },
      "El archivo debe ser una imagen (JPG, PNG, GIF, etc.)."
    );

  return required ? baseSchema : baseSchema.optional();
};

// --- Esquemas por Paso Mejorados ---

/**
 * PASO 1: Información Personal - Con validaciones progresivas
 */
export const step1Schema = z.object({
  profilePhoto: createFileValidator(true),
  firstName: nameValidator("Nombre"),
  lastName: nameValidator("Apellido"),
  email: z.string({
      required_error: "El correo electrónico es requerido."
    })
    .email("Formato de correo inválido (ejemplo: usuario@dominio.com)")
    .toLowerCase()
    .refine(val => !val.includes('+'), {
      message: "Evita usar '+' en el correo electrónico"
    }),
  password: passwordValidator,
  confirmPassword: z.string({
    required_error: "Confirma tu contraseña."
  }),
  whatsapp: phoneValidator("WhatsApp"),
  birthDate: z.string({
      required_error: "La fecha de nacimiento es requerida."
    })
    .min(1, "Selecciona tu fecha de nacimiento.")
    .refine(dateStr => dayjs(dateStr).isValid(), {
      message: "Fecha inválida. Usa el formato correcto."
    })
    .refine(dateStr => {
      const date = dayjs(dateStr);
      const minDate = dayjs().subtract(100, 'years');
      const maxDate = dayjs().subtract(10, 'years');
      return date.isAfter(minDate) && date.isBefore(maxDate);
    }, {
      message: "La edad debe estar entre 10 y 100 años."
    }),
  
  // Dirección
  street: z.string()
    .min(3, "La calle debe tener al menos 3 caracteres.")
    .max(100, "Calle demasiado larga.")
    .trim(),
  number: z.string()
    .min(1, "El número es requerido.")
    .max(10, "Número demasiado largo.")
    .trim(),
  neighborhood: z.string()
    .min(3, "La colonia debe tener al menos 3 caracteres.")
    .max(50, "Colonia demasiado larga.")
    .trim(),
  state: z.string()
    .min(3, "El estado debe tener al menos 3 caracteres.")
    .max(50, "Estado demasiado largo.")
    .trim(),
  city: z.string()
    .min(3, "La ciudad debe tener al menos 3 caracteres.")
    .max(50, "Ciudad demasiado larga.")
    .trim(),
  postalCode: z.string()
    .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 números.")
    .length(5, "Código postal incompleto."),
  country: z.string().default('México'),
  
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'], {
    required_error: "Selecciona tu género.",
    invalid_type_error: "Opción de género inválida."
  }),
  maritalStatus: z.enum(['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre', 'Otro'], {
    required_error: "Selecciona tu estado civil.",
    invalid_type_error: "Opción de estado civil inválida."
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden. Verifícalas.",
  path: ['confirmPassword'],
});

/**
 * PASO 2: Contacto de Emergencia - Mejorado
 */
export const step2Schema = z.object({
  emergencyName: nameValidator("Nombre del contacto de emergencia", 3),
  emergencyPhone: phoneValidator("Teléfono de emergencia"),
  medicalCondition: z.string()
    .max(500, "La descripción es demasiado larga (máximo 500 caracteres).")
    .optional()
    .or(z.literal('')),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sé'], {
    required_error: "Selecciona tu tipo de sangre.",
    invalid_type_error: "Tipo de sangre inválido."
  }),
});

/**
 * PASO 3: Información de Membresía - Mejorado
 */
export const step3Schema = z.object({
  referredBy: z.enum([
    'Redes sociales', 
    'Recomendación', 
    'Google', 
    'Volantes', 
    'Pasé por el lugar', 
    'Otro'
  ], {
    required_error: "Selecciona cómo nos conociste.",
    invalid_type_error: "Opción inválida."
  }),
  mainMotivation: z.enum([
    'Bajar de peso', 
    'Aumentar masa muscular', 
    'Mejorar salud', 
    'Rehabilitación', 
    'Recreación', 
    'Competencia', 
    'Otro'
  ], {
    required_error: "Selecciona tu motivación principal.",
    invalid_type_error: "Motivación inválida."
  }),
  receivePlans: z.boolean().default(false),
  trainingLevel: z.enum(['Principiante', 'Intermedio', 'Avanzado', 'Atleta'], {
    required_error: "Selecciona tu nivel de entrenamiento.",
    invalid_type_error: "Nivel inválido."
  }),
});

/**
 * 🆕 PASO 4: Términos y Condiciones
 */
export const step4Schema = z.object({
  acceptedRules: z.boolean()
    .refine(val => val === true, {
      message: "Debes aceptar el reglamento para continuar."
    }),
  tutorINE: createFileValidator(false), // Opcional por defecto
});

/**
 * Schema completo con validaciones condicionales mejoradas
 */
export const fullRegistrationSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
}).superRefine((data, ctx) => {
  // Validación condicional mejorada para menores de edad
  if (data.birthDate) {
    const age = calculateAge(data.birthDate);
    
    if (age < 18) {
      if (!data.tutorINE || data.tutorINE.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Como eres menor de edad, necesitamos el INE de tu tutor legal.",
          path: ["tutorINE"],
        });
      }
    }
    
    // Validación adicional: advertencia para menores de 16
    if (age < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los menores de 16 años requieren supervisión adicional en el gimnasio.",
        path: ["birthDate"],
      });
    }
  }
  
  // Validación de email único (si tienes una función para verificar)
  // Puedes agregar aquí validaciones asíncronas
});

// --- Esquemas para validación parcial (tiempo real) ---

/**
 * 🆕 Esquemas parciales para validaciones progresivas
 */
export const partialStep1Schema = step1Schema.partial();
export const partialStep2Schema = step2Schema.partial();
export const partialStep3Schema = step3Schema.partial();
export const partialStep4Schema = step4Schema.partial();

// --- Tipos TypeScript ---

export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;

// --- 🆕 Función para generar JSON Schema (nueva en Zod 4) ---

/**
 * Genera JSON Schema para documentación automática
 */
export const generateJSONSchema = () => {
  return z.toJSONSchema(fullRegistrationSchema, {
    target: "draft-2020-12",
    unrepresentable: "any", // Para manejar FileList
    override: (ctx) => {
      // Personalizar el schema para archivos
      if (ctx.jsonSchema.type === "string" && ctx.jsonSchema.format === "binary") {
        ctx.jsonSchema.description = "Archivo de imagen (JPG, PNG, GIF, etc.)";
        ctx.jsonSchema.maxLength = MAX_FILE_SIZE_BYTES;
      }
      return ctx.jsonSchema;
    }
  });
};

// --- Utilidades para validación en tiempo real ---

/**
 * 🆕 Función para validar un campo específico
 */
export const validateField = (fieldName: keyof RegistrationFormData, value: any, step: number) => {
  const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];
  const schema = stepSchemas[step - 1];
  
  try {
    // Validar solo el campo específico
    const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape];
    if (fieldSchema) {
      fieldSchema.parse(value);
      return { success: true, error: null };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || 'Error de validación' 
      };
    }
  }
  
  return { success: true, error: null };
};

/**
 * 🆕 Hook personalizado para validación en tiempo real
 */
export const useRealtimeValidation = () => {
  const validateFieldRealtime = (fieldName: keyof RegistrationFormData, value: any, step: number) => {
    return validateField(fieldName, value, step);
  };
  
  return { validateFieldRealtime };
};
