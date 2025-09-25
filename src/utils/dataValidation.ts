// utils/dataValidation.ts - v6.0 MUSCLEUP ESPECÍFICO CON ESQUEMA BD COMPLETO
import { useState, useCallback } from 'react';

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
    },
    userid: {
      required: true,
      message: 'Usuario es requerido'
    },
    plan_id: {
      required: true,
      message: 'Plan de membresía es requerido'
    },
    payment_type: {
      required: true,
      message: 'Tipo de pago es requerido'
    }
  },
  product: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Nombre del producto inválido'
    },
    category: {
      required: true,
      message: 'Categoría es requerida'
    },
    cost_price: {
      required: true,
      min: 0,
      max: 999999,
      message: 'Precio de costo inválido'
    },
    sale_price: {
      required: true,
      min: 0,
      max: 999999,
      message: 'Precio de venta inválido'
    },
    current_stock: {
      required: false,
      min: 0,
      max: 999999,
      message: 'Stock inválido'
    }
  },
  supplier: {
    company_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Nombre de empresa inválido'
    },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email inválido'
    },
    phone: {
      required: false,
      pattern: /^[0-9]{10}$/,
      message: 'Teléfono debe ser de 10 dígitos'
    }
  },
  expense: {
    expense_type: {
      required: true,
      message: 'Tipo de gasto es requerido'
    },
    description: {
      required: true,
      minLength: 3,
      maxLength: 255,
      message: 'Descripción inválida'
    },
    amount: {
      required: true,
      min: 0.01,
      max: 999999,
      message: 'Monto inválido'
    },
    expense_date: {
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

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: string) => string | null;
}

export type ValidationRuleSet = Record<string, ValidationRule>;
export type EntityType = keyof typeof VALIDATION_RULES;

// ✅ FUNCIÓN GENÉRICA DE VALIDACIÓN
export const validateEntityData = (
  data: Record<string, any>,
  entityType: EntityType
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES[entityType] as ValidationRuleSet;

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
    if (rule.minLength && strValue.length < rule.minLength) {
      errors.push({ 
        field, 
        message: `${field} debe tener al menos ${rule.minLength} caracteres` 
      });
    }

    if (rule.maxLength && strValue.length > rule.maxLength) {
      errors.push({ 
        field, 
        message: `${field} no puede exceder ${rule.maxLength} caracteres` 
      });
    }

    // Numeric validations
    if (rule.min !== undefined || rule.max !== undefined) {
      const numValue = parseFloat(strValue);
      if (isNaN(numValue)) {
        errors.push({ field, message: 'Debe ser un número válido' });
        continue;
      }

      if (rule.min !== undefined && numValue < rule.min) {
        errors.push({ field, message: `Valor mínimo: ${rule.min}` });
      }

      if (rule.max !== undefined && numValue > rule.max) {
        errors.push({ field, message: `Valor máximo: ${rule.max}` });
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push({ field, message: rule.message || 'Formato inválido' });
    }

    // Custom validator
    if (rule.validator) {
      const error = rule.validator(strValue);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }

  return errors;
};

// ✅ FUNCIONES ESPECÍFICAS PARA BACKWARD COMPATIBILITY
export const validateUserData = (data: Record<string, any>): ValidationError[] => {
  return validateEntityData(data, 'user');
};

export const validateMembershipData = (data: Record<string, any>): ValidationError[] => {
  return validateEntityData(data, 'membership');
};

export const validateProductData = (data: Record<string, any>): ValidationError[] => {
  return validateEntityData(data, 'product');
};

export const validateSupplierData = (data: Record<string, any>): ValidationError[] => {
  return validateEntityData(data, 'supplier');
};

export const validateExpenseData = (data: Record<string, any>): ValidationError[] => {
  return validateEntityData(data, 'expense');
};

// ✅ HOOK DE VALIDACIÓN REACTIVA CON TYPE SAFETY
export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateField = useCallback((
    field: string, 
    value: any, 
    entityType: EntityType
  ) => {
    const rules = VALIDATION_RULES[entityType] as ValidationRuleSet;
    const rule = rules[field];
    
    if (!rule) return;

    // Remove existing errors for this field
    const fieldErrors = errors.filter(e => e.field !== field);
    
    // Validate single field
    const singleFieldData = { [field]: value };
    const newErrors = validateEntityData(singleFieldData, entityType);
    
    // Update errors state
    setErrors([...fieldErrors, ...newErrors]);
  }, [errors]);

  const validateAll = useCallback((
    data: Record<string, any>,
    entityType: EntityType
  ) => {
    const newErrors = validateEntityData(data, entityType);
    setErrors(newErrors);
    return newErrors.length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const hasErrors = errors.length > 0;
  
  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  const hasFieldError = useCallback((field: string) => {
    return errors.some(e => e.field === field);
  }, [errors]);

  return {
    errors,
    hasErrors,
    validateField,
    validateAll,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
    // Funciones de validación específicas
    validateUserData,
    validateMembershipData,
    validateProductData,
    validateSupplierData,
    validateExpenseData
  };
};

// ✅ VALIDACIONES ESPECÍFICAS PARA CAMPOS ESPECIALES MUSCLEUP
export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phonePattern = /^[0-9]{10}$/;
  return phonePattern.test(phone);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};

export const validatePositiveNumber = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

// ✅ MENSAJES DE ERROR PERSONALIZADOS MUSCLEUP
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Ingresa un email válido',
  INVALID_PHONE: 'Ingresa un teléfono de 10 dígitos',
  INVALID_DATE: 'Ingresa una fecha válida',
  MIN_LENGTH: (min: number) => `Mínimo ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Máximo ${max} caracteres`,
  MIN_VALUE: (min: number) => `Valor mínimo: ${min}`,
  MAX_VALUE: (max: number) => `Valor máximo: ${max}`,
  POSITIVE_NUMBER: 'Debe ser un número positivo',
  INVALID_FORMAT: 'Formato inválido'
} as const;