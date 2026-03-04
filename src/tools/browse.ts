// ABOUTME: Browsing tools for trending content and curated lists (now playing, popular, etc.).
// ABOUTME: Provides quick access to TMDB's editorial and algorithmic content feeds.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";

// --- Trending ---

export const TrendingSchema = z.object({
  media_type: z.enum(["all", "movie", "tv", "person"]).describe("Type of trending content"),
  time_window: z.enum(["day", "week"]).describe("Time window for trending"),
  page: z.number().int().positive().optional().describe("Page number"),
});

export const trendingTool = buildToolDef(
  "trending",
  "Get trending movies, TV shows, or people. Choose a time window of day or week.",
  TrendingSchema
);

export async function handleTrending(
  args: z.infer<typeof TrendingSchema>,
  client: TMDBClient
): Promise<string> {
  const { media_type, time_window, page } = TrendingSchema.parse(args);
  const result = await client.getTrending(media_type, time_window, page);
  return JSON.stringify(result, null, 2);
}

// --- Curated Lists ---

const CuratedListsBaseSchema = z.object({
  list_type: z
    .enum(["now_playing", "upcoming", "popular", "top_rated", "airing_today"])
    .describe("Type of curated list"),
  media_type: z.enum(["movie", "tv"]).describe("Movie or TV lists"),
  page: z.number().int().positive().optional().describe("Page number"),
  region: z.string().optional().describe("ISO 3166-1 region code (for now_playing and upcoming)"),
});

export const CuratedListsSchema = CuratedListsBaseSchema.refine(
  (data) => !(data.list_type === "airing_today" && data.media_type === "movie"),
  { message: "airing_today is only available for TV" }
).refine(
  (data) => !(["now_playing", "upcoming"].includes(data.list_type) && data.media_type === "tv"),
  { message: "now_playing and upcoming are only available for movies" }
);

export const curatedListsTool = buildToolDef(
  "curated_lists",
  "Browse curated content lists: now playing (movies in theaters), upcoming (movies), popular, top rated, or airing today (TV). Specify movie or TV media type.",
  CuratedListsBaseSchema
);

export async function handleCuratedLists(
  args: z.infer<typeof CuratedListsSchema>,
  client: TMDBClient
): Promise<string> {
  const { list_type, media_type, page, region } = CuratedListsSchema.parse(args);

  let result;
  switch (list_type) {
    case "now_playing":
      result = await client.getNowPlaying(page, region);
      break;
    case "upcoming":
      result = await client.getUpcoming(page, region);
      break;
    case "popular":
      result = await client.getPopular(media_type, page);
      break;
    case "top_rated":
      result = await client.getTopRated(media_type, page);
      break;
    case "airing_today":
      result = await client.getAiringToday(page);
      break;
  }

  return JSON.stringify(result, null, 2);
}
