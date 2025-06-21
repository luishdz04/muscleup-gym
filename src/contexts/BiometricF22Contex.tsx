import React, { createContext, useContext, useEffect, useState } from 'react';
import BiometricF22Service from '../services/BiometricF22Service';
import { toast } from 'react-hot-toast';

interface BiometricF22ContextType {
  f22Service: BiometricF22Service;
  deviceInfo: F22DeviceInfo | null;
  isConnecting: boolean;
  isConnected: boolean;
  deviceConnected: boolean;
  connectToSocket: () => void;
  disconnectFromSocket: () => void;
  connectToDevice: () => Promise<F22DeviceInfo>;
  disconnectFromDevice: () => Promise<void>;
  refreshDeviceInfo: () => Promise<F22DeviceInfo>;
  deviceStatus: string;
}

const BiometricF22Context = createContext<BiometricF22ContextType | null>(null);

export const useBiometricF22 = () => {
  const context = useContext(BiometricF22Context);
  if (!context) {
    throw new Error('useBiometricF22 must be used within a BiometricF22Provider');
  }
  return context;
};

export const BiometricF22Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<F22DeviceInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [deviceConnected, setDeviceConnected] = useState<boolean>(false);
  const [deviceStatus, setDeviceStatus] = useState<string>('disconnected');
  
  // Create service instance
  const [f22Service] = useState(() => new BiometricF22Service({
    onConnect: () => {
      setIsConnected(true);
      toast.success('Conectado al servicio F22');
    },
    onDisconnect: () => {
      setIsConnected(false);
      setDeviceConnected(false);
      setDeviceInfo(null);
      toast.error('Desconectado del servicio F22');
    },
    onDeviceStatus: (status) => {
      setDeviceStatus(status);
      setDeviceConnected(status === 'connected');
    },
    onError: (error) => {
      toast.error(`Error: ${error}`);
    }
  }));

  useEffect(() => {
    // Attempt initial connection
    connectToSocket();
    
    return () => {
      f22Service.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToSocket = () => {
    try {
      setIsConnecting(true);
      f22Service.connect();
    } catch (error) {
      toast.error(`Error conectando al servicio F22: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromSocket = () => {
    f22Service.disconnect();
  };

  const connectToDevice = async (): Promise<F22DeviceInfo> => {
    try {
      setIsConnecting(true);
      const info = await f22Service.connectDevice();
      setDeviceInfo(info);
      setDeviceConnected(true);
      return info;
    } catch (error) {
      toast.error(`Error conectando al dispositivo F22: ${error}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromDevice = async (): Promise<void> => {
    try {
      await f22Service.disconnectDevice();
      setDeviceInfo(null);
      setDeviceConnected(false);
    } catch (error) {
      toast.error(`Error desconectando del dispositivo F22: ${error}`);
      throw error;
    }
  };

  const refreshDeviceInfo = async (): Promise<F22DeviceInfo> => {
    try {
      const info = await f22Service.getDeviceInfo();
      setDeviceInfo(info);
      return info;
    } catch (error) {
      toast.error(`Error obteniendo información del F22: ${error}`);
      throw error;
    }
  };

  const contextValue: BiometricF22ContextType = {
    f22Service,
    deviceInfo,
    isConnecting,
    isConnected,
    deviceConnected,
    connectToSocket,
    disconnectFromSocket,
    connectToDevice,
    disconnectFromDevice,
    refreshDeviceInfo,
    deviceStatus
  };

  return (
    <BiometricF22Context.Provider value={contextValue}>
      {children}
    </BiometricF22Context.Provider>
  );
};