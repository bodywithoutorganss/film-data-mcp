// ABOUTME: Vitest configuration for integration tests that hit live external APIs.
// ABOUTME: Runs tests matching *.integration.test.ts against TMDB, Wikidata, and OMDb.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.integration.test.ts"],
    testTimeout: 30000,
  },
});
