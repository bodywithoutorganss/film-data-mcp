// ABOUTME: Tests for the unified search tool.
// ABOUTME: Validates Zod schema and handler output.

import { describe, it, expect } from "vitest";
import { SearchSchema } from "../../src/tools/search.js";

describe("SearchSchema", () => {
  it("accepts query-only search (defaults to multi)", () => {
    const result = SearchSchema.parse({ query: "inception" });
    expect(result.query).toBe("inception");
    expect(result.type).toBeUndefined();
  });

  it("accepts typed search", () => {
    const result = SearchSchema.parse({ query: "inception", type: "movie" });
    expect(result.type).toBe("movie");
  });

  it("accepts all valid types", () => {
    for (const type of ["movie", "tv", "person", "company"]) {
      expect(() => SearchSchema.parse({ query: "test", type })).not.toThrow();
    }
  });

  it("accepts page parameter", () => {
    const result = SearchSchema.parse({ query: "test", page: 2 });
    expect(result.page).toBe(2);
  });

  it("rejects missing query", () => {
    expect(() => SearchSchema.parse({})).toThrow();
  });

  it("rejects empty query", () => {
    expect(() => SearchSchema.parse({ query: "" })).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() => SearchSchema.parse({ query: "test", type: "invalid" })).toThrow();
  });
});
