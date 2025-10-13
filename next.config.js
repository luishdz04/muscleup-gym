/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  // Reducir el tamaño de los archivos de workbox para evitar warnings de webpack
  maximumFileSizeToCacheInBytes: 3000000, // 3MB
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
  
  // 🔇 SUPRIMIR WARNINGS DE WEBPACK (OPCIONAL)
  webpack: (config, { isServer }) => {
    // Reducir nivel de logs solo para warnings de caché
    if (!isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);