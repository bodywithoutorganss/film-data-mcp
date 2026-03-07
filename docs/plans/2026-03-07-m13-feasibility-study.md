# M13 Awards Registry Expansion — Feasibility Study

Date: 2026-03-07

## Purpose

Determine which candidate ceremonies, fellowships, labs, and grants have sufficient Wikidata coverage (QID existence, P166/P1411 data density) to justify adding to our awards registry. Findings for non-viable candidates are preserved as a reference for future milestones that explore alternative data sources beyond Wikidata SPARQL.

## Methodology

For each candidate, we ran targeted queries against the Wikidata SPARQL endpoint and wbsearchentities API to determine:
1. Whether a Wikidata entity exists
2. What it's an instance of (P31) — award, organization, grant, etc.
3. How many items reference it via P166 (award received) and P1411 (nominated for)
4. Whether award sub-categories exist as linked entities
5. For fellowships/grants, whether alternative properties (P8324 funder, P859 sponsor) provide usable data

Our registry's query model is built on P166/P1411. Entities that aren't referenced via these properties require either a new query model or are not viable for the SPARQL approach.

---

## Part 1: Documentary Ceremonies

### Peabody Awards — VIABLE

- **QID:** Q838121
- **Instance type:** Award (single award, no sub-categories)
- **P166 count:** 446 (283 humans, 40 TV series, 6 films, rest are orgs/stations)
- **P1411 count:** 0 (by design — Peabody uses a select committee with no public nomination shortlist)
- **Categories found:** 0 (single award — no sub-categories needed)
- **Assessment:** Best ceremony candidate. 446 recipients is strong data density. Trivial to add — one ceremony entry, one award category entry. Only caveat: no nomination data exists, so P1411 queries will always return 0.
- **Registry work:** 1 ceremony + 1 category. No engineering changes needed.

### Gotham Awards — VIABLE

- **QID:** Q1538791 (Gotham Independent Film Awards)
- **Instance type:** Award ceremony
- **P166 count:** 19
- **P1411 count:** 4
- **Categories found:** 12-15, including documentary-specific categories:
  - Best Documentary: Q20978457
  - Breakthrough Nonfiction Series: Q109259295
  - Plus categories for Best Feature, Breakthrough Director, Best International Film, Audience Award, etc.
- **Assessment:** Rich category structure with doc-specific entries. Total data density is low (23 combined claims) but the QIDs are verified and the structure is growing. Worth adding for independent/documentary film coverage.
- **Registry work:** 1 ceremony + 10-15 categories. No engineering changes needed. Some categories may have German-language duplicate entities — verify during implementation.

### Emmy Documentary Categories — VIABLE (extends existing entry)

- **Parent QID:** Q1044427 (Primetime Emmy Awards) — already in our registry as `emmys`
- **P166 count:** 9 (across all 7 categories)
- **P1411 count:** 4
- **Category QIDs found (7):**
  - Outstanding Documentary or Nonfiction Special: Q24895159
  - Outstanding Directing for Documentary/Nonfiction Programming: Q24895051
  - Outstanding Cinematography for Nonfiction Programming: Q24900788
  - Outstanding Writing for Nonfiction Programming: Q25345783
  - Outstanding Sound Mixing for Nonfiction Programming: Q30632982
  - Plus 2 additional categories encountered during research but QIDs not captured — verify during implementation
- **Assessment:** Low individual density (0-2 claims per category) but the 5 verified QIDs extend an existing registry ceremony. Low-effort addition.
- **Registry work:** 5 verified + 2 unverified categories under existing `emmys` ceremony. Must verify remaining 2 QIDs via SPARQL before adding (per registry policy). No engineering changes needed.

### Cinema Eye Honors — NOT VIABLE (Wikidata)

