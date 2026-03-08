# M15 Talent Representation — Implementation Plan

Date: 2026-03-08
Design: `2026-03-08-m15-representation-design.md`

## Steps

### 1. Add types to `src/types/wikidata.ts`
- Add `RepresentationEntry` interface
- Add `PersonRepresentationResult` interface
- Export both

### 2. Add SPARQL method to `src/utils/wikidata-client.ts`
- Add `getPersonRepresentation(wikidataId: string): Promise<RepresentationEntry[]>`
- SPARQL query for P1875 with qualifiers (start/end dates, role, rep type)
- Deduplicate results (P1875 can produce duplicates when rep has multiple P31 types)

### 3. Export `resolvePerson` from `src/tools/awards.ts`
- Change `async function resolvePerson` to `export async function resolvePerson`
- No other changes to awards.ts

### 4. Create `src/tools/representation.ts`
- Zod schema: `GetPersonRepresentationSchema`
- Tool def via `buildToolDef()`
- Handler: `handleGetPersonRepresentation(args, tmdbClient, wikidataClient)`
- Import `resolvePerson` from awards.ts

### 5. Register in `src/index.ts`
- Import tool def and handler from representation.ts
- Add to tools array and handlers dispatch map

### 6. Unit tests: `tests/tools/representation.test.ts`
- Test successful resolution + representation data
- Test empty representation (person exists but no P1875 data)
- Test resolution failure
- Test deduplication of results
- Test name fallback resolution path

### 7. Unit tests: `tests/utils/wikidata-client.test.ts`
- Add tests for `getPersonRepresentation` method
- Test SPARQL response parsing
- Test empty results
- Test partial qualifier data (some entries have dates, some don't)

### 8. Integration test
- Add to existing integration test file or create `tests/tools/representation.integration.test.ts`
- Test against known representations: Zendaya (Q189489) → CAA, Dwayne Johnson (Q10738) → UTA

### 9. Update CLAUDE.md
- Add tool to tool table
- Update tool count (20 → 21)
- Note coverage limitations
