// hooks/useMembershipStats.ts - v6.0 CORREGIDO ESQUEMA BD ACTUALIZADO
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v6.0
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay,
  getTodayInMexico,
  addDaysToDate,
  MEXICO_TIMEZONE
} from '@/utils/dateUtils';

interface MembershipStats {
  total: number;
  active: number;
  expired: number;
  frozen: number;
  revenue_this_month: number;
  new_this_month: number;
  expiring_soon: number;
}

const INITIAL_STATS: MembershipStats = {
  total: 0,
  active: 0,
  expired: 0,
  frozen: 0,
  revenue_this_month: 0,
  new_this_month: 0,
  expiring_soon: 0
};

export const useMembershipStats = () => {
  // ✅ SSR SAFETY OBLIGATORIO v6.0
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA AUTOMÁTICA v6.0
  const { addAuditFieldsFor } = useUserTracking();
  
  const [stats, setStats] = useState<MembershipStats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FUNCIÓN DE FORMATEO DE PRECIO
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  // ✅ FUNCIONES DE FECHA CENTRALIZADAS
  const getMexicoToday = useCallback(() => {
    return getTodayInMexico();
  }, []);

  const getFirstDayOfMonth = useCallback(() => {
    const today = getTodayInMexico();
    const [year, month] = today.split('-');
    return `${year}-${month.padStart(2, '0')}-01`;
  }, []);

  const getIn7DaysDate = useCallback(() => {
    const today = getTodayInMexico();
    return addDaysToDate(today, 7);
  }, []);

  // ✅ CONVERSIÓN UTC TIMESTAMP A FECHA MÉXICO
  const convertUtcTimestampToMexicoDate = useCallback((utcTimestamp: string): string => {
    if (!utcTimestamp) return '';
    
    try {
      const utcDate = new Date(utcTimestamp);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: MEXICO_TIMEZONE,
      }).format(utcDate);
    } catch (error) {
      console.warn('Error convirtiendo timestamp UTC a México:', utcTimestamp);
      return '';
    }
  }, []);

  // ✅ FUNCIÓN PRINCIPAL DE CARGA - ESQUEMA BD v6.0 ACTUALIZADO
  const loadData = useCallback(async (isRefresh = false) => {
    if (!hydrated) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const supabase = createBrowserSupabaseClient();
      
      // ✅ SELECT OPTIMIZADO v6.0 - CAMPOS ACTUALIZADOS
      const { data: allMemberships, error: statsError } = await supabase
        .from('user_memberships')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          start_date,
          end_date,
          paid_amount,
          total_amount,
          pending_amount,
          freeze_start_date,
          unfreeze_date,
          userid,
          plan_id
        `);

      if (statsError) {
        console.error('Error BD user_memberships:', statsError);
        throw new Error(`Error BD: ${statsError.message}`);
      }

      // ✅ FECHAS MÉXICO CON DATEUTILS
      const mexicoToday = getMexicoToday();
      const firstDayOfMonth = getFirstDayOfMonth();
      const in7Days = getIn7DaysDate();
      
      console.log(`📅 Fechas México (v6.0 BD actualizada):`);
      console.log(`   📅 Hoy: ${mexicoToday}`);
      console.log(`   📅 Primer día del mes: ${firstDayOfMonth}`);
      console.log(`   📅 En 7 días: ${in7Days}`);

      // ✅ ESTADÍSTICAS CON ESQUEMA v6.0 ACTUALIZADO
      const calculatedStats: MembershipStats = {
        total: allMemberships?.length || 0,
        active: allMemberships?.filter(m => m.status === 'active').length || 0,
        expired: allMemberships?.filter(m => m.status === 'expired').length || 0,
        
        // ✅ FROZEN: Lógica enterprise v6.0
        frozen: allMemberships?.filter(m => 
          m.status === 'frozen' || 
          (m.freeze_start_date && (!m.unfreeze_date || m.unfreeze_date > mexicoToday))
        ).length || 0,
        
        // ✅ INGRESOS: paid_amount (CAMPO ACTUALIZADO v6.0)
        revenue_this_month: allMemberships
          ?.filter(m => {
            if (!m.created_at) return false;
            const createdDateMexico = convertUtcTimestampToMexicoDate(m.created_at);
            return createdDateMexico >= firstDayOfMonth;
          })
          .reduce((sum, m) => sum + (m.paid_amount || 0), 0) || 0,
        
        // ✅ NUEVAS: created_at con timezone UTC consistente  
        new_this_month: allMemberships
          ?.filter(m => {
            if (!m.created_at) return false;
            const createdDateMexico = convertUtcTimestampToMexicoDate(m.created_at);
            return createdDateMexico >= firstDayOfMonth;
          }).length || 0,
        
        // ✅ POR VENCER: end_date (DATE) comparación directa
        expiring_soon: allMemberships
          ?.filter(m => {
            if (!m.end_date || m.status !== 'active') return false;
            return m.end_date <= in7Days && m.end_date >= mexicoToday;
          }).length || 0
      };

      console.log('📊 Estadísticas finales (BD v6.0):', calculatedStats);
      
      setStats(calculatedStats);
      
    } catch (err: any) {
      console.error('💥 Error cargando datos:', err);
      
      if (isRefresh) {
        notify.error(`Error actualizando: ${err.message}`);
      }
      
      throw new Error(err.message || 'Error cargando datos');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [
    hydrated, 
    getMexicoToday, 
    getFirstDayOfMonth, 
    getIn7DaysDate, 
    convertUtcTimestampToMexicoDate
  ]);

  // ✅ REFRESH FUNCTION
  const refreshData = useCallback(async () => {
    if (!hydrated) return Promise.resolve();
    return loadData(true);
  }, [hydrated, loadData]);

  // ✅ INICIALIZACIÓN SSR SAFE v6.0
  useEffect(() => {
    if (!hydrated) return;

    let isMounted = true;

    const initializeData = async () => {
      try {
        await loadData(false);
        if (isMounted) {
          notify.success('Datos cargados correctamente');
        }
      } catch (error: any) {
        if (isMounted) {
          notify.error(`Error cargando datos: ${error.message}`);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [hydrated, loadData]);

  // ✅ RETURN CON FUNCIONES DATEUTILS
  return useMemo(() => ({
    stats,
    loading: loading || !hydrated,
    refreshing,
    refreshData,
    formatPrice,
    hydrated,
    formatTimestampForDisplay,
    formatDateForDisplay,
    getTodayInMexico
  }), [
    stats, 
    loading, 
    hydrated,
    refreshing, 
    refreshData, 
    formatPrice
  ]);
};

// ✅ INTERFACE ACTUALIZADA v6.0 - ESQUEMA BD CORRECTO
export interface UserMembership {
  // Identificadores
  id: string;
  userid?: string;
  plan_id: string; // ✅ Unificado (planid ELIMINADO)
  
  // Estado y fechas
  status: 'active' | 'expired' | 'frozen' | string;
  start_date: string; // DATE 'YYYY-MM-DD'
  end_date?: string; // DATE 'YYYY-MM-DD'
  
  // Congelamiento (esquema v6.0)
  freeze_start_date?: string; // DATE
  unfreeze_date?: string; // DATE (freeze_end_date ELIMINADO)
  freeze_reason?: string;
  total_frozen_days?: number;
  
  // Pagos (esquema v6.0 actualizado)
  payment_type: string;
  paid_amount: number; // ✅ NUEVO CAMPO (reemplaza amount_paid)
  total_amount: number; // ✅ NUEVO CAMPO
  pending_amount: number; // ✅ NUEVO CAMPO
  inscription_amount?: number;
  
  // Auditoría (ambos con timezone UTC)
  created_at: string; // timestamp with time zone (UTC)
  updated_at: string; // timestamp with time zone (UTC)
  created_by?: string;
  updated_by?: string;
}