# M16: Special Thanks Credits — Research Findings

## TMDB Coverage

### Methodology

Probed 20 films via `/movie/{id}/credits` endpoint, filtering crew entries where `job` contains "thank" (case-insensitive). Films span three tiers: comp documentaries (3), big documentaries (4), and fiction (13).

### Critical Finding: TMDB Data Model

**Thanks credits are stored as `department: "Crew"` with `job: "Thanks"`.** They are NOT under a separate "Thanks" department. The original design assumed `department === "Thanks"` — this is wrong. The `/configuration/jobs` endpoint confirms: "Thanks" is a job title within the "Crew" department.

Filter logic must be: `c.job?.toLowerCase().includes("thank")` — NOT `c.department?.toLowerCase() === "thanks"`.

### Coverage Rates

| Tier | Films Probed | With Thanks | Rate |
|------|-------------|-------------|------|
| Comp doc | 3 (Minding the Gap, Boys State, Dick Johnson Is Dead) | 1 (Dick Johnson: 1 entry) | 14% |
| Big doc | 4 (13th, Won't You Be My Neighbor, Free Solo, RBG) | 0 | 0% |
| Fiction | 13 (Endgame, Parasite, Interstellar, Shawshank, Dark Knight, Fight Club, Pulp Fiction, Forrest Gump, LOTR x2, Godfather, Star Wars, Matrix) | 8 | 62% |
| **Total** | **20** | **9** | **45%** |

### Job Title Taxonomy

Only one variant observed across all 20 films: **"Thanks"**. No "Special Thanks", "Acknowledgement", or other variants found. The implementation should still use `includes("thank")` for safety but can expect "Thanks" as the standard job title.

### Person Profile Validity

Thanked people have valid TMDB person profiles (`/person/{id}` resolves). `known_for_department` varies: Acting, Directing, Writing, Crew, Production. Some have biographies, some don't. Notable examples:
- Ken Burns thanked in Interstellar
- Stephen King thanked in Shawshank Redemption
- Jennifer Beals thanked in Pulp Fiction
- Jim Starlin thanked in Avengers: Endgame (comic book creator)

### Reverse Lookup Viability

**Confirmed working.** Person endpoint with `append_to_response=combined_credits` includes Thanks entries in `crew` array. Tested with Jim Starlin (ID 1713975): returned 4 Thanks credits across movies and TV (Avengers: Infinity War, Avengers: Endgame, DC's Legends of Tomorrow, What If...?). Both movie and TV Thanks credits are surfaced.

### Films Confirmed to Have Thanks Credits

For integration test use:
| Film | TMDB ID | Thanks Count |
|------|---------|-------------|
| Pulp Fiction | 680 | 11 |
| Avengers: Endgame | 299534 | 5 |
| Interstellar | 157336 | 3 |
| Parasite | 496243 | 2 |
| Shawshank Redemption | 278 | 2 |
| Forrest Gump | 13 | 2 |
| Dick Johnson Is Dead | 653574 | 1 |
| The Dark Knight | 155 | 1 |
| Fight Club | 550 | 1 |

## Wikidata Coverage

### Methodology

Searched for Wikidata properties related to acknowledgments via SPARQL label search ("thank", "acknowledg", "credit"). Checked P7137 usage globally and on probe film entities.

### Findings

- **P7137 "acknowledged"** — semantically correct: "persons or institutions acknowledged on a creative work"
- **2,186 total P7137 claims** across all Wikidata items
- **Only 5 film entities** have P7137 claims globally:
  - Top Gun: Maverick (Q31202708) — dominates with military unit acknowledgments (Blue Angels, naval air stations, carrier strike groups)
  - Sällskapsresan (Q1765389) — Swedish comedy
  - Den ofrivillige golfaren (Q1764322) — Swedish comedy
- **0/10 probe films** have P7137 data (even accounting for TMDB→Wikidata ID mapping)
- No other Wikidata properties model film acknowledgments

### Verdict: No-Go

P7137 has effectively zero film coverage. Not viable as a data source. TMDB is the sole source for this tool.

## Go/No-Go Summary

| Source | Verdict | Rationale |
|--------|---------|-----------|
| TMDB `/movie/{id}/credits` | **Go** | 45% coverage (62% fiction, 14% docs), valid person profiles, reverse lookup works |
| TMDB `combined_credits` | **Go** | Reverse lookup confirmed, includes both movie and TV |
| Wikidata P7137 | **No-go** | 5 films globally, 0 docs |

## Implementation Impact

1. **Filter on `job`, not `department`** — all plan code snippets using `department === "thanks"` must change to `job.includes("thank")`
2. **Mock test data** must use `department: "Crew"` (not `department: "Thanks"`) to match real TMDB shape
3. **Integration tests** should use Pulp Fiction (680) or Endgame (299534) — confirmed high Thanks counts
4. **Output shape** — flat list is appropriate since only one job variant ("Thanks") exists. No need for grouping by job title.
5. **Wikidata enrichment** (Phase 3 from design) — not viable. Defer indefinitely.
