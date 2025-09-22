// utils/dateHelpers.ts - UTILIDADES DE FECHAS COMPLETAS
const MEXICO_TIMEZONE = 'America/Mexico_City';

// 📅 OBTENER FECHA ACTUAL EN MÉXICO (YYYY-MM-DD)
export const toMexicoDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_TIMEZONE
    }).format(date);
  } catch (error) {
    console.error('Error al formatear fecha México:', error);
    return new Date().toISOString().split('T')[0];
  }
};

// 📅 FORMATEAR FECHA PARA MOSTRAR AL USUARIO
export const formatDisplayDate = (dateString: string | null): string => {
  if (!dateString) return 'Sin fecha';
  
  try {
    // Para fechas YYYY-MM-DD (evita problemas de zona horaria)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    }
    
    // Para timestamps completos
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: MEXICO_TIMEZONE,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error al formatear fecha para display:', error);
    return 'Fecha inválida';
  }
};

// 🕒 FORMATEAR TIMESTAMP COMPLETO PARA MOSTRAR
export const formatMexicoDateTime = (
  timestamp: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const date = new Date(timestamp);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: MEXICO_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('es-MX', {
      ...defaultOptions,
      ...options
    }).format(date);
  } catch (error) {
    console.error('Error al formatear timestamp México:', error);
    return 'Fecha inválida';
  }
};

// ➕ AGREGAR DÍAS A UNA FECHA (YYYY-MM-DD)
export const addDaysToDate = (dateString: string, days: number): string => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error al agregar días a fecha:', error);
    return dateString;
  }
};

// ➕ AGREGAR MESES A UNA FECHA (maneja fin de mes correctamente)
export const addMonthsToDate = (dateString: string, months: number): string => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setMonth(date.getMonth() + months);
    
    // Manejar fin de mes correctamente
    if (date.getDate() !== day) {
      date.setDate(0); // Último día del mes anterior
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error al agregar meses a fecha:', error);
    return dateString;
  }
};

// 📊 CALCULAR DIFERENCIA EN DÍAS ENTRE FECHAS
export const calculateDaysDifference = (startDate: string, endDate: string): number => {
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error al calcular diferencia de días:', error);
    return 0;
  }
};

// ⏰ OBTENER TIMESTAMP ACTUAL UTC PARA BD
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// 🔍 VALIDAR SI UNA FECHA ES VÁLIDA
export const isValidDate = (dateString: string): boolean => {
  try {
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  } catch (error) {
    return false;
  }
};

// 📈 OBTENER PRIMER Y ÚLTIMO DÍA DEL MES
export const getMonthRange = (date: Date): { start: string; end: string } => {
  try {
    const mexicoDateString = toMexicoDate(date);
    const [year, month] = mexicoDateString.split('-').map(Number);
    
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    return {
      start: toMexicoDate(firstDay),
      end: toMexicoDate(lastDay)
    };
  } catch (error) {
    console.error('Error al obtener rango del mes:', error);
    const today = toMexicoDate(new Date());
    return { start: today, end: today };
  }
};

// 📊 FORMATEAR DURACIÓN LEGIBLE
export const formatDuration = (days: number): string => {
  if (days < 0) return `Vencida hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return '1 día restante';
  if (days < 7) return `${days} días restantes`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return weeks === 1 ? 
      `1 semana${remainingDays > 0 ? ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}` : ''} restante${remainingDays > 0 ? 's' : ''}` :
      `${weeks} semanas${remainingDays > 0 ? ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}` : ''} restantes`;
  }
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  return months === 1 ?
    `1 mes${remainingDays > 0 ? ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}` : ''} restante${remainingDays > 0 ? 's' : ''}` :
    `${months} meses${remainingDays > 0 ? ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}` : ''} restantes`;
};

// 🎯 HELPERS ESPECÍFICOS PARA MEMBRESÍAS
export const getMembershipHelpers = () => {
  return {
    // Calcular días restantes de membresía
    calculateDaysRemaining: (endDate: string | null): number | null => {
      if (!endDate) return null;
      
      try {
        const today = toMexicoDate(new Date());
        return calculateDaysDifference(today, endDate);
      } catch (error) {
        return null;
      }
    },

    // Obtener días congelados actuales
    getCurrentFrozenDays: (freezeDate: string | null): number => {
      if (!freezeDate) return 0;
      
      try {
        const today = toMexicoDate(new Date());
        const days = calculateDaysDifference(freezeDate, today);
        return Math.max(0, days);
      } catch (error) {
        return 0;
      }
    },

    // Verificar si membresía está próxima a vencer
    isNearExpiration: (endDate: string | null, warningDays: number = 7): boolean => {
      if (!endDate) return false;
      
      const daysRemaining = getMembershipHelpers().calculateDaysRemaining(endDate);
      return daysRemaining !== null && daysRemaining <= warningDays && daysRemaining >= 0;
    },

    // Obtener estado basado en fechas
    getStatusByDate: (endDate: string | null, status: string): 'active' | 'expired' | 'frozen' | 'cancelled' => {
      if (status === 'frozen' || status === 'cancelled') return status as any;
      if (!endDate) return 'active';
      
      const daysRemaining = getMembershipHelpers().calculateDaysRemaining(endDate);
      return daysRemaining !== null && daysRemaining < 0 ? 'expired' : 'active';
    }
  };
};
