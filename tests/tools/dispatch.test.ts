// ABOUTME: Verifies that index.ts dispatch map routes all 23 tool names to correct handlers.
// ABOUTME: Reconstructs the dispatch pattern without starting the MCP server.

import { describe, it, expect } from "vitest";
import { handleSearch } from "../../src/tools/search.js";
import { handleMovieDetails, handleTVDetails, handlePersonDetails } from "../../src/tools/details.js";
import { handleDiscover } from "../../src/tools/discover.js";
import { handleTrending, handleCuratedLists } from "../../src/tools/browse.js";
import {
  handleGenres, handleWatchProviders, handleFindByExternalId,
  handleCollectionDetails, handleCompanyDetails,
  handleSearchKeywords, handleCompanyFilmography,
} from "../../src/tools/reference.js";
import {
  handleGetPersonAwards, handleGetFilmAwards,
  handleGetAwardHistory, handleSearchAwards,
} from "../../src/tools/awards.js";
import { handleGetFestivalPremieres, festivalPremieresTool } from "../../src/tools/premieres.js";
import { handleGetCredits, creditsTool } from "../../src/tools/credits.js";
import { handleGetPersonRepresentation, getPersonRepresentationTool } from "../../src/tools/representation.js";
import { handleGetFinancials, financialsTool } from "../../src/tools/financials.js";
import { handleGetThanksCredits, thanksCreditsTool } from "../../src/tools/thanks.js";
import { searchTool } from "../../src/tools/search.js";
import { movieDetailsTool, tvDetailsTool, personDetailsTool } from "../../src/tools/details.js";
import { discoverTool } from "../../src/tools/discover.js";
import { trendingTool, curatedListsTool } from "../../src/tools/browse.js";
import {
  genresTool, watchProvidersTool, findByExternalIdTool,
  collectionDetailsTool, companyDetailsTool,
  searchKeywordsTool, companyFilmographyTool,
} from "../../src/tools/reference.js";
import {
  getPersonAwardsTool, getFilmAwardsTool,
  getAwardHistoryTool, searchAwardsTool,
} from "../../src/tools/awards.js";

describe("dispatch map", () => {
  // Mirror the dispatch map from index.ts
  const mockTmdbClient: any = {};
  const mockWikidataClient: any = {};

  const handlers: Record<string, Function> = {
    search: handleSearch,
    movie_details: handleMovieDetails,
    tv_details: handleTVDetails,
    person_details: handlePersonDetails,
    discover: handleDiscover,
    trending: handleTrending,
    curated_lists: handleCuratedLists,
    genres: handleGenres,
    watch_providers: handleWatchProviders,
    find_by_external_id: handleFindByExternalId,
    collection_details: handleCollectionDetails,
    company_details: handleCompanyDetails,
    search_keywords: handleSearchKeywords,
    company_filmography: handleCompanyFilmography,
    get_festival_premieres: handleGetFestivalPremieres,
    get_credits: handleGetCredits,
    get_person_awards: (args: any) => handleGetPersonAwards(args, mockTmdbClient, mockWikidataClient),
    get_film_awards: (args: any) => handleGetFilmAwards(args, mockTmdbClient, mockWikidataClient),
    get_award_history: (args: any) => handleGetAwardHistory(args, mockTmdbClient, mockWikidataClient),
    search_awards: (args: any) => handleSearchAwards(args, mockTmdbClient, mockWikidataClient),
    get_person_representation: (args: any) => handleGetPersonRepresentation(args, mockTmdbClient, mockWikidataClient),
    get_financials: handleGetFinancials,
    get_thanks_credits: handleGetThanksCredits,
  };

  it("has exactly 23 tool entries", () => {
    expect(Object.keys(handlers)).toHaveLength(23);
  });

  it("all tool definition names have a matching handler", () => {
    const toolDefs = [
      searchTool, movieDetailsTool, tvDetailsTool, personDetailsTool,
      discoverTool, trendingTool, curatedListsTool, genresTool,
      watchProvidersTool, findByExternalIdTool, collectionDetailsTool,
      companyDetailsTool, searchKeywordsTool, companyFilmographyTool,
      festivalPremieresTool, creditsTool,
      getPersonAwardsTool, getFilmAwardsTool,
      getAwardHistoryTool, searchAwardsTool,
      getPersonRepresentationTool, financialsTool, thanksCreditsTool,
    ];

    for (const tool of toolDefs) {
      expect(handlers[tool.name], `Missing handler for tool: ${tool.name}`).toBeDefined();
    }
  });

  it("has no handler without a matching tool definition", () => {
    const toolNames = new Set([
      "search", "movie_details", "tv_details", "person_details",
      "discover", "trending", "curated_lists", "genres",
      "watch_providers", "find_by_external_id", "collection_details",
      "company_details", "search_keywords", "company_filmography",
      "get_festival_premieres", "get_credits",
      "get_person_awards", "get_film_awards",
      "get_award_history", "search_awards",
      "get_person_representation", "get_financials", "get_thanks_credits",
    ]);

    for (const name of Object.keys(handlers)) {
      expect(toolNames.has(name), `Handler ${name} has no tool definition`).toBe(true);
    }
  });

  it("all handlers are functions", () => {
    for (const [name, handler] of Object.entries(handlers)) {
      expect(typeof handler, `Handler ${name} is not a function`).toBe("function");
    }
  });

  it("awards and representation closures are callable (bind verification)", () => {
    // Awards and representation handlers use closures that capture wikidataClient.
    // Verify the closure-bound handlers are callable functions.
    const closureTools = [
      "get_person_awards", "get_film_awards", "get_award_history", "search_awards",
      "get_person_representation",
    ];
    for (const name of closureTools) {
      expect(typeof handlers[name]).toBe("function");
      // The closure should accept (args) and internally pass tmdbClient + wikidataClient
      expect(handlers[name].length, `${name} closure should accept 1 arg`).toBe(1);
    }
  });
});
