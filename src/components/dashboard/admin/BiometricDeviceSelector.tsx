import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import React from 'react';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import DevicesIcon from '@mui/icons-material/Devices';
import { useBiometricF22 } from '@/contexts/BiometricF22Context';

export type BiometricDeviceType = 'zk9500' | 'f22' | null;

interface BiometricDeviceSelectorProps {
  onDeviceSelect: (deviceType: BiometricDeviceType) => void;
  selectedDevice: BiometricDeviceType;
}

export const BiometricDeviceSelector: React.FC<BiometricDeviceSelectorProps> = ({
  onDeviceSelect,
  selectedDevice
}) => {
  const { deviceConnected: f22Connected, connectToDevice: connectToF22 } = useBiometricF22();

  // Variable para saber si el ZK9500 está conectado (simulación)
  const zk9500Connected = true; // Esto deberías obtenerlo de tu contexto ZK9500

  const handleSelectZK9500 = () => {
    onDeviceSelect('zk9500');
  };

  const handleSelectF22 = async () => {
    try {
      if (!f22Connected) {
        await connectToF22();
      }
      onDeviceSelect('f22');
    } catch (error) {
      console.error('Error connecting to F22:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Seleccionar Dispositivo Biométrico
      </Typography>
      
      <Card sx={{ mb: 2, border: selectedDevice === 'zk9500' ? '2px solid primary.main' : undefined }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <FingerprintIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle1">ZK9500 Enrollador</Typography>
                <Chip 
                  label={zk9500Connected ? 'Conectado' : 'Desconectado'}
                  color={zk9500Connected ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
            <Button 
              variant={selectedDevice === 'zk9500' ? "contained" : "outlined"}
              onClick={handleSelectZK9500}
              disabled={!zk9500Connected}
            >
              {selectedDevice === 'zk9500' ? 'Seleccionado' : 'Seleccionar'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 2, border: selectedDevice === 'f22' ? '2px solid primary.main' : undefined }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <DevicesIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle1">F22 Control de Acceso</Typography>
                <Chip 
                  label={f22Connected ? 'Conectado' : 'Desconectado'}
                  color={f22Connected ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
            <Button 
              variant={selectedDevice === 'f22' ? "contained" : "outlined"}
              onClick={handleSelectF22}
            >
              {selectedDevice === 'f22' ? 'Seleccionado' : 'Seleccionar'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BiometricDeviceSelector;