import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Lyken project at the repo root has its own lockfile; pin the workspace
  // root so Next does not infer it and mis-resolve modules.
  turbopack: { root: __dirname },
};

export default nextConfig;
