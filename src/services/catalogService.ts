import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🎯 TIPOS CENTRALIZADOS
export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  profit_margin?: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  supplier_id?: string;
  image_url?: string;
  is_active: boolean;
  is_taxable?: boolean;
  tax_rate?: number;
  location?: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    company_name: string;
    contact_person: string;
  };
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  rfc?: string;
  address?: any;
  payment_terms?: string;
  credit_limit?: number;
  current_balance?: number;
  rating?: number;
  categories?: string[];
  delivery_time?: number;
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'entrada' | 'salida' | 'ajuste' | 'transferencia'; // ✅ Más específico
  quantity: number;
  previous_stock: number; // ✅ REQUERIDO - siempre debe existir
  new_stock: number;      // ✅ REQUERIDO - siempre debe existir
  unit_cost?: number;
  total_cost?: number;
  reason: string;
  notes?: string;
  reference_id?: string;  // ✅ AGREGADO - para referencias externas
  created_at: string;     // ✅ REQUERIDO - timestamps siempre existen
  created_by?: string;
  products?: Product;
  Users?: {
    firstName: string;
    lastName?: string;
  };
}

// 🎯 FILTROS TIPADOS
export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockLevel?: 'low' | 'out' | 'available' | 'overstock';
  status?: 'active' | 'inactive' | 'all';
  supplier?: string;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  rating?: number;
  status?: 'active' | 'inactive' | 'all';
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockLevel?: 'low' | 'out' | 'available' | 'overstock';
  status?: 'active' | 'inactive' | 'all';
  includeInactive?: boolean;
}

// 🎯 RESPUESTAS PAGINADAS
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 🎯 ESTADÍSTICAS
export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalCreditLimit: number;
  totalBalance: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentMovements: number;
  totalMovements: number;
}

// 🎯 RESULTADOS DE OPERACIONES
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StockAdjustmentParams {
  productId: string;
  movementType: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
  quantity: number;
  reason: string;
  notes?: string;
  unitCost?: number;
  referenceId?: string; // Para orden de compra, venta, etc.
}

export interface StockAdjustmentResult {
  success: boolean;
  message: string;
  action: 'hard_delete' | 'soft_delete' | 'stock_adjusted';
  newStock: number;     // ✅ REQUERIDO
  previousStock: number; // ✅ REQUERIDO
  movementId: string;   // ✅ REQUERIDO
}

class CatalogService {
  private supabase = createBrowserSupabaseClient();

  // ============================================
  // 🛍️ PRODUCTOS - SERVER-SIDE OPERATIONS
  // ============================================

  /**
   * 📦 Obtener productos con filtros del lado del servidor
   */
 /**
   * 📦 Obtener productos con filtros del lado del servidor (versión actualizada con RPC)
   */
 async getProducts(filters: ProductFilters = {}): Promise<ServiceResult<PaginatedResponse<Product>>> {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      stockLevel = '',
      status = 'active',
      supplier
    } = filters;

    const offset = (page - 1) * limit;

    // ✅ LLAMAR A LA FUNCIÓN RPC QUE YA FUNCIONA
    const { data, error } = await this.supabase.rpc('search_products', {
      search_term: search,
      category_filter: category,
      status_filter: status,
      stock_level_filter: stockLevel,
      supplier_filter: supplier || null,
      page_limit: limit,
      page_offset: offset
    });

    if (error) {
      throw error;
    }

