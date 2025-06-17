import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 🎯 TIPOS PARA LA API DE CONEXIÓN
interface ConnectRequest {
  deviceId: string;
  action: 'connect' | 'disconnect' | 'test' | 'reset_connection';
  forceReconnect?: boolean;
  timeout?: number;
}

interface ConnectionStatus {
  deviceId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string;
  connectionTime?: number;
  firmwareVersion?: string;
  deviceInfo?: {
    model: string;
    serialNumber: string;
    algorithm: string;
    userCapacity: number;
    logCapacity: number;
    userCount: number;
    fpCount: number;
  };
  networkInfo?: {
    ipAddress: string;
    port: number;
    wsPort: number;
    responseTime?: number;
  };
  error?: string;
}

interface ConnectResponse {
  success: boolean;
  message: string;
  data?: ConnectionStatus;
  error?: string;
}

// 🗂️ MAPA DE CONEXIONES ACTIVAS
const activeConnections = new Map<string, {
  websocket?: any;
  lastPing: number;
  connectionTime: number;
  deviceInfo?: any;
}>();

// 🚀 POST: GESTIONAR CONEXIÓN DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
export async function POST(request: NextRequest): Promise<NextResponse<ConnectResponse>> {
  try {
    console.log('🔌 API: Gestionando conexión de dispositivo...');
    
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
    const body: ConnectRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.deviceId || !body.action) {
      return NextResponse.json({
        success: false,
        message: 'Datos incompletos',
        error: 'deviceId y action son requeridos'
      }, { status: 400 });
    }

    console.log('📝 Datos de conexión:', {
      deviceId: body.deviceId,
      action: body.action,
      forceReconnect: body.forceReconnect
    });

    // Verificar que el dispositivo existe
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

    // Ejecutar acción correspondiente
    let connectionStatus: ConnectionStatus;

    switch (body.action) {
      case 'connect':
        connectionStatus = await connectToDevice(deviceData, body.forceReconnect, body.timeout);
        break;
        
      case 'disconnect':
        connectionStatus = await disconnectFromDevice(deviceData);
        break;
        
      case 'test':
        connectionStatus = await testDeviceConnection(deviceData, body.timeout);
        break;
        
      case 'reset_connection':
        connectionStatus = await resetDeviceConnection(deviceData);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Acción no válida',
          error: 'Las acciones válidas son: connect, disconnect, test, reset_connection'
        }, { status: 400 });
    }

    // Actualizar estado en base de datos
    await updateDeviceStatus(supabase, body.deviceId, connectionStatus);

    const success = !['error', 'disconnected'].includes(connectionStatus.status) || body.action === 'disconnect';

    return NextResponse.json({
      success,
      message: getConnectionMessage(body.action, connectionStatus.status),
      data: connectionStatus
    });

  } catch (error: any) {
    console.error('❌ Error en gestión de conexión:', error);
    return NextResponse.json({
      success: false,
      message: 'Error gestionando conexión',
      error: error.message
    }, { status: 500 });
  }
}

// 📊 GET: OBTENER ESTADO DE CONEXIONES - ✅ COMPLETAMENTE CORREGIDO
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 API: Obteniendo estado de conexiones...');
    
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
    const deviceId = searchParams.get('deviceId');

    if (deviceId) {
      // Obtener estado de dispositivo específico
      const { data: deviceData, error: deviceError } = await supabase
        .from('biometric_devices')
        .select('*')
        .eq('id', deviceId)
        .eq('type', 'zk9500')
        .eq('is_active', true)
        .single();

      if (deviceError || !deviceData) {
        return NextResponse.json({
          success: false,
          message: 'Dispositivo no encontrado'
        }, { status: 404 });
      }

      const connectionStatus = await getCurrentConnectionStatus(deviceData);

      return NextResponse.json({
        success: true,
        message: 'Estado de conexión obtenido',
        data: connectionStatus
      });
    }

    // Obtener estado de todos los dispositivos
    const { data: devices, error: devicesError } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('type', 'zk9500')
      .eq('is_active', true)
      .order('name');

    if (devicesError) {
      throw devicesError;
    }

    const connectionsStatus = await Promise.all(
      (devices || []).map(async (device) => {
        return await getCurrentConnectionStatus(device);
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Estados de conexión obtenidos',
      data: {
        devices: connectionsStatus,
        totalDevices: connectionsStatus.length,
        connectedDevices: connectionsStatus.filter(d => d.status === 'connected').length,
        disconnectedDevices: connectionsStatus.filter(d => d.status === 'disconnected').length
      }
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo conexiones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo conexiones',
      error: error.message
    }, { status: 500 });
  }
}

