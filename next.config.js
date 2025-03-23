/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Remove the deprecated option
    // serverComponentsExternalPackages: ['sharp', 'canvas'],
  },
  // Use the new location for external packages
  serverExternalPackages: ['sharp', 'canvas'],
}

module.exports = {
  ...nextConfig,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
} 