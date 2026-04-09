import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.20.213", "10.10.10.226", "192.168.20.151", "192.168.20.152"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", // Allow all Supabase projects
      },
    ],
  },
};

export default nextConfig;
