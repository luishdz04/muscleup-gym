// app/layout.tsx

import './globals.css';
import Navbar from '@/components/Navbar';
// Footer eliminado del layout global - se agrega en páginas públicas específicas
import MUIThemeProvider from '@/components/providers/ThemeProvider';
import NotificationProvider from '@/providers/NotificationProvider';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Muscle Up GYM',
  description: 'Plataforma integral de Muscle Up GYM para clientes y administración',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Muscle Up GYM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffcc00',
  viewportFit: 'cover',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Muscle Up GYM" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Google Maps API */}
        <script
          async
          defer
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=es&region=MX`}
        />
      </head>
      <body className="relative flex flex-col min-h-screen bg-black text-white">
        <MUIThemeProvider>
          <NotificationProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            {/* Footer eliminado - se agrega individualmente en páginas públicas */}
          </NotificationProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}