// ===================================================================
// services/fileService.ts - Service para manejo de archivos
// ===================================================================

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export interface UploadFileOptions {
  bucket?: string;
  folder?: string;
  fileName?: string;
  replace?: boolean;
  maxSizeKB?: number;
  allowedTypes?: string[];
}

export interface FileInfo {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

class FileService {
  private supabase = createBrowserSupabaseClient();
  private defaultBucket = 'user-files';

  // 📤 SUBIR ARCHIVO
  async uploadFile(
    file: File,
    userId: string,
    fileType: 'profile' | 'signature' | 'contract' | 'document',
    options: UploadFileOptions = {}
  ): Promise<ApiResponse<FileInfo>> {
    try {
      const {
        bucket = this.defaultBucket,
        replace = true,
        maxSizeKB = 5000,
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      } = options;

      // ✅ VALIDACIONES
      if (!file) {
        throw new Error('No se proporcionó ningún archivo');
      }

      if (file.size > maxSizeKB * 1024) {
        throw new Error(`Archivo muy grande. Máximo ${maxSizeKB}KB permitidos`);
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`);
      }

      // 📂 GENERAR RUTA DEL ARCHIVO
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileType}-${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // 🗑️ ELIMINAR ARCHIVO ANTERIOR SI SE REEMPLAZA
      if (replace) {
        const { data: existingFiles } = await this.supabase.storage
          .from(bucket)
          .list(userId, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (existingFiles) {
          const oldFiles = existingFiles
            .filter(f => f.name.startsWith(fileType))
            .map(f => `${userId}/${f.name}`);
          
          if (oldFiles.length > 0) {
            await this.supabase.storage.from(bucket).remove(oldFiles);
          }
        }
      }

      // 📤 SUBIR NUEVO ARCHIVO
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      // 🔗 OBTENER URL PÚBLICA
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      const fileInfo: FileInfo = {
        name: fileName,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };

      return {
        success: true,
        data: fileInfo,
        message: 'Archivo subido exitosamente',
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al subir archivo',
      };
    }
  }

  // 🗑️ ELIMINAR ARCHIVO
  async deleteFile(
    userId: string,
    fileName: string,
    bucket: string = this.defaultBucket
  ): Promise<ApiResponse<void>> {
    try {
      const filePath = `${userId}/${fileName}`;
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Error al eliminar archivo: ${error.message}`);
      }

      return {
        success: true,
        message: 'Archivo eliminado exitosamente',
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al eliminar archivo',
      };
    }
  }

  // 📋 LISTAR ARCHIVOS DE USUARIO
  async listUserFiles(
    userId: string,
    bucket: string = this.defaultBucket
  ): Promise<ApiResponse<FileInfo[]>> {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(bucket)
        .list(userId, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Error al listar archivos: ${error.message}`);
      }

      if (!files) {
        return {
          success: true,
          data: [],
        };
      }

      // 🔗 GENERAR URLs PÚBLICAS
      const fileInfos: FileInfo[] = files.map(file => ({
        name: file.name,
        url: this.supabase.storage.from(bucket).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        uploadedAt: new Date(file.updated_at),
      }));

      return {
        success: true,
        data: fileInfos,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al listar archivos',
      };
    }
  }

  // 🧹 LIMPIAR ARCHIVOS TEMPORALES
  async cleanupTempFiles(
    olderThanHours: number = 24,
    bucket: string = this.defaultBucket
  ): Promise<ApiResponse<number>> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      const { data: tempFiles, error } = await this.supabase.storage
        .from(bucket)
        .list('temp', { limit: 1000 });

      if (error) {
        throw new Error(`Error al listar archivos temporales: ${error.message}`);
      }

      if (!tempFiles || tempFiles.length === 0) {
        return {
          success: true,
          data: 0,
          message: 'No hay archivos temporales para limpiar',
        };
      }

      const filesToDelete = tempFiles
        .filter(file => new Date(file.updated_at) < cutoffTime)
        .map(file => `temp/${file.name}`);

      if (filesToDelete.length === 0) {
        return {
          success: true,
          data: 0,
          message: 'No hay archivos temporales antiguos para limpiar',
        };
      }

      const { error: deleteError } = await this.supabase.storage
        .from(bucket)
        .remove(filesToDelete);

      if (deleteError) {
        throw new Error(`Error al eliminar archivos temporales: ${deleteError.message}`);
      }

      return {
        success: true,
        data: filesToDelete.length,
        message: `${filesToDelete.length} archivos temporales eliminados`,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al limpiar archivos temporales',
      };
    }
  }
}

// Instancia singleton del service
export const fileService = new FileService();
