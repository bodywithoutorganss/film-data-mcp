// ABOUTME: Reference and utility tools — genres, watch providers, external ID lookup, collections, companies.
// ABOUTME: These tools provide lookup data that supports the core search and detail tools.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";
import { filterWatchProviders } from "./details.js";

// --- Genres ---

export const GenresSchema = z.object({
  media_type: z.enum(["movie", "tv"]).describe("Get movie or TV genres"),
});

export const genresTool = buildToolDef(
  "genres",
  "Get the list of TMDB genre IDs and names for movies or TV. Use this to get genre IDs needed for the discover tool's genre filters.",
  GenresSchema
);

export async function handleGenres(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { media_type } = GenresSchema.parse(args);
  const result = await client.getGenres(media_type);
  return JSON.stringify(result, null, 2);
}

// --- Watch Providers ---

export const WatchProvidersSchema = z.object({
  media_type: z.enum(["movie", "tv"]).describe("Movie or TV"),
  id: z.number().int().positive().optional().describe("TMDB movie or TV ID. Omit to list all available providers"),
  region: z
    .string()
    .length(2)
    .optional()
    .describe("ISO 3166-1 country code (e.g., 'US', 'GB'). Filters results to a single region. Recommended to reduce response size."),
});

export const watchProvidersTool = buildToolDef(
  "watch_providers",
  "Get streaming/rent/buy availability for a movie or TV show by region, or list all available watch providers. Powered by JustWatch data. Use the region parameter (e.g., 'US') to get results for a single country — recommended to avoid large responses.",
  WatchProvidersSchema
);

export async function handleWatchProviders(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const parsed = WatchProvidersSchema.parse(args);
  const media_type = parsed.media_type;
  const id = parsed.id;
  const region = parsed.region;

  if (id) {
    const result = media_type === "movie"
      ? await client.getMovieWatchProviders(id)
      : await client.getTVWatchProviders(id);

    filterWatchProviders(result, region);
    return JSON.stringify(result, null, 2);
  }

  const result = await client.getWatchProviderList(media_type);
  return JSON.stringify(result, null, 2);
}

// --- Find by External ID ---

export const FindByExternalIdSchema = z.object({
  external_id: z.string().min(1).describe("The external ID to look up (e.g., IMDb ID like 'tt0137523')"),
  source: z
    .enum(["imdb_id", "tvdb_id", "tvrage_id", "freebase_mid", "freebase_id", "facebook_id", "twitter_id", "instagram_id"])
    .describe("The source of the external ID"),
});

export const findByExternalIdTool = buildToolDef(
  "find_by_external_id",
  "Look up a TMDB movie, TV show, or person using an external ID (IMDb, TVDB, social media). Returns all matching entities.",
  FindByExternalIdSchema
);

export async function handleFindByExternalId(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { external_id, source } = FindByExternalIdSchema.parse(args);
  const result = await client.findByExternalId(external_id, source);
  return JSON.stringify(result, null, 2);
}

// --- Collection Details ---

export const CollectionDetailsSchema = z.object({
  collection_id: z.number().int().positive().describe("TMDB collection ID"),
});

export const collectionDetailsTool = buildToolDef(
  "collection_details",
  "Get details about a movie collection/franchise (e.g., Star Wars, Marvel). Returns all movies in the collection with overviews and release dates.",
  CollectionDetailsSchema
);

export async function handleCollectionDetails(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { collection_id } = CollectionDetailsSchema.parse(args);
  const result = await client.getCollection(collection_id);
  return JSON.stringify(result, null, 2);
}

// --- Company / Network Details ---

export const CompanyDetailsSchema = z.object({
  id: z.number().int().positive().describe("TMDB company or network ID"),
  type: z.enum(["company", "network"]).describe("Whether to look up a production company or TV network"),
});

export const companyDetailsTool = buildToolDef(
  "company_details",
  "Get details about a production company (e.g., A24, Lucasfilm) or TV network (e.g., HBO, Netflix). Returns name, headquarters, logo, and parent company.",
  CompanyDetailsSchema
);

export async function handleCompanyDetails(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { id, type } = CompanyDetailsSchema.parse(args);

  const result = type === "company"
    ? await client.getCompany(id)
    : await client.getNetwork(id);

  return JSON.stringify(result, null, 2);
}
