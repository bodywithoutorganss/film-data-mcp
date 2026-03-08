// ABOUTME: TypeScript types for OMDb API responses.
// ABOUTME: Covers the subset of fields used by the financials tool.

export interface OMDbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  BoxOffice?: string; // "$188,020,017", "N/A", or absent
  Response: string; // "True" or "False"
  Error?: string; // Present when Response is "False"
}
