'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid as Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  CircularProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

// Icons
import SecurityIcon from '@mui/icons-material/Security';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import TestIcon from '@mui/icons-material/BugReport';
import DevicesIcon from '@mui/icons-material/Devices';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SyncIcon from '@mui/icons-material/Sync';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import MemoryIcon from '@mui/icons-material/Memory';

// ✅ TIPOS MEJORADOS CON ESTADO DE CONEXIÓN DETALLADO
interface BiometricDevice {
  id: string;
  name: string;
  type: 'zk9500';
  model: string;
  ip_address: string;
  port: number;
  ws_port: number;
  status: 'connected' | 'disconnected' | 'error' | 'testing' | 'connecting';
  firmware_version?: string;
  user_count: number;
  fingerprint_count: number;
  last_sync?: string;
  uptime?: number;
  responseTime?: number;
  isOnline: boolean;
  location?: string;
  is_active: boolean;
  // ✅ NUEVOS CAMPOS PARA ESTADO DETALLADO
  lastPing?: string;
  connectivity?: {
    websocket: 'connected' | 'disconnected' | 'error';
    api: 'connected' | 'disconnected' | 'error';
    hardware: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    lastCheck: string;
    errorMessage?: string;
  };
  hardwareInfo?: {
    serialNumber?: string;
    deviceTemperature?: number;
    memoryUsage?: number;
    storageUsage?: number;
  };
}

interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
  uptime: number;
  systemLoad?: number;
  memoryUsage?: number;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'critical';
}

interface ActiveSessions {
  enrollments: number;
  verifications: number;
  total: number;
  activeUsers?: string[];
}

interface RecentActivity {
  totalAccesses: number;
  successfulAccesses: number;
  deniedAccesses: number;
  last24Hours: number;
  averageResponseTime?: number;
  peakHours?: string[];
}

interface DeviceOperation {
  deviceId: string;
  operation: 'add' | 'remove' | 'update' | 'sync' | 'reset' | 'backup' | 'restore' | 'test' | 'ping';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
  startedAt: string;
  estimatedDuration?: number;
}

// ✅ ESTADO DE CONEXIÓN EN TIEMPO REAL
interface ConnectionTestResult {
  deviceId: string;
  success: boolean;
  responseTime: number;
  websocketStatus: boolean;
  apiStatus: boolean;
  hardwareStatus: boolean;
  details: string;
  timestamp: string;
  errorDetails?: string;
}

