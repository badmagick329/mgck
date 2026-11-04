const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? [];
const shouldUseStandaloneOutput = process.env.NEXT_OUTPUT_STANDALONE === '1';

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
  output: shouldUseStandaloneOutput ? 'standalone' : undefined,
  // `pnpm lint` is the lint gate; a build must not fail on style findings
  // (MGK-26) or ship differently depending on whether ESLint is installed.
  eslint: { ignoreDuringBuilds: true },
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
