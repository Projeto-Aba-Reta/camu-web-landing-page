import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos das peças vêm do Storage público do Supabase (bucket product-media).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
