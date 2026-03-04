# M8: TMDB Discovery Tools — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `search_keywords` and `company_filmography` tools so producers can discover keyword IDs by name and browse production company catalogs.

**Architecture:** Both tools go in `reference.ts` (lookup tools feeding `discover`). One new TMDBClient method for keyword search; company filmography reuses existing `discoverMovies`/`discoverTV`. TDD throughout.

**Tech Stack:** TypeScript (ESM), Zod 4, MCP SDK, Vitest 4, `buildToolDef` utility

---

### Task 1: Add Keyword type and TMDBClient.searchKeywords method

**Files:**
- Modify: `src/types/tmdb-extended.ts`
- Modify: `src/utils/tmdb-client.ts`
- Test: `tests/integration/live-api.test.ts`

**Step 1: Write the failing test**

Add to `tests/integration/live-api.test.ts` inside the `describe.skipIf(!TMDB_TOKEN)("live TMDB API", ...)` block:

```typescript
it("searches keywords for 'masculinity'", LIVE_TIMEOUT, async () => {
  const result = await client.searchKeywords("masculinity");
  expect(result.results.length).toBeGreaterThan(0);
  expect(result.results[0]).toHaveProperty("id");
  expect(result.results[0]).toHaveProperty("name");
});
```

**Step 2: Run test to verify it fails**

Run: `TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/live-api.test.ts`
Expected: FAIL — `client.searchKeywords is not a function`

**Step 3: Add Keyword type to tmdb-extended.ts**

Add after the `WatchProvider` interface:

```typescript
export interface Keyword {
  id: number;
  name: string;
}
```

**Step 4: Add searchKeywords to TMDBClient**

Add import of `Keyword` from `tmdb-extended.js`, then add method after `searchByType`:

```typescript
async searchKeywords(query: string, page: number = 1): Promise<PaginatedResult<Keyword>> {
    return this.get<PaginatedResult<Keyword>>("/search/keyword", {
        query,
        page: String(page),
    });
}
```

**Step 5: Run test to verify it passes**

Run: `TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/live-api.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/types/tmdb-extended.ts src/utils/tmdb-client.ts tests/integration/live-api.test.ts
git commit -m "Add Keyword type and TMDBClient.searchKeywords method"
```

---

### Task 2: Add search_keywords tool schema, handler, and tests

**Files:**
- Modify: `src/tools/reference.ts`
- Modify: `tests/tools/reference.test.ts`

**Step 1: Write the failing schema tests**

Add imports for `SearchKeywordsSchema` and `handleSearchKeywords` at top of `reference.test.ts`. Then add:

```typescript
describe("SearchKeywordsSchema", () => {
  it("accepts query string", () => {
    const result = SearchKeywordsSchema.parse({ query: "masculinity" });
    expect(result.query).toBe("masculinity");
  });

  it("accepts optional page", () => {
    const result = SearchKeywordsSchema.parse({ query: "war", page: 2 });
    expect(result.page).toBe(2);
  });

  it("rejects missing query", () => {
    expect(() => SearchKeywordsSchema.parse({})).toThrow();
  });

  it("rejects empty query", () => {
    expect(() => SearchKeywordsSchema.parse({ query: "" })).toThrow();
  });
});

describe("handleSearchKeywords", () => {
  const mockClient = { searchKeywords: vi.fn() };

  it("calls searchKeywords with query and default page", async () => {
    mockClient.searchKeywords.mockResolvedValue({
      page: 1,
      results: [{ id: 194226, name: "masculinity" }],
      total_pages: 1,
      total_results: 1,
    });
    const result = await handleSearchKeywords({ query: "masculinity" }, mockClient as any);
    expect(mockClient.searchKeywords).toHaveBeenCalledWith("masculinity", undefined);
    const parsed = JSON.parse(result);
    expect(parsed.results[0].id).toBe(194226);
  });

  it("passes page parameter through", async () => {
    mockClient.searchKeywords.mockResolvedValue({
      page: 2, results: [], total_pages: 3, total_results: 25,
    });
    await handleSearchKeywords({ query: "war", page: 2 }, mockClient as any);
    expect(mockClient.searchKeywords).toHaveBeenCalledWith("war", 2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/tools/reference.test.ts`
Expected: FAIL — `SearchKeywordsSchema` not exported

**Step 3: Implement schema and handler in reference.ts**

Add after the genres section (before watch providers):

