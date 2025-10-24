import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'empleado' | 'cliente' | null;

interface UseUserRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  isEmpleado: boolean;
  isCliente: boolean;
  loading: boolean;
}

/**
 * Hook para obtener el rol del usuario actual
 * Lee directamente del user_metadata.role (sincronizado por trigger)
 */
export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Leer rol desde metadata (sincronizado por trigger)
          const userRole = (session.user.user_metadata?.role as UserRole) || 'cliente';
          setRole(userRole);
          console.log('🔐 [useUserRole] Rol detectado:', userRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('❌ [useUserRole] Error al obtener rol:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    getUserRole();

    // Suscribirse a cambios de autenticación
    const supabase = createBrowserSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userRole = (session.user.user_metadata?.role as UserRole) || 'cliente';
        setRole(userRole);
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    isAdmin: role === 'admin',
    isEmpleado: role === 'empleado',
    isCliente: role === 'cliente',
    loading
  };
}
