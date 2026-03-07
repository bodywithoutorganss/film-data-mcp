# film-data-mcp

## Quick Start

```bash
npm install
npm run build

TMDB_ACCESS_TOKEN=<your-token> node build/index.js

# Run tests
npm test

# Run integration tests (hits live TMDB + Wikidata APIs)
TMDB_ACCESS_TOKEN=<your-token> npm run test:integration
```

## Architecture

```
src/
  index.ts               - Server entry point, handler dispatch map
  tools/
    search.ts            - Unified search (multi/movie/tv/person/company)
    details.ts           - Movie, TV, and person details with append_to_response
    discover.ts          - Movie/TV discovery with 30+ filters
    browse.ts            - Trending and curated lists (popular, top rated, etc.)
    reference.ts         - Genres, watch providers, external ID lookup, collections, companies, keywords, filmography
    awards.ts            - Wikidata SPARQL awards tools (person, film, history, search)
    premieres.ts         - Festival premiere extraction from TMDB release dates
    credits.ts           - Detailed credits with department/job filtering and pagination
  types/
    tmdb.ts              - TMDB response types
    tmdb-extended.ts     - Extended types for append_to_response and new endpoints
    wikidata.ts          - Wikidata/SPARQL response types
    awards-registry.ts   - Verified ceremony and award category QIDs
  utils/
    tmdb-client.ts       - TMDB API client (fetch-based, append_to_response bundling)
    wikidata-client.ts   - Wikidata SPARQL client + entity resolution
    tool-helpers.ts      - buildToolDef() — Zod schema to MCP tool definition
```

## Tools (20 total: 16 TMDB, 4 awards)

| Tool | File | Description |
|------|------|-------------|
| search | search.ts | Multi/movie/tv/person/company search |
| movie_details | details.ts | Movie info with optional appended credits, videos, etc. |
| tv_details | details.ts | TV show info with optional appended credits, videos, etc. |
| person_details | details.ts | Person bio with optional appended credits |
| discover | discover.ts | Advanced movie/TV filtering (genre, year, rating, etc.) |
| trending | browse.ts | Daily/weekly trending movies, TV, people |
| curated_lists | browse.ts | Popular, top rated, now playing, airing today, upcoming |
| genres | reference.ts | Genre ID/name lists for movies or TV |
| watch_providers | reference.ts | Streaming/rent/buy availability, or list all providers |
| find_by_external_id | reference.ts | IMDb/TVDB/social media → TMDB lookup |
| collection_details | reference.ts | Movie franchise/collection details |
| company_details | reference.ts | Production company or TV network details |
| search_keywords | reference.ts | Search for TMDB keyword IDs by name — single or batch (for discover filters) |
| company_filmography | reference.ts | Browse a production company's movie/TV catalog |
| get_festival_premieres | premieres.ts | Festival/limited premiere dates from TMDB release dates |
| get_credits | credits.ts | Detailed cast/crew with department/job filtering and pagination |
| get_person_awards | awards.ts | Award wins and nominations for a person (by TMDB ID, with optional name fallback) |
| get_film_awards | awards.ts | All awards a film has received, with crew cross-referencing (by TMDB movie ID) |
| get_award_history | awards.ts | All winners of a specific award category across years |
| search_awards | awards.ts | Search the awards registry by ceremony, category, or domain |

## Tool Pattern

Every tool file exports three things per tool:
1. A Zod schema: `{ToolName}Schema`
2. A tool definition via `buildToolDef(name, description, schema)` — generates MCP-compatible JSON Schema from Zod using `toJSONSchema()`
3. A handler: `handle{ToolName}(args, client): Promise<string>`

Handlers validate via Zod internally and return `JSON.stringify(result, null, 2)`. All tool output is `text` content. The dispatch map in `index.ts` routes by tool name.

## Data Sources

- **TMDB**: Crew/cast/credits, metadata. Requires `TMDB_ACCESS_TOKEN` env var.
- **Wikidata SPARQL**: Awards data. No auth required. Live queries to `https://query.wikidata.org/sparql`.

## Awards Registry

`src/types/awards-registry.ts` contains verified Wikidata QIDs for 21 ceremonies/festivals and 91 award categories. Every QID was verified via SPARQL. Do not add QIDs without verification.

**Not yet implemented:** fellowships, labs, and grants from design doc scope. The schema supports them (`ceremony_type` includes `"fellowship" | "lab" | "grant"`), so adding them requires only data.

## Testing

- `npm test` — unit tests (no network), 293 tests across 16 files
- `npm run test:integration` — integration tests (hits live TMDB + Wikidata APIs, needs `TMDB_ACCESS_TOKEN`)
- Integration test files: `tests/integration/live-api.test.ts` (TMDB + Wikidata basics), `tests/integration/comp-films.integration.test.ts` (award tools vs. documentary comp films), `tests/tools/awards.integration.test.ts` (name-based resolution)
- Test files mirror source structure: `tests/tools/`, `tests/types/`, `tests/utils/`

### Response Size Considerations

Some append combinations produce large responses. Built-in filters help:

- `movie_details` / `tv_details` / `person_details` + credits: limited to top 20 cast + crew by default via `credits_limit` parameter. Pass `credits_limit: 0` for unlimited.
- `watch_providers` per movie: use the `region` parameter (e.g., `"US"`) to get a single country instead of all ~40 regions.

For filmography exploration, `discover` with `with_crew`/`with_cast` filters returns paginated, context-friendly results.

### get_film_awards Response Shape

`get_film_awards` returns three crew categories:
- `crewNominations` — crew who resolved to Wikidata AND have P1411 nominations matching this film
- `resolvedCrew` — crew who resolved to Wikidata but have no nominations matching this film (still valuable for identifying notable crew associations)
- `skippedCrew` — crew who could not be resolved to any Wikidata entity (no TMDB ID, IMDb ID, or name match)

### Wikidata Data Gaps

- Awards data lags ~1-2 years behind real-world ceremonies. Recent winners may return empty results.
- Award history queries may include duplicate entries (both film entity and person entity for the same year/award).
- Some Wikidata entities lack labels. These are automatically cleaned to `"Unknown (Q585668)"` format.
- **Documentary-specific gaps (verified via comp film testing):**
  - P166 (award received) is sparse for documentary films. Direct film queries often return 0 awards even for Oscar-nominated docs (e.g., Minding the Gap). The P1411 crew cross-referencing path is the primary channel for recovering documentary award data.
  - Dick Johnson Is Dead: Independent Spirit Documentary nomination missing. Kirsten Johnson has 1 P166 claim that doesn't match any registered award category.
  - Jesse Moss (Boys State co-director): 0 P166 and 0 P1411 claims — completely absent from Wikidata awards data.
  - Some crew members for smaller documentary productions are unresolvable in Wikidata (no entity exists).
  - **Tier 2 name resolution:** When TMDB ID and IMDb ID resolution both fail, `resolvePersonByName` accepts a sole Wikidata candidate even without a film-related P106 occupation (`resolvedVia: "name_search_unfiltered"`). This handles non-filmmaker EPs (businesspeople, philanthropists) who appear in TMDB credits. When multiple candidates exist without film occupations, resolution still fails (Tier 3) — see BOD-203 for future scored ranking.

### TMDB ID Stability

TMDB person IDs are not guaranteed stable — TMDB occasionally merges or renumbers entries (e.g., Roger Deakins moved from 5914 to 151). Live tests use hardcoded entity IDs for known-stable entries. If a live test fails with an unexpected name, verify the current TMDB ID via search before assuming a code bug. Movie and TV IDs are more stable but not immune.
