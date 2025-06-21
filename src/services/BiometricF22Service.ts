/**
 * Servicio para comunicación con F22 via WebSocket
 */

import { toast } from 'react-hot-toast';

interface F22ServiceOptions {
  url?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onDeviceStatus?: (status: string) => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
}

export interface F22TemplateData {
  uid: number;
  user_id: string;
  name: string;
  finger_index: number;
  has_template: boolean;
}

export interface F22SyncResult {
  success: boolean;
  templates: F22TemplateData[];
  count: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  error?: string;
}

export interface F22DeviceInfo {
  status: string;
  ip: string;
  port: number;
  firmware?: string;
  serial?: string;
  users_count?: number;
  templates_count?: number;
}

export interface F22EnrollResult {
  success: boolean;
  uid: number;
  message: string;
  error?: string;
}

export default class BiometricF22Service {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private options: F22ServiceOptions;
  private deviceConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();

  constructor(options: F22ServiceOptions = {}) {
    this.options = {
      url: 'ws://localhost:8082',
      onConnect: () => {},
      onDisconnect: () => {},
      onDeviceStatus: () => {},
      onError: () => {},
      autoReconnect: true,
      ...options
    };
  }

  public connect(): void {
    if (this.socket) {
      this.socket.close();
    }

    try {
      this.socket = new WebSocket(this.options.url!);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to F22 WebSocket:', error);
      this.options.onError?.('Error de conexión: ' + error);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public isDeviceConnected(): boolean {
    return this.deviceConnected;
  }

  private handleOpen(): void {
    console.log('F22 WebSocket connected');
    this.isConnected = true;
    this.options.onConnect?.();
  }

  private handleClose(event: CloseEvent): void {
    console.log('F22 WebSocket disconnected', event);
    this.isConnected = false;
    this.deviceConnected = false;
    this.options.onDisconnect?.();

    // Auto reconnect if needed
    if (this.options.autoReconnect && !event.wasClean) {
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000);
    }
  }

  private handleError(event: Event): void {
    console.error('F22 WebSocket error:', event);
    this.options.onError?.('Error en la conexión WebSocket');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      console.log('F22 message received:', data);

      // Handle device status messages
      if (data.type === 'device_status') {
        this.deviceConnected = data.status === 'connected';
        this.options.onDeviceStatus?.(data.status);
      } 
      else if (data.type === 'device_connected') {
        this.deviceConnected = true;
        this.options.onDeviceStatus?.('connected');
      } 
      else if (data.type === 'device_disconnected') {
        this.deviceConnected = false;
        this.options.onDeviceStatus?.('disconnected');
      }
      // Handle error messages
      else if (data.type === 'error') {
        this.options.onError?.(data.message);
        toast.error(data.message);
      }

      // Process callbacks for specific message types
      const callback = this.messageCallbacks.get(data.type);
      if (callback) {
        callback(data);
        // One-time callbacks are removed after execution
        this.messageCallbacks.delete(data.type);
      }

    } catch (error) {
      console.error('Error parsing message:', error, event.data);
    }
  }

  private sendMessage(message: any): boolean {
    if (!this.isConnected || !this.socket) {
      console.error('Cannot send message: WebSocket not connected');
      toast.error('No hay conexión con el servicio F22');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Register a callback for a specific message type
   */
  public registerCallback(messageType: string, callback: (data: any) => void): void {
    this.messageCallbacks.set(messageType, callback);
  }

  /**
   * Connect to F22 device
   */
  public async connectDevice(): Promise<F22DeviceInfo> {
    return new Promise((resolve, reject) => {
      this.registerCallback('device_connected', (data) => {
        resolve(data.device_info);
      });

      this.registerCallback('device_connection_error', (data) => {
        reject(new Error(data.message));
      });

      if (!this.sendMessage({ action: 'connect_device' })) {
        reject(new Error('Error enviando comando de conexión'));
      }
    });
  }

  /**
   * Disconnect from F22 device
   */
  public async disconnectDevice(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.registerCallback('device_disconnected', () => {
        resolve();
      });

      if (!this.sendMessage({ action: 'disconnect_device' })) {
        reject(new Error('Error enviando comando de desconexión'));
      }
    });
  }

  /**
   * Get device info
   */
  public async getDeviceInfo(): Promise<F22DeviceInfo> {
    return new Promise((resolve, reject) => {
      this.registerCallback('device_info', (data) => {
        resolve(data.device_info);
      });

      if (!this.sendMessage({ action: 'get_device_info' })) {
        reject(new Error('Error enviando comando para obtener información'));
      }
    });
  }

  /**
   * Sync templates from F22
   */
  public async syncTemplates(page: number = 0, pageSize: number = 10): Promise<F22SyncResult> {
    return new Promise((resolve, reject) => {
      this.registerCallback('sync_templates_result', (data) => {
        resolve(data.data);
      });

      if (!this.sendMessage({ 
        action: 'sync_templates',
        page,
        pageSize
      })) {
        reject(new Error('Error enviando comando para sincronizar templates'));
      }
    });
  }

  /**
   * Enroll user in F22
   */
  public async enrollUser(userId: string, userName: string, fingerIndex: number = 0): Promise<F22EnrollResult> {
    return new Promise((resolve, reject) => {
      this.registerCallback('enrollment_success', (data) => {
        resolve(data.data);
      });

      this.registerCallback('enrollment_error', (data) => {
        reject(new Error(data.message));
      });

      if (!this.sendMessage({ 
        action: 'enroll_user',
        userId,
        userName,
        fingerIndex
      })) {
        reject(new Error('Error enviando comando para enrollar usuario'));
      }
    });
  }
}