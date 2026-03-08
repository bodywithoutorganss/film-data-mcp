// ABOUTME: MCP tool for aggregating financial data from TMDB and OMDb.
// ABOUTME: Returns budget, revenue, and domestic gross with source attribution.

import { z } from "zod";
import type { TMDBClient } from "../utils/tmdb-client.js";
import type { OMDbClient } from "../utils/omdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";

export const GetFinancialsSchema = z.object({
    movie_id: z.number().int().positive().describe("TMDB movie ID"),
});

export const financialsTool = buildToolDef(
    "get_financials",
    "Get financial data for a movie — budget, worldwide revenue, and domestic box office gross. Aggregates from TMDB and OMDb. Returns null for unavailable data points with source attribution showing which databases were queried.",
    GetFinancialsSchema
);

function parseBoxOffice(value: string | undefined): number | null {
    if (!value || value === "N/A") return null;
    const cleaned = value.replace(/[$,]/g, "");
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? null : parsed;
}

function zeroToNull(value: number): number | null {
    return value === 0 ? null : value;
}

export async function handleGetFinancials(
    args: unknown,
    tmdbClient: TMDBClient,
    omdbClient: OMDbClient | null
): Promise<string> {
    const { movie_id } = GetFinancialsSchema.parse(args);

    const movie = await tmdbClient.getMovieDetails(movie_id);

    const budget = zeroToNull(movie.budget);
    const revenue = zeroToNull(movie.revenue);
    const tmdbHadData = budget !== null || revenue !== null;

    let domesticGross: number | null = null;
    let omdbQueried = false;
    let omdbHadData = false;

    if (omdbClient && movie.imdb_id) {
        omdbQueried = true;
        const omdbData = await omdbClient.getByImdbId(movie.imdb_id);
        if (omdbData) {
            const parsed = parseBoxOffice(omdbData.BoxOffice);
            domesticGross = parsed !== null ? zeroToNull(parsed) : null;
            omdbHadData = domesticGross !== null;
        }
    }

    const result = {
        movie: {
            tmdb_id: movie_id,
            imdb_id: movie.imdb_id,
            title: movie.title,
        },
        financials: {
            budget,
            revenue,
            domestic_gross: domesticGross,
        },
        sources: {
            tmdb: { queried: true as const, had_data: tmdbHadData },
            omdb: { queried: omdbQueried, had_data: omdbHadData },
        },
    };

    return JSON.stringify(result, null, 2);
}
