# Phase 5: Integration Tests — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add handler-level unit tests for all 12 TMDB tools, live API integration tests, and dispatch verification tests.

**Architecture:** Extend existing per-tool test files with handler `describe` blocks using mocked TMDBClient. New `tests/integration/` directory for live API tests (opt-in via env var) and dispatch wiring verification.

**Tech Stack:** Vitest, vi.fn() mocks, Zod schemas, TMDBClient, WikidataClient

---

## Conventions

**Import paths:** `../../src/tools/<file>.js` (not `../src/`)

**Mock TMDBClient pattern:** Object with `vi.fn()` for each method the handler calls. Cast as `any` when passing to handler.

**Handler signature:** `handleX(args, client: TMDBClient) → Promise<string>` (TMDB tools) or `handleX(args, tmdbClient, wikidataClient) → Promise<string>` (awards tools).

**All handlers:** Parse args via Zod internally, call client method(s), return `JSON.stringify(result, null, 2)`.

**Test assertion pattern:** Call handler → `JSON.parse(result)` → assert structure. Also verify mock was called with expected args via `expect(mock).toHaveBeenCalledWith(...)`.

---

## Task 1: Handler tests for search.test.ts

**Files:**
- Modify: `tests/tools/search.test.ts`

**Step 1: Write failing tests**

Add this after the existing `SearchSchema` describe block in `tests/tools/search.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchSchema, handleSearch } from "../../src/tools/search.js";

// (keep existing SearchSchema tests)

describe("handleSearch", () => {
  const mockClient = {
    searchMulti: vi.fn(),
    searchByType: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls searchMulti when no type specified", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [{ id: 1, title: "Test" }], page: 1, total_results: 1 });

    const result = await handleSearch({ query: "test" }, mockClient as any);

    expect(mockClient.searchMulti).toHaveBeenCalledWith("test", undefined);
    expect(mockClient.searchByType).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(1);
  });

  it("calls searchByType when type specified", async () => {
    mockClient.searchByType.mockResolvedValue({ results: [{ id: 550, title: "Fight Club" }], page: 1, total_results: 1 });

    const result = await handleSearch({ query: "fight club", type: "movie" }, mockClient as any);

    expect(mockClient.searchByType).toHaveBeenCalledWith("movie", "fight club", undefined);
    expect(mockClient.searchMulti).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.results[0].id).toBe(550);
  });

  it("forwards page parameter", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [], page: 3, total_results: 100 });

    await handleSearch({ query: "test", page: 3 }, mockClient as any);

    expect(mockClient.searchMulti).toHaveBeenCalledWith("test", 3);
  });

  it("returns valid JSON string", async () => {
    mockClient.searchMulti.mockResolvedValue({ results: [] });

    const result = await handleSearch({ query: "test" }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("rejects invalid args via Zod", async () => {
    await expect(handleSearch({ query: "" }, mockClient as any)).rejects.toThrow();
  });
});
```

Note: the existing file imports only `SearchSchema`. Update the import line to also import `handleSearch`.

**Step 2: Run tests to verify they fail**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/search.test.ts`
Expected: New handler tests should fail (import doesn't include `handleSearch` yet — once import is added, they should pass since we're adding tests for existing code).

Actually — these handlers already exist. The tests should pass immediately once imports are correct. The "failing" step in TDD applies when writing new code. Here we're adding coverage for existing code. Just verify they pass.

**Step 3: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/search.test.ts`
Expected: All tests pass (existing 7 schema + 5 new handler = 12)

