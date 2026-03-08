// ABOUTME: BOD-203 evidence gathering — analyzes name resolution failures across documentary films.
// ABOUTME: Determines whether Tier 3 scoring would recover useful crew matches (EPs, producers, etc.).

import { describe, it, expect } from "vitest";
import { TMDBClient } from "../../src/utils/tmdb-client.js";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN!;
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "film-data-mcp/1.0 (BOD-203 analysis)";

// Film-relevant occupations — mirrors WikidataClient.FILM_OCCUPATIONS
const FILM_OCCUPATIONS = new Set([
  "Q2526255",  // film director
  "Q3455803",  // director (generic)
  "Q3282637",  // film producer
  "Q47541952", // producer (generic)
  "Q28389",    // screenwriter
  "Q36834",    // composer
  "Q222344",   // cinematographer
  "Q7042855",  // film editor
  "Q947873",   // television director
  "Q578109",   // television producer
  "Q4610556",  // documentary filmmaker
  "Q2059704",  // production designer
]);

const AWARD_RELEVANT_JOBS = new Set([
  "Director", "Producer", "Executive Producer", "Writer", "Screenplay",
  "Director of Photography", "Editor", "Original Music Composer",
]);

function isAwardRelevantJob(job: string): boolean {
  return AWARD_RELEVANT_JOBS.has(job) || job.includes("Producer");
}

// Documentary films with known EP/producer depth
const FILMS = [
  // Existing comp films
  { id: 489985, title: "Minding the Gap" },
  { id: 653723, title: "Boys State" },
  { id: 653574, title: "Dick Johnson Is Dead" },
  // Broad EP pool — big Netflix/streaming docs
  { id: 394629, title: "13th" },
  { id: 493922, title: "Free Solo" },
  { id: 566027, title: "American Factory" },
  { id: 736069, title: "Summer of Soul" },
  { id: 671847, title: "Crip Camp" },
  { id: 480857, title: "RBG" },
  { id: 551898, title: "Won't You Be My Neighbor?" },
  { id: 435915, title: "Icarus" },
  { id: 568332, title: "Apollo 11" },
];

interface NameCandidate {
  id: string;
  label: string;
  description?: string;
  occupations: string[];  // occupation labels
  occupationQids: string[];
  hasFilmOccupation: boolean;
}

interface ResolutionResult {
  name: string;
  tmdbId: number;
  roles: string[];
  resolved: boolean;
  method?: string;
  wikidataId?: string;
  // Failure diagnostics
  failureReason?: "no_imdb_id" | "tmdb_wikidata_miss" | "imdb_wikidata_miss" | "no_name_candidates" | "tier3_multiple_no_film" | "tier3_multiple_film" | "name_search_error";
  nameCandidates?: NameCandidate[];
}

interface FilmAnalysis {
  filmId: number;
  filmTitle: string;
  totalAwardCrew: number;
  resolved: ResolutionResult[];
  skipped: ResolutionResult[];
}

async function executeSparql(query: string): Promise<any> {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`SPARQL error: ${response.status}`);
  return response.json();
}

async function getNameCandidatesWithOccupations(name: string): Promise<NameCandidate[]> {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", name);
  url.searchParams.set("language", "en");
  url.searchParams.set("type", "item");
  url.searchParams.set("limit", "5");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return [];
  const data = await response.json() as { search: Array<{ id: string; label: string; description?: string }> };
  if (!data.search || data.search.length === 0) return [];

  const candidateIds = data.search.map(s => s.id);
  if (candidateIds.some(id => !/^Q\d+$/.test(id))) return [];

  const valuesClause = candidateIds.map(id => `wd:${id}`).join(" ");
  const query = `
    SELECT ?entity ?entityLabel ?occupation ?occupationLabel WHERE {
      VALUES ?entity { ${valuesClause} }
      OPTIONAL { ?entity wdt:P106 ?occupation . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
  `;
  const sparqlResult = await executeSparql(query);

  // Group occupations by entity
  const occupationMap = new Map<string, { labels: string[]; qids: string[] }>();
  for (const binding of sparqlResult.results.bindings) {
    const entityId = binding.entity.value.split("/").pop()!;
    if (!occupationMap.has(entityId)) {
      occupationMap.set(entityId, { labels: [], qids: [] });
    }
    if (binding.occupation) {
      const occId = binding.occupation.value.split("/").pop()!;
      const occLabel = binding.occupationLabel?.value ?? occId;
      const entry = occupationMap.get(entityId)!;
      if (!entry.qids.includes(occId)) {
        entry.qids.push(occId);
        entry.labels.push(occLabel);
      }
    }
  }

  return data.search.map(s => {
    const occs = occupationMap.get(s.id) ?? { labels: [], qids: [] };
    return {
      id: s.id,
      label: s.label,
      description: s.description,
      occupations: occs.labels,
      occupationQids: occs.qids,
      hasFilmOccupation: occs.qids.some(q => FILM_OCCUPATIONS.has(q)),
    };
  });
}

