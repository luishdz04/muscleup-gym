// Versión simplificada sin dependencias FFI
const net = require('net');
const logger = require('../utils/logger') || console;

class F22Controller {
  constructor() {
    this.connected = false;
  }
  
  async connect(ip, port = 4370) {
    return new Promise((resolve) => {
      logger.info(`Intentando conexión TCP con F22 en ${ip}:${port}`);
      
      const client = new net.Socket();
      let timeout = setTimeout(() => {
        client.destroy();
        logger.error(`Timeout conectando a ${ip}:${port}`);
        resolve({ 
          success: false, 
          message: 'Timeout: No se pudo conectar al dispositivo F22'
        });
      }, 5000);
      
      client.connect(port, ip, () => {
        clearTimeout(timeout);
        client.end();
        logger.info(`Conectado exitosamente a ${ip}:${port}`);
        resolve({ 
          success: true, 
          message: `Conectado al dispositivo F22 en ${ip}:${port}` 
        });
      });
      
      client.on('error', (err) => {
        clearTimeout(timeout);
        logger.error(`Error conectando con F22: ${err.message}`);
        resolve({ 
          success: false, 
          message: `Error conectando con F22: ${err.message}`,
          error: err.message
        });
      });
    });
  }
  
  async testConnection(ip, port = 4370) {
    return this.connect(ip, port);
  }
  
  async disconnect() {
    return true;
  }
  
  async syncFingerprint() {
    return {
      success: false,
      message: "Funcionalidad no disponible en versión simplificada. Se requiere SDK completo."
    };
  }
}

module.exports = F22Controller;