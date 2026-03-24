import { openai } from '../config/openai.js';
import { PLANNER_MODEL } from '../config/constants.js';
import type { AgentPlan } from '../types/index.js';

/**
 * The planner sees the user question + RAG results summary and decides:
 * 1. Whether RAG alone is sufficient to answer
 * 2. Which live tools (if any) are needed
 */
const PLANNER_PROMPT = `You are a query router. Given a user question and retrieved context, decide what additional data is needed.

Available LIVE tools (only select these if the retrieved context is NOT sufficient):
- searchJournal: Fetch aggregated journaling stats (mood trends, streaks, activity counts, last entry date)
- getJournalEntry: Fetch journal entry details for a specific date (mood, weather, song, location)
- searchGithub: Fetch GitHub profile, repos, commits, or README content
- correlateActivity: Cross-reference GitHub commits with journal entries (overlapping days, mood on coding days)

Rules:
- If the retrieved context already answers the question fully, set needsTools to false.
- If the question asks about LIVE/current data (journal stats, GitHub repos, recent activity), set needsTools to true.
- Select at most 2 tools. Only select what's truly needed.
- For "when did I last journal" → searchJournal + getJournalEntry
- For "what repos do I have" → searchGithub
- For cross-source (coding + journaling patterns) → correlateActivity
- For questions about personal background, projects, experience, newsletter → usually RAG is enough.

Respond with JSON only:
{
  "needsTools": true/false,
  "tools": ["tool1"],
  "reasoning": "brief explanation"
}`;

export async function planQuery(
  userMessage: string,
  ragSummary: string,
): Promise<AgentPlan> {
  try {
    const response = await openai.chat.completions.create({
      model: PLANNER_MODEL,
      messages: [
        { role: 'system', content: PLANNER_PROMPT },
        { role: 'user', content: `Question: ${userMessage}\n\nRetrieved context:\n${ragSummary || '(no relevant documents found)'}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return defaultPlan();

    const parsed = JSON.parse(content);
    const needsTools = parsed.needsTools === true;
    return {
      tools: needsTools && Array.isArray(parsed.tools) ? parsed.tools : [],
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch {
    return defaultPlan();
  }
}

function defaultPlan(): AgentPlan {
  return {
    tools: [],
    reasoning: 'Default: use RAG context only',
  };
}
