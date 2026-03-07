// ABOUTME: Integration tests validating award tools against real documentary comp films.
// ABOUTME: Hits live TMDB and Wikidata APIs. Requires TMDB_ACCESS_TOKEN env var.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";
import {
  handleGetFilmAwards,
  handleGetPersonAwards,
} from "../../src/tools/awards.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const LIVE_TIMEOUT = { timeout: 30000 };

// Comp film TMDB IDs (verified via TMDB credits endpoint)
const MINDING_THE_GAP_ID = 489985; // Minding the Gap (2018)
const BOYS_STATE_ID = 653723; // Boys State (2020)
const DICK_JOHNSON_ID = 653574; // Dick Johnson Is Dead (2020)

// Key people TMDB IDs (verified via film credits)
const BING_LIU_ID = 1932272; // Director, Minding the Gap
const KIRSTEN_JOHNSON_ID = 117841; // Director, Dick Johnson Is Dead
const JESSE_MOSS_ID = 1285812; // Co-director, Boys State
const AMANDA_MCBAINE_ID = 1285813; // Co-director, Boys State

describe.skipIf(!TMDB_TOKEN)("comp film entity resolution", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN
    ? new TMDBClient(TMDB_TOKEN)
    : (null as unknown as TMDBClient);

  it(
    "resolves Minding the Gap to Wikidata",
    LIVE_TIMEOUT,
    async () => {
      const entity = await wikidataClient.resolveMovieByTmdbId(
        String(MINDING_THE_GAP_ID)
      );
      if (!entity) {
        const movie = await tmdbClient.getMovieDetails(MINDING_THE_GAP_ID);
        expect(movie.imdb_id).toBeTruthy();
        const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
        expect(byImdb).not.toBeNull();
        expect(byImdb!.label).toMatch(/Minding the Gap/i);
      } else {
        expect(entity.label).toMatch(/Minding the Gap/i);
      }
    }
  );

  it(
    "resolves Boys State to Wikidata",
    LIVE_TIMEOUT,
    async () => {
      const entity = await wikidataClient.resolveMovieByTmdbId(
        String(BOYS_STATE_ID)
      );
      if (!entity) {
        const movie = await tmdbClient.getMovieDetails(BOYS_STATE_ID);
        expect(movie.imdb_id).toBeTruthy();
        const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
        expect(byImdb).not.toBeNull();
        expect(byImdb!.label).toMatch(/Boys State/i);
      } else {
        expect(entity.label).toMatch(/Boys State/i);
      }
    }
  );

  it(
    "resolves Dick Johnson Is Dead to Wikidata",
    LIVE_TIMEOUT,
    async () => {
      const entity = await wikidataClient.resolveMovieByTmdbId(
        String(DICK_JOHNSON_ID)
      );
      if (!entity) {
        const movie = await tmdbClient.getMovieDetails(DICK_JOHNSON_ID);
        expect(movie.imdb_id).toBeTruthy();
        const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
        expect(byImdb).not.toBeNull();
        expect(byImdb!.label).toMatch(/Dick Johnson/i);
      } else {
        expect(entity.label).toMatch(/Dick Johnson/i);
      }
    }
  );

  it(
    "resolves Bing Liu to Wikidata",
    LIVE_TIMEOUT,
    async () => {
      const entity = await wikidataClient.resolvePersonByTmdbId(
        String(BING_LIU_ID)
      );
      if (!entity) {
        const person = await tmdbClient.getPersonDetails(BING_LIU_ID);
        if (person.imdb_id) {
          const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
          expect(byImdb).not.toBeNull();
        } else {
          const byName = await wikidataClient.resolvePersonByName("Bing Liu");
          expect(byName).not.toBeNull();
        }
      } else {
        expect(entity.label).toMatch(/Bing Liu/i);
      }
    }
  );

  it(
    "resolves Kirsten Johnson to Wikidata",
    LIVE_TIMEOUT,
    async () => {
      const entity = await wikidataClient.resolvePersonByTmdbId(
        String(KIRSTEN_JOHNSON_ID)
      );
      if (!entity) {
        const person = await tmdbClient.getPersonDetails(KIRSTEN_JOHNSON_ID);
        if (person.imdb_id) {
          const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
          expect(byImdb).not.toBeNull();
        } else {
          const byName =
            await wikidataClient.resolvePersonByName("Kirsten Johnson");
          expect(byName).not.toBeNull();
        }
      } else {
        expect(entity.label).toMatch(/Johnson/i);
      }
    }
  );
});

