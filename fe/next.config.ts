import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: false,
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
