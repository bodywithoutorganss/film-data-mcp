# Code Review Findings — 2026-03-08

Comprehensive codebase audit across three dimensions: core code & architecture, test suite & coverage, and project hygiene. Reviewed all 21 source files (3,074 lines), 27 test files (6,400 lines), ROADMAP, CLAUDE.md, design docs, and git state.

**Overall assessment:** The codebase is in strong shape for a 23-tool MCP server at v0.13.0. Architecture is consistent, security model is sound, test coverage is comprehensive, and internal documentation is thorough. No critical code issues found. External-facing docs (README, CONTRIBUTING, server.json) have drifted significantly since ~M5.

---

## Critical Issues

### Git Hygiene

**C1. `.DS_Store` tracked in git, not in `.gitignore`**
Git status shows `.DS_Store` as modified (previously committed). `.gitignore` has no `.DS_Store` entry.
**Fix:** Add `.DS_Store` to `.gitignore`, then `git rm --cached .DS_Store`.

**C2. `.serena/` not in `.gitignore`**
`.serena/project.yml` and `.serena/.DS_Store` could get committed. Tool-specific config shouldn't be in the repo.
**Fix:** Add `.serena/` to root `.gitignore`.

### External-Facing Docs

**C3. `README.md` severely outdated — misrepresents tool count and capabilities**
Says "14 TMDB Tools" (actual: 18), "21 ceremonies" (actual: 24), "91 categories" (actual: 101), "244 tests" (actual: 370+). Missing 5 tools entirely: `get_festival_premieres`, `get_credits`, `get_person_representation`, `get_financials`, `get_thanks_credits`. No mention of OMDb integration, representation, thanks credits, or financial data.
**Fix:** Rewrite README to match current state, or generate from CLAUDE.md.

**C4. `server.json` version frozen at `0.4.0`**
MCP server registry manifest declares `"version": "0.4.0"` in two places. Package is at `0.13.0`. Also missing `OMDB_API_KEY` in `environmentVariables`.
**Fix:** Update version to `0.13.0`, add `OMDB_API_KEY`.

**C5. `CONTRIBUTING.md` references non-existent file paths from original fork**
Title says "TMDB MCP Server". Clone URL references `tmdb-mcp-server.git`. Lines 79-81 reference `src/tools/movies.ts`, `src/tools/tv.ts`, `src/tools/people.ts` — none exist. No mention of Zod schemas or `buildToolDef()` pattern.
**Fix:** Rewrite or delete (this is a fork artifact).

### Test Suite

**C6. `financials.integration.test.ts` throws at module load when `TMDB_ACCESS_TOKEN` is missing**
Line 13: `new TMDBClient(tmdbToken!)` — the `!` assertion executes unconditionally. Other integration tests use `describe.skipIf(!TMDB_TOKEN)` and conditional client construction. This file breaks the integration runner even for unrelated tests.
**Fix:** Use the `describe.skipIf` + conditional construction pattern from `comp-films.integration.test.ts`.

**C7. `m16-thanks.integration.test.ts` also throws at module load**
Lines 8-9: `if (!token) throw new Error(...)` — aggressive fail-fast that doesn't match the graceful skip pattern used everywhere else.
**Fix:** Same as C6 — use `describe.skipIf`.

**C8. `bod203-resolution-analysis.integration.test.ts` also lacks skip guard**
Line 8: `const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN!` with no `describe.skipIf`. Same module-load crash behavior.
**Fix:** Same pattern.

**C9. `dispatch.test.ts` is in `tests/integration/` but runs with unit tests**
Named `dispatch.test.ts` (not `*.integration.test.ts`), so it matches unit test config. This is actually correct behavior (no network calls), but its placement in `tests/integration/` is misleading.
**Fix:** Move to `tests/tools/` or `tests/`.

---

## Important Issues

### Code Quality

**I1. Pervasive `any` types in TMDBClient return values**
*File: `src/utils/tmdb-client.ts`*

Five methods return `Promise<any>`: `getTrending()`, `getPersonDetails()`, `getMovieCredits()`, `getTVAggregateCredits()`. This cascades into handler files — `awards.ts` uses `(details as any).credits`, `credits.ts` accepts `any[]`, `thanks.ts` filters on `any[]`.

The types already exist in `tmdb.ts` (`TMDBCreditsResponse`, `TMDBCastMember`, `TMDBCrewMember`, `TMDBPersonDetails`, `TMDBTrendingItem`) but are never wired to client methods — they're dead exports.

**Fix:** Wire existing type interfaces to client return types. This is the single largest technical debt item.

**I2. TMDB error response parsing may throw on non-JSON error bodies**
*File: `src/utils/tmdb-client.ts`, lines 64-66*

