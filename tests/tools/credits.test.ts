// ABOUTME: Tests for get_credits tool with filtering and pagination.
// ABOUTME: Validates schema, department/job filtering, offset/limit, and TV normalization.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CreditsBaseSchema,
  CreditsSchema,
  handleGetCredits,
} from "../../src/tools/credits.js";

// --- Schema tests ---

describe("CreditsBaseSchema", () => {
  it("accepts movie_id", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.movie_id).toBe(550);
  });

  it("accepts series_id", () => {
    const result = CreditsBaseSchema.parse({ series_id: 1396 });
    expect(result.series_id).toBe(1396);
  });

  it("defaults type to all", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.type).toBe("all");
  });

  it("defaults limit to 20", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.limit).toBe(20);
  });

  it("defaults offset to 0", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.offset).toBe(0);
  });

  it("accepts limit 0 for unlimited", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550, limit: 0 });
    expect(result.limit).toBe(0);
  });
});

describe("CreditsSchema (refined)", () => {
  it("rejects when both movie_id and series_id provided", () => {
    expect(() => CreditsSchema.parse({ movie_id: 550, series_id: 1396 })).toThrow();
  });

  it("rejects when neither movie_id nor series_id provided", () => {
    expect(() => CreditsSchema.parse({})).toThrow();
  });

  it("accepts movie_id alone", () => {
    const result = CreditsSchema.parse({ movie_id: 550 });
    expect(result.movie_id).toBe(550);
  });

  it("accepts series_id alone", () => {
    const result = CreditsSchema.parse({ series_id: 1396 });
    expect(result.series_id).toBe(1396);
  });
});

// --- Handler tests ---

describe("handleGetCredits", () => {
  const mockClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const movieCredits = {
    id: 550,
    title: "Fight Club",
    cast: [
      { id: 1, name: "Actor A", character: "Role A", order: 0 },
      { id: 2, name: "Actor B", character: "Role B", order: 1 },
      { id: 3, name: "Actor C", character: "Role C", order: 2 },
    ],
    crew: [
      { id: 10, name: "Director", department: "Directing", job: "Director" },
      { id: 11, name: "DP", department: "Camera", job: "Director of Photography" },
      { id: 12, name: "Producer", department: "Production", job: "Producer" },
      { id: 13, name: "EP", department: "Production", job: "Executive Producer" },
      { id: 14, name: "Writer", department: "Writing", job: "Screenplay" },
    ],
  };

  it("returns cast and crew for movie", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550 }, mockClient as any));

    expect(result.title).toBe("Fight Club");
    expect(result.cast).toHaveLength(3);
    expect(result.crew).toHaveLength(5);
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBe(5);
  });

  it("filters to cast only", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550, type: "cast" }, mockClient as any));

    expect(result.cast).toHaveLength(3);
    expect(result.crew).toBeUndefined();
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBeUndefined();
  });

  it("filters to crew only", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550, type: "crew" }, mockClient as any));

    expect(result.cast).toBeUndefined();
    expect(result.crew).toHaveLength(5);
    expect(result.pagination.total_cast).toBeUndefined();
    expect(result.pagination.total_crew).toBe(5);
  });

  it("filters crew by department (case-insensitive)", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, department: "production" }, mockClient as any)
    );

    expect(result.crew).toHaveLength(2);
    expect(result.crew.map((c: any) => c.name)).toEqual(["Producer", "EP"]);
    expect(result.pagination.total_crew).toBe(2);
  });

  it("filters crew by job (case-insensitive)", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, job: "director of photography" }, mockClient as any)
    );

    expect(result.crew).toHaveLength(1);
    expect(result.crew[0].name).toBe("DP");
  });

  it("applies department filter but still returns all cast", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "all", department: "Camera" }, mockClient as any)
    );

    expect(result.cast).toHaveLength(3);
    expect(result.crew).toHaveLength(1);
  });

  it("paginates with offset and limit", async () => {
    const bigCast = Array.from({ length: 50 }, (_, i) => ({
      id: i, name: `Actor ${i}`, character: `Role ${i}`, order: i,
    }));
    mockClient.getMovieCredits.mockResolvedValue({
      id: 550, cast: bigCast, crew: [],
    });

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "cast", offset: 10, limit: 5 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(5);
    expect(result.cast[0].name).toBe("Actor 10");
    expect(result.cast[4].name).toBe("Actor 14");
    expect(result.pagination.total_cast).toBe(50);
    expect(result.pagination.offset).toBe(10);
    expect(result.pagination.limit).toBe(5);
  });

  it("returns empty arrays when offset exceeds total", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, offset: 100 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(0);
    expect(result.crew).toHaveLength(0);
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBe(5);
  });

  it("returns all entries when limit is 0", async () => {
    const bigCast = Array.from({ length: 100 }, (_, i) => ({
      id: i, name: `Actor ${i}`, character: `Role ${i}`, order: i,
    }));
    mockClient.getMovieCredits.mockResolvedValue({
      id: 550, cast: bigCast, crew: [],
    });

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "cast", limit: 0 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(100);
  });

  it("calls getTVAggregateCredits for series_id", async () => {
    mockClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396, cast: [], crew: [],
    });

    await handleGetCredits({ series_id: 1396 }, mockClient as any);

    expect(mockClient.getTVAggregateCredits).toHaveBeenCalledWith(1396);
    expect(mockClient.getMovieCredits).not.toHaveBeenCalled();
  });

  it("normalizes TV aggregate cast roles to flat structure", async () => {
    mockClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396,
      name: "Breaking Bad",
      cast: [
        {
          id: 17419,
          name: "Bryan Cranston",
          roles: [
            { character: "Walter White", episode_count: 62 },
          ],
          total_episode_count: 62,
          order: 0,
        },
      ],
      crew: [
        {
          id: 66633,
          name: "Vince Gilligan",
          jobs: [
            { job: "Executive Producer", episode_count: 62 },
            { job: "Writer", episode_count: 13 },
          ],
          department: "Production",
          total_episode_count: 62,
        },
      ],
    });

    const result = JSON.parse(await handleGetCredits({ series_id: 1396 }, mockClient as any));

    expect(result.title).toBe("Breaking Bad");
    expect(result.cast[0]).toEqual({
      id: 17419,
      name: "Bryan Cranston",
      character: "Walter White",
      episode_count: 62,
      order: 0,
    });
    expect(result.crew[0]).toEqual({
      id: 66633,
      name: "Vince Gilligan",
      department: "Production",
      job: "Executive Producer, Writer",
      episode_count: 62,
    });
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieCredits.mockResolvedValue({ id: 1, cast: [], crew: [] });

    const result = await handleGetCredits({ movie_id: 1 }, mockClient as any);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
