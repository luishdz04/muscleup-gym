const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.wss = null;
        this.clients = new Map();
        this.isRunning = false;
    }

    /**
     * Iniciar servidor WebSocket
     */
    start() {
        try {
            logger.info(`🌐 Iniciando servidor WebSocket en puerto ${this.port}...`);

            this.wss = new WebSocket.Server({ 
                port: this.port,
                perMessageDeflate: false
            });

            this.setupEventHandlers();
            this.isRunning = true;

            logger.info(`✅ Servidor WebSocket iniciado en ws://localhost:${this.port}`);
            return true;

        } catch (error) {
            logger.error('❌ Error iniciando servidor WebSocket:', error.message);
            throw error;
        }
    }

    /**
     * Configurar manejadores de eventos
     */
    setupEventHandlers() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                ws: ws,
                ip: req.socket.remoteAddress,
                connectedAt: new Date().toISOString(),
                isAlive: true
            };

            this.clients.set(clientId, clientInfo);
            logger.info(`🔌 Cliente conectado: ${clientId} desde ${clientInfo.ip}`);

            // Enviar mensaje de bienvenida
            this.sendToClient(clientId, {
                type: 'connection',
                status: 'connected',
                clientId: clientId,
                timestamp: new Date().toISOString(),
                message: 'Conectado al Access Agent ZK'
            });

            // Manejador de mensajes
            ws.on('message', (data) => {
                this.handleMessage(clientId, data);
            });

            // Manejador de pong (heartbeat)
            ws.on('pong', () => {
                clientInfo.isAlive = true;
            });

            // Manejador de cierre
            ws.on('close', (code, reason) => {
                logger.info(`🔌 Cliente desconectado: ${clientId} (${code}: ${reason})`);
                this.clients.delete(clientId);
            });

            // Manejador de errores
            ws.on('error', (error) => {
                logger.error(`❌ Error en cliente ${clientId}:`, error.message);
                this.clients.delete(clientId);
            });
        });

        // Configurar heartbeat
        this.setupHeartbeat();

        logger.info('📋 Manejadores de eventos configurados');
    }

    /**
     * Manejar mensajes de clientes
     */
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            logger.info(`📨 Mensaje recibido de ${clientId}:`, message.type);

            switch (message.type) {
                case 'ping':
                    this.sendToClient(clientId, {
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'status':
                    this.sendToClient(clientId, {
                        type: 'status_response',
                        data: this.getServerStatus(),
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'subscribe':
                    // Suscribirse a eventos específicos
                    const client = this.clients.get(clientId);
                    if (client) {
                        client.subscriptions = message.events || [];
                        this.sendToClient(clientId, {
                            type: 'subscribed',
                            events: client.subscriptions,
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;

                default:
                    logger.warn(`⚠️ Tipo de mensaje desconocido: ${message.type}`);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: `Tipo de mensaje desconocido: ${message.type}`,
                        timestamp: new Date().toISOString()
                    });
            }

        } catch (error) {
            logger.error(`❌ Error procesando mensaje de ${clientId}:`, error.message);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Error procesando mensaje',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Enviar mensaje a cliente específico
     */
    sendToClient(clientId, message) {
        try {
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`❌ Error enviando mensaje a ${clientId}:`, error.message);
            return false;
        }
    }

    /**
     * Broadcast a todos los clientes
     */
    broadcast(message, eventType = null) {
        let sentCount = 0;
        
        this.clients.forEach((client, clientId) => {
            // Filtrar por suscripciones si se especifica tipo de evento
            if (eventType && client.subscriptions && !client.subscriptions.includes(eventType)) {
                return;
            }

            if (this.sendToClient(clientId, message)) {
                sentCount++;
            }
        });

        logger.info(`📡 Mensaje enviado a ${sentCount} clientes`);
        return sentCount;
    }

    /**
     * Enviar evento de huella capturada
     */
    broadcastFingerprintCaptured(fingerprintData) {
        const message = {
            type: 'fingerprint_captured',
            data: {
                success: fingerprintData.success,
                quality: fingerprintData.quality,
                timestamp: fingerprintData.timestamp,
                // No enviamos los datos binarios por WebSocket
                hasTemplate: !!fingerprintData.template,
                hasImage: !!fingerprintData.image
            },
            timestamp: new Date().toISOString()
        };

        return this.broadcast(message, 'fingerprint_captured');
    }

    /**
     * Enviar evento de identificación
     */
    broadcastFingerprintIdentified(identificationResult) {
        const message = {
            type: 'fingerprint_identified',
            data: identificationResult,
            timestamp: new Date().toISOString()
        };

        return this.broadcast(message, 'fingerprint_identified');
    }

    /**
     * Enviar estado del dispositivo
     */
    broadcastDeviceStatus(status) {
        const message = {
            type: 'device_status',
            data: status,
            timestamp: new Date().toISOString()
        };

        return this.broadcast(message, 'device_status');
    }

    /**
     * Configurar heartbeat para mantener conexiones vivas
     */
    setupHeartbeat() {
        setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (client.isAlive === false) {
                    logger.warn(`💔 Cliente ${clientId} no responde, desconectando...`);
                    client.ws.terminate();
                    this.clients.delete(clientId);
                    return;
                }

                client.isAlive = false;
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.ping();
                }
            });
        }, 30000); // 30 segundos
    }

    /**
     * Generar ID único para cliente
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener estado del servidor
     */
    getServerStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            connectedClients: this.clients.size,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtener lista de clientes conectados
     */
    getConnectedClients() {
        const clients = [];
        this.clients.forEach((client, clientId) => {
            clients.push({
                id: clientId,
                ip: client.ip,
                connectedAt: client.connectedAt,
                subscriptions: client.subscriptions || []
            });
        });
        return clients;
    }

    /**
     * Detener servidor
     */
    stop() {
        try {
            logger.info('🛑 Deteniendo servidor WebSocket...');

            if (this.wss) {
                // Cerrar todas las conexiones
                this.clients.forEach((client, clientId) => {
                    this.sendToClient(clientId, {
                        type: 'server_shutdown',
                        message: 'Servidor cerrando...',
                        timestamp: new Date().toISOString()
                    });
                    client.ws.close();
                });

                // Cerrar servidor
                this.wss.close(() => {
                    logger.info('✅ Servidor WebSocket detenido');
                });
            }

            this.isRunning = false;
            this.clients.clear();

        } catch (error) {
            logger.error('❌ Error deteniendo servidor WebSocket:', error.message);
        }
    }
}

module.exports = WebSocketServer;