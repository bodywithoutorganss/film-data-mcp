// ABOUTME: SPARQL client for Wikidata entity resolution and awards queries.
// ABOUTME: Resolves TMDB/IMDb IDs to Wikidata entities, queries award and nomination data.

import type { SparqlResponse, ResolvedEntity } from "../types/wikidata.js";

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
}
