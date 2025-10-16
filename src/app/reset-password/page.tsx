"use client";

import React, { useState, useEffect } from 'react';
import { Box, Container, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("El enlace de restablecimiento es inválido o ha expirado.");
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ height: '8px', width: '100%', background: 'linear-gradient(90deg, #ffcc00 0%, #ffd633 100%)' }} />
          
          <Box sx={{ px: 4, py: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <img 
                src="/logo.png" 
                alt="Muscle Up Gym" 
                style={{ width: '180px', height: 'auto' }} 
              />
            </Box>
            
            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 600 }}>
              Restablecer Contraseña
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Contraseña actualizada correctamente. Serás redirigido en breve...
              </Alert>
            )}
            
            {!success && (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Nueva contraseña"
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    py: 1.5, 
                    backgroundColor: '#ffcc00', 
                    color: 'black',
                    '&:hover': {
                      backgroundColor: '#e6b800'
                    }
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}