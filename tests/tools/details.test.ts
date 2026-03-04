// ABOUTME: Tests for movie_details, tv_details, and person_details tools.
// ABOUTME: Validates Zod schemas for all three detail tools.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MovieDetailsSchema,
  TVDetailsSchema,
  PersonDetailsSchema,
  handleMovieDetails,
  handleTVDetails,
  handlePersonDetails,
} from "../../src/tools/details.js";

describe("MovieDetailsSchema", () => {
  it("accepts movie ID", () => {
    const result = MovieDetailsSchema.parse({ movie_id: 550 });
    expect(result.movie_id).toBe(550);
  });

  it("accepts optional append fields", () => {
    const result = MovieDetailsSchema.parse({
      movie_id: 550,
      append: ["credits", "videos", "images"],
    });
    expect(result.append).toEqual(["credits", "videos", "images"]);
  });

  it("rejects missing movie_id", () => {
    expect(() => MovieDetailsSchema.parse({})).toThrow();
  });

  it("rejects non-positive movie_id", () => {
    expect(() => MovieDetailsSchema.parse({ movie_id: 0 })).toThrow();
    expect(() => MovieDetailsSchema.parse({ movie_id: -1 })).toThrow();
  });

  it("rejects invalid append values", () => {
    expect(() =>
      MovieDetailsSchema.parse({ movie_id: 550, append: ["invalid_field"] })
    ).toThrow();
  });

  it("defaults credits_limit to 20", () => {
    const result = MovieDetailsSchema.parse({ movie_id: 550 });
    expect(result.credits_limit).toBe(20);
  });

  it("accepts custom credits_limit", () => {
    const result = MovieDetailsSchema.parse({ movie_id: 550, credits_limit: 5 });
    expect(result.credits_limit).toBe(5);
  });

  it("accepts credits_limit 0 for unlimited", () => {
    const result = MovieDetailsSchema.parse({ movie_id: 550, credits_limit: 0 });
    expect(result.credits_limit).toBe(0);
  });

  it("rejects negative credits_limit", () => {
    expect(() => MovieDetailsSchema.parse({ movie_id: 550, credits_limit: -1 })).toThrow();
  });

  it("accepts optional region", () => {
    const result = MovieDetailsSchema.parse({ movie_id: 550, region: "US" });
    expect(result.region).toBe("US");
  });

  it("rejects region with wrong length", () => {
    expect(() => MovieDetailsSchema.parse({ movie_id: 550, region: "USA" })).toThrow();
  });
});

describe("TVDetailsSchema", () => {
  it("accepts series ID", () => {
    const result = TVDetailsSchema.parse({ series_id: 1396 });
    expect(result.series_id).toBe(1396);
  });

  it("accepts optional append fields", () => {
    const result = TVDetailsSchema.parse({
      series_id: 1396,
      append: ["credits", "videos"],
    });
    expect(result.append).toEqual(["credits", "videos"]);
  });

  it("rejects missing series_id", () => {
    expect(() => TVDetailsSchema.parse({})).toThrow();
  });

  it("defaults credits_limit to 20", () => {
    const result = TVDetailsSchema.parse({ series_id: 1396 });
    expect(result.credits_limit).toBe(20);
  });

  it("accepts custom credits_limit", () => {
    const result = TVDetailsSchema.parse({ series_id: 1396, credits_limit: 5 });
    expect(result.credits_limit).toBe(5);
  });

  it("accepts credits_limit 0 for unlimited", () => {
    const result = TVDetailsSchema.parse({ series_id: 1396, credits_limit: 0 });
    expect(result.credits_limit).toBe(0);
  });

  it("rejects negative credits_limit", () => {
    expect(() => TVDetailsSchema.parse({ series_id: 1396, credits_limit: -1 })).toThrow();
  });

  it("accepts optional region", () => {
    const result = TVDetailsSchema.parse({ series_id: 1396, region: "GB" });
    expect(result.region).toBe("GB");
  });

  it("rejects region with wrong length", () => {
    expect(() => TVDetailsSchema.parse({ series_id: 1396, region: "USA" })).toThrow();
  });
});

