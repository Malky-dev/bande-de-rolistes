import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
      "tests/unit/node/**",
      "node_modules/**",
    ],

    passWithNoTests: true,

    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/dom.setup.ts"],
    css: false,

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/dom",

      include: ["src/client/**/*.{ts,tsx}", "src/api/**/*.{ts,tsx}"],
      exclude: ["src/server/**", "tests/**", "node_modules/**"],

      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
