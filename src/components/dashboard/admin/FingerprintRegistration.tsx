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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Card,
  CardActionArea,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  ButtonGroup,
  Avatar,
  Badge
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
  Sensors as SensorsIcon,
  TouchApp as TouchAppIcon,
  CloudSync as CloudSyncIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Timer as TimerIcon,
  TrendingUp as QualityIcon,
  Done as DoneIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';

// 🎨 DARK PRO TOKENS (usando los mismos del archivo principal)
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
    color: darkProTokens.info
  },
  { 
    id: 'connecting', 
    label: 'Conectando', 
    description: 'Estableciendo conexión con sensor biométrico',
    icon: <WifiIcon />,
    color: darkProTokens.warning
  },
  { 
    id: 'waiting', 
    label: 'Esperando', 
    description: 'Coloque el dedo firmemente en el sensor',
    icon: <SensorsIcon />,
    color: darkProTokens.primary
  },
  { 
    id: 'capturing', 
    label: 'Capturando', 
    description: 'Procesando huella dactilar...',
    icon: <FingerprintIcon />,
    color: darkProTokens.info
  },
  { 
    id: 'verifying', 
    label: 'Verificando', 
    description: 'Validando calidad de la huella',
    icon: <QualityIcon />,
    color: darkProTokens.warning
  },
  { 
    id: 'saving', 
    label: 'Guardando', 
    description: 'Sincronizando con base de datos',
    icon: <CloudSyncIcon />,
    color: darkProTokens.primary
  },
  { 
    id: 'complete', 
    label: 'Completado', 
    description: 'Huella registrada exitosamente',
    icon: <CheckCircleIcon />,
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
  onSuccess: (message: string) => void;
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
}

