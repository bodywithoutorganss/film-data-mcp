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
  });
});
