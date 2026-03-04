# M8: Discovery & Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two new tools — `get_festival_premieres` and `get_credits` — bringing the server from 18 to 20 tools.

**Architecture:** Both tools call TMDB endpoints directly. `get_festival_premieres` reuses the existing `getMovieDetails` with `release_dates` append and filters to type 1. `get_credits` adds two new TMDBClient methods (`getMovieCredits`, `getTVAggregateCredits`) and provides department/job filtering with offset/limit pagination. Both follow the established pattern: Zod schema → `buildToolDef` → handler function → JSON string response.

**Tech Stack:** TypeScript (ESM), Zod 4, Vitest, MCP SDK. Test runner: `npx vitest run`. Working directory: `~/Dropbox/CS/film-data-mcp`.

**Conventions:**
- All source files start with two `// ABOUTME:` comment lines
- Import `z` from `"zod"`, `buildToolDef` from `"../utils/tool-helpers.js"`
- Schemas exported for test access, handlers export as named functions
- Tests use `vi.fn()` mocks with `mockClient as any` cast
- Zod `.refine()` produces ZodEffects — use BaseSchema split pattern (BaseSchema for `buildToolDef`, refined schema for `parse()`)
- `.trim()` and `.transform()` cannot be used in schemas passed to `buildToolDef`
- Vitest 4: timeout is 2nd arg `it(name, { timeout }, fn)`
- Test files: `tests/tools/<name>.test.ts`

---

### Task 1: Add `getMovieCredits` and `getTVAggregateCredits` to TMDBClient

**Files:**
- Modify: `src/utils/tmdb-client.ts` (add two methods after `getPersonDetails`, around line 138)
- Test: `tests/utils/tmdb-client.test.ts` (if exists, otherwise skip — live API tests cover this)

**Step 1: Write the failing test**

Create `tests/utils/tmdb-client-credits.test.ts`:

```typescript
// ABOUTME: Tests that TMDBClient credit methods call the correct TMDB endpoints.
// ABOUTME: Uses mocked fetch to verify URL construction.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";

describe("TMDBClient credit methods", () => {
  const client = new TMDBClient("test-token");
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cast: [], crew: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getMovieCredits calls /movie/{id}/credits", async () => {
    await client.getMovieCredits(496243);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain("/movie/496243/credits");
  });

  it("getTVAggregateCredits calls /tv/{id}/aggregate_credits", async () => {
    await client.getTVAggregateCredits(1396);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0];
    expect(url).toContain("/tv/1396/aggregate_credits");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/utils/tmdb-client-credits.test.ts`
Expected: FAIL — `getMovieCredits` is not a function

**Step 3: Write minimal implementation**

Add to `src/utils/tmdb-client.ts` after `getPersonDetails` (around line 138):

```typescript
    /**
     * Get full credits for a movie (cast + crew, no truncation)
     */
    async getMovieCredits(movieId: number): Promise<any> {
        return this.get<any>(`/movie/${movieId}/credits`);
    }

    /**
     * Get aggregate credits for a TV series (all seasons combined)
     */
    async getTVAggregateCredits(tvId: number): Promise<any> {
        return this.get<any>(`/tv/${tvId}/aggregate_credits`);
    }
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/utils/tmdb-client-credits.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add src/utils/tmdb-client.ts tests/utils/tmdb-client-credits.test.ts
git commit -m "feat: add getMovieCredits and getTVAggregateCredits to TMDBClient"
```

---

### Task 2: Create `get_festival_premieres` tool — schema and tests

**Files:**
- Create: `src/tools/premieres.ts`
- Create: `tests/tools/premieres.test.ts`

**Step 1: Write the failing tests**

Create `tests/tools/premieres.test.ts`:

