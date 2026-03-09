import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{js,jsx}",
    ],
    exclude: [
      "tests/helpers/**",
      "tests/setup/**",
      "tests/unit/dom/**",
      "node_modules/**",
    ],

    setupFiles: [path.resolve(__dirname, "tests/setup/node.setup.ts")],
    environment: "node",
    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/node",

      include: ["src/server/**/*.{ts,tsx}"],
      exclude: ["tests/**", "node_modules/**"],

      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
