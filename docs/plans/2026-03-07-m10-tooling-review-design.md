# M10: Tooling Review & Hardening — Design

## Goal

Validate award tools against real documentary comp films. Surface resolution failures, Wikidata data gaps, and registry coverage gaps. Fix code bugs; document unfixable data issues.

## Approach

Test-first exploration: write integration tests for 3 comp films that assert on known real-world awards, run them, fix whatever breaks.

## Comp Films

| Film | Year | TMDB ID | Key People | Known Awards in Registry |
|------|------|---------|------------|------------------------|
| Minding the Gap | 2018 | TBD | Bing Liu (director), Diane Quon (producer) | Academy Best Documentary (nom), Independent Spirit Best Documentary (nom), Sundance Grand Jury Documentary (verify — actually won Special Jury, not Grand Jury) |
| Boys State | 2020 | TBD | Jesse Moss, Amanda McBaine (co-directors) | Sundance Grand Jury Documentary (won) |
| Dick Johnson Is Dead | 2020 | TBD | Kirsten Johnson (director) | Independent Spirit Best Documentary (nom) |

## Integration Test Matrix

### 1. Entity Resolution

For each film: can `get_film_awards` resolve TMDB movie ID → Wikidata entity?
For each key person: can `get_person_awards` resolve TMDB person ID → Wikidata entity?

### 2. Known Awards Found

Assert that awards from our registry appear in results:
- Minding the Gap: Academy Best Documentary nomination (P1411 or P166)
- Boys State: Sundance Grand Jury Documentary win (P166)
- Dick Johnson Is Dead: Independent Spirit Best Documentary nomination (P1411 or P166)

### 3. Crew Cross-Referencing (P1411)

For Minding the Gap: verify crew nomination cross-referencing recovers data via P1411 when direct film P166 claims are sparse. Existing integration test covers Diane Quon — extend to verify Bing Liu's nominations also surface.

## Scope of Fixes

- **Entity resolution failures** → fix code
- **Known awards missing from results** → investigate Wikidata, document if data gap
- **Registry coverage gaps** (Emmy doc categories, Critics' Choice, Cinema Eye, IDA) → note for M13

## Out of Scope

- Adding name fallback to TMDB-only tools (not needed — LLM chains search → ID naturally)
- Adding new ceremonies/categories to registry (M13)
- One-time investigative report (tests are the deliverable)

## Registry Gap Finding

Cross-referencing comp film awards with our registry revealed a documentary-specific gap. These ceremonies are NOT in our registry but awarded our comp films:
- Critics' Choice Documentary Awards
- Cinema Eye Honors
- International Documentary Association Awards
- Peabody Awards
- Emmy documentary categories (Outstanding Documentary Special, Outstanding Directing for Documentary/Nonfiction)

All are candidates for M13 (Awards Registry Expansion).
