import OpenAI from 'openai';
import { env } from '../config/env.js';
import { toolRegistry } from '../tools/registry.js';
import type { AgentPlan, QueryComplexity } from '../types/index.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const PLANNER_PROMPT = `You are a query router for an AI assistant that represents Ashna Jain.
Your job is to analyze the user's question and decide the best strategy to answer it.

Available tools: ${() => toolRegistry.listTools().join(', ')}

Classify the query:
- "simple": Can be answered with 1-2 tool calls + direct LLM response
- "complex": Requires multi-step reasoning, cross-referencing multiple sources, or computation

Respond with JSON only:
{
  "complexity": "simple" | "complex",
  "reasoning": "brief explanation of why",
  "tools": ["tool1", "tool2"],
  "strategy": "brief plan of how to answer"
}`;

/**
 * Analyzes a user query and produces an execution plan.
 * The plan determines which tools to call and in what order.
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
      return defaultPlan(userMessage);
    }

    const parsed = JSON.parse(content);
    return {
      complexity: parsed.complexity as QueryComplexity,
      reasoning: parsed.reasoning ?? '',
      tools: Array.isArray(parsed.tools) ? parsed.tools : ['searchResume'],
      strategy: parsed.strategy ?? '',
    };
  } catch {
    return defaultPlan(userMessage);
  }
}

function defaultPlan(query: string): AgentPlan {
  return {
    complexity: 'simple',
    reasoning: 'Defaulting to simple retrieval',
    tools: ['searchResume'],
    strategy: 'Search resume for relevant information and respond',
  };
}