// 🔌 CONECTAR A DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function connectToDevice(
  device: any, 
  forceReconnect: boolean = false, 
  timeout: number = 10000
): Promise<ConnectionStatus> {
  try {
    console.log(`🔌 Conectando a dispositivo ${device.name} (${device.ip_address}:${device.ws_port})...`);
    
    const deviceId = device.id;
    const existingConnection = activeConnections.get(deviceId);
    
    // Si ya está conectado y no se fuerza reconexión
    if (existingConnection && !forceReconnect) {
      // Verificar si la conexión está activa con ping
      const pingResult = await pingDevice(device.ip_address, device.ws_port, 3000);
      
      if (pingResult.success) {
        return {
          deviceId,
          status: 'connected',
          lastConnected: new Date(existingConnection.connectionTime).toISOString(),
          connectionTime: Date.now() - existingConnection.connectionTime,
          firmwareVersion: existingConnection.deviceInfo?.firmware,
          deviceInfo: existingConnection.deviceInfo,
          networkInfo: {
            ipAddress: device.ip_address,
            port: device.port,
            wsPort: device.ws_port,
            responseTime: pingResult.responseTime
          }
        };
      }
    }

    // Desconectar conexión existente si se fuerza reconexión
    if (existingConnection && forceReconnect) {
      await disconnectFromDevice(device);
    }

    // Intentar nueva conexión
    const connectionResult = await establishConnection(device, timeout);
    
    if (connectionResult.success) {
      // Registrar conexión activa
      activeConnections.set(deviceId, {
        websocket: connectionResult.websocket,
        lastPing: Date.now(),
        connectionTime: Date.now(),
        deviceInfo: connectionResult.deviceInfo
      });

      return {
        deviceId,
        status: 'connected',
        lastConnected: new Date().toISOString(),
        connectionTime: 0,
        firmwareVersion: connectionResult.deviceInfo?.firmware,
        deviceInfo: connectionResult.deviceInfo,
        networkInfo: {
          ipAddress: device.ip_address,
          port: device.port,
          wsPort: device.ws_port,
          responseTime: connectionResult.responseTime
        }
      };
    } else {
      return {
        deviceId,
        status: 'error',
        error: connectionResult.error,
        networkInfo: {
          ipAddress: device.ip_address,
          port: device.port,
          wsPort: device.ws_port
        }
      };
    }

  } catch (error: any) {
    console.error(`❌ Error conectando a dispositivo ${device.name}:`, error);
    return {
      deviceId: device.id,
      status: 'error',
      error: error.message,
      networkInfo: {
        ipAddress: device.ip_address,
        port: device.port,
        wsPort: device.ws_port
      }
    };
  }
}

// 🔌 DESCONECTAR DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function disconnectFromDevice(device: any): Promise<ConnectionStatus> {
  try {
    console.log(`🔌 Desconectando de dispositivo ${device.name}...`);
    
    const deviceId = device.id;
    const existingConnection = activeConnections.get(deviceId);
    
    if (existingConnection) {
      // Cerrar websocket si existe
      if (existingConnection.websocket) {
        try {
          existingConnection.websocket.close();
        } catch (e) {
          console.warn('⚠️ Error cerrando websocket:', e);
        }
      }
      
      // Remover de conexiones activas
      activeConnections.delete(deviceId);
      
      console.log(`✅ Dispositivo ${device.name} desconectado`);
    }

    return {
      deviceId,
      status: 'disconnected',
      networkInfo: {
        ipAddress: device.ip_address,
        port: device.port,
        wsPort: device.ws_port
      }
    };

  } catch (error: any) {
    console.error(`❌ Error desconectando dispositivo ${device.name}:`, error);
    return {
      deviceId: device.id,
      status: 'error',
      error: error.message,
      networkInfo: {
        ipAddress: device.ip_address,
        port: device.port,
        wsPort: device.ws_port
      }
    };
  }
}

