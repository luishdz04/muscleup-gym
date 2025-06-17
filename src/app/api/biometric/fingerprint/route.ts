import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const fingerprintData = await request.json();
    
    console.log('📥 API: Recibiendo datos de huella:', fingerprintData);
    
    // 🗑️ PRIMERO ELIMINAR REGISTROS EXISTENTES DEL MISMO USUARIO Y DEDO
    const { error: deleteError } = await supabase
      .from('fingerprint_templates')
      .delete()
      .eq('user_id', fingerprintData.user_id)
      .eq('finger_index', fingerprintData.finger_index);
    
    if (deleteError) {
      console.warn('⚠️ API: Error eliminando registros previos:', deleteError);
    }
    
    // 🔄 INSERTAR NUEVO REGISTRO ÚNICO
    const { data, error } = await supabase
      .from('fingerprint_templates')
      .insert(fingerprintData)
      .select();
    
    if (error) {
      console.error('❌ API: Error en Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // ✅ ACTUALIZAR CAMPO fingerprint EN TABLA Users
    const { error: userUpdateError } = await supabase
      .from('Users')
      .update({ fingerprint: true })
      .eq('id', fingerprintData.user_id);
    
    if (userUpdateError) {
      console.warn('⚠️ API: Error actualizando campo fingerprint en Users:', userUpdateError);
    }
    
    console.log('✅ API: Huella guardada exitosamente:', data);
    
    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: 'Huella dactilar registrada exitosamente con 3 capturas'
    });
    
  } catch (error: any) {
    console.error('💥 API: Error crítico:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fingerIndex = searchParams.get('fingerIndex');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }
    
    console.log('🗑️ API: Eliminando huellas para usuario:', userId, 'dedo:', fingerIndex);
    
    // 🎯 ELIMINAR ESPECÍFICAMENTE POR USUARIO Y DEDO (SI SE PROPORCIONA)
    let deleteQuery = supabase
      .from('fingerprint_templates')
      .delete()
      .eq('user_id', userId);
    
    if (fingerIndex) {
      deleteQuery = deleteQuery.eq('finger_index', parseInt(fingerIndex));
    }
    
    const { error, count } = await deleteQuery;
    
    if (error) {
      console.error('❌ API: Error eliminando huellas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`🗑️ API: Eliminados ${count || 0} registros de fingerprint_templates`);
    
    // ✅ VERIFICAR SI QUEDAN HUELLAS DEL USUARIO EN LA TABLA
    const { data: remainingFingerprints, error: checkError } = await supabase
      .from('fingerprint_templates')
      .select('id')
      .eq('user_id', userId);
    
    if (checkError) {
      console.error('❌ API: Error verificando huellas restantes:', checkError);
    }
    
    const hasFingerprints = remainingFingerprints && remainingFingerprints.length > 0;
    
    console.log(`🔍 API: Huellas restantes para usuario ${userId}:`, remainingFingerprints?.length || 0);
    
    // ✅ ACTUALIZAR CAMPO fingerprint EN TABLA Users
    // Si no quedan huellas, marcar como false
    // Si quedan huellas, marcar como true
    const { error: userUpdateError } = await supabase
      .from('Users')
      .update({ fingerprint: hasFingerprints })
      .eq('id', userId);
    
    if (userUpdateError) {
      console.error('❌ API: Error actualizando campo fingerprint en Users:', userUpdateError);
      return NextResponse.json({ 
        error: `Error actualizando estado de usuario: ${userUpdateError.message}` 
      }, { status: 500 });
    }
    
    console.log(`✅ API: Campo fingerprint actualizado a ${hasFingerprints} para usuario ${userId}`);
    
    return NextResponse.json({ 
      success: true,
      deletedCount: count || 0,
      hasRemainingFingerprints: hasFingerprints,
      userFingerprintStatus: hasFingerprints,
      message: `Eliminadas ${count || 0} huellas. Estado de usuario actualizado a ${hasFingerprints ? 'CON' : 'SIN'} huellas.`
    });
    
  } catch (error: any) {
    console.error('💥 API: Error eliminando huellas:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}