import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudinary media
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async rewrites() {
    // Optional: proxy the API through the Next server to avoid CORS in dev.
    // Enable by setting API_PROXY_TARGET; otherwise the client calls the API directly.
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }];
  },
};

export default nextConfig;
