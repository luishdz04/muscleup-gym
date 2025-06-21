/** @type {import('next').NextConfig} */
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
}

module.exports = nextConfig
