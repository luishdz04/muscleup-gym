// Días festivos dinámicos desde la API
// Este archivo maneja la obtención y caché de días festivos configurables

export interface Holiday {
  id?: string;
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'official' | 'traditional' | 'special';
  emoji: string;
  is_active?: boolean;
}

// Cache para almacenar holidays y evitar múltiples llamadas a la API
let holidaysCache: Holiday[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene todos los días festivos activos desde la API
 * Usa caché para evitar llamadas excesivas a la API
 */
export async function getAllHolidays(): Promise<Holiday[]> {
  // Verificar si el caché es válido
  if (holidaysCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return holidaysCache;
  }

  try {
    const res = await fetch('/api/holidays', {
      cache: 'no-store'
    });

    if (res.ok) {
      const data: Holiday[] = await res.json();
      // Actualizar caché con solo holidays activos
      holidaysCache = data.filter(h => h.is_active !== false);
      cacheTimestamp = Date.now();
      return holidaysCache;
    } else {
      console.warn('⚠️ [HOLIDAYS] API returned non-ok status:', res.status);
    }
  } catch (error) {
    console.error('❌ [HOLIDAYS] Error fetching holidays from API:', error);
  }

  // Si falla, retornar caché antiguo si existe, o array vacío
  return holidaysCache || [];
}

/**
 * Invalida el caché de holidays
 * Útil después de crear/actualizar/eliminar un holiday
 */
export function invalidateHolidaysCache() {
  holidaysCache = null;
  cacheTimestamp = null;
}

/**
 * Verifica si una fecha es un día festivo
 * IMPORTANTE: Esta función ahora retorna null y debe usarse con await getAllHolidays()
 * Para uso sincrónico, usar getHolidaySync() con holidays pre-cargados
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns Holiday object si es festivo, null si no lo es
 */
export function getHoliday(date: string): Holiday | null {
  // Si hay caché disponible, usarlo (modo sincrónico para compatibilidad)
  if (holidaysCache) {
    return holidaysCache.find(h => h.date === date) || null;
  }

  // Si no hay caché, retornar null y registrar warning
  console.warn('⚠️ [HOLIDAYS] getHoliday llamado sin caché. Usar getAllHolidays() primero.');
  return null;
}

/**
 * Versión sincrónica de getHoliday que requiere holidays pre-cargados
 * @param date - Fecha en formato YYYY-MM-DD
 * @param holidays - Array de holidays (obtenido previamente con getAllHolidays)
 * @returns Holiday object si es festivo, null si no lo es
 */
export function getHolidaySync(date: string, holidays: Holiday[]): Holiday | null {
  return holidays.find(h => h.date === date) || null;
}

/**
 * Verifica si una fecha es un día festivo oficial (no laboral)
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns true si es día festivo oficial
 */
export function isOfficialHoliday(date: string): boolean {
  const holiday = getHoliday(date);
  return holiday?.type === 'official' || false;
}

/**
 * Obtiene todos los días festivos de un mes específico
 * @param year - Año
 * @param month - Mes (1-12)
 * @param holidays - Array de holidays (obtenido previamente con getAllHolidays)
 * @returns Array de Holiday objects
 */
export function getHolidaysForMonth(year: number, month: number, holidays: Holiday[]): Holiday[] {
  const monthStr = String(month).padStart(2, '0');
  return holidays.filter(h => h.date.startsWith(`${year}-${monthStr}`));
}

/**
 * Obtiene el color para el tipo de festivo
 * @param type - Tipo de festivo
 * @returns Color hexadecimal
 */
export function getHolidayColor(type: Holiday['type']): string {
  switch (type) {
    case 'official':
      return '#d32f2f'; // Rojo para días oficiales
    case 'traditional':
      return '#f57c00'; // Naranja para días tradicionales
    case 'special':
      return '#1976d2'; // Azul para días especiales
    default:
      return '#757575'; // Gris por defecto
  }
}

// Mantener compatibilidad con código existente que importa mexicanHolidays2025
// DEPRECATED: Usar getAllHolidays() en su lugar
export const mexicanHolidays2025: Holiday[] = [];
