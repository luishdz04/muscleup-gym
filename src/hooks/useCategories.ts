// src/hooks/useCategories.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string) => Promise<boolean>;
  updateCategory: (id: string, name: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  addSubcategory: (categoryId: string, subcategoryName: string) => Promise<boolean>;
  removeSubcategory: (categoryId: string, subcategoryName: string) => Promise<boolean>;
  refreshCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  // Cargar categorías desde la base de datos
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Por ahora, crear categorías basadas en los productos existentes
      // TODO: Implementar tabla categories en la base de datos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('category, subcategory')
        .not('category', 'is', null);

      if (productsError) {
        throw productsError;
      }

      // Agrupar categorías y subcategorías
      const categoryMap = new Map<string, Set<string>>();
      
      products?.forEach(product => {
        if (product.category) {
          if (!categoryMap.has(product.category)) {
            categoryMap.set(product.category, new Set());
          }
          if (product.subcategory) {
            categoryMap.get(product.category)?.add(product.subcategory);
          }
        }
      });

      // Convertir a formato Category
      const categoriesData: Category[] = Array.from(categoryMap.entries()).map(([name, subcategoriesSet]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        subcategories: Array.from(subcategoriesSet)
      }));

      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error loading categories:', err?.message || err || 'Error desconocido');
      setError(err?.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Agregar nueva categoría
  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    try {
      const newCategory: Category = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        subcategories: []
      };
      
      setCategories(prev => [...prev, newCategory]);
      return true;
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(err.message || 'Error al agregar categoría');
      return false;
    }
  }, []);

  // Actualizar categoría
  const updateCategory = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, name } : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Error al actualizar categoría');
      return false;
    }
  }, []);

  // Eliminar categoría
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Error al eliminar categoría');
      return false;
    }
  }, []);

  // Agregar subcategoría
  const addSubcategory = useCallback(async (categoryId: string, subcategoryName: string): Promise<boolean> => {
    try {
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: [...cat.subcategories, subcategoryName] }
            : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error adding subcategory:', err);
      setError(err.message || 'Error al agregar subcategoría');
      return false;
    }
  }, []);

  // Eliminar subcategoría
  const removeSubcategory = useCallback(async (categoryId: string, subcategoryName: string): Promise<boolean> => {
    try {
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: cat.subcategories.filter(sub => sub !== subcategoryName) }
            : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error removing subcategory:', err);
      setError(err.message || 'Error al eliminar subcategoría');
      return false;
    }
  }, []);

  // Refrescar categorías
  const refreshCategories = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    refreshCategories
  };
}
