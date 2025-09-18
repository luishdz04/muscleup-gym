'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Paper,
  Container,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  PictureAsPdf as PdfIcon,
  Home as HomeIcon
} from '@mui/icons-material';

// Tokens de diseño
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

interface ProcessStatus {
  isProcessing: boolean;
  isCompleted: boolean;
  error: string | null;
  processResults?: {
    pdf: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

function BienvenidoContent() {
  const [status, setStatus] = useState<ProcessStatus>({
    isProcessing: true,
    isCompleted: false,
    error: null
  });

  useEffect(() => {
    let attemptCount = 0;
    const maxAttempts = 3;

    const processWelcomePackage = async () => {
      try {
        attemptCount++;
        console.log(`🎬 [BIENVENIDA] Intento ${attemptCount}/${maxAttempts}...`);

        const response = await fetch('/api/welcome-package', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log("✅ [BIENVENIDA] Paquete procesado exitosamente:", data);
          setStatus({
            isProcessing: false,
            isCompleted: true,
            error: null,
            processResults: data.processResults
          });
        } else if (response.status === 401 && attemptCount < maxAttempts) {
          // Si no hay sesión aún, reintentar
          console.log(`⏳ [BIENVENIDA] Sin sesión aún, reintentando en 3 segundos... (${attemptCount}/${maxAttempts})`);
          setTimeout(processWelcomePackage, 3000);
        } else {
          console.error("❌ [BIENVENIDA] Error en API:", data);
          setStatus({
            isProcessing: false,
            isCompleted: false,
            error: data.message || 'Error procesando paquete de bienvenida'
          });
        }
      } catch (error) {
        console.error("💥 [BIENVENIDA] Error de conexión:", error);
        
        if (attemptCount < maxAttempts) {
          console.log(`🔄 [BIENVENIDA] Error de conexión, reintentando en 3 segundos... (${attemptCount}/${maxAttempts})`);
          setTimeout(processWelcomePackage, 3000);
        } else {
          setStatus({
            isProcessing: false,
            isCompleted: false,
            error: 'Error de conexión. Intenta recargar la página.'
          });
        }
      }
    };

    // Iniciar después de 2 segundos para dar tiempo a que se establezcan las cookies
    const initialTimer = setTimeout(processWelcomePackage, 2000);
    
    return () => clearTimeout(initialTimer);
  }, []);

  if (status.isProcessing) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md">
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
            border: `2px solid ${darkProTokens.primary}30`,
            borderRadius: 4,
            boxShadow: `0 8px 32px ${darkProTokens.primary}10`
          }}>
            <CircularProgress 
              sx={{ 
                color: darkProTokens.primary,
                mb: 3
              }} 
              size={60} 
            />
            
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary,
              fontWeight: 700,
              mb: 2
            }}>
              Procesando tu cuenta...
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              mb: 4
            }}>
              Estamos preparando tu paquete de bienvenida
            </Typography>
            
            <LinearProgress 
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${darkProTokens.surfaceLevel2}`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: darkProTokens.primary
                }
              }}
            />
            
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textDisabled,
              mt: 2
            }}>
              Generando PDF, enviando correo y WhatsApp...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (status.error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md">
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
            border: `2px solid #f4434350`,
            borderRadius: 4
          }}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                backgroundColor: '#f4434310',
                color: darkProTokens.textPrimary,
                '& .MuiAlert-icon': {
                  color: '#f44343'
                }
              }}
            >
              {status.error}
            </Alert>
            
            <Typography variant="h5" sx={{ 
              color: darkProTokens.textPrimary,
              mb: 3
            }}>
              Hubo un problema al procesar tu cuenta
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textSecondary,
              mb: 4
            }}>
              No te preocupes, tu cuenta ha sido creada exitosamente. 
              Puedes recargar la página o contactarnos si el problema persiste.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{
                  backgroundColor: darkProTokens.primary,
                  color: darkProTokens.background,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: darkProTokens.primaryHover
                  }
                }}
              >
                🔄 Recargar página
              </Button>
              
              <Button
                variant="outlined"
                component={Link}
                href="/"
                sx={{
                  borderColor: darkProTokens.primary,
                  color: darkProTokens.primary,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: darkProTokens.primaryHover,
                    backgroundColor: `${darkProTokens.primary}10`
                  }
                }}
              >
                Ir al Inicio
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Estado de éxito
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container maxWidth="md">
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
          border: `2px solid ${darkProTokens.success}30`,
          borderRadius: 4,
          boxShadow: `0 8px 32px ${darkProTokens.success}10`
        }}>
          <CheckCircleIcon sx={{ 
            fontSize: 80, 
            color: darkProTokens.success,
            mb: 3
          }} />
          
          <Typography variant="h3" sx={{ 
            color: darkProTokens.primary,
            fontWeight: 800,
            mb: 2
          }}>
            ¡Bienvenido a Muscle Up GYM!
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 4
          }}>
            Tu cuenta ha sido verificada exitosamente
          </Typography>
          
          {/* Estado de procesos */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textPrimary,
              mb: 2
            }}>
              Hemos preparado todo para ti:
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 4,
              flexWrap: 'wrap'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PdfIcon sx={{ color: status.processResults?.pdf ? darkProTokens.success : darkProTokens.textDisabled }} />
                <Typography sx={{ 
                  color: status.processResults?.pdf ? darkProTokens.success : darkProTokens.textDisabled 
                }}>
                  Contrato PDF
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ color: status.processResults?.email ? darkProTokens.success : darkProTokens.textDisabled }} />
                <Typography sx={{ 
                  color: status.processResults?.email ? darkProTokens.success : darkProTokens.textDisabled 
                }}>
                  Correo enviado
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsAppIcon sx={{ color: status.processResults?.whatsapp ? darkProTokens.success : darkProTokens.textDisabled }} />
                <Typography sx={{ 
                  color: status.processResults?.whatsapp ? darkProTokens.success : darkProTokens.textDisabled 
                }}>
                  WhatsApp enviado
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 2
          }}>
            En breve recibirás un correo con tu contrato y toda la información necesaria.
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: darkProTokens.textSecondary,
            mb: 4
          }}>
            Si tienes WhatsApp, también recibirás un mensaje de bienvenida.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              component={Link}
              href="/"
              startIcon={<HomeIcon />}
              sx={{
                backgroundColor: darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: darkProTokens.primaryHover
                }
              }}
            >
              Ir al Inicio
            </Button>
          </Box>
          
          <Typography variant="caption" sx={{ 
            color: darkProTokens.textDisabled,
            mt: 4,
            display: 'block'
          }}>
            ¿Necesitas ayuda? Contáctanos al 866-112-7905 o administracion@muscleupgym.fitness
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default function BienvenidoPage() {
  return (
    <Suspense fallback={
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md">
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
            border: `2px solid ${darkProTokens.primary}30`,
            borderRadius: 4
          }}>
            <CircularProgress 
              sx={{ 
                color: darkProTokens.primary,
                mb: 3
              }} 
              size={60} 
            />
            
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary,
              fontWeight: 700,
              mb: 2
            }}>
              Cargando...
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textSecondary
            }}>
              Preparando tu página de bienvenida
            </Typography>
          </Paper>
        </Container>
      </Box>
    }>
      <BienvenidoContent />
    </Suspense>
  );
}