// hooks/useUserTracking.ts - VERSIÓN ENTERPRISE v8.2 MUSCLEUP CORREGIDA
'use client';

import { useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';

export type AuditType = 'full_camel' | 'full_snake' | 'created_only' | 'updated_only' | 'timestamps_only' | 'none';

// ✅ CONFIGURACIÓN ENTERPRISE v8.2 BASADA EN ESQUEMA BD REAL MUSCLEUP 
const TABLE_AUDIT_CONFIG: Record<string, AuditType> = {
  // 🎯 AUDITORÍA COMPLETA CAMELCASE
  'Users': 'full_camel', // createdBy, updatedBy, createdAt, updatedAt

  // 🎯 AUDITORÍA COMPLETA SNAKE_CASE - MULTI-ALMACÉN v8.2
  'user_memberships': 'full_snake',
  'membership_plans': 'full_snake',
  'cash_cuts': 'full_snake',
  'expenses': 'full_snake',
  'products': 'full_snake',
  'suppliers': 'full_snake',
  'purchase_orders': 'full_snake',
  'warehouses': 'full_snake', // ✅ MULTI-ALMACÉN v8.2
  'product_warehouse_stock': 'full_snake', // ✅ MULTI-ALMACÉN v8.2

  // ⚠️ AUDITORÍA PARCIAL - SOLO CREATED_BY
  'coupons': 'created_only',
  'employees': 'created_only',
  'inventory_movements': 'created_only', // ✅ CORRECCIÓN CRÍTICA v8.2

  // ⚠️ AUDITORÍA PARCIAL - SOLO UPDATED_BY  
  'sales': 'updated_only',

  // 🕒 SOLO TIMESTAMPS AUTOMÁTICOS
  'payment_commissions': 'timestamps_only',

  // ❌ SIN AUDITORÍA (resto de tablas v8.2)
  'addresses': 'none',
  'emergency_contacts': 'none',
  'membership_info': 'none',
  'membership_payment_details': 'none',
  'biometric_devices': 'none',
  'access_control_config': 'none',
  'access_logs': 'none',
  'device_user_mappings': 'none',
  'fingerprint_templates': 'none',
  'temporary_access': 'none',
  'layaway_status_history': 'none',
  'refunds': 'none',
  'refund_items': 'none',
  'sale_edit_history': 'none',
  'sale_items': 'none',
  'sale_payment_details': 'none',
  'store_credits': 'none',
  'plan_access_restrictions': 'none',
  'plan_f22_group_mappings': 'none',
  'special_access_schedules': 'none',
  'system_logs': 'none',
  'trigger_logs': 'none'
};

// ✅ INTERFACES ENTERPRISE v8.2
export interface TableAuditInfo {
  hasAudit: boolean;
  hasCreatedBy: boolean;
  hasUpdatedBy: boolean;
  naming: 'camelCase' | 'snake_case' | 'none' | 'unknown';
  description: string;
  auditType: AuditType;
  tableCategory: 'core' | 'inventory' | 'membership' | 'sales' | 'system' | 'biometric';
}

export interface UserTrackingStats {
  tablesWithAudit: number;
  tablesWithoutAudit: number;
  auditCoverage: number;
  lastAuditUser: string | null;
  lastAuditTimestamp: string | null;
}

export interface UserTrackingHook {
  // ✅ ESTADOS v8.2
  hydrated: boolean;
  loading: boolean;
  
  // ✅ FUNCIONES PRINCIPALES v8.2
  getCurrentUser: () => Promise<string | null>;
  addAuditFields: (data: any, isUpdate?: boolean, tableName?: string) => Promise<any>;
  addAuditFieldsFor: (tableName: string, data: any, isUpdate?: boolean) => Promise<any>;
  getTableAuditInfo: (tableName: string) => TableAuditInfo;
  
  // ✅ UTILIDADES ENTERPRISE v8.2
  getUTCTimestamp: () => string;
  validateAuditData: (tableName: string, data: any) => boolean;
  getAuditStats: () => UserTrackingStats;
  
  // ✅ CONSTANTES v8.2
  AUDIT_TYPES: Record<string, AuditType>;
  AUDIT_CONFIG: Record<string, AuditType>;
}

export const useUserTracking = (): UserTrackingHook => {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (buenas prácticas v8.2)
  const hydrated = useHydrated();
  
  // ✅ 2. HOOKS DE CONTEXT/CUSTOM (orden v8.2)
  const supabase = createBrowserSupabaseClient();
  
  // ✅ 3. FUNCIONES PRINCIPALES (useCallback v8.2)
  const getCurrentUser = useCallback(async (): Promise<string | null> => {
    if (!hydrated) {
      console.warn('⚠️ useUserTracking: Sistema no hidratado - retornando null');
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
        notify.error('Error de autenticación');
        return null;
      }
      
      return user?.id || null;
    } catch (err: any) {
      console.error('❌ Error crítico en getCurrentUser:', err);
      notify.error('Error crítico de autenticación');
      return null;
    }
  }, [hydrated, supabase]);

  // ✅ TIMESTAMP CENTRALIZADO v8.2 - USA DATEUTILS
  const getUTCTimestamp = useCallback((): string => {
    return getCurrentTimestamp(); // ✅ CORREGIDO: Usa dateUtils en lugar de new Date()
  }, []);

  // ✅ FUNCIÓN PRINCIPAL INTELIGENTE v8.2 OPTIMIZADA
  const addAuditFields = useCallback(async (
    data: any, 
    isUpdate = false,
    tableName?: string
  ): Promise<any> => {
    if (!hydrated) {
      console.warn('⚠️ Sistema no hidratado - aplicando datos sin auditoría');
      return data;
    }

    if (!tableName) {
      console.warn('⚠️ Nombre de tabla no especificado - usando datos sin auditoría');
      return data;
    }

    const auditType = TABLE_AUDIT_CONFIG[tableName];
    
    if (!auditType) {
      console.warn(`❓ Tabla '${tableName}' no configurada en v8.2 - usando datos sin auditoría`);
      return data;
    }

    try {
      const userId = await getCurrentUser();
      
      if (!userId && auditType !== 'timestamps_only' && auditType !== 'none') {
        console.warn('⚠️ Usuario no autenticado - aplicando datos sin auditoría de usuario');
        return data;
      }
      
      console.log(`🔍 [v8.2] Tabla: ${tableName} | Tipo: ${auditType} | Update: ${isUpdate} | Usuario: ${userId?.substring(0, 8)}...`);

      switch (auditType) {
        case 'full_camel': {
          // Users - camelCase completo v8.2
          if (isUpdate) {
            return { 
              ...data, 
              updatedBy: userId,
              updatedAt: getUTCTimestamp()
            };
          } else {
            return { 
              ...data, 
              createdBy: userId, 
              updatedBy: userId,
              createdAt: getUTCTimestamp(),
              updatedAt: getUTCTimestamp()
            };
          }
        }

        case 'full_snake': {
          // products, user_memberships, warehouses, etc. - snake_case completo v8.2
          if (isUpdate) {
            return { 
              ...data, 
              updated_by: userId,
              updated_at: getUTCTimestamp()
            };
          } else {
            return { 
              ...data, 
              created_by: userId, 
              updated_by: userId,
              created_at: getUTCTimestamp(),
              updated_at: getUTCTimestamp()
            };
          }
        }

        case 'created_only': {
          // inventory_movements, coupons, employees - solo created_by en INSERT v8.2
          if (isUpdate) {
            console.log(`⚠️ [v8.2] Tabla '${tableName}' solo tiene created_by - UPDATE sin auditoría de usuario`);
            return data; // Solo trigger maneja updated_at
          } else {
            console.log(`✅ [v8.2] Aplicando auditoría created_only para ${tableName}`);
            return { 
              ...data, 
              created_by: userId,
              created_at: getUTCTimestamp()
            };
          }
        }

        case 'updated_only': {
          // sales - solo updated_by en UPDATE v8.2
          if (isUpdate) {
            return { 
              ...data, 
              updated_by: userId,
              updated_at: getUTCTimestamp()
            };
          } else {
            console.log(`⚠️ [v8.2] Tabla '${tableName}' solo tiene updated_by - INSERT sin created_by`);
            return { 
              ...data,
              created_at: getUTCTimestamp()
            };
          }
        }

        case 'timestamps_only': {
          // payment_commissions - solo timestamps automáticos v8.2
          console.log(`🕒 [v8.2] Tabla '${tableName}' solo usa timestamps automáticos`);
          return {
            ...data,
            created_at: getUTCTimestamp(),
            updated_at: getUTCTimestamp()
          };
        }

        case 'none': {
          // addresses, emergency_contacts, etc. - sin auditoría v8.2
          console.log(`🔕 [v8.2] Tabla '${tableName}' sin auditoría - datos originales`);
          return data;
        }

        default: {
          console.warn(`❓ [v8.2] Tabla '${tableName}' tipo auditoría desconocido: ${auditType}`);
          return data;
        }
      }
    } catch (err: any) {
      console.error(`❌ [v8.2] Error aplicando auditoría a tabla '${tableName}':`, err);
      notify.error(`Error en auditoría: ${err.message}`);
      return data; // Retornar datos originales en caso de error
    }
  }, [hydrated, getCurrentUser, getUTCTimestamp]);

  // ✅ FUNCIÓN DE CONVENIENCIA PRINCIPAL v8.2
  const addAuditFieldsFor = useCallback(async (
    tableName: string,
    data: any,
    isUpdate = false
  ): Promise<any> => {
    return addAuditFields(data, isUpdate, tableName);
  }, [addAuditFields]);

  // ✅ INFORMACIÓN EXTENDIDA DE TABLA v8.2
  const getTableAuditInfo = useCallback((tableName: string): TableAuditInfo => {
    const auditType = TABLE_AUDIT_CONFIG[tableName];
    
    // ✅ CATEGORIZACIÓN DE TABLAS v8.2
    const getTableCategory = (table: string): TableAuditInfo['tableCategory'] => {
      if (['products', 'inventory_movements', 'warehouses', 'product_warehouse_stock'].includes(table)) return 'inventory';
      if (['Users', 'user_memberships', 'membership_plans'].includes(table)) return 'membership';
      if (['sales', 'sale_items', 'refunds'].includes(table)) return 'sales';
      if (['biometric_devices', 'fingerprint_templates', 'access_logs'].includes(table)) return 'biometric';
      if (['system_logs', 'trigger_logs'].includes(table)) return 'system';
      return 'core';
    };
    
    switch (auditType) {
      case 'full_camel':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: true,
          naming: 'camelCase',
          description: 'Auditoría completa con camelCase (Users únicamente)',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      case 'full_snake':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: true,
          naming: 'snake_case',
          description: 'Auditoría completa con snake_case (Mayoría de tablas)',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      case 'created_only':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: false,
          naming: 'snake_case',
          description: 'Solo created_by + timestamps automáticos (inventory_movements, coupons, employees)',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      case 'updated_only':
        return {
          hasAudit: true,
          hasCreatedBy: false,
          hasUpdatedBy: true,
          naming: 'snake_case',
          description: 'Solo updated_by + timestamps automáticos (sales)',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      case 'timestamps_only':
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'none',
          description: 'Solo timestamps automáticos sin user tracking',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      case 'none':
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'none',
          description: 'Sin auditoría (tablas de referencia y logs)',
          auditType,
          tableCategory: getTableCategory(tableName)
        };
      default:
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'unknown',
          description: 'Tabla no configurada en esquema v8.2',
          auditType: 'none',
          tableCategory: 'core'
        };
    }
  }, []);

  // ✅ VALIDACIÓN DE DATOS v8.2
  const validateAuditData = useCallback((tableName: string, data: any): boolean => {
    if (!tableName || !data) return false;
    
    const auditInfo = getTableAuditInfo(tableName);
    
    // Validar que tenga los campos requeridos según tipo de auditoría
    switch (auditInfo.auditType) {
      case 'full_camel':
        return auditInfo.naming === 'camelCase' && 
               (data.createdBy !== undefined || data.updatedBy !== undefined);
      case 'full_snake':
        return auditInfo.naming === 'snake_case' && 
               (data.created_by !== undefined || data.updated_by !== undefined);
      case 'created_only':
        return data.created_by !== undefined;
      case 'updated_only':
        return data.updated_by !== undefined;
      default:
        return true; // timestamps_only y none siempre válidos
    }
  }, [getTableAuditInfo]);

  // ✅ ESTADÍSTICAS DE AUDITORÍA v8.2
  const getAuditStats = useCallback((): UserTrackingStats => {
    const tables = Object.keys(TABLE_AUDIT_CONFIG);
    const withAudit = tables.filter(table => {
      const type = TABLE_AUDIT_CONFIG[table];
      return type !== 'none' && type !== 'timestamps_only';
    });
    
    return {
      tablesWithAudit: withAudit.length,
      tablesWithoutAudit: tables.length - withAudit.length,
      auditCoverage: Math.round((withAudit.length / tables.length) * 100),
      lastAuditUser: null, // Se puede implementar si se necesita
      lastAuditTimestamp: getUTCTimestamp()
    };
  }, [getUTCTimestamp]);

  return { 
    // ✅ ESTADOS v8.2
    hydrated,
    loading: !hydrated,
    
    // ✅ FUNCIONES PRINCIPALES v8.2
    getCurrentUser, 
    addAuditFields,
    addAuditFieldsFor,
    getTableAuditInfo,
    
    // ✅ UTILIDADES ENTERPRISE v8.2
    getUTCTimestamp,
    validateAuditData,
    getAuditStats,
    
    // ✅ CONSTANTES v8.2
    AUDIT_TYPES: TABLE_AUDIT_CONFIG,
    AUDIT_CONFIG: TABLE_AUDIT_CONFIG
  };
};