**Step 4: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/tools/search.test.ts
git commit -m "Add handler tests for search tool"
```

---

## Task 2: Handler tests for details.test.ts

**Files:**
- Modify: `tests/tools/details.test.ts`

**Step 1: Add handler tests**

Update import to include `handleMovieDetails, handleTVDetails, handlePersonDetails` and add `vi, beforeEach` to vitest imports. Add after existing describe blocks:

```typescript
describe("handleMovieDetails", () => {
  const mockClient = {
    getMovieDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getMovieDetails with movie_id", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club" });

    const result = await handleMovieDetails({ movie_id: 550 }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(550, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe("Fight Club");
  });

  it("forwards append fields", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club", credits: { cast: [] } });

    await handleMovieDetails({ movie_id: 550, append: ["credits", "videos"] }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(550, ["credits", "videos"]);
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieDetails.mockResolvedValue({ id: 1 });

    const result = await handleMovieDetails({ movie_id: 1 }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe("handleTVDetails", () => {
  const mockClient = {
    getTVDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getTVDetails with series_id", async () => {
    mockClient.getTVDetails.mockResolvedValue({ id: 1396, name: "Breaking Bad" });

    const result = await handleTVDetails({ series_id: 1396 }, mockClient as any);

    expect(mockClient.getTVDetails).toHaveBeenCalledWith(1396, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Breaking Bad");
  });

  it("forwards append fields", async () => {
    mockClient.getTVDetails.mockResolvedValue({ id: 1396, name: "Breaking Bad" });

    await handleTVDetails({ series_id: 1396, append: ["credits", "videos"] }, mockClient as any);

    expect(mockClient.getTVDetails).toHaveBeenCalledWith(1396, ["credits", "videos"]);
  });
});

describe("handlePersonDetails", () => {
  const mockClient = {
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getPersonDetails with person_id", async () => {
    mockClient.getPersonDetails.mockResolvedValue({ id: 5914, name: "Roger Deakins" });

    const result = await handlePersonDetails({ person_id: 5914 }, mockClient as any);

    expect(mockClient.getPersonDetails).toHaveBeenCalledWith(5914, undefined);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Roger Deakins");
  });

  it("forwards append fields", async () => {
    mockClient.getPersonDetails.mockResolvedValue({ id: 5914, name: "Roger Deakins" });

    await handlePersonDetails({ person_id: 5914, append: ["combined_credits", "images"] }, mockClient as any);

    expect(mockClient.getPersonDetails).toHaveBeenCalledWith(5914, ["combined_credits", "images"]);
  });
});
```

**Step 2: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/details.test.ts`
Expected: All pass (existing 9 schema + 7 new handler = 16)

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/tools/details.test.ts
git commit -m "Add handler tests for details tools (movie, TV, person)"
```

---

## Task 3: Handler tests for discover.test.ts

**Files:**
- Modify: `tests/tools/discover.test.ts`

This is the most important handler test — the PARAM_MAP underscore→dot conversion is the only logic that's non-trivial.

**Step 1: Add handler tests**

Update import to include `handleDiscover`. Add `vi, beforeEach` to vitest imports:

```typescript
describe("handleDiscover", () => {
  const mockClient = {
    discoverMovies: vi.fn(),
    discoverTV: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls discoverMovies for movie media_type", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [], page: 1, total_results: 0 });

    await handleDiscover({ media_type: "movie" }, mockClient as any);

    expect(mockClient.discoverMovies).toHaveBeenCalled();
    expect(mockClient.discoverTV).not.toHaveBeenCalled();
  });

  it("calls discoverTV for tv media_type", async () => {
    mockClient.discoverTV.mockResolvedValue({ results: [], page: 1, total_results: 0 });

    await handleDiscover({ media_type: "tv" }, mockClient as any);

    expect(mockClient.discoverTV).toHaveBeenCalled();
    expect(mockClient.discoverMovies).not.toHaveBeenCalled();
  });

  it("converts underscore params to TMDB dot notation via PARAM_MAP", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "movie",
      primary_release_date_gte: "2020-01-01",
      primary_release_date_lte: "2020-12-31",
      vote_average_gte: 7.0,
      vote_count_gte: 100,
    }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    expect(passedFilters["primary_release_date.gte"]).toBe("2020-01-01");
    expect(passedFilters["primary_release_date.lte"]).toBe("2020-12-31");
    expect(passedFilters["vote_average.gte"]).toBe(7.0);
    expect(passedFilters["vote_count.gte"]).toBe(100);
    // Verify the underscore keys are NOT present
    expect(passedFilters["primary_release_date_gte"]).toBeUndefined();
  });

  it("passes non-mapped keys through unchanged", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "movie",
      sort_by: "popularity.desc",
      with_genres: "28,12",
    }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    expect(passedFilters["sort_by"]).toBe("popularity.desc");
    expect(passedFilters["with_genres"]).toBe("28,12");
  });

  it("omits undefined values from filter object", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [] });

    await handleDiscover({ media_type: "movie", page: 2 }, mockClient as any);

    const passedFilters = mockClient.discoverMovies.mock.calls[0][0];
    // Only page should be present; media_type is stripped, other optional fields are undefined
    expect(passedFilters).toEqual({ page: 2 });
  });

  it("converts TV-specific date params", async () => {
    mockClient.discoverTV.mockResolvedValue({ results: [] });

    await handleDiscover({
      media_type: "tv",
      first_air_date_gte: "2023-01-01",
      first_air_date_lte: "2023-12-31",
    }, mockClient as any);

    const passedFilters = mockClient.discoverTV.mock.calls[0][0];
    expect(passedFilters["first_air_date.gte"]).toBe("2023-01-01");
    expect(passedFilters["first_air_date.lte"]).toBe("2023-12-31");
  });

  it("returns valid JSON string", async () => {
    mockClient.discoverMovies.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleDiscover({ media_type: "movie" }, mockClient as any);

    expect(() => JSON.parse(result)).not.toThrow();
  });
});
```

**Step 2: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/discover.test.ts`
Expected: All pass (existing 8 schema + 7 new handler = 15)

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/tools/discover.test.ts
git commit -m "Add handler tests for discover tool including PARAM_MAP verification"
```

---

## Task 4: Handler tests for browse.test.ts

**Files:**
- Modify: `tests/tools/browse.test.ts`

**Step 1: Add handler tests**

Update import to include `handleTrending, handleCuratedLists`. Add `vi, beforeEach`:

```typescript
describe("handleTrending", () => {
  const mockClient = {
    getTrending: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getTrending with all params", async () => {
    mockClient.getTrending.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleTrending(
      { media_type: "movie", time_window: "week" },
      mockClient as any
    );

    expect(mockClient.getTrending).toHaveBeenCalledWith("movie", "week", undefined);
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(1);
  });

  it("forwards page parameter", async () => {
    mockClient.getTrending.mockResolvedValue({ results: [] });

    await handleTrending(
      { media_type: "all", time_window: "day", page: 2 },
      mockClient as any
    );

    expect(mockClient.getTrending).toHaveBeenCalledWith("all", "day", 2);
  });
});

