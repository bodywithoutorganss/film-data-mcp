# M16: Special Thanks Credits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Research TMDB/Wikidata "Thanks" credit coverage, then build a `get_thanks_credits` tool with forward, reverse, and batch query modes.

**Architecture:** TMDB's `/movie/{id}/credits` returns crew entries with `department: "Crew"` and `job: "Thanks"`. Person `combined_credits` includes these too. No new API client methods needed — the tool filters existing data. Wikidata P7137 assessed and rejected (5 films globally).

**Tech Stack:** TypeScript, Zod, vitest, TMDB API

> **Research correction (Phase 1 finding):** Thanks credits are stored as `job: "Thanks"` under `department: "Crew"`, NOT as `department: "Thanks"`. All filter logic below reflects this correction. Mock test data uses `department: "Crew"` to match real TMDB shape.

---

## Phase 1: Research

### Task 1: Write TMDB research script

**Files:**
- Create: `scripts/m16-thanks-research.mjs`

**Step 1: Write the script**

```javascript
// scripts/m16-thanks-research.mjs
// Probes TMDB credits for "Thanks" department entries across 10 films.

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
if (!TMDB_TOKEN) {
  console.error("TMDB_ACCESS_TOKEN required");
  process.exit(1);
}

const PROBE_FILMS = [
  // Comp docs
  { id: 489985, title: "Minding the Gap", tier: "comp_doc" },
  { id: 653723, title: "Boys State", tier: "comp_doc" },
  { id: 653574, title: "Dick Johnson Is Dead", tier: "comp_doc" },
  // Big docs
  { id: 340101, title: "13th", tier: "big_doc" },
  { id: 464593, title: "Won't You Be My Neighbor?", tier: "big_doc" },
  { id: 504562, title: "Free Solo", tier: "big_doc" },
  { id: 506702, title: "RBG", tier: "big_doc" },
  // Fiction
  { id: 122, title: "LOTR: Return of the King", tier: "fiction" },
  { id: 299534, title: "Avengers: Endgame", tier: "fiction" },
  { id: 496243, title: "Parasite", tier: "fiction" },
];

async function tmdbGet(endpoint) {
  const res = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}

async function probeFilm(film) {
  const credits = await tmdbGet(`/movie/${film.id}/credits`);
  const thanksCrew = (credits.crew || []).filter(
    (c) => c.department?.toLowerCase() === "thanks"
  );

  // Check if thanked people have valid TMDB person pages
  const personChecks = [];
  for (const person of thanksCrew.slice(0, 3)) {
    try {
      const details = await tmdbGet(`/person/${person.id}`);
      personChecks.push({
        id: person.id,
        name: person.name,
        job: person.job,
        has_profile: !!details.biography,
        known_for_department: details.known_for_department,
      });
    } catch (e) {
      personChecks.push({ id: person.id, name: person.name, job: person.job, error: e.message });
    }
  }

  // Collect unique job titles in Thanks department
  const jobTitles = [...new Set(thanksCrew.map((c) => c.job))];

  return {
    ...film,
    thanks_count: thanksCrew.length,
    total_crew: credits.crew?.length ?? 0,
    job_titles: jobTitles,
    sample_people: personChecks,
    thanks_entries: thanksCrew.map((c) => ({ id: c.id, name: c.name, job: c.job })),
  };
}

// Check if person combined_credits includes Thanks department entries
async function probeReverseLookup(personId, personName) {
  const details = await tmdbGet(`/person/${personId}?append_to_response=combined_credits`);
  const thanksCrew = (details.combined_credits?.crew || []).filter(
    (c) => c.department?.toLowerCase() === "thanks"
  );
  return {
    person_id: personId,
    person_name: personName,
    thanks_in_combined_credits: thanksCrew.length,
    films_thanked_in: thanksCrew.map((c) => ({
      id: c.id,
      title: c.title || c.name,
      media_type: c.media_type,
      job: c.job,
    })),
  };
}

async function main() {
  console.log("=== M16 TMDB Thanks Research ===\n");

  // Forward probes
  console.log("--- Forward Probes (film → thanks credits) ---\n");
  const results = [];
  for (const film of PROBE_FILMS) {
    const result = await probeFilm(film);
    results.push(result);
    console.log(`${film.title} (${film.tier}): ${result.thanks_count} thanks entries`);
    if (result.job_titles.length > 0) {
      console.log(`  Job titles: ${result.job_titles.join(", ")}`);
    }
    if (result.sample_people.length > 0) {
      console.log(`  Sample people: ${result.sample_people.map((p) => `${p.name} (${p.job})`).join(", ")}`);
    }
    console.log();
  }

  // Summary stats
  const withThanks = results.filter((r) => r.thanks_count > 0);
  console.log(`\n--- Summary ---`);
  console.log(`Films with Thanks credits: ${withThanks.length}/${results.length}`);
  console.log(`Total Thanks entries: ${results.reduce((sum, r) => sum + r.thanks_count, 0)}`);
  console.log(`All job titles: ${[...new Set(results.flatMap((r) => r.job_titles))].join(", ")}`);

  // Reverse probe: pick first person found in Thanks credits
  const firstThankedPerson = results.find((r) => r.thanks_entries.length > 0)?.thanks_entries[0];
  if (firstThankedPerson) {
    console.log(`\n--- Reverse Probe (person → films thanked in) ---`);
    console.log(`Testing with: ${firstThankedPerson.name} (ID: ${firstThankedPerson.id})\n`);
    const reverseResult = await probeReverseLookup(firstThankedPerson.id, firstThankedPerson.name);
    console.log(`Thanks in combined_credits: ${reverseResult.thanks_in_combined_credits}`);
    for (const film of reverseResult.films_thanked_in) {
      console.log(`  ${film.title} (${film.media_type}) — ${film.job}`);
    }
  } else {
    console.log("\nNo Thanks credits found in any probed film — cannot test reverse lookup.");
  }

  // Full JSON output
  console.log("\n\n=== Full JSON Results ===\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add scripts/m16-thanks-research.mjs
git commit -m "research: M16 TMDB thanks credits probe script"
```

