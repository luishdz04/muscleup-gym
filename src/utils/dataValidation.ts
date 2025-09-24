export const VALIDATION_RULES = {
  user: {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      message: 'Solo letras y espacios'
    },
    lastName: {
      required: false,
      maxLength: 50,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
      message: 'Solo letras y espacios'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email inválido'
    },
    whatsapp: {
      required: false,
      pattern: /^[0-9]{10}$/,
      message: 'Debe ser un número de 10 dígitos'
    },
    birthDate: {
      required: false,
      validator: (value: string) => {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age >= 0 && age <= 120 ? null : 'Edad inválida';
      }
    }
  },
  membership: {
    amount_paid: {
      required: true,
      min: 0,
      max: 999999,
      message: 'Monto inválido'
    },
    start_date: {
      required: true,
      validator: (value: string) => {
        if (!value) return 'Fecha requerida';
        const date = new Date(value);
        return !isNaN(date.getTime()) ? null : 'Fecha inválida';
      }
    }
  }
} as const;

export interface ValidationError {
  field: string;
  message: string;
}

export const validateUserData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.user;

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push({ field, message: `${field} es requerido` });
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!value) continue;

    const strValue = value.toString().trim();

    // Length validations
    if ('minLength' in rule && strValue.length < rule.minLength) {
      errors.push({ 
        field, 
        message: `${field} debe tener al menos ${rule.minLength} caracteres` 
      });
    }

    if ('maxLength' in rule && strValue.length > rule.maxLength) {
      errors.push({ 
        field, 
        message: `${field} no puede exceder ${rule.maxLength} caracteres` 
      });
    }

    // Pattern validation
    if ('pattern' in rule && !rule.pattern.test(strValue)) {
      errors.push({ field, message: rule.message });
    }

    // Custom validator
    if ('validator' in rule) {
      const error = rule.validator(strValue);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }

  return errors;
};

export const validateMembershipData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.membership;

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push({ field, message: `${field} es requerido` });
      continue;
    }

    if (!value) continue;

    // Numeric validations
    if ('min' in rule || 'max' in rule) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push({ field, message: 'Debe ser un número válido' });
        continue;
      }

      if ('min' in rule && numValue < rule.min) {
        errors.push({ field, message: `Valor mínimo: ${rule.min}` });
      }

      if ('max' in rule && numValue > rule.max) {
        errors.push({ field, message: `Valor máximo: ${rule.max}` });
      }
    }

    // Custom validator
    if ('validator' in rule) {
      const error = rule.validator(value);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }

  return errors;
};

// ✅ HOOK DE VALIDACIÓN REACTIVA
export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateField = useCallback((field: string, value: any, rules: any) => {
    // Lógica de validación individual
    const fieldErrors = errors.filter(e => e.field !== field);
    
    // Aplicar validaciones específicas del campo
    // ... lógica de validación
    
    setErrors(fieldErrors);
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;
  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  return {
    errors,
    hasErrors,
    validateField,
    clearErrors,
    getFieldError,
    validateUserData,
    validateMembershipData
  };
};