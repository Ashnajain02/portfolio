# Ashna Jain — Portfolio + AI Agent

A personal portfolio website styled as an interactive desktop environment, featuring an AI chatbot that answers questions using hybrid RAG retrieval, intelligent query routing, and live API tool calling — all streamed through a terminal interface.

**Live:** [about-ashna-jain.vercel.app](https://about-ashna-jain.vercel.app/)

---

## System Architecture

```
User types question in terminal UI
                |
                v
+------------------------------------------------------------------+
|                    Express Backend (TypeScript)                   |
|                                                                  |
|  1. PRE-FETCH RAG (runs before LLM)                             |
|  +------------------------------------------------------------+ |
|  |                                                            | |
|  |  Embed query ──> Hybrid Search ──> Top 5 results           | |
|  |  (text-embedding-3-small)                                  | |
|  |                                                            | |
|  |  Semantic Search          Metadata Search                  | |
|  |  (cosine similarity      (SQL ORDER BY timestamp           | |
|  |   on pgvector)            for temporal queries)            | |
|  |        |                        |                          | |
|  |        +--- Merge + Dedupe -----+                          | |
|  |                   |                                        | |
|  |           Re-rank (keyword + tag boost,                    | |
|  |                    stop word filtering)                     | |
|  |                   |                                        | |
|  |           Inject into system prompt as                     | |
|  |           "verified context"                               | |
|  +------------------------------------------------------------+ |
|        |                                                        |
|        v                                                        |
|  2. QUERY PLANNER (GPT-4o-mini)                                 |
|  +------------------------------------------------------------+ |
|  |  Inputs: user question + RAG results summary               | |
|  |  Decision: Can RAG alone answer?                           | |
|  |    YES → no tools, 1 LLM call                             | |
|  |    NO  → select 1-3 live tools                             | |
|  +------------------------------------------------------------+ |
|        |                                                        |
|        v                                                        |
|  3. AGENT (GPT-4o, streaming)                                   |
|  +------------------------------------------------------------+ |
|  |  System prompt = persona + RAG context + rules             | |
|  |  Tools = ONLY what planner selected (or none)              | |
|  |                                                            | |
|  |  Tool loop: call tool → get result → call tool → ...      | |
|  |  Stream tokens via SSE as they generate                    | |
|  +------------------------------------------------------------+ |
|        |                                                        |
|        v                                                        |
|  LIVE TOOLS (only invoked when planner decides)                 |
|  +------------------+  +------------------+  +--------------+  |
|  | searchJournal    |  | searchGithub     |  | correlate-   |  |
|  | Aggregated stats |  | Repos, commits,  |  | Activity     |  |
|  |                  |  | READMEs          |  | GitHub x     |  |
|  | getJournalEntry  |  |                  |  | Journal      |  |
|  | Per-date mood,   |  |                  |  | date overlap |  |
|  | weather, song    |  |                  |  |              |  |
|  +--------+---------+  +--------+---------+  +------+-------+  |
|           |                      |                    |         |
|           v                      v                    v         |
|     Eternal Entries API    GitHub REST API     Both APIs        |
|                                                                  |
|  +------------------+                                            |
|  | Session Memory   |  Chat history + context window mgmt       |
|  +------------------+                                            |
+------------------------------------------------------------------+
        |
   SSE Stream (plan → tool calls → tokens → sources → done)
        |
        v
+------------------------------------------------------------------+
|                     Portfolio Frontend                            |
|                     React + Vite + Framer Motion                 |
|                                                                  |
|  Terminal Chat UI    Browser Widgets    Resume Viewer             |
|  (AI chatbot)        (live iframes)     (PDF-style)              |
|                                                                  |
|  Draggable windows, desktop icons, sticky notes, dock            |
+------------------------------------------------------------------+

DATA LAYER:
+------------------------------------------------------------------+
| Neon PostgreSQL + pgvector                                       |
| 121 embedded document chunks:                                    |
|   - 13 resume (experience, education, skills, awards)            |
|   - 89 newsletter (7 Beehiiv articles, chunked)                  |
|   - 19 knowledge base (personal stories, philosophy)             |
+------------------------------------------------------------------+
```

## How It Works

1. **User types a question** in the terminal-style chat interface
2. **Pre-fetch RAG** — query is embedded and searched against all 121 documents via hybrid retrieval (semantic + metadata). Results are injected into the system prompt as verified context
3. **Query Planner** (GPT-4o-mini) sees the RAG results and decides:
   - RAG sufficient → no tools needed, saves a round-trip
   - Live data needed → selects 1-3 specific tools
4. **Agent** (GPT-4o) generates a response grounded in RAG context, calling live tools only when the planner selected them
5. **Streaming** — tokens delivered via SSE with source attribution

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Vite |
| Backend | Express, TypeScript, Zod |
| LLM | GPT-4o (agent), GPT-4o-mini (query planner) |
| Embeddings | text-embedding-3-small (1536d) |
| Vector DB | Neon PostgreSQL + pgvector |
| Retrieval | Hybrid search (semantic + metadata), keyword re-ranking, stop word filtering |
| Deployment | Vercel (frontend), Railway (backend) |
| Data Sources | Resume, Beehiiv newsletter, Eternal Entries journal API, GitHub API |

## Tools

| Tool | Type | What it does |
|------|------|-------------|
| `searchJournal` | Live API | Aggregated journaling stats (mood trends, streaks, time patterns, music, weather) |
| `getJournalEntry` | Live API | Per-date entry metadata (mood, weather, song, location, time) |
| `searchGithub` | Live API | GitHub profile, repo list, commits, or README content |
| `correlateActivity` | Cross-source | Date-level correlation between GitHub commits and journal entries |

RAG search (resume, newsletter, knowledge base) is **pre-fetched before the LLM runs** — not a tool call.

## Running Locally

```bash
# Frontend
npm install && npm run dev

# Backend
cd server
cp .env.example .env  # Fill in API keys
npm install
npm run seed           # Embed data into pgvector
npm run dev            # Start on :3001
```

## Environment Variables

```
OPENAI_API_KEY=         # OpenAI API key
DATABASE_URL=           # Neon PostgreSQL connection string
GITHUB_TOKEN=           # GitHub personal access token (optional, increases rate limit)
JOURNAL_API_URL=        # Eternal Entries stats endpoint
JOURNAL_API_KEY=        # Eternal Entries API key
BEEHIIV_API_KEY=        # Beehiiv newsletter API key
BEEHIIV_PUBLICATION_ID= # Beehiiv publication ID
```

## Project Structure

```
/
├── src/                     # Frontend (React + Vite)
│   ├── components/
│   │   ├── Terminal.jsx     # AI chat with terminal UI + SSE streaming
│   │   ├── Desktop.jsx      # Desktop environment + icon management
│   │   ├── BrowserWidget.jsx # Embedded iframe browser
│   │   ├── ResumeViewer.jsx  # PDF-style resume viewer
│   │   └── ...
│   └── data/siteConfig.js   # Single source of truth for all site content
│
└── server/                  # Backend (Express + TypeScript)
    └── src/
        ├── agent/           # Agent loop, query planner, session memory
        ├── config/          # Environment, constants, OpenAI client singleton
        ├── data/            # Data connectors (resume, journal, github, newsletter, knowledge)
        ├── rag/             # Embeddings, pgvector store, hybrid retriever
        ├── tools/           # Tool registry + live tool implementations
        ├── routes/          # SSE chat endpoint
        ├── utils/           # Shared utilities
        └── scripts/         # Vector store seed script
```

Built by Ashna Jain with Claude Code.
