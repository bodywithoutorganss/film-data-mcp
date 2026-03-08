// ABOUTME: MCP tool for surfacing Thanks and Special Thanks credits from TMDB.
// ABOUTME: Supports forward (film→thanks), reverse (person→films thanked in), and batch queries.

import { z } from "zod";
import { buildToolDef } from "../utils/tool-helpers.js";

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
