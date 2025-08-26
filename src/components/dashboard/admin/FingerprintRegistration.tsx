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

// 🎨 DARK PRO TOKENS (mismo que antes)
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  iconDefault: '#FFFFFF',
  iconMuted: '#AAAAAA',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// 🖐️ CONFIGURACIÓN DE DEDOS (mismo que antes)
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

// 📊 ESTADOS DEL PROCESO ACTUALIZADOS
const PROCESS_STEPS = [
  { 
    id: 'selection', 
    label: 'Seleccionar Dedo', 
    description: 'Elija qué dedo desea registrar',
    icon: <TouchAppIcon />,
    color: darkProTokens.info
  },
  { 
    id: 'preparation', 
    label: 'Preparación', 
    description: 'Preparando para captura múltiple',
    icon: <ProgressIcon />,
    color: darkProTokens.warning
  },
  { 
    id: 'capture1', 
    label: 'Captura 1/3', 
    description: 'Primera captura - Template principal',
    icon: <OneIcon />,
    color: darkProTokens.primary
  },
  { 
    id: 'capture2', 
    label: 'Captura 2/3', 
    description: 'Segunda captura - Verificación',
    icon: <TwoIcon />,
    color: darkProTokens.info
  },
  { 
    id: 'capture3', 
    label: 'Captura 3/3', 
    description: 'Tercera captura - Respaldo',
    icon: <ThreeIcon />,
    color: darkProTokens.warning
  },
  { 
    id: 'processing', 
    label: 'Procesando', 
    description: 'Combinando templates biométricos',
    icon: <MergeIcon />,
    color: darkProTokens.info
  },
  { 
    id: 'ready', 
    label: 'Datos Listos', 
    description: 'Huella preparada para guardar',
    icon: <PreviewIcon />,
    color: darkProTokens.success
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
  onFingerprintDataReady: (fingerprintData: any) => void; // ✅ NUEVO: Pasar datos al padre
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

// 🚀 COMPONENTE PRINCIPAL MODIFICADO - ✅ SOLO PREPARAR DATOS
export default function FingerprintRegistration({
  open,
  onClose,
  user,
  onFingerprintDataReady, // ✅ NUEVO
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
  
  // 🎯 CONFIGURACIÓN WEBSOCKET
 const WS_URL = 'ws://localhost:8085/ws/';
  const RECONNECT_INTERVAL = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  // ⏱️ FUNCIONES DE TIMER
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

  // 🔄 REINICIAR PROCESO
  const resetProcess = useCallback(() => {
    console.log('🔄 Reiniciando proceso...');
    setCurrentStep('selection');
    setSelectedFinger(null);
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

  // ✅ FUNCIÓN PARA CONFIRMAR Y PASAR DATOS AL PADRE - NO GUARDA EN BD
  const confirmFingerprintData = useCallback(() => {
    if (!combinedTemplate || !selectedFinger) {
      setError('No hay datos de huella para confirmar');
      return;
    }

    console.log('✅ Confirmando datos de huella para el padre...');
    
    // 📊 PREPARAR DATOS PARA EL PADRE
    const fingerprintData = {
      user_id: user.id,
      finger_index: selectedFinger,
      finger_name: FINGER_CONFIG.find(f => f.id === selectedFinger)?.name || 'Desconocido',
      
      // ✅ TEMPLATES MÚLTIPLES
      template: combinedTemplate.primary.template,
      primary_template: combinedTemplate.primary.template,
      verification_template: combinedTemplate.verification.template,
      backup_template: combinedTemplate.backup.template,
      combined_template: combinedTemplate,
      
      // 📈 MÉTRICAS
      average_quality: Math.round(combinedTemplate.averageQuality),
      capture_count: 3,
      capture_time_ms: combinedTemplate.totalCaptureTime * 1000,
      
      // 🔒 METADATA
      device_user_id: parseInt(user.id.slice(-6), 16) % 9999,
      device_info: {
        deviceType: 'ZKTeco',
        captureMethod: 'multiple_capture',
        totalCaptures: 3,
        wsConnection: 'localhost:8081',
        qualities: [
          combinedTemplate.primary.qualityScore,
          combinedTemplate.verification.qualityScore,
          combinedTemplate.backup.qualityScore
        ],
        capturedBy: 'luishdz04',
        capturedAt: new Date().toISOString()
      }
    };
    
    console.log('📤 Pasando datos al componente padre:', fingerprintData);
    
    // ✅ PASAR DATOS AL PADRE EN VEZ DE GUARDAR DIRECTAMENTE
    onFingerprintDataReady(fingerprintData);
    
    // ✅ CERRAR MODAL
    handleClose();
    
  }, [combinedTemplate, selectedFinger, user, onFingerprintDataReady, handleClose]);

  // ✅ FUNCIÓN processFinalTemplate MODIFICADA - SOLO PREPARAR
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
            
            // ✅ SOLO PREPARAR DATOS, NO GUARDAR
            setCombinedTemplate(combinedTemplateData);
            setCurrentStep('ready');
            setMessage('¡Datos de huella listos! Presione "Confirmar" para agregar al formulario.');
            setIsProcessing(false);
            stopTimers();
            
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      return currentResults;
    });
  }, [totalTime, stopTimers]);

  // ✅ FUNCIÓN startSingleCapture (misma)
  const startSingleCapture = useCallback((captureNumber: number) => {
    console.log(`🚀 Iniciando captura ${captureNumber}/3`);
    
    setCurrentCapture(captureNumber - 1);
    setCurrentStep(`capture${captureNumber}`);
    setMessage(`Coloque el dedo en el sensor - Captura ${captureNumber}/3`);
    setProgress(0);
    setCaptureStartTime(Date.now());
    
    const captureCommand = {
      action: 'capture_fingerprint',
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      fingerIndex: selectedFinger,
      captureNumber: captureNumber,
      timestamp: Date.now()
    };
    
    console.log(`📤 Enviando comando de captura ${captureNumber}/3:`, captureCommand);
    
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
      stopTimers();
    }
  }, [selectedFinger, user, stopTimers]);

  // ✅ FUNCIÓN handleWebSocketMessage (misma, pero llama processFinalTemplate)
 const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
  console.log('📨 Mensaje recibido:', message);
  
  switch (message.type) {
  case 'welcome':
  console.log('🎉 Conectado al ZK Access Agent');
  
  // ✅ CORRECCIÓN: Leer deviceConnected de data
  const isDeviceConnected = message.data?.deviceConnected === true;
  
  console.log(`📱 Estado del dispositivo: ${isDeviceConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
  console.log(`👤 Usuario del servidor: ${message.data?.user || 'N/A'}`);
  console.log(`⏰ Timestamp: ${message.data?.timestamp || message.timestamp || 'N/A'}`);
  
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
    console.log(`📊 ${message.data.status}: ${message.data.message} (${message.data.progress}%)`);
    setMessage(message.data.message || '');
    setProgress(message.data.progress || 0);
  }
  break;
      
    case 'capture_result':
       if (message.data?.success && message.data?.data) {
        const qualityMap: { [key: string]: number } = {
          'excellent': 98, 'good': 95, 'fair': 75, 'poor': 50
        };
        const qualityScore = qualityMap[message.data.quality] || 85;
        
        const captureResult: CaptureResult = {
          success: true,
          template: message.data.data.template,
          templateSize: message.data.data.templateSize || 0,
          quality: message.data.data.quality || 'good',,
          qualityScore: qualityScore,
          captureTime: Date.now() - captureStartTime,
fingerprintId: message.data.data.fingerprintId || `fp_${Date.now()}`
        };
        
        console.log(`✅ Captura ${currentCapture + 1}/3 exitosa - Calidad: ${qualityScore}%`);
        
        setCaptureResults(prev => {
          const newResults = [...prev, captureResult];
          const capturesCompleted = newResults.length;
          
          setTimeout(() => {
            if (capturesCompleted < 3) {
              startSingleCapture(capturesCompleted + 1);
            } else {
              console.log('🎊 Todas las capturas completadas');
              processFinalTemplate();
            }
          }, capturesCompleted < 3 ? 1500 : 500);
          
          return newResults;
        });
        
      } else {
        console.error('❌ Error en captura:', message.error);
        setError(message.error || 'Error en captura de huella');
        setIsProcessing(false);
        setCurrentStep('selection');
        stopTimers();
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
      console.error('❌ Error del servidor:', message.message || message.error);
      setError(message.message || message.error || 'Error de comunicación');
      setIsProcessing(false);
      setCurrentStep('selection');
      stopTimers();
      break;
      
    default:
      console.log('📝 Mensaje no manejado:', message.type);
  }
}, [captureStartTime, stopTimers, startSingleCapture, processFinalTemplate, currentCapture]);

  // ✅ Resto de funciones WebSocket (mismas)
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current++;
      console.log(`🔄 Reintentando conexión (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, RECONNECT_INTERVAL);
    } else {
      setWsError('No se pudo establecer conexión con el sensor biométrico');
      setWsReconnecting(false);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
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
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setWsConnected(false);
        setWsReconnecting(false);
        setDeviceConnected(false);
        
        if (event.code !== 1000) {
          setWsError('Conexión perdida con el sensor biométrico');
          attemptReconnect();
        }
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
  }, [handleWebSocketMessage, attemptReconnect]);

  // 🚀 INICIAR PROCESO (mismo)
  const startMultipleCaptureProcess = useCallback(() => {
    if (!selectedFinger || !wsConnected || !deviceConnected) {
      setError('Seleccione un dedo y verifique la conexión del dispositivo');
      return;
    }
    
    console.log('🚀 Iniciando proceso de captura múltiple...');
    
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
    setMessage('Preparando para registro de huella múltiple...');
    
    startTotalTimer();
    
    setTimeout(() => {
      startSingleCapture(1);
    }, 2000);
    
  }, [selectedFinger, wsConnected, deviceConnected, startTotalTimer, startSingleCapture]);

  // ✅ useEffect (mismo)
  useEffect(() => {
    if (open && !initializationRef.current) {
      console.log('🚀 Inicializando modal de captura múltiple...');
      initializationRef.current = true;
      
      resetProcess();
      
      const connectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 100);
      
      return () => {
        clearTimeout(connectTimeout);
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
      
      stopTimers();
    }
  }, [open, resetProcess, connectWebSocket, stopTimers]);

  // 🎨 OBTENER STEP ACTUAL
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
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkProTokens.primary}30`,
          borderRadius: 3,
          color: darkProTokens.textPrimary,
          minHeight: '60vh'
        }
      }}
    >
      {/* HEADER - igual que antes */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${darkProTokens.grayDark}`,
        bgcolor: `${darkProTokens.primary}10`,
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            bgcolor: darkProTokens.primary,
            color: darkProTokens.background,
            width: 48,
            height: 48
          }}>
            <FingerprintIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: darkProTokens.textPrimary }}>
              Captura de Huella Dactilar
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
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
                bgcolor: wsConnected && deviceConnected ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                color: wsConnected && deviceConnected ? darkProTokens.success : darkProTokens.error,
                border: `1px solid ${wsConnected && deviceConnected ? darkProTokens.success : darkProTokens.error}40`
              }}
            />
          </Tooltip>
          
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: darkProTokens.textSecondary,
              '&:hover': { 
                color: darkProTokens.textPrimary,
                bgcolor: darkProTokens.hoverOverlay
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* ESTADO ACTUAL - igual que antes */}
        <Box sx={{
          p: 3,
          bgcolor: `${currentStepInfo.color}10`,
          borderBottom: `1px solid ${darkProTokens.grayDark}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              bgcolor: currentStepInfo.color,
              color: darkProTokens.textPrimary,
              width: 40,
              height: 40
            }}>
              {currentStepInfo.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                {currentStepInfo.label}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                {message || currentStepInfo.description}
              </Typography>
            </Box>
            
            {isProcessing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} sx={{ color: currentStepInfo.color }} />
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Barra de progreso */}
          {isProcessing && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: darkProTokens.grayDark,
                '& .MuiLinearProgress-bar': {
                  bgcolor: currentStepInfo.color,
                  borderRadius: 4,
                  boxShadow: `0 0 10px ${currentStepInfo.color}40`
                }
              }}
            />
          )}
          
          {/* Indicadores de progreso */}
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
                  label={`Captura ${index + 1}`}
                  size="small"
                  sx={{
                    bgcolor: captureResults[index] ? `${darkProTokens.success}20` : 
                             currentCapture === index ? `${darkProTokens.primary}20` : 
                             `${darkProTokens.grayDark}20`,
                    color: captureResults[index] ? darkProTokens.success : 
                           currentCapture === index ? darkProTokens.primary : 
                           darkProTokens.textDisabled,
                    border: `1px solid ${captureResults[index] ? darkProTokens.success : 
                                        currentCapture === index ? darkProTokens.primary : 
                                        darkProTokens.grayDark}40`
                  }}
                />
              ))}
            </Box>
          )}
          
          {/* Métricas */}
          {(totalTime > 0 || finalQuality !== null) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {totalTime > 0 && (
                <Chip
                  icon={<TimerIcon />}
                  label={`${totalTime}s total`}
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.info}20`,
                    color: darkProTokens.info,
                    border: `1px solid ${darkProTokens.info}40`
                  }}
                />
              )}
              {finalQuality !== null && (
                <Chip
                  icon={<QualityIcon />}
                  label={`Calidad: ${finalQuality}%`}
                  size="small"
                  sx={{
                    bgcolor: finalQuality >= 90 ? `${darkProTokens.success}20` : 
                             finalQuality >= 75 ? `${darkProTokens.warning}20` : 
                             `${darkProTokens.error}20`,
                    color: finalQuality >= 90 ? darkProTokens.success : 
                           finalQuality >= 75 ? darkProTokens.warning : 
                           darkProTokens.error,
                    border: `1px solid ${finalQuality >= 90 ? darkProTokens.success : 
                                        finalQuality >= 75 ? darkProTokens.warning : 
                                        darkProTokens.error}40`
                  }}
                />
              )}
              {captureResults.length > 0 && (
                <Chip
                  icon={<FingerprintIcon />}
                  label={`${captureResults.length}/3 capturas`}
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary,
                    border: `1px solid ${darkProTokens.primary}40`
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* CONTENIDO PRINCIPAL */}
        <Box sx={{ p: 3 }}>
          {/* ERRORES */}
          {(error || wsError) && (
            <Fade in>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  bgcolor: `${darkProTokens.error}15`,
                  border: `1px solid ${darkProTokens.error}30`,
                  color: darkProTokens.textPrimary,
                  '& .MuiAlert-icon': {
                    color: darkProTokens.error
                  }
                }}
                action={
                  wsError && (
                    <Button
                      size="small"
                      onClick={connectWebSocket}
                      disabled={wsReconnecting}
                      sx={{ color: darkProTokens.error }}
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

          {/* SELECTOR DE DEDOS */}
          {currentStep === 'selection' && (
            <Fade in>
              <Box>
                <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 1, fontWeight: 600 }}>
                  Seleccione el dedo a registrar:
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
                  Se realizarán 3 capturas para máxima precisión
                </Typography>
                
                <Grid container spacing={2}>
                  {FINGER_CONFIG.map((finger) => (
                    <Grid key={finger.id} size={{ xs: 6, sm: 4, md: 2.4 }}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          bgcolor: selectedFinger === finger.id 
                            ? `${darkProTokens.primary}20` 
                            : darkProTokens.surfaceLevel1,
                          border: selectedFinger === finger.id 
                            ? `2px solid ${darkProTokens.primary}` 
                            : `1px solid ${darkProTokens.grayDark}`,
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${darkProTokens.primary}30`,
                            bgcolor: `${darkProTokens.primary}10`
                          }
                        }}
                      >
                        <CardActionArea
                          onClick={() => setSelectedFinger(finger.id)}
                          sx={{ p: 2, textAlign: 'center' }}
                        >
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {finger.icon}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: selectedFinger === finger.id 
                                ? darkProTokens.primary 
                                : darkProTokens.textSecondary,
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

          {/* PROCESO EN CURSO */}
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
                      color: darkProTokens.textPrimary,
                      width: 60,
                      height: 60
                    }}>
                      {currentStepInfo.icon}
                    </Avatar>
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 2, fontWeight: 600 }}>
                  {currentStepInfo.label}
                </Typography>
                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
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

                {/* Instrucciones */}
                {currentStep.startsWith('capture') && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: `${darkProTokens.primary}10`, borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: '0.9rem' }}>
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

          {/* ✅ DATOS LISTOS PARA CONFIRMAR */}
          {currentStep === 'ready' && (
            <Slide direction="up" in>
              <Box>
                <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 3, fontWeight: 600, textAlign: 'center' }}>
                  🎯 ¡Datos de Huella Capturados Exitosamente!
                </Typography>
                
                {/* Resumen */}
                <Box sx={{ p: 3, bgcolor: `${darkProTokens.success}10`, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 2, fontWeight: 600 }}>
                    ✅ Capturas Completadas
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {finalQuality && (
                      <Chip
                        icon={<QualityIcon />}
                        label={`Calidad: ${finalQuality}%`}
                        sx={{
                          bgcolor: `${darkProTokens.success}20`,
                          color: darkProTokens.success,
                          border: `1px solid ${darkProTokens.success}40`,
                          fontWeight: 600
                        }}
                      />
                    )}
                    <Chip
                      icon={<TimerIcon />}
                      label={`Tiempo: ${totalTime}s`}
                      sx={{
                        bgcolor: `${darkProTokens.info}20`,
                        color: darkProTokens.info,
                        border: `1px solid ${darkProTokens.info}40`,
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      icon={<FingerprintIcon />}
                      label={selectedFinger ? FINGER_CONFIG.find(f => f.id === selectedFinger)?.name : 'Dedo'}
                      sx={{
                        bgcolor: `${darkProTokens.primary}20`,
                        color: darkProTokens.primary,
                        border: `1px solid ${darkProTokens.primary}40`,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  {/* Detalle de capturas */}
                  {captureResults.length > 0 && (
                    <Box>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, mb: 2, fontWeight: 600 }}>
                        📊 Resumen de Capturas:
                      </Typography>
                      {captureResults.map((result, index) => (
                        <Box key={index} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 2,
                          bgcolor: `${darkProTokens.surfaceLevel1}50`,
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                            Captura {index + 1}:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${result.qualityScore}%`}
                              size="small"
                              sx={{
                                bgcolor: result.qualityScore >= 90 ? `${darkProTokens.success}20` : 
                                         result.qualityScore >= 75 ? `${darkProTokens.warning}20` : 
                                         `${darkProTokens.error}20`,
                                color: result.qualityScore >= 90 ? darkProTokens.success : 
                                       result.qualityScore >= 75 ? darkProTokens.warning : 
                                       darkProTokens.error,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            />
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: '0.8rem' }}>
                              {(result.captureTime / 1000).toFixed(1)}s
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Información importante */}
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    bgcolor: `${darkProTokens.info}15`,
                    border: `1px solid ${darkProTokens.info}30`,
                    color: darkProTokens.textPrimary,
                    '& .MuiAlert-icon': {
                      color: darkProTokens.info
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

      {/* ✅ ACCIONES MODIFICADAS */}
      <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
        {currentStep === 'selection' && (
          <>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: darkProTokens.grayDark,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  bgcolor: darkProTokens.hoverOverlay
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
                bgcolor: darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: darkProTokens.primaryHover,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${darkProTokens.primary}50`
                },
                '&:disabled': {
                  bgcolor: darkProTokens.grayMedium,
                  color: darkProTokens.textDisabled
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
                color: darkProTokens.warning,
                borderColor: darkProTokens.warning,
                '&:hover': {
                  bgcolor: `${darkProTokens.warning}10`,
                  borderColor: darkProTokens.warningHover
                }
              }}
            >
              Reiniciar
            </Button>

            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: darkProTokens.grayDark,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  bgcolor: darkProTokens.hoverOverlay
                }
              }}
            >
              Cancelar
            </Button>
          </>
        )}

        {/* ✅ BOTONES PARA ESTADO 'ready' */}
        {currentStep === 'ready' && (
          <>
            <Button
              onClick={resetProcess}
              variant="outlined"
              startIcon={<ReplayIcon />}
              sx={{
                color: darkProTokens.warning,
                borderColor: darkProTokens.warning,
                '&:hover': {
                  bgcolor: `${darkProTokens.warning}10`,
                  borderColor: darkProTokens.warningHover
                }
              }}
            >
              Capturar Nuevamente
            </Button>

            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: darkProTokens.grayDark,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  bgcolor: darkProTokens.hoverOverlay
                }
              }}
            >
              Cancelar
            </Button>

            {/* ✅ BOTÓN PRINCIPAL: CONFIRMAR DATOS */}
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={confirmFingerprintData}
              disabled={!combinedTemplate}
              sx={{
                bgcolor: darkProTokens.success,
                color: darkProTokens.textPrimary,
                fontWeight: 600,
                minWidth: '180px',
                '&:hover': {
                  bgcolor: darkProTokens.successHover,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${darkProTokens.success}50`
                },
                '&:disabled': {
                  bgcolor: darkProTokens.grayMedium,
                  color: darkProTokens.textDisabled
                },
                transition: 'all 0.3s ease'
              }}
            >
              Confirmar Huella
            </Button>
          </>
        )}
      </DialogActions>

      {/* CSS ANIMATIONS (mismo que antes) */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </Dialog>
  );
}
