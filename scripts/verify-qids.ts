// ABOUTME: One-time script to verify Wikidata QIDs for the awards registry.
// ABOUTME: Queries Wikidata SPARQL to confirm each QID resolves to the expected entity.

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

interface VerificationEntry {
  searchLabel: string;
  expectedType: string;
}

const CEREMONIES_TO_VERIFY: Record<string, VerificationEntry> = {
  "Screen Actors Guild Award": { searchLabel: "Screen Actors Guild Award", expectedType: "award" },
  "Directors Guild of America Award": { searchLabel: "Directors Guild of America Award", expectedType: "award" },
  "Writers Guild of America Award": { searchLabel: "Writers Guild of America Award", expectedType: "award" },
  "Producers Guild of America Award": { searchLabel: "Producers Guild of America Award", expectedType: "award" },
  "Independent Spirit Award": { searchLabel: "Independent Spirit Awards", expectedType: "award" },
  "BAFTA": { searchLabel: "British Academy Film Awards", expectedType: "award" },
  "Venice Film Festival": { searchLabel: "Venice Film Festival", expectedType: "film festival" },
  "Berlin International Film Festival": { searchLabel: "Berlin International Film Festival", expectedType: "film festival" },
  "TIFF": { searchLabel: "Toronto International Film Festival", expectedType: "film festival" },
  "Emmy Awards": { searchLabel: "Primetime Emmy Award", expectedType: "award" },
  "Sundance": { searchLabel: "Sundance Film Festival", expectedType: "film festival" },
  "SXSW": { searchLabel: "South by Southwest Film Festival", expectedType: "film festival" },
  "Tribeca": { searchLabel: "Tribeca Film Festival", expectedType: "film festival" },
  "Telluride": { searchLabel: "Telluride Film Festival", expectedType: "film festival" },
  "DOC NYC": { searchLabel: "DOC NYC", expectedType: "film festival" },
  "Hot Docs": { searchLabel: "Hot Docs Canadian International Documentary Festival", expectedType: "film festival" },
  "True/False": { searchLabel: "True/False Film Fest", expectedType: "film festival" },
};

async function searchEntity(label: string): Promise<void> {
  const query = `
    SELECT ?item ?itemLabel ?itemDescription WHERE {
      ?item rdfs:label "${label}"@en .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 5
  `;
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "film-data-mcp QID verification script" },
  });
  const data = await response.json();
  console.log(`\n--- ${label} ---`);
  for (const binding of (data as any).results.bindings) {
    const qid = binding.item.value.split("/").pop();
    const desc = binding.itemDescription?.value ?? "(no description)";
    console.log(`  ${qid}: ${binding.itemLabel.value} — ${desc}`);
  }
}

async function searchAwardCategories(ceremonyLabel: string): Promise<void> {
  const query = `
    SELECT ?item ?itemLabel WHERE {
      ?item rdfs:label ?label .
      FILTER(LANG(?label) = "en")
      FILTER(STRSTARTS(?label, "${ceremonyLabel} for"))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    ORDER BY ?itemLabel
    LIMIT 50
  `;
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "film-data-mcp QID verification script" },
  });
  const data = await response.json();
  console.log(`\n=== Categories for: ${ceremonyLabel} ===`);
  for (const binding of (data as any).results.bindings) {
    const qid = binding.item.value.split("/").pop();
    console.log(`  { id: "TODO", ceremony: "TODO", label: "${binding.itemLabel.value}", wikidataId: "${qid}", domain: "TODO" },`);
  }
}

async function main() {
  const mode = process.argv[2];

  if (mode === "categories") {
    const ceremonies = [
      "Academy Award",
      "Golden Globe Award",
      "BAFTA Award",
      "Primetime Emmy Award",
      "Screen Actors Guild Award",
      "Directors Guild of America Award",
      "Independent Spirit Award",
    ];
    for (const ceremony of ceremonies) {
      await searchAwardCategories(ceremony);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } else {
    for (const [name, entry] of Object.entries(CEREMONIES_TO_VERIFY)) {
      await searchEntity(entry.searchLabel);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

main().catch(console.error);
