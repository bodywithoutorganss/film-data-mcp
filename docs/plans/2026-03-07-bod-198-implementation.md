# BOD-198: Resolved Crew Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich `resolvedCrew` entries in `get_film_awards` with Wikidata ID, total wins/nominations, and ceremony breakdown.

**Architecture:** Two-pass approach in `getFilmCrewNominations`. First pass (existing) resolves crew and fetches P1411 nominations. Second pass (new) fetches P166 wins for resolved crew only. Ceremony breakdown derived locally from awards registry.

**Tech Stack:** TypeScript, Vitest, Wikidata SPARQL (existing `getPersonWins` method)

---

### Task 1: Write failing test for enriched resolvedCrew shape

**Files:**
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add a new test in the `"crew nomination cross-referencing"` describe block:

```typescript
it("enriches resolvedCrew with wikidataId, award counts, and ceremony breakdown", async () => {
  mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
    wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getFilmAwards.mockResolvedValue([]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
  mockTmdbClient.getMovieDetails.mockResolvedValue({
    credits: {
      cast: [],
      crew: [
        { id: 100, name: "Jane Doe", job: "Director" },
      ],
    },
  });
  mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
    wikidataId: "Q100", label: "Jane Doe", resolvedVia: "tmdb_id",
  });
  // No film-specific nominations — Jane goes to resolvedCrew
  mockWikidataClient.getPersonNominations.mockResolvedValue([
    {
      wikidataId: "Q131520", label: "Academy Award for Best Cinematography",
      year: 2020, ceremony: "academy-awards",
      forWork: { wikidataId: "Q999", label: "Other Film" },
    },
    {
      wikidataId: "Q189878", label: "BAFTA Award for Best Cinematography",
      year: 2021, ceremony: "bafta",
      forWork: { wikidataId: "Q998", label: "Another Film" },
    },
  ]);
  // Second pass: wins for resolved crew
  mockWikidataClient.getPersonWins.mockResolvedValue([
    {
      wikidataId: "Q131520", label: "Academy Award for Best Cinematography",
      year: 2018, ceremony: "academy-awards",
    },
  ]);

  const result = await handleGetFilmAwards(
    { movie_id: 489985 },
    mockTmdbClient as any,
    mockWikidataClient as any,
  );
  const parsed = JSON.parse(result);

  expect(parsed.resolvedCrew).toHaveLength(1);
  expect(parsed.resolvedCrew[0]).toEqual({
    name: "Jane Doe",
    roles: ["Director"],
    wikidataId: "Q100",
    totalWins: 1,
    totalNominations: 2,
    byCeremony: {
      "academy-awards": { wins: 1, nominations: 1 },
      "bafta": { wins: 0, nominations: 1 },
    },
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --reporter verbose -t "enriches resolvedCrew"`
Expected: FAIL — `resolvedCrew[0]` lacks `wikidataId`, `totalWins`, `totalNominations`, `byCeremony`

**Step 3: Commit**

```bash
git add tests/tools/awards.test.ts
git commit -m "test(BOD-198): add failing test for enriched resolvedCrew shape"
```

---

### Task 2: Write failing test for resolved crew with zero registered awards

**Files:**
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add another test in the same describe block:

```typescript
it("enriches resolvedCrew with zero counts when no registered awards", async () => {
  mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
    wikidataId: "Q56167580", label: "Test Film", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getFilmAwards.mockResolvedValue([]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
  mockTmdbClient.getMovieDetails.mockResolvedValue({
    credits: {
      cast: [],
      crew: [
        { id: 200, name: "Unknown Director", job: "Director" },
      ],
    },
  });
  mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
    wikidataId: "Q200", label: "Unknown Director", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getPersonNominations.mockResolvedValue([]);
  mockWikidataClient.getPersonWins.mockResolvedValue([]);

  const result = await handleGetFilmAwards(
    { movie_id: 489985 },
    mockTmdbClient as any,
    mockWikidataClient as any,
  );
  const parsed = JSON.parse(result);

  expect(parsed.resolvedCrew).toHaveLength(1);
  expect(parsed.resolvedCrew[0]).toEqual({
    name: "Unknown Director",
    roles: ["Director"],
    wikidataId: "Q200",
    totalWins: 0,
    totalNominations: 0,
    byCeremony: {},
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --reporter verbose -t "enriches resolvedCrew with zero"`
Expected: FAIL

**Step 3: Commit**

```bash
git add tests/tools/awards.test.ts
git commit -m "test(BOD-198): add failing test for resolvedCrew zero-award edge case"
```

---

### Task 3: Implement enriched resolvedCrew in getFilmCrewNominations

**Files:**
- Modify: `src/tools/awards.ts`

**Step 1: Update the CrewNominationsResult interface and getFilmCrewNominations function**

Changes to `src/tools/awards.ts`:

1. Update the `CrewNominationsResult` interface (line 115-119):

```typescript
interface CrewNominationsResult {
  crewNominations: CrewNominationEntry[];
  resolvedCrew: Array<{
    name: string;
    roles: string[];
    wikidataId: string;
    totalWins: number;
    totalNominations: number;
    byCeremony: Record<string, { wins: number; nominations: number }>;
  }>;
  skippedCrew: Array<{ name: string; roles: string[]; reason: string }>;
}
```

