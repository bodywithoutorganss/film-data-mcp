# BOD-198: Resolved Crew Enrichment

## Problem

`get_film_awards` returns a `resolvedCrew` array for crew members who resolve to Wikidata but have no P1411 nominations matching the queried film. Currently this only includes `{ name, roles }` — losing the Wikidata entity ID and providing no signal about the person's overall award profile.

## Goal

Enrich `resolvedCrew` entries with the Wikidata ID, total win/nomination counts, and a ceremony breakdown so consumers can assess a crew member's award stature even when they have no nominations for this specific film.

## Approach: Two-pass with existing methods

1. **First pass** (existing `Promise.all` over crew): resolve each person, fetch P1411 nominations, filter to film-specific. For crew with no film-specific nominations, capture the Wikidata ID and full nomination list in an intermediate array.

2. **Second pass** (new `Promise.all` over intermediate resolved crew): call `getPersonWins()` in parallel for each. Build ceremony breakdown from wins + captured nominations using the local awards registry (QID to ceremony mapping).

This reuses existing `getPersonWins()` — no new SPARQL queries or WikidataClient methods needed.

## Output Shape

```ts
// Before
resolvedCrew: Array<{ name: string; roles: string[] }>

// After
resolvedCrew: Array<{
  name: string;
  roles: string[];
  wikidataId: string;
  totalWins: number;
  totalNominations: number;
  byCeremony: Record<string, { wins: number; nominations: number }>;
}>
```

`byCeremony` keys are registry ceremony IDs (e.g., `"academy-awards"`, `"bafta"`). Only ceremonies with at least one win or nomination appear. If all claims fall outside the registry, `byCeremony` is `{}` and totals are both 0.

No changes to `crewNominations` or `skippedCrew` shapes.

## Performance

- Wikidata ID: free (already available from resolution)
- Nominations: free (already fetched in first pass, currently discarded)
- Wins: one `getPersonWins()` SPARQL call per resolved crew member, run in parallel
- Ceremony breakdown: local computation against awards registry, no SPARQL

## Testing

Unit tests:
- Enriched shape with wins and nominations across multiple ceremonies
- Edge case: 0 registered wins and 0 registered nominations (empty `byCeremony`)
- Update existing tests asserting on `resolvedCrew` shape

Integration tests:
- Existing comp film tests exercise `resolvedCrew` — update shape assertions
