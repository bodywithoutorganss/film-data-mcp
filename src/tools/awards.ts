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
import { buildToolDef } from "../utils/tool-helpers.js";

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

export const getPersonAwardsTool = buildToolDef(
  "get_person_awards",
  "Get award wins and nominations for a person. Accepts a TMDB person ID. Returns wins, nominations, and the films they were for (where available). Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetPersonAwardsSchema
);

export async function handleGetPersonAwards(
  args: unknown,
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

export const getFilmAwardsTool = buildToolDef(
  "get_film_awards",
  "Get all awards a film has received. Accepts a TMDB movie ID. Returns structured award data with ceremony names and years.",
  GetFilmAwardsSchema
);

export async function handleGetFilmAwards(
  args: unknown,
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

export const getAwardHistoryTool = buildToolDef(
  "get_award_history",
  "Get all winners of a specific award category across all years. Use registry IDs like 'academy-best-cinematography' or 'cannes-palme-dor'. Returns recipients, years, and films.",
  GetAwardHistorySchema
);

export async function handleGetAwardHistory(
  args: unknown,
  _tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { category } = GetAwardHistorySchema.parse(args);
  const cat = findCategory(category);
  if (!cat) throw new Error(`Unknown award category: ${category}`);

  const entries = await wikidataClient.getAwardHistory(cat.wikidataId);

  const groups = new Map<number | null, Array<{ id: string; label: string; forWork?: { wikidataId: string; label: string } }>>();

  for (const entry of entries) {
    const year = entry.year ?? null;
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push({
      id: entry.recipientId,
      label: entry.recipientLabel,
      ...(entry.forWork ? { forWork: entry.forWork } : {}),
    });
  }

  const history = Array.from(groups.entries())
    .sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return b[0] - a[0];
    })
    .map(([year, recipients]) => ({ year, recipients }));

  return JSON.stringify({ category: cat.label, ceremony: cat.ceremony, history }, null, 2);
}

// --- search_awards ---

export const SearchAwardsSchema = z.object({
  query: z.string().min(1).describe("Search query — ceremony name, category, domain, or keyword (e.g., 'cannes', 'cinematography', 'academy-awards')"),
});

export const searchAwardsTool = buildToolDef(
  "search_awards",
  "Search the awards registry by ceremony, category, or domain. Returns matching ceremonies and award categories. Use this to discover available award category IDs for get_award_history.",
  SearchAwardsSchema
);

export async function handleSearchAwards(
  args: unknown,
  _tmdbClient: TMDBClient,
  _wikidataClient: WikidataClient
): Promise<string> {
  const { query } = SearchAwardsSchema.parse(args);
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return JSON.stringify({ ceremonies: [], categories: [] }, null, 2);
  }

  const matchesAll = (fields: string[]) =>
    tokens.every((token) => fields.some((f) => f.includes(token)));

  const matchingCeremonies = CEREMONIES.filter((c) =>
    matchesAll([c.id, c.label.toLowerCase()])
  );

  const matchingCategories = AWARD_CATEGORIES.filter((c) =>
    matchesAll([c.id, c.label.toLowerCase(), c.domain, c.ceremony])
  );

  return JSON.stringify({ ceremonies: matchingCeremonies, categories: matchingCategories }, null, 2);
}
