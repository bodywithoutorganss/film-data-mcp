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
  ceremony: string;
  result: "win";
}

export interface WikidataNomination {
  wikidataId: string;
  label: string;
  year?: number;
  forWork?: WikidataEntity;
  ceremony: string;
  result: "nomination";
}

export interface AwardHistoryEntry {
  recipientId: string;
  recipientLabel: string;
  year?: number;
  forWork?: WikidataEntity;
}

export interface AwardsCompleteness {
  entityFound: boolean;
  p166ClaimCount: number;
  registeredAwardCount: number;
}

export interface CrewNominationEntry {
  person: { name: string; roles: string[] };
  nominations: WikidataNomination[];
}

export interface PersonAwardsResult {
  entity: ResolvedEntity;
  wins: WikidataAward[];
  nominations: WikidataNomination[];
  completeness: AwardsCompleteness;
}

export interface ResolvedCrewEntry {
  name: string;
  roles: string[];
  wikidataId: string;
  totalWins: number;
  totalNominations: number;
  byCeremony: Record<string, { wins: number; nominations: number }>;
}

export interface SkippedCrewEntry {
  name: string;
  roles: string[];
  reason: string;
}

export interface FilmAwardsResult {
  entity: ResolvedEntity;
  awards: WikidataAward[];
  crewNominations: CrewNominationEntry[];
  resolvedCrew?: ResolvedCrewEntry[];
  skippedCrew?: SkippedCrewEntry[];
  completeness: AwardsCompleteness;
}

export type ResolutionMethod = "tmdb_id" | "imdb_id" | "name_search" | "name_search_unfiltered";

export interface ResolvedEntity {
  wikidataId: string;
  label: string;
  resolvedVia: ResolutionMethod;
}

export interface RepresentationEntry {
  name: string;
  wikidataId: string;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  role: string | null;
}

export interface PersonRepresentationResult {
  entity: ResolvedEntity;
  representation: RepresentationEntry[];
  coverageNote: string;
}
