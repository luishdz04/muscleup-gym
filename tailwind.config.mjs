import colors from 'tailwindcss/colors';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}', // CRÍTICO: Tremor necesita esto
  ],
  theme: {
    transparent: 'transparent',
    current: 'currentColor',
    extend: {
      // ============================================================================
      // ANIMACIONES REQUERIDAS POR TREMOR (Accordion, Dialog, etc.)
      // ============================================================================
      keyframes: {
        accordionOpen: {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        accordionClose: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        dialogOverlayShow: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        dialogContentShow: {
          from: {
            opacity: '0',
            transform: 'translate(-50%, -45%) scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
          },
        },
      },
      animation: {
        'accordion-open': 'accordionOpen 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'accordion-close': 'accordionClose 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dialog-overlay-show': 'dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dialog-content-show': 'dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      
      // ============================================================================
      // COLORES - MAPEADOS DESDE NUESTRO THEME CENTRALIZADO
      // ============================================================================
      colors: {
        // Colores de marca del sistema
        brand: {
          DEFAULT: '#FFCC00',
          hover: '#E6B800',
          active: '#CCA300',
          50: '#FFFEF0',
          100: '#FFFCE0',
          200: '#FFF9C2',
          300: '#FFF599',
          400: '#FFEE66',
          500: '#FFCC00', // DEFAULT
          600: '#E6B800',
          700: '#CCA300',
          800: '#B38F00',
          900: '#997A00',
        },
        
        // Escala neutral del theme (mapeada exactamente desde theme.ts)
        neutral: {
          0: '#0A0A0B',     // surfaceLevel0
          50: '#0F1012',
          100: '#14161A',   // surfaceLevel1
          200: '#1B1E24',   // surfaceLevel2
          300: '#23272F',   // surfaceLevel3
          400: '#2C313B',
          500: '#363C48',
          600: '#424959',
          700: '#535B6E',
          800: '#6A7389',
          900: '#8B94AA',   // textMuted
          1000: '#C9CFDB', // textSecondary
          1100: '#E8ECF5',
          1200: '#FFFFFF', // textPrimary
        },

        // Colores semánticos del theme
        success: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
          light: 'rgba(34, 197, 94, 0.1)',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: 'rgba(239, 68, 68, 0.1)',
        },
        info: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          light: 'rgba(56, 189, 248, 0.1)',
        },
        warning: {
          DEFAULT: '#FFCC00',
          hover: '#E6B800',
          light: 'rgba(255, 204, 0, 0.1)',
        },
        
        // ============================================================================
        // TREMOR THEMING - CONFIGURACIÓN COMPLETA CON NUESTROS COLORES
        // ============================================================================
        
        // Tremor Dark Mode (nuestro tema principal)
        tremor: {
          brand: {
            faint: '#0F1012',      // neutral50 - muy sutil
            muted: '#363C48',      // neutral500 - tenue
            subtle: '#6A7389',     // neutral800 - sutil
            DEFAULT: '#FFCC00',    // brand - color principal
            emphasis: '#E6B800',   // brandHover - énfasis
            inverted: '#000000',   // textOnBrand - texto sobre amarillo
          },
          background: {
            muted: '#14161A',      // neutral100 - fondo tenue
            subtle: '#1B1E24',     // neutral200 - fondo sutil
            DEFAULT: '#0A0A0B',    // neutral0 - fondo principal
            emphasis: '#23272F',   // neutral300 - fondo con énfasis
          },
          border: {
            DEFAULT: '#2C313B',    // neutral400 - bordes sutiles
          },
          ring: {
            DEFAULT: '#FFCC00',    // brand - anillos de enfoque
          },
          content: {
            subtle: '#8B94AA',     // neutral900 - texto muy sutil
            DEFAULT: '#C9CFDB',    // neutral1000 - texto normal
            emphasis: '#E8ECF5',   // neutral1100 - texto con énfasis
            strong: '#FFFFFF',     // neutral1200 - texto fuerte
            inverted: '#0A0A0B',   // neutral0 - texto invertido
          },
        },
        
        // Tremor Light Mode (para compatibilidad, aunque usamos dark)
        'light-tremor': {
          brand: {
            faint: '#FFF9C2',
            muted: '#FFEE66',
            subtle: '#FFCC00',
            DEFAULT: '#E6B800',
            emphasis: '#CCA300',
            inverted: '#FFFFFF',
          },
          background: {
            muted: '#F9FAFB',
            subtle: '#F3F4F6',
            DEFAULT: '#FFFFFF',
            emphasis: '#E5E7EB',
          },
          border: {
            DEFAULT: '#E5E7EB',
          },
          ring: {
            DEFAULT: '#E5E7EB',
          },
          content: {
            subtle: '#9CA3AF',
            DEFAULT: '#6B7280',
            emphasis: '#374151',
            strong: '#111827',
            inverted: '#FFFFFF',
          },
        },
      },
      boxShadow: {
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'tremor-small': '0.375rem',
        'tremor-default': '0.5rem',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [forms],
};