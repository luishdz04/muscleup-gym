// hooks/useProductStock.ts - v8.0 CORREGIDO CON QUERY SIMPLE
'use client';

import { useMemo, useCallback } from 'react';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';

export type StockStatus = 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';

export interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  category?: string;
  brand?: string;
  unit?: string;
  is_active?: boolean;
  updated_at: string;
}

export interface StockStats {
  total: number;
  sinStock: number;
  stockBajo: number;
  stockNormal: number;
  sobreStock: number;
  critical: number;
  totalStock: number;
  totalReservado: number;
  totalDisponible: number;
}

export const useProductStock = () => {
  const { 
    data: rawProducts, 
    loading, 
    fetchData, 
    searchItems,
    stats: crudStats,
    ...rest 
  } = useEntityCRUD<ProductStock>({
    tableName: 'products',
    // ✅ QUERY SIMPLE SIN CAMPOS CALCULADOS COMPLEJOS
    selectQuery: `
      id, name, sku, current_stock, min_stock, max_stock, 
      cost_price, sale_price, category, brand, unit, 
      is_active, updated_at
    `
  });

  // ✅ PRODUCTOS CON CAMPOS CALCULADOS EN FRONTEND
  const products = useMemo((): (ProductStock & { 
    available_stock: number; 
    stock_status: StockStatus 
  })[] => {
    return rawProducts.map(product => {
      const reservedStock = product.reserved_stock || 0;
      const availableStock = product.current_stock - reservedStock;
      
      let stockStatus: StockStatus = 'stock_normal';
      if (availableStock <= 0) {
        stockStatus = 'sin_stock';
      } else if (availableStock <= product.min_stock) {
        stockStatus = 'stock_bajo';
      } else if (product.max_stock && product.current_stock > product.max_stock) {
        stockStatus = 'sobre_stock';
      }

      return {
        ...product,
        available_stock: availableStock,
        stock_status: stockStatus
      };
    });
  }, [rawProducts]);

  const stockStats = useMemo((): StockStats | null => {
    if (!products.length) return null;

    const stats = products.reduce((acc, product) => {
      acc.total++;
      switch (product.stock_status) {
        case 'sin_stock': acc.sinStock++; break;
        case 'stock_bajo': acc.stockBajo++; break;
        case 'stock_normal': acc.stockNormal++; break;
        case 'sobre_stock': acc.sobreStock++; break;
      }
      acc.totalStock += product.current_stock;
      acc.totalReservado += product.reserved_stock || 0;
      acc.totalDisponible += product.available_stock;
      return acc;
    }, {
      total: 0, sinStock: 0, stockBajo: 0, stockNormal: 0, sobreStock: 0,
      totalStock: 0, totalReservado: 0, totalDisponible: 0
    });

    return {
      ...stats,
      critical: stats.sinStock + stats.stockBajo
    };
  }, [products]);

  const getProductsByStatus = useCallback((status: StockStatus) => {
    return products.filter(p => p.stock_status === status);
  }, [products]);

  const criticalProducts = useMemo(() => {
    return products.filter(p => 
      p.stock_status === 'sin_stock' || p.stock_status === 'stock_bajo'
    );
  }, [products]);

  const inventoryValue = useMemo(() => {
    if (!products.length) return { cost: 0, sale: 0 };
    
    return products.reduce((acc, product) => {
      acc.cost += (product.cost_price || 0) * product.current_stock;
      acc.sale += (product.sale_price || 0) * product.current_stock;
      return acc;
    }, { cost: 0, sale: 0 });
  }, [products]);

  const searchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await fetchData();
      return products;
    }
    const filters = {
      or: `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
    };
    const results = await searchItems(filters);
    return results.map(product => ({
      ...product,
      available_stock: product.current_stock - (product.reserved_stock || 0),
      stock_status: (product.current_stock <= 0 ? 'sin_stock' :
                   product.current_stock <= product.min_stock ? 'stock_bajo' :
                   product.max_stock && product.current_stock > product.max_stock ? 'sobre_stock' :
                   'stock_normal') as StockStatus
    }));
  }, [searchItems, fetchData, products]);

  return {
    products,
    loading,
    stockStats,
    criticalProducts,
    inventoryValue,
    getProductsByStatus,
    searchProducts,
    fetchData,
    ...rest
  };
};