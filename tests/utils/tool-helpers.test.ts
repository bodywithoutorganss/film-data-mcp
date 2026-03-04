// ABOUTME: Tests for the buildToolDef utility that derives JSON Schema from Zod schemas.
// ABOUTME: Verifies MCP-compatible output format and correct field mapping.

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildToolDef } from "../../src/utils/tool-helpers.js";

describe("buildToolDef", () => {
  it("produces MCP-compatible tool definition from Zod schema", () => {
    const schema = z.object({
      query: z.string().describe("Search text"),
      page: z.number().int().positive().optional().describe("Page number"),
    });

    const tool = buildToolDef("test_tool", "A test tool", schema);

    expect(tool.name).toBe("test_tool");
    expect(tool.description).toBe("A test tool");
    expect(tool.inputSchema.type).toBe("object");
    expect(tool.inputSchema.properties.query).toEqual({
      description: "Search text",
      type: "string",
    });
    expect(tool.inputSchema.properties.page).toBeDefined();
    expect(tool.inputSchema.required).toEqual(["query"]);
  });

  it("strips $schema and additionalProperties from output", () => {
    const schema = z.object({ id: z.number() });
    const tool = buildToolDef("t", "d", schema);

    expect(tool.inputSchema).not.toHaveProperty("$schema");
    expect(tool.inputSchema).not.toHaveProperty("additionalProperties");
  });

  it("preserves enum values", () => {
    const schema = z.object({
      type: z.enum(["movie", "tv"]).describe("Media type"),
    });
    const tool = buildToolDef("t", "d", schema);

    expect(tool.inputSchema.properties.type.enum).toEqual(["movie", "tv"]);
  });
});
