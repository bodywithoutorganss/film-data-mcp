// ABOUTME: Unit tests for the Wikidata SPARQL client.
// ABOUTME: Tests query construction and response parsing with mocked fetch.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("WikidataClient", () => {
  let client: WikidataClient;

  beforeEach(() => {
    client = new WikidataClient();
    mockFetch.mockReset();
  });

  describe("resolvePersonByTmdbId", () => {
    it("resolves a person by TMDB ID (P4985)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q8877" },
                entityLabel: { type: "literal", value: "Steven Spielberg" },
              },
            ],
          },
        }),
      });

      const result = await client.resolvePersonByTmdbId("488");
      expect(result).toEqual({
        wikidataId: "Q8877",
        label: "Steven Spielberg",
        resolvedVia: "tmdb_id",
      });
    });

    it("returns null when TMDB ID not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: { bindings: [] } }),
      });

      const result = await client.resolvePersonByTmdbId("999999999");
      expect(result).toBeNull();
    });
  });

  describe("resolveMovieByTmdbId", () => {
    it("resolves a movie by TMDB ID (P4947)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q183081" },
                entityLabel: { type: "literal", value: "No Country for Old Men" },
              },
            ],
          },
        }),
      });

      const result = await client.resolveMovieByTmdbId("6977");
      expect(result).toEqual({
        wikidataId: "Q183081",
        label: "No Country for Old Men",
        resolvedVia: "tmdb_id",
      });
    });
  });

  describe("resolveByImdbId", () => {
    it("resolves an entity by IMDb ID (P345)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
                entityLabel: { type: "literal", value: "Roger Deakins" },
              },
            ],
          },
        }),
      });

      const result = await client.resolveByImdbId("nm0209244");
      expect(result).toEqual({
        wikidataId: "Q460277",
        label: "Roger Deakins",
        resolvedVia: "imdb_id",
      });
    });
  });

  describe("SPARQL query construction", () => {
    it("sends properly encoded SPARQL to the endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: { bindings: [] } }),
      });

      await client.resolvePersonByTmdbId("488");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("query.wikidata.org/sparql");
      expect(url).toContain("P4985");
      expect(options.headers["User-Agent"]).toBe("film-data-mcp/1.0");
    });
  });

  describe("error handling", () => {
    it("rejects invalid QID input", async () => {
      await expect(client.getPersonWins("invalid")).rejects.toThrow("Invalid Wikidata QID");
    });

    it("rejects invalid TMDB ID", async () => {
      await expect(client.resolvePersonByTmdbId('abc"injection')).rejects.toThrow("Invalid TMDB ID");
    });

    it("rejects invalid IMDb ID", async () => {
      await expect(client.resolveByImdbId("invalid")).rejects.toThrow("Invalid IMDb ID");
    });

    it("throws on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(client.resolvePersonByTmdbId("488")).rejects.toThrow(
        "Wikidata SPARQL error: 429 Too Many Requests"
      );
    });

    it("throws on malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new SyntaxError("Unexpected token"); },
      });
      await expect(client.resolvePersonByTmdbId("488")).rejects.toThrow("Unexpected token");
    });
  });

  describe("awards queries", () => {
    it("gets person wins (P166)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q131520" },
                awardLabel: { type: "literal", value: "Academy Award for Best Cinematography" },
                date: { type: "literal", value: "2018-03-04T00:00:00Z" },
              },
            ],
          },
        }),
      });

      const wins = await client.getPersonWins("Q460277");
      expect(wins).toHaveLength(1);
      expect(wins[0].wikidataId).toBe("Q131520");
      expect(wins[0].label).toBe("Academy Award for Best Cinematography");
      expect(wins[0].year).toBe(2018);
    });

    it("gets person nominations (P1411) with forWork", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q131520" },
                awardLabel: { type: "literal", value: "Academy Award for Best Cinematography" },
                date: { type: "literal", value: "2008-02-24T00:00:00Z" },
                forWork: { type: "uri", value: "http://www.wikidata.org/entity/Q183081" },
                forWorkLabel: { type: "literal", value: "No Country for Old Men" },
              },
            ],
          },
        }),
      });

      const noms = await client.getPersonNominations("Q460277");
      expect(noms).toHaveLength(1);
      expect(noms[0].forWork).toEqual({ wikidataId: "Q183081", label: "No Country for Old Men" });
      expect(noms[0].year).toBe(2008);
    });

    it("gets film awards (P166)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q102427" },
                awardLabel: { type: "literal", value: "Academy Award for Best Picture" },
                date: { type: "literal", value: "2020-02-09T00:00:00Z" },
              },
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q179808" },
                awardLabel: { type: "literal", value: "Palme d'Or" },
                date: { type: "literal", value: "2019-05-25T00:00:00Z" },
              },
            ],
          },
        }),
      });

      const awards = await client.getFilmAwards("Q61448040");
      expect(awards).toHaveLength(2);
      expect(awards[0].label).toBe("Academy Award for Best Picture");
      expect(awards[1].label).toBe("Palme d'Or");
    });

    it("gets award history by category QID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
                recipientLabel: { type: "literal", value: "Roger Deakins" },
                date: { type: "literal", value: "2018-03-04T00:00:00Z" },
                forWork: { type: "uri", value: "http://www.wikidata.org/entity/Q28936680" },
                forWorkLabel: { type: "literal", value: "Blade Runner 2049" },
              },
            ],
          },
        }),
      });

      const history = await client.getAwardHistory("Q131520");
      expect(history).toHaveLength(1);
      expect(history[0].recipientLabel).toBe("Roger Deakins");
      expect(history[0].year).toBe(2018);
    });

    it("replaces QID-like labels with Unknown (QID) in award history", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q585668" },
                recipientLabel: { type: "literal", value: "Q585668" },
                date: { type: "literal", value: "2020-01-01" },
              },
            ],
          },
        }),
      });

      const result = await client.getAwardHistory("Q131520");
      expect(result[0].recipientLabel).toBe("Unknown (Q585668)");
    });

    it("preserves normal labels", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
                recipientLabel: { type: "literal", value: "Roger Deakins" },
                date: { type: "literal", value: "2020-01-01" },
              },
            ],
          },
        }),
      });

      const result = await client.getAwardHistory("Q131520");
      expect(result[0].recipientLabel).toBe("Roger Deakins");
    });

    it("preserves Unknown fallback when label is missing entirely", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
                date: { type: "literal", value: "2020-01-01" },
              },
            ],
          },
        }),
      });

      const result = await client.getAwardHistory("Q131520");
      expect(result[0].recipientLabel).toBe("Unknown");
    });

    it("filters wins to only recognized award QIDs", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q131520" },
                awardLabel: { type: "literal", value: "Academy Award for Best Cinematography" },
                date: { type: "literal", value: "2018-03-04T00:00:00Z" },
              },
              {
                award: { type: "uri", value: "http://www.wikidata.org/entity/Q999999" },
                awardLabel: { type: "literal", value: "Commander of the Order of the British Empire" },
                date: { type: "literal", value: "2013-01-01T00:00:00Z" },
              },
            ],
          },
        }),
      });

      const wins = await client.getPersonWins("Q460277");
      // Only Q131520 is in the registry; CBE (Q999999) should be filtered out
      expect(wins).toHaveLength(1);
      expect(wins[0].label).toBe("Academy Award for Best Cinematography");
    });
  });
});