```typescript
// ABOUTME: Tests for get_festival_premieres tool.
// ABOUTME: Validates schema, premiere filtering, sorting, and edge cases.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PremieresSchema,
  handleGetFestivalPremieres,
} from "../../src/tools/premieres.js";

describe("PremieresSchema", () => {
  it("accepts movie_id", () => {
    const result = PremieresSchema.parse({ movie_id: 496243 });
    expect(result.movie_id).toBe(496243);
  });

  it("rejects missing movie_id", () => {
    expect(() => PremieresSchema.parse({})).toThrow();
  });

  it("rejects non-positive movie_id", () => {
    expect(() => PremieresSchema.parse({ movie_id: 0 })).toThrow();
    expect(() => PremieresSchema.parse({ movie_id: -1 })).toThrow();
  });
});

describe("handleGetFestivalPremieres", () => {
  const mockClient = {
    getMovieDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("filters to only type 1 (Premiere) entries", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 496243,
      title: "Parasite",
      release_dates: {
        results: [
          {
            iso_3166_1: "FR",
            release_dates: [
              { type: 1, release_date: "2019-05-21T00:00:00.000Z", note: "Cannes Film Festival", certification: "" },
              { type: 3, release_date: "2019-06-05T00:00:00.000Z", note: "", certification: "" },
            ],
          },
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 2, release_date: "2019-10-05T00:00:00.000Z", note: "New York Film Festival", certification: "" },
              { type: 3, release_date: "2019-10-11T00:00:00.000Z", note: "", certification: "R" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 496243 }, mockClient as any));

    expect(result.premieres).toHaveLength(1);
    expect(result.premieres[0].country).toBe("FR");
    expect(result.premieres[0].note).toBe("Cannes Film Festival");
    expect(result.total).toBe(1);
  });

  it("sorts premieres chronologically", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 100,
      title: "Test Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 1, release_date: "2020-09-01T00:00:00.000Z", note: "Telluride", certification: "" },
            ],
          },
          {
            iso_3166_1: "IT",
            release_dates: [
              { type: 1, release_date: "2020-08-01T00:00:00.000Z", note: "Venice", certification: "" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 100 }, mockClient as any));

    expect(result.premieres[0].note).toBe("Venice");
    expect(result.premieres[1].note).toBe("Telluride");
  });

  it("returns empty premieres when no type 1 entries exist", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 200,
      title: "No Premieres Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              { type: 3, release_date: "2020-01-01T00:00:00.000Z", note: "", certification: "PG-13" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 200 }, mockClient as any));

    expect(result.premieres).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("handles missing note field", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 300,
      title: "Film",
      release_dates: {
        results: [
          {
            iso_3166_1: "KR",
            release_dates: [
              { type: 1, release_date: "2019-05-30T00:00:00.000Z", certification: "15" },
            ],
          },
        ],
      },
    });

    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: 300 }, mockClient as any));

    expect(result.premieres[0].note).toBe("");
    expect(result.premieres[0].certification).toBe("15");
  });

  it("calls getMovieDetails with release_dates append", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 1,
      title: "T",
      release_dates: { results: [] },
    });

    await handleGetFestivalPremieres({ movie_id: 1 }, mockClient as any);

    expect(mockClient.getMovieDetails).toHaveBeenCalledWith(1, ["release_dates"]);
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieDetails.mockResolvedValue({
      id: 1,
      title: "T",
      release_dates: { results: [] },
    });

    const result = await handleGetFestivalPremieres({ movie_id: 1 }, mockClient as any);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/premieres.test.ts`
Expected: FAIL — cannot import from `../../src/tools/premieres.js`

**Step 3: Write minimal implementation**

Create `src/tools/premieres.ts`:

```typescript
// ABOUTME: Tool for extracting festival premiere dates from TMDB release data.
// ABOUTME: Filters release_dates to type 1 (Premiere) entries, sorted chronologically.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";

export const PremieresSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
});

export const festivalPremieresTool = buildToolDef(
  "get_festival_premieres",
  "Get festival premiere dates for a movie. Returns type-1 (Premiere) release dates from TMDB, sorted chronologically. Useful for finding where a film debuted (e.g., Cannes, Venice, Sundance). For full release date details, use movie_details with append: ['release_dates'].",
  PremieresSchema
);

interface Premiere {
  date: string;
  country: string;
  note: string;
  certification: string;
}

export async function handleGetFestivalPremieres(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { movie_id } = PremieresSchema.parse(args);
  const result = await client.getMovieDetails(movie_id, ["release_dates"]);

  const premieres: Premiere[] = [];

  for (const country of result.release_dates?.results ?? []) {
    for (const rd of country.release_dates ?? []) {
      if (rd.type === 1) {
        premieres.push({
          date: rd.release_date?.slice(0, 10) ?? "",
          country: country.iso_3166_1,
          note: rd.note ?? "",
          certification: rd.certification ?? "",
        });
      }
    }
  }

  premieres.sort((a, b) => a.date.localeCompare(b.date));

  return JSON.stringify({
    movie_id,
    title: result.title,
    premieres,
    total: premieres.length,
  }, null, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/premieres.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add src/tools/premieres.ts tests/tools/premieres.test.ts
git commit -m "feat: add get_festival_premieres tool with tests"
```

