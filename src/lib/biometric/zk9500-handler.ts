'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🎯 TIPOS PARA PRODUCCIÓN ZK9500
export interface ZKDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  wsPort: number;
  isConnected: boolean;
  lastHeartbeat?: Date;
  firmware?: string;
  serialNumber?: string;
  userCount?: number;
  fingerprintCount?: number;
  deviceInfo?: any;
}

export interface FingerprintTemplate {
  id: string;
  userId: string;
  fingerIndex: number;
  template: string; // Template real del ZK9500
  quality: number;
  createdAt: Date;
  zkUserId?: number; // ID interno del ZK9500
}

export interface BiometricResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// 🔥 COMANDOS REALES ZK9500
export enum ZKCommand {
  CONNECT = 'CMD_CONNECT',
  DISCONNECT = 'CMD_DISCONNECT',
  GET_DEVICE_INFO = 'CMD_GET_DEVICE_INFO',
  ENROLL_USER = 'CMD_ENROLL_USER',
  VERIFY_FINGER = 'CMD_VERIFY_FINGER',
  GET_ALL_USERS = 'CMD_GET_ALL_USERS',
  DELETE_USER = 'CMD_DELETE_USER',
  CLEAR_ALL = 'CMD_CLEAR_ALL',
  GET_ATTENDANCE = 'CMD_GET_ATTENDANCE',
  SET_TIME = 'CMD_SET_TIME',
  GET_TIME = 'CMD_GET_TIME',
  RESTART_DEVICE = 'CMD_RESTART',
  HEARTBEAT = 'CMD_HEARTBEAT'
}

// 📊 TIPOS BASADOS EN TU ESTRUCTURA SUPABASE REAL
interface UserData {
  id: string;
  firstName: string;  // ✅ Corregido a camelCase
  lastName: string;   // ✅ Corregido a camelCase
  email: string;
  fingerprint: boolean;
  rol: string;
}

interface MembershipData {
  id: string;
  userid: string;     // ✅ Basado en tu tabla user_memberships
  planid: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  remaining_visits: number;
}

// 🚀 CLASE PRINCIPAL PARA ZK9500 REAL
export class ZK9500Handler {
  private device: ZKDevice | null = null;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private commandQueue: Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor() {
    console.log('🚀 Inicializando ZK9500Handler para producción...');
  }

  // 🔌 CONECTAR CON ZK9500 REAL
  async connectDevice(deviceConfig: {
    id: string;
    name: string;
    ip: string;
    port: number;
    wsPort: number;
  }): Promise<BiometricResponse> {
    try {
      console.log('🔌 Conectando con ZK9500 real...', deviceConfig);

      // Crear WebSocket hacia access-agent
      const wsUrl = `ws://${deviceConfig.ip}:${deviceConfig.wsPort}`;
      
      return new Promise((resolve, reject) => {
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = async () => {
          console.log('✅ WebSocket conectado con access-agent');
          
          try {
            // Enviar comando de conexión al ZK9500
            const connectionResult = await this.sendCommand(ZKCommand.CONNECT, {
              ip: deviceConfig.ip,
              port: deviceConfig.port
            });

            if (connectionResult.success) {
              // Obtener información del dispositivo
              const deviceInfo = await this.sendCommand(ZKCommand.GET_DEVICE_INFO, {});
              
              this.device = {
                ...deviceConfig,
                isConnected: true,
                lastHeartbeat: new Date(),
                firmware: deviceInfo.data?.firmware,
                serialNumber: deviceInfo.data?.serialNumber,
                userCount: deviceInfo.data?.userCount,
                fingerprintCount: deviceInfo.data?.fingerprintCount,
                deviceInfo: deviceInfo.data
              };

              // Iniciar heartbeat
              this.startHeartbeat();
              
              // Guardar en Supabase
              await this.saveDeviceConfig(this.device);

              resolve({
                success: true,
                message: '✅ ZK9500 conectado exitosamente',
                data: this.device
              });
            } else {
              throw new Error(connectionResult.error || 'Error conectando con ZK9500');
            }
          } catch (error: any) {
            console.error('❌ Error en handshake ZK9500:', error);
            reject({
              success: false,
              message: 'Error en handshake con ZK9500',
              error: error.message
            });
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          reject({
            success: false,
            message: 'Error conectando WebSocket con access-agent',
            error: 'Verifica que access-agent esté ejecutándose'
          });
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(JSON.parse(event.data));
        };

        this.websocket.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          this.device = null;
          this.attemptReconnect();
        };

        // Timeout de conexión
        setTimeout(() => {
          if (!this.device?.isConnected) {
            reject({
              success: false,
              message: 'Timeout conectando con ZK9500',
              error: 'El dispositivo no respondió en 10 segundos'
            });
          }
        }, 10000);
      });

    } catch (error: any) {
      console.error('❌ Error conectando ZK9500:', error);
      return {
        success: false,
        message: 'Error al conectar con el dispositivo',
        error: error.message
      };
    }
  }

