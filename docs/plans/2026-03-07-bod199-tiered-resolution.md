# BOD-199: Tiered Name Resolution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Accept sole Wikidata candidates from name search even without film occupations, so non-filmmaker EPs (e.g., Laurene Powell Jobs) resolve instead of being dropped to `skippedCrew`.

**Architecture:** Add a `"name_search_unfiltered"` resolution method. After the existing film-occupation check in `resolvePersonByName`, fall back to accepting the sole candidate when there's exactly one search result and zero film-occupation matches. No changes to callers.

**Tech Stack:** TypeScript, Vitest, Wikidata SPARQL

---

### Task 1: Add `name_search_unfiltered` to ResolutionMethod type

**Files:**
- Modify: `src/types/wikidata.ts:69`

**Step 1: Update the type union**

In `src/types/wikidata.ts`, change line 69 from:

```typescript
export type ResolutionMethod = "tmdb_id" | "imdb_id" | "name_search";
```

to:

```typescript
export type ResolutionMethod = "tmdb_id" | "imdb_id" | "name_search" | "name_search_unfiltered";
```

**Step 2: Run tests to confirm nothing breaks**

Run: `npm test`
Expected: All 293 tests pass. The new union member is additive.

**Step 3: Commit**

```bash
git add src/types/wikidata.ts
git commit -m "feat(BOD-199): add name_search_unfiltered resolution method"
```

---

### Task 2: Update existing test expectation for Tier 2 behavior

**Files:**
- Modify: `tests/utils/wikidata-client.test.ts:235-258`

The existing test "returns null when no candidates have film occupations" at line 235 tests a single candidate (`Q500`, "Jane Doe") with a non-film occupation (`Q82955`). This test currently expects `null`. Under the new tiered logic, this is exactly Tier 2 — one candidate, no film occupation — and should now resolve successfully.

**Step 1: Update the existing test to expect Tier 2 resolution**

Change the test at line 235 from:

```typescript
    it("returns null when no candidates have film occupations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          search: [{ id: "Q500", label: "Jane Doe" }],
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q500" },
                entityLabel: { type: "literal", value: "Jane Doe" },
                occupation: { type: "uri", value: "http://www.wikidata.org/entity/Q82955" },
              },
            ],
          },
        }),
      });

      const result = await client.resolvePersonByName("Jane Doe");
      expect(result).toBeNull();
    });
```

to:

```typescript
    it("resolves sole candidate without film occupation (Tier 2)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          search: [{ id: "Q500", label: "Jane Doe" }],
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q500" },
                entityLabel: { type: "literal", value: "Jane Doe" },
                occupation: { type: "uri", value: "http://www.wikidata.org/entity/Q82955" },
              },
            ],
          },
        }),
      });

      const result = await client.resolvePersonByName("Jane Doe");
      expect(result).toEqual({
        wikidataId: "Q500",
        label: "Jane Doe",
        resolvedVia: "name_search_unfiltered",
      });
    });
```

**Step 2: Add Tier 3 test — multiple candidates, no film occupations**

Add a new test after the updated one:

```typescript
    it("returns null when multiple candidates lack film occupations (Tier 3)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          search: [
            { id: "Q500", label: "Jane Doe" },
            { id: "Q501", label: "Jane Doe" },
          ],
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            bindings: [
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q500" },
                entityLabel: { type: "literal", value: "Jane Doe" },
                occupation: { type: "uri", value: "http://www.wikidata.org/entity/Q82955" },
              },
              {
                entity: { type: "uri", value: "http://www.wikidata.org/entity/Q501" },
                entityLabel: { type: "literal", value: "Jane Doe" },
                occupation: { type: "uri", value: "http://www.wikidata.org/entity/Q901" },
              },
            ],
          },
        }),
      });

      const result = await client.resolvePersonByName("Jane Doe");
      expect(result).toBeNull();
    });
```

**Step 3: Add Tier 2 edge case — sole candidate with NO occupations at all**