---

### Task 3: Create `get_credits` tool — schema and tests

This is the largest task. The credits tool needs: mutual-exclusion validation (movie_id vs series_id), type filtering (cast/crew/all), department/job filtering, and offset/limit pagination.

**Files:**
- Create: `src/tools/credits.ts`
- Create: `tests/tools/credits.test.ts`

**Step 1: Write the failing tests**

Create `tests/tools/credits.test.ts`:

```typescript
// ABOUTME: Tests for get_credits tool with filtering and pagination.
// ABOUTME: Validates schema, department/job filtering, offset/limit, and TV normalization.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CreditsBaseSchema,
  CreditsSchema,
  handleGetCredits,
} from "../../src/tools/credits.js";

// --- Schema tests ---

describe("CreditsBaseSchema", () => {
  it("accepts movie_id", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.movie_id).toBe(550);
  });

  it("accepts series_id", () => {
    const result = CreditsBaseSchema.parse({ series_id: 1396 });
    expect(result.series_id).toBe(1396);
  });

  it("defaults type to all", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.type).toBe("all");
  });

  it("defaults limit to 20", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.limit).toBe(20);
  });

  it("defaults offset to 0", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550 });
    expect(result.offset).toBe(0);
  });

  it("accepts limit 0 for unlimited", () => {
    const result = CreditsBaseSchema.parse({ movie_id: 550, limit: 0 });
    expect(result.limit).toBe(0);
  });
});

describe("CreditsSchema (refined)", () => {
  it("rejects when both movie_id and series_id provided", () => {
    expect(() => CreditsSchema.parse({ movie_id: 550, series_id: 1396 })).toThrow();
  });

  it("rejects when neither movie_id nor series_id provided", () => {
    expect(() => CreditsSchema.parse({})).toThrow();
  });

  it("accepts movie_id alone", () => {
    const result = CreditsSchema.parse({ movie_id: 550 });
    expect(result.movie_id).toBe(550);
  });

  it("accepts series_id alone", () => {
    const result = CreditsSchema.parse({ series_id: 1396 });
    expect(result.series_id).toBe(1396);
  });
});

// --- Handler tests ---

describe("handleGetCredits", () => {
  const mockClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const movieCredits = {
    id: 550,
    cast: [
      { id: 1, name: "Actor A", character: "Role A", order: 0 },
      { id: 2, name: "Actor B", character: "Role B", order: 1 },
      { id: 3, name: "Actor C", character: "Role C", order: 2 },
    ],
    crew: [
      { id: 10, name: "Director", department: "Directing", job: "Director" },
      { id: 11, name: "DP", department: "Camera", job: "Director of Photography" },
      { id: 12, name: "Producer", department: "Production", job: "Producer" },
      { id: 13, name: "EP", department: "Production", job: "Executive Producer" },
      { id: 14, name: "Writer", department: "Writing", job: "Screenplay" },
    ],
  };

  it("returns cast and crew for movie", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550 }, mockClient as any));

    expect(result.cast).toHaveLength(3);
    expect(result.crew).toHaveLength(5);
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBe(5);
  });

  it("filters to cast only", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550, type: "cast" }, mockClient as any));

    expect(result.cast).toHaveLength(3);
    expect(result.crew).toBeUndefined();
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBeUndefined();
  });

  it("filters to crew only", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(await handleGetCredits({ movie_id: 550, type: "crew" }, mockClient as any));

    expect(result.cast).toBeUndefined();
    expect(result.crew).toHaveLength(5);
    expect(result.pagination.total_cast).toBeUndefined();
    expect(result.pagination.total_crew).toBe(5);
  });

  it("filters crew by department (case-insensitive)", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, department: "production" }, mockClient as any)
    );

    expect(result.crew).toHaveLength(2);
    expect(result.crew.map((c: any) => c.name)).toEqual(["Producer", "EP"]);
    expect(result.pagination.total_crew).toBe(2);
  });

  it("filters crew by job (case-insensitive)", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, job: "director of photography" }, mockClient as any)
    );

    expect(result.crew).toHaveLength(1);
    expect(result.crew[0].name).toBe("DP");
  });

  it("applies department filter but still returns all cast", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "all", department: "Camera" }, mockClient as any)
    );

    expect(result.cast).toHaveLength(3);
    expect(result.crew).toHaveLength(1);
  });

  it("paginates with offset and limit", async () => {
    const bigCast = Array.from({ length: 50 }, (_, i) => ({
      id: i, name: `Actor ${i}`, character: `Role ${i}`, order: i,
    }));
    mockClient.getMovieCredits.mockResolvedValue({
      id: 550, cast: bigCast, crew: [],
    });

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "cast", offset: 10, limit: 5 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(5);
    expect(result.cast[0].name).toBe("Actor 10");
    expect(result.cast[4].name).toBe("Actor 14");
    expect(result.pagination.total_cast).toBe(50);
    expect(result.pagination.offset).toBe(10);
    expect(result.pagination.limit).toBe(5);
  });

  it("returns empty arrays when offset exceeds total", async () => {
    mockClient.getMovieCredits.mockResolvedValue(movieCredits);

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, offset: 100 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(0);
    expect(result.crew).toHaveLength(0);
    expect(result.pagination.total_cast).toBe(3);
    expect(result.pagination.total_crew).toBe(5);
  });

  it("returns all entries when limit is 0", async () => {
    const bigCast = Array.from({ length: 100 }, (_, i) => ({
      id: i, name: `Actor ${i}`, character: `Role ${i}`, order: i,
    }));
    mockClient.getMovieCredits.mockResolvedValue({
      id: 550, cast: bigCast, crew: [],
    });

    const result = JSON.parse(
      await handleGetCredits({ movie_id: 550, type: "cast", limit: 0 }, mockClient as any)
    );

    expect(result.cast).toHaveLength(100);
  });

  it("calls getTVAggregateCredits for series_id", async () => {
    mockClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396, cast: [], crew: [],
    });

    await handleGetCredits({ series_id: 1396 }, mockClient as any);

    expect(mockClient.getTVAggregateCredits).toHaveBeenCalledWith(1396);
    expect(mockClient.getMovieCredits).not.toHaveBeenCalled();
  });

  it("normalizes TV aggregate cast roles to flat structure", async () => {
    mockClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396,
      cast: [
        {
          id: 17419,
          name: "Bryan Cranston",
          roles: [
            { character: "Walter White", episode_count: 62 },
          ],
          total_episode_count: 62,
          order: 0,
        },
      ],
      crew: [
        {
          id: 66633,
          name: "Vince Gilligan",
          jobs: [
            { job: "Executive Producer", episode_count: 62 },
            { job: "Writer", episode_count: 13 },
          ],
          department: "Production",
          total_episode_count: 62,
        },
      ],
    });

    const result = JSON.parse(await handleGetCredits({ series_id: 1396 }, mockClient as any));

    expect(result.cast[0]).toEqual({
      id: 17419,
      name: "Bryan Cranston",
      character: "Walter White",
      episode_count: 62,
      order: 0,
    });
    expect(result.crew[0]).toEqual({
      id: 66633,
      name: "Vince Gilligan",
      department: "Production",
      job: "Executive Producer, Writer",
      episode_count: 62,
    });
  });

  it("returns valid JSON string", async () => {
    mockClient.getMovieCredits.mockResolvedValue({ id: 1, cast: [], crew: [] });

    const result = await handleGetCredits({ movie_id: 1 }, mockClient as any);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/credits.test.ts`