- **QID:** Q5120729
- **Instance type:** Award
- **P166 count:** 0
- **P1411 count:** 2
- **Categories found:** 0 (1 unlinked sub-entity, Legacy Award Q136723193, with no P166/P1411 claims and no structural linkage to parent)
- **Assessment:** Entity exists but is a shell — near-zero award data. Not useful for SPARQL queries. This is one of the most important documentary-specific ceremonies (equivalent to Oscars for nonfiction film), making it a high-priority candidate for alternative data sources.
- **Alternative source notes:** Cinema Eye Honors maintains a public website with full winner/nominee history. Web scraping or a structured data import could fill this gap. Annual ceremony since 2008, ~15 categories.

### International Documentary Association Awards (IDA) — NOT VIABLE (Wikidata)

- **QID:** Q96206663
- **Instance type:** "Group of awards"
- **P166 count:** 0
- **P1411 count:** 0
- **Categories found:** 0 (linked to IDA organization via P1027 "conferred by" but no award categories exist)
- **Assessment:** Shell entity with zero data. IDA Awards are a major documentary ceremony — another high-priority candidate for alternative sources.
- **Alternative source notes:** IDA publishes annual winners/nominees. Awards date back to 1984. ~20 categories including Best Documentary Feature, Best Short, Best Director, etc.

### Critics' Choice Documentary Awards — NOT VIABLE (Wikidata)

- **QID:** None — no Wikidata entity exists at all
- **P166 count:** N/A
- **P1411 count:** N/A
- **Search attempts:** 6+ name variants including "Critics Choice Documentary", "Critics' Choice Documentary Awards", "CCDA", and broader Critics' Choice searches. No entity found.
- **Assessment:** Complete absence from Wikidata. Critics' Choice Documentary Awards launched in 2016 and have grown rapidly in Oscar-precursor significance for nonfiction film.
- **Alternative source notes:** Critics Choice Association maintains a website with full history. Annual since 2016, ~14 categories. Relatively short history makes a structured import feasible.

### TIFF Platform Prize — NOT VIABLE (Wikidata)

- **QID:** Q60744554
- **Instance type:** Award category (sub-entity of Toronto International Film Festival)
- **P166 count:** 1
- **P1411 count:** 1
- **Assessment:** Marginal — only 2 total claims. The prize itself is narrow (single award for a TIFF sidebar program). Note: TIFF (Q390018) is already in our registry as the `tiff` ceremony with `tiff-peoples-choice` as an existing category. The Platform Prize could be added as another category under it (similar to how Emmy doc categories extend the existing `emmys` entry), but with only 2 claims the data value is low.
- **Alternative source notes:** TIFF maintains comprehensive records. Adding more TIFF categories (Platform, Discovery, etc.) could be viable via web data to supplement the sparse Wikidata coverage.

---

## Part 2: Fellowships, Labs, and Grants

### Guggenheim Fellowship — VIABLE

