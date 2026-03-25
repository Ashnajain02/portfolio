import { openai } from '../config/openai.js';
import { EMBEDDING_MODEL } from '../config/constants.js';

// LRU-style embedding cache — avoids re-embedding identical queries
const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const CACHE_MAX = 50;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedEmbedding(text: string): number[] | null {
  const entry = embeddingCache.get(text);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.embedding;
  if (entry) embeddingCache.delete(text);
  return null;
}

function cacheEmbedding(text: string, embedding: number[]): void {
  if (embeddingCache.size >= CACHE_MAX) {
    const oldest = embeddingCache.keys().next().value;
    if (oldest) embeddingCache.delete(oldest);
  }
  embeddingCache.set(text, { embedding, timestamp: Date.now() });
}

/**
 * Generates an embedding vector for a single text string.
 * Uses an in-memory cache to avoid redundant API calls.
 */
export async function embedText(text: string): Promise<number[]> {
  const cleaned = text.replace(/\n/g, ' ').trim();
  if (!cleaned) throw new Error('Cannot embed empty text');

  const cached = getCachedEmbedding(cleaned);
  if (cached) return cached;

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
  });

  if (!response.data[0]) throw new Error('No embedding returned');
  const embedding = response.data[0].embedding;
  cacheEmbedding(cleaned, embedding);
  return embedding;
}

/**
 * Generates embeddings for multiple texts in a single API call.
 * Used by the seed script — no caching needed for bulk operations.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const BATCH_SIZE = 2048;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map(t => t.replace(/\n/g, ' ').trim());
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));
  }

  return results;
}
