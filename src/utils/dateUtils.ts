export const MEXICO_TIMEZONE = 'America/Mexico_City';

/**
 * Obtiene la fecha actual en México en formato YYYY-MM-DD.
 */
export const getTodayInMexico = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TIMEZONE,
  }).format(now);
};

/**
 * Formatea una fecha DATE de la BD para mostrar al usuario.
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'Sin fecha';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha en formato largo para display.
 */
export const formatDateLong = (dateString: string): string => {
  if (!dateString) return 'Sin fecha';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Suma días a una fecha.
 */
export const addDaysToDate = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newDay = String(date.getUTCDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Suma meses a una fecha, maneja correctamente fin de mes.
 */
export const addMonthsToDate = (dateString: string, months: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const originalDay = day;
  date.setUTCMonth(date.getUTCMonth() + months);
  if (date.getUTCDate() !== originalDay) {
    date.setUTCDate(0);
  }
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newDay = String(date.getUTCDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Suma años a una fecha, maneja años bisiestos.
 */
export const addYearsToDate = (dateString: string, years: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(date.getUTCFullYear() + years);
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newDay = String(date.getUTCDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Calcula fecha de inicio para renovaciones según lógica de gimnasio.
 */
export const calculateRenewalStartDate = (currentEndDate: string): string => {
  const today = getTodayInMexico();
  if (today < currentEndDate) {
    return currentEndDate;
  } else {
    return today;
  }
};

/**
 * Calcula fecha final según el tipo de membresía.
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
 */
export const compareDates = (date1: string, date2: string): number => {
  if (date1 === date2) return 0;
  return date1 < date2 ? -1 : 1;
};

/**
 * Verifica si una fecha está en el futuro.
 */
export const isFutureDate = (dateString: string): boolean => {
  const today = getTodayInMexico();
  return dateString > today;
};

/**
 * Verifica si una fecha ya venció.
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
  const date1 = new Date(Date.UTC(year1, month1 - 1, day1));
  const date2 = new Date(Date.UTC(year2, month2 - 1, day2));
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- SECCIÓN DE FORMATEO DE TIMESTAMPS (SOLUCIÓN DEFINITIVA) ---

/**
 * Función auxiliar para crear una fecha UTC de forma segura a partir de
 * los diferentes formatos de timestamp de la base de datos.
 */
function createUtcDate(timestamp: string | null): Date | null {
  // 1. Maneja casos nulos, vacíos o fechas inválidas de la BD
  if (!timestamp || timestamp.trim() === '' || timestamp.startsWith('0000-00-00')) {
    return null;
  }

  let dateString = timestamp.trim();

  // 2. Detecta si el timestamp ya tiene info de zona horaria (Z, + o - después de la fecha)
  // El `indexOf('-', 10)` se asegura de no confundir los guiones de la fecha.
  const hasTimezone = dateString.includes('Z') || dateString.indexOf('+') > 10 || dateString.indexOf('-', 10) > 10;
  
  // 3. Si NO tiene zona horaria (es "ingenuo"), lo convertimos a un formato ISO que JS interpreta como UTC.
  if (!hasTimezone) {
    dateString = dateString.replace(' ', 'T') + 'Z';
  }
  
  const date = new Date(dateString);

  // 4. Verificación final para cualquier formato que JS no pueda interpretar
  if (isNaN(date.getTime())) {
    console.error('Timestamp con formato inválido procesado:', timestamp);
    return null;
  }
  
  return date;
}

/**
 * Formatea un timestamp UTC completo para mostrar en zona horaria México.
 */
export const formatTimestampForDisplay = (timestamp: string | null): string => {
  const utcDate = createUtcDate(timestamp);
  if (!utcDate) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(utcDate);
};

/**
 * Formatea un timestamp UTC solo con la fecha en zona horaria México.
 */
export const formatTimestampDateOnly = (timestamp: string | null): string => {
  const utcDate = createUtcDate(timestamp);
  if (!utcDate) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(utcDate);
};

/**
 * Formatea un timestamp UTC en formato corto para tablas.
 */
export const formatTimestampShort = (timestamp: string | null): string => {
  const utcDate = createUtcDate(timestamp);
  if (!utcDate) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(utcDate);
};

// --- SECCIÓN DE TIMESTAMPS UTC PARA BASE DE DATOS ---

/**
 * Obtiene el timestamp actual en UTC para insertar en la base de datos.
 * Siempre retorna formato ISO 8601 en UTC.
 * 
 * @returns {string} Timestamp UTC en formato "2025-09-23T15:30:45.123Z"
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString(); // Siempre UTC para BD
};


// utils/dateUtils.ts - FUNCIÓN ADICIONAL PARA EXTRAER FECHA DE TIMESTAMP UTC

/**
 * Extrae solo la fecha (YYYY-MM-DD) de un timestamp UTC convertida a timezone México.
 * CRÍTICO: Para comparaciones de "hoy" precisas.
 */
export const extractDateInMexico = (timestamp: string): string => {
  try {
    const utcDate = new Date(timestamp);
    if (isNaN(utcDate.getTime())) {
      console.error('Timestamp inválido para extractDateInMexico:', timestamp);
      return '';
    }

    // Convertir UTC a México y extraer solo fecha
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_TIMEZONE,
    }).format(utcDate);
    
  } catch (error) {
    console.error('Error en extractDateInMexico:', error);
    return '';
  }
};