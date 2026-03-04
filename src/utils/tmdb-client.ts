// ABOUTME: HTTP client for the TMDB (The Movie Database) API.
// ABOUTME: Provides typed methods for movie, TV, and person endpoints.

/**
 * TMDB API Client
 * Handles all requests to The Movie Database API
 */

import type {
    TMDBMovie,
    TMDBMovieDetails,
    TMDBTVShow,
    TMDBTVShowDetails,
    TMDBPerson,
    TMDBSearchResponse,
    TMDBError,
} from "../types/tmdb.js";
import type {
    DiscoverMovieParams,
    DiscoverTVParams,
    PaginatedResult,
    Genre,
    FindResult,
    CollectionDetails,
    CompanyDetails,
    NetworkDetails,
    WatchProviderResult,
    WatchProvider,
} from "../types/tmdb-extended.js";

export class TMDBClient {
    private readonly baseURL = "https://api.themoviedb.org/3";
    private readonly token: string;

    constructor(token: string) {
        if (!token) {
            throw new Error("TMDB_ACCESS_TOKEN is required");
        }
        this.token = token;
    }

    /**
     * Generic GET request handler
     */
    private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${this.baseURL}${endpoint}`);

        // Add query parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error: TMDBError = await response.json();
            throw new Error(`TMDB API Error: ${error.status_message}`);
        }

        return response.json();
    }

    /**
     * Search for movies
     */
    async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
        return this.get<TMDBSearchResponse<TMDBMovie>>("/search/movie", {
            query,
            page: String(page),
        });
    }

    /**
     * Get movie details by ID
     */
    async getMovieDetails(movieId: number, appendToResponse?: string[]): Promise<TMDBMovieDetails> {
        const params: Record<string, string> = {};
        if (appendToResponse?.length) {
            params.append_to_response = appendToResponse.join(",");
        }
        return this.get<TMDBMovieDetails>(`/movie/${movieId}`, params);
    }

    /**
     * Search for TV shows
     */
    async searchTVShows(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
        return this.get<TMDBSearchResponse<TMDBTVShow>>("/search/tv", {
            query,
            page: String(page),
        });
    }

    /**
     * Get TV show details by ID
     */
    async getTVShowDetails(tvId: number): Promise<TMDBTVShowDetails> {
        return this.get<TMDBTVShowDetails>(`/tv/${tvId}`);
    }

    /**
     * Discover movies with advanced filters
     */
    async discoverMovies(params: DiscoverMovieParams): Promise<PaginatedResult<TMDBMovie>> {
        const queryParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                queryParams[key] = String(value);
            }
        }
        return this.get<PaginatedResult<TMDBMovie>>("/discover/movie", queryParams);
    }

    /**
     * Get movie recommendations based on a movie ID
     */
    async getMovieRecommendations(
        movieId: number,
        page: number = 1
    ): Promise<TMDBSearchResponse<TMDBMovie>> {
        return this.get<TMDBSearchResponse<TMDBMovie>>(`/movie/${movieId}/recommendations`, {
            page: String(page),
        });
    }

    /**
     * Get trending movies, TV shows, or people
     */
    async getTrending(
        mediaType: "all" | "movie" | "tv" | "person",
        timeWindow: "day" | "week",
        page: number = 1
    ): Promise<TMDBSearchResponse<any>> {
        return this.get<TMDBSearchResponse<any>>(`/trending/${mediaType}/${timeWindow}`, {
            page: String(page),
        });
    }

    /**
     * Search for people by name
     */
    async searchPeople(query: string, page: number = 1): Promise<TMDBSearchResponse<any>> {
        return this.get<TMDBSearchResponse<any>>("/search/person", {
            query,
            page: String(page),
        });
    }

    /**
     * Get cast and crew for a movie
     */
    async getMovieCredits(movieId: number): Promise<any> {
        return this.get<any>(`/movie/${movieId}/credits`);
    }

    /**
     * Get person details by ID
     */
    async getPersonDetails(personId: number, appendToResponse?: string[]): Promise<any> {
        const params: Record<string, string> = {};
        if (appendToResponse?.length) {
            params.append_to_response = appendToResponse.join(",");
        }
        return this.get<any>(`/person/${personId}`, params);
    }

    /**
     * Discover TV shows with advanced filters
     */
    async discoverTVShows(params: {
        with_genres?: string;
        with_original_language?: string;
        first_air_date_year?: number;
        "vote_average.gte"?: number;
        "vote_average.lte"?: number;
        sort_by?: string;
        page?: number;
    }): Promise<TMDBSearchResponse<TMDBTVShow>> {
        const queryParams: Record<string, string> = {};

        if (params.with_genres) queryParams.with_genres = params.with_genres;
        if (params.with_original_language)
            queryParams.with_original_language = params.with_original_language;
        if (params.first_air_date_year)
            queryParams.first_air_date_year = String(params.first_air_date_year);
        if (params["vote_average.gte"])
            queryParams["vote_average.gte"] = String(params["vote_average.gte"]);
        if (params["vote_average.lte"])
            queryParams["vote_average.lte"] = String(params["vote_average.lte"]);
        if (params.sort_by) queryParams.sort_by = params.sort_by;
        if (params.page) queryParams.page = String(params.page);

        return this.get<TMDBSearchResponse<TMDBTVShow>>("/discover/tv", queryParams);
    }

    /**
     * Get TV show recommendations based on a TV show ID
     */
    async getTVShowRecommendations(
        tvId: number,
        page: number = 1
    ): Promise<TMDBSearchResponse<TMDBTVShow>> {
        return this.get<TMDBSearchResponse<TMDBTVShow>>(`/tv/${tvId}/recommendations`, {
            page: String(page),
        });
    }

    /**
     * Get cast and crew for a TV show
     */
    async getTVShowCredits(tvId: number): Promise<any> {
        return this.get<any>(`/tv/${tvId}/credits`);
    }

    /**
     * Get TV show details by ID with optional sub-requests
     */
    async getTVDetails(tvId: number, appendToResponse?: string[]): Promise<TMDBTVShowDetails> {
        const params: Record<string, string> = {};
        if (appendToResponse?.length) {
            params.append_to_response = appendToResponse.join(",");
        }
        return this.get<TMDBTVShowDetails>(`/tv/${tvId}`, params);
    }

    /**
     * Discover TV shows with advanced filters
     */
    async discoverTV(params: DiscoverTVParams): Promise<PaginatedResult<TMDBTVShow>> {
        const queryParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                queryParams[key] = String(value);
            }
        }
        return this.get<PaginatedResult<TMDBTVShow>>("/discover/tv", queryParams);
    }

    /**
     * Get genre list for movies or TV
     */
    async getGenres(mediaType: "movie" | "tv"): Promise<{ genres: Genre[] }> {
        return this.get<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
    }

    /**
     * Find TMDB entries by external ID (IMDb, TVDB, etc.)
     */
    async findByExternalId(externalId: string, source: string): Promise<FindResult> {
        return this.get<FindResult>(`/find/${externalId}`, {
            external_source: source,
        });
    }

    /**
     * Get collection details by ID
     */
    async getCollection(collectionId: number): Promise<CollectionDetails> {
        return this.get<CollectionDetails>(`/collection/${collectionId}`);
    }

    /**
     * Get production company details by ID
     */
    async getCompany(companyId: number): Promise<CompanyDetails> {
        return this.get<CompanyDetails>(`/company/${companyId}`);
    }

    /**
     * Get TV network details by ID
     */
    async getNetwork(networkId: number): Promise<NetworkDetails> {
        return this.get<NetworkDetails>(`/network/${networkId}`);
    }

    /**
     * Get watch providers for a movie
     */
    async getMovieWatchProviders(movieId: number): Promise<WatchProviderResult> {
        return this.get<WatchProviderResult>(`/movie/${movieId}/watch/providers`);
    }

    /**
     * Get watch providers for a TV show
     */
    async getTVWatchProviders(tvId: number): Promise<WatchProviderResult> {
        return this.get<WatchProviderResult>(`/tv/${tvId}/watch/providers`);
    }

    /**
     * Get available watch providers for a media type
     */
    async getWatchProviderList(mediaType: "movie" | "tv"): Promise<{ results: WatchProvider[] }> {
        return this.get<{ results: WatchProvider[] }>(`/watch/providers/${mediaType}`);
    }

    /**
     * Get movies currently in theaters
     */
    async getNowPlaying(page: number = 1, region?: string): Promise<PaginatedResult<TMDBMovie>> {
        const params: Record<string, string> = { page: String(page) };
        if (region) params.region = region;
        return this.get<PaginatedResult<TMDBMovie>>("/movie/now_playing", params);
    }

    /**
     * Get upcoming movies
     */
    async getUpcoming(page: number = 1, region?: string): Promise<PaginatedResult<TMDBMovie>> {
        const params: Record<string, string> = { page: String(page) };
        if (region) params.region = region;
        return this.get<PaginatedResult<TMDBMovie>>("/movie/upcoming", params);
    }

    /**
     * Get popular items by media type
     */
    async getPopular(mediaType: "movie" | "tv", page: number = 1): Promise<PaginatedResult<TMDBMovie | TMDBTVShow>> {
        return this.get<PaginatedResult<TMDBMovie | TMDBTVShow>>(`/${mediaType}/popular`, {
            page: String(page),
        });
    }

    /**
     * Get top-rated items by media type
     */
    async getTopRated(mediaType: "movie" | "tv", page: number = 1): Promise<PaginatedResult<TMDBMovie | TMDBTVShow>> {
        return this.get<PaginatedResult<TMDBMovie | TMDBTVShow>>(`/${mediaType}/top_rated`, {
            page: String(page),
        });
    }

    /**
     * Get TV shows airing today
     */
    async getAiringToday(page: number = 1): Promise<PaginatedResult<TMDBTVShow>> {
        return this.get<PaginatedResult<TMDBTVShow>>("/tv/airing_today", {
            page: String(page),
        });
    }

    /**
     * Multi-search across movies, TV, and people
     */
    async searchMulti(query: string, page: number = 1): Promise<PaginatedResult<TMDBMovie | TMDBTVShow | TMDBPerson>> {
        return this.get<PaginatedResult<TMDBMovie | TMDBTVShow | TMDBPerson>>("/search/multi", {
            query,
            page: String(page),
        });
    }

    /**
     * Search by specific media type
     */
    async searchByType(mediaType: "movie" | "tv" | "person" | "company", query: string, page: number = 1): Promise<PaginatedResult<TMDBMovie | TMDBTVShow | TMDBPerson>> {
        return this.get<PaginatedResult<TMDBMovie | TMDBTVShow | TMDBPerson>>(`/search/${mediaType}`, {
            query,
            page: String(page),
        });
    }
}
