import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: false,
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer-when-downgrade",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.codelaicuocdoi.io.vn";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

