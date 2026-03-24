import { registerJournalTools } from './searchJournal.js';
import { registerGithubTools } from './searchGithub.js';

/**
 * Registers all live tools with the tool registry.
 * RAG search is pre-fetched in the agent loop — not a tool.
 * Cross-source reasoning is handled by the LLM calling multiple tools.
 */
export function registerAllTools(): void {
  registerJournalTools();
  registerGithubTools();
}
