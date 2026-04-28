const { loadRootEnv } = require("../../packages/config/env.cjs");

loadRootEnv();
applyLocalDefaults();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@chess-platform/ui", "@chess-platform/chess-engine", "@chess-platform/types"]
};

function applyLocalDefaults() {
  const apiPort = process.env.API_PORT ?? "8080";
  const webPort = process.env.WEB_PORT ?? "3000";
  const landingPort = process.env.LANDING_PORT ?? "5000";
  const localApiUrl = `http://localhost:${apiPort}`;

  process.env.API_URL ??= process.env.NEXT_PUBLIC_API_URL ?? localApiUrl;
  process.env.NEXT_PUBLIC_API_URL ??= localApiUrl;
  process.env.NEXT_PUBLIC_WS_URL ??= process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_WEB_URL ??= `http://localhost:${webPort}`;
  process.env.NEXT_PUBLIC_LANDING_URL ??= `http://localhost:${landingPort}`;
}

module.exports = nextConfig;
