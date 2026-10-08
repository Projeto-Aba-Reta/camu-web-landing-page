import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // /empresas aponta para uma URL externa configurada no env (lida no build/start).
    const empresasUrl = process.env.EMPRESAS_REDIRECT_URL;
    if (!empresasUrl) return [];
    return [
      {
        source: "/empresas",
        destination: empresasUrl,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
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
