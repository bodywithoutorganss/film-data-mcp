# M15 Talent Representation Data — Research Findings

Date: 2026-03-08

## Purpose

Determine whether viable data sources exist for structured talent representation data — the person → agent/manager/publicist/agency mapping that documentary producers need when reaching out to talent. M15's scope in ROADMAP.md specifies research-first: "Produce findings report before committing to implementation approach."

## Methodology

Investigated every plausible data source across five categories:

1. **Existing project APIs** — TMDB (already integrated), Wikidata SPARQL (already integrated)
2. **IMDb ecosystem** — Free datasets, paid API (AWS Data Exchange), IMDbPro (web)
3. **Agency websites** — CAA, WME, UTA direct API/web presence
4. **Third-party databases** — ContactAnyCelebrity, filmmakers.eu, Apify marketplace, Backstage
5. **Open data** — Academic datasets, GitHub scrapers, Kaggle

For each source, we evaluated: (a) whether representation data exists, (b) whether programmatic access is available, (c) coverage depth for US film/TV professionals, and (d) cost/feasibility for an MCP tool.

---

## Part 1: Source-by-Source Findings

### TMDB API — NO REPRESENTATION DATA

- **Fields available on person endpoint:** `id`, `name`, `biography`, `birthday`, `deathday`, `gender`, `homepage`, `imdb_id`, `known_for_department`, `place_of_birth`, `popularity`, `profile_path`, `also_known_as`, `adult`
- **`homepage` field:** Mostly null. When populated, links to personal websites (e.g., amblin.com for Spielberg, rogerdeakins.com for Deakins), not agency pages.
- **Append options:** `combined_credits`, `movie_credits`, `tv_credits`, `images`, `external_ids` — none include representation.
- **Assessment:** TMDB has no concept of talent representation. No feature requests or community discussions about adding it were found.

### Wikidata P1875 ("represented by") — VIABLE

- **Property:** P1875 — "person or agency that represents or manages the subject"
- **Total film professionals with P1875:** 2,371 distinct people (filtered by P106 occupation = actor, film director, screenwriter, film producer, or cinematographer)
- **Film professionals at actual talent agencies (P31 = Q5354754):** 1,188 distinct people
- **Major US agencies present:**
  - United Talent Agency (Q7893586): 23 clients
  - Creative Artists Agency (Q3002407): 16 clients
  - WME Group (Q1515039): 14 clients
  - ICM Partners (Q4806125): 20 clients
- **Japanese agencies (strong coverage):** Stardust Promotion (45), Smile-Up (41), Amuse (33), Horipro (31), Yoshimoto Kogyo (29)
- **Korean agencies:** BH Entertainment (12), Namoo Actors (23), Artist Company (19)
- **Sample verified data points:**
  - Zendaya → Creative Artists Agency (start date: 2014-03-01)
  - Dwayne Johnson → United Talent Agency
  - Emilia Clarke → Creative Artists Agency
  - Kevin Hart → United Talent Agency
  - Simu Liu → Creative Artists Agency (start date: 2019-01-01)
  - Noah Schnapp → Creative Artists Agency (start date: 2019-01-29)
  - Ciarán Hinds → United Talent Agency
  - Nathan Fielder → United Talent Agency
  - Sarah Silverman → United Talent Agency
- **Qualifiers available:** `pq:P580` (start date) on ~10% of statements. `pq:P582` (end date) rare. No role qualifier (cannot distinguish agent vs. manager).
- **Related properties:**
  - P6275 (copyright representative): 2,579 film professionals — mostly visual artists' rights societies (Artists Rights Society, etc.), not talent agencies
  - P1037 (director/manager): 18 film professionals — nearly unused for personal management
- **Assessment:** Best available free source. Fits our existing Wikidata SPARQL infrastructure. Coverage is thin for US market (~73 people across CAA/WME/UTA/ICM) but includes high-profile names. International coverage (Japan, Korea) is significantly stronger. Data grows over time as Wikidata editors add claims.

### IMDb Bulk Data (paid, AWS) — NO REPRESENTATION DATA