async function diagnoseResolution(
  tmdbId: number,
  name: string,
  roles: string[],
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient,
): Promise<ResolutionResult> {
  const base = { name, tmdbId, roles };

  // Step 1: TMDB ID → Wikidata
  const byTmdb = await wikidataClient.resolvePersonByTmdbId(String(tmdbId));
  if (byTmdb) {
    return { ...base, resolved: true, method: "tmdb_id", wikidataId: byTmdb.wikidataId };
  }

  // Step 2: IMDb ID → Wikidata
  let imdbId: string | undefined;
  try {
    const person = await tmdbClient.getPersonDetails(tmdbId);
    imdbId = person.imdb_id ?? undefined;
  } catch {
    // TMDB person lookup failed — skip IMDb step
  }

  if (imdbId) {
    const byImdb = await wikidataClient.resolveByImdbId(imdbId);
    if (byImdb) {
      return { ...base, resolved: true, method: "imdb_id", wikidataId: byImdb.wikidataId };
    }
  }

  // Step 3: Name search with full diagnostics
  let candidates: NameCandidate[];
  try {
    candidates = await getNameCandidatesWithOccupations(name);
  } catch {
    return { ...base, resolved: false, failureReason: "name_search_error" };
  }

  if (candidates.length === 0) {
    return { ...base, resolved: false, failureReason: "no_name_candidates" };
  }

  const filmCandidates = candidates.filter(c => c.hasFilmOccupation);

  // Tier 1: exactly one film-occupation candidate → would have resolved
  if (filmCandidates.length === 1) {
    // This SHOULD have been caught by resolvePersonByName. If we're here,
    // something unexpected happened (TMDB ID and IMDb ID both missed but name worked).
    // This case means the existing code works — person resolved via name.
    return { ...base, resolved: true, method: "name_search", wikidataId: filmCandidates[0].id, nameCandidates: candidates };
  }

  // Tier 2: no film candidates, only 1 total → would have resolved
  if (filmCandidates.length === 0 && candidates.length === 1) {
    return { ...base, resolved: true, method: "name_search_unfiltered", wikidataId: candidates[0].id, nameCandidates: candidates };
  }

  // Tier 3 failures — the BOD-203 targets
  if (filmCandidates.length > 1) {
    return { ...base, resolved: false, failureReason: "tier3_multiple_film", nameCandidates: candidates };
  }

  // filmCandidates.length === 0, candidates.length > 1
  return { ...base, resolved: false, failureReason: "tier3_multiple_no_film", nameCandidates: candidates };
}

async function analyzeFilm(
  film: { id: number; title: string },
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient,
): Promise<FilmAnalysis> {
  const details = await tmdbClient.getMovieDetails(film.id, ["credits"]);
  const credits = (details as any).credits;
  if (!credits?.crew) {
    return { filmId: film.id, filmTitle: film.title, totalAwardCrew: 0, resolved: [], skipped: [] };
  }

  // Deduplicate crew by TMDB person ID, merging roles
  const crewById = new Map<number, { id: number; name: string; roles: string[] }>();
  for (const member of credits.crew) {
    if (!isAwardRelevantJob(member.job)) continue;
    const existing = crewById.get(member.id);
    if (existing) {
      if (!existing.roles.includes(member.job)) existing.roles.push(member.job);
    } else {
      crewById.set(member.id, { id: member.id, name: member.name, roles: [member.job] });
    }
  }

  const results: ResolutionResult[] = [];

  for (const member of crewById.values()) {
    const result = await diagnoseResolution(
      member.id, member.name, member.roles, tmdbClient, wikidataClient,
    );
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150));
  }

  return {
    filmId: film.id,
    filmTitle: film.title,
    totalAwardCrew: crewById.size,
    resolved: results.filter(r => r.resolved),
    skipped: results.filter(r => !r.resolved),
  };
}

