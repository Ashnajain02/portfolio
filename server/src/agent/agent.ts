import OpenAI from 'openai';
import { openai } from '../config/openai.js';
import { AGENT_MODEL, MAX_TOOL_ITERATIONS } from '../config/constants.js';
import { toolRegistry } from '../tools/registry.js';
import { planQuery } from './planner.js';
import { getContextMessages, addMessage } from './memory.js';
import type { StreamEvent } from '../types/index.js';

function getSystemPrompt(timezone?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();
  const localDate = now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' });
  const localTime = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });

  return `You are an AI version of Ashna Jain — a software engineer who builds full-stack products that solve real problems. You speak in first person as Ashna.

Today's date: ${localDate} (${localTime}). Viewer's timezone: ${tz}.
NEVER reference dates in the future. When displaying times, convert from UTC to the viewer's timezone (${tz}).
All timestamps from tools are in UTC — you MUST convert them before displaying.

Personality:
- Friendly, warm, and genuine
- Confident but not arrogant
- Concise — you don't over-explain
- You mention specific details from your actual experience
- Light humor when appropriate

Rules:
- ALWAYS use the provided tools to look up information before answering. Do NOT make up details.
- If a tool returns no results or the data doesn't contain the answer, say "I don't have that data right now" or "my stats API doesn't track that yet." NEVER fabricate dates, numbers, or facts.
- NEVER guess or infer information that isn't explicitly in the tool results. If the data says nothing about a topic, say so.
- When discussing projects or experience, cite specifics (company names, dates, metrics) ONLY from tool results.
- For personal questions, be authentic and personable.
- If someone asks something you genuinely don't know about yourself, say so naturally.
- Keep responses conversational — this is iMessage, not a formal email.`;
}

export type StreamCallback = (event: StreamEvent) => void;

/**
 * Main agent loop. Processes a user message through:
 * 1. Planning — decide query complexity and tools
 * 2. Tool execution — call tools as directed by the LLM
 * 3. Reflection — LLM processes tool results
 * 4. Answer — stream final response
 */
export async function runAgent(
  sessionId: string,
  userMessage: string,
  onStream: StreamCallback,
  timezone?: string,
): Promise<string> {
  const sources = new Set<string>();

  addMessage(sessionId, {
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  });

  // Step 1: Plan
  console.log('[agent] Planning query...');
  const plan = await planQuery(userMessage);
  console.log('[agent] Plan:', plan.complexity, plan.tools);
  onStream({ type: 'plan', data: plan });

  // Step 2-3: Tool calling loop with the LLM
  const contextMessages = getContextMessages(sessionId);

  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(timezone) },
    ...contextMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const tools = toolRegistry.getOpenAITools();
  let iterations = 0;
  let finalContent = '';

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    console.log(`[agent] Iteration ${iterations}, calling ${AGENT_MODEL} with ${tools.length} tools...`);
    const response = await openai.chat.completions.create({
      model: AGENT_MODEL,
      messages: openaiMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: iterations === 1 && tools.length > 0 ? 'auto' : undefined,
      stream: true,
    });

    const currentToolCalls = new Map<number, { id: string; name: string; args: string }>();
    let hasToolCalls = false;
    let streamedContent = '';

    try {
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          streamedContent += delta.content;
          onStream({ type: 'token', data: delta.content });
        }

        if (delta?.tool_calls) {
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            if (!currentToolCalls.has(tc.index)) {
              currentToolCalls.set(tc.index, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
            }
            const existing = currentToolCalls.get(tc.index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
          }
        }

        if (finishReason) {
          finalContent = streamedContent;
        }
      }
    } catch (streamErr) {
      console.error('[agent] Stream error:', streamErr);
      throw streamErr;
    }
    console.log(`[agent] Iteration ${iterations} complete, hasToolCalls: ${hasToolCalls}`);

    if (!hasToolCalls) {
      finalContent = streamedContent;
      break;
    }

    // Execute tool calls
    openaiMessages.push({
      role: 'assistant',
      content: null,
      tool_calls: Array.from(currentToolCalls.values()).map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.args },
      })),
    });

    for (const tc of currentToolCalls.values()) {
      let parsedArgs: Record<string, unknown>;
      try {
        parsedArgs = JSON.parse(tc.args);
      } catch {
        parsedArgs = {};
      }

      onStream({ type: 'tool_call', data: { id: tc.id, name: tc.name, arguments: parsedArgs } });

      const result = await toolRegistry.execute(tc.name, parsedArgs);
      sources.add(result.source);

      onStream({ type: 'tool_result', data: { name: tc.name, result } });

      openaiMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result.data),
      });
    }
  }

  const sourceList = Array.from(sources);
  if (sourceList.length > 0) {
    onStream({ type: 'sources', data: sourceList });
  }

  addMessage(sessionId, {
    role: 'assistant',
    content: finalContent,
    timestamp: Date.now(),
  });

  onStream({ type: 'done', data: null });
  return finalContent;
}
