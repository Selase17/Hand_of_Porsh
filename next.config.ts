import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal .next/standalone server with only the deps each
  // route actually needs — what the Dockerfile copies into the runtime image.
  output: "standalone",
};

export default nextConfig;
