import { registerResumeTools } from './searchResume.js';
import { registerJournalTools } from './searchJournal.js';
import { registerGithubTools } from './searchGithub.js';

/**
 * Registers all available tools with the tool registry.
 * Call this once at server startup.
 */
export function registerAllTools(): void {
  registerResumeTools();
  registerJournalTools();
  registerGithubTools();
}
