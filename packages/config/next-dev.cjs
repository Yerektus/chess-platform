#!/usr/bin/env node

const { resolve } = require("node:path");
const { loadRootEnv } = require("./env.cjs");
const { ensurePortAvailable, resolvePort, run } = require("./dev-utils.cjs");

const appName = process.argv[2];
const portByApp = {
  landing: ["LANDING_PORT", 5000],
  web: ["WEB_PORT", 3000]
};

async function main() {
  if (!portByApp[appName]) {
    throw new Error("Usage: next-dev.cjs <web|landing>");
  }

  loadRootEnv();

  const [envName, fallbackPort] = portByApp[appName];
  const port = resolvePort(process.env[envName], fallbackPort, envName);
  const appDir = resolve(__dirname, "../../apps", appName);

  process.env[envName] = String(port);

  await ensurePortAvailable(port, appName);

  run("pnpm", ["exec", "next", "dev", "--port", String(port)], {
    cwd: appDir,
    env: process.env
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
