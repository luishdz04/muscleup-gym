import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ===============================================
// ✅ TIPOS DE DATOS
// ===============================================
interface FingerprintCaptureRequest {
  userId: string;
  userName?: string;
  deviceId?: string;
  action: 'capture' | 'delete' | 'verify' | 'list';
  fingerIndex?: number;
  template?: string;
}

interface FingerprintTemplate {
  id: string;
  user_id: string;
  template: string;
  device_user_id: number | null;
  enrolled_at: string;
}

interface UserInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  fingerprint: boolean;
}

// ===============================================
// ✅ GET - OBTENER HUELLAS DE UN USUARIO
// ===============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'list';

    console.log('📋 API Fingerprint GET:', { userId, action });

    const supabase = createServerSupabaseClient();

    switch (action) {
      case 'list':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'Se requiere userId para listar huellas'
          }, { status: 400 });
        }

        // Obtener información del usuario
        const { data: user, error: userError } = await supabase
          .from('Users')
          .select('id, firstName, lastName, email, fingerprint')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          return NextResponse.json({
            success: false,
            error: 'Usuario no encontrado'
          }, { status: 404 });
        }

        // Obtener templates del usuario
        const { data: templates, error: templatesError } = await supabase
          .from('fingerprint_templates')
          .select('*')
          .eq('user_id', userId);

        if (templatesError) {
          console.error('❌ Error obteniendo templates:', templatesError);
          return NextResponse.json({
            success: false,
            error: 'Error obteniendo huellas registradas'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Huellas del usuario obtenidas',
          data: {
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              hasFingerprint: user.fingerprint
            },
            templates: templates?.map(template => ({
              id: template.id,
              device_user_id: template.device_user_id,
              enrolled_at: template.enrolled_at,
              hasTemplate: !!template.template
            })) || [],
            totalTemplates: templates?.length || 0
          },
          timestamp: new Date().toISOString()
        });

      case 'status':
        // Obtener estado general del sistema biométrico
        const { data: allTemplates, error: allError } = await supabase
          .from('fingerprint_templates')
          .select('user_id');

        const { data: usersWithFingerprint, error: usersError } = await supabase
          .from('Users')
          .select('id')
          .eq('fingerprint', true);

        return NextResponse.json({
          success: true,
          message: 'Estado del sistema biométrico',
          data: {
            totalTemplates: allTemplates?.length || 0,
            totalUsersWithFingerprint: usersWithFingerprint?.length || 0,
            lastCheck: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Acción no soportada: ${action}`,
          availableActions: ['list', 'status']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error en GET fingerprint:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}

// ===============================================
// ✅ POST - REGISTRAR/CAPTURAR HUELLA
// ===============================================
export async function POST(request: NextRequest) {
  try {
    const body: FingerprintCaptureRequest = await request.json();
    const { userId, userName, deviceId, action, fingerIndex, template } = body;

    console.log('👆 API Fingerprint POST:', { userId, action, userName });

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere userId'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    switch (action) {
      case 'capture':
        return await handleFingerprintCapture(supabase, body);
      
      case 'verify':
        return await handleFingerprintVerify(supabase, body);
      
      default:
        return NextResponse.json({
          success: false,
          error: `Acción no soportada: ${action}`,
          availableActions: ['capture', 'verify']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error en POST fingerprint:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}

// ===============================================
// ✅ DELETE - ELIMINAR HUELLA
// ===============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const templateId = searchParams.get('templateId');

    console.log('🗑️ API Fingerprint DELETE:', { userId, templateId });

    if (!userId && !templateId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere userId o templateId'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    if (templateId) {
      // Eliminar template específico
      const { error: deleteError } = await supabase
        .from('fingerprint_templates')
        .delete()
        .eq('id', templateId);

      if (deleteError) {
        console.error('❌ Error eliminando template:', deleteError);
        return NextResponse.json({
          success: false,
          error: 'Error eliminando huella específica'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Huella específica eliminada exitosamente',
        data: { templateId }
      });

    } else if (userId) {
      // Eliminar todas las huellas del usuario
      const { error: deleteError } = await supabase
        .from('fingerprint_templates')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Error eliminando huellas del usuario:', deleteError);
        return NextResponse.json({
          success: false,
          error: 'Error eliminando huellas del usuario'
        }, { status: 500 });
      }

      // Actualizar flag fingerprint en Users
      const { error: updateError } = await supabase
        .from('Users')
        .update({ fingerprint: false })
        .eq('id', userId);

      if (updateError) {
        console.warn('⚠️ Error actualizando flag fingerprint:', updateError);
      }

      return NextResponse.json({
        success: true,
        message: 'Todas las huellas del usuario eliminadas',
        data: { userId, fingerprintFlag: false }
      });
    }

  } catch (error: any) {
    console.error('❌ Error en DELETE fingerprint:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}

// ===============================================
// ✅ FUNCIÓN: CAPTURAR Y GUARDAR HUELLA
// ===============================================
async function handleFingerprintCapture(
  supabase: any, 
  body: FingerprintCaptureRequest
): Promise<NextResponse> {
  try {
    const { userId, userName, template, fingerIndex = 1 } = body;

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, firstName, lastName, email, fingerprint')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado en la base de datos',
        details: userError?.message
      }, { status: 404 });
    }

    // Generar template si no se proporciona (simulación)
    const finalTemplate = template || generateMockTemplate();
    const templateId = `fp_${userId}_${Date.now()}`;
    const deviceUserId = await getNextDeviceUserId(supabase);

    // Verificar si ya existe una huella para este usuario
    const { data: existingTemplate } = await supabase
      .from('fingerprint_templates')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingTemplate) {
      // Actualizar huella existente
      result = await supabase
        .from('fingerprint_templates')
        .update({
          template: finalTemplate,
          device_user_id: deviceUserId,
          enrolled_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id)
        .select()
        .single();

      console.log('🔄 Huella actualizada para usuario:', user.firstName);
    } else {
      // Crear nueva huella
      result = await supabase
        .from('fingerprint_templates')
        .insert({
          id: templateId,
          user_id: userId,
          template: finalTemplate,
          device_user_id: deviceUserId,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('✅ Nueva huella registrada para usuario:', user.firstName);
    }

    if (result.error) {
      console.error('❌ Error guardando template:', result.error);
      return NextResponse.json({
        success: false,
        error: 'Error guardando huella en la base de datos',
        details: result.error.message
      }, { status: 500 });
    }

    // Actualizar flag fingerprint en Users
    const { error: updateUserError } = await supabase
      .from('Users')
      .update({ fingerprint: true })
      .eq('id', userId);

    if (updateUserError) {
      console.warn('⚠️ Error actualizando flag fingerprint:', updateUserError);
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: '✅ Huella registrada exitosamente',
      data: {
        templateId: result.data.id,
        userId: userId,
        userName: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        deviceUserId: deviceUserId,
        enrolledAt: result.data.enrolled_at,
        fingerprintQuality: calculateMockQuality(),
        templateSize: finalTemplate.length,
        previouslyRegistered: !!existingTemplate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error en handleFingerprintCapture:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno capturando huella',
      message: error.message
    }, { status: 500 });
  }
}

// ===============================================
// ✅ FUNCIÓN: VERIFICAR HUELLA
// ===============================================
async function handleFingerprintVerify(
  supabase: any, 
  body: FingerprintCaptureRequest
): Promise<NextResponse> {
  try {
    const { userId, template } = body;

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere template para verificación'
      }, { status: 400 });
    }

    // Obtener template registrado del usuario
    const { data: storedTemplate, error: templateError } = await supabase
      .from('fingerprint_templates')
      .select(`
        *,
        Users!inner(id, firstName, lastName, email)
      `)
      .eq('user_id', userId)
      .single();

    if (templateError || !storedTemplate) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró huella registrada para este usuario'
      }, { status: 404 });
    }

    // Simular verificación biométrica
    const confidence = simulateTemplateMatching(template, storedTemplate.template);
    const threshold = 80; // 80% mínimo de confianza
    const isMatch = confidence >= threshold;

    // Registrar intento de verificación
    const verificationId = `verify_${userId}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: isMatch ? '✅ Verificación exitosa' : '❌ Verificación fallida',
      data: {
        verificationId,
        userId: userId,
        userName: `${storedTemplate.Users.firstName} ${storedTemplate.Users.lastName || ''}`.trim(),
        matched: isMatch,
        confidence: confidence,
        threshold: threshold,
        verifiedAt: new Date().toISOString(),
        accessGranted: isMatch
      }
    });

  } catch (error: any) {
    console.error('❌ Error en handleFingerprintVerify:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno verificando huella',
      message: error.message
    }, { status: 500 });
  }
}

// ===============================================
// ✅ FUNCIONES AUXILIARES
// ===============================================

// Generar siguiente device_user_id disponible
async function getNextDeviceUserId(supabase: any): Promise<number> {
  try {
    const { data: lastTemplate, error } = await supabase
      .from('fingerprint_templates')
      .select('device_user_id')
      .order('device_user_id', { ascending: false })
      .limit(1)
      .single();

    if (error || !lastTemplate) {
      return 1; // Primer ID
    }

    return (lastTemplate.device_user_id || 0) + 1;
  } catch (error) {
    console.warn('⚠️ Error obteniendo next device_user_id, usando 1');
    return 1;
  }
}

// Generar template mock para simulación
function generateMockTemplate(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 20);
  return `zkfpm_template_${timestamp}_${random}_luishdz04`;
}

// Calcular calidad mock
function calculateMockQuality(): number {
  return Math.floor(Math.random() * 20) + 80; // 80-100%
}

// Simular matching de templates
function simulateTemplateMatching(template1: string, template2: string): number {
  // Simulación: si son exactamente iguales = 100%, sino random 70-95%
  if (template1 === template2) {
    return 100;
  }
  
  // Simular variación realista
  return Math.floor(Math.random() * 25) + 70; // 70-95%
}