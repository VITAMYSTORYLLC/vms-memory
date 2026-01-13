/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This allows the app to work on a phone without a server
  images: {
    unoptimized: true, // This is required for mobile apps
  },
}

module.exports = nextConfig