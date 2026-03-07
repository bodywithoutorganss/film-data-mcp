# M13 Awards Registry Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Peabody Awards, Gotham Awards, Emmy documentary categories, and Guggenheim Fellowship to the awards registry, including qualifier-aware SPARQL queries for Guggenheim film fellows.

**Architecture:** Registry data entries (ceremonies + categories) in `awards-registry.ts`, one new optional `qualifier` field on `AwardCategory`, one optional parameter on `getAwardHistory()` in `wikidata-client.ts`, and a one-line passthrough in `awards.ts`. TDD throughout.

**Tech Stack:** TypeScript, Zod, Vitest, Wikidata SPARQL

**Design doc:** `docs/plans/2026-03-07-m13-design.md`
**Feasibility study:** `docs/plans/2026-03-07-m13-feasibility-study.md`

---

### Task 1: Add `"fellowship"` domain and `qualifier` field to AwardCategory

**Files:**
- Modify: `src/types/awards-registry.ts`
- Test: `tests/types/awards-registry.test.ts`

**Step 1: Write failing tests**

Add to `tests/types/awards-registry.test.ts` inside the existing `describe("awards registry")` block:

```typescript
it("includes 'fellowship' as a valid AwardDomain", () => {
  const domains: AwardDomain[] = ["fellowship"];
  expect(domains[0]).toBe("fellowship");
});

it("supports optional qualifier on AwardCategory", () => {
  const cat: AwardCategory = {
    id: "test-qualified",
    ceremony: "test",
    label: "Test",
    wikidataId: "Q1",
    domain: "fellowship",
    qualifier: { property: "P101", values: ["Q11424"] },
  };
  expect(cat.qualifier).toBeDefined();
  expect(cat.qualifier!.property).toBe("P101");
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: TypeScript compile errors — `"fellowship"` is not assignable to `AwardDomain`, `qualifier` does not exist on `AwardCategory`.

**Step 3: Implement the type changes**

In `src/types/awards-registry.ts`:

Add `| "fellowship"` to the `AwardDomain` union type (after `"short"`).

Add optional `qualifier` to `AwardCategory` interface:
```typescript
export interface AwardCategory {
  id: string;
  ceremony: string;
  label: string;
  wikidataId: string;
  domain: AwardDomain;
  qualifier?: { property: string; values: string[] };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: All tests pass.

**Step 5: Commit**

```
git add src/types/awards-registry.ts tests/types/awards-registry.test.ts
git commit -m "feat(M13): add fellowship domain and qualifier field to AwardCategory"
```

---

### Task 2: Add Peabody Awards to registry

**Files:**
- Modify: `src/types/awards-registry.ts`
- Test: `tests/types/awards-registry.test.ts`

**Step 1: Write failing tests**

```typescript
it("contains Peabody Awards ceremony", () => {
  const peabody = findCeremony("peabody");
  expect(peabody).toBeDefined();
  expect(peabody!.wikidataId).toBe("Q838121");
  expect(peabody!.type).toBe("ceremony");
});

it("contains Peabody award category in documentary domain", () => {
  const cat = findCategory("peabody-award");
  expect(cat).toBeDefined();
  expect(cat!.wikidataId).toBe("Q838121");
  expect(cat!.ceremony).toBe("peabody");
  expect(cat!.domain).toBe("documentary");
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: FAIL — `findCeremony("peabody")` returns undefined.

**Step 3: Add Peabody to the registry**

In `src/types/awards-registry.ts`, add to `CEREMONIES` array (in a new comment section after the doc festivals):

```typescript
// Documentary and nonfiction ceremonies
{ id: "peabody", label: "Peabody Awards", wikidataId: "Q838121", type: "ceremony" },
```

Add to `AWARD_CATEGORIES` array:

```typescript
// --- Peabody Awards ---
{ id: "peabody-award", ceremony: "peabody", label: "Peabody Award", wikidataId: "Q838121", domain: "documentary" },
```

Note: Peabody uses the same QID (Q838121) for both ceremony and category — it's a single award with no sub-categories. The existing duplicate-QID test in `awards-registry.test.ts` checks `AWARD_CATEGORIES` and `CEREMONIES` separately, so this won't trigger a false positive.

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: All tests pass.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. No regressions.

**Step 6: Commit**

```
git add src/types/awards-registry.ts tests/types/awards-registry.test.ts
git commit -m "feat(M13): add Peabody Awards to registry"
```

---

### Task 3: Verify and add Gotham Awards to registry

**Files:**
- Modify: `src/types/awards-registry.ts`
- Test: `tests/types/awards-registry.test.ts`

**Step 1: Verify unconfirmed Gotham QIDs via SPARQL**

Run these curl commands to find and verify QIDs for Gotham Best Feature and Breakthrough Director:

```bash
# Search for Gotham Best Feature
curl -s 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Gotham+Award+Best+Feature&language=en&format=json&limit=10' | python3 -c "import sys,json; data=json.load(sys.stdin); [print(r['id'], r.get('label',''), '-', r.get('description','')) for r in data.get('search',[])]"

# Search for Gotham Breakthrough Director
curl -s 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Gotham+Award+Breakthrough+Director&language=en&format=json&limit=10' | python3 -c "import sys,json; data=json.load(sys.stdin); [print(r['id'], r.get('label',''), '-', r.get('description','')) for r in data.get('search',[])]"
```

For each QID found, verify P166 claims exist:
```bash
curl -s -G 'https://query.wikidata.org/sparql' \
  --data-urlencode 'format=json' \
  --data-urlencode 'query=SELECT (COUNT(?item) AS ?count) WHERE { ?item wdt:P166 wd:QXXXXX }' \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['results']['bindings'][0]['count']['value'])"
