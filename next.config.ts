import type { NextConfig } from "next";

// Auto-detect the right base path when building on GitHub Actions:
// - project page (username.github.io/repo-name) -> basePath = "/repo-name"
// - user/org page (a repo literally named username.github.io) -> no basePath
// Building locally (npm run build) never sets GITHUB_ACTIONS, so basePath
// stays empty and `npm run dev`/local previews are unaffected.
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPage = repoName?.endsWith(".github.io");
const basePath = process.env.GITHUB_ACTIONS && repoName && !isUserOrOrgPage ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  env: {
    // Exposed to client code (see src/lib/sprites.ts) so hardcoded
    // root-relative paths to our own /public files still resolve under a
    // subpath deployment.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;