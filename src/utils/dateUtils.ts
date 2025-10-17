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

export interface MexicoDateTimeInfo {
  date: string;
  time: string;
  isoString: string;
  offsetMinutes: number;
  dateObject: Date;
}

const ensureDate = (input: Date | string): Date => {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Fecha inválida recibida: ${input}`);
  }
  return parsed;
};

export const getMexicoDateTimeInfo = (
  input: Date | string = new Date()
): MexicoDateTimeInfo => {
  const baseDate = ensureDate(input);
  const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = dateTimeFormatter.formatToParts(baseDate);
  const partValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '00';

  const year = partValue('year');
  const month = partValue('month');
  const day = partValue('day');
  const hours = partValue('hour');
  const minutes = partValue('minute');
  const seconds = partValue('second');

  let offset = '+00:00';
  let offsetMinutes = 0;

  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEXICO_TIMEZONE,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const offsetParts = offsetFormatter.formatToParts(baseDate);
  const timeZoneName = offsetParts.find(part => part.type === 'timeZoneName')?.value ?? 'UTC';
  const offsetMatch = timeZoneName.match(/([+-]\d{1,2})(?::?(\d{2}))?/);

  if (offsetMatch) {
    const hoursRaw = offsetMatch[1];
    const minutesRaw = offsetMatch[2] ?? '00';
    const sign = hoursRaw.startsWith('-') ? '-' : '+';
    const normalizedHours = hoursRaw.replace(/[+-]/, '').padStart(2, '0');
    const normalizedMinutes = minutesRaw.padStart(2, '0');

    offset = `${sign}${normalizedHours}:${normalizedMinutes}`;
    const totalMinutes = parseInt(normalizedHours, 10) * 60 + parseInt(normalizedMinutes, 10);
    offsetMinutes = sign === '-' ? -totalMinutes : totalMinutes;
  } else {
    const mexicoDate = new Date(
      baseDate.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE })
    );
    offsetMinutes = Math.round((mexicoDate.getTime() - baseDate.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
    const offsetRemainder = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
    offset = `${sign}${offsetHours}:${offsetRemainder}`;
  }

  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}:${seconds}`;

  return {
    date,
    time,
    isoString: `${date}T${time}${offset}`,
    offsetMinutes,
    dateObject: new Date(baseDate.getTime())
  };
};

export const toMexicoDate = (input: Date | string = new Date()): Date => {
  return getMexicoDateTimeInfo(input).dateObject;
};

export const getMexicoTimestampWithOffset = (
  input: Date | string = new Date()
): string => {
  return getMexicoDateTimeInfo(input).isoString;
};

export const getMexicoDateString = (input: Date | string = new Date()): string => {
  return getMexicoDateTimeInfo(input).date;
};

export const getMexicoTimeString = (input: Date | string = new Date()): string => {
  return getMexicoDateTimeInfo(input).time;
};

export interface MexicoDateRange {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
}

export const getMexicoDateRange = (
  input: Date | string = new Date()
): MexicoDateRange => {
  // Si input es string, debe estar en formato YYYY-MM-DD (fecha de México)
  const dateStr = typeof input === 'string' ? input : getMexicoDateString(input);
  const [year, month, day] = dateStr.split('-').map(Number);

  // México está en UTC-6 (o UTC-5 en horario de verano, pero usualmente UTC-6)
  // Para obtener el día completo en México, necesitamos:
  // Inicio: YYYY-MM-DD 00:00:00 México = YYYY-MM-DD 06:00:00 UTC
  // Fin: YYYY-MM-DD 23:59:59 México = YYYY-MM-DD+1 05:59:59 UTC
  
  const MEXICO_OFFSET_HOURS = 6; // UTC-6
  
  // Crear inicio del día en UTC (medianoche de México = 6 AM UTC del mismo día)
  const startUtc = Date.UTC(year, month - 1, day, MEXICO_OFFSET_HOURS, 0, 0, 0);
  
  // Crear fin del día en UTC (23:59:59 de México = 5:59:59 AM UTC del día siguiente)
  const endUtc = Date.UTC(year, month - 1, day + 1, MEXICO_OFFSET_HOURS - 1, 59, 59, 999);

  const start = new Date(startUtc);
  const end = new Date(endUtc);

  return {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString()
  };
};

