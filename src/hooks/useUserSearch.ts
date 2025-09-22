// hooks/useUserSearch.ts - VERSIÓN SIN LOOP
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@/types/user';

interface UseUserSearchProps {
  users: User[];
}

export const useUserSearch = ({ users }: UseUserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastActivity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // DEBOUNCE OPTIMIZADO SIN DEPENDENCIAS EXTERNAS
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FILTRADO Y ORDENAMIENTO EN UN SOLO useMemo
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // FILTRO DE TEXTO
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const whatsapp = user.whatsapp || '';
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               whatsapp.includes(debouncedSearchTerm);
      });
    }
    
    // FILTRO POR ROL
    if (filterRole !== 'todos') {
      filtered = filtered.filter(user => user.rol === filterRole);
    }
    
    // ORDENAMIENTO
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'lastActivity':
          aValue = new Date(a.updatedAt || a.createdAt || 0);
          bValue = new Date(b.updatedAt || b.createdAt || 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [users, debouncedSearchTerm, filterRole, sortBy, sortOrder]);

  // FUNCIÓN PARA LIMPIAR FILTROS MEMOIZADA
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterRole('todos');
    setSortBy('createdAt');
    setSortOrder('desc');
  }, []);

  // ESTADÍSTICAS MEMOIZADAS
  const searchStats = useMemo(() => ({
    totalOriginal: users.length,
    totalFiltered: filteredUsers.length,
    isFiltered: debouncedSearchTerm.trim() !== '' || filterRole !== 'todos',
    hasResults: filteredUsers.length > 0,
  }), [users.length, filteredUsers.length, debouncedSearchTerm, filterRole]);

  return {
    searchTerm,
    filterRole,
    sortBy,
    sortOrder,
    filteredUsers,
    searchStats,
    setSearchTerm,
    setFilterRole,
    setSortBy,
    setSortOrder,
    clearFilters,
  };
};