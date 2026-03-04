// ABOUTME: Tests for trending and curated_lists tools.
// ABOUTME: Validates Zod schemas for browsing and list tools.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TrendingSchema,
  CuratedListsSchema,
  handleTrending,
  handleCuratedLists,
} from "../../src/tools/browse.js";

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

describe("handleTrending", () => {
  const mockClient = {
    getTrending: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getTrending with all params", async () => {
    mockClient.getTrending.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleTrending(
      { media_type: "movie", time_window: "week" },
      mockClient as any
    );

    expect(mockClient.getTrending).toHaveBeenCalledWith("movie", "week", undefined);
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(1);
  });

  it("forwards page parameter", async () => {
    mockClient.getTrending.mockResolvedValue({ results: [] });

    await handleTrending(
      { media_type: "all", time_window: "day", page: 2 },
      mockClient as any
    );

    expect(mockClient.getTrending).toHaveBeenCalledWith("all", "day", 2);
  });
});

describe("handleCuratedLists", () => {
  const mockClient = {
    getNowPlaying: vi.fn(),
    getUpcoming: vi.fn(),
    getPopular: vi.fn(),
    getTopRated: vi.fn(),
    getAiringToday: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("routes now_playing to getNowPlaying", async () => {
    mockClient.getNowPlaying.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "now_playing", media_type: "movie" },
      mockClient as any
    );

    expect(mockClient.getNowPlaying).toHaveBeenCalledWith(undefined, undefined);
  });

  it("routes upcoming to getUpcoming with region", async () => {
    mockClient.getUpcoming.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "upcoming", media_type: "movie", region: "US" },
      mockClient as any
    );

    expect(mockClient.getUpcoming).toHaveBeenCalledWith(undefined, "US");
  });

  it("routes popular to getPopular with media_type", async () => {
    mockClient.getPopular.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "popular", media_type: "tv" },
      mockClient as any
    );

    expect(mockClient.getPopular).toHaveBeenCalledWith("tv", undefined);
  });

  it("routes top_rated to getTopRated", async () => {
    mockClient.getTopRated.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "top_rated", media_type: "movie" },
      mockClient as any
    );

    expect(mockClient.getTopRated).toHaveBeenCalledWith("movie", undefined);
  });

  it("routes airing_today to getAiringToday", async () => {
    mockClient.getAiringToday.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "airing_today", media_type: "tv" },
      mockClient as any
    );

    expect(mockClient.getAiringToday).toHaveBeenCalledWith(undefined);
  });

  it("forwards page to getNowPlaying", async () => {
    mockClient.getNowPlaying.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "now_playing", media_type: "movie", page: 3 },
      mockClient as any
    );

    expect(mockClient.getNowPlaying).toHaveBeenCalledWith(3, undefined);
  });

  it("returns valid JSON string", async () => {
    mockClient.getPopular.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleCuratedLists(
      { list_type: "popular", media_type: "movie" },
      mockClient as any
    );

    expect(() => JSON.parse(result)).not.toThrow();
  });
});
