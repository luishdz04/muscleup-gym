const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

// Verificar dependencias básicas
console.log('🔍 Verificando dependencias...');
try {
    require('websocket');
    console.log('✅ websocket encontrado');
} catch (error) {
    console.error('❌ websocket no encontrado. Instala con: npm install websocket');
    process.exit(1);
}

// Configuración básica
const PORT = process.env.PORT || 4001;
const WS_PORT = process.env.WS_PORT || 8080;
const HOST = '127.0.0.1';

console.log('🚀 ZK Access Agent - Versión Limpia');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 luishdz04 - Muscle Up GYM`);
console.log(`📂 Directorio: ${__dirname}`);

// Variables globales
let wsServer = null;
let httpServer = null;
let connectedClients = new Set();
let zkSDK = null;
let isZkConnected = false;

// Función para verificar estructura de archivos
function checkFileStructure() {
    console.log('📁 Verificando estructura de archivos...');
    
    const requiredPaths = [
        'src',
        'src/sdk',
        'src/utils',
        'dll'
    ];
    
    const requiredFiles = [
        'src/sdk/zkSDK.js',
        'src/sdk/fingerprintCapture.js',
        'src/utils/logger.js',
        'dll/libzkpf.dll'
    ];
    
    // Verificar directorios
    const fs = require('fs');
    requiredPaths.forEach(dirPath => {
        const fullPath = path.join(__dirname, dirPath);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ Directorio: ${dirPath}`);
        } else {
            console.log(`❌ Falta directorio: ${dirPath}`);
        }
    });
    
    // Verificar archivos
    requiredFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ Archivo: ${filePath}`);
        } else {
            console.log(`❌ Falta archivo: ${filePath}`);
        }
    });
}

// Cargar módulos SDK de forma segura
function loadSDKModules() {
    console.log('📦 Intentando cargar módulos SDK...');
    
    try {
        const zkSDKPath = path.join(__dirname, 'src', 'sdk', 'zkSDK.js');
        if (require('fs').existsSync(zkSDKPath)) {
            const ZKFingerprintSDK = require('./src/sdk/zkSDK');
            console.log('✅ zkSDK.js cargado correctamente');
            return { ZKFingerprintSDK, success: true };
        } else {
            console.log('⚠️ zkSDK.js no encontrado');
            return { ZKFingerprintSDK: null, success: false };
        }
    } catch (error) {
        console.error('❌ Error cargando zkSDK:', error.message);
        return { ZKFingerprintSDK: null, success: false };
    }
}

// Inicializar WebSocket básico
function initWebSocket() {
    try {
        console.log('🌐 Iniciando WebSocket básico...');
        
        const WebSocketServer = require('websocket').server;
        
        httpServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ZK Access Agent WebSocket Server');
        });
        
        httpServer.listen(WS_PORT, HOST, () => {
            console.log(`✅ WebSocket Server: ws://${HOST}:${WS_PORT}`);
        });
        
        wsServer = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: true
        });
        
        wsServer.on('connect', (connection) => {
            const clientId = `client_${Date.now()}`;
            connection.clientId = clientId;
            connectedClients.add(connection);
            
            console.log(`🎉 Cliente conectado: ${clientId}`);
            
            // Mensaje de bienvenida
            connection.sendUTF(JSON.stringify({
                type: 'welcome',
                message: 'Conectado a ZK Access Agent',
                clientId: clientId,
                timestamp: new Date().toISOString()
            }));
            
            // Manejar mensajes
            connection.on('message', (message) => {
                try {
                    if (message.type === 'utf8') {
                        const data = JSON.parse(message.utf8Data);
                        console.log(`📨 Mensaje de ${clientId}:`, data);
                        
                        // Respuesta simple
                        connection.sendUTF(JSON.stringify({
                            type: 'response',
                            message: 'Mensaje recibido',
                            echo: data,
                            timestamp: new Date().toISOString()
                        }));
                    }
                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                }
            });
            
            // Manejar desconexión
            connection.on('close', () => {
                connectedClients.delete(connection);
                console.log(`🔌 Cliente ${clientId} desconectado`);
            });
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error iniciando WebSocket:', error);
        return false;
    }
}

// Express app básico
const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json());

// Rutas básicas
app.get('/', (req, res) => {
    res.json({
        message: 'ZK Access Agent - Versión Diagnóstico',
        version: '4.0.0-diagnostic',
        developer: 'luishdz04',
        timestamp: new Date().toISOString(),
        status: 'running',
        websocket: `ws://${HOST}:${WS_PORT}`,
        directory: __dirname
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        uptime: Math.floor(process.uptime()),
        clients: connectedClients.size,
        zkConnected: isZkConnected,
        timestamp: new Date().toISOString()
    });
});

// Función principal
async function startServer() {
    try {
        console.log('🎯 INICIANDO DIAGNÓSTICO COMPLETO...');
        console.log('=====================================');
        
        // Paso 1: Verificar estructura
        checkFileStructure();
        console.log('');
        
        // Paso 2: Cargar módulos
        const sdkResult = loadSDKModules();
        console.log('');
        
        // Paso 3: Iniciar servidor HTTP
        console.log('🌐 Iniciando servidor HTTP...');
        app.listen(PORT, HOST, () => {
            console.log(`✅ Servidor HTTP corriendo en: http://${HOST}:${PORT}`);
        });
        
        // Paso 4: Iniciar WebSocket
        console.log('🌐 Iniciando WebSocket...');
        const wsResult = initWebSocket();
        
        // Resumen final
        console.log('');
        console.log('📊 RESUMEN DE DIAGNÓSTICO:');
        console.log('=====================================');
        console.log(`HTTP Server: ${PORT ? '✅' : '❌'} Puerto ${PORT}`);
        console.log(`WebSocket: ${wsResult ? '✅' : '❌'} Puerto ${WS_PORT}`);
        console.log(`SDK Modules: ${sdkResult.success ? '✅' : '❌'}`);
        console.log(`Directory: ${__dirname}`);
        console.log('');
        
        if (PORT && wsResult) {
            console.log('🎉 SERVIDOR BÁSICO FUNCIONANDO!');
            console.log(`🌐 Accede a: http://${HOST}:${PORT}`);
            console.log(`🔌 WebSocket: ws://${HOST}:${WS_PORT}`);
        } else {
            console.log('⚠️ Problemas detectados - revisa los logs arriba');
        }
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

// Manejo de cierre
process.on('SIGINT', () => {
    console.log('\n🧹 Cerrando servidor...');
    if (httpServer) {
        httpServer.close();
    }
    console.log('✅ Servidor cerrado');
    process.exit(0);
});

// Iniciar
console.log('🚀 Iniciando ZK Access Agent - Diagnóstico...');
startServer();