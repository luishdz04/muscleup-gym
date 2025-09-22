// hooks/useUserDataInitialization.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Interfaces
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: string;
  profilePictureUrl?: string;
  whatsapp: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  isMinor: boolean;
  emailSent: boolean;
  emailSentAt?: string;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  signatureUrl?: string;
  contractPdfUrl?: string;
  fingerprint: boolean;
  // ✅ PROPIEDADES OPCIONALES PARA COMPATIBILIDAD
  role?: string;
  userType?: string;
}

interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

interface MembershipInfo {
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

interface InitializationState {
  isInitializing: boolean;
  isComplete: boolean;
  error: string | null;
  retryCount: number;
}

interface UseUserDataInitializationProps {
  user?: User | null;
  isOpen: boolean;
  onDataLoaded?: (data: {
    address?: Address;
    emergency?: EmergencyContact;
    membership?: MembershipInfo;
  }) => void;
  onError?: (error: string) => void;
}

// Funciones de conversión memoizadas
const convertMaritalStatusToCode = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'Soltero/a': 'soltero',
    'Soltero': 'soltero',
    'Soltera': 'soltero',
    'Casado/a': 'casado',
    'Casado': 'casado',
    'Casada': 'casado',
    'Divorciado/a': 'divorciado',
    'Divorciado': 'divorciado',
    'Divorciada': 'divorciado',
    'Viudo/a': 'viudo',
    'Viudo': 'viudo',
    'Viuda': 'viudo'
  };
  return statusMap[status] || status.toLowerCase();
};

const convertTrainingLevelToCode = (level: string): string => {
  return level ? level.toLowerCase() : 'principiante';
};

// ✅ FUNCIÓN MEJORADA PARA DETERMINAR ROL DE USUARIO
const getUserRole = (user: User): string => {
  // Priorizar rol principal, luego alternativas para compatibilidad
  return user.rol || user.role || user.userType || '';
};

// ✅ FUNCIÓN MEJORADA PARA DETERMINAR SI ES CLIENTE
const isClientUser = (userRole: string): boolean => {
  const normalizedRole = userRole.toLowerCase().trim();
  return normalizedRole === 'cliente' || 
         normalizedRole === 'client' || 
         normalizedRole === 'member';
};