describe("PersonDetailsSchema", () => {
  it("accepts person ID", () => {
    const result = PersonDetailsSchema.parse({ person_id: 287 });
    expect(result.person_id).toBe(287);
  });

  it("accepts optional append fields", () => {
    const result = PersonDetailsSchema.parse({
      person_id: 287,
      append: ["combined_credits", "external_ids"],
    });
    expect(result.append).toEqual(["combined_credits", "external_ids"]);
  });

  it("rejects missing person_id", () => {
    expect(() => PersonDetailsSchema.parse({})).toThrow();
  });

  it("defaults credits_limit to 20", () => {
    const result = PersonDetailsSchema.parse({ person_id: 287 });
    expect(result.credits_limit).toBe(20);
  });

  it("accepts custom credits_limit", () => {
    const result = PersonDetailsSchema.parse({ person_id: 287, credits_limit: 5 });
    expect(result.credits_limit).toBe(5);
  });

  it("accepts credits_limit 0 for unlimited", () => {
    const result = PersonDetailsSchema.parse({ person_id: 287, credits_limit: 0 });
    expect(result.credits_limit).toBe(0);
  });

  it("rejects negative credits_limit", () => {
    expect(() => PersonDetailsSchema.parse({ person_id: 287, credits_limit: -1 })).toThrow();
  });
});

describe("handleMovieDetails", () => {
  const mockClient = {
    getMovieDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getMovieDetails with movie_id", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club" });

    const result = await handleMovieDetails({ movie_id: 550 }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(550, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe("Fight Club");
  });

  it("forwards append fields", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club", credits: { cast: [] } });

    await handleMovieDetails({ movie_id: 550, append: ["credits", "videos"] }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(550, ["credits", "videos"]);
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 1 });

    const result = await handleMovieDetails({ movie_id: 1 }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("slices credits to credits_limit", async () => {
    const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
    const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `Crew ${i}` }));
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      credits: { cast, crew },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.credits.cast).toHaveLength(10);
    expect(result.credits.crew).toHaveLength(10);
    expect(result._truncated.credits).toEqual({ total_cast: 50, total_crew: 40 });
  });

  it("does not slice when credits_limit is 0", async () => {
    const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      credits: { cast, crew: [] },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["credits"], credits_limit: 0 }, mockClient as any)
    );

    expect(result.credits.cast).toHaveLength(50);
    expect(result._truncated).toBeUndefined();
  });

  it("does not add _truncated when under limit", async () => {
    const cast = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      credits: { cast, crew: [] },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["credits"] }, mockClient as any)
    );

    expect(result.credits.cast).toHaveLength(5);
    expect(result._truncated).toBeUndefined();
  });

  it("records _truncated per credit key when multiple keys present", async () => {
    const combinedCast = Array.from({ length: 30 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    const combinedCrew = Array.from({ length: 25 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    const movieCast = Array.from({ length: 40 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    const movieCrew = Array.from({ length: 10 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      combined_credits: { cast: combinedCast, crew: combinedCrew },
      movie_credits: { cast: movieCast, crew: movieCrew },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.combined_credits.cast).toHaveLength(10);
    expect(result.combined_credits.crew).toHaveLength(10);
    expect(result.movie_credits.cast).toHaveLength(10);
    expect(result.movie_credits.crew).toHaveLength(10);
    expect(result._truncated.combined_credits).toEqual({ total_cast: 30, total_crew: 25 });
    expect(result._truncated.movie_credits).toEqual({ total_cast: 40, total_crew: 10 });
  });

  it("skips slicing when credits not in append", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club" });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550 }, mockClient as any)
    );

    expect(result._truncated).toBeUndefined();
  });

  it("filters watch/providers to region", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      "watch/providers": { results: { US: { flatrate: [{ provider_name: "Netflix" }] }, GB: { flatrate: [{ provider_name: "Sky" }] } } },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["watch/providers"], region: "US" }, mockClient as any)
    );

    expect(result["watch/providers"].results).toEqual({ US: { flatrate: [{ provider_name: "Netflix" }] } });
  });

  it("normalizes lowercase region to uppercase", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      "watch/providers": { results: { US: { flatrate: [] } } },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["watch/providers"], region: "us" }, mockClient as any)
    );

    expect(result["watch/providers"].results).toEqual({ US: { flatrate: [] } });
  });

  it("returns empty results with note when region not found", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 550, title: "Fight Club",
      "watch/providers": { results: { US: { flatrate: [] } } },
    });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, append: ["watch/providers"], region: "JP" }, mockClient as any)
    );

    expect(result["watch/providers"].results).toEqual({});
    expect(result["watch/providers"]._note).toContain("JP");
  });

  it("does not affect result when watch/providers not appended", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club" });

    const result = JSON.parse(
      await handleMovieDetails({ movie_id: 550, region: "US" }, mockClient as any)
    );

    expect(result["watch/providers"]).toBeUndefined();
  });
});

