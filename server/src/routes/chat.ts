import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { runAgent } from '../agent/agent.js';
import { createSession, getSession } from '../agent/memory.js';
import { getErrorMessage } from '../utils/errors.js';
import type { StreamEvent } from '../types/index.js';

export const chatRouter = Router();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  timezone: z.string().optional(),
});

/**
 * POST /api/chat
 * Accepts a user message, runs the agent loop, and streams
 * events back via Server-Sent Events (SSE).
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten(),
    });
    return;
  }

  const { message, sessionId: requestedSessionId, timezone } = parsed.data;

  // Resolve or create session
  let session = requestedSessionId ? getSession(requestedSessionId) : undefined;
  if (!session) {
    session = createSession();
  }

  // Set up SSE — use setHeader instead of writeHead to preserve CORS headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Session-Id', session.id);
  res.flushHeaders();

  // Track client disconnect to avoid wasting resources
  let clientDisconnected = false;
  res.on('close', () => { clientDisconnected = true; });

  // Send session ID as first event
  sendEvent(res, { type: 'session', data: session.id });

  const onStream = (event: StreamEvent) => {
    if (clientDisconnected) return;
    sendEvent(res, event);
  };

  try {
    await runAgent(session.id, message, onStream, timezone);
  } catch (err) {
    if (clientDisconnected) return;
    const errorMsg = getErrorMessage(err);
    console.error('[chat] Agent error:', errorMsg);
    sendEvent(res, { type: 'error', data: errorMsg });
  } finally {
    res.end();
  }
});


function sendEvent(res: Response, event: { type: string; data: unknown }): void {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const written = res.write(payload);
  if (!written) {
    console.warn(`[sse] Back-pressure on event type: ${event.type}`);
  }
}
