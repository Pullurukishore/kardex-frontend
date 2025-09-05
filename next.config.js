/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    // Enable new CSS features
    optimizeCss: true,
  },
  // Improve build performance
  webpack(config) {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
  // Enable CSS source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  // Enable React DevTools in production
  reactDevOverlay: process.env.NODE_ENV !== 'production',
  // Enable styled-components support
  compiler: {
    styledComponents: true,
  },
  // Better error handling
  onRecoverableError: (err) => {
    console.error('Recoverable error:', err);
  },
}

module.exports = nextConfig
