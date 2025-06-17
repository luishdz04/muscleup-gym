/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Removed deprecated experimental.esmExternals
  // This option is no longer needed in Next.js 15+
}

module.exports = nextConfig
