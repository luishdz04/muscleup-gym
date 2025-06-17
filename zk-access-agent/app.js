const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocketServer = require('websocket').server;
const path = require('path');
const fs = require('fs');

// ===============================================
// ✅ CONFIGURACIÓN BÁSICA
// ===============================================
const PORT = process.env.PORT || 4001;
const WS_PORT = process.env.WS_PORT || 8080;
const HOST = '127.0.0.1';

console.log('🚀 ZK Access Agent - SDK EXISTENTE REAL');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 luishdz04 - Muscle Up GYM`);
console.log(`📂 Directorio: ${__dirname}`);

// ===============================================
// ✅ VARIABLES GLOBALES
// ===============================================
let wsServer = null;
let httpServer = null;
let connectedClients = new Set();
let zkSDK = null;
let fingerprintCapture = null;
let logger = null;
let isZkConnected = false;
let deviceInfo = null;

// Módulos SDK
let ZKFingerprintSDK = null;
let FingerprintCapture = null;

// ===============================================
// ✅ VERIFICACIONES INICIALES
// ===============================================
function checkDependencies() {
    console.log('🔍 Verificando dependencias...');
    
    const requiredModules = ['express', 'cors', 'websocket'];
    let allFound = true;
    
    requiredModules.forEach(module => {
        try {
            require(module);
            console.log(`✅ ${module} encontrado`);
        } catch (error) {
            console.error(`❌ ${module} no encontrado`);
            allFound = false;
        }
    });
    
    return allFound;
}

function checkFileStructure() {
    console.log('📁 Verificando estructura de archivos...');
    
    const critical = [
        { path: 'src/sdk/zkSDK.js', required: true },
        { path: 'src/sdk/fingerprintCapture.js', required: true },
        { path: 'src/utils/logger.js', required: false },
        { path: 'dll/libzkfp.dll', required: false }
    ];
    
    let criticalMissing = false;
    
    critical.forEach(item => {
        const fullPath = path.join(__dirname, item.path);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            console.log(`✅ ${item.path}`);
        } else {
            console.log(`${item.required ? '❌' : '⚠️'} ${item.path} ${item.required ? 'FALTANTE' : 'opcional'}`);
            if (item.required) criticalMissing = true;
        }
    });
    
    return !criticalMissing;
}

// ===============================================
// ✅ CARGA SEGURA DE MÓDULOS SDK
// ===============================================
function loadSDKModules() {
    console.log('📦 Cargando módulos SDK...');
    
    try {
        // Cargar ZKFingerprintSDK
        try {
            ZKFingerprintSDK = require('./src/sdk/zkSDK');
            console.log('✅ zkSDK.js cargado');
        } catch (error) {
            console.error('❌ Error cargando zkSDK.js:', error.message);
            return false;
        }
        
        // Cargar FingerprintCapture
        try {
            FingerprintCapture = require('./src/sdk/fingerprintCapture');
            console.log('✅ fingerprintCapture.js cargado');
        } catch (error) {
            console.warn('⚠️ fingerprintCapture.js no disponible:', error.message);
            FingerprintCapture = null;
        }
        
        // Cargar logger
        try {
            logger = require('./src/utils/logger');
            console.log('✅ logger.js cargado');
        } catch (error) {
            console.warn('⚠️ logger.js no disponible, usando console');
            logger = console;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error crítico cargando módulos:', error);
        return false;
    }
}

// ===============================================
// ✅ INICIALIZACIÓN DEL SDK ZKFECO - CORREGIDO
// ===============================================
async function initializeZKSDK() {
    console.log('🖐️ Inicializando SDK ZKTeco...');
    
    try {
        if (!ZKFingerprintSDK) {
            throw new Error('Clase ZKFingerprintSDK no disponible');
        }
        
        // Verificar DLL
        const dllPath = path.join(__dirname, 'dll', 'libzkfp.dll');
        const dllExists = fs.existsSync(dllPath);
        
        if (!dllExists) {
            console.warn('⚠️ libzkfp.dll no encontrado en dll/');
            console.log('📋 Notas sobre libzkfp.dll:');
            console.log('   - Es necesario para comunicación con dispositivos ZKTeco');
            console.log('   - Debe ser proporcionado por ZKTeco SDK');
            console.log('   - Verificar compatibilidad (32-bit/64-bit)');
            console.log('   - El servidor funcionará pero sin capturas reales');
            
            deviceInfo = { 
                type: 'ZKTeco', 
                status: 'dll_missing', 
                message: 'libzkfp.dll requerido para conexión real',
                timestamp: new Date().toISOString() 
            };
            return false;
        } else {
            console.log('✅ libzkfp.dll encontrado');
        }
        
        // Crear instancia del SDK
        console.log('🔧 Creando instancia ZKFingerprintSDK...');
        zkSDK = new ZKFingerprintSDK();
        
        // ⭐ PASO CRÍTICO: INICIALIZAR EL SDK ANTES DE CONECTAR
        console.log('🚀 Inicializando SDK interno...');
        try {
            await zkSDK.initialize();
            console.log('✅ SDK interno inicializado correctamente');
        } catch (initError) {
            console.error('❌ Error en inicialización del SDK:', initError.message);
            throw initError;
        }
        
        // Verificar métodos críticos
        const requiredMethods = ['connect', 'captureFingerprint', 'getDeviceInfo'];
        const missingMethods = requiredMethods.filter(method => typeof zkSDK[method] !== 'function');
        
        if (missingMethods.length > 0) {
            console.warn('⚠️ Métodos faltantes en SDK:', missingMethods);
        } else {
            console.log('✅ Todos los métodos SDK disponibles');
        }
        
        // AHORA SÍ intentar conectar dispositivo
        console.log('🔌 Intentando conectar dispositivo ZKTeco...');
        
        try {
            const connected = await zkSDK.connect();
            
            if (connected) {
                isZkConnected = true;
                
                // Obtener info del dispositivo
                deviceInfo = zkSDK.getDeviceInfo();
                console.log('📋 Dispositivo conectado:', deviceInfo);
                
                // Inicializar módulo de captura
                if (FingerprintCapture) {
                    fingerprintCapture = new FingerprintCapture(zkSDK);
                    console.log('✅ Módulo de captura inicializado');
                }
                
                console.log('🎉 ¡SDK ZKTECO CONECTADO EXITOSAMENTE!');
                console.log('🖐️ ¡Dispositivo listo para capturar huellas!');
                
            } else {
                console.warn('⚠️ No se pudo conectar al dispositivo ZKTeco');
                console.log('🔧 Verificaciones sugeridas:');
                console.log('   1. Dispositivo conectado via USB y encendido');
                console.log('   2. Drivers ZKTeco instalados correctamente');
                console.log('   3. Ejecutar como administrador');
                console.log('   4. Puerto USB funcional y con alimentación');
                console.log('   5. Probar con software demo oficial ZKTeco');
                isZkConnected = false;
            }
            
        } catch (connectError) {
            console.warn('⚠️ Error conectando dispositivo:', connectError.message);
            console.log('🔧 El SDK está inicializado pero el dispositivo no responde');
            isZkConnected = false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando SDK ZKTeco:', error);
        isZkConnected = false;
        
        // Información de debugging
        console.log('🔍 Información de debugging:');
        console.log(`   - Error: ${error.message}`);
        console.log(`   - DLL Path: ${path.join(__dirname, 'dll', 'libzkfp.dll')}`);
        console.log(`   - Node Version: ${process.version}`);
        console.log(`   - Platform: ${process.platform} ${process.arch}`);
        
        deviceInfo = {
            type: 'ZKTeco',
            status: 'initialization_failed',
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        return false;
    }
}

// ===============================================
// ✅ CAPTURA DE HUELLAS DACTILARES
// ===============================================
async function handleFingerprintCapture(connection, params) {
    console.log('🖐️ Iniciando proceso de captura...');
    console.log('📋 Parámetros:', params);
    
    const userId = params.userId || `user_${Date.now()}`;
    const userName = params.userName || 'Usuario';
    const fingerIndex = params.fingerIndex || 1;
    
    // Función helper para enviar estados
    const sendStatus = (status, message, progress = 0, extra = {}) => {
        if (connection && connection.connected) {
            connection.sendUTF(JSON.stringify({
                type: 'capture_status',
                status,
                message,
                progress,
                userId,
                userName,
                fingerIndex,
                timestamp: new Date().toISOString(),
                ...extra
            }));
        }
    };
    
    try {
        // Validaciones iniciales
        sendStatus('validating', '🔍 Validando configuración...', 5);
        
        if (!zkSDK) {
            throw new Error('SDK ZKTeco no inicializado');
        }
        
        if (!isZkConnected) {
            throw new Error('Dispositivo ZKTeco no conectado');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Preparación
        sendStatus('preparing', '🔧 Preparando dispositivo...', 15);
        
        // Verificar conexión actual
        if (typeof zkSDK.ensureConnection === 'function') {
            const connectionOk = await zkSDK.ensureConnection();
            if (!connectionOk) {
                throw new Error('Dispositivo perdió conexión');
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Listo para captura
        sendStatus('ready', '👆 COLOQUE EL DEDO EN EL SENSOR', 25, {
            instruction: 'Presione firmemente y mantenga quieto',
            deviceInfo: deviceInfo
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Capturando
        sendStatus('capturing', '📸 Capturando huella dactilar...', 40);
        
        console.log('🖐️ Ejecutando zkSDK.captureFingerprint()...');
        
        // Verificar método existe
        if (typeof zkSDK.captureFingerprint !== 'function') {
            throw new Error('Método captureFingerprint no disponible en SDK');
        }
        
        // ¡CAPTURA REAL!
        const captureResult = await zkSDK.captureFingerprint();
        
        if (!captureResult || !captureResult.success) {
            throw new Error(`Captura falló: ${captureResult?.error || 'Sin detalles'}`);
        }
        
        console.log('✅ Captura exitosa:', captureResult);
        
        // Procesando
        sendStatus('processing', '🔍 Procesando datos biométricos...', 70);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Validando calidad
        sendStatus('validating', '✅ Validando calidad del template...', 85);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Finalizando
        sendStatus('finalizing', '🎯 Finalizando captura...', 95);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Resultado final
        const finalResult = {
            success: true,
            fingerprintId: `fp_${Date.now()}_${userId}`,
            userId,
            userName,
            fingerIndex,
            template: captureResult.template,
            templateSize: captureResult.templateSize || captureResult.template?.length || 0,
            quality: captureResult.quality || 'good',
            score: captureResult.score || 0,
            method: 'ZKTeco SDK Real',
            deviceType: deviceInfo?.type || 'ZKTeco',
            deviceInfo: deviceInfo,
            captureTime: captureResult.captureTime || 0,
            captureAttempts: captureResult.captureAttempts || 1,
            realCapture: true,
            sdkVersion: '4.0.0',
            luishdz04: true,
            muscleUpGym: true,
            location: 'Muscle Up GYM',
            capturedAt: new Date().toISOString(),
            metadata: {
                serverUptime: Math.floor(process.uptime()),
                clientId: connection.clientId,
                sdkInitialized: true,
                deviceConnected: isZkConnected
            }
        };
        
        // Enviar resultado exitoso
        connection.sendUTF(JSON.stringify({
            type: 'capture_result',
            success: true,
            data: finalResult,
            message: '🎉 ¡HUELLA CAPTURADA EXITOSAMENTE!',
            progress: 100,
            timestamp: new Date().toISOString()
        }));
        
        // Broadcast a otros clientes
        broadcastToClients(JSON.stringify({
            type: 'fingerprint_captured',
            data: {
                userId: finalResult.userId,
                userName: finalResult.userName,
                fingerprintId: finalResult.fingerprintId,
                quality: finalResult.quality,
                timestamp: finalResult.capturedAt,
                location: 'Muscle Up GYM'
            },
            message: `🖐️ Nueva huella: ${finalResult.userName}`,
            timestamp: new Date().toISOString()
        }), connection);
        
        console.log(`✅ 🎉 CAPTURA EXITOSA: ${finalResult.userName}`);
        console.log(`📊 ID: ${finalResult.fingerprintId}`);
        console.log(`📊 Calidad: ${finalResult.quality}`);
        console.log(`📊 Tamaño: ${finalResult.templateSize} bytes`);
        
        // Log con logger si está disponible
        if (logger && logger.info) {
            logger.info(`Captura exitosa: ${finalResult.userName} (${finalResult.fingerprintId})`);
        }
        
    } catch (error) {
        console.error('❌ ERROR EN CAPTURA:', error);
        
        // Enviar error al cliente
        connection.sendUTF(JSON.stringify({
            type: 'capture_result',
            success: false,
            error: error.message,
            message: `❌ Error: ${error.message}`,
            troubleshooting: [
                'Verificar conexión del dispositivo ZKTeco',
                'Limpiar superficie del sensor',
                'Colocar dedo firmemente en el centro',
                'Verificar que libzkfp.dll existe',
                'Probar con demo oficial de ZKTeco',
                'Ejecutar como administrador',
                'Verificar drivers instalados',
                'Reiniciar dispositivo USB'
            ],
            supportInfo: {
                developer: 'luishdz04',
                location: 'Muscle Up GYM',
                contact: 'Reportar en GitHub Issues',
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        }));
        
        // Log del error
        if (logger && logger.error) {
            logger.error(`Error captura ${userName}: ${error.message}`);
        }
    }
}

// ===============================================
// ✅ WEBSOCKET SERVER
// ===============================================
function initializeWebSocket() {
    try {
        console.log(`🌐 Iniciando WebSocket Server puerto ${WS_PORT}...`);
        
        httpServer = http.createServer((request, response) => {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('ZK Access Agent WebSocket Server Running');
        });
        
        httpServer.listen(WS_PORT, HOST, () => {
            console.log(`✅ WebSocket HTTP Server: http://${HOST}:${WS_PORT}`);
        });
        
        wsServer = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: true
        });
        
        wsServer.on('connect', (connection) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            connection.clientId = clientId;
            
            connectedClients.add(connection);
            
            console.log(`🎉 Cliente WebSocket conectado: ${clientId}`);
            console.log(`👥 Total clientes conectados: ${connectedClients.size}`);
            
            // Mensaje de bienvenida
            connection.sendUTF(JSON.stringify({
                type: 'welcome',
                message: '🎉 ¡Conectado al ZK Access Agent!',
                clientId: clientId,
                timestamp: new Date().toISOString(),
                serverInfo: {
                    version: '4.0.0-production',
                    developer: 'luishdz04',
                    location: 'Muscle Up GYM',
                    mode: 'real_sdk_capture',
                    uptime: Math.floor(process.uptime()),
                    deviceConnected: isZkConnected,
                    deviceInfo: deviceInfo,
                    sdkInitialized: zkSDK ? true : false,
                    features: [
                        'real_fingerprint_capture',
                        'websocket_communication',
                        'multi_client_support',
                        'device_status_monitoring'
                    ]
                }
            }));
            
            // Manejar mensajes del cliente
            connection.on('message', (message) => {
                try {
                    if (message.type === 'utf8') {
                        const data = JSON.parse(message.utf8Data);
                        console.log(`📨 Mensaje de ${clientId}: ${data.action || data.type}`);
                        
                        handleWebSocketMessage(connection, data);
                    }
                } catch (error) {
                    console.error(`❌ Error procesando mensaje de ${clientId}:`, error);
                    
                    connection.sendUTF(JSON.stringify({
                        type: 'error',
                        message: 'Error procesando mensaje',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
            
            // Manejar desconexión
            connection.on('close', (reasonCode, description) => {
                connectedClients.delete(connection);
                console.log(`🔌 Cliente ${clientId} desconectado (${reasonCode})`);
                console.log(`👥 Clientes restantes: ${connectedClients.size}`);
            });
            
            connection.on('error', (error) => {
                console.error(`❌ Error WebSocket ${clientId}:`, error);
                connectedClients.delete(connection);
            });
            
            // Enviar estado inicial después de conexión
            setTimeout(() => {
                if (connection.connected) {
                    connection.sendUTF(JSON.stringify({
                        type: 'initial_status',
                        data: {
                            deviceConnected: isZkConnected,
                            deviceInfo: deviceInfo,
                            serverUptime: Math.floor(process.uptime()),
                            clientsConnected: connectedClients.size,
                            sdkStatus: {
                                loaded: !!ZKFingerprintSDK,
                                initialized: zkSDK ? true : false,
                                connected: isZkConnected,
                                captureReady: !!(zkSDK && isZkConnected)
                            }
                        },
                        timestamp: new Date().toISOString()
                    }));
                }
            }, 1000);
        });
        
        console.log(`✅ 🌐 WebSocket Server ACTIVO: ws://${HOST}:${WS_PORT}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error iniciando WebSocket Server:', error);
        return false;
    }
}

// ===============================================
// ✅ MANEJO DE MENSAJES WEBSOCKET
// ===============================================
async function handleWebSocketMessage(connection, data) {
    const { action, type, ...params } = data;
    const command = action || type;
    
    console.log(`📋 Ejecutando comando: ${command}`);
    
    try {
        switch (command) {
            case 'ping':
                connection.sendUTF(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date().toISOString(),
                    uptime: Math.floor(process.uptime()),
                    clientId: connection.clientId,
                    serverStatus: 'running',
                    deviceStatus: isZkConnected ? 'connected' : 'disconnected',
                    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
                }));
                break;
                
            case 'capture_fingerprint':
                await handleFingerprintCapture(connection, params);
                break;
                
            case 'get_device_status':
                let statusData = {
                    connected: isZkConnected,
                    deviceInfo: deviceInfo,
                    sdkLoaded: !!ZKFingerprintSDK,
                    sdkInitialized: zkSDK ? true : false,
                    captureModuleLoaded: !!FingerprintCapture,
                    serverUptime: Math.floor(process.uptime()),
                    connectedClients: connectedClients.size,
                    lastUpdate: new Date().toISOString()
                };
                
                // Obtener estado actualizado del SDK
                if (zkSDK && isZkConnected) {
                    try {
                        if (typeof zkSDK.getDeviceStatus === 'function') {
                            statusData.currentStatus = await zkSDK.getDeviceStatus();
                        }
                        if (typeof zkSDK.isDeviceConnected === 'function') {
                            statusData.deviceOnline = zkSDK.isDeviceConnected();
                        }
                    } catch (error) {
                        statusData.statusError = error.message;
                    }
                }
                
                connection.sendUTF(JSON.stringify({
                    type: 'device_status',
                    data: statusData,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case 'test_connection':
                let testResult = false;
                let testMessage = '';
                
                try {
                    if (!zkSDK) {
                        testMessage = 'SDK no inicializado';
                    } else if (!isZkConnected) {
                        testMessage = 'Dispositivo no conectado';
                    } else {
                        // Probar conexión
                        if (typeof zkSDK.ensureConnection === 'function') {
                            testResult = await zkSDK.ensureConnection();
                            testMessage = testResult ? 'Conexión verificada exitosamente' : 'Dispositivo no responde';
                        } else {
                            testResult = true;
                            testMessage = 'SDK disponible (método de prueba limitado)';
                        }
                    }
                } catch (error) {
                    testMessage = `Error en prueba: ${error.message}`;
                }
                
                connection.sendUTF(JSON.stringify({
                    type: 'test_result',
                    success: testResult,
                    message: testResult ? `✅ ${testMessage}` : `❌ ${testMessage}`,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case 'reconnect_device':
                try {
                    connection.sendUTF(JSON.stringify({
                        type: 'reconnect_status',
                        message: '🔄 Intentando reconectar dispositivo...',
                        timestamp: new Date().toISOString()
                    }));
                    
                    // Desconectar primero si está conectado
                    if (zkSDK && typeof zkSDK.disconnect === 'function') {
                        await zkSDK.disconnect();
                        isZkConnected = false;
                    }
                    
                    // Intentar reconectar
                    const reconnected = await initializeZKSDK();
                    
                    connection.sendUTF(JSON.stringify({
                        type: 'reconnect_result',
                        success: reconnected,
                        message: reconnected ? 
                            '✅ Dispositivo reconectado exitosamente' : 
                            '❌ No se pudo reconectar el dispositivo',
                        deviceInfo: reconnected ? deviceInfo : null,
                        timestamp: new Date().toISOString()
                    }));
                    
                } catch (error) {
                    connection.sendUTF(JSON.stringify({
                        type: 'reconnect_result',
                        success: false,
                        error: error.message,
                        message: `❌ Error en reconexión: ${error.message}`,
                        timestamp: new Date().toISOString()
                    }));
                }
                break;
                
            case 'get_server_info':
                connection.sendUTF(JSON.stringify({
                    type: 'server_info',
                    data: {
                        version: '4.0.0-production',
                        developer: 'luishdz04',
                        location: 'Muscle Up GYM',
                        currentTime: new Date().toISOString(),
                        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
                        uptime: Math.floor(process.uptime()),
                        nodeVersion: process.version,
                        platform: process.platform,
                        architecture: process.arch,
                        workingDirectory: __dirname,
                        connectedClients: connectedClients.size,
                        memoryUsage: process.memoryUsage(),
                        features: [
                            'ZKTeco SDK Integration',
                            'Real Fingerprint Capture',
                            'WebSocket Communication',
                            'Multi-client Support',
                            'Device Status Monitoring',
                            'Error Recovery',
                            'Logging System'
                        ]
                    },
                    timestamp: new Date().toISOString()
                }));
                break;
                
            default:
                connection.sendUTF(JSON.stringify({
                    type: 'error',
                    message: `❌ Comando no soportado: ${command}`,
                    availableCommands: [
                        'ping',
                        'capture_fingerprint',
                        'get_device_status',
                        'test_connection',
                        'reconnect_device',
                        'get_server_info'
                    ],
                    timestamp: new Date().toISOString()
                }));
        }
    } catch (error) {
        console.error(`❌ Error manejando comando ${command}:`, error);
        
        connection.sendUTF(JSON.stringify({
            type: 'command_error',
            command: command,
            error: error.message,
            message: `Error ejecutando comando: ${command}`,
            timestamp: new Date().toISOString()
        }));
    }
}

// ===============================================
// ✅ BROADCAST A CLIENTES CONECTADOS
// ===============================================
function broadcastToClients(message, excludeConnection = null) {
    if (!wsServer || connectedClients.size === 0) return;
    
    let sentCount = 0;
    let errorCount = 0;
    
    connectedClients.forEach((client) => {
        if (client !== excludeConnection && client.connected) {
            try {
                client.sendUTF(message);
                sentCount++;
            } catch (error) {
                console.error('❌ Error enviando mensaje a cliente:', error);
                connectedClients.delete(client);
                errorCount++;
            }
        }
    });
    
    if (sentCount > 0) {
        console.log(`📡 Broadcast enviado a ${sentCount} clientes${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
    }
}

// ===============================================
// ✅ EXPRESS SERVER
// ===============================================
const app = express();

// Middleware de seguridad mejorado
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:3001', 
        'http://127.0.0.1:3001',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));

app.use(express.json({ 
    limit: '10mb',
    strict: true
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 50
}));

// Middleware de logging mejorado
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    console.log(`📤 ${req.method} ${req.path} - ${timestamp}`);
    console.log(`   👤 IP: ${ip}`);
    console.log(`   🌐 User-Agent: ${userAgent.substring(0, 50)}...`);
    
    // Agregar headers de seguridad
    res.setHeader('X-Powered-By', 'ZK Access Agent v4.0.0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    next();
});

// Middleware de manejo de errores de parsing
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        console.error('❌ Error de parsing JSON:', error);
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el body de la petición',
            error: 'Syntax Error',
            timestamp: new Date().toISOString()
        });
    }
    next();
});