Expected: FAIL — cannot import from `../../src/tools/credits.js`

**Step 3: Write minimal implementation**

Create `src/tools/credits.ts`:

```typescript
// ABOUTME: Dedicated credits tool with department/job filtering and pagination.
// ABOUTME: Supports both movies (via /credits) and TV series (via /aggregate_credits).

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";
import { buildToolDef } from "../utils/tool-helpers.js";

// BaseSchema for buildToolDef (no .refine() — avoids ZodEffects)
export const CreditsBaseSchema = z.object({
  movie_id: z.number().int().positive().optional().describe("TMDB movie ID (provide movie_id or series_id, not both)"),
  series_id: z.number().int().positive().optional().describe("TMDB TV series ID (provide movie_id or series_id, not both)"),
  type: z
    .enum(["cast", "crew", "all"])
    .optional()
    .default("all")
    .describe("Filter to cast, crew, or all (default: all)"),
  department: z
    .string()
    .optional()
    .describe("Filter crew by department (e.g., 'Camera', 'Production', 'Directing'). Case-insensitive."),
  job: z
    .string()
    .optional()
    .describe("Filter crew by job title (e.g., 'Director of Photography'). Case-insensitive."),
  limit: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(20)
    .describe("Max entries per array. Default 20. Pass 0 for unlimited."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe("Skip this many entries before applying limit. For pagination."),
});

// Refined schema for runtime validation
export const CreditsSchema = CreditsBaseSchema.refine(
  (data) => (data.movie_id !== undefined) !== (data.series_id !== undefined),
  { message: "Provide exactly one of movie_id or series_id" }
);

export const creditsTool = buildToolDef(
  "get_credits",
  "Get full cast and crew credits for a movie or TV series with filtering and pagination. Filter by department (e.g., 'Camera', 'Production') or job title (e.g., 'Director of Photography'). Use offset/limit for pagination. For a quick credits overview, use movie_details or tv_details with append: ['credits'].",
  CreditsBaseSchema
);

interface CastEntry {
  id: number;
  name: string;
  character: string;
  order: number;
  episode_count?: number;
}

interface CrewEntry {
  id: number;
  name: string;
  department: string;
  job: string;
  episode_count?: number;
}

function normalizeTVCast(aggregate: any[]): CastEntry[] {
  return aggregate.map((person) => ({
    id: person.id,
    name: person.name,
    character: person.roles?.[0]?.character ?? "",
    order: person.order ?? 0,
    episode_count: person.total_episode_count,
  }));
}

function normalizeTVCrew(aggregate: any[]): CrewEntry[] {
  return aggregate.map((person) => ({
    id: person.id,
    name: person.name,
    department: person.department ?? "",
    job: (person.jobs ?? []).map((j: any) => j.job).join(", "),
    episode_count: person.total_episode_count,
  }));
}

function paginate<T>(items: T[], offset: number, limit: number): T[] {
  const sliced = items.slice(offset);
  if (limit === 0) return sliced;
  return sliced.slice(0, limit);
}

export async function handleGetCredits(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { movie_id, series_id, type, department, job, limit, offset } = CreditsSchema.parse(args);

  let rawCast: CastEntry[];
  let rawCrew: CrewEntry[];
  let title: string;
  let id: number;

  if (movie_id !== undefined) {
    const data = await client.getMovieCredits(movie_id);
    rawCast = data.cast ?? [];
    rawCrew = data.crew ?? [];
    title = data.title ?? "";
    id = movie_id;
  } else {
    const data = await client.getTVAggregateCredits(series_id!);
    rawCast = normalizeTVCast(data.cast ?? []);
    rawCrew = normalizeTVCrew(data.crew ?? []);
    title = data.name ?? "";
    id = series_id!;
  }

  // Apply department/job filters to crew
  if (department) {
    const lower = department.toLowerCase();
    rawCrew = rawCrew.filter((c) => c.department.toLowerCase() === lower);
  }
  if (job) {
    const lower = job.toLowerCase();
    rawCrew = rawCrew.filter((c) => c.job.toLowerCase().includes(lower));
  }

  const includeCast = type === "all" || type === "cast";
  const includeCrew = type === "all" || type === "crew";

  const result: Record<string, any> = {};

  if (movie_id !== undefined) {
    result.movie_id = id;
  } else {
    result.series_id = id;
  }
  result.title = title;

  const pagination: Record<string, any> = { offset, limit };

  if (includeCast) {
    pagination.total_cast = rawCast.length;
    result.cast = paginate(rawCast, offset, limit);
  }
  if (includeCrew) {
    pagination.total_crew = rawCrew.length;
    result.crew = paginate(rawCrew, offset, limit);
  }

  result.pagination = pagination;

  return JSON.stringify(result, null, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/tools/credits.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add src/tools/credits.ts tests/tools/credits.test.ts
git commit -m "feat: add get_credits tool with filtering and pagination"
```

