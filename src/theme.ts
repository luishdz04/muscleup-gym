'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// PALETA DE COLORES SEGÚN TU PDF - DARK THEME
const colorTokens = {
  // Colores Base del PDF
  brand: '#FFCC00',
  black: '#000000', 
  white: '#FFFFFF',
  
  // Escala Neutra Dark (copiados exactos del PDF)
  neutral0: '#0A0A0B',    // N0
  neutral50: '#0F1012',   // N50
  neutral100: '#14161A',  // N100
  neutral200: '#1B1E24',  // N200
  neutral300: '#23272F',  // N300
  neutral400: '#2C313B',  // N400
  neutral500: '#363C48',  // N500
  neutral600: '#424959',  // N600
  neutral700: '#535B6E',  // N700
  neutral800: '#6A7389',  // N800
  neutral900: '#8B94AA',  // N900
  neutral1000: '#C9CFDB', // N1000
  neutral1100: '#E8ECF5', // N1100
  neutral1200: '#FFFFFF', // N1200
  
  // Colores Semánticos (del PDF)
  success: '#22C55E',
  danger: '#EF4444', 
  info: '#38BDF8',
  warning: '#FFCC00' // Usa el brand como warning
};

// CREAR THEME CON DARK MODE Y TU PALETA EXACTA
let theme = createTheme({
  palette: {
    mode: 'dark',
    
    // Color Primario (Tu Amarillo de Marca)
    primary: {
      main: colorTokens.brand,        // #FFCC00
      contrastText: colorTokens.black, // Texto negro sobre amarillo
    },
    
    // Color Secundario  
    secondary: {
      main: colorTokens.neutral600,   // Gris oscuro
      contrastText: colorTokens.white,
    },
    
    // Fondos según tu PDF
    background: {
      default: colorTokens.neutral0,  // Negro principal
      paper: colorTokens.neutral200,  // Superficies elevadas
    },
    
    // Colores de Texto según PDF
    text: {
      primary: colorTokens.neutral1200,   // Texto principal blanco
      secondary: colorTokens.neutral1000, // Texto secundario gris claro
    },
    
    // Colores Semánticos
    error: {
      main: colorTokens.danger,  // #EF4444
    },
    success: {
      main: colorTokens.success, // #22C55E
    },
    warning: {
      main: colorTokens.warning, // #FFCC00
    },
    info: {
      main: colorTokens.info,    // #38BDF8
    },
    
    // Divisores
    divider: colorTokens.neutral400,
  },
  
  // TIPOGRAFÍA OPTIMIZADA
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont', 
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    
    button: {
      fontWeight: 600,
      textTransform: 'none', // No mayúsculas automáticas
    },
  },
  
  // PERSONALIZACIÓN BÁSICA DE COMPONENTES
  components: {
    // Botones más modernos
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,        // Bordes redondeados
          fontWeight: 600,         // Texto semi-bold
          padding: '10px 24px',    // Más espacioso
          textTransform: 'none',   // Sin mayúsculas
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Sombra sutil
        },
      },
    },
    
    // Cards más elegantes
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Sin gradiente por defecto
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: 16,         // Muy redondeado
        },
      },
    },
    
    // Paper (superficies)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Sin gradiente
        },
      },
    },
  },
});

// Hacer tipografía responsiva automáticamente
theme = responsiveFontSizes(theme);

export default theme;
export { colorTokens };