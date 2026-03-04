# M7: Usability Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 usability issues in MCP tool handlers discovered during LLM smart query evaluation. All changes are handler-level post-processing — no new tools, no SPARQL changes.

**Architecture:** Each fix adds optional parameters or post-processing to existing handlers. Credits and watch providers get size-reduction filters. Award history gets year-grouping. Wikidata labels get QID cleanup. All new params are optional with backward-compatible defaults.

**Tech Stack:** TypeScript, Zod schemas, Vitest, existing TMDBClient/WikidataClient

**Design doc:** `docs/plans/2026-03-04-m7-usability-fixes-design.md`

**Note:** Fix 5 (server.json version sync) is already done — both files show `0.1.1`.

---

### Task 1: Credits top-N filtering — schema changes

**Files:**
- Modify: `src/tools/details.ts:12-18` (MovieDetailsSchema)
- Modify: `src/tools/details.ts:39-45` (TVDetailsSchema)
- Modify: `src/tools/details.ts:66-72` (PersonDetailsSchema)

**Step 1: Add `credits_limit` to MovieDetailsSchema**

Add after the `append` field:

```typescript
export const MovieDetailsSchema = z.object({
  movie_id: z.number().int().positive().describe("TMDB movie ID"),
  append: z
    .array(z.enum(movieAppendFields))
    .optional()
    .describe("Additional data to include: credits, videos, images, watch/providers, keywords, recommendations, similar, release_dates, external_ids"),
  credits_limit: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(20)
    .describe("Max cast and crew entries when credits is appended. Default 20. Pass 0 for unlimited."),
});
```

**Step 2: Add `credits_limit` to TVDetailsSchema**

Same pattern — add `credits_limit` with default 20 after `append`.

**Step 3: Add `credits_limit` to PersonDetailsSchema**

Same pattern — add `credits_limit` with default 20 after `append`.

**Step 4: Update tool descriptions to mention the limit**

Update `movieDetailsTool`, `tvDetailsTool`, `personDetailsTool` descriptions to mention credits are limited to top 20 by default.

```typescript
export const movieDetailsTool = buildToolDef(
  "movie_details",
  "Get full movie details from TMDB. Optionally bundle credits, videos, images, watch providers, and more in a single call using the append parameter. Credits are limited to top 20 cast + crew by default (use credits_limit to adjust, 0 for unlimited).",
  MovieDetailsSchema
);
```

**Step 5: Run `npm test` to verify schemas still validate**

Run: `npm test -- tests/tools/details.test.ts`
Expected: Existing tests pass (new field is optional with default)

**Step 6: Commit**

```bash
git add src/tools/details.ts
git commit -m "Add credits_limit parameter to detail tool schemas"
```

---

### Task 2: Credits top-N filtering — schema tests

**Files:**
- Modify: `tests/tools/details.test.ts`

**Step 1: Write failing tests for credits_limit in MovieDetailsSchema**

Add to the `MovieDetailsSchema` describe block:

```typescript
it("defaults credits_limit to 20", () => {
  const result = MovieDetailsSchema.parse({ movie_id: 550 });
  expect(result.credits_limit).toBe(20);
});

it("accepts custom credits_limit", () => {
  const result = MovieDetailsSchema.parse({ movie_id: 550, credits_limit: 5 });
  expect(result.credits_limit).toBe(5);
});

it("accepts credits_limit 0 for unlimited", () => {
  const result = MovieDetailsSchema.parse({ movie_id: 550, credits_limit: 0 });
  expect(result.credits_limit).toBe(0);
});

it("rejects negative credits_limit", () => {
  expect(() => MovieDetailsSchema.parse({ movie_id: 550, credits_limit: -1 })).toThrow();
});
```

**Step 2: Write failing tests for credits_limit in TVDetailsSchema**

Same 4 tests adapted for `series_id: 1396`.

**Step 3: Write failing tests for credits_limit in PersonDetailsSchema**

Same 4 tests adapted for `person_id: 287`.

**Step 4: Run tests**

Run: `npm test -- tests/tools/details.test.ts`
Expected: All pass (schema changes from Task 1 support these)