describe("handleTVDetails", () => {
  const mockClient = {
    getTVDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getTVDetails with series_id", async () => {
    mockClient.getTVDetails.mockResolvedValue({ id: 1396, name: "Breaking Bad" });

    const result = await handleTVDetails({ series_id: 1396 }, mockClient as any);

    expect(mockClient.getTVDetails).toHaveBeenCalledWith(1396, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Breaking Bad");
  });

  it("forwards append fields", async () => {
    mockClient.getTVDetails.mockResolvedValue({ id: 1396, name: "Breaking Bad" });

    await handleTVDetails({ series_id: 1396, append: ["credits", "videos"] }, mockClient as any);

    expect(mockClient.getTVDetails).toHaveBeenCalledWith(1396, ["credits", "videos"]);
  });

  it("filters watch/providers to region", async () => {
    mockClient.getTVDetails.mockResolvedValue({
      id: 1396, name: "Breaking Bad",
      "watch/providers": { results: { US: { flatrate: [{ provider_name: "Netflix" }] }, DE: { flatrate: [] } } },
    });

    const result = JSON.parse(
      await handleTVDetails({ series_id: 1396, append: ["watch/providers"], region: "US" }, mockClient as any)
    );

    expect(result["watch/providers"].results).toEqual({ US: { flatrate: [{ provider_name: "Netflix" }] } });
  });

  it("slices aggregate_credits to credits_limit", async () => {
    const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
    const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `Crew ${i}` }));
    mockClient.getTVDetails.mockResolvedValue({
      id: 1396, name: "Breaking Bad",
      aggregate_credits: { cast, crew },
    });

    const result = JSON.parse(
      await handleTVDetails({ series_id: 1396, append: ["aggregate_credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.aggregate_credits.cast).toHaveLength(10);
    expect(result.aggregate_credits.crew).toHaveLength(10);
    expect(result._truncated.aggregate_credits).toEqual({ total_cast: 50, total_crew: 40 });
  });
});

describe("handlePersonDetails", () => {
  const mockClient = {
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getPersonDetails with person_id", async () => {
    mockClient.getPersonDetails.mockResolvedValue({ id: 5914, name: "Roger Deakins" });

    const result = await handlePersonDetails({ person_id: 5914 }, mockClient as any);

    expect(mockClient.getPersonDetails).toHaveBeenCalledWith(5914, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Roger Deakins");
  });

  it("forwards append fields", async () => {
    mockClient.getPersonDetails.mockResolvedValue({ id: 5914, name: "Roger Deakins" });

    await handlePersonDetails({ person_id: 5914, append: ["combined_credits", "images"] }, mockClient as any);

    expect(mockClient.getPersonDetails).toHaveBeenCalledWith(5914, ["combined_credits", "images"]);
  });

  it("slices combined_credits to credits_limit", async () => {
    const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    mockClient.getPersonDetails.mockResolvedValue({
      id: 5914, name: "Roger Deakins",
      combined_credits: { cast, crew },
    });

    const result = JSON.parse(
      await handlePersonDetails({ person_id: 5914, append: ["combined_credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.combined_credits.cast).toHaveLength(10);
    expect(result.combined_credits.crew).toHaveLength(10);
    expect(result._truncated.combined_credits).toEqual({ total_cast: 50, total_crew: 40 });
  });

  it("slices movie_credits to credits_limit", async () => {
    const cast = Array.from({ length: 30 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    const crew = Array.from({ length: 25 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
    mockClient.getPersonDetails.mockResolvedValue({
      id: 5914, name: "Roger Deakins",
      movie_credits: { cast, crew },
    });

    const result = JSON.parse(
      await handlePersonDetails({ person_id: 5914, append: ["movie_credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.movie_credits.cast).toHaveLength(10);
    expect(result.movie_credits.crew).toHaveLength(10);
    expect(result._truncated.movie_credits).toEqual({ total_cast: 30, total_crew: 25 });
  });

  it("slices tv_credits to credits_limit", async () => {
    const cast = Array.from({ length: 35 }, (_, i) => ({ id: i, title: `Show ${i}` }));
    const crew = Array.from({ length: 20 }, (_, i) => ({ id: i, title: `Show ${i}` }));
    mockClient.getPersonDetails.mockResolvedValue({
      id: 5914, name: "Roger Deakins",
      tv_credits: { cast, crew },
    });

    const result = JSON.parse(
      await handlePersonDetails({ person_id: 5914, append: ["tv_credits"], credits_limit: 10 }, mockClient as any)
    );

    expect(result.tv_credits.cast).toHaveLength(10);
    expect(result.tv_credits.crew).toHaveLength(10);
    expect(result._truncated.tv_credits).toEqual({ total_cast: 35, total_crew: 20 });
  });
});
