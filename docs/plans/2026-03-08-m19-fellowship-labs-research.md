# M19 Documentary Fellowships, Labs & Programs — Deep Research

Date: 2026-03-08

## Purpose

Comprehensive landscape survey of documentary film fellowships, labs, development programs, funding sources, and doc-specific awards ceremonies. Three dimensions: (1) wide scope inventory, (2) current operational state, (3) data harvesting feasibility for the film-data-mcp project.

## Critical Context: Post-CPB Landscape

The Corporation for Public Broadcasting (CPB) dissolved January 5, 2026 after July 2025 rescission eliminated FY2026-2027 funding (~$535M annually). NEA and NEH face proposed elimination with 50%+ of open awards terminated. This fundamentally altered the documentary funding ecosystem:

- **Severely impacted:** ITVS (open calls on hold, completing 40-film pipeline), all National Multicultural Alliance members (Black Public Media, CAAM, LPB, PIC, Vision Maker Media), NEA, NEH
- **Stable (privately funded):** Ford/JustFilms, MacArthur, Sundance, Creative Capital, Guggenheim, Catapult, Chicken & Egg, Firelight, Perspective Fund
- **Defunct:** CPB, Tribeca Film Institute (2020), Archidoc/La Fémis, Hartley Film Foundation
- **Ambiguous:** Cinereach (GuideStar says terminated, website still live)

---

## Part 1: US Documentary Labs & Development Programs

### Sundance Documentary Fund
- **Org:** Sundance Institute
- **Status:** Active
- **Offering:** Unrestricted non-recoupable grants. ~$1.5M total pool (2025). Up to $20K development; higher for production/post. 30-40 projects/year.
- **Selectivity:** ~1,200 proposals/year; 30-40 funded (~3%). 45% of 2025 grantees first-time feature directors.
- **Cycle:** Rolling open call, decisions 4x/year (3-5 month turnaround)
- **Data access:** Annual blog posts on sundance.org list each year's grantees (title, director, country, stage). No unified database. ~5 years of posts scrapable, older via Wayback.
- **Scraping:** Medium — consistent blog post format, no anti-scrape measures
- **URL:** https://www.sundance.org/programs/documentary-film/

### Sundance Documentary Edit Residency (formerly Edit and Story Lab)
- **Status:** Active (restructured 2025 — residential retreats → partner institution residencies at MassMOCA, Jacob Burns)
- **Offering:** Week-long residency with mentors. No direct funding. ~2-4 film teams + ~4 contributing editor fellows/year.
- **Data access:** Blog posts and press releases. Tiny cohorts — manual entry viable.
- **Scraping:** Easy (small dataset)
- **URL:** https://www.sundance.org/blogs/tag/documentary-edit-and-story-lab/

### Sundance Catalyst
- **Status:** Active
- **Offering:** Curated financing marketplace (not a grant). 8-10 projects/forum. $30M+ raised across ~90 projects over 6+ years. Funders contribute $10K-$1M.
- **Data access:** **Intentionally private.** Slate kept confidential. Would require trade press mining.
- **Scraping:** Hard — data doesn't exist publicly by design
- **URL:** https://www.sundance.org/initiatives/catalyst/

