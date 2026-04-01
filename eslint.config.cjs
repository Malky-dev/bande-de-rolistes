const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: [
      "dist/**",
      ".vite/**",
      "node_modules/**",
      "coverage/**",
      "build/**",
      "**/*.d.ts",
      "README.md",
    ],
  },

  {
    files: ["eslint.config.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  js.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/**"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: process.cwd(),
      },
      globals: globals.browser,
    },
  },

  {
    files: ["src/server/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.server.json"],
        tsconfigRootDir: process.cwd(),
      },
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
    },
  },
);
