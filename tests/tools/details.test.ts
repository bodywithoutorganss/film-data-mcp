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
});
