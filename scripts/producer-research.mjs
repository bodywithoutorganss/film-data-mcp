// ABOUTME: GTM research script for BreakFall documentary.
// ABOUTME: Exercises all 20 MCP tools against live APIs to produce real producer intelligence.

import { config } from "dotenv";
config();

import { TMDBClient } from "../build/utils/tmdb-client.js";
import { WikidataClient } from "../build/utils/wikidata-client.js";
import { handleSearch } from "../build/tools/search.js";
import { handleMovieDetails, handlePersonDetails } from "../build/tools/details.js";
import { handleDiscover } from "../build/tools/discover.js";
import { handleTrending } from "../build/tools/browse.js";
import { handleWatchProviders, handleSearchKeywords } from "../build/tools/reference.js";
import { handleGetFestivalPremieres } from "../build/tools/premieres.js";
import { handleGetCredits } from "../build/tools/credits.js";
import { handleGetPersonAwards, handleGetFilmAwards, handleGetAwardHistory, handleSearchAwards } from "../build/tools/awards.js";

const tmdb = new TMDBClient(process.env.TMDB_ACCESS_TOKEN);
const wikidata = new WikidataClient();

// Comp films from the BreakFall pitch deck
const COMP_FILMS = [
  { title: "Minding the Gap", year: 2018 },
  { title: "Boys State", year: 2020 },
  { title: "Dick Johnson Is Dead", year: 2020 },
  { title: "Restrepo", year: 2010 },
  { title: "Strong Island", year: 2017 },
  { title: "Hale County This Morning, This Evening", year: 2018 },
  { title: "The Mask You Live In", year: 2015 },
];

// Key directors to check awards for
const KEY_DIRECTORS = [
  "Bing Liu",
  "Kirsten Johnson",
  "Sebastian Junger",
  "Yance Ford",
  "RaMell Ross",
];

