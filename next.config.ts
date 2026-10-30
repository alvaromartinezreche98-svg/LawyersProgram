import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The workspace is reached through a proxy host; without this, cross-origin
  // dev requests and HMR are blocked and the page never hydrates.
  allowedDevOrigins: ["*.workspace.levion.io"],
};

export default nextConfig;
