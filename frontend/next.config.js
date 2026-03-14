/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'files.heygen.ai' },
      { protocol: 'https', hostname: '*.heygen.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
};

module.exports = nextConfig;
