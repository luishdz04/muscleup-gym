// hooks/useMembershipStats.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';
import toast from 'react-hot-toast';

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
  const [stats, setStats] = useState<MembershipStats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date());
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  // ✅ FUNCIÓN PRINCIPAL DE CARGA DE DATOS OPTIMIZADA
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const supabase = createBrowserSupabaseClient();
      
      // ✅ OBTENER TODAS LAS MEMBRESÍAS
      const { data: allMemberships, error: statsError } = await supabase
        .from('user_memberships')
        .select('*');

      if (statsError) throw statsError;

      // ✅ OBTENER FECHAS MÉXICO CORREGIDAS
      const mexicoToday = getMexicoDate();
      const mexicoTodayString = getMexicoDateString();
      
      // Primer día del mes actual en México
      const firstDayOfMonth = `${mexicoToday.getFullYear()}-${(mexicoToday.getMonth() + 1).toString().padStart(2, '0')}-01`;
      
      // Fecha en 7 días en México
      const in7Days = new Date(mexicoToday);
      in7Days.setDate(mexicoToday.getDate() + 7);
      const in7DaysString = toMexicoDate(in7Days);
      
      console.log(`📅 Fechas México calculadas para estadísticas:`);
      console.log(`   📅 Hoy: ${mexicoTodayString}`);
      console.log(`   📅 Primer día del mes: ${firstDayOfMonth}`);
      console.log(`   📅 En 7 días: ${in7DaysString}`);

      // ✅ CALCULAR ESTADÍSTICAS CON FECHAS MÉXICO CORREGIDAS
      const calculatedStats: MembershipStats = {
        total: allMemberships?.length || 0,
        active: allMemberships?.filter(m => m.status === 'active').length || 0,
        expired: allMemberships?.filter(m => m.status === 'expired').length || 0,
        frozen: allMemberships?.filter(m => m.status === 'frozen').length || 0,
        
        // ✅ INGRESOS DEL MES - Filtrar por created_at >= primer día del mes
        revenue_this_month: allMemberships
          ?.filter(m => {
            if (!m.created_at) return false;
            // Convertir timestamp BD a fecha México para comparar
            const createdDate = toMexicoDate(new Date(m.created_at));
            return createdDate >= firstDayOfMonth;
          })
          .reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0,
        
        // ✅ NUEVAS DEL MES - Filtrar por created_at >= primer día del mes  
        new_this_month: allMemberships
          ?.filter(m => {
            if (!m.created_at) return false;
            // Convertir timestamp BD a fecha México para comparar
            const createdDate = toMexicoDate(new Date(m.created_at));
            return createdDate >= firstDayOfMonth;
          }).length || 0,
        
        // ✅ POR VENCER EN 7 DÍAS - Filtrar activas con end_date entre hoy y 7 días
        expiring_soon: allMemberships
          ?.filter(m => {
            if (!m.end_date || m.status !== 'active') return false;
            // Convertir timestamp BD a fecha México para comparar
            const endDate = toMexicoDate(new Date(m.end_date));
            return endDate <= in7DaysString && endDate >= mexicoTodayString;
          }).length || 0
      };

      console.log('📊 Estadísticas calculadas:', calculatedStats);
      
      setStats(calculatedStats);
      
    } catch (err: any) {
      console.error('💥 Error cargando datos de membresías:', err);
      throw new Error(err.message || 'Error cargando datos');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [getMexicoDate, getMexicoDateString]);

  // ✅ FUNCIÓN DE REFRESH CONTROLADA
  const refreshData = useCallback(async () => {
    return loadData(true);
  }, [loadData]);

  // ✅ CARGAR DATOS AL INICIALIZAR (SOLO UNA VEZ)
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        await loadData(false);
        if (isMounted) {
          // Solo mostrar notificación de éxito en la carga inicial si no hay errores
          toast.success('📊 Datos cargados correctamente');
        }
      } catch (error: any) {
        if (isMounted) {
          toast.error(`❌ Error cargando datos: ${error.message}`);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []); // ✅ Dependencias vacías para ejecutar solo una vez

  // ✅ RETORNAR ESTADO Y FUNCIONES MEMOIZADAS
  return useMemo(() => ({
    stats,
    loading,
    refreshing,
    refreshData,
    formatPrice
  }), [stats, loading, refreshing, refreshData, formatPrice]);
};