const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Crear formato personalizado
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        return stack 
            ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
            : `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

// Configurar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        // Console
        new winston.transports.Console({
            format: winston.format.combine(
                    winston.format.errors({ stack: true }), // ← AGREGA ESTA LÍNEA

                winston.format.colorize(),
                customFormat
            )
        }),
        // Archivo
        new winston.transports.File({
            filename: process.env.LOG_FILE || './logs/access-agent.log',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5
        })
    ]
});

module.exports = logger; 
