import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next from treating the monorepo root as the app root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
