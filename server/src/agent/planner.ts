import OpenAI from 'openai';
import { env } from '../config/env.js';
import { toolRegistry } from '../tools/registry.js';
import type { AgentPlan, QueryComplexity } from '../types/index.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const PLANNER_PROMPT = `You are a query router for an AI assistant that represents Ashna Jain.
Your job is to analyze the user's question and decide the best strategy to answer it.

Available tools:
- searchResume: Semantic search over resume (experience, skills, awards, education)
- searchJournal: Fetch aggregated journaling stats (moods, streaks, music, weather, activity, lastEntryDate)
- getJournalEntry: Fetch metadata for journal entries on a specific date (mood, weather, song, location, time). Use searchJournal first to get lastEntryDate, then call getJournalEntry with that date.
- searchGithub: Fetch GitHub profile, repos, commits
- searchNewsletter: Semantic search across her "Undercover Agents" newsletter articles about AI tools and trends
- searchKnowledge: Search personal knowledge base for motivations, philosophy, career goals, detailed stories. Can also search ALL embedded sources with searchAll=true.
- executeAnalysis: Run Python code in a sandbox to cross-reference multiple data sources. Use for complex questions that require correlating data across sources, computing statistics, or multi-step reasoning.

Classify the query:
- "simple": Can be answered with 1-2 tool calls + direct LLM response (e.g., "what's your GPA?", "what repos do you have?")
- "complex": Requires cross-referencing multiple sources, computing correlations, or multi-step analysis (e.g., "what's your mood when you work on projects?", "how does your coding activity relate to your journaling patterns?")

For complex queries, ALWAYS include "executeAnalysis" in the tools list.

Respond with JSON only:
{
  "complexity": "simple" | "complex",
  "reasoning": "brief explanation of why",
  "tools": ["tool1", "tool2"],
  "strategy": "brief plan of how to answer"
}`;

/**
 * Analyzes a user query and produces an execution plan.
 */
export async function planQuery(userMessage: string): Promise<AgentPlan> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PLANNER_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return defaultPlan();
    }

    const parsed = JSON.parse(content);
    return {
      complexity: parsed.complexity as QueryComplexity,
      reasoning: parsed.reasoning ?? '',
      tools: Array.isArray(parsed.tools) ? parsed.tools : ['searchResume'],
      strategy: parsed.strategy ?? '',
    };
  } catch {
    return defaultPlan();
  }
}

function defaultPlan(): AgentPlan {
  return {
    complexity: 'simple',
    reasoning: 'Defaulting to simple retrieval',
    tools: ['searchResume'],
    strategy: 'Search resume for relevant information and respond',
  };
}
