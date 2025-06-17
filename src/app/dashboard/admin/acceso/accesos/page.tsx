'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Card, CardContent, Divider, Chip, Badge, Tooltip, IconButton } from '@mui/material';
import { CheckCircle, Error, Fingerprint as FingerprintIcon, PersonSearch, Security, History, Info } from '@mui/icons-material';
import { green, red, blue, grey, orange } from '@mui/material/colors';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Datos del sistema actualizados
const CURRENT_DATE = '2025-06-17 15:26:36';
const CURRENT_USER = 'luishdz04';

export default function AccessVerificationPage() {
  // Estados
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'connecting' | 'ready' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Listo para verificar');
  const [deviceStatus, setDeviceStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastVerifiedUser, setLastVerifiedUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [fingerprintTemplates, setFingerprintTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStats, setVerificationStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    lastVerified: null as Date | null
  });
  const [debugInfo, setDebugInfo] = useState({
    lastCommand: '',
    lastResponse: '',
    lastTemplate: ''
  });
  
  // Referencias
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnecting = useRef(false);
  const manualDisconnect = useRef(false);
  const isComponentMounted = useRef(true);
  const supabase = createClientComponentClient();
  
  // Cargar huellas registradas desde Supabase
  const loadRegisteredFingerprints = useCallback(async () => {
    if (!isComponentMounted.current) return;
    
    try {
      setIsLoading(true);
      setMessage('Cargando huellas registradas...');
      
      const { data, error } = await supabase
        .from('fingerprint_templates')
        .select(`
          id, 
          user_id, 
          template, 
          primary_template,
          verification_template,
          finger_index, 
          finger_name, 
          average_quality,
          Users:user_id (id, name, email, whatsapp, membership_type)
        `);
        
      if (error) {
        console.error('Error cargando huellas:', error);
        setMessage(`Error cargando huellas: ${error.message}`);
        return;
      }
      
      const processedData = data?.map(fp => ({
        ...fp,
        user: fp.Users,
        Users: undefined
      })) || [];
      
      console.log(`✅ Cargadas ${processedData.length} huellas registradas`);
      
      if (isComponentMounted.current) {
        setFingerprintTemplates(processedData);
        setMessage(`${processedData.length} huellas registradas cargadas correctamente.`);
      }
      
    } catch (error) {
      console.error('Error cargando huellas:', error);
      if (isComponentMounted.current) {
        setMessage(`Error al cargar las huellas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
    }
  }, [supabase]);
  
  // Cargar logs de acceso
  const loadAccessLogs = useCallback(async () => {
    if (!isComponentMounted.current) return;
    
    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*, Users:user_id(*)')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error cargando logs:', error);
        return;
      }
      
      if (data && isComponentMounted.current) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  }, [supabase]);
  
  // Simulación de verificación de huella
  const simulateVerification = useCallback(async (capturedTemplate: string) => {
    try {
      console.log(`Simulando verificación contra ${fingerprintTemplates.length} huellas...`);
      
      if (fingerprintTemplates.length === 0) {
        return { success: false, message: 'No hay huellas registradas para comparar' };
      }
      
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        const randomIndex = Math.floor(Math.random() * fingerprintTemplates.length);
        const matchedFingerprint = fingerprintTemplates[randomIndex];
        
        return {
          success: true,
          user: matchedFingerprint.user,
          fingerprintId: matchedFingerprint.id,
          quality: matchedFingerprint.average_quality,
          finger: matchedFingerprint.finger_name,
          confidence: (Math.random() * 0.4 + 0.6).toFixed(2)
        };
      }
      
      return { 
        success: false, 
        message: 'Huella no reconocida en el sistema' 
      };
      
    } catch (error) {
      console.error('Error en verificación:', error);
      return { 
        success: false, 
        message: `Error en verificación: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      };
    }
  }, [fingerprintTemplates]);
  
  // Función para programar reconexión
  const scheduleReconnect = useCallback((delay = 3000) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (!isComponentMounted.current || manualDisconnect.current) {
      return;
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isComponentMounted.current && 
          deviceStatus !== 'connected' && 
          !isConnecting.current && 
          !manualDisconnect.current &&
          reconnectAttempts.current < 5) {
        console.log(`⏰ Ejecutando reconexión programada (intento ${reconnectAttempts.current + 1})`);
        connectWebSocket();
      }
    }, delay);
  }, [deviceStatus]); // Solo depende de deviceStatus
  
  // Función para conectar WebSocket - SIN DEPENDENCIAS COMPLEJAS
  const connectWebSocket = useCallback(() => {
    if (!isComponentMounted.current || isConnecting.current) {
      console.log('Conexión cancelada: componente desmontado o ya conectando');
      return;
    }
    
    isConnecting.current = true;
    manualDisconnect.current = false;
    
    // Limpiar conexión anterior
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error('Error al cerrar WebSocket:', e);
      }
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setVerificationStatus('connecting');
    setMessage('Conectando al lector de huellas...');
    
    try {
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!isComponentMounted.current) return;
        
        console.log('✅ WebSocket conectado exitosamente');
        setDeviceStatus('connected');
        setVerificationStatus('ready');
        setMessage('Lector conectado. Listo para verificar huellas.');
        reconnectAttempts.current = 0;
        isConnecting.current = false;
        
        // Enviar ping inicial
        try {
          ws.send(JSON.stringify({ 
            type: 'ping',
            source: 'access_verification_page',
            timestamp: new Date().toISOString(),
            user: CURRENT_USER
          }));
          
          ws.send(JSON.stringify({ 
            type: 'get_device_status',
            source: 'access_verification_page',
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error enviando mensaje inicial:', error);
        }
        
        // Cargar huellas después de conectar
        loadRegisteredFingerprints();
      };
      
      ws.onmessage = async (event) => {
        if (!isComponentMounted.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('📥 Mensaje recibido:', data);
          setDebugInfo(prev => ({...prev, lastResponse: JSON.stringify(data, null, 2)}));
          
          // Manejar diferentes tipos de mensajes
          if (data.type === 'pong') {
            console.log('Conexión activa confirmada');
          }
          else if (data.type === 'device_status') {
            const isConnected = data.data?.connected || data.connected || false;
            setDeviceStatus(isConnected ? 'connected' : 'disconnected');
            setMessage(isConnected 
              ? `Dispositivo ZKTeco conectado y listo. ${fingerprintTemplates.length} huellas cargadas.` 
              : 'Dispositivo desconectado. Reconectando...');
          }
          else if (data.type === 'capture_result' && data.success) {
            // Para modo captura normal (no verificación)
            const capturedTemplate = data.data?.template;
            
            if (!capturedTemplate) {
              setVerificationStatus('error');
              setMessage('Error: No se pudo obtener el template de la huella');
              
              setTimeout(() => {
                if (isComponentMounted.current) {
                  setVerificationStatus('ready');
                  setMessage('Listo para verificar');
                }
              }, 2000);
              return;
            }
            
            // En modo verificación, el servidor debería enviar verification_result
            console.log('⚠️ Recibido capture_result en modo verificación - verificar configuración del servidor');
          }
          else if (data.type === 'verification_result') {
            // Resultado de verificación REAL del servidor
            console.log('✅ Resultado de verificación recibido:', data);
            
            if (data.verified) {
              // ACCESO PERMITIDO - Verificación exitosa
              const userData = data.data.user;
              
              setVerificationStatus('success');
              setLastVerifiedUser(userData);
              setMessage(`ACCESO PERMITIDO: ${userData.name || 'Usuario'}`);
              
              setVerificationStats(prev => ({
                ...prev,
                total: prev.total + 1,
                successful: prev.successful + 1,
                lastVerified: new Date()
              }));
              
              // Registrar acceso exitoso
              await supabase
                .from('access_logs')
                .insert({
                  user_id: userData.id,
                  access_type: 'entry',
                  access_method: 'fingerprint',
                  success: true,
                  confidence_score: parseFloat(data.data.matchScore || 0.85),
                  membership_status: userData.membership_type || 'active',
                  device_info: {
                    name: 'ZKTeco-9500',
                    location: 'Entrada Principal',
                    verification_quality: data.data.quality || 85,
                    finger: data.data.fingerName,
                    match_confidence: data.data.confidence,
                    verification_method: data.data.verificationMethod
                  }
                });
              
              // Recargar logs
              loadAccessLogs();
              
              setTimeout(() => {
                if (isComponentMounted.current) {
                  setVerificationStatus('ready');
                  setMessage(`Lector listo. ${fingerprintTemplates.length} huellas registradas.`);
                }
              }, 3000);
              
            } else {
              // ACCESO DENEGADO - No hay coincidencia
              setVerificationStatus('error');
              setMessage(`ACCESO DENEGADO: ${data.data?.message || 'Huella no reconocida'}`);
              
              setVerificationStats(prev => ({
                ...prev,
                total: prev.total + 1,
                failed: prev.failed + 1,
                lastVerified: new Date()
              }));
              
              // Registrar intento fallido
              await supabase
                .from('access_logs')
                .insert({
                  user_id: null,
                  access_type: 'denied',
                  access_method: 'fingerprint',
                  success: false,
                  confidence_score: 0,
                  denial_reason: data.data?.message || 'Huella no reconocida',
                  device_info: {
                    name: 'ZKTeco-9500',
                    location: 'Entrada Principal',
                    total_compared: data.data?.totalCompared || 0
                  }
                });
              
              setTimeout(() => {
                if (isComponentMounted.current) {
                  setVerificationStatus('ready');
                  setMessage('Listo para verificar');
                }
              }, 2000);
            }
          }
          else if (data.type === 'error' || data.type === 'command_error') {
            console.error('Error desde ZK-Access-Agent:', data.message);
            setMessage(`Error: ${data.message || 'Error desconocido'}`);
            setVerificationStatus('error');
            
            setTimeout(() => {
              if (isComponentMounted.current) {
                setVerificationStatus('ready');
                setMessage('Listo para verificar');
              }
            }, 2000);
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        isConnecting.current = false;
        
        if (!isComponentMounted.current) return;
        
        setDeviceStatus('error');
        setVerificationStatus('error');
        setMessage('Error de conexión con el lector. Verifica que ZK-Access-Agent esté ejecutándose.');
        
        if (!manualDisconnect.current && reconnectAttempts.current < 5) {
          reconnectAttempts.current++;
          const delay = Math.min(30000, reconnectAttempts.current * 2000 + 1000);
          console.log(`Reintentando en ${delay/1000} segundos...`);
          scheduleReconnect(delay);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket desconectado (código: ${event.code})`);
        isConnecting.current = false;
        
        if (!isComponentMounted.current) return;
        
        const isAbnormalClosure = event.code !== 1000 && event.code !== 1001;
        
        if (!manualDisconnect.current && isAbnormalClosure && reconnectAttempts.current < 5) {
          setDeviceStatus('disconnected');
          setMessage('Conexión perdida. Reconectando...');
          setVerificationStatus('error');
          
          reconnectAttempts.current++;
          const delay = Math.min(30000, reconnectAttempts.current * 3000 + 2000);
          scheduleReconnect(delay);
        } else {
          setDeviceStatus('disconnected');
          setMessage('Desconectado del lector');
        }
      };
      
    } catch (error) {
      console.error('Error al crear WebSocket:', error);
      isConnecting.current = false;
      
      if (!isComponentMounted.current) return;
      
      setDeviceStatus('error');
      setVerificationStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [loadRegisteredFingerprints, simulateVerification, fingerprintTemplates.length, loadAccessLogs, scheduleReconnect]);
  
  // Desconexión manual
  const disconnectWebSocket = useCallback(() => {
    manualDisconnect.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "Cierre manual");
        wsRef.current = null;
      } catch (e) {
        console.error('Error al cerrar WebSocket:', e);
      }
    }
    
    setDeviceStatus('disconnected');
    setVerificationStatus('idle');
    setMessage('Desconectado del lector');
  }, []);
  
  // Iniciar verificación
  const startFingerVerification = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setVerificationStatus('scanning');
      setMessage('Coloca tu dedo en el lector...');
      
      const captureMessage = { 
        type: 'capture_fingerprint',
        userId: 'verification_scan',
        userName: 'Verificación de Acceso',
        fingerIndex: 1,
        options: {
          timeout: 15000,
          qualityThreshold: 60
        },
        client_info: {
          client_id: 'access_verification_page',
          location: 'Entrada Principal',
          timestamp: new Date().toISOString(),
          user: CURRENT_USER,
          mode: 'verification'
        }
      };
      
      try {
        wsRef.current.send(JSON.stringify(captureMessage));
        setDebugInfo(prev => ({...prev, lastCommand: 'capture_fingerprint'}));
      } catch (error) {
        console.error('Error enviando comando:', error);
        setVerificationStatus('error');
        setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } else {
      setMessage('Error: Lector no conectado');
      setVerificationStatus('error');
      
      if (!isConnecting.current) {
        reconnectAttempts.current = 0;
        connectWebSocket();
      }
    }
  }, [connectWebSocket]);
  
  // Probar conexión
  const testConnection = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const testMessage = { 
        type: 'test_connection',
        timestamp: new Date().toISOString(),
        client: 'access_verification_page'
      };
      
      try {
        wsRef.current.send(JSON.stringify(testMessage));
        setDebugInfo(prev => ({...prev, lastCommand: 'test_connection'}));
        setMessage('Probando conexión con el lector...');
      } catch (error) {
        console.error('Error:', error);
        setMessage(`Error: ${error instanceof Error ? error.message : 'Error al enviar comando'}`);
      }
    } else {
      setMessage('Error: WebSocket no conectado');
      
      if (!isConnecting.current) {
        reconnectAttempts.current = 0;
        connectWebSocket();
      }
    }
  }, [connectWebSocket]);
  
  // Recargar huellas
  const reloadFingerprints = useCallback(() => {
    setFingerprintTemplates([]);
    loadRegisteredFingerprints();
  }, [loadRegisteredFingerprints]);
  
  // Efecto para conectar al montar - CORREGIDO PARA EVITAR BUCLES
  useEffect(() => {
    isComponentMounted.current = true;
    
    // Conectar una sola vez al montar
    connectWebSocket();
    
    // Cargar logs iniciales
    loadAccessLogs();
    
    // Cleanup al desmontar
    return () => {
      isComponentMounted.current = false;
      manualDisconnect.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "Componente desmontado");
          wsRef.current = null;
        } catch (e) {
          console.error('Error al cerrar WebSocket:', e);
        }
      }
    };
  }, []); // Array vacío - solo ejecutar al montar
  
  // Componentes auxiliares locales
  const RefreshButton = ({ onRefresh, isConnected }: { onRefresh: () => void, isConnected: boolean }) => (
    <Button 
      size="small" 
      variant="outlined"
      onClick={() => {
        if (isConnected) {
          disconnectWebSocket();
          setTimeout(() => {
            reconnectAttempts.current = 0;
            onRefresh();
          }, 1000);
        } else {
          reconnectAttempts.current = 0;
          onRefresh();
        }
      }}
      color={isConnected ? "success" : "primary"}
      sx={{ minWidth: 'auto', p: '4px 8px' }}
    >
      {isConnected ? "Conectado ✓" : "Reconectar"}
    </Button>
  );
  
  const AccessLogItem = ({ log }: { log: any }) => (
    <Box sx={{ p: 1.5, borderBottom: `1px solid ${grey[200]}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="subtitle2">
          {log.Users?.name || 'Usuario desconocido'}
        </Typography>
        <Chip 
          size="small" 
          label={log.success ? "Permitido" : "Denegado"} 
          color={log.success ? "success" : "error"}
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {new Date(log.created_at).toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FingerprintIcon sx={{ fontSize: 14 }} /> 
        {log.access_method} • {log.access_type}
      </Typography>
    </Box>
  );
  
  // Renderizar estado de verificación
  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'connecting':
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>Conectando al lector...</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Intento {reconnectAttempts.current + 1} de conexión
            </Typography>
          </Box>
        );
      
      case 'scanning':
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <CircularProgress size={60} sx={{ color: blue[500] }} />
            <Typography variant="h6" sx={{ mt: 2 }}>Escaneando huella...</Typography>
            <Typography variant="body2" color="text.secondary">
              Coloca tu dedo en el lector ZKTeco
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Verificando contra {fingerprintTemplates.length} huellas registradas
            </Typography>
          </Box>
        );
      
      case 'success':
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <CheckCircle sx={{ fontSize: 60, color: green[500] }} />
            <Typography variant="h6" sx={{ mt: 2 }}>¡Acceso Permitido!</Typography>
            {lastVerifiedUser && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1">{lastVerifiedUser.name}</Typography>
                <Typography variant="body2">{lastVerifiedUser.email}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={lastVerifiedUser.membership_type || 'Miembro'} 
                    color="primary" 
                    sx={{ mr: 1 }}
                  />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Acceso verificado a las {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      case 'error':
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Error sx={{ fontSize: 60, color: red[500] }} />
            <Typography variant="h6" sx={{ mt: 2 }}>Acceso Denegado</Typography>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }} 
              onClick={() => {
                reconnectAttempts.current = 0;
                connectWebSocket();
              }}
              disabled={isConnecting.current}
            >
              Reintentar Conexión
            </Button>
          </Box>
        );
      
      default: // 'idle' o 'ready'
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <FingerprintIcon sx={{ fontSize: 60, color: deviceStatus === 'connected' ? blue[500] : grey[500] }} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {deviceStatus === 'connected' ? 'Lector Listo' : 'Lector Desconectado'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            
            {isLoading && (
              <CircularProgress size={24} sx={{ mb: 2 }} />
            )}
            
            {deviceStatus === 'connected' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Coloca tu dedo en el lector para verificar si está registrado">
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    startIcon={<FingerprintIcon />}
                    onClick={startFingerVerification}
                    disabled={verificationStatus !== 'ready' || isLoading || fingerprintTemplates.length === 0}
                    sx={{ minWidth: 200 }}
                  >
                    Verificar Acceso
                  </Button>
                </Tooltip>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {fingerprintTemplates.length} huellas registradas en el sistema
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="info"
                    onClick={testConnection}
                    startIcon={<Security fontSize="small" />}
                  >
                    Probar Conexión
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    onClick={reloadFingerprints}
                    startIcon={<PersonSearch fontSize="small" />}
                    disabled={isLoading}
                  >
                    Recargar Huellas
                  </Button>
                </Box>
              </Box>
            )}
            
            {deviceStatus !== 'connected' && (
              <Button 
                variant="outlined" 
                onClick={() => {
                  reconnectAttempts.current = 0;
                  connectWebSocket();
                }}
                disabled={isConnecting.current}
                sx={{ minWidth: 200 }}
              >
                Conectar Lector
              </Button>
            )}
            
            {isConnecting.current && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Conexión en proceso...
              </Typography>
            )}
          </Box>
        );
    }
  };
  
  // UI Principal
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Verificación de Acceso por Huella
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Panel de verificación */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: '1 1 350px',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${grey[200]}`, bgcolor: 'background.paper' }}>
            <Typography variant="h6">
              Verificación de Acceso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control de Acceso por Huella Digital
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderVerificationStatus()}
          </Box>
          
          <Box sx={{ p: 2, bgcolor: grey[50], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Estado: {deviceStatus === 'connected' ? 'Conectado' : (isConnecting.current ? 'Conectando...' : 'Desconectado')}
              </Typography>
              
              {verificationStats.total > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip 
                    size="small" 
                    label={`Total: ${verificationStats.total}`} 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    size="small" 
                    color="success"
                    label={`Éxito: ${verificationStats.successful}`} 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    size="small" 
                    color="error"
                    label={`Fallo: ${verificationStats.failed}`} 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              )}
            </Box>
            
            <RefreshButton 
              onRefresh={connectWebSocket}
              isConnected={deviceStatus === 'connected'}
            />
          </Box>
        </Paper>
        
        {/* Historial de accesos */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: '1 1 350px',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${grey[200]}`, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Historial de Accesos Recientes
            </Typography>
            <Badge badgeContent={logs.length} color="primary" max={99}>
              <History />
            </Badge>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {logs.length > 0 ? (
              logs.map(log => (
                <AccessLogItem key={log.id} log={log} />
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay registros de acceso recientes
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ p: 2, bgcolor: grey[50] }}>
            <Button 
              variant="text" 
              size="small"
              onClick={loadAccessLogs}
              startIcon={<History fontSize="small" />}
            >
              Actualizar Historial
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Panel de información */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Información del Sistema de Verificación
            </Typography>
            
            <Tooltip title="Información de huellas registradas">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FingerprintIcon color="primary" />
                <Typography variant="body2" color="primary.main">
                  {fingerprintTemplates.length} huellas registradas
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="subtitle2" gutterBottom>
                Funcionamiento del Sistema
              </Typography>
              <Typography variant="body2">
                • El sistema verifica si la huella escaneada coincide con alguna registrada en la base de datos
              </Typography>
              <Typography variant="body2">
                • Se captura la huella y se compara con los templates almacenados en fingerprint_templates
              </Typography>
              <Typography variant="body2">
                • Los accesos permitidos y denegados quedan registrados en access_logs
              </Typography>
              <Typography variant="body2">
                • Si tienes problemas, usa el botón "Probar Conexión" para verificar la comunicación
              </Typography>
            </Box>
            
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="subtitle2" gutterBottom>
                Huellas Registradas
              </Typography>
              
              {fingerprintTemplates.length > 0 ? (
                fingerprintTemplates.slice(0, 2).map((fp, index) => (
                  <Box key={fp.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <b>{fp.user?.name}</b> - {fp.finger_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Calidad: {fp.average_quality}% • ID: {fp.id.substring(0, 8)}...
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">
                  No hay huellas registradas o están cargando...
                </Typography>
              )}
              
              {fingerprintTemplates.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  ... y {fingerprintTemplates.length - 2} más
                </Typography>
              )}
            </Box>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Última actualización: {CURRENT_DATE} por {CURRENT_USER}
            </Typography>
            
            <Tooltip title="Información de depuración">
              <IconButton size="small" color="info">
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}