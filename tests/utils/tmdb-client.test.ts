// ABOUTME: Unit tests for TMDBClient new methods and append_to_response support.
// ABOUTME: Mocks global fetch to test URL construction and response parsing.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  });
}

describe("TMDBClient", () => {
  let client: TMDBClient;

  beforeEach(() => {
    client = new TMDBClient("test-token");
  });

  describe("append_to_response on detail methods", () => {
    it("getMovieDetails appends sub-requests", async () => {
      const fetchMock = mockFetch({ id: 550, title: "Fight Club", credits: { cast: [] } });
      global.fetch = fetchMock;

      await client.getMovieDetails(550, ["credits", "videos"]);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("append_to_response=credits%2Cvideos");
    });

    it("getTVDetails appends sub-requests", async () => {
      const fetchMock = mockFetch({ id: 1396, name: "Breaking Bad" });
      global.fetch = fetchMock;

      await client.getTVDetails(1396, ["credits", "videos"]);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("append_to_response=credits%2Cvideos");
    });

    it("getPersonDetails appends sub-requests", async () => {
      const fetchMock = mockFetch({ id: 287, name: "Brad Pitt" });
      global.fetch = fetchMock;

      await client.getPersonDetails(287, ["combined_credits", "external_ids"]);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("append_to_response=combined_credits%2Cexternal_ids");
    });
  });

  describe("new endpoint methods", () => {
    it("discoverMovies builds correct URL with filters", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 0, total_results: 0 });
      global.fetch = fetchMock;

      await client.discoverMovies({
        sort_by: "popularity.desc",
        with_genres: "28",
        "vote_average.gte": 7.0,
        page: 1,
      });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/discover/movie");
      expect(calledUrl).toContain("sort_by=popularity.desc");
      expect(calledUrl).toContain("with_genres=28");
      expect(calledUrl).toContain("vote_average.gte=7");
    });

    it("discoverTV builds correct URL", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 0, total_results: 0 });
      global.fetch = fetchMock;

      await client.discoverTV({ with_networks: "213", sort_by: "popularity.desc" });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/discover/tv");
      expect(calledUrl).toContain("with_networks=213");
    });

    it("getGenres fetches movie genres", async () => {
      const fetchMock = mockFetch({ genres: [{ id: 28, name: "Action" }] });
      global.fetch = fetchMock;

      const result = await client.getGenres("movie");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/genre/movie/list");
      expect(result.genres).toHaveLength(1);
    });

    it("getGenres fetches TV genres", async () => {
      const fetchMock = mockFetch({ genres: [{ id: 18, name: "Drama" }] });
      global.fetch = fetchMock;

      const result = await client.getGenres("tv");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/genre/tv/list");
    });

    it("findByExternalId looks up by IMDb ID", async () => {
      const fetchMock = mockFetch({
        movie_results: [{ id: 550, title: "Fight Club" }],
        tv_results: [],
        person_results: [],
        tv_episode_results: [],
        tv_season_results: [],
      });
      global.fetch = fetchMock;

      await client.findByExternalId("tt0137523", "imdb_id");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/find/tt0137523");
      expect(calledUrl).toContain("external_source=imdb_id");
    });

    it("getCollection fetches collection details", async () => {
      const fetchMock = mockFetch({ id: 10, name: "Star Wars Collection", parts: [] });
      global.fetch = fetchMock;

      await client.getCollection(10);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/collection/10");
    });

    it("getCompany fetches company details", async () => {
      const fetchMock = mockFetch({ id: 1, name: "Lucasfilm" });
      global.fetch = fetchMock;

      await client.getCompany(1);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/company/1");
    });

    it("getNetwork fetches network details", async () => {
      const fetchMock = mockFetch({ id: 49, name: "HBO" });
      global.fetch = fetchMock;

      await client.getNetwork(49);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/network/49");
    });

    it("getMovieWatchProviders fetches provider data", async () => {
      const fetchMock = mockFetch({ id: 550, results: { US: { flatrate: [] } } });
      global.fetch = fetchMock;

      await client.getMovieWatchProviders(550);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/movie/550/watch/providers");
    });

    it("getTVWatchProviders fetches provider data", async () => {
      const fetchMock = mockFetch({ id: 1396, results: { US: { flatrate: [] } } });
      global.fetch = fetchMock;

      await client.getTVWatchProviders(1396);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/tv/1396/watch/providers");
    });

    it("getWatchProviderList fetches all providers for a media type", async () => {
      const fetchMock = mockFetch({ results: [{ provider_id: 8, provider_name: "Netflix" }] });
      global.fetch = fetchMock;

      await client.getWatchProviderList("movie");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/watch/providers/movie");
    });

    it("getNowPlaying fetches now playing movies", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 1, total_results: 0 });
      global.fetch = fetchMock;

      await client.getNowPlaying();

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/movie/now_playing");
    });

    it("getUpcoming fetches upcoming movies", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 1, total_results: 0 });
      global.fetch = fetchMock;

      await client.getUpcoming();

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/movie/upcoming");
    });

    it("getPopular fetches popular items by media type", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 1, total_results: 0 });
      global.fetch = fetchMock;

      await client.getPopular("movie");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/movie/popular");
    });

    it("getTopRated fetches top rated items by media type", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 1, total_results: 0 });
      global.fetch = fetchMock;

      await client.getTopRated("tv");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/tv/top_rated");
    });

    it("getAiringToday fetches TV airing today", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 1, total_results: 0 });
      global.fetch = fetchMock;

      await client.getAiringToday();

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/tv/airing_today");
    });

    it("searchMulti performs multi-search", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 0, total_results: 0 });
      global.fetch = fetchMock;

      await client.searchMulti("inception");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/search/multi");
      expect(calledUrl).toContain("query=inception");
    });

    it("searchByType searches specific type", async () => {
      const fetchMock = mockFetch({ page: 1, results: [], total_pages: 0, total_results: 0 });
      global.fetch = fetchMock;

      await client.searchByType("movie", "inception");

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/search/movie");
      expect(calledUrl).toContain("query=inception");
    });
  });
});
