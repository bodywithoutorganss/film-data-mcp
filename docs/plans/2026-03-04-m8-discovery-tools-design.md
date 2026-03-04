# M8: TMDB Discovery Tools — Design

## Motivation

Real-world producer workflow testing (BreakFall documentary research) revealed two dead-ends:

1. The `discover` tool accepts keyword IDs but there's no way to find them by name. You must already know the numeric ID (e.g., 194226 = "masculinity").
2. Finding a production company via `search` + `company_details` dead-ends — no way to browse their catalog.

Both features unlock the `discover` tool's full potential for thematic and institutional research.

## New Tools

### search_keywords

Wraps TMDB `GET /3/search/keyword`. Returns paginated keyword `{id, name}` pairs.

**Schema:**
- `query` (string, required) — keyword name to search
- `page` (number, optional) — pagination

**Example:**
```
search_keywords({ query: "masculinity" })
→ [{ id: 194226, name: "masculinity" }, { id: ..., name: "toxic masculinity" }, ...]
```

**Placement:** `src/tools/reference.ts` — same pattern as `genres` (lookup tool feeding `discover`).

**TMDBClient:** New method `searchKeywords(query: string, page?: number)` → `GET /3/search/keyword`.

### company_filmography

Ergonomic wrapper around `discover` with `with_companies` pre-filled. Eliminates the need to know `discover`'s parameter format.

**Schema:**
- `company_id` (number, required) — TMDB company ID
- `media_type` (enum: movie | tv, required)
- `page` (number, optional)
- `sort_by` (string, optional, default: `primary_release_date.desc`)

**Example:**
```
company_filmography({ company_id: 13042, media_type: "movie" })
→ paginated list of Kartemquin Films' movies, newest first
```

**Placement:** `src/tools/reference.ts` — extends company section.

**TMDBClient:** No new method. Reuses `discoverMovies` / `discoverTV` with `with_companies` param.

## Modified Descriptions

- `discover` tool: append "Use the genres tool for genre IDs and search_keywords for keyword IDs."
- `company_details` tool: append "Use company_filmography to browse their catalog."

## File Changes

| File | Change |
|---|---|
| `src/utils/tmdb-client.ts` | Add `searchKeywords()` method |
| `src/tools/reference.ts` | Add schemas, tool defs, handlers for both tools |
| `src/index.ts` | Register 2 tools in ListTools + dispatch map |
| `src/tools/discover.ts` | Update tool description |
| `tests/tools/reference.test.ts` | Schema + handler tests for both tools |
| `tests/integration/reference.live.test.ts` | Opt-in live tests |

## Tool Count

16 → 18 (14 TMDB + 4 awards)

## Testing

- Schema validation: valid/invalid inputs for both tools
- Handler tests: mock TMDBClient, verify correct API paths and parameters
- Integration (live, opt-in): search "masculinity" keyword, browse Kartemquin filmography
