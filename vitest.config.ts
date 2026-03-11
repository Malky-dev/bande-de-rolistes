import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./vitest.config.dom.ts", "./vitest.config.node.ts"],
  },
});