- **QID:** Q1316544
- **Instance type:** Fellowship grant, annual event
- **P166 count:** 19,570 total recipients
- **P1411 count:** 0 (fellowships don't have nominations)
- **Film-relevant subset:**
  - 217 people with P101 (field of work) qualifier = Q11424 (film) or Q34508 (video) on their P166 claim
  - 758 people with film-related P106 (occupation) who hold a Guggenheim (broader but less precise)
- **Conferred by:** Q507237 (John Simon Guggenheim Memorial Foundation)
- **Assessment:** Strongest fellowship candidate by far. The P101 qualifier on P166 claims allows precise filtering to film/video fellows. This is new for our query model — we haven't done qualifier-aware SPARQL queries before — but it's straightforward to implement.
- **Engineering work:** Qualifier-aware SPARQL query (filter P166 = Q1316544 WHERE P101 = Q11424). New query pattern, but reusable for any future qualifier-filtered awards.
- **Registry work:** 1 ceremony (type: "fellowship") + 1 category. May want to model the field qualifier as a pseudo-category or filter parameter.

### NEA Fellowship — MARGINAL

- **QID:** Q28911895 (NEA Fellowship)
- **Instance type:** Fellowship grant
- **P166 count:** 246 total recipients
- **P1411 count:** 0
- **Film-relevant subset:** ~13 people with film occupations (P106 filtering)
- **Related entity:** National Medal of Arts (Q1789030) — 330 P166 refs but art-general, not film-specific
- **Assessment:** Technically P166-compatible but negligible film density (~13 people). No field qualifiers on claims, so filtering to film is occupation-based only. Low value for current purposes.
- **Alternative source notes:** NEA publishes grant databases online. A direct data import could capture film-specific grants that aren't in Wikidata.

### Sundance Documentary Fund — NOT VIABLE (Wikidata)

- **QID:** None — no entity exists
- **Parent entity:** Sundance Institute (Q1764307) — nonprofit organization with 1 P166 reference (likely data error)
- **Assessment:** Completely absent. Sundance Institute's Wikidata presence is as an organization, not a grantor. All Sundance-conferred items in Wikidata are film festival awards (Sundance Film Festival), not fund/lab grants.
- **Alternative source notes:** Sundance Documentary Fund publishes grantee lists. Fund has operated since 2002, supporting ~25-40 projects per year across development, production/post, and audience engagement tracks. This is among the most important documentary funding sources and a high-priority candidate for alternative data approaches.

### Sundance Labs — NOT VIABLE (Wikidata)

- **QID:** None — no entities for Screenwriters Lab, Directors Lab, Documentary Edit Lab, or any Sundance lab program
- **P69 (educated at) usage:** Only 2 people have P69 = Sundance Institute
- **Assessment:** Labs are completely unmodeled in Wikidata. No concept of lab participation exists in the data.
- **Alternative source notes:** Sundance Institute publishes alumni lists. Labs include Screenwriters Lab (est. 1981), Directors Lab, Documentary Edit & Story Lab, and others. Lab alumni overlap significantly with major documentary filmmakers — high signal value for talent pipeline mapping.

### Film Independent Labs — NOT VIABLE (Wikidata)

- **QID (org):** Q23701368 (Film Independent) — typed as "organization", 0 P166 references
- **Related entities:** Artist Development Showcase (Q125713112) and Future Filmmakers (Q125583134) exist but typed as "film festival", not labs/grants
- **Assessment:** No entities for Project Involve, Directing Lab, Producing Lab, Documentary Lab, or any Film Independent lab program.
- **Alternative source notes:** Film Independent publishes fellow/alumni lists. Project Involve (est. 1993) is particularly notable for diversity pipeline tracking. Directing Lab, Producing Lab, and Documentary Lab are key indie development programs.

### TIFF Talent Lab — NOT VIABLE (Wikidata)

- **QID:** None
- **Assessment:** No entity exists. TIFF (Q390018) has many award categories but no lab/program entities in Wikidata.
- **Alternative source notes:** TIFF publishes Talent Lab participant lists annually.

### ITVS (Independent Television Service) — NOT VIABLE (Wikidata)

- **QID:** Q16977035
- **Instance type:** Television production company
- **P166 count:** 0
- **P8324 (funder) usage:** 1 item funded by ITVS
- **Assessment:** Modeled as a production company, not a funder/grantor. Wikidata doesn't capture ITVS's primary role as a documentary funder.
- **Alternative source notes:** ITVS is a major public media funder of independent documentaries. Publishes funded project lists. Has funded thousands of projects since 1991 including many notable documentaries. Data likely available via their website or annual reports.

### Catapult Film Fund — NOT VIABLE (Wikidata)

- **QID:** None (Q61393920 "Catapult Films" is an unrelated Estonian production company)
- **Assessment:** No Wikidata entity whatsoever.
- **Alternative source notes:** Catapult Film Fund publishes grantee lists on their website. Focused exclusively on documentary, supporting ~15-20 projects per year in development and production phases. A complete grantee dataset would be small and high-signal.

### Ford Foundation / JustFilms — NOT VIABLE (Wikidata)

- **QID:** Q1313036 (Ford Foundation)
- **Instance type:** Nonprofit organization, collection, production company
- **P166 count:** 3 (mismodeled — person awarded "postdoctoral researcher" with P1027=Ford Foundation qualifier)
- **P8324 (funder) usage:** 10 items
- **P859 (sponsor) usage:** 43 items (mostly organizations/initiatives, not film grants)
- **JustFilms entity:** None
- **Assessment:** Ford Foundation exists as an organization but its film grantmaking (JustFilms program) is completely unmodeled. The 3 P166 claims are misattributed.
- **Alternative source notes:** JustFilms (est. 2011) is one of the largest documentary film funders globally. Ford Foundation publishes grant databases. JustFilms specifically focuses on social justice documentary, supporting production, distribution, and audience engagement.

---

## Part 3: Alternative Properties Explored

For entities not queryable via P166/P1411, we investigated whether other Wikidata properties could serve as a query path:

| Property | Description | Usage for our candidates | Film relevance |
|---|---|---|---|
| P8324 | funder | Ford Foundation: 10, NEA: 6, ITVS: 1 | Mostly organizations/museums, not films. 1 ITVS-funded film found. |
| P859 | sponsor | Ford Foundation: 43, NEA: 7 | Mostly organizations/initiatives, not individual grants to filmmakers. |
| P1027 | conferred by | Links awards to conferring orgs. Sundance Institute: ~20 conferred items | All Sundance-conferred items are festival prizes, not lab/grant awards. |
| P69 | educated at | 2 people "educated at" Sundance Institute | Essentially unused for lab participation. |

**Conclusion:** Alternative properties do not provide a viable query path for fellowship/lab/grant data. The data simply isn't in Wikidata.

---

## Part 4: Structural Findings

### Documentary-specific ceremonies are structurally underrepresented

The three ceremonies most relevant to documentary research — Critics' Choice Documentary Awards, Cinema Eye Honors, and IDA Awards — are effectively absent from Wikidata. This is not a lag issue (unlike Oscar data that's 1-2 years behind); these ceremonies lack active Wikidata editor communities maintaining their data. This represents a structural ceiling on SPARQL-based documentary award research.

