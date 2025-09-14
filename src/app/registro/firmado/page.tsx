'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function RegistroFirmadoPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/registro-pendiente';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000, #121212)',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2
    }}>
      <Container maxWidth="md">
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #121212, #1E1E1E)',
          border: '2px solid #FFCC0030',
          borderRadius: 4,
          boxShadow: '0 8px 32px #FFCC0010'
        }}>
          
          <InfoIcon sx={{ 
            fontSize: 80, 
            color: '#FFCC00',
            mb: 3
          }} />
          
          <Typography variant="h4" sx={{ 
            color: '#FFCC00',
            fontWeight: 800,
            mb: 2
          }}>
            Redirigiendo...
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: '#CCCCCC',
            mb: 4,
            lineHeight: 1.7
          }}>
            Te estamos redirigiendo a la página correcta para completar tu registro.
          </Typography>

          <Box sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: '#FFCC0010',
            border: '1px dashed #FFCC0050',
            mb: 4
          }}>
            <Typography variant="h6" sx={{ 
              color: '#FFCC00',
              fontWeight: 600,
              mb: 1
            }}>
              Redirección automática en {countdown} segundos
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#CCCCCC'
            }}>
              Si no eres redirigido automáticamente, haz clic en el botón de abajo
            </Typography>
          </Box>

          <Button
            variant="contained"
            component={Link}
            href="/registro-pendiente"
            sx={{
              backgroundColor: '#FFCC00',
              color: '#000000',
              fontWeight: 600,
              px: 4,
              py: 2,
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#E6B800'
              }
            }}
          >
            Continuar al registro
          </Button>

          <Typography variant="caption" sx={{ 
            color: '#888888',
            mt: 4,
            display: 'block'
          }}>
            Muscle Up Gym | administracion@muscleupgym.fitness
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}