const { spawn } = require("node:child_process");
const { createServer } = require("node:net");

function resolvePort(value, fallback, name) {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid TCP port, received: ${value}`);
  }

  return port;
}

function ensurePortAvailable(port, label) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`${label} port ${port} is already in use.`));
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolvePromise());
    });

    server.listen(port);
  });
}

function run(command, args, options) {
  const child = spawn(command, args, {
    stdio: "inherit",
    ...options
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  ensurePortAvailable,
  resolvePort,
  run
};