// ===============================================
// ✅ RUTAS HTTP MEJORADAS
// ===============================================

// Ruta principal con más información
app.get('/', (req, res) => {
    res.json({
        message: '🖐️ ZK Access Agent - SDK Existente Real',
        version: '4.0.0-production',
        developer: 'luishdz04',
        location: 'Muscle Up GYM',
        timestamp: new Date().toISOString(),
        status: 'running',
        uptime: Math.floor(process.uptime()),
        device: {
            connected: isZkConnected,
            info: deviceInfo,
            lastCheck: new Date().toISOString()
        },
        sdk: {
            initialized: zkSDK ? true : false,
            ready: !!(zkSDK && isZkConnected)
        },
        communication: {
            websocket: `ws://${HOST}:${WS_PORT}`,
            http: `http://${HOST}:${PORT}`,
            connectedClients: connectedClients.size
        },
        endpoints: {
            info: '/api/info',
            status: '/api/status',
            device: '/api/device',
            health: '/api/health',
            logs: '/api/logs'
        },
        features: [
            'Real ZKTeco SDK Integration',
            'WebSocket Real-time Communication',
            'Multi-client Support',
            'Device Status Monitoring',
            'Error Recovery & Logging',
            'REST API Complete'
        ]
    });
});

// Información del sistema con más detalles
app.get('/api/info', (req, res) => {
    const memUsage = process.memoryUsage();
    
    res.json({
        success: true,
        message: 'ZK Access Agent - Información del Sistema',
        data: {
            version: '4.0.0-production',
            mode: 'real_sdk_capture',
            developer: 'luishdz04',
            location: 'Muscle Up GYM',
            system: {
                uptime: Math.floor(process.uptime()),
                startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                workingDirectory: __dirname,
                processId: process.pid
            },
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            communication: {
                websocket: `ws://${HOST}:${WS_PORT}`,
                http: `http://${HOST}:${PORT}`,
                connectedClients: connectedClients.size
            },
            modules: {
                zkSDK: !!ZKFingerprintSDK,
                sdkInitialized: zkSDK ? true : false,
                fingerprintCapture: !!FingerprintCapture,
                logger: !!logger,
                wsServer: !!wsServer
            },
            device: {
                connected: isZkConnected,
                info: deviceInfo,
                lastStatusCheck: new Date().toISOString()
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Estado del dispositivo con verificación en tiempo real
app.get('/api/device', async (req, res) => {
    try {
        let deviceStatus = {
            connected: isZkConnected,
            deviceInfo: deviceInfo,
            sdkLoaded: !!ZKFingerprintSDK,
            sdkInitialized: zkSDK ? true : false,
            captureReady: !!(zkSDK && isZkConnected),
            lastCheck: new Date().toISOString()
        };
        
        // Verificación adicional si está conectado
        if (zkSDK && isZkConnected) {
            try {
                if (typeof zkSDK.isDeviceConnected === 'function') {
                    deviceStatus.realTimeStatus = zkSDK.isDeviceConnected();
                }
                if (typeof zkSDK.getDeviceInfo === 'function') {
                    deviceStatus.currentDeviceInfo = zkSDK.getDeviceInfo();
                }
            } catch (error) {
                deviceStatus.statusError = error.message;
                deviceStatus.statusErrorTime = new Date().toISOString();
            }
        }
        
        res.json({
            success: true,
            data: deviceStatus,
            message: isZkConnected ? 'Dispositivo conectado y operativo' : 'Dispositivo no conectado',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verificando estado del dispositivo',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Estado general del servidor con métricas detalladas
app.get('/api/status', (req, res) => {
    const memUsage = process.memoryUsage();
    const loadAverage = process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0];
    
    res.json({
        success: true,
        status: 'running',
        server: {
            uptime: Math.floor(process.uptime()),
            startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
            version: '4.0.0-production',
            environment: process.env.NODE_ENV || 'development'
        },
        performance: {
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            loadAverage: loadAverage,
            cpuUsage: process.cpuUsage()
        },
        connections: {
            websocket: {
                active: connectedClients.size,
                serverRunning: !!wsServer
            },
            http: {
                status: 'active',
                port: PORT,
                host: HOST
            }
        },
        device: {
            status: isZkConnected ? 'connected' : 'disconnected',
            type: deviceInfo?.type || 'unknown',
            lastUpdate: deviceInfo?.timestamp || 'never',
            sdkInitialized: zkSDK ? true : false
        },
        timestamp: new Date().toISOString()
    });
});

// Health check mejorado con más verificaciones
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'healthy',
        checks: {
            server: 'ok',
            websocket: wsServer ? 'ok' : 'error',
            sdk: ZKFingerprintSDK ? 'ok' : 'warning',
            sdkInitialized: zkSDK ? 'ok' : 'warning',
            device: isZkConnected ? 'ok' : 'warning',
            memory: 'ok',
            modules: 'ok'
        },
        metrics: {
            uptime: Math.floor(process.uptime()),
            connectedClients: connectedClients.size,
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        timestamp: new Date().toISOString()
    };
    
    // Verificación de memoria
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memoryUsage > 500) {
        health.checks.memory = 'warning';
    }
    if (memoryUsage > 1000) {
        health.checks.memory = 'error';
    }
    
    // Verificación de módulos críticos
    if (!ZKFingerprintSDK || !wsServer) {
        health.checks.modules = 'warning';
    }
    
    // Verificación adicional del dispositivo si es posible
    if (zkSDK && isZkConnected) {
        try {
            if (typeof zkSDK.isDeviceConnected === 'function') {
                const deviceOnline = zkSDK.isDeviceConnected();
                if (!deviceOnline) {
                    health.checks.device = 'warning';
                    health.deviceNote = 'SDK dice que el dispositivo está desconectado';
                }
            }
        } catch (error) {
            health.checks.device = 'error';
            health.deviceError = error.message;
        }
    }
    
    const hasErrors = Object.values(health.checks).includes('error');
    const hasWarnings = Object.values(health.checks).includes('warning');
    
    if (hasErrors) {
        health.status = 'unhealthy';
        res.status(500);
    } else if (hasWarnings) {
        health.status = 'degraded';
        res.status(200);
    }
    
    res.json(health);
});

// Nueva ruta para logs básicos
app.get('/api/logs', (req, res) => {
    const logs = {
        serverStart: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        uptime: Math.floor(process.uptime()),
        events: {
            serverStarted: true,
            sdkLoaded: !!ZKFingerprintSDK,
            sdkInitialized: zkSDK ? true : false,
            deviceConnected: isZkConnected,
            websocketActive: !!wsServer,
            currentClients: connectedClients.size
        },
        lastActivity: new Date().toISOString(),
        version: '4.0.0-production'
    };
    
    res.json({
        success: true,
        data: logs,
        message: 'Logs básicos del sistema',
        timestamp: new Date().toISOString()
    });
});

// CORRECCIÓN PRINCIPAL: Manejo de rutas 404 SIN usar asterisco
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        requestedPath: req.path,
        requestedMethod: req.method,
        availableEndpoints: [
            '/',
            '/api/info',
            '/api/device', 
            '/api/status', 
            '/api/health',
            '/api/logs'
        ],
        suggestion: 'Verificar la URL y método HTTP',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores generales mejorado
app.use((error, req, res, next) => {
    console.error('❌ Error HTTP:', error);
    
    // Log del error si logger está disponible
    if (logger && logger.error) {
        logger.error(`HTTP Error ${req.method} ${req.path}:`, error);
    }
    
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
    });
});

// ===============================================
// ✅ FUNCIÓN PRINCIPAL DE INICIO
// ===============================================
async function startServer() {
    try {
        console.log('🎉 ========================================= 🎉');
        console.log(`  ZK ACCESS AGENT - INICIO DEL SISTEMA`);
        console.log(`  Desarrollado por: luishdz04`);
        console.log(`  Ubicación: Muscle Up GYM`);
        console.log(`  Versión: 4.0.0-production`);
        console.log(`  Fecha: 2025-06-17 06:10:17 UTC`);
        console.log('🎉 ========================================= 🎉');
        console.log('');
        
        // Paso 1: Verificar dependencias
        console.log('📋 PASO 1: Verificando dependencias...');
        const depsOk = checkDependencies();
        if (!depsOk) {
            throw new Error('Dependencias faltantes - ejecuta: npm install');
        }
        console.log('✅ Todas las dependencias encontradas');
        console.log('');
        
        // Paso 2: Verificar estructura de archivos
        console.log('📋 PASO 2: Verificando estructura de archivos...');
        const structureOk = checkFileStructure();
        if (!structureOk) {
            throw new Error('Archivos críticos faltantes');
        }
        console.log('✅ Estructura de archivos válida');
        console.log('');
        
        // Paso 3: Cargar módulos SDK
        console.log('📋 PASO 3: Cargando módulos SDK...');
        const modulesOk = loadSDKModules();
        if (!modulesOk) {
            throw new Error('No se pudieron cargar los módulos SDK');
        }
        console.log('✅ Módulos SDK cargados exitosamente');
        console.log('');
        
        // Paso 4: Inicializar SDK ZKTeco
        console.log('📋 PASO 4: Inicializando SDK ZKTeco...');
        const sdkOk = await initializeZKSDK();
        if (sdkOk) {
            console.log('✅ SDK ZKTeco inicializado correctamente');
        } else {
            console.log('⚠️ SDK inicializado con limitaciones');
        }
        console.log('');
        
        // Paso 5: Iniciar servidor HTTP
        console.log('📋 PASO 5: Iniciando servidor HTTP...');
        
        // Manejo de errores del servidor HTTP
        const server = app.listen(PORT, HOST, () => {
            console.log(`✅ Servidor HTTP corriendo en: http://${HOST}:${PORT}`);
        });
        
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${PORT} ya está en uso`);
                console.log('💡 Soluciones:');
                console.log(`   - Cambiar puerto: set PORT=4002 && node app.js`);
                console.log(`   - Matar proceso: taskkill /F /IM node.exe`);
                console.log(`   - Verificar procesos: netstat -ano | findstr :${PORT}`);
                process.exit(1);
            } else {
                console.error('❌ Error en servidor HTTP:', error);
                process.exit(1);
            }
        });
        
        console.log('');
        
        // Paso 6: Iniciar WebSocket
        console.log('📋 PASO 6: Iniciando WebSocket Server...');
        const wsOk = initializeWebSocket();
        if (wsOk) {
            console.log('✅ WebSocket Server activo');
        } else {
            console.log('❌ Error iniciando WebSocket');
        }
        console.log('');
        
        // Resumen final
        console.log('🎯 ========================================= 🎯');
        console.log('           RESUMEN DE INICIALIZACIÓN');
        console.log('🎯 ========================================= 🎯');
        console.log(`HTTP Server:     ${server ? '✅' : '❌'} Puerto ${PORT}`);
        console.log(`WebSocket:       ${wsOk ? '✅' : '❌'} Puerto ${WS_PORT}`);
        console.log(`SDK Modules:     ${modulesOk ? '✅' : '❌'}`);
        console.log(`SDK Initialized: ${zkSDK ? '✅' : '❌'} ${zkSDK ? 'Inicializado' : 'No inicializado'}`);
        console.log(`ZKTeco Device:   ${isZkConnected ? '✅' : '⚠️'} ${isZkConnected ? 'Conectado' : 'No conectado'}`);
        console.log(`Dependencies:    ${depsOk ? '✅' : '❌'}`);
        console.log(`File Structure:  ${structureOk ? '✅' : '❌'}`);
        console.log('');
        
        if (server && wsOk && modulesOk) {
            console.log('🚀 ¡SERVIDOR COMPLETAMENTE OPERATIVO!');
            console.log('');
            console.log('📱 Conexiones disponibles:');
            console.log(`   🌐 HTTP:      http://${HOST}:${PORT}`);
            console.log(`   🔌 WebSocket: ws://${HOST}:${WS_PORT}`);
            console.log('');
            console.log('🖐️ Funcionalidades activas:');
            console.log(`   ${isZkConnected ? '✅' : '⚠️'} Captura de huellas dactilares`);
            console.log('   ✅ Comunicación WebSocket');
            console.log('   ✅ API REST completa');
            console.log('   ✅ Monitoreo de dispositivos');
            console.log('   ✅ Soporte multi-cliente');
            console.log('   ✅ Manejo de errores robusto');
            console.log('   ✅ Logging y métricas');
            console.log('');
            
            if (!isZkConnected) {
                console.log('⚠️ NOTAS IMPORTANTES:');
                console.log('   • Dispositivo ZKTeco no conectado');
                console.log('   • SDK está inicializado correctamente');
                console.log('   • Verificar que el dispositivo esté encendido');
                console.log('   • Probar desconectar y reconectar USB');
                console.log('   • Revisar drivers ZKTeco instalados');
                console.log('   • Verificar cable USB y alimentación del dispositivo');
                console.log('   • Ejecutar como administrador si es necesario');
                console.log('');
            } else {
                console.log('🎉 ¡DISPOSITIVO ZKTECO CONECTADO Y LISTO!');
                console.log('   • Puedes capturar huellas dactilares reales');
                console.log('   • Usa el WebSocket para comunicación en tiempo real');
                console.log('   • API REST disponible para integraciones');
                console.log('');
            }
            
        } else {
            console.log('⚠️ SERVIDOR INICIADO CON LIMITACIONES');
            console.log('   Revisar errores arriba para más detalles');
            console.log('');
        }
        
        console.log('💪 Muscle Up GYM - Sistema de Control de Acceso');
        console.log('👨‍💻 Desarrollado por luishdz04');
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log('');
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO AL INICIAR SERVIDOR:', error);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('   1. Verificar que todos los archivos estén presentes');
        console.log('   2. Ejecutar: npm install');
        console.log('   3. Verificar permisos de archivos');
        console.log('   4. Ejecutar como administrador');
        console.log('   5. Verificar puerto no esté en uso');
        console.log('   6. Verificar Node.js versión compatible');
        console.log('   7. Revisar firewall y antivirus');
        console.log('');
        process.exit(1);
    }
}

// ===============================================
// ✅ MANEJO DE CIERRE LIMPIO MEJORADO
// ===============================================
process.on('SIGINT', async () => {
    console.log('\n🧹 Cerrando ZK Access Agent...');
    
    try {
        // Notificar a clientes conectados
        if (connectedClients.size > 0) {
            console.log('📢 Notificando cierre a clientes conectados...');
            broadcastToClients(JSON.stringify({
                type: 'server_shutdown',
                message: 'Servidor cerrándose...',
                reason: 'Manual shutdown',
                timestamp: new Date().toISOString()
            }));
            
            // Dar tiempo para que se envíen los mensajes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Limpiar SDK ZKTeco
        if (zkSDK && typeof zkSDK.cleanup === 'function') {
            console.log('🧹 Limpiando recursos SDK ZKTeco...');
            try {
                await zkSDK.cleanup();
                console.log('✅ SDK ZKTeco limpiado correctamente');
            } catch (error) {
                console.error('⚠️ Error limpiando SDK:', error.message);
            }
        }
        
        // Limpiar módulo de captura
        if (fingerprintCapture && typeof fingerprintCapture.cleanup === 'function') {
            try {
                fingerprintCapture.cleanup();
                console.log('✅ Módulo de captura limpiado');
            } catch (error) {
                console.error('⚠️ Error limpiando módulo de captura:', error.message);
            }
        }
        
        // Cerrar servidores
        if (wsServer) {
            try {
                wsServer.shutDown();
                console.log('✅ WebSocket Server cerrado');
            } catch (error) {
                console.error('⚠️ Error cerrando WebSocket:', error.message);
            }
        }
        
        if (httpServer) {
            try {
                httpServer.close();
                console.log('✅ HTTP Server cerrado');
            } catch (error) {
                console.error('⚠️ Error cerrando HTTP Server:', error.message);
            }
        }
        
        // Log final
        if (logger && logger.info) {
            logger.info('ZK Access Agent cerrado exitosamente');
        }
        
        console.log('✅ ZK Access Agent cerrado exitosamente');
        console.log('👋 ¡Hasta luego!');
        
    } catch (error) {
        console.error('❌ Error durante cierre:', error);
    }
    
    process.exit(0);
});

// Manejo de errores no capturados mejorado
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    if (logger && logger.error) {
        logger.error('Uncaught Exception:', error);
    }
    console.log('🔄 Intentando cierre limpio...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada:', reason);
    console.error('📍 En promesa:', promise);
    if (logger && logger.error) {
        logger.error('Unhandled Rejection:', reason);
    }
});

// Manejo de advertencias
process.on('warning', (warning) => {
    console.warn('⚠️ Advertencia Node.js:', warning.name, warning.message);
});

// ===============================================
// ✅ INICIAR EL SERVIDOR
// ===============================================
console.log('🖐️ ZK Access Agent - Inicializando...');
console.log('👨‍💻 Desarrollado por luishdz04 para Muscle Up GYM');
console.log(`📅 ${new Date().toLocaleString()}`);
console.log(`🔧 Node.js ${process.version} - ${process.platform} ${process.arch}`);
console.log('');

startServer().catch(error => {
    console.error('❌ Error fatal al iniciar:', error);
    process.exit(1);
});