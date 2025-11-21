const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  output: 'standalone',
  allowedDevOrigins,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://analytics.mgck.ink',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/js/script.js',
        destination: 'https://analytics.mgck.ink/js/script.js',
      },
      {
        source: '/ingest/api/event',
        destination: 'https://analytics.mgck.ink/api/event',
      },
    ];
  },
};

module.exports = nextConfig;