// 🚀 COMPONENTE PRINCIPAL
export default function FingerprintRegistration({
  open,
  onClose,
  user,
  onSuccess,
  onError
}: FingerprintRegistrationProps) {
  // 📊 Estados principales
  const [currentStep, setCurrentStep] = useState<string>('selection');
  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [quality, setQuality] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🌐 Estados de WebSocket
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnecting, setWsReconnecting] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  
  // ⏱️ Estados de tiempo
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  // 🔗 Referencias
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🎯 CONFIGURACIÓN WEBSOCKET
  const WS_URL = 'ws://localhost:8080';
  const RECONNECT_INTERVAL = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  // 🔌 FUNCIONES DE WEBSOCKET
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
        
        if (event.code !== 1000) { // No fue cierre normal
          setWsError('Conexión perdida con el sensor biométrico');
          attemptReconnect();
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setWsError('Error de conexión con el sensor biométrico');
        setWsConnected(false);
        setWsReconnecting(false);
      };
      
    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      setWsError('No se pudo conectar al sensor biométrico');
      setWsReconnecting(false);
    }
  }, []);

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
  }, [connectWebSocket]);

  const disconnectWebSocket = useCallback(() => {
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
  }, []);

  // 📨 MANEJAR MENSAJES WEBSOCKET
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 Mensaje recibido:', message);
    
    switch (message.type) {
      case 'capture_status':
        if (message.status && message.message) {
          const step = mapStatusToStep(message.status);
          setCurrentStep(step);
          setMessage(message.message);
          setProgress(message.progress || 0);
          
          if (step === 'waiting') {
            setEstimatedTime(10); // 10 segundos estimados
            startTimer();
          }
        }
        break;
        
      case 'capture_result':
        setIsProcessing(false);
        stopTimer();
        
        if (message.success && message.data) {
          setCurrentStep('complete');
          setProgress(100);
          setMessage('✅ ¡Huella registrada exitosamente!');
          setQuality(message.data.quality || null);
          
          // Mostrar éxito por 2 segundos antes de cerrar
          setTimeout(() => {
            onSuccess(`Huella registrada para ${user.firstName} ${user.lastName}`);
            handleClose();
          }, 2000);
        } else {
          setCurrentStep('selection');
          setError(message.error || 'Error en captura de huella');
          setProgress(0);
          onError(message.error || 'Error registrando huella');
        }
        break;
        
      case 'error':
        setIsProcessing(false);
        setError(message.message || 'Error de comunicación');
        setCurrentStep('selection');
        setProgress(0);
        stopTimer();
        break;
        
      default:
        console.log('📨 Mensaje no manejado:', message.type);
    }
  }, [user, onSuccess, onError]);

  // 🗺️ MAPEAR ESTADOS
  const mapStatusToStep = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'initializing': 'connecting',
      'waiting': 'waiting',
      'capturing': 'capturing',
      'processing': 'verifying',
      'saving': 'saving'
    };
    
    return statusMap[status] || status;
  };

  // ⏱️ FUNCIONES DE TIMER
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 🚀 INICIAR PROCESO
  const startFingerprintCapture = useCallback(() => {
    if (!selectedFinger || !wsConnected) {
      setError('Seleccione un dedo y verifique la conexión');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setElapsedTime(0);
    setQuality(null);
    setCurrentStep('connecting');
    setMessage('Conectando con sensor biométrico...');
    
    const captureCommand = {
      action: 'capture_fingerprint',
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      fingerIndex: selectedFinger,
      timestamp: Date.now()
    };
    
    console.log('📤 Enviando comando de captura:', captureCommand);
    
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
    }
  }, [selectedFinger, wsConnected, user]);

  // 🗑️ ELIMINAR HUELLA
  const deleteFingerprintCapture = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/biometric/fingerprint?userId=${user.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess('Huella eliminada exitosamente');
        handleClose();
      } else {
        onError(result.error || 'Error eliminando huella');
      }
    } catch (error) {
      console.error('❌ Error eliminando huella:', error);
      onError('Error eliminando huella');
    } finally {
      setIsProcessing(false);
    }
  }, [user.id, onSuccess, onError]);

  // 🔄 REINICIAR PROCESO
  const resetProcess = useCallback(() => {
    setCurrentStep('selection');
    setSelectedFinger(null);
    setProgress(0);
    setMessage('');
    setError(null);
    setQuality(null);
    setElapsedTime(0);
    setEstimatedTime(0);
    setIsProcessing(false);
    stopTimer();
  }, [stopTimer]);

  // 🚪 CERRAR MODAL
  const handleClose = useCallback(() => {
    resetProcess();
    disconnectWebSocket();
    onClose();
  }, [resetProcess, disconnectWebSocket, onClose]);

  // 🔄 EFECTOS
  useEffect(() => {
    if (open) {
      connectWebSocket();
      resetProcess();
    }
    
    return () => {
      disconnectWebSocket();
      stopTimer();
    };
  }, [open, connectWebSocket, disconnectWebSocket, resetProcess, stopTimer]);

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
      {/* 🎯 HEADER */}
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
              Registro de Huella Dactilar
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              {user.firstName} {user.lastName}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Estado de conexión */}
          <Tooltip title={wsConnected ? 'Sensor conectado' : 'Sensor desconectado'}>
            <Chip
              icon={wsConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={wsConnected ? 'Conectado' : 'Desconectado'}
              size="small"
              sx={{
                bgcolor: wsConnected ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                color: wsConnected ? darkProTokens.success : darkProTokens.error,
                border: `1px solid ${wsConnected ? darkProTokens.success : darkProTokens.error}40`
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
        {/* 🔄 ESTADO ACTUAL */}
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
          
          {/* Timer y calidad */}
          {(elapsedTime > 0 || quality !== null) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {elapsedTime > 0 && (
                <Chip
                  icon={<TimerIcon />}
                  label={`${elapsedTime}s`}
                  size="small"
                  sx={{
                    bgcolor: `${darkProTokens.info}20`,
                    color: darkProTokens.info,
                    border: `1px solid ${darkProTokens.info}40`
                  }}
                />
              )}
              {quality !== null && (
                <Chip
                  icon={<QualityIcon />}
                  label={`Calidad: ${quality}%`}
                  size="small"
                  sx={{
                    bgcolor: quality >= 80 ? `${darkProTokens.success}20` : `${darkProTokens.warning}20`,
                    color: quality >= 80 ? darkProTokens.success : darkProTokens.warning,
                    border: `1px solid ${quality >= 80 ? darkProTokens.success : darkProTokens.warning}40`
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* 📋 CONTENIDO PRINCIPAL */}
        <Box sx={{ p: 3 }}>
          {/* 🚨 ERRORES */}
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

          {/* 🖐️ SELECTOR DE DEDOS */}
          {currentStep === 'selection' && (
            <Fade in>
              <Box>
                <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 3, fontWeight: 600 }}>
                  Seleccione el dedo a registrar:
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

                {/* Estado actual de huella */}
                <Box sx={{ mt: 3, p: 2, bgcolor: `${darkProTokens.info}10`, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Estado actual:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.fingerprint ? (
                      <>
                        <VerifiedIcon sx={{ color: darkProTokens.success, fontSize: '1.2rem' }} />
                        <Typography sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                          Usuario tiene huella registrada
                        </Typography>
                      </>
                    ) : (
                      <>
                        <WarningIcon sx={{ color: darkProTokens.warning, fontSize: '1.2rem' }} />
                        <Typography sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                          Sin huella registrada
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}

          {/* 🔄 PROCESO EN CURSO */}
          {currentStep !== 'selection' && currentStep !== 'complete' && (
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
                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                  {message || currentStepInfo.description}
                </Typography>

                {selectedFinger && (
                  <Chip
                    label={FINGER_CONFIG.find(f => f.id === selectedFinger)?.name}
                    sx={{
                      bgcolor: `${currentStepInfo.color}20`,
                      color: currentStepInfo.color,
                      border: `1px solid ${currentStepInfo.color}40`,
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </Zoom>
          )}

          {/* ✅ PROCESO COMPLETADO */}
          {currentStep === 'complete' && (
            <Slide direction="up" in>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{
                  bgcolor: darkProTokens.success,
                  color: darkProTokens.textPrimary,
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  animation: 'pulse 2s infinite'
                }}>
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography variant="h5" sx={{ color: darkProTokens.success, mb: 2, fontWeight: 700 }}>
                  ¡Huella Registrada!
                </Typography>
                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
                  La huella dactilar ha sido capturada y guardada exitosamente en el sistema
                </Typography>

                {quality && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Chip
                      icon={<QualityIcon />}
                      label={`Calidad: ${quality}%`}
                      sx={{
                        bgcolor: `${darkProTokens.success}20`,
                        color: darkProTokens.success,
                        border: `1px solid ${darkProTokens.success}40`,
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      icon={<TimerIcon />}
                      label={`Tiempo: ${elapsedTime}s`}
                      sx={{
                        bgcolor: `${darkProTokens.info}20`,
                        color: darkProTokens.info,
                        border: `1px solid ${darkProTokens.info}40`,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Slide>
          )}
        </Box>
      </DialogContent>

      {/* 🎯 ACCIONES */}
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

            {user.fingerprint && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={deleteFingerprintCapture}
                disabled={isProcessing}
                sx={{
                  color: darkProTokens.error,
                  borderColor: darkProTokens.error,
                  '&:hover': {
                    bgcolor: `${darkProTokens.error}10`,
                    borderColor: darkProTokens.errorHover
                  }
                }}
              >
                Eliminar Huella
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={<FingerprintIcon />}
              onClick={startFingerprintCapture}
              disabled={!selectedFinger || !wsConnected || isProcessing}
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
              Registrar Huella
            </Button>
          </>
        )}

        {currentStep !== 'selection' && currentStep !== 'complete' && (
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
              Cancelar Proceso
            </Button>
          </>
        )}

        {currentStep === 'complete' && (
          <Button
            onClick={handleClose}
            variant="contained"
            startIcon={<DoneIcon />}
            sx={{
              bgcolor: darkProTokens.success,
              color: darkProTokens.textPrimary,
              fontWeight: 600,
              '&:hover': {
                bgcolor: darkProTokens.successHover,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${darkProTokens.success}50`
              },
              transition: 'all 0.3s ease'
            }}
          >
            Finalizar
          </Button>
        )}
      </DialogActions>

      {/* 🎨 CSS ANIMATIONS */}
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