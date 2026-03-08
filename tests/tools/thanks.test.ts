// ABOUTME: Tests for get_thanks_credits tool.
// ABOUTME: Validates schema modes (forward, reverse, batch), handler logic, and aggregation.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThanksCreditsBaseSchema, ThanksCreditsSchema, handleGetThanksCredits } from "../../src/tools/thanks.js";

describe("ThanksCreditsSchema", () => {
  it("rejects invalid mode", () => {
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "invalid" })).toThrow();
  });

  it("rejects non-positive IDs", () => {
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "forward", movie_id: -1 })).toThrow();
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "reverse", person_id: 0 })).toThrow();
  });

  it("accepts forward mode with movie_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "forward", movie_id: 550 });
    expect(result.mode).toBe("forward");
    expect(result.movie_id).toBe(550);
  });

  it("accepts forward mode with series_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "forward", series_id: 1396 });
    expect(result.mode).toBe("forward");
    expect(result.series_id).toBe(1396);
  });

  it("rejects forward mode with both movie_id and series_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "forward", movie_id: 550, series_id: 1396 })).toThrow();
  });

  it("rejects forward mode without movie_id or series_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "forward" })).toThrow();
  });

  it("accepts reverse mode with person_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "reverse", person_id: 287 });
    expect(result.mode).toBe("reverse");
    expect(result.person_id).toBe(287);
  });

  it("rejects reverse mode without person_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "reverse" })).toThrow();
  });

  it("accepts batch mode with movie_ids", () => {
    const result = ThanksCreditsSchema.parse({ mode: "batch", movie_ids: [550, 680] });
    expect(result.mode).toBe("batch");
    expect(result.movie_ids).toEqual([550, 680]);
  });

  it("rejects batch mode without movie_ids", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "batch" })).toThrow();
  });

  it("rejects batch mode with empty movie_ids", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "batch", movie_ids: [] })).toThrow();
  });
});

describe("handleGetThanksCredits — forward mode", () => {
  const mockTmdbClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns Thanks crew from movie credits", async () => {
    // TMDB credits endpoint returns { id, cast, crew } — no title field
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      crew: [
        { id: 1, name: "Alice", department: "Crew", job: "Special Thanks" },
        { id: 2, name: "Bob", department: "Crew", job: "Thanks" },
        { id: 3, name: "Carol", department: "Directing", job: "Director" },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.movie_id).toBe(550);
    expect(result.thanks).toHaveLength(2);
    expect(result.thanks[0].name).toBe("Alice");
    expect(result.thanks[0].job).toBe("Special Thanks");
    expect(result.thanks[1].name).toBe("Bob");
  });

  it("returns empty thanks array when no Thanks job entries", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      crew: [{ id: 3, name: "Carol", department: "Directing", job: "Director" }],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.thanks).toHaveLength(0);
  });

  it("handles TV series via aggregate credits", async () => {
    mockTmdbClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396,
      crew: [
        { id: 10, name: "Dave", department: "Crew", jobs: [{ job: "Special Thanks" }], total_episode_count: 62 },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", series_id: 1396 }, mockTmdbClient as any)
    );

    expect(result.series_id).toBe(1396);
    expect(result.thanks).toHaveLength(1);
    expect(result.thanks[0].episode_count).toBe(62);
  });

  it("filters case-insensitively for Thanks job title", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      crew: [
        { id: 1, name: "Alice", department: "Crew", job: "Thanks" },
        { id: 2, name: "Bob", department: "Crew", job: "SPECIAL THANKS" },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.thanks).toHaveLength(2);
  });
});
