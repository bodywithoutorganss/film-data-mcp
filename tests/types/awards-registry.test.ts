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
});
