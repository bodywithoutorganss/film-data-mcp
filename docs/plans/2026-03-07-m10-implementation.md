# M10: Tooling Review & Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate award tools against real documentary comp films via integration tests. Surface and fix resolution failures; document unfixable Wikidata data gaps.

**Architecture:** Add a new integration test file (`tests/integration/comp-films.integration.test.ts`) alongside the existing `live-api.test.ts`. Tests hit live TMDB and Wikidata APIs. Each comp film tests entity resolution, known awards, and crew cross-referencing. Requires `TMDB_ACCESS_TOKEN` env var.

**Tech Stack:** Vitest, live TMDB API, live Wikidata SPARQL endpoint.

---

### Task 1: Look up TMDB IDs for comp films

We need TMDB movie and person IDs before writing tests. These will be hardcoded constants like the existing `PARASITE_ID = 496243` pattern in `live-api.test.ts`.

**Step 1: Search TMDB for comp film IDs**

Use the live MCP server or TMDB website to find:
- Minding the Gap (2018) — movie ID
- Boys State (2020) — movie ID
- Dick Johnson Is Dead (2020) — movie ID
- Bing Liu — person ID
- Kirsten Johnson — person ID
- Jesse Moss — person ID
- Amanda McBaine — person ID

**Step 2: Record IDs as constants**

Note these for use in Task 2. They go at the top of the test file.

---

### Task 2: Write comp film integration test file — entity resolution

**Files:**
- Create: `tests/integration/comp-films.integration.test.ts`

**Step 1: Write entity resolution tests**

Create the test file with entity resolution tests for all 3 films and 4 people. Follow the pattern from `tests/integration/live-api.test.ts`:

```typescript
// ABOUTME: Integration tests validating award tools against real documentary comp films.
// ABOUTME: Hits live TMDB and Wikidata APIs. Requires TMDB_ACCESS_TOKEN env var.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";
import { handleGetFilmAwards, handleGetPersonAwards } from "../../src/tools/awards.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const LIVE_TIMEOUT = { timeout: 30000 };

// Comp film TMDB IDs (verified via TMDB search)
const MINDING_THE_GAP_ID = <FILL>;    // Minding the Gap (2018)
const BOYS_STATE_ID = <FILL>;          // Boys State (2020)
const DICK_JOHNSON_ID = <FILL>;        // Dick Johnson Is Dead (2020)

// Key people TMDB IDs
const BING_LIU_ID = <FILL>;           // Director, Minding the Gap
const KIRSTEN_JOHNSON_ID = <FILL>;     // Director, Dick Johnson Is Dead
const JESSE_MOSS_ID = <FILL>;          // Co-director, Boys State
const AMANDA_MCBAINE_ID = <FILL>;      // Co-director, Boys State

describe.skipIf(!TMDB_TOKEN)("comp film entity resolution", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  it("resolves Minding the Gap to Wikidata", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId(String(MINDING_THE_GAP_ID));
    if (!entity) {
      // Fallback to IMDb resolution
      const movie = await tmdbClient.getMovieDetails(MINDING_THE_GAP_ID);
      expect(movie.imdb_id).toBeTruthy();
      const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
      expect(byImdb).not.toBeNull();
      expect(byImdb!.label).toMatch(/Minding the Gap/i);
    } else {
      expect(entity.label).toMatch(/Minding the Gap/i);
    }
  });

  it("resolves Boys State to Wikidata", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId(String(BOYS_STATE_ID));
    if (!entity) {
      const movie = await tmdbClient.getMovieDetails(BOYS_STATE_ID);
      expect(movie.imdb_id).toBeTruthy();
      const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
      expect(byImdb).not.toBeNull();
      expect(byImdb!.label).toMatch(/Boys State/i);
    } else {
      expect(entity.label).toMatch(/Boys State/i);
    }
  });

  it("resolves Dick Johnson Is Dead to Wikidata", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolveMovieByTmdbId(String(DICK_JOHNSON_ID));
    if (!entity) {
      const movie = await tmdbClient.getMovieDetails(DICK_JOHNSON_ID);
      expect(movie.imdb_id).toBeTruthy();
      const byImdb = await wikidataClient.resolveByImdbId(movie.imdb_id!);
      expect(byImdb).not.toBeNull();
      expect(byImdb!.label).toMatch(/Dick Johnson/i);
    } else {
      expect(entity.label).toMatch(/Dick Johnson/i);
    }
  });

  it("resolves Bing Liu to Wikidata", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId(String(BING_LIU_ID));
    if (!entity) {
      const person = await tmdbClient.getPersonDetails(BING_LIU_ID);
      if (person.imdb_id) {
        const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
        expect(byImdb).not.toBeNull();
      } else {
        const byName = await wikidataClient.resolvePersonByName("Bing Liu");
        expect(byName).not.toBeNull();
      }
    } else {
      expect(entity.label).toMatch(/Bing Liu/i);
    }
  });

  it("resolves Kirsten Johnson to Wikidata", LIVE_TIMEOUT, async () => {
    const entity = await wikidataClient.resolvePersonByTmdbId(String(KIRSTEN_JOHNSON_ID));
    if (!entity) {
      const person = await tmdbClient.getPersonDetails(KIRSTEN_JOHNSON_ID);
      if (person.imdb_id) {
        const byImdb = await wikidataClient.resolveByImdbId(person.imdb_id);
        expect(byImdb).not.toBeNull();
      } else {
        const byName = await wikidataClient.resolvePersonByName("Kirsten Johnson");
        expect(byName).not.toBeNull();
      }
    } else {
      expect(entity.label).toMatch(/Johnson/i);
    }
  });
});
```

