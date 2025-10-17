// Días festivos de México (2025)
// Este archivo define los días festivos oficiales y días importantes en México

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'official' | 'traditional' | 'special';
  emoji: string;
}

export const mexicanHolidays2025: Holiday[] = [
  // Enero
  { date: '2025-01-01', name: 'Año Nuevo', type: 'official', emoji: '🎉' },
  { date: '2025-01-06', name: 'Día de Reyes', type: 'traditional', emoji: '👑' },

  // Febrero
  { date: '2025-02-03', name: 'Día de la Constitución', type: 'official', emoji: '🇲🇽' },
  { date: '2025-02-14', name: 'Día del Amor y la Amistad', type: 'special', emoji: '❤️' },

  // Marzo
  { date: '2025-03-17', name: 'Natalicio de Benito Juárez', type: 'official', emoji: '🎂' },
  { date: '2025-03-21', name: 'Inicio de Primavera', type: 'special', emoji: '🌸' },

  // Abril
  { date: '2025-04-17', name: 'Jueves Santo', type: 'traditional', emoji: '✝️' },
  { date: '2025-04-18', name: 'Viernes Santo', type: 'traditional', emoji: '✝️' },

  // Mayo
  { date: '2025-05-01', name: 'Día del Trabajo', type: 'official', emoji: '👷' },
  { date: '2025-05-05', name: 'Batalla de Puebla', type: 'official', emoji: '🇲🇽' },
  { date: '2025-05-10', name: 'Día de las Madres', type: 'traditional', emoji: '💐' },

  // Junio
  { date: '2025-06-21', name: 'Inicio de Verano', type: 'special', emoji: '☀️' },

  // Septiembre
  { date: '2025-09-16', name: 'Día de la Independencia', type: 'official', emoji: '🇲🇽' },
  { date: '2025-09-23', name: 'Inicio de Otoño', type: 'special', emoji: '🍂' },

  // Octubre
  { date: '2025-10-12', name: 'Día de la Raza', type: 'traditional', emoji: '🌎' },
  { date: '2025-10-31', name: 'Halloween', type: 'special', emoji: '🎃' },

  // Noviembre
  { date: '2025-11-01', name: 'Día de Todos los Santos', type: 'traditional', emoji: '💀' },
  { date: '2025-11-02', name: 'Día de Muertos', type: 'traditional', emoji: '💀' },
  { date: '2025-11-17', name: 'Revolución Mexicana', type: 'official', emoji: '🇲🇽' },

  // Diciembre
  { date: '2025-12-12', name: 'Día de la Virgen de Guadalupe', type: 'traditional', emoji: '🙏' },
  { date: '2025-12-21', name: 'Inicio de Invierno', type: 'special', emoji: '❄️' },
  { date: '2025-12-24', name: 'Nochebuena', type: 'traditional', emoji: '🎄' },
  { date: '2025-12-25', name: 'Navidad', type: 'official', emoji: '🎅' },
  { date: '2025-12-31', name: 'Año Viejo', type: 'traditional', emoji: '🎊' }
];

/**
 * Verifica si una fecha es un día festivo
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns Holiday object si es festivo, null si no lo es
 */
export function getHoliday(date: string): Holiday | null {
  return mexicanHolidays2025.find(h => h.date === date) || null;
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
 * @returns Array de Holiday objects
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const monthStr = String(month).padStart(2, '0');
  return mexicanHolidays2025.filter(h => h.date.startsWith(`${year}-${monthStr}`));
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
