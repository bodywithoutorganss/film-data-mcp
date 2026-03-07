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

### M10: Tooling Review & Hardening
**Criteria:** Audit all 20 tools for name-based resolution gaps (e.g., `get_person_awards` lacks name fallback). Limitation review of current tooling — document known gaps, data quality issues, and edge cases across TMDB and Wikidata integrations. Produce actionable findings with fixes or design decisions. Includes testing award tools (`get_film_awards`, `get_person_awards`, `search_awards`, `get_award_history`) against BreakFall comp films where awards returned empty despite known wins (Minding the Gap, Boys State, Dick Johnson Is Dead, etc.) — verify whether M7 crew cross-referencing (P1411) recovers data that direct P166 queries miss.
**Status:** Complete — v0.9.0 tagged. 288 unit tests across 16 files + 16 integration tests. Key finding: P1411 crew cross-referencing is the primary value channel for documentary awards — direct P166 queries return 0 for most docs, but crew cross-refs recover nominations via personal Wikidata profiles.
- Design: `docs/plans/2026-03-07-m10-tooling-review-design.md`
- Plan: `docs/plans/2026-03-07-m10-implementation.md`

### M11: Batch Keyword Discovery
**Criteria:** Multi-keyword lookup capability — accept a list of keyword strings and return all TMDB keyword IDs in one operation. Either a new `batch_search_keywords` tool or an enhancement to the existing `search_keywords` tool. Addresses the current limitation where thematic discovery requires sequential single-keyword lookups before feeding IDs into `discover`.
**Status:** Complete — `search_keywords` query field now accepts `string | string[]`. Array input triggers parallel TMDB calls, returns results keyed by query term.
- Design: `docs/plans/2026-03-07-m11-m14-design.md`
- Plan: `docs/plans/2026-03-07-m11-m14-implementation.md`

### M12: Box Office & Financial Data
**Criteria:** Supplementary financial data for documentaries beyond TMDB's revenue field (which returns $0 for most docs). Investigate Wikidata P2142 (box office) coverage for documentary films. If insufficient, evaluate external sources (The Numbers, Box Office Mojo). Goal: a tool or data layer that can answer "how did comparable docs perform financially?" including festival sales, streaming deal values, and theatrical gross.
**Status:** Planned.

### M13: Awards Registry Expansion
**Criteria:** Expand awards registry with new ceremonies and data categories. Ceremonies: Critics Choice Awards (significant Oscar precursor), Gotham Awards (significant for indie film), Emmy Outstanding Limited Series, TIFF Platform Prize. Data layer: fellowships, labs, and grants — Guggenheim, Sundance Fellows/Labs, Film Independent Labs, TIFF Talent Lab, NEA, Sundance Documentary Fund, ITVS, Catapult Film Fund, Ford Foundation/JustFilms. Schema already supports `ceremony_type: "fellowship" | "lab" | "grant"` — requires verified QIDs and data population, not architecture changes.
**Status:** Planned.

### M14: Person Awards Name Fallback
**Criteria:** Add name-based Wikidata resolution to `get_person_awards`, matching the fallback chain already implemented in `get_film_awards` and crew resolution (M9). Currently `get_person_awards` only accepts a TMDB person ID with no name fallback — users must know the TMDB ID to query awards.
**Status:** Complete — optional `name` field added to schema, passed to `resolvePerson` for TMDB→IMDb→name fallback.
- Design: `docs/plans/2026-03-07-m11-m14-design.md`
- Plan: `docs/plans/2026-03-07-m11-m14-implementation.md`

### M15: Representation & Talent Data
**Criteria:** Research and implement talent representation data — publicists, agents, managers, and agency affiliations. No known API currently covers this; milestone begins with research into potential data sources (TMDB credits metadata, IMDbPro, industry databases, Wikidata P agent/P management company properties). Produce findings report before committing to implementation approach.
**Status:** Research needed.

### M16: Special Thanks & Acknowledgment Credits
**Criteria:** Surface "Thanks" and "Special Thanks" credit data from TMDB (sparse but present in some entries) and investigate Wikidata coverage. Useful for mapping informal collaboration networks and influence relationships in documentary production. Research phase to assess data quality before building tools.
**Status:** Research needed.

### M17: Skills & Command Workflows
**Criteria:** Design and build Claude Code skills and slash commands that compose film-data-mcp tools into producer workflows. Examples: comp sheet generation (search → details → awards → synthesis), filmmaker career mapping (person → credits → collaborator network), distribution pathway analysis (festival premieres → watch providers → financial data). Requires extensive design iteration — the tool surface is mature enough (20 tools) but the workflow layer that chains them for real production tasks doesn't exist yet.
**Status:** Design needed.

