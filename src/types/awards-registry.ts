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
  // --- Academy Awards ---
  { id: "academy-best-picture", ceremony: "academy-awards", label: "Academy Award for Best Picture", wikidataId: "Q102427", domain: "picture" },
  { id: "academy-best-director", ceremony: "academy-awards", label: "Academy Award for Best Director", wikidataId: "Q103360", domain: "director" },
  { id: "academy-best-actor", ceremony: "academy-awards", label: "Academy Award for Best Actor", wikidataId: "Q103916", domain: "acting" },
  { id: "academy-best-actress", ceremony: "academy-awards", label: "Academy Award for Best Actress", wikidataId: "Q103618", domain: "acting" },
  { id: "academy-supporting-actor", ceremony: "academy-awards", label: "Academy Award for Best Supporting Actor", wikidataId: "Q106291", domain: "supporting-acting" },
  { id: "academy-supporting-actress", ceremony: "academy-awards", label: "Academy Award for Best Supporting Actress", wikidataId: "Q106301", domain: "supporting-acting" },
  { id: "academy-original-screenplay", ceremony: "academy-awards", label: "Academy Award for Best Original Screenplay", wikidataId: "Q41417", domain: "screenplay" },
  { id: "academy-adapted-screenplay", ceremony: "academy-awards", label: "Academy Award for Best Adapted Screenplay", wikidataId: "Q107258", domain: "screenplay" },
  { id: "academy-best-cinematography", ceremony: "academy-awards", label: "Academy Award for Best Cinematography", wikidataId: "Q131520", domain: "cinematography" },
  { id: "academy-best-editing", ceremony: "academy-awards", label: "Academy Award for Best Film Editing", wikidataId: "Q281939", domain: "editing" },
  { id: "academy-best-score", ceremony: "academy-awards", label: "Academy Award for Best Original Score", wikidataId: "Q488651", domain: "score" },
  { id: "academy-best-international", ceremony: "academy-awards", label: "Academy Award for Best International Feature Film", wikidataId: "Q105304", domain: "international" },
  { id: "academy-best-animated", ceremony: "academy-awards", label: "Academy Award for Best Animated Feature", wikidataId: "Q106800", domain: "animated" },
  { id: "academy-best-documentary", ceremony: "academy-awards", label: "Academy Award for Best Documentary Feature Film", wikidataId: "Q111332", domain: "documentary" },

  // --- Golden Globe Awards ---
  { id: "golden-globes-best-drama", ceremony: "golden-globes", label: "Golden Globe Award for Best Motion Picture – Drama", wikidataId: "Q1011509", domain: "picture" },
  { id: "golden-globes-best-musical-comedy", ceremony: "golden-globes", label: "Golden Globe Award for Best Motion Picture – Musical or Comedy", wikidataId: "Q670282", domain: "picture" },
  { id: "golden-globes-best-director", ceremony: "golden-globes", label: "Golden Globe Award for Best Director", wikidataId: "Q586356", domain: "director" },
  { id: "golden-globes-best-actor-drama", ceremony: "golden-globes", label: "Golden Globe Award for Best Actor – Motion Picture Drama", wikidataId: "Q593098", domain: "acting" },
  { id: "golden-globes-best-actress-drama", ceremony: "golden-globes", label: "Golden Globe Award for Best Actress – Motion Picture Drama", wikidataId: "Q463085", domain: "acting" },
  { id: "golden-globes-best-actor-musical-comedy", ceremony: "golden-globes", label: "Golden Globe Award for Best Actor – Motion Picture Musical or Comedy", wikidataId: "Q181883", domain: "acting" },
  { id: "golden-globes-best-actress-musical-comedy", ceremony: "golden-globes", label: "Golden Globe Award for Best Actress – Motion Picture Musical or Comedy", wikidataId: "Q1011564", domain: "acting" },
  { id: "golden-globes-supporting-actor", ceremony: "golden-globes", label: "Golden Globe Award for Best Supporting Actor – Motion Picture", wikidataId: "Q723830", domain: "supporting-acting" },
  { id: "golden-globes-supporting-actress", ceremony: "golden-globes", label: "Golden Globe Award for Best Supporting Actress – Motion Picture", wikidataId: "Q822907", domain: "supporting-acting" },
  { id: "golden-globes-best-screenplay", ceremony: "golden-globes", label: "Golden Globe Award for Best Screenplay", wikidataId: "Q849124", domain: "screenplay" },
  { id: "golden-globes-best-score", ceremony: "golden-globes", label: "Golden Globe Award for Best Original Score", wikidataId: "Q1422140", domain: "score" },
  { id: "golden-globes-best-animated", ceremony: "golden-globes", label: "Golden Globe Award for Best Animated Feature Film", wikidataId: "Q878902", domain: "animated" },
  { id: "golden-globes-best-foreign-language", ceremony: "golden-globes", label: "Golden Globe Award for Best Non-English Language Film", wikidataId: "Q387380", domain: "international" },

  // --- BAFTA Awards ---
  { id: "bafta-best-film", ceremony: "bafta", label: "BAFTA Award for Best Film", wikidataId: "Q139184", domain: "picture" },
  { id: "bafta-best-director", ceremony: "bafta", label: "BAFTA Award for Best Direction", wikidataId: "Q787131", domain: "director" },
  { id: "bafta-best-actor", ceremony: "bafta", label: "BAFTA Award for Best Actor in a Leading Role", wikidataId: "Q400007", domain: "acting" },
  { id: "bafta-best-actress", ceremony: "bafta", label: "BAFTA Award for Best Actress in a Leading Role", wikidataId: "Q687123", domain: "acting" },
  { id: "bafta-supporting-actor", ceremony: "bafta", label: "BAFTA Award for Best Actor in a Supporting Role", wikidataId: "Q548389", domain: "supporting-acting" },
  { id: "bafta-supporting-actress", ceremony: "bafta", label: "BAFTA Award for Best Actress in a Supporting Role", wikidataId: "Q787123", domain: "supporting-acting" },
  { id: "bafta-original-screenplay", ceremony: "bafta", label: "BAFTA Award for Best Original Screenplay", wikidataId: "Q41375", domain: "screenplay" },
  { id: "bafta-adapted-screenplay", ceremony: "bafta", label: "BAFTA Award for Best Adapted Screenplay", wikidataId: "Q739694", domain: "screenplay" },
  { id: "bafta-best-cinematography", ceremony: "bafta", label: "BAFTA Award for Best Cinematography", wikidataId: "Q778870", domain: "cinematography" },
  { id: "bafta-best-editing", ceremony: "bafta", label: "BAFTA Award for Best Editing", wikidataId: "Q787145", domain: "editing" },
  { id: "bafta-best-score", ceremony: "bafta", label: "BAFTA Award for Best Original Music", wikidataId: "Q787098", domain: "score" },
  { id: "bafta-best-international", ceremony: "bafta", label: "BAFTA Award for Best Film Not in the English Language", wikidataId: "Q2925687", domain: "international" },
  { id: "bafta-best-animated", ceremony: "bafta", label: "BAFTA Award for Best Animated Film", wikidataId: "Q240201", domain: "animated" },
  { id: "bafta-best-documentary", ceremony: "bafta", label: "BAFTA Award for Best Documentary", wikidataId: "Q511553", domain: "documentary" },

  // --- Primetime Emmy Awards ---
  { id: "emmys-outstanding-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Drama Series", wikidataId: "Q989438", domain: "picture" },
  { id: "emmys-outstanding-comedy", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Comedy Series", wikidataId: "Q2110156", domain: "picture" },
  { id: "emmys-lead-actor-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Lead Actor in a Drama Series", wikidataId: "Q989439", domain: "acting" },
  { id: "emmys-lead-actress-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Lead Actress in a Drama Series", wikidataId: "Q989445", domain: "acting" },
  { id: "emmys-lead-actor-comedy", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Lead Actor in a Comedy Series", wikidataId: "Q989442", domain: "acting" },
  { id: "emmys-lead-actress-comedy", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Lead Actress in a Comedy Series", wikidataId: "Q1287335", domain: "acting" },
  { id: "emmys-supporting-actor-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Supporting Actor in a Drama Series", wikidataId: "Q1286639", domain: "supporting-acting" },
  { id: "emmys-supporting-actress-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Supporting Actress in a Drama Series", wikidataId: "Q1285504", domain: "supporting-acting" },
  { id: "emmys-directing-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Directing for a Drama Series", wikidataId: "Q583972", domain: "director" },
  { id: "emmys-writing-drama", ceremony: "emmys", label: "Primetime Emmy Award for Outstanding Writing for a Drama Series", wikidataId: "Q3123491", domain: "screenplay" },

  // --- Screen Actors Guild Awards ---
  { id: "sag-best-cast", ceremony: "sag-awards", label: "SAG Award for Outstanding Performance by a Cast in a Motion Picture", wikidataId: "Q518675", domain: "picture" },
  { id: "sag-best-actor", ceremony: "sag-awards", label: "SAG Award for Outstanding Performance by a Male Actor in a Leading Role", wikidataId: "Q654620", domain: "acting" },
  { id: "sag-best-actress", ceremony: "sag-awards", label: "SAG Award for Outstanding Performance by a Female Actor in a Leading Role", wikidataId: "Q1129487", domain: "acting" },
  { id: "sag-supporting-actor", ceremony: "sag-awards", label: "SAG Award for Outstanding Performance by a Male Actor in a Supporting Role", wikidataId: "Q1260789", domain: "supporting-acting" },
  { id: "sag-supporting-actress", ceremony: "sag-awards", label: "SAG Award for Outstanding Performance by a Female Actor in a Supporting Role", wikidataId: "Q1320315", domain: "supporting-acting" },

  // --- Directors Guild of America Awards ---
  { id: "dga-best-director", ceremony: "dga-awards", label: "DGA Award for Outstanding Directing – Feature Film", wikidataId: "Q5280675", domain: "director" },

  // --- Writers Guild of America Awards ---
  { id: "wga-original-screenplay", ceremony: "wga-awards", label: "WGA Award for Best Original Screenplay", wikidataId: "Q8038461", domain: "screenplay" },
  { id: "wga-adapted-screenplay", ceremony: "wga-awards", label: "WGA Award for Best Adapted Screenplay", wikidataId: "Q8038458", domain: "screenplay" },

  // --- Producers Guild of America Awards ---
  { id: "pga-best-picture", ceremony: "pga-awards", label: "PGA Award for Best Theatrical Motion Picture", wikidataId: "Q5569374", domain: "picture" },

  // --- Independent Spirit Awards ---
  { id: "independent-spirit-best-film", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Film", wikidataId: "Q2544844", domain: "picture" },
  { id: "independent-spirit-best-director", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Director", wikidataId: "Q2295041", domain: "director" },
  { id: "independent-spirit-best-lead", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Lead Performance", wikidataId: "Q115803140", domain: "acting" },
  { id: "independent-spirit-best-screenplay", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Screenplay", wikidataId: "Q1170507", domain: "screenplay" },
  { id: "independent-spirit-best-first-feature", ceremony: "independent-spirit", label: "Independent Spirit Award for Best First Feature", wikidataId: "Q1170500", domain: "picture" },
  { id: "independent-spirit-best-cinematography", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Cinematography", wikidataId: "Q1170493", domain: "cinematography" },
  { id: "independent-spirit-best-documentary", ceremony: "independent-spirit", label: "Independent Spirit Award for Best Documentary Feature", wikidataId: "Q7027841", domain: "documentary" },
  { id: "independent-spirit-best-international", ceremony: "independent-spirit", label: "Independent Spirit Award for Best International Film", wikidataId: "Q2295011", domain: "international" },

  // --- Cannes Film Festival ---
  { id: "cannes-palme-dor", ceremony: "cannes", label: "Palme d'Or", wikidataId: "Q179808", domain: "picture" },
  { id: "cannes-grand-prix", ceremony: "cannes", label: "Grand Prix", wikidataId: "Q844804", domain: "picture" },
  { id: "cannes-jury-prize", ceremony: "cannes", label: "Jury Prize", wikidataId: "Q164200", domain: "picture" },
  { id: "cannes-best-director", ceremony: "cannes", label: "Cannes Best Director Award", wikidataId: "Q510175", domain: "director" },
  { id: "cannes-best-screenplay", ceremony: "cannes", label: "Best Screenplay Award", wikidataId: "Q978420", domain: "screenplay" },
  { id: "cannes-best-actor", ceremony: "cannes", label: "Cannes Film Festival Award for Best Actor", wikidataId: "Q586140", domain: "acting" },
  { id: "cannes-best-actress", ceremony: "cannes", label: "Cannes Film Festival Award for Best Actress", wikidataId: "Q840286", domain: "acting" },
  { id: "cannes-camera-dor", ceremony: "cannes", label: "Caméra d'Or", wikidataId: "Q775091", domain: "picture" },

  // --- Venice Film Festival ---
  { id: "venice-golden-lion", ceremony: "venice", label: "Golden Lion", wikidataId: "Q209459", domain: "picture" },
  { id: "venice-grand-jury-prize", ceremony: "venice", label: "Grand Jury Prize of the Venice Film Festival", wikidataId: "Q944480", domain: "picture" },
  { id: "venice-best-director", ceremony: "venice", label: "Silver Lion for Best Director", wikidataId: "Q1337827", domain: "director" },
  { id: "venice-best-actor", ceremony: "venice", label: "Volpi Cup for Best Actor", wikidataId: "Q2089923", domain: "acting" },
  { id: "venice-best-actress", ceremony: "venice", label: "Volpi Cup for Best Actress", wikidataId: "Q2089918", domain: "acting" },

  // --- Berlin International Film Festival ---
  { id: "berlin-golden-bear", ceremony: "berlin", label: "Golden Bear", wikidataId: "Q154590", domain: "picture" },
  { id: "berlin-grand-jury-prize", ceremony: "berlin", label: "Silver Bear Grand Jury Prize", wikidataId: "Q664212", domain: "picture" },
  { id: "berlin-best-director", ceremony: "berlin", label: "Silver Bear for Best Director", wikidataId: "Q706031", domain: "director" },
  { id: "berlin-best-leading-performance", ceremony: "berlin", label: "Silver Bear for Best Leading Performance", wikidataId: "Q110961984", domain: "acting" },
  { id: "berlin-best-supporting-performance", ceremony: "berlin", label: "Silver Bear for Best Supporting Performance", wikidataId: "Q110961983", domain: "supporting-acting" },
  { id: "berlin-best-screenplay", ceremony: "berlin", label: "Silver Bear for Best Script", wikidataId: "Q2285851", domain: "screenplay" },

  // --- Sundance Film Festival ---
  { id: "sundance-grand-jury-dramatic", ceremony: "sundance", label: "Sundance U.S. Dramatic Grand Jury Prize", wikidataId: "Q3774974", domain: "picture" },
  { id: "sundance-grand-jury-documentary", ceremony: "sundance", label: "Sundance Grand Jury Prize for Best Documentary", wikidataId: "Q2366088", domain: "documentary" },
  { id: "sundance-audience-award", ceremony: "sundance", label: "Sundance Film Festival Audience Award", wikidataId: "Q16020747", domain: "picture" },

  // --- Toronto International Film Festival ---
  { id: "tiff-peoples-choice", ceremony: "tiff", label: "TIFF People's Choice Award", wikidataId: "Q39087364", domain: "picture" },
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
