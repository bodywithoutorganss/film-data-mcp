// ABOUTME: Type-level tests for Wikidata response types.
// ABOUTME: Verifies that SPARQL response shapes match our type definitions.

import { describe, it, expect } from "vitest";
import type {
  SparqlResponse,
  WikidataAward,
  WikidataNomination,
  ResolvedEntity,
} from "../../src/types/wikidata.js";

describe("Wikidata types", () => {
  it("models a SPARQL binding response", () => {
    const response: SparqlResponse = {
      results: {
        bindings: [
          {
            person: {
              type: "uri",
              value: "http://www.wikidata.org/entity/Q460277",
            },
            personLabel: { type: "literal", value: "Roger Deakins" },
          },
        ],
      },
    };
    expect(response.results.bindings).toHaveLength(1);
    expect(response.results.bindings[0].personLabel.value).toBe(
      "Roger Deakins"
    );
  });

  it("models an award with optional fields", () => {
    const award: WikidataAward = {
      wikidataId: "Q131520",
      label: "Academy Award for Best Cinematography",
      year: 2018,
      forWork: { wikidataId: "Q28936680", label: "Blade Runner 2049" },
      ceremony: "academy-awards",
    };
    expect(award.year).toBe(2018);
    expect(award.forWork?.label).toBe("Blade Runner 2049");
  });

  it("models an award without forWork", () => {
    const award: WikidataAward = {
      wikidataId: "Q131520",
      label: "Academy Award for Best Cinematography",
      year: 2020,
      ceremony: "academy-awards",
    };
    expect(award.forWork).toBeUndefined();
  });

  it("models a resolved entity", () => {
    const entity: ResolvedEntity = {
      wikidataId: "Q460277",
      label: "Roger Deakins",
      resolvedVia: "imdb_id",
    };
    expect(entity.resolvedVia).toBe("imdb_id");
  });
});
