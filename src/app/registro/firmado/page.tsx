"use client";

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function RegistroExitoso() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState('');
  
  // Obtener el nombre del usuario si está disponible
  useEffect(() => {
    const userId = searchParams?.get('userId');
    if (userId) {
      fetch(`/api/getUserName?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.name) {
            setUserName(data.name);
          }
        })
        .catch(err => console.error('Error al obtener el nombre:', err));
    }
  }, [searchParams]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={8}
          sx={{ 
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Barra superior decorativa */}
          <Box 
            sx={{ 
              height: '8px', 
              width: '100%', 
              background: 'linear-gradient(90deg, #ffcc00 0%, #ffd633 50%, #ffcc00 100%)' 
            }} 
          />

          {/* Contenedor principal */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: { xs: 3, sm: 6 },
              py: { xs: 4, sm: 6 },
              textAlign: 'center',
              position: 'relative',
              backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(255, 204, 0, 0.05) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(255, 204, 0, 0.05) 0%, transparent 40%)'
            }}
          >
            {/* Círculos decorativos de fondo */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 20, 
                width: 100, 
                height: 100, 
                borderRadius: '50%', 
                background: 'rgba(255, 204, 0, 0.05)',
                zIndex: 0
              }} 
            />
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 30, 
                right: 30, 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                background: 'rgba(255, 204, 0, 0.05)',
                zIndex: 0 
              }} 
            />

            {/* Icono animado */}
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 100,
                height: 100,
                borderRadius: '50%',
                mb: 4,
                background: 'radial-gradient(circle, rgba(255, 204, 0, 0.1) 0%, rgba(255, 204, 0, 0) 70%)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(255, 204, 0, 0.4)' },
                  '70%': { boxShadow: '0 0 0 20px rgba(255, 204, 0, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(255, 204, 0, 0)' }
                }
              }}
            >
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 80, 
                  color: '#ffcc00',
                  filter: 'drop-shadow(0px 4px 8px rgba(255, 204, 0, 0.3))'
                }} 
              />
            </Box>

            {/* Contenido */}
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                color: '#000000',
                position: 'relative',
                zIndex: 1
              }}
            >
              ¡Registro Exitoso!
            </Typography>

            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 500, 
                mb: 4, 
                color: '#333333',
                position: 'relative',
                zIndex: 1
              }}
            >
              Tu inscripción se ha completado correctamente
            </Typography>

            <Box 
              sx={{ 
                px: { xs: 2, md: 8 }, 
                py: 3, 
                mb: 4, 
                borderRadius: '12px',
                backgroundColor: 'rgba(248, 248, 248, 0.9)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                zIndex: 1,
                border: '1px solid #f0f0f0'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2, 
                  color: '#000000', 
                  fontSize: '1.1rem', 
                  lineHeight: 1.6 
                }}
              >
                {userName ? `¡Gracias ${userName} por registrarte en Muscle Up Gym!` : 'Gracias por registrarte en Muscle Up Gym.'}
                <br/>
                Hemos enviado un correo electrónico con todos los detalles de tu inscripción y una copia de tu contrato.
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#555555', 
                  fontSize: '1rem',
                  fontStyle: 'italic'
                }}
              >
                Si no encuentras el correo, revisa tu carpeta de spam o ponte en contacto con nosotros.
              </Typography>
            </Box>

            {/* NUEVO: Mensaje de iniciar sesión */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                border: '1px dashed rgba(255, 204, 0, 0.5)'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Ya puedes iniciar sesión con tu correo y contraseña para acceder a tu cuenta
              </Typography>
            </Box>

            {/* Logo o imagen del gimnasio */}
            <Box 
              component="img"
              src="https://muscleupgym.com.mx/wp-content/uploads/2024/02/logo-word-bueno.png"
              alt="Muscle Up Gym Logo"
              sx={{ 
                width: '180px', 
                mb: 3,
                mixBlendMode: 'multiply'
              }}
            />

            <Box 
              sx={{ 
                borderTop: '1px solid #e5e7eb', 
                width: '100%', 
                pt: 3,
                mt: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Muscle Up Gym | administracion@muscleupgym.com.mx | Tel: 866-112-7905
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  fontStyle: 'italic',
                  color: '#000000',
                  fontWeight: 500
                }}
              >
                "Tu salud y bienestar es nuestra misión"
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Botones de navegación */}
        <Box sx={{ textAlign: 'center', mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
          {/* Botón de volver al inicio */}
          <Link 
            href="/" 
            style={{ 
              textDecoration: 'none',
              color: '#000000',
              background: 'linear-gradient(90deg, #ffcc00 0%, #ffd633 100%)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(255, 204, 0, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            className="hover-effect"
          >
            Volver al inicio
          </Link>

          {/* NUEVO: Botón de iniciar sesión */}
          <Link 
            href="/login" 
            style={{ 
              textDecoration: 'none',
              color: '#ffffff',
              background: 'linear-gradient(90deg, #1a1a1a 0%, #333333 100%)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              border: '1px solid #555'
            }}
            className="hover-effect"
          >
            Iniciar sesión
          </Link>
        </Box>
      </Container>

      {/* Estilos adicionales */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
        .hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 204, 0, 0.4);
        }
      `}</style>
    </Box>
  );
}