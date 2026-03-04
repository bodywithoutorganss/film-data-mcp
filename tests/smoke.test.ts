// ABOUTME: Smoke test to verify the test infrastructure works.
// ABOUTME: Remove this file once real tests exist.

import { describe, it, expect } from "vitest";

describe("test infrastructure", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