export const useUserDataInitialization = ({
  user,
  isOpen,
  onDataLoaded,
  onError
}: UseUserDataInitializationProps) => {

  // Estados de inicialización
  const [initializationState, setInitializationState] = useState<InitializationState>({
    isInitializing: false,
    isComplete: false,
    error: null,
    retryCount: 0
  });

  const [fetchingRelated, setFetchingRelated] = useState(false);

  // Referencias para control
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar datos relacionados del usuario
  const fetchRelatedData = useCallback(async (userId: string) => {
    try {
      setFetchingRelated(true);
      console.log('📊 [INIT] Cargando datos relacionados para usuario:', userId);
      
      const supabase = createBrowserSupabaseClient();
      
      // ✅ CARGAR TODOS LOS DATOS EN PARALELO CON MANEJO DE ERRORES MEJORADO
      const dataQueries = [
        supabase
          .from('addresses')
          .select('*')
          .eq('userId', userId)
          .single(),
        
        supabase
          .from('emergency_contacts')
          .select('*')
          .eq('userId', userId)
          .single(),
        
        supabase
          .from('membership_info')
          .select('*')
          .eq('userId', userId)
          .single()
      ];
      
      // Ejecutar todas las consultas en paralelo
      const results = await Promise.allSettled(dataQueries);
      
      let loadedData: {
        address?: Address;
        emergency?: EmergencyContact;
        membership?: MembershipInfo;
      } = {};
      
      // ✅ PROCESAR RESULTADO DE DIRECCIÓN
      const [addressResult, emergencyResult, membershipResult] = results;
      
      if (addressResult.status === 'fulfilled' && 
          addressResult.value.data && 
          !addressResult.value.error) {
        const address = addressResult.value.data;
        loadedData.address = {
          street: address.street || '',
          number: address.number || '',
          neighborhood: address.neighborhood || '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'México'
        };
        console.log('✅ [INIT] Dirección cargada');
      } else {
        console.log('ℹ️ [INIT] No se encontró dirección para el usuario');
      }
      
      // ✅ PROCESAR RESULTADO DE CONTACTO DE EMERGENCIA
      if (emergencyResult.status === 'fulfilled' && 
          emergencyResult.value.data && 
          !emergencyResult.value.error) {
        const emergency = emergencyResult.value.data;
        loadedData.emergency = {
          name: emergency.name || '',
          phone: emergency.phone || '',
          medicalCondition: emergency.medicalCondition || '',
          bloodType: emergency.bloodType || ''
        };
        console.log('✅ [INIT] Contacto de emergencia cargado');
      } else {
        console.log('ℹ️ [INIT] No se encontró contacto de emergencia para el usuario');
      }
      
      // ✅ PROCESAR RESULTADO DE MEMBRESÍA
      if (membershipResult.status === 'fulfilled' && 
          membershipResult.value.data && 
          !membershipResult.value.error) {
        const membership = membershipResult.value.data;
        loadedData.membership = {
          referredBy: membership.referredBy || '',
          mainMotivation: membership.mainMotivation || '',
          receivePlans: membership.receivePlans || false,
          trainingLevel: convertTrainingLevelToCode(membership.trainingLevel || 'principiante')
        };
        console.log('✅ [INIT] Información de membresía cargada');
      } else {
        console.log('ℹ️ [INIT] No se encontró información de membresía para el usuario');
      }
      
      // Notificar datos cargados
      onDataLoaded?.(loadedData);
      
      console.log('🎉 [INIT] Carga de datos relacionados completada');
      
    } catch (error: any) {
      console.error('❌ [INIT] Error cargando datos relacionados:', error);
      onError?.(`Error cargando datos relacionados: ${error.message}`);
    } finally {
      setFetchingRelated(false);
    }
  }, [onDataLoaded, onError]);

  // ✅ FUNCIÓN PRINCIPAL DE INICIALIZACIÓN MEJORADA
  const initializeUserData = useCallback(async () => {
    if (!isOpen || !user?.id || initializedRef.current) {
      return;
    }
    
    try {
      setInitializationState(prev => ({
        ...prev,
        isInitializing: true,
        error: null
      }));
      
      console.log('🚀 [INIT] Iniciando inicialización de datos de usuario:', user.id);
      
      // ✅ VERIFICAR ROL DEL USUARIO DE FORMA ROBUSTA
      const userRole = getUserRole(user);
      const isCliente = isClientUser(userRole);

      console.log('🔍 [INIT] Verificando rol de usuario:', {
        rol: user.rol,
        computed: userRole,
        isCliente,
        userId: user.id
      });
      
      // Cargar datos relacionados solo si es cliente
      if (isCliente) {
        console.log('✅ [INIT] Usuario confirmado como CLIENTE - Cargando datos adicionales...');
        await fetchRelatedData(user.id);
      } else {
        console.log('ℹ️ [INIT] Usuario NO es cliente, saltando datos adicionales:', {
          rol: userRole,
          userId: user.id
        });
      }
      
      // Marcar como completado
      setInitializationState(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        retryCount: 0
      }));
      
      initializedRef.current = true;
      console.log('🎉 [INIT] Inicialización completada exitosamente');
      
    } catch (error: any) {
      console.error('💥 [INIT] Error en inicialización:', error);
      
      setInitializationState(prev => {
        const newRetryCount = prev.retryCount + 1;
        return {
          ...prev,
          isInitializing: false,
          error: error.message,
          retryCount: newRetryCount
        };
      });
      
      // ✅ LÓGICA DE RETRY MEJORADA
      if (initializationState.retryCount < 2) {
        console.log(`🔄 [INIT] Reintentando inicialización (${initializationState.retryCount + 1}/3)...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            initializedRef.current = false;
            initializeUserData();
          }
        }, Math.min(2000 * (initializationState.retryCount + 1), 5000)); // Backoff exponencial
      } else {
        console.log('⚠️ [INIT] Máximo de reintentos alcanzado');
        onError?.(error.message);
      }
    }
  }, [
    isOpen, 
    user?.id, 
    user, 
    fetchRelatedData, 
    initializationState.retryCount, 
    onError
  ]);

  // Función para reintentar inicialización manualmente
  const retryInitialization = useCallback(() => {
    console.log('🔄 [INIT] Reintento manual solicitado');
    
    // Reset estados
    setInitializationState({
      isInitializing: false,
      isComplete: false,
      error: null,
      retryCount: 0
    });
    
    initializedRef.current = false;
    
    // Inicializar de nuevo
    initializeUserData();
  }, [initializeUserData]);

  // Función para resetear inicialización
  const resetInitialization = useCallback(() => {
    console.log('🔄 [INIT] Reseteando inicialización');
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setInitializationState({
      isInitializing: false,
      isComplete: false,
      error: null,
      retryCount: 0
    });
    
    setFetchingRelated(false);
    initializedRef.current = false;
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA DETERMINAR SI DEBE MOSTRAR UN PASO ESPECÍFICO
  const shouldShowStep = useCallback((stepIndex: number, userRole: string): boolean => {
    const isCliente = isClientUser(userRole);
    
    // Paso 0: Información Personal - siempre mostrar
    if (stepIndex === 0) return true;
    
    // Para clientes: mostrar todos los pasos
    if (isCliente) {
      return stepIndex >= 0 && stepIndex <= 4; // 0: Personal, 1: Dirección, 2: Emergencia, 3: Membresía, 4: Archivos
    }
    
    // Para no clientes: solo mostrar Personal (0) y Archivos (último)
    return stepIndex === 0 || stepIndex === 1; // 0: Personal, 1: Archivos (ajustado para no clientes)
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA OBTENER PASOS SEGÚN EL ROL
  const getStepsForRole = useCallback((userRole: string): string[] => {
    const isCliente = isClientUser(userRole);
    
    if (isCliente) {
      return ['Información Personal', 'Dirección', 'Contacto de Emergencia', 'Membresía', 'Archivos'];
    } else {
      return ['Información Personal', 'Archivos'];
    }
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA MAPEAR PASO ACTUAL A PASO REAL
  const mapStepIndex = useCallback((currentStep: number, userRole: string): number => {
    const isCliente = isClientUser(userRole);
    
    if (isCliente) {
      return currentStep;
    }
    
    // Para no clientes: mapear paso 1 al paso 4 (archivos)
    return currentStep === 1 ? 4 : currentStep;
  }, []);

  // Función para verificar si la inicialización está lista
  const isInitializationReady = useCallback((): boolean => {
    if (!user) return true; // Nuevo usuario, no necesita inicialización
    return initializationState.isComplete && !initializationState.isInitializing;
  }, [user, initializationState.isComplete, initializationState.isInitializing]);

  // ✅ EFFECT PARA INICIALIZAR CUANDO SE ABRA EL DIÁLOGO
 useEffect(() => {
  if (isOpen && user?.id && !initializedRef.current && !initializationState.isInitializing) {
    console.log('📋 [INIT] Diálogo abierto, iniciando inicialización...');
    initializeUserData();
  } else if (!isOpen) {
    // Reset cuando se cierre el diálogo
    resetInitialization();
  }
}, [isOpen, user?.id, initializationState.isInitializing]);

  // Effect para cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Effect para resetear cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      initializedRef.current = false;
    }
  }, [user?.id]);

  // ✅ FUNCIONES DE UTILIDAD ADICIONALES
  const getCurrentUserRole = useCallback((): string => {
    return user ? getUserRole(user) : '';
  }, [user]);

  const isCurrentUserClient = useCallback((): boolean => {
    return user ? isClientUser(getUserRole(user)) : false;
  }, [user]);

  return {
    // Estados de inicialización
    isInitializing: initializationState.isInitializing,
    isInitializationComplete: initializationState.isComplete,
    initializationError: initializationState.error,
    retryCount: initializationState.retryCount,
    fetchingRelated,
    
    // Funciones de control
    retryInitialization,
    resetInitialization,
    isInitializationReady,
    
    // Funciones de utilidad para pasos
    shouldShowStep,
    getStepsForRole,
    mapStepIndex,
    
    // ✅ FUNCIONES ADICIONALES DE UTILIDAD
    getCurrentUserRole,
    isCurrentUserClient,
    
    // Estados computados
    canProceed: isInitializationReady() && !fetchingRelated,
    needsRetry: !!initializationState.error && initializationState.retryCount < 3,
    maxRetriesReached: initializationState.retryCount >= 3,
    
    // ✅ ESTADOS ADICIONALES ÚTILES
    hasInitializationError: !!initializationState.error,
    isReadyForInteraction: isInitializationReady() && !fetchingRelated && !initializationState.error
  };
};