'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardActionArea,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  Avatar,
  Divider
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  TouchApp as TouchAppIcon,
  CloudSync as CloudSyncIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Timer as TimerIcon,
  TrendingUp as QualityIcon,
  Done as DoneIcon,
  Replay as ReplayIcon,
  Timeline as ProgressIcon,
  LooksOne as OneIcon,
  LooksTwo as TwoIcon,
  Looks3 as ThreeIcon,
  CameraAlt as CaptureIcon,
  Merge as MergeIcon,
  Save as SaveIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

// ✅ IMPORTAR TOKENS CENTRALES DEL TEMA
import { colorTokens } from '@/theme';

// 🖐️ CONFIGURACIÓN DE DEDOS
const FINGER_CONFIG = [
  { id: 1, name: 'Pulgar Derecho', hand: 'right', finger: 'thumb', icon: '👍' },
  { id: 2, name: 'Índice Derecho', hand: 'right', finger: 'index', icon: '☝️' },
  { id: 3, name: 'Medio Derecho', hand: 'right', finger: 'middle', icon: '🖕' },
  { id: 4, name: 'Anular Derecho', hand: 'right', finger: 'ring', icon: '💍' },
  { id: 5, name: 'Meñique Derecho', hand: 'right', finger: 'pinky', icon: '🤏' },
  { id: 6, name: 'Pulgar Izquierdo', hand: 'left', finger: 'thumb', icon: '👍' },
  { id: 7, name: 'Índice Izquierdo', hand: 'left', finger: 'index', icon: '☝️' },
  { id: 8, name: 'Medio Izquierdo', hand: 'left', finger: 'middle', icon: '🖕' },
  { id: 9, name: 'Anular Izquierdo', hand: 'left', finger: 'ring', icon: '💍' },
  { id: 10, name: 'Meñique Izquierdo', hand: 'left', finger: 'pinky', icon: '🤏' }
];

// 📊 ESTADOS DEL PROCESO
const PROCESS_STEPS = [
  { 
    id: 'selection', 
    label: 'Seleccionar Dedo', 
    description: 'Elija qué dedo desea registrar',
    icon: <TouchAppIcon />,
    color: colorTokens.info
  },
  { 
    id: 'preparation', 
    label: 'Preparación', 
    description: 'Preparando para captura múltiple',
    icon: <ProgressIcon />,
    color: colorTokens.warning
  },
  {
    id: 'capture1',
    label: 'Plantilla Principal',
    description: 'Capturando primera plantilla biométrica',
    icon: <OneIcon />,
    color: colorTokens.brand
  },
  {
    id: 'capture2',
    label: 'Plantilla de Verificación',
    description: 'Capturando segunda plantilla biométrica',
    icon: <TwoIcon />,
    color: colorTokens.info
  },
  {
    id: 'capture3',
    label: 'Plantilla de Respaldo',
    description: 'Capturando tercera plantilla biométrica',
    icon: <ThreeIcon />,
    color: colorTokens.warning
  },
  { 
    id: 'processing', 
    label: 'Procesando', 
    description: 'Combinando templates biométricos',
    icon: <MergeIcon />,
    color: colorTokens.info
  },
  { 
    id: 'ready', 
    label: 'Datos Listos', 
    description: 'Huella preparada para guardar',
    icon: <PreviewIcon />,
    color: colorTokens.success
  }
];

// 🔗 INTERFACES
interface FingerprintRegistrationProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fingerprint: boolean;
  };
  userType: 'empleado' | 'cliente';
  onFingerprintDataReady: (fingerprintData: any) => void;
  onError: (message: string) => void;
}

interface WebSocketMessage {
  type: string;
  status?: string;
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
  progress?: number;
  timestamp?: string;
  serverInfo?: any;
  clientId?: string;
}

interface CaptureResult {
  success: boolean;
  template: string;
  templateSize: number;
  quality: string;
  qualityScore: number;
  captureTime: number;
  fingerprintId: string;
}

