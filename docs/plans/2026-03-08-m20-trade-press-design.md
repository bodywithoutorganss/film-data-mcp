# M20: Trade Press & Deal Intelligence — Feasibility Study

## Goal

Evaluate every viable source of programmatic film deal intelligence — distribution deals, sales agent agreements, MG amounts, territory sales, festival market acquisitions — and produce a prioritized implementation plan.

## Motivation

Producers need competitive intelligence: what did comparable films sell for, to whom, at which festival, in which territories. This data is scattered across trade press articles, gated market platforms, and private relationships. No single structured source exists. M12 deferred this as "Layer 2" scope.

---

## Source Inventory

Every source researched, with honest viability ratings and implementation status.

### Tier 1: Accessible and Free

| Source | Data | Access | Doc Coverage | Status |
|--------|------|--------|-------------|--------|
| **Deadline RSS** (`/category/acquisitions/feed/`) | Deal announcements, buyer/seller, price ranges | Free RSS | Regular doc deals | **Implement** |
| **IndieWire RSS** (`/feed/rss/`) | Festival deal roundups, acquisition articles | Free RSS | Strong (indie/doc focus) | **Implement** |
| **IndieWire Roundup Articles** | Semi-structured deal lists per festival (Sundance, TIFF, Venice, etc.) | Free web | Excellent | **Implement** |
| **Variety RSS** (`/v/film/feed`) | Deal articles (no acquisitions-specific feed) | Free RSS | Regular | **Implement** |
| **The Wrap RSS** (`/industry-news/deals-ma/`) | Deals & M&A category | Free RSS (news), WrapPRO (analysis) | Moderate | **Implement** |
| **Wayback Machine CDX API** | Historical trade press article URLs | Free API (60 req/min) | N/A (raw articles) | **Implement** |
| **LUMIERE** (European Audiovisual Observatory) | Theatrical admissions, 57K titles, 38 European markets | Free web + Excel export | Fair (theatrical only) | **Implement** |
| **LUMIERE VOD** | VOD availability across European territories | Free web | Fair | **Evaluate** |
| **Cineuropa Sales Directory** | 975 European sales companies | Free web | Fair (European) | **Evaluate** |

### Tier 2: Paid but Affordable

| Source | Data | Access | Cost | Doc Coverage | Status |
|--------|------|--------|------|-------------|--------|
| **OpusData** | Box office, budgets, 14M+ facts | Web + API | $19/mo (web), API enterprise | Fair | **Evaluate** (supplements M12 `get_financials`) |
| **Cinando** | Sales agents, territory availability, 61K-126K films | Login-gated web, XLS export | €149/yr | Market-biased (commercial docs) | **Evaluate** (manual use, no API) |
| **Screen Daily** | Best territory-level deal data: MGs, pre-sales, territory splits | Hard paywall | Unknown (enterprise, "contact sales") | Strong (international docs) | **Evaluate** (subscription for manual research) |

### Tier 3: Expensive / Enterprise

| Source | Data | Access | Cost | Doc Coverage | Status |
|--------|------|--------|------|-------------|--------|
| **Vitrina AI** | 1.6M titles, 140K companies, deal flow, territory data | SaaS + API | Enterprise (likely $10K+/yr). 200 free credits. | Good | **Evaluate free tier** |
| **Luminate Film & TV** (fka Variety Insight) | 6M+ programs, org charts, contacts | SaaS + API | Tiered subscription (contact sales) | Fair | **Defer** |
| **FilmTake** | 1,300 territory MG benchmarks ($500K-$60M budgets) | Subscription | Unknown | Low (narrative focus, $500K floor) | **Defer** |
| **Screen Intelligence** (GlobalData) | Projects, deals, credits | Enterprise subscription | Unknown (likely high) | Fair | **Defer** |

### Tier 4: Not Viable for Programmatic Access

| Source | Why | Notes |
|--------|-----|-------|
| **Cinando** (programmatic) | No API, login-gated, EU Database Directive, ToS prohibits automation | Manual use at €149/yr is fine |
| **IFTA Film Catalogue** | No API, ToS explicitly prohibits robots/automation | |
| **Festival Scope Pro** | Screening platform, not deal data. No API. €70/yr. | |
| **Reelport** | European market focus, no API, custom pricing | |
| **Filmhub** | Distribution aggregator, no data API | |
| **EFP Sales Guide** | Static annual PDF, not queryable | |

### Tier 5: Doesn't Exist

