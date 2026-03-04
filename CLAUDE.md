# film-data-mcp

## Quick Start

```bash
npm install
npm run build

# Run with stdio transport (default)
TMDB_ACCESS_TOKEN=<your-token> node build/index.js

# Run with HTTP transport
TMDB_ACCESS_TOKEN=<your-token> MCP_TRANSPORT=http PORT=3000 node build/index.js

# Run tests
npm test

# Run integration tests (hits live Wikidata SPARQL)
npm run test:integration
```

## Architecture

```
src/
  index.ts               - Server entry point, tool routing
  tools/
    movies.ts            - TMDB movie tools (6 tools)
    tv.ts                - TMDB TV tools (5 tools)
    people.ts            - TMDB people tools (2 tools)
    awards.ts            - Wikidata awards tools (4 tools)
  types/
    tmdb.ts              - TMDB response types
    wikidata.ts          - Wikidata/SPARQL response types
    awards-registry.ts   - Verified ceremony and award category QIDs
  utils/
    tmdb-client.ts       - TMDB API client
    wikidata-client.ts   - Wikidata SPARQL client + entity resolution
```

## Tool Pattern

Every tool file exports three things per tool:
1. A Zod schema: `{ToolName}Schema`
2. A tool definition object: `{toolName}Tool` (name, description, inputSchema)
3. A handler: `handle{ToolName}(args, client): Promise<string>`

Handlers return `JSON.stringify(result, null, 2)`. All tool output is `text` content.

## Data Sources

- **TMDB**: Crew/cast credits. Requires `TMDB_ACCESS_TOKEN` env var.
- **Wikidata SPARQL**: Awards data. No auth required. Live queries to `https://query.wikidata.org/sparql`.

## Awards Registry

`src/types/awards-registry.ts` contains verified Wikidata QIDs for ceremonies, festivals, fellowships, labs, and grants. Every QID was verified via SPARQL. Do not add QIDs without verification.

## Testing

- `npm test` — unit tests (no network)
- `npm run test:integration` — integration tests (hits live Wikidata SPARQL endpoint)