**Step 5: Commit**

```bash
git add tests/tools/details.test.ts
git commit -m "Add credits_limit schema tests for detail tools"
```

---

### Task 3: Credits top-N filtering — handler logic + tests

**Files:**
- Modify: `src/tools/details.ts:26-33` (handleMovieDetails)
- Modify: `src/tools/details.ts:53-60` (handleTVDetails)
- Modify: `src/tools/details.ts:80-87` (handlePersonDetails)
- Modify: `tests/tools/details.test.ts`

**Step 1: Write failing tests for handleMovieDetails credits slicing**

Add to the `handleMovieDetails` describe block:

```typescript
it("slices credits to credits_limit", async () => {
  const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
  const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `Crew ${i}` }));
  mockClient.getMovieDetails.mockResolvedValue({
    id: 550, title: "Fight Club",
    credits: { cast, crew },
  });

  const result = JSON.parse(
    await handleMovieDetails({ movie_id: 550, append: ["credits"], credits_limit: 10 }, mockClient as any)
  );

  expect(result.credits.cast).toHaveLength(10);
  expect(result.credits.crew).toHaveLength(10);
  expect(result._truncated).toEqual({ total_cast: 50, total_crew: 40 });
});

it("does not slice when credits_limit is 0", async () => {
  const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
  mockClient.getMovieDetails.mockResolvedValue({
    id: 550, title: "Fight Club",
    credits: { cast, crew: [] },
  });

  const result = JSON.parse(
    await handleMovieDetails({ movie_id: 550, append: ["credits"], credits_limit: 0 }, mockClient as any)
  );

  expect(result.credits.cast).toHaveLength(50);
  expect(result._truncated).toBeUndefined();
});

it("does not add _truncated when under limit", async () => {
  const cast = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
  mockClient.getMovieDetails.mockResolvedValue({
    id: 550, title: "Fight Club",
    credits: { cast, crew: [] },
  });

  const result = JSON.parse(
    await handleMovieDetails({ movie_id: 550, append: ["credits"] }, mockClient as any)
  );

  expect(result.credits.cast).toHaveLength(5);
  expect(result._truncated).toBeUndefined();
});

it("skips slicing when credits not in append", async () => {
  mockClient.getMovieDetails.mockResolvedValue({ id: 550, title: "Fight Club" });

  const result = JSON.parse(
    await handleMovieDetails({ movie_id: 550 }, mockClient as any)
  );

  expect(result._truncated).toBeUndefined();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/tools/details.test.ts`
Expected: New tests FAIL (no slicing logic yet)

**Step 3: Implement handleMovieDetails slicing**

Replace `handleMovieDetails`:

```typescript
export async function handleMovieDetails(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { movie_id, append, credits_limit } = MovieDetailsSchema.parse(args);
  const result = await client.getMovieDetails(movie_id, append as string[] | undefined);
  truncateCredits(result, credits_limit);
  return JSON.stringify(result, null, 2);
}
```