describe("handleCuratedLists", () => {
  const mockClient = {
    getNowPlaying: vi.fn(),
    getUpcoming: vi.fn(),
    getPopular: vi.fn(),
    getTopRated: vi.fn(),
    getAiringToday: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("routes now_playing to getNowPlaying", async () => {
    mockClient.getNowPlaying.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "now_playing", media_type: "movie" },
      mockClient as any
    );

    expect(mockClient.getNowPlaying).toHaveBeenCalledWith(undefined, undefined);
  });

  it("routes upcoming to getUpcoming with region", async () => {
    mockClient.getUpcoming.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "upcoming", media_type: "movie", region: "US" },
      mockClient as any
    );

    expect(mockClient.getUpcoming).toHaveBeenCalledWith(undefined, "US");
  });

  it("routes popular to getPopular with media_type", async () => {
    mockClient.getPopular.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "popular", media_type: "tv" },
      mockClient as any
    );

    expect(mockClient.getPopular).toHaveBeenCalledWith("tv", undefined);
  });

  it("routes top_rated to getTopRated", async () => {
    mockClient.getTopRated.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "top_rated", media_type: "movie" },
      mockClient as any
    );

    expect(mockClient.getTopRated).toHaveBeenCalledWith("movie", undefined);
  });

  it("routes airing_today to getAiringToday", async () => {
    mockClient.getAiringToday.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "airing_today", media_type: "tv" },
      mockClient as any
    );

    expect(mockClient.getAiringToday).toHaveBeenCalledWith(undefined);
  });

  it("forwards page to getNowPlaying", async () => {
    mockClient.getNowPlaying.mockResolvedValue({ results: [] });

    await handleCuratedLists(
      { list_type: "now_playing", media_type: "movie", page: 3 },
      mockClient as any
    );

    expect(mockClient.getNowPlaying).toHaveBeenCalledWith(3, undefined);
  });

  it("returns valid JSON string", async () => {
    mockClient.getPopular.mockResolvedValue({ results: [{ id: 1 }] });

    const result = await handleCuratedLists(
      { list_type: "popular", media_type: "movie" },
      mockClient as any
    );

    expect(() => JSON.parse(result)).not.toThrow();
  });
});
```

**Step 2: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/browse.test.ts`
Expected: All pass (existing 10 schema + 9 new handler = 19)

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/tools/browse.test.ts
git commit -m "Add handler tests for trending and curated_lists tools"
```

---

## Task 5: Handler tests for reference.test.ts

**Files:**
- Modify: `tests/tools/reference.test.ts`

**Step 1: Add handler tests**

Update import to include all 5 handlers. Add `vi, beforeEach`:

```typescript
describe("handleGenres", () => {
  const mockClient = {
    getGenres: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getGenres with media_type", async () => {
    mockClient.getGenres.mockResolvedValue({ genres: [{ id: 28, name: "Action" }] });

    const result = await handleGenres({ media_type: "movie" }, mockClient as any);

    expect(mockClient.getGenres).toHaveBeenCalledWith("movie");
    const parsed = JSON.parse(result);
    expect(parsed.genres[0].name).toBe("Action");
  });
});