---

### Task 2: Run TMDB research script and capture output

**Step 1: Run the script**

Run: `TMDB_ACCESS_TOKEN=<token> node scripts/m16-thanks-research.mjs 2>&1 | tee docs/plans/m16-tmdb-research-output.txt`

**Step 2: Analyze results**

Key questions to answer:
- How many of the 10 films have Thanks credits?
- What job title variants exist (Thanks, Special Thanks, Acknowledgement, etc.)?
- Do thanked people have valid TMDB person profiles?
- Does `combined_credits` include Thanks entries (reverse lookup viability)?

**Step 3: Commit raw output**

```bash
git add docs/plans/m16-tmdb-research-output.txt
git commit -m "research: M16 TMDB thanks credits probe results"
```

---

### Task 3: Wikidata research

**Step 1: Search for acknowledgment-related Wikidata properties**

Run SPARQL queries to find properties that could model "thanked in" or "acknowledged by":
- Search for properties containing "thank" or "acknowledge" in their labels
- Check P7084 (related category), P1889 (different from) on probe film entities
- Check if any Wikidata film entities have "thanks" or "acknowledgment" claims

```sparql
# Find properties with "thank" in label
SELECT ?prop ?propLabel WHERE {
  ?prop wikibase:propertyType ?type .
  ?prop rdfs:label ?propLabel .
  FILTER(LANG(?propLabel) = "en")
  FILTER(CONTAINS(LCASE(?propLabel), "thank"))
}

# Check if probe films have any unusual properties
SELECT ?prop ?propLabel ?value ?valueLabel WHERE {
  wd:Q25188386 ?prop ?value .
  ?property wikibase:directClaim ?prop .
  ?property rdfs:label ?propLabel .
  FILTER(LANG(?propLabel) = "en")
  OPTIONAL { ?value rdfs:label ?valueLabel . FILTER(LANG(?valueLabel) = "en") }
}
```