// 🚀 COMPONENTE PRINCIPAL
export default function FingerprintRegistration({
  open,
  onClose,
  user,
  userType,
  onFingerprintDataReady,
  onError
}: FingerprintRegistrationProps) {
  // 📊 Estados principales
  const [currentStep, setCurrentStep] = useState<string>('selection');
  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔄 Estados de captura múltiple
  const [currentCapture, setCurrentCapture] = useState<number>(0);
  const [captureResults, setCaptureResults] = useState<CaptureResult[]>([]);
  const [finalQuality, setFinalQuality] = useState<number | null>(null);
  const [combinedTemplate, setCombinedTemplate] = useState<any>(null);
  
  // 🌐 Estados de WebSocket
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnecting, setWsReconnecting] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  
  // ⏱️ Estados de tiempo
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [captureStartTime, setCaptureStartTime] = useState(0);
  
  // 🔗 Referencias
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationRef = useRef(false);
  const selectedFingerRef = useRef<number | null>(null);
  
  // ✅ Refs para funciones que cambian frecuentemente (optimización)
  const startSingleCaptureRef = useRef<((captureNumber: number) => void) | null>(null);
  const processFinalTemplateRef = useRef<(() => void) | null>(null);
  const stopTimersRef = useRef<(() => void) | null>(null);
  const handleWebSocketMessageRef = useRef<((message: WebSocketMessage) => void) | null>(null);
  
  // 🎯 CONFIGURACIÓN WEBSOCKET
  const WS_URL = process.env.NEXT_PUBLIC_F22_WEBSOCKET_URL || 'ws://127.0.0.1:9000/ws/';
  const RECONNECT_INTERVAL = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  // ⏱️ FUNCIONES DE TIMER OPTIMIZADAS
  const startTotalTimer = useCallback(() => {
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
    }
    totalTimerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  }, []);
  
  // ✅ Actualizar ref cuando stopTimers cambie
  useEffect(() => {
    stopTimersRef.current = stopTimers;
  }, [stopTimers]);

  // 🔄 REINICIAR PROCESO
  const resetProcess = useCallback(() => {
    console.log('🔄 Reiniciando proceso...');
    setCurrentStep('selection');
    setSelectedFinger(null);
    selectedFingerRef.current = null;
    setProgress(0);
    setMessage('');
    setError(null);
    setCurrentCapture(0);
    setCaptureResults([]);
    setFinalQuality(null);
    setCombinedTemplate(null);
    setElapsedTime(0);
    setTotalTime(0);
    setIsProcessing(false);
    stopTimers();
  }, [stopTimers]);

  // 🚪 CERRAR MODAL
  const handleClose = useCallback(() => {
    console.log('🚪 Cerrando modal...');
    initializationRef.current = false;
    resetProcess();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Closing fingerprint registration');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setWsConnected(false);
    setWsReconnecting(false);
    setDeviceConnected(false);
    setWsError(null);
    
    onClose();
  }, [resetProcess, onClose]);

  // ✅ FUNCIÓN PARA OBTENER SIGUIENTE ID SECUENCIAL
  const getNextDeviceUserId = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch(`/api/biometric/get-next-device-id?userType=${userType}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Siguiente ID secuencial:', data.nextId);
        return data.nextId;
      }
    } catch (error) {
      console.error('❌ Error obteniendo ID:', error);
    }
    
    // Fallback respetando rangos por tipo de usuario
    const fallbackRanges = {
      empleado: 7000,
      cliente: 1,
      administrador: 8000
    };
    return Math.floor(Math.random() * 20) + (fallbackRanges[userType] || 1);
  }, [userType]);

  // ✅ CONFIRMAR DATOS DE HUELLA
  const confirmFingerprintData = useCallback(async () => {
    if (!combinedTemplate || !selectedFingerRef.current) {
      setError('No hay datos de huella para confirmar');
      return;
    }

    console.log('✅ Obteniendo ID secuencial...');
    
    // OBTENER ID SECUENCIAL DEL API
    const deviceUserId = await getNextDeviceUserId();
    
    console.log('🔢 Device User ID secuencial asignado:', deviceUserId);
    
    const fingerprintData = {
      user_id: user.id,
      finger_index: selectedFingerRef.current,
      finger_name: FINGER_CONFIG.find(f => f.id === selectedFingerRef.current)?.name || 'Desconocido',
      
      template: combinedTemplate.primary.template,
      primary_template: combinedTemplate.primary.template,
      verification_template: combinedTemplate.verification.template,
      backup_template: combinedTemplate.backup.template,
      combined_template: combinedTemplate,
      
      average_quality: Math.round(combinedTemplate.averageQuality),
      capture_count: 3,
      capture_time_ms: combinedTemplate.totalCaptureTime * 1000,
      
      device_user_id: deviceUserId, // ID SECUENCIAL (1, 2, 3, 4...)
      
      device_info: {
        deviceType: 'ZKTeco',
        captureMethod: 'multiple_capture',
        totalCaptures: 3,
        wsConnection: WS_URL.replace('ws://', '').replace('wss://', ''),
        deviceUserId: deviceUserId,
        qualities: [
          combinedTemplate.primary.qualityScore,
          combinedTemplate.verification.qualityScore,
          combinedTemplate.backup.qualityScore
        ],
        capturedBy: 'luishdz044',
        capturedAt: new Date().toISOString()
      }
    };
    
    console.log('📤 Enviando datos con ID secuencial:', deviceUserId);
    
    onFingerprintDataReady(fingerprintData);
    handleClose();
    
  }, [combinedTemplate, user, getNextDeviceUserId, onFingerprintDataReady, handleClose]);

  const processFinalTemplate = useCallback(() => {
    setCurrentStep('processing');
    setMessage('Combinando templates biométricos...');
    setProgress(0);
    
    setCaptureResults(currentResults => {
      console.log('🔄 Procesando templates finales:', currentResults);
      
      if (currentResults.length !== 3) {
        console.error('❌ Error: Se esperaban 3 capturas, se recibieron:', currentResults.length);
        setError('Error en el proceso de captura múltiple');
        setIsProcessing(false);
        setCurrentStep('selection');
        return currentResults;
      }
      
      const processInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(processInterval);
            
            const avgQuality = currentResults.reduce((sum, result) => sum + result.qualityScore, 0) / currentResults.length;
            setFinalQuality(Math.round(avgQuality));
            
            const combinedTemplateData = {
              primary: currentResults[0],
              verification: currentResults[1], 
              backup: currentResults[2],
              averageQuality: avgQuality,
              totalCaptureTime: totalTime,
              combinedAt: new Date().toISOString()
            };
            
            setCombinedTemplate(combinedTemplateData);
            setCurrentStep('ready');
            setMessage('¡Datos de huella listos! Presione "Confirmar" para agregar al formulario.');
            setIsProcessing(false);
            
            // Usar ref en lugar de dependencia directa
            stopTimersRef.current?.();
            
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      return currentResults;
    });
  }, [totalTime]);
  
  // ✅ Actualizar ref cuando processFinalTemplate cambie
  useEffect(() => {
    processFinalTemplateRef.current = processFinalTemplate;
  }, [processFinalTemplate]);

  const startSingleCapture = useCallback((captureNumber: number) => {
    console.log(`🚀 Iniciando captura de plantilla ${captureNumber}/3`);

    const fingerIndex = selectedFingerRef.current || selectedFinger;
    if (!fingerIndex) {
      console.error('❌ No hay dedo seleccionado');
      setError('Error: Se perdió la selección del dedo');
      setIsProcessing(false);
      setCurrentStep('selection');
      stopTimersRef.current?.();
      return;
    }

    setCurrentCapture(captureNumber - 1);
    setCurrentStep(`capture${captureNumber}`);
    setMessage(`Coloque el dedo en el sensor - Plantilla ${captureNumber}/3`);
    setProgress(0);
    setCaptureStartTime(Date.now());
    
    // ✅ FORMATO CORRECTO COMPATIBLE CON EL SERVIDOR
    const captureCommand = {
      type: 'capture_fingerprint',
      data: { // ✅ CRÍTICO: Anidar los datos para compatibilidad con el backend
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        fingerIndex: fingerIndex,
        captureNumber: captureNumber,
        options: {
          timeout: 15000,
          qualityThreshold: 60
        },
        client_info: {
          client_id: `fingerprint_registration_${user.id}`,
          location: 'Registro de Usuario',
          timestamp: new Date().toISOString(),
          mode: 'enrollment',
          capture_number: captureNumber,
          total_captures: 3
        }
      }
    };

    console.log(`📤 Enviando comando para plantilla ${captureNumber}/3:`, captureCommand);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(captureCommand));
      } else {
        throw new Error('WebSocket no está conectado');
      }
    } catch (error) {
      console.error('❌ Error enviando comando:', error);
      setError('Error de comunicación con el sensor');
      setIsProcessing(false);
      setCurrentStep('selection');
      stopTimersRef.current?.();
    }
  }, [selectedFinger, user]);
  
  // ✅ Actualizar ref cuando startSingleCapture cambie
  useEffect(() => {
    startSingleCaptureRef.current = startSingleCapture;
  }, [startSingleCapture]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 Mensaje recibido:', message);
    
    switch (message.type) {
      case 'welcome':
        console.log('🎉 Conectado al ZK Access Agent');
        
        const isDeviceConnected = message.data?.deviceConnected === true;
        
        console.log(`📱 Estado del dispositivo: ${isDeviceConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
        
        setDeviceConnected(isDeviceConnected);
        
        if (isDeviceConnected) {
          setWsError(null);
          console.log('🎯 Sistema listo para captura de huellas');
        } else {
          setWsError('Dispositivo ZKTeco no conectado al servidor');
          console.log('⚠️ Dispositivo ZKTeco no disponible para captura');
        }
        break;
        
      case 'capture_status':
        if (message.data) {
          setMessage(message.data.message || '');
          setProgress(message.data.progress || 0);
        }
        break;
        
      case 'capture_result':
      case 'fingerprint_captured':  // ✅ Agregar caso alternativo del servidor
        // ✅ Soportar múltiples formatos de respuesta
        const captureData = message.data?.data || message.data;
        const isSuccess = message.data?.success !== false && message.success !== false;
        
        if (isSuccess && captureData && (captureData.template || captureData.fingerprintData)) {
          const qualityMap: { [key: string]: number } = {
            'excellent': 98, 'very_good': 92, 'good': 85, 'fair': 75, 'poor': 50
          };
          
          // ✅ Extraer datos del template (soportar múltiples formatos)
          const templateData = captureData.fingerprintData || captureData;
          const quality = templateData.quality || 'good';
          const qualityScore = qualityMap[quality.toLowerCase()] || 85;
          
          const captureResult: CaptureResult = {
            success: true,
            template: templateData.template || templateData.templateData,
            templateSize: templateData.templateSize || templateData.size || 0,
            quality: quality,
            qualityScore: qualityScore,
            captureTime: Date.now() - captureStartTime,
            fingerprintId: templateData.fingerprintId || templateData.id || `fp_${Date.now()}`
          };
          
          console.log(`✅ Plantilla ${currentCapture + 1}/3 capturada exitosamente - Calidad: ${qualityScore}%`, captureResult);

          setCaptureResults(prev => {
            const newResults = [...prev, captureResult];
            const capturesCompleted = newResults.length;

            console.log(`📊 Plantillas completadas: ${capturesCompleted}/3`);

            // ✅ Usar refs para evitar dependencias
            setTimeout(() => {
              if (capturesCompleted < 3) {
                console.log(`🔄 Iniciando captura de plantilla ${capturesCompleted + 1}/3`);
                startSingleCaptureRef.current?.(capturesCompleted + 1);
              } else {
                console.log('🎊 Todas las plantillas capturadas - Procesando y combinando templates');
                processFinalTemplateRef.current?.();
              }
            }, capturesCompleted < 3 ? 1500 : 500);

            return newResults;
          });
          
        } else {
          // ✅ LÓGICA DE ERROR MEJORADA
          const errorPayload = message.data || message;
          const errorMsg = errorPayload.error || (typeof errorPayload === 'string' ? errorPayload : 'Error en captura de huella');
          
          console.error('❌ Fallo en el proceso de captura reportado por el servidor.');
          console.error('   Mensaje:', errorMsg);
          console.error('   Payload completo:', message);

          setError(`Fallo del sensor: ${errorMsg}`);
          setIsProcessing(false);
          setCurrentStep('selection');
          stopTimersRef.current?.();
        }
        break;
        
      case 'ping':
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            action: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
        break;
        
      case 'error':
      case 'command_error':
        console.error('❌ Error del servidor:', message.data?.error || message.message || message.error);
        setError(message.data?.error || message.message || message.error || 'Error de comunicación');
        setIsProcessing(false);
        setCurrentStep('selection');
        stopTimersRef.current?.();
        break;
        
      default:
        console.log('📝 Mensaje no manejado:', message.type);
    }
  }, [captureStartTime, currentCapture]);
  
  // ✅ Actualizar ref cuando handleWebSocketMessage cambie
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  // ✅ HELPER: Cerrar WebSocket existente de forma segura
  const closeExistingWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 Cerrando WebSocket existente...');
      try {
        if (wsRef.current.readyState === WebSocket.OPEN ||
            wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Closing before new connection');
        }
      } catch (error) {
        console.error('Error cerrando WebSocket:', error);
      }
      wsRef.current = null;
    }
  }, []);

  // ✅ FUNCIÓN SIMPLIFICADA PARA RECONECTAR MANUALMENTE (SOLO PARA BOTÓN DE ERROR)
  const connectWebSocket = useCallback(() => {
    // ✅ CERRAR CONEXIÓN EXISTENTE ANTES DE CREAR NUEVA
    closeExistingWebSocket();

    try {
      console.log('🔌 Reconectando manualmente a ZK Access Agent...');
      setWsReconnecting(true);
      setWsError(null);
      reconnectAttemptsRef.current = 0;

      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket reconectado al ZK Access Agent');
        setWsConnected(true);
        setWsReconnecting(false);
        setWsError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // ✅ USAR REF en lugar de función directa
          handleWebSocketMessageRef.current?.(message);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setWsConnected(false);
        setWsReconnecting(false);
        setDeviceConnected(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setWsError('Error de conexión con el sensor biométrico');
        setWsConnected(false);
        setWsReconnecting(false);
        setDeviceConnected(false);
      };
      
    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      setWsError('No se pudo conectar al sensor biométrico');
      setWsReconnecting(false);
    }
  }, [closeExistingWebSocket]);

  // ✅ FUNCIÓN DE INICIO SIMPLIFICADA
  const startMultipleCaptureProcess = useCallback(() => {
    const fingerIndex = selectedFingerRef.current || selectedFinger;
    if (!fingerIndex || !wsConnected || !deviceConnected) {
      setError('Seleccione un dedo y verifique la conexión del dispositivo');
      return;
    }
    
    console.log('🚀 Iniciando proceso de captura de 3 plantillas biométricas con dedo:', fingerIndex);

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setElapsedTime(0);
    setTotalTime(0);
    setCurrentCapture(0);
    setCaptureResults([]);
    setFinalQuality(null);
    setCombinedTemplate(null);
    
    setCurrentStep('preparation');
    setMessage('Preparando para captura de 3 plantillas biométricas...');

    startTotalTimer();

    setTimeout(() => {
      startSingleCapture(1);
    }, 2000);
    
  }, [selectedFinger, wsConnected, deviceConnected, startTotalTimer, startSingleCapture]);

  // ✅ useEffect para inicialización - SIN DEPENDENCIA DE handleWebSocketMessage
  useEffect(() => {
    if (open && !initializationRef.current) {
      console.log('🚀 Inicializando modal de captura múltiple...');
      initializationRef.current = true;
      
      // ✅ Resetear sin usar la función (evitar dependencia)
      setCurrentStep('selection');
      setSelectedFinger(null);
      selectedFingerRef.current = null;
      setProgress(0);
      setMessage('');
      setError(null);
      setCurrentCapture(0);
      setCaptureResults([]);
      setFinalQuality(null);
      setCombinedTemplate(null);
      setElapsedTime(0);
      setTotalTime(0);
      setIsProcessing(false);
      
      // ✅ CERRAR CONEXIÓN EXISTENTE ANTES DE CREAR NUEVA
      closeExistingWebSocket();

      // ✅ Conectar INMEDIATAMENTE sin setTimeout
      console.log('🔌 Conectando a ZK Access Agent...');
      setWsReconnecting(true);
      setWsError(null);

      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado al ZK Access Agent');
        setWsConnected(true);
        setWsReconnecting(false);
        setWsError(null);
        reconnectAttemptsRef.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // ✅ USAR REF en lugar de función directa
          handleWebSocketMessageRef.current?.(message);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setWsConnected(false);
        setWsReconnecting(false);
        setDeviceConnected(false);
        
        if (event.code !== 1000 && initializationRef.current) {
          setWsError('Conexión perdida con el sensor biométrico');
          
          // Intentar reconectar
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(`🔄 Reintentando conexión (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (initializationRef.current) {
                console.log('🔌 Reconectando a ZK Access Agent...');
                setWsReconnecting(true);
                setWsError(null);

                // ✅ CERRAR CONEXIÓN EXISTENTE ANTES DE RECONECTAR
                closeExistingWebSocket();

                wsRef.current = new WebSocket(WS_URL);

                // ✅ CRÍTICO: Configurar TODOS los event handlers para la reconexión
                wsRef.current.onopen = () => {
                  console.log('✅ WebSocket reconectado exitosamente');
                  setWsConnected(true);
                  setWsReconnecting(false);
                  setWsError(null);
                  reconnectAttemptsRef.current = 0;
                };

                wsRef.current.onmessage = (ev) => {
                  try {
                    const msg: WebSocketMessage = JSON.parse(ev.data);
                    // ✅ USAR REF en lugar de función directa
                    handleWebSocketMessageRef.current?.(msg);
                  } catch (err) {
                    console.error('❌ Error parseando mensaje WebSocket:', err);
                  }
                };

                wsRef.current.onclose = (ev) => {
                  console.log('🔌 WebSocket reconectado se desconectó:', ev.code, ev.reason);
                  setWsConnected(false);
                  setWsReconnecting(false);
                  setDeviceConnected(false);
                };

                wsRef.current.onerror = (err) => {
                  console.error('❌ Error en WebSocket reconectado:', err);
                  setWsError('Error de conexión con el sensor biométrico');
                  setWsConnected(false);
                  setWsReconnecting(false);
                  setDeviceConnected(false);
                };
              }
            }, RECONNECT_INTERVAL);
          } else {
            setWsError('No se pudo establecer conexión con el sensor biométrico');
            setWsReconnecting(false);
          }
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setWsError('Error de conexión con el sensor biométrico');
        setWsConnected(false);
        setWsReconnecting(false);
        setDeviceConnected(false);
      };
      
      return () => {
        // Cleanup
        if (wsRef.current) {
          wsRef.current.close(1000, 'Component closing');
          wsRef.current = null;
        }
      };
    }
    
    if (!open && initializationRef.current) {
      console.log('🧹 Limpiando recursos...');
      initializationRef.current = false;
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Limpiar timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
        totalTimerRef.current = null;
      }
    }
  }, [open, closeExistingWebSocket]); // ✅ Depende de 'open' y closeExistingWebSocket

  const getCurrentStepInfo = () => {
    return PROCESS_STEPS.find(step => step.id === currentStep) || PROCESS_STEPS[0];
  };

  const currentStepInfo = getCurrentStepInfo();

  // 🎨 RENDERIZADO PRINCIPAL
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colorTokens.brand}30`,
          borderRadius: 3,
          color: colorTokens.neutral1200,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colorTokens.neutral500}`,
        bgcolor: `${colorTokens.brand}10`,
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.neutral0,
            width: 48,
            height: 48
          }}>
            <FingerprintIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.neutral1200 }}>
              Captura de Huella Dactilar
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.neutral1000 }}>
              {user.firstName} {user.lastName} • Los datos se agregarán al formulario
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={
            wsConnected && deviceConnected ? 'Sensor ZKTeco conectado y listo' :
            wsConnected && !deviceConnected ? 'Servidor conectado, dispositivo ZKTeco desconectado' :
            'Sensor desconectado'
          }>
            <Chip
              icon={wsConnected && deviceConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={
                wsConnected && deviceConnected ? 'ZKTeco Listo' :
                wsConnected && !deviceConnected ? 'Sin ZKTeco' :
                'Desconectado'
              }
              size="small"
              sx={{
                bgcolor: wsConnected && deviceConnected ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                color: wsConnected && deviceConnected ? colorTokens.success : colorTokens.danger,
                border: `1px solid ${wsConnected && deviceConnected ? colorTokens.success : colorTokens.danger}40`
              }}
            />
          </Tooltip>
          
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: colorTokens.neutral1000,
              '&:hover': { 
                color: colorTokens.neutral1200,
                bgcolor: `${colorTokens.brand}20`
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{
          p: 3,
          bgcolor: `${currentStepInfo.color}10`,
          borderBottom: `1px solid ${colorTokens.neutral500}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              bgcolor: currentStepInfo.color,
              color: colorTokens.neutral1200,
              width: 40,
              height: 40
            }}>
              {currentStepInfo.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                {currentStepInfo.label}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral1000 }}>
                {message || currentStepInfo.description}
              </Typography>
            </Box>
            
            {isProcessing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} sx={{ color: currentStepInfo.color }} />
                <Typography variant="body2" sx={{ color: colorTokens.neutral1000 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </Box>
          
          {isProcessing && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colorTokens.neutral500,
                '& .MuiLinearProgress-bar': {
                  bgcolor: currentStepInfo.color,
                  borderRadius: 4,
                  boxShadow: `0 0 10px ${currentStepInfo.color}40`
                }
              }}
            />
          )}
          
          {(currentStep.startsWith('capture') || currentStep === 'processing' || currentStep === 'ready') && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {[0, 1, 2].map((index) => (
                <Chip
                  key={index}
                  icon={
                    captureResults[index] ? <CheckCircleIcon /> :
                    currentCapture === index ? <CaptureIcon /> :
                    <FingerprintIcon />
                  }
                  label={`Plantilla ${index + 1}`}
                  size="small"
                  sx={{
                    bgcolor: captureResults[index] ? `${colorTokens.success}20` :
                             currentCapture === index ? `${colorTokens.brand}20` :
                             `${colorTokens.neutral500}20`,
                    color: captureResults[index] ? colorTokens.success :
                           currentCapture === index ? colorTokens.brand :
                           colorTokens.neutral900,
                    border: `1px solid ${captureResults[index] ? colorTokens.success :
                                        currentCapture === index ? colorTokens.brand :
                                        colorTokens.neutral500}40`
                  }}
                />
              ))}
            </Box>
          )}
          
          {(totalTime > 0 || finalQuality !== null) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {totalTime > 0 && (
                <Chip
                  icon={<TimerIcon />}
                  label={`${totalTime}s total`}
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.info}20`,
                    color: colorTokens.info,
                    border: `1px solid ${colorTokens.info}40`
                  }}
                />
              )}
              {finalQuality !== null && (
                <Chip
                  icon={<QualityIcon />}
                  label={`Calidad: ${finalQuality}%`}
                  size="small"
                  sx={{
                    bgcolor: finalQuality >= 90 ? `${colorTokens.success}20` : 
                             finalQuality >= 75 ? `${colorTokens.warning}20` : 
                             `${colorTokens.danger}20`,
                    color: finalQuality >= 90 ? colorTokens.success : 
                           finalQuality >= 75 ? colorTokens.warning : 
                           colorTokens.danger,
                    border: `1px solid ${finalQuality >= 90 ? colorTokens.success : 
                                        finalQuality >= 75 ? colorTokens.warning : 
                                        colorTokens.danger}40`
                  }}
                />
              )}
              {captureResults.length > 0 && (
                <Chip
                  icon={<FingerprintIcon />}
                  label={`${captureResults.length}/3 capturas`}
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    border: `1px solid ${colorTokens.brand}40`
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {(error || wsError) && (
            <Fade in>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  bgcolor: `${colorTokens.danger}15`,
                  border: `1px solid ${colorTokens.danger}30`,
                  color: colorTokens.neutral1200,
                  '& .MuiAlert-icon': {
                    color: colorTokens.danger
                  }
                }}
                action={
                  wsError && (
                    <Button
                      size="small"
                      onClick={connectWebSocket}
                      disabled={wsReconnecting}
                      sx={{ color: colorTokens.danger }}
                    >
                      {wsReconnecting ? <CircularProgress size={16} /> : 'Reconectar'}
                    </Button>
                  )
                }
              >
                {error || wsError}
              </Alert>
            </Fade>
          )}

          {currentStep === 'selection' && (
            <Fade in>
              <Box>
                <Typography variant="h6" sx={{ color: colorTokens.neutral1200, mb: 1, fontWeight: 600 }}>
                  Seleccione el dedo a registrar:
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral1000, mb: 3 }}>
                  Se realizarán 3 capturas para máxima precisión
                </Typography>
                
                <Grid container spacing={2}>
                  {FINGER_CONFIG.map((finger) => (
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={finger.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          bgcolor: selectedFinger === finger.id 
                            ? `${colorTokens.brand}20` 
                            : colorTokens.neutral100,
                          border: selectedFinger === finger.id 
                            ? `2px solid ${colorTokens.brand}` 
                            : `1px solid ${colorTokens.neutral500}`,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${colorTokens.brand}30`,
                            bgcolor: `${colorTokens.brand}10`
                          }
                        }}
                      >
                        <CardActionArea
                          onClick={() => {
                            setSelectedFinger(finger.id);
                            selectedFingerRef.current = finger.id;
                          }}
                          sx={{ p: 2, textAlign: 'center' }}
                        >
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {finger.icon}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: selectedFinger === finger.id 
                                ? colorTokens.brand 
                                : colorTokens.neutral1000,
                              fontWeight: selectedFinger === finger.id ? 600 : 400,
                              fontSize: '0.75rem',
                              lineHeight: 1.2
                            }}
                          >
                            {finger.name}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          )}

          {currentStep !== 'selection' && currentStep !== 'ready' && (
            <Zoom in>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <CircularProgress
                    size={120}
                    thickness={4}
                    variant="determinate"
                    value={progress}
                    sx={{
                      color: currentStepInfo.color,
                      filter: `drop-shadow(0 0 10px ${currentStepInfo.color}60)`,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Avatar sx={{
                      bgcolor: currentStepInfo.color,
                      color: colorTokens.neutral1200,
                      width: 60,
                      height: 60
                    }}>
                      {currentStepInfo.icon}
                    </Avatar>
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ color: colorTokens.neutral1200, mb: 2, fontWeight: 600 }}>
                  {currentStepInfo.label}
                </Typography>
                <Typography variant="body1" sx={{ color: colorTokens.neutral1000, mb: 3 }}>
                  {message || currentStepInfo.description}
                </Typography>

                {selectedFinger && (
                  <Chip
                    label={FINGER_CONFIG.find(f => f.id === selectedFinger)?.name}
                    sx={{
                      bgcolor: `${currentStepInfo.color}20`,
                      color: currentStepInfo.color,
                      border: `1px solid ${currentStepInfo.color}40`,
                      fontWeight: 600,
                      mb: 2
                    }}
                  />
                )}

                {currentStep.startsWith('capture') && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: `${colorTokens.brand}10`, borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ color: colorTokens.neutral1000, fontSize: '0.9rem' }}>
                      <strong>Instrucciones:</strong><br/>
                      • Coloque el dedo firmemente en el centro del sensor<br/>
                      • Mantenga la presión constante<br/>
                      • No mueva el dedo hasta completar la captura<br/>
                      • Use la misma posición en las 3 capturas
                    </Typography>
                  </Box>
                )}
              </Box>
            </Zoom>
          )}

          {currentStep === 'ready' && (
            <Slide direction="up" in>
              <Box>
                <Typography variant="h6" sx={{ color: colorTokens.success, mb: 3, fontWeight: 600, textAlign: 'center' }}>
                  🎯 ¡Datos de Huella Capturados Exitosamente!
                </Typography>
                
                <Box sx={{ p: 3, bgcolor: `${colorTokens.success}10`, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.success, mb: 2, fontWeight: 600 }}>
                    ✅ Capturas Completadas
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {finalQuality && (
                      <Chip
                        icon={<QualityIcon />}
                        label={`Calidad: ${finalQuality}%`}
                        sx={{
                          bgcolor: `${colorTokens.success}20`,
                          color: colorTokens.success,
                          border: `1px solid ${colorTokens.success}40`,
                          fontWeight: 600
                        }}
                      />
                    )}
                    <Chip
                      icon={<TimerIcon />}
                      label={`Tiempo: ${totalTime}s`}
                      sx={{
                        bgcolor: `${colorTokens.info}20`,
                        color: colorTokens.info,
                        border: `1px solid ${colorTokens.info}40`,
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      icon={<FingerprintIcon />}
                      label={selectedFinger ? FINGER_CONFIG.find(f => f.id === selectedFinger)?.name : 'Dedo'}
                      sx={{
                        bgcolor: `${colorTokens.brand}20`,
                        color: colorTokens.brand,
                        border: `1px solid ${colorTokens.brand}40`,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  {captureResults.length > 0 && (
                    <Box>
                      <Typography variant="body1" sx={{ color: colorTokens.neutral1200, mb: 2, fontWeight: 600 }}>
                        📊 Resumen de Capturas:
                      </Typography>
                      {captureResults.map((result, index) => (
                        <Box key={index} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 2,
                          bgcolor: `${colorTokens.neutral100}50`,
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                            Captura {index + 1}:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${result.qualityScore}%`}
                              size="small"
                              sx={{
                                bgcolor: result.qualityScore >= 90 ? `${colorTokens.success}20` : 
                                         result.qualityScore >= 75 ? `${colorTokens.warning}20` : 
                                         `${colorTokens.danger}20`,
                                color: result.qualityScore >= 90 ? colorTokens.success : 
                                       result.qualityScore >= 75 ? colorTokens.warning : 
                                       colorTokens.danger,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            />
                            <Typography variant="body2" sx={{ color: colorTokens.neutral1000, fontSize: '0.8rem' }}>
                              {(result.captureTime / 1000).toFixed(1)}s
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    bgcolor: `${colorTokens.info}15`,
                    border: `1px solid ${colorTokens.info}30`,
                    color: colorTokens.neutral1200,
                    '& .MuiAlert-icon': {
                      color: colorTokens.info
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    📋 Los datos de huella están listos para agregar al formulario
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Al confirmar, estos datos se añadirán al formulario y se guardarán cuando presione <strong>"Actualizar Usuario"</strong> en el formulario principal.
                  </Typography>
                </Alert>
              </Box>
            </Slide>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${colorTokens.neutral500}` }}>
        {currentStep === 'selection' && (
          <>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: colorTokens.neutral1000,
                borderColor: colorTokens.neutral500,
                '&:hover': {
                  borderColor: colorTokens.neutral1000,
                  bgcolor: `${colorTokens.brand}10`
                }
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              startIcon={<FingerprintIcon />}
              onClick={startMultipleCaptureProcess}
              disabled={!selectedFinger || !wsConnected || !deviceConnected || isProcessing}
              sx={{
                bgcolor: colorTokens.brand,
                color: colorTokens.neutral0,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: colorTokens.brand,
                  filter: 'brightness(1.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${colorTokens.brand}50`
                },
                '&:disabled': {
                  bgcolor: colorTokens.neutral600,
                  color: colorTokens.neutral900
                },
                transition: 'all 0.3s ease'
              }}
            >
              Iniciar Captura (3 Lecturas)
            </Button>
          </>
        )}

        {(currentStep !== 'selection' && currentStep !== 'ready') && (
          <>
            <Button
              onClick={resetProcess}
              variant="outlined"
              startIcon={<ReplayIcon />}
              disabled={isProcessing}
              sx={{
                color: colorTokens.warning,
                borderColor: colorTokens.warning,
                '&:hover': {
                  bgcolor: `${colorTokens.warning}10`,
                  borderColor: colorTokens.warning
                }
              }}
            >
              Reiniciar
            </Button>

            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: colorTokens.neutral1000,
                borderColor: colorTokens.neutral500,
                '&:hover': {
                  borderColor: colorTokens.neutral1000,
                  bgcolor: `${colorTokens.brand}10`
                }
              }}
            >
              Cancelar
            </Button>
          </>
        )}

        {currentStep === 'ready' && (
          <>
            <Button
              onClick={resetProcess}
              variant="outlined"
              startIcon={<ReplayIcon />}
              sx={{
                color: colorTokens.warning,
                borderColor: colorTokens.warning,
                '&:hover': {
                  bgcolor: `${colorTokens.warning}10`,
                  borderColor: colorTokens.warning
                }
              }}
            >
              Capturar Nuevamente
            </Button>

            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: colorTokens.neutral1000,
                borderColor: colorTokens.neutral500,
                '&:hover': {
                  borderColor: colorTokens.neutral1000,
                  bgcolor: `${colorTokens.brand}10`
                }
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={confirmFingerprintData}
              disabled={!combinedTemplate}
              sx={{
                bgcolor: colorTokens.success,
                color: colorTokens.neutral1200,
                fontWeight: 600,
                minWidth: '180px',
                '&:hover': {
                  bgcolor: colorTokens.success,
                  filter: 'brightness(1.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${colorTokens.success}50`
                },
                '&:disabled': {
                  bgcolor: colorTokens.neutral600,
                  color: colorTokens.neutral900
                },
                transition: 'all 0.3s ease'
              }}
            >
              Confirmar Huella
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}