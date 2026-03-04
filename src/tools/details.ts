// ABOUTME: Detail tools for movies, TV shows, and people with append_to_response bundling.
// ABOUTME: Each detail tool returns comprehensive data in a single API call.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";

// --- Movie Details ---

const movieAppendFields = ["credits", "videos", "images", "watch/providers", "keywords", "recommendations", "similar", "release_dates", "external_ids"] as const;

export const MovieDetailsSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
  append: z
    .array(z.enum(movieAppendFields))
    .optional()
    .describe("Additional data to include: credits, videos, images, watch/providers, keywords, recommendations, similar, release_dates, external_ids"),
});

export const movieDetailsTool = {
  name: "movie_details",
  description:
    "Get full movie details from TMDB. Optionally bundle credits, videos, images, watch providers, and more in a single call using the append parameter.",
  inputSchema: {
    type: "object" as const,
    properties: {
      movie_id: { type: "number", description: "TMDB movie ID" },
      append: {
        type: "array",
        items: {
          type: "string",
          enum: [...movieAppendFields],
        },
        description: "Additional data to include in the response",
      },
    },
    required: ["movie_id"],
  },
};

export async function handleMovieDetails(
  args: z.infer<typeof MovieDetailsSchema>,
  client: TMDBClient
): Promise<string> {
  const { movie_id, append } = MovieDetailsSchema.parse(args);
  const result = await client.getMovieDetails(movie_id, append as string[] | undefined);
  return JSON.stringify(result, null, 2);
}

// --- TV Details ---

const tvAppendFields = ["credits", "aggregate_credits", "videos", "images", "watch/providers", "keywords", "recommendations", "similar", "content_ratings", "external_ids"] as const;

export const TVDetailsSchema = z.object({
  series_id: z.number().int().positive().describe("TMDB TV series ID"),
  append: z
    .array(z.enum(tvAppendFields))
    .optional()
    .describe("Additional data to include: credits, aggregate_credits, videos, images, watch/providers, keywords, recommendations, similar, content_ratings, external_ids"),
});

export const tvDetailsTool = {
  name: "tv_details",
  description:
    "Get full TV series details from TMDB. Optionally bundle credits, videos, images, watch providers, and more in a single call using the append parameter.",
  inputSchema: {
    type: "object" as const,
    properties: {
      series_id: { type: "number", description: "TMDB TV series ID" },
      append: {
        type: "array",
        items: {
          type: "string",
          enum: [...tvAppendFields],
        },
        description: "Additional data to include in the response",
      },
    },
    required: ["series_id"],
  },
};

export async function handleTVDetails(
  args: z.infer<typeof TVDetailsSchema>,
  client: TMDBClient
): Promise<string> {
  const { series_id, append } = TVDetailsSchema.parse(args);
  const result = await client.getTVDetails(series_id, append as string[] | undefined);
  return JSON.stringify(result, null, 2);
}

// --- Person Details ---

const personAppendFields = ["combined_credits", "movie_credits", "tv_credits", "images", "external_ids"] as const;

export const PersonDetailsSchema = z.object({
  person_id: z.number().int().positive().describe("TMDB person ID"),
  append: z
    .array(z.enum(personAppendFields))
    .optional()
    .describe("Additional data to include: combined_credits, movie_credits, tv_credits, images, external_ids"),
});

export const personDetailsTool = {
  name: "person_details",
  description:
    "Get full person details from TMDB including biography, filmography, and external IDs. Use the append parameter to bundle credits and images in a single call.",
  inputSchema: {
    type: "object" as const,
    properties: {
      person_id: { type: "number", description: "TMDB person ID" },
      append: {
        type: "array",
        items: {
          type: "string",
          enum: [...personAppendFields],
        },
        description: "Additional data to include in the response",
      },
    },
    required: ["person_id"],
  },
};

export async function handlePersonDetails(
  args: z.infer<typeof PersonDetailsSchema>,
  client: TMDBClient
): Promise<string> {
  const { person_id, append } = PersonDetailsSchema.parse(args);
  const result = await client.getPersonDetails(person_id, append as string[] | undefined);
  return JSON.stringify(result, null, 2);
}
