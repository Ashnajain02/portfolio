# Ashna Jain — Portfolio + AI Agent

A personal portfolio website styled as an interactive desktop environment, featuring an AI chatbot that answers questions using hybrid RAG retrieval, intelligent query routing, and live API tool calling — all streamed through a terminal interface.

**Live:** [about-ashna-jain.vercel.app](https://about-ashna-jain.vercel.app/)

---

## System Architecture

```
User types question in terminal UI
              |
              v
+====================================================================+
|                   Express Backend (TypeScript)                      |
|                                                                    |
|  1. HYBRID RAG RETRIEVAL (pre-fetched before LLM)                  |
|  +--------------------------------------------------------------+  |
|  |                                                              |  |
|  |  Embed query (text-embedding-3-small)                        |  |
|  |              |                                               |  |
|  |    +---------+---------+----------+                          |  |
|  |    |                   |          |                          |  |
|  |    v                   v          v                          |  |
|  |  Semantic           Keyword    Temporal                      |  |
|  |  Search             Search     Search                        |  |
|  |  (cosine sim        (JSONB     (ORDER BY                     |  |
|  |   on pgvector)      tag/content timestamp)                   |  |
|  |    |                ILIKE)         |                          |  |
|  |    |                   |          |                          |  |
|  |    +------- Reciprocal Rank Fusion --------+                 |  |
|  |             score = Σ(w / (k + rank))                        |  |
|  |                        |                                     |  |
|  |              Source diversity enforcement                    |  |
|  |              (round-robin across sources)                    |  |
|  |                        |                                     |  |
|  |              Top 5 → inject into system prompt               |  |
|  |              as "verified context" with sourceRef            |  |
|  +--------------------------------------------------------------+  |
|         |                                                          |
|         v                                                          |
|  2. QUERY PLANNER (GPT-4o-mini, ~$0.00006/call)                   |
|  +--------------------------------------------------------------+  |
|  |  Sees: user question + RAG results summary                   |  |
|  |  Decides:                                                    |  |
|  |    RAG sufficient → needsTools: false (skip tools entirely)  |  |
|  |    Need live data → select 1-3 tools from registry           |  |
|  |  Validates tool names against registry (drops hallucinated)  |  |
|  +--------------------------------------------------------------+  |
|         |                                                          |
|         v                                                          |
|  3. AGENT (GPT-4o, streaming)                                      |
|  +--------------------------------------------------------------+  |
|  |  System prompt:                                              |  |
|  |    persona + RAG context (with sourceRef) + rules            |  |
|  |  Tools:                                                      |  |
|  |    ONLY what planner selected (0-3), not all                 |  |
|  |                                                              |  |
|  |  The LLM can call multiple tools in one turn and             |  |
|  |  reason across all results (no dedicated correlation         |  |
|  |  tool needed — the LLM IS the reasoner)                      |  |
|  |                                                              |  |
|  |  Streams tokens via SSE as they generate                     |  |
|  +--------------------------------------------------------------+  |
|         |                                                          |
|  LIVE TOOLS (only when planner decides):                           |
|  +----------------------+  +--------------------+                  |
|  | searchJournal        |  | searchGithub       |                  |
|  | - aggregated stats   |  | - repo list        |                  |
|  | - mood trends        |  | - commits          |                  |
|  | - streaks, patterns  |  | - README content   |                  |
|  |                      |  |                    |                  |
|  | getJournalEntry      |  |                    |                  |
|  | - per-date mood      |  |                    |                  |
|  | - weather, song      |  |                    |                  |
|  +----------+-----------+  +----------+---------+                  |
|             |                          |                           |
|             v                          v                           |
|       Eternal Entries API        GitHub REST API                   |
|                                                                    |
|  +------------------+                                              |
|  | Session Memory   |  Chat history + context window management    |
|  +------------------+                                              |
+====================================================================+
        |
   SSE Stream (plan → tool calls → tokens → sources → done)
        |
        v
+====================================================================+
|                      Portfolio Frontend                             |
|                      React + Vite + Framer Motion                  |
|                                                                    |
|  Terminal Chat UI     Browser Widgets     Resume Viewer             |
|  (AI chatbot)         (live iframes)      (PDF-style)              |
|                                                                    |
|  Draggable windows, desktop icons, sticky notes, dock              |
+====================================================================+

DATA LAYER:
+====================================================================+
| Neon PostgreSQL + pgvector                                         |
| 85 content-aware document chunks with keyword metadata:            |
|   - 12 resume (experience, education, skills, awards)              |
|   - 57 newsletter (7 Beehiiv articles, chunked at 800 chars)      |
|   - 16 knowledge base (personal stories, philosophy)               |
|                                                                    |
| Each chunk includes:                                               |
|   - Vector embedding (1536d, text-embedding-3-small)               |
|   - Extracted keywords (top 8 per chunk)                           |
|   - Source reference (e.g., "Resume > Experience > TJX")           |
|   - Timestamp, tags, category                                      |
+====================================================================+
```

## How It Works

1. **User types a question** in the terminal-style chat interface
2. **Hybrid RAG retrieval** runs three parallel searches — semantic (embedding similarity), keyword (JSONB tag/content matching), and temporal (chronological ordering) — fused via Reciprocal Rank Fusion with source diversity enforcement
3. **Query Planner** (GPT-4o-mini) sees the RAG results and decides: RAG sufficient → no tools, or live data needed → selects 1-3 tools
4. **Agent** (GPT-4o) generates a response grounded in RAG context, calling live tools when selected. For cross-source questions, it calls multiple tools in one turn and reasons across all results
5. **Streaming** — tokens delivered via SSE with source attribution

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Vite |
| Backend | Express, TypeScript, Zod |
| LLM | GPT-4o (agent), GPT-4o-mini (query planner) |
| Embeddings | text-embedding-3-small (1536d) |
| Vector DB | Neon PostgreSQL + pgvector |
| Retrieval | Reciprocal Rank Fusion (semantic + keyword + temporal), source diversity |
| Deployment | Vercel (frontend), Railway (backend) |
| Data Sources | Resume, Beehiiv newsletter, Eternal Entries journal API, GitHub API |

## Tools

| Tool | What it does |
|------|-------------|
| `searchJournal` | Aggregated journaling stats (mood trends, streaks, time patterns, music, weather) |
| `getJournalEntry` | Per-date entry metadata (mood, weather, song, location, time) |
| `searchGithub` | GitHub profile, repo list, commits, or README content |

RAG search (resume, newsletter, knowledge base) is **pre-fetched before the LLM runs** — not a tool call. Cross-source reasoning is handled by the LLM calling multiple tools in one turn.

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
        ├── rag/             # Embeddings, pgvector store, hybrid retriever (RRF)
        ├── tools/           # Tool registry + live tool implementations
        ├── routes/          # SSE chat endpoint
        ├── utils/           # Shared utilities
        └── scripts/         # Vector store seed script
```

Built by Ashna Jain with Claude Code.
