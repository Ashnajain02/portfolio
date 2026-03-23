import { toolRegistry } from './registry.js';
import { retrieve } from '../rag/retriever.js';
import type { ToolDefinition } from '../types/index.js';

const searchKnowledge: ToolDefinition = {
  name: 'searchKnowledge',
  description: [
    'Search Ashna\'s personal knowledge base for in-depth information about',
    'her philosophy, motivations, career goals, detailed project stories,',
    'personal facts, and opinions. Use this for deeper "why" questions,',
    'personality questions, or anything that goes beyond resume bullet points.',
    'Also searches across all embedded sources (resume, newsletter, knowledge base)',
    'for broad questions.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for (e.g., "why do you build products", "career goals", "vegan")',
      },
      searchAll: {
        type: 'boolean',
        description: 'If true, searches across ALL embedded sources (resume + newsletter + knowledge). Default false (knowledge only).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const query = args.query as string;
    const searchAll = args.searchAll as boolean;

    const results = await retrieve(query, {
      sources: searchAll ? undefined : ['general'],
      limit: 5,
      threshold: 0.2,
    });

    return {
      success: true,
      data: results.map(r => ({
        content: r.document.content,
        source: r.document.source,
        title: r.document.metadata.title,
        score: Math.round(r.score * 100) / 100,
      })),
      source: 'general',
    };
  },
};

export function registerKnowledgeTools(): void {
  toolRegistry.register(searchKnowledge);
}