### Film Independent Documentary Lab (now "Documentary Story Lab" + "Documentary Producing Lab")
- **Status:** Active — both labs accepting applications for 2026
- **Offering:** Story Lab: 1-week intensive May (LA). Producing Lab: 2-week intensive October. 6-12 fellows per lab/year. Cayton-Goldrich Fellowship: $10K grant.
- **Data access:** Annual blog posts + **Talent Guide at filmindependent.org/talent/** — searchable directory of ALL program alumni across all FI programs. This is the single most valuable US lab data source.
- **Scraping:** Medium — Talent Guide is a structured web app
- **URL:** https://www.filmindependent.org/programs/artist-development/documentary-lab/

### Film Independent Project Involve
- **Status:** Active (Year 33, 2026)
- **Offering:** Free 9-month diversity pipeline program (Jan-Oct, LA). 27-33 fellows/year. 1,000+ total alumni. Notable: Jon M. Chu, Lulu Wang, Justin Simien.
- **Data access:** Talent Guide + 30+ years of cohort blog posts
- **Scraping:** Medium-Easy — 1,000+ alumni in structured Talent Guide
- **URL:** https://www.filmindependent.org/programs/project-involve/

### Film Independent Fast Track
- **Status:** Active (23rd edition)
- **Offering:** 4-day financing market (November). 15-16 projects/year. Notable alumni: Minding the Gap, Chloé Zhao.
- **Data access:** Annual press releases + Talent Guide. ~350 total projects over 23 years.
- **Scraping:** Medium
- **URL:** https://www.filmindependent.org/programs/artist-development/fast-track/

### Film Independent Directing Lab
- **Status:** **On hiatus** until further notice
- **Data access:** Historical data via Talent Guide
- **URL:** https://www.filmindependent.org/programs/artist-development/directing-lab/

### The Gotham (formerly IFP)
- **Status:** Active
- **Offering:** Project Market (90-142 projects/year), Documentary Development Initiative with HBO ($50K grants for BIPOC/LGBTQ+/disability storytellers, 6-10/cohort), Gotham EDU, Fiscal Sponsorship. 40+ years, 10,000+ projects, 30,000+ filmmakers.
- **Data access:** Project Market slates published as structured HTML pages per year (e.g., `/gotham-week/project-market/slate-2024/`). Best-structured market data of any US program.
- **Scraping:** Easy — consistent structured HTML, 90-142 projects/year
- **URL:** https://thegotham.org/

### ITVS (Independent Television Service)
- **Status:** **Severely impacted** (CPB dissolution). Open calls on hold. Completing 40-film pipeline. One more Independent Lens season (2026).
- **Offering (when active):** Open Call up to $400K co-production. Diversity Development Fund up to $25K. Incubator Fund up to $10K. Creator Lab $36K. 1-2% acceptance rate. 1,400+ films funded since 1991.
- **Data access:** itvs.org/projects/ — browsable listing of 1,400+ funded films. Structure unknown without fetching.
- **Scraping:** Medium — pagination handling needed for 1,400+ entries. **Archive urgently before potential shutdown.**
- **URL:** https://itvs.org/

### Good Pitch / Doc Society
- **Status:** Active (59 editions across 15 countries)
- **Offering:** Curated pitching forum connecting docs with civil society. $33M+ generated for 400+ film teams. 5,500+ partner orgs.
- **Data access:** **goodpitch.org/project/** — searchable database of 134+ pitched films. Best-structured project database of any impact program.
- **Scraping:** Easy — structured, publicly searchable database
- **URL:** https://goodpitch.org/

### Tribeca Film Institute
- **Status:** **Defunct** (paused Sept 2020, permanently closed Sept 2021)
- **Data access:** Limited — tfiny.org is a tombstone. Wayback Machine + trade press for historical data.
- **Scraping:** Hard — dead source
- **URL:** https://www.tfiny.org/

### A&E IndieFilms
- **Status:** Likely dormant since ~2018-2019. Not a lab/grant — a production/acquisition label (~25 films total).
- **Data access:** Already accessible via TMDB `company_filmography` tool
- **Scraping:** Easy via existing tools

---

## Part 2: Foundation Grants & Fellowships

### Ford Foundation / JustFilms
- **Status:** Active. $4.2M allocated 2024. One of largest doc funders globally.
- **Offering:** $25K-$100K production/post grants. 25-30 projects/year. Open call with ~4-week window.
- **Notable:** 13th, Citizenfour, Hale County, Time, Flee
- **Data access:** **Searchable grants database (2006-present)** at fordfoundation.org/work/our-grants/awarded-grants/grants-database/. Filterable by program area, year, amount. Elasticsearch backend — potentially API-queryable.
- **Scraping:** **Easy** — best-structured foundation data source. Also on ProPublica 990s.
- **URL:** https://www.fordfoundation.org/work/our-grants/justfilms/

### MacArthur Fellowship ("Genius Grant")
- **Status:** Active. $800K/fellow over 5 years. Nomination-only.
- **Offering:** 20-30 fellows/year across all disciplines. ~1-3 filmmakers per class. 1,175 total since 1981.
- **Notable:** Garrett Bradley (2025), Frederick Wiseman, Ken Burns, Laura Poitras, Stanley Nelson
- **Data access:** **Full searchable database at macfound.org/fellows/search** — filterable by year, area, institution. Also PDF directory 1981-2022.
- **Scraping:** Medium — well-structured search pages + PDF
- **URL:** https://www.macfound.org/programs/awards/fellows/

### Creative Capital
- **Status:** Active. Largest commitment in 25-year history: $2.9M to 109 artists (2026).
- **Offering:** Up to $50K unrestricted project grants. Film/video is one category. 1,000+ total awardees since 1999.
- **Notable:** Garrett Bradley, Laura Poitras, Yance Ford, Reid Davenport
- **Data access:** Awardee Index at creative-capital.org/awardee-index/ — browsable by year. No API.
- **Scraping:** Medium — structured HTML index
- **URL:** https://creative-capital.org/creative-capital-award/

### United States Artists Fellowship
- **Status:** Active. $50K unrestricted. Nomination-based. ~50/year across 10 disciplines including Film.
- **Notable:** Barry Jenkins (2012), Laura Poitras (2010)
- **Data access:** Year-by-year pages. Wikipedia list most comprehensive.
- **Scraping:** Medium — Wikipedia list well-structured
- **URL:** https://www.unitedstatesartists.org/programs/usa-fellowship

### Guggenheim Fellowship
- **Status:** Active. Film-Video is a recognized discipline. ~198 fellows/year across 53 disciplines. 19,000+ total since 1925.
- **Data access:** Searchable fellows directory at gf.org/fellows. Century of data.
- **Scraping:** Medium — paginated web directory
- **Note:** Already in film-data-mcp awards registry (M13) via Wikidata P166 + qualifier SPARQL
- **URL:** https://www.gf.org/fellows

### Catapult Film Fund
- **Status:** Active. Record 2,000 submissions in 2025. ~1% acceptance rate.
- **Offering:** Development up to $25K (15 grants/year), Research $10K (3/year), Technology & Society Accelerator up to $50K (4/year, Luminate partnership). $550K+/year total.
- **Data access:** Grantee lists on website by program. Annual press releases.
- **Scraping:** Medium — structured grantee pages
- **URL:** https://catapultfilmfund.org/

### Chicken & Egg Films (formerly Pictures)
- **Status:** Active (rebranded Oct 2024, expanded to all gender-expansive filmmakers Jan 2024)
- **Offering:** (Egg)celerator Lab: $40K + year-long mentorship (9 projects/year). R&D Grant: $450K pool, 29 grantees (Netflix-supported). $15M+ to 500+ filmmakers since 2005.
- **Data access:** Annual cohort announcements via press releases/news. AlumNest (300+ alumni) is private.
- **Scraping:** Medium — annual news posts, ~15 years of data
- **URL:** https://chickeneggfilms.org/

### Firelight Media Documentary Lab
- **Status:** Active (15th year). Launching Firelight Fund.
- **Offering:** 18-month fellowship, $25K/project. Filmmakers of color, 1st/2nd feature. ~150 filmmakers over decade.
- **Notable:** Jessica Kingdon (Ascension, Oscar-nom), Hummingbirds (Berlinale Grand Prix)
- **Data access:** Cohort announcements on Medium blog (firelightmedia.medium.com). ~8 well-structured posts.
- **Scraping:** Easy — small cohorts, well-documented
- **URL:** https://www.firelightmedia.tv/programs/documentary-lab

### Perspective Fund
- **Status:** Active. **Invitation-only** — no public applications. 80+ films, 75+ orgs funded.
- **Data access:** Minimal public data. ProPublica 990s are best source.
- **Scraping:** Hard — private by design
- **URL:** https://www.perspectivefund.org/

### Cinereach
- **Status:** **Ambiguous** — GuideStar says terminated, website live, not accepting submissions. 2021 pivot to "story incubator." $1.5M Sundance partnership.
- **Notable:** Beasts of the Southern Wild, The Florida Project, I Am Not Your Negro, Pariah
- **Data access:** Wikipedia lists supported films. Small dataset.
- **Scraping:** Medium — Wikipedia
- **URL:** https://www.cinereach.org/

### LEF Foundation / Moving Image Fund
- **Status:** Active. Regional (New England only). 500+ grants, $5.5M+ since 2001.
- **Offering:** Pre-production $5K, Production $15K, Post-production $25K. FY2026: $322.5K.
- **Data access:** News page with annual grant announcements. Consistent format.
- **Scraping:** Medium
- **URL:** https://lef-foundation.org/moving-image-fund/

### Rockefeller Foundation
- **Status:** Active but **no dedicated film program**. Only film-adjacent offering: Bellagio Center Residency.
- **Data access:** No structured grantee database for film.
- **Scraping:** Hard — irrelevant for doc-specific data
- **URL:** https://www.rockefellerfoundation.org/

### Hartley Film Foundation
- **Status:** **Likely defunct** (GuideStar: terminated)

### Impact Partners
- **Status:** Active. Equity investment model (not grants). $100K-$300K typical. 150+ films.
- **URL:** https://impactpartnersfilm.com/

### SFFILM Documentary Film Fund
- **Status:** Active. $10K-$20K for 3-6 post-production projects/year. $900K+ since 2011.
- **URL:** https://sffilm.org/documentary-film-fund/

---

## Part 3: Identity-Based Public Media Funders

All CPB-dependent. All severely impacted by January 2026 dissolution.

| Organization | Status | Key Programs | Data Access |
|---|---|---|---|
| **Black Public Media** | ~50% budget lost. AfroPoP suspended. | Open Call, 360 Incubator+, PitchBLACK, Jacquie Jones Fund (up to $300K) | Good — funded works catalog at blackpublicmedia.org |
| **CAAM** | Main Doc Fund paused. $15M capital campaign ($8M raised). | Documentary Fund, Building Bridges Fund ($1M, still active) | Moderate — program pages |
| **Latino Public Broadcasting** | ~69% of FY25 budget lost. Fellowship suspended. | Public Media Content Fund, Digital Media Fund | Limited |
| **Pacific Islanders in Communications** | Continuing with planned open calls | Media Fund, Shorts Fund, Ferrer Fellowship | Limited |
| **Vision Maker Media** | Cut 2 employees. Training continuing. | Public Media Fund ($10K-$100K), Acquisitions Fund | Limited |

---

## Part 4: Federal Agencies

### NEA (National Endowment for the Arts)
- **Status:** Under threat of elimination. 50%+ of open awards terminated May 2025.
- **Offering:** Grants for Arts Projects (Media Arts): $10K-$100K. Orgs only.
- **Data access:** **EXCELLENT** — searchable database at apps.nea.gov/grantsearch (1998-present). **Built-in Excel/text export.** Also on USASpending.gov.
- **Scraping:** **Easy** — structured export in multiple formats. Federal public domain.
- **URL:** https://apps.nea.gov/grantsearch/

### NEH (National Endowment for the Humanities)
- **Status:** DOGE restructuring April 2025. ~1,400 grants ($427M) terminated.
- **Offering:** Media Projects: development + production grants for docs. 500+ films since 1965, 6 Oscar noms, 30 Peabodys, 27 Emmys.
- **Data access:** **EXCELLENT** — award search at apps.neh.gov/publicquery (FY1966-present). **CC0 public domain license.** Includes linked product/outcome data.
- **Scraping:** **Easy** — CC0, structured, product linkage. Gold standard for openness.
- **URL:** https://apps.neh.gov/publicquery/

---

## Part 5: Documentary-Specific Awards Ceremonies

### Tier 1: Strong Wikidata Presence (Potentially SPARQL-Harvestable)

| Ceremony | Wikidata QID | Est. P166 Claims | Wikipedia Tables | Years | Notes |
|---|---|---|---|---|---|
| **Critics' Choice Documentary Awards** | Q98079026 | Likely (edition QIDs exist) | Yes | 2016-present (10 yrs) | 18 categories. Strongest Wikidata presence of any doc-specific ceremony |
| **News & Documentary Emmy Awards** | Q11247971 | Likely (strong) | Yes, excellent | 40+ years | ~15 doc-specific categories. **Different org from Primetime** (NATAS vs Television Academy). Most data-rich target. |
| **National Board of Review (Best Doc)** | Q1169140 | Yes (confirmed) | Yes, complete | 1940-present | 2 categories only (Best Doc + Top 5) |
| **duPont-Columbia Awards** | Q4722910 | Possible | Per-year pages | 1942-present | "Broadcast Pulitzer." Doc-eligible since 2012 |

### Tier 2: Wikidata QID Exists, Category QIDs Unlikely

| Ceremony | Wikidata QID | Categories | Years | Scraping Path |
|---|---|---|---|---|
| **Cinema Eye Honors** | Q5120729 | ~17 | 2008-present (19 yrs) | Wikipedia tables + cinemaeyehonors.com/history/ |
| **IDA Documentary Awards** | Q96206663 | ~15 | 1984-present (41 yrs) | documentary.org/awardsYYYY/nominees (predictable URLs) |
| **Grierson Awards** (UK) | Q5608702 | ~16 | 1972-present | griersontrust.org + legacy site |
| **Sheffield DocFest** | Q7492660 | ~7 | 1994-present | sheffdocfest.com/news/ |
| **Thessaloniki Doc Fest** | Q7783470 | ~15+ (EUR prizes) | 1999-present | filmfestival.gr + IMDb ev0001068 |
| **Full Frame** | Q5508052 | 9 ($45K total) | 1998-present | fullframefest.org/award-winners/ |
| **DOC NYC** | Q18349859 | ~12 | 2010-present | docnyc.net/awards/ |
| **RIDM** | Q3425197 | ~12 | 1998-present | ridm.ca + IMDb ev0003414 |
| **Ji.hlava IDFF** | Needs lookup | 7+ sections | 1997-present | ji-hlava.com (some Czech) |
| **Camden/CIFF** | Q5025786 | Small set | 2005-present | pointsnorthinstitute.org |
| **True/False** | Q7847299 | 1 only | 2004-present | Low value |
| **AFI DOCS** | Q7516681 | Few | 2003-2022 | **Defunct** (merged into AFI Fest) |

### Tier 3: No Awards Data to Harvest

RFK Journalism Awards (docs mixed into broadcast categories), Flaherty Seminar (convening, not awards)

### Key Finding

The "big 3" doc-specific ceremonies are **Cinema Eye Honors, IDA Documentary Awards, and Critics' Choice Documentary Awards**. Of these, Critics' Choice has the strongest Wikidata presence, and News & Documentary Emmys (separate from Primetime) are the most data-rich overall target with 40+ years of well-structured Wikipedia tables.

---

## Part 6: International Programs & Markets

### Tier 1: Structured Archives (Best Scraping Targets)

| Program | Country | Type | Archive Depth | Est. Records | Notes |
|---|---|---|---|---|---|
| **IDFA Bertha Fund** | NL | Grants | 1998-present | 600+ films | Browsable collection at professionals.idfa.nl |
| **IDFA Forum** | NL | Market | 1993-present | 30+ years | HTML catalogues, Internet Archive backups |
| **CPH:FORUM** | DK | Market | ~2011-present | 500+ projects | cphdox.dk/cphforum-projects/ |
| **Berlinale World Cinema Fund** | DE | Grants | 2004-present | 350+ films | berlinale.de/en/wcf/funded-projects.html |
| **Doha Film Institute Grants** | QA | Grants | 2010-present | 600+ films | dohafilminstitute.com/financing/projects/grants |
| **DOKweb** | CZ | Aggregator | Multi-year | Multi-program | **Single richest structured source for European programs.** Aggregates Ex Oriente, East Doc Platform, etc. |
| **Visions du Réel** | CH | Market/Lab | 2011-present | Multi-year | Archives by year and activity type |
| **DOK Leipzig Co-Pro** | DE | Market | 2019-present | ~245 projects | Structured archive, pre-2019 by email |

### Tier 2: Annual Listings, Some Archive

| Program | Country | Type | Notes |
|---|---|---|---|
| **Sheffield MeetMarket** | UK | Market | 20 years. Past projects listed 2022-2025. Notable: Act of Killing, Searching for Sugar Man |
| **IDFA DocLab** | NL | Exhibition | 2007-present. Projects in searchable IDFA archive |
| **CPH:LAB** | DK | Lab | Annual. cphdox.dk/lab-projects/ |
| **Ex Oriente Film** | CZ | Workshop | Data via DOKweb |
| **Durban FilmMart** | ZA | Market | Project dossiers published. Ford Foundation partnership |
| **Thessaloniki Agora** | GR | Market | 14 pitching + 10 docs in progress/year |
| **WEMW (Trieste)** | IT | Market | 500+ professionals, structured press releases |
| **Hot Docs Forum** | CA | Market | **Paused 2025, returning 2026.** hotdocs.ca selected projects page |
| **FIPADOC** | FR | Market | 24 project teams, 60+ funders. Growing |

### Tier 3: Press Releases Only

| Program | Country | Notes |
|---|---|---|
| **Berlinale Talents** | DE | 200/year from 3,400+ applicants. Mixed fiction/doc |
| **Berlinale Co-Production Market** | DE | ~35 projects/year. Recent years only |
| **EURODOC** | FR | 1,800+ alumni, 75 countries. Alumni DB "coming soon" |
| **Hot Docs Blue Ice Fund** | CA | African docs. CAD 120K to 8 projects (2025) |
| **Hot Docs Deal Maker** | CA | 36 projects in 2025 |

### Tier 4: No Accessible Data

Sunny Side of the Doc (cancelled Dec 2025, revived Feb 2026), Asian Side of the Doc (uncertain), Baltic Sea Docs, ZagrebDox Pro, EDN (membership network), DocsMX, Docs By the Sea, Dhaka DocLab, Documentary Campus, ESoDoc (on hold)

### Status Notes
- **Hot Docs CrossCurrents Fund:** Folded/paused (per Cost of Docs 2025/2026 report)
- **Archidoc (La Fémis):** Terminated (lost Creative Europe funding)
- **Sunny Side of the Doc:** Cancelled Dec 2025, revived Feb 2026 via Documentary Campus partnership (3 days, down from 4)

---

## Part 7: Emerging & Niche Programs

### Active Programs

| Program | Focus | Scale | Data Value |
|---|---|---|---|
| **Field of Vision** | Short doc commissions (Laura Poitras) | 90+ shorts via IF/Then since 2017 | Medium — film catalog on website |
| **IF/Then Shorts** (Field of Vision) | Short doc fund + mentorship (was TFI, moved to FoV) | $25K/team, 4 teams/cycle. Hulu partnership ($100K grants) | Low — scattered press |
| **Brown Girls Doc Mafia** | BIPOC women/gender-expansive doc community | 5,000+ members. Sustainable Artist Fellowship (3/year) | Low — fellowship recipients in press |
| **Kartemquin Films** | Chicago doc collective | DVID (BIPOC Midwest), Hulu Accelerator ($30K), Documentary Lab ($25K) | Low — small programs |
| **Working Films** | Impact-focused doc | Impact Kickstart (7th year), Docs in Action | Low — partnerships, not awards |
| **Docs In Progress** | DC area support | Screening series, Filmmaker Residency (1/year), Peer Pitch | Low |
| **UnionDocs** | Brooklyn experimental doc lab | CoLAB (10-month, 12 artists/year) | Low — artistic lab |
| **Flaherty Seminar** | Immersive week-long screening/discussion | 69th in 2024. 1,200+ recordings at NYU archives | Low for this project — convening, not awards |
| **Points North Fellowship** | Emerging doc filmmaker support | 3 tracks, 16 projects total | Low — small, press-based |
| **Garrett Scott Grant** (Full Frame) | First-time feature doc filmmakers | 2/year. Notable: RaMell Ross, Bing Liu, Lyric R. Cabral | Low volume but remarkable alumni |
| **IDA Enterprise Fund** | Investigative/journalistic doc | $5M+ to 79 projects since 2017. Up to $100K/grant. **Paused for 2025 review.** | Low — press releases |
| **Sundance Stories of Change** | Doc × social entrepreneurship (with Skoll Foundation) | Ongoing since 2008. Grants + convenings. | Low — niche |
| **Cinereach** | See Part 2 above | | |

---

## Part 8: Data Harvesting Feasibility Summary

### Tier 1: Excellent (Structured, Exportable, Public Domain)

| Source | Format | Coverage | Priority |
|---|---|---|---|
| **NEH Award Search** | Searchable DB, CC0 license | FY1966-present, 500+ films | Highest |
| **NEA Grant Search** | Excel/text export | 1998-present (Media Arts) | Highest |
| **Ford Foundation Grants DB** | Elasticsearch API backend | 2006-present | Highest |
| **USASpending.gov** | REST API + bulk download | All federal arts grants | High |

### Tier 2: Good (Searchable Web Databases, No Bulk Export)

| Source | Format | Coverage | Priority |
|---|---|---|---|
| **MacArthur Fellows** | Search + PDF directory | 1981-present (1,175+) | High |
| **Guggenheim Fellows** | Web directory | 1925-present (19,000+) | Medium (already in registry via Wikidata) |
| **Creative Capital Awardee Index** | HTML index | 1999-present (1,000+) | Medium |
| **Film Independent Talent Guide** | Searchable web app | All programs, 1,000+ alumni | High |
| **Good Pitch Project DB** | Searchable web listing | 134+ films | Medium |
| **Black Public Media** | Funded works catalog | Multi-year | Medium (archive urgently) |
| **ITVS Projects** | Browsable listing | 1,400+ films | High (archive urgently) |
| **IDFA Bertha Fund Collection** | Browsable collection | 600+ films since 1998 | High |

### Tier 3: Moderate (Structured HTML Archives, Per-Year)

| Source | Format | Coverage | Priority |
|---|---|---|---|
| **IDFA Forum Catalogues** | HTML per year | 30+ years | High |
| **CPH:FORUM Projects** | HTML per year | 15+ years, 500+ projects | High |
| **DOKweb** | Aggregator DB | Multi-program European | High |
| **Berlinale WCF** | HTML funded projects | 350+ films since 2004 | Medium |
| **Doha Film Institute** | HTML project pages | 600+ films since 2010 | Medium |
| **The Gotham Market Slates** | HTML per year | 90-142 projects/year | Medium |
| **Visions du Réel** | HTML by year/activity | 2011-present | Medium |
| **DOK Leipzig Co-Pro** | HTML archive | 2019-present | Low |
| **Sheffield MeetMarket** | HTML per year | 20 years | Low |

### Tier 4: Press Release Mining (Consistent but Unstructured)

Sundance Doc Fund, Firelight Media, Chicken & Egg Films, Catapult Film Fund, LEF Foundation, Points North, IDA Enterprise Fund, Berlinale Talents, EURODOC, Hot Docs programs

### Tier 5: Poor/Inaccessible

Sundance Catalyst (private by design), Perspective Fund (invitation-only), Rockefeller (no film DB), Hartley (defunct), most small programs

### ProPublica 990s as Universal Backup

ProPublica Nonprofit Explorer (projects.propublica.org/nonprofits) has 990 tax data for ALL private foundations, including Schedule I grantee lists. Universal backup source for any foundation's giving history.

---

## Part 9: Awards Ceremonies — Wikidata Viability

### Recommended for SPARQL Verification

These ceremonies have Wikidata QIDs and plausible P166 claim density. Worth running targeted SPARQL queries:

1. **Critics' Choice Documentary Awards (Q98079026)** — edition QIDs exist, strongest doc-specific Wikidata presence
2. **News & Documentary Emmy Awards (Q11247971)** — separate from Primetime (NATAS vs TV Academy), likely strong P166
3. **National Board of Review Best Doc (Q1169140)** — P166 confirmed, Wikipedia complete 1940-present
4. **duPont-Columbia Awards (Q4722910)** — broadcast Pulitzer equivalent, doc-eligible since 2012
5. **Grierson Awards (Q5608702)** — UK doc awards since 1972

### Wikipedia Scraping Candidates (Wikidata P166 Likely Sparse)

For these, Wikipedia table extraction is the realistic data path, not Wikidata SPARQL:

1. **Cinema Eye Honors** — ~17 categories, 19 years, Wikipedia has per-year articles
2. **IDA Documentary Awards** — ~15 categories, 41 years, documentary.org has predictable URLs
3. **Thessaloniki Doc Fest** — ~15 awards (EUR prizes), IMDb event data
4. **Full Frame** — 9 awards, 27 years
5. **DOC NYC** — ~12 awards, 15 years

---

## Part 10: Strategic Recommendations

### Immediate Actions (Archive Before Shutdown)
1. Archive ITVS /projects/ page (1,400+ films) — CPB dissolution means potential shutdown
2. Archive Black Public Media funded works catalog
3. Archive CAAM program data
4. Archive CPB.org content

### Highest-Value Data Sources for film-data-mcp
1. **NEH Award Search (CC0)** — 60 years of documentary grant history, public domain, structured
2. **Ford Foundation Grants DB** — decade+ of JustFilms grants with Elasticsearch backend
3. **NEA Grant Search** — Excel export, 25+ years of Media Arts grants
4. **Film Independent Talent Guide** — 1,000+ alumni across all programs, searchable web app
5. **IDFA Bertha Fund + Forum** — 600+ funded films + 30 years of market catalogues
6. **DOKweb** — aggregated European program data

### Architecture Implications
- No program offers a public API. All data harvesting requires HTML scraping or PDF parsing.
- **Blog post scraping is the dominant pattern** for US programs (Sundance, Film Independent, Chicken & Egg, Firelight, Catapult). A generic "announcement post scraper" could cover multiple sources.
- **Per-year HTML catalogue scraping** is the dominant pattern for international markets (IDFA, CPH, DOK Leipzig, Sheffield).
- Federal databases (NEA, NEH, USASpending) are the easiest — structured exports and APIs exist.
- **ProPublica 990s** provide a universal backup for foundation grantee data.
- This aligns with M17 skills architecture (Claude Code skills composing data), not new MCP tools.

### M19 Scope Refinement
The original M19 scope (MacArthur, Rockefeller, USA Fellows, Creative Capital — Wikidata viability only) is too narrow. Based on this research, M19 should be reframed:

**Option A: Fellowship Registry Only (Original Scope)**
- SPARQL-verify MacArthur, Creative Capital, USA Fellows
- Confirm Rockefeller is irrelevant (no film program)
- Add Critics' Choice Doc Awards, News & Doc Emmys, NBR Best Doc to awards registry
- Est: 1.5h (original estimate)

**Option B: Comprehensive Data Harvest (New Scope)**
- Everything in Option A
- NEH CC0 data import (structured, public domain — lowest friction)
- NEA Excel export + Ford Foundation Elasticsearch query
- Film Independent Talent Guide scraping
- IDFA/CPH:FORUM archive scraping
- DOKweb aggregator scraping
- Est: 8-12h across multiple milestones

**Option C: Urgent Archival + Selective Harvest**
- Archive at-risk sources (ITVS, BPM, CAAM, CPB) immediately
- NEH + NEA + Ford (structured sources only)
- Wikidata verification for top 5 ceremonies
- Defer unstructured scraping to M17 skills layer
- Est: 3-5h

---

## Sources

Research conducted via web search across 120+ queries. Key meta-sources:
- IDA Grants Directory (documentary.org/grants-directory)
- "75 Active Grants for Documentary Filmmakers" (seanpeoples.me, 2025)
- No Film School Spring 2026 Grants List
- NPR documentary funding coverage (2025-2026)
- Current.org multicultural film funder reporting
- Individual program websites (50+)
- ProPublica Nonprofit Explorer
- USASpending.gov
- Wikipedia (ceremony articles, fellow lists)