### Fellowships/labs/grants use a different data model

Wikidata models awards as properties of people (person → P166 → award). Fellowships and grants are modeled (when they exist at all) as organizational relationships — an organization funds a project, not a person "receives" a grant in the P166 sense. The exceptions (Guggenheim, NEA Fellowship) are cases where the fellowship IS treated as an honor/award rather than a funding mechanism.

### The P1411 crew cross-referencing path (M7) remains the primary value channel

For documentary award research, the most reliable data comes not from direct film P166 queries but from cross-referencing crew members' personal Wikidata profiles for P1411 nominations. This finding from M10 is reinforced by this feasibility study — adding more ceremonies to the registry only helps if those ceremonies' awards appear on people's Wikidata profiles via P166/P1411.

---

## Part 5: M13 Implementation Scope

Based on feasibility, M13 should add these 4 candidates:

1. **Peabody Awards** (Q838121) — 1 ceremony + 1 category, 446 P166 claims
2. **Gotham Awards** (Q1538791) — 1 ceremony + 10-15 categories, 23 P166/P1411 claims
3. **Emmy documentary categories** — 5-7 new categories under existing `emmys` ceremony (5 QIDs verified, 2 need verification)
4. **Guggenheim Fellowship** (Q1316544) — 1 ceremony + 1 category, 19,570 P166 claims (217-758 film-relevant). Requires qualifier-aware SPARQL query (new engineering).

### Deferred to future milestone (alternative data sources needed)

These candidates require non-Wikidata data sources (web scraping, API integration, or structured data import):

**High priority (major documentary ceremonies/funders):**
- Critics' Choice Documentary Awards
- Cinema Eye Honors
- IDA Awards
- Sundance Documentary Fund
- Sundance Labs

**Medium priority:**
- Film Independent Labs (especially Project Involve)
- Ford Foundation / JustFilms
- ITVS

**Low priority:**
- TIFF Talent Lab
- Catapult Film Fund

**Viable in Wikidata but deferred (too low-density to justify the effort now):**
- TIFF Platform Prize — 2 P166/P1411 claims; could be added as a category under existing `tiff` ceremony, but near-zero data value
- NEA Fellowship — 246 P166 claims but only ~13 film-relevant; technically P166-compatible but not worth the effort at current density. More promising via NEA's own grant database.