Run these via `curl` against `https://query.wikidata.org/sparql`.

**Step 2: Document Wikidata findings**

Record: which properties exist, coverage rate, go/no-go decision.

---

### Task 4: Write research findings doc

**Files:**
- Create: `docs/plans/2026-03-08-m16-research-findings.md`

**Step 1: Write findings doc**

Synthesize TMDB and Wikidata research into a findings doc with:
- Coverage rates by tier (comp doc, big doc, fiction)
- Job title taxonomy discovered
- Reverse lookup viability (does combined_credits include Thanks?)
- Wikidata coverage assessment
- Go/no-go decisions for each data source
- Output shape recommendation (flat vs. grouped — informed by actual job title variants found)

**Step 2: Commit**

```bash
git add docs/plans/2026-03-08-m16-research-findings.md
git commit -m "research: M16 thanks credits findings and design decisions"
```

---

## Phase 2: Tool Implementation

> **Note:** Exact output shape may be refined based on research findings from Phase 1. The code below assumes TMDB has Thanks data and combined_credits includes it (the most likely case). If research disproves this, revisit before proceeding.
>
> **Scope note:** Phase 3 (Cross-Referencing & Enrichment) from the design doc is deferred to a future milestone pending research findings. This plan covers the core tool only.
>
> **Batch mode is movie-only.** TV thanks credits are rare and batch TV aggregation can be added if needed.

### Task 5: Write schema tests for `get_thanks_credits`

**Files:**
- Create: `tests/tools/thanks.test.ts`

**Step 1: Write the failing tests**

```typescript
// ABOUTME: Tests for get_thanks_credits tool.
// ABOUTME: Validates schema modes (forward, reverse, batch), handler logic, and aggregation.

import { describe, it, expect } from "vitest";
import { ThanksCreditsBaseSchema, ThanksCreditsSchema } from "../../src/tools/thanks.js";

describe("ThanksCreditsSchema", () => {
  // Base schema field validation
  it("rejects invalid mode", () => {
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "invalid" })).toThrow();
  });

  it("rejects non-positive IDs", () => {
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "forward", movie_id: -1 })).toThrow();
    expect(() => ThanksCreditsBaseSchema.parse({ mode: "reverse", person_id: 0 })).toThrow();
  });

  // Refined schema mode validation (ThanksCreditsSchema enforces mode-specific requirements)
  it("accepts forward mode with movie_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "forward", movie_id: 550 });
    expect(result.mode).toBe("forward");
    expect(result.movie_id).toBe(550);
  });

  it("accepts forward mode with series_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "forward", series_id: 1396 });
    expect(result.mode).toBe("forward");
    expect(result.series_id).toBe(1396);
  });

  it("rejects forward mode with both movie_id and series_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "forward", movie_id: 550, series_id: 1396 })).toThrow();
  });

  it("rejects forward mode without movie_id or series_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "forward" })).toThrow();
  });

  it("accepts reverse mode with person_id", () => {
    const result = ThanksCreditsSchema.parse({ mode: "reverse", person_id: 287 });
    expect(result.mode).toBe("reverse");
    expect(result.person_id).toBe(287);
  });

  it("rejects reverse mode without person_id", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "reverse" })).toThrow();
  });

  it("accepts batch mode with movie_ids", () => {
    const result = ThanksCreditsSchema.parse({ mode: "batch", movie_ids: [550, 680] });
    expect(result.mode).toBe("batch");
    expect(result.movie_ids).toEqual([550, 680]);
  });

  it("rejects batch mode without movie_ids", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "batch" })).toThrow();
  });

  it("rejects batch mode with empty movie_ids", () => {
    expect(() => ThanksCreditsSchema.parse({ mode: "batch", movie_ids: [] })).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: FAIL — cannot find `../../src/tools/thanks.js`

**Step 3: Commit failing test**

```bash
git add tests/tools/thanks.test.ts
git commit -m "test: add schema tests for get_thanks_credits (red)"
```

---

### Task 6: Implement schema and make schema tests pass

**Files:**
- Create: `src/tools/thanks.ts`

**Step 1: Write minimal implementation**

```typescript
// ABOUTME: MCP tool for surfacing Thanks and Special Thanks credits from TMDB.
// ABOUTME: Supports forward (film→thanks), reverse (person→films thanked in), and batch queries.