export const getMexicoCurrentTimeString = (): string => {
  return getMexicoTimeString(new Date());
};

export const formatMexicoDateRangeDisplay = (
  input: Date | string = new Date()
): string => {
  try {
    const range = getMexicoDateRange(input);
    const dateFormatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: MEXICO_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: MEXICO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const startDate = dateFormatter.format(range.start);
    const endDate = dateFormatter.format(range.end);
    const startTime = timeFormatter.format(range.start);
    const endTime = timeFormatter.format(range.end);

    return `${startDate}, ${startTime} - ${endDate}, ${endTime}`;
  } catch (error) {
    console.error('Error formateando rango México:', error);
    const { date } = getMexicoDateTimeInfo(input);
    return `${date} 00:00 - ${date} 23:59`;
  }
};

export const formatMexicoTime = (
  timestamp: string | Date,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) {
    return 'Hora inválida';
  }

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    ...options
  }).format(date);
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
 * Obtiene la fecha en formato YYYY-MM-DD correspondiente a `daysAgo`
 * días en el pasado respecto a la fecha actual en México.
 */
export const getMexicoDateDaysAgo = (daysAgo: number): string => {
  if (!Number.isFinite(daysAgo)) {
    throw new Error(`Número de días inválido: ${daysAgo}`);
  }

  const baseDate = getTodayInMexico();
  return addDaysToDate(baseDate, -Math.trunc(daysAgo));
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
 * Devuelve el identificador de mes (YYYY-MM) restando `monthsAgo`
 * meses a la fecha actual en México.
 */
export const getMexicoMonthKeyMonthsAgo = (monthsAgo: number): string => {
  if (!Number.isFinite(monthsAgo)) {
    throw new Error(`Número de meses inválido: ${monthsAgo}`);
  }

  const now = new Date();
  const mexicoNow = new Date(
    now.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE })
  );

  mexicoNow.setMonth(mexicoNow.getMonth() - Math.trunc(monthsAgo));

  const year = mexicoNow.getFullYear();
  const month = String(mexicoNow.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
};

/**
 * Formatea un mes en formato YYYY-MM a un nombre largo en español.
 * ✅ CORREGIDO - Usa directamente el mes sin crear Date para evitar desfases de timezone
 */
