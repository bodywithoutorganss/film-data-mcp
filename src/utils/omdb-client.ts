// ABOUTME: HTTP client for the OMDb (Open Movie Database) API.
// ABOUTME: Provides IMDb ID lookup with graceful error handling.

import type { OMDbMovie } from "../types/omdb.js";

export class OMDbClient {
    private readonly baseURL = "https://www.omdbapi.com/";
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getByImdbId(imdbId: string): Promise<OMDbMovie | null> {
        try {
            const url = `${this.baseURL}?apikey=${this.apiKey}&i=${imdbId}`;
            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (data.Response === "False") {
                return null;
            }

            return data as OMDbMovie;
        } catch {
            return null;
        }
    }
}
