// ABOUTME: Integration tests for get_thanks_credits against live TMDB API.
// ABOUTME: Verifies forward, reverse, and batch modes with research-confirmed data.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { handleGetThanksCredits } from "../../src/tools/thanks.js";

const token = process.env.TMDB_ACCESS_TOKEN;
if (!token) throw new Error("TMDB_ACCESS_TOKEN required for integration tests");

const client = new TMDBClient(token);

describe("get_thanks_credits integration", () => {
  it("forward mode returns thanks credits for Pulp Fiction", { timeout: 30000 }, async () => {
    // Pulp Fiction (680): 11 Thanks credits confirmed by research
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 680 }, client)
    );

    expect(result.movie_id).toBe(680);
    expect(result.thanks.length).toBeGreaterThan(0);
    expect(result.thanks[0]).toHaveProperty("name");
    expect(result.thanks[0]).toHaveProperty("job");
  });

  it("forward mode returns empty thanks for film without them", { timeout: 30000 }, async () => {
    // Star Wars (11): 0 Thanks credits confirmed by research
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 11 }, client)
    );

    expect(result.movie_id).toBe(11);
    expect(result.thanks).toHaveLength(0);
  });

  it("reverse mode returns films Jim Starlin is thanked in", { timeout: 30000 }, async () => {
    // Jim Starlin (1713975): 4 Thanks credits confirmed by research
    // (Infinity War, Endgame, Legends of Tomorrow, What If...?)
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "reverse", person_id: 1713975 }, client)
    );

    expect(result.person.id).toBe(1713975);
    expect(result.person.name).toBe("Jim Starlin");
    expect(result.thanked_in.length).toBeGreaterThan(0);
    expect(Array.isArray(result.formal_roles)).toBe(true);
  });

  it("batch mode aggregates thanks across Pulp Fiction and Endgame", { timeout: 30000 }, async () => {
    // Pulp Fiction (680, 11 thanks) + Endgame (299534, 5 thanks)
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "batch", movie_ids: [680, 299534] }, client)
    );

    expect(result.films).toHaveLength(2);
    expect(result.frequency_map.length).toBeGreaterThan(0);
    // Each frequency entry should have required fields
    const first = result.frequency_map[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("count");
    expect(first).toHaveProperty("films");
  });
});