---

### Task 4: Register both tools in index.ts and update dispatch test

**Files:**
- Modify: `src/index.ts`
- Modify: `tests/integration/dispatch.test.ts`

**Step 1: Write the failing test**

Add to `tests/integration/dispatch.test.ts` — import the new tools and add them to the expected handlers and tools arrays. The test should verify 20 tools are registered.

Add imports at top:

```typescript
import { handleGetFestivalPremieres, festivalPremieresTool } from "../../src/tools/premieres.js";
import { handleGetCredits, creditsTool } from "../../src/tools/credits.js";
```

Add to the `handlers` record:

```typescript
    get_festival_premieres: handleGetFestivalPremieres,
    get_credits: handleGetCredits,
```

Add to the `tools` array:

```typescript
    festivalPremieresTool,
    creditsTool,
```

Update the expected tool count assertion (find the existing count check and change 18 → 20, or add one if missing).

**Step 2: Run test to verify it fails**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/integration/dispatch.test.ts`
Expected: FAIL — dispatch map doesn't include the new tools yet

**Step 3: Update `src/index.ts`**

Add imports after existing tool imports:

```typescript
import { festivalPremieresTool, handleGetFestivalPremieres } from "./tools/premieres.js";
import { creditsTool, handleGetCredits } from "./tools/credits.js";
```

Add to the `tools` array in `ListToolsRequestSchema` handler:

```typescript
            festivalPremieresTool,
            creditsTool,
