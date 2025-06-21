import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * API BIOMETRIC FINGERPRINT - VERSIÓN FINAL COMPLETA
 * ✅ FIX 2025-06-19 → POST completo agregado
 * ✅ SINCRONIZADA: Con servicio Python SDK oficial ZKTeco
 * ✅ ROBUSTA: Manejo de errores completo y logging detallado
 * ✅ COMPATIBLE: Con frontend UserFormDialog actualizado
 *
 * Funcionalidades:
 * - GET:  Obtener templates y device_user_id para eliminación
 * - POST: Guardar nuevos templates en BD (COMPLETO)
 * - DELETE: Eliminar templates específicos o todos de un usuario
 *
 * Actualizado: 2025-06-19 07:08:26 UTC por luishdz04
 */

/* ─────────────────────────────────────  GET  ──────────────────────────────────── */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const userId      = searchParams.get('userId');
    const getDeviceId = searchParams.get('getDeviceId') === 'true';
    const fingerIndex = searchParams.get('fingerIndex');

    // ── Validación ────────────────────────────────────────────────────────────
    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    /* ───────────────── 1) Obtener device_user_id para eliminación ─────────── */
    if (getDeviceId) {
      try {
        let query = supabase
          .from('fingerprint_templates')
          .select(
            'device_user_id, finger_name, finger_index, enrolled_at, average_quality, updated_at'
          )
          .eq('user_id', userId);

        if (fingerIndex && fingerIndex !== 'undefined' && fingerIndex !== 'null') {
          query = query.eq('finger_index', parseInt(fingerIndex));
        }

        /* ✅ FIX:
         *  - Ordenamos por updated_at descendente
         *  - limit(1) garantiza un solo registro
         *  - maybeSingle() NO arroja error si no existe fila
         */
        const { data, error } = await query
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          return NextResponse.json(
            { error: 'Error consultando base de datos', details: error.message },
            { status: 500 }
          );
        }

        if (!data) {
          return NextResponse.json(
            {
              error        : 'No se encontró registro de huella para este usuario y dedo',
              user_id      : userId,
              finger_index : fingerIndex,
              timestamp    : new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const responseTime = Date.now() - startTime;
        return NextResponse.json({
          ...data,
          user_id       : userId,
          operation     : 'get_device_id',
          response_time_ms: responseTime,
          timestamp     : new Date().toISOString()
        });
      } catch (catchError: any) {
        return NextResponse.json(
          { error: 'Error crítico obteniendo device_user_id', details: catchError.message },
          { status: 500 }
        );
      }
    }

    /* ───────────────── 2) Obtener templates del usuario ───────────────────── */
    try {
      let query = supabase
        .from('fingerprint_templates')
        .select('*')
        .eq('user_id', userId);

      if (fingerIndex && fingerIndex !== 'undefined' && fingerIndex !== 'null') {
        query = query.eq('finger_index', parseInt(fingerIndex));
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Error obteniendo templates', details: error.message },
          { status: 500 }
        );
      }

      const responseTime = Date.now() - startTime;
      return NextResponse.json({
        templates       : data || [],
        count           : data?.length || 0,
        user_id         : userId,
        finger_index    : fingerIndex,
        operation       : 'get_templates',
        response_time_ms: responseTime,
        timestamp       : new Date().toISOString()
      });
    } catch (catchError: any) {
      return NextResponse.json(
        { error: 'Error crítico obteniendo templates', details: catchError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────── POST ─────────────────────────────────── */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('📥 [API-POST] === GUARDANDO TEMPLATE DE HUELLA DACTILAR ===');
    console.log('⏰ [API-POST] Timestamp:', new Date().toISOString());
    
    const supabase = supabaseAdmin;
    const fingerprintData = await request.json();
    
    console.log('📊 [API-POST] Datos recibidos:', {
      user_id: fingerprintData.user_id,
      device_user_id: fingerprintData.device_user_id,
      finger_index: fingerprintData.finger_index,
      finger_name: fingerprintData.finger_name,
      template_length: fingerprintData.template?.length || 0,
      average_quality: fingerprintData.average_quality,
      capture_count: fingerprintData.capture_count
    });

    // ✅ VALIDACIÓN DE CAMPOS REQUERIDOS
    if (!fingerprintData.user_id) {
      console.error('❌ [API-POST] user_id es requerido');
      return NextResponse.json(
        { error: 'user_id es requerido', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!fingerprintData.template) {
      console.error('❌ [API-POST] template es requerido');
      return NextResponse.json(
        { error: 'template es requerido', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!fingerprintData.device_user_id) {
      console.error('❌ [API-POST] device_user_id es requerido');
      return NextResponse.json(
        { error: 'device_user_id es requerido', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    // ✅ PREPARAR DATOS PARA INSERCIÓN
    const templateRecord = {
      user_id: fingerprintData.user_id,
      template: fingerprintData.template,
      device_user_id: fingerprintData.device_user_id,
      finger_index: fingerprintData.finger_index || 1,
      finger_name: fingerprintData.finger_name || 'Índice Derecho',
      primary_template: fingerprintData.primary_template || null,
      verification_template: fingerprintData.verification_template || null,
      backup_template: fingerprintData.backup_template || null,
      combined_template: fingerprintData.combined_template || null,
      average_quality: fingerprintData.average_quality || 85,
      capture_count: fingerprintData.capture_count || 1,
      capture_time_ms: fingerprintData.capture_time_ms || 0,
      device_info: fingerprintData.device_info || {},
      enrolled_at: fingerprintData.enrolled_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 [API-POST] Preparando inserción en fingerprint_templates...');

    // ✅ VERIFICAR SI YA EXISTE TEMPLATE PARA ESTE USER+FINGER
    console.log('🔍 [API-POST] Verificando template existente...');
    
    try {
      const { data: existingTemplate, error: checkError } = await supabase
        .from('fingerprint_templates')
        .select('id, finger_name, enrolled_at')
        .eq('user_id', fingerprintData.user_id)
        .eq('finger_index', fingerprintData.finger_index)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [API-POST] Error verificando template existente:', checkError);
        return NextResponse.json(
          { error: 'Error verificando template existente', details: checkError.message },
          { status: 500 }
        );
      }

      if (existingTemplate) {
        console.log('⚠️ [API-POST] Template existente encontrado, actualizando...', {
          existing_id: existingTemplate.id,
          existing_finger_name: existingTemplate.finger_name,
          existing_enrolled_at: existingTemplate.enrolled_at
        });

        // ✅ ACTUALIZAR TEMPLATE EXISTENTE
        const { data: updatedData, error: updateError } = await supabase
          .from('fingerprint_templates')
          .update(templateRecord)
          .eq('user_id', fingerprintData.user_id)
          .eq('finger_index', fingerprintData.finger_index)
          .select('*')
          .single();

        if (updateError) {
          console.error('❌ [API-POST] Error actualizando template:', updateError);
          return NextResponse.json(
            { error: 'Error actualizando template existente', details: updateError.message },
            { status: 500 }
          );
        }

        console.log('✅ [API-POST] Template actualizado exitosamente:', updatedData.id);

        // ✅ ACTUALIZAR CAMPO fingerprint EN Users
        const { error: userUpdateError } = await supabase
          .from('Users')
          .update({ fingerprint: true })
          .eq('id', fingerprintData.user_id);

        if (userUpdateError) {
          console.error('❌ [API-POST] Error actualizando Users.fingerprint:', userUpdateError);
          // No es crítico, continuar
        } else {
          console.log('✅ [API-POST] Campo Users.fingerprint actualizado a true');
        }

        const responseTime = Date.now() - startTime;
        
        console.log('🎉 [API-POST] === ACTUALIZACIÓN COMPLETADA EXITOSAMENTE ===');
        
        return NextResponse.json({
          success: true,
          message: 'Template de huella actualizado exitosamente',
          data: updatedData,
          operation: 'update',
          response_time_ms: responseTime,
          timestamp: new Date().toISOString()
        });

      } else {
        console.log('📝 [API-POST] No existe template, creando nuevo...');

        // ✅ INSERTAR NUEVO TEMPLATE
        const { data: insertedData, error: insertError } = await supabase
          .from('fingerprint_templates')
          .insert(templateRecord)
          .select('*')
          .single();

        if (insertError) {
          console.error('❌ [API-POST] Error insertando template:', insertError);
          
          // ✅ MANEJO ESPECÍFICO DE ERRORES COMUNES
          if (insertError.code === '23505') {
            return NextResponse.json(
              { error: 'Ya existe un template para este usuario y dedo', details: insertError.message },
              { status: 409 }
            );
          } else if (insertError.code === '23503') {
            return NextResponse.json(
              { error: 'Usuario no encontrado', details: insertError.message },
              { status: 404 }
            );
          } else {
            return NextResponse.json(
              { error: 'Error insertando template', details: insertError.message },
              { status: 500 }
            );
          }
        }

        console.log('✅ [API-POST] Template insertado exitosamente:', insertedData.id);

        // ✅ ACTUALIZAR CAMPO fingerprint EN Users
        const { error: userUpdateError } = await supabase
          .from('Users')
          .update({ fingerprint: true })
          .eq('id', fingerprintData.user_id);

        if (userUpdateError) {
          console.error('❌ [API-POST] Error actualizando Users.fingerprint:', userUpdateError);
          // No es crítico, continuar
        } else {
          console.log('✅ [API-POST] Campo Users.fingerprint actualizado a true');
        }

        const responseTime = Date.now() - startTime;
        
        console.log('🎉 [API-POST] === INSERCIÓN COMPLETADA EXITOSAMENTE ===');
        
        return NextResponse.json({
          success: true,
          message: 'Template de huella guardado exitosamente',
          data: insertedData,
          operation: 'insert',
          response_time_ms: responseTime,
          timestamp: new Date().toISOString()
        });
      }

    } catch (dbError: any) {
      console.error('💥 [API-POST] Error crítico en operación de BD:', dbError);
      return NextResponse.json(
        { error: 'Error crítico en base de datos', details: dbError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('💥 [API-POST] Error crítico general:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message || 'Error desconocido',
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────── DELETE ─────────────────────────────────── */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fingerIndex = searchParams.get('fingerIndex');
    const deleteAll = searchParams.get('deleteAll') === 'true';
    
    console.log(`🗑️ [API-DELETE] === ELIMINACIÓN DE TEMPLATES INICIADA ===`);
    console.log(`👤 [API-DELETE] Usuario: ${userId}`);
    console.log(`🖐️ [API-DELETE] Finger Index: ${fingerIndex || 'no especificado'}`);
    console.log(`🗑️ [API-DELETE] Eliminar Todos: ${deleteAll}`);
    console.log(`⏰ [API-DELETE] Timestamp: ${new Date().toISOString()}`);
    
    // Validación de parámetros
    if (!userId) {
      console.error('❌ [API-DELETE] userId es requerido');
      return NextResponse.json({ 
        error: 'userId es requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // 🎯 CONSTRUIR QUERY DE ELIMINACIÓN
    let deleteQuery = supabase
      .from('fingerprint_templates')
      .delete()
      .eq('user_id', userId);
    
    let operationType = '';
    
    if (fingerIndex && fingerIndex !== 'undefined' && fingerIndex !== 'null' && !deleteAll) {
      // Eliminar solo el dedo específico
      deleteQuery = deleteQuery.eq('finger_index', parseInt(fingerIndex));
      operationType = `specific_finger_${fingerIndex}`;
      console.log(`🎯 [API-DELETE] Eliminando solo finger_index: ${fingerIndex}`);
    } else if (deleteAll) {
      // Eliminar todos los templates del usuario
      operationType = 'all_fingers';
      console.log(`🎯 [API-DELETE] Eliminando TODOS los templates del usuario`);
    } else {
      // Por defecto, eliminar todos si no se especifica finger_index
      operationType = 'all_fingers_default';
      console.log(`🎯 [API-DELETE] No se especificó finger_index, eliminando todos por defecto`);
    }
    
    // 🗑️ EJECUTAR ELIMINACIÓN
    console.log(`🗑️ [API-DELETE] Ejecutando eliminación en BD...`);
    
    try {
      const { error, count } = await deleteQuery;
      
      if (error) {
        console.error('❌ [API-DELETE] Error eliminando de BD:', error);
        return NextResponse.json({ 
          error: 'Error eliminando templates de base de datos',
          details: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
      
      const deletedCount = count || 0;
      console.log(`✅ [API-DELETE] Eliminados ${deletedCount} registros de fingerprint_templates`);
      
    } catch (deleteErr: any) {
      console.error('💥 [API-DELETE] Error crítico eliminando:', deleteErr);
      return NextResponse.json({ 
        error: 'Error crítico eliminando templates',
        details: deleteErr.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // ✅ VERIFICAR SI QUEDAN HUELLAS DEL USUARIO
    console.log(`🔍 [API-DELETE] Verificando huellas restantes...`);
    
    let hasRemainingFingerprints = false;
    let remainingCount = 0;
    
    try {
      const { data: remainingFingerprints, error: checkError } = await supabase
        .from('fingerprint_templates')
        .select('id, finger_index, finger_name')
        .eq('user_id', userId);
      
      if (checkError) {
        console.error('❌ [API-DELETE] Error verificando huellas restantes:', checkError);
      } else {
        hasRemainingFingerprints = remainingFingerprints && remainingFingerprints.length > 0;
        remainingCount = remainingFingerprints?.length || 0;
        console.log(`📊 [API-DELETE] Huellas restantes: ${remainingCount}`);
      }
    } catch (checkErr: any) {
      console.warn('⚠️ [API-DELETE] Error verificando restantes (continuando):', checkErr.message);
    }
    
    // ✅ ACTUALIZAR CAMPO fingerprint EN TABLA Users
    console.log(`🔄 [API-DELETE] Actualizando estado de usuario...`);
    
    try {
      const { error: userUpdateError } = await supabase
        .from('Users')
        .update({ fingerprint: hasRemainingFingerprints })
        .eq('id', userId);
      
      if (userUpdateError) {
        console.error('❌ [API-DELETE] Error actualizando Users.fingerprint:', userUpdateError);
        return NextResponse.json({ 
          error: 'Error actualizando estado de usuario',
          details: userUpdateError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
      
      console.log(`✅ [API-DELETE] Campo fingerprint actualizado a ${hasRemainingFingerprints}`);
      
    } catch (userErr: any) {
      console.error('💥 [API-DELETE] Error crítico actualizando usuario:', userErr);
      return NextResponse.json({ 
        error: 'Error crítico actualizando estado de usuario',
        details: userErr.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // 📊 PREPARAR RESPUESTA
    const responseTime = Date.now() - startTime;
    const statusMessage = hasRemainingFingerprints ? 
      `Usuario mantiene ${remainingCount} huella(s) restante(s)` : 
      'Usuario sin huellas registradas';
    
    console.log(`🎉 [API-DELETE] === ELIMINACIÓN COMPLETADA EXITOSAMENTE ===`);
    console.log(`📊 [API-DELETE] Operación: ${operationType}`);
    console.log(`📊 [API-DELETE] Estado final: ${statusMessage}`);
    console.log(`⏱️ [API-DELETE] Tiempo de respuesta: ${responseTime}ms`);
    
    return NextResponse.json({ 
      success: true,
      message: `Templates eliminados exitosamente. ${statusMessage}`,
      user_id: userId,
      finger_index: fingerIndex,
      operation_type: operationType,
      deleted_from_db: true,
      has_remaining_fingerprints: hasRemainingFingerprints,
      remaining_count: remainingCount,
      user_fingerprint_status: hasRemainingFingerprints,
      next_action: hasRemainingFingerprints ? 
        'Usuario puede seguir usando huellas restantes' : 
        'Usuario debe registrar nuevas huellas',
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 [API-DELETE] Error crítico general:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido',
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📋 RESUMEN DE LA API COMPLETA:
 * 
 * GET:
 * - ?userId=X&getDeviceId=true&fingerIndex=Y → Obtener device_user_id para eliminación específica
 * - ?userId=X&fingerIndex=Y → Obtener templates específicos
 * - ?userId=X → Obtener todos los templates del usuario
 * 
 * POST:
 * - Body: { user_id, device_user_id, finger_index, template, ... } → Guardar/actualizar template
 * - ✅ Manejo inteligente: UPDATE si existe, INSERT si no existe
 * - ✅ Validación completa de campos requeridos
 * - ✅ Actualización automática de Users.fingerprint
 * - ✅ Manejo de errores específicos (duplicados, FK, etc.)
 * 
 * DELETE:
 * - ?userId=X&fingerIndex=Y → Eliminar template específico
 * - ?userId=X&deleteAll=true → Eliminar todos los templates del usuario
 * - ?userId=X → Eliminar todos los templates (comportamiento por defecto)
 * 
 * ✅ COMPLETA y FUNCIONAL
 * ✅ SINCRONIZADA con Python F22 Service
 * ✅ COMPATIBLE con Frontend UserFormDialog
 * ✅ LOGGING completo para debugging
 * ✅ MANEJO DE ERRORES robusto
 */