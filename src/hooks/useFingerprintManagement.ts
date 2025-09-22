// hooks/useFingerprintManagement.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Interfaces
interface FingerprintState {
  status: 'none' | 'captured' | 'saving' | 'saved' | 'error';
  deviceUserId: string | null;
  fingerIndex: number | null;
  fingerName: string | null;
  message: string | null;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pendingData: any | null;
}

interface WebSocketMessage {
  action: string;
  device_user_id?: string;
  userId?: string;
  finger_index?: number;
  deleteAll?: boolean;
  templateData?: any;
  source?: string;
  updated_by?: string;
}

interface FingerprintData {
  user_id: string;
  template: any;
  device_user_id: string;
  finger_index: number;
  finger_name: string;
  primary_template?: any;
  verification_template?: any;
  backup_template?: any;
  combined_template?: any;
  average_quality?: number;
  capture_count?: number;
  capture_time_ms?: number;
  device_info?: any;
  sdk_version?: string;
  enrolled_at?: string;
}

interface UseFingerprintManagementProps {
  userId?: string;
  onFingerprintChange?: (hasFingerprint: boolean) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

// Constantes
const WS_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const VALID_FINGER_INDICES = Array.from({ length: 10 }, (_, i) => i);

export const useFingerprintManagement = ({
  userId,
  onFingerprintChange,
  onError,
  onSuccess
}: UseFingerprintManagementProps) => {

  // Estado principal de huella
  const [fingerprintState, setFingerprintState] = useState<FingerprintState>({
    status: 'none',
    deviceUserId: null,
    fingerIndex: null,
    fingerName: null,
    message: null,
    error: null,
    syncStatus: 'idle',
    pendingData: null
  });

  // Estados de control
  const [isDeletingFingerprint, setIsDeletingFingerprint] = useState(false);
  const [fingerprintDialogOpen, setFingerprintDialogOpen] = useState(false);

  // Referencias
  const mountedRef = useRef(true);

  // Función para crear mapping en device_user_mappings
  const createDeviceUserMapping = useCallback(async (
    userId: string, 
    deviceUserId: number,
    deviceId: string = 'F22_001'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📍 [MAPPING] Creando mapping en device_user_mappings...', {
        user_id: userId,
        device_user_id: deviceUserId,
        device_id: deviceId
      });
      
      const supabase = createBrowserSupabaseClient();
      
      // Verificar si ya existe un mapping
      const { data: existing, error: checkError } = await supabase
        .from('device_user_mappings')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        console.log('📝 [MAPPING] Actualizando mapping existente...');
        const { error: updateError } = await supabase
          .from('device_user_mappings')
          .update({
            device_user_id: deviceUserId,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
        
        console.log('✅ [MAPPING] Mapping actualizado exitosamente');
      } else {
        console.log('🆕 [MAPPING] Creando nuevo mapping...');
        const { error: insertError } = await supabase
          .from('device_user_mappings')
          .insert({
            user_id: userId,
            device_id: deviceId,
            device_user_id: deviceUserId,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
        
        console.log('✅ [MAPPING] Mapping creado exitosamente');
      }
      
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ [MAPPING] Error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Función para guardar huella en base de datos
  const saveFingerprintToDatabase = useCallback(async (fingerprintData: FingerprintData): Promise<{ success: boolean; error?: string; data?: any }> => {
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`💾 [DB-SAVE] Intento ${retryCount + 1}/${MAX_RETRIES} - Guardando huella...`, {
          user_id: fingerprintData.user_id,
          device_user_id: fingerprintData.device_user_id,
          finger_index: fingerprintData.finger_index,
          template_size: fingerprintData.template?.length || 0
        });
        
        const response = await fetch('/api/biometric/fingerprint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...fingerprintData,
            created_at: new Date().toISOString(),
            updated_by: 'luishdz04'
          })
        });
        
        // Manejar respuesta vacía (204)
        if (response.status === 204) {
          console.log('✅ [DB-SAVE] Guardado exitoso (204 No Content)');
          return { success: true, data: fingerprintData };
        }
        
        // Intentar parsear respuesta
        let result: any = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            result = await response.json();
          } catch (jsonError) {
            console.warn('⚠️ [DB-SAVE] Error parseando JSON, usando respuesta vacía');
            result = {};
          }
        }
        
