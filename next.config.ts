import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow Node.js modules in server-side builds
      config.externals = [...(config.externals || []), 'imap', 'mailparser'];
    }
    return config;
  },
};

export default nextConfig;
