// ABOUTME: MCP tools for querying film awards data via Wikidata SPARQL.
// ABOUTME: Covers person awards, film awards, award history by category, and registry search.

import { z } from "zod";
import type { TMDBClient } from "../utils/tmdb-client.js";
import type { WikidataClient } from "../utils/wikidata-client.js";
import type { ResolvedEntity } from "../types/wikidata.js";
import {
  findCategory,
  CEREMONIES,
  AWARD_CATEGORIES,
} from "../types/awards-registry.js";

// --- Entity resolution helpers ---

async function resolvePerson(
  tmdbId: number,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<ResolvedEntity> {
  const byTmdb = await wikidataClient.resolvePersonByTmdbId(String(tmdbId));
  if (byTmdb) return byTmdb;

  const person = await tmdbClient.getPersonDetails(tmdbId);
  if (person.imdb_id) {
    const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
    if (byImdb) return byImdb;
  }

  throw new Error(`Could not resolve TMDB person ${tmdbId} to a Wikidata entity`);
}

async function resolveMovie(
  tmdbId: number,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<ResolvedEntity> {
  const byTmdb = await wikidataClient.resolveMovieByTmdbId(String(tmdbId));
  if (byTmdb) return byTmdb;

  const movie = await tmdbClient.getMovieDetails(tmdbId);
  if (movie.imdb_id) {
    const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id);
    if (byImdb) return byImdb;
  }

  throw new Error(`Could not resolve TMDB movie ${tmdbId} to a Wikidata entity`);
}

// --- get_person_awards ---

export const GetPersonAwardsSchema = z.object({
  person_id: z.number().int().positive().describe("TMDB person ID"),
});

export const getPersonAwardsTool = {
  name: "get_person_awards",
  description:
    "Get award wins and nominations for a person. Accepts a TMDB person ID. Returns wins, nominations, and the films they were for (where available). Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  inputSchema: {
    type: "object" as const,
    properties: {
      person_id: { type: "number", description: "TMDB person ID" },
    },
    required: ["person_id"],
  },
};

export async function handleGetPersonAwards(
  args: z.infer<typeof GetPersonAwardsSchema>,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { person_id } = GetPersonAwardsSchema.parse(args);
  const entity = await resolvePerson(person_id, tmdbClient, wikidataClient);
  const [wins, nominations] = await Promise.all([
    wikidataClient.getPersonWins(entity.wikidataId),
    wikidataClient.getPersonNominations(entity.wikidataId),
  ]);
  return JSON.stringify({ entity, wins, nominations }, null, 2);
}

// --- get_film_awards ---

export const GetFilmAwardsSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
});

export const getFilmAwardsTool = {
  name: "get_film_awards",
  description:
    "Get all awards a film has received. Accepts a TMDB movie ID. Returns structured award data with ceremony names and years.",
  inputSchema: {
    type: "object" as const,
    properties: {
      movie_id: { type: "number", description: "TMDB movie ID" },
    },
    required: ["movie_id"],
  },
};

export async function handleGetFilmAwards(
  args: z.infer<typeof GetFilmAwardsSchema>,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { movie_id } = GetFilmAwardsSchema.parse(args);
  const entity = await resolveMovie(movie_id, tmdbClient, wikidataClient);
  const awards = await wikidataClient.getFilmAwards(entity.wikidataId);
  return JSON.stringify({ entity, awards }, null, 2);
}

// --- get_award_history ---

export const GetAwardHistorySchema = z.object({
  category: z.string().describe("Award category ID from the registry (e.g., 'academy-best-cinematography')"),
});

export const getAwardHistoryTool = {
  name: "get_award_history",
  description:
    "Get all winners of a specific award category across all years. Use registry IDs like 'academy-best-cinematography' or 'cannes-palme-dor'. Returns recipients, years, and films.",
  inputSchema: {
    type: "object" as const,
    properties: {
      category: { type: "string", description: "Award category ID (e.g., 'academy-best-cinematography')" },
    },
    required: ["category"],
  },
};

export async function handleGetAwardHistory(
  args: z.infer<typeof GetAwardHistorySchema>,
  _tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { category } = GetAwardHistorySchema.parse(args);
  const cat = findCategory(category);
  if (!cat) throw new Error(`Unknown award category: ${category}`);

  const history = await wikidataClient.getAwardHistory(cat.wikidataId);
  return JSON.stringify({ category: cat.label, ceremony: cat.ceremony, history }, null, 2);
}

// --- search_awards ---

export const SearchAwardsSchema = z.object({
  query: z.string().min(1).describe("Search query — ceremony name, category, domain, or keyword (e.g., 'cannes', 'cinematography', 'academy-awards')"),
});

export const searchAwardsTool = {
  name: "search_awards",
  description:
    "Search the awards registry by ceremony, category, or domain. Returns matching ceremonies and award categories. Use this to discover available award category IDs for get_award_history.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Search query" },
    },
    required: ["query"],
  },
};

export async function handleSearchAwards(
  args: z.infer<typeof SearchAwardsSchema>,
  _tmdbClient: TMDBClient,
  _wikidataClient: WikidataClient
): Promise<string> {
  const { query } = SearchAwardsSchema.parse(args);
  const lowerQuery = query.toLowerCase();

  const matchingCeremonies = CEREMONIES.filter(
    (c) => c.id.includes(lowerQuery) || c.label.toLowerCase().includes(lowerQuery)
  );

  const matchingCategories = AWARD_CATEGORIES.filter(
    (c) =>
      c.id.includes(lowerQuery) ||
      c.label.toLowerCase().includes(lowerQuery) ||
      c.domain.includes(lowerQuery) ||
      c.ceremony.includes(lowerQuery)
  );

  return JSON.stringify({ ceremonies: matchingCeremonies, categories: matchingCategories }, null, 2);
}