import { z } from "zod";
import { buildToolDef } from "../utils/tool-helpers.js";

export const ThanksCreditsBaseSchema = z.object({
  mode: z
    .enum(["forward", "reverse", "batch"])
    .describe("Query mode: forward (film→thanked people), reverse (person→films thanked in), batch (multiple films aggregated)"),
  movie_id: z
    .number().int().positive().optional()
    .describe("TMDB movie ID (forward mode)"),
  series_id: z
    .number().int().positive().optional()
    .describe("TMDB TV series ID (forward mode)"),
  person_id: z
    .number().int().positive().optional()
    .describe("TMDB person ID (reverse mode)"),
  movie_ids: z
    .array(z.number().int().positive()).optional()
    .describe("TMDB movie IDs (batch mode — aggregates thanks across multiple films)"),
});

export const ThanksCreditsSchema = ThanksCreditsBaseSchema.refine(
  (data) => {
    if (data.mode === "forward") return (data.movie_id !== undefined) !== (data.series_id !== undefined);
    if (data.mode === "reverse") return data.person_id !== undefined;
    if (data.mode === "batch") return data.movie_ids !== undefined && data.movie_ids.length > 0;
    return false;
  },
  { message: "forward requires movie_id or series_id, reverse requires person_id, batch requires movie_ids" }
);

export const thanksCreditsTool = buildToolDef(
  "get_thanks_credits",
  "Surface Thanks and Special Thanks credits from TMDB. Three modes: forward (film→thanked people), reverse (person→all films they are thanked in, plus their formal crew roles), batch (aggregate thanks across multiple films with frequency map).",
  ThanksCreditsBaseSchema
);
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tools/thanks.ts tests/tools/thanks.test.ts
git commit -m "feat: add ThanksCreditsSchema with forward/reverse/batch modes"
```

---

### Task 7: Write forward query handler tests

**Files:**
- Modify: `tests/tools/thanks.test.ts`

**Step 1: Write failing tests**

Add to `tests/tools/thanks.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThanksCreditsBaseSchema, handleGetThanksCredits } from "../../src/tools/thanks.js";

// ... schema tests from Task 5 ...

describe("handleGetThanksCredits — forward mode", () => {
  const mockTmdbClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns Thanks crew from movie credits", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      title: "Fight Club",
      crew: [
        { id: 1, name: "Alice", department: "Crew", job: "Special Thanks" },
        { id: 2, name: "Bob", department: "Crew", job: "Thanks" },
        { id: 3, name: "Carol", department: "Directing", job: "Director" },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.movie_id).toBe(550);
    expect(result.title).toBe("Fight Club");
    expect(result.thanks).toHaveLength(2);
    expect(result.thanks[0].name).toBe("Alice");
    expect(result.thanks[0].job).toBe("Special Thanks");
    expect(result.thanks[1].name).toBe("Bob");
  });

  it("returns empty thanks array when no Thanks job entries", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      title: "Fight Club",
      crew: [{ id: 3, name: "Carol", department: "Directing", job: "Director" }],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.thanks).toHaveLength(0);
  });

  it("handles TV series via aggregate credits", async () => {
    mockTmdbClient.getTVAggregateCredits.mockResolvedValue({
      id: 1396,
      name: "Breaking Bad",
      crew: [
        { id: 10, name: "Dave", department: "Crew", jobs: [{ job: "Special Thanks" }], total_episode_count: 62 },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", series_id: 1396 }, mockTmdbClient as any)
    );

    expect(result.series_id).toBe(1396);
    expect(result.title).toBe("Breaking Bad");
    expect(result.thanks).toHaveLength(1);
    expect(result.thanks[0].episode_count).toBe(62);
  });

  it("filters case-insensitively for Thanks job title", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 550,
      title: "Fight Club",
      crew: [
        { id: 1, name: "Alice", department: "Crew", job: "Thanks" },
        { id: 2, name: "Bob", department: "Crew", job: "SPECIAL THANKS" },
      ],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 550 }, mockTmdbClient as any)
    );

    expect(result.thanks).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: FAIL — `handleGetThanksCredits` not exported or not implemented