```

Add to the `handlers` record in `CallToolRequestSchema` handler:

```typescript
            get_festival_premieres: handleGetFestivalPremieres,
            get_credits: handleGetCredits,
```

Update the file header comment to reflect 16 → 16 TMDB tools:

```typescript
 * 16 TMDB tools: search, movie_details, tv_details, person_details,
 * discover, trending, curated_lists, genres, watch_providers,
 * find_by_external_id, collection_details, company_details,
 * search_keywords, company_filmography, get_festival_premieres, get_credits
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run tests/integration/dispatch.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add src/index.ts tests/integration/dispatch.test.ts
git commit -m "feat: register get_festival_premieres and get_credits in dispatch"
```

---

### Task 5: Update cross-referencing in existing tool descriptions

**Files:**
- Modify: `src/tools/details.ts` (movie_details, tv_details, person_details descriptions)

**Step 1: No test needed — description text changes only**

**Step 2: Update descriptions**

In `src/tools/details.ts`, update the `movieDetailsTool` description to mention both new tools:

```typescript
export const movieDetailsTool = buildToolDef(
  "movie_details",
  "Get full movie details from TMDB. Optionally bundle credits, videos, images, watch providers, and more in a single call using the append parameter. Credits are limited to top 20 cast + crew by default (use credits_limit to adjust, 0 for unlimited). For full crew browsing with department/job filtering, use get_credits. For festival premiere dates, use get_festival_premieres.",
  MovieDetailsSchema
);
```

Update `tvDetailsTool` description:

```typescript
export const tvDetailsTool = buildToolDef(
  "tv_details",
  "Get full TV series details from TMDB. Optionally bundle credits, videos, images, watch providers, and more in a single call using the append parameter. Credits are limited to top 20 cast + crew by default (use credits_limit to adjust, 0 for unlimited). For full crew browsing with department/job filtering, use get_credits.",
  TVDetailsSchema
);
```

**Step 3: Run full test suite to ensure nothing broke**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add src/tools/details.ts
git commit -m "docs: cross-reference get_credits and get_festival_premieres in detail tool descriptions"
```