```

If a QID cannot be found or returns 0 P166 claims, skip that category. Proceed with only verified QIDs.

**Step 2: Write failing tests**

```typescript
it("contains Gotham Awards ceremony", () => {
  const gotham = findCeremony("gotham");
  expect(gotham).toBeDefined();
  expect(gotham!.wikidataId).toBe("Q1538791");
  expect(gotham!.type).toBe("ceremony");
});

it("contains Gotham documentary categories", () => {
  const gothamCats = findCategoriesByCeremony("gotham");
  expect(gothamCats.length).toBeGreaterThanOrEqual(2);

  const bestDoc = findCategory("gotham-best-documentary");
  expect(bestDoc).toBeDefined();
  expect(bestDoc!.wikidataId).toBe("Q20978457");
  expect(bestDoc!.domain).toBe("documentary");

  const nonfiction = findCategory("gotham-breakthrough-nonfiction");
  expect(nonfiction).toBeDefined();
  expect(nonfiction!.wikidataId).toBe("Q109259295");
  expect(nonfiction!.domain).toBe("documentary");
});
```

Add additional assertions for Best Feature and Breakthrough Director using the QIDs verified in Step 1. If either was skipped, omit its test.

**Step 3: Run tests to verify they fail**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: FAIL — `findCeremony("gotham")` returns undefined.

**Step 4: Add Gotham to the registry**

In `src/types/awards-registry.ts`, add to `CEREMONIES`:

```typescript
{ id: "gotham", label: "Gotham Awards", wikidataId: "Q1538791", type: "ceremony" },
```

Add to `AWARD_CATEGORIES` (use verified QIDs from Step 1):

```typescript
// --- Gotham Awards ---
{ id: "gotham-best-documentary", ceremony: "gotham", label: "Gotham Award for Best Documentary Feature", wikidataId: "Q20978457", domain: "documentary" },
{ id: "gotham-breakthrough-nonfiction", ceremony: "gotham", label: "Gotham Award for Breakthrough Nonfiction Series", wikidataId: "Q109259295", domain: "documentary" },
// Add gotham-best-feature and gotham-breakthrough-director with verified QIDs from Step 1
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: All tests pass.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
git add src/types/awards-registry.ts tests/types/awards-registry.test.ts
git commit -m "feat(M13): add Gotham Awards to registry (2-4 categories)"
```

---

### Task 4: Verify and add Emmy documentary categories

**Files:**
- Modify: `src/types/awards-registry.ts`
- Test: `tests/types/awards-registry.test.ts`

**Step 1: Verify the 5 known Emmy doc QIDs and search for the 2 unconfirmed**

Verify each of the 5 known QIDs returns at least 1 P166 result:

```bash
for QID in Q24895159 Q24895051 Q24900788 Q25345783 Q30632982; do
  COUNT=$(curl -s -G 'https://query.wikidata.org/sparql' \
    --data-urlencode 'format=json' \
    --data-urlencode "query=SELECT (COUNT(?item) AS ?count) WHERE { ?item wdt:P166 wd:$QID }" \
    | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['results']['bindings'][0]['count']['value'])")
  echo "$QID: $COUNT P166 claims"
