# M12: Box Office & Financial Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** New `get_financials` tool (#21) that aggregates financial data from TMDB + OMDb, extensible for future sources.

**Architecture:** Fetch TMDB movie details for budget/revenue/imdb_id, then query OMDb by IMDb ID for domestic gross. OMDb client is optional — tool works TMDB-only when no API key is set. Each data point's source is tracked.

**Tech Stack:** TypeScript, Zod, vitest, fetch API, OMDb REST API (`omdbapi.com`)

**Design doc:** `docs/plans/2026-03-08-m12-box-office-design.md`

---

### Task 1: OMDb Response Type

**Files:**
- Create: `src/types/omdb.ts`

**Step 1: Create the OMDb response type**

```typescript
// ABOUTME: TypeScript types for OMDb API responses.
// ABOUTME: Covers the subset of fields used by the financials tool.

export interface OMDbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  BoxOffice?: string;  // "$188,020,017", "N/A", or absent
  Response: string;    // "True" or "False"
  Error?: string;      // Present when Response is "False"
}
```

**Step 2: Commit**

```bash
git add src/types/omdb.ts
git commit -m "feat(M12): add OMDb response type"
```

---

### Task 2: OMDb Client — Failing Tests

**Files:**
- Create: `tests/utils/omdb-client.test.ts`

**Step 1: Write failing tests**

```typescript
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
      new Response(JSON.stringify({
        Title: "Fight Club",
        Year: "1999",
        imdbID: "tt0137523",
        BoxOffice: "$37,030,102",
        Response: "True",
      }))
    );

    const result = await client.getByImdbId("tt0137523");

    expect(fetch).toHaveBeenCalledWith(
      "https://www.omdbapi.com/?apikey=test-key&i=tt0137523"
    );
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
      new Response(JSON.stringify({
        Response: "False",
        Error: "Movie not found!",
      }))
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/utils/omdb-client.test.ts`
Expected: FAIL — cannot import `OMDbClient`

---

### Task 3: OMDb Client — Implementation

**Files:**
- Create: `src/utils/omdb-client.ts`

**Step 1: Implement the OMDb client**

```typescript
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
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/utils/omdb-client.test.ts`
Expected: All 4 tests PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All existing tests still pass

**Step 4: Commit**

```bash
git add src/utils/omdb-client.ts tests/utils/omdb-client.test.ts
git commit -m "feat(M12): add OMDb API client with tests"
```

---

### Task 4: Financials Tool — Failing Tests

**Files:**
- Create: `tests/tools/financials.test.ts`

**Step 1: Write failing tests**

```typescript
// ABOUTME: Tests for get_financials tool.
// ABOUTME: Validates schema, TMDB+OMDb aggregation, null handling, and TMDB-only mode.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GetFinancialsSchema,
  handleGetFinancials,
} from "../../src/tools/financials.js";

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
      await handleGetFinancials({ movie_id: 550 }, mockTmdbClient as any, mockOmdbClient as any)
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
      await handleGetFinancials({ movie_id: 489985 }, mockTmdbClient as any, mockOmdbClient as any)
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
      await handleGetFinancials({ movie_id: 999 }, mockTmdbClient as any, mockOmdbClient as any)
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
      await handleGetFinancials({ movie_id: 550 }, mockTmdbClient as any, mockOmdbClient as any)
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/tools/financials.test.ts`
Expected: FAIL — cannot import from `financials.js`

---

### Task 5: Financials Tool — Implementation

**Files:**
- Create: `src/tools/financials.ts`

**Step 1: Implement the tool**

```typescript
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

function parseBoxOffice(value: string): number | null {
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
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/tools/financials.test.ts`
Expected: All 10 tests PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (existing + new)

**Step 4: Commit**

```bash
git add src/tools/financials.ts tests/tools/financials.test.ts
git commit -m "feat(M12): add get_financials tool with tests"
```

---

### Task 6: Register Tool in Server

**Files:**
- Modify: `src/index.ts`

**Step 1: Add imports and initialization**

Add OMDb client import and financials tool import to the import block:

```typescript
import { OMDbClient } from "./utils/omdb-client.js";
import { financialsTool, handleGetFinancials } from "./tools/financials.js";
```

Add OMDb client initialization after `wikidataClient`:

```typescript
const omdbKey = process.env.OMDB_API_KEY;
const omdbClient = omdbKey ? new OMDbClient(omdbKey) : null;
```

**Step 2: Register the tool**

Add `financialsTool` to the `ListToolsRequestSchema` handler's tools array (after `searchAwardsTool`).

Add the handler to the dispatch map in `CallToolRequestSchema`:

```typescript
get_financials: (args) => handleGetFinancials(args, tmdbClient, omdbClient),
```

**Step 3: Update the server comment block and version**

Update the comment at the top of the file to reflect 17 TMDB tools and the new tool. Add `get_financials` to the TMDB tool list. Fix stale server version (`"0.7.0"` → `"0.11.0"`) on line 74.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Build to verify compilation**

Run: `npm run build`
Expected: Clean build, no errors

**Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat(M12): register get_financials tool in server"
```

---

### Task 7: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md**

- Update Quick Start to mention `OMDB_API_KEY` as optional env var
- Update tool count: "21 total: 17 TMDB, 4 awards" (get_financials is TMDB-based since it queries TMDB + OMDb, not Wikidata)
- Add `get_financials` row to the tools table:

```
| get_financials | financials.ts | Financial data (budget, revenue, domestic gross) from TMDB + OMDb |
```

- Update Architecture `src/tools/` listing to include `financials.ts`
- Update Architecture `src/types/` listing to include `omdb.ts`
- Update Architecture `src/utils/` listing to include `omdb-client.ts`
- Add note about `OMDB_API_KEY` being optional under Data Sources

**Step 2: Update ROADMAP.md**

- Update M12 status to "Complete"
- Update tool count in Current Status
- Update time tracking

**Step 3: Commit**

```bash
git add CLAUDE.md ROADMAP.md
git commit -m "docs: update CLAUDE.md and ROADMAP.md for M12"
```

---

### Task 8: Integration Test

**Files:**
- Create: `tests/integration/financials.integration.test.ts`

**Step 1: Write integration test**

```typescript
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
```

**Step 2: Run integration tests**

Run: `TMDB_ACCESS_TOKEN=<token> OMDB_API_KEY=<key> npx vitest run tests/integration/financials.integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/financials.integration.test.ts
git commit -m "test(M12): add get_financials integration tests"
```

---

### Task 9: Tag Release

**Step 1: Run full test suite one final time**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Clean build

**Step 3: Tag**

```bash
git tag v0.11.0
```
