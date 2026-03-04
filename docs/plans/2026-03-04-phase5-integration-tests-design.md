# Phase 5: Integration Tests — Design

## Goal

Add handler-level and live API integration tests to film-data-mcp. Currently 131 tests exist but all 12 TMDB handlers have zero coverage — only Zod schemas and client methods are tested. Phase 5 closes this gap.

## Scope

Tests only. No bug fixes, no refactoring, no new features. Known audit issues (HTTP transport, Zod/JSON Schema duplication, missing discover fields, `any` types) are out of scope.

## Part 1: Handler Unit Tests

Extend existing schema test files with `describe("handle*")` blocks. Pattern matches `awards.test.ts` — mock TMDBClient, call handler, verify correct client method called with correct args, assert JSON output.

### search.test.ts — handleSearch

- Calls `searchMulti` when no type specified
- Calls `searchByType` with correct type when type specified
- Forwards page parameter
- Returns valid JSON string
- Rejects invalid args via Zod (e.g. empty query)

### details.test.ts — handleMovieDetails, handleTVDetails, handlePersonDetails

- Calls `getMovieDetails` with movie_id
- Forwards append fields to `getMovieDetails`
- Calls `getTVDetails` with series_id and append
- Calls `getPersonDetails` with person_id and append
- Returns valid JSON string for each
- Rejects invalid args (non-positive IDs, invalid append values)

### discover.test.ts — handleDiscover

- Calls `discoverMovies` for media_type "movie"
- Calls `discoverTV` for media_type "tv"
- PARAM_MAP converts underscores to dots (e.g. `primary_release_date_gte` → `primary_release_date.gte`)
- Passes through non-mapped keys unchanged (e.g. `sort_by`, `with_genres`)
- Omits undefined values from filter object
- Returns valid JSON string

### browse.test.ts — handleTrending, handleCuratedLists

- `handleTrending` calls `getTrending` with media_type, time_window, page
- `handleCuratedLists` routes each list_type to the correct client method:
  - `now_playing` → `getNowPlaying(page, region)`
  - `upcoming` → `getUpcoming(page, region)`
  - `popular` → `getPopular(media_type, page)`
  - `top_rated` → `getTopRated(media_type, page)`
  - `airing_today` → `getAiringToday(page)`
- Region parameter forwarded for now_playing/upcoming
- Returns valid JSON string

### reference.test.ts — 5 handlers

- `handleGenres` calls `getGenres` with media_type
- `handleWatchProviders` with ID calls `getMovieWatchProviders` or `getTVWatchProviders`
- `handleWatchProviders` without ID calls `getWatchProviderList`
- `handleFindByExternalId` calls `findByExternalId` with external_id and source
- `handleCollectionDetails` calls `getCollection` with collection_id
- `handleCompanyDetails` calls `getCompany` for type "company", `getNetwork` for type "network"
- All return valid JSON strings

**Estimated: ~40-50 new tests across 5 files.**

## Part 2: Live Integration Tests

New file: `tests/integration/live-api.test.ts`

Entire suite skipped unless `TMDB_ACCESS_TOKEN` env var is set. All tests get `{ timeout: 15000 }`.

### Known entities (stable TMDB data)

- Roger Deakins: person ID 5914
- Parasite (2019): movie ID 496243
- Breaking Bad: TV ID 1396

### TMDB tests (~8-10)

- Search "Parasite" → results include movie 496243
- Movie details 496243 → title "Parasite", has imdb_id
- Movie details with `append: ["credits"]` → response includes credits key
- Person details 5914 → name "Roger Deakins"
- TV details 1396 → name "Breaking Bad"
- Discover movies with genre filter → returns non-empty results
- Trending day → returns non-empty results
- Genres movie → includes Drama (id: 18)

### Wikidata tests (~4-5)

- Resolve TMDB person ID 5914 → Wikidata entity found
- Resolve TMDB movie ID 496243 → Wikidata entity found
- Person awards for Deakins → includes at least one Oscar win
- Film awards for Parasite → includes Best Picture

## Part 3: Dispatch Verification

New file: `tests/integration/dispatch.test.ts`

Tests that `index.ts`'s handler map routes tool names to the correct handlers. Verifies wiring correctness:

- All 16 tool names are present in the dispatch map
- Each tool name routes to its expected handler
- Awards closures bind correctly (3-arg handlers work through 2-arg dispatch)
- Unknown tool names throw "Unknown tool" error
- Handler errors are caught and returned as `isError: true` responses

**Approach**: Import handlers and tool definitions directly — mock the clients, build the same dispatch map as index.ts, verify routing. This avoids needing to instantiate the MCP Server.

## Decisions

- **Test file organization**: Extend existing files (co-locate schema + handler tests). Matches awards.test.ts pattern.
- **Live test guard**: `describe.skipIf(!process.env.TMDB_ACCESS_TOKEN)` — opt-in via env var.
- **No audit fixes in scope**: HTTP transport, Zod/JSON Schema sync, discover fields, `any` types are future work.
