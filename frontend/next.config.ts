import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'files.cdn.printful.com' },
      { protocol: 'https', hostname: 'img.printful.com' },
      { protocol: 'https', hostname: 'i.printful.com' },
    ],
  },
};

export default nextConfig;
