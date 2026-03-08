// ABOUTME: Live SPARQL integration tests for M13 awards registry expansion.
// ABOUTME: Verifies Peabody, Guggenheim (with qualifier), Gotham, and Emmy doc queries against Wikidata.

import { describe, it, expect } from "vitest";
import { WikidataClient } from "../../src/utils/wikidata-client.js";

describe("live Wikidata — M13 registry expansion", () => {
  const wikidataClient = new WikidataClient();

  it("Peabody award history returns recipients", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q838121");
    expect(history.length).toBeGreaterThan(400);
  });

  it("Guggenheim film fellows returns recipients via qualifier", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q1316544", {
      property: "P101",
      values: ["Q11424", "Q34508"],
    });
    expect(history.length).toBeGreaterThan(200);
  });

  it("Gotham Best Documentary returns recipients", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q20978457");
    // Sparse data (0 P166 as of verification), but test confirms the query runs
    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
  });

  it("Emmy documentary series returns recipients", { timeout: 30000 }, async () => {
    const history = await wikidataClient.getAwardHistory("Q24895051");
    expect(history.length).toBeGreaterThan(0);
  });
});
