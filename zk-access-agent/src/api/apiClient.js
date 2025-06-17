const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

class APIClient {
    constructor() {
        this.baseURL = process.env.API_URL || 'http://localhost:3000';
        this.timeout = parseInt(process.env.API_TIMEOUT) || 10000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        // Configurar cliente axios
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ZK-Access-Agent/1.0.0'
            }
        });

        this.setupInterceptors();
    }

    /**
     * Configurar interceptores de axios
     */
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                logger.info(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('❌ Request Error:', error.message);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`📥 API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                if (error.response) {
                    logger.error(`❌ API Error: ${error.response.status} ${error.response.config.url}`);
                } else if (error.request) {
                    logger.error('❌ Network Error:', error.message);
                } else {
                    logger.error('❌ Request Setup Error:', error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Realizar request con reintentos
     */
    async requestWithRetry(config, attempts = this.retryAttempts) {
        try {
            const response = await this.client(config);
            return response.data;
        } catch (error) {
            if (attempts > 1 && this.shouldRetry(error)) {
                logger.warn(`⚠️ Reintentando request (${this.retryAttempts - attempts + 1}/${this.retryAttempts})...`);
                await this.delay(this.retryDelay);
                return this.requestWithRetry(config, attempts - 1);
            }
            throw error;
        }
    }

    /**
     * Verificar si debe reintentar
     */
    shouldRetry(error) {
        return (
            !error.response || // Network error
            error.response.status >= 500 || // Server error
            error.response.status === 429 // Rate limit
        );
    }

    /**
     * Delay para reintentos
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verificar conexión con la API
     */
    async checkConnection() {
        try {
            logger.info('🔍 Verificando conexión con API...');
            
            const response = await this.client.get('/api/health', {
                timeout: 5000
            });
            
            logger.info('✅ Conexión con API exitosa');
            return {
                success: true,
                status: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('❌ Error conectando con API:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Enviar huella capturada a la API
     */
    async sendFingerprintData(fingerprintData) {
        try {
            logger.info('📤 Enviando datos de huella a API...');

            const payload = {
                template: fingerprintData.template ? fingerprintData.template.toString('base64') : null,
                image: fingerprintData.image ? fingerprintData.image.toString('base64') : null,
                quality: fingerprintData.quality,
                timestamp: fingerprintData.timestamp,
                deviceInfo: {
                    type: 'ZKTeco',
                    agent: 'zk-access-agent',
                    version: '1.0.0'
                }
            };

            const result = await this.requestWithRetry({
                method: 'POST',
                url: '/api/fingerprint/capture',
                data: payload
            });

            logger.info('✅ Datos de huella enviados exitosamente');
            return result;

        } catch (error) {
            logger.error('❌ Error enviando datos de huella:', error.message);
            throw error;
        }
    }

    /**
     * Solicitar identificación de huella
     */
    async requestFingerprintIdentification(template) {
        try {
            logger.info('🔍 Solicitando identificación de huella...');

            const payload = {
                template: template.toString('base64'),
                timestamp: new Date().toISOString()
            };

            const result = await this.requestWithRetry({
                method: 'POST',
                url: '/api/fingerprint/identify',
                data: payload
            });

            logger.info('✅ Respuesta de identificación recibida');
            return result;

        } catch (error) {
            logger.error('❌ Error en identificación:', error.message);
            throw error;
        }
    }

    /**
     * Registrar evento de acceso
     */
    async logAccessEvent(eventData) {
        try {
            logger.info('📝 Registrando evento de acceso...');

            const payload = {
                userId: eventData.userId,
                eventType: eventData.eventType, // 'entry', 'exit', 'denied'
                timestamp: eventData.timestamp,
                deviceInfo: eventData.deviceInfo,
                fingerprintData: eventData.fingerprintData ? {
                    quality: eventData.fingerprintData.quality,
                    hasTemplate: !!eventData.fingerprintData.template
                } : null
            };

            const result = await this.requestWithRetry({
                method: 'POST',
                url: '/api/access/log',
                data: payload
            });

            logger.info('✅ Evento de acceso registrado');
            return result;

        } catch (error) {
            logger.error('❌ Error registrando evento:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuarios registrados
     */
    async getRegisteredUsers() {
        try {
            logger.info('👥 Obteniendo usuarios registrados...');

            const result = await this.requestWithRetry({
                method: 'GET',
                url: '/api/users/registered'
            });

            logger.info(`✅ ${result.users?.length || 0} usuarios obtenidos`);
            return result;

        } catch (error) {
            logger.error('❌ Error obteniendo usuarios:', error.message);
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario con huella
     */
    async registerUserFingerprint(userData, fingerprintData) {
        try {
            logger.info(`👤 Registrando huella para usuario: ${userData.name}`);

            const payload = {
                user: userData,
                fingerprint: {
                    template: fingerprintData.template.toString('base64'),
                    quality: fingerprintData.quality,
                    timestamp: fingerprintData.timestamp
                },
                deviceInfo: {
                    type: 'ZKTeco',
                    agent: 'zk-access-agent'
                }
            };

            const result = await this.requestWithRetry({
                method: 'POST',
                url: '/api/users/register-fingerprint',
                data: payload
            });

            logger.info('✅ Usuario y huella registrados exitosamente');
            return result;

        } catch (error) {
            logger.error('❌ Error registrando usuario:', error.message);
            throw error;
        }
    }

    /**
     * Enviar estado del dispositivo
     */
    async sendDeviceStatus(statusData) {
        try {
            const payload = {
                status: statusData,
                timestamp: new Date().toISOString(),
                agent: 'zk-access-agent'
            };

            const result = await this.requestWithRetry({
                method: 'POST',
                url: '/api/device/status',
                data: payload
            });

            return result;

        } catch (error) {
            logger.error('❌ Error enviando estado del dispositivo:', error.message);
            throw error;
        }
    }

    /**
     * Obtener configuración desde la API
     */
    async getConfiguration() {
        try {
            logger.info('⚙️ Obteniendo configuración desde API...');

            const result = await this.requestWithRetry({
                method: 'GET',
                url: '/api/configuration/access-agent'
            });

            logger.info('✅ Configuración obtenida');
            return result;

        } catch (error) {
            logger.error('❌ Error obteniendo configuración:', error.message);
            throw error;
        }
    }

    /**
     * Test de conectividad
     */
    async testConnection() {
        const startTime = Date.now();
        const result = await this.checkConnection();
        const responseTime = Date.now() - startTime;
        
        return {
            ...result,
            responseTime
        };
    }
}

module.exports = APIClient; 
