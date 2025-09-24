// hooks/useMembershipFilters.ts - ENTERPRISE v4.2 CORREGIDO CON TUS INTERFACES
'use client';

import { useState, useMemo, useCallback } from 'react';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { 
  getTodayInMexico,
  formatDateForDisplay,
  daysBetween
} from '@/utils/dateUtils';

// ✅ IMPORTAR TIPOS CENTRALIZADOS (NO DUPLICADOS) - USAR TUS INTERFACES REALES
import type { 
  MembershipHistory, 
  Filters 
} from '@/types/membership';

// ✅ INTERFACE PARA ESTADÍSTICAS
interface MembershipStats {
  total: number;
  active: number;
  expired: number;
  frozen: number;
  cancelled: number;
  totalRevenue: number;
  totalCommissions: number;
}

export const useMembershipFilters = (memberships: MembershipHistory[]) => {
  // ✅ USAR TU INTERFACE FILTERS REAL CON planId (camelCase)
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    planId: '', // ✅ CORRECTO según tu interface types/membership.ts
    isRenewal: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // ✅ FUNCIÓN HELPER CON dateUtils
  const isDateInRange = useCallback((dateString: string | null, fromDate: string, toDate: string): boolean => {
    if (!dateString || (!fromDate && !toDate)) return true;
    
    if (fromDate && dateString < fromDate) return false;
    if (toDate && dateString > toDate) return false;
    
    return true;
  }, []);

  // ✅ FILTRADO DE MEMBRESÍAS CON dateUtils
  const filteredMemberships = useMemo(() => {
    return memberships.filter(membership => {
      // Filtro por término de búsqueda
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const userName = membership.user_name?.toLowerCase() || '';
        const userEmail = membership.user_email?.toLowerCase() || '';
        const planName = membership.plan_name?.toLowerCase() || '';
        const paymentReference = membership.payment_reference?.toLowerCase() || '';
        
        const matchesSearch = 
          userName.includes(searchTerm) ||
          userEmail.includes(searchTerm) ||
          planName.includes(searchTerm) ||
          paymentReference?.includes(searchTerm) ||
          membership.id.toLowerCase().includes(searchTerm);
          
        if (!matchesSearch) return false;
      }

      // Filtro por estado
      if (filters.status && membership.status !== filters.status) {
        return false;
      }

      // Filtro por método de pago
      if (filters.paymentMethod && membership.payment_method !== filters.paymentMethod) {
        return false;
      }

      // ✅ FILTRO POR PLAN - MAPEAR planId (UI) a plan_id (BD)
      if (filters.planId && membership.plan_id !== filters.planId) {
        return false;
      }

      // Filtro por renovación
      if (filters.isRenewal) {
        const isRenewal = filters.isRenewal === 'true';
        if (membership.is_renewal !== isRenewal) return false;
      }

      // Filtro por rango de fechas (fecha de inicio)
      if (!isDateInRange(membership.start_date, filters.dateFrom, filters.dateTo)) {
        return false;
      }

      return true;
    });
  }, [memberships, filters, isDateInRange]);

  // ✅ ESTADÍSTICAS CON dateUtils
  const stats = useMemo((): MembershipStats => {
    const today = getTodayInMexico();
    
    const baseStats = filteredMemberships.reduce((acc, membership) => {
      acc.total += 1;
      
      // Contar por estado
      switch (membership.status) {
        case 'active':
          acc.active += 1;
          break;
        case 'expired':
          acc.expired += 1;
          break;
        case 'frozen':
          acc.frozen += 1;
          break;
        case 'cancelled':
          acc.cancelled += 1;
          break;
      }
      
      // Sumar ingresos y comisiones
      acc.totalRevenue += membership.amount_paid || 0;
      acc.totalCommissions += membership.commission_amount || 0;
      
      return acc;
    }, {
      total: 0,
      active: 0,
      expired: 0,
      frozen: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommissions: 0
    });

    return baseStats;
  }, [filteredMemberships]);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '');
  }, [filters]);

  // Función para actualizar un filtro específico
  const updateFilter = useCallback(<K extends keyof Filters>(
    key: K, 
    value: Filters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Función para limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      planId: '', // ✅ CORRECTO: planId (consistente con tu interface)
      isRenewal: ''
    });
  }, []);

  // ✅ FUNCIÓN PARA EXPORTAR DATOS FILTRADOS
  const exportFilteredData = useCallback(() => {
    const csvData = filteredMemberships.map(membership => ({
      id: membership.id,
      usuario: membership.user_name,
      email: membership.user_email,
      plan: membership.plan_name,
      estado: membership.status,
      fechaInicio: formatDateForDisplay(membership.start_date),
      fechaFin: membership.end_date ? formatDateForDisplay(membership.end_date) : 'Sin fecha',
      montoPagado: membership.amount_paid,
      metodoPago: membership.payment_method,
      esRenovacion: membership.is_renewal ? 'Sí' : 'No',
      comision: membership.commission_amount,
      fechaCreacion: formatDateForDisplay(membership.created_at)
    }));
    
    return csvData;
  }, [filteredMemberships]);

  return {
    // Estados
    filters,
    filteredMemberships,
    stats,
    showFilters,
    hasActiveFilters,
    
    // Setters
    setFilters,
    setShowFilters,
    
    // Funciones
    updateFilter,
    clearFilters,
    exportFilteredData
  };
};