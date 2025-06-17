import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();
    
    const { data: attempts, error: attemptsError } = await supabase
      .from('access_logs')
      .select(`
        *,
        user:Users(firstName, lastName, profilePictureUrl, rol),
        device:biometric_devices(name, type, ip_address)
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (attemptsError) {
      console.error('❌ Error fetching attempts:', attemptsError);
      throw new Error(`Error fetching attempts: ${attemptsError.message}`);
    }

    console.log(`✅ Found ${attempts?.length || 0} access attempts`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttempts = attempts?.filter(attempt => 
      new Date(attempt.created_at) >= today
    ) || [];

    const stats = {
      totalToday: todayAttempts.length,
      successfulToday: todayAttempts.filter(a => a.success).length,
      deniedToday: todayAttempts.filter(a => !a.success).length,
      currentlyInside: 0,
      averageConfidence: todayAttempts.length > 0 
        ? Math.round(todayAttempts.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / todayAttempts.length)
        : 0
    };

    const userEntries = new Map();
    todayAttempts
      .filter(a => a.success)
      .forEach(attempt => {
        if (attempt.access_type === 'entry') {
          userEntries.set(attempt.user_id, true);
        } else if (attempt.access_type === 'exit') {
          userEntries.delete(attempt.user_id);
        }
      });
    
    stats.currentlyInside = userEntries.size;

    return NextResponse.json({
      success: true,
      attempts: attempts || [],
      stats
    });

  } catch (error: any) {
    console.error('❌ Error in recent-attempts API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createAsyncServerSupabaseClient();

    // ✅ Buscar específicamente por luishdz04
    console.log('🧪 Buscando usuario luishdz04...');

    const { data: users, error: userError } = await supabase
      .from('Users')
      .select('id, firstName, lastName, profilePictureUrl, rol, fingerprint')
      .or('id.eq.luishdz04,email.ilike.%luishdz04%,firstName.ilike.%luis%')
      .limit(1);

    let user = users?.[0];

    if (userError || !user) {
      console.log('❌ Usuario luishdz04 no encontrado, creando usuario de prueba...');
      
      const { data: newUser, error: createError } = await supabase
        .from('Users')
        .insert({
          id: 'luishdz04', // ✅ ID específico
          firstName: 'Luis',
          lastName: 'Hernandez',
          email: 'luishdz04@example.com',
          rol: 'cliente',
          fingerprint: false,
          whatsapp: '+52123456789',
          birthDate: '1995-06-17',
          gender: 'Masculino',
          maritalStatus: 'Soltero',
          isMinor: false
        })
        .select('id, firstName, lastName, profilePictureUrl, rol, fingerprint')
        .single();

      if (createError) {
        console.error('❌ Error creando usuario:', createError);
        return NextResponse.json(
          { error: 'No se pudo encontrar o crear usuario luishdz04' },
          { status: 404 }
        );
      }

      user = newUser;
      console.log('✅ Usuario luishdz04 creado exitosamente');
    }

    console.log('👤 Usuario encontrado:', user.firstName, user.lastName);

    // Verificar huella
    const { data: fingerprint, error: fingerprintError } = await supabase
      .from('fingerprint_templates')
      .select('id, average_quality')
      .eq('user_id', user.id)
      .single();

    const hasFingerprint = !!fingerprint && !fingerprintError;
    const confidence_score = hasFingerprint ? (fingerprint.average_quality || 85) : 0;

    console.log('🖐️ Huella detectada:', hasFingerprint, 'Calidad:', confidence_score);

    // Si no tiene huella, crear una de prueba
    if (!hasFingerprint) {
      console.log('🖐️ Creando huella de prueba para luishdz04...');
      
      const { data: newFingerprint, error: fingerprintCreateError } = await supabase
        .from('fingerprint_templates')
        .insert({
          user_id: user.id,
          template: 'test_template_data_' + Date.now(),
          finger_index: 1,
          finger_name: 'Índice Derecho',
          average_quality: 92,
          capture_count: 3,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!fingerprintCreateError) {
        console.log('✅ Huella de prueba creada');
        
        // Actualizar usuario para marcar que tiene huella
        await supabase
          .from('Users')
          .update({ fingerprint: true })
          .eq('id', user.id);
        
        user.fingerprint = true;
      }
    }

    // Recalcular después de posible creación de huella
    const finalHasFingerprint = hasFingerprint || (!fingerprintError && user.fingerprint);
    const finalConfidence = finalHasFingerprint ? 92 : 0;
    const success = finalHasFingerprint && user.fingerprint && finalConfidence >= 70;

    // Obtener o crear dispositivo
    let { data: device, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('ip_address', '192.168.1.100')
      .single();

    if (deviceError || !device) {
      console.log('📟 Creando dispositivo de prueba...');
      const { data: newDevice } = await supabase
        .from('biometric_devices')
        .insert({
          name: 'ZKTeco Test Device',
          type: 'zk9500',
          ip_address: '192.168.1.100',
          port: 4370,
          status: 'connected',
          fingerprint_count: 1,
          is_active: true
        })
        .select()
        .single();

      device = newDevice;
    }

    // Crear log de acceso
    const accessLog = {
      user_id: user.id,
      device_id: device?.id || null,
      access_type: body.access_type || 'entry',
      access_method: body.access_method || 'fingerprint',
      success: success,
      confidence_score: finalConfidence,
      denial_reason: success ? null : (finalHasFingerprint ? 'Baja confianza' : 'Sin huella registrada'),
      membership_status: 'active',
      device_timestamp: new Date().toISOString()
    };

    const { data: newLog, error: logError } = await supabase
      .from('access_logs')
      .insert(accessLog)
      .select(`
        *,
        user:Users(firstName, lastName, profilePictureUrl, rol),
        device:biometric_devices(name, type, ip_address)
      `)
      .single();

    if (logError) {
      console.error('❌ Error creando log:', logError);
      throw new Error(`Error creating access log: ${logError.message}`);
    }

    console.log('✅ Log de acceso creado:', newLog.id);

    return NextResponse.json({
      success: true,
      accessLog: newLog,
      fingerprint_detected: finalHasFingerprint,
      confidence_score: finalConfidence,
      access_granted: success,
      message: success 
        ? '🎉 Acceso concedido - Huella verificada correctamente' 
        : finalHasFingerprint 
          ? '⚠️ Acceso denegado - Calidad de huella insuficiente' 
          : '❌ Acceso denegado - Sin huella registrada'
    });

  } catch (error: any) {
    console.error('❌ Error in POST access attempt:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}