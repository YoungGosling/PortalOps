import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9903', // localhost
        'tdms-uat.cmd-systems.com', // Codespaces
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: 'tdms-uat.cmd-systems.com',
      },
    ],
  },
};

export default nextConfig;