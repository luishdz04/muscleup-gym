import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// 🎯 TIPOS PARA LA API DE VERIFICACIÓN
interface VerifyRequest {
  deviceId: string;
  template?: string; // Template capturado para verificar
  userId?: string; // Para verificación específica de usuario
  mode?: 'auto' | 'manual';
  timeout?: number;
  threshold?: number; // Umbral de confianza (0-100)
}

interface VerificationResult {
  matched: boolean;
  userId?: string;
  userName?: string;
  confidence: number;
  deviceUserId?: number;
  verifiedAt: string;
  accessGranted: boolean;
  reason?: string;
  membershipStatus?: string;
  accessLevel?: string;
}

interface VerificationSession {
  id: string;
  deviceId: string;
  status: 'waiting' | 'capturing' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  timeout: number;
  mode: 'auto' | 'manual';
  threshold: number;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data?: VerificationResult | VerificationSession;
  error?: string;
}

// 🗂️ MAPA DE VERIFICACIONES ACTIVAS
const activeVerifications = new Map<string, VerificationSession>();

// 🚀 POST: INICIAR/PROCESAR VERIFICACIÓN - ✅ COMPLETAMENTE CORREGIDO
export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    console.log('🔍 API: Procesando verificación biométrica...');
    
    // ✅ CORRECTO PARA NEXTJS 15: cookies() retorna la promesa directamente
    const supabase = createRouteHandlerClient(request);
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado',
        error: 'Sesión requerida'
      }, { status: 401 });
    }

    // Parsear body
    const body: VerifyRequest = await request.json();
    
    // Validar dispositivo requerido
    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo requerido',
        error: 'deviceId es requerido para verificación'
      }, { status: 400 });
    }

    console.log('📝 Datos de verificación:', {
      deviceId: body.deviceId,
      hasTemplate: !!body.template,
      userId: body.userId,
      mode: body.mode || 'auto'
    });

    // Verificar que el dispositivo existe y está conectado
    const { data: deviceData, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('id', body.deviceId)
      .eq('type', 'zk9500')
      .eq('is_active', true)
      .single();

    if (deviceError || !deviceData) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado',
        error: 'El dispositivo ZK9500 especificado no existe o no está activo'
      }, { status: 404 });
    }

    if (deviceData.status !== 'connected') {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no conectado',
        error: 'El dispositivo ZK9500 no está conectado'
      }, { status: 503 });
    }

    // Si se proporciona template, procesar verificación inmediatamente
    if (body.template) {
      const verificationResult = await processVerification(
        body.template, 
        body.deviceId,
        supabase,
        body.userId,
        body.threshold || 80
      );

      // Registrar log de acceso
      await logAccessAttempt(
        supabase,
        body.deviceId,
        verificationResult.userId,
        verificationResult.matched,
        verificationResult.confidence,
        verificationResult.reason || 'Verificación biométrica'
      );

      return NextResponse.json({
        success: true,
        message: verificationResult.matched ? 
          '✅ Verificación exitosa - Acceso permitido' : 
          '❌ Verificación fallida - Acceso denegado',
        data: verificationResult
      });
    }

    // Si no hay template, iniciar sesión de verificación en modo espera
    const verificationId = `verify_${body.deviceId}_${Date.now()}`;
    const timeout = body.timeout || 30000; // 30 segundos por defecto

    const verificationSession: VerificationSession = {
      id: verificationId,
      deviceId: body.deviceId,
      status: 'waiting',
      startedAt: new Date().toISOString(),
      timeout,
      mode: body.mode || 'auto',
      threshold: body.threshold || 80
    };

    activeVerifications.set(verificationId, verificationSession);

    // Configurar timeout
    setTimeout(() => {
      handleVerificationTimeout(verificationId);
    }, timeout);

    console.log(`✅ Sesión de verificación iniciada: ${verificationId}`);

    return NextResponse.json({
      success: true,
      message: '🔍 Sesión de verificación iniciada - Esperando huella',
      data: verificationSession
    });

  } catch (error: any) {
    console.error('❌ Error en verificación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en verificación biométrica',
      error: error.message
    }, { status: 500 });
  }
}

