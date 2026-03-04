# M8: Discovery & Polish — Design

## Scope

Two new tools focused on film research workflows: festival premiere extraction and dedicated credits browsing with filtering and pagination. Tool count goes from 18 to 20.

Deferred to a later milestone: awards registry gaps (Critics Choice, Gotham, Emmy Outstanding Limited Series, TIFF Platform Prize) and fellowships/labs/grants data.

## Tool 1: `get_festival_premieres`

**Purpose:** Return all premiere-type release dates for a movie — the festivals and markets where a film debuted before general release.

**Data source:** TMDB `GET /3/movie/{id}/release_dates`, filtered to type 1 (Premiere).

### Schema

```typescript
{
  movie_id: number  // required, TMDB movie ID
}
```

### Handler logic

1. Call `tmdbClient.getMovieDetails(movie_id, ["release_dates"])`
2. Flatten all countries' `release_dates` arrays
3. Filter to `type === 1` (Premiere)
4. Sort by `release_date` ascending (earliest premiere first)
5. Return structured array

### Response shape

```json
{
  "movie_id": 496243,
  "title": "Parasite",
  "premieres": [
    { "date": "2019-05-21", "country": "FR", "note": "Cannes Film Festival", "certification": "" },
    { "date": "2019-05-30", "country": "KR", "note": "", "certification": "15" }
  ],
  "total": 2
}
```

### Edge cases

- No type-1 entries: return empty `premieres` array with `total: 0`
- Missing `note` field: return empty string (not all premieres have festival names)

### File placement

`src/tools/premieres.ts`

## Tool 2: `get_credits`

**Purpose:** Dedicated credits tool with filtering by role type, department, and job title, plus pagination. Works for both movies and TV series.

**Data source:**
- Movies: `GET /3/movie/{id}/credits`
- TV: `GET /3/tv/{id}/aggregate_credits` (groups all seasons' roles per person)

### Schema

```typescript
{
  movie_id?: number,       // TMDB movie ID (exactly one of movie_id/series_id required)
  series_id?: number,      // TMDB TV series ID
  type: "cast" | "crew" | "all",  // default "all"
  department?: string,     // filter crew by department (e.g., "Camera", "Production")
  job?: string,            // filter crew by job title (e.g., "Director of Photography")
  limit: number,           // default 20, 0 for unlimited
  offset: number,          // default 0, for pagination
}
```

Uses the BaseSchema split pattern (ZodEffects gotcha) for the `.refine()` that enforces exactly one of movie_id/series_id.

### Validation

- Exactly one of `movie_id` or `series_id` must be provided
- `department` and `job` filters silently ignored when applied to cast (cast has no departments)

### Handler logic

1. Call appropriate TMDB endpoint based on which ID is provided
2. For TV aggregate credits, normalize the per-person roles array to flat structure
3. Start with full `cast` and/or `crew` arrays based on `type`
4. Apply `department` filter if provided (case-insensitive match)
5. Apply `job` filter if provided (case-insensitive match)
6. Record `total_cast` and `total_crew` counts (pre-pagination, post-filter)
7. Apply `offset` then `limit` to each array
8. Return result with pagination metadata

### Response shape

```json
{
  "movie_id": 496243,
  "title": "Parasite",
  "cast": [
    { "id": 20738, "name": "Song Kang-ho", "character": "Ki-taek", "order": 0 }
  ],
  "crew": [
    { "id": 21684, "name": "Bong Joon-ho", "department": "Directing", "job": "Director" }
  ],
  "pagination": {
    "total_cast": 25,
    "total_crew": 87,
    "offset": 0,
    "limit": 20
  }
}
```

### Edge cases

- `department` filter with `type: "cast"`: silently ignored, all cast returned
- `offset` beyond total: return empty arrays with correct totals
- TV aggregate credits normalized to flat structure matching movie credits format

### File placement

`src/tools/credits.ts`

## Integration

### TMDBClient additions

- `getMovieCredits(movieId: number)` — `GET /3/movie/{id}/credits`
- `getTVAggregateCredits(seriesId: number)` — `GET /3/tv/{id}/aggregate_credits`
- No changes needed for premieres (reuses existing `getMovieDetails` with `release_dates` append)

### Tool registration

- Add both tools to `src/index.ts` dispatch map
- Cross-reference descriptions:
  - `movie_details` mentions `get_festival_premieres` for premiere queries
  - `movie_details` and `tv_details` mention `get_credits` for full crew browsing

### Version

v0.7.0

## Testing

### Unit tests (mocked TMDB responses)

**`premieres.test.ts`:**
- Premiere filtering from mixed release types
- Chronological sorting
- Empty premieres (no type-1 entries)
- Missing note fields

**`credits.test.ts`:**
- Cast/crew type filtering
- Department filter (case-insensitive)
- Job filter (case-insensitive)
- Pagination: offset, limit, beyond-total
- Mutual exclusion validation (movie_id vs series_id)
- TV aggregate credits normalization

### Live API tests (skipped in CI)

- Parasite (496243) for premieres — known Cannes debut
- Breaking Bad (1396) for TV credits
- Crew-heavy film for pagination testing
