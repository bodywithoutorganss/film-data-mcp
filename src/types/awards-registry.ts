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
  { id: "academy-awards", label: "Academy Awards", wikidataId: "Q19020", type: "ceremony" },
  { id: "golden-globes", label: "Golden Globe Awards", wikidataId: "Q1011547", type: "ceremony" },
  { id: "cannes", label: "Cannes Film Festival", wikidataId: "Q42369", type: "festival" },
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
