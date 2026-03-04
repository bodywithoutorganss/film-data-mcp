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
**Status:** Designed and planned. Implementation plan ready (6 TDD tasks). Will tag v0.5.0.
- Design: `docs/plans/2026-03-04-m8-discovery-tools-design.md`
- Plan: `docs/plans/2026-03-04-m8-discovery-tools.md`

### M7: Awards Intelligence
**Criteria:** Awards completeness indicator (distinguish "entity found, 0 P166 claims" from "entity not found"). P1411 nomination cross-referencing to supplement empty P166 wins with nomination data from crew profiles.
**Status:** Not started. Estimate: 6-8 tasks.

### M8: Discovery & Polish
**Criteria:** Festival premiere extraction (`release_dates` append, type 1 = Premiere). Dedicated `credits` tool with pagination and role filtering. Awards registry gaps (Critics Choice, Gotham, Emmy Outstanding Limited Series, TIFF Platform Prize). Fellowships/labs/grants data.
**Status:** Not started. Estimate: 6-8 tasks.

## Current Status

v0.4.0 released. M6 designed and planned, ready for implementation. 18 tools total after M6 (12 TMDB + 4 awards + 2 discovery).

## Time Tracking

| Milestone | Planned | Execution | Maintenance | Status |
|-----------|---------|-----------|-------------|--------|
| M1: Foundation + Wikidata | 3-4 sessions | 5 sessions | — | Complete |
| M2: TMDB Redesign | — | 4 sessions | — | Complete |
| M3: Awards Tools | — | 2 sessions | — | Complete |
| M4: Tests + Audit | — | 3 sessions | — | Complete |
| M5: Usability Fixes | 1 session | 1 session | 1 session | Complete |
| M6: Discovery Tools | 1 session | 1 session (design + plan) | — | Planned |
| M7: Awards Intelligence | TBD | — | — | Not started |
| M8: Discovery & Polish | TBD | — | — | Not started |

## Key Decisions

- TMDB has no awards API — Wikidata SPARQL fills this gap (CC0 license)
- Entity resolution: TMDB ID → IMDb ID fallback → error. No fuzzy matching.
- Awards registry: curated verified QIDs, not dynamic SPARQL discovery (casual QID assumptions are wrong ~90% of the time)
- `buildToolDef()`: Zod schemas are single source of truth, auto-converted to JSON Schema for MCP
- Credits/watch provider overflow solved with filtering params, not separate tools
