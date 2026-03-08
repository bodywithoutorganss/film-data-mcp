// ABOUTME: Unit tests for get_person_representation tool.
// ABOUTME: Tests person resolution, SPARQL response parsing, deduplication, and empty results.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetPersonRepresentation } from "../../src/tools/representation.js";

const mockWikidataClient = {
  resolvePersonByTmdbId: vi.fn(),
  resolveByImdbId: vi.fn(),
  resolvePersonByName: vi.fn(),
  getPersonRepresentation: vi.fn(),
  getPersonWins: vi.fn(),
  getPersonNominations: vi.fn(),
  getFilmAwards: vi.fn(),
  getAwardHistory: vi.fn(),
  countAllP166Claims: vi.fn(),
  resolveMovieByTmdbId: vi.fn(),
};

const mockTmdbClient = {
  getPersonDetails: vi.fn(),
  getMovieDetails: vi.fn(),
};

describe("get_person_representation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("resolves person and returns representation data", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
      wikidataId: "Q189489",
      label: "Zendaya",
      resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getPersonRepresentation.mockResolvedValue([
      {
        name: "Creative Artists Agency",
        wikidataId: "Q3002407",
        type: "talent agency",
        startDate: "2014-03-01",
        endDate: null,
        role: null,
      },
    ]);

    const result = await handleGetPersonRepresentation(
      { person_id: 505710 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.entity.wikidataId).toBe("Q189489");
    expect(parsed.entity.label).toBe("Zendaya");
    expect(parsed.representation).toHaveLength(1);
    expect(parsed.representation[0].name).toBe("Creative Artists Agency");
    expect(parsed.representation[0].type).toBe("talent agency");
    expect(parsed.representation[0].startDate).toBe("2014-03-01");
    expect(parsed.coverageNote).toContain("Wikidata");
  });

  it("returns empty representation when person has no P1875 data", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
      wikidataId: "Q12345",
      label: "Unknown Actor",
      resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getPersonRepresentation.mockResolvedValue([]);

    const result = await handleGetPersonRepresentation(
      { person_id: 999 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.entity.wikidataId).toBe("Q12345");
    expect(parsed.representation).toEqual([]);
    expect(parsed.coverageNote).toBeTruthy();
  });

  it("falls back to IMDb ID resolution when TMDB ID fails", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
    mockTmdbClient.getPersonDetails.mockResolvedValue({
      imdb_id: "nm0000001",
    });
    mockWikidataClient.resolveByImdbId.mockResolvedValue({
      wikidataId: "Q54321",
      label: "Fred Astaire",
      resolvedVia: "imdb_id",
    });
    mockWikidataClient.getPersonRepresentation.mockResolvedValue([]);

    const result = await handleGetPersonRepresentation(
      { person_id: 1234 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.entity.resolvedVia).toBe("imdb_id");
    expect(mockWikidataClient.resolveByImdbId).toHaveBeenCalledWith("nm0000001");
  });

  it("falls back to name resolution when both ID methods fail", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
    mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
    mockWikidataClient.resolvePersonByName.mockResolvedValue({
      wikidataId: "Q99999",
      label: "Some Actor",
      resolvedVia: "name_search",
    });
    mockWikidataClient.getPersonRepresentation.mockResolvedValue([]);

    const result = await handleGetPersonRepresentation(
      { person_id: 5678, name: "Some Actor" },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.entity.resolvedVia).toBe("name_search");
    expect(mockWikidataClient.resolvePersonByName).toHaveBeenCalledWith("Some Actor");
  });

  it("throws when person cannot be resolved", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
    mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });

    await expect(
      handleGetPersonRepresentation(
        { person_id: 9999 },
        mockTmdbClient as any,
        mockWikidataClient as any
      )
    ).rejects.toThrow("Could not resolve TMDB person 9999 to a Wikidata entity");
  });

  it("handles multiple representation entries", async () => {
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
      wikidataId: "Q12345",
      label: "Multi-Rep Actor",
      resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getPersonRepresentation.mockResolvedValue([
      {
        name: "United Talent Agency",
        wikidataId: "Q7893586",
        type: "talent agency",
        startDate: null,
        endDate: null,
        role: null,
      },
      {
        name: "IMG Models",
        wikidataId: "Q1654129",
        type: "model agency",
        startDate: "2020-01-01",
        endDate: null,
        role: null,
      },
    ]);

    const result = await handleGetPersonRepresentation(
      { person_id: 111 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.representation).toHaveLength(2);
    expect(parsed.representation[0].name).toBe("United Talent Agency");
    expect(parsed.representation[1].name).toBe("IMG Models");
    expect(parsed.representation[1].startDate).toBe("2020-01-01");
  });
});