  // 👆 CAPTURAR HUELLA REAL
  async captureFingerprint(userId: string, fingerIndex: number = 1): Promise<BiometricResponse> {
    try {
      if (!this.device?.isConnected) {
        throw new Error('ZK9500 no está conectado');
      }

      console.log(`👆 Iniciando captura real para usuario ${userId}, dedo ${fingerIndex}...`);

      // Enviar comando de enrollment al ZK9500
      const result = await this.sendCommand(ZKCommand.ENROLL_USER, {
        userId: userId,
        fingerIndex: fingerIndex,
        userName: `User_${userId}` // El ZK9500 necesita un nombre
      });

      if (result.success && result.data.template) {
        const fingerprintData: FingerprintTemplate = {
          id: `fp_${userId}_${fingerIndex}_${Date.now()}`,
          userId,
          fingerIndex,
          template: result.data.template, // Template real del ZK9500
          quality: result.data.quality || 85,
          createdAt: new Date(),
          zkUserId: result.data.zkUserId // ID interno del ZK9500
        };

        // Guardar en Supabase usando tu tabla fingerprint_templates
        await this.saveFingerprintTemplate(fingerprintData);

        return {
          success: true,
          message: '✅ Huella capturada exitosamente',
          data: fingerprintData
        };
      } else {
        throw new Error(result.error || 'Error capturando huella');
      }

    } catch (error: any) {
      console.error('❌ Error capturando huella:', error);
      return {
        success: false,
        message: 'Error al capturar la huella',
        error: error.message
      };
    }
  }

  // 🔍 VERIFICAR HUELLA REAL
  async verifyFingerprint(template: string): Promise<BiometricResponse> {
    try {
      if (!this.device?.isConnected) {
        throw new Error('ZK9500 no está conectado');
      }

      console.log('🔍 Verificando huella en ZK9500...');

      // Enviar template al ZK9500 para verificación
      const result = await this.sendCommand(ZKCommand.VERIFY_FINGER, {
        template: template
      });

      if (result.success && result.data.matched) {
        // Obtener información del usuario desde Supabase
        const userInfo = await this.getUserByZKId(result.data.zkUserId);
        
        // Verificar acceso usando tu estructura de tablas
        const accessCheck = await this.checkUserAccess(userInfo.userId);

        if (accessCheck.allowed) {
          // Registrar acceso exitoso
          await this.logAccess(userInfo.userId, true, result.data);

          return {
            success: true,
            message: '✅ Acceso autorizado',
            data: {
              userId: userInfo.userId,
              userName: `${userInfo.firstName} ${userInfo.lastName}`,
              confidence: result.data.confidence,
              accessGranted: true,
              zkUserId: result.data.zkUserId
            }
          };
        } else {
          // Usuario identificado pero sin acceso
          await this.logAccess(userInfo.userId, false, {
            reason: accessCheck.reason
          });

          return {
            success: false,
            message: `❌ Acceso denegado: ${accessCheck.reason}`,
            error: accessCheck.reason
          };
        }
      } else {
        // Huella no reconocida
        await this.logAccess(null, false, { reason: 'Huella no reconocida' });

        return {
          success: false,
          message: '❌ Huella no reconocida',
          error: 'No se encontró coincidencia biométrica'
        };
      }

    } catch (error: any) {
      console.error('❌ Error verificando huella:', error);
      return {
        success: false,
        message: 'Error al verificar la huella',
        error: error.message
      };
    }
  }

