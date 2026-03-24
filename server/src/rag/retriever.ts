import { embedText } from './embeddings.js';
import { searchSimilar, searchByKeywords, searchByMetadata } from './vectorStore.js';
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

// Source detection patterns
const SOURCE_HINTS: Array<{ pattern: RegExp; source: DataSource; category?: string }> = [
  { pattern: /\b(newsletter|article|undercover|wrote|publish)/i, source: 'newsletter' },
  { pattern: /\b(resume|experience|work|job|company|tjx|elastiq|intern)/i, source: 'resume' },
  { pattern: /\b(vegan|jain|dog|chocolate|music|propinquity|hackathon|shift up|twix|echo)/i, source: 'general' },
];

/**
 * Extracts meaningful keywords from a query (removes stop words).
 */
function extractQueryTerms(query: string): string[] {
  return query.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Detects temporal intent in the query.
 */
function detectTemporalIntent(query: string): { order: 'newest' | 'oldest'; source?: DataSource; category?: string } | null {
  const isNewest = TEMPORAL_NEWEST.test(query);
  const isOldest = TEMPORAL_OLDEST.test(query);
  if (!isNewest && !isOldest) return null;

  const order = isOldest ? 'oldest' : 'newest';
  const lower = query.toLowerCase();

  if (lower.includes('newsletter') || lower.includes('article') || lower.includes('undercover')) {
    return { order, source: 'newsletter', category: 'article_summary' };
  }

  return { order };
}

/**
 * Detects if the query hints at a specific source.
 */
function detectSourceHint(query: string): DataSource | undefined {
  for (const hint of SOURCE_HINTS) {
    if (hint.pattern.test(query)) return hint.source;
  }
  return undefined;
}

/**
 * Reciprocal Rank Fusion — merges results from multiple search strategies.
 *
 * Given ranked lists from different signals (semantic, keyword, temporal),
 * each document gets a fusion score:
 *   score = Σ (weight / (k + rank_in_list))
 *
 * where k is a constant (60 is standard) that prevents top results from
 * dominating too heavily.
 */
function reciprocalRankFusion(
  rankedLists: Array<{ results: SearchResult[]; weight: number }>,
  k: number = 60,
): SearchResult[] {
  const scoreMap = new Map<string, { result: SearchResult; fusionScore: number }>();

  for (const { results, weight } of rankedLists) {
    for (let rank = 0; rank < results.length; rank++) {
      const doc = results[rank];
      const id = doc.document.id;
      const contribution = weight / (k + rank + 1);

      if (scoreMap.has(id)) {
        scoreMap.get(id)!.fusionScore += contribution;
      } else {
        scoreMap.set(id, { result: doc, fusionScore: contribution });
      }
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.fusionScore - a.fusionScore)
    .map(({ result, fusionScore }) => ({ ...result, score: fusionScore }));
}

/**
 * Ensures top results include diverse sources when possible.
 * If all top results are from one source, interleave results from other sources.
 */
function ensureSourceDiversity(results: SearchResult[], limit: number): SearchResult[] {
  if (results.length <= limit) return results;

  const selected: SearchResult[] = [];
  const seen = new Set<string>();
  const bySource = new Map<string, SearchResult[]>();

  for (const r of results) {
    const src = r.document.source;
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(r);
  }

  // Round-robin across sources, picking best from each
  const sources = Array.from(bySource.keys());
  let round = 0;

  while (selected.length < limit) {
    let added = false;
    for (const src of sources) {
      const pool = bySource.get(src)!;
      if (round < pool.length && !seen.has(pool[round].document.id)) {
        selected.push(pool[round]);
        seen.add(pool[round].document.id);
        added = true;
        if (selected.length >= limit) break;
      }
    }
    if (!added) break;
    round++;
  }

  // If we didn't fill the limit (few sources), fill from top-scored remaining
  if (selected.length < limit) {
    for (const r of results) {
      if (!seen.has(r.document.id)) {
        selected.push(r);
        seen.add(r.document.id);
        if (selected.length >= limit) break;
      }
    }
  }

  return selected;
}

/**
 * Hybrid retriever with Reciprocal Rank Fusion.
 *
 * Three parallel search signals:
 * 1. Semantic search — cosine similarity on embeddings (meaning)
 * 2. Keyword search — tag/content matching on extracted terms (precision)
 * 3. Temporal/metadata search — chronological ordering (recency)
 *
 * Results are fused via RRF, then diversity-enforced across sources.
 */
export async function retrieve(
  query: string,
  options: RetrievalOptions = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.3, sources } = options;
  const queryTerms = extractQueryTerms(query);
  const temporal = detectTemporalIntent(query);
  const sourceHint = detectSourceHint(query);

  // Run all search signals in parallel
  const [semanticResults, keywordResults, temporalResults] = await Promise.all([
    // 1. Semantic search
    embedText(query).then(embedding =>
      searchSimilar(embedding, { limit: limit * 2, threshold, sources })
    ),

    // 2. Keyword search (only if we have meaningful terms)
    queryTerms.length > 0
      ? searchByKeywords(queryTerms, { limit: limit * 2, sources })
      : Promise.resolve([]),

    // 3. Temporal/metadata search (only if temporal intent detected)
    temporal
      ? searchByMetadata({
          source: temporal.source,
          category: temporal.category,
          orderBy: temporal.order,
          limit: 3,
        })
      : Promise.resolve([]),
  ]);

  // Fuse results with weighted RRF
  // Semantic gets highest weight (meaning matters most)
  // Keywords get moderate weight (precision signal)
  // Temporal gets moderate weight (when relevant)
  const rankedLists: Array<{ results: SearchResult[]; weight: number }> = [
    { results: semanticResults, weight: 1.0 },
  ];

  if (keywordResults.length > 0) {
    rankedLists.push({ results: keywordResults, weight: 0.7 });
  }

  if (temporalResults.length > 0) {
    // Temporal results get highest weight when user explicitly asked for recency
    rankedLists.push({ results: temporalResults, weight: 1.5 });
  }

  const fused = reciprocalRankFusion(rankedLists);

  // If the query hints at a specific source, boost those results
  if (sourceHint) {
    for (const r of fused) {
      if (r.document.source === sourceHint) {
        r.score *= 1.3;
      }
    }
    fused.sort((a, b) => b.score - a.score);
  }

  // Enforce source diversity in final results
  return ensureSourceDiversity(fused, limit);
}
