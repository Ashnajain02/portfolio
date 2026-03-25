import type OpenAI from 'openai';
import { openai } from '../config/openai.js';
import { AGENT_MODEL, MAX_TOOL_ITERATIONS } from '../config/constants.js';
import { toolRegistry } from '../tools/registry.js';
import { planQuery } from './planner.js';
import { retrieve } from '../rag/retriever.js';
import { getContextMessages, addMessage } from './memory.js';
import type { StreamEvent } from '../types/index.js';

// Minimum score AFTER RRF fusion — applied to final merged results, not individual signals
const MIN_FINAL_SCORE = 0.005;

function getSystemPrompt(timezone?: string, ragContext?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();
  const localDate = now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' });
  const localTime = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });

  const contextBlock = ragContext
    ? `\n\nRetrieved context (use this to answer — these are verified facts):\n${ragContext}`
    : '\n\nNo relevant context was found in the knowledge base.';

  return `You are Ashna Jain — a software engineer who builds full-stack products. Speak in first person.

Current date/time: ${localDate}, ${localTime} (${tz}).
${contextBlock}

You are a portfolio chatbot ONLY — not a general assistant. If asked to help with code, homework, or anything not about Ashna, say "I can only answer questions about Ashna and her work."

Response style — this is a terminal UI:
- 2-4 sentences max. No bullet lists unless asked.
- Lead with the answer. Be warm but concise.
- When mentioning projects, include their URLs if available in context.

Rules:
- ONLY state things explicitly present in the context or tool results. Never infer or assume.
- Each context item has a relevance tag (high/medium/low). Only trust "high" relevance items as direct answers. "Low" relevance means the context is loosely related — do NOT use it to answer the question, say "I don't have that info" instead.
- If asked for opinions on external topics (companies, politics, news), say "I don't have a take on that" — you are Ashna's portfolio chatbot, not a general assistant.
- GitHub data only covers recent commits (last few weeks). Journal data covers the last 3 months. If asked about older dates, say "that's outside my data window."
- If a tool returns empty results for a date, say so honestly.
- If tools are available and the context is insufficient, call them.
- When asked about "most recent" or "latest", use dates in the context to determine order.
- Convert UTC timestamps to ${tz}.
- Accept corrections gracefully.`;
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
  });

  // Build RAG context string for the system prompt
  const ragContext = ragResults.length > 0
    ? ragResults.map((r, i) => {
        const meta = r.document.metadata;
        const ref = meta.sourceRef ? ` | ${meta.sourceRef}` : '';
        const date = meta.timestamp ? ` | ${meta.timestamp.toString().slice(0, 10)}` : '';
        const relevance = r.score >= 0.015 ? 'high' : r.score >= 0.008 ? 'medium' : 'low';
        return `[${i + 1}] (${r.document.source}${ref}${date} | relevance: ${relevance})\n${r.document.content}`;
      }).join('\n\n')
    : '';

  // Attribute sources from RAG results that made it through fusion
  for (const r of ragResults.slice(0, 2)) {
    if (r.score >= MIN_FINAL_SCORE) sources.add(r.document.source);
  }

  // Step 2: Decide if planner is needed
  // Skip planner (saves ~500-1000ms) when RAG is confident and no live-data signals
  const LIVE_DATA_PATTERN = /\b(journal|mood|streak|weather|song|commit|github|repo|readme|code|coding|push|last time|this week|this month|currently|recently|latest)\b/i;
  const hasHighConfidenceRAG = ragResults.length > 0 && ragResults[0].score >= 0.012;
  const needsLiveData = LIVE_DATA_PATTERN.test(userMessage);

  let tools: ReturnType<typeof toolRegistry.getOpenAITools> = [];

  if (hasHighConfidenceRAG && !needsLiveData) {
    onStream({ type: 'plan', data: { tools: [], reasoning: 'RAG confident, skipping planner' } });
  } else {
    const ragSummary = ragResults.length > 0
      ? ragResults.map(r => `[${r.document.source}] ${r.document.content.slice(0, 150)}`).join('\n')
      : '';
    const plan = await planQuery(userMessage, ragSummary);
    onStream({ type: 'plan', data: plan });

    if (plan.tools.length > 0) {
      const allTools = toolRegistry.getOpenAITools();
      tools = allTools.filter(t => plan.tools.includes(t.function.name));
    }
  }

  // Step 3: Build LLM messages with RAG baked into system prompt
  const contextMessages = getContextMessages(sessionId);

  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt(timezone, ragContext) },
    ...contextMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

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
