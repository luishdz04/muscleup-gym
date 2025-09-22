// hooks/useUserTracking.ts (si no existe)
'use client';

import { useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export const useUserTracking = () => {
  const getCurrentUser = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, []);

  const getMonterreyTimestamp = useCallback((): string => {
    return new Date().toISOString();
  }, []);

  const addAuditFields = useCallback(async (data: any, isUpdate = false) => {
    const userId = await getCurrentUser();
    const timestamp = getMonterreyTimestamp();
    
    if (isUpdate) {
      return {
        ...data,
        updated_by: userId,
        updated_at: timestamp
      };
    } else {
      return {
        ...data,
        created_by: userId,
        created_at: timestamp,
        updated_by: userId,
        updated_at: timestamp
      };
    }
  }, [getCurrentUser, getMonterreyTimestamp]);

  return { getCurrentUser, addAuditFields };
};

// Export types
