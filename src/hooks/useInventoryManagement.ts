// hooks/useInventoryManagement.ts - VERSIÓN ENTERPRISE v8.2 CORREGIDA TYPES
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  getCurrentTimestamp, 
  getTodayInMexico 
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { colorTokens } from '@/theme';

// ✅ IMPORTAR INTERFACES CENTRALIZADAS v8.2 - CORREGIDO IMPORTS
import { 
  Warehouse, 
  WarehouseBasic,
  WarehouseType,
  ProductWarehouseStock 
} from '@/types/warehouse';

// ✅ TIPOS DE MOVIMIENTO ENTERPRISE v8.2 - MULTI-ALMACÉN
export type MovementType = 
  | 'venta_directa' | 'venta_apartado' | 'reserva_apartado' | 'cancelar_reserva'
  | 'devolucion' | 'recepcion_compra' | 'ajuste_manual_mas' | 'ajuste_manual_menos'
  | 'transferencia_entrada' | 'transferencia_salida' | 'merma' | 'inventario_inicial';

export type MovementCategory = 'sales' | 'layaway' | 'adjustment' | 'transfer' | 'purchase' | 'loss';
export type StockStatus = 'available' | 'reserved' | 'critical' | 'out_of_stock' | 'overstock';

// ✅ INTERFACES ENTERPRISE v8.2 - SINCRONIZADAS CON BD
export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id?: string | null; // ✅ MULTI-ALMACÉN v8.2 - Permitir null
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  // ✅ RELACIONES EXPANDIDAS v8.2 - USANDO TIPOS CENTRALIZADOS
  products?: ProductInfo;
  Users?: UserInfo;
  warehouses?: WarehouseBasic; // ✅ CORREGIDO: Usar interface centralizada
}

export interface ProductInfo {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  unit?: string;
  // ✅ ELIMINADO: location (no existe en BD real)
  status?: StockStatus;
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
}

// ✅ ELIMINADA: WarehouseInfo duplicada - usar Warehouse centralizada

export interface StockOperation {
  product_id: string;
  warehouse_id?: string | null; // ✅ MULTI-ALMACÉN v8.2 - Permitir null
  quantity: number;
  movement_type: MovementType;
  reference_id?: string;
  reason?: string;
  notes?: string;
  unit_cost?: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalMovements: number;
  criticalProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  movementsToday: number;
  lastMovementAt: string | null;
  topMovementType: MovementType | null;
}

export interface StockValidation {
  isValid: boolean;
  availableStock: number;
  requiredStock: number;
  message: string;
  severity: 'success' | 'warning' | 'error';
}

