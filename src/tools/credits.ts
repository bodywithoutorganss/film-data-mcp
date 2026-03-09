// ABOUTME: Dedicated credits tool with department/job filtering and pagination.
// ABOUTME: Supports both movies (via /credits) and TV series (via /aggregate_credits).

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";
import type { TMDBAggregateCreditsRole, TMDBAggregateCreditsJob } from "../types/tmdb.js";

// BaseSchema for buildToolDef (no .refine() — avoids ZodEffects)
export const CreditsBaseSchema = z.object({
  movie_id: z.number().int().positive().optional().describe("TMDB movie ID (provide movie_id or series_id, not both)"),
  series_id: z.number().int().positive().optional().describe("TMDB TV series ID (provide movie_id or series_id, not both)"),
  type: z
    .enum(["cast", "crew", "all"])
    .optional()
    .default("all")
    .describe("Filter to cast, crew, or all (default: all)"),
  department: z
    .string()
    .optional()
    .describe("Filter crew by department (e.g., 'Camera', 'Production', 'Directing'). Case-insensitive."),
  job: z
    .string()
    .optional()
    .describe("Filter crew by job title (e.g., 'Director of Photography'). Case-insensitive."),
  limit: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(20)
    .describe("Max entries per array. Default 20. Pass 0 for unlimited."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe("Skip this many entries before applying limit. For pagination."),
});

// Refined schema for runtime validation
export const CreditsSchema = CreditsBaseSchema.refine(
  (data) => (data.movie_id !== undefined) !== (data.series_id !== undefined),
  { message: "Provide exactly one of movie_id or series_id" }
);

export const creditsTool = buildToolDef(
  "get_credits",
  "Get full cast and crew credits for a movie or TV series with filtering and pagination. Filter by department (e.g., 'Camera', 'Production') or job title (e.g., 'Director of Photography'). Use offset/limit for pagination. For a quick credits overview, use movie_details or tv_details with append: ['credits'].",
  CreditsBaseSchema
);

interface CastEntry {
  id: number;
  name: string;
  character: string;
  order: number;
  episode_count?: number;
}

interface CrewEntry {
  id: number;
  name: string;
  department: string;
  job: string;
  episode_count?: number;
}

function normalizeTVCast(aggregate: TMDBAggregateCreditsRole[]): CastEntry[] {
  return aggregate.map((person) => ({
    id: person.id,
    name: person.name,
    character: person.roles?.[0]?.character ?? "",
    order: person.order ?? 0,
    episode_count: person.total_episode_count,
  }));
}

function normalizeTVCrew(aggregate: TMDBAggregateCreditsJob[]): CrewEntry[] {
  return aggregate.map((person) => ({
    id: person.id,
    name: person.name,
    department: person.department ?? "",
    job: (person.jobs ?? []).map((j) => j.job).join(", "),
    episode_count: person.total_episode_count,
  }));
}

function paginate<T>(items: T[], offset: number, limit: number): T[] {
  const sliced = items.slice(offset);
  if (limit === 0) return sliced;
  return sliced.slice(0, limit);
}

export async function handleGetCredits(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { movie_id, series_id, type, department, job, limit, offset } = CreditsSchema.parse(args);

  let rawCast: CastEntry[];
  let rawCrew: CrewEntry[];
  let title: string;

  if (movie_id !== undefined) {
    const data = await client.getMovieCredits(movie_id);
    title = data.title ?? "";
    rawCast = data.cast ?? [];
    rawCrew = data.crew ?? [];
  } else {
    const data = await client.getTVAggregateCredits(series_id!);
    title = data.name ?? "";
    rawCast = normalizeTVCast(data.cast ?? []);
    rawCrew = normalizeTVCrew(data.crew ?? []);
  }

  // Apply department/job filters to crew
  if (department) {
    const lower = department.toLowerCase();
    rawCrew = rawCrew.filter((c) => c.department.toLowerCase() === lower);
  }
  if (job) {
    const lower = job.toLowerCase();
    rawCrew = rawCrew.filter((c) => c.job.toLowerCase().includes(lower));
  }

  const includeCast = type === "all" || type === "cast";
  const includeCrew = type === "all" || type === "crew";

  const result: Record<string, any> = {};

  if (movie_id !== undefined) {
    result.movie_id = movie_id;
  } else {
    result.series_id = series_id;
  }
  result.title = title;

  const pagination: Record<string, any> = { offset, limit };

  if (includeCast) {
    pagination.total_cast = rawCast.length;
    result.cast = paginate(rawCast, offset, limit);
  }
  if (includeCrew) {
    pagination.total_crew = rawCrew.length;
    result.crew = paginate(rawCrew, offset, limit);
  }

  result.pagination = pagination;

  return JSON.stringify(result, null, 2);
}
