// ABOUTME: Utility to build MCP tool definitions from Zod schemas.
// ABOUTME: Single source of truth — eliminates hand-written JSON Schema duplication.

import { z, toJSONSchema } from "zod";

export function buildToolDef(
  name: string,
  description: string,
  schema: z.ZodObject<z.ZodRawShape>
) {
  const jsonSchema = toJSONSchema(schema);
  const {
    $schema: _$schema,
    additionalProperties: _additionalProperties,
    ...inputSchema
  } = jsonSchema as Record<string, unknown>;
  return { name, description, inputSchema };
}
