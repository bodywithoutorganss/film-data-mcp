// ABOUTME: Tests for reference/utility tools — genres, watch providers, find, collections, companies.
// ABOUTME: Validates Zod schemas for all five reference tools.

import { describe, it, expect } from "vitest";
import {
  GenresSchema,
  WatchProvidersSchema,
  FindByExternalIdSchema,
  CollectionDetailsSchema,
  CompanyDetailsSchema,
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
    for (const source of ["tvdb_id", "facebook_id", "instagram_id", "twitter_id"]) {
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
