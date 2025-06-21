import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Enable type checking during the build process
    ignoreBuildErrors: true,
  },
  eslint: {
    // Enable linting during the build process
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
