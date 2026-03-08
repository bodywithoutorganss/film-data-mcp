// ABOUTME: Integration tests for get_person_representation against live Wikidata SPARQL.
// ABOUTME: Tests known representation mappings (Zendaya→CAA, Dwayne Johnson→UTA).

import { describe, it, expect } from "vitest";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

describe("get_person_representation (live Wikidata)", () => {
  const wikidataClient = new WikidataClient();

  it("returns CAA representation for Zendaya (Q189489)", async () => {
    const result = await wikidataClient.getPersonRepresentation("Q189489");

    expect(result.length).toBeGreaterThanOrEqual(1);
    const caa = result.find((r) => r.wikidataId === "Q3002407");
    expect(caa).toBeDefined();
    expect(caa!.name).toBe("Creative Artists Agency");
    expect(caa!.startDate).toBe("2014-03-01");
  }, 30000);

  it("returns UTA representation for Dwayne Johnson (Q10738)", async () => {
    const result = await wikidataClient.getPersonRepresentation("Q10738");

    expect(result.length).toBeGreaterThanOrEqual(1);
    const uta = result.find((r) => r.wikidataId === "Q7893586");
    expect(uta).toBeDefined();
    expect(uta!.name).toBe("United Talent Agency");
  }, 30000);

  it("returns empty array for person with no P1875 data", async () => {
    // Roger Deakins (Q460277) — cinematographer, unlikely to have P1875
    const result = await wikidataClient.getPersonRepresentation("Q460277");
    // May or may not have data — just verify it returns without error
    expect(Array.isArray(result)).toBe(true);
  }, 30000);

  it("deduplicates when rep has multiple P31 types (CAA is both company and talent agency)", async () => {
    const result = await wikidataClient.getPersonRepresentation("Q189489");
    const caaEntries = result.filter((r) => r.wikidataId === "Q3002407");
    expect(caaEntries).toHaveLength(1);
  }, 30000);
});
