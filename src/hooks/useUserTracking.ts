// hooks/useUserTracking.ts - VERSIÓN CORREGIDA
'use client';

import { useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export const useUserTracking = () => {
  const getCurrentUser = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, []);

  // ✅ CAMBIO 1: Función más específica para timestamps UTC
  const getUTCTimestamp = useCallback((): string => {
    return new Date().toISOString(); // Siempre UTC para BD
  }, []);

  const addAuditFields = useCallback(async (data: any, isUpdate = false) => {
    const userId = await getCurrentUser();
    
    if (isUpdate) {
      return {
        ...data,
        // ✅ CAMBIO 2: Usar camelCase como tu tabla actual
        updatedBy: userId,        // Era: updated_by
        // updatedAt se maneja automáticamente por el trigger
      };
    } else {
      return {
        ...data,
        // ✅ CAMBIO 3: Usar camelCase como tu tabla actual  
        createdBy: userId,        // Era: created_by
        updatedBy: userId,        // Era: updated_by
        // createdAt y updatedAt se manejan por defaults/trigger
      };
    }
  }, [getCurrentUser]);

  return { 
    getCurrentUser, 
    addAuditFields,
    getUTCTimestamp  // ✅ Exportar para otros usos
  };
};

// ✅ CAMBIO 4: Agregar tipos para TypeScript
export interface AuditFields {
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserTrackingHook {
  getCurrentUser: () => Promise<string | null>;
  addAuditFields: (data: any, isUpdate?: boolean) => Promise<any>;
  getUTCTimestamp: () => string;
}