| Data Type | Reality |
|-----------|---------|
| **Structured film deal database** | Nobody publishes this publicly or affordably |
| **Documentary-specific deal tracker** | No org tracks doc deals systematically |
| **Territory-level deal terms (free)** | Locked behind Screen Daily paywall and private relationships |
| **Completed deal history** | Cinando tracks availability, not completed deals. No one aggregates closed deals. |
| **US equivalent to LUMIERE** | Does not exist |

---

## Trade Press Publication Profiles

### Deadline Hollywood (PMC)
- **RSS:** `deadline.com/feed/`, `deadline.com/category/acquisitions/feed/` (dedicated acquisitions feed)
- **URL pattern:** `deadline.com/{YEAR}/{MONTH}/{slug}-{id}/`
- **Paywall:** Free (ad-supported)
- **Deal quality:** High. Reports price ranges ("mid-seven figures"). "(EXCLUSIVE)" tags.
- **Doc coverage:** Regular. Criterion Channel, CAT&Docs, Documentary+ acquisitions covered.

### Variety (PMC)
- **RSS:** `variety.com/feed/`, `variety.com/v/film/feed`, `variety.com/c/global/feed`
- **URL pattern:** `variety.com/{YEAR}/{category}/{type}/{slug}-{id}/`
- **Paywall:** Free since 2013 (VIP+ is separate premium product)
- **Deal quality:** High. "Dealmakers" annual feature. `markets-festivals` URL subcategory.
- **Doc coverage:** Regular. Dogwoof, Subtext deals covered.
- **Note:** No acquisitions-specific RSS category — needs keyword filtering.

### IndieWire (PMC)
- **RSS:** `indiewire.com/feed/rss/`, `indiewire.com/c/film/feed`
- **URL pattern:** `indiewire.com/{section}/{subcategory}/{slug}-{id}/`
- **Paywall:** Free
- **Deal quality:** Best-in-class for festival acquisitions. Semi-structured roundup articles.
- **Doc coverage:** Strong. Netflix doc bulk buys, ITVS initiatives covered.
- **Key asset:** Continuously-updated "Movies Sold So Far" articles per festival:
  - Sundance 2021-2026, Venice/TIFF/Telluride fall roundups, Cannes
  - One URL aggregates many deals in semi-structured format
  - Highest-value extraction target across all publications

### The Wrap (Independent)
- **RSS:** `thewrap.com/feed/`, `thewrap.com/industry-news/deals-ma/feed/` (inferred)
- **URL pattern:** `thewrap.com/{category}/{subcategory}/{slug}/` (newer) or `thewrap.com/{slug}-{id}/` (older)
- **Paywall:** Partial (WrapPRO for analysis, ~$1/week promo)
- **Deal quality:** Medium. More M&A industry analysis than individual film deals.
- **Doc coverage:** Moderate. Major deals only (Amazon "Melania" $40M).
- **Legal note:** Independent from PMC — lowest litigation risk.

### Screen Daily (GlobalData)
- **RSS:** `screendaily.com/full-rss`, `/news/sales` section
- **URL pattern:** `screendaily.com/{section}/{slug}/{id}.article`
- **Paywall:** Hard paywall, enterprise pricing
- **Deal quality:** Highest. Territory-level MGs, pre-sales, specific territory deals at EFM/Cannes/AFM.
- **Doc coverage:** Strong internationally. Autlook, Dogwoof, CAT&Docs, CPH:DOX, IDFA.
- **Not viable for automated access** but worth a subscription for manual research.

---

## Legal Landscape

### PMC v. Google (Sep 2025, D.C. Federal Court)
- PMC sued Google for scraping content into AI Overviews
- Claims 20%+ of Google queries with PMC content show AI summaries
- Affiliate revenue dropped >33% since end of 2024
- Google seeking dismissal (Jan 2026), case ongoing
- PMC has TollBit deal for monetizing/controlling bot access

### Risk Assessment by Access Method

| Method | Risk | Rationale |
|--------|------|-----------|
| RSS feed consumption | **LOW** | Intended for public use, standard syndication protocol |
| RSS description extraction | **LOW** | First paragraph, intended for feed readers |
| Full article scraping | **HIGH** | Directly analogous to Google's AI Overviews (PMC lawsuit) |
| Wayback Machine archived content | **MEDIUM** | Archived content, not live scraping. Some publishers blocking Wayback crawlers (2025-2026). |
| Google `site:` search | **LOW** | URL discovery only, no content extraction |
| Google Cache | **DEAD** | Discontinued Sep 2024 |

### By Publication Owner

| Owner | Publications | Scraping Risk |
|-------|-------------|---------------|
| PMC | Deadline, Variety, IndieWire | HIGH (active litigation) |
| GlobalData | Screen Daily | MEDIUM (paywall is primary barrier) |
| Independent | The Wrap | LOW-MEDIUM |

