# Ashna Jain — Portfolio + AI Agent

A personal portfolio website styled as an interactive desktop environment, featuring an AI chatbot agent that can answer questions about me using multi-source retrieval, tool calling, and sandboxed code execution.

**Live:** [ashnajain.com](https://ashnajain.com) (frontend)

---

## System Architecture

```
                                    +------------------+
                                    |   Portfolio UI   |
                                    |  (React + Vite)  |
                                    |                  |
                                    |  Desktop Theme   |
                                    |  - Draggable     |
                                    |    windows       |
                                    |  - Browser       |
                                    |    widgets       |
                                    |  - iMessage      |
                                    |    chat UI       |
                                    +--------+---------+
                                             |
                                        SSE Stream
                                             |
                                             v
+------------------------------------------------------------------------------------+
|                            Express Backend (TypeScript)                             |
|                                                                                    |
|  +------------------+     +------------------+     +----------------------------+  |
|  |   Chat Route     |     |   Query Planner  |     |       Agent Loop           |  |
|  |   (SSE Stream)   +---->+   (GPT-4o-mini)  +---->+   Plan -> Tools -> Answer  |  |
|  |   POST /api/chat |     |   simple/complex |     |   (GPT-4o + streaming)     |  |
|  +------------------+     +------------------+     +-------------+--------------+  |
|                                                                  |                 |
|                                    +-----------------------------+                 |
|                                    |                                               |
|                                    v                                               |
|  +----------------------------------------------------------------------+          |
|  |                         Tool Registry                                |          |
|  |                                                                      |          |
|  |  +----------------+  +----------------+  +--------------------+      |          |
|  |  | searchResume   |  | searchNews-    |  | searchKnowledge    |      |          |
|  |  | (pgvector RAG) |  | letter (RAG)   |  | (pgvector RAG)     |      |          |
|  |  +-------+--------+  +-------+--------+  +---------+----------+      |          |
|  |          |                    |                     |                 |          |
|  |          +----------+---------+---------------------+                |          |
|  |                     |                                                |          |
|  |                     v                                                |          |
|  |           +---------+----------+                                     |          |
|  |           |    Neon pgvector   |   117 embedded documents            |          |
|  |           |    Vector Store    |   - 14 resume chunks                |          |
|  |           |                    |   - 89 newsletter chunks            |          |
|  |           |   Hybrid Retrieval |   - 14 knowledge base entries       |          |
|  |           |   + Re-ranking     |                                     |          |
|  |           +--------------------+                                     |          |
|  |                                                                      |          |
|  |  +----------------+  +----------------+  +--------------------+      |          |
|  |  | searchJournal  |  | getJournal-    |  | searchGithub       |      |          |
|  |  | (Stats API)    |  | Entry (by date)|  | (GitHub API)       |      |          |
|  |  +-------+--------+  +-------+--------+  +---------+----------+      |          |
|  |          |                    |                     |                 |          |
|  |          v                    v                     v                 |          |
|  |  Eternal Entries     Eternal Entries       GitHub REST API            |          |
|  |  /journal-stats      /journal-info         /users/repos/commits      |          |
|  |                                                                      |          |
|  |  +------------------------------------------------------------+     |          |
|  |  | executeAnalysis (E2B Sandbox)                               |     |          |
|  |  |                                                             |     |          |
|  |  |  LLM generates Python -> sandbox executes -> JSON result    |     |          |
|  |  |                                                             |     |          |
|  |  |  Helpers: get_github_commits(), get_journal_entries(),      |     |          |
|  |  |  get_mood_for_date(), correlate_activity(), group_by_day()  |     |          |
|  |  +------------------------------------------------------------+     |          |
|  +----------------------------------------------------------------------+          |
|                                                                                    |
|  +------------------+                                                              |
|  | Session Memory   |  Chat history, context window management,                    |
|  |                  |  truncation strategy, auto-cleanup                            |
|  +------------------+                                                              |
+------------------------------------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Vite |
| Backend | Express, TypeScript, Zod |
| LLM | OpenAI GPT-4o (agent), GPT-4o-mini (planner) |
| Embeddings | OpenAI text-embedding-3-small (1536d) |
| Vector DB | Neon PostgreSQL + pgvector |
| Sandbox | E2B Code Interpreter (Python) |
| Data Sources | Resume (static), Beehiiv API, Eternal Entries API, GitHub API |

## Agent Architecture

The chatbot implements a full agentic AI system:

1. **Query Planning** — GPT-4o-mini classifies queries as simple or complex and selects tools
2. **Tool Execution** — OpenAI function calling dispatches to registered tools
3. **RAG Pipeline** — Semantic search over 117 embedded documents with hybrid retrieval + re-ranking
4. **Sandbox Execution** — Complex cross-source queries generate Python code executed in E2B
5. **Streaming** — SSE delivers plan, tool calls, and tokens in real-time to the UI
6. **Memory** — Session-based chat history with context window management

### Tools

| Tool | Type | Source | Description |
|------|------|--------|-------------|
| `searchResume` | RAG | pgvector | Semantic search over resume |
| `searchNewsletter` | RAG | pgvector | Semantic search over newsletter articles |
| `searchKnowledge` | RAG | pgvector | Search personal knowledge base |
| `searchJournal` | Live API | Eternal Entries | Aggregated journaling statistics |
| `getJournalEntry` | Live API | Eternal Entries | Per-date entry metadata (mood, weather, song) |
| `searchGithub` | Live API | GitHub | Profile, repos, commits |
| `executeAnalysis` | Sandbox | E2B | Python code execution for cross-source analysis |

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
OPENAI_API_KEY=        # OpenAI API key
DATABASE_URL=          # Neon PostgreSQL connection string
E2B_API_KEY=           # E2B sandbox API key
JOURNAL_API_URL=       # Eternal Entries stats endpoint
JOURNAL_API_KEY=       # Eternal Entries API key
BEEHIIV_API_KEY=       # Beehiiv newsletter API key
BEEHIIV_PUBLICATION_ID= # Beehiiv publication ID
```

## Project Structure

```
/
├── src/                    # Frontend (React + Vite)
│   ├── components/
│   │   ├── ChatWidget.jsx  # iMessage-style AI chat
│   │   ├── Desktop.jsx     # Desktop environment
│   │   ├── BrowserWidget.jsx
│   │   ├── Terminal.jsx
│   │   └── ...
│   └── data/siteConfig.js  # Single source of truth for site content
│
└── server/                 # Backend (Express + TypeScript)
    └── src/
        ├── agent/          # Agent loop, planner, memory
        ├── data/           # Data connectors (resume, journal, github, newsletter, knowledge)
        ├── rag/            # Embeddings, vector store, hybrid retriever
        ├── sandbox/        # E2B code execution engine
        ├── tools/          # Tool registry + all tool implementations
        ├── routes/         # Express routes (chat SSE endpoint)
        └── scripts/        # Seed script for pgvector
```

Built by Ashna Jain with Claude Code.
