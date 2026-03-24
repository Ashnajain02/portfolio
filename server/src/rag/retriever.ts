import { embedText } from './embeddings.js';
import { searchSimilar } from './vectorStore.js';
import type { DataSource, SearchResult } from '../types/index.js';

interface RetrievalOptions {
  limit?: number;
  threshold?: number;
  sources?: DataSource[];
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'has',
  'have', 'was', 'were', 'been', 'be', 'are', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'its', 'his', 'her', 'my', 'your', 'our', 'their', 'this', 'that',
  'what', 'who', 'how', 'when', 'where', 'why', 'about', 'from',
  'you', 'me', 'she', 'he', 'they', 'we', 'it', 'tell', 'more',
]);

/**
 * Hybrid retriever: embeds the query, performs semantic search,
 * then re-ranks results with keyword and metadata boosting.
 */
export async function retrieve(
  query: string,
  options: RetrievalOptions = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.3, sources } = options;

  const queryEmbedding = await embedText(query);

  const results = await searchSimilar(queryEmbedding, {
    limit: limit * 2,
    threshold,
    sources,
  });

  // Extract meaningful query terms (filter stop words)
  const queryTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  const reranked = results.map(result => {
    let boost = 0;
    const { metadata, content } = result.document;
    const lowerContent = content.toLowerCase();

    // Keyword match in content (moderate boost)
    for (const term of queryTerms) {
      if (lowerContent.includes(term)) boost += 0.06;
    }

    // Tag match (strong signal — tags are curated)
    if (metadata.tags) {
      for (const tag of metadata.tags) {
        if (queryTerms.some(t => tag.toLowerCase().includes(t))) {
          boost += 0.1;
        }
      }
    }

    // Title match (strong signal)
    if (metadata.title) {
      const lowerTitle = metadata.title.toLowerCase();
      for (const term of queryTerms) {
        if (lowerTitle.includes(term)) boost += 0.1;
      }
    }

    return { ...result, score: Math.min(result.score + boost, 1) };
  });

  reranked.sort((a, b) => b.score - a.score);
  return reranked.slice(0, limit);
}