**Step 3: Commit**

```bash
git add tests/tools/thanks.test.ts
git commit -m "test: add forward query handler tests for get_thanks_credits (red)"
```

---

### Task 8: Implement forward query handler

**Files:**
- Modify: `src/tools/thanks.ts`

**Step 1: Add handler implementation**

Append to `src/tools/thanks.ts`:

```typescript
import type { TMDBClient } from "../utils/tmdb-client.js";

interface ThanksEntry {
  id: number;
  name: string;
  job: string;
  episode_count?: number;
}

function filterThanksCrew(crew: any[]): ThanksEntry[] {
  return crew
    .filter((c) => c.job?.toLowerCase().includes("thank"))
    .map((c) => ({
      id: c.id,
      name: c.name,
      job: c.job ?? (c.jobs ? c.jobs.map((j: any) => j.job).join(", ") : ""),
      ...(c.total_episode_count !== undefined ? { episode_count: c.total_episode_count } : {}),
    }));
}

async function handleForward(
  args: { movie_id?: number; series_id?: number },
  client: TMDBClient
): Promise<Record<string, any>> {
  if (args.movie_id !== undefined) {
    const data = await client.getMovieCredits(args.movie_id);
    return {
      movie_id: args.movie_id,
      title: data.title ?? "",
      thanks: filterThanksCrew(data.crew ?? []),
    };
  } else {
    const data = await client.getTVAggregateCredits(args.series_id!);
    return {
      series_id: args.series_id,
      title: data.name ?? "",
      thanks: filterThanksCrew(data.crew ?? []),
    };
  }
}

export async function handleGetThanksCredits(
  args: unknown,
  client: TMDBClient
): Promise<string> {
  const parsed = ThanksCreditsSchema.parse(args);

  let result: Record<string, any>;

  if (parsed.mode === "forward") {
    result = await handleForward(parsed, client);
  } else {
    throw new Error(`Mode "${parsed.mode}" not yet implemented`);
  }

  return JSON.stringify(result, null, 2);
}
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 4: Commit**

```bash
git add src/tools/thanks.ts
git commit -m "feat: implement forward query for get_thanks_credits"
```

---

### Task 9: Write reverse query handler tests

**Files:**
- Modify: `tests/tools/thanks.test.ts`

**Step 1: Write failing tests**

Add to `tests/tools/thanks.test.ts`:

```typescript
describe("handleGetThanksCredits — reverse mode", () => {
  const mockTmdbClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns films where person is thanked from combined_credits", async () => {
    mockTmdbClient.getPersonDetails.mockResolvedValue({
      id: 287,
      name: "Brad Pitt",
      known_for_department: "Acting",
      combined_credits: {
        crew: [
          { id: 100, title: "Film A", media_type: "movie", department: "Crew", job: "Special Thanks" },
          { id: 200, title: "Film B", media_type: "movie", department: "Crew", job: "Thanks" },
          { id: 300, title: "Film C", media_type: "movie", department: "Directing", job: "Director" },
        ],
        cast: [
          { id: 400, title: "Film D", media_type: "movie", character: "Tyler Durden" },
        ],
      },
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "reverse", person_id: 287 }, mockTmdbClient as any)
    );

    expect(result.person.id).toBe(287);
    expect(result.person.name).toBe("Brad Pitt");
    expect(result.thanked_in).toHaveLength(2);
    expect(result.thanked_in[0].title).toBe("Film A");
    expect(result.thanked_in[0].job).toBe("Special Thanks");
    expect(result.formal_roles).toBeDefined();
  });

  it("includes formal crew roles summary", async () => {
    mockTmdbClient.getPersonDetails.mockResolvedValue({
      id: 287,
      name: "Brad Pitt",
      known_for_department: "Acting",
      combined_credits: {
        crew: [
          { id: 100, title: "Film A", media_type: "movie", department: "Crew", job: "Thanks" },
          { id: 300, title: "Film C", media_type: "movie", department: "Production", job: "Producer" },
          { id: 301, title: "Film D", media_type: "movie", department: "Production", job: "Executive Producer" },
        ],
        cast: [],
      },
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "reverse", person_id: 287 }, mockTmdbClient as any)
    );

    expect(result.formal_roles).toHaveLength(2);
    expect(result.formal_roles.some((r: any) => r.job === "Producer")).toBe(true);
  });

  it("returns empty arrays when person has no thanks or crew credits", async () => {
    mockTmdbClient.getPersonDetails.mockResolvedValue({
      id: 287,
      name: "Brad Pitt",
      known_for_department: "Acting",
      combined_credits: { crew: [], cast: [] },
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "reverse", person_id: 287 }, mockTmdbClient as any)
    );

    expect(result.thanked_in).toHaveLength(0);
    expect(result.formal_roles).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: FAIL — reverse mode throws "not yet implemented"

**Step 3: Commit**

```bash
git add tests/tools/thanks.test.ts
git commit -m "test: add reverse query handler tests for get_thanks_credits (red)"
```

---

### Task 10: Implement reverse query handler

**Files:**
- Modify: `src/tools/thanks.ts`

**Step 1: Add reverse handler**

Add to `src/tools/thanks.ts`, before `handleGetThanksCredits`:

```typescript
interface FormalRole {
  id: number;
  title: string;
  media_type: string;
  department: string;
  job: string;
}

async function handleReverse(
  args: { person_id: number },
  client: TMDBClient
): Promise<Record<string, any>> {
  const details = await client.getPersonDetails(args.person_id, ["combined_credits"]);
  const crew = details.combined_credits?.crew ?? [];

  const thankedIn = crew
    .filter((c: any) => c.job?.toLowerCase().includes("thank"))
    .map((c: any) => ({
      id: c.id,
      title: c.title || c.name,
      media_type: c.media_type,
      job: c.job,
    }));

  const formalRoles: FormalRole[] = crew
    .filter((c: any) => !c.job?.toLowerCase().includes("thank"))
    .map((c: any) => ({
      id: c.id,
      title: c.title || c.name,
      media_type: c.media_type,
      department: c.department,
      job: c.job,
    }));

  return {
    person: {
      id: details.id,
      name: details.name,
      known_for_department: details.known_for_department,
    },
    thanked_in: thankedIn,
    formal_roles: formalRoles,
  };
}
```

Update `handleGetThanksCredits` to route reverse mode:

```typescript
  if (parsed.mode === "forward") {
    result = await handleForward(parsed, client);
  } else if (parsed.mode === "reverse") {
    result = await handleReverse(parsed, client);
  } else {
    throw new Error(`Mode "${parsed.mode}" not yet implemented`);
  }
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/tools/thanks.ts
git commit -m "feat: implement reverse query for get_thanks_credits"
```

---

### Task 11: Write batch query handler tests

**Files:**
- Modify: `tests/tools/thanks.test.ts`

**Step 1: Write failing tests**

Add to `tests/tools/thanks.test.ts`:

```typescript
describe("handleGetThanksCredits — batch mode", () => {
  const mockTmdbClient = {
    getMovieCredits: vi.fn(),
    getTVAggregateCredits: vi.fn(),
    getPersonDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("aggregates thanks across multiple films", async () => {
    mockTmdbClient.getMovieCredits
      .mockResolvedValueOnce({
        id: 100, title: "Film A",
        crew: [
          { id: 1, name: "Alice", department: "Crew", job: "Special Thanks" },
          { id: 2, name: "Bob", department: "Crew", job: "Thanks" },
        ],
        cast: [],
      })
      .mockResolvedValueOnce({
        id: 200, title: "Film B",
        crew: [
          { id: 1, name: "Alice", department: "Crew", job: "Thanks" },
          { id: 3, name: "Carol", department: "Crew", job: "Special Thanks" },
        ],
        cast: [],
      });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "batch", movie_ids: [100, 200] }, mockTmdbClient as any)
    );

    expect(result.films).toHaveLength(2);
    expect(result.frequency_map).toBeDefined();
    // Alice appears in both films
    const alice = result.frequency_map.find((p: any) => p.name === "Alice");
    expect(alice.count).toBe(2);
    expect(alice.films).toHaveLength(2);
  });

  it("sorts frequency map by count descending", async () => {
    mockTmdbClient.getMovieCredits
      .mockResolvedValueOnce({
        id: 100, title: "Film A",
        crew: [
          { id: 1, name: "Alice", department: "Crew", job: "Thanks" },
          { id: 2, name: "Bob", department: "Crew", job: "Thanks" },
        ],
        cast: [],
      })
      .mockResolvedValueOnce({
        id: 200, title: "Film B",
        crew: [{ id: 1, name: "Alice", department: "Crew", job: "Thanks" }],
        cast: [],
      });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "batch", movie_ids: [100, 200] }, mockTmdbClient as any)
    );

    expect(result.frequency_map[0].name).toBe("Alice");
    expect(result.frequency_map[0].count).toBe(2);
    expect(result.frequency_map[1].name).toBe("Bob");
    expect(result.frequency_map[1].count).toBe(1);
  });

  it("returns empty frequency map when no thanks credits exist", async () => {
    mockTmdbClient.getMovieCredits.mockResolvedValue({
      id: 100, title: "Film A",
      crew: [{ id: 3, name: "Carol", department: "Directing", job: "Director" }],
      cast: [],
    });

    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "batch", movie_ids: [100] }, mockTmdbClient as any)
    );

    expect(result.films).toHaveLength(1);
    expect(result.frequency_map).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: FAIL — batch mode throws "not yet implemented"

**Step 3: Commit**

```bash
git add tests/tools/thanks.test.ts
git commit -m "test: add batch query handler tests for get_thanks_credits (red)"
```

---

### Task 12: Implement batch query handler

**Files:**
- Modify: `src/tools/thanks.ts`

**Step 1: Add batch handler**

Add to `src/tools/thanks.ts`:

```typescript
interface FrequencyEntry {
  id: number;
  name: string;
  count: number;
  films: { id: number; title: string; job: string }[];
}

async function handleBatch(
  args: { movie_ids: number[] },
  client: TMDBClient
): Promise<Record<string, any>> {
  const films: { movie_id: number; title: string; thanks: ThanksEntry[] }[] = [];
  const personMap = new Map<number, FrequencyEntry>();

  for (const movieId of args.movie_ids) {
    const data = await client.getMovieCredits(movieId);
    const thanks = filterThanksCrew(data.crew ?? []);
    const title = data.title ?? "";
    films.push({ movie_id: movieId, title, thanks });

    for (const entry of thanks) {
      const existing = personMap.get(entry.id);
      if (existing) {
        existing.count++;
        existing.films.push({ id: movieId, title, job: entry.job });
      } else {
        personMap.set(entry.id, {
          id: entry.id,
          name: entry.name,
          count: 1,
          films: [{ id: movieId, title, job: entry.job }],
        });
      }
    }
  }

  const frequencyMap = [...personMap.values()].sort((a, b) => b.count - a.count);

  return { films, frequency_map: frequencyMap };
}
```

Update `handleGetThanksCredits` to route batch mode:

```typescript
  if (parsed.mode === "forward") {
    result = await handleForward(parsed, client);
  } else if (parsed.mode === "reverse") {
    result = await handleReverse(parsed, client);
  } else {
    result = await handleBatch(parsed, client);
  }
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/tools/thanks.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/tools/thanks.ts
git commit -m "feat: implement batch query for get_thanks_credits"
```

---

### Task 13: Wire tool into index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Add import and register**

Add to imports:
```typescript
import { thanksCreditsTool, handleGetThanksCredits } from "./tools/thanks.js";
```

Add `thanksCreditsTool` to the `tools` array in `ListToolsRequestSchema` handler.

Add to the `handlers` dispatch map:
```typescript
get_thanks_credits: handleGetThanksCredits,
```

Update the server version to `"0.13.0"`.

Update the file header comment to reflect the new tool count (23 total: 18 TMDB + 4 awards + 1 representation).

**Step 2: Verify build**

Run: `npm run build`
Expected: Compiles without errors

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (including dispatch tests if any)

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire get_thanks_credits into MCP server (tool #23)"
```

---

### Task 14: Write integration test

**Files:**
- Create: `tests/integration/m16-thanks.integration.test.ts`

**Step 1: Write integration test**

```typescript
// ABOUTME: Integration tests for get_thanks_credits against live TMDB API.
// ABOUTME: Verifies forward, reverse, and batch modes with real data.

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { handleGetThanksCredits } from "../../src/tools/thanks.js";

const token = process.env.TMDB_ACCESS_TOKEN;
if (!token) throw new Error("TMDB_ACCESS_TOKEN required for integration tests");

const client = new TMDBClient(token);

describe("get_thanks_credits integration", () => {
  // Use film IDs identified during research as having Thanks credits.
  // Update these after Task 2 if research reveals better candidates.

  it("forward mode returns thanks credits for a film", async () => {
    // Pulp Fiction: 11 Thanks credits confirmed by research
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "forward", movie_id: 680 }, client)
    );

    expect(result.movie_id).toBe(680);
    expect(result.title).toBeTruthy();
    expect(result.thanks.length).toBeGreaterThan(0);
    expect(result.thanks[0]).toHaveProperty("name");
    expect(result.thanks[0]).toHaveProperty("job");
  }, 30000);

  it("reverse mode returns films a person is thanked in", async () => {
    // Jim Starlin (1713975): 4 Thanks credits confirmed by research
    // (Avengers: Infinity War, Endgame, Legends of Tomorrow, What If...?)
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "reverse", person_id: 1713975 }, client)
    );

    expect(result.person.id).toBe(1713975);
    expect(result.person.name).toBe("Jim Starlin");
    expect(result.thanked_in.length).toBeGreaterThan(0);
    expect(Array.isArray(result.formal_roles)).toBe(true);
  }, 30000);

  it("batch mode aggregates thanks across multiple films", async () => {
    // Pulp Fiction (680, 11 thanks) + Endgame (299534, 5 thanks)
    const result = JSON.parse(
      await handleGetThanksCredits({ mode: "batch", movie_ids: [680, 299534] }, client)
    );

    expect(result.films).toHaveLength(2);
    expect(result.frequency_map.length).toBeGreaterThan(0);
  }, 30000);
});
```

**Step 2: Run integration test**

Run: `TMDB_ACCESS_TOKEN=<token> npx vitest run tests/integration/m16-thanks.integration.test.ts`
Expected: PASS (update film/person IDs based on research findings if needed)

**Step 3: Commit**

```bash
git add tests/integration/m16-thanks.integration.test.ts
git commit -m "test: add integration tests for get_thanks_credits"
```

---

### Task 15: Update CLAUDE.md and ROADMAP.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `ROADMAP.md`

**Step 1: Update CLAUDE.md**

- Add `thanks.ts` to the architecture diagram under `tools/`
- Add `get_thanks_credits` to the tools table
- Update tool count (23 total: 18 TMDB + 4 awards + 1 representation)
- Add any data gap notes discovered during research

**Step 2: Update ROADMAP.md**

- Update M16 status to "Complete"
- Add design/plan doc links
- Update time tracking
- Update current status section with new version and tool count

**Step 3: Commit**

```bash
git add CLAUDE.md ROADMAP.md
git commit -m "docs: update CLAUDE.md and ROADMAP.md for M16 completion"
```

**Step 4: Tag release**

```bash
git tag v0.13.0
```
