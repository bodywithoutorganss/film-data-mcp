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

  it("models an award with optional year", () => {
    const award: WikidataAward = {
      wikidataId: "Q131520",
      label: "Academy Award for Best Cinematography",
      year: 2018,
      ceremony: "academy-awards",
    };
    expect(award.year).toBe(2018);
  });

  it("models an award without year", () => {
    const award: WikidataAward = {
      wikidataId: "Q131520",
      label: "Academy Award for Best Cinematography",
      ceremony: "academy-awards",
    };
    expect(award.year).toBeUndefined();
  });

  it("models a nomination with forWork", () => {
    const nom: WikidataNomination = {
      wikidataId: "Q131520",
      label: "Academy Award for Best Cinematography",
      year: 2008,
      forWork: { wikidataId: "Q183081", label: "No Country for Old Men" },
      ceremony: "academy-awards",
    };
    expect(nom.year).toBe(2008);
    expect(nom.forWork?.label).toBe("No Country for Old Men");
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
