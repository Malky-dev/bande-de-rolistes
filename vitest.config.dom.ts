import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "./vitest.config";

const staticViewsExcludedFromCoverage = [
  "src/client/views/AboutView.tsx",
  "src/client/views/LocationView.tsx",
  "src/client/views/WhatIsRpgView.tsx",
  "src/client/views/RuleView.tsx",
];

const temporaryDomCoverageExclude = [
  "src/client/components/AdminPanel.tsx",
  "src/client/components/QuotesPanel.tsx",
  "src/client/views/AccountView.tsx",
  "src/client/views/RpgTablesView.tsx",
  "src/client/views/rpg/RpgTableForm.tsx",
  "src/client/views/rpg/UpsertRpgTableView.tsx",
];

const domCoverageExclude = [
  "src/server/**",
  "tests/**",
  "node_modules/**",
  ...temporaryDomCoverageExclude,
  ...staticViewsExcludedFromCoverage,
];

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    test: {
      name: "dom",
      environment: "jsdom",
      globals: true,
      passWithNoTests: true,
      setupFiles: ["./tests/setup/dom.setup.ts"],
      css: false,
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
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        reportsDirectory: "./coverage/dom",
        include: ["src/client/**/*.{ts,tsx}"],
        exclude: domCoverageExclude,
        thresholds: {
          lines: 95,
          functions: 95,
          branches: 95,
          statements: 95,
        },
      },
    },
  }),
);