// ✅ HOOK ENTERPRISE v8.2 - ORDEN CORRECTO DE HOOKS
export const useInventoryManagement = () => {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (buenas prácticas v8.2)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMovement, setLastMovement] = useState<InventoryMovement | null>(null);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM REALES (orden v8.2)
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getTableAuditInfo } = useUserTracking();
  const supabase = createBrowserSupabaseClient();

  // ✅ 3. HOOKS DE EFECTO (después de state y custom)
  useEffect(() => {
    if (hydrated) {
      console.log(`✅ [v8.2] useInventoryManagement inicializado - Multi-almacén ACTIVO`);
      // Cargar estadísticas iniciales si es necesario
      loadInventoryStats();
    }
  }, [hydrated]);

  // ✅ 4. HOOKS DE CALLBACK Y MEMO (al final)
  
  // ✅ FUNCIÓN CARGAR ESTADÍSTICAS v8.2
  const loadInventoryStats = useCallback(async (): Promise<void> => {
    if (!hydrated) return;
    
    try {
      // Implementar carga de estadísticas básicas
      const today = getTodayInMexico();
      console.log(`📊 [v8.2] Cargando estadísticas de inventario para: ${today}`);
      
      // Por ahora estadísticas básicas - se puede expandir
      setStats({
        totalProducts: 0,
        totalMovements: 0,
        criticalProducts: 0,
        outOfStockProducts: 0,
        totalStockValue: 0,
        movementsToday: 0,
        lastMovementAt: null,
        topMovementType: null
      });
    } catch (err: any) {
      console.error('❌ Error cargando estadísticas:', err);
    }
  }, [hydrated]);

  // ✅ OBTENER STOCK DISPONIBLE v8.2 - MULTI-ALMACÉN CORREGIDO
  const getAvailableStock = useCallback(async (
    productId: string, 
    warehouseId?: string | null // ✅ CORREGIDO: null también válido
  ): Promise<number> => {
    if (!hydrated) {
      console.warn('Sistema inicializando...');
      return 0;
    }

    try {
      console.log(`🔍 [v8.2] Consultando stock: ${productId}${warehouseId ? ` en almacén ${warehouseId}` : ''}`);
      
      const { data, error } = await supabase
        .rpc('get_available_stock', { 
          p_product_id: productId,
          p_warehouse_id: warehouseId || null
        });
      
      if (error) {
        console.error('❌ Error en get_available_stock:', error);
        throw error;
      }

      const availableStock = data || 0;
      console.log(`✅ [v8.2] Stock disponible: ${availableStock}`);
      
      return availableStock;
    } catch (err: any) {
      const errorMsg = `Error consultando stock: ${err.message}`;
      console.error('❌', errorMsg);
      notify.error(errorMsg);
      throw new Error(errorMsg);
    }
  }, [hydrated, supabase]);

  // ✅ VALIDAR STOCK DISPONIBLE v8.2 - MEJORADA CON NULL CHECKS
  const checkAvailableStock = useCallback(async (
    productId: string, 
    requiredQuantity: number,
    warehouseId?: string | null // ✅ CORREGIDO: null también válido
  ): Promise<StockValidation> => {
    if (!hydrated) {
      return {
        isValid: false,
        availableStock: 0,
        requiredStock: requiredQuantity,
        message: 'Sistema inicializando...',
        severity: 'warning'
      };
    }

    try {
      console.log(`🔍 [v8.2] Validando stock: ${productId}, cantidad: ${requiredQuantity}`);
      
      const { data, error } = await supabase
        .rpc('check_available_stock', { 
          p_product_id: productId, 
          p_required_quantity: requiredQuantity,
          p_warehouse_id: warehouseId || null
        });
      
      if (error) throw error;
      
      const availableStock = await getAvailableStock(productId, warehouseId);
      const isValid = data || false;
      
      const validation: StockValidation = {
        isValid,
        availableStock,
        requiredStock: requiredQuantity,
        message: isValid 
          ? `Stock suficiente: ${availableStock} disponible`
          : `Stock insuficiente: ${availableStock} disponible, ${requiredQuantity} requerido`,
        severity: isValid ? 'success' : 'error'
      };
      
      console.log(`✅ [v8.2] Validación completada:`, validation);
      return validation;
    } catch (err: any) {
      const errorMsg = `Error validando stock: ${err.message}`;
      console.error('❌', errorMsg);
      notify.error(errorMsg);
      
      return {
        isValid: false,
        availableStock: 0,
        requiredStock: requiredQuantity,
        message: errorMsg,
        severity: 'error'
      };
    }
  }, [hydrated, supabase, getAvailableStock]);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA v8.2 - REGISTRAR MOVIMIENTO CON NULL CHECKS
  const recordMovement = useCallback(async (operation: StockOperation): Promise<InventoryMovement> => {
    if (!hydrated) {
      notify.error('Sistema no inicializado');
      throw new Error('Sistema no inicializado');
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 [v8.2] Iniciando registro de movimiento:`, {
        type: operation.movement_type,
        product: operation.product_id,
        quantity: operation.quantity,
        warehouse: operation.warehouse_id || 'TIENDA_01'
      });

      // 1. ✅ OBTENER STOCK ACTUAL ANTES DEL MOVIMIENTO
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock, name, sku')
        .eq('id', operation.product_id)
        .single();

      if (productError) {
        console.error('❌ Error obteniendo producto:', productError);
        throw new Error(`Producto no encontrado: ${productError.message}`);
      }
      
      const previousStock = currentProduct.current_stock || 0;
      console.log(`📦 [v8.2] Stock actual de ${currentProduct.name}: ${previousStock}`);

      // 2. ✅ CALCULAR NEW_STOCK DESPUÉS DEL MOVIMIENTO
      let newStock: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        newStock = previousStock + Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        newStock = previousStock - Math.abs(operation.quantity);
      } else {
        newStock = previousStock; // reserva_apartado, cancelar_reserva no afectan stock físico
      }

      newStock = Math.max(0, newStock);

      // 3. ✅ PREPARAR QUANTITY CON SIGNO CORRECTO
      let signedQuantity: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        signedQuantity = Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        signedQuantity = -Math.abs(operation.quantity);
      } else {
        signedQuantity = operation.quantity; // Para reservas
      }

      // 4. ✅ PREPARAR DATOS CON AUDITORÍA AUTOMÁTICA v8.2
      console.log(`🔍 [v8.2] Aplicando auditoría para inventory_movements...`);
      const movementData = await addAuditFieldsFor('inventory_movements', {
        product_id: operation.product_id,
        warehouse_id: operation.warehouse_id || null, // ✅ CORREGIDO: null válido
        movement_type: operation.movement_type,
        quantity: signedQuantity,
        previous_stock: previousStock,
        new_stock: newStock,
        unit_cost: operation.unit_cost || 0,
        total_cost: operation.unit_cost ? (operation.unit_cost * Math.abs(operation.quantity)) : 0,
        reason: operation.reason || `Movimiento: ${operation.movement_type.replace('_', ' ')}`,
        reference_id: operation.reference_id,
        notes: operation.notes
      }, false);

      console.log(`✅ [v8.2] Datos preparados con auditoría:`, {
        movement_type: movementData.movement_type,
        quantity: movementData.quantity,
        created_by: movementData.created_by?.substring(0, 8) + '...'
      });

      // 5. ✅ INSERTAR MOVIMIENTO - TRIGGER ACTUALIZA STOCK AUTOMÁTICAMENTE
      const { data: movementResult, error: insertError } = await supabase
        .from('inventory_movements')
        .insert([movementData])
        .select(`
          *,
          products!inner (
            id, name, sku, category, current_stock,
            reserved_stock, min_stock, max_stock, unit
          ),
          Users:Users!inventory_movements_created_by_fkey (
            id, "firstName", "lastName", email, "profilePictureUrl"
          )
        `)
        .single();

      if (insertError) {
        console.error('❌ Error insertando movimiento:', insertError);
        throw new Error(`Error registrando movimiento: ${insertError.message}`);
      }

      console.log(`✅ [v8.2] Movimiento registrado exitosamente - ID: ${movementResult.id}`);
      console.log(`🔧 [v8.2] Trigger automático actualizó stock de ${previousStock} → ${newStock}`);
      
      // 6. ✅ FORMATEAR RESULTADO v8.2 CON NULL CHECKS
      const formattedMovement: InventoryMovement = {
        id: movementResult.id,
        product_id: movementResult.product_id,
        warehouse_id: movementResult.warehouse_id,
        movement_type: movementResult.movement_type,
        quantity: movementResult.quantity,
        previous_stock: movementResult.previous_stock,
        new_stock: movementResult.new_stock,
        unit_cost: movementResult.unit_cost || 0,
        total_cost: movementResult.total_cost || 0,
        reason: movementResult.reason,
        reference_id: movementResult.reference_id,
        notes: movementResult.notes,
        created_at: movementResult.created_at,
        created_by: movementResult.created_by,
        products: movementResult.products ? {
          id: movementResult.products.id,
          name: movementResult.products.name,
          sku: movementResult.products.sku,
          category: movementResult.products.category,
          current_stock: movementResult.products.current_stock,
          reserved_stock: movementResult.products.reserved_stock,
          min_stock: movementResult.products.min_stock,
          max_stock: movementResult.products.max_stock,
          unit: movementResult.products.unit
        } : undefined,
        Users: movementResult.Users ? {
          id: movementResult.Users.id,
          firstName: movementResult.Users.firstName,
          lastName: movementResult.Users.lastName,
          email: movementResult.Users.email,
          profilePictureUrl: movementResult.Users.profilePictureUrl
        } : undefined
      };
      
      setLastMovement(formattedMovement);
      
      // ✅ NOTIFICACIÓN v8.2 CORREGIDA
      notify.success(`Movimiento registrado: ${operation.movement_type.replace('_', ' ')} - ${currentProduct.name}`);
      
      return formattedMovement;

    } catch (err: any) {
      const errorMsg = `Error registrando movimiento: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      console.error('❌ [v8.2] Error completo en recordMovement:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hydrated, addAuditFieldsFor, supabase]);

  // ✅ OBTENER MOVIMIENTOS RECIENTES v8.2 - CON NULL CHECKS MEJORADOS
  const getRecentMovements = useCallback(async (
    limit: number = 10,
    warehouseId?: string | null, // ✅ CORREGIDO: null válido
    productId?: string | null    // ✅ CORREGIDO: null válido
  ): Promise<InventoryMovement[]> => {
    if (!hydrated) {
      console.warn('Sistema inicializando...');
      return [];
    }

    try {
      console.log(`🔍 [v8.2] Obteniendo movimientos recientes - Límite: ${limit}`);
      
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          products!inner (
            id, name, sku, category, current_stock,
            reserved_stock, min_stock, max_stock, unit
          ),
          Users:Users!inventory_movements_created_by_fkey (
            id, "firstName", "lastName", email, "profilePictureUrl"
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // ✅ FILTROS OPCIONALES v8.2 CON NULL CHECKS
      if (warehouseId && warehouseId.trim() !== '') {
        query = query.eq('warehouse_id', warehouseId);
      }
      if (productId && productId.trim() !== '') {
        query = query.eq('product_id', productId);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error('❌ Error en getRecentMovements:', error);
        throw error;
      }

      console.log(`✅ [v8.2] Movimientos obtenidos: ${data?.length || 0}`);
      
      // ✅ MAPEAR DATOS v8.2 CON VALIDACIÓN MEJORADA
      const movements = (data || []).map((item: any): InventoryMovement => ({
        id: item.id,
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        movement_type: item.movement_type,
        quantity: item.quantity,
        previous_stock: item.previous_stock || 0,
        new_stock: item.new_stock || 0,
        unit_cost: item.unit_cost || 0,
        total_cost: item.total_cost || 0,
        reason: item.reason,
        reference_id: item.reference_id,
        notes: item.notes,
        created_at: item.created_at,
        created_by: item.created_by,
        products: item.products ? {
          id: item.products.id,
          name: item.products.name,
          sku: item.products.sku,
          category: item.products.category,
          current_stock: item.products.current_stock || 0,
          reserved_stock: item.products.reserved_stock || 0,
          min_stock: item.products.min_stock || 0,
          max_stock: item.products.max_stock,
          unit: item.products.unit
        } : undefined,
        Users: item.Users ? {
          id: item.Users.id,
          firstName: item.Users.firstName,
          lastName: item.Users.lastName,
          email: item.Users.email,
          profilePictureUrl: item.Users.profilePictureUrl
        } : undefined
      }));

      return movements;
    } catch (err: any) {
      const errorMsg = `Error obteniendo movimientos: ${err.message}`;
      console.error('❌ [v8.2]', errorMsg);
      notify.error(errorMsg);
      throw new Error(errorMsg);
    }
  }, [hydrated, supabase]);

  // ✅ OPERACIONES DE NEGOCIO ESPECÍFICAS v8.2 - CON NULL CHECKS

  const processSale = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string,
    warehouseId?: string | null // ✅ CORREGIDO: null válido
  ): Promise<void> => {
    console.log(`🛒 [v8.2] Procesando venta - Producto: ${productId}, Cantidad: ${quantity}`);
    
    const validation = await checkAvailableStock(productId, quantity, warehouseId);
    if (!validation.isValid) {
      notify.error(validation.message);
      throw new Error(validation.message);
    }

    await recordMovement({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: quantity,
      movement_type: 'venta_directa',
      reference_id: saleId,
      reason: 'Venta directa en punto de venta'
    });
    
    console.log(`✅ [v8.2] Venta procesada exitosamente`);
  }, [checkAvailableStock, recordMovement]);

  const createLayaway = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string,
    warehouseId?: string | null // ✅ CORREGIDO: null válido
  ): Promise<void> => {
    console.log(`📦 [v8.2] Creando apartado - Producto: ${productId}, Cantidad: ${quantity}`);
    
    const validation = await checkAvailableStock(productId, quantity, warehouseId);
    if (!validation.isValid) {
      notify.error(validation.message);
      throw new Error(validation.message);
    }

    await recordMovement({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: quantity,
      movement_type: 'reserva_apartado',
      reference_id: saleId,
      reason: 'Reserva de stock para apartado'
    });

    // ✅ ACTUALIZAR SALE CON TIMESTAMPS v8.2
    await supabase
      .from('sales')
      .update({ 
        requires_stock_reservation: true,
        stock_reserved_at: getCurrentTimestamp()
      })
      .eq('id', saleId);
      
    console.log(`✅ [v8.2] Apartado creado exitosamente`);
  }, [checkAvailableStock, recordMovement, supabase]);

  const adjustInventory = useCallback(async (
    productId: string, 
    quantity: number,
    reason: string,
    notes?: string,
    warehouseId?: string | null // ✅ CORREGIDO: null válido
  ): Promise<void> => {
    const movementType: MovementType = quantity > 0 ? 'ajuste_manual_mas' : 'ajuste_manual_menos';
    
    console.log(`🔧 [v8.2] Ajustando inventario: ${productId}, cantidad: ${quantity}, tipo: ${movementType}`);
    
    // ✅ CONFIRMACIÓN SIMPLE PARA AJUSTES GRANDES v8.2
    if (Math.abs(quantity) > 10) {
      const confirmed = window.confirm(
        `¿Estás seguro de ${quantity > 0 ? 'agregar' : 'reducir'} ${Math.abs(quantity)} unidades?`
      );
      
      if (!confirmed) {
        console.log(`❌ [v8.2] Ajuste cancelado por usuario`);
        return;
      }
    }
    
    await recordMovement({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: Math.abs(quantity),
      movement_type: movementType,
      reason: reason,
      notes: notes
    });
    
    console.log(`✅ [v8.2] Ajuste de inventario completado`);
  }, [recordMovement]);

  // ✅ COMPUTED VALUES v8.2 (useMemo)
  const movementCategories = useMemo(() => ({
    sales: ['venta_directa', 'venta_apartado'],
    layaway: ['reserva_apartado', 'cancelar_reserva'],
    adjustment: ['ajuste_manual_mas', 'ajuste_manual_menos'],
    transfer: ['transferencia_entrada', 'transferencia_salida'],
    purchase: ['recepcion_compra'],
    loss: ['merma']
  }), []);

  const auditInfo = useMemo(() => 
    getTableAuditInfo('inventory_movements'), 
    [getTableAuditInfo]
  );

  // ✅ RETURN INTERFACE v8.2 CON TIPOS CORREGIDOS
  return {
    // Estados
    loading,
    error,
    hydrated,
    lastMovement,
    stats,

    // ✅ CONSULTAS v8.2 - NULL SAFE
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements,
    recordMovement,

    // ✅ OPERACIONES DE NEGOCIO v8.2 - NULL SAFE
    processSale,
    createLayaway,
    adjustInventory,
    
    // ✅ UTILIDADES v8.2
    clearError: useCallback(() => setError(null), []),
    refreshStats: loadInventoryStats,
    
    // ✅ INFORMACIÓN v8.2
    movementCategories,
    auditInfo,
    
    // ✅ CONSTANTES v8.2
    MOVEMENT_TYPES: movementCategories,
    colorTokens: {
      inventory: {
        primary: colorTokens.brand,
        secondary: colorTokens.neutral400,
        accent: colorTokens.glow,
        background: colorTokens.neutral100,
        surface: colorTokens.neutral200
      }
    }
  };
};