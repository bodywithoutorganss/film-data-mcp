// ABOUTME: Tests for movie_details, tv_details, and person_details tools.
// ABOUTME: Validates Zod schemas for all three detail tools.

import { describe, it, expect } from "vitest";
import {
  MovieDetailsSchema,
  TVDetailsSchema,
  PersonDetailsSchema,
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
