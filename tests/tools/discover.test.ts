// ABOUTME: Tests for the discover tool — TMDB's power-query engine with 30+ filters.
// ABOUTME: Validates Zod schema for movie and TV discovery.

import { describe, it, expect } from "vitest";
import { DiscoverSchema } from "../../src/tools/discover.js";

describe("DiscoverSchema", () => {
  it("accepts minimal discover (media_type only)", () => {
    const result = DiscoverSchema.parse({ media_type: "movie" });
    expect(result.media_type).toBe("movie");
  });

  it("accepts TV discover", () => {
    const result = DiscoverSchema.parse({ media_type: "tv" });
    expect(result.media_type).toBe("tv");
  });

  it("accepts genre filter", () => {
    const result = DiscoverSchema.parse({
      media_type: "movie",
      with_genres: "28,12",
      sort_by: "popularity.desc",
    });
    expect(result.with_genres).toBe("28,12");
  });

  it("accepts vote and date filters", () => {
    const result = DiscoverSchema.parse({
      media_type: "movie",
      vote_average_gte: 7.0,
      primary_release_year: 2024,
    });
    expect(result.vote_average_gte).toBe(7.0);
    expect(result.primary_release_year).toBe(2024);
  });

  it("accepts TV-specific filters", () => {
    const result = DiscoverSchema.parse({
      media_type: "tv",
      with_networks: "213",
      with_status: "0",
      first_air_date_year: 2024,
    });
    expect(result.with_networks).toBe("213");
  });

  it("accepts watch provider filters", () => {
    const result = DiscoverSchema.parse({
      media_type: "movie",
      with_watch_providers: "8",
      watch_region: "US",
    });
    expect(result.with_watch_providers).toBe("8");
  });

  it("rejects missing media_type", () => {
    expect(() => DiscoverSchema.parse({})).toThrow();
  });

  it("rejects invalid media_type", () => {
    expect(() => DiscoverSchema.parse({ media_type: "person" })).toThrow();
  });
});