        if (!response.ok) {
          const errorMsg = result.error || result.message || `HTTP ${response.status}`;
          throw new Error(errorMsg);
        }
        
        console.log('✅ [DB-SAVE] Huella guardada exitosamente:', result);
        return { success: true, data: result.data || fingerprintData };
        
      } catch (error: any) {
        retryCount++;
        console.error(`❌ [DB-SAVE] Error intento ${retryCount}:`, error.message);
        
        if (retryCount >= MAX_RETRIES) {
          console.error(`💥 [DB-SAVE] Falló después de ${MAX_RETRIES} intentos`);
          
          let errorMessage = error.message;
          if (error.message.includes('duplicate key')) {
            errorMessage = 'Ya existe una huella para este usuario y dedo';
          } else if (error.message.includes('foreign key')) {
            errorMessage = 'Usuario no encontrado en base de datos';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Error de conexión con base de datos';
          }
          
          return { success: false, error: errorMessage };
        }
        
        console.log(`🔄 [DB-SAVE] Esperando ${retryCount * 1000}ms antes del retry...`);
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }
    }
    
    return { success: false, error: 'Error inesperado en guardado' };
  }, []);

  // Función para eliminar huella de base de datos
  const deleteFingerprintFromDatabase = useCallback(async (
    userId: string, 
    fingerIndex?: number
  ): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
    try {
      console.log('🗑️ [DB-DELETE] Eliminando de BD...', { userId, fingerIndex });
      
      let url = `/api/biometric/fingerprint?userId=${userId}`;
      
      if (fingerIndex !== undefined && fingerIndex !== null) {
        url += `&fingerIndex=${fingerIndex}`;
      } else {
        url += '&deleteAll=true';
      }
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (response.status === 204 || response.status === 200) {
        console.log('✅ [DB-DELETE] Eliminado exitosamente');
        return { success: true, deletedCount: 1 };
      }
      
      let result: any = {};
      try {
        result = await response.json();
      } catch {
        // Si no hay JSON, continuar
      }
      
      if (!response.ok) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }
      
      console.log('✅ [DB-DELETE] Resultado:', result);
      return { 
        success: true, 
        deletedCount: result.deleted_count || result.deletedCount || 1 
      };
      
    } catch (error: any) {
      console.error('❌ [DB-DELETE] Error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Función para sincronizar con F22
  const syncFingerprintToF22Service = useCallback(async (
    templateData: any,
    wsUrl: string = 'ws://127.0.0.1:8085/ws/'
  ): Promise<{ 
    success: boolean; 
    uid?: number; 
    device_user_id?: number; 
    finger_name?: string; 
    message?: string; 
    error?: string 
  }> => {
    return new Promise((resolve, reject) => {
      let ws: WebSocket | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let isResolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        ws = null;
      };

      const resolveOnce = (result: any) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(result);
        }
      };

      const rejectOnce = (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(error);
        }
      };

      try {
        console.log('🔄 [F22-SYNC] Iniciando sincronización con F22...', {
          device_user_id: templateData.device_user_id,
          finger_index: templateData.finger_index,
          user_id: templateData.user_id,
          userName: templateData.userName || templateData.fullName
        });
        
        ws = new WebSocket(wsUrl);
        
        timeoutId = setTimeout(() => {
          rejectOnce(new Error(`Timeout en conexión con F22 (${WS_TIMEOUT/1000}s)`));
        }, WS_TIMEOUT);
        
        ws.onopen = () => {
          console.log('✅ [F22-SYNC] WebSocket conectado');
          
          // Enviar comando de conexión al dispositivo
          ws!.send(JSON.stringify({
            type: 'device',
            action: 'connect',
            data: {
              deviceType: 'F22',
              deviceId: 'F22_001'
            }
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('📨 [F22-SYNC] Respuesta:', response.type, response.action);
            
            // Manejar respuesta de conexión
            if (response.type === 'device' && response.action === 'connect') {
              if (response.data?.isSuccess) {
                console.log('🔒 [F22-SYNC] F22 conectado, enviando template...');
                
                const fullName = templateData.userName || 
                               templateData.fullName ||
                               `${templateData.firstName || ''} ${templateData.lastName || ''}`.trim() ||
                               `USR${templateData.device_user_id}`;
                
                const deviceUserId = parseInt(templateData.device_user_id);
                
                console.log('📝 [F22-SYNC] Enviando con nombre:', fullName);
                console.log('🔢 [F22-SYNC] Device User ID:', deviceUserId);
                
                // Enviar template con toda la información
                ws!.send(JSON.stringify({
                  type: 'device',
                  action: 'sync_fingerprint',
                  data: {
                    deviceType: 'F22',
                    deviceId: 'F22_001',
                    userId: templateData.user_id,
                    deviceUserId: deviceUserId,
                    templates: [{
                      fingerIndex: templateData.finger_index,
                      template: templateData.template,
                      primary: true
                    }],
                    userName: fullName,
                    userInfo: {
                      firstName: templateData.firstName || '',
                      lastName: templateData.lastName || '',
                      fullName: fullName
                    }
                  }
                }));
              } else {
                rejectOnce(new Error('No se pudo conectar el dispositivo F22'));
              }
            }
            
            // Manejar respuesta de sincronización
            else if (response.type === 'sync_result' || 
                     response.type === 'fingerprint_sync_result' ||
                     (response.type === 'device' && response.action === 'sync_fingerprint')) {
              const responseData = response.data || {};
              
              if (responseData.success || responseData.isSuccess) {
                console.log('✅ [F22-SYNC] Template sincronizado exitosamente');
                resolveOnce({
                  success: true,
                  uid: responseData.uid || responseData.userId || templateData.device_user_id,
                  device_user_id: responseData.deviceUserId || templateData.device_user_id,
                  finger_name: templateData.finger_name,
                  message: responseData.message || 'Sincronizado exitosamente'
                });
              } else {
                rejectOnce(new Error(responseData.error || 'Error desconocido en F22'));
              }
            }
            
            else if (response.type === 'error' || response.type === 'command_error') {
              rejectOnce(new Error(response.message || response.error || 'Error en comando F22'));
            }
            
          } catch (parseError) {
            console.error('❌ [F22-SYNC] Error parseando respuesta:', parseError);
            rejectOnce(new Error('Error en comunicación con F22'));
          }
        };
        
        ws.onclose = (event) => {
          console.log('🔌 [F22-SYNC] WebSocket cerrado:', event.code, event.reason);
          
          if (!isResolved && event.code !== 1000) {
            rejectOnce(new Error(`Conexión perdida con F22 (código: ${event.code})`));
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ [F22-SYNC] Error WebSocket:', error);
          rejectOnce(new Error('Error de conexión con servicio F22'));
        };
        
      } catch (error: any) {
        console.error('💥 [F22-SYNC] Error crítico:', error);
        rejectOnce(error);
      }
    });
  }, []);

  // Función para eliminar huella del F22
  const deleteFingerprintFromF22Service = useCallback(async (
    deviceUserId: string,
    userId: string,
    fingerIndex?: number,
    wsUrl: string = 'ws://127.0.0.1:8085/ws/'
  ): Promise<{ 
    success: boolean; 
    error?: string; 
    deletedTemplates?: number;
    userDeleted?: boolean;
  }> => {
    return new Promise((resolve, reject) => {
      let ws: WebSocket | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let isResolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        ws = null;
      };

      const resolveOnce = (result: any) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(result);
        }
      };

      const rejectOnce = (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(error);
        }
      };

      try {
        console.log('🗑️ [F22-DELETE] Iniciando eliminación...', {
          deviceUserId,
          userId,
          fingerIndex,
          deleteAll: fingerIndex === undefined
        });
        
        ws = new WebSocket(wsUrl);
        
        timeoutId = setTimeout(() => {
          rejectOnce(new Error(`Timeout eliminando del F22 (${WS_TIMEOUT/1000}s)`));
        }, WS_TIMEOUT);
        
        ws.onopen = () => {
          console.log('🔌 [F22-DELETE] WebSocket conectado');
        };
        
        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('📨 [F22-DELETE] Respuesta:', response.type, response.action);
            
            if (response.type === 'welcome' && response.action === 'connected') {
              console.log('🎉 [F22-DELETE] Enviando comando de eliminación...');
              
              const deleteCommand = {
                type: 'device',
                action: 'delete_fingerprint',
                data: {
                  deviceType: 'F22',
                  deviceId: 'F22_001',
                  deviceUserId: parseInt(deviceUserId),
                  userId: userId,
                  fingerIndex: fingerIndex !== undefined ? fingerIndex : null,
                  deleteAll: fingerIndex === undefined || fingerIndex === null
                }
              };
              
              console.log('📤 [F22-DELETE] Comando enviado:', JSON.stringify(deleteCommand));
              ws!.send(JSON.stringify(deleteCommand));
            }
            
            else if (
              response.type === 'delete_fingerprint_result' || 
              response.type === 'delete_user_result' ||
              response.type === 'device_response' ||
              (response.type === 'device' && response.action === 'delete_fingerprint')
            ) {
              const responseData = response.data || {};
              
              if (responseData.success || responseData.isSuccess) {
                console.log('✅ [F22-DELETE] Eliminación exitosa:', responseData);
                resolveOnce({
                  success: true,
                  deletedTemplates: responseData.deletedTemplates || 
                                   responseData.deleted_templates || 
                                   responseData.deletedCount || 
                                   responseData.deleted_count || 0,
                  userDeleted: responseData.userDeleted || 
                              responseData.user_deleted || false
                });
              } else {
                const errorMsg = responseData.error || 
                               responseData.message || 
                               'Error desconocido en eliminación';
                console.error('❌ [F22-DELETE] Error en respuesta:', errorMsg);
                rejectOnce(new Error(errorMsg));
              }
            }
            
            else if (response.type === 'error' || response.type === 'command_error') {
              const errorMsg = response.data?.error || 
                             response.message || 
                             response.error || 
                             'Error desconocido';
              console.error('❌ [F22-DELETE] Error del servidor:', errorMsg);
              rejectOnce(new Error(errorMsg));
            }
            
          } catch (parseError) {
            console.error('❌ [F22-DELETE] Error parseando respuesta:', parseError);
            rejectOnce(new Error('Error en comunicación con F22'));
          }
        };
        
        ws.onclose = (event) => {
          console.log('🔌 [F22-DELETE] WebSocket cerrado:', event.code, event.reason);
          
          if (!isResolved && event.code !== 1000) {
            rejectOnce(new Error(`Conexión perdida con F22 (código: ${event.code})`));
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ [F22-DELETE] Error WebSocket:', error);
          rejectOnce(new Error('Error de conexión con servicio F22'));
        };
        
      } catch (error: any) {
        console.error('💥 [F22-DELETE] Error crítico:', error);
        rejectOnce(error);
      }
    });
  }, []);

  // Función para manejar error en huella
  const handleFingerprintError = useCallback((message: string) => {
    setFingerprintState(prev => ({
      ...prev,
      status: 'error',
      error: message,
      message: null,
      syncStatus: 'idle'
    }));
    
    onError?.(message);
    
    // Auto-limpiar después de 5 segundos
    setTimeout(() => {
      if (mountedRef.current) {
        setFingerprintState(prev => ({
          ...prev,
          error: null
        }));
      }
    }, 5000);
  }, [onError]);

  // Función para abrir diálogo de huella
  const handleFingerprintDialogOpen = useCallback(() => {
    if (!userId) {
      handleFingerprintError('Se requiere un usuario válido para registrar huella');
      return;
    }
    setFingerprintDialogOpen(true);
  }, [userId, handleFingerprintError]);

  // Función para cerrar diálogo de huella
  const handleFingerprintDialogClose = useCallback(() => {
    setFingerprintDialogOpen(false);
  }, []);

  // Función para manejar datos de huella capturada
  const handleFingerprintDataReady = useCallback(async (fingerprintData: any) => {
    try {
      console.log('📥 [FINGERPRINT] Huella capturada, almacenando temporalmente...', {
        device_user_id: fingerprintData.device_user_id,
        finger_index: fingerprintData.finger_index,
        finger_name: fingerprintData.finger_name
      });
      
      // Validar datos
      if (!fingerprintData.template) {
        throw new Error('Template de huella vacío');
      }
      
      if (!fingerprintData.device_user_id) {
        throw new Error('device_user_id requerido');
      }
      
      if (fingerprintData.finger_index === undefined || 
          fingerprintData.finger_index === null ||
          !VALID_FINGER_INDICES.includes(fingerprintData.finger_index)) {
        throw new Error('finger_index inválido');
      }
      
      // Actualizar estado
      setFingerprintState({
        status: 'captured',
        deviceUserId: fingerprintData.device_user_id,
        fingerIndex: fingerprintData.finger_index,
        fingerName: fingerprintData.finger_name,
        message: `🎉 ¡Huella ${fingerprintData.finger_name} capturada! Presiona "Actualizar Usuario" para guardar.`,
        error: null,
        syncStatus: 'idle',
        pendingData: {
          ...fingerprintData,
          captured_at: new Date().toISOString()
        }
      });
      
      onSuccess?.(`Huella ${fingerprintData.finger_name} capturada exitosamente`);
      console.log('✅ [FINGERPRINT] Huella almacenada temporalmente');
      
    } catch (error: any) {
      console.error('❌ [FINGERPRINT] Error:', error);
      handleFingerprintError(`Error: ${error.message}`);
    }
  }, [handleFingerprintError, onSuccess]);

  // Función para procesar huella pendiente
  const processPendingFingerprint = useCallback(async (userName: string) => {
    if (!fingerprintState.pendingData || fingerprintState.status !== 'captured' || !userId) {
      return { success: false, error: 'No hay huella pendiente para procesar' };
    }

    try {
      console.log('🖐️ [PROCESS] Procesando huella pendiente...');
      setFingerprintState(prev => ({
        ...prev,
        syncStatus: 'syncing'
      }));
      
      const fullName = userName || `${fingerprintState.pendingData.firstName || ''} ${fingerprintState.pendingData.lastName || ''}`.trim();
      
      // Preparar datos para BD
      const templateDataForDB: FingerprintData = {
        user_id: userId,
        template: fingerprintState.pendingData.template,
        device_user_id: fingerprintState.pendingData.device_user_id,
        finger_index: fingerprintState.pendingData.finger_index,
        finger_name: fingerprintState.pendingData.finger_name,
        primary_template: fingerprintState.pendingData.primary_template,
        verification_template: fingerprintState.pendingData.verification_template,
        backup_template: fingerprintState.pendingData.backup_template,
        combined_template: fingerprintState.pendingData.combined_template || fingerprintState.pendingData.template,
        average_quality: fingerprintState.pendingData.average_quality,
        capture_count: fingerprintState.pendingData.capture_count,
        capture_time_ms: fingerprintState.pendingData.capture_time_ms,
        device_info: fingerprintState.pendingData.device_info || {},
        sdk_version: 'official_zkteco',
        enrolled_at: new Date().toISOString(),
      };

      // Guardar en BD
      console.log('💾 [PROCESS] Guardando huella en BD...');
      const dbResult = await saveFingerprintToDatabase(templateDataForDB);

      if (dbResult.success) {
        console.log('✅ [PROCESS] Huella guardada en BD');
        
        // Crear mapping en device_user_mappings
        const mappingResult = await createDeviceUserMapping(
          userId,
          fingerprintState.pendingData.device_user_id,
          'F22_001'
        );
        
        if (mappingResult.success) {
          console.log('✅ [PROCESS] Mapping creado en device_user_mappings tabla');
        } else {
          console.warn('⚠️ [PROCESS] Error creando mapping:', mappingResult.error);
        }
        
        // Preparar datos para F22 con nombre completo
        const f22SyncData = {
          ...templateDataForDB,
          userName: fullName,
          fullName: fullName,
          firstName: fingerprintState.pendingData.firstName || '',
          lastName: fingerprintState.pendingData.lastName || '',
          device_user_id: parseInt(templateDataForDB.device_user_id.toString())
        };
        
        console.log('📤 [PROCESS] Datos para F22:', {
          userName: f22SyncData.userName,
          device_user_id: f22SyncData.device_user_id
        });

        try {
          const f22Result = await syncFingerprintToF22Service(f22SyncData);
          
          if (f22Result.success) {
            console.log('✅ [PROCESS] Huella sincronizada con F22');
            setFingerprintState(prev => ({
              ...prev,
              status: 'saved',
              syncStatus: 'success',
              message: `🎉 Usuario y huella guardados exitosamente! ID F22: ${f22Result.device_user_id}`,
              pendingData: null
            }));
            
            onSuccess?.(`Huella sincronizada exitosamente con F22`);
            onFingerprintChange?.(true);
            
            return { success: true };
          } else {
            throw new Error(f22Result.error || 'Error en F22');
          }
        } catch (f22Error: any) {
          console.warn('⚠️ [PROCESS] Error F22:', f22Error.message);
          setFingerprintState(prev => ({
            ...prev,
            status: 'saved',
            syncStatus: 'error',
            error: `BD actualizada, error F22: ${f22Error.message}`,
            pendingData: null
          }));
          
          onFingerprintChange?.(true); // BD actualizada
          return { success: true, warning: f22Error.message };
        }
        
      } else {
        throw new Error(dbResult.error || 'Error guardando en BD');
      }
      
    } catch (error: any) {
      console.error('💥 [PROCESS] Error procesando huella:', error);
      setFingerprintState(prev => ({
        ...prev,
        syncStatus: 'error',
        error: `Error: ${error.message}`
      }));
      
      onError?.(error.message);
      return { success: false, error: error.message };
    }
  }, [
    fingerprintState.pendingData, 
    fingerprintState.status, 
    userId, 
    saveFingerprintToDatabase, 
    createDeviceUserMapping, 
    syncFingerprintToF22Service, 
    onSuccess, 
    onFingerprintChange, 
    onError
  ]);

  // Función para eliminar huella
  const handleDeleteFingerprint = useCallback(async () => {
    if (!userId) {
      handleFingerprintError('Se requiere un usuario válido');
      return;
    }

    if (!window.confirm('¿Eliminar la huella de BD y F22? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeletingFingerprint(true);
      setFingerprintState(prev => ({
        ...prev,
        status: 'none',
        error: null,
        message: null,
        syncStatus: 'syncing'
      }));

      console.log('🗑️ [DELETE] Iniciando eliminación para usuario:', userId);

      // Obtener device_user_id y finger_index de BD
      let deviceUserId = null;
      let fingerIndex = null;
      
      if (fingerprintState.pendingData) {
        deviceUserId = fingerprintState.pendingData.device_user_id;
        fingerIndex = fingerprintState.pendingData.finger_index;
        console.log('📊 [DELETE] Usando datos pendientes:', { deviceUserId, fingerIndex });
      } else {
        console.log('🔍 [DELETE] Obteniendo device_user_id de BD...');
        
        const response = await fetch(
          `/api/biometric/fingerprint?userId=${userId}&getDeviceId=true`,
          { method: 'GET' }
        );
        
        if (response.ok) {
          const fingerprintInfo = await response.json();
          deviceUserId = fingerprintInfo.device_user_id;
          fingerIndex = fingerprintInfo.finger_index;
          
          console.log('✅ [DELETE] Información obtenida:', {
            device_user_id: deviceUserId,
            finger_index: fingerIndex,
            finger_name: fingerprintInfo.finger_name
          });
        } else {
          console.warn('⚠️ [DELETE] No se pudo obtener device_user_id de BD');
        }
      }

      // Eliminar de BD
      console.log('💾 [DELETE] Eliminando de base de datos...');
      
      const dbResult = await deleteFingerprintFromDatabase(userId, fingerIndex || undefined);

      if (dbResult.success) {
        console.log('✅ [DELETE] Eliminado de BD exitosamente');
        
        // Eliminar del F22 si tenemos device_user_id
        if (deviceUserId) {
          try {
            console.log('🔄 [DELETE] Eliminando del F22...', {
              deviceUserId,
              userId,
              fingerIndex
            });
            
            const f22Result = await deleteFingerprintFromF22Service(
              deviceUserId.toString(),
              userId,
              fingerIndex || undefined
            );
            
            if (f22Result.success) {
              console.log('✅ [DELETE] Eliminación F22 exitosa');
              setFingerprintState(prev => ({
                ...prev,
                status: 'none',
                syncStatus: 'success',
                message: `✅ Huella eliminada completamente (BD + F22)\n${f22Result.deletedTemplates || 0} plantillas eliminadas del dispositivo`,
                deviceUserId: null,
                fingerIndex: null,
                fingerName: null,
                pendingData: null
              }));
              
              onSuccess?.('Huella eliminada exitosamente');
            } else {
              throw new Error(f22Result.error || 'Error eliminando del F22');
            }
            
          } catch (f22Error: any) {
            console.warn('⚠️ [DELETE] Error en F22 (BD ya limpio):', f22Error.message);
            setFingerprintState(prev => ({
              ...prev,
              status: 'none',
              syncStatus: 'error',
              error: `⚠️ Eliminada de BD pero error en F22: ${f22Error.message}`,
              deviceUserId: null,
              fingerIndex: null,
              fingerName: null,
              pendingData: null
            }));
            
            onError?.(f22Error.message);
          }
        } else {
          setFingerprintState(prev => ({
            ...prev,
            status: 'none',
            syncStatus: 'error',
            message: '⚠️ Eliminada de BD (sin device_user_id para F22)',
            deviceUserId: null,
            fingerIndex: null,
            fingerName: null,
            pendingData: null
          }));
        }

        onFingerprintChange?.(false);

      } else {
        throw new Error(dbResult.error || 'Error eliminando de BD');
      }
      
    } catch (error: any) {
      console.error('💥 [DELETE] Error crítico:', error);
      handleFingerprintError(`Error eliminando: ${error.message}`);
    } finally {
      setIsDeletingFingerprint(false);
      
      // Limpiar mensajes después de 8 segundos
      setTimeout(() => {
        if (mountedRef.current) {
          setFingerprintState(prev => ({
            ...prev,
            message: null,
            syncStatus: 'idle'
          }));
        }
      }, 8000);
    }
  }, [
    userId, 
    fingerprintState.pendingData, 
    deleteFingerprintFromDatabase, 
    deleteFingerprintFromF22Service, 
    handleFingerprintError, 
    onSuccess, 
    onError, 
    onFingerprintChange
  ]);

  // Función para eliminar todas las huellas
  const handleDeleteAllFingerprints = useCallback(async () => {
    if (!userId) {
      handleFingerprintError('Se requiere un usuario válido');
      return;
    }

    if (!window.confirm(
      '⚠️ ¿Eliminar TODAS las huellas?\n\n' +
      '• Se eliminarán de la base de datos\n' +
      '• Se eliminarán del dispositivo F22\n' +
      '• Esta acción no se puede deshacer'
    )) {
      return;
    }

    try {
      setIsDeletingFingerprint(true);
      setFingerprintState(prev => ({
        ...prev,
        error: null,
        message: null,
        syncStatus: 'syncing'
      }));

      console.log('🗑️ [DELETE-ALL] Iniciando eliminación completa para:', userId);

      // Obtener device_user_id
      let deviceUserId = fingerprintState.deviceUserId;
      
      if (!deviceUserId) {
        try {
          const response = await fetch(
            `/api/biometric/fingerprint?userId=${userId}&getDeviceId=true`,
            { method: 'GET' }
          );
          
          if (response.ok) {
            const data = await response.json();
            deviceUserId = data.device_user_id;
          }
        } catch {
          console.warn('⚠️ [DELETE-ALL] No se pudo obtener device_user_id');
        }
      }

      // Eliminar TODAS de BD
      console.log('💾 [DELETE-ALL] Eliminando todas las huellas de BD...');
      
      const dbResult = await deleteFingerprintFromDatabase(userId); // Sin fingerIndex

      if (dbResult.success) {
        console.log('✅ [DELETE-ALL] BD limpia');
        
        // Eliminar del F22
        if (deviceUserId) {
          try {
            const f22Result = await deleteFingerprintFromF22Service(
              deviceUserId.toString(),
              userId
              // Sin fingerIndex = eliminar todas
            );
            
            if (f22Result.success) {
              setFingerprintState({
                status: 'none',
                deviceUserId: null,
                fingerIndex: null,
                fingerName: null,
                message: `🎉 Limpieza completa exitosa!\n✅ BD: Todas eliminadas\n✅ F22: ${f22Result.deletedTemplates || 0} plantillas eliminadas`,
                error: null,
                syncStatus: 'success',
                pendingData: null
              });
              
              onSuccess?.('Todas las huellas eliminadas exitosamente');
            } else {
              throw new Error(f22Result.error);
            }
            
          } catch (f22Error: any) {
            setFingerprintState(prev => ({
              ...prev,
              status: 'none',
              syncStatus: 'error',
              error: `⚠️ BD limpia pero error en F22: ${f22Error.message}`,
              deviceUserId: null,
              fingerIndex: null,
              fingerName: null,
              pendingData: null
            }));
            
            onError?.(f22Error.message);
          }
        } else {
          setFingerprintState(prev => ({
            ...prev,
            status: 'none',
            message: '⚠️ BD limpia (sin device_user_id para F22)',
            deviceUserId: null,
            fingerIndex: null,
            fingerName: null,
            pendingData: null
          }));
        }

        onFingerprintChange?.(false);

      } else {
        throw new Error(dbResult.error);
      }
      
    } catch (error: any) {
      console.error('💥 [DELETE-ALL] Error:', error);
      handleFingerprintError(`Error: ${error.message}`);
    } finally {
      setIsDeletingFingerprint(false);
      
      setTimeout(() => {
        if (mountedRef.current) {
          setFingerprintState(prev => ({
            ...prev,
            message: null,
            syncStatus: 'idle'
          }));
        }
      }, 8000);
    }
  }, [
    userId, 
    fingerprintState.deviceUserId, 
    deleteFingerprintFromDatabase, 
    deleteFingerprintFromF22Service, 
    handleFingerprintError, 
    onSuccess, 
    onError, 
    onFingerprintChange
  ]);

  // Función para resetear estado de huella
  const resetFingerprintState = useCallback(() => {
    setFingerprintState({
      status: 'none',
      deviceUserId: null,
      fingerIndex: null,
      fingerName: null,
      message: null,
      error: null,
      syncStatus: 'idle',
      pendingData: null
    });
    
    setIsDeletingFingerprint(false);
    setFingerprintDialogOpen(false);
  }, []);

  // Función para actualizar estado con usuario existente
  const initializeWithFingerprint = useCallback((hasFingerprint: boolean) => {
    if (hasFingerprint) {
      setFingerprintState(prev => ({
        ...prev,
        status: 'saved'
      }));
    } else {
      resetFingerprintState();
    }
  }, [resetFingerprintState]);

  return {
    // Estado principal
    fingerprintState,
    isDeletingFingerprint,
    fingerprintDialogOpen,
    
    // Manejadores principales
    handleFingerprintDialogOpen,
    handleFingerprintDialogClose,
    handleFingerprintDataReady,
    handleDeleteFingerprint,
    handleDeleteAllFingerprints,
    
    // Funciones de procesamiento
    processPendingFingerprint,
    
    // Funciones de utilidad
    resetFingerprintState,
    initializeWithFingerprint,
    
    // Estados computados
    hasPendingFingerprint: fingerprintState.status === 'captured' && !!fingerprintState.pendingData,
    isSyncing: fingerprintState.syncStatus === 'syncing' || isDeletingFingerprint
  };
};