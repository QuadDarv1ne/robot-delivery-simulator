import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Optimization settings
  poweredByHeader: false,
  compress: true,
  
  // Turbopack config (Next.js 16+)
  turbopack: {},
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            name: 'vendors',
          },
          monaco: {
            test: /[\\/]node_modules[\\/]@monaco-editor[\\/]/,
            priority: 10,
            name: 'monaco',
          },
          common: {
            minChunks: 2,
            priority: -20,
            name: 'common',
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
