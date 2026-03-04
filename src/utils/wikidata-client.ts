// ABOUTME: SPARQL client for Wikidata entity resolution and awards queries.
// ABOUTME: Resolves TMDB/IMDb IDs to Wikidata entities, queries award and nomination data.

import type { SparqlResponse, ResolvedEntity, WikidataAward, WikidataNomination } from "../types/wikidata.js";
import { AWARD_CATEGORIES } from "../types/awards-registry.js";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "film-data-mcp/1.0";

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

  private parseResolvedEntity(
    data: SparqlResponse,
    resolvedVia: "tmdb_id" | "imdb_id"
  ): ResolvedEntity | null {
    const bindings = data.results.bindings;
    if (bindings.length === 0) return null;
    const first = bindings[0];
    return {
      wikidataId: this.extractEntityId(first.entity.value),
      label: first.entityLabel?.value ?? "Unknown",
      resolvedVia,
    };
  }

  async resolvePersonByTmdbId(tmdbId: string): Promise<ResolvedEntity | null> {
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

  private registeredQids(): Set<string> {
    return new Set(AWARD_CATEGORIES.map((c) => c.wikidataId));
  }

  private lookupCeremony(awardQid: string): string {
    const cat = AWARD_CATEGORIES.find((c) => c.wikidataId === awardQid);
    return cat?.ceremony ?? "unknown";
  }

  async getPersonWins(wikidataId: string): Promise<WikidataAward[]> {
    const query = `
      SELECT ?award ?awardLabel ?date WHERE {
        wd:${wikidataId} p:P166 ?stmt .
        ?stmt ps:P166 ?award .
        OPTIONAL { ?stmt pq:P585 ?date }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;
    const data = await this.executeSparql(query);
    const knownQids = this.registeredQids();
    return data.results.bindings
      .map((b) => {
        const qid = this.extractEntityId(b.award.value);
        return {
          wikidataId: qid,
          label: b.awardLabel?.value ?? "Unknown",
          year: b.date ? new Date(b.date.value).getFullYear() : undefined,
          ceremony: this.lookupCeremony(qid),
        };
      })
      .filter((a) => knownQids.has(a.wikidataId));
  }

  async getPersonNominations(wikidataId: string): Promise<WikidataNomination[]> {
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
    const knownQids = this.registeredQids();
    return data.results.bindings
      .map((b) => {
        const qid = this.extractEntityId(b.award.value);
        return {
          wikidataId: qid,
          label: b.awardLabel?.value ?? "Unknown",
          year: b.date ? new Date(b.date.value).getFullYear() : undefined,
          forWork: b.forWork
            ? { wikidataId: this.extractEntityId(b.forWork.value), label: b.forWorkLabel?.value ?? "Unknown" }
            : undefined,
          ceremony: this.lookupCeremony(qid),
        };
      })
      .filter((n) => knownQids.has(n.wikidataId));
  }

  async getFilmAwards(wikidataId: string): Promise<WikidataAward[]> {
    const query = `
      SELECT ?award ?awardLabel ?date WHERE {
        wd:${wikidataId} p:P166 ?stmt .
        ?stmt ps:P166 ?award .
        OPTIONAL { ?stmt pq:P585 ?date }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;
    const data = await this.executeSparql(query);
    const knownQids = this.registeredQids();
    return data.results.bindings
      .map((b) => {
        const qid = this.extractEntityId(b.award.value);
        return {
          wikidataId: qid,
          label: b.awardLabel?.value ?? "Unknown",
          year: b.date ? new Date(b.date.value).getFullYear() : undefined,
          ceremony: this.lookupCeremony(qid),
        };
      })
      .filter((a) => knownQids.has(a.wikidataId));
  }

  async getAwardHistory(
    categoryQid: string
  ): Promise<Array<{ recipientId: string; recipientLabel: string; year?: number; forWork?: { wikidataId: string; label: string } }>> {
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
      recipientLabel: b.recipientLabel?.value ?? "Unknown",
      year: b.date ? new Date(b.date.value).getFullYear() : undefined,
      forWork: b.forWork
        ? { wikidataId: this.extractEntityId(b.forWork.value), label: b.forWorkLabel?.value ?? "Unknown" }
        : undefined,
    }));
  }
}