---

### Task 6: Add live API tests for both tools

**Files:**
- Modify: `tests/integration/live-api.test.ts`

**Step 1: Add live tests**

Add imports:

```typescript
import { handleGetFestivalPremieres } from "../../src/tools/premieres.js";
import { handleGetCredits } from "../../src/tools/credits.js";
```

Add test cases inside the `describe.skipIf(!TMDB_TOKEN)("live TMDB API", ...)` block:

```typescript
  it("gets festival premieres for Parasite (known Cannes debut)", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetFestivalPremieres({ movie_id: PARASITE_ID }, client));
    expect(result.title).toBe("Parasite");
    expect(result.premieres.length).toBeGreaterThan(0);
    // Parasite premiered at Cannes
    const cannes = result.premieres.find((p: any) => p.note.toLowerCase().includes("cannes"));
    expect(cannes).toBeTruthy();
  });

  it("gets movie credits for Parasite", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetCredits({ movie_id: PARASITE_ID }, client));
    expect(result.cast.length).toBeGreaterThan(0);
    expect(result.crew.length).toBeGreaterThan(0);
    expect(result.pagination.total_cast).toBeGreaterThan(0);
  });

  it("filters credits by department", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetCredits({ movie_id: PARASITE_ID, type: "crew", department: "Directing" }, client)
    );
    expect(result.crew.length).toBeGreaterThan(0);
    for (const c of result.crew) {
      expect(c.department.toLowerCase()).toBe("directing");
    }
  });

  it("gets TV aggregate credits for Breaking Bad", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(await handleGetCredits({ series_id: BREAKING_BAD_ID }, client));
    expect(result.cast.length).toBeGreaterThan(0);
    expect(result.cast[0]).toHaveProperty("episode_count");
  });
```

**Step 2: Run live tests (requires TMDB_ACCESS_TOKEN)**

Run: `cd ~/Dropbox/CS/film-data-mcp && TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/live-api.test.ts`
Expected: PASS (all live tests including new ones)

**Step 3: Commit**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add tests/integration/live-api.test.ts
git commit -m "test: add live API tests for premieres and credits tools"
```

---

### Task 7: Version bump and ROADMAP update

**Files:**
- Modify: `package.json` (version → 0.7.0)
- Modify: `ROADMAP.md` (M8 status)

**Step 1: Update package.json version**

Change `"version": "0.6.0"` to `"version": "0.7.0"` (or whatever the current version field is).

**Step 2: Update ROADMAP.md**

Update M8 section:

```markdown
### M8: Discovery & Polish
**Criteria:** Festival premiere extraction (`get_festival_premieres` tool). Dedicated `get_credits` tool with department/job filtering and offset/limit pagination. Tool count 18 → 20.
**Status:** Complete — v0.7.0 tagged. [test count] tests across [file count] files.
- Design: `docs/plans/2026-03-04-m8-discovery-polish-design.md`
- Plan: `docs/plans/2026-03-04-m8-implementation.md`
```

Update Current Status section.

Update Time Tracking table with M8 row.

**Step 3: Run full test suite one final time**

Run: `cd ~/Dropbox/CS/film-data-mcp && npx vitest run`
Expected: All tests pass

**Step 4: Commit and tag**

```bash
cd ~/Dropbox/CS/film-data-mcp
git add package.json ROADMAP.md
git commit -m "chore: bump to v0.7.0, update roadmap for M8 completion"
git tag v0.7.0
```

---

### Task 8: Update personal-marketplace ROADMAP.md

**Files:**
- Modify: `~/Dropbox/CS/personal-marketplace/ROADMAP.md`

**Step 1: Update the film-data-mcp milestone entry**

Update the relevant milestone to reflect M8 completion and v0.7.0 release. Update time tracking.

**Step 2: Commit**

```bash
cd ~/Dropbox/CS/personal-marketplace
git add ROADMAP.md
git commit -m "Update roadmap: film-data-mcp v0.7.0 released (M8 complete)"
```
