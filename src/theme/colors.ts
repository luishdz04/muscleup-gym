// 🎨 COLORES CORPORATIVOS
export const corporateColors = {
    // Colores principales
    primary: {
      main: '#FFCC00', // Amarillo corporativo
      light: '#FFD700',
      dark: '#CC9900',
      contrastText: '#000000'
    },
    
    // Fondos
    background: {
      default: '#000000', // Fondo negro
      paper: '#FFFFFF',   // Papel blanco
      dark: '#1a1a1a',    // Negro suave
      light: '#f5f5f5'    // Gris claro
    },
    
    // Textos
    text: {
      primary: '#FFFFFF',    // Texto blanco sobre negro
      secondary: '#CCCCCC',  // Gris claro
      disabled: '#666666',   // Gris oscuro
      onPrimary: '#000000',  // Negro sobre amarillo
      onWhite: '#000000'     // Negro sobre blanco
    },
    
    // Estados
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C'
    },
    
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00'
    },
    
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#D32F2F'
    },
    
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2'
    },
    
    // Gradientes corporativos
    gradients: {
      primary: 'linear-gradient(135deg, #FFCC00 0%, #FFD700 100%)',
      primaryDark: 'linear-gradient(135deg, #CC9900 0%, #FFCC00 100%)',
      black: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      warning: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
      error: 'linear-gradient(135deg, #F44336 0%, #d32f2f 100%)',
      info: 'linear-gradient(135deg, #2196F3 0%, #1976d2 100%)'
    }
  };
  
  // 🎨 Utilidades de colores
  export const getGradient = (type: keyof typeof corporateColors.gradients) => {
    return corporateColors.gradients[type];
  };
  
  export const getContrastText = (backgroundColor: string) => {
    // Si es fondo oscuro, texto claro
    if (backgroundColor === '#000000' || backgroundColor.includes('#000')) {
      return corporateColors.text.primary;
    }
    // Si es fondo claro, texto oscuro
    return corporateColors.text.onWhite;
  };