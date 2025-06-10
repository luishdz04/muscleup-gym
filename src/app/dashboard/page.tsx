'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Button, Container, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        const supabase = createBrowserSupabaseClient();
        
        // Verificar sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Obtener rol del usuario
        try {
          const { data: userData, error: userError } = await supabase
            .from('Users')
            .select('rol')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.warn('No se pudo obtener el rol del usuario, usando cliente por defecto:', userError);
            setUserRole('cliente');
          } else {
            setUserRole(userData?.rol || 'cliente');
          }
        } catch (roleError) {
          console.error('Error al verificar rol:', roleError);
          setUserRole('cliente');
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error al verificar autenticación:', error);
        setError(error.message || 'Error al verificar autenticación');
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);
  
  // Efecto para la redirección basada en rol
  useEffect(() => {
    if (!isLoading && userRole) {
      const timer = setTimeout(() => {
        switch(userRole) {
          case 'admin':
          case 'empleado':
            router.push('/dashboard/admin/usuarios');
            break;
          case 'cliente':
          default:
            router.push('/dashboard/cliente');
            break;
        }
      }, 1500); // Pequeña pausa para mostrar la animación
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, userRole, router]);
  
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column', 
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #111111 0%, #1c1c1c 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Muscle Up Gym" 
              style={{ width: '180px', height: 'auto', marginBottom: '20px' }} 
            />
            
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <CircularProgress 
                size={60}
                thickness={4}
                sx={{ 
                  color: '#ffcc00',
                  mb: 3
                }} 
              />
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DashboardIcon sx={{ color: 'white', fontSize: '28px' }} />
              </Box>
            </Box>
            
            <Typography variant="h6" sx={{ color: 'white', mt: 2 }}>
              Cargando tu dashboard...
            </Typography>
            
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
              Estamos preparando todo para ti
            </Typography>
          </Box>
        </motion.div>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column', 
        minHeight: '100vh',
        padding: 3,
        background: 'linear-gradient(145deg, #111111 0%, #1c1c1c 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={4}
            sx={{
              padding: 4,
              borderRadius: '12px',
              bgcolor: 'rgba(40, 40, 40, 0.95)',
              border: '1px solid rgba(255, 204, 0, 0.2)',
              maxWidth: '450px',
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ color: '#f44336', fontWeight: 600, mb: 2 }}
            >
              Error de autenticación
            </Typography>
            
            <Typography 
              variant="body1" 
              gutterBottom
              sx={{ color: 'white', mb: 3 }}
            >
              {error}
            </Typography>
            
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => router.push('/login')}
                sx={{ 
                  mt: 2,
                  bgcolor: '#ffcc00',
                  color: 'black',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#e6b800'
                  },
                  py: 1.2
                }}
              >
                Volver al inicio de sesión
              </Button>
            </motion.div>
          </Paper>
        </motion.div>
      </Box>
    );
  }
  
  // Esta parte rara vez se verá debido al middleware y el useEffect de arriba
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #111111 0%, #1c1c1c 100%)',
      py: 6
    }}>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={4}
            sx={{
              padding: 5,
              borderRadius: '12px',
              bgcolor: 'rgba(40, 40, 40, 0.95)',
              border: '1px solid rgba(255, 204, 0, 0.2)',
              textAlign: 'center',
              mb: 4
            }}
          >
            <img 
              src="/logo.png" 
              alt="Muscle Up Gym" 
              style={{ width: '150px', height: 'auto', marginBottom: '20px' }} 
            />
            
            <Typography 
              variant="h4" 
              sx={{ color: 'white', fontWeight: 600, mb: 1 }}
            >
              Panel de Control
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                mb: 4,
                fontStyle: 'italic'
              }}
            >
              Redireccionando a tu área personalizada...
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard/cliente" style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="contained"
                    fullWidth
                    startIcon={<PersonIcon />}
                    sx={{ 
                      bgcolor: '#ffcc00', 
                      color: '#000',
                      '&:hover': { bgcolor: '#e6b800' },
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Panel de Cliente
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard/admin/usuarios" style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="contained"
                    fullWidth
                    startIcon={<SupervisorAccountIcon />}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.15)', 
                      color: '#fff',
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.25)'
                      },
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Panel de Admin
                  </Button>
                </Link>
              </motion.div>
            </Box>
          </Paper>
          
          <Typography 
            variant="caption" 
            align="center" 
            sx={{ 
              display: 'block', 
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 300,
            }}
          >
            © {new Date().getFullYear()} Muscle Up Gym • Todos los derechos reservados
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
}