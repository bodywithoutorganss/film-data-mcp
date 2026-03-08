#!/usr/bin/env node
// ABOUTME: Entry point for the film-data-mcp server.
// ABOUTME: Registers TMDB and Wikidata tools, connects via stdio transport.

/**
 * Film Data MCP Server
 * Provides access to The Movie Database (TMDB) API through Model Context Protocol
 *
 * 18 TMDB tools: search, movie_details, tv_details, person_details,
 * discover, trending, curated_lists, genres, watch_providers,
 * find_by_external_id, collection_details, company_details,
 * search_keywords, company_filmography, get_festival_premieres,
 * get_credits, get_financials, get_thanks_credits
 *
 * 4 Wikidata awards tools: get_person_awards, get_film_awards,
 * get_award_history, search_awards
 *
 * 1 Wikidata representation tool: get_person_representation
 */

import { config } from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { TMDBClient } from "./utils/tmdb-client.js";
import { WikidataClient } from "./utils/wikidata-client.js";
import { searchTool, handleSearch } from "./tools/search.js";
import {
    movieDetailsTool, handleMovieDetails,
    tvDetailsTool, handleTVDetails,
    personDetailsTool, handlePersonDetails,
} from "./tools/details.js";
import { discoverTool, handleDiscover } from "./tools/discover.js";
import {
    trendingTool, handleTrending,
    curatedListsTool, handleCuratedLists,
} from "./tools/browse.js";
import {
    genresTool, handleGenres,
    watchProvidersTool, handleWatchProviders,
    findByExternalIdTool, handleFindByExternalId,
    collectionDetailsTool, handleCollectionDetails,
    companyDetailsTool, handleCompanyDetails,
    searchKeywordsTool, handleSearchKeywords,
    companyFilmographyTool, handleCompanyFilmography,
} from "./tools/reference.js";
import {
    getPersonAwardsTool, handleGetPersonAwards,
    getFilmAwardsTool, handleGetFilmAwards,
    getAwardHistoryTool, handleGetAwardHistory,
    searchAwardsTool, handleSearchAwards,
} from "./tools/awards.js";
import { festivalPremieresTool, handleGetFestivalPremieres } from "./tools/premieres.js";
import { creditsTool, handleGetCredits } from "./tools/credits.js";
import { getPersonRepresentationTool, handleGetPersonRepresentation } from "./tools/representation.js";
import { OMDbClient } from "./utils/omdb-client.js";
import { financialsTool, handleGetFinancials } from "./tools/financials.js";
import { thanksCreditsTool, handleGetThanksCredits } from "./tools/thanks.js";

// Load environment variables
config();

// Initialize TMDB client
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;
if (!tmdbToken) {
    console.error("Error: TMDB_ACCESS_TOKEN environment variable is required");
    process.exit(1);
}

const tmdbClient = new TMDBClient(tmdbToken);
const wikidataClient = new WikidataClient();
const omdbKey = process.env.OMDB_API_KEY;
const omdbClient = omdbKey ? new OMDbClient(omdbKey) : null;

/**
 * Create MCP server with tools capability
 */
const server = new Server(
    {
        name: "film-data-mcp",
        version: "0.13.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            searchTool,
            movieDetailsTool,
            tvDetailsTool,
            personDetailsTool,
            discoverTool,
            trendingTool,
            curatedListsTool,
            genresTool,
            watchProvidersTool,
            findByExternalIdTool,
            collectionDetailsTool,
            companyDetailsTool,
            searchKeywordsTool,
            companyFilmographyTool,
            festivalPremieresTool,
            creditsTool,
            getPersonAwardsTool,
            getFilmAwardsTool,
            getAwardHistoryTool,
            searchAwardsTool,
            getPersonRepresentationTool,
            financialsTool,
            thanksCreditsTool,
        ],
    };
});

/**
 * Handler for tool execution
 * Routes tool calls to appropriate handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        // Each handler validates args internally via Zod
        const handlers: Record<string, (args: unknown, client: TMDBClient) => Promise<string>> = {
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
            get_person_awards: (args) => handleGetPersonAwards(args, tmdbClient, wikidataClient),
            get_film_awards: (args) => handleGetFilmAwards(args, tmdbClient, wikidataClient),
            get_award_history: (args) => handleGetAwardHistory(args, tmdbClient, wikidataClient),
            search_awards: (args) => handleSearchAwards(args, tmdbClient, wikidataClient),
            get_person_representation: (args) => handleGetPersonRepresentation(args, tmdbClient, wikidataClient),
            get_financials: (args) => handleGetFinancials(args, tmdbClient, omdbClient),
            get_thanks_credits: handleGetThanksCredits,
        };

        const handler = handlers[name];
        if (!handler) {
            throw new Error(`Unknown tool: ${name}`);
        }

        const result = await handler(args, tmdbClient);
        return { content: [{ type: "text", text: result }] };
    } catch (error) {
        // Handle Zod validation errors and API errors
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
        throw error;
    }
});

/**
 * Start server and connect via stdio transport
 */
async function main() {
    console.error("=".repeat(50));
    console.error("Film Data MCP");
    console.error("=".repeat(50));

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Ready for Claude Code connection (stdio)");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