describe("handleWatchProviders", () => {
  const mockClient = {
    getMovieWatchProviders: vi.fn(),
    getTVWatchProviders: vi.fn(),
    getWatchProviderList: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getMovieWatchProviders when movie + id", async () => {
    mockClient.getMovieWatchProviders.mockResolvedValue({ results: { US: {} } });

    await handleWatchProviders({ media_type: "movie", id: 550 }, mockClient as any);

    expect(mockClient.getMovieWatchProviders).toHaveBeenCalledWith(550);
  });

  it("calls getTVWatchProviders when tv + id", async () => {
    mockClient.getTVWatchProviders.mockResolvedValue({ results: { US: {} } });

    await handleWatchProviders({ media_type: "tv", id: 1396 }, mockClient as any);

    expect(mockClient.getTVWatchProviders).toHaveBeenCalledWith(1396);
  });

  it("calls getWatchProviderList when no id (list mode)", async () => {
    mockClient.getWatchProviderList.mockResolvedValue({ results: [{ provider_id: 8, provider_name: "Netflix" }] });

    await handleWatchProviders({ media_type: "movie" }, mockClient as any);

    expect(mockClient.getWatchProviderList).toHaveBeenCalledWith("movie");
    expect(mockClient.getMovieWatchProviders).not.toHaveBeenCalled();
  });
});

describe("handleFindByExternalId", () => {
  const mockClient = {
    findByExternalId: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls findByExternalId with external_id and source", async () => {
    mockClient.findByExternalId.mockResolvedValue({ movie_results: [{ id: 550 }] });

    const result = await handleFindByExternalId(
      { external_id: "tt0137523", source: "imdb_id" },
      mockClient as any
    );

    expect(mockClient.findByExternalId).toHaveBeenCalledWith("tt0137523", "imdb_id");
    const parsed = JSON.parse(result);
    expect(parsed.movie_results[0].id).toBe(550);
  });
});

describe("handleCollectionDetails", () => {
  const mockClient = {
    getCollection: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getCollection with collection_id", async () => {
    mockClient.getCollection.mockResolvedValue({ id: 10, name: "Star Wars Collection" });

    const result = await handleCollectionDetails({ collection_id: 10 }, mockClient as any);

    expect(mockClient.getCollection).toHaveBeenCalledWith(10);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Star Wars Collection");
  });
});

