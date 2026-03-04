# M7: Awards Intelligence — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add awards completeness indicators to `get_film_awards` and `get_person_awards`, and cross-reference crew P1411 nominations for films.

**Architecture:** New `countAllP166Claims()` method on `WikidataClient` for completeness. New `getFilmCrewNominations()` helper in `awards.ts` that fetches TMDB credits, resolves crew to Wikidata, queries P1411 nominations, and filters to the target film. No new MCP tools — enhances existing handlers.

**Tech Stack:** TypeScript (ESM), Zod 4, MCP SDK, Vitest 4, `buildToolDef` utility, Wikidata SPARQL

---

### Task 1: Add WikidataClient.countAllP166Claims method

**Files:**
- Modify: `src/utils/wikidata-client.ts`
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add `countAllP166Claims` to the `mockWikidataClient` object at the top of `awards.test.ts`:

```typescript
countAllP166Claims: vi.fn(),
```

Then add a new describe block after the existing `get_film_awards` block:

```typescript
describe("countAllP166Claims", () => {
  it("is called by the WikidataClient", async () => {
    const { WikidataClient } = await import("../../src/utils/wikidata-client.js");
    const client = new WikidataClient();
    expect(typeof client.countAllP166Claims).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: FAIL — `countAllP166Claims` is not a function / does not exist on `WikidataClient`

**Step 3: Implement countAllP166Claims**

Add to `WikidataClient` class in `src/utils/wikidata-client.ts`, after `getFilmAwards`:

```typescript
async countAllP166Claims(wikidataId: string): Promise<number> {
    this.validateQid(wikidataId);
    const query = `
      SELECT (COUNT(?award) AS ?count) WHERE {
        wd:${wikidataId} p:P166 ?stmt .
        ?stmt ps:P166 ?award .
      }
    `;
    const data = await this.executeSparql(query);
    const binding = data.results.bindings[0];
    return binding?.count ? parseInt(binding.count.value, 10) : 0;
  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/wikidata-client.ts tests/tools/awards.test.ts
git commit -m "Add WikidataClient.countAllP166Claims for completeness indicator"
```

---

### Task 2: Add Completeness type and update FilmAwardsResult / PersonAwardsResult

**Files:**
- Modify: `src/types/wikidata.ts`

**Step 1: Write the type check**

No test file change needed — this is a type-only change. Verify by adding the import to the test file in the next task.

**Step 2: Add Completeness interface**

Add after the `ResolvedEntity` interface in `src/types/wikidata.ts`:

```typescript
export interface AwardsCompleteness {
  entityFound: boolean;
  p166ClaimCount: number;
  registeredAwardCount: number;
}
```

**Step 3: Update FilmAwardsResult**

Change `FilmAwardsResult` to:

```typescript
export interface CrewNominationEntry {
  person: { name: string; role: string };
  nominations: WikidataNomination[];
}

export interface FilmAwardsResult {
  entity: ResolvedEntity;
  awards: WikidataAward[];
  crewNominations: CrewNominationEntry[];
  completeness: AwardsCompleteness;
}
```

**Step 4: Update PersonAwardsResult**

Change `PersonAwardsResult` to:

```typescript
export interface PersonAwardsResult {
  entity: ResolvedEntity;
  wins: WikidataAward[];
  nominations: WikidataNomination[];
  completeness: AwardsCompleteness;
}
```

**Step 5: Commit**

```bash
git add src/types/wikidata.ts
git commit -m "Add AwardsCompleteness and CrewNominationEntry types, update result interfaces"
```

---

### Task 3: Add completeness indicator to handleGetPersonAwards

**Files:**
- Modify: `src/tools/awards.ts`
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add to the `get_person_awards` describe block in `tests/tools/awards.test.ts`:

```typescript
it("includes completeness indicator with p166 claim count", async () => {
  mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
    wikidataId: "Q460277", label: "Roger Deakins", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getPersonWins.mockResolvedValue([
    { wikidataId: "Q131520", label: "Academy Award for Best Cinematography", year: 2018, ceremony: "academy-awards" },
  ]);
  mockWikidataClient.getPersonNominations.mockResolvedValue([]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(5);

  const result = await handleGetPersonAwards(
    { person_id: 151 },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.completeness).toEqual({
    entityFound: true,
    p166ClaimCount: 5,
    registeredAwardCount: 1,
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: FAIL — `parsed.completeness` is undefined

**Step 3: Update handleGetPersonAwards**

In `src/tools/awards.ts`, change `handleGetPersonAwards` to:

```typescript
export async function handleGetPersonAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { person_id } = GetPersonAwardsSchema.parse(args);
  const entity = await resolvePerson(person_id, tmdbClient, wikidataClient);
  const [wins, nominations, p166ClaimCount] = await Promise.all([
    wikidataClient.getPersonWins(entity.wikidataId),
    wikidataClient.getPersonNominations(entity.wikidataId),
    wikidataClient.countAllP166Claims(entity.wikidataId),
  ]);
  return JSON.stringify({
    entity,
    wins,
    nominations,
    completeness: {
      entityFound: true,
      p166ClaimCount,
      registeredAwardCount: wins.length,
    },
  }, null, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: PASS (all existing tests + new completeness test)

**Step 5: Commit**

```bash
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "Add completeness indicator to get_person_awards"
```

---

### Task 4: Add completeness indicator to handleGetFilmAwards (without crew nominations yet)

**Files:**
- Modify: `src/tools/awards.ts`
- Modify: `tests/tools/awards.test.ts`

**Step 1: Write the failing test**

Add to the `get_film_awards` describe block:

```typescript
it("includes completeness indicator with p166 claim count", async () => {
  mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
    wikidataId: "Q61448040", label: "Parasite", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getFilmAwards.mockResolvedValue([
    { wikidataId: "Q102427", label: "Academy Award for Best Picture", year: 2020, ceremony: "academy-awards" },
  ]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(12);

  const result = await handleGetFilmAwards(
    { movie_id: 496243 },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.completeness).toEqual({
    entityFound: true,
    p166ClaimCount: 12,
    registeredAwardCount: 1,
  });
});

it("shows zero p166 claims for entity with no Wikidata awards", async () => {
  mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
    wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
  });
  mockWikidataClient.getFilmAwards.mockResolvedValue([]);
  mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

  const result = await handleGetFilmAwards(
    { movie_id: 489985 },
    mockTmdbClient as any,
    mockWikidataClient as any
  );
  const parsed = JSON.parse(result);
  expect(parsed.completeness).toEqual({
    entityFound: true,
    p166ClaimCount: 0,
    registeredAwardCount: 0,
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: FAIL — `parsed.completeness` is undefined

**Step 3: Update handleGetFilmAwards**

Change `handleGetFilmAwards` to (placeholder empty array for `crewNominations` — Task 5 will implement it):

```typescript
export async function handleGetFilmAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { movie_id } = GetFilmAwardsSchema.parse(args);
  const entity = await resolveMovie(movie_id, tmdbClient, wikidataClient);
  const [awards, p166ClaimCount] = await Promise.all([
    wikidataClient.getFilmAwards(entity.wikidataId),
    wikidataClient.countAllP166Claims(entity.wikidataId),
  ]);
  return JSON.stringify({
    entity,
    awards,
    crewNominations: [],
    completeness: {
      entityFound: true,
      p166ClaimCount,
      registeredAwardCount: awards.length,
    },
  }, null, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: PASS

Note: The existing test `resolves TMDB movie ID and returns awards` will need to be updated to also expect `crewNominations` and `completeness` fields. Add `mockWikidataClient.countAllP166Claims.mockResolvedValue(2)` to its setup and update its assertions to check the full response shape:

```typescript
expect(parsed.awards).toHaveLength(2);
expect(parsed.crewNominations).toEqual([]);
expect(parsed.completeness.entityFound).toBe(true);
```

Similarly update `falls back to IMDb ID when TMDB movie ID not found` to mock `countAllP166Claims` returning `0`.

**Step 5: Commit**

```bash
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "Add completeness indicator to get_film_awards"
```

---

### Task 5: Implement crew nomination cross-referencing for get_film_awards

**Files:**
- Modify: `src/tools/awards.ts`
- Modify: `tests/tools/awards.test.ts`

This is the largest task. It adds a helper function `getFilmCrewNominations` that:
1. Fetches film credits from TMDB via `getMovieDetails(id, ["credits"])`
2. Extracts top crew (Director, Producer, Executive Producer, Writer, Screenplay) capped at 5
3. Resolves each to Wikidata (skips unresolvable ones)
4. Queries P1411 nominations per person
5. Filters to nominations for this specific film (matching `forWork.wikidataId`)

**Step 1: Write the failing tests**

Add `getMovieDetails` mock capability. Update `mockTmdbClient` at the top of the file — it already has `getMovieDetails: vi.fn()`.

Add a new describe block after `get_film_awards`:

```typescript
describe("crew nomination cross-referencing", () => {
  it("fetches crew nominations filtered to the target film", async () => {
    mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
      wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getFilmAwards.mockResolvedValue([]);
    mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

    // TMDB credits for Minding the Gap
    mockTmdbClient.getMovieDetails.mockResolvedValue({
      credits: {
        cast: [],
        crew: [
          { id: 1757073, name: "Bing Liu", job: "Director", department: "Directing" },
          { id: 9999, name: "Diane Quon", job: "Producer", department: "Production" },
        ],
      },
    });

    // Bing Liu resolves, Diane Quon doesn't
    mockWikidataClient.resolvePersonByTmdbId
      .mockResolvedValueOnce({ wikidataId: "Q56168000", label: "Bing Liu", resolvedVia: "tmdb_id" })
      .mockResolvedValueOnce(null);
    mockTmdbClient.getPersonDetails.mockResolvedValue({ imdb_id: null });

    // Bing Liu's nominations include one for MTG and one for another film
    mockWikidataClient.getPersonNominations.mockResolvedValue([
      {
        wikidataId: "Q112107", label: "Academy Award for Best Documentary Feature", year: 2019,
        ceremony: "academy-awards",
        forWork: { wikidataId: "Q56167580", label: "Minding the Gap" },
      },
      {
        wikidataId: "Q999999", label: "Some Other Award", year: 2022,
        ceremony: "academy-awards",
        forWork: { wikidataId: "Q999999", label: "Some Other Film" },
      },
    ]);

    const result = await handleGetFilmAwards(
      { movie_id: 489985 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    expect(parsed.crewNominations).toHaveLength(1);
    expect(parsed.crewNominations[0].person).toEqual({ name: "Bing Liu", role: "Director" });
    expect(parsed.crewNominations[0].nominations).toHaveLength(1);
    expect(parsed.crewNominations[0].nominations[0].label).toBe("Academy Award for Best Documentary Feature");
  });

  it("returns empty crewNominations when no credits available", async () => {
    mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
      wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getFilmAwards.mockResolvedValue([]);
    mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
    mockTmdbClient.getMovieDetails.mockResolvedValue({});

    const result = await handleGetFilmAwards(
      { movie_id: 489985 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);
    expect(parsed.crewNominations).toEqual([]);
  });

  it("skips crew without forWork qualifier on nominations", async () => {
    mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
      wikidataId: "Q56167580", label: "Minding the Gap", resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getFilmAwards.mockResolvedValue([]);
    mockWikidataClient.countAllP166Claims.mockResolvedValue(0);
    mockTmdbClient.getMovieDetails.mockResolvedValue({
      credits: {
        cast: [],
        crew: [{ id: 100, name: "Jane Doe", job: "Director", department: "Directing" }],
      },
    });
    mockWikidataClient.resolvePersonByTmdbId.mockResolvedValue({
      wikidataId: "Q100", label: "Jane Doe", resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getPersonNominations.mockResolvedValue([
      {
        wikidataId: "Q131520", label: "Some Award", year: 2020,
        ceremony: "academy-awards",
        // no forWork — can't confirm it's for this film
      },
    ]);

    const result = await handleGetFilmAwards(
      { movie_id: 489985 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);
    // Person entry exists but has 0 matched nominations
    const janeEntry = parsed.crewNominations.find((c: any) => c.person.name === "Jane Doe");
    expect(janeEntry === undefined || janeEntry.nominations.length === 0).toBe(true);
  });

  it("caps crew lookup at 5 people", async () => {
    mockWikidataClient.resolveMovieByTmdbId.mockResolvedValue({
      wikidataId: "Q100", label: "Big Film", resolvedVia: "tmdb_id",
    });
    mockWikidataClient.getFilmAwards.mockResolvedValue([]);
    mockWikidataClient.countAllP166Claims.mockResolvedValue(0);

    const bigCrew = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, name: `Person ${i}`, job: "Producer", department: "Production",
    }));
    mockTmdbClient.getMovieDetails.mockResolvedValue({
      credits: { cast: [], crew: bigCrew },
    });
    // All resolve successfully
    for (let i = 0; i < 10; i++) {
      mockWikidataClient.resolvePersonByTmdbId.mockResolvedValueOnce({
        wikidataId: `Q${i + 1}`, label: `Person ${i}`, resolvedVia: "tmdb_id",
      });
    }
    mockWikidataClient.getPersonNominations.mockResolvedValue([]);

    const result = await handleGetFilmAwards(
      { movie_id: 1 },
      mockTmdbClient as any,
      mockWikidataClient as any
    );
    const parsed = JSON.parse(result);

    // Should have called resolvePersonByTmdbId at most 5 times (plus once for the film itself is separate)
    // The film resolution uses resolveMovieByTmdbId, not resolvePersonByTmdbId
    expect(mockWikidataClient.resolvePersonByTmdbId).toHaveBeenCalledTimes(5);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: FAIL — `crewNominations` is empty `[]` (placeholder from Task 4)

**Step 3: Implement getFilmCrewNominations helper and update handleGetFilmAwards**

Add helper function in `src/tools/awards.ts` after `resolveMovie`:

```typescript
const AWARD_RELEVANT_JOBS = new Set([
  "Director", "Producer", "Executive Producer", "Writer", "Screenplay",
]);

const MAX_CREW_LOOKUPS = 5;

interface CrewNominationEntry {
  person: { name: string; role: string };
  nominations: WikidataNomination[];
}

async function getFilmCrewNominations(
  movieId: number,
  filmWikidataId: string,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<CrewNominationEntry[]> {
  const details = await tmdbClient.getMovieDetails(movieId, ["credits"]);
  const credits = (details as any).credits;
  if (!credits?.crew) return [];

  const relevantCrew = credits.crew
    .filter((c: any) => AWARD_RELEVANT_JOBS.has(c.job))
    .slice(0, MAX_CREW_LOOKUPS);

  const results = await Promise.all(
    relevantCrew.map(async (member: any) => {
      let entity: ResolvedEntity | null = null;
      try {
        entity = await resolvePerson(member.id, tmdbClient, wikidataClient);
      } catch {
        return null;
      }

      const nominations = await wikidataClient.getPersonNominations(entity.wikidataId);
      const filmNominations = nominations.filter(
        (n) => n.forWork?.wikidataId === filmWikidataId
      );

      if (filmNominations.length === 0) return null;

      return {
        person: { name: member.name, role: member.job },
        nominations: filmNominations,
      };
    })
  );

  return results.filter((r): r is CrewNominationEntry => r !== null);
}
```

Import `ResolvedEntity` and `WikidataNomination` from types if not already imported.

Update `handleGetFilmAwards`:

```typescript
export async function handleGetFilmAwards(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { movie_id } = GetFilmAwardsSchema.parse(args);
  const entity = await resolveMovie(movie_id, tmdbClient, wikidataClient);
  const [awards, p166ClaimCount, crewNominations] = await Promise.all([
    wikidataClient.getFilmAwards(entity.wikidataId),
    wikidataClient.countAllP166Claims(entity.wikidataId),
    getFilmCrewNominations(movie_id, entity.wikidataId, tmdbClient, wikidataClient),
  ]);
  return JSON.stringify({
    entity,
    awards,
    crewNominations,
    completeness: {
      entityFound: true,
      p166ClaimCount,
      registeredAwardCount: awards.length,
    },
  }, null, 2);
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/tools/awards.test.ts`
Expected: PASS (all tests including new crew nomination tests)

Note: The existing `get_film_awards` tests will need their `mockTmdbClient.getMovieDetails` mock updated to return something (at minimum `{}` for no credits), since `handleGetFilmAwards` now always calls it. Update these existing tests to add:

```typescript
mockTmdbClient.getMovieDetails.mockResolvedValue({});
```

in their setup blocks where not already present.

**Step 5: Commit**

```bash
git add src/tools/awards.ts tests/tools/awards.test.ts
git commit -m "Add crew P1411 nomination cross-referencing to get_film_awards"
```

---

### Task 6: Add live integration tests for awards intelligence

**Files:**
- Modify: `tests/integration/live-api.test.ts`

**Step 1: Check existing live test structure**

The live tests use `describe.skipIf(!TMDB_TOKEN)` and `describe.skipIf(!HAS_NETWORK)` blocks. Awards live tests need both TMDB and Wikidata network access.

**Step 2: Write live tests**

Add a new `describe` block for awards intelligence live tests. These go in the Wikidata section (if one exists) or as a new top-level `describe`:

```typescript
describe.skipIf(!HAS_NETWORK)("awards intelligence (live)", () => {
  it("get_person_awards includes completeness indicator", { timeout: 30000 }, async () => {
    const { handleGetPersonAwards } = await import("../../src/tools/awards.js");
    const { WikidataClient } = await import("../../src/utils/wikidata-client.js");
    const wikidataClient = new WikidataClient();

    const result = JSON.parse(
      await handleGetPersonAwards({ person_id: 151 }, client, wikidataClient)
    );
    expect(result.completeness).toBeDefined();
    expect(result.completeness.entityFound).toBe(true);
    expect(typeof result.completeness.p166ClaimCount).toBe("number");
    expect(result.completeness.registeredAwardCount).toBe(result.wins.length);
  });

  it("get_film_awards includes completeness and crew nominations", { timeout: 30000 }, async () => {
    const { handleGetFilmAwards } = await import("../../src/tools/awards.js");
    const { WikidataClient } = await import("../../src/utils/wikidata-client.js");
    const wikidataClient = new WikidataClient();

    // Parasite (496243) — well-known film with awards data
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: 496243 }, client, wikidataClient)
    );
    expect(result.completeness).toBeDefined();
    expect(result.completeness.entityFound).toBe(true);
    expect(typeof result.completeness.p166ClaimCount).toBe("number");
    expect(Array.isArray(result.crewNominations)).toBe(true);
  });
});
```

Note: The `client` variable is the live `TMDBClient` instance created in the outer test scope. Check what variable name the existing live tests use and match it.

**Step 3: Run live tests**

Run: `TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/live-api.test.ts`
Expected: PASS

**Step 4: Run full suite**

Run: `npx vitest run`
Expected: All tests pass (live tests skipped without token/network)

**Step 5: Commit**

```bash
git add tests/integration/live-api.test.ts
git commit -m "Add live integration tests for awards intelligence features"
```

---

### Task 7: Update tool descriptions and version bump

**Files:**
- Modify: `src/tools/awards.ts` (tool description updates)
- Modify: `package.json` (version bump to 0.6.0)

**Step 1: Update get_film_awards tool description**

In `src/tools/awards.ts`, update the `getFilmAwardsTool` description to mention completeness and crew nominations:

```typescript
export const getFilmAwardsTool = buildToolDef(
  "get_film_awards",
  "Get award wins and nominations for a film. Accepts a TMDB movie ID. Returns direct P166 wins, crew P1411 nominations (from director/producer/writer profiles filtered to this film), and a completeness indicator showing total P166 claims vs. registered awards. Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetFilmAwardsSchema
);
```

**Step 2: Update get_person_awards tool description**

```typescript
export const getPersonAwardsTool = buildToolDef(
  "get_person_awards",
  "Get award wins and nominations for a person. Accepts a TMDB person ID. Returns wins, nominations, and a completeness indicator showing total P166 claims vs. registered awards. Covers Academy Awards, Golden Globes, BAFTA, Cannes, and other major ceremonies.",
  GetPersonAwardsSchema
);
```

**Step 3: Bump version in package.json**

Change `"version": "0.5.0"` to `"version": "0.6.0"`.

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Commit and tag**

```bash
git add src/tools/awards.ts package.json
git commit -m "Update awards tool descriptions and bump to v0.6.0"
git tag v0.6.0
```

---

### Task 8: Update ROADMAP.md

**Files:**
- Modify: `ROADMAP.md`

**Step 1: Update M7 status**

Change M7 entry from:
```
**Status:** Not started. Estimate: 6-8 tasks.
```
to:
```
**Status:** Complete — v0.6.0 tagged. [final test count] tests across [file count] files.
- Design: `docs/plans/2026-03-04-m7-awards-intelligence-design.md`
- Plan: `docs/plans/2026-03-04-m7-awards-intelligence.md`
```

**Step 2: Update Current Status section**

Update to reflect v0.6.0 and new test/tool counts.

**Step 3: Update Time Tracking table**

Fill in M7 row with actual session count.

**Step 4: Commit**

```bash
git add ROADMAP.md
git commit -m "Update roadmap: M7 Awards Intelligence complete"
```
