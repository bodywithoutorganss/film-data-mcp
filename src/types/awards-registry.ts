// ABOUTME: Curated registry of Wikidata QIDs for film ceremonies, festivals, and award categories.
// ABOUTME: Every QID must be verified via SPARQL before entry. See design doc for verification process.

export interface Ceremony {
  id: string;
  label: string;
  wikidataId: string;
  type: "ceremony" | "festival" | "fellowship" | "lab" | "grant";
}

export interface AwardCategory {
  id: string;
  ceremony: string;
  label: string;
  wikidataId: string;
  domain: string;
}

// --- Ceremonies ---
// All QIDs verified via SPARQL. Additional ceremonies added during QID verification task.

export const CEREMONIES: Ceremony[] = [
  // Major ceremonies
  { id: "academy-awards", label: "Academy Awards", wikidataId: "Q19020", type: "ceremony" },
  { id: "golden-globes", label: "Golden Globe Awards", wikidataId: "Q1011547", type: "ceremony" },
  { id: "sag-awards", label: "Screen Actors Guild Awards", wikidataId: "Q268200", type: "ceremony" },
  { id: "dga-awards", label: "Directors Guild of America Awards", wikidataId: "Q1111310", type: "ceremony" },
  { id: "wga-awards", label: "Writers Guild of America Awards", wikidataId: "Q1415017", type: "ceremony" },
  { id: "pga-awards", label: "Producers Guild of America Awards", wikidataId: "Q3406648", type: "ceremony" },
  { id: "independent-spirit", label: "Independent Spirit Awards", wikidataId: "Q311836", type: "ceremony" },
  { id: "bafta", label: "BAFTA Awards", wikidataId: "Q732997", type: "ceremony" },
  { id: "emmys", label: "Primetime Emmy Awards", wikidataId: "Q1044427", type: "ceremony" },

  // Major festivals
  { id: "cannes", label: "Cannes Film Festival", wikidataId: "Q42369", type: "festival" },
  { id: "venice", label: "Venice Film Festival", wikidataId: "Q49024", type: "festival" },
  { id: "berlin", label: "Berlin International Film Festival", wikidataId: "Q130871", type: "festival" },
  { id: "tiff", label: "Toronto International Film Festival", wikidataId: "Q390018", type: "festival" },

  // Independent and documentary festivals
  { id: "sundance", label: "Sundance Film Festival", wikidataId: "Q189887", type: "festival" },
  { id: "sxsw", label: "SXSW Film Festival", wikidataId: "Q55122717", type: "festival" },
  { id: "tribeca", label: "Tribeca Film Festival", wikidataId: "Q853325", type: "festival" },
  { id: "telluride", label: "Telluride Film Festival", wikidataId: "Q2402350", type: "festival" },
  { id: "docnyc", label: "DOC NYC", wikidataId: "Q18349859", type: "festival" },
  { id: "hot-docs", label: "Hot Docs", wikidataId: "Q5909927", type: "festival" },
  { id: "true-false", label: "True/False Film Festival", wikidataId: "Q7847299", type: "festival" },
];

// --- Award Categories ---
// All QIDs verified via SPARQL. Additional categories added during QID population task.

export const AWARD_CATEGORIES: AwardCategory[] = [
  { id: "academy-best-cinematography", ceremony: "academy-awards", label: "Academy Award for Best Cinematography", wikidataId: "Q131520", domain: "cinematography" },
  { id: "cannes-palme-dor", ceremony: "cannes", label: "Palme d'Or", wikidataId: "Q179808", domain: "picture" },
];

// --- Lookup functions ---

export function findCeremony(id: string): Ceremony | undefined {
  return CEREMONIES.find((c) => c.id === id);
}

export function findCategory(id: string): AwardCategory | undefined {
  return AWARD_CATEGORIES.find((c) => c.id === id);
}

export function findCategoriesByDomain(domain: string): AwardCategory[] {
  return AWARD_CATEGORIES.filter((c) => c.domain === domain);
}

export function findCategoriesByCeremony(ceremonyId: string): AwardCategory[] {
  return AWARD_CATEGORIES.filter((c) => c.ceremony === ceremonyId);
}
