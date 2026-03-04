// ABOUTME: Tests for reference/utility tools — genres, watch providers, find, collections, companies.
// ABOUTME: Validates Zod schemas for all five reference tools.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GenresSchema,
  WatchProvidersSchema,
  FindByExternalIdSchema,
  CollectionDetailsSchema,
  CompanyDetailsSchema,
  handleGenres,
  handleWatchProviders,
  handleFindByExternalId,
  handleCollectionDetails,
  handleCompanyDetails,
} from "../../src/tools/reference.js";

describe("GenresSchema", () => {
  it("accepts movie genres", () => {
    expect(() => GenresSchema.parse({ media_type: "movie" })).not.toThrow();
  });

  it("accepts TV genres", () => {
    expect(() => GenresSchema.parse({ media_type: "tv" })).not.toThrow();
  });

  it("rejects missing media_type", () => {
    expect(() => GenresSchema.parse({})).toThrow();
  });

  it("rejects invalid media_type", () => {
    expect(() => GenresSchema.parse({ media_type: "person" })).toThrow();
  });
});

describe("WatchProvidersSchema", () => {
  it("accepts movie ID lookup", () => {
    const result = WatchProvidersSchema.parse({ media_type: "movie", id: 550 });
    expect(result.id).toBe(550);
  });

  it("accepts TV ID lookup", () => {
    expect(() =>
      WatchProvidersSchema.parse({ media_type: "tv", id: 1396 })
    ).not.toThrow();
  });

  it("accepts list mode (no id)", () => {
    const result = WatchProvidersSchema.parse({ media_type: "movie" });
    expect(result.id).toBeUndefined();
  });

  it("rejects missing media_type", () => {
    expect(() => WatchProvidersSchema.parse({ id: 550 })).toThrow();
  });

  it("rejects non-positive ID", () => {
    expect(() => WatchProvidersSchema.parse({ media_type: "movie", id: 0 })).toThrow();
  });

  it("accepts region parameter", () => {
    const result = WatchProvidersSchema.parse({ media_type: "movie", id: 550, region: "US" });
    expect(result.region).toBe("US");
  });

  it("accepts lowercase region", () => {
    const result = WatchProvidersSchema.parse({ media_type: "movie", id: 550, region: "us" });
    expect(result.region).toBe("us");
  });

  it("rejects region that is not 2 characters", () => {
    expect(() =>
      WatchProvidersSchema.parse({ media_type: "movie", id: 550, region: "USA" })
    ).toThrow();
  });
});

describe("FindByExternalIdSchema", () => {
  it("accepts IMDb ID", () => {
    const result = FindByExternalIdSchema.parse({
      external_id: "tt0137523",
      source: "imdb_id",
    });
    expect(result.external_id).toBe("tt0137523");
  });

  it("accepts other sources", () => {
    for (const source of ["tvdb_id", "tvrage_id", "freebase_mid", "freebase_id", "facebook_id", "instagram_id", "twitter_id"]) {
      expect(() =>
        FindByExternalIdSchema.parse({ external_id: "123", source })
      ).not.toThrow();
    }
  });

  it("rejects missing external_id", () => {
    expect(() => FindByExternalIdSchema.parse({ source: "imdb_id" })).toThrow();
  });

  it("rejects missing source", () => {
    expect(() => FindByExternalIdSchema.parse({ external_id: "tt0137523" })).toThrow();
  });

  it("rejects invalid source", () => {
    expect(() =>
      FindByExternalIdSchema.parse({ external_id: "123", source: "invalid" })
    ).toThrow();
  });
});

describe("CollectionDetailsSchema", () => {
  it("accepts collection ID", () => {
    const result = CollectionDetailsSchema.parse({ collection_id: 10 });
    expect(result.collection_id).toBe(10);
  });

  it("rejects missing collection_id", () => {
    expect(() => CollectionDetailsSchema.parse({})).toThrow();
  });

  it("rejects non-positive ID", () => {
    expect(() => CollectionDetailsSchema.parse({ collection_id: 0 })).toThrow();
  });
});

describe("CompanyDetailsSchema", () => {
  it("accepts company lookup", () => {
    const result = CompanyDetailsSchema.parse({ id: 1, type: "company" });
    expect(result.type).toBe("company");
  });

  it("accepts network lookup", () => {
    const result = CompanyDetailsSchema.parse({ id: 49, type: "network" });
    expect(result.type).toBe("network");
  });

  it("rejects missing id", () => {
    expect(() => CompanyDetailsSchema.parse({ type: "company" })).toThrow();
  });

  it("rejects missing type", () => {
    expect(() => CompanyDetailsSchema.parse({ id: 1 })).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() => CompanyDetailsSchema.parse({ id: 1, type: "studio" })).toThrow();
  });
});

describe("handleGenres", () => {
  const mockClient = { getGenres: vi.fn() };
  beforeEach(() => { vi.resetAllMocks(); });

  it("calls getGenres with media_type", async () => {
    mockClient.getGenres.mockResolvedValue({ genres: [{ id: 28, name: "Action" }] });
    const result = await handleGenres({ media_type: "movie" }, mockClient as any);
    expect(mockClient.getGenres).toHaveBeenCalledWith("movie");
    const parsed = JSON.parse(result);
    expect(parsed.genres[0].name).toBe("Action");
  });
});

