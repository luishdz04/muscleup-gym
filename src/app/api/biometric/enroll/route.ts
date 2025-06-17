import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface EnrollRequest {
    userId: string;
    deviceId: string;
    mode?: 'auto' | 'guided';
    timeout?: number;
    quality?: 'low' | 'medium' | 'high';
    fingerIndex?: number; // 0-9 para dedos específicos
  }
  
  interface EnrollmentSuccessData {
    userId: string;
    userName: string;
    deviceId: string;
    template: string;
    quality: number;
    enrolledAt: string;
    deviceUserId: number;
    fingerIndex: number;
    templateId: string;
  }
  
  // ✅ CORREGIDO: Agregar 'error' y 'timeout' al status
  interface EnrollmentProgressData {
    enrollmentId: string;
    userId: string;
    deviceId: string;
    status: 'waiting' | 'capturing' | 'processing' | 'validating' | 'saving' | 'completed' | 'error' | 'timeout';
    progress: number;
    currentStep: string;
    timeout: number;
    remainingTime: number;
    captures: number;
    maxCaptures: number;
  }
  
  interface EnrollResponse {
    success: boolean;
    message: string;
    data?: EnrollmentSuccessData | EnrollmentProgressData;
    error?: string;
  }
  
  // ✅ ESTE YA ESTABA BIEN - EnrollmentSession incluye todos los estados
  interface EnrollmentSession {
    id: string;
    userId: string;
    userName: string;
    deviceId: string;
    status: 'waiting' | 'capturing' | 'processing' | 'validating' | 'saving' | 'completed' | 'error' | 'timeout';
    progress: number;
    currentStep: string;
    startedAt: string;
    timeout: number;
    captures: number;
    maxCaptures: number;
    quality: 'low' | 'medium' | 'high';
    fingerIndex: number;
    templates: string[];
    websocket?: any;
    timeoutHandler?: any;
  }
  

// 🗂️ MAPA DE ENROLLMENTS ACTIVOS
const activeEnrollments = new Map<string, EnrollmentSession>();

