// ABOUTME: Tests for get_thanks_credits tool.
// ABOUTME: Validates schema modes (forward, reverse, batch), handler logic, and aggregation.

import { describe, it, expect } from "vitest";
import { ThanksCreditsBaseSchema, ThanksCreditsSchema } from "../../src/tools/thanks.js";

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