// 📊 GET: OBTENER ESTADO DE VERIFICACIONES - ✅ COMPLETAMENTE CORREGIDO
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 API: Obteniendo estado de verificaciones...');
    
    // ✅ CORRECTO PARA NEXTJS 15: cookies() retorna la promesa directamente
    const supabase = createRouteHandlerClient(request);
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('verificationId');
    const deviceId = searchParams.get('deviceId');

    // Si se solicita una verificación específica
    if (verificationId) {
      const verification = activeVerifications.get(verificationId);
      
      if (!verification) {
        return NextResponse.json({
          success: false,
          message: 'Verificación no encontrada',
          error: 'La verificación especificada no existe o ya terminó'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Estado de verificación obtenido',
        data: verification
      });
    }

    // Filtrar por dispositivo si se especifica
    let verifications = Array.from(activeVerifications.values());
    if (deviceId) {
      verifications = verifications.filter(v => v.deviceId === deviceId);
    }

    return NextResponse.json({
      success: true,
      message: 'Verificaciones activas obtenidas',
      data: {
        activeVerifications: verifications,
        totalActive: verifications.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo verificaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo verificaciones',
      error: error.message
    }, { status: 500 });
  }
}

// 🔍 PROCESAR VERIFICACIÓN BIOMÉTRICA - ✅ COMPLETAMENTE CORREGIDO
async function processVerification(
  template: string,
  deviceId: string,
  supabase: any,
  targetUserId?: string,
  threshold: number = 80
): Promise<VerificationResult> {
  try {
    console.log('🔍 Procesando verificación biométrica...');
    
    // Obtener templates activos del dispositivo
    let templateQuery = supabase
      .from('fingerprint_templates')
      .select(`
        id,
        user_id,
        device_user_id,
        finger_index,
        template_data,
        quality_score,
        Users!inner (
          id,
          firstName,
          lastName,
          rol,
          membershipExpiry,
          isActive
        )
      `)
      .eq('device_id', deviceId)
      .eq('is_active', true);

    // Si se especifica usuario objetivo, filtrar por él
    if (targetUserId) {
      templateQuery = templateQuery.eq('user_id', targetUserId);
    }

    const { data: templates, error: templatesError } = await templateQuery;

    if (templatesError) {
      console.error('❌ Error obteniendo templates:', templatesError);
      throw templatesError;
    }

    if (!templates || templates.length === 0) {
      return {
        matched: false,
        confidence: 0,
        verifiedAt: new Date().toISOString(),
        accessGranted: false,
        reason: targetUserId ? 'Usuario no tiene huella registrada' : 'No hay templates registrados en el dispositivo'
      };
    }

    console.log(`🔍 Comparando con ${templates.length} template(s)...`);

    // Comparar template con cada template registrado
    let bestMatch = {
      confidence: 0,
      template: null as any,
      user: null as any
    };

    for (const templateRecord of templates) {
      const confidence = await compareTemplates(template, templateRecord.template_data);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          confidence,
          template: templateRecord,
          user: templateRecord.Users
        };
      }
    }

    console.log(`🎯 Mejor coincidencia: ${bestMatch.confidence}% (umbral: ${threshold}%)`);

    // Verificar si la confianza supera el umbral
    const matched = bestMatch.confidence >= threshold;

    if (!matched) {
      return {
        matched: false,
        confidence: bestMatch.confidence,
        verifiedAt: new Date().toISOString(),
        accessGranted: false,
        reason: `Confianza insuficiente: ${bestMatch.confidence}% < ${threshold}%`
      };
    }

    // Usuario identificado - verificar permisos de acceso
    const user = bestMatch.user;
    const accessCheck = await checkAccessPermissions(user);

    const result: VerificationResult = {
      matched: true,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      confidence: bestMatch.confidence,
      deviceUserId: bestMatch.template.device_user_id,
      verifiedAt: new Date().toISOString(),
      accessGranted: accessCheck.granted,
      reason: accessCheck.reason,
      membershipStatus: accessCheck.membershipStatus,
      accessLevel: user.rol
    };

    console.log(`✅ Verificación completada para ${result.userName}: ${accessCheck.granted ? 'PERMITIDO' : 'DENEGADO'}`);

    return result;

  } catch (error: any) {
    console.error('❌ Error procesando verificación:', error);
    return {
      matched: false,
      confidence: 0,
      verifiedAt: new Date().toISOString(),
      accessGranted: false,
      reason: `Error de sistema: ${error.message}`
    };
  }
}

// 🔍 COMPARAR TEMPLATES BIOMÉTRICOS - ✅ COMPLETAMENTE CORREGIDO
async function compareTemplates(template1: string, template2: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      // ✅ Simular comparación biométrica para desarrollo
      // En producción real, esto sería el algoritmo de matching del ZK9500
      
      setTimeout(() => {
        // Simular algoritmo de matching
        let confidence = 0;
        
        // Verificar longitud similar (templates válidos)
        if (Math.abs(template1.length - template2.length) <= 50) {
          // Simular comparación de características
          const similarity = calculateTemplateSimilarity(template1, template2);
          confidence = Math.round(similarity * 100);
          
          // Agregar algo de variabilidad realista
          const variance = (Math.random() - 0.5) * 10; // ±5%
          confidence = Math.max(0, Math.min(100, confidence + variance));
        }
        
        resolve(confidence);
      }, 100 + Math.random() * 200); // Simular tiempo de procesamiento
      
    } catch (error) {
      console.error('❌ Error comparando templates:', error);
      resolve(0);
    }
  });
}