// 🚀 POST: INICIAR ENROLLMENT DE HUELLA - ✅ COMPLETAMENTE CORREGIDO
export async function POST(request: NextRequest): Promise<NextResponse<EnrollResponse>> {
  try {
    console.log('👆 API: Iniciando enrollment de huella...');
    
    // ✅ CORRECTO PARA NEXTJS 15: cookies() retorna la promesa directamente
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado',
        error: 'Sesión requerida'
      }, { status: 401 });
    }

    // Parsear body
    const body: EnrollRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.userId || !body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Datos incompletos',
        error: 'userId y deviceId son requeridos'
      }, { status: 400 });
    }

    console.log('📝 Datos de enrollment:', {
      userId: body.userId,
      deviceId: body.deviceId,
      mode: body.mode || 'auto',
      quality: body.quality || 'high',
      fingerIndex: body.fingerIndex || 1
    });

    // Verificar que el usuario existe y no tiene huella registrada
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('id, firstName, lastName, fingerprint')
      .eq('id', body.userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'El usuario especificado no existe'
      }, { status: 404 });
    }

    if (userData.fingerprint) {
      return NextResponse.json({
        success: false,
        message: 'Usuario ya tiene huella registrada',
        error: 'El usuario ya tiene una huella dactilar en el sistema'
      }, { status: 409 });
    }

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

    // Verificar si ya hay un enrollment activo para este usuario
    const existingEnrollment = Array.from(activeEnrollments.values())
      .find(enrollment => enrollment.userId === body.userId && 
             ['waiting', 'capturing', 'processing', 'validating', 'saving'].includes(enrollment.status));

    if (existingEnrollment) {
      return NextResponse.json({
        success: false,
        message: 'Enrollment en progreso',
        error: 'Ya hay un enrollment activo para este usuario'
      }, { status: 409 });
    }

    // Configurar parámetros de enrollment
    const enrollmentTimeout = body.timeout || 60000; // 60 segundos por defecto
    const quality = body.quality || 'high';
    const fingerIndex = body.fingerIndex || 1;
    const maxCaptures = quality === 'high' ? 4 : quality === 'medium' ? 3 : 2;

    // Crear sesión de enrollment
    const enrollmentId = `enroll_${body.userId}_${Date.now()}`;
    const userName = `${userData.firstName} ${userData.lastName}`.trim();

    const enrollmentSession: EnrollmentSession = {
      id: enrollmentId,
      userId: body.userId,
      userName,
      deviceId: body.deviceId,
      status: 'waiting',
      progress: 0,
      currentStep: 'Preparando captura biométrica...',
      startedAt: new Date().toISOString(),
      timeout: enrollmentTimeout,
      captures: 0,
      maxCaptures,
      quality,
      fingerIndex,
      templates: []
    };

    // Registrar enrollment activo
    activeEnrollments.set(enrollmentId, enrollmentSession);

    // Configurar timeout
    enrollmentSession.timeoutHandler = setTimeout(() => {
      handleEnrollmentTimeout(enrollmentId);
    }, enrollmentTimeout);

    console.log(`✅ Enrollment iniciado: ${enrollmentId} para usuario ${userName}`);

    // Iniciar proceso de captura
    await startBiometricCapture(enrollmentSession, supabase);

    // Responder con datos de progreso
    const progressData: EnrollmentProgressData = {
      enrollmentId,
      userId: body.userId,
      deviceId: body.deviceId,
      status: enrollmentSession.status,
      progress: enrollmentSession.progress,
      currentStep: enrollmentSession.currentStep,
      timeout: enrollmentTimeout,
      remainingTime: enrollmentTimeout,
      captures: 0,
      maxCaptures
    };

    return NextResponse.json({
      success: true,
      message: '👆 Enrollment iniciado exitosamente',
      data: progressData
    });

  } catch (error: any) {
    console.error('❌ Error iniciando enrollment:', error);
    return NextResponse.json({
      success: false,
      message: 'Error iniciando enrollment',
      error: error.message
    }, { status: 500 });
  }
}

// 📊 GET: OBTENER ESTADO DE ENROLLMENT - ✅ COMPLETAMENTE CORREGIDO
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 API: Obteniendo estado de enrollment...');
    
    // ✅ CORRECTO PARA NEXTJS 15: cookies() retorna la promesa directamente
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const userId = searchParams.get('userId');

    // Si se solicita un enrollment específico
    if (enrollmentId) {
      const enrollment = activeEnrollments.get(enrollmentId);
      
      if (!enrollment) {
        return NextResponse.json({
          success: false,
          message: 'Enrollment no encontrado',
          error: 'El enrollment especificado no existe o ya terminó'
        }, { status: 404 });
      }

      const progressData: EnrollmentProgressData = {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        deviceId: enrollment.deviceId,
        status: enrollment.status,
        progress: enrollment.progress,
        currentStep: enrollment.currentStep,
        timeout: enrollment.timeout,
        remainingTime: Math.max(0, enrollment.timeout - (Date.now() - new Date(enrollment.startedAt).getTime())),
        captures: enrollment.captures,
        maxCaptures: enrollment.maxCaptures
      };

      return NextResponse.json({
        success: true,
        message: 'Estado de enrollment obtenido',
        data: progressData
      });
    }

    // Si se busca por usuario
    if (userId) {
      const userEnrollments = Array.from(activeEnrollments.values())
        .filter(enrollment => enrollment.userId === userId);

      return NextResponse.json({
        success: true,
        message: 'Enrollments del usuario obtenidos',
        data: {
          enrollments: userEnrollments.map(enrollment => ({
            enrollmentId: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            currentStep: enrollment.currentStep,
            startedAt: enrollment.startedAt
          }))
        }
      });
    }

    // Obtener todos los enrollments activos
    const allEnrollments = Array.from(activeEnrollments.values()).map(enrollment => ({
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      userName: enrollment.userName,
      deviceId: enrollment.deviceId,
      status: enrollment.status,
      progress: enrollment.progress,
      currentStep: enrollment.currentStep,
      startedAt: enrollment.startedAt,
      captures: enrollment.captures,
      maxCaptures: enrollment.maxCaptures
    }));

    return NextResponse.json({
      success: true,
      message: 'Enrollments activos obtenidos',
      data: {
        activeEnrollments: allEnrollments,
        totalActive: allEnrollments.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estado de enrollment:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estado',
      error: error.message
    }, { status: 500 });
  }
}

