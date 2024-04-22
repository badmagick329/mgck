/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  output: 'standalone',
};

module.exports = nextConfig;
