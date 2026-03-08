// ABOUTME: Integration tests for get_financials against live TMDB + OMDb APIs.
// ABOUTME: Requires TMDB_ACCESS_TOKEN and optionally OMDB_API_KEY env vars.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { OMDbClient } from "../../src/utils/omdb-client.js";
import { handleGetFinancials } from "../../src/tools/financials.js";

const tmdbToken = process.env.TMDB_ACCESS_TOKEN;
const omdbKey = process.env.OMDB_API_KEY;

describe("get_financials integration", () => {
    const tmdbClient = new TMDBClient(tmdbToken!);
    const omdbClient = omdbKey ? new OMDbClient(omdbKey) : null;

    it("returns financial data for Fight Club (550)", async () => {
        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 550 }, tmdbClient, omdbClient)
        );

        expect(result.movie.tmdb_id).toBe(550);
        expect(result.movie.title).toBe("Fight Club");
        expect(result.movie.imdb_id).toBe("tt0137523");
        expect(result.sources.tmdb.queried).toBe(true);
        expect(result.sources.tmdb.had_data).toBe(true);
        // TMDB has budget and revenue for Fight Club
        expect(result.financials.budget).toBeGreaterThan(0);
        expect(result.financials.revenue).toBeGreaterThan(0);

        if (omdbClient) {
            expect(result.sources.omdb.queried).toBe(true);
            // OMDb has domestic gross for Fight Club
            expect(result.financials.domestic_gross).toBeGreaterThan(0);
        }
    }, 30000);

    it("handles documentary with sparse data (Minding the Gap, 489985)", async () => {
        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 489985 }, tmdbClient, omdbClient)
        );

        expect(result.movie.tmdb_id).toBe(489985);
        expect(result.movie.title).toContain("Minding the Gap");
        // Docs typically have null budget/revenue
        expect(result.sources.tmdb.queried).toBe(true);
    }, 30000);
});
