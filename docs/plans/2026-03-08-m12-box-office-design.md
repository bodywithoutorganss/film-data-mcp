# M12: Box Office & Financial Data — Design

## Goal

New `get_financials` tool (tool #21) that aggregates structured financial data for a film from multiple sources. Ships with TMDB + OMDb; designed so additional sources (OpusData, others) slot in without changing the tool interface.

## Motivation

TMDB's `budget` and `revenue` fields return $0 for most documentaries. Producers need financial benchmarks for comp films — theatrical gross, production budgets — to support pitch decks and distributor conversations. A dedicated financial tool aggregates available data and is honest about gaps.

## Data Source Assessment

| Source | Doc Coverage | Cost | Fields | Verdict |
|--------|-------------|------|--------|---------|
| Wikidata P2142 | 0.36% (0/5 comp films) | Free | Box office only | **Not viable** |
| TMDB (already have) | Sparse, ~50% missing | Free | Budget, revenue | **Baseline** |
| OMDb | Limited, many N/A | Free–$10/mo | US domestic gross | **Marginal add** |
| The Numbers / OpusData | Decent | $19–49+/mo | Everything | **Future (Layer 2)** |
| IMDb / Box Office Mojo | Good | ~$400K/yr | Everything | **Not viable** |

Wikidata P2142 has only 135 documentaries (0.36% of docs on Wikidata), and zero of our comp films (Minding the Gap, Boys State, Dick Johnson Is Dead, Won't You Be My Neighbor?, 13th) have any financial data. Same structural gap as awards (M10/M13).

## Scope

**In scope (Layer 1):** Structured financial data from TMDB + OMDb APIs.

**Deferred:**
- Layer 2: Trade press scraping (Deadline, Variety, IndieWire) for deal intelligence — separate milestone.
- Layer 3: Obsidian integration for curated/manual data — future integration.
- OpusData: Requires paid subscription evaluation — future enhancement to Layer 1.

## Tool Interface

**Name:** `get_financials`

**Input:**
```typescript
{
  movie_id: number  // TMDB movie ID (required)
}
```

Movie-only (not TV) — box office is a theatrical concept.

## Response Shape

```typescript
interface FinancialsResult {
  movie: {
    tmdb_id: number;
    imdb_id: string | null;
    title: string;
  };
  financials: {
    budget: number | null;           // USD, from TMDB
    revenue: number | null;          // USD worldwide, from TMDB
    domestic_gross: number | null;   // USD, from OMDb BoxOffice field
  };
  sources: {
    tmdb: { queried: true; had_data: boolean };
    omdb: { queried: boolean; had_data: boolean };
  };
}
```

- Numeric values, not formatted strings. OMDb's `"$188,020,017"` parsed to `188020017`.
- `null` = no data available. TMDB's `budget: 0` (unknown) converted to `null`.
- `sources` is the extensibility point — new sources get new keys.
- Flat `financials` object (no nesting by source). TMDB and OMDb don't overlap on fields, so no conflict resolution needed. If a future source duplicates a field, pick the best and note the source.

## Architecture

### New Files

- `src/tools/financials.ts` — Zod schema, `buildToolDef()`, handler
- `src/utils/omdb-client.ts` — OMDb API client (fetch-based, single method)
- `src/types/omdb.ts` — OMDb response type
- `tests/tools/financials.test.ts` — unit tests (mocked)
- `tests/utils/omdb-client.test.ts` — OMDb client unit tests

### Modified Files

- `src/index.ts` — import, register tool #21, conditionally initialize OMDb client
- `CLAUDE.md` — update tool table (21 total), document `OMDB_API_KEY`

### OMDb Client

```typescript
// src/utils/omdb-client.ts
class OMDbClient {
  constructor(apiKey: string);
  getByImdbId(imdbId: string): Promise<OMDbMovie | null>;
}
```

- Query by IMDb ID (reliable, no title-matching).
- Returns `null` on errors/not-found — source unavailability doesn't fail the tool.
- Free tier: 1,000 requests/day.

### OMDb API Key Handling

```typescript
// in index.ts
const omdbKey = process.env.OMDB_API_KEY;
const omdbClient = omdbKey ? new OMDbClient(omdbKey) : null;
```

Optional. Tool works TMDB-only when no key is set. `sources.omdb.queried` = `false` in that case.

### Handler Flow

1. Fetch TMDB movie details (budget, revenue, imdb_id, title)
2. If OMDb client available and TMDB returned an imdb_id, query OMDb
3. Parse/normalize values (TMDB `0` → `null`, OMDb `"$X"` → number, `"N/A"` → `null`)
4. Assemble and return `FinancialsResult`

## Testing

- Unit tests mock both TMDB and OMDb responses
- Test TMDB-only mode (null OMDb client)
- Test TMDB `budget: 0` → `null` conversion
- Test OMDb `BoxOffice: "N/A"` → `null` handling
- Test OMDb `BoxOffice: "$188,020,017"` → `188020017` parsing
- Test missing imdb_id (skip OMDb query)
- Integration test with known film (both API keys required)

## Future Extensibility

Adding a new source (e.g., OpusData) requires:
1. New client in `src/utils/`
2. New key in `sources` object
3. New fields in `financials` (or better values for existing fields)
4. No changes to tool interface or handler signature pattern
