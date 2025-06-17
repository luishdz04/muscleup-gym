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
  CircularProgress
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

// ✅ TIPOS ACTUALIZADOS PARA NUESTRAS APIs
interface BiometricDevice {
  id: string;
  name: string;
  type: 'zk9500';
  model: string;
  ip_address: string;
  port: number;
  ws_port: number;
  status: 'connected' | 'disconnected' | 'error';
  firmware_version?: string;
  user_count: number;
  fingerprint_count: number;
  last_sync?: string;
  uptime?: number;
  responseTime?: number;
  isOnline: boolean;
  location?: string;
  is_active: boolean;
}

interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
  uptime: number;
}

interface ActiveSessions {
  enrollments: number;
  verifications: number;
  total: number;
}

interface RecentActivity {
  totalAccesses: number;
  successfulAccesses: number;
  deniedAccesses: number;
  last24Hours: number;
}

interface DeviceOperation {
  deviceId: string;
  operation: 'add' | 'remove' | 'update' | 'sync' | 'reset' | 'backup' | 'restore';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
  startedAt: string;
}

export default function BiometricDeviceManager() {
  // ✅ ESTADOS ACTUALIZADOS
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSessions | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [activeOperations, setActiveOperations] = useState<DeviceOperation[]>([]);
  
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '192.168.1.100',
    port: 4370,
    wsPort: 8080,
    model: 'ZKTeco ZK9500',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [operationDialog, setOperationDialog] = useState(false);
  const [operationType, setOperationType] = useState<'sync' | 'reset' | 'backup' | 'restore' | null>(null);
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // ✅ CARGAR DATOS AL MONTAR
  useEffect(() => {
    loadSystemStatus();
    
    // Refresh automático cada 30 segundos
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FUNCIÓN PARA CARGAR ESTADO COMPLETO DEL SISTEMA
  const loadSystemStatus = async (includeHealth: boolean = false) => {
    try {
      setRefreshing(true);
      
      // Llamar a nuestra API de estado
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
        
        console.log('✅ Estado del sistema cargado:', data.data);
      } else {
        throw new Error(data.message || 'Error en la respuesta');
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando estado:', error);
      showNotification(`Error cargando estado: ${error.message}`, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ AGREGAR DISPOSITIVO CON NUEVA API
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
            location: newDevice.location
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('✅ Dispositivo agregado exitosamente', 'success');
        setNewDevice({
          name: '',
          ip: '192.168.1.100',
          port: 4370,
          wsPort: 8080,
          model: 'ZKTeco ZK9500',
          location: ''
        });
        await loadSystemStatus(); // Recargar lista
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

  // ✅ PROBAR CONEXIÓN DE DISPOSITIVO
  const testDeviceConnection = async (deviceId: string) => {
    try {
      const response = await fetch('/api/biometric/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          action: 'ping'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(
          `✅ Ping exitoso: ${result.data.responseTime}ms`, 
          'success'
        );
        await loadSystemStatus(); // Actualizar estado
      } else {
        showNotification(`❌ Ping falló: ${result.error}`, 'error');
      }
      
    } catch (error: any) {
      console.error('❌ Error en ping:', error);
      showNotification(`Error en ping: ${error.message}`, 'error');
    }
  };

  // ✅ ACTUALIZAR ESTADO DE DISPOSITIVO
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

  // ✅ EJECUTAR OPERACIÓN DE GESTIÓN
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
          // Para sync, mostrar progreso
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

  // ✅ REMOVER DISPOSITIVO
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      case 'error': return '#FF5722';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error';
      default: return 'Desconocido';
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

  return (
    <Box sx={{ p: 4, backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      {/* ✅ HEADER MEJORADO */}
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
                Gestión de Dispositivos ZK9500
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.7)">
                Control de Acceso Biométrico • {devices.length} dispositivo(s)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Tooltip title="Actualizar estado con health check">
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

        {/* ✅ MÉTRICAS DEL SISTEMA */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#ffcc00">
                {devices.filter(d => d.status === 'connected').length}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Dispositivos Conectados
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#4CAF50">
                {recentActivity?.successfulAccesses || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Accesos Exitosos (24h)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="#F44336">
                {recentActivity?.deniedAccesses || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Accesos Denegados (24h)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
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
        {/* ✅ LISTA DE DISPOSITIVOS MEJORADA */}
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
                    Dispositivos ZKTeco ({devices.length})
                  </Typography>
                </Box>
                <Tooltip title="Actualizar lista completa">
                  <IconButton 
                    onClick={() => loadSystemStatus(true)}
                    disabled={refreshing}
                    sx={{ color: '#ffcc00' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* ✅ AGREGAR DISPOSITIVO */}
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                background: 'rgba(255, 204, 0, 0.05)',
                border: '1px solid rgba(255, 204, 0, 0.2)'
              }}>
                <Typography variant="h6" mb={2} color="#ffcc00">
                  Agregar Dispositivo ZK9500
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
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
                      label="IP Address"
                      value={newDevice.ip}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, ip: e.target.value }))}
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
                      label="Puerto"
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

              {/* ✅ LISTA DE DISPOSITIVOS */}
              <Box>
                {devices.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <DevicesIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                    <Typography color="rgba(255,255,255,0.7)">
                      No hay dispositivos configurados
                    </Typography>
                  </Box>
                ) : (
                  devices.map((device) => (
                    <Paper key={device.id} sx={{ 
                      p: 3, 
                      mb: 2, 
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${getStatusColor(device.status)}30`
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <FingerprintIcon sx={{ color: '#ffcc00' }} />
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {device.name}
                              </Typography>
                              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                {device.model} • {device.location || 'Sin ubicación'}
                              </Typography>
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
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">
                              Ping: {device.responseTime}ms
                            </Typography>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Chip
                            label={getStatusText(device.status)}
                            icon={device.status === 'connected' ? <CheckCircleIcon /> : <ErrorIcon />}
                            sx={{
                              backgroundColor: getStatusColor(device.status),
                              color: '#fff',
                              fontWeight: 'bold'
                            }}
                          />
                          {device.last_sync && (
                            <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)">
                              Sync: {new Date(device.last_sync).toLocaleTimeString()}
                            </Typography>
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
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Tooltip title="Probar conexión">
                              <IconButton
                                size="small"
                                onClick={() => testDeviceConnection(device.id)}
                                sx={{ color: '#ffcc00', border: '1px solid rgba(255,204,0,0.3)' }}
                              >
                                <TestIcon />
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
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ PANEL DE CONTROL LATERAL */}
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
                      startIcon={<RefreshIcon />}
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

      {/* ✅ DIALOG DE OPERACIONES */}
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
            {operationType === 'sync' && 'Esta operación sincronizará usuarios y huellas entre el sistema y el dispositivo.'}
            {operationType === 'backup' && 'Se creará un backup de todos los datos del dispositivo.'}
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
              />
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }} />}
                label="Incluir huellas dactilares"
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-thumb': { backgroundColor: '#ffcc00' } }} />}
                label="Limpiar antes de sincronizar"
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