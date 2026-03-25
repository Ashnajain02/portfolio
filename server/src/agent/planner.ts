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
- searchJournal: ALL live journal stats in one call (streaks, mood, music, weather, location, time patterns, entry counts)
- getJournalEntry: Specific date's journal entry (mood, weather, song, location, time)
- searchGithub: GitHub profile, repos, commits (per-repo or recent_activity across all repos), README content

Decision rules:
1. If retrieved context fully answers the question → needsTools: false.
2. If retrieved context is empty or insufficient → needsTools: true.
3. Live/temporal words ("now", "currently", "recently", "latest", "last") → needsTools: true.
4. Aggregate journal questions (overall mood trends, streaks, favorite time, general patterns) → searchJournal.
5. Per-entry journal questions ("last time I journaled", "weather last 3 entries", "what song on a specific day") → BOTH searchJournal (to find dates) AND getJournalEntry (to get details for those dates).
6. ANY question asking "what did I code/commit" → searchGithub.
7. Cross-source questions (coding + journaling patterns) → select BOTH searchGithub AND searchJournal.
8. Project detail questions ("how does X work") → searchGithub (README).
9. Follow-up questions asking for specifics → assume tools are needed.
10. Select only the tools truly needed, at most 3.

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
