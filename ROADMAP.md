# Film Data MCP Roadmap

## Vision

A standalone MCP server that gives producers and filmmakers instant research capabilities: filmography browsing, thematic discovery, awards history, distribution intel, and talent pipeline mapping — all through structured tool calls backed by TMDB and Wikidata.

## Motivation

Film research is scattered across TMDB, IMDb, Wikipedia, JustWatch, and festival archives. No single API covers the full producer workflow: "Who made films like mine? Where did they premiere? What awards did they win? Who distributed them?" This MCP server consolidates that into a coherent toolset optimized for LLM-driven research.

## Milestones

### M1: Foundation + Wikidata Awards Layer
**Criteria:** Fork cleaned up, Wikidata SPARQL client with entity resolution (TMDB→IMDb→Wikidata), awards registry with verified QIDs for 21 ceremonies and 91 categories.
**Status:** Complete — Phases 1-2.

### M2: TMDB Tool Redesign
**Criteria:** Fork's 13 tools consolidated into 12 capability-based tools. `append_to_response` bundling, discover, watch providers, genres, external ID lookup, collections, companies/networks, curated lists.
**Status:** Complete — Phase 3.

### M3: Awards MCP Tools
**Criteria:** 4 Wikidata SPARQL tools: `get_person_awards`, `get_film_awards`, `get_award_history`, `search_awards`. Entity resolution with TMDB→IMDb fallback.
**Status:** Complete — Phase 4.

### M4: Integration Tests + Audit Fixes
**Criteria:** Full unit + live API test coverage. `buildToolDef()` utility (Zod→JSON Schema single source of truth). Dead code removed, all `any` types eliminated.
**Status:** Complete — Phases 5-6. v0.3.0 tagged.

### M5: Usability Fixes
**Criteria:** Credits top-N filtering, watch providers region filter, award history year-grouping, QID label cleanup. Post-release: tokenized `search_awards`, detail tool `region` param.
**Status:** Complete — v0.4.0 tagged. 221 tests across 13 files.

### M6: TMDB Discovery Tools
**Criteria:** `search_keywords` (wraps `GET /3/search/keyword`) and `company_filmography` (ergonomic `discover` wrapper with `with_companies`). Tool count 16 → 18. Cross-referencing tool descriptions updated.
**Status:** Complete — v0.5.0 tagged. 236 tests across 13 files.
- Design: `docs/plans/2026-03-04-m8-discovery-tools-design.md`
- Plan: `docs/plans/2026-03-04-m8-discovery-tools.md`

### M7: Awards Intelligence
**Criteria:** Awards completeness indicator (distinguish "entity found, 0 P166 claims" from "entity not found"). P1411 nomination cross-referencing to supplement empty P166 wins with nomination data from crew profiles.
**Status:** Complete — v0.6.0 tagged. 244 tests across 13 files (260 including skipped live tests).
- Design: `docs/plans/2026-03-04-m7-awards-intelligence-design.md`
- Plan: `docs/plans/2026-03-04-m7-awards-intelligence.md`

### M8: Discovery & Polish
**Criteria:** Festival premiere extraction (`get_festival_premieres` tool). Dedicated `get_credits` tool with department/job filtering and offset/limit pagination. Tool count 18 → 20.
**Status:** Complete — v0.7.0 tagged. 277 tests across 15 files (297 including skipped live tests).
- Design: `docs/plans/2026-03-04-m8-discovery-polish-design.md`
- Plan: `docs/plans/2026-03-04-m8-implementation.md`

### M9: Crew Resolution Improvements
**Criteria:** Name-based Wikidata fallback (wbsearchentities + P106 occupation filter). Expanded job filter (composers, cinematographers, editors, broad producer matching). Crew deduplication by TMDB person ID. `role` → `roles` response shape change.
**Status:** Complete — v0.8.0 tagged. 288 tests across 16 files (309 including skipped live + integration tests).
- Design: `~/Dropbox/CS/personal-marketplace/docs/plans/2026-03-04-crew-resolution-design.md`
- Plan: `~/Dropbox/CS/personal-marketplace/docs/plans/2026-03-04-crew-resolution-plan.md`

## Current Status

v0.8.0 released. M9 complete. 20 tools total (16 TMDB + 4 awards), 288 tests across 16 files.

## Time Tracking

| Milestone | Planned | Execution | Maintenance | Status |
|-----------|---------|-----------|-------------|--------|
| M1: Foundation + Wikidata | 3-4 sessions | 5 sessions | — | Complete |
| M2: TMDB Redesign | — | 4 sessions | — | Complete |
| M3: Awards Tools | — | 2 sessions | — | Complete |
| M4: Tests + Audit | — | 3 sessions | — | Complete |
| M5: Usability Fixes | 1 session | 1 session | 1 session | Complete |
| M6: Discovery Tools | 1 session | 2 sessions (design + plan, implementation) | — | Complete |
| M7: Awards Intelligence | 1 session | 1 session (design + plan + implementation) | — | Complete |
| M8: Discovery & Polish | 1 session | 1 session (design + plan + implementation) | — | Complete |
| M9: Crew Resolution | 1 session | 1 session (implementation) | — | Complete |

## Key Decisions

- TMDB has no awards API — Wikidata SPARQL fills this gap (CC0 license)
- Entity resolution: TMDB ID → IMDb ID → name search (with occupation filter) → error.
- Awards registry: curated verified QIDs, not dynamic SPARQL discovery (casual QID assumptions are wrong ~90% of the time)
- `buildToolDef()`: Zod schemas are single source of truth, auto-converted to JSON Schema for MCP
- Credits/watch provider overflow solved with filtering params, not separate tools
