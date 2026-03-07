# BOD-199: Tiered Name Resolution for Non-Filmmaker Crew

## Problem

`resolvePersonByName` in `wikidata-client.ts` uses a binary occupation filter: if none of the name-search candidates have a film-related P106 occupation, it returns `null`. This drops people like Laurene Powell Jobs (EP on Boys State) who have valid Wikidata entities but non-film occupations (businessperson, philanthropist).

The occupation filter serves two purposes:
1. **Disambiguation** — picking the right "John Williams" from multiple candidates
2. **Validation** — confirming the entity is a filmmaker

For non-filmmaker EPs (common in documentary production), validation is redundant — TMDB credits already confirm the person worked on the film. The issue is that the filter conflates these two concerns.

## Approach: Tiered Candidate Selection

Change `resolvePersonByName` from binary filtering to tiered selection:

- **Tier 1 (unchanged):** Exactly one candidate has a film occupation -> return it. `resolvedVia: "name_search"`
- **Tier 2 (new):** Zero candidates have film occupations, but only one candidate was returned by name search -> accept it. `resolvedVia: "name_search_unfiltered"`
- **Tier 3 (unchanged):** Multiple candidates, no film-occupation disambiguator -> return `null`

The relaxation applies universally to all name-search fallbacks. No role-threading from the caller. By the time we reach name search, TMDB ID and IMDb ID have already failed, so a single-candidate match is the strongest signal available. TMDB credits context validates the person's relevance.

## Changes

### `src/utils/wikidata-client.ts`
- `resolvePersonByName`: after the existing Tier 1 check (`filmRelevant.size === 1`), add a Tier 2 fallback: if `filmRelevant.size === 0` and `candidateIds.length === 1`, return the sole candidate with `resolvedVia: "name_search_unfiltered"`.

### No changes to `src/tools/awards.ts`
The caller doesn't need to know which tier resolved the entity.

### Tests
- Unit tests for all three tiers in `resolvePersonByName`:
  - Tier 1: single film-occupation candidate among multiple results (existing behavior)
  - Tier 2: single candidate total, no film occupation -> accepted
  - Tier 3: multiple candidates, no film occupations -> null
- Integration test against a known non-filmmaker EP (Laurene Powell Jobs, Q273206) if entity is stable.

## Future: Richer Candidate Scoring

If the single-candidate heuristic proves insufficient (Tier 3 misses where we're dropping valid matches because multiple candidates exist and none have film occupations), a future enhancement could score candidates using:

- Wikidata description keyword matching against TMDB role context
- Sitelink count as a notability proxy
- P166/P1411 claim existence as an awards-relevance signal

This is explicitly **not in scope** for this milestone. It should be tracked as a separate issue, gated on evidence that Tier 2/3 misses are happening in practice.

## Linear

- BOD-199: This implementation
- Future scoring issue: to be created after implementation, linked to BOD-199
