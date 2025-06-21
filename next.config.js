/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 🚀 CONFIGURACIÓN PARA IMÁGENES EN VERCEL
  images: {
    unoptimized: true,
    domains: [], // Agregar dominios externos si usas imágenes externas
  },
  // 📁 CONFIGURACIÓN PARA ARCHIVOS ESTÁTICOS
  assetPrefix: '',
  // 🔧 CONFIGURACIÓN ADICIONAL PARA VERCEL
  trailingSlash: false,
  // ✅ Removed deprecated experimental.esmExternals
  // This option is no longer needed in Next.js 15+
}

module.exports = nextConfig