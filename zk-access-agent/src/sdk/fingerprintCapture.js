const koffi = require('koffi');
const logger = require('../utils/logger');

class FingerprintCapture {
    constructor(zkSDK) {
        this.zkSDK = zkSDK;
        this.isCapturing = false;
        this.captureTimeout = null;
        this.capturePromise = null;
        this.captureResolver = null;
        this.captureRejector = null;
    }

    /**
     * Iniciar captura de huella dactilar
     */
    async startCapture() {
        try {
            if (!this.zkSDK.isDeviceConnected()) {
                throw new Error('Dispositivo ZK no conectado');
            }

            if (this.isCapturing) {
                throw new Error('Ya hay una captura en progreso');
            }

            logger.info('👆 Iniciando captura de huella...');
            this.isCapturing = true;

            // Iniciar captura en el dispositivo
            const startResult = this.zkSDK.lib.StartCapture(this.zkSDK.device);
            if (startResult !== 1) {
                throw new Error(`Error al iniciar captura: ${startResult}`);
            }

            // Crear promesa para manejar la captura asíncrona
            this.capturePromise = new Promise((resolve, reject) => {
                this.captureResolver = resolve;
                this.captureRejector = reject;

                // Configurar timeout
                this.captureTimeout = setTimeout(() => {
                    this.stopCapture();
                    reject(new Error('Timeout: No se detectó huella en el tiempo esperado'));
                }, this.zkSDK.captureTimeout);

                // Iniciar polling para verificar captura
                this.pollForFingerprint();
            });

            return this.capturePromise;

        } catch (error) {
            this.isCapturing = false;
            logger.error('❌ Error iniciando captura:', error.message);
            throw error;
        }
    }

    /**
     * Polling para verificar si se capturó una huella
     */
    async pollForFingerprint() {
        if (!this.isCapturing) return;

        try {
            // Buffers para imagen y template
            const imageBuffer = Buffer.alloc(this.zkSDK.imageSize);
            const templateBuffer = Buffer.alloc(this.zkSDK.templateSize);
            const sizeBuffer = Buffer.alloc(4); // unsigned int

            // Intentar capturar huella
            const result = this.zkSDK.lib.AcquireFingerprint(
                this.zkSDK.device,
                imageBuffer,
                templateBuffer,
                sizeBuffer
            );

            if (result === 1) {
                // ¡Huella capturada exitosamente!
                const templateSize = sizeBuffer.readUInt32LE(0);
                const fingerprintData = {
                    success: true,
                    template: templateBuffer.subarray(0, templateSize),
                    image: imageBuffer,
                    timestamp: new Date().toISOString(),
                    quality: this.calculateQuality(templateBuffer, templateSize)
                };

                logger.info('✅ Huella capturada exitosamente');
                this.stopCapture();
                
                if (this.captureResolver) {
                    this.captureResolver(fingerprintData);
                }
                return;
            }

            // Si no hay huella, continuar polling
            if (this.isCapturing) {
                setTimeout(() => this.pollForFingerprint(), 100);
            }

        } catch (error) {
            logger.error('❌ Error en polling de huella:', error.message);
            this.stopCapture();
            
            if (this.captureRejector) {
                this.captureRejector(error);
            }
        }
    }

    /**
     * Detener captura de huella
     */
    stopCapture() {
        try {
            if (this.isCapturing && this.zkSDK.isDeviceConnected()) {
                const result = this.zkSDK.lib.StopCapture(this.zkSDK.device);
                if (result === 1) {
                    logger.info('🛑 Captura detenida correctamente');
                } else {
                    logger.warn(`⚠️ Warning al detener captura: ${result}`);
                }
            }

            // Limpiar timeout
            if (this.captureTimeout) {
                clearTimeout(this.captureTimeout);
                this.captureTimeout = null;
            }

            // Reset estado
            this.isCapturing = false;
            this.capturePromise = null;
            this.captureResolver = null;
            this.captureRejector = null;

        } catch (error) {
            logger.error('❌ Error deteniendo captura:', error.message);
        }
    }

    /**
     * Calcular calidad de la huella (básico)
     */
    calculateQuality(template, size) {
        if (!template || size === 0) return 0;
        
        // Algoritmo básico: más datos = mejor calidad
        const dataRatio = size / this.zkSDK.templateSize;
        const quality = Math.min(Math.round(dataRatio * 100), 100);
        
        return quality;
    }

    /**
     * Comparar dos templates de huellas
     */
    async compareFingerprints(template1, template2) {
        try {
            if (!this.zkSDK.isDeviceConnected()) {
                throw new Error('Dispositivo ZK no conectado');
            }

            logger.info('🔍 Comparando huellas dactilares...');

            const result = this.zkSDK.lib.DBMatch(
                this.zkSDK.device,
                template1,
                template2
            );

            const match = result === 1;
            const confidence = match ? 95 : 0; // Simplificado

            logger.info(`🎯 Resultado comparación: ${match ? 'MATCH' : 'NO MATCH'} (${confidence}%)`);

            return {
                match,
                confidence,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('❌ Error comparando huellas:', error.message);
            throw error;
        }
    }

    /**
     * Identificar huella en base de datos
     */
    async identifyFingerprint(template) {
        try {
            if (!this.zkSDK.isDeviceConnected()) {
                throw new Error('Dispositivo ZK no conectado');
            }

            logger.info('🔍 Identificando huella en base de datos...');

            const result = this.zkSDK.lib.DBIdentify(
                this.zkSDK.device,
                template
            );

            if (result > 0) {
                logger.info(`✅ Huella identificada: Usuario ID ${result}`);
                return {
                    identified: true,
                    userId: result,
                    timestamp: new Date().toISOString()
                };
            } else {
                logger.info('❌ Huella no identificada');
                return {
                    identified: false,
                    userId: null,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            logger.error('❌ Error identificando huella:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estado de captura
     */
    getCaptureStatus() {
        return {
            isCapturing: this.isCapturing,
            hasTimeout: this.captureTimeout !== null,
            deviceConnected: this.zkSDK.isDeviceConnected()
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stopCapture();
    }
}

module.exports = FingerprintCapture; 
