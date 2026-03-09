# Film Data MCP Roadmap

## Vision

A standalone MCP server that gives producers and filmmakers instant research capabilities: filmography browsing, thematic discovery, awards history, distribution intel, and talent pipeline mapping — all through structured tool calls backed by TMDB and Wikidata.

## Motivation

Film research is scattered across TMDB, IMDb, Wikipedia, JustWatch, and festival archives. No single API covers the full producer workflow: "Who made films like mine? Where did they premiere? What awards did they win? Who distributed them?" This MCP server consolidates that into a coherent toolset optimized for LLM-driven research.

## Milestones

### M1: Foundation + Wikidata Awards Layer
**Criteria:** Fork cleaned up, Wikidata SPARQL client with entity resolution (TMDB→IMDb→Wikidata), awards registry with verified QIDs (21 ceremonies and 91 categories at M1; expanded to 24 ceremonies and 101 categories at M13).
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
**Criteria:** New `get_financials` tool (#21) aggregating structured financial data from TMDB (budget, revenue) and OMDb (domestic gross). Multi-source architecture with source attribution per data point. OMDb API key optional — tool works TMDB-only when not set. Extensible for future sources (OpusData). Wikidata P2142 assessed and rejected (0.36% doc coverage, 0/5 comp films had data). Layer 2 (trade press scraping for deal intelligence) deferred to separate milestone.
**Status:** Complete — v0.11.0 tagged. 21 tools (17 TMDB + 4 awards). OMDb client optional.
- Design: `docs/plans/2026-03-08-m12-box-office-design.md`
- Plan: `docs/plans/2026-03-08-m12-implementation.md`

### M13: Awards Registry Expansion
**Criteria:** Add Wikidata-viable ceremonies and fellowships to the awards registry. Scope determined by feasibility study (2026-03-07): Peabody Awards (Q838121, 446 P166 claims), Gotham Awards (Q1538791, 12-15 categories), Emmy documentary categories (5-7 new categories under existing `emmys` entry, 5 QIDs verified), and Guggenheim Fellowship (Q1316544, 19,570 P166 claims, 217-758 film-relevant — requires qualifier-aware SPARQL query, new engineering). Non-viable Wikidata candidates (Critics' Choice Doc, Cinema Eye, IDA, Sundance Fund/Labs, Film Independent Labs, ITVS, Catapult, Ford/JustFilms) deferred to a future milestone requiring alternative data sources.
**Status:** Complete — v0.10.0 tagged. 24 ceremonies, 101 categories. Qualifier-aware SPARQL for Guggenheim.
- Feasibility study: `docs/plans/2026-03-07-m13-feasibility-study.md`
- Design: `docs/plans/2026-03-07-m13-design.md`
- Plan: `docs/plans/2026-03-07-m13-implementation.md`

### M14: Person Awards Name Fallback
**Criteria:** Add name-based Wikidata resolution to `get_person_awards`, matching the fallback chain already implemented in `get_film_awards` and crew resolution (M9). Currently `get_person_awards` only accepts a TMDB person ID with no name fallback — users must know the TMDB ID to query awards.
**Status:** Complete — optional `name` field added to schema, passed to `resolvePerson` for TMDB→IMDb→name fallback.
- Design: `docs/plans/2026-03-07-m11-m14-design.md`
- Plan: `docs/plans/2026-03-07-m11-m14-implementation.md`

### M15: Representation & Talent Data
**Criteria:** Research and implement talent representation data — publicists, agents, managers, and agency affiliations. Research phase investigated 10+ sources (TMDB, IMDbPro, IMDb API, Wikidata, ContactAnyCelebrity, filmmakers.eu, agency websites, Apify, academic datasets, GitHub scrapers). Finding: Wikidata P1875 ("represented by") is the only viable free source — ~1,200 film professionals at talent agencies (CAA, WME, UTA, ICM + strong Japanese/Korean coverage). IMDbPro has gold-standard data but no API. Implementation: `get_person_representation` tool using existing Wikidata SPARQL infrastructure with TMDB ID resolution.
**Status:** Complete — `get_person_representation` tool (#21). 332 unit tests across 17 files + 4 integration tests (Zendaya→CAA, Dwayne Johnson→UTA).
- Research: `docs/plans/2026-03-08-m15-representation-data-research.md`
- Design: `docs/plans/2026-03-08-m15-representation-design.md`
- Plan: `docs/plans/2026-03-08-m15-implementation.md`

### M16: Special Thanks & Acknowledgment Credits
**Criteria:** Surface "Thanks" and "Special Thanks" credit data from TMDB. New `get_thanks_credits` tool (#23) with three modes: forward (film→thanked people), reverse (person→films thanked in + formal crew roles), batch (aggregate across multiple films with frequency map). Research phase assessed TMDB coverage (45% of films, stronger for fiction) and rejected Wikidata P7137 (5 films globally). Key finding: Thanks credits stored as `job: "Thanks"` under `department: "Crew"`, not as a separate department. Phase 3 enrichment deferred indefinitely (Wikidata not viable).
**Status:** Complete — v0.13.0. 23 tools (18 TMDB + 4 awards + 1 representation). 370 unit tests + 4 integration tests.
- Design: `docs/plans/2026-03-08-m16-special-thanks-design.md`
- Plan: `docs/plans/2026-03-08-m16-implementation.md`
- Research: `docs/plans/2026-03-08-m16-research-findings.md`

### M17: Plugin Architecture & Producer Workflows
**Criteria:** Combined scope from former M17 (Skills & Commands) and M20 (Plugin Architecture + Wikipedia MCP). Restructure film-data-mcp as a Claude Code plugin, build producer workflow skills inside that plugin structure, and integrate Wikipedia MCP as a fallback enrichment layer.

**Plugin architecture:** Restructure as a Claude Code plugin composable with other MCP servers. Wikipedia MCP integration for the 78% of skipped crew absent from Wikidata (70% of those appear on 2+ Wikipedia pages). Preserve standalone MCP usability.

**Producer workflow skills:** Comp sheet generation (search → details → awards → synthesis), filmmaker career mapping (person → credits → collaborator network), distribution pathway analysis (festival premieres → watch providers → financial data), documentary discovery with curated keyword bundles (BOD-208: keyword exclusion sets, predefined sub-genre bundles).

**Trade press extraction (from M20):** 5-phase pipeline — IndieWire roundup extraction (Phase 1, standalone script prototype), RSS deal monitoring (Phase 2), historical Wayback corpus (Phase 3), LUMIERE European data (Phase 4), paid supplements evaluation (Phase 5). Architecture: Claude Code skills composing existing tools. `DealExtraction` schema, keyword filters, and headline regex patterns defined in design doc.

**Status:** Design needed.
- Trade press design: `docs/plans/2026-03-08-m20-trade-press-design.md`
- Wikipedia research: `docs/plans/2026-03-08-m20-wikipedia-resolution-findings.md`
- Raw trade press research: `.firecrawl/m20-trade-press/raw-research/` (11 files, indexed by README.md)

### M18: Impact Campaign Data
**Criteria:** Research and design a structured data layer for documentary impact campaigns. Categories to model (requires careful design iteration): mission/theory of change, KPIs (screenings, policy meetings, media mentions, audience reach, legislative action), campaign timeline phases (pre-release grassroots, festival window, theatrical/streaming, long-tail educational), partners (NGOs, advocacy orgs, educational institutions), personnel (impact producers, outreach coordinators), case studies (measurable outcomes from comparable docs — e.g., Blackfish → SeaWorld policy, An Inconvenient Truth → climate legislation), political context (intersecting legislation, public debate, cultural moment), impact-specific funding (Ford Foundation, Catapult, Perspective Fund — distinct from production funding), community screening/educational distribution strategy, and measurement methodology (pre/post surveys, policy tracking, media analysis). Open architectural question: may be an extension of film-data-mcp or a separate MCP that composes with it — decide during design phase. Phase 1 is MCP tools for retrieving/querying impact campaign data; Phase 2 (likely M17 skills layer) is tools for *building* campaigns.
**Status:** Design needed.

### M19: Fellowship & Labs Research
**Criteria:** Comprehensive landscape survey of documentary film fellowships, labs, development programs, funding sources, and doc-specific awards ceremonies. Three dimensions: wide scope inventory, current operational state, and data harvesting feasibility. 80+ programs researched across 4 categories (US labs, foundation grants, international programs, doc-specific awards).
**Status:** Complete — research delivered. Key findings: CPB dissolved Jan 2026 (ITVS, ethnic media funders severely impacted); NEH CC0 and NEA Excel export are gold-standard structured data sources; Ford Foundation has Elasticsearch-backed grants DB; zero programs offer APIs; doc-specific awards ceremonies lack Wikidata editor communities (confirms M13). Implementation decomposed into M21-M25.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md`
- Prior art: M13 feasibility study (`docs/plans/2026-03-07-m13-feasibility-study.md`)
- Linear: BOD-215 (Done)
- Artifacts feed into: M21 (BOD-217), M22 (BOD-218), M23 (BOD-219), M24 (BOD-220), M25 (BOD-221)

### M20: Trade Press Feasibility Study
**Criteria:** Research programmatic access to film deal intelligence — distribution deals, sales agent agreements, MG amounts, territory sales, festival market acquisitions. Evaluate Cinando, Film Catalogue, trade press (Deadline, Variety, Screen Daily, The Wrap), The Numbers/OpusData, and festival market reports. Deliverable: feasibility report documenting each source's viability, access model, cost, coverage, and legal boundaries. Recommendation on architecture (standalone MCP, extension, or manual curation layer).
**Status:** Complete — feasibility study delivered. 15+ sources evaluated across 5 tiers (accessible/paid/enterprise/not viable/doesn't exist). Key finding: no structured deal database exists publicly. RSS feeds + LLM extraction is the viable architecture. 5-phase implementation plan from IndieWire roundup extraction through LUMIERE integration. Architecture recommendation: Claude Code skills (M17), not MCP tools.
- Design: `docs/plans/2026-03-08-m20-trade-press-design.md`
- Raw research: `.firecrawl/m20-trade-press/raw-research/` (11 files)
- Context: M12 design doc Layer 2 scope (`docs/plans/2026-03-08-m12-box-office-design.md`)

### M21: Awards Registry Expansion II
**Criteria:** Add doc-specific ceremonies and fellowships to the awards registry via Wikidata SPARQL verification. Follows M13 pattern. Ceremony candidates: Critics' Choice Documentary Awards (Q98079026), News & Documentary Emmy Awards (Q11247971 — NATAS, separate from Television Academy), NBR Best Doc (Q1169140), duPont-Columbia (Q4722910), Grierson Awards (Q5608702). Fellowship candidates: MacArthur, Creative Capital, USA Fellowship. Each assessed as Viable/Marginal/Not Viable; viable entries added with integration tests.
**Status:** Backlog.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md` §Part 5, §Part 9
- Prior art: M13 feasibility study, Guggenheim qualifier pattern
- Linear: BOD-217. GitHub: bodywithoutorganss/film-data-mcp milestone 1 (#1-#3)

### M22: Urgent Data Archival
**Criteria:** Archive at-risk CPB-dependent data sources before potential shutdown. Targets: ITVS projects page (1,400+ funded films), Black Public Media funded works catalog, CAAM program data, LPB, PIC, Vision Maker Media, CPB.org. Store locally as JSON + submit to Wayback Machine.
**Status:** Backlog. Priority: Urgent.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md` §Part 3
- Linear: BOD-218 (Urgent). GitHub: bodywithoutorganss/film-data-mcp milestone 2 (#4-#6)

### M23: Federal & Foundation Data Import
**Criteria:** Import structured data from highest-value, lowest-friction sources. Tier 1: NEH CC0 database (1966-present), NEA Excel export (1998-present), Ford Foundation Elasticsearch (2006-present), USASpending.gov API. Tier 2: MacArthur Fellows DB, Creative Capital Index, ProPublica 990s. Requires data storage architecture decision (where does imported data live?). Blocked by M17 plugin architecture for skills integration.
**Status:** Backlog.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md` §Part 8 Tier 1
- Linear: BOD-219 (blocked by BOD-190/M17). GitHub: bodywithoutorganss/film-data-mcp milestone 3 (#7-#11)

### M24: Program & Lab Data Harvest
**Criteria:** Scrape structured data from documentary lab and market program archives. US: Film Independent Talent Guide (1,000+ alumni), Gotham Project Market, Good Pitch DB. International: IDFA Bertha Fund + Forum (600+ films, 30 years), CPH:FORUM (500+ projects), DOKweb aggregator, Berlinale WCF (350+), DFI Grants (600+). Blog post scraper pattern for annual cohort announcements (Sundance, Firelight, Chicken & Egg, Catapult, LEF). Blocked by M17 + M23 data storage decision.
**Status:** Backlog.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md` §Part 6, §Part 8 Tiers 2-3
- Linear: BOD-220 (blocked by BOD-219, BOD-190). GitHub: bodywithoutorganss/film-data-mcp milestone 4 (#12-#15)

### M25: Doc Awards Web Scraping
**Criteria:** Harvest winner/nominee data from doc-specific awards ceremonies via Wikipedia tables and official websites. Fallback path for ceremonies where M21 Wikidata SPARQL proves insufficient. Primary: Cinema Eye Honors (~17 categories, 19 years), IDA Documentary Awards (~15 categories, 41 years). Secondary: News & Doc Emmys, Critics' Choice Doc, NBR (if not covered by M21). Festival: Sheffield, Full Frame, DOC NYC, Thessaloniki, RIDM, Ji.hlava, Grierson, duPont-Columbia. Conditional on M21 results.
**Status:** Backlog.
- Research: `docs/plans/2026-03-08-m19-fellowship-labs-research.md` §Part 5
- Linear: BOD-221 (blocked by BOD-217/M21). GitHub: bodywithoutorganss/film-data-mcp milestone 5 (#16-#18)

## Current Status

v0.13.0. 23 tools total (18 TMDB + 4 awards + 1 representation), 24 ceremonies, 101 award categories. M19 (fellowship & labs research) complete — comprehensive landscape survey of 80+ programs, decomposed into 5 implementation milestones (M21-M25). M22 (urgent data archival) is time-sensitive due to CPB dissolution. M17 (plugin architecture) is the critical-path blocker for M23-M24. Former M19 (Philanthropic & Financial Intelligence) migrated to `financial-mcp-tools` repo (BOD-201). Known data gaps tracked in BOD-206.

### Known Issues
- **BOD-206:** Consolidated data gaps tracker — Wikidata awards/fellowships/crew/representation, TMDB thanks/financials, and trade press deal intelligence. All structural gaps, not code bugs.
- ~~**BOD-207:** Direct film awards missing `result` field~~ — Fixed.
- ~~**BOD-208:** `discover` Documentary genre too broad~~ — Fixed. Keyword bundles deferred to M17.
- ~~**BOD-203:** Richer candidate scoring~~ — Canceled (78% of skips are absent Wikidata entities).

## Data Domain Inventory

Cross-cutting view of every data type evaluated across all milestones and research. Grouped by domain, not milestone. Status key: **Live** (shipped tool), **Planned** (milestone assigned), **Evaluate** (needs further research), **Manual** (usable but no API), **Deferred** (not acting now, may revisit), **Rejected** (evaluated, not viable), **Doesn't exist** (no source anywhere).

### Core Metadata — TMDB

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Movie/TV/person search | Live | `search` (M2) | Multi, movie, TV, person, company |
| Movie details + appended data | Live | `movie_details` (M2) | credits, videos, images, etc. |
| TV details + appended data | Live | `tv_details` (M2) | |
| Person details + appended data | Live | `person_details` (M2) | |
| Detailed credits (dept/job filter, pagination) | Live | `get_credits` (M8) | |
| Collections/franchises | Live | `collection_details` (M2) | |
| Companies/networks | Live | `company_details` (M2) | |
| Genres | Live | `genres` (M2) | |
| Keywords | Live | `search_keywords` (M6, M11) | Batch lookup via string array |
| External ID lookup | Live | `find_by_external_id` (M2) | IMDb/TVDB/social → TMDB |

### Discovery & Browsing — TMDB

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Advanced filtering (30+ params) | Live | `discover` (M2) | Genre, year, rating, crew, cast, keywords, etc. |
| Trending (daily/weekly) | Live | `trending` (M2) | |
| Curated lists (popular, top rated, etc.) | Live | `curated_lists` (M2) | |
| Company filmography | Live | `company_filmography` (M6) | Paginated discover wrapper |
| Documentary keyword bundles | Planned | M17 (BOD-208) | Predefined sub-genre bundles, exclusion sets |

### Distribution & Availability — TMDB

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Watch providers (streaming/rent/buy) | Live | `watch_providers` (M2) | Region-filterable |
| Festival premieres | Live | `get_festival_premieres` (M8) | Extracted from TMDB release dates |

### Awards & Recognition — Wikidata SPARQL

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Person awards (wins + nominations) | Live | `get_person_awards` (M3, M14) | Name fallback added M14 |
| Film awards + crew cross-referencing | Live | `get_film_awards` (M3, M7) | P1411 is primary doc value channel |
| Award history by category | Live | `get_award_history` (M3) | |
| Award search (registry lookup) | Live | `search_awards` (M3) | 24 ceremonies, 101 categories |
| Fellowships (MacArthur, Creative Capital, USA Fellows) | Evaluate | M21 | SPARQL feasibility TBD. Rockefeller has no film program. |
| Critics' Choice Documentary Awards | Evaluate | M21 | Q98079026 — strongest doc Wikidata presence. Edition QIDs exist. 18 categories |
| News & Documentary Emmy Awards | Evaluate | M21 | Q11247971 — NATAS (separate from TV Academy). ~15 doc categories |
| NBR Best Documentary | Evaluate | M21 | Q1169140 — P166 confirmed. 1940-present |
| duPont-Columbia Awards | Evaluate | M21 | Q4722910 — doc-eligible since 2012 |
| Grierson Awards (UK) | Evaluate | M21 | Q5608702 — 16 categories, since 1972 |
| Cinema Eye Honors | Planned | M25 | Q5120729. ~17 categories. Web scraping path (Wikipedia + official site) |
| IDA Documentary Awards | Planned | M25 | Q96206663. ~15 categories, 41 years. Web scraping path |
| Sundance Fund/Labs, Film Independent Labs, ITVS, Catapult, Ford/JustFilms | Rejected | M13 | Not on Wikidata (labs/grants, not ceremonies) |
| Gotham Best Documentary | Live (empty) | BOD-206 | QID in registry but 0 P166 claims in Wikidata |
| NEA Fellowship | Rejected | M13 | 246 P166 claims but only ~13 film-relevant |
| TIFF Platform Prize | Rejected | M13 | 2 P166/P1411 claims. Too low density |
| TIFF Talent Lab | Rejected | M13 | No Wikidata entity exists |

### Financial Data — TMDB + OMDb

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Budget, revenue (TMDB) | Live | `get_financials` (M12) | `zeroToNull` pattern — 0 means unknown |
| Domestic gross (OMDb) | Live | `get_financials` (M12) | Optional OMDb API key |
| OpusData / The Numbers | Evaluate | M20 | $19/mo web, API enterprise pricing. Supplements M12. |
| Wikidata P2142 box office | Rejected | M12 | 0.36% doc coverage, 0/5 comp films had data |
| IMDb / Box Office Mojo | Rejected | M12 | ~$400K/yr. Gold-standard but not viable at cost |

### Talent & Representation — Wikidata P1875

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Agency affiliations | Live | `get_person_representation` (M15) | ~1,200 film professionals. US sparse (~70 CAA/WME/UTA/ICM), JP/KR strong |
| IMDbPro representation | Rejected | M15 | Gold-standard data but no API, aggressive bot detection |
| ContactAnyCelebrity | Rejected | M15 | No API, $39/mo |
| Wikidata P6275 (copyright representative) | Rejected | M15 | 2,579 film professionals but mostly visual artists' rights societies |
| filmmakers.eu API | Rejected | M15 | Right data model, wrong geography. ~40K profiles, D/A/CH only |
| IMDb Bulk Data / AWS | Rejected | M15 | $150K-400K/yr, no representation data even in enterprise tier |

### Credits & Acknowledgments — TMDB

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Thanks / Special Thanks credits | Live | `get_thanks_credits` (M16) | 3 modes: forward, reverse, batch. ~45% film coverage |
| Wikidata P7137 (acknowledged) | Rejected | M16 | Only 5 film entities globally |

### Entity Resolution — Wikidata

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| TMDB → IMDb → name search (occupation filter) | Live | M1, M9 | 3-tier chain |
| Tiered name resolution (Tier 1/2/3) | Live | BOD-199 | Tier 2: sole candidate without film occupation |
| Wikipedia mention-based enrichment | Planned | M17 | For 78% of skipped crew absent from Wikidata (70% appear on 2+ Wikipedia pages) |
| Scored ranking for disambiguation | Rejected | BOD-203 | 78% of skips are absent entities, not disambiguation failures |

### Deal Intelligence — Trade Press (M20 Research)

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| RSS monitoring (Deadline, IndieWire, Variety, Wrap) | Planned | M17 | Deadline has dedicated `/category/acquisitions/feed/` |
| LLM structured extraction from deal articles | Planned | M17 | Claude `tool_use` + Zod schema. Headline regex covers ~60-70% |
| IndieWire festival roundup extraction | Planned | M17 | Single richest extraction target (one URL, many deals) |
| Wayback CDX historical article enumeration | Planned | M17 | 60 req/min, free |
| LUMIERE European theatrical admissions | Planned | M17 | Free, 57K titles, 38 markets, Excel export |
| LUMIERE VOD availability | Evaluate | M20 | Free web. Assessed M20 — useful complement for territory-level availability mapping |
| Cineuropa sales directory | Evaluate | M20 | 975 European sales companies, free web |
| Vitrina AI (titles, companies, exec profiles, deals) | Evaluate | M20 | 200 free credits. Enterprise ~$10K+/yr for API |
| Hollywood Reporter RSS | Evaluate | M20 | PMC property, not profiled. Covers deals but less indie/doc focus |
| Seventh Row (TIFF acquisition lists) | Evaluate | M20 | Minor supplementary source for TIFF deals |
| Screen Daily territory deals (MGs, pre-sales) | Manual | M20 | Hard paywall, best territory-level data. Subscribe for manual research |
| Cinando (sales agents, territory availability) | Manual | M20 | €149/yr, no API, EU Database Directive. Academic Figshare dataset exists (77K films, one-off) |
| Luminate / Variety Insight | Deferred | M20 | Enterprise subscription, contact sales |
| FilmTake territory MG benchmarks | Deferred | M20 | $500K budget floor, narrative focus |
| Screen Intelligence (GlobalData) | Deferred | M20 | Enterprise, likely high cost |
| IFTA Film Catalogue | Rejected | M20 | No API, ToS explicitly prohibits robots/automation |
| Festival Scope Pro | Rejected | M20 | Screening platform, not deal data. No API. €70/yr |
| Reelport | Rejected | M20 | European market focus, no API, custom pricing |
| Filmhub | Rejected | M20 | Distribution aggregator, no data API |
| EFP Sales Guide | Rejected | M20 | Static annual PDF, not queryable |
| AFM exhibitor/buyer lists | Rejected | M20 | Registration-gated, no programmatic access |
| Structured film deal database | Doesn't exist | M20 | Nobody publishes this publicly or affordably |
| Documentary-specific deal tracker | Doesn't exist | M20 | No org tracks doc deals systematically |
| Territory-level deal terms (free) | Doesn't exist | M20 | Locked behind paywall + private relationships |
| Completed deal history (post-close terms) | Doesn't exist | M20 | Cinando tracks availability, not completed deals. No aggregator |
| US equivalent to LUMIERE | Doesn't exist | M20 | |

### Impact Campaigns — No Source Identified

| Data | Status | Tool / Milestone | Notes |
|------|--------|-----------------|-------|
| Mission/theory of change, KPIs, partners, case studies | Design needed | M18 | May be extension or separate MCP |
| Impact-specific funding (Ford, Catapult, Perspective Fund) | Design needed | M18 | Distinct from production funding |
| Community screening / educational distribution | Design needed | M18 | |
| DOC NYC (filmmaker directory, panels) | Evaluate | M20 | Resource directory + $30K Subject Matter award. Not a data product |
| IDA educational resources | Evaluate | M20 | Panels, guides. No deal or impact data |
| ITVS / Independent Lens / POV deal terms | Evaluate | M20 | 1,400+ films funded. Terms private. Mid-five-figures to low-six-figures |
| The Film Collaborative (market analysis) | Rejected | M20 | Qualitative blog analysis only, not structured data |
| Desktop Documentaries (distributor directory) | Rejected | M20 | 250+ distributors, paid course. Static, not data |

### Fellowships & Grants — Multiple Sources (M19 Research)

| Data | Status | Source / Milestone | Notes |
|------|--------|-------------------|-------|
| NEH Media Projects grants | Planned | M23 | **CC0 public domain.** Structured DB, 1966-present, 500+ films. Gold standard. |
| NEA Media Arts grants | Planned | M23 | **Excel export.** 1998-present. Under threat of elimination. |
| Ford Foundation / JustFilms grants | Planned | M23 | Elasticsearch backend. 2006-present. $4.2M/year |
| USASpending.gov federal arts grants | Planned | M23 | REST API + bulk download. All federal arts spending |
| MacArthur Fellows (film-relevant) | Planned | M23 | Searchable DB. 1,175+ fellows since 1981. ~1-3 filmmakers/class |
| Creative Capital awardees | Planned | M23 | HTML index. 1,000+ since 1999. Film/video category |
| Guggenheim Fellows (Film-Video) | Live | M13 | Already in registry via Wikidata P166 + qualifier SPARQL |
| USA Fellowship | Evaluate | M21 | Wikipedia list. ~50/year across 10 disciplines |
| Catapult Film Fund grantees | Planned | M24 | Press releases. ~18 grants/year, 1% acceptance rate |
| Chicken & Egg Films grantees | Planned | M24 | Press releases. 500+ filmmakers since 2005 |
| Firelight Media fellows | Planned | M24 | Medium blog posts. ~150 filmmakers over 15 years |
| Sundance Documentary Fund grantees | Planned | M24 | Blog posts. 30-40 projects/year since ~2002 |
| Perspective Fund | Manual | M19 | Invitation-only, no public data. ProPublica 990s only |
| ProPublica 990 tax data | Planned | M23 | Universal backup for all foundation grantees |

### Documentary Programs & Labs — Web Scraping (M19 Research)

| Data | Status | Source / Milestone | Notes |
|------|--------|-------------------|-------|
| Film Independent Talent Guide | Planned | M24 | Searchable web app. 1,000+ alumni across all FI programs. Highest-value US source |
| Gotham Project Market slates | Planned | M24 | Structured HTML per year. 90-142 projects/year |
| Good Pitch project database | Planned | M24 | Searchable DB. 134+ films from 60 countries |
| ITVS funded projects | Planned | M22, M24 | 1,400+ films. **Archive urgently** (CPB dissolution) |
| IDFA Bertha Fund collection | Planned | M24 | 600+ funded films since 1998 |
| IDFA Forum catalogues | Planned | M24 | 30+ years of per-year HTML catalogues |
| CPH:FORUM project archive | Planned | M24 | 500+ projects since ~2011 |
| DOKweb aggregator | Planned | M24 | Richest European source. Aggregates Ex Oriente, East Doc Platform, etc. |
| Berlinale World Cinema Fund | Planned | M24 | 350+ funded films since 2004 |
| Doha Film Institute grants | Planned | M24 | 600+ funded films since 2010 |
| Black Public Media catalog | Planned | M22 | **Archive urgently.** ~50% budget lost (CPB) |
| CAAM program data | Planned | M22 | **Archive urgently.** Main Doc Fund paused |
| Sundance Catalyst | Manual | M19 | Intentionally private — slate confidential by design |
| Tribeca Film Institute | Rejected | M19 | Defunct (closed 2021). Wayback Machine only |

### Doc-Specific Awards Ceremonies — Web Scraping (M19 Research)

| Data | Status | Source / Milestone | Notes |
|------|--------|-------------------|-------|
| Cinema Eye Honors | Planned | M25 | ~17 categories, 19 years. Wikipedia + official site |
| IDA Documentary Awards | Planned | M25 | ~15 categories, 41 years. documentary.org predictable URLs |
| News & Documentary Emmys | Evaluate | M21/M25 | Wikipedia tables, 40+ years. SPARQL first, web scraping fallback |
| Critics' Choice Doc Awards | Evaluate | M21/M25 | Wikipedia tables, 10 years. SPARQL first, web scraping fallback |
| NBR Best Documentary | Evaluate | M21/M25 | Wikipedia complete 1940-present. SPARQL first |
| Sheffield DocFest awards | Planned | M25 | ~7 awards, 30 years |
| Full Frame awards | Planned | M25 | 9 awards ($45K total), 27 years |
| DOC NYC awards | Planned | M25 | ~12 awards, 15 years |
| Thessaloniki Doc Fest awards | Planned | M25 | ~15 awards (EUR prizes), Oscar-qualifying |
| RIDM awards | Planned | M25 | ~12 awards, 27 years |
| Grierson Awards (UK) | Evaluate | M21/M25 | ~16 categories, since 1972. SPARQL first |
| duPont-Columbia Awards | Evaluate | M21/M25 | "Broadcast Pulitzer," since 1942. SPARQL first |
| Ji.hlava IDFF | Planned | M25 | 7+ competition sections, 28 years |
| True/False | Deferred | M19 | Only 1 award (True Vision). Low value |
| AFI DOCS | Rejected | M19 | Defunct (merged into AFI Fest 2022) |

### Infrastructure & Architecture

| Capability | Status | Milestone | Notes |
|------------|--------|-----------|-------|
| Plugin architecture (Claude Code plugin) | Planned | M17 | Restructure for composability with other MCPs |
| Producer workflow skills | Planned | M17 | Comp sheets, career mapping, distribution analysis |
| Data storage architecture for imports | Planned | M23 | Where does imported grant/fellowship data live? Blocks M23-M24 |
| Neo4j + Obsidian persistence layer | Future | BOD-206 | Own the data strategy for structural gaps |

### Legal Considerations

| Source | Risk | Notes |
|--------|------|-------|
| PMC properties (Deadline, Variety, IndieWire) | Medium-High for scraping | PMC v. Google lawsuit (Sep 2025). RSS = LOW risk, scraping = HIGH risk |
| TollBit | Low | Potential legitimate paid API for PMC content |
| Cinando | High for automation | EU Database Directive, ToS prohibits robots |
| NEH/NEA databases | None | Federal public domain / CC0. Free to use |
| Ford Foundation grants DB | Low | Major foundation, transparency commitment. Data intentionally public |
| Film Independent, IDFA, etc. | Low | Standard website ToS. No explicit anti-scraping measures observed |

## Time Tracking

Actuals measured from commit timestamps via `scripts/cc-time.sh`. Gaps > 45 minutes between commits are treated as session breaks. M1–M8 actuals from manual commit-span analysis (pre-date the `(Mxx):` commit prefix convention).

| Milestone | Est (h) | Actual (h) | Status |
|-----------|---------|------------|--------|
| M1: Foundation + Wikidata | — | 1.4 | Complete |
| M2: TMDB Redesign | — | 0.7 | Complete |
| M3: Awards Tools | — | 0.2 | Complete |
| M4: Tests + Audit | — | 1.7 | Complete |
| M5: Usability Fixes | — | 2.2 | Complete |
| M6: Discovery Tools | — | 0.9 | Complete |
| M7: Awards Intelligence | — | 1.1 | Complete |
| M8: Discovery & Polish | — | 1.0 | Complete |
| M9: Crew Resolution | — | 0.4 | Complete |
| M10: Tooling Review | — | 0.8 | Complete |
| M11: Batch Keywords | — | 0.1 | Complete |
| M12: Box Office Data | — | 0.6 | Complete |
| M13: Awards Registry Exp. | — | 1.3 | Complete |
| M14: Person Awards Fallback | — | 0.1 | Complete |
| BOD-199: Tiered Name Resolution | — | 0.3 | Complete |
| BOD-198: Resolved Crew Enrichment | — | 0.4 | Complete |
| M15: Representation Data | — | 0.4 | Complete |
| BOD-204: Stale FilmAwardsResult type | — | 0.3 | Complete |
| BOD-207: Award result field | — | 0.1 | Complete |
| GTM stress test script | — | 0.2 | Complete |
| BOD-208 + BOD-203 + misc fixes | — | 0.4 | Complete |
| M20 Wikipedia research | — | 0.2 | Complete |
| M16: Special Thanks Credits | 1.25 | 1.3 | Complete |
| M20: Trade Press Study | 1.5 | 1.1* | Complete |
| M19: Fellowship & Labs Research | 1.5 | 1.0* | Complete |
| **Completed total** | — | **16.2** | |
| M17: Plugin & Workflows | 5.5 | — | Design needed |
| M18: Impact Campaign Data | 4.0 | — | Design needed |
| M21: Awards Registry Exp. II | 2.0 | — | Backlog |
| M22: Urgent Data Archival | 1.0 | — | Backlog (Urgent) |
| M23: Federal & Foundation Import | 3.0 | — | Backlog |
| M24: Program & Lab Harvest | 4.0 | — | Backlog |
| M25: Doc Awards Web Scraping | 2.0 | — | Backlog |
| **Remaining total** | **21.5** | — | |

\* M20 actual: `cc-time.sh` reports 0.1h (research-heavy session had no intermediate commits during 60min agent dispatch + synthesis phase). Manual estimate: ~1.1h.
\* M19 actual: Research-heavy session with 4 parallel agents. Manual estimate: ~1.0h (includes agent dispatch, synthesis, issue creation).

## Key Decisions

- TMDB has no awards API — Wikidata SPARQL fills this gap (CC0 license)
- Entity resolution: TMDB ID → IMDb ID → name search (with occupation filter) → error.
- Awards registry: curated verified QIDs, not dynamic SPARQL discovery (casual QID assumptions are wrong ~90% of the time)
- `buildToolDef()`: Zod schemas are single source of truth, auto-converted to JSON Schema for MCP
- Credits/watch provider overflow solved with filtering params, not separate tools
