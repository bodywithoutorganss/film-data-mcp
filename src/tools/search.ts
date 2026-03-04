// ABOUTME: Unified search tool for TMDB — movies, TV, people, and companies.
// ABOUTME: Supports multi-search (default) or type-specific search via the type parameter.

import { z } from "zod";
import { TMDBClient } from "../utils/tmdb-client.js";

export const SearchSchema = z.object({
  query: z.string().min(1).describe("Search query text"),
  type: z
    .enum(["movie", "tv", "person", "company"])
    .optional()
    .describe("Restrict to a specific type. Omit for multi-search across all types"),
  page: z.number().int().positive().optional().describe("Page number (default 1)"),
});

export const searchTool = {
  name: "search",
  description:
    "Search TMDB for movies, TV shows, people, and companies. Use without a type for multi-search across all categories, or specify a type to narrow results.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Search query text" },
      type: {
        type: "string",
        enum: ["movie", "tv", "person", "company"],
        description: "Restrict to a specific type. Omit for multi-search",
      },
      page: { type: "number", description: "Page number (default 1)" },
    },
    required: ["query"],
  },
};

export async function handleSearch(
  args: z.infer<typeof SearchSchema>,
  client: TMDBClient
): Promise<string> {
  const { query, type, page } = SearchSchema.parse(args);

  const result = type
    ? await client.searchByType(type, query, page)
    : await client.searchMulti(query, page);

  return JSON.stringify(result, null, 2);
}
