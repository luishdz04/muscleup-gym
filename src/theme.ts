// theme.ts - COMPLETO Y CORREGIDO
'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// PALETA DE COLORES COMPLETA - DARK THEME
const colorTokens = {
  // Colores Base del PDF
  brand: '#FFCC00',
  black: '#000000', 
  white: '#FFFFFF', 
   
  // Escala Neutra Dark (exactos del PDF)
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
  warning: '#FFCC00', // Usa el brand como warning

  // ✅ VARIANTES DE ESTADO (para hover, active, etc.)
  brandHover: '#E6B800',        // Versión más oscura del amarillo
  brandActive: '#CCA300',       // Versión aún más oscura
  successHover: '#16A34A',
  dangerHover: '#DC2626',
  infoHover: '#0EA5E9',

  // ✅ ALIASES SEMÁNTICOS PARA TEXTO
  textPrimary: '#FFFFFF',       // = neutral1200
  textSecondary: '#C9CFDB',     // = neutral1000  
  textMuted: '#8B94AA',         // = neutral900
  textDisabled: '#6A7389',      // = neutral800
  textOnBrand: '#000000',       // Negro sobre amarillo

  // ✅ ALIASES PARA SUPERFICIES
  surfaceLevel1: '#14161A',     // = neutral100
  surfaceLevel2: '#1B1E24',     // = neutral200
  surfaceLevel3: '#23272F',     // = neutral300

  // ✅ UTILIDADES ADICIONALES
  divider: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.25)',
  hoverOverlay: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(10, 10, 11, 0.8)',
  glow: 'rgba(255, 204, 0, 0.3)'
} as const;

// CREAR THEME CON DARK MODE Y TU PALETA EXACTA
let theme = createTheme({
  palette: {
    mode: 'dark',
         
    // Color Primario (Tu Amarillo de Marca)
    primary: {
      main: colorTokens.brand,        // #FFCC00
      contrastText: colorTokens.textOnBrand, // Negro sobre amarillo
    },
         
    // Color Secundario      
    secondary: {
      main: colorTokens.neutral600,   // Gris oscuro
      contrastText: colorTokens.textPrimary,
    },
         
    // Fondos según tu PDF
    background: {
      default: colorTokens.neutral0,  // Negro principal
      paper: colorTokens.surfaceLevel2,  // Superficies elevadas
    },
         
    // Colores de Texto según PDF
    text: {
      primary: colorTokens.textPrimary,   // Texto principal blanco
      secondary: colorTokens.textSecondary, // Texto secundario gris claro
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
    divider: colorTokens.divider,
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
     
  // PERSONALIZACIÓN COMPLETA DE COMPONENTES
  components: {
    // Botones más modernos
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,        // Bordes redondeados
          fontWeight: 600,         // Texto semi-bold
          padding: '10px 24px',    // Más espacioso
          textTransform: 'none',   // Sin mayúsculas
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Sombra sutil
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
         
    // Cards más elegantes
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Sin gradiente por defecto
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 16,         // Muy redondeado
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${colorTokens.shadow}`,
          },
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

    // TextField personalizado
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: colorTokens.brand,
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: colorTokens.brandHover,
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: colorTokens.brand,
            },
          },
        },
      },
    },

    // Chip personalizado
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },

    // Dialog personalizado
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },

    // Switch personalizado
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: colorTokens.brand,
            '& + .MuiSwitch-track': {
              backgroundColor: colorTokens.brand,
            },
          },
        },
      },
    },

    // Table personalizada
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: `${colorTokens.neutral300}50`,
          color: colorTokens.textPrimary,
          fontWeight: 700,
        },
      },
    },
  },
});

// Hacer tipografía responsiva automáticamente
theme = responsiveFontSizes(theme);

export default theme;
export { colorTokens };