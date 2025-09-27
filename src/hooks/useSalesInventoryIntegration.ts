// ✅ HOOK INTEGRACIÓN VENTAS-INVENTARIO MUSCLEUP v7.0
// src/hooks/useSalesInventoryIntegration.ts

'use client';

import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { getCurrentTimestamp, getTodayInMexico } from '@/utils/dateUtils';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';

// ✅ INTERFACES PARA INTEGRACIÓN VENTAS-INVENTARIO
export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
}

export interface Sale {
  id?: string;
  sale_number: string;
  customer_id?: string;
  cashier_id: string;
  sale_type: 'sale' | 'layaway';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  required_deposit?: number;
  paid_amount?: number;
  pending_amount?: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'expired';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  requires_stock_reservation?: boolean;
  stock_reserved_at?: string;
  stock_released_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSaleRequest {
  customer_id?: string;
  sale_type: 'sale' | 'layaway';
  items: Omit<SaleItem, 'id' | 'sale_id'>[];
  payment_details?: {
    method: string;
    amount: number;
    reference?: string;
  }[];
  notes?: string;
  deposit_percentage?: number;
}

export interface RefundRequest {
  sale_id: string;
  items: {
    sale_item_id: string;
    quantity_refunded: number;
    refund_amount: number;
  }[];
  reason: string;
  refund_type: 'full' | 'partial';
}

// ✅ HOOK PRINCIPAL PARA GESTIÓN DE VENTAS CON INVENTARIO
export const useSalesInventoryIntegration = () => {
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  const {
    processSale,
    createLayaway,
    completeLayaway,
    cancelLayaway,
    processRefund,
    checkAvailableStock
  } = useInventoryManagement();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ GENERAR NÚMERO DE VENTA ÚNICO
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    const today = getTodayInMexico().replace(/-/g, '');
    
    const { data, error } = await supabase
      .from('sales')
      .select('sale_number')
      .like('sale_number', `${today}%`)
      .order('sale_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].sale_number;
      const lastSequence = parseInt(lastNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${today}${sequence.toString().padStart(4, '0')}`;
  }, [supabase]);

  // ✅ VALIDAR STOCK DISPONIBLE PARA TODOS LOS ITEMS
  const validateStockForItems = useCallback(async (items: SaleItem[]): Promise<{
    valid: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];

    for (const item of items) {
      try {
        const hasStock = await checkAvailableStock(item.product_id, item.quantity);
        if (!hasStock) {
          errors.push(`Stock insuficiente para ${item.product_name} (solicita: ${item.quantity})`);
        }
      } catch (err: any) {
        errors.push(`Error validando stock para ${item.product_name}: ${err.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, [checkAvailableStock]);

  // ✅ CREAR VENTA DIRECTA (CON MOVIMIENTOS DE INVENTARIO AUTOMÁTICOS)
  const createDirectSale = useCallback(async (request: CreateSaleRequest): Promise<Sale> => {
    if (!hydrated) throw new Error('Sistema no inicializado');
    
    setLoading(true);
    setError(null);

    try {
      // 1. Validar stock disponible
      const stockValidation = await validateStockForItems(request.items);
      if (!stockValidation.valid) {
        throw new Error(`Errores de stock:\n${stockValidation.errors.join('\n')}`);
      }

      // 2. Generar número de venta
      const saleNumber = await generateSaleNumber();

      // 3. Calcular totales
      const subtotal = request.items.reduce((sum, item) => sum + item.total_price, 0);
      const taxAmount = request.items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
      const discountAmount = request.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
      const totalAmount = subtotal + taxAmount - discountAmount;

      // 4. Crear venta con auditoría automática (tabla sales = updated_only)
      const saleData = await addAuditFieldsFor('sales', {
        sale_number: saleNumber,
        customer_id: request.customer_id,
        sale_type: 'sale',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: totalAmount,
        status: 'completed',
        payment_status: 'paid',
        requires_stock_reservation: false
      }, false);

      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // 5. Crear sale_items (sin auditoría)
      const saleItems = request.items.map(item => ({
        sale_id: saleResult.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 16,
        tax_amount: item.tax_amount || 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 6. Procesar movimientos de inventario para cada item
      for (const item of request.items) {
        await processSale(item.product_id, item.quantity, saleResult.id);
      }

      // 7. Crear detalles de pago si se proporcionan
      if (request.payment_details && request.payment_details.length > 0) {
        const paymentDetails = request.payment_details.map((payment, index) => ({
          sale_id: saleResult.id,
          payment_method: payment.method,
          amount: payment.amount,
          payment_reference: payment.reference,
          sequence_order: index + 1
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentDetails);

        if (paymentError) throw paymentError;
      }

      notify.success(`Venta ${saleNumber} creada exitosamente`);
      return saleResult;

    } catch (err: any) {
      const errorMsg = `Error creando venta: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hydrated, addAuditFieldsFor, supabase, validateStockForItems, generateSaleNumber, processSale]);

  // ✅ CREAR APARTADO (CON RESERVA DE STOCK)
  const createLayawaySale = useCallback(async (request: CreateSaleRequest): Promise<Sale> => {
    if (!hydrated) throw new Error('Sistema no inicializado');
    
    setLoading(true);
    setError(null);

    try {
      // 1. Validar stock disponible
      const stockValidation = await validateStockForItems(request.items);
      if (!stockValidation.valid) {
        throw new Error(`Errores de stock:\n${stockValidation.errors.join('\n')}`);
      }

      // 2. Generar número de venta
      const saleNumber = await generateSaleNumber();

      // 3. Calcular totales y depósito
      const subtotal = request.items.reduce((sum, item) => sum + item.total_price, 0);
      const taxAmount = request.items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
      const discountAmount = request.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      const depositPercentage = request.deposit_percentage || 50;
      const requiredDeposit = Math.round(totalAmount * (depositPercentage / 100));
      const paidAmount = request.payment_details?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pendingAmount = totalAmount - paidAmount;

      // 4. Crear apartado con auditoría automática
      const saleData = await addAuditFieldsFor('sales', {
        sale_number: saleNumber,
        customer_id: request.customer_id,
        sale_type: 'layaway',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        required_deposit: requiredDeposit,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        deposit_percentage: depositPercentage,
        status: paidAmount >= requiredDeposit ? 'pending' : 'pending',
        payment_status: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
        requires_stock_reservation: true,
        stock_reserved_at: getCurrentTimestamp(),
        layaway_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      }, false);

      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // 5. Crear sale_items
      const saleItems = request.items.map(item => ({
        sale_id: saleResult.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 16,
        tax_amount: item.tax_amount || 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 6. Reservar stock para cada item
      for (const item of request.items) {
        await createLayaway(item.product_id, item.quantity, saleResult.id);
      }

      // 7. Crear detalles de pago si se proporcionan
      if (request.payment_details && request.payment_details.length > 0) {
        const paymentDetails = request.payment_details.map((payment, index) => ({
          sale_id: saleResult.id,
          payment_method: payment.method,
          amount: payment.amount,
          payment_reference: payment.reference,
          sequence_order: index + 1
        }));

        const { error: paymentError } = await supabase
          .from('sale_payment_details')
          .insert(paymentDetails);

        if (paymentError) throw paymentError;
      }

      notify.success(`Apartado ${saleNumber} creado exitosamente`);
      return saleResult;

    } catch (err: any) {
      const errorMsg = `Error creando apartado: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hydrated, addAuditFieldsFor, supabase, validateStockForItems, generateSaleNumber, createLayaway]);

  // ✅ COMPLETAR APARTADO (LIBERAR RESERVA Y PROCESAR VENTA FINAL)
  const completeLayawayByRef = useCallback(async (saleId: string): Promise<Sale> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener detalles del apartado y sus items
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .eq('id', saleId)
        .eq('sale_type', 'layaway')
        .eq('status', 'pending')
        .single();

      if (saleError) throw saleError;
      if (!sale) throw new Error('Apartado no encontrado o ya completado');

      // 2. Completar apartado para cada item (liberar reserva + venta final)
      for (const item of sale.sale_items) {
        await completeLayaway(item.product_id, item.quantity, saleId);
      }

      // 3. Actualizar venta con auditoría automática (tabla sales = updated_only)
      const updateData = await addAuditFieldsFor('sales', {
        status: 'completed',
        payment_status: 'paid',
        stock_released_at: getCurrentTimestamp(),
        completed_at: getCurrentTimestamp()
      }, true);

      const { data: updatedSale, error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId)
        .select()
        .single();

      if (updateError) throw updateError;

      notify.success(`Apartado ${sale.sale_number} completado exitosamente`);
      return updatedSale;

    } catch (err: any) {
      const errorMsg = `Error completando apartado: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, addAuditFieldsFor, completeLayaway]);

  // ✅ CANCELAR APARTADO (LIBERAR RESERVA)
  const cancelLayawayByRef = useCallback(async (saleId: string, reason: string): Promise<Sale> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener detalles del apartado
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .eq('id', saleId)
        .eq('sale_type', 'layaway')
        .single();

      if (saleError) throw saleError;
      if (!sale) throw new Error('Apartado no encontrado');

      // 2. Cancelar apartado para cada item (liberar reserva)
      for (const item of sale.sale_items) {
        await cancelLayaway(item.product_id, item.quantity, saleId);
      }

      // 3. Actualizar venta con auditoría automática
      const updateData = await addAuditFieldsFor('sales', {
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_date: getCurrentTimestamp(),
        stock_released_at: getCurrentTimestamp()
      }, true);

      const { data: updatedSale, error: updateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId)
        .select()
        .single();

      if (updateError) throw updateError;

      notify.success(`Apartado ${sale.sale_number} cancelado`);
      return updatedSale;

    } catch (err: any) {
      const errorMsg = `Error cancelando apartado: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, addAuditFieldsFor, cancelLayaway]);

  // ✅ PROCESAR DEVOLUCIÓN (CON REINGRESO AL INVENTARIO)
  const processRefundRequest = useCallback(async (request: RefundRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Generar número de devolución
      const today = getTodayInMexico().replace(/-/g, '');
      const refundNumber = `DEV${today}${Date.now().toString().slice(-4)}`;

      // 2. Calcular total de devolución
      const totalRefunded = request.items.reduce((sum, item) => sum + item.refund_amount, 0);

      // 3. Crear registro de devolución (sin auditoría completa)
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert([{
          sale_id: request.sale_id,
          refund_number: refundNumber,
          refund_type: request.refund_type,
          total_refunded: totalRefunded,
          reason: request.reason
        }])
        .select()
        .single();

      if (refundError) throw refundError;

      // 4. Crear items de devolución y procesar inventario
      for (const item of request.items) {
        // Crear refund_item
        const { error: itemError } = await supabase
          .from('refund_items')
          .insert([{
            refund_id: refund.id,
            sale_item_id: item.sale_item_id,
            quantity_refunded: item.quantity_refunded,
            refund_amount: item.refund_amount
          }]);

        if (itemError) throw itemError;

        // Obtener product_id del sale_item
        const { data: saleItem, error: saleItemError } = await supabase
          .from('sale_items')
          .select('product_id')
          .eq('id', item.sale_item_id)
          .single();

        if (saleItemError) throw saleItemError;

        // Procesar reingreso al inventario
        await processRefund(saleItem.product_id, item.quantity_refunded, refund.id);
      }

      // 5. Actualizar venta original con auditoría automática
      const updateData = await addAuditFieldsFor('sales', {
        status: request.refund_type === 'full' ? 'refunded' : 'completed',
        refund_amount: totalRefunded
      }, true);

      const { error: saleUpdateError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', request.sale_id);

      if (saleUpdateError) throw saleUpdateError;

      notify.success(`Devolución ${refundNumber} procesada exitosamente`);

    } catch (err: any) {
      const errorMsg = `Error procesando devolución: ${err.message}`;
      setError(errorMsg);
      notify.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, addAuditFieldsFor, processRefund]);

  return {
    // Estados
    loading,
    error,
    hydrated,

    // Operaciones principales
    createDirectSale,
    createLayawaySale,
    completeLayawayByRef,
    cancelLayawayByRef,
    processRefundRequest,

    // Utilidades
    validateStockForItems,
    generateSaleNumber,
    clearError: () => setError(null)
  };
};

// ✅ UTILIDADES EXPORTADAS
export const SalesInventoryUtils = {
  // Formatear estado de venta
  formatSaleStatus: (status: Sale['status']): string => {
    const labels = {
      'pending': 'Pendiente',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'refunded': 'Devuelta',
      'expired': 'Expirada'
    };
    return labels[status];
  },

  // Color según estado de venta
  getSaleStatusColor: (status: Sale['status']): string => {
    const colors = {
      'pending': '#F59E0B',     // Amarillo
      'completed': '#22C55E',   // Verde
      'cancelled': '#6B7280',   // Gris
      'refunded': '#EF4444',    // Rojo
      'expired': '#DC2626'      // Rojo oscuro
    };
    return colors[status];
  },

  // Validar operación de venta
  validateSaleRequest: (request: CreateSaleRequest): string[] => {
    const errors: string[] = [];
    
    if (!request.items || request.items.length === 0) {
      errors.push('La venta debe incluir al menos un producto');
    }

    request.items.forEach((item, index) => {
      if (!item.product_id) errors.push(`Producto ${index + 1}: ID requerido`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Producto ${index + 1}: Cantidad inválida`);
      if (!item.unit_price || item.unit_price < 0) errors.push(`Producto ${index + 1}: Precio inválido`);
    });

    if (request.sale_type === 'layaway') {
      if (!request.customer_id) errors.push('Apartado requiere cliente asignado');
      if (request.deposit_percentage && (request.deposit_percentage < 1 || request.deposit_percentage > 100)) {
        errors.push('Porcentaje de depósito debe estar entre 1% y 100%');
      }
    }

    return errors;
  }
};