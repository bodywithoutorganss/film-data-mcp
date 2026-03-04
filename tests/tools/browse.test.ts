// ABOUTME: Tests for trending and curated_lists tools.
// ABOUTME: Validates Zod schemas for browsing and list tools.

import { describe, it, expect } from "vitest";
import { TrendingSchema, CuratedListsSchema } from "../../src/tools/browse.js";

describe("TrendingSchema", () => {
  it("accepts minimal trending", () => {
    const result = TrendingSchema.parse({ media_type: "movie", time_window: "day" });
    expect(result.media_type).toBe("movie");
    expect(result.time_window).toBe("day");
  });

  it("accepts all media types", () => {
    for (const type of ["all", "movie", "tv", "person"]) {
      expect(() =>
        TrendingSchema.parse({ media_type: type, time_window: "week" })
      ).not.toThrow();
    }
  });

  it("accepts page parameter", () => {
    const result = TrendingSchema.parse({ media_type: "all", time_window: "day", page: 2 });
    expect(result.page).toBe(2);
  });

  it("rejects missing media_type", () => {
    expect(() => TrendingSchema.parse({ time_window: "day" })).toThrow();
  });

  it("rejects invalid time_window", () => {
    expect(() =>
      TrendingSchema.parse({ media_type: "movie", time_window: "month" })
    ).toThrow();
  });
});

describe("CuratedListsSchema", () => {
  it("accepts movie list types", () => {
    for (const type of ["now_playing", "upcoming", "popular", "top_rated"]) {
      expect(() =>
        CuratedListsSchema.parse({ list_type: type, media_type: "movie" })
      ).not.toThrow();
    }
  });

  it("accepts TV list types", () => {
    for (const type of ["airing_today", "popular", "top_rated"]) {
      expect(() =>
        CuratedListsSchema.parse({ list_type: type, media_type: "tv" })
      ).not.toThrow();
    }
  });

  it("accepts page and region", () => {
    const result = CuratedListsSchema.parse({
      list_type: "now_playing",
      media_type: "movie",
      page: 2,
      region: "US",
    });
    expect(result.page).toBe(2);
    expect(result.region).toBe("US");
  });

  it("rejects missing list_type", () => {
    expect(() => CuratedListsSchema.parse({ media_type: "movie" })).toThrow();
  });

  it("rejects missing media_type", () => {
    expect(() => CuratedListsSchema.parse({ list_type: "popular" })).toThrow();
  });

  it("rejects airing_today for movies", () => {
    expect(() =>
      CuratedListsSchema.parse({ list_type: "airing_today", media_type: "movie" })
    ).toThrow();
  });

  it("rejects now_playing for TV", () => {
    expect(() =>
      CuratedListsSchema.parse({ list_type: "now_playing", media_type: "tv" })
    ).toThrow();
  });

  it("rejects upcoming for TV", () => {
    expect(() =>
      CuratedListsSchema.parse({ list_type: "upcoming", media_type: "tv" })
    ).toThrow();
  });
});
