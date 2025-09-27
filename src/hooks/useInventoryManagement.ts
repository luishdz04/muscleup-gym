// ✅ HOOK INVENTARIO MUSCLEUP v8.1 - ROLLBACK A VERSIÓN FUNCIONANDO
// src/hooks/useInventoryManagement.ts

'use client';

import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { getCurrentTimestamp } from '@/utils/dateUtils';

// ✅ TIPOS DE MOVIMIENTO IMPLEMENTADOS SEGÚN BD
export type MovementType = 
  | 'venta_directa' | 'venta_apartado' | 'reserva_apartado' | 'cancelar_reserva'
  | 'devolucion' | 'recepcion_compra' | 'ajuste_manual_mas' | 'ajuste_manual_menos'
  | 'transferencia_entrada' | 'transferencia_salida' | 'merma' | 'inventario_inicial';

// ✅ INTERFACE ORIGINAL FUNCIONANDO - SIN CAMBIOS DRÁSTICOS
export interface InventoryMovement {
  id: string;
  product_id: string;
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
  // ✅ MANTENER COMO OBJECT ÚNICO PERO OPCIONAL
  products?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    current_stock: number;
    reserved_stock?: number;
    min_stock: number;
    max_stock?: number;
    unit?: string;
    location?: string;
  };
  // ✅ MANTENER COMO OBJECT ÚNICO PERO OPCIONAL
  Users?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
  };
}

export interface StockOperation {
  product_id: string;
  quantity: number;
  movement_type: MovementType;
  reference_id?: string;
  reason?: string;
  notes?: string;
}