`response.json()` will throw `SyntaxError` on HTML error pages (502 Bad Gateway, rate limit pages). User sees `SyntaxError: Unexpected token '<'` instead of a useful error.

**Fix:** Wrap error parsing:
```typescript
if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
        const error: TMDBError = await response.json();
        message = error.status_message;
    } catch { /* non-JSON error body */ }
    throw new Error(`TMDB API Error: ${message}`);
}
```

**I3. Dispatch map type signature doesn't match all handler signatures**
*File: `src/index.ts`, line 133*

Map typed as `Record<string, (args: unknown, client: TMDBClient) => Promise<string>>` but 6 handlers take different signatures (awards/representation take WikidataClient, financials takes OMDbClient). Closures make runtime correct, but intent is unclear — someone might refactor to use the passed `client` arg.

**Fix:** Add a comment noting closure-bound handlers ignore the second argument, or split the map.

**I4. `handleBatch` in `thanks.ts` makes sequential API calls**
*File: `src/tools/thanks.ts`, lines 142-143*

Sequential `for` loop when `Promise.all` would parallelize. `handleSearchKeywords` in `reference.ts` already uses `Promise.all` correctly.

**Fix:** Use `Promise.all` or `Promise.allSettled`.

**I5. `CuratedListsSchema` refinements not reflected in tool definition**
*File: `src/tools/browse.ts`, lines 42-54*

`.refine()` produces `ZodEffects` which `buildToolDef` can't convert to JSON Schema. LLM callers won't see constraints like "airing_today only for TV". Same in `credits.ts` and `thanks.ts`.

**Fix:** Add constraint notes to field-level `.describe()` strings.

### Test Quality

**I6. Missing error propagation tests across most handlers**
Only `financials.test.ts` has a "propagates TMDB errors" test. Missing from: `search`, `browse`, `discover`, `credits`, `premieres`, `reference`. Handlers let errors propagate (correct), but no tests confirm this.

**Fix:** Add one error propagation test per handler file.

**I7. `tmdb-client.test.ts` directly assigns `global.fetch` without cleanup**
*File: `tests/utils/tmdb-client.test.ts`, line 28*

`global.fetch = fetchMock` pollutes global namespace. Compare with `tmdb-client-credits.test.ts` which correctly uses `vi.stubGlobal("fetch", fetchSpy)` with `vi.unstubAllGlobals()` in `afterEach`.

**Fix:** Use `vi.stubGlobal`/`vi.unstubAllGlobals` pattern.

**I8. `bod203-resolution-analysis.integration.test.ts` is an analysis script disguised as a test**
378 lines, custom SPARQL queries, 5-minute timeout. Only assertion: `expect(analyses.length).toBe(FILMS.length)` — effectively always-green.

**Fix:** Move to `scripts/` or add clear comment that it's a research harness, not a regression test.

**I9. `comp-films.integration.test.ts` uses `console.warn` for data gaps without assertions**
Lines 164-168, 188-194, 214-225: Known data gaps trigger `console.warn` but tests pass regardless. Per CLAUDE.md, test output must be pristine.

**Fix:** Either remove warns (rely on CLAUDE.md data gap docs) or assert on the warning behavior.

**I10. No schema tests for `GetPersonRepresentationSchema`**
Every other tool has Zod schema validation tests. `representation.test.ts` only tests the handler.

**Fix:** Add schema validation tests (missing person_id, non-positive ID, optional name).

### Documentation

**I11. `.env.example` missing `OMDB_API_KEY`**
Only lists `TMDB_ACCESS_TOKEN`, `NODE_ENV`, `PORT`, `MCP_TRANSPORT`. Missing `OMDB_API_KEY`. `PORT` and `MCP_TRANSPORT` don't appear to be used (server uses stdio only).
**Fix:** Add `OMDB_API_KEY`, remove unused vars.

**I12. Multiple orphaned design docs not referenced from ROADMAP.md**
Tracked docs with no ROADMAP artifact references:
- `docs/plans/2026-03-04-phase5-integration-tests-design.md` (M4)
- `docs/plans/2026-03-04-phase5-integration-tests.md` (M4)
- `docs/plans/2026-03-04-phase6-audit-fixes-design.md` (M4)
- `docs/plans/2026-03-04-phase6-audit-fixes.md` (M4)
- `docs/plans/2026-03-04-m7-usability-fixes-design.md` (M5)
- `docs/plans/2026-03-04-m7-usability-fixes.md` (M5)
- `docs/plans/2026-03-07-bod199-tiered-resolution-design.md` (BOD-199)
- `docs/plans/2026-03-07-bod199-tiered-resolution.md` (BOD-199)
- `docs/plans/2026-03-07-bod-198-resolved-crew-enrichment-design.md` (BOD-198)
- `docs/plans/2026-03-07-bod-198-implementation.md` (BOD-198)
- `docs/plans/m16-tmdb-research-output.txt` (M16)
Per CLAUDE.md traceability rules, completed milestones should reference their artifacts.

