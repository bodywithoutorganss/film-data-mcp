// ABOUTME: SPARQL client for Wikidata entity resolution and awards queries.
// ABOUTME: Resolves TMDB/IMDb IDs to Wikidata entities, queries award and nomination data.

import type { SparqlResponse, ResolvedEntity, ResolutionMethod, WikidataAward, WikidataNomination, AwardHistoryEntry } from "../types/wikidata.js";
import { AWARD_CATEGORIES } from "../types/awards-registry.js";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "film-data-mcp/1.0";
const REGISTERED_QIDS = new Set(AWARD_CATEGORIES.map((c) => c.wikidataId));

export class WikidataClient {
  private async executeSparql(query: string): Promise<SparqlResponse> {
    const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata SPARQL error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<SparqlResponse>;
  }

  private extractEntityId(uri: string): string {
    return uri.split("/").pop()!;
  }

  private cleanLabel(label: string): string {
    return /^Q\d+$/.test(label) ? `Unknown (${label})` : label;
  }

  private parseResolvedEntity(
    data: SparqlResponse,
    resolvedVia: ResolutionMethod
  ): ResolvedEntity | null {
    const bindings = data.results.bindings;
    if (bindings.length === 0) return null;
    const first = bindings[0];
    return {
      wikidataId: this.extractEntityId(first.entity.value),
      label: first.entityLabel ? this.cleanLabel(first.entityLabel.value) : "Unknown",
      resolvedVia,
    };
  }

  async resolvePersonByTmdbId(tmdbId: string): Promise<ResolvedEntity | null> {
    this.validateTmdbId(tmdbId);
    const query = `
      SELECT ?entity ?entityLabel WHERE {
        ?entity wdt:P4985 "${tmdbId}" .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      LIMIT 1
    `;
    const data = await this.executeSparql(query);
    return this.parseResolvedEntity(data, "tmdb_id");
  }

  async resolveMovieByTmdbId(tmdbId: string): Promise<ResolvedEntity | null> {
    this.validateTmdbId(tmdbId);
    const query = `
      SELECT ?entity ?entityLabel WHERE {
        ?entity wdt:P4947 "${tmdbId}" .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      LIMIT 1
    `;
    const data = await this.executeSparql(query);
    return this.parseResolvedEntity(data, "tmdb_id");
  }

  async resolveByImdbId(imdbId: string): Promise<ResolvedEntity | null> {
    this.validateImdbId(imdbId);
    const query = `
      SELECT ?entity ?entityLabel WHERE {
        ?entity wdt:P345 "${imdbId}" .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      LIMIT 1
    `;
    const data = await this.executeSparql(query);
    return this.parseResolvedEntity(data, "imdb_id");
  }

  /**
   * Film-relevant Wikidata occupation QIDs for disambiguation.
   */
  private static readonly FILM_OCCUPATIONS = new Set([
    "Q2526255",   // film director
    "Q3282637",   // film producer
    "Q28389",     // screenwriter
    "Q36834",     // composer
    "Q222344",    // cinematographer
    "Q7042855",   // film editor
    "Q947873",    // television director
    "Q578109",    // television producer
    "Q4610556",   // documentary filmmaker
    "Q2059704",   // production designer
  ]);