// 🧪 PROBAR CONEXIÓN DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function testDeviceConnection(device: any, timeout: number = 5000): Promise<ConnectionStatus> {
  try {
    console.log(`🧪 Probando conexión a dispositivo ${device.name}...`);
    
    const pingResult = await pingDevice(device.ip_address, device.ws_port, timeout);
    
    if (pingResult.success) {
      // Intentar obtener información del dispositivo
      const deviceInfoResult = await getDeviceInfo(device, timeout);
      
      return {
        deviceId: device.id,
        status: 'connected',
        firmwareVersion: deviceInfoResult.deviceInfo?.firmware,
        deviceInfo: deviceInfoResult.deviceInfo,
        networkInfo: {
          ipAddress: device.ip_address,
          port: device.port,
          wsPort: device.ws_port,
          responseTime: pingResult.responseTime
        }
      };
    } else {
      return {
        deviceId: device.id,
        status: 'disconnected',
        error: pingResult.error,
        networkInfo: {
          ipAddress: device.ip_address,
          port: device.port,
          wsPort: device.ws_port
        }
      };
    }

  } catch (error: any) {
    console.error(`❌ Error probando dispositivo ${device.name}:`, error);
    return {
      deviceId: device.id,
      status: 'error',
      error: error.message,
      networkInfo: {
        ipAddress: device.ip_address,
        port: device.port,
        wsPort: device.ws_port
      }
    };
  }
}

// 🔄 RESETEAR CONEXIÓN DE DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function resetDeviceConnection(device: any): Promise<ConnectionStatus> {
  try {
    console.log(`🔄 Reseteando conexión de dispositivo ${device.name}...`);
    
    // Primero desconectar
    await disconnectFromDevice(device);
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reconectar
    return await connectToDevice(device, true, 15000);

  } catch (error: any) {
    console.error(`❌ Error reseteando conexión ${device.name}:`, error);
    return {
      deviceId: device.id,
      status: 'error',
      error: error.message,
      networkInfo: {
        ipAddress: device.ip_address,
        port: device.port,
        wsPort: device.ws_port
      }
    };
  }
}

// 🔍 OBTENER ESTADO ACTUAL DE CONEXIÓN - ✅ COMPLETAMENTE CORREGIDO
async function getCurrentConnectionStatus(device: any): Promise<ConnectionStatus> {
  const deviceId = device.id;
  const existingConnection = activeConnections.get(deviceId);
  
  if (existingConnection) {
    // Verificar si la conexión sigue activa
    const timeSinceLastPing = Date.now() - existingConnection.lastPing;
    
    if (timeSinceLastPing < 60000) { // Menos de 1 minuto
      return {
        deviceId,
        status: 'connected',
        lastConnected: new Date(existingConnection.connectionTime).toISOString(),
        connectionTime: Date.now() - existingConnection.connectionTime,
        firmwareVersion: existingConnection.deviceInfo?.firmware,
        deviceInfo: existingConnection.deviceInfo,
        networkInfo: {
          ipAddress: device.ip_address,
          port: device.port,
          wsPort: device.ws_port
        }
      };
    } else {
      // Conexión probablemente perdida
      activeConnections.delete(deviceId);
    }
  }

  return {
    deviceId,
    status: 'disconnected',
    networkInfo: {
      ipAddress: device.ip_address,
      port: device.port,
      wsPort: device.ws_port
    }
  };
}