done
```

Search for the 2 remaining Emmy doc/nonfiction categories:

```bash
curl -s -G 'https://query.wikidata.org/sparql' \
  --data-urlencode 'format=json' \
  --data-urlencode 'query=SELECT ?cat ?catLabel WHERE { ?cat wdt:P361 wd:Q1044427 . ?cat rdfs:label ?catLabel . FILTER(LANG(?catLabel) = "en") . FILTER(CONTAINS(LCASE(?catLabel), "documentary") || CONTAINS(LCASE(?catLabel), "nonfiction")) } LIMIT 20' \
  | python3 -c "import sys,json; data=json.load(sys.stdin); [print(r['cat']['value'].split('/')[-1], r['catLabel']['value']) for r in data['results']['bindings']]"
```

Only add QIDs that return at least 1 P166 result.

**Step 2: Write failing tests**

```typescript
it("contains Emmy documentary categories under existing emmys ceremony", () => {
  const emmyCats = findCategoriesByCeremony("emmys");
  // Existing Emmy categories (10) + new doc categories
  expect(emmyCats.length).toBeGreaterThan(10);

  const docSpecial = findCategory("emmys-documentary-special");
  expect(docSpecial).toBeDefined();
  expect(docSpecial!.wikidataId).toBe("Q24895159");
  expect(docSpecial!.ceremony).toBe("emmys");
  expect(docSpecial!.domain).toBe("documentary");
});
```

**Step 3: Run tests to verify they fail**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: FAIL — `findCategory("emmys-documentary-special")` returns undefined.

**Step 4: Add Emmy doc categories**

In `src/types/awards-registry.ts`, add under the existing `// --- Primetime Emmy Awards ---` section:

```typescript
// Emmy documentary/nonfiction categories
{ id: "emmys-documentary-special", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Documentary or Nonfiction Special", wikidataId: "Q24895159", domain: "documentary" },
{ id: "emmys-directing-documentary", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Directing for Documentary/Nonfiction Programming", wikidataId: "Q24895051", domain: "director" },
{ id: "emmys-cinematography-nonfiction", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Cinematography for Nonfiction Programming", wikidataId: "Q24900788", domain: "cinematography" },
{ id: "emmys-writing-nonfiction", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Writing for Nonfiction Programming", wikidataId: "Q25345783", domain: "screenplay" },
{ id: "emmys-sound-mixing-nonfiction", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Sound Mixing for Nonfiction Programming", wikidataId: "Q30632982", domain: "score" },
// Add any additional verified categories from Step 1
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: All tests pass.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
git add src/types/awards-registry.ts tests/types/awards-registry.test.ts
git commit -m "feat(M13): add Emmy documentary categories to registry"
```

---

### Task 5: Add Guggenheim Fellowship to registry

**Files:**
- Modify: `src/types/awards-registry.ts`
- Test: `tests/types/awards-registry.test.ts`

**Step 1: Write failing tests**

