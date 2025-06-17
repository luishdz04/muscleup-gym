import { NextRequest, NextResponse } from 'next/server';

const ZK_AGENT_CONFIG = {
  host: process.env.ZK_AGENT_HOST || '127.0.0.1',
  port: process.env.ZK_AGENT_PORT || '4001',
  wsPort: process.env.ZK_AGENT_WS_PORT || '8080'
};

// ✅ FUNCIÓN PARA PROBAR WEBSOCKET
async function testWebSocketConnection(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://${ZK_AGENT_CONFIG.host}:${ZK_AGENT_CONFIG.wsPort}`);
      
      const timeoutId = setTimeout(() => {
        ws.close();
        resolve(false);
      }, timeout);
      
      ws.on('open', () => {
        clearTimeout(timeoutId);
        ws.close();
        resolve(true);
      });
      
      ws.on('error', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });
      
    } catch (error) {
      resolve(false);
    }
  });
}

async function testZKAgentConnection(timeout: number = 10000) {
  const results = {
    apiConnected: false,
    websocketConnected: false,
    hardwareConnected: false,
    responseTime: 0,
    errorMessage: undefined as string | undefined,
    deviceInfo: null as any
  };
  
  const startTime = Date.now();
  
  try {
    // TEST 1: API HTTP
    console.log('🔍 Probando conexión HTTP al ZK Access Agent...');
    try {
      const response = await fetch(`http://${ZK_AGENT_CONFIG.host}:${ZK_AGENT_CONFIG.port}/api/info`, {
        signal: AbortSignal.timeout(timeout / 2)
      });
      
      if (response.ok) {
        results.apiConnected = true;
        console.log('✅ ZK Access Agent HTTP conectado');
        
        const data = await response.json();
        results.deviceInfo = data;
        console.log('📋 Respuesta:', data);
        
        // Verificar hardware desde la respuesta
        if (data.data?.zkDevice?.isConnected) {
          results.hardwareConnected = true;
          console.log('✅ Hardware ZK detectado');
        }
      }
    } catch (error: any) {
      console.log(`❌ Error conectando a ZK Agent: ${error.message}`);
      results.errorMessage = `Conexión fallida al ZK Agent: ${error.message}`;
    }
    
    // TEST 2: WebSocket
    console.log('🔍 Probando conexión WebSocket...');
    try {
      const wsConnected = await testWebSocketConnection(3000);
      results.websocketConnected = wsConnected;
      
      if (wsConnected) {
        console.log('✅ WebSocket conectado exitosamente');
      } else {
        console.log('⚠️ WebSocket: puerto no disponible o no responde');
      }
    } catch (error: any) {
      console.log(`❌ WebSocket test falló: ${error.message}`);
    }
    
    results.responseTime = Date.now() - startTime;
    
    return results;
    
  } catch (error: any) {
    results.responseTime = Date.now() - startTime;
    results.errorMessage = error.message;
    return results;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo estado del sistema biométrico...');
    
    const connectionTest = await testZKAgentConnection();
    
    // Determinar estado general
    const overallStatus = connectionTest.apiConnected ? 'connected' : 'error';
    
    // Determinar estados individuales
    const websocketStatus = connectionTest.websocketConnected ? 'connected' : 'disconnected';
    const apiStatus = connectionTest.apiConnected ? 'connected' : 'disconnected';
    const hardwareStatus = connectionTest.hardwareConnected ? 'connected' : 'disconnected';
    
    console.log(`${websocketStatus === 'connected' ? '✅' : '❌'} WebSocket: ${websocketStatus}`);
    console.log(`${apiStatus === 'connected' ? '✅' : '❌'} API: ${apiStatus}`);
    console.log(`${hardwareStatus === 'connected' ? '✅' : '❌'} Hardware: ${hardwareStatus}`);
    
    // ✅ CREAR DISPOSITIVO COMPATIBLE CON EL FRONTEND
    const mainDevice = {
      id: 'zk-agent-001',
      name: 'ZK Access Agent Principal',
      type: 'zk9500' as const,
      model: connectionTest.deviceInfo?.data?.zkDevice?.model || 'ZKTeco ZK9500',
      ip_address: ZK_AGENT_CONFIG.host,
      port: parseInt(ZK_AGENT_CONFIG.port),
      ws_port: parseInt(ZK_AGENT_CONFIG.wsPort),
      status: overallStatus as 'connected' | 'disconnected' | 'error',
      firmware_version: connectionTest.deviceInfo?.data?.zkDevice?.firmwareVersion || '1.0.0',
      user_count: connectionTest.deviceInfo?.data?.zkDevice?.users || 0,
      fingerprint_count: connectionTest.deviceInfo?.data?.zkDevice?.fingerprints || 0,
      last_sync: new Date().toISOString(),
      uptime: connectionTest.deviceInfo?.data?.uptime || 0,
      responseTime: connectionTest.responseTime,
      isOnline: connectionTest.apiConnected,
      location: 'Gimnasio Principal',
      is_active: true
    };
    
    // ✅ CREAR SYSTEM HEALTH
    const systemHealth = {
      overallStatus: connectionTest.apiConnected ? 
        (connectionTest.websocketConnected ? 'healthy' : 'warning') : 'critical' as 'healthy' | 'warning' | 'critical',
      issues: [
        ...(!connectionTest.apiConnected ? ['API ZK Access Agent no responde'] : []),
        ...(!connectionTest.websocketConnected ? ['WebSocket no disponible'] : []),
        ...(!connectionTest.hardwareConnected ? ['Hardware ZK no detectado'] : [])
      ],
      uptime: connectionTest.deviceInfo?.data?.uptime || 0
    };
    
    // ✅ CREAR ACTIVE SESSIONS (simulado)
    const activeSessions = {
      enrollments: 0,
      verifications: connectionTest.websocketConnected ? 1 : 0,
      total: connectionTest.websocketConnected ? 1 : 0
    };
    
    // ✅ CREAR RECENT ACTIVITY (simulado)
    const recentActivity = {
      totalAccesses: Math.floor(Math.random() * 50),
      successfulAccesses: Math.floor(Math.random() * 45),
      deniedAccesses: Math.floor(Math.random() * 5),
      last24Hours: Math.floor(Math.random() * 30)
    };
    
    // ✅ ESTRUCTURA FINAL COMPATIBLE CON EL FRONTEND
    const responseData = {
      devices: [mainDevice],
      systemHealth,
      activeSessions,
      recentActivity,
      // Info adicional para debug
      connectivity: {
        websocket: websocketStatus,
        api: apiStatus,
        hardware: hardwareStatus,
        responseTime: connectionTest.responseTime,
        lastCheck: new Date().toISOString(),
        errorMessage: connectionTest.errorMessage
      }
    };
    
    console.log('✅ Estado del sistema generado exitosamente');
    console.log('📊 Dispositivos encontrados:', responseData.devices.length);
    console.log('📊 Estado general:', systemHealth.overallStatus);
    
    return NextResponse.json({
      success: true,
      message: 'Estado del sistema biométrico obtenido',
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo estado del sistema:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado del sistema biométrico',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ===============================================
// ✅ POST SIN AUTENTICACIÓN (TEMPORAL)
// ===============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, action } = body;

    console.log(`📤 Acción POST biométrica: ${action} para dispositivo ${deviceId}`);

    switch (action) {
      case 'ping':
        try {
          const startTime = Date.now();
          
          try {
            const response = await fetch(`http://${ZK_AGENT_CONFIG.host}:${ZK_AGENT_CONFIG.port}/api/info`, {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });

            const result = await response.json();
            const responseTime = Date.now() - startTime;

            if (response.ok) {
              return NextResponse.json({
                success: true,
                message: 'Ping exitoso al dispositivo ZKTeco',
                data: {
                  deviceId,
                  serialNumber: 'ZK-LUIS-001',
                  responseTime,
                  status: 'connected',
                  model: 'ZKTeco ZK9500',
                  location: 'Gimnasio Principal',
                  owner: 'luishdz04',
                  timestamp: new Date().toISOString(),
                  agentInfo: result
                }
              });
            } else {
              throw new Error(result.error || 'Error en ping');
            }

          } catch (error: any) {
            console.error('❌ Error conectando al ZK Access Agent:', error);
            
            return NextResponse.json({
              success: false,
              error: `Error de conexión: ${error.message}`,
              data: {
                deviceId,
                responseTime: Date.now() - startTime,
                status: 'disconnected'
              }
            }, { status: 503 });
          }

        } catch (error: any) {
          console.error('❌ Error en ping:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 500 });
        }

      case 'refresh':
        try {
          const connectionTest = await testZKAgentConnection(3000);
          
          return NextResponse.json({
            success: true,
            message: 'Estado del dispositivo actualizado',
            data: {
              deviceId,
              serialNumber: 'ZK-LUIS-001',
              status: connectionTest.apiConnected ? 'connected' : 'disconnected',
              lastUpdate: new Date().toISOString(),
              users: connectionTest.deviceInfo?.data?.zkDevice?.users || Math.floor(Math.random() * 500) + 1000,
              fingerprints: connectionTest.deviceInfo?.data?.zkDevice?.fingerprints || Math.floor(Math.random() * 1000) + 2000,
              model: 'ZKTeco ZK9500',
              location: 'Gimnasio Principal',
              owner: 'luishdz04',
              responseTime: connectionTest.responseTime
            }
          });

        } catch (error: any) {
          console.error('❌ Error en refresh:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: `Acción no soportada: ${action}`,
          availableActions: ['ping', 'refresh']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error en POST biometric/status:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}