```typescript
// --- Search Keywords ---

export const SearchKeywordsSchema = z.object({
  query: z.string().min(1).describe("Keyword name to search for (e.g., 'masculinity', 'war veteran')"),
  page: z.number().int().positive().optional().describe("Page number (default 1)"),
});

export const searchKeywordsTool = buildToolDef(
  "search_keywords",
  "Search for TMDB keyword IDs by name. Use the returned IDs with the discover tool's with_keywords filter to find films by theme.",
  SearchKeywordsSchema
);

export async function handleSearchKeywords(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { query, page } = SearchKeywordsSchema.parse(args);
  const result = await client.searchKeywords(query, page);
  return JSON.stringify(result, null, 2);
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/tools/reference.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tools/reference.ts tests/tools/reference.test.ts
git commit -m "Add search_keywords tool schema and handler"
```

---

### Task 3: Add company_filmography tool schema, handler, and tests

**Files:**
- Modify: `src/tools/reference.ts`
- Modify: `tests/tools/reference.test.ts`

**Step 1: Write the failing schema tests**

Add imports for `CompanyFilmographySchema` and `handleCompanyFilmography`. Then add:

```typescript
describe("CompanyFilmographySchema", () => {
  it("accepts company_id and media_type", () => {
    const result = CompanyFilmographySchema.parse({ company_id: 13042, media_type: "movie" });
    expect(result.company_id).toBe(13042);
    expect(result.media_type).toBe("movie");
  });

  it("accepts TV media_type", () => {
    expect(() => CompanyFilmographySchema.parse({ company_id: 1, media_type: "tv" })).not.toThrow();
  });

  it("accepts optional page and sort_by", () => {
    const result = CompanyFilmographySchema.parse({
      company_id: 13042, media_type: "movie", page: 2, sort_by: "vote_average.desc",
    });
    expect(result.page).toBe(2);
    expect(result.sort_by).toBe("vote_average.desc");
  });

  it("rejects missing company_id", () => {
    expect(() => CompanyFilmographySchema.parse({ media_type: "movie" })).toThrow();
  });

  it("rejects missing media_type", () => {
    expect(() => CompanyFilmographySchema.parse({ company_id: 13042 })).toThrow();
  });

  it("rejects non-positive company_id", () => {
    expect(() => CompanyFilmographySchema.parse({ company_id: 0, media_type: "movie" })).toThrow();
  });
});

describe("handleCompanyFilmography", () => {
  const mockClient = {
    discoverMovies: vi.fn(),
    discoverTV: vi.fn(),
  };

  it("calls discoverMovies with with_companies for movie type", async () => {
    mockClient.discoverMovies.mockResolvedValue({
      page: 1, results: [{ id: 489985, title: "Minding the Gap" }], total_pages: 1, total_results: 1,
    });
    const result = await handleCompanyFilmography(
      { company_id: 13042, media_type: "movie" }, mockClient as any
    );
    expect(mockClient.discoverMovies).toHaveBeenCalledWith({
      with_companies: "13042",
      sort_by: "primary_release_date.desc",
      page: 1,
    });
    const parsed = JSON.parse(result);
    expect(parsed.results[0].title).toBe("Minding the Gap");
  });

  it("calls discoverTV for tv type", async () => {
    mockClient.discoverTV.mockResolvedValue({
      page: 1, results: [], total_pages: 0, total_results: 0,
    });
    await handleCompanyFilmography(
      { company_id: 13042, media_type: "tv" }, mockClient as any
    );
    expect(mockClient.discoverTV).toHaveBeenCalledWith({
      with_companies: "13042",
      sort_by: "first_air_date.desc",
      page: 1,
    });
  });

  it("passes custom sort_by and page through", async () => {
    mockClient.discoverMovies.mockResolvedValue({
      page: 2, results: [], total_pages: 3, total_results: 25,
    });
    await handleCompanyFilmography(
      { company_id: 420, media_type: "movie", page: 2, sort_by: "vote_average.desc" },
      mockClient as any
    );
    expect(mockClient.discoverMovies).toHaveBeenCalledWith({
      with_companies: "420",
      sort_by: "vote_average.desc",
      page: 2,
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/tools/reference.test.ts`
Expected: FAIL — `CompanyFilmographySchema` not exported

**Step 3: Implement schema and handler in reference.ts**

Add after the company details section (at end of file):

```typescript
// --- Company Filmography ---

export const CompanyFilmographySchema = z.object({
  company_id: z.number().int().positive().describe("TMDB company ID"),
  media_type: z.enum(["movie", "tv"]).describe("Browse movies or TV shows"),
  page: z.number().int().positive().optional().describe("Page number (default 1)"),
  sort_by: z.string().optional().describe("Sort order (default: release date descending). Examples: 'vote_average.desc', 'popularity.desc'"),
});

export const companyFilmographyTool = buildToolDef(
  "company_filmography",
  "Browse a production company's catalog of movies or TV shows. Returns paginated results sorted by release date (newest first) by default. Get company IDs from the search tool (type: 'company') or company_details.",
  CompanyFilmographySchema
);

export async function handleCompanyFilmography(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { company_id, media_type, page, sort_by } = CompanyFilmographySchema.parse(args);

  const defaultSort = media_type === "movie" ? "primary_release_date.desc" : "first_air_date.desc";

  if (media_type === "movie") {
    const result = await client.discoverMovies({
      with_companies: String(company_id),
      sort_by: sort_by ?? defaultSort,
      page: page ?? 1,
    });
    return JSON.stringify(result, null, 2);
  }

  const result = await client.discoverTV({
    with_companies: String(company_id),
    sort_by: sort_by ?? defaultSort,
    page: page ?? 1,
  });
  return JSON.stringify(result, null, 2);
}
```