export const formatMexicoMonthName = (monthString: string): string => {
  try {
    const [year, month] = monthString.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw new Error('Formato inválido');
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${monthNames[month - 1]} de ${year}`;
  } catch (error) {
    return monthString;
  }
};

/**
 * Formatea una fecha/horario incluyendo hora local de México con formato corto.
 */
export const formatMexicoDateTime = (input: Date | string): string => {
  try {
    const date = ensureDate(input);

    return new Intl.DateTimeFormat('es-MX', {
      timeZone: MEXICO_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    return typeof input === 'string' ? input : new Date(input).toISOString();
  }
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
 * Si la membresía actual aún está vigente, la renovación inicia en la misma fecha de vencimiento.
 * Si ya expiró, la renovación inicia hoy.
 */
export const calculateRenewalStartDate = (currentEndDate: string): string => {
  const today = getTodayInMexico();
  if (today < currentEndDate) {
    // La membresía actual aún está vigente, la nueva inicia en la fecha de vencimiento
    return currentEndDate;
  } else {
    // La membresía ya expiró, la nueva inicia hoy
    return today;
  }
};

/**
 * Calcula fecha final según el tipo de membresía.
 * LÓGICA DE NEGOCIO: Para mantener el mismo día del mes en renovaciones,
 * usa meses calendario en lugar de días fijos.
 * Ejemplo: Si vence el 5 de noviembre, al renovar vencerá el 5 de diciembre.
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
      // Usa addMonthsToDate para mantener el mismo día del mes
      return addMonthsToDate(startDate, 1);
    case 'bimonthly':
      // Suma 2 meses calendario
      return addMonthsToDate(startDate, 2);
    case 'quarterly':
      // Suma 3 meses calendario
      return addMonthsToDate(startDate, 3);
    case 'semester':
      // Suma 6 meses calendario
      return addMonthsToDate(startDate, 6);
    case 'annual':
      // Suma 1 año calendario
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


/// ✅ FUNCIÓN CORREGIDA - USA MISMA LÓGICA QUE formatTimestampForDisplay
export const formatMovementDate = (timestamp: string): string => {
  // ✅ USAR MISMA FUNCIÓN AUXILIAR QUE formatTimestampForDisplay
  const utcDate = createUtcDate(timestamp);
  if (!utcDate) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(utcDate);
};

export const getInventoryPeriod = (days: number = 30): { start: string; end: string } => {
  const end = new Date();
  const start = new Date(end.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

export const isRecentMovement = (timestamp: string, hoursThreshold: number = 24): boolean => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= hoursThreshold;
  } catch {
    return false;
  }
};

// --- COMPATIBILIDAD CON UTILIDADES LEGADAS ---

export const getMexicoToday = (): string => getTodayInMexico();

export const createTimestampForDB = (): string => getCurrentTimestamp();

export const formatDateForDB = (dateInput: string | Date): string => {
  try {
    if (dateInput instanceof Date) {
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }

    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) {
      return getTodayInMexico();
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return getTodayInMexico();
  }
};

export const isValidDateString = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    !isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const getDaysBetweenMexicoDates = (startDate: string, endDate: string): number => {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const addDaysToMexicoDate = addDaysToDate;

export const addPeriodToMexicoDate = (
  dateString: string,
  paymentType: string,
  duration: number
): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  switch (paymentType.toLowerCase()) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 15);
      break;
    case 'monthly': {
      const originalDay = date.getDate();
      date.setMonth(date.getMonth() + 1);
      if (date.getDate() !== originalDay) {
        date.setDate(0);
      }
      break;
    }
    case 'bimonthly': {
      const originalDay = date.getDate();
      date.setMonth(date.getMonth() + 2);
      if (date.getDate() !== originalDay) {
        date.setDate(0);
      }
      break;
    }
    case 'quarterly': {
      const originalDay = date.getDate();
      date.setMonth(date.getMonth() + 3);
      if (date.getDate() !== originalDay) {
        date.setDate(0);
      }
      break;
    }
    case 'semester': {
      const originalDay = date.getDate();
      date.setMonth(date.getMonth() + 6);
      if (date.getDate() !== originalDay) {
        date.setDate(0);
      }
      break;
    }
    case 'annual': {
      const originalDay = date.getDate();
      date.setFullYear(date.getFullYear() + 1);
      if (date.getDate() !== originalDay) {
        date.setDate(0);
      }
      break;
    }
    default:
      date.setDate(date.getDate() + duration);
      break;
  }

  const resultYear = date.getFullYear();
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resultDay = String(date.getDate()).padStart(2, '0');
  return `${resultYear}-${resultMonth}-${resultDay}`;
};

export const timestampToMexicoDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_TIMEZONE
    }).format(date);
  } catch {
    return '';
  }
};

/**
 * Obtiene el inicio de la semana (lunes) en México para una fecha dada.
 */
export const getStartOfWeek = (date: Date = new Date()): string => {
  const mexicoDate = new Date(date.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  const day = mexicoDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Ajustar para que lunes sea el inicio
  mexicoDate.setDate(mexicoDate.getDate() + diff);

  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

/**
 * Obtiene el fin de la semana (domingo) en México para una fecha dada.
 */
export const getEndOfWeek = (date: Date = new Date()): string => {
  const startOfWeek = getStartOfWeek(date);
  return addDaysToDate(startOfWeek, 6);
};

/**
 * Obtiene el primer día del mes en México para una fecha dada.
 */
export const getStartOfMonth = (date: Date = new Date()): string => {
  const mexicoDate = new Date(date.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Obtiene el último día del mes en México para una fecha dada.
 */
export const getEndOfMonth = (date: Date = new Date()): string => {
  const mexicoDate = new Date(date.toLocaleString('en-US', { timeZone: MEXICO_TIMEZONE }));
  const year = mexicoDate.getFullYear();
  const month = mexicoDate.getMonth();

  // Crear fecha del primer día del mes siguiente y restar un día
  const nextMonth = new Date(year, month + 1, 1);
  nextMonth.setDate(nextMonth.getDate() - 1);

  const endYear = nextMonth.getFullYear();
  const endMonth = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const endDay = String(nextMonth.getDate()).padStart(2, '0');
  return `${endYear}-${endMonth}-${endDay}`;
};