describe("handleCompanyDetails", () => {
  const mockClient = {
    getCompany: vi.fn(),
    getNetwork: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls getCompany for type company", async () => {
    mockClient.getCompany.mockResolvedValue({ id: 41077, name: "A24" });

    const result = await handleCompanyDetails({ id: 41077, type: "company" }, mockClient as any);

    expect(mockClient.getCompany).toHaveBeenCalledWith(41077);
    expect(mockClient.getNetwork).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("A24");
  });

  it("calls getNetwork for type network", async () => {
    mockClient.getNetwork.mockResolvedValue({ id: 49, name: "HBO" });

    const result = await handleCompanyDetails({ id: 49, type: "network" }, mockClient as any);

    expect(mockClient.getNetwork).toHaveBeenCalledWith(49);
    expect(mockClient.getCompany).not.toHaveBeenCalled();
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("HBO");
  });
});
```

**Step 2: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/reference.test.ts`
Expected: All pass (existing 15 schema + 8 new handler = 23)

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/tools/reference.test.ts
git commit -m "Add handler tests for reference tools (genres, watch providers, find, collections, companies)"
```

---

## Task 6: Dispatch verification tests

**Files:**
- Create: `tests/integration/dispatch.test.ts`

Tests that the handler dispatch map in `index.ts` routes correctly. Since `index.ts` instantiates clients from env vars and starts a server, we can't easily import it. Instead, reconstruct the dispatch map pattern and verify it.

**Step 1: Write dispatch tests**

```typescript
// ABOUTME: Verifies that index.ts dispatch map routes all 16 tool names to correct handlers.
// ABOUTME: Reconstructs the dispatch pattern without starting the MCP server.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearch } from "../../src/tools/search.js";
import { handleMovieDetails, handleTVDetails, handlePersonDetails } from "../../src/tools/details.js";
import { handleDiscover } from "../../src/tools/discover.js";
import { handleTrending, handleCuratedLists } from "../../src/tools/browse.js";
import {
  handleGenres, handleWatchProviders, handleFindByExternalId,
  handleCollectionDetails, handleCompanyDetails,
} from "../../src/tools/reference.js";
import {
  handleGetPersonAwards, handleGetFilmAwards,
  handleGetAwardHistory, handleSearchAwards,
} from "../../src/tools/awards.js";
import {
  searchTool, movieDetailsTool, tvDetailsTool, personDetailsTool,
  discoverTool, trendingTool, curatedListsTool, genresTool,
  watchProvidersTool, findByExternalIdTool, collectionDetailsTool,
  companyDetailsTool, getPersonAwardsTool, getFilmAwardsTool,
  getAwardHistoryTool, searchAwardsTool,
} from "../../src/tools/search.js";

// We need to import tool definitions from all files — this is cleaner than
// importing from index.ts which has side effects (dotenv, process.exit, etc.)

