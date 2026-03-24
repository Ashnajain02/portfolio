import { openai } from '../config/openai.js';
import { PLANNER_MODEL } from '../config/constants.js';
import type { AgentPlan } from '../types/index.js';

const PLANNER_PROMPT = `You are a query router for an AI assistant that represents Ashna Jain.
Analyze the user's question and select which tools to use.

Available tools:
- searchResume: Semantic search over resume (experience, skills, awards, education)
- searchJournal: Aggregated journaling stats (moods, streaks, music, weather, activity)
- getJournalEntry: Per-date journal entry metadata (mood, weather, song, location)
- searchGithub: GitHub profile, repos, commits, and README content for any repo
- searchNewsletter: Semantic search over "Undercover Agents" newsletter articles
- searchKnowledge: Personal knowledge base (philosophy, motivations, career goals, detailed stories)
- correlateActivity: Cross-reference GitHub commits with journal entries (overlapping days, mood on coding days, day-of-week patterns)

Rules:
- Select 1-3 tools that are most relevant. Don't select tools that won't help.
- For questions about specific projects (Echo, Twix, etc.), ALWAYS include both searchKnowledge AND searchGithub — knowledge has the personal story, GitHub has the technical details and README.
- For cross-source questions (coding + journaling), use correlateActivity.
- For "when did I last journal" + details, use searchJournal then getJournalEntry.
- For personal/philosophical questions, use searchKnowledge.

Respond with JSON only:
{
  "tools": ["tool1", "tool2"],
  "reasoning": "brief explanation"
}`;

export async function planQuery(userMessage: string): Promise<AgentPlan> {
  try {
    const response = await openai.chat.completions.create({
      model: PLANNER_MODEL,
      messages: [
        { role: 'system', content: PLANNER_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return defaultPlan();

    const parsed = JSON.parse(content);
    return {
      tools: Array.isArray(parsed.tools) && parsed.tools.length > 0 ? parsed.tools : defaultPlan().tools,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch {
    return defaultPlan();
  }
}

function defaultPlan(): AgentPlan {
  return {
    tools: ['searchResume', 'searchKnowledge'],
    reasoning: 'Default: search resume and knowledge base',
  };
}
