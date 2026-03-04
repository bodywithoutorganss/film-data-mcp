#!/usr/bin/env node
// ABOUTME: Entry point for the film-data-mcp server.
// ABOUTME: Registers TMDB and Wikidata tools, handles stdio and HTTP transports.

/**
 * Film Data MCP Server
 * Provides access to The Movie Database (TMDB) API through Model Context Protocol
 *
 * 12 TMDB tools: search, movie_details, tv_details, person_details,
 * discover, trending, curated_lists, genres, watch_providers,
 * find_by_external_id, collection_details, company_details
 *
 * Supports two transport modes:
 * - stdio: For local Claude Desktop integration (default)
 * - http: For remote deployment via Streamable HTTP (Railway, etc.)
 */

import { config } from "dotenv";
import { randomUUID } from "crypto";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { TMDBClient } from "./utils/tmdb-client.js";
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
} from "./tools/reference.js";

// Load environment variables
config();

// Initialize TMDB client
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;
if (!tmdbToken) {
    console.error("Error: TMDB_ACCESS_TOKEN environment variable is required");
    process.exit(1);
}

const tmdbClient = new TMDBClient(tmdbToken);

/**
 * Create MCP server with tools capability
 */
const server = new Server(
    {
        name: "film-data-mcp",
        version: "0.1.0",
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
        const handlers: Record<string, (args: any, client: TMDBClient) => Promise<string>> = {
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
 * Start server with stdio transport
 * Used for local Claude Desktop integration
 */
async function startStdioServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Film Data MCP running on stdio");
    console.error("Ready for Claude Desktop connection");
}

/**
 * Start server with Streamable HTTP transport
 * Used for remote deployment (Railway, etc.)
 */
async function startHttpServer() {
    const app = express();
    const port = process.env.PORT || 3000;

    // Parse JSON bodies
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            server: "film-data-mcp",
            version: "0.1.0",
            transport: "streamable-http",
        });
    });

    // MCP Streamable HTTP endpoint
    app.all("/mcp", async (req, res) => {
        console.error(
            `[HTTP] ${req.method} ${req.path} - Session: ${req.headers["mcp-session-id"] || "new"}`
        );

        // Create a new transport for each request to prevent request ID collisions
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            enableJsonResponse: true,
        });

        try {
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error("[HTTP] Error handling request:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    });

    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            error: "Not found",
            message: "Endpoint not found. Use /mcp for MCP protocol or /health for status check",
        });
    });

    // Start HTTP server
    app.listen(port, () => {
        console.error(`Film Data MCP running on HTTP`);
        console.error(`Port: ${port}`);
        console.error(`MCP endpoint: http://localhost:${port}/mcp`);
        console.error(`Health check: http://localhost:${port}/health`);
        console.error("Ready for remote MCP connections");
    });
}

/**
 * Main entry point
 * Chooses transport based on MCP_TRANSPORT environment variable
 */
async function main() {
    const transportMode = process.env.MCP_TRANSPORT || "stdio";

    console.error("=".repeat(50));
    console.error("Film Data MCP");
    console.error("=".repeat(50));
    console.error(`Transport mode: ${transportMode}`);
    console.error(`Node environment: ${process.env.NODE_ENV || "production"}`);
    console.error("=".repeat(50));

    if (transportMode === "http") {
        await startHttpServer();
    } else {
        await startStdioServer();
    }
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
