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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

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
      background: '#000000', // Fondo totalmente negro
      overflow: 'hidden',
      p: { xs: 2, sm: 3 }
    }}>
      {/* Subtle geometric pattern overlay - very dark */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,204,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,204,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Minimal accent lines - only yellow */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: { xs: '3%', md: '8%' },
          width: '2px',
          height: { xs: '20%', md: '25%' },
          background: 'linear-gradient(to bottom, rgba(255,204,0,0), rgba(255,204,0,0.5), rgba(255,204,0,0))',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: { xs: '5%', md: '10%' },
          width: '2px',
          height: { xs: '15%', md: '20%' },
          background: 'linear-gradient(to top, rgba(255,204,0,0), rgba(255,204,0,0.4), rgba(255,204,0,0))',
        }}
      />

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Box sx={{
            background: 'linear-gradient(145deg, rgba(15, 15, 15, 0.95), rgba(10, 10, 10, 0.98))',
            borderRadius: { xs: '20px', sm: '24px' },
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 204, 0, 0.15),
              inset 0 1px 0 rgba(255, 204, 0, 0.05)
            `,
            border: '1px solid rgba(255, 204, 0, 0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            position: 'relative',
          }}>
            {/* Premium top accent */}
            <Box sx={{
              height: '3px',
              width: '100%',
              background: 'linear-gradient(90deg, rgba(255,204,0,0) 0%, #ffcc00 50%, rgba(255,204,0,0) 100%)',
              boxShadow: '0 0 20px rgba(255, 204, 0, 0.5)'
            }} />

            <Box sx={{
              px: { xs: 3, sm: 5 },
              py: { xs: 4, sm: 6 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Logo with glow effect */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box sx={{
                  mb: 2,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -10,
                    background: 'radial-gradient(circle, rgba(255,204,0,0.15) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                    zIndex: -1
                  }
                }}>
                  <img
                    src="/logo.png"
                    alt="Muscle Up Gym"
                    style={{
                      width: '100%',
                      maxWidth: '240px',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Box>
              </motion.div>

              {/* Tagline */}
              <Typography
                variant="subtitle1"
                align="center"
                sx={{
                  color: '#ffcc00',
                  fontStyle: 'italic',
                  mb: 4,
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  letterSpacing: '0.5px',
                  textShadow: '0 0 10px rgba(255, 204, 0, 0.3)'
                }}
              >
                "Tu salud y bienestar es nuestra misión"
              </Typography>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                >
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      background: 'rgba(211, 47, 47, 0.15)',
                      borderLeft: '3px solid #d32f2f',
                      color: '#ffcdd2',
                      borderRadius: '8px',
                      '& .MuiAlert-icon': {
                        color: '#f44336'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              {/* Login Form */}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: 'rgba(255, 204, 0, 0.6)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2.5,
                    '& label': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    },
                    '& label.Mui-focused': { color: '#ffcc00' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 204, 0, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 0 0 3px rgba(255, 204, 0, 0.1)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffcc00',
                        borderWidth: '2px'
                      },
                      color: 'white'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      fontSize: { xs: '0.95rem', sm: '1rem' }
                    }
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
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'rgba(255, 204, 0, 0.6)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePassword}
                          edge="end"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              color: '#ffcc00',
                              backgroundColor: 'rgba(255, 204, 0, 0.1)'
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 4,
                    '& label': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    },
                    '& label.Mui-focused': { color: '#ffcc00' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 204, 0, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 0 0 3px rgba(255, 204, 0, 0.1)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ffcc00',
                        borderWidth: '2px'
                      },
                      color: 'white'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      fontSize: { xs: '0.95rem', sm: '1rem' }
                    }
                  }}
                />

                {/* Login Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: { xs: 1.5, sm: 1.8 },
                      backgroundColor: '#ffcc00',
                      color: '#000000',
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      borderRadius: '12px',
                      boxShadow: `
                        0 4px 14px rgba(255, 204, 0, 0.4),
                        0 0 0 1px rgba(255, 204, 0, 0.2)
                      `,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                        transition: 'left 0.5s ease'
                      },
                      '&:hover': {
                        backgroundColor: '#e6b800',
                        boxShadow: `
                          0 6px 20px rgba(255, 204, 0, 0.5),
                          0 0 0 1px rgba(255, 204, 0, 0.3)
                        `,
                        '&::before': {
                          left: '100%'
                        }
                      },
                      '&:disabled': {
                        backgroundColor: 'rgba(255, 204, 0, 0.3)',
                        color: 'rgba(0, 0, 0, 0.5)'
                      }
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={20} sx={{ color: '#000000' }} />
                        <span>Iniciando sesión...</span>
                      </Box>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </motion.div>

                {/* Forgot Password */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => alert('Esta función estará disponible próximamente')}
                    sx={{
                      color: 'rgba(255, 204, 0, 0.7)',
                      textTransform: 'none',
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 204, 0, 0.05)',
                        color: '#ffcc00',
                      }
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Sign Up Link */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link href="/registro" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1.5,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 204, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 204, 0, 0.05)',
                    borderColor: 'rgba(255, 204, 0, 0.4)',
                    boxShadow: '0 4px 12px rgba(255, 204, 0, 0.15)'
                  }
                }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' }
                    }}
                  >
                    ¿No tienes una cuenta?
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffcc00',
                      fontWeight: 700,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' }
                    }}
                  >
                    Regístrate
                  </Typography>
                  <FitnessCenterIcon sx={{ fontSize: 18, color: '#ffcc00' }} />
                </Box>
              </motion.div>
            </Link>
          </Box>

          {/* Footer */}
          <Typography
            variant="caption"
            align="center"
            sx={{
              display: 'block',
              mt: 5,
              color: 'rgba(255, 255, 255, 0.3)',
              fontWeight: 300,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
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
