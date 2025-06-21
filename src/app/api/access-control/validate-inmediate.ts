// 📁 /pages/api/access-control/validate-immediate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface AccessValidationResult {
  access_granted: boolean;
  user_name: string;
  reason: string;
  membership_type?: string;
  end_date?: string;
  membership_expired?: boolean;
  outside_hours?: boolean;
  system_error?: boolean;
  validation_time_ms?: number;
  device_user_id?: number;
}

// 🔧 Crear cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<AccessValidationResult>
) {
  const startTime = Date.now();
  
  // 🔧 CORS para el servicio Python
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      access_granted: false,
      user_name: 'Error',
      reason: 'Método no permitido'
    });
  }

  try {
    const { device_user_id, timestamp = new Date().toISOString() } = req.body;
    
    console.log(`\n🔍 [${new Date().toLocaleString()}] === VALIDACIÓN DE ACCESO ===`);
    console.log(`   👤 Device User ID: ${device_user_id}`);
    console.log(`   🕐 Timestamp: ${timestamp}`);
    
    if (!device_user_id) {
      console.log('❌ device_user_id no proporcionado');
      return res.json({
        access_granted: false,
        user_name: 'Error',
        reason: 'device_user_id requerido',
        validation_time_ms: Date.now() - startTime
      });
    }

    // 1️⃣ BUSCAR USUARIO POR device_user_id (CORREGIDO)
    console.log('🔍 Paso 1: Buscando usuario por device_user_id...');
    
    const { data: fingerprintData, error: fingerprintError } = await supabase
      .from('fingerprint_templates')
      .select(`
        user_id,
        device_user_id,
        template_data,
        created_at,
        Users!inner(
          id, 
          firstName, 
          lastName, 
          email,
          phone
        )
      `)
      .eq('device_user_id', device_user_id)
      .maybeSingle(); // ⚡ CLAVE: usar maybeSingle() en lugar de single()

    if (fingerprintError) {
      console.log(`❌ Error en query fingerprint: ${fingerprintError.message}`);
      return res.json({
        access_granted: false,
        user_name: 'Error BD',
        reason: 'Error consultando base de datos',
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    if (!fingerprintData) {
      console.log('❌ Usuario no encontrado en fingerprint_templates');
      return res.json({
        access_granted: false,
        user_name: 'Usuario Desconocido',
        reason: 'Usuario no registrado en el sistema',
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    // ✅ AHORA fingerprintData.Users es un OBJETO (no array)
    const user = fingerprintData.Users;
    console.log(`✅ Usuario encontrado: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    // 2️⃣ VERIFICAR MEMBRESÍA ACTIVA (CORREGIDO)
    console.log('🎫 Paso 2: Verificando membresía activa...');
    
    const { data: membershipData, error: membershipError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        userid,
        planid,
        start_date,
        end_date,
        status,
        created_at,
        membership_plans!inner(
          id, 
          name, 
          duration_days,
          description
        )
      `)
      .eq('userid', user.id)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1);

    if (membershipError) {
      console.log(`❌ Error en query membresía: ${membershipError.message}`);
      return res.json({
        access_granted: false,
        user_name: `${user.firstName} ${user.lastName}`,
        reason: 'Error consultando membresía',
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    if (!membershipData || membershipData.length === 0) {
      console.log('❌ Sin membresía activa');
      await logAccessAttempt(user.id, device_user_id, false, 'Sin membresía activa');
      
      return res.json({
        access_granted: false,
        user_name: `${user.firstName} ${user.lastName}`,
        reason: 'Sin membresía activa',
        membership_expired: true,
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    // ✅ AHORA membershipData[0].membership_plans es un OBJETO (no array)
    const membership = membershipData[0];
    const membershipPlan = membership.membership_plans;
    console.log(`✅ Membresía encontrada: ${membershipPlan.name}`);
    console.log(`   📅 Vigencia: ${membership.start_date} → ${membership.end_date}`);

    // 3️⃣ VERIFICAR FECHA DE VENCIMIENTO
    console.log('📅 Paso 3: Verificando vigencia...');
    const today = new Date().toISOString().split('T')[0];
    const endDate = membership.end_date;
    
    if (endDate < today) {
      console.log(`❌ Membresía vencida: ${endDate} (hoy: ${today})`);
      await logAccessAttempt(user.id, device_user_id, false, `Membresía vencida el ${endDate}`);
      
      return res.json({
        access_granted: false,
        user_name: `${user.firstName} ${user.lastName}`,
        reason: `Membresía vencida el ${endDate}`,
        membership_type: membershipPlan.name,
        end_date: endDate,
        membership_expired: true,
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    console.log(`✅ Membresía vigente hasta: ${endDate}`);

    // 4️⃣ VERIFICAR RESTRICCIONES DE HORARIO
    console.log('⏰ Paso 4: Verificando restricciones de horario...');
    const timeValidation = await validateAccessTime(membership.planid, timestamp);
    
    if (!timeValidation.valid) {
      console.log(`❌ Fuera de horario: ${timeValidation.reason}`);
      await logAccessAttempt(user.id, device_user_id, false, timeValidation.reason);
      
      return res.json({
        access_granted: false,
        user_name: `${user.firstName} ${user.lastName}`,
        reason: timeValidation.reason,
        membership_type: membershipPlan.name,
        outside_hours: true,
        device_user_id: device_user_id,
        validation_time_ms: Date.now() - startTime
      });
    }

    console.log('✅ Horario válido');

    // ✅ TODO VÁLIDO - PERMITIR ACCESO
    const validationTime = Date.now() - startTime;
    console.log(`✅ ACCESO AUTORIZADO para ${user.firstName} ${user.lastName}`);
    console.log(`   ⚡ Tiempo de validación: ${validationTime}ms`);
    console.log(`   🎫 Plan: ${membershipPlan.name}`);
    console.log(`   📅 Válida hasta: ${endDate}`);
    
    await logAccessAttempt(user.id, device_user_id, true, 'Acceso autorizado');

    return res.json({
      access_granted: true,
      user_name: `${user.firstName} ${user.lastName}`,
      membership_type: membershipPlan.name,
      end_date: endDate,
      reason: 'Acceso autorizado',
      device_user_id: device_user_id,
      validation_time_ms: validationTime
    });

  } catch (error: any) {
    const validationTime = Date.now() - startTime;
    console.error('💥 Error fatal en validación:', error);
    
    return res.json({
      access_granted: false,
      user_name: 'Error del Sistema',
      reason: 'Error interno del servidor',
      system_error: true,
      validation_time_ms: validationTime
    });
  }
}

// 🔧 FUNCIÓN PARA VALIDAR HORARIOS (CORREGIDA)
async function validateAccessTime(planId: string, timestamp: string) {
  try {
    const now = new Date(timestamp);
    const mexicoTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
    
    const dayOfWeek = mexicoTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeOfDay = mexicoTime.toTimeString().slice(0, 5);
    
    console.log(`   ⏰ Validando: ${dayOfWeek} a las ${timeOfDay} (México)`);

    // 🔍 Verificar restricciones (CORREGIDO)
    const { data: restrictions, error } = await supabase
      .from('plan_access_restrictions')
      .select('*')
      .eq('plan_id', planId)
      .maybeSingle(); // ⚡ CLAVE: usar maybeSingle()

    if (error) {
      console.log(`   ⚠️ Error consultando restricciones: ${error.message}`);
      return { valid: true }; // En caso de error, permitir acceso
    }

    if (!restrictions) {
      console.log('   ⚠️ No hay restricciones específicas - acceso libre 24/7');
      return { valid: true };
    }

    if (!restrictions.has_time_restrictions) {
      console.log('   ✅ Plan sin restricciones de horario');
      return { valid: true };
    }

    console.log(`   🔍 Aplicando restricciones:`);
    console.log(`      📅 Días: ${restrictions.allowed_days?.join(', ') || 'Todos'}`);
    console.log(`      ⏰ Horario: ${restrictions.access_start_time || '00:00'} - ${restrictions.access_end_time || '23:59'}`);

    // Validar día de la semana
    const allowedDays = restrictions.allowed_days || [];
    if (allowedDays.length > 0 && !allowedDays.includes(dayOfWeek)) {
      return { 
        valid: false, 
        reason: `Acceso no permitido los ${dayOfWeek}s` 
      };
    }

    // Validar horario
    const startTime = restrictions.access_start_time || '00:00';
    const endTime = restrictions.access_end_time || '23:59';
    
    if (timeOfDay < startTime || timeOfDay > endTime) {
      return { 
        valid: false, 
        reason: `Fuera de horario permitido (${startTime} - ${endTime})` 
      };
    }

    console.log('   ✅ Todas las restricciones cumplidas');
    return { valid: true };

  } catch (error) {
    console.error('   ⚠️ Error validando horario:', error);
    return { valid: true };
  }
}

// 🔧 FUNCIÓN PARA REGISTRAR LOGS
async function logAccessAttempt(
  userId: string, 
  deviceUserId: number, 
  success: boolean, 
  reason: string
) {
  try {
    const { error } = await supabase
      .from('access_logs')
      .insert({
        user_id: userId,
        device_id: 'F22-MAIN',
        access_type: success ? 'entry' : 'denied',
        access_method: 'fingerprint',
        success: success,
        denial_reason: success ? null : reason,
        device_timestamp: new Date().toISOString(),
        device_user_id: deviceUserId
      });

    if (error) {
      console.error('❌ Error guardando log:', error.message);
    } else {
      console.log(`📊 Log guardado: ${success ? 'ÉXITO' : 'DENEGADO'} - ${reason}`);
    }
      
  } catch (error) {
    console.error('💥 Error registrando log:', error);
  }
}