```typescript
it("contains Guggenheim Fellowship ceremony", () => {
  const guggenheim = findCeremony("guggenheim");
  expect(guggenheim).toBeDefined();
  expect(guggenheim!.wikidataId).toBe("Q1316544");
  expect(guggenheim!.type).toBe("fellowship");
});

it("contains Guggenheim film category with qualifier", () => {
  const cat = findCategory("guggenheim-film");
  expect(cat).toBeDefined();
  expect(cat!.wikidataId).toBe("Q1316544");
  expect(cat!.ceremony).toBe("guggenheim");
  expect(cat!.domain).toBe("fellowship");
  expect(cat!.qualifier).toEqual({
    property: "P101",
    values: ["Q11424", "Q34508"],
  });
});

it("includes Guggenheim in fellowship domain lookup", () => {
  const fellowships = findCategoriesByDomain("fellowship");
  expect(fellowships.length).toBeGreaterThanOrEqual(1);
  expect(fellowships.some((c) => c.id === "guggenheim-film")).toBe(true);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: FAIL — `findCeremony("guggenheim")` returns undefined.

**Step 3: Add Guggenheim to registry**

In `src/types/awards-registry.ts`, add to `CEREMONIES`:

```typescript
// Fellowships
{ id: "guggenheim", label: "Guggenheim Fellowship", wikidataId: "Q1316544", type: "fellowship" },
```

Add to `AWARD_CATEGORIES`:

```typescript
// --- Guggenheim Fellowship ---
{ id: "guggenheim-film", ceremony: "guggenheim", label: "Guggenheim Fellowship (Film/Video)", wikidataId: "Q1316544", domain: "fellowship", qualifier: { property: "P101", values: ["Q11424", "Q34508"] } },
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/types/awards-registry.test.ts`
Expected: All tests pass.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. Existing awards tests should not regress — the Guggenheim QID is now in `REGISTERED_QIDS`, so `getPersonWins` / `getPersonNominations` filters will pass it through when encountered.

**Step 6: Commit**

```
git add src/types/awards-registry.ts tests/types/awards-registry.test.ts
git commit -m "feat(M13): add Guggenheim Fellowship to registry with qualifier"
```

---

### Task 6: Implement qualifier-aware SPARQL in getAwardHistory()

**Files:**
- Modify: `src/utils/wikidata-client.ts`
- Test: `tests/utils/wikidata-client.test.ts`

**Step 1: Write failing tests**

Add to `tests/utils/wikidata-client.test.ts` inside the existing `describe("awards queries")` block:

```typescript
it("gets award history with qualifier filter", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      results: {
        bindings: [
          {
            recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q123" },
            recipientLabel: { type: "literal", value: "Test Fellow" },
            date: { type: "literal", value: "2020-01-01T00:00:00Z" },
          },
        ],
      },
    }),
  });

  const history = await client.getAwardHistory("Q1316544", {
    property: "P101",
    values: ["Q11424", "Q34508"],
  });
  expect(history).toHaveLength(1);
  expect(history[0].recipientLabel).toBe("Test Fellow");

  // Verify SPARQL contains qualifier filter
  const [url] = mockFetch.mock.calls[0];
  const decodedUrl = decodeURIComponent(url);
  expect(decodedUrl).toContain("pq:P101");
  expect(decodedUrl).toContain("Q11424");
  expect(decodedUrl).toContain("Q34508");
});

