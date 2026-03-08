// ABOUTME: Tests for get_financials tool.
// ABOUTME: Validates schema, TMDB+OMDb aggregation, null handling, and TMDB-only mode.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetFinancialsSchema, handleGetFinancials } from "../../src/tools/financials.js";

// --- Schema tests ---

describe("GetFinancialsSchema", () => {
    it("accepts movie_id", () => {
        const result = GetFinancialsSchema.parse({ movie_id: 550 });
        expect(result.movie_id).toBe(550);
    });

    it("rejects missing movie_id", () => {
        expect(() => GetFinancialsSchema.parse({})).toThrow();
    });

    it("rejects non-positive movie_id", () => {
        expect(() => GetFinancialsSchema.parse({ movie_id: -1 })).toThrow();
        expect(() => GetFinancialsSchema.parse({ movie_id: 0 })).toThrow();
    });
});

// --- Handler tests ---

describe("handleGetFinancials", () => {
    const mockTmdbClient = {
        getMovieDetails: vi.fn(),
    };

    const mockOmdbClient = {
        getByImdbId: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns TMDB + OMDb data when both available", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 550,
            title: "Fight Club",
            imdb_id: "tt0137523",
            budget: 63000000,
            revenue: 101209702,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue({
            Title: "Fight Club",
            Year: "1999",
            imdbID: "tt0137523",
            BoxOffice: "$37,030,102",
            Response: "True",
        });

        const result = JSON.parse(
            await handleGetFinancials(
                { movie_id: 550 },
                mockTmdbClient as any,
                mockOmdbClient as any
            )
        );

        expect(result.movie).toEqual({
            tmdb_id: 550,
            imdb_id: "tt0137523",
            title: "Fight Club",
        });
        expect(result.financials).toEqual({
            budget: 63000000,
            revenue: 101209702,
            domestic_gross: 37030102,
        });
        expect(result.sources.tmdb).toEqual({ queried: true, had_data: true });
        expect(result.sources.omdb).toEqual({ queried: true, had_data: true });
    });

    it("converts TMDB budget 0 to null", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 489985,
            title: "Minding the Gap",
            imdb_id: "tt7507818",
            budget: 0,
            revenue: 0,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue({
            Title: "Minding the Gap",
            BoxOffice: "N/A",
            Response: "True",
        });

        const result = JSON.parse(
            await handleGetFinancials(
                { movie_id: 489985 },
                mockTmdbClient as any,
                mockOmdbClient as any
            )
        );

        expect(result.financials.budget).toBeNull();
        expect(result.financials.revenue).toBeNull();
        expect(result.financials.domestic_gross).toBeNull();
    });

    it("handles OMDb BoxOffice N/A as null", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 1,
            title: "Test",
            imdb_id: "tt0000001",
            budget: 1000000,
            revenue: 5000000,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue({
            Title: "Test",
            BoxOffice: "N/A",
            Response: "True",
        });

        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 1 }, mockTmdbClient as any, mockOmdbClient as any)
        );

        expect(result.financials.domestic_gross).toBeNull();
        expect(result.sources.omdb).toEqual({ queried: true, had_data: false });
    });

    it("works TMDB-only when omdbClient is null", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 550,
            title: "Fight Club",
            imdb_id: "tt0137523",
            budget: 63000000,
            revenue: 101209702,
        });

        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 550 }, mockTmdbClient as any, null)
        );

        expect(result.financials.budget).toBe(63000000);
        expect(result.financials.revenue).toBe(101209702);
        expect(result.financials.domestic_gross).toBeNull();
        expect(result.sources.omdb).toEqual({ queried: false, had_data: false });
    });

    it("skips OMDb when TMDB has no imdb_id", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 999,
            title: "No IMDB",
            imdb_id: null,
            budget: 500000,
            revenue: 0,
        });

        const result = JSON.parse(
            await handleGetFinancials(
                { movie_id: 999 },
                mockTmdbClient as any,
                mockOmdbClient as any
            )
        );

        expect(mockOmdbClient.getByImdbId).not.toHaveBeenCalled();
        expect(result.financials.domestic_gross).toBeNull();
        expect(result.sources.omdb).toEqual({ queried: false, had_data: false });
    });

    it("handles OMDb returning null gracefully", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 550,
            title: "Fight Club",
            imdb_id: "tt0137523",
            budget: 63000000,
            revenue: 101209702,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue(null);

        const result = JSON.parse(
            await handleGetFinancials(
                { movie_id: 550 },
                mockTmdbClient as any,
                mockOmdbClient as any
            )
        );

        expect(result.financials.domestic_gross).toBeNull();
        expect(result.sources.omdb).toEqual({ queried: true, had_data: false });
    });

    it("parses OMDb BoxOffice string to number", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 1,
            title: "Test",
            imdb_id: "tt0000001",
            budget: 0,
            revenue: 0,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue({
            Title: "Test",
            BoxOffice: "$188,020,017",
            Response: "True",
        });

        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 1 }, mockTmdbClient as any, mockOmdbClient as any)
        );

        expect(result.financials.domestic_gross).toBe(188020017);
    });

    it("converts OMDb BoxOffice $0 to null", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 1,
            title: "Test",
            imdb_id: "tt0000001",
            budget: 1000000,
            revenue: 5000000,
        });
        mockOmdbClient.getByImdbId.mockResolvedValue({
            Title: "Test",
            BoxOffice: "$0",
            Response: "True",
        });

        const result = JSON.parse(
            await handleGetFinancials({ movie_id: 1 }, mockTmdbClient as any, mockOmdbClient as any)
        );

        expect(result.financials.domestic_gross).toBeNull();
        expect(result.sources.omdb).toEqual({ queried: true, had_data: false });
    });

    it("propagates TMDB errors (does not return partial data)", async () => {
        mockTmdbClient.getMovieDetails.mockRejectedValue(new Error("TMDB API error: 404"));

        await expect(
            handleGetFinancials({ movie_id: 999999 }, mockTmdbClient as any, mockOmdbClient as any)
        ).rejects.toThrow("TMDB API error: 404");

        expect(mockOmdbClient.getByImdbId).not.toHaveBeenCalled();
    });

    it("returns valid JSON string", async () => {
        mockTmdbClient.getMovieDetails.mockResolvedValue({
            id: 1,
            title: "Test",
            imdb_id: null,
            budget: 0,
            revenue: 0,
        });

        const raw = await handleGetFinancials({ movie_id: 1 }, mockTmdbClient as any, null);
        expect(() => JSON.parse(raw)).not.toThrow();
    });
});
