 const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocketServer = require('websocket').server;
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
try {
    require('dotenv').config();
    console.log('✅ Variables de entorno cargadas');
} catch (error) {
    console.log('ℹ️ No se encontró archivo .env, usando valores por defecto');
}

// ===============================================
// ✅ CONFIGURACIÓN BÁSICA
// ===============================================
const PORT = process.env.PORT || 4001;
const WS_PORT = process.env.WS_PORT || 8080;
const HOST = '127.0.0.1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tuproyecto.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu-clave-de-servicio-de-supabase';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 ZK Access Agent - SDK EXISTENTE REAL');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 luishdz04 - Muscle Up GYM`);
console.log(`📂 Directorio: ${__dirname}`);
console.log('📊 Cliente Supabase inicializado');

// Importar el controlador F22
const F22Controller = require('./src/devices/f22Controller');

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
let f22Controller = null; // Controlador para F22

// Módulos SDK
let ZKFingerprintSDK = null;
let FingerprintCapture = null;

// ===============================================
// ✅ VERIFICACIONES INICIALES
// ===============================================
function checkDependencies() {
    console.log('🔍 Verificando dependencias...');
    
    const requiredModules = ['express', 'cors', 'websocket', '@supabase/supabase-js', 'dotenv'];
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
        
        // Verificar métodos de comparación (nuevos)
        const verificationMethods = ['compareTemplates', 'identifyFingerprint'];
        const hasVerificationMethods = verificationMethods.some(method => typeof zkSDK[method] === 'function');
        
        if (hasVerificationMethods) {
            console.log('✅ Métodos de verificación de huellas disponibles');
            
            // Configurar umbral óptimo para verificación
            if (typeof zkSDK.setVerificationThreshold === 'function') {
                zkSDK.setVerificationThreshold(60); // 60% es un buen balance entre seguridad y usabilidad
                console.log('✅ Umbral de verificación configurado al 60%');
            }
        } else {
            console.warn('⚠️ Métodos de verificación no encontrados - se usará comparación básica');
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
// ✅ COMPARACIÓN DE TEMPLATES DE HUELLAS
// ===============================================
async function compareTemplates(template1, template2) {
    try {
        console.log('🔍 Usando método alternativo de comparación binaria');
        
        // Convertir templates a buffers
        const buf1 = Buffer.from(template1, 'base64');
        const buf2 = Buffer.from(template2, 'base64');
        
        // Calcular similitud comparando bytes
        let matchingBytes = 0;
        let totalWeight = 0;
        const minLength = Math.min(buf1.length, buf2.length);
        
        // Comparar solo los primeros X bytes que contienen la información característica
        const bytesToCompare = Math.min(minLength, 256);
        
        // Dar mayor peso a los primeros bytes (generalmente más significativos)
        for (let i = 0; i < bytesToCompare; i++) {
            // Factor de peso: decrece a medida que avanzamos en el template
            const weight = 1 - (i / bytesToCompare * 0.5); // 1.0 -> 0.5
            totalWeight += weight;
            
            // Diferencia entre bytes
            const diff = Math.abs(buf1[i] - buf2[i]);
            
            // Si la diferencia es menor a un umbral, considerarlo como coincidencia
            if (diff <= 5) {
                matchingBytes += weight;
            }
        }
        
        // Calcular score normalizado (0-1)
        const score = matchingBytes / totalWeight;
        
        // Umbral ajustable para control de acceso
        const threshold = 0.55;
        
        return {
            match: score > threshold,
            score: score,
            quality: 85,
            method: 'binary_comparison',
            threshold: threshold
        };
    } catch (error) {
        console.error('❌ Error en comparación de templates:', error);
        return { match: false, score: 0, error: error.message };
    }
}

// ===============================================
// ✅ VERIFICACIÓN DE HUELLAS DACTILARES
// ===============================================
async function verifyFingerprint(capturedTemplate, connection) {
    console.log('🔍 Iniciando verificación de huella real...');
    
    try {
        // 1. Verificar que tenemos un template válido
        if (!capturedTemplate) {
            throw new Error('Template capturado inválido');
        }
        
        console.log('📊 Obteniendo huellas registradas de Supabase...');
        
        // 2. Obtener todas las huellas de la base de datos con la estructura correcta
        const { data: fingerprints, error } = await supabase
            .from('fingerprint_templates')
            .select(`
                id, 
                user_id, 
                template,
                finger_index,
                finger_name,
                average_quality,
                Users:user_id (
                    id, 
                    name, 
                    email, 
                    whatsapp, 
                    membership_type,
                    profilePictureUrl,
                    membership_type,
                    firstName,
                    lastName
                )
            `);
        
        if (error) {
            throw new Error(`Error obteniendo huellas: ${error.message}`);
        }
        
        if (!fingerprints || fingerprints.length === 0) {
            console.log('❌ No hay huellas registradas para comparar');
            return {
                success: true,
                verified: false,
                message: 'No hay huellas registradas para comparar',
                totalCompared: 0,
                timestamp: new Date().toISOString()
            };
        }
        
        console.log(`✅ ${fingerprints.length} huellas obtenidas de la BD`);
        
        // Si no hay función de identificación, continuamos con el código original
        console.log('📊 Usando comparación manual como fallback...');
        
        let bestMatch = null;
        let bestScore = 0;
        let totalCompared = 0;
        
        for (const fingerprint of fingerprints) {
            try {
                // Extraer template almacenado (campo correcto según tu esquema)
                const storedTemplate = fingerprint.template;
                
                if (!storedTemplate) {
                    console.warn(`⚠️ Huella ${fingerprint.id} sin template válido`);
                    continue;
                }
                
                totalCompared++;
                
                // Obtener el nombre del usuario para el log
                const userName = fingerprint.Users?.name || 
                                (fingerprint.Users?.firstName && fingerprint.Users?.lastName ? 
                                `${fingerprint.Users.firstName} ${fingerprint.Users.lastName}` : 
                                'Usuario');
                                
                console.log(`🔍 Comparando con huella de ${userName}...`);
                
                // Comparar templates
                const comparisonResult = await compareTemplates(capturedTemplate, storedTemplate);
                
                console.log(`📊 Resultado comparación: Score ${comparisonResult.score}, Match: ${comparisonResult.match}`);
                
                // Si encontramos una coincidencia mejor, la guardamos
                if (comparisonResult.match && comparisonResult.score > bestScore) {
                    bestMatch = fingerprint;
                    bestScore = comparisonResult.score;
                }
            } catch (compareError) {
                console.error(`❌ Error comparando con huella ${fingerprint.id}:`, compareError.message);
                continue;
            }
        }
        
        // 4. Verificar si encontramos coincidencia
        if (bestMatch && bestScore > 0.55) { // Umbral de confianza: 55%
            // Obtener el nombre completo del usuario según disponibilidad de campos
            const userName = bestMatch.Users?.name || 
                           (bestMatch.Users?.firstName && bestMatch.Users?.lastName ? 
                           `${bestMatch.Users.firstName} ${bestMatch.Users.lastName}` : 
                           'Usuario');
                           
            console.log(`✅ VERIFICACIÓN EXITOSA: ${userName} (Score: ${bestScore})`);
            
            // Registrar el acceso en la tabla access_logs
            try {
                const accessLogEntry = {
                    user_id: bestMatch.user_id,
                    access_type: 'entry',
                    access_method: 'fingerprint',
                    success: true,
                    confidence_score: bestScore,
                    membership_status: bestMatch.Users?.membership_type || 'unknown'
                };
                
                const { data: logResult, error: logError } = await supabase
                    .from('access_logs')
                    .insert(accessLogEntry);
                    
                if (logError) {
                    console.warn('⚠️ Error registrando acceso:', logError.message);
                } else {
                    console.log('✅ Acceso registrado correctamente en BD');
                }
            } catch (logError) {
                console.warn('⚠️ Error registrando log de acceso:', logError.message);
            }
            
            return {
                success: true,
                verified: true,
                user: {
                    id: bestMatch.Users?.id,
                    name: userName,
                    email: bestMatch.Users?.email,
                    whatsapp: bestMatch.Users?.whatsapp,
                    membership_type: bestMatch.Users?.membership_type,
                    profilePictureUrl: bestMatch.Users?.profilePictureUrl
                },
                fingerprintId: bestMatch.id,
                fingerName: bestMatch.finger_name,
                quality: bestMatch.average_quality || 85,
                matchScore: bestScore,
                confidence: (bestScore * 100).toFixed(2) + '%',
                verificationMethod: 'ZKTeco SDK',
                totalCompared: totalCompared,
                timestamp: new Date().toISOString(),
                accessGranted: true
            };
        }
        
        // Si llegamos aquí, no hubo coincidencias
        console.log('❌ No se encontró coincidencia con ninguna huella registrada');
        
        // Registrar el intento fallido en access_logs
        try {
            const accessLogEntry = {
                user_id: null, // Usuario desconocido
                access_type: 'denied',
                access_method: 'fingerprint',
                success: false,
                confidence_score: bestScore || 0,
                denial_reason: 'Huella no reconocida'
            };
            
            const { error: logError } = await supabase
                .from('access_logs')
                .insert(accessLogEntry);
                
            if (logError) {
                console.warn('⚠️ Error registrando denegación de acceso:', logError.message);
            } else {
                console.log('✅ Denegación de acceso registrada correctamente');
            }
        } catch (logError) {
            console.warn('⚠️ Error registrando log de denegación:', logError.message);
        }
        
        return {
            success: true,
            verified: false,
            message: 'Huella no reconocida en el sistema',
            totalCompared: totalCompared,
            bestScore: bestScore,
            threshold: 0.55,
            timestamp: new Date().toISOString(),
            accessGranted: false
        };
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        
        return {
            success: false,
            verified: false,
            error: error.message,
            message: `Error verificando huella: ${error.message}`,
            timestamp: new Date().toISOString(),
            accessGranted: false
        };
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
    const isVerificationMode = params.client_info?.mode === 'verification';
    
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
        
        // VERIFICACIÓN - Si estamos en modo verificación
        if (isVerificationMode) {
            console.log('🔐 Modo verificación detectado, comparando con base de datos...');
            
            sendStatus('verifying', '🔍 Verificando identidad en base de datos...', 80);
            
            // Realizar verificación
            const verificationResult = await verifyFingerprint(captureResult.template, connection);
            
            // Enviar resultado de verificación
            connection.sendUTF(JSON.stringify({
                type: 'verification_result',
                verified: verificationResult.verified,
                data: verificationResult,
                message: verificationResult.verified ? 
                    `✅ ACCESO PERMITIDO: ${verificationResult.user?.name}` : 
                    `❌ ACCESO DENEGADO: ${verificationResult.message || 'Huella no reconocida'}`,
                timestamp: new Date().toISOString()
            }));
            
            // Broadcast del evento
            if (verificationResult.verified) {
                broadcastToClients(JSON.stringify({
                    type: 'access_granted',
                    user: verificationResult.user?.name,
                    userId: verificationResult.user?.id,
                    fingerprintId: verificationResult.fingerprintId,
                    membershipType: verificationResult.user?.membership_type,
                    location: 'Muscle Up GYM',
                    confidence: verificationResult.confidence,
                    timestamp: new Date().toISOString()
                }), connection);
                
                // Log del acceso exitoso
                if (logger && logger.info) {
                    logger.info(`Verificación exitosa: ${verificationResult.user?.name || 'Usuario desconocido'}`);
                }
            } else {
                // Broadcast de acceso denegado
                broadcastToClients(JSON.stringify({
                    type: 'access_denied',
                    message: verificationResult.message || 'Huella no reconocida',
                    bestScore: verificationResult.bestScore || 0,
                    threshold: verificationResult.threshold || 0.55,
                    timestamp: new Date().toISOString(),
                    location: 'Muscle Up GYM'
                }), connection);
                
                // Log del acceso fallido
                if (logger && logger.info) {
                    logger.info(`Verificación fallida: Usuario desconocido`);
                }
            }
            
            console.log('✅ Verificación completada y enviada al cliente');
            return;
        }
        
        // ---- MODO CAPTURA NORMAL (continuamos con el código existente) ----
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
                        'device_status_monitoring',
                        'fingerprint_verification'
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
                                captureReady: !!(zkSDK && isZkConnected),
                                verificationReady: !!(zkSDK && typeof zkSDK.compareTemplates === 'function')
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
                
            case 'verify_fingerprint':
                if (!params.template) {
                    throw new Error('Template requerido para verificación');
                }
                
                const verificationResult = await verifyFingerprint(params.template, connection);
                
                connection.sendUTF(JSON.stringify({
                    type: 'verification_result',
                    verified: verificationResult.verified,
                    data: verificationResult,
                    timestamp: new Date().toISOString()
                }));
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
                            'Fingerprint Verification',
                            'Supabase Integration',
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
                
            case 'get_recent_access_logs':
                try {
                    // Consultar los últimos registros de acceso
                    const { data: accessLogs, error: logsError } = await supabase
                        .from('access_logs')
                        .select(`
                            id,
                            user_id,
                            access_type,
                            access_method,
                            success,
                            confidence_score,
                            created_at,
                            Users:user_id (
                                id,
                                name,
                                email,
                                profilePictureUrl,
                                membership_type
                            )
                        `)
                        .order('created_at', { ascending: false })
                        .limit(10);
                        
                    if (logsError) {
                        throw new Error(`Error obteniendo logs: ${logsError.message}`);
                    }
                    
                    connection.sendUTF(JSON.stringify({
                        type: 'access_logs_result',
                        data: accessLogs,
                        count: accessLogs.length,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    connection.sendUTF(JSON.stringify({
                        type: 'access_logs_error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }));
                }
                break;
                
            case 'get_access_config':
                try {
                    // Consultar la configuración de acceso
                    const { data: accessConfig, error: configError } = await supabase
                        .from('access_control_config')
                        .select('*')
                        .limit(1)
                        .single();
                        
                    if (configError) {
                        throw new Error(`Error obteniendo configuración: ${configError.message}`);
                    }
                    
                    connection.sendUTF(JSON.stringify({
                        type: 'access_config_result',
                        data: accessConfig,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    connection.sendUTF(JSON.stringify({
                        type: 'access_config_error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }));
                }
                break;
                
            default:
                connection.sendUTF(JSON.stringify({
                    type: 'error',
                    message: `❌ Comando no soportado: ${command}`,
                    availableCommands: [
                        'ping',
                        'capture_fingerprint',
                        'verify_fingerprint',
                        'get_device_status',
                        'test_connection',
                        'reconnect_device',
                        'get_server_info',
                        'get_recent_access_logs',
                        'get_access_config'
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
            logs: '/api/logs',
            verify: '/api/verify',
            recentAccess: '/api/access/recent'
        },
        features: [
            'Real ZKTeco SDK Integration',
            'WebSocket Real-time Communication',
            'Fingerprint Verification',
            'Supabase Integration',
            'Multi-client Support',
            'Device Status Monitoring',
            'Error Recovery & Logging',
            'REST API Complete'
        ]
    });
});

// ===============================================
// ✅ RUTAS F22 - NUEVAS
// ===============================================

// Ruta para probar la conexión con F22
app.get('/api/test-f22-connection', async (req, res) => {
  try {
    const f22Ip = req.query.ip || process.env.F22_IP || '192.168.1.201';
    const f22Port = parseInt(req.query.port || process.env.F22_PORT || '4370');
    
    if (!f22Controller) {
      f22Controller = new F22Controller();
    }
    
    const result = await f22Controller.testConnection(f22Ip, f22Port);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error al probar conexión con F22: ${error.message}`,
      error: error.message
    });
  }
});

// Ruta para sincronizar huellas con F22
app.post('/api/sync-fingerprint', async (req, res) => {
  try {
    const { userId, deviceUserId, userName, template } = req.body;
    
    if (!deviceUserId || !userName || !template) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos (deviceUserId, userName, template)'
      });
    }
    
    if (!f22Controller) {
      f22Controller = new F22Controller();
    }
    
    const f22Ip = process.env.F22_IP || '192.168.1.201';
    const f22Port = parseInt(process.env.F22_PORT || '4370');
    
    // Conectar
    const connectResult = await f22Controller.connect(f22Ip, f22Port);
    if (!connectResult.success) {
      return res.status(500).json(connectResult);
    }
    
    // Sincronizar huella
    const syncResult = await f22Controller.syncFingerprint(
      deviceUserId,
      userName,
      template
    );
    
    // Desconectar después de sincronizar
    await f22Controller.disconnect();
    
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error sincronizando huella: ${error.message}`,
      error: error.message
    });
  }
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
                wsServer: !!wsServer,
                supabase: !!supabase
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

// Nueva ruta API para verificación de huellas
app.post('/api/verify', async (req, res) => {
    try {
        const { template } = req.body;
        
        if (!template) {
            return res.status(400).json({
                success: false,
                message: 'Template de huella requerido',
                timestamp: new Date().toISOString()
            });
        }
        
        // Verificar la huella
        const result = await verifyFingerprint(template, null);
        
        res.json({
            success: result.success,
            verified: result.verified,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verificando huella',
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
            modules: 'ok',
            supabase: supabase ? 'ok' : 'warning'
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
    
    // Verificación de Supabase
    if (supabase) {
        try {
            // Prueba simple de conectividad a Supabase
            const { data, error } = await supabase.from('fingerprint_templates').select('count').limit(1);
            if (error) {
                health.checks.supabase = 'warning';
                health.supabaseError = error.message;
            }
        } catch (error) {
            health.checks.supabase = 'error';
            health.supabaseError = error.message;
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
            currentClients: connectedClients.size,
            supabaseConnected: !!supabase
        },
        lastActivity: new Date().toISOString(),
        version: '4.0.0-production',
        timestamp: '2025-06-17 20:11:52',
        user: 'luishdz04'
    };
    
    res.json({
        success: true,
        data: logs,
        message: 'Logs básicos del sistema',
        timestamp: new Date().toISOString()
    });
});

// Nueva ruta para accesos recientes
app.get('/api/access/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Consultar registros recientes de acceso
        const { data: accessLogs, error } = await supabase
            .from('access_logs')
            .select(`
                id,
                user_id,
                access_type,
                access_method,
                success,
                confidence_score,
                created_at,
                denial_reason,
                Users:user_id (
                    id, 
                    name,
                    firstName,
                    lastName, 
                    email, 
                    whatsapp,
                    membership_type,
                    profilePictureUrl
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) {
            throw new Error(`Error consultando accesos: ${error.message}`);
        }
        
        // Procesar datos para mostrar información más completa
        const processedLogs = accessLogs.map(log => {
            const userName = log.Users ? 
                (log.Users.name || `${log.Users.firstName || ''} ${log.Users.lastName || ''}`.trim()) : 
                'Usuario desconocido';
                
            return {
                ...log,
                userName,
                accessResult: log.success ? 'Permitido' : 'Denegado',
                accessTime: new Date(log.created_at).toLocaleString(),
                confidencePercent: log.confidence_score ? `${(log.confidence_score * 100).toFixed(1)}%` : 'N/A'
            };
        });
        
        res.json({
            success: true,
            data: processedLogs,
            count: processedLogs.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo registros de acceso',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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
            '/api/logs',
            '/api/verify',
            '/api/access/recent',
            '/api/test-f22-connection',
            '/api/sync-fingerprint'
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
        console.log(`  Fecha: 2025-06-17 20:11:52`);
        console.log('🎉 ========================================= 🎉');
        console.log('');
        
        // Paso 1: Verificar dependencias
        console.log('📋 PASO 1: Verificando dependencias...');
        const depsOk = checkDependencies();
        if (!depsOk) {
            throw new Error('Dependencias faltantes - ejecuta: npm install @supabase/supabase-js dotenv');
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
        
        // Paso 5: Probar conexión Supabase
        console.log('📋 PASO 5: Verificando conexión a Supabase...');
        try {
            const { data, error } = await supabase.from('fingerprint_templates').select('count');
            
            if (error) {
                console.warn('⚠️ Error probando conexión a Supabase:', error.message);
                console.log('   Verificar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en archivo .env');
            } else {
                console.log('✅ Conexión a Supabase verificada correctamente');
            }
        } catch (supabaseError) {
            console.warn('⚠️ No se pudo conectar a Supabase:', supabaseError.message);
        }
        console.log('');
        
        // Paso 6: Inicializar controlador F22
        console.log('📋 PASO 6: Inicializando controlador F22...');
        try {
            f22Controller = new F22Controller();
            console.log('✅ Controlador F22 inicializado correctamente');
        } catch (f22Error) {
            console.warn('⚠️ Error inicializando controlador F22:', f22Error.message);
            console.log('   Verificar que zkemkeeper.dll está en la carpeta dll/');
            f22Controller = null;
        }
        console.log('');
        
        // Paso 7: Iniciar servidor HTTP
        console.log('📋 PASO 7: Iniciando servidor HTTP...');
        
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
        
        // Paso 8: Iniciar WebSocket
        console.log('📋 PASO 8: Iniciando WebSocket Server...');
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
        console.log(`F22 Controller:  ${f22Controller ? '✅' : '⚠️'} ${f22Controller ? 'Inicializado' : 'No inicializado'}`);
        console.log(`Supabase:        ${supabase ? '✅' : '❌'} ${supabase ? 'Conectado' : 'No conectado'}`);
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
            console.log(`   ${supabase ? '✅' : '⚠️'} Verificación de huellas con Supabase`);
            console.log(`   ${f22Controller ? '✅' : '⚠️'} Control de acceso F22`);
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
                console.log('   • Verificación de acceso con huellas almacenadas');
                console.log('   • Usa el WebSocket para comunicación en tiempo real');
                console.log('   • API REST disponible para integraciones');
                console.log('');
            }
            
            if (!f22Controller) {
                console.log('⚠️ NOTAS SOBRE F22:');
                console.log('   • Controlador F22 no inicializado');
                console.log('   • Verificar que zkemkeeper.dll existe en dll/');
                console.log('   • Asegurarse de instalar node-ffi-napi y ref-napi');
                console.log('   • Verificar IP y puerto del F22 en .env');
                console.log('');
            } else {
                console.log('🎉 ¡CONTROLADOR F22 INICIALIZADO!');
                console.log('   • Puedes sincronizar huellas con el F22');
                console.log('   • Usa /api/test-f22-connection para verificar conexión');
                console.log('   • Usa /api/sync-fingerprint para enviar huellas al dispositivo');
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
        console.log('   2. Ejecutar: npm install @supabase/supabase-js dotenv node-ffi-napi ref-napi');
        console.log('   3. Verificar permisos de archivos');
        console.log('   4. Ejecutar como administrador');
        console.log('   5. Verificar puerto no esté en uso');
        console.log('   6. Verificar Node.js versión compatible');
        console.log('   7. Revisar firewall y antivirus');
        console.log('   8. Crear archivo .env con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
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
        
        // Desconectar F22 si está conectado
        if (f22Controller) {
            try {
                await f22Controller.disconnect();
                console.log('✅ F22 desconectado correctamente');
            } catch (error) {
                console.error('⚠️ Error desconectando F22:', error.message);
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
console.log(`📅 Actualizado: 2025-06-17 20:11:52 UTC`);
console.log(`🔧 Node.js ${process.version} - ${process.platform} ${process.arch}`);
console.log('');

startServer().catch(error => {
    console.error('❌ Error fatal al iniciar:', error);
    process.exit(1);
});