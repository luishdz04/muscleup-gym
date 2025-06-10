import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs para usar español
dayjs.locale('es');

/**
 * Formatea una fecha en un formato legible
 * @param dateString Fecha en formato ISO o cualquier formato válido
 * @param format Formato deseado (por defecto: DD/MM/YYYY)
 * @returns Fecha formateada
 */
export const formatDate = (dateString: string, format: string = 'DD/MM/YYYY') => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format(format);
};

/**
 * Formatea un valor monetario como moneda
 * @param value Valor a formatear
 * @param locale Configuración regional (por defecto: es-MX)
 * @param currency Moneda (por defecto: MXN)
 * @returns Valor formateado como moneda
 */
export const formatCurrency = (value: number, locale: string = 'es-MX', currency: string = 'MXN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param birthDate Fecha de nacimiento
 * @returns Edad en años
 */
export const calculateAge = (birthDate: string) => {
  if (!birthDate) return 'N/A';
  return dayjs().diff(dayjs(birthDate), 'year');
};

/**
 * Valida si una cadena es un correo electrónico válido
 * @param email Correo electrónico a validar
 * @returns true si es válido, false en caso contrario
 */
export const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valida si una cadena es un número de teléfono válido (10 dígitos)
 * @param phone Número de teléfono a validar
 * @returns true si es válido, false en caso contrario
 */
export const isValidPhone = (phone: string) => {
  return /^\d{10}$/.test(phone);
};