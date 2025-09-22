// components/providers/ThemeProvider.tsx - VERIFICACIÓN
'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastProvider } from './ToastProvider';
import theme from '@/theme';

interface MUIThemeProviderProps {
  children: React.ReactNode;
}

export default function MUIThemeProvider({ children }: MUIThemeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <ToastProvider />
    </ThemeProvider>
  );
}