// 🎨 DARK PRO SYSTEM CONFIGURATION
export const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// 🔧 MEMBERSHIP CONFIGURATION
export const MEMBERSHIP_CONFIG = {
  commissions: {
    defaultRates: {
      debito: 2.5,
      credito: 3.5
    },
    exemptMethods: ['efectivo', 'transferencia']
  },
  ui: {
    darkProTokens,
    animations: {
      duration: 0.3,
      easing: 'ease-in-out'
    }
  },
  validation: {
    minSearchLength: 2,
    maxPaymentMethods: 5,
    maxNotesLength: 500
  },
  defaults: {
    currency: 'MXN',
    locale: 'es-MX',
    timezone: 'America/Mexico_City'
  }
};
