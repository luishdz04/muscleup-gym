import { 
  getMexicoToday, 
  getDaysBetweenMexicoDates, 
  formatDateForDB, 
  createTimestampForDB,
  debugDateInfo
} from '@/lib/utils/dateUtils'; // 🔧 Cambiar a ruta absoluta

export interface FreezeResult {
  success: boolean;
  message: string;
  frozenDays?: number;
  newEndDate?: string;
  error?: string;
}

/**
 * 🧊 CONGELAR MEMBRESÍA
 * Congela una membresía activa registrando la fecha de congelamiento
 */
export const freezeMembership = async (
  supabase: any, 
  membershipId: string
): Promise<FreezeResult> => {
  try {
    const freezeDate = getMexicoToday();
    console.log(`🧊 Iniciando congelamiento de membresía ${membershipId} desde ${freezeDate}`);
    
    const { error } = await supabase
      .from('user_memberships')
      .update({ 
        status: 'frozen',
        freeze_date: freezeDate,
        updated_at: createTimestampForDB()
      })
      .eq('id', membershipId);

    if (error) throw error;

    console.log(`✅ Membresía ${membershipId} congelada exitosamente desde ${freezeDate}`);
    
    return {
      success: true,
      message: `🧊 Membresía congelada desde ${freezeDate}. Los días congelados se sumarán al vencimiento al reactivar.`
    };
    
  } catch (error: any) {
    console.error('❌ Error al congelar membresía:', error);
    return {
      success: false,
      message: 'Error al congelar membresía',
      error: error.message
    };
  }
};

/**
 * 🔄 REACTIVAR MEMBRESÍA
 * Reactiva una membresía congelada y extiende la fecha de vencimiento
 */
export const unfreezeMembership = async (
  supabase: any, 
  membershipId: string, 
  freezeDate: string,
  currentEndDate: string | null,
  previousFrozenDays: number = 0
): Promise<FreezeResult> => {
  try {
    if (!freezeDate) {
      throw new Error('No hay fecha de congelamiento registrada');
    }

    const unfreezeDate = getMexicoToday();
    console.log(`🔄 Iniciando reactivación de membresía ${membershipId}`);
    console.log(`📅 Congelada desde: ${freezeDate}, Reactivando: ${unfreezeDate}`);
    
    // 📊 CALCULAR DÍAS CONGELADOS
    const frozenDays = getDaysBetweenMexicoDates(freezeDate, unfreezeDate);
    const totalFrozenDays = previousFrozenDays + frozenDays;
    
    console.log(`📊 Días congelados en este período: ${frozenDays}`);
    console.log(`📊 Total días congelados acumulados: ${totalFrozenDays}`);
    
    // 📅 CALCULAR NUEVA FECHA DE VENCIMIENTO
    let newEndDate = currentEndDate;
    if (currentEndDate) {
      const endDateObj = new Date(`${currentEndDate}T23:59:59`);
      endDateObj.setDate(endDateObj.getDate() + frozenDays);
      newEndDate = formatDateForDB(endDateObj);
      
      console.log(`📅 Fecha de vencimiento original: ${currentEndDate}`);
      console.log(`📅 Nueva fecha de vencimiento: ${newEndDate} (+${frozenDays} días)`);
    }
    
    // 💾 ACTUALIZAR EN BASE DE DATOS
    const { error } = await supabase
      .from('user_memberships')
      .update({ 
        status: 'active',
        unfreeze_date: unfreezeDate,
        total_frozen_days: totalFrozenDays,
        end_date: newEndDate,
        freeze_date: null, // Limpiar fecha de congelamiento actual
        updated_at: createTimestampForDB()
      })
      .eq('id', membershipId);

    if (error) throw error;

    console.log(`✅ Membresía ${membershipId} reactivada exitosamente`);
    
    return {
      success: true,
      message: `🔄 Membresía reactivada. ${frozenDays} días congelados agregados. ${newEndDate ? `Nueva fecha de vencimiento: ${newEndDate}` : 'Sin fecha de vencimiento'}`,
      frozenDays,
      newEndDate: newEndDate || undefined
    };
    
  } catch (error: any) {
    console.error('❌ Error al reactivar membresía:', error);
    return {
      success: false,
      message: 'Error al reactivar membresía',
      error: error.message
    };
  }
};

/**
 * 📊 CALCULAR DÍAS CONGELADOS ACTUALES
 * Para membresías que están actualmente congeladas
 */
export const getCurrentFrozenDays = (freezeDate: string | null): number => {
  if (!freezeDate) return 0;
  
  const today = getMexicoToday();
  const frozenDays = getDaysBetweenMexicoDates(freezeDate, today);
  
  console.log(`📊 Días congelados hasta hoy: ${frozenDays} (desde ${freezeDate} hasta ${today})`);
  
  return Math.max(0, frozenDays); // Asegurar que no sea negativo
};

/**
 * 📅 CALCULAR FECHA DE VENCIMIENTO PROYECTADA
 * Para mostrar cuál sería la nueva fecha al reactivar
 */
export const getProjectedEndDate = (
  currentEndDate: string | null,
  freezeDate: string | null
): string | null => {
  if (!currentEndDate || !freezeDate) return currentEndDate;
  
  const frozenDays = getCurrentFrozenDays(freezeDate);
  const endDateObj = new Date(`${currentEndDate}T23:59:59`);
  endDateObj.setDate(endDateObj.getDate() + frozenDays);
  
  const projectedDate = formatDateForDB(endDateObj);
  console.log(`📅 Fecha proyectada al reactivar: ${projectedDate} (+${frozenDays} días)`);
  
  return projectedDate;
};

/**
 * 🔍 VALIDAR SI PUEDE CONGELARSE
 * Verificar reglas de negocio para congelamiento
 */
export const canFreezeMembership = (membership: any): { canFreeze: boolean; reason?: string } => {
  // Solo membresías activas pueden congelarse
  if (membership.status !== 'active') {
    return { 
      canFreeze: false, 
      reason: 'Solo las membresías activas pueden congelarse' 
    };
  }
  
  // Verificar que no esté ya congelada
  if (membership.freeze_date) {
    return { 
      canFreeze: false, 
      reason: 'La membresía ya está congelada' 
    };
  }
  
  // Verificar que tenga fecha de vencimiento (opcional)
  if (!membership.end_date) {
    return { 
      canFreeze: true, 
      reason: 'Membresía sin fecha de vencimiento - se puede congelar pero no se extenderá tiempo' 
    };
  }
  
  return { canFreeze: true };
};

/**
 * 🔍 VALIDAR SI PUEDE REACTIVARSE
 * Verificar reglas de negocio para reactivación
 */
export const canUnfreezeMembership = (membership: any): { canUnfreeze: boolean; reason?: string } => {
  // Solo membresías congeladas pueden reactivarse
  if (membership.status !== 'frozen') {
    return { 
      canUnfreeze: false, 
      reason: 'Solo las membresías congeladas pueden reactivarse' 
    };
  }
  
  // Verificar que tenga fecha de congelamiento
  if (!membership.freeze_date) {
    return { 
      canUnfreeze: false, 
      reason: 'No hay fecha de congelamiento registrada' 
    };
  }
  
  return { canUnfreeze: true };
};