it("gets award history without qualifier (unchanged behavior)", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      results: {
        bindings: [
          {
            recipient: { type: "uri", value: "http://www.wikidata.org/entity/Q460277" },
            recipientLabel: { type: "literal", value: "Roger Deakins" },
            date: { type: "literal", value: "2018-03-04T00:00:00Z" },
          },
        ],
      },
    }),
  });

  const history = await client.getAwardHistory("Q131520");
  expect(history).toHaveLength(1);

  // Verify SPARQL does NOT contain qualifier filter
  const [url] = mockFetch.mock.calls[0];
  const decodedUrl = decodeURIComponent(url);
  expect(decodedUrl).not.toContain("pq:P101");
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/utils/wikidata-client.test.ts`
Expected: The qualifier test fails because the SPARQL URL does not contain `pq:P101`. (The second test should still pass since it matches current behavior, but the first test fails.)

**Step 3: Implement qualifier support**

In `src/utils/wikidata-client.ts`, modify `getAwardHistory()`:

Change the signature:
```typescript
async getAwardHistory(
  categoryQid: string,
  qualifier?: { property: string; values: string[] }
): Promise<AwardHistoryEntry[]>
```

Add the qualifier clause to the SPARQL query construction. Inside the method, build the qualifier filter conditionally:

```typescript
const qualifierClause = qualifier
  ? `?stmt pq:${qualifier.property} ?qualifierValue .
     FILTER(?qualifierValue IN (${qualifier.values.map(v => `wd:${v}`).join(", ")}))`
  : "";
```

Insert `${qualifierClause}` into the WHERE block after `?stmt ps:P166 wd:${categoryQid} .`

**Important:** Validate the qualifier property and values to prevent SPARQL injection. The property must match `/^P\d+$/` and each value must match `/^Q\d+$/`. Throw an error if validation fails.

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/utils/wikidata-client.test.ts`
Expected: All tests pass.

**Step 5: Commit**

```
git add src/utils/wikidata-client.ts tests/utils/wikidata-client.test.ts
git commit -m "feat(M13): qualifier-aware SPARQL in getAwardHistory()"
```

---

### Task 7: Wire qualifier passthrough in awards tool handler

**Files:**
- Modify: `src/tools/awards.ts`
- Test: `tests/tools/awards.test.ts`

**Step 1: Write failing test**

Add to `tests/tools/awards.test.ts` inside the existing `describe("get_award_history")` block (or adjacent to existing get_award_history tests):

```typescript
it("passes qualifier from registry category to wikidata client", async () => {
  mockWikidataClient.getAwardHistory.mockResolvedValue([
    { recipientId: "Q123", recipientLabel: "Test Fellow", year: 2020 },
  ]);

  const result = await handleGetAwardHistory(
    { category: "guggenheim-film" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.category).toBe("Guggenheim Fellowship (Film/Video)");

  // Verify qualifier was passed through
  expect(mockWikidataClient.getAwardHistory).toHaveBeenCalledWith(
    "Q1316544",
    { property: "P101", values: ["Q11424", "Q34508"] }
  );
});

it("passes undefined qualifier for categories without one", async () => {
  mockWikidataClient.getAwardHistory.mockResolvedValue([]);

  await handleGetAwardHistory(
    { category: "peabody-award" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );

  expect(mockWikidataClient.getAwardHistory).toHaveBeenCalledWith(
    "Q838121",
    undefined
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/tools/awards.test.ts`
Expected: FAIL — `getAwardHistory` is called with only 1 argument (no qualifier).

**Step 3: Implement the passthrough**

In `src/tools/awards.ts`, in the `handleGetAwardHistory` function, change:

```typescript
const entries = await wikidataClient.getAwardHistory(cat.wikidataId);
```

to:

```typescript
const entries = await wikidataClient.getAwardHistory(cat.wikidataId, cat.qualifier);
```

