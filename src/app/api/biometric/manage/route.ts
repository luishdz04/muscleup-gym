import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 🎯 TIPOS PARA LA API DE GESTIÓN
interface ManageDeviceRequest {
  action: 'add' | 'remove' | 'update' | 'sync' | 'reset' | 'backup' | 'restore';
  deviceId?: string;
  deviceData?: {
    id?: string;
    name: string;
    ip: string;
    port?: number;
    wsPort: number;
    model?: string;
    location?: string;
  };
  syncOptions?: {
    direction: 'upload' | 'download' | 'bidirectional';
    includeUsers: boolean;
    includeFingerprints: boolean;
    clearBefore?: boolean;
  };
  backupData?: string;
}

interface ManageResponse {
  success: boolean;
  message: string;
  data?: {
    deviceId?: string;
    operation?: string;
    result?: any;
    affectedRecords?: number;
    backupId?: string;
    syncSummary?: {
      usersProcessed: number;
      fingerprintsProcessed: number;
      errors: string[];
    };
  };
  error?: string;
}

interface SyncProgress {
  id: string;
  deviceId: string;
  status: 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  startedAt: string;
  websocket?: any;
}

// 🗂️ MAPA DE OPERACIONES DE SYNC ACTIVAS
const activeSyncOperations = new Map<string, SyncProgress>();

