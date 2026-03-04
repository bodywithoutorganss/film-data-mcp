# Phase 6: Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix technical debt — eliminate Zod/JSON Schema duplication, remove dead HTTP transport, fix `any` types, update dependencies.

**Architecture:** Introduce a `buildToolDef()` utility that derives MCP-compatible JSON Schema from Zod schemas via `toJSONSchema()`. Strip dead HTTP transport code and the `express` dependency. All 16 tool definitions become one-liners. Two `any` types get proper typing.

**Tech Stack:** TypeScript, Zod 4 (`toJSONSchema`), MCP SDK, Vitest

---

### Task 1: Update dependencies

**Files:**
- Modify: `package.json`

**Step 1: Update production and dev dependencies**

```bash
cd ~/Dropbox/CS/film-data-mcp
npm install @modelcontextprotocol/sdk@latest zod@latest dotenv@latest --save
npm install @types/node@^20 prettier@latest --save-dev
```

**Step 2: Run tests to verify no breakage**

Run: `npm test`
Expected: 172 tests pass. If any fail, fix before proceeding — isolate dep breakage from code changes.

**Step 3: Run build to verify compilation**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Update dependencies: MCP SDK, Zod, dotenv, @types/node, prettier"
```

---

### Task 2: Remove HTTP transport and express

**Files:**
- Modify: `src/index.ts` (lines 22-23 imports, lines 177-235 `startHttpServer()`, lines 238-258 `main()`)
- Modify: `package.json` (remove express, @types/express)
- Modify: `CLAUDE.md` (remove HTTP transport references)
- Modify: `README.md` (remove HTTP transport references)

**Step 1: Remove express and @types/express**

```bash
cd ~/Dropbox/CS/film-data-mcp
npm uninstall express @types/express
```

**Step 2: Modify `src/index.ts`**

Remove these imports (lines 22-23):
```ts
import { randomUUID } from "crypto";
import express from "express";
```

Remove the `StreamableHTTPServerTransport` import (line 26):
```ts
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
```

Delete `startHttpServer()` function entirely (lines 177-235).

Replace `main()` (lines 238-258) with:

```ts
async function main() {
    console.error("=".repeat(50));
    console.error("Film Data MCP");
    console.error("=".repeat(50));

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Ready for Claude Code connection (stdio)");
}
```

This also inlines `startStdioServer()` since it's now the only path — delete
the separate `startStdioServer()` function (lines 166-175).

Update the file-level block comment (lines 18-20) to remove HTTP transport
references:
```ts
/**
 * Film Data MCP Server
 * Provides access to The Movie Database (TMDB) API through Model Context Protocol
 *
 * 12 TMDB tools: search, movie_details, tv_details, person_details,
 * discover, trending, curated_lists, genres, watch_providers,
 * find_by_external_id, collection_details, company_details
 *
 * 4 Wikidata awards tools: get_person_awards, get_film_awards,
 * get_award_history, search_awards
 */
```

**Step 3: Update CLAUDE.md**

In the Quick Start section, remove:
```
# Run with HTTP transport
TMDB_ACCESS_TOKEN=<your-token> MCP_TRANSPORT=http PORT=3000 node build/index.js
```

In the Quick Start section, remove or simplify the stdio transport comment to
just:
```bash
TMDB_ACCESS_TOKEN=<your-token> node build/index.js
```

**Step 4: Update README.md**

Same changes as CLAUDE.md — remove HTTP transport references from usage section.

**Step 5: Build and test**

Run: `npm run build && npm test`
Expected: Clean build, 172 tests pass.

**Step 6: Commit**

```bash
git add -A  # safe here since we just did npm uninstall + known file edits
git commit -m "Remove dead HTTP transport and express dependency"
```

---

### Task 3: Add `buildToolDef()` utility

**Files:**
- Create: `src/utils/tool-helpers.ts`
- Create: `tests/utils/tool-helpers.test.ts`

**Step 1: Write the failing test**

```ts
// tests/utils/tool-helpers.test.ts
// ABOUTME: Tests for the buildToolDef utility that derives JSON Schema from Zod schemas.
// ABOUTME: Verifies MCP-compatible output format and correct field mapping.

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildToolDef } from "../../src/utils/tool-helpers.js";

