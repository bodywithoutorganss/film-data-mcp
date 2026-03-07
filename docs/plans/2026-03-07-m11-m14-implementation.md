# M14 + M11 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add name-based fallback to `get_person_awards` (M14) and batch query support to `search_keywords` (M11).

**Architecture:** M14 adds an optional `name` field to the existing schema and passes it to the `resolvePerson` helper that already supports name fallback. M11 changes `search_keywords`'s `query` field to accept `string | string[]`; array input triggers parallel TMDB calls with results keyed by query term.

**Tech Stack:** TypeScript, Zod, Vitest, TMDB API

---

### Task 1: M14 — Failing test for name fallback on get_person_awards

**Files:**
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add to the `get_person_awards` describe block in `tests/tools/awards.test.ts`:

```typescript
it("falls back to name search when TMDB and IMDb resolution both fail", async () => {
  mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue(null);
  mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });
  mockWikidataClient.resolvePersonByName.mockResolvedValue({
    wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "name_search",
  });
  mockWikidataClient.getPersonWins.mockResolvedValue([]);
  mockWikidataClient.getPersonNominations.mockResolvedValue([]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

  const result = await handleGetPersonAwards(
    { person_id: 151, name: "Roger Deakins" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.entity.resolvedVia).toBe("name_search");
  expect(mockWikidataClient.resolvePersonByName).toHaveBeenCalledWith("Roger Deakins");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/tools/awards.test.ts`
Expected: FAIL — Zod rejects the `name` field (unrecognized key).

---

### Task 2: M14 — Implement name fallback

**Files:**
- Modify: `src/tools/awards.ts:59-75` (schema + handler)

**Step 3: Update schema and handler**

In `src/tools/awards.ts`, change `GetPersonAwardsSchema` (line 59-61):

```typescript
export const GetPersonAwardsSchema = z.object({
  person_id: z.number().int().positive().describe("TMDB person ID"),
  name: z.string().optional().describe("Person name — used as fallback if TMDB/IMDb ID resolution fails"),
});
```

Update tool description in `getPersonAwardsTool` (line 63-67):

```typescript
export const getPersonAwardsTool = buildToolDef(
  "get_person_awards",
  "Get award wins and nominations for a person. Accepts a TMDB person ID and optional name (used as fallback if ID resolution fails). Returns wins, nominations, and a completeness indicator showing total P166 claims vs. registered awards. Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetPersonAwardsSchema
);
```

Update handler to pass name (line 69-75):

```typescript
export async function handleGetPersonAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { person_id, name } = GetPersonAwardsSchema.parse(args);
  const entity = await resolvePerson(person_id, tmdbClient, wikidataClient, name);
```

**Step 4: Run tests to verify pass**

Run: `npm test -- --run tests/tools/awards.test.ts`
Expected: ALL PASS (including new test)

**Step 5: Commit**

```bash
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "feat(M14): add name fallback to get_person_awards"
```

---

### Task 3: M14 — Verify existing tests still pass and build succeeds

**Step 6: Run full test suite and build**

Run: `npm test && npm run build`
Expected: ALL PASS, clean build

---

### Task 4: M11 — Failing test for batch keyword search

**Files:**
- Modify: `tests/tools/reference.test.ts`

**Step 7: Write the failing test for batch mode**

Add to the `handleSearchKeywords` describe block in `tests/tools/reference.test.ts`:

```typescript
it("accepts array of queries and returns results keyed by query term", async () => {
  mockClient.searchKeywords
    .mockResolvedValueOnce({
      page: 1, results: [{ id: 194226, name: "masculinity" }], total_pages: 1, total_results: 1,
    })
    .mockResolvedValueOnce({
      page: 1, results: [{ id: 15926, name: "fraternity" }], total_pages: 1, total_results: 1,
    });

  const result = await handleSearchKeywords(
    { query: ["masculinity", "fraternity"] }, mockClient as any
  );
  const parsed = JSON.parse(result);

  expect(parsed.masculinity.results[0].id).toBe(194226);
  expect(parsed.fraternity.results[0].id).toBe(15926);
  expect(parsed.masculinity.total_results).toBe(1);
  expect(mockClient.searchKeywords).toHaveBeenCalledTimes(2);
});
```

**Step 8: Run test to verify it fails**

Run: `npm test -- --run tests/tools/reference.test.ts`
Expected: FAIL — Zod rejects array input for `query`.

