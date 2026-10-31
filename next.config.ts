import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server (e.g. the PreRenta main site, NEXT_PUBLIC_SITE=platform) needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The workspace is reached through a proxy host; without this, cross-origin
  // dev requests and HMR are blocked and the page never hydrates.
  allowedDevOrigins: ["*.workspace.levion.io"],
};

export default nextConfig;
