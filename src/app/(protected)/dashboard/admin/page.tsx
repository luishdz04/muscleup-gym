'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * P�gina de redirecci�n desde /dashboard/admin/ hacia el dashboard completo
 * El dashboard principal est� en /dashboard/admin/dashboard/
 */
export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente al dashboard completo
    router.replace('/dashboard/admin/dashboard');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        background: 'linear-gradient(135deg, #000000, #121212)',
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          color: '#ffcc00',
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500,
        }}
      >
        Cargando Dashboard...
      </Typography>
    </Box>
  );
}