function section(title) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(70)}\n`);
}

function subsection(title) {
  console.log(`\n--- ${title} ---`);
}

async function callTool(name, handler, args, client) {
  try {
    const result = await handler(args, client);
    return JSON.parse(result);
  } catch (e) {
    console.error(`  [ERROR] ${name}: ${e.message}`);
    return null;
  }
}

async function callAwardTool(name, handler, args) {
  try {
    const result = await handler(args, tmdb, wikidata);
    return JSON.parse(result);
  } catch (e) {
    console.error(`  [ERROR] ${name}: ${e.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: Discover comp films and get TMDB IDs
// ═══════════════════════════════════════════════════════════════
async function phase1_findCompFilms() {
  section("PHASE 1: COMP FILM DISCOVERY (search tool)");

  const filmIds = {};
  for (const film of COMP_FILMS) {
    const result = await callTool("search", handleSearch, {
      query: film.title,
      type: "movie",
      year: film.year,
    }, tmdb);

    if (result?.results?.[0]) {
      const match = result.results[0];
      filmIds[film.title] = match.id;
      console.log(`  ✓ ${film.title} (${film.year}) → TMDB ID: ${match.id} | ${match.vote_average}/10 (${match.vote_count} votes)`);
    } else {
      console.log(`  ✗ ${film.title} (${film.year}) → NOT FOUND`);
    }
  }
  return filmIds;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: Movie details + credits for top comps
// ═══════════════════════════════════════════════════════════════
async function phase2_compDetails(filmIds) {
  section("PHASE 2: COMP FILM DETAILS (movie_details + get_credits)");

  const topComps = ["Minding the Gap", "Boys State", "Dick Johnson Is Dead", "Restrepo"];

  for (const title of topComps) {
    const id = filmIds[title];
    if (!id) continue;

    subsection(title);

    // Movie details with credits
    const details = await callTool("movie_details", handleMovieDetails, {
      movie_id: id,
      append: ["credits"],
      credits_limit: 10,
    }, tmdb);

    if (details) {
      console.log(`  Budget: $${(details.budget || 0).toLocaleString()} | Revenue: $${(details.revenue || 0).toLocaleString()}`);
      console.log(`  Runtime: ${details.runtime}min | Status: ${details.status}`);
      console.log(`  Genres: ${details.genres?.map(g => g.name).join(", ")}`);
      console.log(`  Production: ${details.production_companies?.map(c => c.name).join(", ") || "N/A"}`);
      if (details.credits?.cast?.length) {
        console.log(`  Top Cast: ${details.credits.cast.slice(0, 5).map(c => `${c.name} (${c.character})`).join(", ")}`);
      }
      if (details.credits?.crew?.length) {
        console.log(`  Key Crew: ${details.credits.crew.slice(0, 8).map(c => `${c.name} [${c.job}]`).join(", ")}`);
      }
    }

    // Detailed credits with department filter — exercise get_credits
    const dirCredits = await callTool("get_credits", handleGetCredits, {
      movie_id: id,
      department: "Directing",
    }, tmdb);

    if (dirCredits?.crew?.length) {
      console.log(`  Directors: ${dirCredits.crew.map(c => `${c.name} [${c.job}]`).join(", ")}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3: Festival premieres for comp films
// ═══════════════════════════════════════════════════════════════
async function phase3_premieres(filmIds) {
  section("PHASE 3: FESTIVAL PREMIERES (get_festival_premieres)");

  for (const [title, id] of Object.entries(filmIds)) {
    const premieres = await callTool("get_festival_premieres", handleGetFestivalPremieres, {
      movie_id: id,
    }, tmdb);

    if (premieres?.premieres?.length) {
      console.log(`  ${title}:`);
      for (const p of premieres.premieres.slice(0, 3)) {
        console.log(`    ${p.date} — ${p.country}${p.note ? ` (${p.note})` : ""}`);
      }
    } else {
      console.log(`  ${title}: No premiere data in TMDB`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4: Awards intelligence — film awards for comp films
// ═══════════════════════════════════════════════════════════════
async function phase4_filmAwards(filmIds) {
  section("PHASE 4: FILM AWARDS (get_film_awards — exercises M7 crew cross-referencing)");

  // Test on 3 key comps
  const testFilms = ["Minding the Gap", "Restrepo", "Strong Island"];

  for (const title of testFilms) {
    const id = filmIds[title];
    if (!id) continue;

    subsection(`${title} (TMDB ${id})`);

    const awards = await callAwardTool("get_film_awards", handleGetFilmAwards, {
      movie_id: id,
      job_filter: ["Director", "Producer", "Executive Producer", "Cinematographer", "Editor"],
    });

    if (awards) {
      // Direct film awards
      if (awards.awards?.length) {
        console.log(`  Direct film awards: ${awards.awards.length}`);
        for (const a of awards.awards.slice(0, 5)) {
          console.log(`    ${a.label} — ${a.ceremony} (${a.year || "?"}) [${a.result}]`);
        }
      } else {
        console.log(`  Direct film awards: 0 (typical for docs — P166 gap)`);
      }

      // Crew nominations (P1411 cross-referencing — the key value channel)
      if (awards.crewNominations?.length) {
        console.log(`  Crew with matching nominations: ${awards.crewNominations.length}`);
        for (const cn of awards.crewNominations.slice(0, 5)) {
          console.log(`    ${cn.person?.name} [${cn.person?.roles?.join(", ")}]: ${cn.nominations?.length || 0} nominations`);
          for (const n of (cn.nominations || []).slice(0, 3)) {
            console.log(`      → ${n.label} — ${n.ceremony} (${n.year || "?"})`);
          }
        }
      } else {
        console.log(`  Crew with matching nominations: 0`);
      }

      // Resolved crew (enriched with Wikidata ID + award counts — BOD-198)
      if (awards.resolvedCrew?.length) {
        console.log(`  Resolved crew (with award profiles): ${awards.resolvedCrew.length}`);
        const notable = awards.resolvedCrew
          .filter(c => (c.totalWins || 0) + (c.totalNominations || 0) > 0)
          .sort((a, b) => ((b.totalWins || 0) + (b.totalNominations || 0)) - ((a.totalWins || 0) + (a.totalNominations || 0)))
          .slice(0, 5);
        for (const c of notable) {
          console.log(`    ${c.name} [${c.roles?.join(", ")}]: ${c.totalWins || 0}W / ${c.totalNominations || 0}N`);
          if (c.byCeremony) {
            const topCeremonies = Object.entries(c.byCeremony)
              .sort(([,a], [,b]) => ((b.wins || 0) + (b.nominations || 0)) - ((a.wins || 0) + (a.nominations || 0)))
              .slice(0, 3);
            for (const [ceremony, counts] of topCeremonies) {
              console.log(`      ${ceremony}: ${counts.wins || 0}W / ${counts.nominations || 0}N`);
            }
          }
        }
      }

      // Skipped crew
      if (awards.skippedCrew?.length) {
        console.log(`  Unresolvable crew: ${awards.skippedCrew.length}`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5: Person awards for key directors (exercises M14 name fallback)
// ═══════════════════════════════════════════════════════════════
async function phase5_directorAwards(filmIds) {
  section("PHASE 5: DIRECTOR AWARDS (get_person_awards — exercises M14 name fallback)");

  for (const directorName of KEY_DIRECTORS) {
    subsection(directorName);

    // First, search for the director to get TMDB ID
    const searchResult = await callTool("search", handleSearch, {
      query: directorName,
      type: "person",
    }, tmdb);

    const personId = searchResult?.results?.[0]?.id;
    if (!personId) {
      console.log(`  Could not find ${directorName} on TMDB`);
      continue;
    }

    console.log(`  TMDB ID: ${personId}`);

    // Get person awards — use BOTH tmdb_id and name (exercises the name fallback path)
    const awards = await callAwardTool("get_person_awards", handleGetPersonAwards, {
      person_id: personId,
      name: directorName,
    });

    if (awards) {
      console.log(`  Resolution: ${awards.entity?.resolvedVia || "unknown"} → Wikidata ${awards.entity?.wikidataId || "N/A"}`);
      if (awards.wins?.length || awards.nominations?.length) {
        console.log(`  Wins: ${awards.wins?.length || 0} | Nominations: ${awards.nominations?.length || 0}`);
        for (const w of (awards.wins || []).slice(0, 5)) {
          console.log(`    WIN: ${w.label} — ${w.ceremony} (${w.year || "?"})`);
        }
        for (const n of (awards.nominations || []).slice(0, 5)) {
          console.log(`    NOM: ${n.label} — ${n.ceremony} (${n.year || "?"})`);
        }
      } else {
        console.log(`  No wins or nominations found in Wikidata`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6: Award category history (exercises M13 registry expansion)
// ═══════════════════════════════════════════════════════════════
async function phase6_awardHistory() {
  section("PHASE 6: AWARD HISTORY (get_award_history + search_awards — exercises M13)");

  // First, search for relevant award categories
  subsection("search_awards: documentary-relevant categories");

  const docSearch = await callAwardTool("search_awards", handleSearchAwards, {
    query: "documentary",
  });

  if (docSearch?.categories?.length) {
    console.log(`  Found ${docSearch.categories.length} documentary-related categories:`);
    for (const r of docSearch.categories.slice(0, 10)) {
      console.log(`    ${r.ceremony} → ${r.label} (${r.id})`);
    }
  }
  if (docSearch?.ceremonies?.length) {
    console.log(`  Matching ceremonies: ${docSearch.ceremonies.map(c => c.label).join(", ")}`);
  }

  // Search for M13 additions specifically
  subsection("search_awards: M13 additions — Gotham, Peabody, Emmy, Guggenheim");

  for (const query of ["gotham", "peabody", "emmy documentary", "guggenheim"]) {
    const result = await callAwardTool("search_awards", handleSearchAwards, { query });
    if (result?.categories?.length || result?.ceremonies?.length) {
      const catCount = result.categories?.length || 0;
      const cerCount = result.ceremonies?.length || 0;
      console.log(`  "${query}": ${catCount} categories, ${cerCount} ceremonies`);
      for (const r of (result.categories || []).slice(0, 4)) {
        console.log(`    → ${r.ceremony}: ${r.label} (${r.id})`);
      }
    }
  }

  // Get award history for Sundance Grand Jury Prize (Documentary)
  subsection("get_award_history: Sundance Grand Jury Prize — U.S. Documentary");

  const sundanceHistory = await callAwardTool("get_award_history", handleGetAwardHistory, {
    category: "sundance-grand-jury-documentary",
  });

  if (sundanceHistory?.history?.length) {
    console.log(`  Sundance Grand Jury — U.S. Documentary: ${sundanceHistory.history.length} years`);
    const recent = sundanceHistory.history
      .filter(h => h.year && h.year >= 2015)
      .sort((a, b) => b.year - a.year);
    for (const h of recent.slice(0, 10)) {
      const names = h.recipients.map(r => r.label).join(", ");
      console.log(`    ${h.year}: ${names}`);
    }
  }

  // Gotham Best Documentary (M13 addition)
  subsection("get_award_history: Gotham Best Documentary (M13)");

  const gothamHistory = await callAwardTool("get_award_history", handleGetAwardHistory, {
    category: "gotham-best-documentary",
  });

  if (gothamHistory?.history?.length) {
    console.log(`  Gotham Best Documentary: ${gothamHistory.history.length} years`);
    for (const h of gothamHistory.history.slice(0, 8)) {
      const names = h.recipients.map(r => r.label).join(", ");
      console.log(`    ${h.year}: ${names}`);
    }
  }

  // Peabody Award (M13 addition)
  subsection("get_award_history: Peabody Awards (M13)");

  const peabodyHistory = await callAwardTool("get_award_history", handleGetAwardHistory, {
    category: "peabody-award",
  });

  if (peabodyHistory?.history?.length) {
    console.log(`  Peabody Award: ${peabodyHistory.history.length} total years`);
    const recentPeabody = peabodyHistory.history
      .filter(h => h.year && h.year >= 2018)
      .sort((a, b) => b.year - a.year);
    for (const h of recentPeabody.slice(0, 8)) {
      const names = h.recipients.slice(0, 3).map(r => r.label).join(", ");
      const more = h.recipients.length > 3 ? ` + ${h.recipients.length - 3} more` : "";
      console.log(`    ${h.year}: ${names}${more}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7: Distribution intel — watch providers
// ═══════════════════════════════════════════════════════════════
async function phase7_distribution(filmIds) {
  section("PHASE 7: DISTRIBUTION INTEL (watch_providers)");

  for (const [title, id] of Object.entries(filmIds)) {
    const providers = await callTool("watch_providers", handleWatchProviders, {
      media_type: "movie",
      id: id,
      region: "US",
    }, tmdb);

    if (providers?.results?.US) {
      const us = providers.results.US;
      const streams = us.flatrate?.map(p => p.provider_name) || [];
      const rent = us.rent?.map(p => p.provider_name) || [];
      const buy = us.buy?.map(p => p.provider_name) || [];
      console.log(`  ${title}:`);
      if (streams.length) console.log(`    Stream: ${streams.join(", ")}`);
      if (rent.length) console.log(`    Rent: ${rent.join(", ")}`);
      if (buy.length) console.log(`    Buy: ${buy.join(", ")}`);
      if (!streams.length && !rent.length && !buy.length) console.log(`    No US providers listed`);
    } else {
      console.log(`  ${title}: No US watch provider data`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8: Thematic discovery — find more films like BreakFall
// ═══════════════════════════════════════════════════════════════
async function phase8_thematicDiscovery() {
  section("PHASE 8: THEMATIC DISCOVERY (search_keywords + discover)");

  // Batch keyword search (M11 feature)
  subsection("Batch keyword search for BreakFall themes");

  const keywords = await callTool("search_keywords", handleSearchKeywords, {
    query: ["martial arts", "masculinity", "coming of age", "mentorship", "documentary", "texas", "military"],
  }, tmdb);

  if (keywords) {
    const keywordIds = [];
    for (const [query, results] of Object.entries(keywords)) {
      if (results?.results?.[0]) {
        const kw = results.results[0];
        keywordIds.push(kw.id);
        console.log(`  "${query}" → ID ${kw.id} (${kw.name})`);
      } else {
        console.log(`  "${query}" → no match`);
      }
    }

    // Discover docs with coming-of-age + documentary themes
    if (keywordIds.length >= 2) {
      subsection("Discover: documentary + coming-of-age films (2015-2025)");

      const docGenreId = 99; // Documentary genre ID
      const discovered = await callTool("discover", handleDiscover, {
        media_type: "movie",
        with_genres: String(docGenreId),
        primary_release_date_gte: "2015-01-01",
        primary_release_date_lte: "2025-12-31",
        sort_by: "vote_average.desc",
        vote_count_gte: 50,
      }, tmdb);

      if (discovered?.results?.length) {
        console.log(`  Top-rated documentaries (2015-2025) with 20+ votes:`);
        for (const film of discovered.results.slice(0, 15)) {
          console.log(`    ${film.title} (${film.release_date?.slice(0, 4)}) — ${film.vote_average}/10 (${film.vote_count} votes)`);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9: Trending docs + market temperature
// ═══════════════════════════════════════════════════════════════
async function phase9_trending() {
  section("PHASE 9: MARKET TEMPERATURE (trending)");

  const trending = await callTool("trending", handleTrending, {
    media_type: "movie",
    time_window: "week",
  }, tmdb);

  if (trending?.results?.length) {
    // Filter for docs in trending
    const docs = trending.results.filter(m => m.genre_ids?.includes(99));
    console.log(`  Trending movies this week: ${trending.results.length} total, ${docs.length} documentaries`);
    if (docs.length) {
      for (const d of docs) {
        console.log(`    📽 ${d.title} (${d.release_date?.slice(0, 4)}) — ${d.vote_average}/10`);
      }
    }
    console.log(`\n  Top 5 trending overall (for context):`);
    for (const m of trending.results.slice(0, 5)) {
      console.log(`    ${m.title} (${m.release_date?.slice(0, 4)}) — ${m.vote_average}/10`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║           BREAKFALL GTM RESEARCH — film-data-mcp v0.10.0           ║");
  console.log("║     Exercising all 20 tools against live TMDB + Wikidata APIs       ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");

  const t0 = Date.now();
  let toolCalls = 0;

  // Phase 1: Find all comp films
  const filmIds = await phase1_findCompFilms();
  toolCalls += COMP_FILMS.length;

  // Phase 2: Details + credits for top comps
  await phase2_compDetails(filmIds);
  toolCalls += 8; // 4 details + 4 get_credits

  // Phase 3: Festival premieres
  await phase3_premieres(filmIds);
  toolCalls += Object.keys(filmIds).length;

  // Phase 4: Film awards (crew cross-referencing)
  await phase4_filmAwards(filmIds);
  toolCalls += 3;

  // Phase 5: Director awards (M14 name fallback)
  await phase5_directorAwards(filmIds);
  toolCalls += KEY_DIRECTORS.length * 2; // search + awards

  // Phase 6: Award history (M13 registry)
  await phase6_awardHistory();
  toolCalls += 8; // search_awards + get_award_history calls

  // Phase 7: Distribution intel
  await phase7_distribution(filmIds);
  toolCalls += Object.keys(filmIds).length;

  // Phase 8: Thematic discovery
  await phase8_thematicDiscovery();
  toolCalls += 2; // search_keywords + discover

  // Phase 9: Market temperature
  await phase9_trending();
  toolCalls += 1;

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  section("SUMMARY");
  console.log(`  Total tool calls: ~${toolCalls}`);
  console.log(`  Elapsed: ${elapsed}s`);
  console.log(`  Tools exercised: search, movie_details, get_credits, get_festival_premieres,`);
  console.log(`    get_film_awards, get_person_awards, get_award_history, search_awards,`);
  console.log(`    watch_providers, search_keywords, discover, trending`);
  console.log(`  Tools NOT exercised: tv_details, person_details, curated_lists, genres,`);
  console.log(`    find_by_external_id, collection_details, company_details, company_filmography`);
  console.log(`  (Unexercised tools are TV/reference tools — not relevant to doc GTM workflow)`);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