    // ✅ MAPEAR LOS DATOS A LA INTERFAZ Product ESPERADA
    const mappedProducts: Product[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      brand: item.brand,
      category: item.category,
      subcategory: item.subcategory,
      description: item.description,
      cost_price: parseFloat(item.cost_price || 0),
      sale_price: parseFloat(item.sale_price || 0),
      profit_margin: parseFloat(item.profit_margin || 0),
      current_stock: item.current_stock,
      min_stock: item.min_stock,
      max_stock: item.max_stock,
      unit: item.unit,
      supplier_id: item.supplier_id,
      image_url: item.image_url,
      is_active: item.is_active,
      is_taxable: item.is_taxable,
      tax_rate: parseFloat(item.tax_rate || 0),
      location: item.location,
      expiry_date: item.expiry_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // ✅ MAPEAR LOS DATOS DEL SUPPLIER CORRECTAMENTE
      suppliers: item.supplier_company_name ? {
        company_name: item.supplier_company_name,
        contact_person: item.supplier_contact_person || ''
      } : undefined
    }));

    // ✅ OBTENER EL TOTAL DE LA PRIMERA FILA
    const total = data?.[0]?.total_count || 0;

    return {
      success: true,
      data: {
        data: mappedProducts,
        total: total,
        page,
        limit,
        hasMore: total > offset + mappedProducts.length
      }
    };
  } catch (error: any) {
    console.error('❌ [catalogService.getProducts] Error:', error);
    return {
      success: false,
      error: error?.message || error?.details || 'Error al cargar productos'
    };
  }
}
  /**
   * 📊 Obtener estadísticas de productos (CALCULADO EN FRONTEND)
   */
  async getProductStats(): Promise<ServiceResult<ProductStats>> {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('current_stock, min_stock, max_stock, cost_price, is_active')
        .neq('is_active', false);

      if (error) throw error;

      // ✅ CALCULAR ESTADÍSTICAS EN FRONTEND (MÁS CONFIABLE)
      const stats: ProductStats = {
        totalProducts: products?.length || 0,
        lowStockProducts: products?.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0).length || 0,
        outOfStockProducts: products?.filter(p => p.current_stock === 0).length || 0,
        totalValue: products?.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0) || 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getProductStats] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al calcular estadísticas'
      };
    }
  }

  /**
   * 💾 Crear producto
   */
  async createProduct(productData: Partial<Product>): Promise<ServiceResult<Product>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('products')
        .insert([{
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId,
          updated_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Producto creado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.createProduct] Error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * ✏️ Actualizar producto
   */
  async updateProduct(productId: string, productData: Partial<Product>): Promise<ServiceResult<Product>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Producto actualizado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.updateProduct] Error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================
  // 🏢 PROVEEDORES - SERVER-SIDE OPERATIONS
  // ============================================

  /**
   * 📦 Obtener proveedores con filtros del lado del servidor
   */
  async getSuppliers(filters: SupplierFilters = {}): Promise<ServiceResult<PaginatedResponse<Supplier>>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        rating,
        status = 'active'
      } = filters;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('suppliers')
        .select('*', { count: 'exact' });

      // ✅ FILTRO POR ESTADO
      if (status === 'active') {
        query = query.neq('is_active', false);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      // ✅ FILTRO POR BÚSQUEDA
      if (search) {
        query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // ✅ FILTRO POR CATEGORÍA (JSON ARRAY)
     // ✅ FILTRO POR CATEGORÍA (JSONB - CORREGIDO)
if (category) {
  query = query.filter('categories', 'cs', JSON.stringify([category]));
}

      // ✅ FILTRO POR RATING MÍNIMO
      if (rating) {
        query = query.gte('rating', rating);
      }

      const { data, count, error } = await query
        .range(offset, offset + limit - 1)
        .order('company_name');

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit
        }
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getSuppliers] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar proveedores'
      };
    }
  }

  /**
   * 📊 Obtener estadísticas de proveedores
   */
  async getSupplierStats(): Promise<ServiceResult<SupplierStats>> {
    try {
      const { data: suppliers, error } = await this.supabase
        .from('suppliers')
        .select('is_active, credit_limit, current_balance');

      if (error) throw error;

      const activeSuppliers = suppliers?.filter(s => s.is_active !== false) || [];

      const stats: SupplierStats = {
        totalSuppliers: suppliers?.length || 0,
        activeSuppliers: activeSuppliers.length,
        totalCreditLimit: activeSuppliers.reduce((sum, s) => sum + (s.credit_limit || 0), 0),
        totalBalance: activeSuppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getSupplierStats] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al calcular estadísticas'
      };
    }
  }

  /**
   * 💾 Crear proveedor
   */
  async createSupplier(supplierData: Partial<Supplier>): Promise<ServiceResult<Supplier>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('suppliers')
        .insert([{
          ...supplierData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId,
          updated_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Proveedor creado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.createSupplier] Error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * ✏️ Actualizar proveedor
   */
  async updateSupplier(supplierId: string, supplierData: Partial<Supplier>): Promise<ServiceResult<Supplier>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('suppliers')
        .update({
          ...supplierData,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Proveedor actualizado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.updateSupplier] Error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================
  // 📦 INVENTARIO - SERVER-SIDE OPERATIONS
  // ============================================

  /**
   * 📋 Obtener productos para inventario con filtros
   */
  async getInventoryProducts(filters: InventoryFilters = {}): Promise<ServiceResult<PaginatedResponse<Product>>> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        category, 
        stockLevel, 
        status = 'active'
      } = filters;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('products')
        .select(`
          *,
          suppliers (
            company_name,
            contact_person
          )
        `, { count: 'exact' });

      // ✅ FILTRO POR ESTADO
      if (status === 'active') {
        query = query.neq('is_active', false);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      // ✅ RESTO DE FILTROS
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`);
      }

      if (category) {
        query = query.eq('category', category);
      }

      // 🔧 FILTRO POR NIVEL DE STOCK (CORREGIDO)
     if (stockLevel) {
  switch (stockLevel) {
    case 'low':
      // Solo productos con stock > 0 (filtraremos min_stock en frontend si es necesario)
      query = query.gt('current_stock', 0);
      break;
    case 'out':
      // Sin stock: current_stock = 0
      query = query.eq('current_stock', 0);
      break;
    case 'available':
      // Stock disponible: current_stock > 0
      query = query.gt('current_stock', 0);
      break;
    case 'overstock':
      // Sobre stock: current_stock > 0 y max_stock no es null
      query = query.gt('current_stock', 0).not('max_stock', 'is', null);
      break;
  }
}

      const { data, count, error } = await query
        .range(offset, offset + limit - 1)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit
        }
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getInventoryProducts] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar productos de inventario'
      };
    }
  }

  /**
   * 📊 Obtener estadísticas de inventario
   */
  async getInventoryStats(): Promise<ServiceResult<InventoryStats>> {
    try {
      // Obtener estadísticas de productos
      const productStatsResult = await this.getProductStats();
      if (!productStatsResult.success) throw new Error(productStatsResult.error);

      // Obtener movimientos recientes (últimos 3 días)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentMovements, error: recentError } = await this.supabase
        .from('inventory_movements')
        .select('id')
        .gte('created_at', threeDaysAgo);

      if (recentError) throw recentError;

      // Obtener total de movimientos
      const { count: totalMovements, error: totalError } = await this.supabase
        .from('inventory_movements')
        .select('id', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const stats: InventoryStats = {
        ...productStatsResult.data!,
        recentMovements: recentMovements?.length || 0,
        totalMovements: totalMovements || 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getInventoryStats] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al calcular estadísticas de inventario'
      };
    }
  }

  /**
   * 📋 Obtener movimientos de inventario
   */
  async getInventoryMovements(filters: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}): Promise<ServiceResult<PaginatedResponse<InventoryMovement>>> {
    try {
      const { page = 1, limit = 5, includeInactive = false } = filters;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('inventory_movements')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            unit,
            is_active,
            category,
            brand
          ),
          Users (
            firstName,
            lastName
          )
        `, { count: 'exact' });

      // ✅ FILTRAR PRODUCTOS INACTIVOS SI SE REQUIERE
      if (!includeInactive) {
        query = query.neq('products.is_active', false);
      }

      const { data, count, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit
        }
      };
    } catch (error: any) {
      console.error('❌ [catalogService.getInventoryMovements] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar movimientos'
      };
    }
  }

  // ============================================
  // ⚡ OPERACIONES ATÓMICAS CRÍTICAS
  // ============================================

  /**
   * 🔧 Ajustar stock de manera atómica (LLAMARÁ A FUNCIÓN SQL)
   */
  async adjustStock(params: {
  productId: string;
  movementType: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
  quantity: number;
  reason: string;
  notes?: string;
  unitCost?: number;
}): Promise<ServiceResult<StockAdjustmentResult>> {
  try {
    const user = await this.supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { data, error } = await this.supabase
      .rpc('adjust_stock_atomic', {
        p_product_id: params.productId,
        p_movement_type: params.movementType,
        p_quantity: params.quantity,
        p_reason: params.reason,
        p_notes: params.notes || null,
        p_unit_cost: params.unitCost || 0,
        p_created_by: userId
      });

    if (error) throw error;

    // ✅ CORECCIÓN: data es directamente el objeto, no un array
    if (!data) {
      throw new Error('No se recibieron datos de la función de ajuste de stock');
    }

    return {
      success: true,
      data: data, // data ya es el objeto directo
      message: data.message || 'Stock ajustado correctamente'
    };
  } catch (error: any) {
    console.error('❌ [catalogService.adjustStock] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al ajustar stock'
    };
  }
}
  /**
   * 🗑️ Eliminar producto de manera segura (LLAMARÁ A FUNCIÓN SQL)
   */
  async deleteProduct(productId: string): Promise<ServiceResult<{ action: string; message: string }>> {
    try {
      const { data, error } = await this.supabase
        .rpc('delete_product_safely', { 
          product_id: productId 
        });

      if (error) throw error;

      return {
        success: true,
        data: data[0],
        message: data[0].message
      };
    } catch (error: any) {
      console.error('❌ [catalogService.deleteProduct] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar producto'
      };
    }
  }

  /**
   * 🗑️ Eliminar proveedor de manera segura (LLAMARÁ A FUNCIÓN SQL)
   */
  async deleteSupplier(supplierId: string): Promise<ServiceResult<{ action: string; message: string }>> {
    try {
      const { data, error } = await this.supabase
        .rpc('delete_supplier_safely', { 
          supplier_id: supplierId 
        });

      if (error) throw error;

      return {
        success: true,
        data: data[0],
        message: data[0].message
      };
    } catch (error: any) {
      console.error('❌ [catalogService.deleteSupplier] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar proveedor'
      };
    }
  }

  /**
   * ↩️ Restaurar producto
   */
  async restoreProduct(productId: string): Promise<ServiceResult<Product>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('products')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Producto restaurado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.restoreProduct] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar producto'
      };
    }
  }

  /**
   * ↩️ Restaurar proveedor
   */
  async restoreSupplier(supplierId: string): Promise<ServiceResult<Supplier>> {
    try {
      const user = await this.supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { data, error } = await this.supabase
        .from('suppliers')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Proveedor restaurado correctamente'
      };
    } catch (error: any) {
      console.error('❌ [catalogService.restoreSupplier] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar proveedor'
      };
    }
  }

  // ============================================
  // 🛠️ UTILIDADES PRIVADAS
  // ============================================

  /**
   * 🔧 Procesar mensajes de error de Supabase
   */
  private getErrorMessage(error: any): string {
    if (error.code === '23505') {
      if (error.constraint?.includes('sku')) {
        return 'Ya existe un producto con este SKU';
      } else if (error.constraint?.includes('barcode')) {
        return 'Ya existe un producto con este código de barras';
      } else if (error.constraint?.includes('company_name')) {
        return 'Ya existe un proveedor con este nombre';
      } else if (error.constraint?.includes('rfc')) {
        return 'Ya existe un proveedor con este RFC';
      } else {
        return 'Ya existe un registro con esta información';
      }
    } else if (error.code === '23503') {
      return 'No se puede eliminar porque tiene referencias en otros registros';
    } else {
      return error.message || 'Error desconocido';
    }
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
export const catalogService = new CatalogService();
export default catalogService; 