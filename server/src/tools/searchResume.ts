import { toolRegistry } from './registry.js';
import { retrieve } from '../rag/retriever.js';
import type { ToolDefinition } from '../types/index.js';

const searchResume: ToolDefinition = {
  name: 'searchResume',
  description: [
    'Search Ashna Jain\'s resume and professional background.',
    'Use this for questions about work experience, education, skills,',
    'projects, awards, contact info, or career history.',
    'Returns relevant sections of the resume ranked by relevance.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query about resume content (e.g., "React experience", "education", "hackathon awards")',
      },
      category: {
        type: 'string',
        enum: ['experience', 'education', 'skills', 'project', 'award', 'personal', 'profile'],
        description: 'Optional: filter by resume section category',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const query = args.query as string;
    const category = args.category as string | undefined;

    const results = await retrieve(query, {
      sources: ['resume'],
      limit: 4,
      threshold: 0.2,
    });

    // Filter by category if specified
    const filtered = category
      ? results.filter(r => r.document.metadata.category === category)
      : results;

    // If category filter yields nothing, fall back to unfiltered
    const final = filtered.length > 0 ? filtered : results;

    return {
      success: true,
      data: final.map(r => ({
        content: r.document.content,
        category: r.document.metadata.category,
        title: r.document.metadata.title,
        score: Math.round(r.score * 100) / 100,
      })),
      source: 'resume',
    };
  },
};

export function registerResumeTools(): void {
  toolRegistry.register(searchResume);
}
