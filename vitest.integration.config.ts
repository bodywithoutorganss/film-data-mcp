// ABOUTME: Vitest configuration for integration tests that hit live external APIs.
// ABOUTME: Runs tests matching *.integration.test.ts against Wikidata SPARQL endpoint.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.integration.test.ts"],
    testTimeout: 30000,
  },
});
