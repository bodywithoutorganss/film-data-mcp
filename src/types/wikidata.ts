// ABOUTME: TypeScript types for Wikidata SPARQL responses and awards data.
// ABOUTME: Covers raw SPARQL bindings, processed awards/nominations, and entity resolution.

export interface SparqlBinding {
  type: "uri" | "literal" | "typed-literal";
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

export interface SparqlResponse {
  results: {
    bindings: Array<Record<string, SparqlBinding>>;
  };
}

export interface WikidataEntity {
  wikidataId: string;
  label: string;
}

export interface WikidataAward {
  wikidataId: string;
  label: string;
  year?: number;
  forWork?: WikidataEntity;
  ceremony: string;
}

export interface WikidataNomination {
  wikidataId: string;
  label: string;
  year?: number;
  forWork?: WikidataEntity;
  ceremony: string;
}

export interface PersonAwardsResult {
  entity: ResolvedEntity;
  wins: WikidataAward[];
  nominations: WikidataNomination[];
}

export interface FilmAwardsResult {
  entity: ResolvedEntity;
  awards: WikidataAward[];
}

export type ResolutionMethod = "tmdb_id" | "imdb_id";

export interface ResolvedEntity {
  wikidataId: string;
  label: string;
  resolvedVia: ResolutionMethod;
}
