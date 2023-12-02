/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/gfysv2",
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
