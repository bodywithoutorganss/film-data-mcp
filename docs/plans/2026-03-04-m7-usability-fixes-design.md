# M7: Usability Fixes — Design

## Goal

Fix five usability issues discovered during LLM smart query evaluation. All changes are handler-level — no architectural shifts, no new tools, no SPARQL query changes.

## Scope

Handler fixes and schema additions only. Tests for each fix. No new tools (dedicated `credits` tool deferred to future work).

## Fix 1: Credits Top-N Filtering

### Problem

`movie_details` with `credits` append produces ~250K chars for blockbusters. `person_details` with `combined_credits` produces ~90K chars for prolific filmmakers. Both exceed LLM context windows.

### Solution

Add optional `credits_limit` parameter to detail tool schemas. Default `20` (top 20 cast + 20 crew by billing order). Pass `0` for unlimited.

**Schema changes** in `details.ts`:
- `MovieDetailsSchema`: add `credits_limit?: number` — max cast and crew entries when `credits` is in `append`. Default 20.
- `TVDetailsSchema`: same, applies to `credits` and `aggregate_credits` appends.
- `PersonDetailsSchema`: add `credits_limit?: number` — max entries per credit type (cast/crew) when any credits append is used. Default 20.

**Handler changes:**
- After API call, if `credits_limit > 0`, slice `.cast` and `.crew` arrays to that limit.
- Add `_truncated: { total_cast: number, total_crew: number }` metadata field so the LLM knows data was trimmed and can request more if needed.
- For person credits, slice `combined_credits.cast`/`.crew` (or `movie_credits`/`tv_credits`).

**Tool descriptions:** Mention the default limit and how to override.

### Tests
- Verify slicing at default limit (20)
- Verify `_truncated` metadata shows original counts
- Verify `credits_limit: 0` returns full data (no slicing)
- Verify no slicing when credits not in append

## Fix 2: Watch Providers Region Filter

### Problem

`watch_providers` per movie returns availability for all ~40 regions (~130K chars).

### Solution

Add optional `region` parameter. When set, filter response to single country.

**Schema change** in `reference.ts`:
- `WatchProvidersSchema`: add `region?: string` — ISO 3166-1 country code (e.g., `"US"`, `"GB"`).

**Handler change** in `handleWatchProviders`:
- When `region` is set and `id` is set: extract `result.results[region]` only, plus the `link` field. Return single-region data.
- When region not found in response: return empty object with a note.
- When `id` is omitted (list-all-providers mode): `region` is ignored.

**Tool description:** Mention region parameter, recommend using it.

### Tests
- Verify single-region extraction returns only that region's data
- Verify missing region returns empty with note
- Verify region ignored when id is omitted

## Fix 3: Award History Year-Grouping

### Problem

Award history returns duplicate entries — both person and film entities for the same year/award appear as separate rows.

### Solution

Group results by year in the handler. Each year entry contains all recipients.

**Handler change** in `handleGetAwardHistory` (`awards.ts`):
- After `wikidataClient.getAwardHistory()`, group by year.
- Return format: `{ year: number, recipients: [{ id, label, forWork? }] }`
- Entries without a year go into a `null` year group at the end.

**No SPARQL change.** Grouping happens post-query in the handler.

**Before:**
```json
{ "category": "...", "ceremony": "...", "history": [
  { "recipientId": "Q...", "recipientLabel": "Roger Deakins", "year": 2020, "forWork": {...} },
  { "recipientId": "Q...", "recipientLabel": "1917", "year": 2020 }
]}
```

**After:**
```json
{ "category": "...", "ceremony": "...", "history": [
  { "year": 2020, "recipients": [
    { "id": "Q...", "label": "Roger Deakins", "forWork": {...} },
    { "id": "Q...", "label": "1917" }
  ]}
]}
```

### Tests
- Verify grouped structure (multiple recipients per year)
- Verify entries without year grouped under `null`
- Verify single-recipient years still work

## Fix 4: QID Label Cleanup

### Problem

Some Wikidata entities lack English labels, so the label service returns raw QIDs (e.g., `Q585668`) that look like glitches.

### Solution

Detect QID-like labels (`/^Q\d+$/`) and replace with `"Unknown (QID)"` for clarity.

**Changes** in `wikidata-client.ts`:
- Apply to all SPARQL result label fields: `recipientLabel`, `forWorkLabel`, and labels in `getPersonWins`, `getPersonNominations`, `getFilmAwards`.
- Helper: `private cleanLabel(label: string): string` — returns `"Unknown (QID)"` if label matches `/^Q\d+$/`, otherwise returns the label unchanged.

### Tests
- Verify `Q12345` → `"Unknown (Q12345)"`
- Verify normal labels untouched
- Verify `"Unknown"` fallback still works when label is missing entirely

## Fix 5: server.json Version Sync

### Problem

`server.json` says version `0.1.1`, package.json is ahead.

### Solution

Update `server.json` version to match `package.json`. One-liner.

## Decisions

- **No dedicated credits tool** in this round. Top-N filtering is sufficient. Dedicated tool is future work.
- **No SPARQL changes** — all fixes are handler-level post-processing.
- **Backward compatible** — all new parameters are optional with sensible defaults.
- **`_truncated` metadata** convention: any handler that trims data includes a `_truncated` object with original counts so LLMs can request more.
