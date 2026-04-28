const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

function loadRootEnv() {
  const envPath = resolve(__dirname, "../../.env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = normalizeEnvValue(trimmedLine.slice(separatorIndex + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function normalizeEnvValue(value) {
  const quote = value[0];

  if ((quote === "\"" || quote === "'") && value[value.length - 1] === quote) {
    return value.slice(1, -1);
  }

  return value;
}

module.exports = {
  loadRootEnv
};
