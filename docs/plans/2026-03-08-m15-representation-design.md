# M15 Talent Representation — Design

Date: 2026-03-08
Based on: `2026-03-08-m15-representation-data-research.md`

## Tool: `get_person_representation`

Queries Wikidata P1875 ("represented by") to find talent agency affiliations for a person identified by TMDB ID.

### Input Schema

```typescript
{
  person_id: number;   // TMDB person ID (required)
  name?: string;       // Optional name fallback for Wikidata resolution
}
```

### Resolution Chain

Reuse the existing `resolvePerson` function from `awards.ts` (export it, import in new file). Same TMDB ID → IMDb ID → name fallback chain.

### SPARQL Query

```sparql
SELECT ?repLabel ?rep ?repTypeLabel ?startTime ?endTime ?roleLabel WHERE {
  wd:{wikidataId} p:P1875 ?stmt .
  ?stmt ps:P1875 ?rep .
  OPTIONAL { ?rep wdt:P31 ?repType . }
  OPTIONAL { ?stmt pq:P580 ?startTime . }
  OPTIONAL { ?stmt pq:P582 ?endTime . }
  OPTIONAL { ?stmt pq:P3831 ?role . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

### Response Shape

```typescript
interface RepresentationEntry {
  name: string;           // Agency/rep name (label)
  wikidataId: string;     // QID of the agency/rep
  type: string | null;    // Instance-of label (e.g., "talent agency", "model agency")
  startDate: string | null;
  endDate: string | null;
  role: string | null;    // Qualifier P3831 if present
}

interface PersonRepresentationResult {
  entity: ResolvedEntity;
  representation: RepresentationEntry[];
  coverageNote: string;
}
```

### Architecture

- **New file:** `src/tools/representation.ts` — schema, tool def, handler
- **WikidataClient addition:** `getPersonRepresentation(wikidataId: string): Promise<RepresentationEntry[]>`
- **New types:** `RepresentationEntry`, `PersonRepresentationResult` in `src/types/wikidata.ts`
- **Shared resolution:** Export `resolvePerson` from `awards.ts`, import in `representation.ts`
- **Registration:** Add to `index.ts` dispatch map + tools list
- **Tool count:** 20 → 21

### Coverage Note

Every response includes a static note: "Wikidata representation data covers ~1,200 film professionals at talent agencies. Coverage is strongest for Japanese and Korean entertainment; US talent agency data is sparse (~70 people across CAA/WME/UTA/ICM). Absence of results does not indicate absence of representation."
