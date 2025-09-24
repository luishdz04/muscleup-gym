// hooks/useEntityCRUD.ts - v6.0 CON AUDITORÍA INTELIGENTE MUSCLEUP
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';

interface UseEntityCRUDProps<T> {
  initialData?: T[];
  tableName: string; // Nombre de tabla Supabase (requerido para auditoría)
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  selectQuery?: string; // Query personalizado para joins
}

export const useEntityCRUD = <T extends { id: string }>({
  initialData = [],
  tableName,
  onError,
  onSuccess,
  selectQuery = '*'
}: UseEntityCRUDProps<T>) => {
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getTableAuditInfo } = useUserTracking();
  const supabase = createBrowserSupabaseClient();

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ INFORMACIÓN DE AUDITORÍA DE LA TABLA
  const auditInfo = useMemo(() => getTableAuditInfo(tableName), [tableName, getTableAuditInfo]);

  const fetchData = useCallback(async () => {
    if (!hydrated) return;

    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // ✅ VALIDACIÓN DE TIPO ANTES DE SETDATA
      if (Array.isArray(result)) {
        setData(result as unknown as T[]);
      } else {
        setData([]);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar datos';
      setError(errorMsg);
      onError?.(errorMsg);
      setData([]); // ✅ RESET DATA EN CASO DE ERROR
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [tableName, selectQuery, onError, hydrated, supabase]);

  useEffect(() => {
    if (hydrated) {
      fetchData();
    }
  }, [hydrated, fetchData]);

  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    // ✅ APLICAR AUDITORÍA INTELIGENTE SEGÚN TABLA
    const dataWithAudit = await addAuditFieldsFor(tableName, item, false);
    
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([dataWithAudit])
        .select()
        .single();
        
      if (error) throw error;
      
      setData(prev => [result, ...prev]);
      onSuccess?.(`${tableName} creado exitosamente`);
      
      return result;
    } catch (err: any) {
      const errorMsg = `Error al crear ${tableName}: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [addAuditFieldsFor, tableName, supabase, onSuccess, onError]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    // ✅ APLICAR AUDITORÍA INTELIGENTE SEGÚN TABLA
    const dataWithAudit = await addAuditFieldsFor(tableName, updates, true);
    
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(dataWithAudit)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...result } : item
      ));
      onSuccess?.(`${tableName} actualizado exitosamente`);
      
      return result;
    } catch (err: any) {
      const errorMsg = `Error al actualizar ${tableName}: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [addAuditFieldsFor, tableName, supabase, onSuccess, onError]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setData(prev => prev.filter(item => item.id !== id));
      onSuccess?.(`${tableName} eliminado exitosamente`);
      
    } catch (err: any) {
      const errorMsg = `Error al eliminar ${tableName}: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [tableName, supabase, onSuccess, onError]);

  // ✅ FUNCIÓN PARA OPERACIONES EN LOTE
  const bulkUpdate = useCallback(async (updates: { id: string; data: Partial<T> }[]) => {
    const promises = updates.map(async ({ id, data }) => {
      const dataWithAudit = await addAuditFieldsFor(tableName, data, true);
      return supabase
        .from(tableName)
        .update(dataWithAudit)
        .eq('id', id)
        .select()
        .single();
    });

    try {
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`${errors.length} operaciones fallaron`);
      }

      // Actualizar estado local
      const updatedData = results.map(r => r.data).filter(Boolean);
      setData(prev => prev.map(item => {
        const updated = updatedData.find(u => u.id === item.id);
        return updated ? { ...item, ...updated } : item;
      }));

      onSuccess?.(`${updatedData.length} elementos actualizados`);
      return updatedData;
    } catch (err: any) {
      const errorMsg = `Error en actualización masiva: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [addAuditFieldsFor, tableName, supabase, onSuccess, onError]);

  // ✅ FUNCIÓN PARA BÚSQUEDA AVANZADA
  const searchItems = useCallback(async (filters: Record<string, any>) => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select(selectQuery);
      
      // Aplicar filtros dinámicamente
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'string') {
            query = query.ilike(key, `%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      const { data: result, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // ✅ VALIDACIÓN DE TIPO ANTES DE SETDATA
      if (Array.isArray(result)) {
        setData(result as unknown as T[]);
        return result as unknown as T[];
      } else {
        setData([]);
        return [];
      }
    } catch (err: any) {
      const errorMsg = `Error en búsqueda: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      setData([]); // ✅ RESET DATA EN CASO DE ERROR
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, selectQuery, supabase, onError]);

  // ✅ FUNCIÓN PARA PAGINACIÓN
  const loadMore = useCallback(async (page: number, pageSize: number = 20) => {
    try {
      setLoading(true);
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: result, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      // ✅ VALIDACIÓN DE TIPO ANTES DE SETDATA
      if (Array.isArray(result)) {
        const validResult = result as unknown as T[];
        if (page === 0) {
          setData(validResult);
        } else {
          setData(prev => [...prev, ...validResult]);
        }
        return validResult;
      } else {
        if (page === 0) {
          setData([]);
        }
        return [];
      }
    } catch (err: any) {
      const errorMsg = `Error al cargar más datos: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
      if (page === 0) {
        setData([]); // ✅ RESET DATA EN CASO DE ERROR
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, selectQuery, supabase, onError]);

  return {
    // ✅ DATOS Y ESTADOS
    data,
    loading,
    initialLoad,
    hydrated,
    error,
    auditInfo, // ✅ INFO DE AUDITORÍA DISPONIBLE

    // ✅ OPERACIONES CRUD
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    bulkUpdate,

    // ✅ OPERACIONES AVANZADAS
    searchItems,
    loadMore,

    // ✅ UTILIDADES
    setData,
    clearError: () => setError(null),
    refreshData: fetchData, // Alias para fetchData

    // ✅ ESTADÍSTICAS ÚTILES
    stats: {
      total: data.length,
      isEmpty: data.length === 0,
      tableName,
      hasAudit: auditInfo.hasAudit,
      auditType: auditInfo.naming,
      lastUpdated: data.length > 0 ? data[0] : null
    }
  };
};

// ✅ INTERFACES EXPORTADAS
export interface UseEntityCRUDReturn<T> {
  data: T[];
  loading: boolean;
  initialLoad: boolean;
  hydrated: boolean;
  error: string | null;
  auditInfo: {
    hasAudit: boolean;
    hasCreatedBy: boolean;
    hasUpdatedBy: boolean;
    naming: 'camelCase' | 'snake_case' | 'none' | 'unknown';
    description: string;
  };
  fetchData: () => Promise<void>;
  createItem: (item: Omit<T, 'id'>) => Promise<T>;
  updateItem: (id: string, updates: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  bulkUpdate: (updates: { id: string; data: Partial<T> }[]) => Promise<T[]>;
  searchItems: (filters: Record<string, any>) => Promise<T[]>;
  loadMore: (page: number, pageSize?: number) => Promise<T[]>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  clearError: () => void;
  refreshData: () => Promise<void>;
  stats: {
    total: number;
    isEmpty: boolean;
    tableName: string;
    hasAudit: boolean;
    auditType: string;
    lastUpdated: T | null;
  };
}

// ✅ HOOK ESPECÍFICO PARA USERS CON TIPADO
export const useUsers = () => {
  return useEntityCRUD<{
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
  }>({
    tableName: 'Users',
    selectQuery: `
      id,
      firstName,
      lastName,
      email,
      profilePictureUrl,
      rol,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    `
  });
};

// ✅ HOOK ESPECÍFICO PARA MEMBERSHIPS CON JOINS
export const useMemberships = () => {
  return useEntityCRUD<any>({
    tableName: 'user_memberships',
    selectQuery: `
      *,
      Users!userid (
        id,
        firstName,
        lastName,
        email,
        profilePictureUrl
      ),
      membership_plans!plan_id (
        id,
        name,
        description,
        monthly_price,
        inscription_price
      )
    `
  });
};

// ✅ HOOK ESPECÍFICO PARA PRODUCTS CON SUPPLIER
export const useProducts = () => {
  return useEntityCRUD<any>({
    tableName: 'products',
    selectQuery: `
      *,
      suppliers!supplier_id (
        id,
        company_name,
        contact_person
      )
    `
  });
};