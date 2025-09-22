// utils/deleteUserPdfs.ts
import { supabaseAdmin } from '@/utils/supabase-admin';

export const deleteAllUserPdfs = async (userId: string): Promise<void> => {
  try {
    console.log('🗑️ Iniciando limpieza de TODOS los PDFs del usuario...');
    
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('user-files')
      .list(userId, { 
        limit: 100,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
    
    if (listError) {
      console.error('❌ Error listando archivos:', listError);
      return;
    }
    
    // ✅ BORRAR TODOS LOS PDFs (no solo los que empiecen con 'contrato-')
    const pdfFiles = files?.filter(file => 
      file.name.endsWith('.pdf')
    ) || [];
    
    if (pdfFiles.length === 0) {
      console.log('ℹ️ No hay PDFs para eliminar');
      return;
    }
    
    const filesToDelete = pdfFiles.map(file => `${userId}/${file.name}`);
    
    const { error: deleteError } = await supabaseAdmin.storage
      .from('user-files')
      .remove(filesToDelete);
    
    if (deleteError) {
      console.error('❌ Error eliminando PDFs:', deleteError);
    } else {
      console.log(`✅ Eliminados ${filesToDelete.length} PDFs exitosamente`);
    }
    
  } catch (error) {
    console.error('💥 Error en deleteAllUserPdfs:', error);
  }
};