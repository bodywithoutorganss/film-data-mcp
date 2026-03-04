# film-data-mcp

## Quick Start

```bash
npm install
npm run build

TMDB_ACCESS_TOKEN=<your-token> node build/index.js

# Run tests
npm test

# Run integration tests (hits live Wikidata SPARQL)
npm run test:integration
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
    reference.ts         - Genres, watch providers, external ID lookup, collections, companies
    awards.ts            - Wikidata SPARQL awards tools (person, film, history, search)
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

## Tools (12 TMDB, 4 awards)

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
| get_person_awards | awards.ts | Award wins and nominations for a person (by TMDB ID) |
| get_film_awards | awards.ts | All awards a film has received (by TMDB movie ID) |
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

- `npm test` — unit tests (no network), 175 tests across 13 files
- `npm run test:integration` — integration tests (hits live Wikidata SPARQL endpoint)
- Live integration tests (`tests/integration/live-api.test.ts`) require `TMDB_ACCESS_TOKEN` env var
- Test files mirror source structure: `tests/tools/`, `tests/types/`, `tests/utils/`

### TMDB ID Stability

TMDB person IDs are not guaranteed stable — TMDB occasionally merges or renumbers entries (e.g., Roger Deakins moved from 5914 to 151). Live tests use hardcoded entity IDs for known-stable entries. If a live test fails with an unexpected name, verify the current TMDB ID via search before assuming a code bug. Movie and TV IDs are more stable but not immune.
