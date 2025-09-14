'use client';

import React from 'react';
import { Box, Container, Typography, Paper, Button, LinearProgress } from '@mui/material';
import { Email as EmailIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import Link from 'next/link';

// 🎨 DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888'
};

export default function RegistroPendientePage() {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2
    }}>
      <Container maxWidth="md">
        <Paper sx={{
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
          border: `2px solid ${darkProTokens.primary}30`,
          borderRadius: 4,
          boxShadow: `0 8px 32px ${darkProTokens.primary}10`
        }}>
          
          {/* Barra decorativa superior */}
          <Box sx={{ 
            height: '6px', 
            width: '100%', 
            background: `linear-gradient(90deg, ${darkProTokens.primary} 0%, #ffd633 50%, ${darkProTokens.primary} 100%)`,
            borderRadius: '3px',
            mb: 4
          }} />

          <EmailIcon sx={{ 
            fontSize: 80, 
            color: darkProTokens.primary,
            mb: 3
          }} />
          
          <Typography variant="h3" sx={{ 
            color: darkProTokens.primary,
            fontWeight: 800,
            mb: 2,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            ¡Registro Exitoso!
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 4,
            fontSize: { xs: '1.1rem', md: '1.25rem' }
          }}>
            Tu cuenta ha sido creada correctamente
          </Typography>

          {/* Estado de procesos */}
          <Box sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: `${darkProTokens.surfaceLevel2}50`,
            border: `1px solid ${darkProTokens.primary}20`,
            mb: 4
          }}>
            <CheckIcon sx={{ color: darkProTokens.success, mr: 1, verticalAlign: 'middle' }} />
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textPrimary,
              fontWeight: 600,
              display: 'inline',
              fontSize: { xs: '0.95rem', md: '1rem' }
            }}>
              Hemos enviado un correo de confirmación a tu email
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 2,
            lineHeight: 1.7,
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}>
            Para completar tu registro y recibir tu paquete de bienvenida, 
            por favor <strong style={{ color: darkProTokens.primary }}>revisa tu correo electrónico</strong> y 
            haz clic en el enlace de confirmación.
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 4,
            lineHeight: 1.7,
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}>
            Una vez confirmado tu email, recibirás automáticamente:
          </Typography>

          {/* Lista de beneficios */}
          <Box sx={{ 
            textAlign: 'left', 
            mb: 4,
            backgroundColor: `${darkProTokens.surfaceLevel1}30`,
            p: 3,
            borderRadius: 2,
            border: `1px solid ${darkProTokens.primary}15`
          }}>
            <Typography sx={{ 
              color: darkProTokens.textSecondary, 
              mb: 1,
              fontSize: { xs: '0.85rem', md: '0.95rem' }
            }}>
              ✅ Tu contrato personalizado en formato PDF
            </Typography>
            <Typography sx={{ 
              color: darkProTokens.textSecondary, 
              mb: 1,
              fontSize: { xs: '0.85rem', md: '0.95rem' }
            }}>
              ✅ Correo de bienvenida con información completa
            </Typography>
            <Typography sx={{ 
              color: darkProTokens.textSecondary, 
              mb: 1,
              fontSize: { xs: '0.85rem', md: '0.95rem' }
            }}>
              ✅ Mensaje de WhatsApp (si proporcionaste tu número)
            </Typography>
            <Typography sx={{ 
              color: darkProTokens.textSecondary,
              fontSize: { xs: '0.85rem', md: '0.95rem' }
            }}>
              ✅ Acceso completo a tu cuenta del gimnasio
            </Typography>
          </Box>

          {/* Progreso visual */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary,
              mb: 1,
              fontSize: { xs: '0.8rem', md: '0.875rem' }
            }}>
              Paso 1: Registro ✅ | Paso 2: Confirmar email ⏳ | Paso 3: Paquete de bienvenida ⏳
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={33} 
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${darkProTokens.surfaceLevel2}`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: darkProTokens.primary,
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Tip importante */}
          <Box sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: `${darkProTokens.primary}10`,
            border: `1px dashed ${darkProTokens.primary}50`,
            mb: 4
          }}>
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary,
              fontStyle: 'italic',
              fontSize: { xs: '0.8rem', md: '0.875rem' }
            }}>
              💡 <strong>Importante:</strong> Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado
            </Typography>
          </Box>

          {/* Logo */}
       <Box 
  component="img"
  src="https://muscleupgym.fitness/logo.png"
  alt="Muscle Up Gym Logo"
  sx={{ 
    width: { xs: '150px', md: '180px' }, 
    mb: 4,
    filter: 'brightness(0) invert(1)', // Hacer el logo blanco
    opacity: 0.9
  }}
/>

          {/* Botones de acción */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outlined"
              component={Link}
              href="/"
              sx={{
                borderColor: darkProTokens.primary,
                color: darkProTokens.primary,
                fontWeight: 600,
                px: 3,
                py: 1.5,
                fontSize: { xs: '0.85rem', md: '0.875rem' },
                '&:hover': {
                  borderColor: darkProTokens.primaryHover,
                  backgroundColor: `${darkProTokens.primary}10`
                }
              }}
            >
              Volver al inicio
            </Button>

            <Button
              variant="contained"
              href="mailto:administracion@muscleupgym.fitness"
              sx={{
                backgroundColor: darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 600,
                px: 3,
                py: 1.5,
                fontSize: { xs: '0.85rem', md: '0.875rem' },
                '&:hover': {
                  backgroundColor: darkProTokens.primaryHover
                }
              }}
            >
              ¿Necesitas ayuda?
            </Button>
          </Box>
          
          {/* Información de contacto */}
          <Typography variant="caption" sx={{ 
            color: darkProTokens.textDisabled,
            mt: 4,
            display: 'block',
            fontSize: { xs: '0.7rem', md: '0.75rem' }
          }}>
            Muscle Up Gym | 866-112-7905 | administracion@muscleupgym.fitness<br />
            "Tu salud y bienestar es nuestra misión"
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}