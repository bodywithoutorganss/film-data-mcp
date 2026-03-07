// ABOUTME: MCP tools for querying film awards data via Wikidata SPARQL.
// ABOUTME: Covers person awards, film awards, award history by category, and registry search.

import { z } from "zod";
import type { TMDBClient } from "../utils/tmdb-client.js";
import type { WikidataClient } from "../utils/wikidata-client.js";
import type { ResolvedEntity, CrewNominationEntry, WikidataNomination } from "../types/wikidata.js";
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
  wikidataClient: WikidataClient,
  name?: string
): Promise<ResolvedEntity> {
  const byTmdb = await wikidataClient.resolvePersonByTmdbId(String(tmdbId));
  if (byTmdb) return byTmdb;

  const person = await tmdbClient.getPersonDetails(tmdbId);
  if (person.imdb_id) {
    const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
    if (byImdb) return byImdb;
  }

  if (name) {
    const byName = await wikidataClient.resolvePersonByName(name);
    if (byName) return byName;
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
  name: z.string().optional().describe("Person name — used as fallback if TMDB/IMDb ID resolution fails"),
});

export const getPersonAwardsTool = buildToolDef(
  "get_person_awards",
  "Get award wins and nominations for a person. Accepts a TMDB person ID and optional name (used as fallback if ID resolution fails). Returns wins, nominations, and a completeness indicator showing total P166 claims vs. registered awards. Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetPersonAwardsSchema
);

export async function handleGetPersonAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { person_id, name } = GetPersonAwardsSchema.parse(args);
  const entity = await resolvePerson(person_id, tmdbClient, wikidataClient, name);
  const [wins, nominations, p166ClaimCount] = await Promise.all([
    wikidataClient.getPersonWins(entity.wikidataId),
    wikidataClient.getPersonNominations(entity.wikidataId),
    wikidataClient.countAllP166Claims(entity.wikidataId),
  ]);
  return JSON.stringify({
    entity,
    wins,
    nominations,
    completeness: {
      entityFound: true,
      p166ClaimCount,
      registeredAwardCount: wins.length,
    },
  }, null, 2);
}

// --- get_film_awards ---

export const GetFilmAwardsSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
});

export const getFilmAwardsTool = buildToolDef(
  "get_film_awards",
  "Get all awards a film has received. Accepts a TMDB movie ID. Returns structured award data with ceremony names and years, crew P1411 nominations (from directors, producers, writers, composers, cinematographers, editors, and other award-relevant crew filtered to this film), and a completeness indicator showing total P166 claims vs. registered awards. Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetFilmAwardsSchema
);

const AWARD_RELEVANT_JOBS = new Set([
  "Director", "Producer", "Executive Producer", "Writer", "Screenplay",
  "Director of Photography", "Editor", "Original Music Composer",
]);

function isAwardRelevantJob(job: string): boolean {
  return AWARD_RELEVANT_JOBS.has(job) || job.includes("Producer");
}

interface CrewNominationsResult {
  crewNominations: CrewNominationEntry[];
  resolvedCrew: Array<{
    name: string;
    roles: string[];
    wikidataId: string;
    totalWins: number;
    totalNominations: number;
    byCeremony: Record<string, { wins: number; nominations: number }>;
  }>;
  skippedCrew: Array<{ name: string; roles: string[]; reason: string }>;
}

async function getFilmCrewNominations(
  movieId: number,
  filmWikidataId: string,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<CrewNominationsResult> {
  const details = await tmdbClient.getMovieDetails(movieId, ["credits"]);
  const credits = (details as any).credits;
  if (!credits?.crew) return { crewNominations: [], resolvedCrew: [], skippedCrew: [] };

  // Deduplicate by TMDB person ID, merging roles
  const crewById = new Map<number, { id: number; name: string; roles: string[] }>();
  for (const member of credits.crew) {
    if (!isAwardRelevantJob(member.job)) continue;
    const existing = crewById.get(member.id);
    if (existing) {
      if (!existing.roles.includes(member.job)) {
        existing.roles.push(member.job);
      }
    } else {
      crewById.set(member.id, { id: member.id, name: member.name, roles: [member.job] });
    }
  }

  const intermediateResolved: Array<{
    name: string;
    roles: string[];
    wikidataId: string;
    allNominations: WikidataNomination[];
  }> = [];
  const skippedCrew: Array<{ name: string; roles: string[]; reason: string }> = [];

  const results = await Promise.all(
    [...crewById.values()].map(async (member) => {
      let entity: ResolvedEntity | null = null;
      try {
        entity = await resolvePerson(member.id, tmdbClient, wikidataClient, member.name);
      } catch {
        skippedCrew.push({ name: member.name, roles: member.roles, reason: "unresolvable" });
        return null;
      }

      const nominations = await wikidataClient.getPersonNominations(entity.wikidataId);
      const filmNominations = nominations.filter(
        (n) => n.forWork?.wikidataId === filmWikidataId
      );

      if (filmNominations.length === 0) {
        intermediateResolved.push({
          name: member.name,
          roles: member.roles,
          wikidataId: entity.wikidataId,
          allNominations: nominations,
        });
        return null;
      }

      return {
        person: { name: member.name, roles: member.roles },
        nominations: filmNominations,
      };
    })
  );

  // Second pass: fetch wins and build enriched output for resolved crew
  const resolvedCrew = await Promise.all(
    intermediateResolved.map(async (member) => {
      let wins: Awaited<ReturnType<typeof wikidataClient.getPersonWins>> = [];
      try {
        wins = await wikidataClient.getPersonWins(member.wikidataId);
      } catch {
        // Wins enrichment failed; degrade gracefully with nominations only
      }
      const byCeremony: Record<string, { wins: number; nominations: number }> = {};
      for (const win of wins) {
        if (!byCeremony[win.ceremony]) byCeremony[win.ceremony] = { wins: 0, nominations: 0 };
        byCeremony[win.ceremony].wins++;
      }
      for (const nom of member.allNominations) {
        if (!byCeremony[nom.ceremony]) byCeremony[nom.ceremony] = { wins: 0, nominations: 0 };
        byCeremony[nom.ceremony].nominations++;
      }
      return {
        name: member.name,
        roles: member.roles,
        wikidataId: member.wikidataId,
        totalWins: wins.length,
        totalNominations: member.allNominations.length,
        byCeremony,
      };
    })
  );

  return {
    crewNominations: results.filter((r): r is NonNullable<typeof r> => r !== null),
    resolvedCrew,
    skippedCrew,
  };
}

export async function handleGetFilmAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { movie_id } = GetFilmAwardsSchema.parse(args);
  const entity = await resolveMovie(movie_id, tmdbClient, wikidataClient);
  const [awards, p166ClaimCount, crewResult] = await Promise.all([
    wikidataClient.getFilmAwards(entity.wikidataId),
    wikidataClient.countAllP166Claims(entity.wikidataId),
    getFilmCrewNominations(movie_id, entity.wikidataId, tmdbClient, wikidataClient),
  ]);
  return JSON.stringify({
    entity,
    awards,
    crewNominations: crewResult.crewNominations,
    ...(crewResult.resolvedCrew.length > 0 ? { resolvedCrew: crewResult.resolvedCrew } : {}),
    ...(crewResult.skippedCrew.length > 0 ? { skippedCrew: crewResult.skippedCrew } : {}),
    completeness: {
      entityFound: true,
      p166ClaimCount,
      registeredAwardCount: awards.length,
    },
  }, null, 2);
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
