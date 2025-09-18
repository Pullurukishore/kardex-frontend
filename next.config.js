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
    // Enable server actions
    serverActions: true,
  },
  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Add asset loaders
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });

    // Better error handling for development
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }

    // Handle undefined module errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
    };

    // Add error boundaries for better error handling
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-error-boundary': require.resolve('react-error-boundary'),
      };
    }

    return config;
  },
  // Enable CSS source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  // Enable styled-components support
  compiler: {
    styledComponents: true,
  },
  // Add environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Enable TypeScript checking
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  // Enable ESLint checking
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
