// src/components/ErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugIcon 
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.group('🚨 ERROR BOUNDARY ACTIVATED');
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard/admin';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // ✅ CUSTOM FALLBACK UI v7.0
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // ✅ DEFAULT ENTERPRISE ERROR UI MUscleUp v7.0
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
            p: 3
          }}
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.danger}`,
              borderRadius: 3,
              color: colorTokens.textPrimary
            }}
          >
            {/* ✅ HEADER ERROR CON BRANDING v7.0 */}
            <Box sx={{ mb: 3 }}>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: colorTokens.danger,
                  mb: 2,
                  filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                }}
              />
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: colorTokens.danger,
                  mb: 1
                }}
              >
                ¡Oops! Algo salió mal
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: colorTokens.textSecondary,
                  fontWeight: 300
                }}
              >
                MuscleUp Gym POS - Error del Sistema
              </Typography>
            </Box>

            {/* ✅ MENSAJE DE ERROR v7.0 */}
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: `${colorTokens.danger}10`,
                color: colorTokens.textPrimary,
                border: `1px solid ${colorTokens.danger}30`,
                '& .MuiAlert-icon': { color: colorTokens.danger }
              }}
            >
              <Typography variant="body1" fontWeight="600" gutterBottom>
                Error técnico detectado
              </Typography>
              <Typography variant="body2">
                {this.state.error?.message || 'Error desconocido en el sistema'}
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                    Información de desarrollo:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      mt: 1,
                      p: 1,
                      backgroundColor: colorTokens.neutral200,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 150,
                      color: colorTokens.textSecondary
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Box>
                </Box>
              )}
            </Alert>

            {/* ✅ ACCIONES DE RECUPERACIÓN v7.0 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                  color: colorTokens.textOnBrand,
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Reintentar
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{
                  borderColor: colorTokens.info,
                  color: colorTokens.info,
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: `${colorTokens.info}20`,
                    borderColor: colorTokens.info,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Recargar Página
              </Button>

              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  borderColor: colorTokens.success,
                  color: colorTokens.success,
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: `${colorTokens.success}20`,
                    borderColor: colorTokens.success,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Ir al Dashboard
              </Button>
            </Box>

            {/* ✅ INFORMACIÓN ADICIONAL v7.0 */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: `${colorTokens.info}10`, borderRadius: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mb: 1 }}>
                <BugIcon sx={{ fontSize: 20, color: colorTokens.info }} />
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                  ¿Necesitas ayuda?
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Si el error persiste, contacta al equipo de soporte técnico con los detalles del error mostrados arriba.
              </Typography>
              <Typography variant="caption" sx={{ color: colorTokens.textMuted, display: 'block', mt: 1 }}>
                MuscleUp Gym POS v7.0 - Sistema Enterprise
              </Typography>
            </Box>
          </Paper>
        </Box>
      );
    }

    // ✅ RENDERIZAR CHILDREN NORMALMENTE v7.0
    return this.props.children;
  }
}