**Step 2: Run tests to verify they work (or reveal resolution failures)**

Run: `TMDB_ACCESS_TOKEN=<token> npm run test:integration -- --reporter=verbose`
Expected: Tests either PASS (resolution works) or FAIL (revealing specific gaps to fix).

**Step 3: Commit**

```bash
git add tests/integration/comp-films.integration.test.ts
git commit -m "test: add comp film entity resolution integration tests"
```

---

### Task 3: Add known-awards tests

**Files:**
- Modify: `tests/integration/comp-films.integration.test.ts`

**Step 1: Add tests asserting known awards appear in results**

Add a new `describe` block after entity resolution:

```typescript
describe.skipIf(!TMDB_TOKEN)("comp film known awards", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  it("Minding the Gap has Academy Best Documentary nomination", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: MINDING_THE_GAP_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);

    // Check direct film awards and crew nominations for Academy Best Documentary
    const allAwards = [
      ...result.awards,
      ...result.crewNominations.flatMap((cn: any) => cn.nominations),
    ];
    const academyDoc = allAwards.find(
      (a: any) => a.label && a.label.match(/Documentary/i) && a.label.match(/Academy/i)
    );
    // This may be null if Wikidata lacks the data — document the gap
    if (!academyDoc) {
      console.warn("DATA GAP: Minding the Gap Academy Best Documentary nomination not found in Wikidata");
    }
  });

  it("Boys State has Sundance Grand Jury Documentary win", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: BOYS_STATE_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);

    const allAwards = [...result.awards];
    const sundanceGrandJury = allAwards.find(
      (a: any) => a.label && a.label.match(/Sundance/i)
    );
    if (!sundanceGrandJury) {
      console.warn("DATA GAP: Boys State Sundance Grand Jury Documentary win not found in Wikidata");
    }
  });

  it("Dick Johnson Is Dead has Independent Spirit Documentary nomination", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: DICK_JOHNSON_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);

    const allAwards = [
      ...result.awards,
      ...result.crewNominations.flatMap((cn: any) => cn.nominations),
    ];
    const spiritDoc = allAwards.find(
      (a: any) => a.label && a.label.match(/Spirit/i) && a.label.match(/Documentary/i)
    );
    if (!spiritDoc) {
      console.warn("DATA GAP: Dick Johnson Is Dead Independent Spirit Documentary nomination not found in Wikidata");
    }
  });
});
```

**Step 2: Run tests**

Run: `TMDB_ACCESS_TOKEN=<token> npm run test:integration -- --reporter=verbose`
Expected: Tests PASS. Console warnings indicate which awards Wikidata lacks.

**Step 3: Commit**

```bash
git add tests/integration/comp-films.integration.test.ts
git commit -m "test: add known-awards assertions for comp films"
```

---

### Task 4: Add person awards tests

**Files:**
- Modify: `tests/integration/comp-films.integration.test.ts`

**Step 1: Add person awards tests**

Add a `describe` block testing `get_person_awards` for key people:

```typescript
describe.skipIf(!TMDB_TOKEN)("comp film person awards", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  it("get_person_awards resolves Bing Liu and returns completeness", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetPersonAwards({ person_id: BING_LIU_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);
    expect(typeof result.completeness.p166ClaimCount).toBe("number");
    // Bing Liu directed an Oscar-nominated doc — some P166/P1411 claims expected
    console.log(`Bing Liu: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`);
  });

  it("get_person_awards resolves Kirsten Johnson and returns completeness", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetPersonAwards({ person_id: KIRSTEN_JOHNSON_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);
    console.log(`Kirsten Johnson: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`);
  });

  it("get_person_awards resolves Jesse Moss and returns completeness", LIVE_TIMEOUT, async () => {
    const result = JSON.parse(
      await handleGetPersonAwards({ person_id: JESSE_MOSS_ID }, tmdbClient, wikidataClient)
    );
    expect(result.completeness.entityFound).toBe(true);
    console.log(`Jesse Moss: ${result.wins.length} wins, ${result.nominations.length} nominations, ${result.completeness.p166ClaimCount} total P166 claims`);
  });
});
```

**Step 2: Run tests**

