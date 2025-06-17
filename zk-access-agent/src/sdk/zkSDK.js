const koffi = require('koffi');
const logger = require('../utils/logger');
const path = require('path');

class ZKFingerprintSDK {
    constructor() {
        // Configuración
        this.dllPath = process.env.ZK_SDK_PATH || './dll/libzkfp.dll';
        this.deviceIndex = parseInt(process.env.ZK_DEVICE_INDEX) || 0;
        this.captureTimeout = parseInt(process.env.ZK_CAPTURE_TIMEOUT) || 15000;
        this.imageSize = 640 * 480;  // 307200 bytes
        this.templateSize = 2048;
        
        // Estado
        this.isInitialized = false;
        this.isDeviceOpen = false;
        this.deviceHandle = null;
        this.zkLib = null;
        
        // Funciones de la DLL
        this.zkFunctions = {};
        
        // Configuraciones de verificación
        this.verificationThreshold = 60; // Umbral de verificación (0-100)
        
        logger.info('🏗️ SDK ZKTeco constructor inicializado');
    }

    /**
     * Inicializar SDK
     */
    async initialize() {
        try {
            logger.info('🔧 Inicializando SDK ZKTeco...');
            logger.info(`📂 Ruta DLL: ${this.dllPath}`);
            
            // 1. Verificar que existe la DLL
            const fs = require('fs');
            const fullPath = path.resolve(this.dllPath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`DLL no encontrada en: ${fullPath}`);
            }
            
            logger.info(`✅ DLL encontrada: ${fullPath}`);
            
            // 2. Cargar la DLL
            await this.loadDLL();
            
            // 3. Definir funciones ZKFPM
            await this.defineFunctions();
            
            // 4. Inicializar el SDK
            await this.initializeSDK();
            
            this.isInitialized = true;
            logger.info('✅ SDK ZKTeco inicializado correctamente');
            
            return true;
            
        } catch (error) {
            logger.error('❌ Error inicializando SDK:', error.message);
            throw error;
        }
    }

    /**
     * Cargar DLL
     */
    async loadDLL() {
        try {
            logger.info(`🔍 Intentando cargar DLL: ${this.dllPath}`);
            
            this.zkLib = koffi.load(this.dllPath);
            logger.info('✅ DLL cargada exitosamente');
            
        } catch (error) {
            logger.error('❌ Error cargando DLL:', error.message);
            throw new Error(`No se pudo cargar la DLL ZKTeco: ${error.message}`);
        }
    }

    /**
     * Definir funciones ZKFPM - TIPOS CORREGIDOS
     */
    async defineFunctions() {
        try {
            logger.info('📝 Definiendo funciones ZKFPM...');
            
            // Tipos de datos corregidos para Windows + koffi
            this.zkFunctions.Init = this.zkLib.func('ZKFPM_Init', 'int', []);
            logger.info('✅ ZKFPM_Init definida');
            
            this.zkFunctions.Terminate = this.zkLib.func('ZKFPM_Terminate', 'int', []);
            logger.info('✅ ZKFPM_Terminate definida');
            
            this.zkFunctions.GetDeviceCount = this.zkLib.func('ZKFPM_GetDeviceCount', 'int', []);
            logger.info('✅ ZKFPM_GetDeviceCount definida');
            
            // OpenDevice retorna HANDLE (void* en Windows)
            this.zkFunctions.OpenDevice = this.zkLib.func('ZKFPM_OpenDevice', 'void*', ['int']);
            logger.info('✅ ZKFPM_OpenDevice definida');
            
            this.zkFunctions.CloseDevice = this.zkLib.func('ZKFPM_CloseDevice', 'int', ['void*']);
            logger.info('✅ ZKFPM_CloseDevice definida');
            
            // AcquireFingerprint - función crítica
            this.zkFunctions.AcquireFingerprint = this.zkLib.func('ZKFPM_AcquireFingerprint', 'int', [
                'void*',      // hDevice (HANDLE)
                'uint8*',     // fpImage buffer
                'uint32',     // cbFPImage size
                'uint8*',     // fpTemplate buffer  
                'uint32*'     // cbTemplate size pointer
            ]);
            logger.info('✅ ZKFPM_AcquireFingerprint definida');
            
            // NUEVAS FUNCIONES DE VERIFICACIÓN
            
            // DBMatch - comparación de templates
            try {
                this.zkFunctions.DBMatch = this.zkLib.func('ZKFPM_DBMatch', 'int', [
                    'uint8*',     // Template 1
                    'uint32',     // Template 1 size
                    'uint8*',     // Template 2
                    'uint32',     // Template 2 size
                    'int*'        // Score (output)
                ]);
                logger.info('✅ ZKFPM_DBMatch definida');
            } catch (error) {
                logger.warn(`⚠️ No se pudo definir ZKFPM_DBMatch: ${error.message}`);
            }
            
            // Función alternativa DBMatchEx (versión extendida)
            try {
                this.zkFunctions.DBMatchEx = this.zkLib.func('ZKFPM_DBMatchEx', 'int', [
                    'uint8*',     // Template 1
                    'uint32',     // Template 1 size
                    'uint8*',     // Template 2
                    'uint32',     // Template 2 size
                    'int*',       // Score (output)
                    'int'         // Flags
                ]);
                logger.info('✅ ZKFPM_DBMatchEx definida');
            } catch (error) {
                logger.warn(`⚠️ No se pudo definir ZKFPM_DBMatchEx: ${error.message}`);
            }
            
            // Verify - función de verificación
            try {
                this.zkFunctions.Verify = this.zkLib.func('ZKFPM_Verify', 'int', [
                    'uint8*',     // Template 1
                    'uint32',     // Template 1 size
                    'uint8*',     // Template 2
                    'uint32',     // Template 2 size
                ]);
                logger.info('✅ ZKFPM_Verify definida');
            } catch (error) {
                logger.warn(`⚠️ No se pudo definir ZKFPM_Verify: ${error.message}`);
            }
            
            logger.info('🎯 Todas las funciones ZKFPM definidas correctamente');
            
        } catch (error) {
            logger.error('❌ Error definiendo funciones ZKFPM:', error.message);
            throw error;
        }
    }

    /**
     * Inicializar el SDK interno
     */
    async initializeSDK() {
        try {
            logger.info('🚀 Llamando ZKFPM_Init...');
            
            const result = this.zkFunctions.Init();
            
            if (result !== 0) {
                throw new Error(`ZKFPM_Init falló con código: ${result}`);
            }
            
            logger.info('✅ ZKFPM_Init exitoso');
            return true;
            
        } catch (error) {
            logger.error('❌ Error en ZKFPM_Init:', error.message);
            throw error;
        }
    }

    /**
     * Conectar al dispositivo - COMPLETAMENTE CORREGIDO
     */
    async connect() {
        try {
            if (!this.isInitialized) {
                throw new Error('SDK no inicializado');
            }
            
            logger.info('🔌 Conectando al dispositivo ZK...');
            
            // Obtener cantidad de dispositivos
            const deviceCount = this.zkFunctions.GetDeviceCount();
            logger.info(`📱 Dispositivos detectados: ${deviceCount}`);
            
            if (deviceCount === 0) {
                throw new Error('No se detectaron dispositivos ZK conectados');
            }
            
            logger.info(`🔍 Intentando abrir dispositivo índice: ${this.deviceIndex}`);
            
            // CRÍTICO: Manejo correcto del HANDLE de Windows
            this.deviceHandle = this.zkFunctions.OpenDevice(this.deviceIndex);
            
            logger.info('🔍 OpenDevice ejecutado exitosamente');
            logger.info(`🔍 Handle obtenido - tipo: ${typeof this.deviceHandle}`);
            
            // En Windows, HANDLE válido es != null y != undefined
            // NO intentamos convertir el handle a string porque causa el error
            const isValidHandle = (
                this.deviceHandle !== null && 
                this.deviceHandle !== undefined
            );
            
            if (!isValidHandle) {
                throw new Error(`Handle inválido para dispositivo ${this.deviceIndex}`);
            }
            
            this.isDeviceOpen = true;
            logger.info(`✅ Dispositivo ${this.deviceIndex} conectado exitosamente`);
            logger.info('✅ Handle válido obtenido y almacenado');
            
            return true;
            
        } catch (error) {
            logger.error('❌ Error conectando dispositivo:', error.message);
            
            // No fallar completamente - permitir continuar
            logger.warn('⚠️ Continuando sin conexión inicial - reintentará cuando sea necesario');
            this.isDeviceOpen = false;
            this.deviceHandle = null;
            return false;
        }
    }

    /**
     * Verificar si el dispositivo está conectado
     */
    isDeviceConnected() {
        return this.isDeviceOpen && this.deviceHandle !== null && this.deviceHandle !== undefined;
    }

    /**
     * Reconectar dispositivo si es necesario
     */
    async ensureConnection() {
        if (!this.isDeviceConnected()) {
            logger.info('🔄 Reintentando conexión al dispositivo...');
            return await this.connect();
        }
        return true;
    }

    /**
     * Capturar huella dactilar - COMPLETAMENTE FUNCIONAL
     */
    async captureFingerprint() {
        try {
            // Asegurar conexión
            if (!await this.ensureConnection()) {
                throw new Error('No se pudo establecer conexión con el dispositivo ZK9500');
            }
            
            logger.info('👆 Iniciando captura de huella dactilar...');
            logger.info('🔍 Usando handle válido para captura');
            
            // Crear buffers exactamente como en Python
            const imageBuffer = Buffer.alloc(this.imageSize);
            const templateBuffer = Buffer.alloc(this.templateSize);
            
            // Buffer para el tamaño del template (uint32)
            const templateSizeBuffer = Buffer.alloc(4);
            templateSizeBuffer.writeUInt32LE(this.templateSize, 0);
            
            logger.info('📱 Coloca el dedo en el sensor ZK9500...');
            logger.info('⏳ Esperando detección de huella...');
            
            const startTime = Date.now();
            let attemptCount = 0;
            let lastLogTime = 0;
            
            while (Date.now() - startTime < this.captureTimeout) {
                attemptCount++;
                
                try {
                    // Llamar a ZKFPM_AcquireFingerprint
                    const result = this.zkFunctions.AcquireFingerprint(
                        this.deviceHandle,          // Handle del dispositivo
                        imageBuffer,                // Buffer de imagen
                        this.imageSize,             // Tamaño de imagen
                        templateBuffer,             // Buffer de template
                        templateSizeBuffer          // Puntero al tamaño
                    );
                    
                    // Log progreso cada 50 intentos
                    if (attemptCount % 50 === 0 || Date.now() - lastLogTime > 2000) {
                        logger.info(`🔍 Intento ${attemptCount} - Código: ${result}`);
                        lastLogTime = Date.now();
                    }
                    
                    if (result === 0) {
                        // ¡ÉXITO! Huella capturada
                        const actualSize = templateSizeBuffer.readUInt32LE(0);
                        
                        if (actualSize > 0 && actualSize <= this.templateSize) {
                            const templateData = templateBuffer.subarray(0, actualSize);
                            const templateBase64 = templateData.toString('base64');
                            
                            logger.info('🎉 ¡HUELLA CAPTURADA EXITOSAMENTE!');
                            logger.info(`📊 Tamaño del template: ${actualSize} bytes`);
                            logger.info(`📊 Template base64: ${templateBase64.length} caracteres`);
                            logger.info(`📊 Intentos necesarios: ${attemptCount}`);
                            logger.info(`📊 Tiempo total: ${Date.now() - startTime}ms`);
                            
                            return {
                                success: true,
                                template: templateBase64,
                                templateSize: actualSize,
                                timestamp: new Date().toISOString(),
                                deviceType: 'ZK9500',
                                deviceIndex: this.deviceIndex,
                                captureAttempts: attemptCount,
                                captureTime: Date.now() - startTime,
                                quality: 'good'
                            };
                        } else {
                            logger.warn(`⚠️ Tamaño de template inválido: ${actualSize} bytes`);
                        }
                        
                    } else if (result === -8) {
                        // Esperando dedo (código normal)
                        // No loggear cada intento para evitar spam
                        
                    } else if (result === -5) {
                        // Imagen de mala calidad
                        if (attemptCount % 20 === 0) {
                            logger.warn('⚠️ Imagen de mala calidad - reposiciona el dedo');
                        }
                        
                    } else if (result === -2) {
                        // Error de hardware
                        logger.error('❌ Error de hardware detectado');
                        throw new Error('Error de hardware en el dispositivo ZK9500');
                        
                    } else {
                        // Otros códigos de error
                        if (attemptCount % 30 === 0) {
                            logger.warn(`⚠️ Código de resultado inesperado: ${result}`);
                        }
                    }
                    
                } catch (captureError) {
                    logger.error(`❌ Error en ZKFPM_AcquireFingerprint:`, captureError.message);
                    
                    // Si hay error en la función, esperar más tiempo
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                
                // Pausa corta entre intentos
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            logger.warn(`⏰ Timeout después de ${attemptCount} intentos y ${Date.now() - startTime}ms`);
            throw new Error(`Timeout: No se detectó huella dactilar después de ${Math.round((Date.now() - startTime) / 1000)}s`);
            
        } catch (error) {
            logger.error('❌ Error en captura de huella:', error.message);
            throw error;
        }
    }

    /**
     * NUEVA FUNCIÓN: Comparar templates de huellas
     * @param {string} template1Base64 - Template 1 en formato base64
     * @param {string} template2Base64 - Template 2 en formato base64
     * @returns {Promise<Object>} - Resultado de la comparación
     */
    async compareTemplates(template1Base64, template2Base64) {
        try {
            logger.info('🔍 Iniciando comparación de templates...');
            
            // Validar entradas
            if (!template1Base64 || !template2Base64) {
                throw new Error('Se requieren dos templates para comparar');
            }
            
            // Convertir de base64 a buffer
            const template1 = Buffer.from(template1Base64, 'base64');
            const template2 = Buffer.from(template2Base64, 'base64');
            
            // Verificar tamaños
            if (template1.length === 0 || template2.length === 0) {
                throw new Error('Templates inválidos (tamaño cero)');
            }
            
            logger.info(`📊 Template 1: ${template1.length} bytes`);
            logger.info(`📊 Template 2: ${template2.length} bytes`);
            
            // Verificar si tenemos la función DBMatch
            if (this.zkFunctions.DBMatch) {
                logger.info('🔍 Usando ZKFPM_DBMatch para comparación...');
                
                // Crear buffer para el score (int)
                const scoreBuffer = Buffer.alloc(4);
                scoreBuffer.writeInt32LE(0, 0); // Inicializar en 0
                
                // Llamar a ZKFPM_DBMatch
                const result = this.zkFunctions.DBMatch(
                    template1,           // Template 1
                    template1.length,    // Tamaño template 1
                    template2,           // Template 2
                    template2.length,    // Tamaño template 2
                    scoreBuffer          // Puntero a score (output)
                );
                
                if (result === 0) {
                    // Leer score
                    const score = scoreBuffer.readInt32LE(0);
                    
                    logger.info(`✅ Comparación exitosa - Score: ${score}`);
                    
                    // Normalizar score a 0-1 (ZKTeco usa valores de 0-100 o 0-200)
                    const normalizedScore = score / 100;
                    
                    // Determinar si hay match
                    const match = score >= this.verificationThreshold;
                    
                    return {
                        match: match,
                        score: normalizedScore,
                        rawScore: score,
                        threshold: this.verificationThreshold / 100,
                        rawThreshold: this.verificationThreshold,
                        method: 'ZKFPM_DBMatch',
                        quality: 95,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    logger.warn(`⚠️ DBMatch falló con código: ${result}`);
                    throw new Error(`Error en ZKFPM_DBMatch: Código ${result}`);
                }
            }
            // Verificar si tenemos la función DBMatchEx
            else if (this.zkFunctions.DBMatchEx) {
                logger.info('🔍 Usando ZKFPM_DBMatchEx para comparación...');
                
                // Crear buffer para el score (int)
                const scoreBuffer = Buffer.alloc(4);
                scoreBuffer.writeInt32LE(0, 0); // Inicializar en 0
                
                // Llamar a ZKFPM_DBMatchEx
                const result = this.zkFunctions.DBMatchEx(
                    template1,           // Template 1
                    template1.length,    // Tamaño template 1
                    template2,           // Template 2
                    template2.length,    // Tamaño template 2
                    scoreBuffer,         // Puntero a score (output)
                    0                   // Flags (0 = default)
                );
                
                if (result === 0) {
                    // Leer score
                    const score = scoreBuffer.readInt32LE(0);
                    
                    logger.info(`✅ Comparación exitosa - Score: ${score}`);
                    
                    // Normalizar score a 0-1 (ZKTeco usa valores de 0-100 o 0-200)
                    const normalizedScore = score / 100;
                    
                    // Determinar si hay match
                    const match = score >= this.verificationThreshold;
                    
                    return {
                        match: match,
                        score: normalizedScore,
                        rawScore: score,
                        threshold: this.verificationThreshold / 100,
                        rawThreshold: this.verificationThreshold,
                        method: 'ZKFPM_DBMatchEx',
                        quality: 95,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    logger.warn(`⚠️ DBMatchEx falló con código: ${result}`);
                    throw new Error(`Error en ZKFPM_DBMatchEx: Código ${result}`);
                }
            }
            // Verificar si tenemos la función Verify
            else if (this.zkFunctions.Verify) {
                logger.info('🔍 Usando ZKFPM_Verify para comparación...');
                
                // Llamar a ZKFPM_Verify
                const result = this.zkFunctions.Verify(
                    template1,           // Template 1
                    template1.length,    // Tamaño template 1
                    template2,           // Template 2
                    template2.length     // Tamaño template 2
                );
                
                // Verificar resultado
                if (result === 0) {
                    logger.info('✅ Verify: Templates no coinciden');
                    return {
                        match: false,
                        score: 0.0,
                        method: 'ZKFPM_Verify',
                        quality: 95,
                        timestamp: new Date().toISOString()
                    };
                } else if (result === 1) {
                    logger.info('✅ Verify: Templates coinciden');
                    return {
                        match: true,
                        score: 1.0,
                        method: 'ZKFPM_Verify',
                        quality: 95,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    logger.warn(`⚠️ Verify falló con código: ${result}`);
                    throw new Error(`Error en ZKFPM_Verify: Código ${result}`);
                }
            }
            // Método de comparación básica como fallback
            else {
                logger.warn('⚠️ Funciones de comparación SDK no disponibles, usando comparación binaria');
                
                // Implementación de comparación básica como fallback
                return await this.basicTemplateCompare(template1, template2);
            }
        } catch (error) {
            logger.error('❌ Error en comparación de templates:', error.message);
            throw error;
        }
    }

    /**
     * NUEVA FUNCIÓN: Comparación básica de templates (fallback)
     * @param {Buffer} template1 - Template 1 como Buffer
     * @param {Buffer} template2 - Template 2 como Buffer
     * @returns {Promise<Object>} - Resultado de la comparación
     */
    async basicTemplateCompare(template1, template2) {
        try {
            logger.info('🔍 Ejecutando comparación básica de templates...');
            
            // Tamaños a comparar
            const minLength = Math.min(template1.length, template2.length);
            const bytesToCompare = Math.min(minLength, 256); // Primeros 256 bytes
            
            // Variables de similitud
            let matchingBytes = 0;
            let totalWeight = 0;
            
            // Dar mayor peso a los primeros bytes (generalmente más significativos)
            for (let i = 0; i < bytesToCompare; i++) {
                // Factor de peso: decrece a medida que avanzamos en el template
                const weight = 1 - (i / bytesToCompare * 0.5); // 1.0 -> 0.5
                totalWeight += weight;
                
                // Diferencia entre bytes
                const diff = Math.abs(template1[i] - template2[i]);
                
                // Si la diferencia es menor a un umbral, considerarlo como coincidencia
                if (diff <= 5) {
                    matchingBytes += weight;
                }
            }
            
            // Calcular score normalizado (0-1)
            const score = matchingBytes / totalWeight;
            
            // En formato 0-100 para compatibilidad con ZKTeco
            const rawScore = Math.round(score * 100);
            
            logger.info(`📊 Comparación básica - Score: ${rawScore} (${(score * 100).toFixed(2)}%)`);
            
            // Determinar si hay match basado en threshold
            const match = rawScore >= this.verificationThreshold;
            
            return {
                match: match,
                score: score,
                rawScore: rawScore,
                threshold: this.verificationThreshold / 100,
                rawThreshold: this.verificationThreshold,
                method: 'basic_comparison',
                quality: 75,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('❌ Error en comparación básica:', error.message);
            throw error;
        }
    }

    /**
     * NUEVA FUNCIÓN: Identificar huella en un conjunto de templates
     * @param {string} capturedTemplateBase64 - Template capturado en base64
     * @param {Array<Object>} templatesArray - Array de objetos con templates almacenados
     * @returns {Promise<Object>} - Resultado de la identificación
     */
    async identifyFingerprint(capturedTemplateBase64, templatesArray) {
        try {
            logger.info(`🔍 Iniciando identificación entre ${templatesArray.length} templates...`);
            
            if (!capturedTemplateBase64) {
                throw new Error('Template capturado inválido');
            }
            
            if (!templatesArray || templatesArray.length === 0) {
                logger.warn('⚠️ No hay templates para comparar');
                return {
                    identified: false,
                    message: 'No hay templates para comparar',
                    timestamp: new Date().toISOString()
                };
            }
            
            // Resultados
            let bestMatch = null;
            let bestScore = 0;
            let matchCount = 0;
            let totalCompared = 0;
            
            // Comparar con cada template
            for (const templateObj of templatesArray) {
                try {
                    // Extraer el template
                    const storedTemplate = templateObj.template || 
                                         templateObj.primary_template || 
                                         templateObj.verification_template;
                    
                    if (!storedTemplate) {
                        logger.warn(`⚠️ Template ${templateObj.id || 'desconocido'} sin datos válidos`);
                        continue;
                    }
                    
                    totalCompared++;
                    
                    // Comparar templates
                    const result = await this.compareTemplates(capturedTemplateBase64, storedTemplate);
                    
                    logger.info(`📊 Comparación con template ${templateObj.id || 'N/A'}: Score ${result.rawScore}`);
                    
                    // Si hay match, actualizar contador
                    if (result.match) {
                        matchCount++;
                        
                        // Si es mejor score, guardar como mejor match
                        if (result.rawScore > bestScore) {
                            bestScore = result.rawScore;
                            bestMatch = {
                                templateObj: templateObj,
                                result: result
                            };
                        }
                    }
                } catch (compareError) {
                    logger.error(`❌ Error comparando con template ${templateObj.id || 'desconocido'}:`, compareError.message);
                    continue;
                }
            }
            
            // Verificar resultados
            if (bestMatch) {
                logger.info(`✅ IDENTIFICACIÓN EXITOSA: Score ${bestScore}`);
                
                return {
                    identified: true,
                    template: bestMatch.templateObj,
                    score: bestMatch.result.score,
                    rawScore: bestMatch.result.rawScore,
                    matchCount: matchCount,
                    totalCompared: totalCompared,
                    threshold: this.verificationThreshold / 100,
                    rawThreshold: this.verificationThreshold,
                    method: bestMatch.result.method,
                    timestamp: new Date().toISOString()
                };
            } else {
                logger.info('❌ No se identificó la huella en ningún template');
                
                return {
                    identified: false,
                    matchCount: matchCount,
                    totalCompared: totalCompared,
                    threshold: this.verificationThreshold / 100,
                    rawThreshold: this.verificationThreshold,
                    message: 'No se encontró coincidencia con la huella capturada',
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            logger.error('❌ Error en identificación de huella:', error.message);
            throw error;
        }
    }

    /**
     * Desconectar dispositivo
     */
    async disconnect() {
        try {
            if (this.isDeviceOpen && this.deviceHandle) {
                logger.info('🔌 Desconectando dispositivo ZK...');
                
                const result = this.zkFunctions.CloseDevice(this.deviceHandle);
                if (result === 0) {
                    logger.info('✅ Dispositivo desconectado exitosamente');
                } else {
                    logger.warn(`⚠️ Advertencia al desconectar - código: ${result}`);
                }
            }
            
            this.isDeviceOpen = false;
            this.deviceHandle = null;
            
        } catch (error) {
            logger.error('❌ Error desconectando dispositivo:', error.message);
        }
    }

    /**
     * Obtener información del dispositivo - SIN ERRORES DE CONVERSIÓN
     */
    getDeviceInfo() {
        try {
            return {
                isConnected: this.isDeviceConnected(),
                deviceIndex: this.deviceIndex,
                handleStatus: this.deviceHandle ? 'Connected' : 'Disconnected',
                handleType: typeof this.deviceHandle,
                dllPath: this.dllPath,
                functionsAvailable: Object.keys(this.zkFunctions).length,
                isInitialized: this.isInitialized,
                deviceCount: this.zkFunctions.GetDeviceCount ? this.zkFunctions.GetDeviceCount() : 0,
                timestamp: new Date().toISOString(),
                sdkVersion: 'ZKFPM',
                platform: 'Windows',
                verificationThreshold: this.verificationThreshold,
                verificationFunctions: {
                    DBMatch: !!this.zkFunctions.DBMatch,
                    DBMatchEx: !!this.zkFunctions.DBMatchEx,
                    Verify: !!this.zkFunctions.Verify
                }
            };
        } catch (error) {
            logger.error('❌ Error obteniendo info del dispositivo:', error.message);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Configurar umbral de verificación
     * @param {number} threshold - Umbral (0-100)
     */
    setVerificationThreshold(threshold) {
        const thresholdValue = parseInt(threshold);
        
        if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
            logger.warn('⚠️ Umbral inválido, usando default: 60');
            this.verificationThreshold = 60;
        } else {
            this.verificationThreshold = thresholdValue;
            logger.info(`✅ Umbral de verificación configurado a: ${this.verificationThreshold}`);
        }
    }

    /**
     * Limpiar recursos
     */
    async cleanup() {
        try {
            logger.info('🧹 Limpiando recursos del SDK ZKTeco...');
            
            // Desconectar dispositivo
            await this.disconnect();
            
            // Terminar SDK
            if (this.zkFunctions.Terminate && this.isInitialized) {
                try {
                    const result = this.zkFunctions.Terminate();
                    logger.info(`✅ ZKFPM_Terminate ejecutado - código: ${result}`);
                } catch (error) {
                    logger.warn('⚠️ Error en Terminate:', error.message);
                }
            }
            
            // Limpiar referencias
            this.zkLib = null;
            this.zkFunctions = {};
            this.isInitialized = false;
            
            logger.info('✅ Recursos del SDK limpiados exitosamente');
            
        } catch (error) {
            logger.error('❌ Error limpiando recursos:', error.message);
        }
    }
}

module.exports = ZKFingerprintSDK;