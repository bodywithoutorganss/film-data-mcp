// ABOUTME: Tool for extracting festival premiere dates from TMDB release data.
// ABOUTME: Filters release_dates to type 1 (Premiere) entries, sorted chronologically.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";

export const PremieresSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
});

export const festivalPremieresTool = buildToolDef(
  "get_festival_premieres",
  "Get festival premiere dates for a movie. Returns type-1 (Premiere) release dates from TMDB, sorted chronologically. Useful for finding where a film debuted (e.g., Cannes, Venice, Sundance). For full release date details, use movie_details with append: ['release_dates'].",
  PremieresSchema
);

interface Premiere {
  date: string;
  country: string;
  note: string;
  certification: string;
}

export async function handleGetFestivalPremieres(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { movie_id } = PremieresSchema.parse(args);
  const result = await client.getMovieDetails(movie_id, ["release_dates"]);

  const premieres: Premiere[] = [];

  for (const country of result.release_dates?.results ?? []) {
    for (const rd of country.release_dates ?? []) {
      if (rd.type === 1) {
        premieres.push({
          date: rd.release_date?.slice(0, 10) ?? "",
          country: country.iso_3166_1,
          note: rd.note ?? "",
          certification: rd.certification ?? "",
        });
      }
    }
  }

  premieres.sort((a, b) => a.date.localeCompare(b.date));

  return JSON.stringify({
    movie_id,
    title: result.title,
    premieres,
    total: premieres.length,
  }, null, 2);
}
