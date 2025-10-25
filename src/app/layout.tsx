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
        {/* Google Maps Dark Mode Styles */}
        <style>{`
          .pac-container {
            background-color: #27272a !important;
            border: 2px solid #ffcc00 !important;
            border-radius: 0.5rem !important;
            margin-top: 4px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
          }
          .pac-item {
            background-color: #27272a !important;
            color: #e4e4e7 !important;
            border-top: 1px solid #3f3f46 !important;
            padding: 12px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          .pac-item:hover {
            background-color: #3f3f46 !important;
          }
          .pac-item-selected,
          .pac-item:active {
            background-color: #ffcc00 !important;
            color: #000 !important;
          }
          .pac-item-query {
            color: #ffcc00 !important;
            font-weight: 600 !important;
          }
          .pac-matched {
            color: #fef08a !important;
            font-weight: 700 !important;
          }
          .pac-icon {
            display: none !important;
          }
          .pac-item:first-child {
            border-top: none !important;
          }
          .hdpi.pac-logo:after {
            background-image: none !important;
          }

          /* Date Picker Dark Mode Styles */
          input[type="date"] {
            color-scheme: dark;
            background-color: #27272a;
            color: #e4e4e7;
            border: 2px solid #3f3f46;
            padding: 10px;
            border-radius: 0.5rem;
            font-size: 14px;
          }
          input[type="date"]:focus {
            outline: none;
            border-color: #ffcc00;
            box-shadow: 0 0 0 3px rgba(255, 204, 0, 0.1);
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
          }
          input[type="date"]::-webkit-datetime-edit-text,
          input[type="date"]::-webkit-datetime-edit-month-field,
          input[type="date"]::-webkit-datetime-edit-day-field,
          input[type="date"]::-webkit-datetime-edit-year-field {
            color: #e4e4e7;
          }
        `}</style>
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