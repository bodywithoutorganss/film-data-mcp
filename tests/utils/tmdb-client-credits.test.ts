// ABOUTME: Tests that TMDBClient credit methods call the correct TMDB endpoints.
// ABOUTME: Uses mocked fetch to verify URL construction.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";

describe("TMDBClient credit methods", () => {
  const client = new TMDBClient("test-token");
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cast: [], crew: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getMovieCredits calls /movie/{id}/credits", async () => {
    await client.getMovieCredits(496243);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain("/movie/496243/credits");
  });

  it("getTVAggregateCredits calls /tv/{id}/aggregate_credits", async () => {
    await client.getTVAggregateCredits(1396);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain("/tv/1396/aggregate_credits");
  });
});
