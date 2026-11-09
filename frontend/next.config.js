// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS config
const { ffmpegCoreBasePath } = require('./scripts/ffmpeg-core.cjs');

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
  // Next streams metadata into <body> for any UA this doesn't match, and its
  // default list leaves out Googlebot (treated as a JS-running crawler), yet
  // Google honours rel=canonical only in <head>. Matching every UA also lets
  // notFound() in generateMetadata set a real 404 before the shell flushes.
  // Cost: first byte waits for generateMetadata.
  htmlLimitedBots: /.*/,
  // Inlined into the client so FFmpegManager fetches the same versioned path
  // that scripts/copy-ffmpeg-core.mjs stages.
  env: { FFMPEG_CORE_BASE_PATH: ffmpegCoreBasePath },
  async headers() {
    return [
      {
        // ~32 MB per visit otherwise: public/ files default to max-age=0. The
        // version in the path makes the files safe to cache forever.
        source: `${ffmpegCoreBasePath}/:file*`,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
