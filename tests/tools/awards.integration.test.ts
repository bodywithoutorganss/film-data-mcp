// ABOUTME: Live API integration tests for awards tools.
// ABOUTME: Hits real TMDB and Wikidata APIs — run with vitest.integration.config.ts.

import { describe, it, expect } from "vitest";
import { handleGetFilmAwards } from "../../src/tools/awards.js";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const SKIP = !TMDB_TOKEN;

describe.skipIf(SKIP)("get_film_awards integration", () => {
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);
  const wikidataClient = new WikidataClient();

  it("resolves Diane Quon via name search for Minding the Gap", { timeout: 30000 }, async () => {
    const result = await handleGetFilmAwards(
      { movie_id: 489985 },
      tmdbClient,
      wikidataClient,
    );
    const parsed = JSON.parse(result);

    // Diane Quon should appear in crewNominations (resolved via name search)
    const dianeEntry = parsed.crewNominations.find(
      (c: any) => c.person.name === "Diane Quon",
    );
    expect(dianeEntry).toBeDefined();
    expect(dianeEntry.nominations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ wikidataId: "Q111332" }),
      ]),
    );

    // Bing Liu should still resolve (regression check)
    const bingEntry = parsed.crewNominations.find(
      (c: any) => c.person.name === "Bing Liu",
    );
    expect(bingEntry).toBeDefined();

    // Bing Liu should have multiple roles (dedup)
    expect(bingEntry.person.roles.length).toBeGreaterThan(1);
  });
});