That's it — one line change.

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/tools/awards.test.ts`
Expected: All tests pass.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. No regressions.

**Step 6: Commit**

```
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "feat(M13): pass qualifier from registry to getAwardHistory()"
```

---

### Task 8: Search results verification

**Files:**
- Test: `tests/tools/awards.test.ts`

**Step 1: Write tests for search_awards coverage of new entries**

Add to `tests/tools/awards.test.ts` inside or after the existing `search_awards` tests:

```typescript
it("search_awards finds Peabody", async () => {
  const result = await handleSearchAwards(
    { query: "peabody" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.ceremonies.some((c: any) => c.id === "peabody")).toBe(true);
  expect(parsed.categories.some((c: any) => c.id === "peabody-award")).toBe(true);
});

it("search_awards finds Gotham", async () => {
  const result = await handleSearchAwards(
    { query: "gotham" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.ceremonies.some((c: any) => c.id === "gotham")).toBe(true);
  expect(parsed.categories.some((c: any) => c.id === "gotham-best-documentary")).toBe(true);
});

it("search_awards finds Guggenheim via fellowship query", async () => {
  const result = await handleSearchAwards(
    { query: "guggenheim" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.ceremonies.some((c: any) => c.id === "guggenheim")).toBe(true);
  expect(parsed.categories.some((c: any) => c.id === "guggenheim-film")).toBe(true);
});

it("search_awards finds fellowship domain", async () => {
  const result = await handleSearchAwards(
    { query: "fellowship" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.ceremonies.some((c: any) => c.id === "guggenheim")).toBe(true);
  expect(parsed.categories.some((c: any) => c.domain === "fellowship")).toBe(true);
});

it("search_awards documentary domain includes Peabody and Gotham doc categories", async () => {
  const result = await handleSearchAwards(
    { query: "documentary" },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  const catIds = parsed.categories.map((c: any) => c.id);
  expect(catIds).toContain("peabody-award");
  expect(catIds).toContain("gotham-best-documentary");
});
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run tests/tools/awards.test.ts`
Expected: All tests pass (no code changes needed — search_awards already tokenizes and matches against id, label, domain, and ceremony fields).

**Step 3: If any test fails, investigate and fix**

The `search_awards` handler already searches `c.id`, `c.label.toLowerCase()`, `c.domain`, and `c.ceremony`. If a test fails, the issue is likely a mismatch in the registry entry's `id` or `label` — fix the registry data in `awards-registry.ts`.

**Step 4: Commit**

```
git add tests/tools/awards.test.ts
git commit -m "test(M13): search_awards coverage for new registry entries"
```

---

### Task 9: Integration tests (live SPARQL)

**Files:**
- Modify: `tests/integration/live-api.test.ts`

**Step 1: Add live integration tests**

Add a new `describe` block to `tests/integration/live-api.test.ts`:

```typescript
describe("live Wikidata — M13 registry expansion", () => {
  const wikidataClient = new WikidataClient();

  it("Peabody award history returns 400+ recipients", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q838121");
    expect(history.length).toBeGreaterThan(400);
  });

  it("Guggenheim film fellows returns 200+ via qualifier", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q1316544", {
      property: "P101",
      values: ["Q11424", "Q34508"],
    });
    expect(history.length).toBeGreaterThan(200);
  });

  it("Gotham Best Documentary returns winners", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q20978457");
    expect(history.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run integration tests**

Run: `TMDB_ACCESS_TOKEN=<token> npm run test:integration`
Expected: All integration tests pass. The new Wikidata-only tests don't need TMDB_ACCESS_TOKEN but run in the same suite.

**Step 3: Commit**

```
git add tests/integration/live-api.test.ts
git commit -m "test(M13): live SPARQL integration tests for Peabody, Guggenheim, Gotham"
```

---

### Task 10: Update CLAUDE.md, ROADMAP.md, and tag release

**Files:**
- Modify: `CLAUDE.md` (tool descriptions, test counts, registry counts)
- Modify: `ROADMAP.md` (M13 status, current status, time tracking)

**Step 1: Update CLAUDE.md**

- Update awards registry description: "21 ceremonies/festivals" → count including new 3 (will be 24) and "91 award categories" → new count including additions
- Update test count if changed
- Add note about qualifier-aware SPARQL for Guggenheim under "Awards Registry" section

**Step 2: Update ROADMAP.md**

- M13 status: `Complete — v0.10.0 tagged.`
- Current status section: update tool count (still 20), test counts, registry counts
- Time tracking: fill in execution time for M13

**Step 3: Run full test suite one last time**

Run: `npm test`
Expected: All tests pass.

**Step 4: Commit and tag**

```
git add CLAUDE.md ROADMAP.md
git commit -m "docs(M13): update CLAUDE.md and ROADMAP.md for registry expansion"
git tag v0.10.0
```
