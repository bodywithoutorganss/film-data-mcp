// ABOUTME: Tests for OMDb API client.
// ABOUTME: Validates IMDb ID lookup, error handling, and response parsing.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OMDbClient } from "../../src/utils/omdb-client.js";

describe("OMDbClient", () => {
    const API_KEY = "test-key";
    let client: OMDbClient;

    beforeEach(() => {
        client = new OMDbClient(API_KEY);
        vi.restoreAllMocks();
    });

    it("fetches movie by IMDb ID", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    Title: "Fight Club",
                    Year: "1999",
                    imdbID: "tt0137523",
                    BoxOffice: "$37,030,102",
                    Response: "True",
                })
            )
        );

        const result = await client.getByImdbId("tt0137523");

        expect(fetch).toHaveBeenCalledWith("https://www.omdbapi.com/?apikey=test-key&i=tt0137523");
        expect(result).toEqual({
            Title: "Fight Club",
            Year: "1999",
            imdbID: "tt0137523",
            BoxOffice: "$37,030,102",
            Response: "True",
        });
    });

    it("returns null when Response is False", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    Response: "False",
                    Error: "Movie not found!",
                })
            )
        );

        const result = await client.getByImdbId("tt9999999");
        expect(result).toBeNull();
    });

    it("returns null on fetch error", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

        const result = await client.getByImdbId("tt0137523");
        expect(result).toBeNull();
    });

    it("returns null on non-OK response", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response("Unauthorized", { status: 401 })
        );

        const result = await client.getByImdbId("tt0137523");
        expect(result).toBeNull();
    });
});
