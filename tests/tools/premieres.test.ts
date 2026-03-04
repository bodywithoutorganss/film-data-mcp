// ABOUTME: Tests for get_festival_premieres tool.
// ABOUTME: Validates schema, premiere filtering, sorting, and edge cases.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PremieresSchema,
  handleGetFestivalPremieres,
} from "../../src/tools/premieres.js";

describe("PremieresSchema", () => {
  it("accepts movie_id", () => {
    const result = PremieresSchema.parse({ movie_id: 496243 });
    expect(result.movie_id).toBe(496243);
  });

  it("rejects missing movie_id", () => {
    expect(() => PremieresSchema.parse({})).toThrow();
  });

  it("rejects non-positive movie_id", () => {
    expect(() => PremieresSchema.parse({ movie_id: 0 })).toThrow();
    expect(() => PremieresSchema.parse({ movie_id: -1 })).toThrow();
  });
});

describe("handleGetFestivalPremieres", () => {
  const mockClient = {
    getMovieDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("filters to only type 1 (Premiere) entries", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 496243,
      title: "Parasite",
      release_dates: {
        results: [
          {
            iso_3166_1: "FR",
            release_dates: [
              { type: 1, release_date: "2019-05-21T00:00:00.000Z", note: "Cannes Film Festival", certification: "" },
              { type: 3, release_date: "2019-06-05T00:00:00.000Z", note: "", certification: "" },
            ],
          },
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 2, release_date: "2019-10-05T00:00:00.000Z", note: "New York Film Festival", certification: "" },
              { type: 3, release_date: "2019-10-11T00:00:00.000Z", note: "", certification: "R" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 496243 }, mockClient as any));

    expect(result.premieres).toHaveLength(1);
    expect(result.premieres[0].country).toBe("FR");
    expect(result.premieres[0].note).toBe("Cannes Film Festival");
    expect(result.total).toBe(1);
  });

  it("sorts premieres chronologically", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 100,
      title: "Test Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 1, release_date: "2020-09-01T00:00:00.000Z", note: "Telluride", certification: "" },
            ],
          },
          {
            iso_3166_1: "IT",
            release_dates: [
              { type: 1, release_date: "2020-08-01T00:00:00.000Z", note: "Venice", certification: "" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 100 }, mockClient as any));

    expect(result.premieres[0].note).toBe("Venice");
    expect(result.premieres[1].note).toBe("Telluride");
  });

  it("returns empty premieres when no type 1 entries exist", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 200,
      title: "No Premieres Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 3, release_date: "2020-01-01T00:00:00.000Z", note: "", certification: "PG-13" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 200 }, mockClient as any));

    expect(result.premieres).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("handles missing note field", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 300,
      title: "Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "KR",
            release_dates: [
              { type: 1, release_date: "2019-05-30T00:00:00.000Z", certification: "15" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 300 }, mockClient as any));

    expect(result.premieres[0].note).toBe("");
    expect(result.premieres[0].certification).toBe("15");
  });

  it("calls getMovieDetails with release_dates append", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 1,
      title: "T",
      release_dates: { results: [] },
    });

    await handleGetFestivalPremieres({ movie_id: 1 }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(1, ["release_dates"]);
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 1,
      title: "T",
      release_dates: { results: [] },
    });

    const result = await handleGetFestivalPremieres({ movie_id: 1 }, mockClient as any);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
