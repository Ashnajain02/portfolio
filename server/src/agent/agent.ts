import OpenAI from 'openai';
import { openai } from '../config/openai.js';
import { AGENT_MODEL, MAX_TOOL_ITERATIONS } from '../config/constants.js';
import { toolRegistry } from '../tools/registry.js';
import { planQuery } from './planner.js';
import { retrieve } from '../rag/retriever.js';
import { getContextMessages, addMessage } from './memory.js';
import type { StreamEvent } from '../types/index.js';

const MIN_RAG_SCORE = 0.3;

function getSystemPrompt(timezone?: string, ragContext?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();
  const localDate = now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' });
  const localTime = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });

  const contextBlock = ragContext
    ? `\n\nRetrieved context (use this to answer — these are verified facts):\n${ragContext}`
    : '\n\nNo relevant context was found in the knowledge base.';

  return `You are an AI version of Ashna Jain — a software engineer who builds full-stack products that solve real problems. You speak in first person as Ashna.

Today's date: ${localDate} (${localTime}). Viewer's timezone: ${tz}.
When displaying times, convert from UTC to ${tz}.
${contextBlock}

Style:
- This is a TERMINAL. Keep responses SHORT — 2-4 sentences max.
- No long paragraphs. No bullet lists unless asked. No filler.
- Be direct and specific. Lead with the answer, not the context.
- Friendly but brief. Think text message, not essay.

STRICT Rules:
- Answer ONLY using the retrieved context above and/or tool results. These are your sources of truth.
- If neither context nor tools contain the answer, say "I don't have that info." NEVER fabricate or guess names, dates, numbers, places, or events.
- ONLY state facts that appear VERBATIM in context or tool results.
- If the user corrects you, acknowledge it — do not argue.
- NEVER reference dates in the future.`;
}

export type StreamCallback = (event: StreamEvent) => void;

/**
 * Main agent loop:
 * 1. Pre-fetch RAG — embed query, search all sources
 * 2. Plan — planner sees RAG results, decides if live tools needed
 * 3. LLM call — with RAG in system prompt + only selected tools
 * 4. Tool loop — if LLM calls tools, execute and loop
 * 5. Stream response
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

  // Step 1: Pre-fetch RAG — search ALL embedded sources
  const ragResults = await retrieve(userMessage, {
    limit: 5,
    threshold: 0.2,
  });

  // Filter to only quality results
  const qualityResults = ragResults.filter(r => r.score >= MIN_RAG_SCORE);

  // Build RAG context string for the system prompt
  const ragContext = qualityResults.length > 0
    ? qualityResults.map((r, i) =>
        `[${i + 1}] (${r.document.source}${r.document.metadata.title ? ': ' + r.document.metadata.title : ''}, score: ${r.score.toFixed(2)})\n${r.document.content}`
      ).join('\n\n')
    : '';

  // Track RAG sources
  for (const r of qualityResults) {
    sources.add(r.document.source);
  }

  // Build RAG summary for planner (shorter than full context)
  const ragSummary = qualityResults.length > 0
    ? qualityResults.map(r => `[${r.document.source}] ${r.document.content.slice(0, 150)}`).join('\n')
    : '';

  // Step 2: Plan — planner decides if tools are needed
  const plan = await planQuery(userMessage, ragSummary);
  onStream({ type: 'plan', data: plan });

  // Step 3: Build LLM messages with RAG baked into system prompt
  const contextMessages = getContextMessages(sessionId);

  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(timezone, ragContext) },
    ...contextMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Only include tools the planner selected (or none if RAG is sufficient)
  const allTools = toolRegistry.getOpenAITools();
  const tools = plan.tools.length > 0
    ? allTools.filter(t => plan.tools.includes(t.function.name))
    : [];

  // Step 4: LLM call with streaming + optional tool loop
  let iterations = 0;
  let finalContent = '';

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: AGENT_MODEL,
      messages: openaiMessages,
      tools: tools.length > 0 ? tools : undefined,
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

  // Stream sources
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
