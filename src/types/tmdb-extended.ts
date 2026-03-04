// ABOUTME: Extended TMDB response types for redesigned tool surface.
// ABOUTME: Covers discover, genres, watch providers, collections, companies, networks, and find results.

// --- Shared ---

export interface PaginatedResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

// --- Watch Providers ---

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface WatchProviderRegionResult {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface WatchProviderResult {
  id: number;
  results: Record<string, WatchProviderRegionResult>;
}

// --- Collections ---

export interface CollectionPart {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: CollectionPart[];
}

// --- Companies & Networks ---

export interface CompanyDetails {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
  parent_company: { name: string; id: number; logo_path: string | null } | null;
}

export interface NetworkDetails {
  id: number;
  name: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
}

// --- Find (External ID Lookup) ---

export interface FindResult {
  movie_results: Array<{ id: number; title: string; release_date: string; overview: string }>;
  tv_results: Array<{ id: number; name: string; first_air_date: string; overview: string }>;
  person_results: Array<{ id: number; name: string; known_for_department: string }>;
  tv_episode_results: Array<{ id: number; name: string; episode_number: number; season_number: number }>;
  tv_season_results: Array<{ id: number; name: string; season_number: number }>;
}

// --- Discover Params ---

export interface DiscoverMovieParams {
  sort_by?: string;
  page?: number;
  language?: string;
  include_adult?: boolean;
  with_genres?: string;
  without_genres?: string;
  primary_release_year?: number;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "vote_count.gte"?: number;
  with_cast?: string;
  with_crew?: string;
  with_people?: string;
  with_companies?: string;
  without_companies?: string;
  with_keywords?: string;
  without_keywords?: string;
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;
  with_original_language?: string;
  with_origin_country?: string;
  with_watch_providers?: string;
  without_watch_providers?: string;
  watch_region?: string;
  with_watch_monetization_types?: string;
  certification?: string;
  certification_country?: string;
  with_release_type?: number;
}

export interface DiscoverTVParams {
  sort_by?: string;
  page?: number;
  language?: string;
  include_adult?: boolean;
  with_genres?: string;
  without_genres?: string;
  first_air_date_year?: number;
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "vote_count.gte"?: number;
  with_companies?: string;
  with_keywords?: string;
  with_networks?: string;
  with_status?: string;
  with_type?: string;
  with_original_language?: string;
  with_watch_providers?: string;
  watch_region?: string;
  with_watch_monetization_types?: string;
}