Run: `TMDB_ACCESS_TOKEN=<token> npm run test:integration -- --reporter=verbose`
Expected: PASS with console output showing award counts.

**Step 3: Commit**

```bash
git add tests/integration/comp-films.integration.test.ts
git commit -m "test: add person awards integration tests for comp film crew"
```

---

### Task 5: Add crew cross-referencing test

**Files:**
- Modify: `tests/integration/comp-films.integration.test.ts`

**Step 1: Add crew nomination cross-referencing test**

This validates that the P1411 crew cross-referencing path (M7/M9) actually recovers nomination data for comp films:

```typescript
describe.skipIf(!TMDB_TOKEN)("comp film crew cross-referencing", () => {
  const wikidataClient = new WikidataClient();
  const tmdbClient = TMDB_TOKEN ? new TMDBClient(TMDB_TOKEN) : (null as unknown as TMDBClient);

  it("Minding the Gap crew nominations include resolved crew members", { timeout: 60000 }, async () => {
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: MINDING_THE_GAP_ID }, tmdbClient, wikidataClient)
    );
    // Log what we found for diagnostic purposes
    console.log(`Minding the Gap: ${result.awards.length} direct awards, ${result.crewNominations.length} crew nominations`);
    if (result.skippedCrew) {
      console.log(`Skipped crew: ${JSON.stringify(result.skippedCrew)}`);
    }
    for (const cn of result.crewNominations) {
      console.log(`  ${cn.person.name} (${cn.person.roles.join(", ")}): ${cn.nominations.length} nominations`);
    }

    // The crew resolution should not skip everyone
    const totalResolved = result.crewNominations.length;
    const totalSkipped = result.skippedCrew?.length ?? 0;
    console.log(`Resolution: ${totalResolved} resolved, ${totalSkipped} skipped`);
  });

  it("Dick Johnson Is Dead crew nominations include Kirsten Johnson", { timeout: 60000 }, async () => {
    const result = JSON.parse(
      await handleGetFilmAwards({ movie_id: DICK_JOHNSON_ID }, tmdbClient, wikidataClient)
    );
    console.log(`Dick Johnson Is Dead: ${result.awards.length} direct awards, ${result.crewNominations.length} crew nominations`);
    for (const cn of result.crewNominations) {
      console.log(`  ${cn.person.name} (${cn.person.roles.join(", ")}): ${cn.nominations.length} nominations`);
    }

    // Kirsten Johnson should appear in crew nominations if she has P1411 claims for this film
    const kirstenEntry = result.crewNominations.find(
      (cn: any) => cn.person.name.match(/Johnson/i)
    );
    if (!kirstenEntry) {
      console.warn("DATA GAP: Kirsten Johnson has no P1411 nominations linked to Dick Johnson Is Dead in Wikidata");
    }
  });
});
```

**Step 2: Run tests**

Run: `TMDB_ACCESS_TOKEN=<token> npm run test:integration -- --reporter=verbose`
Expected: PASS with diagnostic output.

**Step 3: Commit**

```bash
git add tests/integration/comp-films.integration.test.ts
git commit -m "test: add crew cross-referencing integration tests for comp films"
```

---

### Task 6: Fix any resolution failures found

This task is conditional — only if Tasks 2-5 reveal failures.

**Step 1: Analyze test failures**

If entity resolution fails for any film/person, investigate:
- Does the TMDB ID → Wikidata mapping exist? (Check P4985/P4947 on Wikidata)
- Does the IMDb fallback work? (Check P345 on Wikidata)
- Does name search work? (Check wbsearchentities + occupation filter)

**Step 2: Fix code if the bug is in our resolution chain**

Common fixes:
- Adjust occupation filter QIDs if a person isn't being matched
- Fix IMDb ID extraction if TMDB returns a different format

**Step 3: Document if the gap is in Wikidata data**

Update `CLAUDE.md` under the "Wikidata Data Gaps" section with specific findings.

**Step 4: Commit fixes**

```bash
git commit -m "fix: <describe specific fix>"
```

---

### Task 7: Document findings and update roadmap

**Files:**
- Modify: `CLAUDE.md` (if new data gaps found)
- Modify: `ROADMAP.md` (update M10 status)

**Step 1: Add any new Wikidata data gap notes to CLAUDE.md**

Under the existing "Wikidata Data Gaps" section, add findings like:
- Which comp films had empty P166 claims despite known real-world awards
- Which registry categories are missing for documentary-specific ceremonies
- Whether P1411 crew cross-referencing recovered data that P166 missed

**Step 2: Update ROADMAP.md**

Update M10 status to Complete, add version tag, update test counts.

**Step 3: Commit and tag**

```bash
git add CLAUDE.md ROADMAP.md
git commit -m "docs: document M10 findings and update roadmap"
git tag v0.9.0
```

---

### Task 8: Provide award tool explainer to Dayton

After all tests pass, write a plain-language explanation of what each of the 4 award tools does, how they differ, and their use cases. This is a conversation output, not a code change.
