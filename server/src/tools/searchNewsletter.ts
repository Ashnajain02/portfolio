import { toolRegistry } from './registry.js';
import { retrieve } from '../rag/retriever.js';
import type { ToolDefinition } from '../types/index.js';

const searchNewsletter: ToolDefinition = {
  name: 'searchNewsletter',
  description: [
    'Semantic search across Ashna\'s "Undercover Agents" newsletter articles.',
    'The newsletter covers innovative AI tools, agents, and trends.',
    'Use this for questions about her writing, AI opinions, specific articles,',
    'AI tools she\'s covered, or her thoughts on AI trends.',
    'Returns the most relevant passages from her published articles.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for across newsletter articles (e.g., "AI agents for healthcare", "automation tools")',
      },
      limit: {
        type: 'number',
        description: 'Max results to return (default 4)',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const query = args.query as string;
    const limit = (args.limit as number) || 4;

    const results = await retrieve(query, {
      sources: ['newsletter'],
      limit,
      threshold: 0.2,
    });

    return {
      success: true,
      data: results.map(r => ({
        content: r.document.content,
        title: r.document.metadata.title,
        url: r.document.metadata.url,
        score: Math.round(r.score * 100) / 100,
      })),
      source: 'newsletter',
    };
  },
};

export function registerNewsletterTools(): void {
  toolRegistry.register(searchNewsletter);
}
