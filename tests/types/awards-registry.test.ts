// ABOUTME: Tests for the awards registry — verified ceremony and category QIDs.
// ABOUTME: Validates registry structure and lookup functions.

import { describe, it, expect } from "vitest";
import {
  CEREMONIES,
  AWARD_CATEGORIES,
  findCeremony,
  findCategory,
  findCategoriesByDomain,
  findCategoriesByCeremony,
  type Ceremony,
  type AwardCategory,
  type AwardDomain,
} from "../../src/types/awards-registry.js";

describe("awards registry", () => {
  it("contains verified ceremonies", () => {
    const oscars = findCeremony("academy-awards");
    expect(oscars).toBeDefined();
    expect(oscars!.wikidataId).toBe("Q19020");
    expect(oscars!.label).toBe("Academy Awards");
  });

  it("contains verified award categories", () => {
    const bestCinematography = findCategory("academy-best-cinematography");
    expect(bestCinematography).toBeDefined();
    expect(bestCinematography!.wikidataId).toBe("Q131520");
    expect(bestCinematography!.ceremony).toBe("academy-awards");
    expect(bestCinematography!.domain).toBe("cinematography");
  });

  it("finds categories by domain across ceremonies", () => {
    const cinematography = findCategoriesByDomain("cinematography");
    expect(cinematography.length).toBeGreaterThanOrEqual(1);
    expect(cinematography.every((c) => c.domain === "cinematography")).toBe(
      true
    );
  });

  it("finds categories by ceremony", () => {
    const oscarCategories = findCategoriesByCeremony("academy-awards");
    expect(oscarCategories.length).toBeGreaterThanOrEqual(1);
    expect(
      oscarCategories.every((c) => c.ceremony === "academy-awards")
    ).toBe(true);
  });

  it("returns undefined for unknown ceremony", () => {
    expect(findCeremony("nonexistent")).toBeUndefined();
  });

  it("returns undefined for unknown category", () => {
    expect(findCategory("nonexistent")).toBeUndefined();
  });

  it("all ceremonies have a valid wikidataId", () => {
    for (const ceremony of CEREMONIES) {
      expect(
        ceremony.wikidataId.startsWith("Q"),
        `${ceremony.id} has invalid wikidataId: ${ceremony.wikidataId}`
      ).toBe(true);
    }
  });

  it("all categories reference a valid ceremony", () => {
    const ceremonyIds = new Set(CEREMONIES.map((c) => c.id));
    for (const cat of AWARD_CATEGORIES) {
      expect(
        ceremonyIds.has(cat.ceremony),
        `${cat.id} references unknown ceremony ${cat.ceremony}`
      ).toBe(true);
    }
  });

  it("has no duplicate ids or wikidataIds in categories", () => {
    const ids = AWARD_CATEGORIES.map((c) => c.id);
    const wikidataIds = AWARD_CATEGORIES.map((c) => c.wikidataId);

    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const duplicateWikidataIds = wikidataIds.filter(
      (qid, i) => wikidataIds.indexOf(qid) !== i
    );

    expect(
      duplicateIds,
      `Duplicate category ids: ${duplicateIds.join(", ")}`
    ).toEqual([]);
    expect(
      duplicateWikidataIds,
      `Duplicate category wikidataIds: ${duplicateWikidataIds.join(", ")}`
    ).toEqual([]);
  });

  it("includes 'fellowship' as a valid AwardDomain", () => {
    const domains: AwardDomain[] = ["fellowship"];
    expect(domains[0]).toBe("fellowship");
  });

  it("supports optional qualifier on AwardCategory", () => {
    const cat: AwardCategory = {
      id: "test-qualified",
      ceremony: "test",
      label: "Test",
      wikidataId: "Q1",
      domain: "fellowship",
      qualifier: { property: "P101", values: ["Q11424"] },
    };
    expect(cat.qualifier).toBeDefined();
    expect(cat.qualifier!.property).toBe("P101");
  });

  it("contains Peabody Awards ceremony", () => {
    const peabody = findCeremony("peabody");
    expect(peabody).toBeDefined();
    expect(peabody!.wikidataId).toBe("Q838121");
    expect(peabody!.type).toBe("ceremony");
  });

  it("contains Peabody award category in documentary domain", () => {
    const cat = findCategory("peabody-award");
    expect(cat).toBeDefined();
    expect(cat!.wikidataId).toBe("Q838121");
    expect(cat!.ceremony).toBe("peabody");
    expect(cat!.domain).toBe("documentary");
  });

  it("contains Gotham Awards ceremony", () => {
    const gotham = findCeremony("gotham");
    expect(gotham).toBeDefined();
    expect(gotham!.wikidataId).toBe("Q1538791");
    expect(gotham!.type).toBe("ceremony");
  });

  it("contains Gotham documentary categories", () => {
    const gothamCats = findCategoriesByCeremony("gotham");
    expect(gothamCats).toHaveLength(4);

    const bestDoc = findCategory("gotham-best-documentary");
    expect(bestDoc).toBeDefined();
    expect(bestDoc!.wikidataId).toBe("Q20978457");
    expect(bestDoc!.domain).toBe("documentary");

    const nonfiction = findCategory("gotham-breakthrough-nonfiction");
    expect(nonfiction).toBeDefined();
    expect(nonfiction!.wikidataId).toBe("Q109259295");
    expect(nonfiction!.domain).toBe("documentary");
  });

  it("contains Gotham best director and breakthrough actor", () => {
    const bestDirector = findCategory("gotham-best-director");
    expect(bestDirector).toBeDefined();
    expect(bestDirector!.wikidataId).toBe("Q131161019");
    expect(bestDirector!.domain).toBe("director");

    const breakthroughActor = findCategory("gotham-breakthrough-actor");
    expect(breakthroughActor).toBeDefined();
    expect(breakthroughActor!.wikidataId).toBe("Q48848495");
    expect(breakthroughActor!.domain).toBe("acting");
  });

  it("contains Emmy documentary categories under existing emmys ceremony", () => {
    const emmyCats = findCategoriesByCeremony("emmys");
    const docNonfictionCats = emmyCats.filter(
      (c) => c.id.includes("documentary") || c.id.includes("nonfiction")
    );
    expect(docNonfictionCats.length).toBe(5);

    const docSpecial = findCategory("emmys-documentary-special");
    expect(docSpecial).toBeDefined();
    expect(docSpecial!.wikidataId).toBe("Q24895159");
    expect(docSpecial!.ceremony).toBe("emmys");
    expect(docSpecial!.domain).toBe("documentary");

    const docSeries = findCategory("emmys-documentary-series");
    expect(docSeries).toBeDefined();
    expect(docSeries!.wikidataId).toBe("Q24895051");
    expect(docSeries!.domain).toBe("documentary");

    const docMerit = findCategory("emmys-documentary-filmmaking");
    expect(docMerit).toBeDefined();
    expect(docMerit!.wikidataId).toBe("Q24900788");
    expect(docMerit!.domain).toBe("documentary");

    const docDirecting = findCategory("emmys-directing-nonfiction");
    expect(docDirecting).toBeDefined();
    expect(docDirecting!.wikidataId).toBe("Q25345783");
    expect(docDirecting!.domain).toBe("director");

    const docCinematography = findCategory("emmys-cinematography-nonfiction");
    expect(docCinematography).toBeDefined();
    expect(docCinematography!.wikidataId).toBe("Q30632982");
    expect(docCinematography!.domain).toBe("cinematography");
  });

  it("contains Guggenheim Fellowship ceremony", () => {
    const guggenheim = findCeremony("guggenheim");
    expect(guggenheim).toBeDefined();
    expect(guggenheim!.wikidataId).toBe("Q1316544");
    expect(guggenheim!.type).toBe("fellowship");
  });

  it("contains Guggenheim film category with qualifier", () => {
    const cat = findCategory("guggenheim-film");
    expect(cat).toBeDefined();
    expect(cat!.wikidataId).toBe("Q1316544");
    expect(cat!.ceremony).toBe("guggenheim");
    expect(cat!.domain).toBe("fellowship");
    expect(cat!.qualifier).toEqual({
      property: "P101",
      values: ["Q11424", "Q34508"],
    });
  });

  it("includes Guggenheim in fellowship domain lookup", () => {
    const fellowships = findCategoriesByDomain("fellowship");
    expect(fellowships.length).toBeGreaterThanOrEqual(1);
    expect(fellowships.some((c) => c.id === "guggenheim-film")).toBe(true);
  });

  it("has no duplicate ids or wikidataIds in ceremonies", () => {
    const ids = CEREMONIES.map((c) => c.id);
    const wikidataIds = CEREMONIES.map((c) => c.wikidataId);

    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const duplicateWikidataIds = wikidataIds.filter(
      (qid, i) => wikidataIds.indexOf(qid) !== i
    );

    expect(
      duplicateIds,
      `Duplicate ceremony ids: ${duplicateIds.join(", ")}`
    ).toEqual([]);
    expect(
      duplicateWikidataIds,
      `Duplicate ceremony wikidataIds: ${duplicateWikidataIds.join(", ")}`
    ).toEqual([]);
  });
});
