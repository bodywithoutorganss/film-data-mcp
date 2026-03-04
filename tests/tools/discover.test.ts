// ABOUTME: Tests for the discover tool — TMDB's power-query engine with 30+ filters.
// ABOUTME: Validates Zod schema for movie and TV discovery.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscoverSchema, handleDiscover } from "../../src/tools/discover.js";

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

describe("handleDiscover", () => {
  const mockClient = {
    discoverMovies: vi.fn(),
    discoverTV: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls discoverMovies for movie media_type", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [], page: 1, total_results: 0 });

    await handleDiscover({ media_type: "movie" }, mockClient as any);

    expect(mockClient.discoverMovies).toHaveBeenCalled();
    expect(mockClient.discoverTV).not.toHaveBeenCalled();
  });

  it("calls discoverTV for tv media_type", async () => {
    mockClient.discoverTV.mockResolvedValue({ results: [], page: 1, total_results: 0 });

    await handleDiscover({ media_type: "tv" }, mockClient as any);

    expect(mockClient.discoverTV).toHaveBeenCalled();
    expect(mockClient.discoverMovies).not.toHaveBeenCalled();
  });

  it("converts underscore params to TMDB dot notation via PARAM_MAP", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "movie",
      primary_release_date_gte: "2020-01-01",
      primary_release_date_lte: "2020-12-31",
      vote_average_gte: 7.0,
      vote_count_gte: 100,
    }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    expect(passedFilters["primary_release_date.gte"]).toBe("2020-01-01");
    expect(passedFilters["primary_release_date.lte"]).toBe("2020-12-31");
    expect(passedFilters["vote_average.gte"]).toBe(7.0);
    expect(passedFilters["vote_count.gte"]).toBe(100);
    // Verify the underscore keys are NOT present
    expect(passedFilters["primary_release_date_gte"]).toBeUndefined();
  });

  it("passes non-mapped keys through unchanged", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "movie",
      sort_by: "popularity.desc",
      with_genres: "28,12",
    }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    expect(passedFilters["sort_by"]).toBe("popularity.desc");
    expect(passedFilters["with_genres"]).toBe("28,12");
  });

  it("omits undefined values from filter object", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({ media_type: "movie", page: 2 }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    // Only page should be present; media_type is stripped, other optional fields are undefined
    expect(passedFilters).toEqual({ page: 2 });
  });

  it("converts TV-specific date params", async () => {
    mockClient.discoverTV.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "tv",
      first_air_date_gte: "2023-01-01",
      first_air_date_lte: "2023-12-31",
    }, mockClient as any);

    const passedFilters = mockClient.discoverTV.mock.calls[0][0];
    expect(passedFilters["first_air_date.gte"]).toBe("2023-01-01");
    expect(passedFilters["first_air_date.lte"]).toBe("2023-12-31");
  });

  it("returns valid JSON string", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleDiscover({ media_type: "movie" }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });
});