2. Change the intermediate `resolvedCrew` array (around line 145) to capture Wikidata ID and full nominations:

```typescript
const intermediateResolved: Array<{
  name: string;
  roles: string[];
  wikidataId: string;
  allNominations: WikidataNomination[];
}> = [];
```

3. In the first-pass callback (around line 163-164), push to `intermediateResolved` instead:

```typescript
if (filmNominations.length === 0) {
  intermediateResolved.push({
    name: member.name,
    roles: member.roles,
    wikidataId: entity.wikidataId,
    allNominations: nominations,
  });
  return null;
}
```

4. After `Promise.all`, add a second pass to fetch wins and build the enriched output:

```typescript
const resolvedCrew = await Promise.all(
  intermediateResolved.map(async (member) => {
    const wins = await wikidataClient.getPersonWins(member.wikidataId);
    const byCeremony: Record<string, { wins: number; nominations: number }> = {};
    for (const win of wins) {
      const key = win.ceremony;
      if (!byCeremony[key]) byCeremony[key] = { wins: 0, nominations: 0 };
      byCeremony[key].wins++;
    }
    for (const nom of member.allNominations) {
      const key = nom.ceremony;
      if (!byCeremony[key]) byCeremony[key] = { wins: 0, nominations: 0 };
      byCeremony[key].nominations++;
    }
    return {
      name: member.name,
      roles: member.roles,
      wikidataId: member.wikidataId,
      totalWins: wins.length,
      totalNominations: member.allNominations.length,
      byCeremony,
    };
  })
);
```

5. The return statement stays the same — it already returns `resolvedCrew`.

Note: `WikidataNomination` type needs to be imported. Check the existing imports at line 7 — `CrewNominationEntry` is already imported from `../types/wikidata.js`. Add `WikidataNomination` to that import.

**Step 2: Run the new tests**

Run: `npm test -- --reporter verbose -t "enriches resolvedCrew"`
Expected: PASS for both new tests

**Step 3: Commit**

```bash
git add src/tools/awards.ts
git commit -m "feat(BOD-198): enrich resolvedCrew with wikidataId, award counts, and ceremony breakdown"
```

---

### Task 4: Update existing tests for new resolvedCrew shape

**Files:**
- Modify: `tests/tools/awards.test.ts`

**Step 1: Update "skips crew without forWork qualifier" test (around line 319)**

This test has a crew member (Jane Doe) who resolves but has no film-matching nominations, so she ends up in `resolvedCrew`. The assertion at line 351-356 uses `expect.objectContaining({ name: "Jane Doe", roles: ["Director"] })`. Update the mock setup to also provide `getPersonWins` for the second pass, and update the assertion to match the enriched shape:

- Add `mockWikidataClient.getPersonWins.mockResolvedValue([]);` after the `getPersonNominations` mock
- Update assertion to `expect.objectContaining({ name: "Jane Doe", roles: ["Director"], wikidataId: "Q100", totalWins: 0, totalNominations: 0, byCeremony: {} })`

Note: The nomination in the test (`Some Award`, QID `Q131520`) IS a registered QID (Academy Award for Best Cinematography). Since it has no `forWork` matching the film, it won't appear in `filmNominations`. But it WILL appear in `allNominations` (total count). So `totalNominations` should be 1, not 0, and `byCeremony` should reflect it. Re-check the QID: `Q131520` maps to `academy-awards` ceremony. So:

- `totalNominations: 1`
- `byCeremony: { "academy-awards": { wins: 0, nominations: 1 } }`

**Step 2: Update "processes all relevant crew without cap" test (around line 358)**

This test has 10 producers who all resolve with 0 nominations. Add `mockWikidataClient.getPersonWins.mockResolvedValue([]);` and update the assertion at line 388-391:

```typescript
expect(parsed.resolvedCrew[0]).toEqual(
  expect.objectContaining({
    name: expect.any(String),
    roles: ["Producer"],
    wikidataId: expect.stringMatching(/^Q\d+$/),
    totalWins: 0,
    totalNominations: 0,
    byCeremony: {},
  })
);
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/tools/awards.test.ts
git commit -m "test(BOD-198): update existing tests for enriched resolvedCrew shape"
```

---

### Task 5: Run full suite and verify

**Step 1: Run unit tests**

Run: `npm test`
Expected: All tests pass, no regressions

**Step 2: Build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors

**Step 3: Commit any remaining fixes, tag**

If no fixes needed, skip. Otherwise fix and commit.

---

### Task 6: Update documentation

**Files:**
- Modify: `CLAUDE.md` — update the `resolvedCrew` description in the "get_film_awards Response Shape" section
- Modify: `ROADMAP.md` — mark BOD-198 complete, update current status

**Step 1: Update CLAUDE.md**

In the `get_film_awards Response Shape` section, update the `resolvedCrew` bullet to mention the enriched fields (wikidataId, totalWins, totalNominations, byCeremony).

**Step 2: Update ROADMAP.md**

- Add BOD-198 milestone entry or update status in current status section
- Update time tracking

**Step 3: Commit**

```bash
git add CLAUDE.md ROADMAP.md
git commit -m "docs(BOD-198): update resolvedCrew documentation"
```