describe("buildToolDef", () => {
  it("produces MCP-compatible tool definition from Zod schema", () => {
    const schema = z.object({
      query: z.string().describe("Search text"),
      page: z.number().int().positive().optional().describe("Page number"),
    });

    const tool = buildToolDef("test_tool", "A test tool", schema);

    expect(tool.name).toBe("test_tool");
    expect(tool.description).toBe("A test tool");
    expect(tool.inputSchema.type).toBe("object");
    expect(tool.inputSchema.properties.query).toEqual({
      description: "Search text",
      type: "string",
    });
    expect(tool.inputSchema.properties.page).toBeDefined();
    expect(tool.inputSchema.required).toEqual(["query"]);
  });

  it("strips $schema and additionalProperties from output", () => {
    const schema = z.object({ id: z.number() });
    const tool = buildToolDef("t", "d", schema);

    expect(tool.inputSchema).not.toHaveProperty("$schema");
    expect(tool.inputSchema).not.toHaveProperty("additionalProperties");
  });

  it("preserves enum values", () => {
    const schema = z.object({
      type: z.enum(["movie", "tv"]).describe("Media type"),
    });
    const tool = buildToolDef("t", "d", schema);

    expect(tool.inputSchema.properties.type.enum).toEqual(["movie", "tv"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/tool-helpers.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

```ts
// src/utils/tool-helpers.ts
// ABOUTME: Utility to build MCP tool definitions from Zod schemas.
// ABOUTME: Single source of truth — eliminates hand-written JSON Schema duplication.

import { z, toJSONSchema } from "zod";

export function buildToolDef(
  name: string,
  description: string,
  schema: z.ZodObject<z.ZodRawShape>
) {
  const jsonSchema = toJSONSchema(schema);
  const {
    $schema: _$schema,
    additionalProperties: _additionalProperties,
    ...inputSchema
  } = jsonSchema as Record<string, unknown>;
  return { name, description, inputSchema };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/tool-helpers.test.ts`
Expected: 3 tests pass.

**Step 5: Commit**

```bash
git add src/utils/tool-helpers.ts tests/utils/tool-helpers.test.ts
git commit -m "Add buildToolDef utility to derive JSON Schema from Zod"
```

---

### Task 4: Convert search.ts to use buildToolDef

**Files:**
- Modify: `src/tools/search.ts` (lines 16-33: replace tool definition)

**Step 1: Replace the hand-written tool definition**

Replace lines 16-33 (`export const searchTool = { ... };`) with:

```ts
import { buildToolDef } from "../utils/tool-helpers.js";

export const searchTool = buildToolDef(
  "search",
  "Search TMDB for movies, TV shows, people, and companies. Use without a type for multi-search across all categories, or specify a type to narrow results.",
  SearchSchema
);
```

Also add the `buildToolDef` import at the top of the file (after the existing
Zod import).

**Step 2: Run tests**

Run: `npx vitest run tests/tools/search`
Expected: All search tests pass.

**Step 3: Commit**

```bash
git add src/tools/search.ts
git commit -m "Convert search tool to use buildToolDef"
```

---

### Task 5: Convert details.ts to use buildToolDef (3 tools)

**Files:**
- Modify: `src/tools/details.ts` (3 tool definitions: movieDetailsTool, tvDetailsTool, personDetailsTool)

**Step 1: Add import and replace all 3 tool definitions**

Add `buildToolDef` import. Replace each tool's hand-written `inputSchema` block
with a `buildToolDef()` call. Keep the existing description strings.

Three tools:
- `movieDetailsTool` (lines 19-59) → `buildToolDef("movie_details", "...", MovieDetailsSchema)`
- `tvDetailsTool` (lines 61-101) → `buildToolDef("tv_details", "...", TVDetailsSchema)`
- `personDetailsTool` (lines 103-129) → `buildToolDef("person_details", "...", PersonDetailsSchema)`

**Step 2: Run tests**

Run: `npx vitest run tests/tools/details`
Expected: All details tests pass.

**Step 3: Commit**

```bash
git add src/tools/details.ts
git commit -m "Convert details tools to use buildToolDef"
```

---

### Task 6: Convert discover.ts to use buildToolDef

**Files:**
- Modify: `src/tools/discover.ts` (lines 69-112: replace tool definition)

**Step 1: Add import and replace tool definition**

This is the file with the 4 missing JSON Schema fields. After conversion, the
derived schema will automatically include all Zod fields.

Replace `discoverTool` definition with:
```ts
export const discoverTool = buildToolDef(
  "discover",
  "Discover movies or TV shows with 30+ filters. Combine genres, release dates, vote averages, cast/crew, companies, keywords, watch providers, certifications, and more. Use the genres tool first to get genre IDs for filtering.",
  DiscoverSchema
);
```

**Step 2: Verify the 4 missing fields are now present**

Run a quick check:
```bash
node -e "
import('./src/tools/discover.js').then(m => {
  const props = Object.keys(m.discoverTool.inputSchema.properties);
  for (const f of ['with_origin_country','without_companies','without_keywords','without_watch_providers']) {
    console.log(f, props.includes(f) ? 'PRESENT' : 'MISSING');
  }
})"
```
Expected: All 4 show PRESENT.

**Step 3: Run tests**

Run: `npx vitest run tests/tools/discover`
Expected: All discover tests pass.

**Step 4: Commit**

```bash
git add src/tools/discover.ts
git commit -m "Convert discover tool to use buildToolDef (fixes 4 missing schema fields)"
```

---

### Task 7: Convert browse.ts to use buildToolDef (2 tools)

**Files:**
- Modify: `src/tools/browse.ts` (2 tool definitions: trendingTool, curatedListsTool)

**Step 1: Add import and replace both tool definitions**

- `trendingTool` (lines 15-52) → `buildToolDef("trending", "...", TrendingSchema)`
- `curatedListsTool` (lines 55-99) → `buildToolDef("curated_lists", "...", CuratedListsSchema)`

**Step 2: Run tests**

Run: `npx vitest run tests/tools/browse`
Expected: All browse tests pass.

**Step 3: Commit**

```bash
git add src/tools/browse.ts
git commit -m "Convert browse tools to use buildToolDef"
```

---

### Task 8: Convert reference.ts to use buildToolDef (5 tools)

**Files:**
- Modify: `src/tools/reference.ts` (5 tool definitions)

**Step 1: Add import and replace all 5 tool definitions**

- `genresTool` (lines 13-39) → `buildToolDef("genres", "...", GenresSchema)`
- `watchProvidersTool` (lines 41-79) → `buildToolDef("watch_providers", "...", WatchProvidersSchema)`
- `findByExternalIdTool` (lines 81-111) → `buildToolDef("find_by_external_id", "...", FindByExternalIdSchema)`
- `collectionDetailsTool` (lines 113-139) → `buildToolDef("collection_details", "...", CollectionDetailsSchema)`
- `companyDetailsTool` (lines 141-163) → `buildToolDef("company_details", "...", CompanyDetailsSchema)`

**Step 2: Run tests**

Run: `npx vitest run tests/tools/reference`
Expected: All reference tests pass.

**Step 3: Commit**

```bash
git add src/tools/reference.ts
git commit -m "Convert reference tools to use buildToolDef"
```

---

### Task 9: Convert awards.ts to use buildToolDef (4 tools)

**Files:**
- Modify: `src/tools/awards.ts` (4 tool definitions)

**Step 1: Add import and replace all 4 tool definitions**

- `getPersonAwardsTool` (lines 56-68) → `buildToolDef("get_person_awards", "...", GetPersonAwardsSchema)`
- `getFilmAwardsTool` (lines 89-104) → `buildToolDef("get_film_awards", "...", GetFilmAwardsSchema)`
- `getAwardHistoryTool` (lines 119-137) → `buildToolDef("get_award_history", "...", GetAwardHistorySchema)`
- `searchAwardsTool` (lines 151-168) → `buildToolDef("search_awards", "...", SearchAwardsSchema)`

**Step 2: Run tests**

Run: `npx vitest run tests/tools/awards`
Expected: All awards tests pass.

**Step 3: Commit**

```bash
git add src/tools/awards.ts
git commit -m "Convert awards tools to use buildToolDef"
```

---

### Task 10: Fix `any` types

**Files:**
- Modify: `src/types/tmdb.ts` (line 174)
- Modify: `src/index.ts` (line 119)

**Step 1: Remove index signature from TMDBTrendingItem**

In `src/types/tmdb.ts`, delete line 174:
```ts
    [key: string]: any;
```
And the comment on line 173 (`// Additional dynamic fields`).

Note: `TMDBTrendingItem` is currently unused (not imported anywhere), so this
is a safe change. The optional fields (`title?`, `name?`,
`known_for_department?`) already cover the type variants.

**Step 2: Fix handler dispatch map type in index.ts**

In `src/index.ts`, change line 119 from:
```ts
        const handlers: Record<string, (args: any, client: TMDBClient) => Promise<string>> = {
```
to:
```ts
        const handlers: Record<string, (args: unknown, client: TMDBClient) => Promise<string>> = {
```

**Step 3: Build and test**

Run: `npm run build && npm test`
Expected: Clean build, 172 tests pass.

**Step 4: Verify no `any` remains in source**

Run: `grep -rn ': any' src/ --include='*.ts'`
Expected: No matches.

**Step 5: Commit**

```bash
git add src/types/tmdb.ts src/index.ts
git commit -m "Replace any types with proper typing"
```

---

### Task 11: Update docs and verify

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Update CLAUDE.md**

- Remove HTTP transport from Quick Start section
- Update tool count in the architecture description if needed
- Update test counts to reflect any new tests

**Step 2: Update README.md**

- Remove HTTP transport from usage section
- Simplify startup to just stdio

**Step 3: Run full test suite one final time**

Run: `npm run build && npm test`
Expected: All tests pass. Clean build.

**Step 4: Verify no `any` types remain**

Run: `grep -rn ': any' src/ --include='*.ts'`
Expected: No matches (the `z.ZodObject<z.ZodRawShape>` in tool-helpers.ts
uses a Zod generic, not a bare `any`).

**Step 5: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "Update docs: remove HTTP transport references, reflect Phase 6 changes"
```

---

### Task 12: Tag release

**Step 1: Tag v0.3.0**

```bash
git tag v0.3.0
git push origin master --tags
```
