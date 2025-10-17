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
        gap: { xs: 2, sm: 2.5, md: 3 },
        background: 'linear-gradient(135deg, #000000, #121212)',
        p: { xs: 2, sm: 3 }
      }}
    >
      <CircularProgress
        size={{ xs: 50, sm: 55, md: 60 }}
        sx={{
          color: '#ffcc00',
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500,
          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
          textAlign: 'center'
        }}
      >
        Cargando Dashboard...
      </Typography>
    </Box>
  );
}
