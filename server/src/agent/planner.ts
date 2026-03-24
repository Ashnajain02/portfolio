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
- Select 2-3 tools. When in doubt, include MORE tools — it's better to have extra context than miss information.
- ALWAYS include searchKnowledge for any question about Ashna personally, her projects, opinions, or background.
- For questions about specific projects (Echo, Twix, Shift Up, etc.), include searchKnowledge AND searchGithub AND searchResume.
- For hackathon/award questions, include searchResume AND searchKnowledge.
- For cross-source questions (coding + journaling), use correlateActivity.
- For "when did I last journal" + details, use searchJournal then getJournalEntry.
- For newsletter/AI topics, include searchNewsletter AND searchKnowledge.

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
