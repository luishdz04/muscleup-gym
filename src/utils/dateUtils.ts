// utils/dateUtils.ts

export const MEXICO_TIMEZONE = 'America/Mexico_City';

/**
 * Obtiene la fecha actual en México en formato YYYY-MM-DD.
 * Usa la zona horaria de México para determinar el "día actual".
 * ESTA FUNCIÓN ESTÁ BIEN Y NO NECESITA CAMBIOS.
 */
export const getTodayInMexico = (): string => {
  const now = new Date();
  const mexDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TIMEZONE,
  }).format(now);
  
  return mexDate; // Formato YYYY-MM-DD
};

/**
 * Formatea una fecha DATE de la BD para mostrar al usuario.
 * Input: "2025-10-12" (string de la BD)
 * Output: "12 oct 2025" (formato legible)
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'Sin fecha';
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    // Se crea la fecha en UTC para evitar desfases por zona horaria del servidor
    const date = new Date(Date.UTC(year, month - 1, day)); // <-- CORREGIDO

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC', // <-- CORREGIDO: Interpretar la fecha como UTC
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha en formato largo para display.
 * Input: "2025-10-12"
 * Output: "sábado, 12 de octubre de 2025"
 */
export const formatDateLong = (dateString: string): string => {
  if (!dateString) return 'Sin fecha';
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    // Se crea la fecha en UTC para evitar desfases
    const date = new Date(Date.UTC(year, month - 1, day)); // <-- CORREGIDO
    
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // <-- CORREGIDO: Interpretar la fecha como UTC
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Suma días a una fecha.
 * Input: "2025-10-12", 30
 * Output: "2025-11-11"
 */
export const addDaysToDate = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // <-- CORREGIDO
  
  date.setUTCDate(date.getUTCDate() + days); // <-- CORREGIDO
  
  const newYear = date.getUTCFullYear(); // <-- CORREGIDO
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0'); // <-- CORREGIDO
  const newDay = String(date.getUTCDate()).padStart(2, '0'); // <-- CORREGIDO
  
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Suma meses a una fecha, maneja correctamente fin de mes.
 * Input: "2025-01-31", 1
 * Output: "2025-02-28" (último día de febrero)
 */
export const addMonthsToDate = (dateString: string, months: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // <-- CORREGIDO
  const originalDay = day;
  
  date.setUTCMonth(date.getUTCMonth() + months); // <-- CORREGIDO
  
  if (date.getUTCDate() !== originalDay) { // <-- CORREGIDO
    date.setUTCDate(0); // Último día del mes anterior
  }
  
  const newYear = date.getUTCFullYear(); // <-- CORREGIDO
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0'); // <-- CORREGIDO
  const newDay = String(date.getUTCDate()).padStart(2, '0'); // <-- CORREGIDO
  
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Suma años a una fecha, maneja años bisiestos.
 * Input: "2024-02-29", 1
 * Output: "2025-02-28" (no es año bisiesto)
 */
export const addYearsToDate = (dateString: string, years: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // <-- CORREGIDO
  
  date.setUTCFullYear(date.getUTCFullYear() + years); // <-- CORREGIDO
  
  const newYear = date.getUTCFullYear(); // <-- CORREGIDO
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0'); // <-- CORREGIDO
  const newDay = String(date.getUTCDate()).padStart(2, '0'); // <-- CORREGIDO
  
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Calcula fecha de inicio para renovaciones según lógica de gimnasio.
 * NO REQUIERE CAMBIOS, ya que depende de las otras funciones que ya corregimos.
 */
export const calculateRenewalStartDate = (currentEndDate: string): string => {
  const today = getTodayInMexico();

  // Se usa '<' en lugar de '<=' para ser más estricto.
  // Si la fecha de hoy es anterior a la de vencimiento, la renovación empieza
  // justo cuando la otra termina.
  if (today < currentEndDate) {
    // La nueva empieza EXACTAMENTE el día que termina la anterior.
    // NO se suma un día extra.
    return currentEndDate; // <-- ESTA ES LA CORRECCIÓN CLAVE
  } else {
    // La membresía ya venció o vence hoy, la nueva empieza HOY.
    return today;
  }
};

/**
 * Calcula fecha final según el tipo de membresía.
 * NO REQUIERE CAMBIOS, ya que depende de las otras funciones que ya corregimos.
 */
export const calculateMembershipEndDate = (
  startDate: string, 
  periodType: string, 
  plan: any
): string => {
  switch (periodType) {
    case 'visit':
      return startDate;
    case 'weekly':
      return addDaysToDate(startDate, plan?.weekly_duration || 7);
    case 'biweekly':
      return addDaysToDate(startDate, plan?.biweekly_duration || 14);
    case 'monthly':
      return addMonthsToDate(startDate, 1);
    case 'bimonthly':
      return addMonthsToDate(startDate, 2);
    case 'quarterly':
      return addMonthsToDate(startDate, 3);
    case 'semester':
      return addMonthsToDate(startDate, 6);
    case 'annual':
      return addYearsToDate(startDate, 1);
    default:
      return startDate;
  }
};

/**
 * Compara dos fechas en formato YYYY-MM-DD.
 * NO REQUIERE CAMBIOS, ya que compara strings directamente.
 */
export const compareDates = (date1: string, date2: string): number => {
  if (date1 === date2) return 0;
  return date1 < date2 ? -1 : 1;
};

/**
 * Verifica si una fecha está en el futuro.
 * NO REQUIERE CAMBIOS.
 */
export const isFutureDate = (dateString: string): boolean => {
  const today = getTodayInMexico();
  return dateString > today;
};

/**
 * Verifica si una fecha ya venció.
 * NO REQUIERE CAMBIOS.
 */
export const isExpiredDate = (dateString: string): boolean => {
  const today = getTodayInMexico();
  return dateString < today;
};

/**
 * Calcula días entre dos fechas.
 */
export const daysBetween = (startDate: string, endDate: string): number => {
  const [year1, month1, day1] = startDate.split('-').map(Number);
  const [year2, month2, day2] = endDate.split('-').map(Number);
  
  const date1 = new Date(Date.UTC(year1, month1 - 1, day1)); // <-- CORREGIDO
  const date2 = new Date(Date.UTC(year2, month2 - 1, day2)); // <-- CORREGIDO
  
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};