Note: `discoverTV` needs `with_companies` in `DiscoverTVParams` — verify it's there (it is, line 142 of tmdb-extended.ts). Also note the default sort differs: movies use `primary_release_date.desc`, TV uses `first_air_date.desc`.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/tools/reference.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/tools/reference.ts tests/tools/reference.test.ts
git commit -m "Add company_filmography tool schema and handler"
```

---

### Task 4: Wire both tools into index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Add imports**

Add to the existing reference.ts import line:

```typescript
searchKeywordsTool, handleSearchKeywords,
companyFilmographyTool, handleCompanyFilmography,
```

**Step 2: Add tool definitions to ListTools handler**

Add after `companyDetailsTool`:

```typescript
searchKeywordsTool,
companyFilmographyTool,
```

**Step 3: Add to dispatch map**

Add after the `company_details` entry:

```typescript
search_keywords: handleSearchKeywords,
company_filmography: handleCompanyFilmography,
```

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (221 existing + new schema/handler tests)

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "Wire search_keywords and company_filmography into index.ts"
```

---

### Task 5: Update discover and company_details tool descriptions

**Files:**
- Modify: `src/tools/discover.ts`
- Modify: `src/tools/reference.ts` (company_details description)

**Step 1: Update discover tool description**

In `src/tools/discover.ts`, change the `discoverTool` description from:

```
"Discover movies or TV shows with 30+ filters. Combine genres, release dates, vote averages, cast/crew, companies, keywords, watch providers, certifications, and more. Use the genres tool first to get genre IDs for filtering."
```

to:

```
"Discover movies or TV shows with 30+ filters. Combine genres, release dates, vote averages, cast/crew, companies, keywords, watch providers, certifications, and more. Use the genres tool for genre IDs and search_keywords for keyword IDs."
```

**Step 2: Update company_details tool description**

In `src/tools/reference.ts`, change the `companyDetailsTool` description from:

```
"Get details about a production company (e.g., A24, Lucasfilm) or TV network (e.g., HBO, Netflix). Returns name, headquarters, logo, and parent company."
```

to:

```
"Get details about a production company (e.g., A24, Lucasfilm) or TV network (e.g., HBO, Netflix). Returns name, headquarters, logo, and parent company. Use company_filmography to browse their catalog."
```

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/tools/discover.ts src/tools/reference.ts
git commit -m "Update discover and company_details descriptions to reference new tools"
```

---

### Task 6: Add live integration tests

**Files:**
- Modify: `tests/integration/live-api.test.ts`

**Step 1: Add keyword search live test**

Inside the `describe.skipIf(!TMDB_TOKEN)("live TMDB API", ...)` block:

```typescript
it("searches keywords and finds 'masculinity'", LIVE_TIMEOUT, async () => {
  const result = await client.searchKeywords("masculinity");
  expect(result.results.length).toBeGreaterThan(0);
  const names = result.results.map(k => k.name);
  expect(names).toContain("masculinity");
});
```

**Step 2: Add company filmography live test**

This tests the full handler (not just client). Import `handleCompanyFilmography` from reference.ts:

```typescript
it("gets Kartemquin Films filmography", LIVE_TIMEOUT, async () => {
  const { handleCompanyFilmography } = await import("../../src/tools/reference.js");
  const result = await handleCompanyFilmography(
    { company_id: 13042, media_type: "movie" }, client
  );
  const parsed = JSON.parse(result);
  expect(parsed.results.length).toBeGreaterThan(0);
  expect(parsed.total_results).toBeGreaterThan(0);
});
```

**Step 3: Run live tests**

Run: `TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/live-api.test.ts`
Expected: PASS (all live tests including new ones)

**Step 4: Run full suite**

Run: `npx vitest run`
Expected: All tests pass, live tests skipped without token

**Step 5: Commit and tag**

```bash
git add tests/integration/live-api.test.ts
git commit -m "Add live integration tests for search_keywords and company_filmography"
```

After code review passes, tag `v0.5.0`:

```bash
git tag v0.5.0
```