---

## Documentary-Specific Intelligence

**No doc-specific deal database exists anywhere.** Every doc-focused organization provides educational resources, not data products:

| Organization | What They Offer | Deal Data? |
|-------------|-----------------|-----------|
| DOC NYC | Filmmaker Resource Directory, panels, $30K Subject Matter award | No |
| IDA | "Guide to Documentary Distributors" article, panels | No |
| ITVS / Independent Lens / POV | Funded 1,400+ films, acquisitions = 20-40% of slate | Private. One example: mid-five-figures POV, low-six-figures Netflix SVOD |
| The Film Collaborative | Blog posts with market wrap reports | Qualitative analysis only |
| Desktop Documentaries | 250+ distributor directory (paid course) | Static directory, not deal data |

**Best doc deal sources are the same trade press publications.** IndieWire and Screen Daily have the strongest doc-specific coverage.

---

## Technical Architecture

### Extraction Pipeline

```
                    REAL-TIME LAYER
                    ===============

Deadline /category/acquisitions/feed/ ──┐
Deadline /v/film/feed ─────────────────┤
Variety /v/film/feed ──────────────────┤
IndieWire /feed/rss/ ──────────────────┤──→ RSS Aggregator ──→ Keyword Filter
The Wrap /industry-news/deals-ma/ ─────┘    (RSSbrew or        (DEAL_KEYWORDS)
                                             Apify actor)
                                                   │
                                                   v
                                          Deal Article URLs
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                              RSS has full text?           RSS truncated?
                                    │                             │
                                    v                             v
                           LLM Extraction              Wayback fetch OR
                           (Claude tool_use)           Apify article scraper
                                    │                             │
                                    v                             v
                           DealExtraction JSON ←──── LLM Extraction
                                    │
                                    v
                           Storage (JSON → Neo4j)


                    HISTORICAL LAYER
                    ================

CDX API ──→ Enumerate URLs by domain + date range
   │          (deadline.com/category/acquisitions/*)
   v          (indiewire.com/news/festivals/*)
URL corpus
   │
   v
Wayback content fetch (web.archive.org/web/<ts>/<url>)
   │
   v
HTML → Markdown
   │
   v
LLM Extraction (same DealExtraction schema)
   │
   v
Historical deal database


                    SUPPLEMENT LAYERS
                    =================

LUMIERE ──→ European theatrical admissions (Excel export) ──→ Neo4j
IndieWire roundups ──→ Semi-structured festival deal lists ──→ LLM extraction ──→ Neo4j
Cineuropa ──→ European sales agent directory (web) ──→ Neo4j
```

### Deal Extraction Schema

```typescript
interface DealExtraction {
  // Core deal
  film_title: string;
  buyer: string;                     // Distributor/streamer/platform
  seller?: string;                   // Sales agent or production company
  rights_type?: string;              // "North American", "worldwide", "all rights"
  territories?: string[];            // Specific territories if mentioned
  deal_value?: string;               // "mid six figures", "$3 million", etc.
  deal_type?: string;                // "acquisition", "pre-buy", "negative pickup"

  // Context
  festival_context?: string;         // "Sundance 2026 World Premiere"
  competition_section?: string;      // "U.S. Documentary Competition"

  // Talent
  director?: string;
  producers?: string[];
  cast?: string[];
  genre?: string;

  // Deal mechanics
  negotiators?: {
    buyer_rep?: string;
    seller_rep?: string;
    agency?: string;                 // CAA, WME, UTA, etc.
    law_firm?: string;
  };

  // Source
  source_url: string;
  source_publication: string;        // "Deadline", "Variety", etc.
  publication_date: string;          // ISO 8601
  is_exclusive: boolean;
}
```

### Keyword Filter for Deal Detection

```typescript
const DEAL_KEYWORDS = [
  // Acquisition verbs
  "acquired", "acquires", "acquisition",
  "buys", "bought", "purchasing",
  "picks up", "picked up", "nabs", "lands",
  "secures", "closes deal",

  // Rights language
  "rights", "distribution rights", "worldwide rights",
  "North American rights", "all rights",
  "pre-buy", "negative pickup",

  // Deal context
  "deal", "figure deal", "mid six", "low seven",
  "bidding war", "competitive situation",

  // Festival deal windows
  "Sundance", "Cannes", "TIFF", "Tribeca",
  "Berlinale", "EFM", "AFM", "SXSW",
  "Venice", "Telluride",

  // Key doc-relevant buyers
  "A24", "Neon", "Amazon", "Netflix", "Apple",
  "Searchlight", "Focus", "Sony Classics",
  "Magnolia", "IFC", "Bleecker Street",
  "Greenwich", "Kino Lorber", "Oscilloscope",
  "Dogwoof", "Autlook", "Criterion",
];
```