export default function BiometricDeviceManager() {
  // ✅ ESTADOS MEJORADOS CON TESTING
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSessions | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [activeOperations, setActiveOperations] = useState<DeviceOperation[]>([]);
  const [connectionTests, setConnectionTests] = useState<{ [deviceId: string]: ConnectionTestResult }>({});
  const [testingDevices, setTestingDevices] = useState<Set<string>>(new Set());
  
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '127.0.0.1',  // ✅ CAMBIO: IP LOCAL para ZK Access Agent
    port: 4001,       // ✅ CAMBIO: Puerto del Access Agent
    wsPort: 8080,     // ✅ CAMBIO: Puerto WebSocket del Access Agent
    model: 'ZKTeco ZK9500',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [operationDialog, setOperationDialog] = useState(false);
  const [operationType, setOperationType] = useState<'sync' | 'reset' | 'backup' | 'restore' | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionDialog, setConnectionDialog] = useState(false);
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<BiometricDevice | null>(null);
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // ✅ CARGAR DATOS AL MONTAR CON AUTO-REFRESH
  useEffect(() => {
    loadSystemStatus();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSystemStatus(false, true); // Silencioso en auto-refresh
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // ✅ FUNCIÓN PARA CARGAR ESTADO COMPLETO DEL SISTEMA
  const loadSystemStatus = async (includeHealth: boolean = false, silent: boolean = false) => {
    try {
      if (!silent) setRefreshing(true);
      
      // ✅ LLAMAR A NUESTRA API DE ESTADO (ajustada para ZK Access Agent)
      const response = await fetch(`/api/biometric/status${includeHealth ? '?health=true' : ''}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo estado del sistema');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setDevices(data.data.devices || []);
        setSystemHealth(data.data.systemHealth);
        setActiveSessions(data.data.activeSessions);
        setRecentActivity(data.data.recentActivity);
        
        if (!silent) {
          console.log('✅ Estado del sistema cargado:', data.data);
        }
      } else {
        throw new Error(data.message || 'Error en la respuesta');
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando estado:', error);
      if (!silent) {
        showNotification(`Error cargando estado: ${error.message}`, 'error');
      }
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA PROBAR CONEXIÓN COMPLETA
  const testDeviceConnection = async (deviceId: string) => {
    try {
      setTestingDevices(prev => new Set(prev).add(deviceId));
      
      // Actualizar estado del dispositivo a "testing"
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'testing' }
          : device
      ));
      
      showNotification('🔍 Probando conexión completa...', 'info');

      // ✅ LLAMAR A API DE TEST COMPLETO
      const response = await fetch('/api/biometric/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          testType: 'full', // Probar todo: websocket, api, hardware
          timeout: 10000
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const testResult: ConnectionTestResult = {
          deviceId,
          success: result.data.overall_success,
          responseTime: result.data.total_response_time,
          websocketStatus: result.data.websocket_test,
          apiStatus: result.data.api_test,
          hardwareStatus: result.data.hardware_test,
          details: result.data.summary,
          timestamp: new Date().toISOString(),
          errorDetails: result.data.error_details
        };

        setConnectionTests(prev => ({
          ...prev,
          [deviceId]: testResult
        }));

        // Actualizar estado del dispositivo según resultado
        const newStatus = result.data.overall_success ? 'connected' : 'error';
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { 
                ...device, 
                status: newStatus,
                responseTime: result.data.total_response_time,
                connectivity: {
                  websocket: result.data.websocket_test ? 'connected' : 'error',
                  api: result.data.api_test ? 'connected' : 'error',
                  hardware: result.data.hardware_test ? 'connected' : 'error',
                  responseTime: result.data.total_response_time,
                  lastCheck: new Date().toISOString(),
                  errorMessage: result.data.error_details
                },
                lastPing: new Date().toISOString()
              }
            : device
        ));

        if (result.data.overall_success) {
          showNotification(
            `✅ Conexión exitosa: ${result.data.total_response_time}ms • WS: ${result.data.websocket_test ? '✅' : '❌'} • API: ${result.data.api_test ? '✅' : '❌'} • HW: ${result.data.hardware_test ? '✅' : '❌'}`, 
            'success'
          );
        } else {
          showNotification(
            `❌ Test falló: ${result.data.error_details || 'Error desconocido'}`, 
            'error'
          );
        }
        
      } else {
        throw new Error(result.error || 'Error en test de conexión');
      }
      
    } catch (error: any) {
      console.error('❌ Error en test de conexión:', error);
      
      // Marcar dispositivo como error
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'error' }
          : device
      ));

      setConnectionTests(prev => ({
        ...prev,
        [deviceId]: {
          deviceId,
          success: false,
          responseTime: 0,
          websocketStatus: false,
          apiStatus: false,
          hardwareStatus: false,
          details: 'Error de conexión',
          timestamp: new Date().toISOString(),
          errorDetails: error.message
        }
      }));

      showNotification(`❌ Error probando conexión: ${error.message}`, 'error');
    } finally {
      setTestingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  // ✅ FUNCIÓN PARA PING RÁPIDO
  const quickPingDevice = async (deviceId: string) => {
    try {
      const response = await fetch('/api/biometric/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      const result = await response.json();
      
      if (result.success) {
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { 
                ...device, 
                responseTime: result.data.responseTime,
                lastPing: new Date().toISOString(),
                status: 'connected'
              }
            : device
        ));
        
        showNotification(`🏓 Ping: ${result.data.responseTime}ms`, 'success');
      } else {
        throw new Error(result.error || 'Ping failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error en ping:', error);
      showNotification(`❌ Ping falló: ${error.message}`, 'error');
    }
  };

  // ✅ FUNCIÓN PARA MOSTRAR DETALLES DE CONEXIÓN
  const showDeviceDetails = (device: BiometricDevice) => {
    setSelectedDeviceDetails(device);
    setConnectionDialog(true);
  };

  // ✅ AGREGAR DISPOSITIVO ACTUALIZADO PARA ZK ACCESS AGENT
  const addDevice = async () => {
    if (!newDevice.name || !newDevice.ip) {
      showNotification('Nombre e IP son requeridos', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/biometric/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          deviceData: {
            name: newDevice.name,
            ip: newDevice.ip,
            port: newDevice.port,
            wsPort: newDevice.wsPort,
            model: newDevice.model,
            location: newDevice.location,
            type: 'zk9500'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('✅ Dispositivo agregado exitosamente', 'success');
        setNewDevice({
          name: '',
          ip: '127.0.0.1',
          port: 4001,
          wsPort: 8080,
          model: 'ZKTeco ZK9500',
          location: ''
        });
        await loadSystemStatus();
        
        // Probar conexión automáticamente
        if (result.data?.deviceId) {
          setTimeout(() => {
            testDeviceConnection(result.data.deviceId);
          }, 1000);
        }
      } else {
        throw new Error(result.error || 'Error agregando dispositivo');
      }
      
    } catch (error: any) {
      console.error('❌ Error agregando dispositivo:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER ESTADO EN TIEMPO REAL
  const getRealtimeDeviceStatus = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/biometric/realtime-status/${deviceId}`);
      const result = await response.json();
      
      if (result.success) {
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { 
                ...device, 
                ...result.data,
                lastPing: new Date().toISOString()
              }
            : device
        ));
      }
    } catch (error) {
      console.error('Error obteniendo estado en tiempo real:', error);
    }
  };

  // ✅ RESTO DE FUNCIONES (MANTENIDAS COMO ANTES)
  const refreshDeviceStatus = async (deviceId: string) => {
    try {
      const response = await fetch('/api/biometric/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          action: 'refresh'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('✅ Estado actualizado', 'success');
        await loadSystemStatus();
      } else {
        showNotification(`❌ Error actualizando: ${result.error}`, 'error');
      }
      
    } catch (error: any) {
      console.error('❌ Error actualizando:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  };

  const executeDeviceOperation = async (deviceId: string, operation: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/biometric/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: operation,
          deviceId,
          ...(operation === 'sync' && {
            syncOptions: {
              direction: 'bidirectional',
              includeUsers: true,
              includeFingerprints: true,
              clearBefore: false
            }
          })
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`✅ ${operation} ${result.message}`, 'success');
        
        if (operation === 'sync') {
          showNotification('🔄 Sincronización iniciada', 'info');
        }
        
        await loadSystemStatus();
      } else {
        throw new Error(result.error || `Error en ${operation}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error en ${operation}:`, error);
      showNotification(`Error en ${operation}: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setOperationDialog(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    if (!confirm('¿Estás seguro de remover este dispositivo?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/biometric/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          deviceId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('✅ Dispositivo removido exitosamente', 'success');
        await loadSystemStatus();
      } else {
        throw new Error(result.error || 'Error removiendo dispositivo');
      }
      
    } catch (error: any) {
      console.error('❌ Error removiendo dispositivo:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ✅ FUNCIONES DE ESTADO MEJORADAS
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      case 'error': return '#FF5722';
      case 'testing': return '#FF9800';
      case 'connecting': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error';
      case 'testing': return 'Probando...';
      case 'connecting': return 'Conectando...';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon />;
      case 'disconnected': return <SignalWifiOffIcon />;
      case 'error': return <ErrorIcon />;
      case 'testing': return <NetworkCheckIcon />;
      case 'connecting': return <SignalWifiStatusbar4BarIcon />;
      default: return <ErrorIcon />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#757575';
    }
  };

  const getConnectivityScore = (device: BiometricDevice) => {
    if (!device.connectivity) return 0;
    
    const scores = {
      websocket: device.connectivity.websocket === 'connected' ? 33 : 0,
      api: device.connectivity.api === 'connected' ? 33 : 0,
      hardware: device.connectivity.hardware === 'connected' ? 34 : 0
    };
    
    return scores.websocket + scores.api + scores.hardware;
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      {/* ✅ HEADER MEJORADO CON ESTADO EN TIEMPO REAL */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '2px solid rgba(255, 204, 0, 0.3)',
        borderRadius: 4
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              sx={{ color: '#ffcc00' }}
              onClick={() => window.history.back()}
            >
              <ArrowBackIcon />
            </IconButton>
            <SecurityIcon sx={{ fontSize: 50, color: '#ffcc00' }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" color="#ffcc00">
                Gestión ZK Access Agent
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.7)">
                Control de Acceso ZK9500 • {devices.length} dispositivo(s) • {devices.filter(d => d.status === 'connected').length} conectado(s)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <FormControlLabel
              control={
                <Switch 
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }}
                />
              }
              label="Auto-refresh"
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            />
            <Tooltip title="Actualizar estado completo con health check">
              <IconButton
                onClick={() => loadSystemStatus(true)}
                disabled={refreshing}
                sx={{
                  color: '#ffcc00',
                  border: '1px solid rgba(255, 204, 0, 0.3)',
                  '&:hover': { backgroundColor: 'rgba(255, 204, 0, 0.1)' }
                }}
              >
                {refreshing ? <CircularProgress size={24} sx={{ color: '#ffcc00' }} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => {/* Abrir enrollment */}}
              disabled={devices.filter(d => d.status === 'connected').length === 0}
              sx={{
                borderColor: '#ffcc00',
                color: '#ffcc00',
                '&:hover': { borderColor: '#e6b800', backgroundColor: 'rgba(255, 204, 0, 0.1)' }
              }}
            >
              Registrar Huella
            </Button>
          </Box>
        </Box>

        {/* ✅ MÉTRICAS DEL SISTEMA MEJORADAS */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Badge 
                badgeContent={devices.filter(d => d.status === 'testing').length} 
                color="warning"
                invisible={devices.filter(d => d.status === 'testing').length === 0}
              >
                <Typography variant="h4" fontWeight="bold" color="#ffcc00">
                  {devices.filter(d => d.status === 'connected').length}
                </Typography>
              </Badge>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Dispositivos Conectados
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#4CAF50">
                {recentActivity?.successfulAccesses || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Accesos Exitosos (24h)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#F44336">
                {recentActivity?.deniedAccesses || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Accesos Denegados (24h)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                <HealthAndSafetyIcon sx={{ 
                  color: systemHealth ? getHealthStatusColor(systemHealth.overallStatus) : '#757575' 
                }} />
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  color: systemHealth ? getHealthStatusColor(systemHealth.overallStatus) : '#757575' 
                }}>
                  {systemHealth?.overallStatus || 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Estado del Sistema
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#2196F3">
                {activeSessions?.total || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Sesiones Activas
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                <SpeedIcon sx={{ color: '#ffcc00' }} />
                <Typography variant="h4" fontWeight="bold" color="#ffcc00">
                  {recentActivity?.averageResponseTime || 0}ms
                </Typography>
              </Box>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Tiempo Promedio
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* ✅ ALERTAS DE SISTEMA */}
        {systemHealth && systemHealth.issues.length > 0 && (
          <Alert 
            severity={systemHealth.overallStatus === 'critical' ? 'error' : 'warning'} 
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Problemas detectados:
            </Typography>
            <List dense>
              {systemHealth.issues.map((issue, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="body2">• {issue}</Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Paper>

      {/* ✅ NOTIFICACIONES */}
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 3 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* ✅ LISTA DE DISPOSITIVOS CON TESTING COMPLETO */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            color: '#fff'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <DevicesIcon sx={{ color: '#ffcc00' }} />
                  <Typography variant="h5" fontWeight="bold">
                    Dispositivos ZK Access Agent ({devices.length})
                  </Typography>
                </Box>
                <Tooltip title="Probar todas las conexiones">
                  <IconButton 
                    onClick={() => {
                      devices.forEach(device => {
                        if (device.status !== 'testing') {
                          testDeviceConnection(device.id);
                        }
                      });
                    }}
                    disabled={refreshing || testingDevices.size > 0}
                    sx={{ color: '#ffcc00' }}
                  >
                    <NetworkCheckIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* ✅ AGREGAR DISPOSITIVO CON VALORES POR DEFECTO PARA ZK ACCESS AGENT */}
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                background: 'rgba(255, 204, 0, 0.05)',
                border: '1px solid rgba(255, 204, 0, 0.2)'
              }}>
                <Typography variant="h6" mb={2} color="#ffcc00">
                  Agregar ZK Access Agent
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 Conecta a tu ZK Access Agent local que se comunica con el ZK9500 físico
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ZK Agent Principal"
                      sx={{ 
                        '& .MuiInputBase-input': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: '#ffcc00' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      label="IP del Agent"
                      value={newDevice.ip}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, ip: e.target.value }))}
                      placeholder="127.0.0.1"
                      sx={{ 
                        '& .MuiInputBase-input': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: '#ffcc00' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1.5 }}>
                    <TextField
                      fullWidth
                      label="Puerto HTTP"
                      type="number"
                      value={newDevice.port}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      sx={{ 
                        '& .MuiInputBase-input': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: '#ffcc00' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1.5 }}>
                    <TextField
                      fullWidth
                      label="Puerto WS"
                      type="number"
                      value={newDevice.wsPort}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, wsPort: parseInt(e.target.value) }))}
                      sx={{ 
                        '& .MuiInputBase-input': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: '#ffcc00' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={newDevice.location}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Recepción"
                      sx={{ 
                        '& .MuiInputBase-input': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: '#ffcc00' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={addDevice}
                      disabled={loading}
                      sx={{ 
                        height: '56px',
                        background: '#ffcc00',
                        color: '#000',
                        '&:hover': { background: '#e6b800' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : '+'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* ✅ LISTA DE DISPOSITIVOS CON ESTADO DETALLADO */}
              <Box>
                {devices.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <DevicesIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                    <Typography color="rgba(255,255,255,0.7)">
                      No hay dispositivos ZK Access Agent configurados
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.5)" mt={1}>
                      Agrega tu primer ZK Access Agent para comenzar
                    </Typography>
                  </Box>
                ) : (
                  devices.map((device) => (
                    <Paper key={device.id} sx={{ 
                      p: 3, 
                      mb: 2, 
                      background: 'rgba(255,255,255,0.05)',
                      border: `2px solid ${getStatusColor(device.status)}30`,
                      borderRadius: 2
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box position="relative">
                              <FingerprintIcon sx={{ color: '#ffcc00', fontSize: 40 }} />
                              {testingDevices.has(device.id) && (
                                <CircularProgress 
                                  size={50}
                                  sx={{ 
                                    color: '#ffcc00',
                                    position: 'absolute',
                                    top: -5,
                                    left: -5
                                  }}
                                />
                              )}
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {device.name}
                              </Typography>
                              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                {device.model} • {device.location || 'Sin ubicación'}
                              </Typography>
                              {device.connectivity && (
                                <Box display="flex" gap={1} mt={1}>
                                  <Chip 
                                    size="small"
                                    label={`WS: ${device.connectivity.websocket}`}
                                    sx={{ 
                                      backgroundColor: device.connectivity.websocket === 'connected' ? '#4CAF50' : '#F44336',
                                      color: '#fff',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                  <Chip 
                                    size="small"
                                    label={`API: ${device.connectivity.api}`}
                                    sx={{ 
                                      backgroundColor: device.connectivity.api === 'connected' ? '#4CAF50' : '#F44336',
                                      color: '#fff',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                  <Chip 
                                    size="small"
                                    label={`HW: ${device.connectivity.hardware}`}
                                    sx={{ 
                                      backgroundColor: device.connectivity.hardware === 'connected' ? '#4CAF50' : '#F44336',
                                      color: '#fff',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Conexión:
                          </Typography>
                          <Typography fontWeight="bold">
                            {device.ip_address}:{device.ws_port}
                          </Typography>
                          {device.responseTime && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <SpeedIcon sx={{ fontSize: 16, color: '#ffcc00' }} />
                              <Typography variant="caption" color="#ffcc00">
                                {device.responseTime}ms
                              </Typography>
                            </Box>
                          )}
                          {device.lastPing && (
                            <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)">
                              Último ping: {new Date(device.lastPing).toLocaleTimeString()}
                            </Typography>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Chip
                              label={getStatusText(device.status)}
                              icon={getStatusIcon(device.status)}
                              sx={{
                                backgroundColor: getStatusColor(device.status),
                                color: '#fff',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          {device.connectivity && (
                            <Box>
                              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                Calidad de conexión:
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={getConnectivityScore(device)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getConnectivityScore(device) > 80 ? '#4CAF50' : 
                                                   getConnectivityScore(device) > 50 ? '#FF9800' : '#F44336'
                                  }
                                }}
                              />
                              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                                {getConnectivityScore(device)}% saludable
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Usuarios: {device.user_count}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Huellas: {device.fingerprint_count}
                          </Typography>
                          {device.firmware_version && (
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">
                              FW: {device.firmware_version}
                            </Typography>
                          )}
                          {device.hardwareInfo && (
                            <Box>
                              {device.hardwareInfo.deviceTemperature && (
                                <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)">
                                  🌡️ {device.hardwareInfo.deviceTemperature}°C
                                </Typography>
                              )}
                              {device.hardwareInfo.memoryUsage && (
                                <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)">
                                  🧠 {device.hardwareInfo.memoryUsage}% RAM
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Tooltip title="Test completo de conexión">
                              <IconButton
                                size="small"
                                onClick={() => testDeviceConnection(device.id)}
                                disabled={testingDevices.has(device.id)}
                                sx={{ 
                                  color: '#ffcc00', 
                                  border: '1px solid rgba(255,204,0,0.3)',
                                  backgroundColor: testingDevices.has(device.id) ? 'rgba(255,204,0,0.1)' : 'transparent'
                                }}
                              >
                                {testingDevices.has(device.id) ? <CircularProgress size={16} /> : <NetworkCheckIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Ping rápido">
                              <IconButton
                                size="small"
                                onClick={() => quickPingDevice(device.id)}
                                sx={{ color: '#2196F3', border: '1px solid rgba(33,150,243,0.3)' }}
                              >
                                <TimerIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => showDeviceDetails(device)}
                                sx={{ color: '#9C27B0', border: '1px solid rgba(156,39,176,0.3)' }}
                              >
                                <MemoryIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Actualizar estado">
                              <IconButton
                                size="small"
                                onClick={() => refreshDeviceStatus(device.id)}
                                sx={{ color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sincronizar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedDevice(device.id);
                                  setOperationType('sync');
                                  setOperationDialog(true);
                                }}
                                disabled={device.status !== 'connected'}
                                sx={{ color: '#2196F3', border: '1px solid rgba(33,150,243,0.3)' }}
                              >
                                <SyncIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Backup">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedDevice(device.id);
                                  setOperationType('backup');
                                  setOperationDialog(true);
                                }}
                                sx={{ color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }}
                              >
                                <BackupIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remover dispositivo">
                              <IconButton
                                size="small"
                                onClick={() => removeDevice(device.id)}
                                sx={{ color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          
                          {/* ✅ RESULTADO DEL ÚLTIMO TEST */}
                          {connectionTests[device.id] && (
                            <Box mt={2} p={1} sx={{ 
                              backgroundColor: connectionTests[device.id].success ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                              borderRadius: 1,
                              border: `1px solid ${connectionTests[device.id].success ? '#4CAF50' : '#F44336'}30`
                            }}>
                              <Typography variant="caption" display="block" fontWeight="bold">
                                Último Test: {connectionTests[device.id].success ? '✅ Exitoso' : '❌ Falló'}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {connectionTests[device.id].details}
                              </Typography>
                              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                                {new Date(connectionTests[device.id].timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ PANEL DE CONTROL LATERAL MEJORADO */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            color: '#fff'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SettingsIcon sx={{ color: '#ffcc00' }} />
                <Typography variant="h5" fontWeight="bold">
                  Panel de Control
                </Typography>
              </Box>

              {/* Estado de Conectividad Global */}
              <Box mb={3}>
                <Typography variant="h6" mb={2} color="#ffcc00">
                  Estado de Conectividad
                </Typography>
                <Box p={2} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  {devices.length === 0 ? (
                    <Typography color="rgba(255,255,255,0.7)">
                      No hay dispositivos configurados
                    </Typography>
                  ) : (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Dispositivos totales:</Typography>
                        <Typography fontWeight="bold">{devices.length}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Conectados:</Typography>
                        <Typography fontWeight="bold" color="#4CAF50">
                          {devices.filter(d => d.status === 'connected').length}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Con errores:</Typography>
                        <Typography fontWeight="bold" color="#F44336">
                          {devices.filter(d => d.status === 'error').length}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Probando:</Typography>
                        <Typography fontWeight="bold" color="#FF9800">
                          {testingDevices.size}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Sesiones Activas */}
              {activeSessions && (
                <Box mb={3}>
                  <Typography variant="h6" mb={2} color="#ffcc00">
                    Sesiones Activas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box textAlign="center" p={2} sx={{ backgroundColor: 'rgba(33,150,243,0.1)', borderRadius: 2 }}>
                        <Typography variant="h4" color="#2196F3" fontWeight="bold">
                          {activeSessions.enrollments}
                        </Typography>
                        <Typography variant="caption">Enrollments</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box textAlign="center" p={2} sx={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 2 }}>
                        <Typography variant="h4" color="#4CAF50" fontWeight="bold">
                          {activeSessions.verifications}
                        </Typography>
                        <Typography variant="caption">Verificaciones</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Actividad Reciente */}
              {recentActivity && (
                <Box mb={3}>
                  <Typography variant="h6" mb={2} color="#ffcc00">
                    Últimas 24 Horas
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Total de Accesos"
                        secondary={recentActivity.totalAccesses}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: '#fff' },
                          '& .MuiListItemText-secondary': { color: '#ffcc00', fontWeight: 'bold' }
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Accesos Exitosos"
                        secondary={recentActivity.successfulAccesses}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: '#fff' },
                          '& .MuiListItemText-secondary': { color: '#4CAF50', fontWeight: 'bold' }
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Accesos Denegados"
                        secondary={recentActivity.deniedAccesses}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: '#fff' },
                          '& .MuiListItemText-secondary': { color: '#F44336', fontWeight: 'bold' }
                        }}
                      />
                    </ListItem>
                    {recentActivity.averageResponseTime && (
                      <ListItem>
                        <ListItemText 
                          primary="Tiempo Promedio"
                          secondary={`${recentActivity.averageResponseTime}ms`}
                          sx={{ 
                            '& .MuiListItemText-primary': { color: '#fff' },
                            '& .MuiListItemText-secondary': { color: '#ffcc00', fontWeight: 'bold' }
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Acciones Rápidas */}
              <Box>
                <Typography variant="h6" mb={2} color="#ffcc00">
                  Acciones Rápidas
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                      onClick={() => loadSystemStatus(true)}
                      disabled={refreshing}
                      sx={{
                        borderColor: '#ffcc00',
                        color: '#ffcc00',
                        '&:hover': { borderColor: '#e6b800', backgroundColor: 'rgba(255, 204, 0, 0.1)' }
                      }}
                    >
                      {refreshing ? 'Actualizando...' : 'Actualizar Todo'}
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<NetworkCheckIcon />}
                      onClick={() => {
                        devices.forEach(device => {
                          if (device.status !== 'testing') {
                            testDeviceConnection(device.id);
                          }
                        });
                      }}
                      disabled={testingDevices.size > 0 || devices.length === 0}
                      sx={{
                        borderColor: '#2196F3',
                        color: '#2196F3',
                        '&:hover': { borderColor: '#1976D2', backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                      }}
                    >
                      Probar Todas las Conexiones
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => {/* Abrir enrollment */}}
                      disabled={devices.filter(d => d.status === 'connected').length === 0}
                      sx={{
                        borderColor: '#2196F3',
                        color: '#2196F3',
                        '&:hover': { borderColor: '#1976D2', backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                      }}
                    >
                      Enrollment
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FingerprintIcon />}
                      onClick={() => {/* Abrir verificación */}}
                      disabled={devices.filter(d => d.status === 'connected').length === 0}
                      sx={{
                        borderColor: '#4CAF50',
                        color: '#4CAF50',
                        '&:hover': { borderColor: '#388E3C', backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                      }}
                    >
                      Verificar
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ DIALOG DE DETALLES DE CONEXIÓN */}
      <Dialog 
        open={connectionDialog} 
        onClose={() => setConnectionDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            border: '1px solid rgba(255, 204, 0, 0.3)',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffcc00' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <NetworkCheckIcon />
            Detalles de Conexión: {selectedDeviceDetails?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDeviceDetails && (
            <Box>
              {/* Información básica */}
              <Accordion sx={{ backgroundColor: 'rgba(255,255,255,0.05)', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
                  <Typography variant="h6" color="#ffcc00">Información General</Typography>
                </AccordionSummary>
                <AccordionDetails>
                                    <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Modelo:
                      </Typography>
                      <Typography fontWeight="bold">{selectedDeviceDetails.model}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Ubicación:
                      </Typography>
                      <Typography fontWeight="bold">{selectedDeviceDetails.location || 'No especificada'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Dirección IP:
                      </Typography>
                      <Typography fontWeight="bold">{selectedDeviceDetails.ip_address}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Puerto WebSocket:
                      </Typography>
                      <Typography fontWeight="bold">{selectedDeviceDetails.ws_port}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Usuarios Registrados:
                      </Typography>
                      <Typography fontWeight="bold" color="#4CAF50">{selectedDeviceDetails.user_count}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Huellas Almacenadas:
                      </Typography>
                      <Typography fontWeight="bold" color="#2196F3">{selectedDeviceDetails.fingerprint_count}</Typography>
                    </Grid>
                    {selectedDeviceDetails.firmware_version && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">
                          Firmware:
                        </Typography>
                        <Typography fontWeight="bold">{selectedDeviceDetails.firmware_version}</Typography>
                      </Grid>
                    )}
                    {selectedDeviceDetails.uptime && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">
                          Tiempo Activo:
                        </Typography>
                        <Typography fontWeight="bold">{Math.round(selectedDeviceDetails.uptime / 3600)}h</Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Estado de conectividad */}
              {selectedDeviceDetails.connectivity && (
                <Accordion sx={{ backgroundColor: 'rgba(255,255,255,0.05)', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
                    <Typography variant="h6" color="#ffcc00">Estado de Conectividad</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}>
                        <Box textAlign="center" p={2} sx={{ 
                          backgroundColor: selectedDeviceDetails.connectivity.websocket === 'connected' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                          borderRadius: 2,
                          border: `1px solid ${selectedDeviceDetails.connectivity.websocket === 'connected' ? '#4CAF50' : '#F44336'}30`
                        }}>
                          <WifiIcon sx={{ 
                            fontSize: 32, 
                            color: selectedDeviceDetails.connectivity.websocket === 'connected' ? '#4CAF50' : '#F44336',
                            mb: 1
                          }} />
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            WebSocket
                          </Typography>
                          <Typography fontWeight="bold" color={selectedDeviceDetails.connectivity.websocket === 'connected' ? '#4CAF50' : '#F44336'}>
                            {selectedDeviceDetails.connectivity.websocket === 'connected' ? 'Conectado' : 'Desconectado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box textAlign="center" p={2} sx={{ 
                          backgroundColor: selectedDeviceDetails.connectivity.api === 'connected' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                          borderRadius: 2,
                          border: `1px solid ${selectedDeviceDetails.connectivity.api === 'connected' ? '#4CAF50' : '#F44336'}30`
                        }}>
                          <CloudUploadIcon sx={{ 
                            fontSize: 32, 
                            color: selectedDeviceDetails.connectivity.api === 'connected' ? '#4CAF50' : '#F44336',
                            mb: 1
                          }} />
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            API REST
                          </Typography>
                          <Typography fontWeight="bold" color={selectedDeviceDetails.connectivity.api === 'connected' ? '#4CAF50' : '#F44336'}>
                            {selectedDeviceDetails.connectivity.api === 'connected' ? 'Conectado' : 'Desconectado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box textAlign="center" p={2} sx={{ 
                          backgroundColor: selectedDeviceDetails.connectivity.hardware === 'connected' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                          borderRadius: 2,
                          border: `1px solid ${selectedDeviceDetails.connectivity.hardware === 'connected' ? '#4CAF50' : '#F44336'}30`
                        }}>
                          <DevicesIcon sx={{ 
                            fontSize: 32, 
                            color: selectedDeviceDetails.connectivity.hardware === 'connected' ? '#4CAF50' : '#F44336',
                            mb: 1
                          }} />
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Hardware ZK
                          </Typography>
                          <Typography fontWeight="bold" color={selectedDeviceDetails.connectivity.hardware === 'connected' ? '#4CAF50' : '#F44336'}>
                            {selectedDeviceDetails.connectivity.hardware === 'connected' ? 'Conectado' : 'Desconectado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={1}>
                            Tiempo de Respuesta:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <SpeedIcon sx={{ color: '#ffcc00' }} />
                            <Typography variant="h6" fontWeight="bold" color="#ffcc00">
                              {selectedDeviceDetails.connectivity.responseTime}ms
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            Última verificación: {new Date(selectedDeviceDetails.connectivity.lastCheck).toLocaleString()}
                          </Typography>
                          {selectedDeviceDetails.connectivity.errorMessage && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              {selectedDeviceDetails.connectivity.errorMessage}
                            </Alert>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Información del hardware */}
              {selectedDeviceDetails.hardwareInfo && (
                <Accordion sx={{ backgroundColor: 'rgba(255,255,255,0.05)', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
                    <Typography variant="h6" color="#ffcc00">Información del Hardware</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {selectedDeviceDetails.hardwareInfo.serialNumber && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Número de Serie:
                          </Typography>
                          <Typography fontWeight="bold">{selectedDeviceDetails.hardwareInfo.serialNumber}</Typography>
                        </Grid>
                      )}
                      {selectedDeviceDetails.hardwareInfo.deviceTemperature && (
                        <Grid size={{ xs: 6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Temperatura:
                            </Typography>
                            <Typography fontWeight="bold" color={
                              selectedDeviceDetails.hardwareInfo.deviceTemperature > 70 ? '#F44336' :
                              selectedDeviceDetails.hardwareInfo.deviceTemperature > 50 ? '#FF9800' : '#4CAF50'
                            }>
                              {selectedDeviceDetails.hardwareInfo.deviceTemperature}°C
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {selectedDeviceDetails.hardwareInfo.memoryUsage && (
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={1}>
                            Uso de Memoria:
                          </Typography>
                          <Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={selectedDeviceDetails.hardwareInfo.memoryUsage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: selectedDeviceDetails.hardwareInfo.memoryUsage > 80 ? '#F44336' : 
                                                 selectedDeviceDetails.hardwareInfo.memoryUsage > 60 ? '#FF9800' : '#4CAF50'
                                }
                              }}
                            />
                            <Typography variant="caption" color="rgba(255,255,255,0.7)">
                              {selectedDeviceDetails.hardwareInfo.memoryUsage}%
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {selectedDeviceDetails.hardwareInfo.storageUsage && (
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={1}>
                            Uso de Almacenamiento:
                          </Typography>
                          <Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={selectedDeviceDetails.hardwareInfo.storageUsage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: selectedDeviceDetails.hardwareInfo.storageUsage > 90 ? '#F44336' : 
                                                 selectedDeviceDetails.hardwareInfo.storageUsage > 70 ? '#FF9800' : '#4CAF50'
                                }
                              }}
                            />
                            <Typography variant="caption" color="rgba(255,255,255,0.7)">
                              {selectedDeviceDetails.hardwareInfo.storageUsage}%
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Último test de conexión */}
              {connectionTests[selectedDeviceDetails.id] && (
                <Accordion sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
                    <Typography variant="h6" color="#ffcc00">Último Test de Conexión</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(() => {
                      const test = connectionTests[selectedDeviceDetails.id];
                      return (
                        <Box>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {test.success ? <CheckCircleIcon sx={{ color: '#4CAF50' }} /> : <ErrorIcon sx={{ color: '#F44336' }} />}
                              <Typography variant="h6" fontWeight="bold" color={test.success ? '#4CAF50' : '#F44336'}>
                                {test.success ? 'Test Exitoso' : 'Test Falló'}
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${test.responseTime}ms`}
                              sx={{ 
                                backgroundColor: test.responseTime < 100 ? '#4CAF50' : 
                                               test.responseTime < 500 ? '#FF9800' : '#F44336',
                                color: '#fff'
                              }}
                            />
                          </Box>
                          
                          <Typography variant="body1" mb={2}>
                            {test.details}
                          </Typography>
                          
                          <Grid container spacing={2} mb={2}>
                            <Grid size={{ xs: 4 }}>
                              <Box textAlign="center">
                                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                  WebSocket
                                </Typography>
                                <Typography fontWeight="bold" color={test.websocketStatus ? '#4CAF50' : '#F44336'}>
                                  {test.websocketStatus ? '✅ OK' : '❌ Error'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Box textAlign="center">
                                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                  API REST
                                </Typography>
                                <Typography fontWeight="bold" color={test.apiStatus ? '#4CAF50' : '#F44336'}>
                                  {test.apiStatus ? '✅ OK' : '❌ Error'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Box textAlign="center">
                                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                  Hardware
                                </Typography>
                                <Typography fontWeight="bold" color={test.hardwareStatus ? '#4CAF50' : '#F44336'}>
                                  {test.hardwareStatus ? '✅ OK' : '❌ Error'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            Realizado: {new Date(test.timestamp).toLocaleString()}
                          </Typography>
                          
                          {test.errorDetails && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                <strong>Detalles del error:</strong> {test.errorDetails}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      );
                    })()}
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConnectionDialog(false)}
            sx={{ color: '#ffcc00' }}
          >
            Cerrar
          </Button>
          {selectedDeviceDetails && (
            <>
              <Button
                onClick={() => quickPingDevice(selectedDeviceDetails.id)}
                startIcon={<TimerIcon />}
                sx={{ color: '#2196F3' }}
              >
                Ping Rápido
              </Button>
              <Button
                onClick={() => testDeviceConnection(selectedDeviceDetails.id)}
                startIcon={<NetworkCheckIcon />}
                disabled={testingDevices.has(selectedDeviceDetails.id)}
                variant="outlined"
                sx={{
                  borderColor: '#ffcc00',
                  color: '#ffcc00',
                  '&:hover': { borderColor: '#e6b800', backgroundColor: 'rgba(255, 204, 0, 0.1)' }
                }}
              >
                {testingDevices.has(selectedDeviceDetails.id) ? 'Probando...' : 'Test Completo'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ✅ DIALOG DE OPERACIONES (MANTENIDO) */}
      <Dialog 
        open={operationDialog} 
        onClose={() => setOperationDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            border: '1px solid rgba(255, 204, 0, 0.3)',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffcc00' }}>
          <Box display="flex" alignItems="center" gap={2}>
            {operationType === 'sync' && <SyncIcon />}
            {operationType === 'backup' && <BackupIcon />}
            {operationType === 'reset' && <ErrorIcon />}
            {operationType === 'restore' && <RestoreIcon />}
            {operationType === 'sync' && 'Sincronizar Dispositivo'}
            {operationType === 'backup' && 'Crear Backup'}
            {operationType === 'reset' && 'Resetear Dispositivo'}
            {operationType === 'restore' && 'Restaurar Dispositivo'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
            {operationType === 'sync' && 'Esta operación sincronizará usuarios y huellas entre el sistema y el dispositivo ZK Access Agent.'}
            {operationType === 'backup' && 'Se creará un backup de todos los datos del dispositivo ZK Access Agent.'}
            {operationType === 'reset' && '⚠️ Esta operación eliminará TODOS los datos del dispositivo.'}
            {operationType === 'restore' && 'Se restaurarán los datos desde un backup previo.'}
          </Typography>
          
          {operationType === 'sync' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffcc00' }}>
                Opciones de Sincronización
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }} />}
                label="Incluir usuarios"
                sx={{ color: '#fff', display: 'block', mb: 1 }}
              />
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }} />}
                label="Incluir huellas dactilares"
                sx={{ color: '#fff', display: 'block', mb: 1 }}
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }} />}
                label="Limpiar antes de sincronizar"
                sx={{ color: '#fff', display: 'block' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOperationDialog(false)}
            sx={{ color: '#ffcc00' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => selectedDevice && operationType && executeDeviceOperation(selectedDevice, operationType)}
            disabled={loading}
            variant="contained"
            sx={{
              background: operationType === 'reset' ? '#F44336' : '#ffcc00',
              color: operationType === 'reset' ? '#fff' : '#000',
              '&:hover': { 
                background: operationType === 'reset' ? '#D32F2F' : '#e6b800' 
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}