// 🛑 DELETE: CANCELAR ENROLLMENT - ✅ COMPLETAMENTE CORREGIDO
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🛑 API: Cancelando enrollment...');
    
    // ✅ CORRECTO PARA NEXTJS 15: cookies() retorna la promesa directamente
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const userId = searchParams.get('userId');

    if (!enrollmentId && !userId) {
      return NextResponse.json({
        success: false,
        message: 'Parámetro requerido',
        error: 'enrollmentId o userId requerido'
      }, { status: 400 });
    }

    let cancelledCount = 0;

    // Cancelar enrollment específico
    if (enrollmentId) {
      const enrollment = activeEnrollments.get(enrollmentId);
      
      if (enrollment) {
        await cancelEnrollment(enrollment, 'Cancelado por usuario');
        cancelledCount = 1;
      }
    } 
    // Cancelar todos los enrollments de un usuario
    else if (userId) {
      const userEnrollments = Array.from(activeEnrollments.values())
        .filter(enrollment => enrollment.userId === userId);

      for (const enrollment of userEnrollments) {
        await cancelEnrollment(enrollment, 'Cancelado por usuario');
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      return NextResponse.json({
        success: true,
        message: `${cancelledCount} enrollment(s) cancelado(s) exitosamente`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Enrollment no encontrado',
        error: 'No hay enrollments activos con esos parámetros'
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('❌ Error cancelando enrollment:', error);
    return NextResponse.json({
      success: false,
      message: 'Error cancelando enrollment',
      error: error.message
    }, { status: 500 });
  }
}

// 🎯 INICIAR CAPTURA BIOMÉTRICA - ✅ COMPLETAMENTE CORREGIDO
async function startBiometricCapture(enrollment: EnrollmentSession, supabase: any): Promise<void> {
  try {
    console.log(`🎯 Iniciando captura biométrica para ${enrollment.userName}...`);
    
    // Actualizar estado
    enrollment.status = 'capturing';
    enrollment.currentStep = `Coloque su dedo ${getFingerName(enrollment.fingerIndex)} en el lector...`;
    enrollment.progress = 10;

    // Simular proceso de captura (será reemplazado por Access Agent real)
    await simulateBiometricCapture(enrollment, supabase);

  } catch (error: any) {
    console.error('❌ Error en captura biométrica:', error);
    enrollment.status = 'error';
    enrollment.currentStep = `Error en captura: ${error.message}`;
    
    // Limpiar enrollment después de error
    setTimeout(() => {
      activeEnrollments.delete(enrollment.id);
    }, 10000);
  }
}

// 🎭 SIMULAR CAPTURA BIOMÉTRICA (SERÁ REEMPLAZADO POR ACCESS AGENT) - ✅ CORREGIDO
async function simulateBiometricCapture(enrollment: EnrollmentSession, supabase: any): Promise<void> {
  return new Promise((resolve) => {
    let captureCount = 0;
    const maxCaptures = enrollment.maxCaptures;
    
    const captureInterval = setInterval(async () => {
      if (enrollment.status === 'error' || enrollment.status === 'timeout') {
        clearInterval(captureInterval);
        resolve();
        return;
      }

      captureCount++;
      enrollment.captures = captureCount;
      enrollment.progress = Math.round((captureCount / maxCaptures) * 80); // 80% para captura

      // Simular template capturado
      const mockTemplate = generateMockTemplate(enrollment.userId, captureCount);
      enrollment.templates.push(mockTemplate);

      console.log(`📸 Captura ${captureCount}/${maxCaptures} completada para ${enrollment.userName}`);

      if (captureCount < maxCaptures) {
        enrollment.currentStep = `Captura ${captureCount}/${maxCaptures} - Coloque nuevamente su dedo...`;
      } else {
        // Todas las capturas completadas
        clearInterval(captureInterval);
        
        enrollment.status = 'processing';
        enrollment.currentStep = 'Procesando templates biométricos...';
        enrollment.progress = 85;

        // Procesar y guardar enrollment
        setTimeout(async () => {
          await processAndSaveEnrollment(enrollment, supabase);
          resolve();
        }, 2000);
      }
    }, 3000 + Math.random() * 2000); // 3-5 segundos entre capturas
  });
}

// 🔄 PROCESAR Y GUARDAR ENROLLMENT - ✅ COMPLETAMENTE CORREGIDO
async function processAndSaveEnrollment(enrollment: EnrollmentSession, supabase: any): Promise<void> {
  try {
    console.log(`💾 Procesando enrollment para ${enrollment.userName}...`);
    
    // Validar calidad de templates
    enrollment.status = 'validating';
    enrollment.currentStep = 'Validando calidad de templates...';
    enrollment.progress = 90;

    // Simular validación (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Combinar templates en uno final
    const finalTemplate = combineBiometricTemplates(enrollment.templates);
    const quality = calculateTemplateQuality(enrollment.templates);

    // Guardar en base de datos
    enrollment.status = 'saving';
    enrollment.currentStep = 'Guardando huella en base de datos...';
    enrollment.progress = 95;

    // Generar ID único para el template
    const templateId = `tpl_${enrollment.userId}_${Date.now()}`;

    // Obtener siguiente deviceUserId disponible
    const { data: existingTemplates, error: templatesError } = await supabase
      .from('fingerprint_templates')
      .select('device_user_id')
      .eq('device_id', enrollment.deviceId)
      .order('device_user_id', { ascending: false })
      .limit(1);

    let deviceUserId = 1;
    if (!templatesError && existingTemplates && existingTemplates.length > 0) {
      deviceUserId = existingTemplates[0].device_user_id + 1;
    }

    // Insertar template en la base de datos
    const { error: insertError } = await supabase
      .from('fingerprint_templates')
      .insert({
        id: templateId,
        user_id: enrollment.userId,
        device_id: enrollment.deviceId,
        device_user_id: deviceUserId,
        finger_index: enrollment.fingerIndex,
        template_data: finalTemplate,
        quality_score: quality,
        algorithm: 'ZK_FP_VX10.0',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    // Actualizar usuario como con huella registrada
    const { error: userUpdateError } = await supabase
      .from('Users')
      .update({
        fingerprint: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.userId);

    if (userUpdateError) {
      console.warn('⚠️ Error actualizando usuario:', userUpdateError);
      // No hacer throw, el template ya se guardó
    }

    // Actualizar contador del dispositivo
    const { error: deviceUpdateError } = await supabase
      .from('biometric_devices')
      .update({
        user_count: supabase.sql`user_count + 1`,
        fingerprint_count: supabase.sql`fingerprint_count + 1`,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.deviceId);

    if (deviceUpdateError) {
      console.warn('⚠️ Error actualizando dispositivo:', deviceUpdateError);
      // No hacer throw, el template ya se guardó
    }

    // Enrollment completado exitosamente
    enrollment.status = 'completed';
    enrollment.currentStep = '✅ Huella registrada exitosamente';
    enrollment.progress = 100;

    // Limpiar timeout
    if (enrollment.timeoutHandler) {
      clearTimeout(enrollment.timeoutHandler);
    }

    console.log(`✅ Enrollment completado exitosamente para ${enrollment.userName}`);

    // Crear datos de éxito
    const successData: EnrollmentSuccessData = {
      userId: enrollment.userId,
      userName: enrollment.userName,
      deviceId: enrollment.deviceId,
      template: finalTemplate,
      quality,
      enrolledAt: new Date().toISOString(),
      deviceUserId,
      fingerIndex: enrollment.fingerIndex,
      templateId
    };

    // Guardar resultado en la sesión
    (enrollment as any).successData = successData;

    // Remover de enrollments activos después de 30 segundos
    setTimeout(() => {
      activeEnrollments.delete(enrollment.id);
    }, 30000);

  } catch (error: any) {
    console.error('❌ Error procesando enrollment:', error);
    enrollment.status = 'error';
    enrollment.currentStep = `Error guardando: ${error.message}`;
    
    // Limpiar enrollment después de error
    setTimeout(() => {
      activeEnrollments.delete(enrollment.id);
    }, 10000);
  }
}

// 🛑 CANCELAR ENROLLMENT - ✅ COMPLETAMENTE CORREGIDO
async function cancelEnrollment(enrollment: EnrollmentSession, reason: string): Promise<void> {
  try {
    console.log(`🛑 Cancelando enrollment ${enrollment.id}: ${reason}`);
    
    // Limpiar timeout
    if (enrollment.timeoutHandler) {
      clearTimeout(enrollment.timeoutHandler);
    }

    // Limpiar websocket si existe
    if (enrollment.websocket) {
      try {
        enrollment.websocket.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }

    // Actualizar estado
    enrollment.status = 'error';
    enrollment.currentStep = reason;

    // Remover de enrollments activos
    activeEnrollments.delete(enrollment.id);

    console.log(`✅ Enrollment ${enrollment.id} cancelado`);

  } catch (error: any) {
    console.error('❌ Error cancelando enrollment:', error);
  }
}

// ⏰ MANEJAR TIMEOUT DE ENROLLMENT - ✅ COMPLETAMENTE CORREGIDO
async function handleEnrollmentTimeout(enrollmentId: string): Promise<void> {
  const enrollment = activeEnrollments.get(enrollmentId);
  
  if (enrollment && !['completed', 'error'].includes(enrollment.status)) {
    console.log(`⏰ Timeout de enrollment: ${enrollmentId}`);
    
    enrollment.status = 'timeout';
    enrollment.currentStep = 'Tiempo de captura agotado';
    
    // Remover después de 5 segundos
    setTimeout(() => {
      activeEnrollments.delete(enrollmentId);
    }, 5000);
  }
}

// 🔧 FUNCIONES HELPER - ✅ COMPLETAMENTE CORREGIDAS

// Generar template mock para desarrollo
function generateMockTemplate(userId: string, captureNumber: number): string {
  const base = `ZK_TEMPLATE_${userId}_${captureNumber}_`;
  const randomData = Array.from({ length: 200 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  return base + randomData;
}

// Combinar múltiples templates en uno final
function combineBiometricTemplates(templates: string[]): string {
  if (templates.length === 0) return '';
  if (templates.length === 1) return templates[0];
  
  // En producción real, esto sería un algoritmo de fusión de templates
  // Por ahora, retornar el template con mejor calidad simulada
  return templates.reduce((best, current) => 
    current.length > best.length ? current : best
  );
}

// Calcular calidad del template
function calculateTemplateQuality(templates: string[]): number {
  if (templates.length === 0) return 0;
  
  // Simular calidad basada en número de capturas y longitud
  const baseQuality = Math.min(95, 60 + (templates.length * 8));
  const variance = Math.random() * 10 - 5; // ±5 puntos de variación
  
  return Math.max(0, Math.min(100, Math.round(baseQuality + variance)));
}

// Obtener nombre del dedo
function getFingerName(fingerIndex: number): string {
  const fingerNames = [
    'pulgar derecho', 'índice derecho', 'medio derecho', 'anular derecho', 'meñique derecho',
    'pulgar izquierdo', 'índice izquierdo', 'medio izquierdo', 'anular izquierdo', 'meñique izquierdo'
  ];
  
  return fingerNames[fingerIndex] || 'índice derecho';
}