### RSS Feed URLs (Confirmed)

| Publication | Feed URL | Scope |
|-------------|----------|-------|
| Deadline (acquisitions) | `https://deadline.com/category/acquisitions/feed/` | Deal articles only |
| Deadline (film) | `https://deadline.com/v/film/feed` | All film news |
| Deadline (business) | `https://deadline.com/v/business/feed` | Business/deals |
| Variety (film) | `https://variety.com/v/film/feed` | All film news |
| Variety (global) | `https://variety.com/c/global/feed` | International |
| IndieWire (all) | `https://www.indiewire.com/feed/rss/` | Everything |
| IndieWire (film) | `https://www.indiewire.com/c/film/feed` | Film category |
| The Wrap (deals) | `https://www.thewrap.com/industry-news/deals-ma/feed/` | Deals & M&A (inferred) |
| Screen Daily (full) | `https://www.screendaily.com/full-rss` | All sections (likely truncated behind paywall) |

### IndieWire Festival Roundup Articles (Historical)

These are the single highest-value extraction targets — one URL, many deals:

| Festival | Year | URL |
|----------|------|-----|
| Sundance | 2026 | `indiewire.com/news/festivals/sundance-2026-movies-sold-so-far-1235174095/` |
| Sundance | 2025 | `indiewire.com/news/festivals/sundance-2025-movies-sold-1235086958/` |
| Sundance | 2024 | `indiewire.com/news/festivals/sundance-2024-film-festival-acquistions-1234940243/` |
| Sundance | 2023 | `indiewire.com/feature/sundance-2023-movie-deals-complete-list-1234789495/` |
| Sundance | 2022 | `indiewire.com/features/general/sundance-2022-acquisitions-festival-deals-1234686428/` |
| Sundance | 2021 | `indiewire.com/feature/sundance-2021-film-acquisitions-1234605127/` |
| Fall (Venice/TIFF/Telluride) | 2025 | `indiewire.com/news/festivals/sales-so-far-fall-festivals-venice-tiff-telluride-1235147778/` |
| Fall (Venice/TIFF) | 2023 | `indiewire.com/news/festivals/2023-fall-festival-acquisitions-venice-tiff-1234898651/` |

### Apify Actors for Pipeline

| Actor | Cost | Purpose |
|-------|------|---------|
| `jupri/rss-xml-scraper` | Free | RSS feed parsing (862 users, 99.8% success) |
| `primeparse/rss-aggregator` | $0.001/result | RSS aggregation + keyword filtering + AI summaries |
| `universal_scraping/universal-article-scraper` | $0.00001/result | Full article extraction with URL pattern filtering |
| `proscraper/newsarticlescraper` | $0.002/result | Simple URL→article for LLM feeding |

### Self-Hosted RSS Tools

| Tool | License | Features |
|------|---------|----------|
| **RSSbrew** | AGPL-3.0 | Aggregation, keyword filtering, AI summaries, daily/weekly digests |
| **FreshRSS** | AGPL-3.0 | Mature, multi-user, keyword search, mobile API |
| **Tiny Tiny RSS** | GPL-3.0 | Keyword filters, labels, plugin system |

### Wayback CDX API Reference

```
Endpoint: http://web.archive.org/cdx/search/cdx
Rate limit: 60 req/min (HTTP 429 → escalating IP blocks)

Key params:
  url (required)    — target URL or prefix
  output=json       — JSON response format
  fl=timestamp,original,statuscode — select fields
  from=20200101     — start date
  to=20261231       — end date
  matchType=prefix  — URL prefix matching
  filter=statuscode:200 — only successful pages
  collapse=timestamp:8  — deduplicate (one per day)
  limit=100         — cap results
  showResumeKey=true / resumeKey=<key> — pagination

Content access: https://web.archive.org/web/<TIMESTAMP>/<URL>
```

---

## Cost Estimates

### Real-Time Monitoring (Ongoing)

| Component | Cost |
|-----------|------|
| RSS aggregation (RSSbrew, self-hosted) | $0 |
| Apify article scraper (~200 articles/mo if needed) | $0-4/mo |
| Claude Haiku extraction (~100 deal articles/mo) | $1-5/mo |
| **Total** | **$1-9/mo** |

### Historical Corpus (One-Time)

