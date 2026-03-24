import { openai } from '../config/openai.js';
import { PLANNER_MODEL } from '../config/constants.js';
import { toolRegistry } from '../tools/registry.js';
import type { AgentPlan } from '../types/index.js';

/**
 * The planner sees the user question + RAG results summary and decides:
 * 1. Whether RAG alone is sufficient to answer
 * 2. Which live tools (if any) are needed
 */
const PLANNER_PROMPT = `You are a query router. Given a user question and any retrieved context, decide if live tools are needed.

Tools:
- searchJournal: Live journal stats — streaks, mood trends, entry counts, favorite time/day, music, weather patterns, last entry date
- getJournalEntry: Specific date's journal entry — mood, weather, song, location, time
- searchGithub: GitHub profile, repo list, commits, or README content
- correlateActivity: Cross-reference GitHub commits with journal entries

Decision rules:
1. If retrieved context fully answers the question → needsTools: false.
2. If retrieved context is empty or insufficient → needsTools: true.
3. Live/temporal words ("now", "currently", "recently", "latest", "last") → needsTools: true.
4. ANY question about journaling habits, mood, streaks, music, weather, time patterns → searchJournal (this is live data, not in RAG).
5. Project detail questions ("how does X work", "what features") → searchGithub (README).
6. Cross-source patterns ("journal + code", "mood when coding") → correlateActivity.
7. Select only the tools truly needed, at most 3.

Respond with JSON only:
{ "needsTools": true/false, "tools": ["toolName"], "reasoning": "one sentence" }`;

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

    // Validate tool names against registry — drop any hallucinated names
    const validTools = toolRegistry.getOpenAITools().map(t => t.function.name);
    const requestedTools = needsTools && Array.isArray(parsed.tools)
      ? parsed.tools.filter((t: string) => validTools.includes(t))
      : [];

    return {
      tools: requestedTools,
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