---

### Task 5: M11 — Failing test for batch mode schema validation

**Files:**
- Modify: `tests/tools/reference.test.ts`

**Step 9: Write schema validation tests for batch mode**

Add to the `SearchKeywordsSchema` describe block:

```typescript
it("accepts array of queries", () => {
  const result = SearchKeywordsSchema.parse({ query: ["masculinity", "fraternity"] });
  expect(result.query).toEqual(["masculinity", "fraternity"]);
});

it("rejects empty array", () => {
  expect(() => SearchKeywordsSchema.parse({ query: [] })).toThrow();
});

it("rejects array with empty strings", () => {
  expect(() => SearchKeywordsSchema.parse({ query: ["valid", ""] })).toThrow();
});
```

**Step 10: Run test to verify failures**

Run: `npm test -- --run tests/tools/reference.test.ts`
Expected: FAIL — schema doesn't accept arrays.

---

### Task 6: M11 — Implement batch keyword search

**Files:**
- Modify: `src/tools/reference.ts:32-50` (schema + handler)

**Step 11: Update schema**

In `src/tools/reference.ts`, change `SearchKeywordsSchema` (line 32-35):

```typescript
export const SearchKeywordsSchema = z.object({
  query: z.union([
    z.string().min(1),
    z.array(z.string().min(1)).min(1),
  ]).describe("Keyword name(s) to search for. Pass a single string or an array of strings for batch lookup (e.g., ['masculinity', 'fraternity'])"),
  page: z.number().int().positive().optional().describe("Page number (default 1). Only applies to single-query mode."),
});
```

Update tool description in `searchKeywordsTool` (line 37-40):

```typescript
export const searchKeywordsTool = buildToolDef(
  "search_keywords",
  "Search for TMDB keyword IDs by name. Accepts a single keyword string or an array of keywords for batch lookup. Use the returned IDs with the discover tool's with_keywords filter to find films by theme. Batch mode returns results keyed by query term.",
  SearchKeywordsSchema
);
```

**Step 12: Update handler**

Replace `handleSearchKeywords` (line 43-50):

```typescript
export async function handleSearchKeywords(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const { query, page } = SearchKeywordsSchema.parse(args);

  if (Array.isArray(query)) {
    const entries = await Promise.all(
      query.map(async (q) => {
        const result = await client.searchKeywords(q);
        return [q, { results: result.results, total_results: result.total_results }] as const;
      })
    );
    return JSON.stringify(Object.fromEntries(entries), null, 2);
  }

  const result = await client.searchKeywords(query, page);
  return JSON.stringify(result, null, 2);
}
```

**Step 13: Run tests to verify all pass**

Run: `npm test -- --run tests/tools/reference.test.ts`
Expected: ALL PASS

**Step 14: Commit**

```bash
git add src/tools/reference.ts tests/tools/reference.test.ts
git commit -m "feat(M11): add batch query support to search_keywords"
```

---

### Task 7: M11 — Test that single-query mode is unchanged

**Files:**
- Modify: `tests/tools/reference.test.ts`

**Step 15: Add regression test for single-string behavior**

Add to the `handleSearchKeywords` describe block (verifies existing behavior with the union schema):

```typescript
it("still works with single string query after union schema change", async () => {
  mockClient.searchKeywords.mockResolvedValue({
    page: 1, results: [{ id: 194226, name: "masculinity" }], total_pages: 1, total_results: 1,
  });
  const result = await handleSearchKeywords({ query: "masculinity" }, mockClient as any);
  const parsed = JSON.parse(result);
  expect(parsed.page).toBe(1);
  expect(parsed.results[0].id).toBe(194226);
  expect(parsed.total_pages).toBe(1);
});
```

**Step 16: Run tests**

Run: `npm test -- --run tests/tools/reference.test.ts`
Expected: ALL PASS

**Step 17: Commit**

```bash
git add tests/tools/reference.test.ts
git commit -m "test: add single-query regression test for search_keywords"
```

---

### Task 8: Full suite verification and build

**Step 18: Run full test suite and build**

Run: `npm test && npm run build`
Expected: ALL PASS, clean build

**Step 19: Commit build if needed and update CLAUDE.md**

Update CLAUDE.md tool table description for `search_keywords` to mention batch support, and `get_person_awards` to mention name fallback.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for M11 + M14"
```
