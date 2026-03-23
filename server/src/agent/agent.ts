import OpenAI from 'openai';
import { env } from '../config/env.js';
import { toolRegistry } from '../tools/registry.js';
import { planQuery } from './planner.js';
import { getContextMessages, addMessage } from './memory.js';
import type { ChatMessage, StreamEvent, AgentStep } from '../types/index.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are an AI version of Ashna Jain — a software engineer who builds full-stack products that solve real problems. You speak in first person as Ashna.

Personality:
- Friendly, warm, and genuine
- Confident but not arrogant
- Concise — you don't over-explain
- You mention specific details from your actual experience
- Light humor when appropriate

Rules:
- ALWAYS use the provided tools to look up information before answering. Do NOT make up details.
- If a tool returns no results, say you're not sure rather than fabricating an answer.
- When discussing projects or experience, cite specifics (company names, dates, metrics).
- For personal questions, be authentic and personable.
- If someone asks something you genuinely don't know about yourself, say so naturally.
- Keep responses conversational — this is iMessage, not a formal email.`;

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
): Promise<string> {
  const steps: AgentStep[] = [];
  const sources = new Set<string>();

  // Add user message to history
  addMessage(sessionId, {
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  });

  // Step 1: Plan
  const plan = await planQuery(userMessage);
  steps.push({ type: 'plan', content: plan, timestamp: Date.now() });
  onStream({ type: 'plan', data: plan });

  // Step 2-3: Tool calling loop with the LLM
  const contextMessages = getContextMessages(sessionId);

  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: iterations === 1 && tools.length > 0 ? 'auto' : undefined,
      stream: true,
    });

    let currentToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();
    let hasToolCalls = false;
    let streamedContent = '';

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      // Handle streamed content tokens
      if (delta?.content) {
        streamedContent += delta.content;
        onStream({ type: 'token', data: delta.content });
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        hasToolCalls = true;
        for (const tc of delta.tool_calls) {
          if (!currentToolCalls.has(tc.index)) {
            currentToolCalls.set(tc.index, {
              id: tc.id ?? '',
              name: tc.function?.name ?? '',
              args: '',
            });
          }
          const existing = currentToolCalls.get(tc.index)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
        }
      }

      if (finishReason === 'stop') {
        finalContent = streamedContent;
      }
    }

    // If no tool calls, we're done
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

      onStream({
        type: 'tool_call',
        data: { id: tc.id, name: tc.name, arguments: parsedArgs },
      });

      steps.push({
        type: 'tool_call',
        content: { name: tc.name, arguments: parsedArgs },
        timestamp: Date.now(),
      });

      // Execute the tool
      const result = await toolRegistry.execute(tc.name, parsedArgs);
      sources.add(result.source);

      onStream({
        type: 'tool_result',
        data: { name: tc.name, result },
      });

      steps.push({
        type: 'tool_result',
        content: { name: tc.name, result },
        timestamp: Date.now(),
      });

      // Add tool result to conversation
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

  // Save assistant response to memory
  addMessage(sessionId, {
    role: 'assistant',
    content: finalContent,
    timestamp: Date.now(),
  });

  onStream({ type: 'done', data: null });

  return finalContent;
}