// 🏗️ ESTABLECER CONEXIÓN (SIMULADA) - ✅ COMPLETAMENTE CORREGIDO
async function establishConnection(device: any, timeout: number): Promise<{
  success: boolean;
  websocket?: any;
  deviceInfo?: any;
  responseTime?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      console.log(`🏗️ Estableciendo conexión WebSocket a ${device.ip_address}:${device.ws_port}...`);
      
      const startTime = Date.now();
      
      // ✅ Simular conexión WebSocket para desarrollo
      // En producción real, esto sería la conexión real al ZK9500
      setTimeout(() => {
        const responseTime = Date.now() - startTime;
        
        // Simular 85% de éxito en conexiones
        const success = Math.random() > 0.15;
        
        if (success) {
          const mockDeviceInfo = {
            firmware: 'v6.60.5.0',
            model: 'ZK9500',
            serialNumber: `ZK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            algorithm: 'ZK_FP_VX10.0',
            userCapacity: 3000,
            logCapacity: 100000,
            userCount: Math.floor(Math.random() * 50),
            fpCount: Math.floor(Math.random() * 150)
          };
          
          resolve({
            success: true,
            websocket: { id: `ws_${device.id}_${Date.now()}` }, // Mock websocket
            deviceInfo: mockDeviceInfo,
            responseTime
          });
        } else {
          resolve({
            success: false,
            error: 'Timeout conectando al dispositivo ZK9500'
          });
        }
      }, 1000 + Math.random() * 2000); // 1-3 segundos de latencia
      
    } catch (error: any) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// 🏓 PING A DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function pingDevice(ip: string, wsPort: number, timeout: number = 5000): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      // ✅ Simular ping para desarrollo
      setTimeout(() => {
        const responseTime = Date.now() - startTime;
        
        // Simular 90% de éxito en pings
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            responseTime: 30 + Math.random() * 50 // 30-80ms
          });
        } else {
          resolve({
            success: false,
            responseTime,
            error: 'Timeout en ping al dispositivo'
          });
        }
      }, 50 + Math.random() * 200); // Simular latencia de red
      
    } catch (error: any) {
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      });
    }
  });
}

// 📋 OBTENER INFORMACIÓN DEL DISPOSITIVO - ✅ COMPLETAMENTE CORREGIDO
async function getDeviceInfo(device: any, timeout: number = 5000): Promise<{
  success: boolean;
  deviceInfo?: any;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      // ✅ Simular obtención de info para desarrollo
      setTimeout(() => {
        const success = Math.random() > 0.1;
        
        if (success) {
          const deviceInfo = {
            firmware: 'v6.60.5.0',
            model: 'ZK9500',
            serialNumber: device.serial_number || `ZK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            algorithm: 'ZK_FP_VX10.0',
            userCapacity: 3000,
            logCapacity: 100000,
            userCount: Math.floor(Math.random() * 50),
            fpCount: Math.floor(Math.random() * 150)
          };
          
          resolve({
            success: true,
            deviceInfo
          });
        } else {
          resolve({
            success: false,
            error: 'Error obteniendo información del dispositivo'
          });
        }
      }, 500 + Math.random() * 1000);
      
    } catch (error: any) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// 💾 ACTUALIZAR ESTADO DEL DISPOSITIVO EN BD - ✅ COMPLETAMENTE CORREGIDO
async function updateDeviceStatus(supabase: any, deviceId: string, connectionStatus: ConnectionStatus): Promise<void> {
  try {
    const updateData: any = {
      status: connectionStatus.status,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (connectionStatus.firmwareVersion) {
      updateData.firmware_version = connectionStatus.firmwareVersion;
    }

    if (connectionStatus.deviceInfo) {
      updateData.user_count = connectionStatus.deviceInfo.userCount || 0;
      updateData.fingerprint_count = connectionStatus.deviceInfo.fpCount || 0;
    }

    const { error } = await supabase
      .from('biometric_devices')
      .update(updateData)
      .eq('id', deviceId);

    if (error) {
      console.error('❌ Error actualizando estado del dispositivo:', error);
    } else {
      console.log(`✅ Estado del dispositivo ${deviceId} actualizado: ${connectionStatus.status}`);
    }

  } catch (error: any) {
    console.error('❌ Error en updateDeviceStatus:', error);
  }
}

// 💬 OBTENER MENSAJE DE CONEXIÓN - ✅ COMPLETAMENTE CORREGIDO
function getConnectionMessage(action: string, status: string): string {
  switch (action) {
    case 'connect':
      return status === 'connected' ? 
        '✅ Dispositivo conectado exitosamente' : 
        '❌ Error conectando al dispositivo';
        
    case 'disconnect':
      return '🔌 Dispositivo desconectado exitosamente';
      
    case 'test':
      return status === 'connected' ? 
        '✅ Prueba de conexión exitosa' : 
        '❌ Prueba de conexión fallida';
        
    case 'reset_connection':
      return status === 'connected' ? 
        '🔄 Conexión reseteada exitosamente' : 
        '❌ Error reseteando conexión';
        
    default:
      return 'Operación completada';
  }
}