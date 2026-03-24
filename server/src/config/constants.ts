/**
 * Centralized constants. Override via env where noted.
 */

// LLM models
export const AGENT_MODEL = process.env.AGENT_MODEL || 'gpt-4o';
export const PLANNER_MODEL = process.env.PLANNER_MODEL || 'gpt-4o-mini';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

// Agent limits
export const MAX_TOOL_ITERATIONS = 5;
export const MAX_CONTEXT_MESSAGES = 20;
export const MAX_TOKEN_ESTIMATE_CHARS = 24000; // ~6000 tokens * 4 chars/token

// Cache TTLs (ms)
export const CACHE_TTL_SHORT = 5 * 60 * 1000;   // 5 min — journal stats
export const CACHE_TTL_MEDIUM = 10 * 60 * 1000;  // 10 min — github data
export const MAX_CACHE_ENTRIES = 100;

// Sandbox
export const SANDBOX_TIMEOUT_MS = 30_000;

// Pagination safety
export const MAX_PAGINATION_PAGES = 20;

// GitHub
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'ashnajain02';