// 🚀 POST: GESTIONAR DISPOSITIVOS - ✅ COMPLETAMENTE CORREGIDO
export async function POST(request: NextRequest): Promise<NextResponse<ManageResponse>> {
  try {
    console.log('🔧 API: Iniciando gestión de dispositivo...');
    
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

    // Validar permisos de administrador
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData || !['admin', 'superadmin'].includes(userData.rol)) {
      return NextResponse.json({
        success: false,
        message: 'Permisos insuficientes',
        error: 'Solo administradores pueden gestionar dispositivos'
      }, { status: 403 });
    }

    // Parsear body
    const body: ManageDeviceRequest = await request.json();
    
    // Validar acción requerida
    if (!body.action) {
      return NextResponse.json({
        success: false,
        message: 'Acción requerida',
        error: 'El campo action es obligatorio'
      }, { status: 400 });
    }

    console.log('📝 Datos de gestión:', {
      action: body.action,
      deviceId: body.deviceId,
      hasDeviceData: !!body.deviceData
    });

    // Ejecutar acción correspondiente
    switch (body.action) {
      case 'add':
        return await addDevice(supabase, body);
        
      case 'remove':
        return await removeDevice(supabase, body);
        
      case 'update':
        return await updateDevice(supabase, body);
        
      case 'sync':
        return await syncDevice(supabase, body);
        
      case 'reset':
        return await resetDevice(supabase, body);
        
      case 'backup':
        return await backupDevice(supabase, body);
        
      case 'restore':
        return await restoreDevice(supabase, body);
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Acción no válida',
          error: 'Las acciones válidas son: add, remove, update, sync, reset, backup, restore'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error en API manage:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}

// ➕ AGREGAR NUEVO DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function addDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceData) {
      return NextResponse.json({
        success: false,
        message: 'Datos del dispositivo requeridos',
        error: 'deviceData es requerido para agregar un dispositivo'
      }, { status: 400 });
    }

    const { name, ip, port = 4370, wsPort, model = 'ZKTeco ZK9500', location } = body.deviceData;

    if (!name || !ip || !wsPort) {
      return NextResponse.json({
        success: false,
        message: 'Datos incompletos',
        error: 'name, ip y wsPort son requeridos'
      }, { status: 400 });
    }

    // Verificar que no exista un dispositivo con la misma IP
    const { data: existingDevice, error: checkError } = await supabase
      .from('biometric_devices')
      .select('id')
      .eq('ip_address', ip)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }

    if (existingDevice) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo ya existe',
        error: `Ya existe un dispositivo activo con la IP ${ip}`
      }, { status: 409 });
    }

    // Generar ID único para el dispositivo
    const deviceId = body.deviceData.id || `zk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Probar conexión antes de agregar
    const connectionTest = await testDeviceConnection(ip, wsPort);
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'No se puede conectar al dispositivo',
        error: connectionTest.error
      }, { status: 503 });
    }

    // Insertar dispositivo en la base de datos
    const { data: newDevice, error: insertError } = await supabase
      .from('biometric_devices')
      .insert({
        id: deviceId,
        name,
        type: 'zk9500',
        model,
        ip_address: ip,
        port,
        ws_port: wsPort,
        location,
        status: 'connected',
        firmware_version: connectionTest.deviceInfo?.firmware || 'Unknown',
        user_count: 0,
        fingerprint_count: 0,
        is_active: true,
        device_type: 'zkteco',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando dispositivo:', insertError);
      throw insertError;
    }

    console.log('✅ Dispositivo agregado exitosamente:', deviceId);

    return NextResponse.json({
      success: true,
      message: '✅ Dispositivo agregado exitosamente',
      data: {
        deviceId,
        operation: 'add',
        result: newDevice
      }
    });

  } catch (error: any) {
    console.error('❌ Error agregando dispositivo:', error);
    return NextResponse.json({
      success: false,
      message: 'Error agregando dispositivo',
      error: error.message
    }, { status: 500 });
  }
}

// ❌ REMOVER DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function removeDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'ID del dispositivo requerido',
        error: 'deviceId es requerido para remover un dispositivo'
      }, { status: 400 });
    }

    // Verificar que el dispositivo existe
    const { data: device, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('id', body.deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado',
        error: `No se encontró el dispositivo con ID: ${body.deviceId}`
      }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    const { error: updateError } = await supabase
      .from('biometric_devices')
      .update({
        is_active: false,
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.deviceId);

    if (updateError) {
      console.error('❌ Error removiendo dispositivo:', updateError);
      throw updateError;
    }

    // También marcar como inactivos los templates asociados
    const { error: templateError } = await supabase
      .from('fingerprint_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('device_id', body.deviceId);

    if (templateError) {
      console.warn('⚠️ Error marcando templates como inactivos:', templateError);
      // No hacer throw, es menos crítico
    }

    console.log('✅ Dispositivo removido exitosamente:', body.deviceId);

    return NextResponse.json({
      success: true,
      message: '✅ Dispositivo removido exitosamente',
      data: {
        deviceId: body.deviceId,
        operation: 'remove',
        result: { removed: true, name: device.name }
      }
    });

  } catch (error: any) {
    console.error('❌ Error removiendo dispositivo:', error);
    return NextResponse.json({
      success: false,
      message: 'Error removiendo dispositivo',
      error: error.message
    }, { status: 500 });
  }
}

// 🔄 ACTUALIZAR DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function updateDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId || !body.deviceData) {
      return NextResponse.json({
        success: false,
        message: 'Datos requeridos',
        error: 'deviceId y deviceData son requeridos para actualizar'
      }, { status: 400 });
    }

    // Verificar que el dispositivo existe
    const { data: existingDevice, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('id', body.deviceId)
      .single();

    if (deviceError || !existingDevice) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado',
        error: `No se encontró el dispositivo con ID: ${body.deviceId}`
      }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.deviceData.name) updateData.name = body.deviceData.name;
    if (body.deviceData.location) updateData.location = body.deviceData.location;
    if (body.deviceData.model) updateData.model = body.deviceData.model;

    // Si se cambian IP o puertos, verificar conexión
    if (body.deviceData.ip || body.deviceData.wsPort) {
      const newIp = body.deviceData.ip || existingDevice.ip_address;
      const newWsPort = body.deviceData.wsPort || existingDevice.ws_port;
      const newPort = body.deviceData.port || existingDevice.port;

      // Probar nueva conexión
      const connectionTest = await testDeviceConnection(newIp, newWsPort);
      
      if (!connectionTest.success) {
        return NextResponse.json({
          success: false,
          message: 'No se puede conectar con la nueva configuración',
          error: connectionTest.error
        }, { status: 503 });
      }

      updateData.ip_address = newIp;
      updateData.ws_port = newWsPort;
      updateData.port = newPort;
      updateData.status = 'connected';
      updateData.firmware_version = connectionTest.deviceInfo?.firmware || existingDevice.firmware_version;
    }

    // Actualizar en base de datos
    const { data: updatedDevice, error: updateError } = await supabase
      .from('biometric_devices')
      .update(updateData)
      .eq('id', body.deviceId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando dispositivo:', updateError);
      throw updateError;
    }

    console.log('✅ Dispositivo actualizado exitosamente:', body.deviceId);

    return NextResponse.json({
      success: true,
      message: '✅ Dispositivo actualizado exitosamente',
      data: {
        deviceId: body.deviceId,
        operation: 'update',
        result: updatedDevice
      }
    });

  } catch (error: any) {
    console.error('❌ Error actualizando dispositivo:', error);
    return NextResponse.json({
      success: false,
      message: 'Error actualizando dispositivo',
      error: error.message
    }, { status: 500 });
  }
}

// 🔄 SINCRONIZAR DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function syncDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'ID del dispositivo requerido',
        error: 'deviceId es requerido para sincronizar'
      }, { status: 400 });
    }

    // Verificar que el dispositivo existe y está conectado
    const { data: device, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('id', body.deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado',
        error: `No se encontró el dispositivo con ID: ${body.deviceId}`
      }, { status: 404 });
    }

    if (device.status !== 'connected') {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no conectado',
        error: 'El dispositivo debe estar conectado para sincronizar'
      }, { status: 503 });
    }

    // Verificar si ya hay una sincronización activa
    const existingSync = Array.from(activeSyncOperations.values())
      .find(sync => sync.deviceId === body.deviceId && sync.status === 'running');

    if (existingSync) {
      return NextResponse.json({
        success: false,
        message: 'Sincronización en progreso',
        error: 'Ya hay una sincronización activa para este dispositivo'
      }, { status: 409 });
    }

    // Configurar opciones de sincronización
    const syncOptions = body.syncOptions || {
      direction: 'bidirectional',
      includeUsers: true,
      includeFingerprints: true,
      clearBefore: false
    };

    // Iniciar sincronización asíncrona
    const syncId = `sync_${body.deviceId}_${Date.now()}`;
    
    const syncResult = await startDeviceSync({
      syncId,
      deviceId: body.deviceId,
      device,
      options: syncOptions
    });

    if (syncResult.success) {
      return NextResponse.json({
        success: true,
        message: '🔄 Sincronización iniciada exitosamente',
        data: {
          deviceId: body.deviceId,
          operation: 'sync',
          result: {
            syncId,
            status: 'running',
            options: syncOptions
          }
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error iniciando sincronización',
        error: syncResult.error
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en sincronización',
      error: error.message
    }, { status: 500 });
  }
}

// 🔄 RESETEAR DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function resetDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'ID del dispositivo requerido',
        error: 'deviceId es requerido para resetear'
      }, { status: 400 });
    }

    // Verificar dispositivo
    const { data: device, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('id', body.deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado'
      }, { status: 404 });
    }

    // Enviar comando de reset al dispositivo
    const resetResult = await sendResetCommand(device);

    if (resetResult.success) {
      // Actualizar contadores en base de datos
      await supabase
        .from('biometric_devices')
        .update({
          user_count: 0,
          fingerprint_count: 0,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', body.deviceId);

      // Marcar templates como inactivos
      await supabase
        .from('fingerprint_templates')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', body.deviceId);

      return NextResponse.json({
        success: true,
        message: '🔄 Dispositivo reseteado exitosamente',
        data: {
          deviceId: body.deviceId,
          operation: 'reset',
          result: { cleared: true }
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error reseteando dispositivo',
        error: resetResult.error
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error('❌ Error reseteando dispositivo:', error);
    return NextResponse.json({
      success: false,
      message: 'Error reseteando dispositivo',
      error: error.message
    }, { status: 500 });
  }
}

// 💾 BACKUP DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function backupDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId) {
      return NextResponse.json({
        success: false,
        message: 'ID del dispositivo requerido',
        error: 'deviceId es requerido para backup'
      }, { status: 400 });
    }

    // Obtener datos del dispositivo y templates
    const [deviceResult, templatesResult] = await Promise.all([
      supabase.from('biometric_devices').select('*').eq('id', body.deviceId).single(),
      supabase.from('fingerprint_templates').select('*').eq('device_id', body.deviceId).eq('is_active', true)
    ]);

    if (deviceResult.error || !deviceResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Dispositivo no encontrado'
      }, { status: 404 });
    }

    // Crear backup
    const backupId = `backup_${body.deviceId}_${Date.now()}`;
    const backupData = {
      id: backupId,
      device: deviceResult.data,
      templates: templatesResult.data || [],
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    // Guardar backup en base de datos
    const { error: backupError } = await supabase
      .from('device_backups')
      .insert({
        id: backupId,
        device_id: body.deviceId,
        backup_data: JSON.stringify(backupData),
        created_at: new Date().toISOString()
      });

    if (backupError) {
      console.error('❌ Error guardando backup:', backupError);
      throw backupError;
    }

    return NextResponse.json({
      success: true,
      message: '💾 Backup creado exitosamente',
      data: {
        deviceId: body.deviceId,
        operation: 'backup',
        backupId,
        result: {
          templatesCount: (templatesResult.data || []).length,
          createdAt: backupData.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error creando backup:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creando backup',
      error: error.message
    }, { status: 500 });
  }
}

// 📥 RESTAURAR DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function restoreDevice(supabase: any, body: ManageDeviceRequest): Promise<NextResponse<ManageResponse>> {
  try {
    if (!body.deviceId || !body.backupData) {
      return NextResponse.json({
        success: false,
        message: 'Datos requeridos',
        error: 'deviceId y backupData son requeridos para restaurar'
      }, { status: 400 });
    }

    // Parsear datos de backup
    let backupData;
    try {
      backupData = typeof body.backupData === 'string' ? JSON.parse(body.backupData) : body.backupData;
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        message: 'Datos de backup inválidos',
        error: 'No se pudo parsear los datos de backup'
      }, { status: 400 });
    }

    // Validar estructura del backup
    if (!backupData.device || !backupData.templates) {
      return NextResponse.json({
        success: false,
        message: 'Backup incompleto',
        error: 'El backup no contiene todos los datos necesarios'
      }, { status: 400 });
    }

    // Restaurar templates
    let restoredCount = 0;
    const errors: string[] = [];

    for (const template of backupData.templates) {
      try {
        await supabase
          .from('fingerprint_templates')
          .upsert({
            ...template,
            device_id: body.deviceId,
            is_active: true,
            updated_at: new Date().toISOString()
          });
        restoredCount++;
      } catch (templateError: any) {
        errors.push(`Error restaurando template ${template.user_id}: ${templateError.message}`);
      }
    }

    // Actualizar contador del dispositivo
    await supabase
      .from('biometric_devices')
      .update({
        fingerprint_count: restoredCount,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.deviceId);

    return NextResponse.json({
      success: true,
      message: '📥 Dispositivo restaurado exitosamente',
      data: {
        deviceId: body.deviceId,
        operation: 'restore',
        result: {
          templatesRestored: restoredCount,
          totalTemplates: backupData.templates.length,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error restaurando dispositivo:', error);
    return NextResponse.json({
      success: false,
      message: 'Error restaurando dispositivo',
      error: error.message
    }, { status: 500 });
  }
}

// 🔧 PROBAR CONEXIÓN DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function testDeviceConnection(ip: string, wsPort: number): Promise<{
  success: boolean;
  deviceInfo?: any;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      console.log(`🔧 Probando conexión a ${ip}:${wsPort}...`);
      
      // ✅ Simular conexión para desarrollo - será reemplazado por Access Agent real
      setTimeout(() => {
        // Simular 85% de éxito en conexiones
        const success = Math.random() > 0.15;
        
        if (success) {
          resolve({
            success: true,
            deviceInfo: { 
              firmware: 'v6.60.5.0',
              model: 'ZK9500',
              serialNumber: `ZK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              capacity: 3000,
              userCount: 0,
              fpCount: 0,
              algorithm: 'ZK_FP_VX10.0',
              userCapacity: 3000,
              logCapacity: 100000
            }
          });
        } else {
          resolve({
            success: false,
            error: 'Timeout conectando al dispositivo ZK9500'
          });
        }
      }, 500 + Math.random() * 1500); // Simular latencia realista
      
    } catch (error: any) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// 🔄 INICIAR SINCRONIZACIÓN DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function startDeviceSync(params: {
  syncId: string;
  deviceId: string;
  device: any;
  options: any;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      console.log(`🔄 Iniciando sincronización ${params.syncId}...`);
      
      // Crear sesión de sync
      const syncSession: SyncProgress = {
        id: params.syncId,
        deviceId: params.deviceId,
        status: 'running',
        progress: 0,
        currentStep: 'Iniciando...',
        startedAt: new Date().toISOString()
      };

      activeSyncOperations.set(params.syncId, syncSession);

      // Simular proceso de sincronización realista
      const steps = [
        'Conectando al dispositivo...',
        'Obteniendo información del dispositivo...',
        'Sincronizando usuarios...',
        'Sincronizando templates biométricos...',
        'Validando integridad...',
        'Completando sincronización...'
      ];

      let currentStepIndex = 0;
      const stepInterval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          syncSession.currentStep = steps[currentStepIndex];
          syncSession.progress = Math.round((currentStepIndex / steps.length) * 100);
          currentStepIndex++;
        } else {
          clearInterval(stepInterval);
          syncSession.progress = 100;
          syncSession.status = 'completed';
          syncSession.currentStep = 'Completado exitosamente';
          
          console.log('✅ Sincronización completada:', params.syncId);
          
          // Remover después de 2 minutos
          setTimeout(() => {
            activeSyncOperations.delete(params.syncId);
          }, 120000);
        }
      }, 1000); // Actualizar cada segundo

      resolve({ success: true });

    } catch (error: any) {
      console.error('❌ Error iniciando sync:', error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// 🔄 ENVIAR COMANDO DE RESET - ✅ COMPLETAMENTE CORREGIDO
async function sendResetCommand(device: any): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      console.log(`🔄 Enviando comando de reset a ${device.ip_address}...`);
      
      // ✅ Simular reset para desarrollo - será reemplazado por Access Agent real
      setTimeout(() => {
        // Simular 90% de éxito en resets
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({ 
            success: true 
          });
        } else {
          resolve({
            success: false,
            error: 'Dispositivo no respondió al comando de reset'
          });
        }
      }, 2000 + Math.random() * 3000); // Simular tiempo realista de reset

    } catch (error: any) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// 📊 GET: OBTENER ESTADO DE OPERACIONES DE GESTIÓN - ✅ COMPLETAMENTE CORREGIDO
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
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
    const operation = searchParams.get('operation'); // sync, backup, etc.
    const deviceId = searchParams.get('deviceId');

    let data: any = {};

    // Obtener operaciones de sync activas
    if (!operation || operation === 'sync') {
      const activeSyncs = Array.from(activeSyncOperations.values())
        .filter(sync => !deviceId || sync.deviceId === deviceId)
        .map(sync => ({
          id: sync.id,
          deviceId: sync.deviceId,
          status: sync.status,
          progress: sync.progress,
          currentStep: sync.currentStep,
          startedAt: sync.startedAt,
          duration: Date.now() - new Date(sync.startedAt).getTime()
        }));

      data.activeSyncs = activeSyncs;
    }

    // Obtener backups disponibles
    if (!operation || operation === 'backup') {
      let backupQuery = supabase
        .from('device_backups')
        .select('id, device_id, created_at')
        .order('created_at', { ascending: false });

      if (deviceId) {
        backupQuery = backupQuery.eq('device_id', deviceId);
      }

      const { data: backups, error: backupError } = await backupQuery.limit(10);

      if (!backupError) {
        data.recentBackups = backups || [];
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estado de operaciones obtenido',
      data
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estado de operaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estado',
      error: error.message
    }, { status: 500 });
  }
}

// 🛑 DELETE: CANCELAR OPERACIÓN - ✅ COMPLETAMENTE CORREGIDO
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
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
    const syncId = searchParams.get('syncId');
    const deviceId = searchParams.get('deviceId');

    if (!syncId && !deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Parámetro requerido',
        error: 'syncId o deviceId requerido'
      }, { status: 400 });
    }

    // Cancelar operaciones de sync
    let cancelled = false;
    
    for (const [id, sync] of activeSyncOperations.entries()) {
      if (sync.id === syncId || sync.deviceId === deviceId) {
        if (sync.websocket) {
          try {
            sync.websocket.close();
          } catch (e) {
            // Ignorar errores al cerrar websocket
          }
        }
        
        sync.status = 'error';
        sync.currentStep = 'Cancelado por usuario';
        
        // Remover después de 5 segundos
        setTimeout(() => {
          activeSyncOperations.delete(id);
        }, 5000);
        
        cancelled = true;
        console.log(`🛑 Operación cancelada: ${id}`);
      }
    }

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: 'Operación cancelada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Operación no encontrada',
        error: 'No hay operación activa con esos parámetros'
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('❌ Error cancelando operación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error cancelando operación',
      error: error.message
    }, { status: 500 });
  }
}