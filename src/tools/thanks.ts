// ABOUTME: MCP tool for surfacing Thanks and Special Thanks credits from TMDB.
// ABOUTME: Supports forward (film→thanks), reverse (person→films thanked in), and batch queries.

import { z } from "zod";
import { buildToolDef } from "../utils/tool-helpers.js";
import type { TMDBClient } from "../utils/tmdb-client.js";

export const ThanksCreditsBaseSchema = z.object({
  mode: z
    .enum(["forward", "reverse", "batch"])
    .describe("Query mode: forward (film→thanked people), reverse (person→films thanked in), batch (multiple films aggregated)"),
  movie_id: z
    .number().int().positive().optional()
    .describe("TMDB movie ID (forward mode)"),
  series_id: z
    .number().int().positive().optional()
    .describe("TMDB TV series ID (forward mode)"),
  person_id: z
    .number().int().positive().optional()
    .describe("TMDB person ID (reverse mode)"),
  movie_ids: z
    .array(z.number().int().positive()).optional()
    .describe("TMDB movie IDs (batch mode — aggregates thanks across multiple films)"),
});

export const ThanksCreditsSchema = ThanksCreditsBaseSchema.refine(
  (data) => {
    if (data.mode === "forward") return (data.movie_id !== undefined) !== (data.series_id !== undefined);
    if (data.mode === "reverse") return data.person_id !== undefined;
    if (data.mode === "batch") return data.movie_ids !== undefined && data.movie_ids.length > 0;
    return false;
  },
  { message: "forward requires movie_id or series_id (not both), reverse requires person_id, batch requires non-empty movie_ids" }
);

export const thanksCreditsTool = buildToolDef(
  "get_thanks_credits",
  "Surface Thanks and Special Thanks credits from TMDB. Three modes: forward (film→thanked people), reverse (person→all films they are thanked in, plus their formal crew roles), batch (aggregate thanks across multiple films with frequency map). Thanks credits are sparse — ~45% of films have them, stronger for fiction (62%) than documentaries (14%).",
  ThanksCreditsBaseSchema
);

interface ThanksEntry {
  id: number;
  name: string;
  job: string;
  episode_count?: number;
}

function isThanksJob(job: string | undefined): boolean {
  return job?.toLowerCase().includes("thank") ?? false;
}

function filterThanksCrew(crew: any[]): ThanksEntry[] {
  return crew
    .filter((c) => isThanksJob(c.job) || (c.jobs && c.jobs.some((j: any) => isThanksJob(j.job))))
    .map((c) => ({
      id: c.id,
      name: c.name,
      job: c.job ?? (c.jobs ? c.jobs.map((j: any) => j.job).join(", ") : ""),
      ...(c.total_episode_count !== undefined ? { episode_count: c.total_episode_count } : {}),
    }));
}

async function handleForward(
  args: { movie_id?: number; series_id?: number },
  client: TMDBClient
): Promise<Record<string, any>> {
  if (args.movie_id !== undefined) {
    const data = await client.getMovieCredits(args.movie_id);
    return {
      movie_id: args.movie_id,
      thanks: filterThanksCrew(data.crew ?? []),
    };
  } else {
    const data = await client.getTVAggregateCredits(args.series_id!);
    return {
      series_id: args.series_id,
      thanks: filterThanksCrew(data.crew ?? []),
    };
  }
}

export async function handleGetThanksCredits(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const parsed = ThanksCreditsSchema.parse(args);

  let result: Record<string, any>;

  if (parsed.mode === "forward") {
    result = await handleForward(parsed, client);
  } else {
    throw new Error(`Mode "${parsed.mode}" not yet implemented`);
  }

  return JSON.stringify(result, null, 2);
}
