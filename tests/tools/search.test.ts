// ABOUTME: Tests for the unified search tool.
// ABOUTME: Validates Zod schema and handler output.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchSchema, handleSearch } from "../../src/tools/search.js";

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

describe("handleSearch", () => {
  const mockClient = {
    searchMulti: vi.fn(),
    searchByType: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls searchMulti when no type specified", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [{ id: 1, title: "Test" }], page: 1, total_results: 1 });

    const result = await handleSearch({ query: "test" }, mockClient as any);

    expect(mockClient.searchMulti).toHaveBeenCalledWith("test", undefined);
    expect(mockClient.searchByType).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(1);
  });

  it("calls searchByType when type specified", async () => {
    mockClient.searchByType.mockResolvedValue({ results: [{ id: 550, title: "Fight Club" }], page: 1, total_results: 1 });

    const result = await handleSearch({ query: "fight club", type: "movie" }, mockClient as any);

    expect(mockClient.searchByType).toHaveBeenCalledWith("movie", "fight club", undefined);
    expect(mockClient.searchMulti).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.results[0].id).toBe(550);
  });

  it("forwards page parameter", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [], page: 3, total_results: 100 });

    await handleSearch({ query: "test", page: 3 }, mockClient as any);

    expect(mockClient.searchMulti).toHaveBeenCalledWith("test", 3);
  });

  it("returns valid JSON string", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [] });

    const result = await handleSearch({ query: "test" }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("rejects invalid args via Zod", async () => {
    await expect(handleSearch({ query: "" }, mockClient as any)).rejects.toThrow();
  });
});
