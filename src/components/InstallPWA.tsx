'use client';

import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

const Alert = MuiAlert as React.FC<any>;

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
    setShowSnackbar(true);
  };

  if (!supportsPWA) return null;

  return (
    <>
      <Button
        variant="contained"
        onClick={onClick}
        startIcon={<InstallMobileIcon />}
        sx={{
          background: 'linear-gradient(135deg, #ffcc00, #ffd700)',
          color: '#000',
          fontWeight: 700,
          '&:hover': {
            background: '#ffdd44',
          },
        }}
      >
        Instalar App
      </Button>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          ¡Instalando Muscle Up GYM en tu dispositivo!
        </Alert>
      </Snackbar>
    </>
  );
}