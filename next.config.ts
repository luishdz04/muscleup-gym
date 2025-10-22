import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para Electron, necesitamos modo servidor (no export estático)
  // porque usamos autenticación, middleware y API routes

  // Desactivar optimización de imágenes para mejor rendimiento en Electron
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