describe("BOD-203 Resolution Analysis", () => {
  const tmdbClient = new TMDBClient(TMDB_TOKEN);
  const wikidataClient = new WikidataClient();

  it("analyzes name resolution failures across documentary films", { timeout: 300_000 }, async () => {
    const analyses: FilmAnalysis[] = [];

    for (const film of FILMS) {
      console.log(`\n--- Analyzing: ${film.title} (${film.id}) ---`);
      const analysis = await analyzeFilm(film, tmdbClient, wikidataClient);
      analyses.push(analysis);

      console.log(`  Crew: ${analysis.totalAwardCrew} | Resolved: ${analysis.resolved.length} | Skipped: ${analysis.skipped.length}`);

      if (analysis.skipped.length > 0) {
        for (const skip of analysis.skipped) {
          console.log(`  SKIPPED: ${skip.name} [${skip.roles.join(", ")}]`);
          console.log(`    Reason: ${skip.failureReason}`);
          if (skip.nameCandidates && skip.nameCandidates.length > 0) {
            for (const c of skip.nameCandidates) {
              const occStr = c.occupations.length > 0 ? c.occupations.join(", ") : "(no occupations)";
              const filmFlag = c.hasFilmOccupation ? " ★FILM" : "";
              console.log(`    Candidate: ${c.id} "${c.label}" — ${occStr}${filmFlag}`);
              if (c.description) console.log(`      desc: ${c.description}`);
            }
          }
        }
      }
    }

    // --- Summary ---
    console.log("\n\n========== SUMMARY ==========\n");

    const allSkipped = analyses.flatMap(a => a.skipped);
    const allResolved = analyses.flatMap(a => a.resolved);

    console.log(`Total films analyzed: ${analyses.length}`);
    console.log(`Total award-relevant crew: ${allResolved.length + allSkipped.length}`);
    console.log(`Resolved: ${allResolved.length}`);
    console.log(`Skipped: ${allSkipped.length}`);
    console.log();

    // Resolution method breakdown
    const methodCounts: Record<string, number> = {};
    for (const r of allResolved) {
      const m = r.method ?? "unknown";
      methodCounts[m] = (methodCounts[m] ?? 0) + 1;
    }
    console.log("Resolution methods:");
    for (const [method, count] of Object.entries(methodCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${method}: ${count}`);
    }
    console.log();

    // Failure reason breakdown
    const failureCounts: Record<string, number> = {};
    for (const s of allSkipped) {
      const r = s.failureReason ?? "unknown";
      failureCounts[r] = (failureCounts[r] ?? 0) + 1;
    }
    console.log("Failure reasons:");
    for (const [reason, count] of Object.entries(failureCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${reason}: ${count}`);
    }
    console.log();

    // Role breakdown for skipped crew
    const skippedByRole: Record<string, number> = {};
    for (const s of allSkipped) {
      for (const role of s.roles) {
        skippedByRole[role] = (skippedByRole[role] ?? 0) + 1;
      }
    }
    console.log("Skipped crew by role:");
    for (const [role, count] of Object.entries(skippedByRole).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${role}: ${count}`);
    }
    console.log();

    // BOD-203 specific: Tier 3 failures with candidates
    const tier3 = allSkipped.filter(s =>
      s.failureReason === "tier3_multiple_no_film" || s.failureReason === "tier3_multiple_film"
    );
    console.log(`\n===== TIER 3 FAILURES (BOD-203 targets): ${tier3.length} =====`);
    if (tier3.length > 0) {
      for (const t of tier3) {
        const film = analyses.find(a => a.skipped.includes(t));
        console.log(`\n  ${t.name} [${t.roles.join(", ")}] — ${film?.filmTitle}`);
        console.log(`  Reason: ${t.failureReason} (${t.nameCandidates?.length} candidates)`);
        if (t.nameCandidates) {
          for (const c of t.nameCandidates) {
            const occStr = c.occupations.length > 0 ? c.occupations.join(", ") : "(no occupations)";
            const filmFlag = c.hasFilmOccupation ? " ★FILM" : "";
            console.log(`    ${c.id} "${c.label}" — ${occStr}${filmFlag}`);
            if (c.description) console.log(`      ${c.description}`);
          }
        }
      }
    } else {
      console.log("  None — BOD-203 scoring would not recover any additional crew.");
    }

    // EP/Producer specific analysis
    const skippedProducers = allSkipped.filter(s =>
      s.roles.some(r => r.includes("Producer"))
    );
    console.log(`\n===== SKIPPED PRODUCERS/EPs: ${skippedProducers.length} =====`);
    for (const p of skippedProducers) {
      const film = analyses.find(a => a.skipped.includes(p));
      console.log(`  ${p.name} [${p.roles.join(", ")}] — ${film?.filmTitle} — ${p.failureReason}`);
    }

    // Assertions — this is an evidence-gathering test, not a regression test
    expect(analyses.length).toBe(FILMS.length);
    expect(allResolved.length + allSkipped.length).toBeGreaterThan(0);
  });
});
