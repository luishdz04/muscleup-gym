'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Computer, Web } from '@mui/icons-material';

/**
 * Component to detect if running in Electron and display environment info
 * Useful for debugging and conditional rendering
 */
export default function ElectronDetector() {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electron?.isElectron) {
      setIsElectron(true);
      setPlatform(window.electron.platform);

      // Get app version
      window.electron.getAppVersion().then((version) => {
        setAppVersion(version);
      });
    }
  }, []);

  if (!isElectron) {
    return null; // Only show in Electron
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        p: 2,
        borderRadius: 2,
        border: '1px solid rgba(255, 204, 0, 0.3)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Computer sx={{ color: '#FFCC00', fontSize: 20 }} />
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
          Aplicación de Escritorio
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`v${appVersion}`}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 204, 0, 0.2)',
            color: '#FFCC00',
            fontSize: '0.7rem',
          }}
        />
        <Chip
          label={platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 204, 0, 0.2)',
            color: '#FFCC00',
            fontSize: '0.7rem',
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * Hook to check if running in Electron
 * @returns boolean indicating if running in Electron
 *
 * @example
 * const isElectron = useIsElectron();
 * if (isElectron) {
 *   // Electron-specific code
 * }
 */
export function useIsElectron(): boolean {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(
      typeof window !== 'undefined' && window.electron?.isElectron === true
    );
  }, []);

  return isElectron;
}

/**
 * Hook to get Electron platform
 * @returns platform string or null if not in Electron
 *
 * @example
 * const platform = useElectronPlatform();
 * if (platform === 'win32') {
 *   // Windows-specific code
 * }
 */
export function useElectronPlatform(): NodeJS.Platform | null {
  const [platform, setPlatform] = useState<NodeJS.Platform | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.platform) {
      setPlatform(window.electron.platform);
    }
  }, []);

  return platform;
}
