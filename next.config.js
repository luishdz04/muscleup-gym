/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-calls',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 🚀 CONFIGURACIÓN ESPECÍFICA PARA VERCEL
  images: {
    unoptimized: true,
    domains: [],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // 📁 CONFIGURACIÓN PARA ARCHIVOS ESTÁTICOS
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',
  trailingSlash: false,
  // 🔧 CONFIGURACIONES ADICIONALES PARA VERCEL
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // 📦 CONFIGURACIÓN DE SALIDA
  output: 'standalone',
};

module.exports = withPWA(nextConfig);