  // 📡 ENVIAR COMANDO AL ZK9500
  private async sendCommand(command: ZKCommand, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket no está conectado'));
        return;
      }

      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Timeout para el comando
      const timeout = setTimeout(() => {
        this.commandQueue.delete(commandId);
        reject(new Error('Timeout ejecutando comando'));
      }, 30000); // 30 segundos timeout

      // Guardar callbacks
      this.commandQueue.set(commandId, {
        resolve,
        reject,
        timeout
      });

      // Enviar comando
      const message = {
        id: commandId,
        command: command,
        params: params,
        timestamp: new Date().toISOString()
      };

      console.log(`📡 Enviando comando ${command}:`, message);
      this.websocket.send(JSON.stringify(message));
    });
  }

  // 📨 MANEJAR RESPUESTAS DEL ZK9500
  private handleWebSocketMessage(message: any) {
    console.log('📨 Mensaje recibido del ZK9500:', message);

    // Respuesta a comando específico
    if (message.id && this.commandQueue.has(message.id)) {
      const command = this.commandQueue.get(message.id);
      if (command) {
        clearTimeout(command.timeout);
        this.commandQueue.delete(message.id);
        
        if (message.success) {
          command.resolve(message);
        } else {
          command.reject(new Error(message.error || 'Error en comando'));
        }
      }
      return;
    }

    // Eventos no solicitados (detecciones automáticas)
    switch (message.type) {
      case 'FINGER_DETECTED':
        console.log('👆 Dedo detectado en ZK9500');
        this.handleFingerDetection(message.data);
        break;
      
      case 'USER_VERIFIED':
        console.log('✅ Usuario verificado:', message.data);
        this.handleUserVerification(message.data);
        break;
      
      case 'DEVICE_STATUS':
        console.log('📱 Estado del dispositivo:', message.data);
        this.updateDeviceStatus(message.data);
        break;
      
      case 'HEARTBEAT':
        console.log('💓 Heartbeat del ZK9500');
        if (this.device) {
          this.device.lastHeartbeat = new Date();
        }
        break;
      
      default:
        console.log('📨 Mensaje no reconocido:', message);
    }
  }

  // 🎯 MANEJAR DETECCIÓN AUTOMÁTICA DE DEDO
  private async handleFingerDetection(data: any) {
    try {
      // Verificar automáticamente cuando detecte un dedo
      const verificationResult = await this.verifyFingerprint(data.template);
      
      // Emitir evento para la UI
      window.dispatchEvent(new CustomEvent('zk9500-verification', {
        detail: verificationResult
      }));
      
    } catch (error) {
      console.error('❌ Error en verificación automática:', error);
    }
  }

  // ✅ MANEJAR VERIFICACIÓN DE USUARIO
  private async handleUserVerification(data: any) {
    try {
      // Ya procesado en handleFingerDetection
      console.log('Usuario verificado:', data);
    } catch (error) {
      console.error('❌ Error procesando verificación:', error);
    }
  }

  // 📊 ACTUALIZAR ESTADO DEL DISPOSITIVO
  private updateDeviceStatus(data: any) {
    if (this.device) {
      this.device.isConnected = data.connected || false;
      this.device.userCount = data.userCount;
      this.device.fingerprintCount = data.fingerprintCount;
      
      // Emitir evento para la UI
      window.dispatchEvent(new CustomEvent('zk9500-status', {
        detail: this.device
      }));
    }
  }

  // 💓 INICIAR HEARTBEAT
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.device && this.websocket?.readyState === WebSocket.OPEN) {
        try {
          await this.sendCommand(ZKCommand.HEARTBEAT, {});
        } catch (error) {
          console.error('❌ Error en heartbeat:', error);
        }
      }
    }, 30000); // Cada 30 segundos
  }

  // 🔄 REINTENTAR CONEXIÓN
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.device) {
      this.reconnectAttempts++;
      console.log(`🔄 Reintentando conexión... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.device) {
          this.connectDevice(this.device);
        }
      }, 5000);
    }
  }

  // 💾 GUARDAR CONFIGURACIÓN EN SUPABASE - ✅ USANDO TU TABLA REAL
  private async saveDeviceConfig(device: ZKDevice): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ Usar tabla biometric_devices con tus columnas exactas
      const { error } = await supabase
        .from('biometric_devices')
        .upsert({
          id: device.id,
          name: device.name,
          type: 'zk9500', // ✅ Enum definido en tu tabla
          model: 'ZKTeco ZK9500',
          ip_address: device.ip,
          port: device.port,
          ws_port: device.wsPort,
          status: device.isConnected ? 'connected' : 'disconnected',
          firmware_version: device.firmware,
          serial_number: device.serialNumber,
          user_count: device.userCount || 0,
          fingerprint_count: device.fingerprintCount || 0,
          last_sync: device.lastHeartbeat?.toISOString(),
          is_active: true,
          device_type: 'zkteco',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error guardando configuración:', error);
      } else {
        console.log('✅ Configuración de ZK9500 guardada');
      }
    } catch (error) {
      console.error('❌ Error en saveDeviceConfig:', error);
    }
  }

  // 💾 GUARDAR TEMPLATE EN SUPABASE - ✅ USANDO TU TABLA REAL
  private async saveFingerprintTemplate(template: FingerprintTemplate): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ Usar tabla fingerprint_templates con tus columnas exactas
      const { error } = await supabase
        .from('fingerprint_templates')
        .upsert({
          user_id: template.userId,
          template: template.template,
          device_user_id: template.zkUserId,
          enrolled_at: template.createdAt.toISOString()
        });

      if (error) {
        console.error('❌ Error guardando template:', error);
        throw error;
      } else {
        console.log('✅ Template guardado en Supabase');
        
        // ✅ Actualizar campo fingerprint en Users
        await supabase
          .from('Users')
          .update({ fingerprint: true })
          .eq('id', template.userId);
      }
    } catch (error) {
      console.error('❌ Error en saveFingerprintTemplate:', error);
      throw error;
    }
  }

  // 👤 OBTENER USUARIO POR ZK ID - ✅ VERSIÓN SIMPLIFICADA
private async getUserByZKId(zkUserId: number): Promise<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  }> {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ Primero obtener user_id desde fingerprint_templates
      const { data: fingerprintData, error: fingerprintError } = await supabase
        .from('fingerprint_templates')
        .select('user_id')
        .eq('device_user_id', zkUserId)
        .single();
  
      if (fingerprintError || !fingerprintData) {
        throw new Error('Usuario no encontrado en fingerprint_templates');
      }
  
      // ✅ Luego obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('id, firstName, lastName, email')
        .eq('id', fingerprintData.user_id)
        .single();
  
      if (userError || !userData) {
        throw new Error('Usuario no encontrado en Users');
      }
      
      return {
        userId: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      };
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      throw error;
    }
  }

  // 🔐 VERIFICAR ACCESO - ✅ USANDO TU ESTRUCTURA REAL
  private async checkUserAccess(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ 1. Verificar usuario activo con tu estructura real
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('id, firstName, lastName, rol')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return { allowed: false, reason: 'Usuario no encontrado' };
      }

      // ✅ 2. Verificar membresía activa con tu tabla user_memberships
      const today = new Date().toISOString().split('T')[0];
      
      const { data: membershipData, error: membershipError } = await supabase
        .from('user_memberships')
        .select(`
          id,
          status,
          start_date,
          end_date,
          remaining_visits
        `)
        .eq('userid', userId) // ✅ tu columna se llama 'userid'
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

      if (membershipError || !membershipData) {
        return { allowed: false, reason: 'Sin membresía activa' };
      }

      // ✅ 3. Verificar visitas restantes
      if (membershipData.remaining_visits <= 0) {
        return { allowed: false, reason: 'Sin visitas disponibles' };
      }

      // ✅ Acceso autorizado
      return { allowed: true };

    } catch (error) {
      console.error('❌ Error verificando acceso:', error);
      return { allowed: false, reason: 'Error del sistema' };
    }
  }

  // 📝 REGISTRAR ACCESO - ✅ USANDO TU TABLA access_logs
  private async logAccess(userId: string | null, success: boolean, data?: any): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // ✅ Usar tabla access_logs con tus columnas exactas
      const { error } = await supabase
        .from('access_logs')
        .insert({
          user_id: userId,
          device_id: this.device?.id,
          access_type: success ? 'entry' : 'denied', // ✅ tu enum
          access_method: 'fingerprint', // ✅ tu enum
          success: success,
          confidence_score: data?.confidence ? (data.confidence / 100) : null,
          denial_reason: data?.reason,
          device_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error registrando acceso:', error);
      } else {
        console.log('✅ Acceso registrado');
        
        // ✅ Si acceso exitoso, decrementar visitas
        if (success && userId) {
          await supabase.rpc('decrement_user_visits', { user_id: userId });
        }
      }
    } catch (error) {
      console.error('❌ Error en logAccess:', error);
    }
  }

  // 🧹 LIMPIAR RECURSOS
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Limpiar comandos pendientes
    this.commandQueue.forEach(command => {
      clearTimeout(command.timeout);
      command.reject(new Error('Disconnected'));
    });
    this.commandQueue.clear();

    this.device = null;
    this.reconnectAttempts = 0;
    console.log('🔌 ZK9500Handler desconectado');
  }

  // 📊 OBTENER ESTADO
  getDeviceStatus(): ZKDevice | null {
    return this.device;
  }

  // 🔄 REINICIAR DISPOSITIVO
  async restartDevice(): Promise<BiometricResponse> {
    try {
      if (!this.device?.isConnected) {
        throw new Error('Dispositivo no conectado');
      }

      console.log('🔄 Reiniciando ZK9500...');
      
      const result = await this.sendCommand(ZKCommand.RESTART_DEVICE, {});
      
      return {
        success: result.success,
        message: result.success ? '✅ Dispositivo reiniciado' : 'Error reiniciando',
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al reiniciar el dispositivo',
        error: error.message
      };
    }
  }

  // 📋 OBTENER TODOS LOS USUARIOS DEL ZK9500
  async getAllUsers(): Promise<BiometricResponse> {
    try {
      if (!this.device?.isConnected) {
        throw new Error('Dispositivo no conectado');
      }

      const result = await this.sendCommand(ZKCommand.GET_ALL_USERS, {});
      
      return {
        success: result.success,
        message: result.success ? 'Usuarios obtenidos' : 'Error obteniendo usuarios',
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error obteniendo usuarios',
        error: error.message
      };
    }
  }

  // 🗑️ ELIMINAR USUARIO DEL ZK9500
  async deleteUser(zkUserId: number): Promise<BiometricResponse> {
    try {
      if (!this.device?.isConnected) {
        throw new Error('Dispositivo no conectado');
      }

      const result = await this.sendCommand(ZKCommand.DELETE_USER, {
        zkUserId: zkUserId
      });
      
      return {
        success: result.success,
        message: result.success ? 'Usuario eliminado' : 'Error eliminando usuario',
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error eliminando usuario',
        error: error.message
      };
    }
  }
}

// 🚀 INSTANCIA GLOBAL
export const zk9500Handler = new ZK9500Handler();