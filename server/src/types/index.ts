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

export type DataSource = 'resume' | 'journal' | 'github' | 'drive' | 'newsletter' | 'general';

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
export type QueryComplexity = 'simple' | 'complex';

export interface AgentPlan {
  complexity: QueryComplexity;
  reasoning: string;
  tools: string[];
  strategy: string;
}

export interface AgentStep {
  type: 'plan' | 'tool_call' | 'tool_result' | 'reflection' | 'answer';
  content: unknown;
  timestamp: number;
}

export interface AgentContext {
  sessionId: string;
  messages: ChatMessage[];
  steps: AgentStep[];
  sources: Set<string>;
  plan?: AgentPlan;
}

// ============================================================
// Streaming types
// ============================================================
export type StreamEvent =
  | { type: 'plan'; data: AgentPlan }
  | { type: 'tool_call'; data: ToolCall }
  | { type: 'tool_result'; data: { name: string; result: ToolResult } }
  | { type: 'thinking'; data: string }
  | { type: 'token'; data: string }
  | { type: 'sources'; data: string[] }
  | { type: 'done'; data: null }
  | { type: 'error'; data: string };

// ============================================================
// Vector store types
// ============================================================
export interface EmbeddingRecord {
  id: string;
  source: DataSource;
  content: string;
  metadata: DocumentMetadata;
  embedding: number[];
}

export interface SearchResult {
  document: DataDocument;
  score: number;
}