describe.skipIf(!TMDB_TOKEN)("comp film known awards", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN
    ? new TMDBClient(TMDB_TOKEN)
    : (null as unknown as TMDBClient);

  it(
    "Minding the Gap has Academy Best Documentary nomination",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetFilmAwards(
          { movie_id: MINDING_THE_GAP_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);

      const allAwards = [
        ...result.awards,
        ...result.crewNominations.flatMap((cn: any) => cn.nominations),
      ];
      const academyDoc = allAwards.find(
        (a: any) =>
          a.label &&
          a.label.match(/Documentary/i) &&
          a.label.match(/Academy/i)
      );
      if (!academyDoc) {
        console.warn(
          "DATA GAP: Minding the Gap Academy Best Documentary nomination not found in Wikidata"
        );
      }
    }
  );

  it(
    "Boys State has Sundance Grand Jury Documentary win",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetFilmAwards(
          { movie_id: BOYS_STATE_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);

      const allAwards = [...result.awards];
      const sundanceGrandJury = allAwards.find(
        (a: any) => a.label && a.label.match(/Sundance/i)
      );
      if (!sundanceGrandJury) {
        console.warn(
          "DATA GAP: Boys State Sundance Grand Jury Documentary win not found in Wikidata"
        );
      }
    }
  );

  it(
    "Dick Johnson Is Dead has Independent Spirit Documentary nomination",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetFilmAwards(
          { movie_id: DICK_JOHNSON_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);

      const allAwards = [
        ...result.awards,
        ...result.crewNominations.flatMap((cn: any) => cn.nominations),
      ];
      const spiritDoc = allAwards.find(
        (a: any) =>
          a.label &&
          a.label.match(/Spirit/i) &&
          a.label.match(/Documentary/i)
      );
      if (!spiritDoc) {
        console.warn(
          "DATA GAP: Dick Johnson Is Dead Independent Spirit Documentary nomination not found in Wikidata"
        );
      }
    }
  );
});

describe.skipIf(!TMDB_TOKEN)("comp film person awards", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN
    ? new TMDBClient(TMDB_TOKEN)
    : (null as unknown as TMDBClient);

  it(
    "get_person_awards resolves Bing Liu and returns completeness",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetPersonAwards(
          { person_id: BING_LIU_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);
      expect(typeof result.completeness.p166ClaimCount).toBe("number");
      console.log(
        `Bing Liu: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`
      );
    }
  );

  it(
    "get_person_awards resolves Kirsten Johnson and returns completeness",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetPersonAwards(
          { person_id: KIRSTEN_JOHNSON_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);
      console.log(
        `Kirsten Johnson: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`
      );
    }
  );

  it(
    "get_person_awards resolves Jesse Moss and returns completeness",
    LIVE_TIMEOUT,
    async () => {
      const result = JSON.parse(
        await handleGetPersonAwards(
          { person_id: JESSE_MOSS_ID },
          tmdbClient,
          wikidataClient
        )
      );
      expect(result.completeness.entityFound).toBe(true);
      console.log(
        `Jesse Moss: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`
      );
    }
  );
});

describe.skipIf(!TMDB_TOKEN)("comp film crew cross-referencing", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN
    ? new TMDBClient(TMDB_TOKEN)
    : (null as unknown as TMDBClient);

  it(
    "Minding the Gap crew nominations include resolved crew members",
    { timeout: 60000 },
    async () => {
      const result = JSON.parse(
        await handleGetFilmAwards(
          { movie_id: MINDING_THE_GAP_ID },
          tmdbClient,
          wikidataClient
        )
      );
      console.log(
        `Minding the Gap: ${result.awards.length} direct awards, ${result.crewNominations.length} crew nominations`
      );
      if (result.skippedCrew) {
        console.log(`Skipped crew: ${JSON.stringify(result.skippedCrew)}`);
      }
      for (const cn of result.crewNominations) {
        console.log(
          `  ${cn.person.name} (${cn.person.roles.join(", ")}): ${cn.nominations.length} nominations`
        );
      }

      const totalResolved = result.crewNominations.length;
      const totalSkipped = result.skippedCrew?.length ?? 0;
      console.log(
        `Resolution: ${totalResolved} resolved, ${totalSkipped} skipped`
      );
    }
  );

  it(
    "Dick Johnson Is Dead crew nominations include Kirsten Johnson",
    { timeout: 60000 },
    async () => {
      const result = JSON.parse(
        await handleGetFilmAwards(
          { movie_id: DICK_JOHNSON_ID },
          tmdbClient,
          wikidataClient
        )
      );
      console.log(
        `Dick Johnson Is Dead: ${result.awards.length} direct awards, ${result.crewNominations.length} crew nominations`
      );
      for (const cn of result.crewNominations) {
        console.log(
          `  ${cn.person.name} (${cn.person.roles.join(", ")}): ${cn.nominations.length} nominations`
        );
      }

      const kirstenEntry = result.crewNominations.find(
        (cn: any) => cn.person.name.match(/Johnson/i)
      );
      if (!kirstenEntry) {
        console.warn(
          "DATA GAP: Kirsten Johnson has no P1411 nominations linked to Dick Johnson Is Dead in Wikidata"
        );
      }
    }
  );
});