// 🧮 CALCULAR SIMILITUD DE TEMPLATES - ✅ COMPLETAMENTE CORREGIDO
function calculateTemplateSimilarity(template1: string, template2: string): number {
  // Simulación básica de similitud para desarrollo
  // En producción real, esto sería el algoritmo propietario de ZKTeco
  
  if (template1 === template2) return 1.0; // Coincidencia exacta
  
  // Simular coincidencia parcial basada en contenido
  const minLength = Math.min(template1.length, template2.length);
  let matches = 0;
  
  for (let i = 0; i < Math.min(100, minLength); i += 10) {
    if (template1.substr(i, 10) === template2.substr(i, 10)) {
      matches++;
    }
  }
  
  const baseSimilarity = matches / 10;
  
  // Ajustar por longitud similar
  const lengthSimilarity = 1 - Math.abs(template1.length - template2.length) / Math.max(template1.length, template2.length);
  
  return (baseSimilarity * 0.7 + lengthSimilarity * 0.3);
}

// 🔐 VERIFICAR PERMISOS DE ACCESO - ✅ COMPLETAMENTE CORREGIDO
async function checkAccessPermissions(user: any): Promise<{
  granted: boolean;
  reason: string;
  membershipStatus: string;
}> {
  try {
    // Verificar si el usuario está activo
    if (!user.isActive) {
      return {
        granted: false,
        reason: 'Usuario inactivo',
        membershipStatus: 'inactive'
      };
    }

    // Verificar rol de acceso
    const allowedRoles = ['cliente', 'member', 'staff', 'admin', 'superadmin'];
    if (!allowedRoles.includes(user.rol)) {
      return {
        granted: false,
        reason: 'Rol sin permisos de acceso',
        membershipStatus: 'no_access'
      };
    }

    // Verificar membresía activa para clientes y miembros
    if (['cliente', 'member'].includes(user.rol)) {
      if (!user.membershipExpiry) {
        return {
          granted: false,
          reason: 'Sin membresía registrada',
          membershipStatus: 'no_membership'
        };
      }

      const expiryDate = new Date(user.membershipExpiry);
      const now = new Date();

      if (expiryDate < now) {
        return {
          granted: false,
          reason: 'Membresía expirada',
          membershipStatus: 'expired'
        };
      }

      // Verificar si la membresía expira pronto (7 días)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const membershipStatus = daysUntilExpiry <= 7 ? 'expiring_soon' : 'active';

      return {
        granted: true,
        reason: 'Acceso permitido',
        membershipStatus
      };
    }

    // Staff y administradores siempre tienen acceso
    return {
      granted: true,
      reason: 'Acceso permitido - Personal autorizado',
      membershipStatus: 'staff'
    };

  } catch (error: any) {
    console.error('❌ Error verificando permisos:', error);
    return {
      granted: false,
      reason: `Error verificando permisos: ${error.message}`,
      membershipStatus: 'error'
    };
  }
}

// 📝 REGISTRAR INTENTO DE ACCESO - ✅ COMPLETAMENTE CORREGIDO
async function logAccessAttempt(
  supabase: any,
  deviceId: string,
  userId?: string,
  success: boolean = false,
  confidence: number = 0,
  reason: string = ''
): Promise<void> {
  try {
    const logEntry = {
      device_id: deviceId,
      user_id: userId || null,
      success,
      confidence_level: confidence,
      access_method: 'biometric',
      reason,
      ip_address: null, // Se puede obtener del request si es necesario
      user_agent: null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('access_logs')
      .insert(logEntry);

    if (error) {
      console.error('❌ Error registrando log de acceso:', error);
    } else {
      console.log('📝 Log de acceso registrado:', {
        deviceId,
        userId,
        success,
        confidence
      });
    }

  } catch (error: any) {
    console.error('❌ Error en logAccessAttempt:', error);
  }
}

// ⏰ MANEJAR TIMEOUT DE VERIFICACIÓN - ✅ COMPLETAMENTE CORREGIDO
async function handleVerificationTimeout(verificationId: string): Promise<void> {
  const verification = activeVerifications.get(verificationId);
  
  if (verification && verification.status === 'waiting') {
    console.log(`⏰ Timeout de verificación: ${verificationId}`);
    
    verification.status = 'failed';
    
    // Remover después de 5 segundos
    setTimeout(() => {
      activeVerifications.delete(verificationId);
    }, 5000);
  }
}