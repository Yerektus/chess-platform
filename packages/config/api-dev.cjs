#!/usr/bin/env node

const { resolve } = require("node:path");
const { loadRootEnv } = require("./env.cjs");
const { ensurePortAvailable, resolvePort, run } = require("./dev-utils.cjs");

async function main() {
  loadRootEnv();

  const port = resolvePort(process.env.API_PORT ?? process.env.PORT, 8080, "API_PORT");
  const appDir = resolve(__dirname, "../../apps/api");

  process.env.API_PORT = String(port);
  process.env.PORT ??= String(port);

  await ensurePortAvailable(port, "API");

  run("pnpm", ["exec", "nest", "start", "--watch"], {
    cwd: appDir,
    env: process.env
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