- **Name entity fields:** `nameId`, `remappedTo`, `name`, `awards`, `death`, `filmography`, `knownFor`, `trademarks`
- **Confirmed via:** Data Dictionary documentation at developer.imdb.com
- **Assessment:** The "complete dataset" — the enterprise product at $150K-400K/year — does not include contacts, agents, managers, or any representation data. This is the same data powering the free IMDb site, not IMDbPro.

### IMDb Free Datasets (TSV) — NO REPRESENTATION DATA

- **name.basics.tsv fields:** `nconst`, `primaryName`, `birthYear`, `deathYear`, `primaryProfession`, `knownForTitles`
- **Assessment:** Biographical basics only.

### IMDbPro — HAS DATA, NO PROGRAMMATIC ACCESS

- **Data model (confirmed via IMDb help documentation):**
  - Person → Representatives: talent management, publicity agent, legal representative
  - Company → Employees, Clients, Branches
  - Point agent designation (identifies the specific agent within a firm)
- **Access:** Web-only, behind $20-30/month paywall. No API.
- **Free IMDb site:** Shows "Agent info" and "Contact info" links on person pages, but clicking redirects to pro.imdb.com. The data exists; it's just gated.
- **Scraping feasibility:** No IMDbPro scrapers found on GitHub or Apify marketplace. All IMDb scrapers target the free site (ratings, reviews, filmography). IMDbPro uses aggressive bot detection.
- **Assessment:** Gold standard for representation data. Not viable for an MCP tool without ToS-violating scraping of a paid service.

### ContactAnyCelebrity — HAS DATA, NO API

- **Coverage:** 59,000+ celebrities, influencers, and public figures
- **Data available:** Verified mailing address, agent, manager, publicist, production company, email, phone
- **Pricing:** $39/month or $197/year for unlimited web access
- **Exports:** Custom CSV exports available for "qualified businesses and nonprofits for mass mailings" — requires contacting sales
- **API:** None
- **Assessment:** Closest to a viable third-party source. Has the right data for the right people. But no programmatic access, and the export path is designed for direct mail campaigns, not structured data integration. Would require scraping a subscription service.

### filmmakers.eu API — WRONG MARKET

- **Data model:** REST API with talent agency profiles, employees, IMDb links, contacts
- **API access:** Token-based auth, well-documented
- **Coverage:** ~40,000+ profiles in D/A/CH (Germany/Austria/Switzerland). US & Canada IS a supported region filter, but only ~1 agency is tagged US. Overwhelmingly European.
- **Assessment:** Right data model, wrong geographic coverage. Not useful for US film/TV talent.

### Agency Websites — PARTIAL, NOT SCALABLE

- **CAA:** Has a public JSON API at `wwwapi.caa.com/api/artists/` — but only covers touring/music/comedy talent, not film/TV representation.
- **WME:** Marketing pages only. No public roster or API.
- **UTA:** Marketing pages only. No public roster or API.
- **Assessment:** Agencies don't publish their film/TV client rosters publicly. The CAA touring API is a niche exception for live events booking.

### Apify Marketplace — NO IMDBPRO SCRAPERS

- **IMDb scrapers available:** All target free IMDb — ratings, reviews, filmography, box office. None target IMDbPro.
- **LinkedIn scrapers:** Exist (~$4/1K profiles) but provide employment history, not talent representation relationships.
- **Assessment:** Dead end for representation data.

### Academic/Open Datasets — NOTHING RELEVANT

- **Kaggle "Talent Management Dataset":** HR/corporate talent management, not entertainment.
- **ODSC media datasets list:** Ratings, scripts, subtitles, box office — no representation.
- **GitHub projects:** Multiple IMDb scraping repos, all targeting free site. Zero target IMDbPro contacts.
- **Assessment:** No academic or open dataset captures entertainment industry representation relationships.

---

## Part 2: Structural Analysis

### Why this data is hard to find

Talent representation is commercially valuable information that agencies and industry databases treat as proprietary:

1. **IMDbPro** built its business on being the canonical source for "who reps who." This data is their core product differentiator vs. free IMDb.
2. **Agencies** deliberately don't publish client rosters — representation is a competitive advantage.
3. **Wikidata** captures it incidentally when editors note agency affiliations from news coverage, but there's no organized effort to maintain representation data.
4. **ContactAnyCelebrity** is a manual-research operation with full-time US staff verifying data — they charge because the research is expensive.

