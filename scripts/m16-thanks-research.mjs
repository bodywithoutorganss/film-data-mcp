// ABOUTME: Probes TMDB credits for "Thanks" department entries across 10 films.
// ABOUTME: Research script for M16 — assesses coverage, job title variants, and reverse lookup viability.

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
if (!TMDB_TOKEN) {
  console.error("TMDB_ACCESS_TOKEN required");
  process.exit(1);
}

const PROBE_FILMS = [
  // Comp docs
  { id: 489985, title: "Minding the Gap", tier: "comp_doc" },
  { id: 653723, title: "Boys State", tier: "comp_doc" },
  { id: 653574, title: "Dick Johnson Is Dead", tier: "comp_doc" },
  // Big docs
  { id: 340101, title: "13th", tier: "big_doc" },
  { id: 464593, title: "Won't You Be My Neighbor?", tier: "big_doc" },
  { id: 504562, title: "Free Solo", tier: "big_doc" },
  { id: 506702, title: "RBG", tier: "big_doc" },
  // Fiction
  { id: 122, title: "LOTR: Return of the King", tier: "fiction" },
  { id: 299534, title: "Avengers: Endgame", tier: "fiction" },
  { id: 496243, title: "Parasite", tier: "fiction" },
];

async function tmdbGet(endpoint) {
  const res = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}

async function probeFilm(film) {
  const credits = await tmdbGet(`/movie/${film.id}/credits`);
  const thanksCrew = (credits.crew || []).filter(
    (c) => c.department?.toLowerCase() === "thanks"
  );

  // Check if thanked people have valid TMDB person pages
  const personChecks = [];
  for (const person of thanksCrew.slice(0, 3)) {
    try {
      const details = await tmdbGet(`/person/${person.id}`);
      personChecks.push({
        id: person.id,
        name: person.name,
        job: person.job,
        has_profile: !!details.biography,
        known_for_department: details.known_for_department,
      });
    } catch (e) {
      personChecks.push({ id: person.id, name: person.name, job: person.job, error: e.message });
    }
  }

  // Collect unique job titles in Thanks department
  const jobTitles = [...new Set(thanksCrew.map((c) => c.job))];

  return {
    ...film,
    thanks_count: thanksCrew.length,
    total_crew: credits.crew?.length ?? 0,
    job_titles: jobTitles,
    sample_people: personChecks,
    thanks_entries: thanksCrew.map((c) => ({ id: c.id, name: c.name, job: c.job })),
  };
}

// Check if person combined_credits includes Thanks department entries
async function probeReverseLookup(personId, personName) {
  const details = await tmdbGet(`/person/${personId}?append_to_response=combined_credits`);
  const thanksCrew = (details.combined_credits?.crew || []).filter(
    (c) => c.department?.toLowerCase() === "thanks"
  );
  return {
    person_id: personId,
    person_name: personName,
    thanks_in_combined_credits: thanksCrew.length,
    films_thanked_in: thanksCrew.map((c) => ({
      id: c.id,
      title: c.title || c.name,
      media_type: c.media_type,
      job: c.job,
    })),
  };
}

async function main() {
  console.log("=== M16 TMDB Thanks Research ===\n");

  // Forward probes
  console.log("--- Forward Probes (film → thanks credits) ---\n");
  const results = [];
  for (const film of PROBE_FILMS) {
    const result = await probeFilm(film);
    results.push(result);
    console.log(`${film.title} (${film.tier}): ${result.thanks_count} thanks entries`);
    if (result.job_titles.length > 0) {
      console.log(`  Job titles: ${result.job_titles.join(", ")}`);
    }
    if (result.sample_people.length > 0) {
      console.log(`  Sample people: ${result.sample_people.map((p) => `${p.name} (${p.job})`).join(", ")}`);
    }
    console.log();
  }

  // Summary stats
  const withThanks = results.filter((r) => r.thanks_count > 0);
  console.log(`\n--- Summary ---`);
  console.log(`Films with Thanks credits: ${withThanks.length}/${results.length}`);
  console.log(`Total Thanks entries: ${results.reduce((sum, r) => sum + r.thanks_count, 0)}`);
  console.log(`All job titles: ${[...new Set(results.flatMap((r) => r.job_titles))].join(", ")}`);

  // Reverse probe: pick first person found in Thanks credits
  const firstThankedPerson = results.find((r) => r.thanks_entries.length > 0)?.thanks_entries[0];
  if (firstThankedPerson) {
    console.log(`\n--- Reverse Probe (person → films thanked in) ---`);
    console.log(`Testing with: ${firstThankedPerson.name} (ID: ${firstThankedPerson.id})\n`);
    const reverseResult = await probeReverseLookup(firstThankedPerson.id, firstThankedPerson.name);
    console.log(`Thanks in combined_credits: ${reverseResult.thanks_in_combined_credits}`);
    for (const film of reverseResult.films_thanked_in) {
      console.log(`  ${film.title} (${film.media_type}) — ${film.job}`);
    }
  } else {
    console.log("\nNo Thanks credits found in any probed film — cannot test reverse lookup.");
  }

  // Full JSON output
  console.log("\n\n=== Full JSON Results ===\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
