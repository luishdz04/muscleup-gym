// components/providers/ThemeProvider.tsx - CON useHydrated PARA EVITAR ERRORES DE HIDRATACIÓN
'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastProvider } from './ToastProvider';
import theme from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';

interface MUIThemeProviderProps {
  children: React.ReactNode;
}

export default function MUIThemeProvider({ children }: MUIThemeProviderProps) {
  const hydrated = useHydrated();

  return (
    <ThemeProvider theme={theme}>
      {/* Solo renderizar CssBaseline después de la hidratación para evitar errores */}
      {hydrated && <CssBaseline />}
      {children}
      {hydrated && <ToastProvider />}
    </ThemeProvider>
  );
}