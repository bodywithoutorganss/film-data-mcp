# M16: Special Thanks & Acknowledgment Credits — Design

## Goal

Surface "Thanks" and "Special Thanks" credit data from TMDB and Wikidata, then build a dedicated tool that goes beyond `get_credits` department filtering to enable influence/collaboration network mapping.

## Phases

### Phase 1: Research

Quantify TMDB and Wikidata coverage for Thanks credits. Probe ~10 films across three tiers:

**TMDB probes** — hit `/movie/{id}/credits`, filter `department === "Thanks"`:
- Comp docs: Minding the Gap (489985), Boys State (653723), Dick Johnson Is Dead (653574)
- Big docs: 13th (340101), Won't You Be My Neighbor (464593), Free Solo (504562), RBG (506702)
- Fiction: Lord of the Rings: Return of the King (122), Avengers: Endgame (299534), Parasite (496243)

Record per film: count of Thanks entries, job title variants (Thanks, Special Thanks, Acknowledgement, etc.), whether person IDs are valid TMDB person entries (resolvable via `/person/{id}`).

**Wikidata probes** — for the same films:
- Check for SPARQL properties capturing acknowledgment relationships (P7084, P1889, or any property modeling "thanked in" / "acknowledged by")
- Search for Wikidata properties specifically about acknowledgments
- Record coverage rate and data shape

**Output:** Research doc with coverage rates, job title taxonomy, go/no-go per data source.

### Phase 2: Tool — `get_thanks_credits`

A dedicated tool distinct from `get_credits`, with three query modes:

#### Forward query
Given a movie or TV ID, return all Thanks/Special Thanks credits. Output shape informed by research (flat vs. grouped by job title).

#### Reverse query
Given a person ID, find all films where they appear in Thanks credits. Also surfaces the person's formal crew roles (director, producer, etc.) on other films — this is what makes it a network/influence tool.

Implementation depends on research findings:
- If TMDB indexes Thanks credits as searchable crew → use `discover` with `with_crew`
- If not → fall back to person filmography iteration with client-side filtering

#### Batch mode
Accept multiple movie IDs. Aggregate Thanks credits across the set, producing a frequency map of thanked individuals (who appears in Thanks across multiple films in the set).

### Phase 3: Cross-Referencing & Enrichment

Thanked individuals enriched with:
- TMDB person profile (bio, known_for, filmography summary)
- If Wikidata viable: occupation, awards count, representation data via existing `resolvePerson` chain
- Reverse query results annotated with formal crew roles across filmography

### Out of Scope

- Neo4j graph construction (future — tool output will be graph-ingestible but we don't build the graph layer)
- Network visualization or influence scoring
- New Wikidata SPARQL queries unless research proves viable coverage

## Schema Pattern

Same as all other tools: Zod schema → `buildToolDef` → handler returning JSON string. Reuses `TMDBClient` and optionally `WikidataClient`.

## Research Probe Films

| Tier | Film | TMDB ID |
|------|------|---------|
| Comp doc | Minding the Gap | 489985 |
| Comp doc | Boys State | 653723 |
| Comp doc | Dick Johnson Is Dead | 653574 |
| Big doc | 13th | 340101 |
| Big doc | Won't You Be My Neighbor | 464593 |
| Big doc | Free Solo | 504562 |
| Big doc | RBG | 506702 |
| Fiction | LOTR: Return of the King | 122 |
| Fiction | Avengers: Endgame | 299534 |
| Fiction | Parasite | 496243 |
