/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output para Vercel: reduce el bundle y mejora cold start.
  output: "standalone",
  // Transpile de packages del monorepo
  transpilePackages: ["@conectavet/api", "@conectavet/db"],
  // Imágenes remotas permitidas (Cloudinary + avatares externos)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
        ],
      },
    ];
  },
  // Excluir Prisma engine binaries del bundle (Vercel provee los suyos)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }
    return config;
  },
  experimental: {
    // Server actions habilitadas (Next 15)
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;