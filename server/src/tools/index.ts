import { registerResumeTools } from './searchResume.js';
import { registerJournalTools } from './searchJournal.js';
import { registerGithubTools } from './searchGithub.js';
import { registerNewsletterTools } from './searchNewsletter.js';
import { registerKnowledgeTools } from './searchKnowledge.js';
import { registerCorrelationTools } from './correlateActivity.js';

/**
 * Registers all available tools with the tool registry.
 * Call this once at server startup.
 */
export function registerAllTools(): void {
  registerResumeTools();
  registerJournalTools();
  registerGithubTools();
  registerNewsletterTools();
  registerKnowledgeTools();
  registerCorrelationTools();
}
