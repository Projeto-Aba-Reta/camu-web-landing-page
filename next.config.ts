import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Intake da miniatura de pet envia 3–4 fotos (até 8MB cada) via Server Action;
    // o limite padrão de 1MB estoura. Margem extra pro overhead do multipart.
    serverActions: { bodySizeLimit: "36mb" },
  },
  images: {
    // Fotos das peças vêm do Storage público do Supabase (bucket product-media).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
