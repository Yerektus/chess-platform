const sharedConfig = require("@chess-platform/config/eslint");

module.exports = {
  ...sharedConfig,
  root: true,
  env: {
    node: true
  }
};