### Wikidata P1875 coverage patterns

The data skew tells an interesting story:
- **Japanese agencies dominate** because Japanese entertainment has a strong agency system (jimushō) where agency identity is a core part of public persona. Wikidata editors in this space systematically track agency affiliations.
- **Korean agencies** are well-represented for similar cultural reasons (K-pop/K-drama agency system).
- **US agencies are sparse** because Hollywood representation is treated as private business information. Only the most publicly known relationships (A-listers, entertainment press coverage) get captured.
- **Art distributors inflate the total** — entities like Light Cone (522), Video Data Bank (176), Electronic Arts Intermix (93) are film/video distribution cooperatives, not talent agencies. They're valid P1875 claims but serve a different function.

---

## Part 3: Implementation Recommendation

### Recommended: Build `get_person_representation` on Wikidata P1875

**Why:** It's the only free, programmatic source with structured person → agency data. It fits our existing architecture (SPARQL queries, Wikidata entity resolution from TMDB IDs). Coverage is limited but includes recognizable names and grows over time.

**Proposed tool design:**

```
get_person_representation(tmdb_id, name?)
```

1. Resolve TMDB person → Wikidata entity (reuse existing resolution chain from awards tools)
2. Query P1875 statements with qualifiers:
   - `ps:P1875` → the representing agency/person
   - `pq:P580` → start date
   - `pq:P582` → end date
   - `pq:P3831` → role/capacity (if present)
3. Also query P6275 (copyright representative) as secondary source
4. Classify the representative entity: talent agency (P31=Q5354754), model agency, artist collective, rights society, or individual person
5. Return structured result:
   ```json
   {
     "person": "Zendaya",
     "tmdbId": 505710,
     "wikidataId": "Q189489",
     "representation": [
       {
         "agency": "Creative Artists Agency",
         "agencyWikidataId": "Q3002407",
         "type": "talent_agency",
         "startDate": "2014-03-01",
         "endDate": null,
         "role": null
       }
     ],
     "copyrightRepresentatives": [],
     "coverageNote": "Wikidata coverage is sparse for US talent agencies (~70 people across CAA/WME/UTA/ICM). Results may be incomplete."
   }
   ```

**Engineering effort:** Small. Reuses existing `wikidata-client.ts` resolution chain, `tool-helpers.ts` pattern, and SPARQL query infrastructure. One new tool file, one new SPARQL query template. Estimated: 1 session.

**Honest coverage assessment for users:** The tool should include a `coverageNote` field acknowledging that Wikidata representation data is incomplete, so users don't assume absence of results means absence of representation.

### Deferred: IMDbPro integration

If representation data becomes a critical need, the only path to comprehensive US coverage is IMDbPro. This would require:
- A $20-30/month IMDbPro subscription
- Authenticated web scraping (ToS risk)
- A caching/storage layer (representation data changes infrequently)

This is architecturally possible but ethically and legally questionable. Deferred unless Dayton decides the value justifies the approach.

### Not recommended: ContactAnyCelebrity

- No API means scraping a paid web service
- $39/month + engineering effort for a source with no programmatic interface
- Data format (mailing addresses, phone numbers) is broader than what an MCP tool should expose

---

## Part 4: Scope for M15 Implementation

Based on findings, M15 should be scoped as:

1. **New tool:** `get_person_representation` — Wikidata P1875 SPARQL query with TMDB ID resolution
2. **Registry:** No awards registry analog needed. The SPARQL queries are simple enough to not require a registry of agency QIDs.
3. **Tests:** Unit tests for SPARQL query construction, integration tests against known representations (Zendaya→CAA, Dwayne Johnson→UTA)
4. **Documentation:** Tool added to CLAUDE.md tool table, coverage limitations noted

### What M15 does NOT include

- IMDbPro scraping or integration
- ContactAnyCelebrity integration
- Individual agent/publicist names (Wikidata only has agency-level data)
- Management company data beyond what P1875 captures
