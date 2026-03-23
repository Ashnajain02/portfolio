import { embedText } from './embeddings.js';
import { searchSimilar } from './vectorStore.js';
import type { DataSource, SearchResult } from '../types/index.js';

export interface RetrievalOptions {
  limit?: number;
  threshold?: number;
  sources?: DataSource[];
}

/**
 * Hybrid retriever: embeds the query and performs semantic search,
 * then re-ranks results by combining vector similarity with metadata relevance.
 */
export async function retrieve(
  query: string,
  options: RetrievalOptions = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.25, sources } = options;

  const queryEmbedding = await embedText(query);

  const results = await searchSimilar(queryEmbedding, {
    limit: limit * 2, // Over-fetch for re-ranking
    threshold,
    sources,
  });

  // Re-rank: boost documents whose metadata tags or title match query terms
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const reranked = results.map(result => {
    let boost = 0;
    const { metadata, content } = result.document;
    const lowerContent = content.toLowerCase();

    // Boost if query terms appear in content
    for (const term of queryTerms) {
      if (lowerContent.includes(term)) boost += 0.03;
    }

    // Boost if tags match
    if (metadata.tags) {
      for (const tag of metadata.tags) {
        if (queryTerms.some(t => tag.toLowerCase().includes(t))) {
          boost += 0.05;
        }
      }
    }

    // Boost if title matches
    if (metadata.title) {
      const lowerTitle = metadata.title.toLowerCase();
      for (const term of queryTerms) {
        if (lowerTitle.includes(term)) boost += 0.05;
      }
    }

    return {
      ...result,
      score: Math.min(result.score + boost, 1),
    };
  });

  // Sort by boosted score and take top N
  reranked.sort((a, b) => b.score - a.score);
  return reranked.slice(0, limit);
}
