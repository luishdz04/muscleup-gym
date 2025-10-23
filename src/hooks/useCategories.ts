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
      
      // Cargar desde la tabla categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) {
        throw categoriesError;
      }

      // Convertir a formato Category
      const categories: Category[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories || [],
        created_at: cat.created_at,
        updated_at: cat.updated_at
      }));

      setCategories(categories);
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
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          subcategories: []
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        subcategories: data.subcategories || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setCategories(prev => [...prev, newCategory]);
      return true;
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(err?.message || 'Error al agregar categoría');
      return false;
    }
  }, [supabase]);

  // Actualizar categoría
  const updateCategory = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, name: data.name, updated_at: data.updated_at } : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err?.message || 'Error al actualizar categoría');
      return false;
    }
  }, [supabase]);

  // Eliminar categoría
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err?.message || 'Error al eliminar categoría');
      return false;
    }
  }, [supabase]);

  // Agregar subcategoría
  const addSubcategory = useCallback(async (categoryId: string, subcategoryName: string): Promise<boolean> => {
    try {
      // Obtener la categoría actual
      const currentCategory = categories.find(cat => cat.id === categoryId);
      if (!currentCategory) {
        throw new Error('Categoría no encontrada');
      }

      // Agregar la nueva subcategoría
      const newSubcategories = [...currentCategory.subcategories, subcategoryName];

      const { data, error } = await supabase
        .from('categories')
        .update({ subcategories: newSubcategories })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: data.subcategories, updated_at: data.updated_at }
            : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error adding subcategory:', err);
      setError(err?.message || 'Error al agregar subcategoría');
      return false;
    }
  }, [supabase, categories]);

  // Eliminar subcategoría
  const removeSubcategory = useCallback(async (categoryId: string, subcategoryName: string): Promise<boolean> => {
    try {
      // Obtener la categoría actual
      const currentCategory = categories.find(cat => cat.id === categoryId);
      if (!currentCategory) {
        throw new Error('Categoría no encontrada');
      }

      // Remover la subcategoría
      const newSubcategories = currentCategory.subcategories.filter(sub => sub !== subcategoryName);

      const { data, error } = await supabase
        .from('categories')
        .update({ subcategories: newSubcategories })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: data.subcategories, updated_at: data.updated_at }
            : cat
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error removing subcategory:', err);
      setError(err?.message || 'Error al eliminar subcategoría');
      return false;
    }
  }, [supabase, categories]);

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
