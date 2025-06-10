/**
 * 🇲🇽 UTILIDADES DE FECHA PARA ZONA HORARIA MEXICANA - VERSIÓN CORREGIDA SIN DESFASES
 * Manejo consistente de fechas para gimnasio con lógica de períodos reales
 */

/**
 * ✅ OBTENER FECHA ACTUAL EN MÉXICO - VERSIÓN CORREGIDA SIN DESFASES
 */
export const getMexicoToday = (): string => {
    // ✅ CREAR FECHA EN ZONA MEXICANA SIN PROBLEMAS DE ZONA HORARIA
    const now = new Date();
    const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
    
    const year = mexicoDate.getFullYear();
    const month = (mexicoDate.getMonth() + 1).toString().padStart(2, '0');
    const day = mexicoDate.getDate().toString().padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    
    console.log(`🇲🇽 Fecha actual México: ${result}`);
    return result;
  };
  
  /**
   * ✅ AGREGAR PERÍODO A FECHA - VERSIÓN CORREGIDA SIN DESFASES
   * Esta función maneja correctamente los diferentes tipos de períodos SIN errores de zona horaria
   * @param dateString - Fecha inicial YYYY-MM-DD
   * @param paymentType - Tipo de pago (weekly, monthly, etc.)
   * @param duration - Duración en días (solo para fallback)
   * @returns Nueva fecha YYYY-MM-DD
   */
  export const addPeriodToMexicoDate = (
    dateString: string, 
    paymentType: string, 
    duration: number
  ): string => {
    console.log(`📅 INICIO - Calculando período: ${dateString} + ${paymentType}`);
    
    // ✅ PARSING MANUAL PARA EVITAR PROBLEMAS DE ZONA HORARIA
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Mes es 0-indexado en JavaScript
    
    console.log(`🗓️ Fecha inicial parseada: ${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`);
    
    // ✅ LÓGICA INTELIGENTE SEGÚN TIPO DE PAGO
    switch (paymentType.toLowerCase()) {
      case 'weekly':
        // Semana = exactamente 7 días
        date.setDate(date.getDate() + 7);
        console.log(`🗓️ Agregando 1 semana (7 días)`);
        break;
        
      case 'biweekly':
        // Quincenal = exactamente 15 días
        date.setDate(date.getDate() + 15);
        console.log(`🗓️ Agregando 2 semanas (15 días)`);
        break;
        
      case 'monthly':
        // ✅ MES REAL - mismo día del siguiente mes
        const originalDay = date.getDate();
        date.setMonth(date.getMonth() + 1);
        
        // ✅ VERIFICAR SI EL DÍA CAMBIÓ (caso 31 de enero → febrero)
        if (date.getDate() !== originalDay) {
          // Si cambió, ir al último día del mes anterior
          date.setDate(0);
        }
        console.log(`🗓️ Agregando 1 mes real (día original: ${originalDay}, día final: ${date.getDate()})`);
        break;
        
      case 'bimonthly':
        // ✅ BIMESTRAL - mismo día 2 meses después
        const originalDayBi = date.getDate();
        date.setMonth(date.getMonth() + 2);
        if (date.getDate() !== originalDayBi) {
          date.setDate(0);
        }
        console.log(`🗓️ Agregando 2 meses reales`);
        break;
        
      case 'quarterly':
        // ✅ TRIMESTRAL - mismo día 3 meses después
        const originalDayQ = date.getDate();
        date.setMonth(date.getMonth() + 3);
        if (date.getDate() !== originalDayQ) {
          date.setDate(0);
        }
        console.log(`🗓️ Agregando 3 meses reales`);
        break;
        
      case 'semester':
        // ✅ SEMESTRAL - mismo día 6 meses después
        const originalDayS = date.getDate();
        date.setMonth(date.getMonth() + 6);
        if (date.getDate() !== originalDayS) {
          date.setDate(0);
        }
        console.log(`🗓️ Agregando 6 meses reales`);
        break;
        
      case 'annual':
        // ✅ ANUAL - mismo día siguiente año
        const originalDayA = date.getDate();
        date.setFullYear(date.getFullYear() + 1);
        if (date.getDate() !== originalDayA) {
          date.setDate(0);
        }
        console.log(`🗓️ Agregando 1 año real`);
        break;
        
      default:
        // Fallback: usar días literales (para casos como 'visit')
        console.warn(`⚠️ Tipo desconocido '${paymentType}', usando ${duration} días literales`);
        date.setDate(date.getDate() + duration);
        break;
    }
    
    // ✅ FORMATEO MANUAL PARA EVITAR PROBLEMAS DE ZONA HORARIA
    const resultYear = date.getFullYear();
    const resultMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const resultDay = date.getDate().toString().padStart(2, '0');
    const resultDate = `${resultYear}-${resultMonth}-${resultDay}`;
    
    console.log(`📅 RESULTADO FINAL: ${dateString} → ${resultDate}`);
    return resultDate;
  };
  
  /**
   * ✅ AGREGAR DÍAS EXACTOS - VERSIÓN CORREGIDA
   */
  export const addDaysToMexicoDate = (dateString: string, days: number): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    const resultYear = date.getFullYear();
    const resultMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const resultDay = date.getDate().toString().padStart(2, '0');
    const resultDate = `${resultYear}-${resultMonth}-${resultDay}`;
    
    console.log(`📅 Días exactos: ${dateString} + ${days} días = ${resultDate}`);
    return resultDate;
  };
  
  /**
   * ✅ CALCULAR DIFERENCIA EN DÍAS - VERSIÓN CORREGIDA
   */
  export const getDaysBetweenMexicoDates = (startDate: string, endDate: string): number => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`📊 Diferencia calculada: ${startDate} → ${endDate} = ${diffDays} días`);
    return diffDays;
  };
  
  /**
   * 🎨 FORMATEAR FECHA PARA MOSTRAR AL USUARIO (español mexicano)
   */
  export const formatDateForDisplay = (dateInput: string | Date): string => {
    try {
      let dateString: string;
      
      if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
        const day = dateInput.getDate().toString().padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      } else {
        dateString = dateInput.split('T')[0]; // Remover tiempo si existe
      }
      
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Error al formatear fecha:', dateInput, error);
      return 'Fecha inválida';
    }
  };
  
  /**
   * ⏰ FORMATEAR TIMESTAMP PARA MOSTRAR AL USUARIO
   */
  export const formatTimestampForDisplay = (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp);
      
      return date.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('❌ Error al formatear timestamp:', timestamp, error);
      return 'Timestamp inválido';
    }
  };
  
  /**
   * 📅 FORMATEAR FECHA PARA BASE DE DATOS (YYYY-MM-DD)
   */
  export const formatDateForDB = (dateInput: string | Date): string => {
    try {
      if (dateInput instanceof Date) {
        const year = dateInput.getFullYear();
        const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
        const day = dateInput.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Si ya está en formato correcto, devolverlo
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      
      // Intentar parsearlo
      const date = new Date(dateInput);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('❌ Error al formatear fecha para DB:', dateInput, error);
      return getMexicoToday(); // Fallback a fecha actual
    }
  };
  
  /**
   * ⏰ CREAR TIMESTAMP UTC PARA BASE DE DATOS
   */
  export const createTimestampForDB = (): string => {
    return new Date().toISOString();
  };
  
  /**
   * 🔍 VALIDAR FECHA EN FORMATO YYYY-MM-DD
   */
  export const isValidDateString = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return !isNaN(date.getTime()) && 
           date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };
  
  /**
   * 🔄 CONVERTIR TIMESTAMP A FECHA MEXICANA
   */
  export const timestampToMexicoDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const mexicoDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
    
    const year = mexicoDate.getFullYear();
    const month = (mexicoDate.getMonth() + 1).toString().padStart(2, '0');
    const day = mexicoDate.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  /**
   * 🔍 FUNCIÓN DE DEBUG MEJORADA PARA PRUEBAS
   */
  export const debugDateInfo = (label: string, dateInput: string | Date | any) => {
    console.log(`🔍 ${label}:`, {
      original: dateInput,
      display: typeof dateInput === 'string' ? formatDateForDisplay(dateInput) : dateInput,
      timestamp: typeof dateInput === 'string' ? formatTimestampForDisplay(dateInput) : dateInput,
      db_format: typeof dateInput === 'string' ? formatDateForDB(dateInput) : dateInput,
      type: typeof dateInput,
      mexico_today: getMexicoToday()
    });
  };
  
  /**
   * 🧪 FUNCIÓN DE PRUEBAS PARA VALIDAR CÁLCULOS
   */
  export const debugDateCalculations = () => {
    console.log('🧪 === INICIANDO PRUEBAS DE CÁLCULO DE FECHAS CORREGIDAS ===');
    
    const testCases = [
      { start: '2025-06-08', type: 'monthly', desc: '🎯 CASO PRINCIPAL: Junio 8 + 1 mes' },
      { start: '2025-07-08', type: 'monthly', desc: '🔄 RENOVACIÓN: Julio 8 + 1 mes' },
      { start: '2025-01-31', type: 'monthly', desc: '🔥 EDGE CASE: Enero 31 + 1 mes' },
      { start: '2025-02-28', type: 'monthly', desc: 'Febrero 28 + 1 mes' },
      { start: '2025-03-31', type: 'monthly', desc: '🔥 EDGE CASE: Marzo 31 + 1 mes (abril tiene 30)' },
      { start: '2025-06-08', type: 'quarterly', desc: 'Junio 8 + 3 meses' },
      { start: '2025-06-08', type: 'annual', desc: 'Junio 8 + 1 año' },
      { start: '2025-06-08', type: 'weekly', desc: 'Junio 8 + 1 semana' },
    ];
    
    testCases.forEach(test => {
      const result = addPeriodToMexicoDate(test.start, test.type, 30);
      console.log(`✅ ${test.desc}: ${test.start} → ${result}`);
    });
    
    console.log('🧪 === FIN DE PRUEBAS ===');
  };
  
  // Funciones de compatibilidad
  export const addDaysToDate = addDaysToMexicoDate;