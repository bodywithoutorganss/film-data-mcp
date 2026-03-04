# M7: Awards Intelligence — Design

## Problem

When `get_film_awards` finds a Wikidata entity but returns 0 awards, there's no way to distinguish:
- "Wikidata has no P166 claims for this entity" (data coverage gap)
- "Entity has P166 claims but none match our registry" (registry gap)
- "Entity genuinely has no film awards"

Additionally, films with empty P166 claims may still have rich award data accessible through their crew members' P1411 (nominated for) records. For example, *Minding the Gap* has 0 P166 claims on its Wikidata page, but director Bing Liu's page has P1411 nominations including his Oscar nomination **for** that film.

## Features

### 1. Awards Completeness Indicator

Add a `completeness` object to both `get_film_awards` and `get_person_awards` responses:

```typescript
completeness: {
  entityFound: true,
  p166ClaimCount: number,      // total P166 claims including non-film awards
  registeredAwardCount: number  // awards matching our registry (= awards.length)
}
```

This lets consumers reason about data quality:
- `entityFound: true, p166ClaimCount: 12, registeredAwardCount: 0` → registry gap
- `entityFound: true, p166ClaimCount: 0` → Wikidata coverage gap
- `entityFound: true, p166ClaimCount: 5, registeredAwardCount: 5` → full coverage

**Implementation:** New `countAllP166Claims(wikidataId)` method on `WikidataClient` — a SPARQL COUNT query on P166 without the `REGISTERED_QIDS` filter.

### 2. P1411 Crew Nomination Cross-Referencing

Always fetch crew nominations alongside direct film awards in `get_film_awards`.

**Flow:**
1. Fetch film credits from TMDB (already have the client)
2. Extract top crew: directors, producers, writers (capped at 5 people)
3. Resolve each to Wikidata via existing `resolvePersonByTmdbId` / `resolveByImdbId`
4. Query P1411 nominations per person (existing `getPersonNominations`)
5. Filter nominations to only those **for this film** (match P1686 "for work" Wikidata ID against the film's resolved Wikidata ID)

**Response shape for `get_film_awards`:**

```typescript
{
  entity: ResolvedEntity,
  awards: WikidataAward[],
  crewNominations: {
    person: { name: string, role: string },
    nominations: WikidataNomination[]  // filtered to this film only
  }[],
  completeness: {
    entityFound: true,
    p166ClaimCount: number,
    registeredAwardCount: number
  }
}
```

**Response shape for `get_person_awards`:**

```typescript
{
  entity: ResolvedEntity,
  wins: WikidataAward[],
  nominations: WikidataNomination[],
  completeness: {
    entityFound: true,
    p166ClaimCount: number,
    registeredAwardCount: number
  }
}
```

**Crew selection:** Directors, producers, and writers are the roles most likely to have award nominations tied to a specific film. Cap at 5 people to keep query count bounded.

**Parallelization:** Steps 3-4 run in parallel per crew member via `Promise.all`. Expected latency overhead: ~0.5-1 second.

**Filtering logic:** Match resolved film Wikidata ID against the `forWork.wikidataId` field in each crew member's P1411 nominations. Only include nominations where `forWork` matches.

## What This Does NOT Change

- No new MCP tools — both features enhance existing `get_film_awards` and `get_person_awards`
- No changes to `get_award_history` or `search_awards`
- No changes to the awards registry or SPARQL query patterns for P1411 (already implemented)
- Entity resolution logic unchanged — still throws on unresolvable entities

## Edge Cases

- **Crew member unresolvable in Wikidata:** Skip silently, don't fail the whole request. Log which crew were skipped in a `skippedCrew` array if any.
- **No TMDB credits available:** Return empty `crewNominations` array.
- **P1686 "for work" missing on a nomination:** Exclude from results (we can't confirm it's for this film).
