import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['everyday-ardently-staining.ngrok-free.dev', 'localhost:3000'],
  /* config options here */
  async headers() {
    return [
      {
        source: '/meetings/room',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      }, {
        source: '/zoom-frame.html',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      '@zoom/download-manager': './src/utils/zoom-mock.js',
    },
  },
  webpack: (config) => {
    config.resolve.ias = {
      ...config.resolve.alias,
      '@zoom/download-manager': path.resolve(__dirname, './src/utils/zoom-mock.js'),
    };
    return config;
  },
};

export default nextConfig;
