import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const fileType = formData.get('fileType') as 'profile' | 'signature';
    const file = formData.get('file') as File;

    if (!userId || !fileType || !file) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    console.log(`Subiendo archivo ${fileType} para usuario ${userId}`);

    // Asegurarse de que existe el bucket
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'user-files')) {
        await supabaseAdmin.storage.createBucket('user-files', {
          public: true
        });
      }
    } catch (bucketError) {
      console.error("Error verificando/creando bucket:", bucketError);
    }

    // Preparar nombre de archivo
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${userId}/${fileType}-${Date.now()}.${fileExt}`;
    
    // Leer el archivo como array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir archivo
    const { error: uploadError, data } = await supabaseAdmin.storage
      .from('user-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError);
      return NextResponse.json(
        { success: false, message: `Error al subir archivo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('user-files')
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { success: false, message: 'No se pudo obtener URL pública' },
        { status: 500 }
      );
    }

    // Actualizar referencia en la base de datos
    const column = fileType === 'profile' ? 'profilePictureUrl' : 'signatureUrl';
    
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({ [column]: publicUrlData.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error("Error actualizando referencia en DB:", updateError);
      return NextResponse.json(
        { success: false, message: `Error al actualizar referencia: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo subido correctamente',
      url: publicUrlData.publicUrl
    });

  } catch (error) {
    console.error("Error procesando archivo:", error);
    return NextResponse.json(
      { success: false, message: `Error al procesar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

// Esta configuración es necesaria para desactivar el bodyParser predeterminado
// y poder manejar formData con archivos
export const config = {
  api: {
    bodyParser: false,
  },
};