**I13. ROADMAP M9 references design docs in a different repo**
Lines 54-55 point to `~/Dropbox/CS/personal-marketplace/docs/plans/...` — a completely different repo.

**Fix:** Copy docs into this repo's `docs/plans/` or add a note explaining the cross-repo reference.

**I14. ROADMAP M12 and M15 have conflicting tool numbers**
Both claim to be tool #21. Actual order: representation=#21, financials=#22, thanks=#23.
**Fix:** Remove ordinal tool numbers from milestone entries (they're fragile) or correct them.

**I15. `producer-research.mjs` ABOUTME says "all 20 tools" — stale**
Line 2 and line 484 say "20 tools". There are 23, and the script only uses 12.
**Fix:** Update to "Exercises 12 of the MCP tools..."

**I16. CLAUDE.md Scripts section missing `m16-thanks-research.mjs`**
4 scripts exist in `scripts/` but only 3 documented.
**Fix:** Add the missing entry.

---

## Minor / Observations

| # | Finding | Location |
|---|---------|----------|
| S1 | `filterWatchProviders` exported from `details.ts`, imported by `reference.ts` — cross-tool dependency. Better in `utils/`. | `src/tools/details.ts` → `reference.ts` |
| S2 | `resolvePerson` exported from `awards.ts`, imported by `representation.ts` — entity resolution concern in awards file. | `src/tools/awards.ts` → `representation.ts` |
| S3 | Peabody ceremony and category share same QID (Q838121). Correct but doesn't generalize. | `src/types/awards-registry.ts` |
| S4 | `wikidata.test.ts` tests type conformance at runtime — types are erased, so tests verify object shape already checked at compile time. | `tests/types/wikidata.test.ts` |
| S5 | No `searchByType` page forwarding test in `search.test.ts`. | `tests/tools/search.test.ts` |
| S6 | Missing Zod handler-level rejection tests in 7 files (only `search.test.ts` has one). | Multiple test files |
| S7 | No TMDBClient unit tests for error responses (non-200 status codes). | `tests/utils/tmdb-client.test.ts` |
| S8 | No top-level README.md. `package.json` includes it in `files` array. | Root |
| S9 | M19 research doc doesn't back-reference consuming milestones (M21-M25). | `docs/plans/2026-03-08-m19-fellowship-labs-research.md` |
| S10 | MEMORY.md says BOD-215 is Backlog but ROADMAP says Done. | `MEMORY.md` vs `ROADMAP.md` |
| S11 | Vitest integration config ABOUTME says "Wikidata SPARQL endpoint" — too narrow (also hits TMDB, OMDb). | `vitest.integration.config.ts` |
| S12 | `CollectionPart` and `WatchProviderRegionResult` exported but only used in parent type definitions. | `src/types/tmdb-extended.ts` |

---

## Positive Highlights

- **ABOUTME compliance: 100%** — All 48 TypeScript files and 4 scripts have correct 2-line ABOUTME headers
- **Tool pattern consistency: perfect** — All 11 tool files follow the Zod schema → `buildToolDef()` → handler pattern with zero exceptions
- **SPARQL injection prevention: thorough** — Every public method validates inputs before SPARQL interpolation (`/^Q\d+$/`, `/^P\d+$/`, `/^\d+$/`, `/^(tt|nm|co)\d+$/`)
- **Dispatch map: verified complete** — 23 entries match 23 tool definitions, backed by structural test
- **Awards registry: well-designed** — Qualifier pattern extensible, integrity tests enforce referential consistency
- **Mock discipline: excellent** — All handler tests mock at the API client boundary (network calls), not internal logic. Zero violations of the "never test mocked behavior" rule
- **Integration test isolation: good** — `describe.skipIf` pattern (except C3/C4), appropriate timeouts, live API usage

---

## Priority Matrix

| Priority | Items | Effort |
|----------|-------|--------|
| Quick wins (< 15 min each) | C1, C2, C4, C6-C9, I15, I16, S10, S11 | ~2h total |
| Medium effort (30-60 min each) | I2, I4, I7, I10, I11 | ~3h total |
| External docs rewrite | C3, C5 (README, CONTRIBUTING) | ~1.5h total |
| Larger effort (1-2h each) | I1 (wire TMDB types), I6 (error propagation tests) | ~3h total |
| Documentation only | I3, I5, I12, I13, I14, S8, S9 | ~1.5h total |
| Won't fix / low value | S1, S2, S3, S4, S5, S6, S7, S12, I8, I9 | — |
