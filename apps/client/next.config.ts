import { createCivicAuthPlugin } from "@civic/auth/nextjs"
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
const withCivicAuth = createCivicAuthPlugin({
  clientId: "3d3f92ca-0c30-41a0-86a3-06d4a8c9d145"
});

// export default nextConfig;
export default withCivicAuth(nextConfig);