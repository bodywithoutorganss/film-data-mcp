// ABOUTME: Vitest configuration for unit and integration tests.
// ABOUTME: Integration tests (live SPARQL) are excluded by default, run with npm run test:integration.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/**/*.integration.test.ts"],
  },
});
