const sharedConfig = require("@chess-platform/config/eslint");

module.exports = {
  ...sharedConfig,
  root: true,
  ignorePatterns: ["dist"],
  env: {
    node: true
  }
};