// ✅ HOOK SIMPLIFICADO - ENFOQUE EN QUE FUNCIONE
export const useInventoryManagement = () => {
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ OBTENER STOCK DISPONIBLE - FUNCIONANDO
  const getAvailableStock = useCallback(async (productId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_stock', { p_product_id: productId });
      
      if (error) throw error;
      return data || 0;
    } catch (err: any) {
      console.error('Error obteniendo stock disponible:', err);
      throw new Error(`Error al consultar stock: ${err.message}`);
    }
  }, [supabase]);

  // ✅ VALIDAR STOCK DISPONIBLE - FUNCIONANDO
  const checkAvailableStock = useCallback(async (
    productId: string, 
    requiredQuantity: number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_available_stock', { 
          p_product_id: productId, 
          p_required_quantity: requiredQuantity 
        });
      
      if (error) throw error;
      return data || false;
    } catch (err: any) {
      console.error('Error validando stock:', err);
      throw new Error(`Error al validar stock: ${err.message}`);
    }
  }, [supabase]);

  // ✅ REGISTRAR MOVIMIENTO - SIMPLIFICADO PARA QUE FUNCIONE
  const recordMovement = useCallback(async (operation: StockOperation): Promise<InventoryMovement> => {
    if (!hydrated) throw new Error('Sistema no inicializado');
    
    setLoading(true);
    setError(null);

    try {
      // Obtener stock actual ANTES del movimiento
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', operation.product_id)
        .single();

      if (productError) throw productError;
      
      const previousStock = currentProduct.current_stock;

      // Calcular new_stock DESPUÉS del movimiento
      let newStock: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        newStock = previousStock + Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        newStock = previousStock - Math.abs(operation.quantity);
      } else {
        newStock = previousStock;
      }

      newStock = Math.max(0, newStock);

      // Preparar QUANTITY con signo correcto
      let signedQuantity: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        signedQuantity = Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        signedQuantity = -Math.abs(operation.quantity);
      } else {
        signedQuantity = operation.quantity;
      }

      // Preparar datos con auditoría automática
      const movementData = await addAuditFieldsFor('inventory_movements', {
        product_id: operation.product_id,
        movement_type: operation.movement_type,
        quantity: signedQuantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: operation.reason,
        reference_id: operation.reference_id,
        notes: operation.notes,
        unit_cost: 0,
        total_cost: 0
      }, false);

      // ✅ INSERTAR Y RETORNAR DATO SIMPLE
      const { data: movementResult, error } = await supabase
        .from('inventory_movements')
        .insert([movementData])
        .select('*')
        .single();

      if (error) throw error;

      notify.success(`Movimiento registrado: ${operation.movement_type.replace('_', ' ')}`);
      
      // ✅ RETORNAR CON DATOS MÍNIMOS PARA QUE FUNCIONE
      return {
        ...movementResult,
        unit_cost: movementResult.unit_cost || 0,
        total_cost: movementResult.total_cost || 0
      };

    } catch (err: any) {
      const errorMsg = `Error registrando movimiento: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hydrated, addAuditFieldsFor, supabase]);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA - QUERY SIMPLE QUE FUNCIONE
  const getRecentMovements = useCallback(async (limit: number = 10): Promise<InventoryMovement[]> => {
    try {
      console.log('🔍 Obteniendo movimientos recientes...');
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products!inner (
            id,
            name,
            sku,
            category,
            current_stock,
            reserved_stock,
            min_stock,
            max_stock,
            unit,
            location
          ),
          Users!created_by (
            id,
            firstName,
            lastName,
            email,
            profilePictureUrl
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('❌ Error en getRecentMovements:', error);
        throw error;
      }

      console.log('✅ Datos obtenidos:', data?.length || 0);
      console.log('🔍 Primer movimiento:', data?.[0]);
      console.log('🔍 Producto del primer movimiento:', data?.[0]?.products);
      console.log('🔍 Usuario del primer movimiento:', data?.[0]?.Users);
      
      // ✅ MAPEAR DATOS PARA ASEGURAR COMPATIBILIDAD
      const movements = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        movement_type: item.movement_type,
        quantity: item.quantity,
        previous_stock: item.previous_stock,
        new_stock: item.new_stock,
        unit_cost: item.unit_cost || 0,
        total_cost: item.total_cost || 0,
        reason: item.reason,
        reference_id: item.reference_id,
        notes: item.notes,
        created_at: item.created_at,
        created_by: item.created_by,
        // ✅ ASEGURAR QUE products EXISTA
        products: item.products ? {
          id: item.products.id,
          name: item.products.name,
          sku: item.products.sku,
          category: item.products.category,
          current_stock: item.products.current_stock,
          reserved_stock: item.products.reserved_stock,
          min_stock: item.products.min_stock,
          max_stock: item.products.max_stock,
          unit: item.products.unit,
          location: item.products.location
        } : undefined,
        // ✅ ASEGURAR QUE Users EXISTA
        Users: item.Users ? {
          id: item.Users.id,
          firstName: item.Users.firstName,
          lastName: item.Users.lastName,
          email: item.Users.email,
          profilePictureUrl: item.Users.profilePictureUrl
        } : undefined
      })) as InventoryMovement[];

      console.log('✅ Movimientos mapeados:', movements.length);
      console.log('🔍 Primer movimiento mapeado:', movements[0]);
      
      return movements;
    } catch (err: any) {
      console.error('❌ Error obteniendo movimientos recientes:', err);
      throw new Error(`Error al obtener movimientos: ${err.message}`);
    }
  }, [supabase]);

  // ✅ FUNCIÓN: Obtener movimiento específico POR ID - SIMPLIFICADA
  const getMovementById = useCallback(async (movementId: string): Promise<InventoryMovement | null> => {
    try {
      console.log('🔍 Obteniendo movimiento por ID:', movementId);
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products!inner (
            id,
            name,
            sku,
            category,
            current_stock,
            reserved_stock,
            min_stock,
            max_stock,
            unit,
            location
          ),
          Users!created_by (
            id,
            firstName,
            lastName,
            email,
            profilePictureUrl
          )
        `)
        .eq('id', movementId)
        .single();
        
      if (error) {
        console.error('❌ Error obteniendo movimiento por ID:', error);
        throw error;
      }

      console.log('✅ Movimiento obtenido:', data);
      
      // ✅ MAPEAR DATO ÚNICO
      const movement: InventoryMovement = {
        id: data.id,
        product_id: data.product_id,
        movement_type: data.movement_type,
        quantity: data.quantity,
        previous_stock: data.previous_stock,
        new_stock: data.new_stock,
        unit_cost: data.unit_cost || 0,
        total_cost: data.total_cost || 0,
        reason: data.reason,
        reference_id: data.reference_id,
        notes: data.notes,
        created_at: data.created_at,
        created_by: data.created_by,
        products: data.products ? {
          id: data.products.id,
          name: data.products.name,
          sku: data.products.sku,
          category: data.products.category,
          current_stock: data.products.current_stock,
          reserved_stock: data.products.reserved_stock,
          min_stock: data.products.min_stock,
          max_stock: data.products.max_stock,
          unit: data.products.unit,
          location: data.products.location
        } : undefined,
        Users: data.Users ? {
          id: data.Users.id,
          firstName: data.Users.firstName,
          lastName: data.Users.lastName,
          email: data.Users.email,
          profilePictureUrl: data.Users.profilePictureUrl
        } : undefined
      };

      console.log('✅ Movimiento mapeado:', movement);
      
      return movement;
    } catch (err: any) {
      console.error('❌ Error obteniendo movimiento específico:', err);
      throw new Error(`Error al obtener movimiento: ${err.message}`);
    }
  }, [supabase]);

  // ✅ FUNCIÓN: Obtener movimientos por producto - SIMPLIFICADA
  const getProductMovements = useCallback(async (
    productId: string, 
    limit: number = 20
  ): Promise<InventoryMovement[]> => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products!inner (
            id,
            name,
            sku,
            category,
            current_stock,
            reserved_stock,
            min_stock,
            max_stock,
            unit,
            location
          ),
          Users!created_by (
            id,
            firstName,
            lastName,
            email,
            profilePictureUrl
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;

      const movements = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        movement_type: item.movement_type,
        quantity: item.quantity,
        previous_stock: item.previous_stock,
        new_stock: item.new_stock,
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
          current_stock: item.products.current_stock,
          reserved_stock: item.products.reserved_stock,
          min_stock: item.products.min_stock,
          max_stock: item.products.max_stock,
          unit: item.products.unit,
          location: item.products.location
        } : undefined,
        Users: item.Users ? {
          id: item.Users.id,
          firstName: item.Users.firstName,
          lastName: item.Users.lastName,
          email: item.Users.email,
          profilePictureUrl: item.Users.profilePictureUrl
        } : undefined
      })) as InventoryMovement[];
      
      return movements;
    } catch (err: any) {
      console.error('Error obteniendo movimientos del producto:', err);
      throw new Error(`Error al obtener movimientos del producto: ${err.message}`);
    }
  }, [supabase]);

  // ✅ OPERACIONES ESPECÍFICAS DE NEGOCIO - SIN CAMBIOS
  const processSale = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string
  ): Promise<void> => {
    const hasStock = await checkAvailableStock(productId, quantity);
    if (!hasStock) {
      throw new Error('Stock insuficiente para la venta');
    }

    await recordMovement({
      product_id: productId,
      quantity: quantity,
      movement_type: 'venta_directa',
      reference_id: saleId,
      reason: 'Venta directa en punto de venta'
    });
  }, [checkAvailableStock, recordMovement]);

  const createLayaway = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string
  ): Promise<void> => {
    const hasStock = await checkAvailableStock(productId, quantity);
    if (!hasStock) {
      throw new Error('Stock insuficiente para apartar');
    }

    await recordMovement({
      product_id: productId,
      quantity: quantity,
      movement_type: 'reserva_apartado',
      reference_id: saleId,
      reason: 'Reserva de stock para apartado'
    });

    await supabase
      .from('sales')
      .update({ 
        requires_stock_reservation: true,
        stock_reserved_at: getCurrentTimestamp()
      })
      .eq('id', saleId);
  }, [checkAvailableStock, recordMovement, supabase]);

  const completeLayaway = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string
  ): Promise<void> => {
    try {
      await recordMovement({
        product_id: productId,
        quantity: quantity,
        movement_type: 'cancelar_reserva',
        reference_id: saleId,
        reason: 'Liberación de reserva al completar apartado'
      });

      await recordMovement({
        product_id: productId,
        quantity: quantity,
        movement_type: 'venta_apartado',
        reference_id: saleId,
        reason: 'Venta final de apartado completado'
      });

      await supabase
        .from('sales')
        .update({ 
          stock_released_at: getCurrentTimestamp(),
          status: 'completed'
        })
        .eq('id', saleId);

    } catch (err: any) {
      throw new Error(`Error completando apartado: ${err.message}`);
    }
  }, [recordMovement, supabase]);

  const cancelLayaway = useCallback(async (
    productId: string, 
    quantity: number, 
    saleId: string
  ): Promise<void> => {
    await recordMovement({
      product_id: productId,
      quantity: quantity,
      movement_type: 'cancelar_reserva',
      reference_id: saleId,
      reason: 'Cancelación de apartado'
    });

    await supabase
      .from('sales')
      .update({ 
        stock_released_at: getCurrentTimestamp(),
        status: 'cancelled'
      })
      .eq('id', saleId);
  }, [recordMovement, supabase]);

  const processRefund = useCallback(async (
    productId: string, 
    quantity: number, 
    refundId: string
  ): Promise<void> => {
    await recordMovement({
      product_id: productId,
      quantity: quantity,
      movement_type: 'devolucion',
      reference_id: refundId,
      reason: 'Devolución de cliente'
    });
  }, [recordMovement]);

  const receivePurchase = useCallback(async (
    productId: string, 
    quantity: number, 
    purchaseOrderId: string
  ): Promise<void> => {
    await recordMovement({
      product_id: productId,
      quantity: quantity,
      movement_type: 'recepcion_compra',
      reference_id: purchaseOrderId,
      reason: 'Recepción de mercancía de proveedor'
    });
  }, [recordMovement]);

  const adjustInventory = useCallback(async (
    productId: string, 
    quantity: number,
    reason: string,
    notes?: string
  ): Promise<void> => {
    const movementType: MovementType = quantity > 0 ? 'ajuste_manual_mas' : 'ajuste_manual_menos';
    
    await recordMovement({
      product_id: productId,
      quantity: Math.abs(quantity),
      movement_type: movementType,
      reason: reason,
      notes: notes
    });
  }, [recordMovement]);

  return {
    // Estados
    loading,
    error,
    hydrated,

    // ✅ CONSULTAS CORREGIDAS Y FUNCIONANDO
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements, // ✅ SIMPLIFICADO - DEBE FUNCIONAR
    getMovementById, // ✅ SIMPLIFICADO - DEBE FUNCIONAR  
    getProductMovements, // ✅ SIMPLIFICADO - DEBE FUNCIONAR

    // Operaciones básicas
    recordMovement,

    // Operaciones de negocio específicas
    processSale,
    createLayaway,
    completeLayaway,
    cancelLayaway,
    processRefund,
    receivePurchase,
    adjustInventory,

    // Utilidades
    clearError: () => setError(null)
  };
};