Add a helper function before the handlers (after the schema definitions, before the first handler):

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function truncateCredits(result: any, limit: number): void {
  if (limit === 0) return;

  const credits = result.credits ?? result.aggregate_credits;
  if (!credits) return;

  const totalCast = credits.cast?.length ?? 0;
  const totalCrew = credits.crew?.length ?? 0;
  const needsTruncation = totalCast > limit || totalCrew > limit;

  if (!needsTruncation) return;

  if (credits.cast) credits.cast = credits.cast.slice(0, limit);
  if (credits.crew) credits.crew = credits.crew.slice(0, limit);
  result._truncated = { total_cast: totalCast, total_crew: totalCrew };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/tools/details.test.ts`
Expected: PASS

**Step 5: Write failing tests for handleTVDetails credits slicing**

Similar to movie tests but using `series_id: 1396` and testing both `credits` and `aggregate_credits` keys:

```typescript
it("slices aggregate_credits to credits_limit", async () => {
  const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Actor ${i}` }));
  const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `Crew ${i}` }));
  mockClient.getTVDetails.mockResolvedValue({
    id: 1396, name: "Breaking Bad",
    aggregate_credits: { cast, crew },
  });

  const result = JSON.parse(
    await handleTVDetails({ series_id: 1396, append: ["aggregate_credits"], credits_limit: 10 }, mockClient as any)
  );

  expect(result.aggregate_credits.cast).toHaveLength(10);
  expect(result.aggregate_credits.crew).toHaveLength(10);
  expect(result._truncated).toEqual({ total_cast: 50, total_crew: 40 });
});
```

**Step 6: Implement handleTVDetails slicing**

Same pattern — add `truncateCredits(result, credits_limit)` call.

```typescript
export async function handleTVDetails(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { series_id, append, credits_limit } = TVDetailsSchema.parse(args);
  const result = await client.getTVDetails(series_id, append as string[] | undefined);
  truncateCredits(result, credits_limit);
  return JSON.stringify(result, null, 2);
}
```

**Step 7: Run tests to verify they pass**

Run: `npm test -- tests/tools/details.test.ts`
Expected: PASS

**Step 8: Write failing tests for handlePersonDetails credits slicing**

Person credits have a different structure — `combined_credits.cast`, `combined_credits.crew`, `movie_credits.cast`, etc. The `truncateCredits` helper should handle all of these. Write tests:

```typescript
it("slices combined_credits to credits_limit", async () => {
  const cast = Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
  const crew = Array.from({ length: 40 }, (_, i) => ({ id: i, title: `Movie ${i}` }));
  mockClient.getPersonDetails.mockResolvedValue({
    id: 5914, name: "Roger Deakins",
    combined_credits: { cast, crew },
  });

  const result = JSON.parse(
    await handlePersonDetails({ person_id: 5914, append: ["combined_credits"], credits_limit: 10 }, mockClient as any)
  );

  expect(result.combined_credits.cast).toHaveLength(10);
  expect(result.combined_credits.crew).toHaveLength(10);
  expect(result._truncated).toEqual({ total_cast: 50, total_crew: 40 });
});
```

**Step 9: Implement handlePersonDetails slicing**

Person details has `combined_credits`, `movie_credits`, and `tv_credits` as possible credit keys. Extend `truncateCredits` to also check these:

```typescript
function truncateCredits(result: any, limit: number): void {
  if (limit === 0) return;

  const creditKeys = ["credits", "aggregate_credits", "combined_credits", "movie_credits", "tv_credits"];
  let applied = false;

  for (const key of creditKeys) {
    const credits = result[key];
    if (!credits) continue;

    const totalCast = credits.cast?.length ?? 0;
    const totalCrew = credits.crew?.length ?? 0;
    const needsTruncation = totalCast > limit || totalCrew > limit;

    if (!needsTruncation) continue;

    if (credits.cast) credits.cast = credits.cast.slice(0, limit);
    if (credits.crew) credits.crew = credits.crew.slice(0, limit);

    if (!applied) {
      result._truncated = { total_cast: totalCast, total_crew: totalCrew };
      applied = true;
    }
  }
}
```

And update `handlePersonDetails`:

```typescript
export async function handlePersonDetails(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { person_id, append, credits_limit } = PersonDetailsSchema.parse(args);
  const result = await client.getPersonDetails(person_id, append as string[] | undefined);
  truncateCredits(result, credits_limit);
  return JSON.stringify(result, null, 2);
}
```

**Step 10: Run all tests**

Run: `npm test -- tests/tools/details.test.ts`
Expected: PASS

**Step 11: Commit**

```bash
git add src/tools/details.ts tests/tools/details.test.ts
git commit -m "Add credits top-N filtering to detail handlers"
```

---

### Task 4: Watch providers region filter — schema + handler + tests

**Files:**
- Modify: `src/tools/reference.ts:31-34` (WatchProvidersSchema)
- Modify: `src/tools/reference.ts:42-57` (handleWatchProviders)
- Modify: `tests/tools/reference.test.ts`

**Step 1: Add `region` to WatchProvidersSchema**

```typescript
export const WatchProvidersSchema = z.object({
  media_type: z.enum(["movie", "tv"]).describe("Movie or TV"),
  id: z.number().int().positive().optional().describe("TMDB movie or TV ID. Omit to list all available providers"),
  region: z
    .string()
    .length(2)
    .optional()
    .describe("ISO 3166-1 country code (e.g., 'US', 'GB'). Filters results to a single region. Recommended to reduce response size."),
});
```

**Step 2: Update tool description**

```typescript
export const watchProvidersTool = buildToolDef(
  "watch_providers",
  "Get streaming/rent/buy availability for a movie or TV show by region, or list all available watch providers. Powered by JustWatch data. Use the region parameter (e.g., 'US') to get results for a single country — recommended to avoid large responses.",
  WatchProvidersSchema
);
```

**Step 3: Write failing tests for region filtering**

Add to `tests/tools/reference.test.ts` in the `WatchProvidersSchema` block:

```typescript
it("accepts region parameter", () => {
  const result = WatchProvidersSchema.parse({ media_type: "movie", id: 550, region: "US" });
  expect(result.region).toBe("US");
});

it("rejects region that is not 2 characters", () => {
  expect(() =>
    WatchProvidersSchema.parse({ media_type: "movie", id: 550, region: "USA" })
  ).toThrow();
});
```

Add to `handleWatchProviders` block:

```typescript
it("filters to single region when region is set", async () => {
  mockClient.getMovieWatchProviders.mockResolvedValue({
    id: 550,
    results: {
      US: { link: "https://...", flatrate: [{ provider_name: "Netflix" }] },
      GB: { link: "https://...", flatrate: [{ provider_name: "Prime" }] },
    },
  });

  const result = JSON.parse(
    await handleWatchProviders({ media_type: "movie", id: 550, region: "US" }, mockClient as any)
  );

  expect(result.id).toBe(550);
  expect(result.results).toHaveProperty("US");
  expect(result.results).not.toHaveProperty("GB");
});

it("returns empty results with note when region not found", async () => {
  mockClient.getMovieWatchProviders.mockResolvedValue({
    id: 550,
    results: {
      US: { link: "https://...", flatrate: [] },
    },
  });

  const result = JSON.parse(
    await handleWatchProviders({ media_type: "movie", id: 550, region: "JP" }, mockClient as any)
  );

  expect(result.results).toEqual({});
  expect(result._note).toContain("JP");
});

it("ignores region when id is omitted", async () => {
  mockClient.getWatchProviderList.mockResolvedValue({ results: [{ provider_name: "Netflix" }] });

  const result = JSON.parse(
    await handleWatchProviders({ media_type: "movie", region: "US" }, mockClient as any)
  );

  expect(result.results).toHaveLength(1);
  expect(mockClient.getWatchProviderList).toHaveBeenCalledWith("movie");
});
```

**Step 4: Run tests to verify they fail**

Run: `npm test -- tests/tools/reference.test.ts`
Expected: New handler tests FAIL

**Step 5: Implement region filtering in handleWatchProviders**

```typescript
export async function handleWatchProviders(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { media_type, id, region } = WatchProvidersSchema.parse(args);

  if (id) {
    const result = media_type === "movie"
      ? await client.getMovieWatchProviders(id)
      : await client.getTVWatchProviders(id);

    if (region) {
      const regionData = (result as any).results?.[region];
      if (regionData) {
        (result as any).results = { [region]: regionData };
      } else {
        (result as any).results = {};
        (result as any)._note = `No watch provider data found for region "${region}"`;
      }
    }

    return JSON.stringify(result, null, 2);
  }

  const result = await client.getWatchProviderList(media_type);
  return JSON.stringify(result, null, 2);
}
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- tests/tools/reference.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/tools/reference.ts tests/tools/reference.test.ts
git commit -m "Add region filter to watch providers tool"
```

---

### Task 5: Award history year-grouping — handler + tests

**Files:**
- Modify: `src/tools/awards.ts:112-123` (handleGetAwardHistory)
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write failing tests for year-grouping**

Add to `tests/tools/awards.test.ts` inside the `get_award_history` describe block:

```typescript
it("groups results by year", async () => {
  mockWikidataClient.getAwardHistory.mockResolvedValue([
    { recipientId: "Q1", recipientLabel: "Roger Deakins", year: 2020, forWork: { wikidataId: "Q2", label: "1917" } },
    { recipientId: "Q3", recipientLabel: "1917", year: 2020 },
    { recipientId: "Q4", recipientLabel: "Emmanuel Lubezki", year: 2015 },
  ]);

  const result = JSON.parse(
    await handleGetAwardHistory(
      { category: "academy-best-cinematography" },
      mockTmdbClient as any,
      mockWikidataClient as any
    )
  );

  expect(result.history).toHaveLength(2);
  expect(result.history[0].year).toBe(2020);
  expect(result.history[0].recipients).toHaveLength(2);
  expect(result.history[0].recipients[0].label).toBe("Roger Deakins");
  expect(result.history[1].year).toBe(2015);
  expect(result.history[1].recipients).toHaveLength(1);
});

it("groups entries without year under null", async () => {
  mockWikidataClient.getAwardHistory.mockResolvedValue([
    { recipientId: "Q1", recipientLabel: "Alice", year: 2020 },
    { recipientId: "Q2", recipientLabel: "Bob" },
  ]);

  const result = JSON.parse(
    await handleGetAwardHistory(
      { category: "academy-best-cinematography" },
      mockTmdbClient as any,
      mockWikidataClient as any
    )
  );

  expect(result.history).toHaveLength(2);
  const nullGroup = result.history.find((h: any) => h.year === null);
  expect(nullGroup).toBeDefined();
  expect(nullGroup.recipients).toHaveLength(1);
  expect(nullGroup.recipients[0].label).toBe("Bob");
});

it("handles single-recipient years", async () => {
  mockWikidataClient.getAwardHistory.mockResolvedValue([
    { recipientId: "Q1", recipientLabel: "Alice", year: 2023 },
  ]);

  const result = JSON.parse(
    await handleGetAwardHistory(
      { category: "academy-best-cinematography" },
      mockTmdbClient as any,
      mockWikidataClient as any
    )
  );

  expect(result.history).toHaveLength(1);
  expect(result.history[0].year).toBe(2023);
  expect(result.history[0].recipients).toHaveLength(1);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/tools/awards.test.ts`
Expected: Tests FAIL (handler returns flat array, not grouped)

**Step 3: Implement year-grouping in handleGetAwardHistory**

```typescript
export async function handleGetAwardHistory(
  args: unknown,
  _tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { category } = GetAwardHistorySchema.parse(args);
  const cat = findCategory(category);
  if (!cat) throw new Error(`Unknown award category: ${category}`);

  const entries = await wikidataClient.getAwardHistory(cat.wikidataId);

  const groups = new Map<number | null, Array<{ id: string; label: string; forWork?: { wikidataId: string; label: string } }>>();

  for (const entry of entries) {
    const year = entry.year ?? null;
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push({
      id: entry.recipientId,
      label: entry.recipientLabel,
      ...(entry.forWork ? { forWork: entry.forWork } : {}),
    });
  }

  const history = Array.from(groups.entries())
    .sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return b[0] - a[0];
    })
    .map(([year, recipients]) => ({ year, recipients }));

  return JSON.stringify({ category: cat.label, ceremony: cat.ceremony, history }, null, 2);
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/tools/awards.test.ts`
Expected: PASS

**Note:** This changes the return format. Check existing tests for `get_award_history` to confirm they don't assert the old flat format. If they do, update them to match the grouped format.

**Step 5: Commit**

```bash
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "Group award history results by year"
```

---

### Task 6: QID label cleanup — helper + tests

**Files:**
- Modify: `src/utils/wikidata-client.ts` (add `cleanLabel` helper, apply in SPARQL result mappers)
- Modify: `tests/utils/wikidata.test.ts`

**Step 1: Write failing tests for cleanLabel**

The `cleanLabel` method will be private, so test it indirectly through public methods. However, we can test the behavior by checking the output of the query result mappers. Since the SPARQL client is tested with mocked `executeSparql`, we can pass QID-like labels through the mocks.

Add to `tests/utils/wikidata.test.ts`:

```typescript
describe("QID label cleanup", () => {
  it("replaces QID-like labels with Unknown (QID) in award history", async () => {
    // Mock executeSparql to return a binding with a QID-like label
    vi.spyOn(client as any, "executeSparql").mockResolvedValue({
      results: {
        bindings: [
          {
            recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q585668" },
            recipientLabel: { type: "literal", value: "Q585668" },
            date: { type: "literal", value: "2020-01-01" },
          },
        ],
      },
    });

    const result = await client.getAwardHistory("Q131520");
    expect(result[0].recipientLabel).toBe("Unknown (Q585668)");
  });

  it("preserves normal labels", async () => {
    vi.spyOn(client as any, "executeSparql").mockResolvedValue({
      results: {
        bindings: [
          {
            recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
            recipientLabel: { type: "literal", value: "Roger Deakins" },
            date: { type: "literal", value: "2020-01-01" },
          },
        ],
      },
    });

    const result = await client.getAwardHistory("Q131520");
    expect(result[0].recipientLabel).toBe("Roger Deakins");
  });

  it("preserves Unknown fallback when label is missing entirely", async () => {
    vi.spyOn(client as any, "executeSparql").mockResolvedValue({
      results: {
        bindings: [
          {
            recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
            date: { type: "literal", value: "2020-01-01" },
          },
        ],
      },
    });

    const result = await client.getAwardHistory("Q131520");
    expect(result[0].recipientLabel).toBe("Unknown");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/utils/wikidata.test.ts`
Expected: First test FAILS (QID passed through unchanged)

**Step 3: Implement cleanLabel and apply it**

Add private helper to `WikidataClient`:

```typescript
private cleanLabel(label: string): string {
  return /^Q\d+$/.test(label) ? `Unknown (${label})` : label;
}
```

Apply it in every label extraction point. Update these methods:

In `parseResolvedEntity` (line 41):
```typescript
label: this.cleanLabel(first.entityLabel?.value ?? "Unknown"),
```

In `queryAwards` (line 123, the `.map` callback):
```typescript
label: this.cleanLabel(b.awardLabel?.value ?? "Unknown"),
```

In `getPersonNominations` (line 152-156, the `.map` callback):
```typescript
label: this.cleanLabel(b.awardLabel?.value ?? "Unknown"),
...
forWork: b.forWork
  ? { wikidataId: this.extractEntityId(b.forWork.value), label: this.cleanLabel(b.forWorkLabel?.value ?? "Unknown") }
  : undefined,
```

In `getAwardHistory` (line 183-188, the `.map` callback):
```typescript
recipientLabel: this.cleanLabel(b.recipientLabel?.value ?? "Unknown"),
...
forWork: b.forWork
  ? { wikidataId: this.extractEntityId(b.forWork.value), label: this.cleanLabel(b.forWorkLabel?.value ?? "Unknown") }
  : undefined,
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/utils/wikidata.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/utils/wikidata-client.ts tests/utils/wikidata.test.ts
git commit -m "Clean up QID-like labels in Wikidata results"
```

---

### Task 7: Update docs + final commit

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `ROADMAP.md`

**Step 1: Update CLAUDE.md response size section**

Replace the "Response Size Considerations" section to reflect the new filtering:

- Credits are now limited to top 20 by default (adjustable via `credits_limit`)
- Watch providers now support `region` parameter
- Remove "no region filter yet" wording

**Step 2: Update README.md LLM Context Tips**

Update the tips to mention the new parameters:

- Credits: mention `credits_limit` parameter and default behavior
- Watch providers: mention `region` parameter
- Remove "planned for a future release" language about region filter

**Step 3: Update ROADMAP.md**

Mark M7 as complete with final test count and time tracking.

**Step 4: Run full test suite one more time**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add CLAUDE.md README.md ROADMAP.md
git commit -m "Update docs for M7 usability fixes"
```

**Step 6: Tag release**

```bash
git tag v0.4.0
```