describe("dispatch map", () => {
  // Mirror the dispatch map from index.ts
  const mockTmdbClient: any = {};
  const mockWikidataClient: any = {};

  const handlers: Record<string, Function> = {
    search: handleSearch,
    movie_details: handleMovieDetails,
    tv_details: handleTVDetails,
    person_details: handlePersonDetails,
    discover: handleDiscover,
    trending: handleTrending,
    curated_lists: handleCuratedLists,
    genres: handleGenres,
    watch_providers: handleWatchProviders,
    find_by_external_id: handleFindByExternalId,
    collection_details: handleCollectionDetails,
    company_details: handleCompanyDetails,
    get_person_awards: (args: any) => handleGetPersonAwards(args, mockTmdbClient, mockWikidataClient),
    get_film_awards: (args: any) => handleGetFilmAwards(args, mockTmdbClient, mockWikidataClient),
    get_award_history: (args: any) => handleGetAwardHistory(args, mockTmdbClient, mockWikidataClient),
    search_awards: (args: any) => handleSearchAwards(args, mockTmdbClient, mockWikidataClient),
  };

  it("has exactly 16 tool entries", () => {
    expect(Object.keys(handlers)).toHaveLength(16);
  });

  it("all tool definition names have a matching handler", () => {
    const toolDefs = [
      searchTool, movieDetailsTool, tvDetailsTool, personDetailsTool,
      discoverTool, trendingTool, curatedListsTool, genresTool,
      watchProvidersTool, findByExternalIdTool, collectionDetailsTool,
      companyDetailsTool, getPersonAwardsTool, getFilmAwardsTool,
      getAwardHistoryTool, searchAwardsTool,
    ];

    for (const tool of toolDefs) {
      expect(handlers[tool.name], `Missing handler for tool: ${tool.name}`).toBeDefined();
    }
  });

  it("has no handler without a matching tool definition", () => {
    const toolNames = new Set([
      "search", "movie_details", "tv_details", "person_details",
      "discover", "trending", "curated_lists", "genres",
      "watch_providers", "find_by_external_id", "collection_details",
      "company_details", "get_person_awards", "get_film_awards",
      "get_award_history", "search_awards",
    ]);

    for (const name of Object.keys(handlers)) {
      expect(toolNames.has(name), `Handler ${name} has no tool definition`).toBe(true);
    }
  });

  it("all handlers are functions", () => {
    for (const [name, handler] of Object.entries(handlers)) {
      expect(typeof handler, `Handler ${name} is not a function`).toBe("function");
    }
  });

  it("awards closures are callable (bind verification)", () => {
    // Awards handlers use closures that capture wikidataClient.
    // Verify the closure-bound handlers are callable functions.
    const awardTools = ["get_person_awards", "get_film_awards", "get_award_history", "search_awards"];
    for (const name of awardTools) {
      expect(typeof handlers[name]).toBe("function");
      // The closure should accept (args) and internally pass tmdbClient + wikidataClient
      expect(handlers[name].length, `${name} closure should accept 1 arg`).toBe(1);
    }
  });
});
```

Note: The import of tool definitions from `search.js` only is wrong — we need imports from each file. Fix the imports:

```typescript
import { searchTool } from "../../src/tools/search.js";
import { movieDetailsTool, tvDetailsTool, personDetailsTool } from "../../src/tools/details.js";
import { discoverTool } from "../../src/tools/discover.js";
import { trendingTool, curatedListsTool } from "../../src/tools/browse.js";
import {
  genresTool, watchProvidersTool, findByExternalIdTool,
  collectionDetailsTool, companyDetailsTool,
} from "../../src/tools/reference.js";
import {
  getPersonAwardsTool, getFilmAwardsTool,
  getAwardHistoryTool, searchAwardsTool,
} from "../../src/tools/awards.js";
```

**Step 2: Run tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/integration/dispatch.test.ts`
Expected: All 5 tests pass

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/integration/dispatch.test.ts
git commit -m "Add dispatch verification tests for all 16 tool handlers"
```

---

## Task 7: Live TMDB integration tests

**Files:**
- Create: `tests/integration/live-api.test.ts`

**Step 1: Write live TMDB tests**

```typescript
// ABOUTME: Live API integration tests for TMDB and Wikidata endpoints.
// ABOUTME: Skipped unless TMDB_ACCESS_TOKEN env var is set. Uses real API calls.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;

describe.skipIf(!TMDB_TOKEN)("live TMDB API", () => {
  const client = new TMDBClient(TMDB_TOKEN!);

  // Known stable entities
  const PARASITE_ID = 496243;
  const DEAKINS_ID = 5914;
  const BREAKING_BAD_ID = 1396;

  it("searches for Parasite and finds it", async () => {
    const result = await client.searchMulti("Parasite");
    const ids = result.results.map((r: any) => r.id);
    expect(ids).toContain(PARASITE_ID);
  }, { timeout: 15000 });

  it("gets movie details for Parasite", async () => {
    const result = await client.getMovieDetails(PARASITE_ID);
    expect(result.title).toBe("Parasite");
    expect(result.imdb_id).toBeTruthy();
  }, { timeout: 15000 });

  it("gets movie details with append_to_response", async () => {
    const result = await client.getMovieDetails(PARASITE_ID, ["credits"]);
    expect(result).toHaveProperty("credits");
    expect(result.credits.cast.length).toBeGreaterThan(0);
  }, { timeout: 15000 });

  it("gets person details for Roger Deakins", async () => {
    const result = await client.getPersonDetails(DEAKINS_ID);
    expect(result.name).toBe("Roger Deakins");
  }, { timeout: 15000 });

  it("gets TV details for Breaking Bad", async () => {
    const result = await client.getTVDetails(BREAKING_BAD_ID);
    expect(result.name).toBe("Breaking Bad");
  }, { timeout: 15000 });

  it("discovers movies with genre filter", async () => {
    const result = await client.discoverMovies({ with_genres: "18" });
    expect(result.results.length).toBeGreaterThan(0);
  }, { timeout: 15000 });

  it("gets trending content", async () => {
    const result = await client.getTrending("movie", "day");
    expect(result.results.length).toBeGreaterThan(0);
  }, { timeout: 15000 });

  it("gets movie genres including Drama", async () => {
    const result = await client.getGenres("movie");
    const drama = result.genres.find((g: any) => g.id === 18);
    expect(drama).toBeDefined();
    expect(drama!.name).toBe("Drama");
  }, { timeout: 15000 });
});