| Component | Cost |
|-----------|------|
| CDX API URL enumeration | $0 |
| Wayback content fetch | $0 |
| Claude extraction (~5,000 historical articles) | $50-250 |
| **Total** | **$50-250 one-time** |

### Optional Paid Supplements

| Source | Cost | Value Add |
|--------|------|-----------|
| Screen Daily subscription | Unknown (enterprise) | Territory-level MGs, pre-sales |
| Cinando manual access | €149/yr | Sales agent lookup, territory availability |
| OpusData web access | $19/mo | Supplements `get_financials` |
| Vitrina AI free tier | $0 (200 credits) | Explore deal flow tracking capability |

---

## Implementation Phases

### Phase 1: IndieWire Roundup Extraction (Highest ROI, Lowest Risk)

Extract structured deal data from IndieWire's festival roundup articles (2021-2026). These are free, publicly accessible, and contain the densest deal data per URL.

**Deliverables:**
- LLM extraction prompt with `DealExtraction` Zod schema
- Script to fetch roundup articles (Wayback or direct) and extract deals
- JSON output: structured deal records for ~6 years of Sundance + fall festivals
- Estimated yield: 150-300+ deals across 8+ roundup articles

**Architecture question:** MCP tool, standalone script, or Claude Code skill? Likely a skill in M17.

### Phase 2: RSS Deal Monitoring Pipeline

Set up real-time monitoring of trade press RSS feeds for new deal announcements.

**Deliverables:**
- RSS feed aggregation (RSSbrew or Apify `rss-aggregator`)
- Keyword filter configuration (DEAL_KEYWORDS)
- LLM extraction pipeline: RSS item → Claude tool_use → DealExtraction JSON
- Storage: JSON files initially, Neo4j when persistence layer ready

**Depends on:** M17 plugin architecture (skills layer)

### Phase 3: Historical Corpus via Wayback

Build a historical deal database from archived trade press articles.

**Deliverables:**
- CDX API enumeration script for Deadline acquisitions, IndieWire festival articles
- Content fetcher with rate limiting (60 req/min)
- LLM extraction at scale
- Estimated yield: 1,000-5,000 deal records going back to ~2015

### Phase 4: LUMIERE European Data Integration

Import European theatrical admissions data.

**Deliverables:**
- LUMIERE Excel download + parse script
- Match films to TMDB IDs
- Store in Neo4j with territory-level admissions data
- Ongoing: periodic re-download for new data

### Phase 5: Evaluate Paid Supplements

Assess whether paid sources add enough value:

- [ ] Vitrina AI: register free tier (200 credits), test deal flow queries for doc films
- [ ] OpusData: evaluate $19/mo web tier vs. existing `get_financials` coverage
- [ ] Screen Daily: inquire about subscription pricing, assess territory data value
- [ ] Cinando: evaluate €149/yr for manual sales agent research

---

## Open Questions

1. **Architecture:** Should deal extraction be MCP tools (this repo), Claude Code skills (M17), or standalone scripts? Likely skills — deal extraction is a workflow, not a single-query tool.

2. **Storage:** JSON files → Neo4j is the planned path. When does Neo4j become necessary? Probably Phase 2 (ongoing monitoring needs a queryable store).

3. **PMC legal risk:** RSS consumption is defensible, but should we avoid storing/redistributing extracted deal data from PMC properties? The data itself (deal facts) isn't copyrightable, but the expression is.

4. **Screen Daily:** Is the subscription worth it for manual research even without programmatic access? It has the best territory-level data by far.

5. **Deduplication:** Multiple outlets report the same deal. How do we detect and merge duplicate deal records? TMDB movie ID + buyer is probably the natural key.

---

## Raw Research

All source research preserved in `.firecrawl/m20-trade-press/raw-research/`:

```
raw-research/
  research-summary.md           — Comparative analysis of all 5 trade publications
  pmc-legal-risk.md             — PMC v. Google lawsuit details
  publications/
    deadline-research.md        — URLs, feeds, deal article examples
    variety-research.md         — URLs, feeds, VIP+ details
    screendaily-research.md     — Paywall, territory deal data quality
    thewrap-research.md         — WrapPRO, deals category
    indiewire-research.md       — Roundup article URLs, doc coverage
  platforms/
    cinando-feasibility-research.md  — Cinando, Film Catalogue, Festival Scope, Vitrina AI, Filmhub, Reelport
    research-findings.md             — Festival markets, deal trackers, sales agent DBs, LUMIERE, Wayback CDX
  tooling/
    technical-tooling-research.md    — Apify actors, CDX API docs, RSS tools, LLM extraction approaches, structured data analysis
```
