import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    name: "node",
    environment: "node",
    globals: true,
    setupFiles: [path.resolve(__dirname, "tests/setup/node.setup.ts")],
    include: [
      "tests/unit/node/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/node/**/*.{test,spec}.{js,jsx}",
    ],
    exclude: [
      "tests/helpers/**",
      "tests/setup/**",
      "tests/unit/dom/**",
      "node_modules/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/node",
      include: ["src/server/**/*.{ts,tsx}"],
      exclude: [
        "tests/**",
        "node_modules/**",
        "src/server/constants.ts",
        "src/server/middleware/index.ts",
        "src/server/middleware/auth/types.ts",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
});
