/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* calls to the Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
