/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'assets.pjstore.com',
      },
      {
        protocol: 'https',
        hostname: 'parnika-jewellers-v0-*.s3.*.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