describe.skipIf(!TMDB_TOKEN)("live Wikidata SPARQL", () => {
  const tmdbClient = new TMDBClient(TMDB_TOKEN!);
  const wikidataClient = new WikidataClient();

  it("resolves Roger Deakins by TMDB person ID", async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId(5914);
    expect(entity).not.toBeNull();
    expect(entity!.label).toMatch(/Deakins/i);
  }, { timeout: 15000 });

  it("resolves Parasite by TMDB movie ID", async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId(496243);
    expect(entity).not.toBeNull();
    expect(entity!.label).toMatch(/Parasite/i);
  }, { timeout: 15000 });

  it("finds awards for Roger Deakins including Oscar wins", async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId(5914);
    expect(entity).not.toBeNull();
    const wins = await wikidataClient.getPersonWins(entity!.wikidataId);
    // Deakins has won at least one Oscar for cinematography
    expect(wins.length).toBeGreaterThan(0);
    const oscarWin = wins.find((w: any) => w.label && w.label.match(/cinematography/i));
    expect(oscarWin).toBeDefined();
  }, { timeout: 15000 });

  it("finds awards for Parasite including Best Picture", async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId(496243);
    expect(entity).not.toBeNull();
    const awards = await wikidataClient.getFilmAwards(entity!.wikidataId);
    expect(awards.length).toBeGreaterThan(0);
    const bestPicture = awards.find((a: any) => a.label && a.label.match(/Best Picture/i));
    expect(bestPicture).toBeDefined();
  }, { timeout: 15000 });
});
```

**Step 2: Run tests (without env var — should skip)**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/integration/live-api.test.ts`
Expected: All tests skipped (no TMDB_ACCESS_TOKEN set)

**Step 3: Run tests (with env var — if available)**

Run: `cd ~/Dropbox/CS/film-data-mcp && TMDB_ACCESS_TOKEN=<your-token> npx vitest run tests/integration/live-api.test.ts`
Expected: All 12 tests pass

**Step 4: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/integration/live-api.test.ts
git commit -m "Add live API integration tests for TMDB and Wikidata (opt-in via env var)"
```

---

## Task 8: Run full suite and verify counts

**Step 1: Run all tests**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run`
Expected: ~175-185 tests passing across 12 files (131 existing + ~45 new handler + ~5 dispatch + live tests skipped)

**Step 2: Commit any remaining fixes**

If any test needs adjustment, fix and commit.

**Step 3: Update ROADMAP.md in personal-marketplace**

Update M6 status to reflect Phase 5 completion and new test count.

**Step 4: Tag milestone if Phase 5 is the final phase**

```bash
cd ~/Dropbox/CS/film-data-mcp
git tag -a v0.2.0 -m "Phase 5 complete: integration tests, full handler coverage"
```

---

## Summary

| Task | Tests Added | Cumulative |
|------|-------------|------------|
| 1: search handlers | 5 | 136 |
| 2: details handlers | 7 | 143 |
| 3: discover handlers | 7 | 150 |
| 4: browse handlers | 9 | 159 |
| 5: reference handlers | 8 | 167 |
| 6: dispatch verification | 5 | 172 |
| 7: live integration | 12 (skipped by default) | 172+12 |
| **Total new** | **53** | **172 (+ 12 opt-in)** |
