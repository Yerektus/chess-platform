const sharedConfig = require("@chess-platform/config/eslint");
const nextAppExtends = sharedConfig.extends.filter((entry) => entry !== "plugin:react-hooks/recommended");

module.exports = {
  ...sharedConfig,
  root: true,
  plugins: sharedConfig.plugins.filter((plugin) => plugin !== "react-hooks"),
  extends: [...nextAppExtends, "next/core-web-vitals"]
};
