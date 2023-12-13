/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/gfys",
  images: {
    remotePatterns: [
      {
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
