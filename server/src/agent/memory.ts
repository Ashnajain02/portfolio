import type { ChatMessage, ChatSession } from '../types/index.js';
import { v4 as uuid } from 'uuid';
import { MAX_CONTEXT_MESSAGES, MAX_TOKEN_ESTIMATE_CHARS } from '../config/constants.js';

/**
 * In-memory session store. For production, swap with Redis or DB.
 */
const sessions = new Map<string, ChatSession>();

export function createSession(): ChatSession {
  const session: ChatSession = {
    id: uuid(),
    messages: [],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): ChatSession | undefined {
  return sessions.get(id);
}

export function addMessage(sessionId: string, message: ChatMessage): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.messages.push(message);
  session.lastActiveAt = Date.now();

  // Truncate if too many messages
  if (session.messages.length > MAX_CONTEXT_MESSAGES * 2) {
    truncateSession(session);
  }
}

/**
 * Returns the context-window-safe message history for the LLM.
 * Applies truncation strategy: keep system message + recent messages
 * that fit within the token budget.
 */
export function getContextMessages(sessionId: string): ChatMessage[] {
  const session = sessions.get(sessionId);
  if (!session) return [];

  const messages = session.messages;
  if (messages.length <= MAX_CONTEXT_MESSAGES) return [...messages];

  // Keep the most recent messages that fit within the token budget.
  // Build in reverse, then reverse once — O(n) instead of O(n²) unshift.
  const reversed: ChatMessage[] = [];
  let charCount = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgChars = messages[i].content.length;
    if (charCount + msgChars > MAX_TOKEN_ESTIMATE_CHARS && reversed.length > 2) break;
    reversed.push(messages[i]);
    charCount += msgChars;
  }

  reversed.reverse();
  return reversed;
}

function truncateSession(session: ChatSession): void {
  // Keep last N messages (discards oldest)
  const keep = MAX_CONTEXT_MESSAGES;
  if (session.messages.length > keep) {
    session.messages = session.messages.slice(-keep);
  }
}

/** Clean up stale sessions (older than 1 hour) */
export function cleanupSessions(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastActiveAt < oneHourAgo) {
      sessions.delete(id);
    }
  }
}
