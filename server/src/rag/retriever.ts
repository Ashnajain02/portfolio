import { embedText } from './embeddings.js';
import { searchSimilar, searchByMetadata } from './vectorStore.js';
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

const TEMPORAL_NEWEST = /\b(most recent|latest|newest|last|current)\b/i;
const TEMPORAL_OLDEST = /\b(first|oldest|earliest|original)\b/i;

/**
 * Detects if the query has temporal intent and which source it targets.
 */
function detectTemporalIntent(query: string): { order: 'newest' | 'oldest'; source?: DataSource; category?: string } | null {
  const isNewest = TEMPORAL_NEWEST.test(query);
  const isOldest = TEMPORAL_OLDEST.test(query);
  if (!isNewest && !isOldest) return null;

  const order = isOldest ? 'oldest' : 'newest';
  const lower = query.toLowerCase();

  // Detect which source the temporal query targets
  if (lower.includes('newsletter') || lower.includes('article') || lower.includes('undercover')) {
    return { order, source: 'newsletter', category: 'article_summary' };
  }
  if (lower.includes('journal') || lower.includes('entry') || lower.includes('diary')) {
    return { order }; // Journal is live API, not embedded — no metadata search
  }

  // Generic temporal query — search across all summaries
  return { order };
}

/**
 * Hybrid retriever:
 * 1. Always runs semantic search (cosine similarity on embeddings)
 * 2. If temporal intent detected, also runs metadata search (SQL ORDER BY timestamp)
 * 3. Merges and deduplicates results, re-ranks with keyword/tag boosting
 */
export async function retrieve(
  query: string,
  options: RetrievalOptions = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.3, sources } = options;

  // Run semantic search
  const queryEmbedding = await embedText(query);
  const semanticResults = await searchSimilar(queryEmbedding, {
    limit: limit * 2,
    threshold,
    sources,
  });

  // Check for temporal intent and merge metadata results
  const temporal = detectTemporalIntent(query);
  let mergedResults = [...semanticResults];

  if (temporal) {
    const metadataResults = await searchByMetadata({
      source: temporal.source,
      category: temporal.category,
      orderBy: temporal.order,
      limit: 3,
    });

    // Merge: add metadata results that aren't already in semantic results
    const existingIds = new Set(semanticResults.map(r => r.document.id));
    for (const r of metadataResults) {
      if (!existingIds.has(r.document.id)) {
        mergedResults.push(r);
      }
    }
  }

  // Extract meaningful query terms (filter stop words)
  const queryTerms = query.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  // Re-rank with keyword and metadata boosting
  const reranked = mergedResults.map(result => {
    let boost = 0;
    const { metadata, content } = result.document;
    const lowerContent = content.toLowerCase();

    for (const term of queryTerms) {
      if (lowerContent.includes(term)) boost += 0.06;
    }

    if (metadata.tags && Array.isArray(metadata.tags)) {
      for (const tag of metadata.tags as string[]) {
        if (queryTerms.some(t => tag.toLowerCase().includes(t))) {
          boost += 0.1;
        }
      }
    }

    if (metadata.title && typeof metadata.title === 'string') {
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
