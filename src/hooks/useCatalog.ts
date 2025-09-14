// 📁 src/hooks/useCatalog.ts - HOOK CORREGIDO CON TIPADO FUERTE

import { useState, useEffect, useCallback } from 'react';
import catalogService, {
  Product,
  Supplier,
  InventoryMovement,
  ProductFilters,
  SupplierFilters,
  InventoryFilters,
  StockAdjustmentParams, // ✅ IMPORTAR INTERFACE CORREGIDA
  PaginatedResponse,
  ProductStats,
  SupplierStats,
  InventoryStats,
  ServiceResult
} from '@/services/catalogService';

// 🎯 TIPOS PARA LOS HOOKS - MEJORADOS
interface UseDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

interface UseStatsState<T> {
  stats: T | null;
  loading: boolean;
  error: string | null;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// ============================================
// 📦 HOOK PARA INVENTARIO - CORREGIDO
// ============================================

export function useInventory(initialFilters: InventoryFilters = {}) {
  const [state, setState] = useState<UseDataState<Product>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    hasMore: false
  });

  const [movements, setMovements] = useState<UseDataState<InventoryMovement>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    hasMore: false
  });

  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 📦 CARGAR PRODUCTOS DE INVENTARIO
  const loadProducts = useCallback(async (newFilters?: InventoryFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const currentFilters = newFilters || filters;
      const result = await catalogService.getInventoryProducts(currentFilters);
      
      if (result.success && result.data) {
        setState({
          data: result.data.data,
          loading: false,
          error: null,
          total: result.data.total,
          page: result.data.page,
          hasMore: result.data.hasMore
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar productos'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, [filters]);

  // 📋 CARGAR MOVIMIENTOS
  const loadMovements = useCallback(async (movementFilters: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}) => {
    try {
      setMovements(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await catalogService.getInventoryMovements(movementFilters);
      
      if (result.success && result.data) {
        setMovements({
          data: result.data.data,
          loading: false,
          error: null,
          total: result.data.total,
          page: result.data.page,
          hasMore: result.data.hasMore
        });
      } else {
        setMovements(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar movimientos'
        }));
      }
    } catch (error: any) {
      setMovements(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, []);

  // ✅ AJUSTAR STOCK CON INTERFACE CORREGIDA
  const adjustStock = useCallback(async (params: StockAdjustmentParams) => {
    try {
      const result = await catalogService.adjustStock(params);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Stock ajustado correctamente',
          severity: 'success'
        });
        await loadProducts(); // Recargar productos
        await loadMovements(); // Recargar movimientos
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al ajustar stock',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadProducts, loadMovements]);

  // 🔧 CAMBIAR FILTROS
  const updateFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadProducts(updatedFilters);
  }, [filters, loadProducts]);

  // 📄 CAMBIAR PÁGINA
  const changePage = useCallback((newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    loadProducts(updatedFilters);
  }, [filters, loadProducts]);

  // 🔄 RECARGAR
  const reload = useCallback(() => {
    loadProducts();
    loadMovements();
  }, [loadProducts, loadMovements]);

  // 📱 CERRAR NOTIFICACIÓN
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 🚀 CARGAR INICIAL
  useEffect(() => {
    loadProducts();
    loadMovements();
  }, []);

  return {
    // Estado de productos
    products: state.data,
    productsLoading: state.loading,
    productsError: state.error,
    productsTotal: state.total,
    productsPage: state.page,
    productsHasMore: state.hasMore,
    
    // Estado de movimientos
    movements: movements.data,
    movementsLoading: movements.loading,
    movementsError: movements.error,
    movementsTotal: movements.total,
    movementsPage: movements.page,
    movementsHasMore: movements.hasMore,
    
    // Estados comunes
    filters,
    notification,
    
    // Acciones
    adjustStock,
    updateFilters,
    changePage,
    reload,
    closeNotification,
    loadMovements
  };
}

// ============================================
// ✅ RESTO DE HOOKS SIN CAMBIOS (PRODUCTOS Y PROVEEDORES)
// ============================================

export function useProducts(initialFilters: ProductFilters = {}) {
  const [state, setState] = useState<UseDataState<Product>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    hasMore: false
  });

  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 📦 CARGAR PRODUCTOS
  const loadProducts = useCallback(async (newFilters?: ProductFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const currentFilters = newFilters || filters;
      const result = await catalogService.getProducts(currentFilters);
      
      if (result.success && result.data) {
        setState({
          data: result.data.data,
          loading: false,
          error: null,
          total: result.data.total,
          page: result.data.page,
          hasMore: result.data.hasMore
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar productos'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, [filters]);

  // 💾 CREAR PRODUCTO
  const createProduct = useCallback(async (productData: Partial<Product>) => {
    try {
      const result = await catalogService.createProduct(productData);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Producto creado correctamente',
          severity: 'success'
        });
        await loadProducts(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al crear producto',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadProducts]);

  // ✏️ ACTUALIZAR PRODUCTO
  const updateProduct = useCallback(async (productId: string, productData: Partial<Product>) => {
    try {
      const result = await catalogService.updateProduct(productId, productData);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Producto actualizado correctamente',
          severity: 'success'
        });
        await loadProducts(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al actualizar producto',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadProducts]);

  // 🗑️ ELIMINAR PRODUCTO (USA FUNCIÓN SQL)
  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const result = await catalogService.deleteProduct(productId);
      
      if (result.success) {
        const severity = result.data?.action === 'soft_delete' ? 'warning' : 'success';
        setNotification({
          open: true,
          message: result.message || 'Producto eliminado correctamente',
          severity
        });
        await loadProducts(); // Recargar lista
        return { success: true, action: result.data?.action };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al eliminar producto',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadProducts]);

  // ↩️ RESTAURAR PRODUCTO
  const restoreProduct = useCallback(async (productId: string) => {
    try {
      const result = await catalogService.restoreProduct(productId);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Producto restaurado correctamente',
          severity: 'success'
        });
        await loadProducts(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al restaurar producto',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadProducts]);

  // 🔧 CAMBIAR FILTROS
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadProducts(updatedFilters);
  }, [filters, loadProducts]);

  // 📄 CAMBIAR PÁGINA
  const changePage = useCallback((newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    loadProducts(updatedFilters);
  }, [filters, loadProducts]);

  // 🔄 RECARGAR
  const reload = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  // 📱 CERRAR NOTIFICACIÓN
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 🚀 CARGAR INICIAL
  useEffect(() => {
    loadProducts();
  }, []);

  return {
    // Estado
    products: state.data,
    loading: state.loading,
    error: state.error,
    total: state.total,
    page: state.page,
    hasMore: state.hasMore,
    filters,
    notification,
    
    // Acciones
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    updateFilters,
    changePage,
    reload,
    closeNotification
  };
}

// ============================================
// 🏢 HOOK PARA PROVEEDORES (SIN CAMBIOS)
// ============================================

export function useSuppliers(initialFilters: SupplierFilters = {}) {
  const [state, setState] = useState<UseDataState<Supplier>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    hasMore: false
  });

  const [filters, setFilters] = useState<SupplierFilters>(initialFilters);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 📦 CARGAR PROVEEDORES
  const loadSuppliers = useCallback(async (newFilters?: SupplierFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const currentFilters = newFilters || filters;
      const result = await catalogService.getSuppliers(currentFilters);
      
      if (result.success && result.data) {
        setState({
          data: result.data.data,
          loading: false,
          error: null,
          total: result.data.total,
          page: result.data.page,
          hasMore: result.data.hasMore
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar proveedores'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, [filters]);

  // 💾 CREAR PROVEEDOR
  const createSupplier = useCallback(async (supplierData: Partial<Supplier>) => {
    try {
      const result = await catalogService.createSupplier(supplierData);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Proveedor creado correctamente',
          severity: 'success'
        });
        await loadSuppliers(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al crear proveedor',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadSuppliers]);

  // ✏️ ACTUALIZAR PROVEEDOR
  const updateSupplier = useCallback(async (supplierId: string, supplierData: Partial<Supplier>) => {
    try {
      const result = await catalogService.updateSupplier(supplierId, supplierData);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Proveedor actualizado correctamente',
          severity: 'success'
        });
        await loadSuppliers(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al actualizar proveedor',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadSuppliers]);

  // 🗑️ ELIMINAR PROVEEDOR (USA FUNCIÓN SQL)
  const deleteSupplier = useCallback(async (supplierId: string) => {
    try {
      const result = await catalogService.deleteSupplier(supplierId);
      
      if (result.success) {
        const severity = result.data?.action === 'soft_delete' ? 'warning' : 'success';
        setNotification({
          open: true,
          message: result.message || 'Proveedor eliminado correctamente',
          severity
        });
        await loadSuppliers(); // Recargar lista
        return { success: true, action: result.data?.action };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al eliminar proveedor',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadSuppliers]);

  // ↩️ RESTAURAR PROVEEDOR
  const restoreSupplier = useCallback(async (supplierId: string) => {
    try {
      const result = await catalogService.restoreSupplier(supplierId);
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Proveedor restaurado correctamente',
          severity: 'success'
        });
        await loadSuppliers(); // Recargar lista
        return { success: true, data: result.data };
      } else {
        setNotification({
          open: true,
          message: result.error || 'Error al restaurar proveedor',
          severity: 'error'
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error inesperado';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      return { success: false, error: errorMessage };
    }
  }, [loadSuppliers]);

  // 🔧 CAMBIAR FILTROS
  const updateFilters = useCallback((newFilters: Partial<SupplierFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadSuppliers(updatedFilters);
  }, [filters, loadSuppliers]);

  // 📄 CAMBIAR PÁGINA
  const changePage = useCallback((newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    loadSuppliers(updatedFilters);
  }, [filters, loadSuppliers]);

  // 🔄 RECARGAR
  const reload = useCallback(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // 📱 CERRAR NOTIFICACIÓN
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 🚀 CARGAR INICIAL
  useEffect(() => {
    loadSuppliers();
  }, []);

  return {
    // Estado
    suppliers: state.data,
    loading: state.loading,
    error: state.error,
    total: state.total,
    page: state.page,
    hasMore: state.hasMore,
    filters,
    notification,
    
    // Acciones
    createSupplier,
    updateSupplier,
    deleteSupplier,
    restoreSupplier,
    updateFilters,
    changePage,
    reload,
    closeNotification
  };
}

// ============================================
// 📊 HOOKS PARA ESTADÍSTICAS (SIN CAMBIOS)
// ============================================

export function useProductStats() {
  const [state, setState] = useState<UseStatsState<ProductStats>>({
    stats: null,
    loading: true,
    error: null
  });

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await catalogService.getProductStats();
      
      if (result.success) {
        setState({
          stats: result.data!,
          loading: false,
          error: null
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar estadísticas'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    reload: loadStats
  };
}

export function useSupplierStats() {
  const [state, setState] = useState<UseStatsState<SupplierStats>>({
    stats: null,
    loading: true,
    error: null
  });

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await catalogService.getSupplierStats();
      
      if (result.success) {
        setState({
          stats: result.data!,
          loading: false,
          error: null
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar estadísticas'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    reload: loadStats
  };
}

export function useInventoryStats() {
  const [state, setState] = useState<UseStatsState<InventoryStats>>({
    stats: null,
    loading: true,
    error: null
  });

  const loadStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await catalogService.getInventoryStats();
      
      if (result.success) {
        setState({
          stats: result.data!,
          loading: false,
          error: null
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al cargar estadísticas'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado'
      }));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    reload: loadStats
  };
}