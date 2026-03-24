# Ashna Jain — Portfolio + AI Agent

A personal portfolio website styled as an interactive desktop environment, featuring an AI chatbot that answers questions using multi-source RAG, tool calling, and cross-source data correlation — all streamed through a terminal interface.

**Live:** [ashnajain.com](https://about-ashna-jain.vercel.app/)

---

## System Architecture

```
                                 +--------------------+
                                 |   Portfolio UI     |
                                 |   React + Vite     |
                                 |                    |
                                 |  Desktop with      |
                                 |  draggable windows |
                                 |  + Terminal Chat   |
                                 +---------+----------+
                                           |
                                      SSE Stream
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                        Express Backend (TypeScript)                             |
|                                                                                |
|  +--------------+     +---------------+     +----------------------------+     |
|  |  Chat Route  |     | Query Planner |     |       Agent Loop           |     |
|  |  POST /chat  +---->+ (GPT-4o-mini) +---->+  Plan -> Tools -> Answer   |     |
|  |  SSE stream  |     | Selects tools |     |  (GPT-4o + streaming)      |     |
|  +--------------+     +---------------+     +------------+---------------+     |
|                                                          |                     |
|                              +---------------------------+                     |
|                              |                                                 |
|                              v                                                 |
|  +------------------------------------------------------------------+          |
|  |                      Tool Registry                               |          |
|  |                                                                  |          |
|  |  RAG Tools (pgvector)          Live API Tools                    |          |
|  |  +----------------+           +------------------+               |          |
|  |  | searchResume   |           | searchJournal    |               |          |
|  |  | searchNews-    |           | getJournalEntry  |               |          |
|  |  |   letter       |           | searchGithub     |               |          |
|  |  | searchKnow-    |           +------------------+               |          |
|  |  |   ledge        |                                              |          |
|  |  +-------+--------+           Cross-Source Tool                  |          |
|  |          |                    +------------------+               |          |
|  |          v                    | correlate-       |               |          |
|  |  +-------+--------+          |   Activity       |               |          |
|  |  | Neon pgvector  |          | GitHub x Journal |               |          |
|  |  | 123 documents  |          | date correlation |               |          |
|  |  | Hybrid search  |          +------------------+               |          |
|  |  | + re-ranking   |                                              |          |
|  |  +----------------+                                              |          |
|  +------------------------------------------------------------------+          |
|                                                                                |
|  +------------------+                                                          |
|  | Session Memory   |  Context window management + auto-cleanup                |
|  +------------------+                                                          |
+--------------------------------------------------------------------------------+
```

## How It Works

1. **User types a question** in the terminal-style chat interface
2. **Query Planner** (GPT-4o-mini) analyzes the question and selects 1-3 relevant tools — this filters which tools the main LLM sees, reducing token cost and improving accuracy
3. **Agent Loop** (GPT-4o) calls the selected tools via OpenAI function calling:
   - **RAG tools** embed the query and perform cosine similarity search over 123 documents in pgvector, with metadata-aware re-ranking
   - **API tools** fetch live data from Eternal Entries (journal) and GitHub
   - **Correlation tool** cross-references commit dates with journal entries for multi-source analysis
4. **Streaming response** — tokens are delivered via SSE as they're generated, with source attribution

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Framer Motion, Vite |
| Backend | Express, TypeScript, Zod |
| LLM | GPT-4o (agent), GPT-4o-mini (query planner) |
| Embeddings | text-embedding-3-small (1536d) |
| Vector DB | Neon PostgreSQL + pgvector |
| Data Sources | Resume, Beehiiv newsletter, Eternal Entries journal, GitHub API |

## Tools

| Tool | Type | What it does |
|------|------|-------------|
| `searchResume` | RAG | Semantic search over resume chunks (experience, education, skills, awards) |
| `searchNewsletter` | RAG | Semantic search over newsletter article chunks |
| `searchKnowledge` | RAG | Search personal knowledge base (philosophy, motivations, career goals) |
| `searchJournal` | Live API | Aggregated journaling stats (mood trends, streaks, music, weather) |
| `getJournalEntry` | Live API | Per-date entry metadata (mood, weather, song, location, time) |
| `searchGithub` | Live API | GitHub profile, repos, and recent commits |
| `correlateActivity` | Cross-source | Date-level correlation between GitHub commits and journal entries |

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
│   │   ├── Terminal.jsx     # AI chat with terminal UI
│   │   ├── Desktop.jsx      # Desktop environment + icon management
│   │   ├── BrowserWidget.jsx # Embedded iframe browser
│   │   ├── ResumeViewer.jsx  # PDF-style resume viewer
│   │   └── ...
│   └── data/siteConfig.js   # Single source of truth for all site content
│
└── server/                  # Backend (Express + TypeScript)
    └── src/
        ├── agent/           # Agent loop, query planner, session memory
        ├── config/          # Environment, constants, OpenAI client
        ├── data/            # Data connectors (resume, journal, github, newsletter, knowledge)
        ├── rag/             # Embeddings, pgvector store, hybrid retriever
        ├── tools/           # Tool registry + all tool implementations
        ├── routes/          # SSE chat endpoint
        ├── utils/           # Shared utilities
        └── scripts/         # Vector store seed script
```

Built by Ashna Jain with Claude Code.
