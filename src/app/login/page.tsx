'use client';

import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor introduce tu email y contraseña');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      
      console.log("Intentando iniciar sesión con:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error de autenticación:", error);
        throw error;
      }

      console.log("Login exitoso:", data.session ? "Sesión creada" : "Sin sesión");
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error("Error completo:", err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      background: '#000000',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <Box 
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,204,0,0.2) 0%, rgba(0,0,0,0) 70%)',
          top: '-50px',
          left: '-50px',
        }}
      />
      
      <Box 
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,204,0,0.15) 0%, rgba(0,0,0,0) 70%)',
          bottom: '-100px',
          right: '-100px',
        }}
      />

      {/* Yellow lines on sides */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: '5%',
          width: '3px',
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(255,204,0,0), rgba(255,204,0,0.8), rgba(255,204,0,0))',
        }}
      />
      
      <Box 
        sx={{
          position: 'absolute',
          bottom: 0,
          right: '7%',
          width: '3px',
          height: '25%',
          background: 'linear-gradient(to top, rgba(255,204,0,0), rgba(255,204,0,0.6), rgba(255,204,0,0))',
        }}
      />
      
      <Container maxWidth="xs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box sx={{
            background: 'rgba(25, 25, 25, 0.9)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 204, 0, 0.3)',
            overflow: 'hidden',
            backdropFilter: 'blur(5px)',
            padding: '10px',
          }}>
            {/* Yellow top border */}
            <Box sx={{ 
              height: '4px', 
              width: '100%', 
              background: 'linear-gradient(90deg, rgba(255,204,0,0.3) 0%, #ffcc00 50%, rgba(255,204,0,0.3) 100%)' 
            }} />
            
            <Box sx={{ px: 4, py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ mb: 1 }}>
                <img 
                  src="/logo.png" 
                  alt="Muscle Up Gym" 
                  style={{ width: '200px', height: 'auto' }} 
                />
              </Box>
              
              <Typography 
                variant="subtitle1" 
                align="center" 
                sx={{ 
                  color: '#ffcc00', 
                  fontStyle: 'italic',
                  mb: 4,
                  fontWeight: 500
                }}
              >
                "Tu salud y bienestar es nuestra misión"
              </Typography>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      width: '100%', 
                      background: 'rgba(211, 47, 47, 0.1)', 
                      borderLeft: '3px solid #d32f2f',
                      color: '#f8bbd0'
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
              
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ 
                    mb: 2,
                    '& label': { color: 'rgba(255, 255, 255, 0.6)' },
                    '& label.Mui-focused': { color: '#ffcc00' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 204, 0, 0.6)' },
                      '&.Mui-focused fieldset': { borderColor: '#ffcc00' },
                      color: 'white'
                    },
                    '& .MuiInputBase-input': { color: 'white' }
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePassword}
                          edge="end"
                          sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    mb: 3.5,
                    '& label': { color: 'rgba(255, 255, 255, 0.6)' },
                    '& label.Mui-focused': { color: '#ffcc00' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 204, 0, 0.6)' },
                      '&.Mui-focused fieldset': { borderColor: '#ffcc00' },
                      color: 'white'
                    },
                    '& .MuiInputBase-input': { color: 'white' }
                  }}
                />
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ 
                      py: 1.5, 
                      backgroundColor: '#ffcc00', 
                      color: 'black',
                      fontWeight: 600,
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(255, 204, 0, 0.3)',
                      '&:hover': {
                        backgroundColor: '#e6b800',
                        boxShadow: '0 6px 15px rgba(255, 204, 0, 0.4)'
                      }
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ color: 'black', mr: 1 }} />
                        Iniciando...
                      </Box>
                    ) : (
                      <>
                        INICIAR SESIÓN
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => alert('Esta función estará disponible próximamente')}
                    sx={{ 
                      color: 'rgba(255, 204, 0, 0.8)', 
                      textTransform: 'none',
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#ffcc00',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link href="/registro" style={{ textDecoration: 'none' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#ffffff'
                }
              }}>
                <Typography variant="body2">
                  ¿No tienes una cuenta? <span style={{ color: '#ffcc00', fontWeight: 'bold', marginLeft: '2px' }}>Regístrate</span>
                </Typography>
                <FitnessCenterIcon sx={{ fontSize: 16, ml: 0.5, color: '#ffcc00' }} />
              </Box>
            </Link>
          </Box>
          
          <Typography 
            variant="caption" 
            align="center" 
            sx={{ 
              display: 'block', 
              mt: 4, 
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 300,
              letterSpacing: '0.5px'
            }}
          >
            © {new Date().getFullYear()} Muscle Up Gym • Todos los derechos reservados
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
}