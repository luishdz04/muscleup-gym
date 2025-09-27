// hooks/useUserTracking.ts - VERSIÓN CORREGIDA v8.1 MUSCLEUP
'use client';

import { useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export type AuditType = 'full_camel' | 'full_snake' | 'created_only' | 'updated_only' | 'timestamps_only' | 'none';

// ✅ CONFIGURACIÓN CORREGIDA BASADA EN ESQUEMA BD REAL MUSCLEUP v8.1
const TABLE_AUDIT_CONFIG: Record<string, AuditType> = {
  // 🎯 AUDITORÍA COMPLETA CAMELCASE
  'Users': 'full_camel', // createdBy, updatedBy, createdAt, updatedAt

  // 🎯 AUDITORÍA COMPLETA SNAKE_CASE 
  'user_memberships': 'full_snake',
  'membership_plans': 'full_snake',
  'cash_cuts': 'full_snake',
  'expenses': 'full_snake',
  'products': 'full_snake',
  'suppliers': 'full_snake',
  'purchase_orders': 'full_snake',

  // ⚠️ AUDITORÍA PARCIAL - SOLO CREATED_BY
  'coupons': 'created_only',
  'employees': 'created_only',
  
  // 🔥 CORRECCIÓN CRÍTICA: INVENTORY_MOVEMENTS NECESITA AUDITORÍA
  'inventory_movements': 'created_only', // ✅ CORREGIDO de 'none' a 'created_only'

  // ⚠️ AUDITORÍA PARCIAL - SOLO UPDATED_BY
  'sales': 'updated_only',

  // 🕒 SOLO TIMESTAMPS AUTOMÁTICOS
  'payment_commissions': 'timestamps_only',

  // ❌ SIN AUDITORÍA (resto de tablas)
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

export const useUserTracking = () => {
  const supabase = createBrowserSupabaseClient();
  
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, [supabase]);

  const getUTCTimestamp = useCallback((): string => {
    return new Date().toISOString();
  }, []);

  // ✅ FUNCIÓN PRINCIPAL INTELIGENTE CORREGIDA
  const addAuditFields = useCallback(async (
    data: any, 
    isUpdate = false,
    tableName?: string
  ) => {
    if (!tableName) {
      console.warn('⚠️ Nombre de tabla no especificado - usando datos sin auditoría');
      return data;
    }

    const auditType = TABLE_AUDIT_CONFIG[tableName];
    const userId = await getCurrentUser();
    
    console.log(`🔍 Tabla: ${tableName} | Tipo: ${auditType} | Es update: ${isUpdate} | Usuario: ${userId}`);

    switch (auditType) {
      case 'full_camel': {
        // Users - camelCase completo
        if (isUpdate) {
          return { ...data, updatedBy: userId };
        } else {
          return { ...data, createdBy: userId, updatedBy: userId };
        }
      }

      case 'full_snake': {
        // user_memberships, membership_plans, products, etc. - snake_case completo
        if (isUpdate) {
          return { ...data, updated_by: userId };
        } else {
          return { ...data, created_by: userId, updated_by: userId };
        }
      }

      case 'created_only': {
        // 🔥 INVENTORY_MOVEMENTS ENTRA AQUÍ AHORA
        // coupons, employees, inventory_movements - solo created_by en INSERT
        if (isUpdate) {
          console.log(`⚠️ Tabla '${tableName}' solo tiene created_by - UPDATE sin auditoría de usuario`);
          return data; // Solo trigger maneja updated_at
        } else {
          console.log(`✅ Aplicando auditoría created_only para ${tableName} - created_by: ${userId}`);
          return { ...data, created_by: userId };
        }
      }

      case 'updated_only': {
        // sales - solo updated_by en UPDATE
        if (isUpdate) {
          return { ...data, updated_by: userId };
        } else {
          console.log(`⚠️ Tabla '${tableName}' solo tiene updated_by - INSERT sin created_by`);
          return data; // Solo timestamps automáticos
        }
      }

      case 'timestamps_only': {
        // payment_commissions - solo timestamps automáticos, sin user tracking
        console.log(`🕒 Tabla '${tableName}' solo usa timestamps automáticos - sin user tracking`);
        return data;
      }

      case 'none': {
        // addresses, emergency_contacts, etc. - sin auditoría
        console.log(`🔕 Tabla '${tableName}' sin auditoría - datos originales`);
        return data;
      }

      default: {
        console.warn(`❓ Tabla '${tableName}' no configurada - usando datos sin auditoría`);
        return data;
      }
    }
  }, [getCurrentUser]);

  // ✅ FUNCIÓN DE CONVENIENCIA PRINCIPAL
  const addAuditFieldsFor = useCallback(async (
    tableName: string,
    data: any,
    isUpdate = false
  ) => {
    return addAuditFields(data, isUpdate, tableName);
  }, [addAuditFields]);

  // ✅ FUNCIÓN PARA VERIFICAR CAPACIDADES DE UNA TABLA
  const getTableAuditInfo = useCallback((tableName: string) => {
    const auditType = TABLE_AUDIT_CONFIG[tableName];
    
    switch (auditType) {
      case 'full_camel':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: true,
          naming: 'camelCase',
          description: 'Auditoría completa con camelCase'
        };
      case 'full_snake':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: true,
          naming: 'snake_case',
          description: 'Auditoría completa con snake_case'
        };
      case 'created_only':
        return {
          hasAudit: true,
          hasCreatedBy: true,
          hasUpdatedBy: false,
          naming: 'snake_case',
          description: 'Solo created_by, updated_at por trigger (INVENTORY_MOVEMENTS)'
        };
      case 'updated_only':
        return {
          hasAudit: true,
          hasCreatedBy: false,
          hasUpdatedBy: true,
          naming: 'snake_case',
          description: 'Solo updated_by, created_at automático'
        };
      case 'timestamps_only':
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'none',
          description: 'Solo timestamps automáticos'
        };
      case 'none':
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'none',
          description: 'Sin auditoría'
        };
      default:
        return {
          hasAudit: false,
          hasCreatedBy: false,
          hasUpdatedBy: false,
          naming: 'unknown',
          description: 'Tabla no configurada'
        };
    }
  }, []);

  return { 
    getCurrentUser, 
    addAuditFields,
    addAuditFieldsFor,
    getTableAuditInfo,
    getUTCTimestamp,
    // Constantes para referencia
    AUDIT_TYPES: TABLE_AUDIT_CONFIG
  };
};

// ✅ INTERFACES EXPORTADAS
export interface TableAuditInfo {
  hasAudit: boolean;
  hasCreatedBy: boolean;
  hasUpdatedBy: boolean;
  naming: 'camelCase' | 'snake_case' | 'none' | 'unknown';
  description: string;
}

export interface UserTrackingHook {
  getCurrentUser: () => Promise<string | null>;
  addAuditFields: (data: any, isUpdate?: boolean, tableName?: string) => Promise<any>;
  addAuditFieldsFor: (tableName: string, data: any, isUpdate?: boolean) => Promise<any>;
  getTableAuditInfo: (tableName: string) => TableAuditInfo;
  getUTCTimestamp: () => string;
  AUDIT_TYPES: Record<string, AuditType>;
}