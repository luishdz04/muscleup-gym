import { supabase } from './supabase';

/**
 * Sube un archivo al storage de Supabase y actualiza la referencia en la base de datos
 * @param userId ID del usuario
 * @param file Archivo a subir
 * @param fileType Tipo de archivo ('profile' o 'signature')
 * @returns URL pública del archivo o null en caso de error
 */
export async function uploadUserFile(
  userId: string,
  file: File | null | undefined,
  fileType: 'profile' | 'signature'
) {
  if (!file) {
    console.log(`No se proporcionó archivo para ${fileType}`);
    return null;
  }
  
  try {
    console.log(`Preparando subida de ${fileType} para usuario ${userId}`);

    // Crear FormData para enviar al endpoint
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('fileType', fileType);
    formData.append('file', file);

    // Llamar a nuestra API para subir el archivo
    const response = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error desconocido al subir archivo');
    }

    console.log(`Archivo ${fileType} subido correctamente:`, result.url);
    return result.url;
  } catch (error) {
    console.error(`Error subiendo archivo ${fileType}:`, error);
    throw error;
  }
}