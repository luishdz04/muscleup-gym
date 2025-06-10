'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, CircularProgress, Avatar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ClienteDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();
  
  // Obtener datos del usuario autenticado
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const supabase = createBrowserSupabaseClient();
        
        console.log("Obteniendo sesión de usuario...");
        // Verificar sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error de sesión:", sessionError);
          setDebugInfo({ sessionError });
          throw new Error('Error al obtener la sesión: ' + sessionError.message);
        }
        
        if (!session) {
          console.error("No hay sesión activa");
          setDebugInfo({ noSession: true });
          throw new Error('No se encontró sesión activa');
        }
        
        console.log("Sesión encontrada para usuario:", session.user.id);
        setUser(session.user);
        
        // Mostrar información de sesión
        setDebugInfo({
          sessionFound: true,
          userId: session.user.id,
          userEmail: session.user.email,
          userAppMetadata: session.user.app_metadata,
          timestamp: new Date().toISOString()
        });
        
        // Usar la API para obtener el perfil (evitando RLS)
        console.log("Obteniendo datos de usuario a través de API...");
        try {
          const response = await fetch(`/api/user-profile?userId=${session.user.id}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error en respuesta API:", errorData);
            throw new Error(errorData.message || 'Error al obtener datos del usuario');
          }
          
          const userData = await response.json();
          console.log("Datos obtenidos a través de API:", userData);
          
          setUserProfile(userData);
          setError(null);
        } catch (apiError: any) {
          console.error("Error en API:", apiError);
          
          // Usar datos básicos del usuario como alternativa
          console.log("Usando datos básicos de usuario...");
          setUserProfile({
            firstName: session.user.email?.split('@')[0] || 'Usuario',
            lastName: '',
            email: session.user.email,
            rol: 'cliente'
          });
          
          // No mostrar error para no interrumpir la experiencia del usuario
        }
        
      } catch (err: any) {
        console.error('Error detallado:', err);
        setError(err.message || 'Error desconocido al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    }
  };
  
  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: '#f5f5f5'
        }}
      >
        <CircularProgress sx={{ color: '#ffcc00', mb: 2 }} />
        <Typography>Cargando datos del usuario...</Typography>
      </Box>
    );
  }
  
  // Si hay error, mostrar mensaje con opción de volver
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: 3,
          background: '#f5f5f5'
        }}
      >
        <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 600 }}>
          {error}
        </Alert>
        
        {debugInfo && (
          <Box sx={{ mb: 3, width: '100%', maxWidth: 600, bgcolor: '#f8f8f8', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Información de diagnóstico:</Typography>
            <pre style={{ overflow: 'auto', fontSize: '0.8rem' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained"
            onClick={() => router.refresh()}
            sx={{ bgcolor: '#ffcc00', color: 'black', '&:hover': { bgcolor: '#e6b800' } }}
          >
            Reintentar
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => router.push('/login')}
          >
            Volver al inicio de sesión
          </Button>
        </Box>
      </Box>
    );
  }
  
  // Renderizar el dashboard si todo está bien
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #f5f5f5 0%, #e6e6e6 100%)',
      py: 4
    }}>
      <Container>
        {/* Cabecera con info del usuario */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 2, sm: 0 },
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Avatar 
              src={userProfile?.profilePictureUrl || "/default-avatar.png"} 
              alt={userProfile?.firstName || "Usuario"}
              sx={{ 
                width: 70, 
                height: 70, 
                mr: { xs: 0, sm: 2 },
                mb: { xs: 2, sm: 0 },
                border: '3px solid #ffcc00'
              }} 
            />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Hola, {userProfile?.firstName || 'Usuario'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Membresía: <span style={{ fontWeight: 500, color: '#ffcc00' }}>Cliente</span>
              </Typography>
            </Box>
          </Box>
          
          <Button 
            variant="outlined" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              borderColor: '#ffcc00',
              color: '#000000',
              '&:hover': {
                borderColor: '#e6b800',
                backgroundColor: 'rgba(255, 204, 0, 0.1)'
              }
            }}
          >
            Cerrar sesión
          </Button>
        </Paper>
        
        {/* Menú de opciones */}
        <Grid container spacing={3}>
          {/* Tarjeta de asistencias */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
                },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => alert('Funcionalidad de asistencias en desarrollo')}
            >
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.1)', 
                  borderRadius: '50%', 
                  p: 2, 
                  mb: 2 
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 40, color: '#ffcc00' }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Mis Asistencias
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Ver historial de asistencias
              </Typography>
            </Paper>
          </Grid>
          
          {/* Tarjeta de rutinas */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
                },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => alert('Funcionalidad de rutinas en desarrollo')}
            >
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.1)', 
                  borderRadius: '50%', 
                  p: 2, 
                  mb: 2 
                }}
              >
                <FitnessCenterIcon sx={{ fontSize: 40, color: '#ffcc00' }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Mis Rutinas
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Ver planes de entrenamiento
              </Typography>
            </Paper>
          </Grid>
          
          {/* Tarjeta de pagos */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
                },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => alert('Funcionalidad de pagos en desarrollo')}
            >
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.1)', 
                  borderRadius: '50%', 
                  p: 2, 
                  mb: 2 
                }}
              >
                <PaymentIcon sx={{ fontSize: 40, color: '#ffcc00' }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Mis Pagos
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Historial de pagos y facturas
              </Typography>
            </Paper>
          </Grid>
          
          {/* Tarjeta de perfil */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.1)'
                },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => alert('Funcionalidad de perfil en desarrollo')}
            >
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.1)', 
                  borderRadius: '50%', 
                  p: 2, 
                  mb: 2 
                }}
              >
                <PersonIcon sx={{ fontSize: 40, color: '#ffcc00' }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Mi Perfil
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Editar mis datos personales
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Próximas clases */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mt: 4, 
            borderRadius: '12px',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)'
          }}
        >
          <Typography variant="h5" fontWeight={600} mb={3}>
            Próximas clases
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(255, 204, 0, 0.1)', 
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px dashed #ffcc00'
          }}>
            <Typography>
              No hay clases programadas. ¡Consulta los horarios disponibles!
            </Typography>
          </Box>
        </Paper>
        
        {/* Footer */}
        <Box 
          sx={{ 
            mt: 5, 
            pt: 2, 
            borderTop: '1px solid rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Muscle Up Gym | Todos los derechos reservados
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ mt: 1, fontStyle: 'italic', fontWeight: 500 }}
          >
            "Tu salud y bienestar es nuestra misión"
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}