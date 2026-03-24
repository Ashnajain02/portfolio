import { registerJournalTools } from './searchJournal.js';
import { registerGithubTools } from './searchGithub.js';
import { registerCorrelationTools } from './correlateActivity.js';

/**
 * Registers all LIVE tools with the tool registry.
 * RAG search is now pre-fetched in the agent loop — not a tool.
 */
export function registerAllTools(): void {
  registerJournalTools();
  registerGithubTools();
  registerCorrelationTools();
}
