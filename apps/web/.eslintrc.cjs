const sharedConfig = require("@chess-platform/config/eslint");

module.exports = {
  ...sharedConfig,
  root: true,
  extends: [...sharedConfig.extends, "next/core-web-vitals"]
};
