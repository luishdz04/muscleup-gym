// hooks/useOnlineStatus.ts - Detectar estado de conexión
'use client';

import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    // Handlers para eventos de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// ===================================================================
// hooks/useFileStorage.ts - Manejo de archivos en Supabase Storage
// ===================================================================

'use client';

import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

interface UseFileStorageOptions {
  bucket?: string;
  maxSizeKB?: number;
  allowedTypes?: string[];
}

export const useFileStorage = (options: UseFileStorageOptions = {}) => {
  const {
    bucket = 'user-files',
    maxSizeKB = 5000, // 5MB por defecto
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  } = options;

  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useNotifications();

  // 📤 SUBIR ARCHIVO
  const uploadFile = useCallback(async (
    file: File, 
    path: string,
    options?: { replace?: boolean }
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      setUploading(true);

      // ✅ VALIDACIONES
      if (!file) {
        throw new Error('No se seleccionó ningún archivo');
      }

      if (file.size > maxSizeKB * 1024) {
        throw new Error(`El archivo es muy grande. Máximo ${maxSizeKB}KB permitidos`);
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Solo: ${allowedTypes.join(', ')}`);
      }

      const supabase = createBrowserSupabaseClient();
      
      // 🗑️ ELIMINAR ARCHIVO EXISTENTE SI SE REEMPLAZA
      if (options?.replace) {
        await supabase.storage.from(bucket).remove([path]);
      }

      // 📤 SUBIR ARCHIVO
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options?.replace || false
        });

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      // 🔗 OBTENER URL PÚBLICA
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      setDownloadUrl(urlData.publicUrl);
      toast.success('Archivo subido correctamente');

      return { 
        success: true, 
        url: urlData.publicUrl 
      };

    } catch (error: any) {
      const errorMessage = error.message || 'Error al subir archivo';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setUploading(false);
    }
  }, [bucket, maxSizeKB, allowedTypes, toast]);

  // 🗑️ ELIMINAR ARCHIVO
  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw new Error(`Error al eliminar archivo: ${error.message}`);
      }

      toast.success('Archivo eliminado correctamente');
      return true;

    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar archivo');
      return false;
    }
  }, [bucket, toast]);

  // 📋 LISTAR ARCHIVOS DE UN DIRECTORIO
  const listFiles = useCallback(async (folderPath: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Error al listar archivos: ${error.message}`);
      }

      return data || [];

    } catch (error: any) {
      toast.error(error.message || 'Error al listar archivos');
      return [];
    }
  }, [bucket, toast]);

  // 🧹 LIMPIAR CACHÉ DE ARCHIVOS TEMPORALES
  const cleanupCache = useCallback(async () => {
    try {
      // Limpiar archivos temporales más antiguos de 24h
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const supabase = createBrowserSupabaseClient();
      const { data: tempFiles } = await supabase.storage
        .from(bucket)
        .list('temp', { limit: 1000 });

      if (tempFiles) {
        const oldFiles = tempFiles
          .filter(file => new Date(file.updated_at) < oneDayAgo)
          .map(file => `temp/${file.name}`);

        if (oldFiles.length > 0) {
          await supabase.storage.from(bucket).remove(oldFiles);
          console.log(`Limpiados ${oldFiles.length} archivos temporales`);
        }
      }

    } catch (error) {
      console.warn('Error al limpiar caché:', error);
    }
  }, [bucket]);

  return {
    // Estado
    uploading,
    downloadUrl,
    
    // Acciones
    uploadFile,
    deleteFile,
    listFiles,
    cleanupCache,
    
    // Configuración actual
    config: { bucket, maxSizeKB, allowedTypes },
  };
};