### M19: Philanthropic & Financial Intelligence (Separate MCP)
**Criteria:** Design and build a standalone MCP server (part of the personal knowledge marketplace) that maps individuals and institutions to philanthropic and financial records. Core capabilities: 990 tax filing lookups (ProPublica Nonprofit Explorer API, GuideStar), family foundation identification and grant history, giving partnership memberships (Impact Partners, Sundance Catalyst, Chicken & Egg, etc.), board seat mapping across nonprofits and cultural institutions, and donor network graph construction. Separate from film-data-mcp — composes with it for funder research workflows. Individual profiles (wealth source, philanthropic focus, board seats) and institutional profiles (grant areas, 990 data, leadership) are distinct concerns requiring different data sources and schemas. Extensive design needed before implementation: data source evaluation, entity resolution strategy (name matching across 990s, board listings, and film credits), privacy/ethical boundaries, and API availability assessment.
**Status:** Design needed.

### M18: Impact Campaign Data
**Criteria:** Research and design a structured data layer for documentary impact campaigns. Categories to model (requires careful design iteration): mission/theory of change, KPIs (screenings, policy meetings, media mentions, audience reach, legislative action), campaign timeline phases (pre-release grassroots, festival window, theatrical/streaming, long-tail educational), partners (NGOs, advocacy orgs, educational institutions), personnel (impact producers, outreach coordinators), case studies (measurable outcomes from comparable docs — e.g., Blackfish → SeaWorld policy, An Inconvenient Truth → climate legislation), political context (intersecting legislation, public debate, cultural moment), impact-specific funding (Ford Foundation, Catapult, Perspective Fund — distinct from production funding), community screening/educational distribution strategy, and measurement methodology (pre/post surveys, policy tracking, media analysis). Open architectural question: may be an extension of film-data-mcp or a separate MCP that composes with it — decide during design phase. Phase 1 is MCP tools for retrieving/querying impact campaign data; Phase 2 (likely M17 skills layer) is tools for *building* campaigns.
**Status:** Design needed.

### M20: Plugin Architecture & Wikipedia MCP Integration
**Criteria:** Restructure film-data-mcp as a Claude Code plugin in the personal knowledge marketplace, composable with other MCP servers. Key integration: existing Wikipedia MCP for richer entity resolution beyond SPARQL-only approach. Design questions: plugin structure that preserves standalone MCP usability, cross-MCP entity resolution composition, interoperability with other marketplace servers.
**Status:** Design needed.

## Current Status

v0.10.0 in progress. M11 + M14 complete. 20 tools total (16 TMDB + 4 awards), 293 unit tests across 16 files + 16 integration tests across 2 files. M12-M13, M15-M20 planned — spans new tools, data expansion, research, workflow design, impact campaign data, plugin architecture, and a standalone philanthropic intelligence MCP.

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
| M10: Tooling Review | 1 session | 1 session (design + plan + implementation) | — | Complete |
| M11: Batch Keywords | 1 session | 0.5 session | — | Complete |
| M12: Box Office Data | 1-2 sessions | — | — | Planned |
| M13: Awards Registry Exp. | 1-2 sessions | — | — | Planned |
| M14: Person Awards Fallback | 1 session | 0.5 session | — | Complete |
| M15: Representation Data | 1 session (research) | — | — | Research needed |
| M16: Special Thanks Credits | 1 session (research) | — | — | Research needed |
| M17: Skills & Commands | 2-3 sessions (design + build) | — | — | Design needed |
| M18: Impact Campaign Data | 2-3 sessions (research + design + build) | — | — | Design needed |
| M19: Philanthropic Intel MCP | 3-4 sessions (research + design + build) | — | — | Design needed |
| M20: Plugin Architecture | 2-3 sessions (design + build) | — | — | Design needed |

## Key Decisions

- TMDB has no awards API — Wikidata SPARQL fills this gap (CC0 license)
- Entity resolution: TMDB ID → IMDb ID → name search (with occupation filter) → error.
- Awards registry: curated verified QIDs, not dynamic SPARQL discovery (casual QID assumptions are wrong ~90% of the time)
- `buildToolDef()`: Zod schemas are single source of truth, auto-converted to JSON Schema for MCP
- Credits/watch provider overflow solved with filtering params, not separate tools
