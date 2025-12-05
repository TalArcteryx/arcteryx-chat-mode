import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images-dynamic-arcteryx.imgix.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.arcteryx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
    // Increase image quality for better clarity
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
