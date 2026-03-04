# film-data-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for film data — TMDB crew/cast + Wikidata awards. Forked from [tcehjaava/tmdb-mcp-server](https://github.com/tcehjaava/tmdb-mcp-server).

## Quick Start

```bash
# Install globally
npm install -g film-data-mcp

# Or use with npx (no installation needed)
npx film-data-mcp
```

**Get your free TMDB API token**: https://www.themoviedb.org/settings/api

## Features

### 12 TMDB Tools

| Tool | Description |
|------|-------------|
| **search** | Search movies, TV shows, people, or companies by query |
| **movie_details** | Movie info — optionally append credits, videos, reviews, similar titles |
| **tv_details** | TV show info — optionally append credits, videos, reviews, similar titles |
| **person_details** | Person bio — optionally append combined credits, images |
| **discover** | Advanced movie/TV filtering with 30+ parameters (genre, year, rating, cast, crew, keywords, etc.) |
| **trending** | Daily or weekly trending movies, TV shows, or people |
| **curated_lists** | Popular, top rated, now playing, airing today, upcoming |
| **genres** | Get genre ID/name lists for movies or TV |
| **watch_providers** | Streaming/rent/buy availability by region, or list all providers (powered by JustWatch) |
| **find_by_external_id** | Look up TMDB entries by IMDb, TVDB, or social media ID |
| **collection_details** | Movie franchise/collection info (e.g., Star Wars, Marvel) |
| **company_details** | Production company or TV network details (e.g., A24, HBO) |

### 4 Awards Tools

Wikidata SPARQL-powered awards data covering 21 ceremonies/festivals (Oscars, Cannes, BAFTA, etc.) with 91 verified award categories.

| Tool | Description |
|------|-------------|
| **get_person_awards** | Award wins and nominations for a person (by TMDB person ID) |
| **get_film_awards** | All awards a film has received (by TMDB movie ID) |
| **get_award_history** | All winners of a specific award category across years |
| **search_awards** | Search the awards registry by ceremony, category, or domain |

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g film-data-mcp
```

### Option 2: From Source

**Prerequisites:** Node.js v18+, a [TMDB API access token](https://www.themoviedb.org/settings/api)

```bash
git clone https://github.com/bodywithoutorganss/film-data-mcp.git
cd film-data-mcp
npm install
cp .env.example .env   # Add your TMDB_ACCESS_TOKEN
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### Via npm:

```json
{
  "mcpServers": {
    "film-data": {
      "command": "npx",
      "args": ["-y", "film-data-mcp"],
      "env": {
        "TMDB_ACCESS_TOKEN": "your_tmdb_access_token_here"
      }
    }
  }
}
```

#### From source:

```json
{
  "mcpServers": {
    "film-data": {
      "command": "node",
      "args": ["/absolute/path/to/film-data-mcp/build/index.js"],
      "env": {
        "TMDB_ACCESS_TOKEN": "your_tmdb_access_token_here"
      }
    }
  }
}
```

## Development

```bash
npm run watch      # Watch mode
npm test           # Unit tests (175 tests, no network)
npm run inspector  # MCP Inspector for debugging
npm run format     # Prettier
```

## Example Queries

- "Find Japanese sci-fi movies from 2020 onwards with a rating above 7"
- "What's trending this week?"
- "Where can I stream Parasite?"
- "Show me A24's filmography"
- "Get Christopher Nolan's credits with movie details"
- "Find Korean dramas with high ratings"

## LLM Context Tips

Some tool responses can exceed LLM context windows. A few patterns to keep in mind:

- **Credits** are limited to the top 20 cast + crew by default. Use `credits_limit` to adjust (e.g., `credits_limit: 5` for compact results, `credits_limit: 0` for unlimited). For filmography exploration, `discover` with `with_crew`/`with_cast` filters returns paginated results.
- **Watch providers** return all ~40 regions by default. Use the `region` parameter (e.g., `"US"`) to get a single country — keeps responses small.
- **Person combined credits** can be large for prolific filmmakers. `credits_limit` helps, or use `discover` with person ID filters for a paginated approach.
- **Wikidata awards** have a ~1-2 year lag. Very recent award wins may not appear in `get_film_awards` or `get_person_awards` results.

## ID Stability

TMDB person IDs are not guaranteed stable — TMDB occasionally merges or renumbers entries. Movie and TV IDs are more reliable but not immune. If you persist TMDB IDs (e.g., in a knowledge graph or database), consider storing IMDb IDs (`nm*`, `tt*`) as the canonical reference and resolving to TMDB at query time via `find_by_external_id`.

## API Rate Limits

TMDB API free tier: 50 requests per second. Consider caching for production use.

## Contributing

Contributions welcome! Please open an issue first for major changes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Film data from [The Movie Database (TMDB)](https://www.themoviedb.org/) — not endorsed or certified by TMDB
- Awards data from [Wikidata](https://www.wikidata.org/) (CC0)

## Links

- [MCP Documentation](https://modelcontextprotocol.io)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Claude Desktop](https://claude.ai/download)
