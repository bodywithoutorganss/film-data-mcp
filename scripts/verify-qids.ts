// ABOUTME: Script to verify Wikidata QIDs for the awards registry.
// ABOUTME: Resolves QIDs via Wikidata API and searches for entities by label.

import { CEREMONIES, AWARD_CATEGORIES } from "../src/types/awards-registry.js";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "film-data-mcp QID verification script";

async function resolveQid(qid: string): Promise<{ label: string; description: string } | null> {
  const url = `${WIKIDATA_API}?action=wbgetentities&ids=${qid}&props=labels|descriptions&languages=en&format=json`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    const entity = data.entities?.[qid];
    if (!entity) return null;
    return {
      label: entity.labels?.en?.value ?? "(no label)",
      description: entity.descriptions?.en?.value ?? "(no description)",
    };
  } catch {
    return null;
  }
}

async function searchEntities(label: string): Promise<void> {
  const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en&format=json&limit=5`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = (await response.json()) as any;
  console.log(`\n--- ${label} ---`);
  for (const item of data.search ?? []) {
    console.log(`  ${item.id}: ${item.label ?? ""} — ${item.description ?? ""}`);
  }
}

async function verifyRegistry(): Promise<void> {
  let failures = 0;

  console.log("=== Verifying Ceremonies ===\n");
  for (const ceremony of CEREMONIES) {
    const result = await resolveQid(ceremony.wikidataId);
    if (!result) {
      console.log(`  FAIL ${ceremony.id}: ${ceremony.wikidataId} did not resolve`);
      failures++;
    } else {
      console.log(`  OK   ${ceremony.id}: ${ceremony.wikidataId} → ${result.label}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n=== Verifying Award Categories ===\n");
  for (const cat of AWARD_CATEGORIES) {
    const result = await resolveQid(cat.wikidataId);
    if (!result) {
      console.log(`  FAIL ${cat.id}: ${cat.wikidataId} did not resolve`);
      failures++;
    } else {
      console.log(`  OK   ${cat.id}: ${cat.wikidataId} → ${result.label}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n--- ${failures === 0 ? "All QIDs verified" : `${failures} failures`} ---`);
  if (failures > 0) process.exit(1);
}

async function main() {
  const mode = process.argv[2];

  if (mode === "verify") {
    await verifyRegistry();
  } else if (mode === "search") {
    const label = process.argv.slice(3).join(" ");
    if (!label) {
      console.error("Usage: verify-qids.ts search <label>");
      process.exit(1);
    }
    await searchEntities(label);
  } else {
    console.log("Usage:");
    console.log("  verify-qids.ts verify          Verify all QIDs in the registry");
    console.log("  verify-qids.ts search <label>  Search Wikidata for entities by label");
  }
}

main().catch(console.error);