describe("handleWatchProviders", () => {
  const mockClient = {
    getMovieWatchProviders: vi.fn(),
    getTVWatchProviders: vi.fn(),
    getWatchProviderList: vi.fn(),
  };
  beforeEach(() => { vi.resetAllMocks(); });

  it("calls getMovieWatchProviders when media_type=movie and id present", async () => {
    mockClient.getMovieWatchProviders.mockResolvedValue({ id: 550, results: {} });
    const result = await handleWatchProviders({ media_type: "movie", id: 550 }, mockClient as any);
    expect(mockClient.getMovieWatchProviders).toHaveBeenCalledWith(550);
    expect(JSON.parse(result).id).toBe(550);
  });

  it("calls getTVWatchProviders when media_type=tv and id present", async () => {
    mockClient.getTVWatchProviders.mockResolvedValue({ id: 1396, results: {} });
    await handleWatchProviders({ media_type: "tv", id: 1396 }, mockClient as any);
    expect(mockClient.getTVWatchProviders).toHaveBeenCalledWith(1396);
  });

  it("calls getWatchProviderList when no id", async () => {
    mockClient.getWatchProviderList.mockResolvedValue({ results: [] });
    await handleWatchProviders({ media_type: "movie" }, mockClient as any);
    expect(mockClient.getWatchProviderList).toHaveBeenCalledWith("movie");
  });

  it("filters to single region when region is set", async () => {
    mockClient.getMovieWatchProviders.mockResolvedValue({
      id: 550,
      results: {
        US: { link: "https://...", flatrate: [{ provider_name: "Netflix" }] },
        GB: { link: "https://...", flatrate: [{ provider_name: "Prime" }] },
      },
    });

    const result = JSON.parse(
      await handleWatchProviders({ media_type: "movie", id: 550, region: "US" }, mockClient as any)
    );

    expect(result.id).toBe(550);
    expect(result.results).toHaveProperty("US");
    expect(result.results).not.toHaveProperty("GB");
  });

  it("matches region case-insensitively after normalization", async () => {
    mockClient.getMovieWatchProviders.mockResolvedValue({
      id: 550,
      results: {
        US: { link: "https://...", flatrate: [{ provider_name: "Netflix" }] },
      },
    });

    const result = JSON.parse(
      await handleWatchProviders({ media_type: "movie", id: 550, region: "us" }, mockClient as any)
    );

    expect(result.results).toHaveProperty("US");
    expect(result.results.US.flatrate[0].provider_name).toBe("Netflix");
  });

  it("returns empty results with note when region not found", async () => {
    mockClient.getMovieWatchProviders.mockResolvedValue({
      id: 550,
      results: {
        US: { link: "https://...", flatrate: [] },
      },
    });

    const result = JSON.parse(
      await handleWatchProviders({ media_type: "movie", id: 550, region: "JP" }, mockClient as any)
    );

    expect(result.results).toEqual({});
    expect(result._note).toContain("JP");
  });

  it("ignores region when id is omitted", async () => {
    mockClient.getWatchProviderList.mockResolvedValue({ results: [{ provider_name: "Netflix" }] });

    const result = JSON.parse(
      await handleWatchProviders({ media_type: "movie", region: "US" }, mockClient as any)
    );

    expect(result.results).toHaveLength(1);
    expect(mockClient.getWatchProviderList).toHaveBeenCalledWith("movie");
  });
});

describe("handleFindByExternalId", () => {
  const mockClient = { findByExternalId: vi.fn() };
  beforeEach(() => { vi.resetAllMocks(); });

  it("calls findByExternalId with external_id and source", async () => {
    mockClient.findByExternalId.mockResolvedValue({ movie_results: [{ id: 550 }] });
    const result = await handleFindByExternalId({ external_id: "tt0137523", source: "imdb_id" }, mockClient as any);
    expect(mockClient.findByExternalId).toHaveBeenCalledWith("tt0137523", "imdb_id");
    expect(JSON.parse(result).movie_results[0].id).toBe(550);
  });
});

describe("handleCollectionDetails", () => {
  const mockClient = { getCollection: vi.fn() };
  beforeEach(() => { vi.resetAllMocks(); });

  it("calls getCollection with collection_id", async () => {
    mockClient.getCollection.mockResolvedValue({ id: 10, name: "Star Wars Collection" });
    const result = await handleCollectionDetails({ collection_id: 10 }, mockClient as any);
    expect(mockClient.getCollection).toHaveBeenCalledWith(10);
    expect(JSON.parse(result).name).toBe("Star Wars Collection");
  });
});

describe("handleCompanyDetails", () => {
  const mockClient = {
    getCompany: vi.fn(),
    getNetwork: vi.fn(),
  };
  beforeEach(() => { vi.resetAllMocks(); });

  it("calls getCompany for type=company", async () => {
    mockClient.getCompany.mockResolvedValue({ id: 1, name: "Lucasfilm" });
    const result = await handleCompanyDetails({ id: 1, type: "company" }, mockClient as any);
    expect(mockClient.getCompany).toHaveBeenCalledWith(1);
    expect(JSON.parse(result).name).toBe("Lucasfilm");
  });

  it("calls getNetwork for type=network", async () => {
    mockClient.getNetwork.mockResolvedValue({ id: 49, name: "HBO" });
    const result = await handleCompanyDetails({ id: 49, type: "network" }, mockClient as any);
    expect(mockClient.getNetwork).toHaveBeenCalledWith(49);
    expect(JSON.parse(result).name).toBe("HBO");
  });
});
