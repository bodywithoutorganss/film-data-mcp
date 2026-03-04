// ABOUTME: Vitest configuration for unit tests.
// ABOUTME: Integration tests (live SPARQL) are excluded; run with npm run test:integration.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/**/*.integration.test.ts"],
  },
});
