'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  Button,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Block as BlockIcon,
  Timer as TimerIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon,
  DeviceHub as DeviceHubIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 🎨 DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#D4AC00',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#C62828',
  warning: '#FFB300',
  warningHover: '#FF8F00',
  info: '#1976D2',
  infoHover: '#1565C0',
  grayDark: '#333333',
  grayMedium: '#444444',
  borderDefault: '#333333',
  focusRing: 'rgba(255,204,0,0.4)',
  hoverOverlay: 'rgba(255,255,255,0.08)',
  notifSuccessBg: 'rgba(56,142,60,0.1)',
  notifErrorBg: 'rgba(211,47,47,0.1)',
  notifWarningBg: 'rgba(255,179,0,0.1)',
  notifInfoBg: 'rgba(25,118,210,0.1)'
};

// 🔗 INTERFACES
interface AccessAttempt {
  id: string;
  user_id: string;
  device_id: string;
  access_type: 'entry' | 'exit' | 'denied';
  access_method: 'fingerprint' | 'card' | 'manual' | 'qr';
  success: boolean;
  confidence_score: number;
  denial_reason?: string;
  membership_status?: string;
  created_at: string;
  device_timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    rol: string;
  };
  device?: {
    name: string;
    type: string;
    ip_address: string;
  };
}

interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  ip_address: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string;
  user_count: number;
  fingerprint_count: number;
}

interface AccessStats {
  totalToday: number;
  successfulToday: number;
  deniedToday: number;
  currentlyInside: number;
  averageConfidence: number;
}

interface ZKAgentStatus {
  status: 'disconnected' | 'connected' | 'error' | 'capturing';
  lastMessage?: string;
  deviceConnected?: boolean;
  sdkInitialized?: boolean;
}

