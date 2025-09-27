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

// ✅ INTERFACE INVENTORY MOVEMENT CORREGIDA
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
  created_by?: string; // ✅ AHORA SE REGISTRARÁ CORRECTAMENTE
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

// ✅ HOOK CORREGIDO - ELIMINANDO CÓDIGO REDUNDANTE
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

  // 🔥 FUNCIÓN PRINCIPAL CORREGIDA - SOLO INSERTA MOVIMIENTO, TRIGGER MANEJA STOCK
  const recordMovement = useCallback(async (operation: StockOperation): Promise<InventoryMovement> => {
    if (!hydrated) throw new Error('Sistema no inicializado');
    
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener stock actual ANTES del movimiento
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', operation.product_id)
        .single();

      if (productError) throw productError;
      
      const previousStock = currentProduct.current_stock;

      // 2. Calcular new_stock DESPUÉS del movimiento (solo para el registro)
      let newStock: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        newStock = previousStock + Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        newStock = previousStock - Math.abs(operation.quantity);
      } else {
        newStock = previousStock;
      }

      newStock = Math.max(0, newStock);

      // 3. Preparar QUANTITY con signo correcto para el registro
      let signedQuantity: number;
      
      if (['devolucion', 'recepcion_compra', 'ajuste_manual_mas', 'transferencia_entrada', 'inventario_inicial'].includes(operation.movement_type)) {
        signedQuantity = Math.abs(operation.quantity);
      } else if (['venta_directa', 'venta_apartado', 'ajuste_manual_menos', 'transferencia_salida', 'merma'].includes(operation.movement_type)) {
        signedQuantity = -Math.abs(operation.quantity);
      } else {
        signedQuantity = operation.quantity;
      }

      // 4. ✅ PREPARAR DATOS CON AUDITORÍA AUTOMÁTICA CORREGIDA
      console.log('🔍 Preparando movimiento con auditoría para inventory_movements...');
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

      console.log('✅ Datos con auditoría preparados:', movementData);

      // 5. ✅ INSERTAR MOVIMIENTO - EL TRIGGER SE ENCARGA DEL STOCK
      const { data: movementResult, error } = await supabase
        .from('inventory_movements')
        .insert([movementData])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error insertando movimiento:', error);
        throw error;
      }

      console.log('✅ Movimiento insertado exitosamente:', movementResult);
      
      // 6. ✅ EL TRIGGER update_product_stock() SE EJECUTA AUTOMÁTICAMENTE
      // NO HAY CÓDIGO PARA ACTUALIZAR products DIRECTAMENTE
      
      notify.success(`Movimiento registrado: ${operation.movement_type.replace('_', ' ')}`);
      
      return {
        ...movementResult,
        unit_cost: movementResult.unit_cost || 0,
        total_cost: movementResult.total_cost || 0
      };

    } catch (err: any) {
      const errorMsg = `Error registrando movimiento: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      console.error('❌ Error completo en recordMovement:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hydrated, addAuditFieldsFor, supabase]);

  // ✅ FUNCIÓN CORREGIDA PARA OBTENER MOVIMIENTOS RECIENTES
  const getRecentMovements = useCallback(async (limit: number = 10): Promise<InventoryMovement[]> => {
    try {
      console.log('🔍 Obteniendo movimientos recientes...');
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products!inner (
            id, name, sku, category, current_stock,
            reserved_stock, min_stock, max_stock, unit, location
          ),
          Users:Users!inventory_movements_created_by_fkey (
            id,
            "firstName",
            "lastName",
            email,
            "profilePictureUrl"
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('❌ Error en getRecentMovements:', error);
        throw error;
      }

      console.log('✅ Datos obtenidos:', data?.length || 0);
      
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
        created_by: item.created_by, // ✅ AHORA DEBERÍA TENER VALOR
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

      console.log('✅ Movimientos mapeados:', movements.length);
      
      return movements;
    } catch (err: any) {
      console.error('❌ Error obteniendo movimientos recientes:', err);
      throw new Error(`Error al obtener movimientos: ${err.message}`);
    }
  }, [supabase]);

  // ✅ OPERACIONES ESPECÍFICAS DE NEGOCIO CORREGIDAS
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

  // 🔥 FUNCIÓN CORREGIDA: SOLO REGISTRA MOVIMIENTO, NO ACTUALIZA STOCK DIRECTAMENTE
  const adjustInventory = useCallback(async (
    productId: string, 
    quantity: number,
    reason: string,
    notes?: string
  ): Promise<void> => {
    const movementType: MovementType = quantity > 0 ? 'ajuste_manual_mas' : 'ajuste_manual_menos';
    
    console.log(`🔧 Ajustando inventario: ${productId}, cantidad: ${quantity}, tipo: ${movementType}`);
    
    // ✅ SOLO REGISTRAR MOVIMIENTO - EL TRIGGER ACTUALIZA EL STOCK
    await recordMovement({
      product_id: productId,
      quantity: Math.abs(quantity),
      movement_type: movementType,
      reason: reason,
      notes: notes
    });
    
    console.log('✅ Ajuste de inventario completado - stock actualizado por trigger');
  }, [recordMovement]);

  return {
    // Estados
    loading,
    error,
    hydrated,

    // ✅ CONSULTAS CORREGIDAS Y FUNCIONANDO
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements, // ✅ CORREGIDO
    recordMovement,

    // Operaciones de negocio específicas
    processSale,
    createLayaway,
    completeLayaway,
    cancelLayaway,
    processRefund,
    receivePurchase,
    adjustInventory, // ✅ CORREGIDO

    // Utilidades
    clearError: () => setError(null)
  };
};