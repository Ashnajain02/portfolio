import { registerResumeTools } from './searchResume.js';
import { registerJournalTools } from './searchJournal.js';
import { registerGithubTools } from './searchGithub.js';
import { registerAnalysisTools } from './executeAnalysis.js';
import { registerNewsletterTools } from './searchNewsletter.js';
import { registerKnowledgeTools } from './searchKnowledge.js';

/**
 * Registers all available tools with the tool registry.
 * Call this once at server startup.
 */
export function registerAllTools(): void {
  registerResumeTools();
  registerJournalTools();
  registerGithubTools();
  registerAnalysisTools();
  registerNewsletterTools();
  registerKnowledgeTools();
}
