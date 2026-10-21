/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Backblaze B2 public bucket / custom domain (S3-compatible object storage)
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      // 🌸 Add your local backend image path rules here:
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.sainakshatracollections.com',
        pathname: '/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig