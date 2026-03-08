# M20 Research: Wikipedia as Fallback Resolution Layer

## Context

BOD-203 resolution analysis (12 documentary films, 107 award-relevant crew) produced a key finding: **78% of skipped crew (31/40) have zero Wikidata presence** — no entity exists at all. These are primarily Executive Producers, Associate Producers, Line Producers, and Editors working in documentary production.

However, a Wikipedia spot-check of 10 of these "invisible" crew members revealed that **many are mentioned across multiple English Wikipedia pages** despite lacking standalone articles or Wikidata entities.

## The "Mentioned but No Article" Pattern

| Person | Role | Film | Wikipedia Mentions |
|--------|------|------|--------------------|
| Jason Spingarn-Koff | Executive Producer | Dick Johnson Is Dead | 8 pages (Netflix exec, UC Berkeley professor) |
| Jesse Ignjatovic | Executive Producer | Apollo 11 | 10+ pages (Den of Thieves co-founder, MTV VMAs) |
| Baz Halpin | Creative Producer/EP | Apollo 11 | 10+ pages (Katy Perry tours, Macy's parade) |
| Nels Bangerter | Writer/Editor | Dick Johnson Is Dead | 10+ pages (Cameraperson, Cinema Eye winner) |
| Kevin Scott Frakes | Producer | Free Solo | 5+ pages (PalmStar Media, Golden Globe noms) |
| Jonathan Silberberg | Executive Producer | Boys State | 5+ pages (Davis Guggenheim collaborator) |
| Betsy Steinberg | Executive Producer | Minding the Gap | 2 pages (Steve James docs) |
| Evan Prager | Executive Producer | Apollo 11 | 2 pages (Den of Thieves co-founder) |
| Buddy Patrick | Producer | Free Solo | 0 pages |
| Kimberly S. Moreau | Producer | Summer of Soul | 1 page (possibly different domain) |

**Key insight:** 7 of 10 sampled "invisible" crew are mentioned on 2+ Wikipedia pages. They're not obscure — they fall in the gap between "mentioned in Wikipedia" and "has a Wikipedia article."

## What Wikipedia Could Provide

### Feasible (mention-based)

1. **Confirmation of film association**: Search Wikipedia for a film title, find the person's name in credits/production sections. This confirms identity without needing a Wikidata entity.

2. **Unstructured award data**: Film Wikipedia articles often mention awards in prose ("won the Peabody Award", "nominated for an Independent Spirit Award") even when Wikidata lacks P166/P1411 claims. This is especially relevant for documentary-specific ceremonies that have sparse Wikidata editor communities.

3. **Richer `skippedCrew` enrichment**: Instead of `reason: "unresolvable"`, output could include: `"mentionedInWikipediaArticles": ["Dick Johnson Is Dead", "Cameraperson", "Let the Fire Burn"]`. This gives the user (or downstream LLM) actionable context.

4. **Network mapping**: If Jason Spingarn-Koff appears in credits sections across 8 film Wikipedia articles, that's a collaboration network signal we currently lose entirely.

### Not feasible

- **Structured award data for non-Wikidata people**: Wikipedia mentions can surface award facts in prose, but parsing them into structured P166-equivalent data is unreliable NLP territory.
- **Replacing Wikidata for the SPARQL pipeline**: Awards queries need QIDs. Wikipedia mentions don't provide those.

## Architectural Questions for M20

1. **Wikipedia MCP selection**: Which Wikipedia MCP? What tools does it expose? Can it search article text (not just titles)?

2. **Resolution chain extension**: Currently TMDB ID → IMDb ID → Wikidata name search. Should Wikipedia become a 4th step? Or a parallel enrichment layer that runs alongside Wikidata?

3. **Mention extraction**: How do we go from "search Wikipedia for 'Dick Johnson Is Dead'" to "Nels Bangerter is mentioned in the credits section"? This likely requires parsing article text, not just checking if an article exists.

4. **Performance**: Adding Wikipedia API calls to the resolution chain for each crew member could significantly slow `get_film_awards`. The current 12-film analysis took 32 seconds for 107 crew. Adding Wikipedia calls could double that. Should this be opt-in?

5. **Value proposition**: The primary consumer of `skippedCrew` data is the LLM in the research workflow. Does enriching skipped entries with "mentioned on Wikipedia" actually change what the LLM can do? Or is it just metadata that doesn't unlock new queries?

## Quantitative Framing

From the BOD-203 analysis:
- 107 award-relevant crew across 12 documentary films
- 67 resolved (63%) — these go through the full awards pipeline
- 40 skipped (37%) — currently dead-ends
- Of skipped: 31 no Wikidata entity, 9 Tier 3 disambiguation failures
- Of the 31 with no entity: ~70% are mentioned on Wikipedia pages (extrapolating from 10-person sample)
- **Estimated recoverable via Wikipedia: ~22 crew members** (for enrichment, not for Wikidata awards queries)

## Recommendation

Log this as a concrete research direction for M20. The Wikipedia MCP integration should be scoped around **mention-based enrichment for the 37% of crew that Wikidata can't see**, not as a replacement for the SPARQL pipeline. The highest-value use cases:

1. Enriching `skippedCrew` with Wikipedia mention context
2. Extracting unstructured award data from film Wikipedia articles
3. Building collaboration network signals from cross-article credit mentions
