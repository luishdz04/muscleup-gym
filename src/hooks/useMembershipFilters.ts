// hooks/useMembershipFilters.ts
import { useState, useCallback, useMemo } from 'react';

interface Filters {
  searchTerm: string;
  status: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  planId: string;
  isRenewal: string;
}

interface MembershipHistory {
  id: string;
  userid: string;
  planid: string;
  payment_type: string;
  amount_paid: number;
  inscription_amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  discount_amount: number;
  coupon_code: string | null;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  payment_received: number;
  payment_change: number;
  is_mixed_payment: boolean;
  is_renewal: boolean;
  custom_commission_rate: number | null;
  skip_inscription: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  payment_details: any;
  user_name: string;
  user_email: string;
  plan_name: string;
}

const initialFilters: Filters = {
  searchTerm: '',
  status: '',
  paymentMethod: '',
  dateFrom: '',
  dateTo: '',
  planId: '',
  isRenewal: ''
};

export const useMembershipFilters = (memberships: MembershipHistory[]) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredMemberships = useMemo(() => {
    let filtered = [...memberships];

    // Filtro de búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.user_name.toLowerCase().includes(searchLower) ||
        m.user_email.toLowerCase().includes(searchLower) ||
        m.plan_name.toLowerCase().includes(searchLower) ||
        m.payment_reference?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      filtered = filtered.filter(m => m.payment_method === filters.paymentMethod);
    }

    // Filtro por plan
    if (filters.planId) {
      filtered = filtered.filter(m => m.planid === filters.planId);
    }

    // Filtro por tipo de venta (renovación)
    if (filters.isRenewal) {
      const isRenewal = filters.isRenewal === 'true';
      filtered = filtered.filter(m => m.is_renewal === isRenewal);
    }

    // Filtros de fecha
    if (filters.dateFrom) {
      const fromTime = new Date(`${filters.dateFrom}T00:00:00`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00`).getTime();
        return membershipTime >= fromTime;
      });
    }
    
    if (filters.dateTo) {
      const toTime = new Date(`${filters.dateTo}T23:59:59`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00`).getTime();
        return membershipTime <= toTime;
      });
    }

    return filtered;
  }, [memberships, filters]);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const filtered = filteredMemberships;
    return {
      total: filtered.length,
      active: filtered.filter(m => m.status === 'active').length,
      expired: filtered.filter(m => m.status === 'expired').length,
      frozen: filtered.filter(m => m.status === 'frozen').length,
      totalRevenue: filtered.reduce((sum, m) => sum + (m.amount_paid || 0), 0),
      totalCommissions: filtered.reduce((sum, m) => sum + (m.commission_amount || 0), 0)
    };
  }, [filteredMemberships]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '');
  }, [filters]);

  return {
    filters,
    filteredMemberships,
    stats,
    showFilters,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    setShowFilters,
    setFilters
  };
};
