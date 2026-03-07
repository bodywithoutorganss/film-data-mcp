// ABOUTME: Unit tests for Wikidata awards MCP tools.
// ABOUTME: Tests tool handlers with mocked WikidataClient and TMDBClient.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetPersonAwards,
  handleGetFilmAwards,
  handleGetAwardHistory,
  handleSearchAwards,
  GetPersonAwardsSchema,
  GetFilmAwardsSchema,
  GetAwardHistorySchema,
  SearchAwardsSchema,
} from "../../src/tools/awards.js";

const mockWikidataClient = {
  resolvePersonByTmdbId: vi.fn(),
  resolveMovieByTmdbId: vi.fn(),
  resolveByImdbId: vi.fn(),
  resolvePersonByName: vi.fn(),
  getPersonWins: vi.fn(),
  getPersonNominations: vi.fn(),
  getFilmAwards: vi.fn(),
  getAwardHistory: vi.fn(),
  countAllP166Claims: vi.fn(),
};

const mockTmdbClient = {
  getPersonDetails: vi.fn(),
  getMovieDetails: vi.fn(),
};

describe("awards tools", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("get_person_awards", () => {
    it("resolves TMDB person ID and returns wins + nominations", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
        wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getPersonWins.mockResolvedValue([
        { wikidataId: "Q131520", label: "Academy Award for Best Cinematography", year: 2018, ceremony: "academy-awards" },
      ]);
      mockWikidataClient.getPersonNominations.mockResolvedValue([
        {
          wikidataId: "Q131520", label: "Academy Award for Best Cinematography", year: 2008, ceremony: "academy-awards",
          forWork: { wikidataId: "Q183081", label: "No Country for Old Men" },
        },
      ]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(15);

      const result = await handleGetPersonAwards(
        { person_id: 151 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.label).toBe("Roger Deakins");
      expect(parsed.wins).toHaveLength(1);
      expect(parsed.nominations).toHaveLength(1);
      expect(parsed.nominations[0].forWork.label).toBe("No Country for Old Men");
    });

    it("falls back to IMDb ID when TMDB ID not found", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: "nm0209244" });
      mockWikidataClient.resolveByImdbId.mockResolvedValue({
        wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "imdb_id",
      });
      mockWikidataClient.getPersonWins.mockResolvedValue([]);
      mockWikidataClient.getPersonNominations.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

      const result = await handleGetPersonAwards(
        { person_id: 151 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.resolvedVia).toBe("imdb_id");
    });

    it("throws when entity cannot be resolved", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: "nm9999999" });
      mockWikidataClient.resolveByImdbId.mockResolvedValue(null);

      await expect(
        handleGetPersonAwards({ person_id: 99999 }, mockTmdbClient as any, mockWikidataClient as any)
      ).rejects.toThrow("Could not resolve TMDB person 99999 to a Wikidata entity");
    });

    it("falls back to name search when TMDB and IMDb resolution both fail", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
      mockWikidataClient.resolvePersonByName.mockResolvedValue({
        wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "name_search",
      });
      mockWikidataClient.getPersonWins.mockResolvedValue([]);
      mockWikidataClient.getPersonNominations.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

      const result = await handleGetPersonAwards(
        { person_id: 151, name: "Roger Deakins" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.resolvedVia).toBe("name_search");
      expect(mockWikidataClient.resolvePersonByName).toHaveBeenCalledWith("Roger Deakins");
    });

    it("throws when TMDB person has no IMDb ID and TMDB resolution fails", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });

      await expect(
        handleGetPersonAwards({ person_id: 12345 }, mockTmdbClient as any, mockWikidataClient as any)
      ).rejects.toThrow("Could not resolve TMDB person 12345 to a Wikidata entity");
    });

    it("includes completeness indicator with p166 claim count", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
        wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getPersonWins.mockResolvedValue([
        { wikidataId: "Q131520", label: "Academy Award for Best Cinematography", year: 2018, ceremony: "academy-awards" },
      ]);
      mockWikidataClient.getPersonNominations.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(5);

      const result = await handleGetPersonAwards(
        { person_id: 151 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.completeness).toEqual({
        entityFound: true,
        p166ClaimCount: 5,
        registeredAwardCount: 1,
      });
    });
  });

  describe("get_film_awards", () => {
    it("resolves TMDB movie ID and returns awards", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q61448040", label: "Parasite", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([
        { wikidataId: "Q102427", label: "Academy Award for Best Picture", year: 2020, ceremony: "academy-awards" },
        { wikidataId: "Q179808", label: "Palme d'Or", year: 2019, ceremony: "cannes" },
      ]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(2);
      mockTmdbClient.getMovieDetails.mockResolvedValue({});

      const result = await handleGetFilmAwards(
        { movie_id: 496243 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.label).toBe("Parasite");
      expect(parsed.awards).toHaveLength(2);
      expect(parsed.crewNominations).toEqual([]);
      expect(parsed.completeness).toEqual({
        entityFound: true,
        p166ClaimCount: 2,
        registeredAwardCount: 2,
      });
    });

    it("falls back to IMDb ID when TMDB movie ID not found", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getMovieDetails.mockResolvedValue({ imdb_id: "tt6751668" });
      mockWikidataClient.resolveByImdbId.mockResolvedValue({
        wikidataId: "Q61448040", label: "Parasite", resolvedVia: "imdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

      const result = await handleGetFilmAwards(
        { movie_id: 496243 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.resolvedVia).toBe("imdb_id");
    });

    it("includes completeness indicator with p166 claim count", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q61448040", label: "Parasite", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([
        { wikidataId: "Q102427", label: "Academy Award for Best Picture", year: 2020, ceremony: "academy-awards" },
      ]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(12);
      mockTmdbClient.getMovieDetails.mockResolvedValue({});

      const result = await handleGetFilmAwards(
        { movie_id: 496243 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.completeness).toEqual({
        entityFound: true,
        p166ClaimCount: 12,
        registeredAwardCount: 1,
      });
    });

    it("shows zero p166 claims for entity with no Wikidata awards", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({});

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.completeness).toEqual({
        entityFound: true,
        p166ClaimCount: 0,
        registeredAwardCount: 0,
      });
    });

    it("throws when movie cannot be resolved", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getMovieDetails.mockResolvedValue({ imdb_id: "tt9999999" });
      mockWikidataClient.resolveByImdbId.mockResolvedValue(null);

      await expect(
        handleGetFilmAwards({ movie_id: 99999 }, mockTmdbClient as any, mockWikidataClient as any)
      ).rejects.toThrow("Could not resolve TMDB movie 99999 to a Wikidata entity");
    });
  });

  describe("crew nomination cross-referencing", () => {
    it("fetches crew nominations filtered to the target film", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

      // TMDB credits
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 1757073, name: "Bing Liu", job: "Director", department: "Directing" },
            { id: 9999, name: "Diane Quon", job: "Producer", department: "Production" },
          ],
        },
      });

      // Bing Liu resolves, Diane Quon doesn't
      mockWikidataClient.resolvePersonByTmdbId
        .mockResolvedValueOnce({ wikidataId: "Q56168000", label: "Bing Liu", resolvedVia: "tmdb_id" })
        .mockResolvedValueOnce(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });

      // Bing Liu's nominations: one for MTG, one for another film
      mockWikidataClient.getPersonNominations.mockResolvedValue([
        {
          wikidataId: "Q112107", label: "Academy Award for Best Documentary Feature", year: 2019,
          ceremony: "academy-awards",
          forWork: { wikidataId: "Q56167580", label: "Minding the Gap" },
        },
        {
          wikidataId: "Q999999", label: "Some Other Award", year: 2022,
          ceremony: "academy-awards",
          forWork: { wikidataId: "Q999999", label: "Some Other Film" },
        },
      ]);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);

      expect(parsed.crewNominations).toHaveLength(1);
      expect(parsed.crewNominations[0].person).toEqual({ name: "Bing Liu", roles: ["Director"] });
      expect(parsed.crewNominations[0].nominations).toHaveLength(1);
      expect(parsed.crewNominations[0].nominations[0].label).toBe("Academy Award for Best Documentary Feature");
      expect(parsed.skippedCrew).toEqual([{ name: "Diane Quon", roles: ["Producer"], reason: "unresolvable" }]);
    });

    it("returns empty crewNominations when no credits available", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({});

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.crewNominations).toEqual([]);
    });

    it("skips crew without forWork qualifier on nominations", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [{ id: 100, name: "Jane Doe", job: "Director", department: "Directing" }],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
        wikidataId: "Q100", label: "Jane Doe", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getPersonNominations.mockResolvedValue([
        {
          wikidataId: "Q131520", label: "Some Award", year: 2020,
          ceremony: "academy-awards",
          // no forWork — can't confirm it's for this film
        },
      ]);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      // Person resolved but 0 matched nominations — should appear in resolvedCrew
      const janeEntry = parsed.crewNominations.find((c: any) => c.person.name === "Jane Doe");
      expect(janeEntry).toBeUndefined();
      expect(parsed.resolvedCrew).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Jane Doe", roles: ["Director"] }),
        ])
      );
    });

    it("processes all relevant crew without cap", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q100", label: "Big Film", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

      const bigCrew = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1, name: `Person ${i}`, job: "Producer", department: "Production",
      }));
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: { cast: [], crew: bigCrew },
      });
      for (let i = 0; i < 10; i++) {
        mockWikidataClient.resolvePersonByTmdbId.mockResolvedValueOnce({
          wikidataId: `Q${i + 1}`, label: `Person ${i}`, resolvedVia: "tmdb_id",
        });
      }
      mockWikidataClient.getPersonNominations.mockResolvedValue([]);

      const result = await handleGetFilmAwards(
        { movie_id: 1 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);

      expect(mockWikidataClient.resolvePersonByTmdbId).toHaveBeenCalledTimes(10);
      // All 10 resolved but have 0 matching nominations — should appear in resolvedCrew
      expect(parsed.resolvedCrew).toHaveLength(10);
      expect(parsed.resolvedCrew[0]).toEqual(
        expect.objectContaining({ name: expect.any(String), roles: ["Producer"] })
      );
    });

    it("includes composers and cinematographers in crew lookups", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 100, name: "Test Composer", job: "Original Music Composer" },
            { id: 101, name: "Test DP", job: "Director of Photography" },
          ],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
      mockWikidataClient.resolvePersonByName.mockResolvedValue(null);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any,
      );
      const parsed = JSON.parse(result);
      expect(parsed.skippedCrew).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Test Composer" }),
          expect.objectContaining({ name: "Test DP" }),
        ]),
      );
    });

    it("deduplicates crew by TMDB person ID", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 200, name: "Multi Role", job: "Director" },
            { id: 200, name: "Multi Role", job: "Producer" },
            { id: 200, name: "Multi Role", job: "Editor" },
          ],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
        wikidataId: "Q999", label: "Multi Role", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getPersonNominations.mockResolvedValue([{
        wikidataId: "Q111332", label: "Best Doc", year: 2020,
        forWork: { wikidataId: "Q56167580", label: "Test Film" },
        ceremony: "academy-awards",
      }]);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any,
      );
      const parsed = JSON.parse(result);

      expect(mockWikidataClient.resolvePersonByTmdbId).toHaveBeenCalledTimes(1);
      expect(parsed.crewNominations[0].person.roles).toEqual(
        expect.arrayContaining(["Director", "Producer", "Editor"]),
      );
    });

    it("matches broad producer roles like Associate Producer", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 300, name: "Assoc Prod", job: "Associate Producer" },
            { id: 301, name: "Archive Prod", job: "Archival Producer" },
          ],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
      mockWikidataClient.resolvePersonByName.mockResolvedValue(null);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any,
      );
      const parsed = JSON.parse(result);
      const skippedNames = parsed.skippedCrew.map((s: any) => s.name);
      expect(skippedNames).toContain("Assoc Prod");
      expect(skippedNames).toContain("Archive Prod");
    });

    it("falls back to name-based resolution when ID resolution fails", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 1915808, name: "Diane Quon", job: "Producer" },
          ],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
      mockWikidataClient.resolvePersonByName.mockResolvedValue({
        wikidataId: "Q61298652", label: "Diane Quon", resolvedVia: "name_search",
      });
      mockWikidataClient.getPersonNominations.mockResolvedValue([{
        wikidataId: "Q111332", label: "Academy Award for Best Documentary Feature Film",
        year: 2019,
        forWork: { wikidataId: "Q56167580", label: "Minding the Gap" },
        ceremony: "academy-awards",
      }]);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any,
      );
      const parsed = JSON.parse(result);

      expect(parsed.crewNominations).toHaveLength(1);
      expect(parsed.crewNominations[0].person.name).toBe("Diane Quon");
      expect(mockWikidataClient.resolvePersonByName).toHaveBeenCalledWith("Diane Quon");
    });

    it("reports unresolvable when name search also fails", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
        wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);
      mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
      mockTmdbClient.getMovieDetails.mockResolvedValue({
        credits: {
          cast: [],
          crew: [
            { id: 999, name: "John Williams", job: "Original Music Composer" },
          ],
        },
      });
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
      mockWikidataClient.resolvePersonByName.mockResolvedValue(null);

      const result = await handleGetFilmAwards(
        { movie_id: 489985 },
        mockTmdbClient as any,
        mockWikidataClient as any,
      );
      const parsed = JSON.parse(result);

      expect(parsed.skippedCrew).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "John Williams", reason: "unresolvable" }),
        ]),
      );
    });
  });

  describe("countAllP166Claims", () => {
    it("is callable on WikidataClient", async () => {
      const { WikidataClient } = await import("../../src/utils/wikidata-client.js");
      const client = new WikidataClient();
      expect(typeof client.countAllP166Claims).toBe("function");
    });
  });

  describe("get_award_history", () => {
    it("looks up category by ID and returns grouped history", async () => {
      mockWikidataClient.getAwardHistory.mockResolvedValue([
        { recipientId: "Q460277", recipientLabel: "Roger Deakins", year: 2018 },
      ]);

      const result = await handleGetAwardHistory(
        { category: "academy-best-cinematography" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.category).toBe("Academy Award for Best Cinematography");
      expect(parsed.history).toHaveLength(1);
      expect(parsed.history[0].year).toBe(2018);
      expect(parsed.history[0].recipients).toHaveLength(1);
      expect(parsed.history[0].recipients[0].label).toBe("Roger Deakins");
    });

    it("groups results by year", async () => {
      mockWikidataClient.getAwardHistory.mockResolvedValue([
        { recipientId: "Q1", recipientLabel: "Roger Deakins", year: 2020, forWork: { wikidataId: "Q2", label: "1917" } },
        { recipientId: "Q3", recipientLabel: "1917", year: 2020 },
        { recipientId: "Q4", recipientLabel: "Emmanuel Lubezki", year: 2015 },
      ]);

      const result = JSON.parse(
        await handleGetAwardHistory(
          { category: "academy-best-cinematography" },
          mockTmdbClient as any,
          mockWikidataClient as any
        )
      );

      expect(result.history).toHaveLength(2);
      expect(result.history[0].year).toBe(2020);
      expect(result.history[0].recipients).toHaveLength(2);
      expect(result.history[0].recipients[0].label).toBe("Roger Deakins");
      expect(result.history[1].year).toBe(2015);
      expect(result.history[1].recipients).toHaveLength(1);
    });

    it("groups entries without year under null", async () => {
      mockWikidataClient.getAwardHistory.mockResolvedValue([
        { recipientId: "Q1", recipientLabel: "Alice", year: 2020 },
        { recipientId: "Q2", recipientLabel: "Bob" },
      ]);

      const result = JSON.parse(
        await handleGetAwardHistory(
          { category: "academy-best-cinematography" },
          mockTmdbClient as any,
          mockWikidataClient as any
        )
      );

      expect(result.history).toHaveLength(2);
      const nullGroup = result.history.find((h: any) => h.year === null);
      expect(nullGroup).toBeDefined();
      expect(nullGroup.recipients).toHaveLength(1);
      expect(nullGroup.recipients[0].label).toBe("Bob");
    });

    it("handles single-recipient years", async () => {
      mockWikidataClient.getAwardHistory.mockResolvedValue([
        { recipientId: "Q1", recipientLabel: "Alice", year: 2023 },
      ]);

      const result = JSON.parse(
        await handleGetAwardHistory(
          { category: "academy-best-cinematography" },
          mockTmdbClient as any,
          mockWikidataClient as any
        )
      );

      expect(result.history).toHaveLength(1);
      expect(result.history[0].year).toBe(2023);
      expect(result.history[0].recipients).toHaveLength(1);
    });

    it("throws for unknown category", async () => {
      await expect(
        handleGetAwardHistory({ category: "nonexistent" }, mockTmdbClient as any, mockWikidataClient as any)
      ).rejects.toThrow("Unknown award category: nonexistent");
    });
  });

  describe("search_awards", () => {
    it("finds ceremonies by name", async () => {
      const result = await handleSearchAwards(
        { query: "cannes" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.ceremonies.length).toBeGreaterThan(0);
      expect(parsed.ceremonies[0].id).toBe("cannes");
    });

    it("finds categories by domain", async () => {
      const result = await handleSearchAwards(
        { query: "cinematography" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.categories.length).toBeGreaterThan(0);
      expect(parsed.categories.some((c: any) => c.domain === "cinematography")).toBe(true);
    });

    it("finds categories by ceremony ID", async () => {
      const result = await handleSearchAwards(
        { query: "academy-awards" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.categories.length).toBeGreaterThan(0);
      expect(parsed.categories.every((c: any) => c.ceremony === "academy-awards")).toBe(true);
    });

    it("returns empty arrays for no matches", async () => {
      const result = await handleSearchAwards(
        { query: "xyznonexistent" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.ceremonies).toHaveLength(0);
      expect(parsed.categories).toHaveLength(0);
    });

    it("matches compound query across fields (academy cinematography)", async () => {
      const result = await handleSearchAwards(
        { query: "academy cinematography" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.categories.length).toBeGreaterThan(0);
      expect(parsed.categories.some((c: any) => c.id === "academy-best-cinematography")).toBe(true);
      expect(parsed.ceremonies).toHaveLength(0);
    });

    it("matches compound query across fields (cannes director)", async () => {
      const result = await handleSearchAwards(
        { query: "cannes director" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.categories.length).toBeGreaterThan(0);
      expect(parsed.categories.some((c: any) => c.id === "cannes-best-director")).toBe(true);
    });

    it("returns empty when one token has no match", async () => {
      const result = await handleSearchAwards(
        { query: "academy xyznonexistent" },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.ceremonies).toHaveLength(0);
      expect(parsed.categories).toHaveLength(0);
    });
  });

  describe("Zod schemas", () => {
    it("validates get_person_awards input", () => {
      expect(GetPersonAwardsSchema.parse({ person_id: 151 })).toEqual({ person_id: 151 });
    });

    it("rejects non-positive person_id", () => {
      expect(() => GetPersonAwardsSchema.parse({ person_id: -1 })).toThrow();
    });

    it("validates get_film_awards input", () => {
      expect(GetFilmAwardsSchema.parse({ movie_id: 496243 })).toEqual({ movie_id: 496243 });
    });

    it("validates get_award_history input", () => {
      expect(GetAwardHistorySchema.parse({ category: "academy-best-cinematography" })).toEqual({ category: "academy-best-cinematography" });
    });

    it("validates search_awards input", () => {
      const parsed = SearchAwardsSchema.parse({ query: "Cannes" });
      expect(parsed.query).toBe("Cannes");
    });

    it("rejects empty search query", () => {
      expect(() => SearchAwardsSchema.parse({ query: "" })).toThrow();
    });
  });
});
