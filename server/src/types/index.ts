// ============================================================
// Unified data document — all data sources normalize to this
// ============================================================
export interface DataDocument {
  id: string;
  source: DataSource;
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  timestamp?: string;
  tags?: string[];
  category?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

export type DataSource = 'resume' | 'journal' | 'github' | 'newsletter' | 'general';

// ============================================================
// Chat types
// ============================================================
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActiveAt: number;
}

// ============================================================
// Tool system types
// ============================================================
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  source: DataSource;
  error?: string;
}

// ============================================================
// Agent types
// ============================================================
export interface AgentPlan {
  tools: string[];
  reasoning: string;
}

// ============================================================
// Streaming types
// ============================================================
export type StreamEvent =
  | { type: 'session'; data: string }
  | { type: 'plan'; data: AgentPlan }
  | { type: 'tool_call'; data: ToolCall }
  | { type: 'tool_result'; data: { name: string; result: ToolResult } }
  | { type: 'token'; data: string }
  | { type: 'sources'; data: string[] }
  | { type: 'done'; data: null }
  | { type: 'error'; data: string };

// ============================================================
// Vector store types
// ============================================================
export interface SearchResult {
  document: DataDocument;
  score: number;
}