// 🚀 COMPONENTE PRINCIPAL
export default function AccesosTiempoReal() {
  // 📊 ESTADOS
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState<AccessAttempt[]>([]);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [stats, setStats] = useState<AccessStats>({
    totalToday: 0,
    successfulToday: 0,
    deniedToday: 0,
    currentlyInside: 0,
    averageConfidence: 0
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<AccessAttempt | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [zkAgentStatus, setZkAgentStatus] = useState<ZKAgentStatus>({
    status: 'disconnected',
    deviceConnected: false,
    sdkInitialized: false
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // 🔗 REFERENCIAS
  const wsRef = useRef<WebSocket | null>(null);
  const accessListRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🌐 CONFIGURACIÓN - TU ZK ACCESS AGENT
  const ZK_AGENT_WS_URL = 'ws://127.0.0.1:8080';
  const ZK_AGENT_HTTP_URL = 'http://127.0.0.1:4001';
  const RECONNECT_INTERVAL = 3000;
  const CAPTURE_TIMEOUT = 15000; // 15 segundos para captura

  // 🔄 CONECTAR AL ZK ACCESS AGENT REAL
  const connectToZKAgent = useCallback(() => {
    try {
      console.log('🔌 Conectando al ZK Access Agent real...');
      console.log('📡 WebSocket URL:', ZK_AGENT_WS_URL);
      console.log('📡 HTTP URL:', ZK_AGENT_HTTP_URL);
      console.log('👤 Usuario actual: luishdz04');
      console.log('📅 Fecha actual: 2025-06-17 08:28:59 UTC');
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('⚠️ WebSocket ya está conectado');
        return;
      }
      
      wsRef.current = new WebSocket(ZK_AGENT_WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ Conectado exitosamente al ZK Access Agent');
        setWsConnected(true);
        setZkAgentStatus(prev => ({
          ...prev,
          status: 'connected',
          lastMessage: 'Conexión establecida'
        }));
        
        showSnackbar('✅ Conectado al ZK Access Agent', 'success');
        
        // 📡 SOLICITAR ESTADO INICIAL DEL DISPOSITIVO
        wsRef.current?.send(JSON.stringify({
          action: 'get_device_status',
          timestamp: Date.now(),
          user: 'luishdz04'
        }));

        // 📡 CONFIRMAR QUE ESTAMOS LISTOS PARA RECIBIR EVENTOS
        wsRef.current?.send(JSON.stringify({
          action: 'subscribe_events',
          events: ['fingerprint_captured', 'device_status', 'access_verification'],
          timestamp: Date.now()
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleZKAgentMessage(message);
        } catch (error) {
          console.error('❌ Error parseando mensaje del ZK Agent:', error);
          console.log('📨 Mensaje raw:', event.data);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 Desconectado del ZK Access Agent', event.code, event.reason);
        setWsConnected(false);
        setZkAgentStatus(prev => ({
          ...prev,
          status: 'disconnected',
          lastMessage: `Desconectado: ${event.reason || 'Sin razón'}`
        }));
        
        showSnackbar('🔌 Desconectado del ZK Access Agent', 'warning');
        
        // Reconectar automáticamente si está monitoreando
        if (isMonitoring) {
          console.log('🔄 Reintentando conexión en', RECONNECT_INTERVAL / 1000, 'segundos...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToZKAgent();
          }, RECONNECT_INTERVAL);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error de WebSocket:', error);
        setWsConnected(false);
        setZkAgentStatus(prev => ({
          ...prev,
          status: 'error',
          lastMessage: 'Error de conexión'
        }));
        
        showSnackbar('❌ Error conectando al ZK Access Agent', 'error');
      };
      
    } catch (error) {
      console.error('❌ Error creando conexión WebSocket:', error);
      setWsConnected(false);
      setZkAgentStatus(prev => ({
        ...prev,
        status: 'error',
        lastMessage: 'Error al crear conexión'
      }));
      
      showSnackbar('❌ Error de conexión WebSocket', 'error');
    }
  }, [isMonitoring]);

  // 📨 MANEJAR MENSAJES DEL ZK ACCESS AGENT
  const handleZKAgentMessage = useCallback((message: any) => {
    console.log('📨 Mensaje del ZK Agent recibido:', message);
    setLastUpdate(new Date());
    
    switch (message.type) {
      case 'fingerprint_captured':
        console.log('🖐️ Huella capturada detectada');
        handleFingerprintCapture(message.data);
        break;
        
      case 'device_status':
        console.log('📱 Estado del dispositivo actualizado');
        handleDeviceStatus(message.data);
        break;
        
      case 'capture_started':
        console.log('🚀 Captura iniciada');
        setIsCapturing(true);
        setCaptureMessage('🖐️ Coloque su dedo en el lector ZKTeco...');
        setZkAgentStatus(prev => ({
          ...prev,
          status: 'capturing'
        }));
        break;
        
      case 'capture_timeout':
        console.log('⏱️ Timeout de captura');
        setIsCapturing(false);
        setCaptureMessage(null);
        showSnackbar('⏱️ Tiempo de captura agotado', 'warning');
        break;
        
      case 'capture_error':
        console.log('❌ Error en captura:', message.error);
        setIsCapturing(false);
        setCaptureMessage(null);
        showSnackbar(`❌ Error de captura: ${message.error}`, 'error');
        break;
        
      case 'agent_status':
        console.log('🤖 Estado del Agent actualizado');
        handleAgentStatus(message.data);
        break;
        
      case 'error':
        console.error('❌ Error del ZK Agent:', message.error);
        showSnackbar(`❌ Error: ${message.error}`, 'error');
        break;
        
      case 'connection_established':
        console.log('🔗 Conexión establecida con el Agent');
        setZkAgentStatus(prev => ({
          ...prev,
          status: 'connected',
          lastMessage: 'Conexión establecida'
        }));
        break;
        
      default:
        console.log('📨 Tipo de mensaje no manejado:', message.type);
        setZkAgentStatus(prev => ({
          ...prev,
          lastMessage: `Mensaje: ${message.type}`
        }));
    }
  }, [autoScroll]);

  // 🖐️ MANEJAR CAPTURA DE HUELLA REAL
  const handleFingerprintCapture = useCallback(async (data: any) => {
    try {
      console.log('🖐️ Procesando huella capturada del dispositivo real:', data);
      
      setIsCapturing(false);
      setCaptureMessage('🔍 Verificando huella...');
      
      // 🔍 VERIFICAR HUELLA CONTRA BASE DE DATOS
      const verificationResponse = await fetch('/api/access-control/verify-fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: data.template || `fingerprint_${Date.now()}`,
          quality: data.quality || 85,
          device_id: 'zk-device-real',
          capture_time: data.timestamp || new Date().toISOString(),
          user_context: 'luishdz04' // Para dar prioridad a tu usuario
        })
      });
      
      const verificationResult = await verificationResponse.json();
      setCaptureMessage(null);
      
      if (verificationResult.success) {
        console.log('✅ Verificación exitosa:', verificationResult);
        
        // ✅ CREAR NUEVO INTENTO DE ACCESO
        const newAttempt: AccessAttempt = {
          id: `access_${Date.now()}`,
          user_id: verificationResult.user?.id || 'unknown',
          device_id: 'zk-device-real',
          access_type: 'entry',
          access_method: 'fingerprint',
          success: verificationResult.access_granted,
          confidence_score: verificationResult.confidence_score || 0,
          denial_reason: verificationResult.access_granted ? null : verificationResult.denial_reason,
          membership_status: verificationResult.membership_status || 'unknown',
          created_at: new Date().toISOString(),
          device_timestamp: data.timestamp || new Date().toISOString(),
          user: verificationResult.user || {
            firstName: 'Desconocido',
            lastName: '',
            rol: 'guest'
          },
          device: {
            name: 'ZKTeco Real Device',
            type: 'zk9500',
            ip_address: '127.0.0.1'
          }
        };
        
        // Agregar a la lista de intentos
        setAccessAttempts(prev => [newAttempt, ...prev.slice(0, 99)]);
        
        // Actualizar estadísticas
        setStats(prev => ({
          ...prev,
          totalToday: prev.totalToday + 1,
          successfulToday: newAttempt.success ? prev.successfulToday + 1 : prev.successfulToday,
          deniedToday: newAttempt.success ? prev.deniedToday : prev.deniedToday + 1,
          averageConfidence: prev.totalToday > 0 
            ? Math.round((prev.averageConfidence * prev.totalToday + newAttempt.confidence_score) / (prev.totalToday + 1))
            : newAttempt.confidence_score,
          currentlyInside: newAttempt.success && newAttempt.access_type === 'entry' 
            ? prev.currentlyInside + 1 
            : prev.currentlyInside
        }));

        // Auto scroll
        if (autoScroll && accessListRef.current) {
          setTimeout(() => {
            accessListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }

        // Mostrar notificación
        if (newAttempt.success) {
          const userName = verificationResult.user ? `${verificationResult.user.firstName} ${verificationResult.user.lastName}` : 'Usuario';
          showSnackbar(`🎉 Acceso concedido: ${userName}`, 'success');
          console.log('🎉 ACCESO CONCEDIDO:', userName, `(${newAttempt.confidence_score}%)`);
        } else {
          showSnackbar(`❌ Acceso denegado: ${verificationResult.denial_reason}`, 'error');
          console.log('❌ ACCESO DENEGADO:', verificationResult.denial_reason);
        }
      } else {
        console.error('❌ Error en verificación:', verificationResult.error);
        showSnackbar(`❌ Error de verificación: ${verificationResult.error}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Error procesando huella capturada:', error);
      setIsCapturing(false);
      setCaptureMessage(null);
      showSnackbar('❌ Error procesando huella capturada', 'error');
    }
  }, [autoScroll]);

  // 📱 MANEJAR ESTADO DEL DISPOSITIVO
  const handleDeviceStatus = useCallback((data: any) => {
    console.log('📱 Actualizando estado del dispositivo:', data);
    
    setDevices(prev => {
      const updated = [...prev];
      const index = updated.findIndex(d => d.id === 'zk-device-real');
      
      const deviceStatus: DeviceStatus = {
        id: 'zk-device-real',
        name: 'ZKTeco Real Device',
        type: 'zk9500',
        ip_address: '127.0.0.1',
        status: data.isConnected ? 'connected' : 'disconnected',
        last_sync: new Date().toISOString(),
        user_count: data.deviceCount || 0,
        fingerprint_count: data.fingerprintCount || 0
      };
      
      if (index >= 0) {
        updated[index] = deviceStatus;
      } else {
        updated.push(deviceStatus);
      }
      
      return updated;
    });

    setZkAgentStatus(prev => ({
      ...prev,
      deviceConnected: data.isConnected,
      sdkInitialized: data.sdkInitialized || false
    }));
  }, []);

  // 🤖 MANEJAR ESTADO DEL AGENT
  const handleAgentStatus = useCallback((data: any) => {
    console.log('🤖 Estado del Agent actualizado:', data);
    setZkAgentStatus(prev => ({
      ...prev,
      ...data,
      lastMessage: data.message || prev.lastMessage
    }));
  }, []);

  // 🚀 INICIAR MONITOREO REAL
  const startRealMonitoring = useCallback(() => {
    console.log('🚀 Iniciando monitoreo real del ZK Access Agent...');
    console.log('👤 Usuario: luishdz04');
    console.log('📅 Fecha: 2025-06-17 08:28:59 UTC');
    
    setIsMonitoring(true);
    connectToZKAgent();
    
    showSnackbar('🚀 Iniciando monitoreo biométrico...', 'info');
  }, [connectToZKAgent]);

  // ⏹️ DETENER MONITOREO
  const stopRealMonitoring = useCallback(() => {
    console.log('⏹️ Deteniendo monitoreo real...');
    setIsMonitoring(false);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Enviar comando para detener monitoreo
      wsRef.current.send(JSON.stringify({
        action: 'stop_monitoring',
        timestamp: Date.now(),
        user: 'luishdz04'
      }));
      
      setTimeout(() => {
        wsRef.current?.close();
      }, 500);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
    
    setWsConnected(false);
    setIsCapturing(false);
    setCaptureMessage(null);
    setZkAgentStatus({
      status: 'disconnected',
      deviceConnected: false,
      sdkInitialized: false,
      lastMessage: 'Monitoreo detenido'
    });
    
    showSnackbar('⏹️ Monitoreo detenido', 'info');
  }, []);

  // 🧪 SOLICITAR CAPTURA DE PRUEBA
  const requestTestCapture = useCallback(async () => {
    if (!wsConnected) {
      showSnackbar('❌ No conectado al ZK Agent', 'error');
      return;
    }
    
    if (isCapturing) {
      showSnackbar('⚠️ Ya hay una captura en proceso', 'warning');
      return;
    }
    
    try {
      console.log('🧪 Solicitando captura de prueba para luishdz04...');
      
      setIsCapturing(true);
      setCaptureMessage('🚀 Iniciando captura...');
      
      wsRef.current?.send(JSON.stringify({
        action: 'capture_fingerprint',
        test_mode: true,
        timeout: CAPTURE_TIMEOUT,
        timestamp: Date.now(),
        user: 'luishdz04',
        expected_user: 'luishdz04' // Para dar contexto al Agent
      }));
      
      console.log('📤 Comando de captura enviado');
      showSnackbar('🖐️ Coloque su dedo en el lector ZKTeco', 'info');
      
      // Timeout de seguridad
      captureTimeoutRef.current = setTimeout(() => {
        if (isCapturing) {
          setIsCapturing(false);
          setCaptureMessage(null);
          showSnackbar('⏱️ Tiempo de captura agotado', 'warning');
        }
      }, CAPTURE_TIMEOUT + 2000);
      
    } catch (error) {
      console.error('❌ Error solicitando captura:', error);
      setIsCapturing(false);
      setCaptureMessage(null);
      showSnackbar('❌ Error solicitando captura', 'error');
    }
  }, [wsConnected, isCapturing]);

  // 📊 CARGAR DATOS INICIALES
  const loadAccessData = useCallback(async () => {
    try {
      const response = await fetch('/api/access-control/recent-attempts');
      if (response.ok) {
        const data = await response.json();
        setAccessAttempts(data.attempts || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  }, [stats]);

  // 🔔 MOSTRAR SNACKBAR
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // 🔄 useEffect PRINCIPAL
  useEffect(() => {
    console.log('🔄 Componente inicializado');
    console.log('👤 Usuario: luishdz04');
    console.log('📅 Fecha: 2025-06-17 08:28:59 UTC');
    
    loadAccessData();
    
    return () => {
      console.log('🧹 Limpiando componente...');
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [loadAccessData]);

  // 🎨 FUNCIONES AUXILIARES
  const getAccessIcon = (attempt: AccessAttempt) => {
    if (!attempt.success) {
      return <BlockIcon sx={{ color: darkProTokens.error }} />;
    }
    
    switch (attempt.access_type) {
      case 'entry':
        return <LoginIcon sx={{ color: darkProTokens.success }} />;
      case 'exit':
        return <LogoutIcon sx={{ color: darkProTokens.warning }} />;
      default:
        return <SecurityIcon sx={{ color: darkProTokens.info }} />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return darkProTokens.success;
    if (score >= 75) return darkProTokens.warning;
    return darkProTokens.error;
  };

  const getAgentStatusColor = () => {
    switch (zkAgentStatus.status) {
      case 'connected':
        return darkProTokens.success;
      case 'capturing':
        return darkProTokens.primary;
      case 'error':
        return darkProTokens.error;
      default:
        return darkProTokens.textDisabled;
    }
  };

  const getAgentStatusIcon = () => {
    switch (zkAgentStatus.status) {
      case 'connected':
        return <WifiIcon />;
      case 'capturing':
        return <TouchAppIcon />;
      case 'error':
        return <CancelIcon />;
      default:
        return <WifiOffIcon />;
    }
  };

  // 🎨 COMPONENTE DE ESTADÍSTICAS
  const StatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card sx={{ 
          bgcolor: darkProTokens.surfaceLevel2, 
          border: `1px solid ${darkProTokens.info}40`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${darkProTokens.info}30`
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: darkProTokens.info, mx: 'auto', mb: 1, width: 40, height: 40 }}>
              <TrendingUpIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              {stats.totalToday}
            </Typography>
            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
              Total Hoy
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card sx={{ 
          bgcolor: darkProTokens.surfaceLevel2, 
          border: `1px solid ${darkProTokens.success}40`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${darkProTokens.success}30`
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: darkProTokens.success, mx: 'auto', mb: 1, width: 40, height: 40 }}>
              <CheckCircleIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              {stats.successfulToday}
            </Typography>
            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
              Exitosos
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card sx={{ 
          bgcolor: darkProTokens.surfaceLevel2, 
          border: `1px solid ${darkProTokens.error}40`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${darkProTokens.error}30`
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: darkProTokens.error, mx: 'auto', mb: 1, width: 40, height: 40 }}>
              <CancelIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              {stats.deniedToday}
            </Typography>
            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
              Denegados
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card sx={{ 
          bgcolor: darkProTokens.surfaceLevel2, 
          border: `1px solid ${darkProTokens.primary}40`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${darkProTokens.primary}30`
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: darkProTokens.primary, mx: 'auto', mb: 1, width: 40, height: 40 }}>
              <GroupIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              {stats.currentlyInside}
            </Typography>
            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
              Dentro Ahora
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card sx={{ 
          bgcolor: darkProTokens.surfaceLevel2, 
          border: `1px solid ${darkProTokens.warning}40`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${darkProTokens.warning}30`
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: darkProTokens.warning, mx: 'auto', mb: 1, width: 40, height: 40 }}>
              <FingerprintIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              {stats.averageConfidence}%
            </Typography>
            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
              Confianza Promedio
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // 🎨 COMPONENTE DE ESTADO DE DISPOSITIVOS
  const DeviceStatus = () => (
    <Card sx={{ bgcolor: darkProTokens.surfaceLevel2, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 2, fontWeight: 700 }}>
          Estado de Dispositivos ZKTeco
        </Typography>
        
        <Grid container spacing={2}>
          {devices.length === 0 ? (
            <Grid size={12}>
              <Paper sx={{ 
                p: 3, 
                bgcolor: darkProTokens.surfaceLevel1,
                border: `1px solid ${darkProTokens.grayDark}`,
                textAlign: 'center'
              }}>
                <DeviceHubIcon sx={{ fontSize: 48, color: darkProTokens.textDisabled, mb: 2 }} />
                <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                  {isMonitoring ? 'Conectando a dispositivos...' : 'Inicie el monitoreo para ver dispositivos'}
                </Typography>
              </Paper>
            </Grid>
          ) : (
            devices.map((device) => (
              <Grid key={device.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: darkProTokens.surfaceLevel1,
                  border: `1px solid ${device.status === 'connected' ? darkProTokens.success : darkProTokens.error}40`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 15px ${device.status === 'connected' ? darkProTokens.success : darkProTokens.error}30`
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                      bgcolor: device.status === 'connected' ? darkProTokens.success : darkProTokens.error,
                      width: 32,
                      height: 32
                    }}>
                      {device.status === 'connected' ? <WifiIcon /> : <WifiOffIcon />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {device.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        {device.ip_address} • {device.fingerprint_count} huellas
                      </Typography>
                    </Box>
                    <Chip
                      label={device.status}
                      size="small"
                      sx={{
                        bgcolor: device.status === 'connected' ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                        color: device.status === 'connected' ? darkProTokens.success : darkProTokens.error,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, bgcolor: darkProTokens.background, minHeight: '100vh' }}>
      {/* HEADER ACTUALIZADO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 700, mb: 1 }}>
            🔒 Control de Acceso ZKTeco Real
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
            Conectado al ZK Access Agent • Usuario: luishdz04 • {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 🧪 BOTÓN CAPTURA DE PRUEBA */}
          <Button
            variant="outlined"
            onClick={requestTestCapture}
            disabled={!wsConnected || isCapturing}
            startIcon={isCapturing ? <CircularProgress size={16} /> : <FingerprintIcon />}
            sx={{
              borderColor: isCapturing ? darkProTokens.warning : darkProTokens.primary,
              color: isCapturing ? darkProTokens.warning : darkProTokens.primary,
              minWidth: '180px',
              '&:hover': {
                borderColor: darkProTokens.primaryHover,
                bgcolor: `${darkProTokens.primary}10`
              },
              '&:disabled': {
                borderColor: darkProTokens.textDisabled,
                color: darkProTokens.textDisabled
              }
            }}
          >
            {isCapturing ? 'Capturando...' : 'Capturar Huella Real'}
          </Button>
          
          {lastUpdate && (
            <Chip
              icon={<AccessTimeIcon />}
              label={`Actualizado: ${format(lastUpdate, 'HH:mm:ss', { locale: es })}`}
              size="small"
              sx={{
                bgcolor: `${darkProTokens.info}20`,
                color: darkProTokens.info,
                border: `1px solid ${darkProTokens.info}40`
              }}
            />
          )}
          
          {/* ESTADO DEL ZK AGENT */}
          <Tooltip title={zkAgentStatus.lastMessage || 'Sin información'}>
            <Chip
              icon={getAgentStatusIcon()}
              label={
                zkAgentStatus.status === 'connected' ? 'ZK Agent Conectado' :
                zkAgentStatus.status === 'capturing' ? 'Capturando Huella' :
                zkAgentStatus.status === 'error' ? 'Error ZK Agent' : 
                'ZK Agent Desconectado'
              }
              size="small"
              sx={{
                bgcolor: `${getAgentStatusColor()}20`,
                color: getAgentStatusColor(),
                border: `1px solid ${getAgentStatusColor()}40`,
                fontWeight: 600,
                ...(zkAgentStatus.status === 'capturing' && {
                  animation: 'pulse 2s infinite'
                })
              }}
            />
          </Tooltip>
          
          {/* BOTÓN MONITOREO REAL */}
          <Button
            variant="contained"
            onClick={isMonitoring ? stopRealMonitoring : startRealMonitoring}
            startIcon={isMonitoring ? <StopIcon /> : <PlayArrowIcon />}
            sx={{
              bgcolor: isMonitoring ? darkProTokens.error : darkProTokens.primary,
              color: darkProTokens.background,
              fontWeight: 600,
              minWidth: '160px',
              boxShadow: `0 4px 15px ${isMonitoring ? darkProTokens.error : darkProTokens.primary}40`,
              '&:hover': {
                bgcolor: isMonitoring ? darkProTokens.errorHover : darkProTokens.primaryHover,
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 20px ${isMonitoring ? darkProTokens.error : darkProTokens.primary}50`
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isMonitoring ? 'Detener' : 'Iniciar'} Monitoreo Real
          </Button>
        </Box>
      </Box>

      {/* MENSAJE DE CAPTURA */}
      {captureMessage && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            bgcolor: `${darkProTokens.primary}20`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.primary}40`,
            '& .MuiAlert-icon': { color: darkProTokens.primary },
            animation: 'pulse 2s infinite'
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>
            {captureMessage}
          </Typography>
        </Alert>
      )}

      {/* ESTADÍSTICAS */}
      <StatsCards />

      {/* ESTADO DE DISPOSITIVOS */}
      <DeviceStatus />

      {/* CONTROLES DE LISTA */}
      <Card sx={{ bgcolor: darkProTokens.surfaceLevel2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
              Intentos de Acceso en Tiempo Real
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: darkProTokens.primary,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: darkProTokens.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: darkProTokens.textSecondary, fontSize: '0.875rem' }}>
                    Auto-scroll
                  </Typography>
                }
              />
              
              <IconButton
                onClick={loadAccessData}
                sx={{ 
                  color: darkProTokens.textSecondary,
                  '&:hover': {
                    color: darkProTokens.textPrimary,
                    bgcolor: darkProTokens.hoverOverlay
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* LISTA DE INTENTOS DE ACCESO */}
      <Card sx={{ bgcolor: darkProTokens.surfaceLevel2, height: '60vh', overflow: 'hidden' }}>
        <Box 
          ref={accessListRef}
          sx={{ 
            height: '100%', 
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { bgcolor: darkProTokens.grayDark },
            '&::-webkit-scrollbar-thumb': { 
              bgcolor: darkProTokens.primary,
              borderRadius: '4px',
              '&:hover': { bgcolor: darkProTokens.primaryHover }
            }
          }}
        >
          {accessAttempts.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              gap: 2,
              p: 4
            }}>
              <SecurityIcon sx={{ fontSize: 64, color: darkProTokens.textDisabled }} />
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, textAlign: 'center' }}>
                {isMonitoring ? 'Esperando detecciones del dispositivo ZKTeco...' : 'Inicie el monitoreo para detectar huellas en tiempo real'}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, textAlign: 'center', maxWidth: 400 }}>
                {isMonitoring 
                  ? 'Coloque su dedo en el lector ZKTeco o use "Capturar Huella Real" para probar'
                  : 'Active el sistema y el dispositivo ZKTeco detectará automáticamente las huellas'
                }
              </Typography>
              {isMonitoring && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress sx={{ color: darkProTokens.primary }} size={20} />
                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                    Sistema activo - Aguardando detecciones...
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {accessAttempts.map((attempt, index) => (
                <React.Fragment key={attempt.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: darkProTokens.surfaceLevel3,
                        transform: 'translateX(4px)'
                      },
                      borderLeft: `4px solid ${attempt.success ? darkProTokens.success : darkProTokens.error}`,
                      py: 2
                    }}
                    onClick={() => {
                      setSelectedAttempt(attempt);
                      setDetailsOpen(true);
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Avatar sx={{ 
                            width: 16, 
                            height: 16, 
                            bgcolor: attempt.access_method === 'fingerprint' ? darkProTokens.primary : darkProTokens.info
                          }}>
                            <FingerprintIcon sx={{ fontSize: 10 }} />
                          </Avatar>
                        }
                      >
                        <Avatar 
                          src={attempt.user?.profilePictureUrl}
                          sx={{ 
                            bgcolor: attempt.success ? darkProTokens.success : darkProTokens.error,
                            color: darkProTokens.textPrimary,
                            width: 48,
                            height: 48
                          }}
                        >
                          {attempt.user ? 
                            `${attempt.user.firstName[0]}${attempt.user.lastName?.[0] || ''}` : 
                            <PersonIcon />
                          }
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {getAccessIcon(attempt)}
                          <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600, fontSize: '1rem' }}>
                            {attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : 'Usuario Desconocido'}
                          </Typography>
                          <Chip
                            label={attempt.access_type}
                            size="small"
                            sx={{
                              bgcolor: attempt.success ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                              color: attempt.success ? darkProTokens.success : darkProTokens.error,
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          />
                          {attempt.user?.id === 'luishdz04' && (
                            <Chip
                              label="TÚ"
                              size="small"
                              sx={{
                                bgcolor: `${darkProTokens.primary}20`,
                                color: darkProTokens.primary,
                                fontSize: '0.65rem',
                                fontWeight: 700
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, display: 'block' }}>
                              {format(new Date(attempt.created_at), 'HH:mm:ss dd/MM/yyyy', { locale: es })}
                            </Typography>
                            {attempt.denial_reason && (
                              <Typography variant="caption" sx={{ color: darkProTokens.error, display: 'block', fontWeight: 600 }}>
                                {attempt.denial_reason}
                              </Typography>
                            )}
                          </Box>
                          
                          {attempt.confidence_score > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={attempt.confidence_score}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: darkProTokens.grayDark,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getConfidenceColor(attempt.confidence_score),
                                    borderRadius: 3
                                  }
                                }}
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: getConfidenceColor(attempt.confidence_score),
                                  fontWeight: 600,
                                  minWidth: '35px'
                                }}
                              >
                                {attempt.confidence_score}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    
                    <IconButton size="small" sx={{ color: darkProTokens.textSecondary }}>
                      <VisibilityIcon />
                    </IconButton>
                  </ListItem>
                  
                  {index < accessAttempts.length - 1 && (
                    <Divider sx={{ bgcolor: darkProTokens.grayDark }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Card>

      {/* DIALOG DE DETALLES */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: darkProTokens.surfaceLevel2,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.grayDark}`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Detalles del Intento de Acceso
          </Typography>
          <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: darkProTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedAttempt && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: darkProTokens.primary, mb: 1, fontWeight: 600 }}>
                  👤 Información del Usuario
                </Typography>
                <Box sx={{ p: 2, bgcolor: darkProTokens.surfaceLevel1, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                    <strong>Nombre:</strong> {selectedAttempt.user?.firstName} {selectedAttempt.user?.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                    <strong>Rol:</strong> {selectedAttempt.user?.rol}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                    <strong>Estado Membresía:</strong> {selectedAttempt.membership_status || 'N/A'}
                  </Typography>
                  {selectedAttempt.user?.id === 'luishdz04' && (
                    <Chip
                      label="👤 TU ACCESO"
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: `${darkProTokens.primary}20`,
                        color: darkProTokens.primary,
                        fontWeight: 700
                      }}
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: darkProTokens.warning, mb: 1, fontWeight: 600 }}>
                  🔒 Detalles del Acceso
                </Typography>
                <Box sx={{ p: 2, bgcolor: darkProTokens.surfaceLevel1, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                    <strong>Tipo:</strong> {selectedAttempt.access_type}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                    <strong>Método:</strong> {selectedAttempt.access_method}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                    <strong>Estado:</strong> 
                    <Chip
                      label={selectedAttempt.success ? 'Exitoso' : 'Denegado'}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: selectedAttempt.success ? `${darkProTokens.success}20` : `${darkProTokens.error}20`,
                        color: selectedAttempt.success ? darkProTokens.success : darkProTokens.error
                      }}
                    />
                  </Typography>
                  {selectedAttempt.confidence_score > 0 && (
                    <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                      <strong>Confianza:</strong> {selectedAttempt.confidence_score}%
                    </Typography>
                  )}
                  {selectedAttempt.denial_reason && (
                    <Typography variant="body2" sx={{ color: darkProTokens.error, mt: 1 }}>
                      <strong>Razón de Denegación:</strong> {selectedAttempt.denial_reason}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ color: darkProTokens.info, mb: 1, fontWeight: 600 }}>
                  ⏰ Información Temporal y Dispositivo
                </Typography>
                <Box sx={{ p: 2, bgcolor: darkProTokens.surfaceLevel1, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                    <strong>Fecha y Hora:</strong> {format(new Date(selectedAttempt.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                    <strong>Timestamp del Dispositivo:</strong> {format(new Date(selectedAttempt.device_timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </Typography>
                  {selectedAttempt.device && (
                    <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, mt: 1 }}>
                      <strong>Dispositivo:</strong> {selectedAttempt.device.name} ({selectedAttempt.device.ip_address})
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
                    <strong>Capturado desde:</strong> ZK Access Agent Real
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)} sx={{ color: darkProTokens.textSecondary }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR PARA NOTIFICACIONES */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          sx={{ 
            width: '100%',
            bgcolor: 
              snackbarSeverity === 'success' ? darkProTokens.notifSuccessBg :
              snackbarSeverity === 'error' ? darkProTokens.notifErrorBg :
              snackbarSeverity === 'warning' ? darkProTokens.notifWarningBg :
              darkProTokens.notifInfoBg,
            color: darkProTokens.textPrimary,
            '& .MuiAlert-icon': { 
              color: 
                snackbarSeverity === 'success' ? darkProTokens.success :
                snackbarSeverity === 'error' ? darkProTokens.error :
                snackbarSeverity === 'warning' ? darkProTokens.warning :
                darkProTokens.info
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ALERTA DE ESTADO */}
      {!isMonitoring && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 350,
            bgcolor: `${darkProTokens.info}20`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.info}40`,
            '& .MuiAlert-icon': { color: darkProTokens.info }
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            🖐️ Sistema ZKTeco Real Disponible
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Usuario: luishdz04<br/>
            Fecha: 2025-06-17 08:28:59 UTC
          </Typography>
          <Typography variant="caption">
            1. Inicie el monitoreo real<br/>
            2. Use "Capturar Huella Real" para probar<br/>
            3. Coloque su dedo en el dispositivo ZKTeco físico
          </Typography>
        </Alert>
      )}

            {/* ESTILOS CSS PARA ANIMACIONES */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .access-item-enter {
          animation: slideInRight 0.3s ease-out;
        }
        
        .capture-pulse {
          animation: pulse 2s infinite;
        }
        
        .stats-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stats-card-hover:hover {
          transform: translateY(-4px) scale(1.02);
        }
      `}</style>
    </Box>
  );
}