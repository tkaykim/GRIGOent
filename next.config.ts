import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 성능 최적화 설정
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
};

export default nextConfig;
