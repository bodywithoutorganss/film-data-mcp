// ABOUTME: Live API integration tests for TMDB and Wikidata endpoints.
// ABOUTME: Skipped unless TMDB_ACCESS_TOKEN env var is set. Uses real API calls.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";
import { handleGetPersonAwards, handleGetFilmAwards } from "../../src/tools/awards.js";
import { handleGetFestivalPremieres } from "../../src/tools/premieres.js";
import { handleGetCredits } from "../../src/tools/credits.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const LIVE_TIMEOUT = { timeout: 15000 };

describe.skipIf(!TMDB_TOKEN)("live TMDB API", () => {
  // Guarded: TMDBClient constructor throws without a token, but describe.skipIf
  // still evaluates the callback body to register tests.
  const client = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  // Known stable entities
  const PARASITE_ID = 496243;
  const DEAKINS_ID = 151;
  const BREAKING_BAD_ID = 1396;

  it("searches for Parasite and finds it", LIVE_TIMEOUT, async () => {
    const result = await client.searchMulti("Parasite");
    const ids = result.results.map((r: any) => r.id);
    expect(ids).toContain(PARASITE_ID);
  });

  it("gets movie details for Parasite", LIVE_TIMEOUT, async () => {
    const result = await client.getMovieDetails(PARASITE_ID);
    expect(result.title).toBe("Parasite");
    expect(result.imdb_id).toBeTruthy();
  });

  it("gets movie details with append_to_response", LIVE_TIMEOUT, async () => {
    const result = await client.getMovieDetails(PARASITE_ID, ["credits"]);
    expect(result).toHaveProperty("credits");
    expect(result.credits.cast.length).toBeGreaterThan(0);
  });

  it("gets person details for Roger Deakins", LIVE_TIMEOUT, async () => {
    const result = await client.getPersonDetails(DEAKINS_ID);
    expect(result.name).toBe("Roger Deakins");
  });

  it("gets TV details for Breaking Bad", LIVE_TIMEOUT, async () => {
    const result = await client.getTVDetails(BREAKING_BAD_ID);
    expect(result.name).toBe("Breaking Bad");
  });

  it("discovers movies with genre filter", LIVE_TIMEOUT, async () => {
    const result = await client.discoverMovies({ with_genres: "18" });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("gets trending content", LIVE_TIMEOUT, async () => {
    const result = await client.getTrending("movie", "day");
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("gets movie genres including Drama", LIVE_TIMEOUT, async () => {
    const result = await client.getGenres("movie");
    const drama = result.genres.find((g: any) => g.id === 18);
    expect(drama).toBeDefined();
    expect(drama!.name).toBe("Drama");
  });

  it("searches keywords and finds 'masculinity'", LIVE_TIMEOUT, async () => {
    const result = await client.searchKeywords("masculinity");
    expect(result.results.length).toBeGreaterThan(0);
    const names = result.results.map(k => k.name);
    expect(names).toContain("masculinity");
  });

  it("gets Kartemquin Films filmography", LIVE_TIMEOUT, async () => {
    const { handleCompanyFilmography } = await import("../../src/tools/reference.js");
    const result = await handleCompanyFilmography(
      { company_id: 13042, media_type: "movie" }, client
    );
    const parsed = JSON.parse(result);
    expect(parsed.results.length).toBeGreaterThan(0);
    expect(parsed.total_results).toBeGreaterThan(0);
  });

  it("gets festival premieres for Parasite (known Cannes debut)", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: PARASITE_ID }, client));
    expect(result.title).toBe("Parasite");
    expect(result.premieres.length).toBeGreaterThan(0);
    // Parasite premiered at Cannes
    const cannes = result.premieres.find((p: any) => p.note.toLowerCase().includes("cannes"));
    expect(cannes).toBeTruthy();
  });

  it("gets movie credits for Parasite", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetCredits({ movie_id: PARASITE_ID }, client));
    expect(result.cast.length).toBeGreaterThan(0);
    expect(result.crew.length).toBeGreaterThan(0);
    expect(result.pagination.total_cast).toBeGreaterThan(0);
  });

  it("filters credits by department", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetCredits({ movie_id: PARASITE_ID, type: "crew", department: "Directing" }, client)
    );
    expect(result.crew.length).toBeGreaterThan(0);
    for (const c of result.crew) {
      expect(c.department.toLowerCase()).toBe("directing");
    }
  });

  it("gets TV aggregate credits for Breaking Bad", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetCredits({ series_id: BREAKING_BAD_ID }, client));
    expect(result.cast.length).toBeGreaterThan(0);
    expect(result.cast[0]).toHaveProperty("episode_count");
  });
});

describe.skipIf(!TMDB_TOKEN)("live Wikidata SPARQL", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  it("resolves Roger Deakins by TMDB person ID", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId("151");
    expect(entity).not.toBeNull();
    expect(entity!.label).toMatch(/Deakins/i);
  });

  it("resolves Parasite by TMDB movie ID", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId("496243");
    expect(entity).not.toBeNull();
    expect(entity!.label).toMatch(/Parasite/i);
  });

  it("finds awards for Roger Deakins including Oscar wins", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId("151");
    expect(entity).not.toBeNull();
    const wins = await wikidataClient.getPersonWins(entity!.wikidataId);
    // Deakins has won at least one Oscar for cinematography
    expect(wins.length).toBeGreaterThan(0);
    const oscarWin = wins.find((w) => w.label && w.label.match(/cinematography/i));
    expect(oscarWin).toBeDefined();
  });

  it("finds awards for Parasite including Best Picture", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId("496243");
    expect(entity).not.toBeNull();
    const awards = await wikidataClient.getFilmAwards(entity!.wikidataId);
    expect(awards.length).toBeGreaterThan(0);
    const bestPicture = awards.find((a) => a.label && a.label.match(/Best Picture/i));
    expect(bestPicture).toBeDefined();
  });

  it("get_person_awards includes completeness indicator", { timeout: 30000 }, async () => {
    const result = JSON.parse(
      await handleGetPersonAwards({ person_id: 151 }, tmdbClient, wikidataClient)
    );
    expect(result.completeness).toBeDefined();
    expect(result.completeness.entityFound).toBe(true);
    expect(typeof result.completeness.p166ClaimCount).toBe("number");
    expect(result.completeness.registeredAwardCount).toBe(result.wins.length);
  });

  it("get_film_awards includes completeness and crew nominations", { timeout: 30000 }, async () => {
    // Parasite (496243) — well-known film with awards data
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: 496243 }, tmdbClient, wikidataClient)
    );
    expect(result.completeness).toBeDefined();
    expect(result.completeness.entityFound).toBe(true);
    expect(typeof result.completeness.p166ClaimCount).toBe("number");
    expect(Array.isArray(result.crewNominations)).toBe(true);
  });
});