  async resolvePersonByName(name: string): Promise<ResolvedEntity | null> {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", name);
    url.searchParams.set("language", "en");
    url.searchParams.set("type", "item");
    url.searchParams.set("limit", "5");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;
    const data = await response.json() as { search: Array<{ id: string; label: string }> };
    if (!data.search || data.search.length === 0) return null;

    const candidateIds = data.search.map((s) => s.id);
    if (candidateIds.some((id) => !/^Q\d+$/.test(id))) return null;
    const valuesClause = candidateIds.map((id) => `wd:${id}`).join(" ");
    const query = `
      SELECT ?entity ?entityLabel ?occupation WHERE {
        VALUES ?entity { ${valuesClause} }
        ?entity wdt:P106 ?occupation .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;
    const sparqlResult = await this.executeSparql(query);

    const filmRelevant = new Map<string, { wikidataId: string; label: string }>();
    for (const binding of sparqlResult.results.bindings) {
      const entityId = this.extractEntityId(binding.entity.value);
      const occupationId = this.extractEntityId(binding.occupation.value);
      if (WikidataClient.FILM_OCCUPATIONS.has(occupationId)) {
        filmRelevant.set(entityId, {
          wikidataId: entityId,
          label: binding.entityLabel ? this.cleanLabel(binding.entityLabel.value) : name,
        });
      }
    }

    // Tier 1: exactly one candidate has a film occupation
    if (filmRelevant.size === 1) {
      const [, entity] = [...filmRelevant.entries()][0];
      return { ...entity, resolvedVia: "name_search" };
    }

    // Tier 2: no film-occupation matches, but only one candidate from name search
    if (filmRelevant.size === 0 && candidateIds.length === 1) {
      const id = candidateIds[0];
      const binding = sparqlResult.results.bindings.find(
        (b) => this.extractEntityId(b.entity.value) === id
      );
      const label = binding?.entityLabel ? this.cleanLabel(binding.entityLabel.value) : name;
      return { wikidataId: id, label, resolvedVia: "name_search_unfiltered" };
    }

    return null;
  }

  private lookupCeremony(awardQid: string): string {
    const cat = AWARD_CATEGORIES.find((c) => c.wikidataId === awardQid);
    return cat?.ceremony ?? "unknown";
  }

  private validateTmdbId(id: string): void {
    if (!/^\d+$/.test(id)) {
      throw new Error(`Invalid TMDB ID: ${id}`);
    }
  }

  private validateImdbId(id: string): void {
    if (!/^(tt|nm|co)\d+$/.test(id)) {
      throw new Error(`Invalid IMDb ID: ${id}`);
    }
  }

  private validateQid(qid: string): void {
    if (!/^Q\d+$/.test(qid)) {
      throw new Error(`Invalid Wikidata QID: ${qid}`);
    }
  }

  private async queryAwards(wikidataId: string): Promise<WikidataAward[]> {
    const query = `
      SELECT ?award ?awardLabel ?date WHERE {
        wd:${wikidataId} p:P166 ?stmt .
        ?stmt ps:P166 ?award .
        OPTIONAL { ?stmt pq:P585 ?date }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;
    const data = await this.executeSparql(query);
    return data.results.bindings
      .map((b) => {
        const qid = this.extractEntityId(b.award.value);
        return {
          wikidataId: qid,
          label: b.awardLabel ? this.cleanLabel(b.awardLabel.value) : "Unknown",
          year: b.date ? new Date(b.date.value).getFullYear() : undefined,
          ceremony: this.lookupCeremony(qid),
        };
      })
      .filter((a) => REGISTERED_QIDS.has(a.wikidataId));
  }

  async getPersonWins(wikidataId: string): Promise<WikidataAward[]> {
    this.validateQid(wikidataId);
    return this.queryAwards(wikidataId);
  }

  async getPersonNominations(wikidataId: string): Promise<WikidataNomination[]> {
    this.validateQid(wikidataId);
    const query = `
      SELECT ?award ?awardLabel ?date ?forWork ?forWorkLabel WHERE {
        wd:${wikidataId} p:P1411 ?stmt .
        ?stmt ps:P1411 ?award .
        OPTIONAL { ?stmt pq:P585 ?date }
        OPTIONAL { ?stmt pq:P1686 ?forWork }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;
    const data = await this.executeSparql(query);
    return data.results.bindings
      .map((b) => {
        const qid = this.extractEntityId(b.award.value);
        return {
          wikidataId: qid,
          label: b.awardLabel ? this.cleanLabel(b.awardLabel.value) : "Unknown",
          year: b.date ? new Date(b.date.value).getFullYear() : undefined,
          forWork: b.forWork
            ? { wikidataId: this.extractEntityId(b.forWork.value), label: b.forWorkLabel ? this.cleanLabel(b.forWorkLabel.value) : "Unknown" }
            : undefined,
          ceremony: this.lookupCeremony(qid),
        };
      })
      .filter((n) => REGISTERED_QIDS.has(n.wikidataId));
  }

  async getFilmAwards(wikidataId: string): Promise<WikidataAward[]> {
    this.validateQid(wikidataId);
    return this.queryAwards(wikidataId);
  }

  async countAllP166Claims(wikidataId: string): Promise<number> {
    this.validateQid(wikidataId);
    const query = `
      SELECT (COUNT(?award) AS ?count) WHERE {
        wd:${wikidataId} p:P166 ?stmt .
        ?stmt ps:P166 ?award .
      }
    `;
    const data = await this.executeSparql(query);
    const binding = data.results.bindings[0];
    return binding?.count ? parseInt(binding.count.value, 10) : 0;
  }

  async getAwardHistory(categoryQid: string): Promise<AwardHistoryEntry[]> {
    this.validateQid(categoryQid);
    const query = `
      SELECT ?recipient ?recipientLabel ?date ?forWork ?forWorkLabel WHERE {
        ?recipient p:P166 ?stmt .
        ?stmt ps:P166 wd:${categoryQid} .
        OPTIONAL { ?stmt pq:P585 ?date }
        OPTIONAL { ?stmt pq:P1686 ?forWork }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY DESC(?date)
    `;
    const data = await this.executeSparql(query);
    return data.results.bindings.map((b) => ({
      recipientId: this.extractEntityId(b.recipient.value),
      recipientLabel: b.recipientLabel ? this.cleanLabel(b.recipientLabel.value) : "Unknown",
      year: b.date ? new Date(b.date.value).getFullYear() : undefined,
      forWork: b.forWork
        ? { wikidataId: this.extractEntityId(b.forWork.value), label: b.forWorkLabel ? this.cleanLabel(b.forWorkLabel.value) : "Unknown" }
        : undefined,
    }));
  }
}
