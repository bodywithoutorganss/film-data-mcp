# Phase 6: Audit Fixes Design

## Goal

Fix technical debt identified during code review: eliminate Zod/JSON Schema
duplication, remove dead HTTP transport code, fix `any` types, and update
dependencies.

## Problem

Four issues accumulated during the rapid Phase 3-5 development:

1. **Zod/JSON Schema duplication** — Every tool maintains both a Zod schema
   (used for runtime validation) and a hand-written JSON Schema object (used
   for MCP tool registration). These can drift, and have: the discover tool's
   JSON Schema is missing 4 fields that exist in its Zod schema
   (`with_origin_country`, `without_companies`, `without_keywords`,
   `without_watch_providers`).

2. **Dead HTTP transport** — The forked `startHttpServer()` creates a new
   `StreamableHTTPServerTransport` per request without connecting it to the MCP
   `Server`. It returns errors on every request. Since this server is only used
   with Claude Code (stdio), the HTTP path is dead code carrying an `express`
   dependency.

3. **`any` types** — Two remaining `any` usages:
   - `TMDBSearchResult` index signature `[key: string]: any` (unnecessary —
     optional fields already cover the union cases)
   - Handler dispatch map `Record<string, (args: any, ...) => ...>` (should be
     `unknown`)

4. **Outdated dependencies** — MCP SDK 1.19.1 → 1.27.1, Zod 4.1.11 → 4.3.6,
   plus minor bumps to dotenv, @types/node, prettier.

## Design

### 1. Remove HTTP transport and express

Delete `startHttpServer()`, the express/randomUUID imports, and the
transport-mode branching in `main()`. `main()` calls `startStdioServer()`
directly. Remove `express` and `@types/express` from `package.json`. Remove
`MCP_TRANSPORT` references from CLAUDE.md and README.md.

### 2. Derive JSON Schema from Zod (single source of truth)

Add a shared utility:

```ts
// src/utils/tool-helpers.ts
import { z, toJSONSchema } from "zod";

export function buildToolDef(name: string, description: string, schema: z.ZodObject<any>) {
  const jsonSchema = toJSONSchema(schema);
  const { $schema, additionalProperties, ...inputSchema } = jsonSchema;
  return { name, description, inputSchema };
}
```

Each tool file replaces its hand-written `inputSchema` block:

```ts
// Before: 15-35 lines of hand-written JSON Schema
export const searchTool = {
  name: "search",
  description: "Search TMDB...",
  inputSchema: { type: "object" as const, properties: { ... }, required: [...] },
};

// After: 1 line
export const searchTool = buildToolDef("search", "Search TMDB...", SearchSchema);
```

~215 lines of hand-maintained JSON Schema across 6 files replaced by 16
one-liners. Fixes the discover tool's 4 missing fields automatically.

### 3. Fix `any` types

- `TMDBSearchResult`: remove `[key: string]: any` index signature. The
  optional fields (`title?`, `name?`, `known_for_department?`) already cover
  the type union.
- Handler dispatch map in `index.ts`: change `args: any` to `args: unknown`.
  Each handler calls `Schema.parse(args)` internally, so `unknown` is correct.

### 4. Update dependencies

Production:
- `@modelcontextprotocol/sdk`: 1.19.1 → ^1.27.1
- `zod`: 4.1.11 → ^4.3.6
- `dotenv`: 17.2.3 → ^17.3.1
- Remove `express`

Dev:
- Remove `@types/express`
- `@types/node`: 20.19.19 → ^20.19.35 (stay on major 20)
- `prettier`: 3.6.2 → ^3.8.1

Update deps first and run tests before any code changes to isolate breakage.

## Ordering

1. Update dependencies + run tests (isolate dep breakage)
2. Remove HTTP transport + express (simplify before refactoring)
3. Add `buildToolDef()` utility
4. Convert tool files one at a time (test after each)
5. Fix `any` types
6. Update CLAUDE.md and README.md