A person might exist in Wikidata with no P106 claims. The SPARQL query returns zero bindings but `candidateIds` has one entry. This should still resolve.

```typescript
    it("resolves sole candidate with no occupations at all (Tier 2)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          search: [{ id: "Q600", label: "Solo Person" }],
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: { bindings: [] },
        }),
      });

      const result = await client.resolvePersonByName("Solo Person");
      expect(result).toEqual({
        wikidataId: "Q600",
        label: "Solo Person",
        resolvedVia: "name_search_unfiltered",
      });
    });
```

**Step 4: Run tests to confirm failures**

Run: `npm test -- tests/utils/wikidata-client.test.ts`
Expected: "resolves sole candidate without film occupation (Tier 2)" FAILS (returns `null` instead of entity). "resolves sole candidate with no occupations at all (Tier 2)" FAILS. "returns null when multiple candidates lack film occupations (Tier 3)" PASSES (existing behavior).

**Step 5: Commit failing tests**

```bash
git add tests/utils/wikidata-client.test.ts
git commit -m "test(BOD-199): add tiered resolution tests (Tier 2 + Tier 3)"
```

---

### Task 3: Implement Tier 2 fallback in `resolvePersonByName`

**Files:**
- Modify: `src/utils/wikidata-client.ts:145-150`

**Step 1: Add Tier 2 logic after existing Tier 1 check**

Replace lines 145-150 in `resolvePersonByName`:

```typescript
    if (filmRelevant.size === 1) {
      const [, entity] = [...filmRelevant.entries()][0];
      return { ...entity, resolvedVia: "name_search" };
    }

    return null;
```

with:

```typescript
    // Tier 1: exactly one candidate has a film occupation
    if (filmRelevant.size === 1) {
      const [, entity] = [...filmRelevant.entries()][0];
      return { ...entity, resolvedVia: "name_search" };
    }

    // Tier 2: no film-occupation matches, but only one candidate from name search
    if (filmRelevant.size === 0 && candidateIds.length === 1) {
      const id = candidateIds[0];
      const binding = sparqlResult.results.bindings.find(
        (b) => this.extractEntityId(b.entity.value) === id
      );
      const label = binding?.entityLabel ? this.cleanLabel(binding.entityLabel.value) : name;
      return { wikidataId: id, label, resolvedVia: "name_search_unfiltered" };
    }

    return null;
```

**Step 2: Run tests to confirm they pass**

Run: `npm test -- tests/utils/wikidata-client.test.ts`
Expected: All tests pass, including the new Tier 2 and Tier 3 tests.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass. No callers are affected — they accept `ResolvedEntity` regardless of `resolvedVia` value.

**Step 4: Commit**

```bash
git add src/utils/wikidata-client.ts
git commit -m "feat(BOD-199): implement Tier 2 unfiltered name resolution for sole candidates"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `CLAUDE.md` (Wikidata Data Gaps section — note the occupation filter relaxation)

**Step 1: Add a note to the Wikidata Data Gaps section in CLAUDE.md**

After the existing bullet about non-filmmaker EPs, add:

```markdown
  - **Tier 2 name resolution (v0.11.0+):** When TMDB ID and IMDb ID resolution both fail, `resolvePersonByName` accepts a sole Wikidata candidate even without a film-related P106 occupation (`resolvedVia: "name_search_unfiltered"`). This handles non-filmmaker EPs (businesspeople, philanthropists) who appear in TMDB credits. When multiple candidates exist without film occupations, resolution still fails (Tier 3) — see BOD-203 for future scored ranking.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(BOD-199): document tiered name resolution in CLAUDE.md"
```

---

### Task 5: Mark BOD-199 done in Linear and update memory

**Step 1: Update BOD-199 status to Done in Linear**

**Step 2: Update MEMORY.md — change BOD-199 entry from Backlog to Done, add BOD-203**

**Step 3: Commit memory update**

```bash
git add -A  # after verifying git status
git commit -m "docs: update memory for BOD-199 completion"
```
