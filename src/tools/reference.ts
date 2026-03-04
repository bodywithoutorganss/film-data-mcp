// ABOUTME: Reference and utility tools — genres, watch providers, external ID lookup, collections, companies.
// ABOUTME: These tools provide lookup data that supports the core search and detail tools.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";

// --- Genres ---

export const GenresSchema = z.object({
  media_type: z.enum(["movie", "tv"]).describe("Get movie or TV genres"),
});

export const genresTool = {
  name: "genres",
  description: "Get the list of TMDB genre IDs and names for movies or TV. Use this to get genre IDs needed for the discover tool's genre filters.",
  inputSchema: {
    type: "object" as const,
    properties: {
      media_type: { type: "string", enum: ["movie", "tv"], description: "Movie or TV genres" },
    },
    required: ["media_type"],
  },
};

export async function handleGenres(
  args: z.infer<typeof GenresSchema>,
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
});

export const watchProvidersTool = {
  name: "watch_providers",
  description:
    "Get streaming/rent/buy availability for a movie or TV show by region, or list all available watch providers. Powered by JustWatch data.",
  inputSchema: {
    type: "object" as const,
    properties: {
      media_type: { type: "string", enum: ["movie", "tv"], description: "Movie or TV" },
      id: { type: "number", description: "TMDB movie or TV ID. Omit to list all providers" },
    },
    required: ["media_type"],
  },
};

export async function handleWatchProviders(
  args: z.infer<typeof WatchProvidersSchema>,
  client: TMDBClient
): Promise<string> {
  const { media_type, id } = WatchProvidersSchema.parse(args);

  if (id) {
    const result = media_type === "movie"
      ? await client.getMovieWatchProviders(id)
      : await client.getTVWatchProviders(id);
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

export const findByExternalIdTool = {
  name: "find_by_external_id",
  description: "Look up a TMDB movie, TV show, or person using an external ID (IMDb, TVDB, social media). Returns all matching entities.",
  inputSchema: {
    type: "object" as const,
    properties: {
      external_id: { type: "string", description: "External ID (e.g., 'tt0137523' for IMDb)" },
      source: {
        type: "string",
        enum: ["imdb_id", "tvdb_id", "tvrage_id", "freebase_mid", "freebase_id", "facebook_id", "twitter_id", "instagram_id"],
        description: "Source of the external ID",
      },
    },
    required: ["external_id", "source"],
  },
};

export async function handleFindByExternalId(
  args: z.infer<typeof FindByExternalIdSchema>,
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

export const collectionDetailsTool = {
  name: "collection_details",
  description: "Get details about a movie collection/franchise (e.g., Star Wars, Marvel). Returns all movies in the collection with overviews and release dates.",
  inputSchema: {
    type: "object" as const,
    properties: {
      collection_id: { type: "number", description: "TMDB collection ID" },
    },
    required: ["collection_id"],
  },
};

export async function handleCollectionDetails(
  args: z.infer<typeof CollectionDetailsSchema>,
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

export const companyDetailsTool = {
  name: "company_details",
  description: "Get details about a production company (e.g., A24, Lucasfilm) or TV network (e.g., HBO, Netflix). Returns name, headquarters, logo, and parent company.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number", description: "TMDB company or network ID" },
      type: { type: "string", enum: ["company", "network"], description: "Company or network" },
    },
    required: ["id", "type"],
  },
};

export async function handleCompanyDetails(
  args: z.infer<typeof CompanyDetailsSchema>,
  client: TMDBClient
): Promise<string> {
  const { id, type } = CompanyDetailsSchema.parse(args);

  const result = type === "company"
    ? await client.getCompany(id)
    : await client.getNetwork(id);

  return JSON.stringify(result, null, 2);
}
