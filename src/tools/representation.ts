// ABOUTME: MCP tool for querying talent representation data via Wikidata SPARQL.
// ABOUTME: Returns agency affiliations (P1875) for a person identified by TMDB ID.

import { z } from "zod";
import type { TMDBClient } from "../utils/tmdb-client.js";
import type { WikidataClient } from "../utils/wikidata-client.js";
import type { PersonRepresentationResult } from "../types/wikidata.js";
import { resolvePerson } from "./awards.js";
import { buildToolDef } from "../utils/tool-helpers.js";

const COVERAGE_NOTE =
  "Wikidata representation data covers ~1,200 film professionals at talent agencies. " +
  "Coverage is strongest for Japanese and Korean entertainment; US talent agency data is sparse " +
  "(~70 people across CAA/WME/UTA/ICM). Absence of results does not indicate absence of representation.";

// --- get_person_representation ---

export const GetPersonRepresentationSchema = z.object({
  person_id: z.number().int().positive().describe("TMDB person ID"),
  name: z
    .string()
    .optional()
    .describe("Person name for Wikidata resolution fallback if TMDB/IMDb ID lookup fails"),
});

export const getPersonRepresentationTool = buildToolDef(
  "get_person_representation",
  "Get talent representation (agency affiliations) for a person via Wikidata. Returns agencies, management companies, and other representatives linked via P1875.",
  GetPersonRepresentationSchema
);

export async function handleGetPersonRepresentation(
  args: unknown,
  tmdbClient: TMDBClient,
  wikidataClient: WikidataClient
): Promise<string> {
  const { person_id, name } = GetPersonRepresentationSchema.parse(args);

  const entity = await resolvePerson(person_id, tmdbClient, wikidataClient, name);
  const representation = await wikidataClient.getPersonRepresentation(entity.wikidataId);

  const result: PersonRepresentationResult = {
    entity,
    representation,
    coverageNote: COVERAGE_NOTE,
  };

  return JSON.stringify(result, null, 2);
}
