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
  getPersonWins: vi.fn(),
  getPersonNominations: vi.fn(),
  getFilmAwards: vi.fn(),
  getAwardHistory: vi.fn(),
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

    it("throws when TMDB person has no IMDb ID and TMDB resolution fails", async () => {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });

      await expect(
        handleGetPersonAwards({ person_id: 12345 }, mockTmdbClient as any, mockWikidataClient as any)
      ).rejects.toThrow("Could not resolve TMDB person 12345 to a Wikidata entity");
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

      const result = await handleGetFilmAwards(
        { movie_id: 496243 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.label).toBe("Parasite");
      expect(parsed.awards).toHaveLength(2);
    });

    it("falls back to IMDb ID when TMDB movie ID not found", async () => {
      mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue(null);
      mockTmdbClient.getMovieDetails.mockResolvedValue({ imdb_id: "tt6751668" });
      mockWikidataClient.resolveByImdbId.mockResolvedValue({
        wikidataId: "Q61448040", label: "Parasite", resolvedVia: "imdb_id",
      });
      mockWikidataClient.getFilmAwards.mockResolvedValue([]);

      const result = await handleGetFilmAwards(
        { movie_id: 496243 },
        mockTmdbClient as any,
        mockWikidataClient as any
      );
      const parsed = JSON.parse(result);
      expect(parsed.entity.resolvedVia).toBe("imdb_id");
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
