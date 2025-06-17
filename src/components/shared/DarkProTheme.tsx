import { createTheme } from '@mui/material/styles';

// Tokens para el tema Dark Pro
export const darkProTokens = {
  primary: '#3f51b5',
  secondary: '#f50057',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  background: '#121212',
  surface: '#1e1e1e',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.12)',
  
  // Colores específicos para la aplicación
  gymPrimary: '#3f51b5',
  gymSecondary: '#f50057',
  biometricActive: '#4caf50',
  biometricInactive: '#ff9800',
  biometricError: '#f44336',
};

// Tema Dark Pro
export const darkProTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkProTokens.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: darkProTokens.secondary,
      contrastText: '#ffffff',
    },
    error: {
      main: darkProTokens.error,
    },
    warning: {
      main: darkProTokens.warning,
    },
    info: {
      main: darkProTokens.info,
    },
    success: {
      main: darkProTokens.success,
    },
    background: {
      default: darkProTokens.background,
      paper: darkProTokens.surface,
    },
    text: {
      primary: darkProTokens.textPrimary,
      secondary: darkProTokens.textSecondary,
    },
    divider: darkProTokens.divider,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default darkProTheme;