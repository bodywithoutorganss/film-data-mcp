// ABOUTME: TMDB discover tool — power-query engine with 30+ filters for movies and TV.
// ABOUTME: Maps user-friendly param names to TMDB's dot-notation query params.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { DiscoverMovieParams, DiscoverTVParams } from "../types/tmdb-extended.js";
import { buildToolDef } from "../utils/tool-helpers.js";

export const DiscoverSchema = z.object({
  media_type: z.enum(["movie", "tv"]).describe("Discover movies or TV shows"),
  sort_by: z.string().optional().describe("Sort order, e.g. 'popularity.desc', 'vote_average.desc'"),
  page: z.number().int().positive().optional().describe("Page number"),
  language: z.string().optional().describe("ISO 639-1 language code"),
  include_adult: z.boolean().optional().describe("Include adult content"),

  // Genre filters
  with_genres: z.string().optional().describe("Genre IDs (comma=AND, pipe=OR)"),
  without_genres: z.string().optional().describe("Exclude genre IDs"),

  // Movie date filters
  primary_release_year: z.number().int().optional().describe("Exact release year (movies only)"),
  primary_release_date_gte: z.string().optional().describe("Release date >= YYYY-MM-DD (movies)"),
  primary_release_date_lte: z.string().optional().describe("Release date <= YYYY-MM-DD (movies)"),

  // TV date filters
  first_air_date_year: z.number().int().optional().describe("Exact premiere year (TV only)"),
  first_air_date_gte: z.string().optional().describe("Air date >= YYYY-MM-DD (TV)"),
  first_air_date_lte: z.string().optional().describe("Air date <= YYYY-MM-DD (TV)"),

  // Vote filters
  vote_average_gte: z.number().optional().describe("Minimum vote average (0-10)"),
  vote_average_lte: z.number().optional().describe("Maximum vote average (0-10)"),
  vote_count_gte: z.number().int().optional().describe("Minimum vote count"),

  // People filters
  with_cast: z.string().optional().describe("Person IDs in cast (comma=AND, pipe=OR)"),
  with_crew: z.string().optional().describe("Person IDs in crew"),
  with_people: z.string().optional().describe("Person IDs in cast or crew"),

  // Company/keyword filters
  with_companies: z.string().optional().describe("Production company IDs"),
  without_companies: z.string().optional().describe("Exclude company IDs"),
  with_keywords: z.string().optional().describe("Keyword IDs (comma=AND, pipe=OR). Use search_keywords to find IDs by name. Essential for narrowing broad genres like Documentary (99)"),
  without_keywords: z.string().optional().describe("Exclude keyword IDs (comma-separated). Use search_keywords to find IDs for unwanted themes"),

  // Runtime
  with_runtime_gte: z.number().int().optional().describe("Minimum runtime in minutes"),
  with_runtime_lte: z.number().int().optional().describe("Maximum runtime in minutes"),

  // Language/country
  with_original_language: z.string().optional().describe("ISO 639-1 language code"),
  with_origin_country: z.string().optional().describe("Origin country code"),

  // Watch provider filters
  with_watch_providers: z.string().optional().describe("Watch provider IDs (requires watch_region)"),
  without_watch_providers: z.string().optional().describe("Exclude provider IDs"),
  watch_region: z.string().optional().describe("ISO 3166-1 region for watch providers"),
  with_watch_monetization_types: z.string().optional().describe("Pipe-separated: flatrate|free|ads|rent|buy"),

  // Certification and release type (movie only)
  certification: z.string().optional().describe("Exact certification (requires certification_country)"),
  certification_country: z.string().optional().describe("Country for certification filter"),
  with_release_type: z.number().int().optional().describe("Release type: 1=Premiere, 2=Theatrical Limited, 3=Theatrical, 4=Digital, 5=Physical, 6=TV"),

  // TV-specific
  with_networks: z.string().optional().describe("Network IDs (TV only)"),
  with_status: z.string().optional().describe("TV status: 0=Returning, 1=Planned, 2=InProduction, 3=Ended, 4=Cancelled, 5=Pilot"),
  with_type: z.string().optional().describe("TV type: 0=Documentary, 1=News, 2=Miniseries, 3=Reality, 4=Scripted, 5=TalkShow, 6=Video"),
});

export const discoverTool = buildToolDef(
  "discover",
  "Discover movies or TV shows with 30+ filters. Combine genres, release dates, vote averages, cast/crew, companies, keywords, watch providers, certifications, and more. Use the genres tool for genre IDs and search_keywords for keyword IDs. Note: some genres (especially Documentary, ID 99) are very broad — combine with with_keywords or without_keywords to filter by theme.",
  DiscoverSchema
);

// Maps schema param names (underscores) to TMDB query param names (dots)
const PARAM_MAP: Record<string, string> = {
  primary_release_date_gte: "primary_release_date.gte",
  primary_release_date_lte: "primary_release_date.lte",
  first_air_date_gte: "first_air_date.gte",
  first_air_date_lte: "first_air_date.lte",
  vote_average_gte: "vote_average.gte",
  vote_average_lte: "vote_average.lte",
  vote_count_gte: "vote_count.gte",
  with_runtime_gte: "with_runtime.gte",
  with_runtime_lte: "with_runtime.lte",
};

export async function handleDiscover(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { media_type, ...filters } = DiscoverSchema.parse(args);

  // Convert underscore params to TMDB dot notation
  const tmdbFilters: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      const tmdbKey = PARAM_MAP[key] ?? key;
      tmdbFilters[tmdbKey] = value;
    }
  }

  const result = media_type === "movie"
    ? await client.discoverMovies(tmdbFilters as DiscoverMovieParams)
    : await client.discoverTV(tmdbFilters as DiscoverTVParams);

  return JSON.stringify(result, null, 2);
}
